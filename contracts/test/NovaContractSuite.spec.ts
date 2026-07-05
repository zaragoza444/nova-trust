import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const contractsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(contractsRoot, "..");

function readContract(contractPath: string) {
  return readFileSync(path.resolve(contractsRoot, "src", contractPath), "utf8");
}

describe("Nova contract suite design", () => {
  it("documents the core module list", () => {
    const modules = [
      "RoleManager",
      "IdentityRegistry",
      "ComplianceRegistry",
      "NovaSettlementToken",
      "WrappedNovaOneToken",
      "NovaAssetFactory",
      "NovaLiquidityPool",
      "TreasuryController",
      "AuditEvents"
    ];

    assert.equal(modules.length, 9);
  });

  it("keeps issued asset tokens compatible with liquidity pool routers", () => {
    const source = readContract("NovaAssetFactory.sol");

    assert.match(source, /mapping\(address => mapping\(address => uint256\)\) public allowance;/);
    assert.match(source, /function approve\(address spender, uint256 value\) external returns \(bool\)/);
    assert.match(source, /function transfer\(address to, uint256 value\) external returns \(bool\)/);
    assert.match(source, /function transferFrom\(address from, address to, uint256 value\) external returns \(bool\)/);
  });

  it("provides WNOVA for native Nova One liquidity pairs", () => {
    const source = readContract("WrappedNovaOneToken.sol");

    assert.match(source, /string public constant symbol = "WNOVA";/);
    assert.match(source, /receive\(\) external payable/);
    assert.match(source, /function deposit\(\) public payable/);
    assert.match(source, /function withdraw\(uint256 value\) external/);
  });

  it("supports approved liquidity venues without disabling compliance checks", () => {
    const source = readContract("ComplianceRegistry.sol");

    assert.match(source, /mapping\(address => bool\) public approvedLiquidityVenues;/);
    assert.match(source, /function setLiquidityVenue\(address venue, bool approved\) external onlyRole\(COMPLIANCE_ADMIN_ROLE\)/);
    assert.match(source, /senderIsLiquidityVenue/);
    assert.match(source, /receiverIsLiquidityVenue/);
  });

  it("includes a direct liquidity pool for M1FIAT/WNOVA swaps", () => {
    const source = readContract("NovaLiquidityPool.sol");

    assert.match(source, /function addLiquidity\(uint256 amount0, uint256 amount1, address recipient\) external returns \(uint256 shares\)/);
    assert.match(source, /function swapExactInput\(/);
    assert.match(source, /function quoteExactInput\(address tokenIn, uint256 amountIn\) external view returns \(uint256 amountOut\)/);
    assert.match(source, /amountIn \* 997/);
  });

  it("documents the production liquidity bootstrap script", () => {
    const source = readFileSync(path.resolve(contractsRoot, "scripts", "setup-production-liquidity.ts"), "utf8");

    assert.match(source, /NOVA_M1FIAT_SUPPLY/);
    assert.match(source, /NOVA_M1FIAT_LIQUIDITY/);
    assert.match(source, /NOVA_ACX_SUPPLY/);
    assert.match(source, /NOVA_SHIVA_SUPPLY/);
    assert.match(source, /NOVA_WNOVA_LIQUIDITY/);
    assert.match(source, /setLiquidityVenue\(liquidityPool\.record\.address, true\)/);
  });

  it("registers Chain 138 tradable tokens ACX, SHIVA, and M1FIAT", () => {
    const registry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "tokens", "chain138-tradable-tokens.v1.json"), "utf8")
    ) as {
      chain: { chainId: number };
      tokens: Array<{ symbol: string; capabilities: Record<string, boolean> }>;
    };

    assert.equal(registry.chain.chainId, 138);
    for (const symbol of ["M1FIAT", "ACX", "SHIVA"]) {
      const token = registry.tokens.find((item) => item.symbol === symbol);
      assert.ok(token, `missing ${symbol}`);
      assert.equal(token?.capabilities.transferable, true);
      assert.equal(token?.capabilities.tradable, true);
      assert.equal(token?.capabilities.swappable, true);
      assert.equal(token?.capabilities.zBankLoadable, true);
    }
  });

  it("documents Z Bank online fund loading for M1, ACX, and SHIVA", () => {
    const integration = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "integrations", "z-bank-online.v1.json"), "utf8")
    ) as {
      provider: { name: string };
      supportedTokens: string[];
    };

    assert.equal(integration.provider.name, "Z Bank Online");
    assert.deepEqual(integration.supportedTokens, ["M1FIAT", "ACX", "SHIVA"]);
    const integrationWithChains = integration as { supportedChains: Array<{ chainId: number }> };
    assert.ok(integrationWithChains.supportedChains.some((chain) => chain.chainId === 44002));
  });

  it("approves banks and trading platforms for Chain 138 tokens", () => {
    const registry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "compliance", "trading-platforms.v1.json"), "utf8")
    ) as {
      approvedTokens: string[];
      platforms: Array<{ supportedTokens: string[] }>;
    };

    assert.deepEqual(registry.approvedTokens, ["M1FIAT", "ACX", "SHIVA", "WNOVA", "WZ"]);
    assert.ok(registry.platforms.length >= 3);
    assert.ok(registry.platforms.every((platform) => platform.supportedTokens.length > 0));
  });

  it("provides WZ for native Z Blockchain liquidity pairs", () => {
    const source = readContract("WrappedZBlockChainToken.sol");

    assert.match(source, /string public constant symbol = "WZ";/);
    assert.match(source, /receive\(\) external payable/);
    assert.match(source, /function deposit\(\) public payable/);
  });

  it("registers the Z Blockchain production chart on chain 44002", () => {
    const chart = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "chains", "z-block-chain.v1.json"), "utf8")
    ) as {
      chain: { chainId: number; name: string; wrappedSymbol: string };
      liquidityPools: string[];
      capabilities: Record<string, boolean>;
    };

    assert.equal(chart.chain.chainId, 44002);
    assert.equal(chart.chain.name, "Z Blockchain");
    assert.equal(chart.chain.wrappedSymbol, "WZ");
    assert.deepEqual(chart.liquidityPools, ["M1FIAT/WZ", "ACX/WZ", "SHIVA/WZ"]);
    assert.equal(chart.capabilities.swappable, true);
    assert.equal(chart.capabilities.tradable, true);
    assert.equal(chart.capabilities.transferable, true);
  });

  it("documents Z Blockchain bootstrap scripts", () => {
    const source = readFileSync(path.resolve(contractsRoot, "scripts", "setup-z-block-chain-liquidity.ts"), "utf8");

    assert.match(source, /ZBC_RPC_URL/);
    assert.match(source, /WrappedZBlockChainToken/);
    assert.match(source, /NLP-M1FIAT-WZ/);
    assert.match(source, /setLiquidityVenue\(liquidityPool\.record\.address, true\)/);
  });

  it("documents NRW World bootstrap scripts on chain 33001", () => {
    const source = readFileSync(path.resolve(contractsRoot, "scripts", "setup-nrw-world-liquidity.ts"), "utf8");

    assert.match(source, /NRW_RPC_URL/);
    assert.match(source, /WrappedNRWWorldToken/);
    assert.match(source, /NLP-M1FIAT-WNRW/);
  });

  it("registers the canonical Chain 138 Safe contracts and deployed safes", () => {
    const registry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "compliance", "gnosis-safe-chain138-deployed.v1.json"), "utf8")
    ) as {
      chain: { chainId: number };
      safeAppBundle: Record<string, string>;
      deployedSafes: Array<{ name: string; address: string }>;
    };

    assert.equal(registry.chain.chainId, 138);
    assert.equal(registry.safeAppBundle.GnosisSafeProxyFactory, "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2");
    assert.equal(registry.safeAppBundle.GnosisSafeL2, "0x3E5c63644E683549055b9Be8653de26E0B4CD36E");
    assert.ok(registry.deployedSafes.some((safe) => safe.name === "OMNL Admin Safe"));
    assert.ok(registry.deployedSafes.some((safe) => safe.name === "OMNL Vault Recovery Safe"));
  });
});
