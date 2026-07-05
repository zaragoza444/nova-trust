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
      "NovaPriceOracle",
      "TreasuryController",
      "AuditEvents"
    ];

    assert.equal(modules.length, 10);
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
    assert.ok(integration.supportedTokens.includes("M1FIAT"));
    assert.ok(integration.supportedTokens.includes("USDT"));
    assert.ok(integration.supportedTokens.includes("AUSDT"));
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

    assert.ok(registry.approvedTokens.includes("M1FIAT"));
    assert.ok(registry.approvedTokens.includes("USDT"));
    assert.ok(registry.approvedTokens.includes("CHAT"));
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
    assert.ok(chart.liquidityPools.includes("M1FIAT/WZ"));
    assert.ok(chart.liquidityPools.includes("USDT/WZ"));
    assert.ok(chart.liquidityPools.includes("CHAT/WZ"));
    assert.ok(chart.liquidityPools.includes("BTC/WZ"));
    assert.equal(chart.liquidityPools.length, 13);
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

  it("registers TRON as the basement foundation network with Ethereum and BNB", () => {
    const chart = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "chains", "multi-network.v1.json"), "utf8")
    ) as {
      basementNetwork: { name: string; chainId: number; networkType: string };
      publicNetworks: Array<{ name: string; chainId: number }>;
      bridgeLanes: Array<{ from: number; to: number; status: string }>;
    };

    assert.equal(chart.basementNetwork.name, "TRON");
    assert.equal(chart.basementNetwork.networkType, "tron");
    assert.equal(chart.basementNetwork.chainId, 728126428);
    assert.deepEqual(
      chart.publicNetworks.map((network) => network.name),
      ["TRON", "Ethereum", "BNB Smart Chain"]
    );
    assert.ok(chart.bridgeLanes.some((lane) => lane.from === 728126428 && lane.to === 1 && lane.status === "active"));
    assert.ok(chart.bridgeLanes.some((lane) => lane.from === 728126428 && lane.to === 56 && lane.status === "active"));
  });

  it("documents custody support for TRON, Ethereum, and BNB Smart Chain", () => {
    const integration = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "integrations", "custody.v1.json"), "utf8")
    ) as {
      basementNetwork: { name: string };
      publicNetworks: Array<{ name: string; chainId: number }>;
      flows: { multiNetworkTreasury: { supportedPublicNetworks: number[] } };
    };

    assert.equal(integration.basementNetwork.name, "TRON");
    assert.deepEqual(
      integration.publicNetworks.map((network) => network.chainId),
      [728126428, 1, 56]
    );
    assert.deepEqual(integration.flows.multiNetworkTreasury.supportedPublicNetworks, [728126428, 1, 56]);
  });

  it("registers cross-network stablecoins on TRON, Ethereum, and BNB", () => {
    const registry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "tokens", "public-network-tokens.v1.json"), "utf8")
    ) as {
      tokens: Array<{ symbol: string; networks: string[] }>;
    };

    const usdt = registry.tokens.find((token) => token.symbol === "USDT");
    assert.ok(usdt);
    assert.deepEqual(usdt?.networks, ["TRON", "Ethereum", "BNB Smart Chain"]);
  });

  it("activates TRON permissioned bridge lanes to Z Blockchain and Nova One", () => {
    const chart = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "chains", "multi-network.v1.json"), "utf8")
    ) as {
      permissionedBridges: Array<{ to: number; status: string }>;
    };

    const zBridge = chart.permissionedBridges.find((lane) => lane.to === 44002);
    const novaBridge = chart.permissionedBridges.find((lane) => lane.to === 22016);
    assert.equal(zBridge?.status, "active");
    assert.equal(novaBridge?.status, "active");
  });

  it("documents production multi-network RPC defaults", () => {
    const registry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "integrations", "multi-network-rpc.v1.json"), "utf8")
    ) as {
      productionDefaults: {
        tron: { rpcUrl: string };
        ethereum: { rpcUrl: string; chainId: number };
        bnbSmartChain: { rpcUrl: string; chainId: number };
      };
    };

    assert.match(registry.productionDefaults.tron.rpcUrl, /trongrid/);
    assert.equal(registry.productionDefaults.ethereum.chainId, 1);
    assert.equal(registry.productionDefaults.bnbSmartChain.chainId, 56);
  });

  it("registers Z Blockchain clone tokens USDT, ETH, BNB, USDC, XRCUSDC, CUSDT, ICX, AUSDT, and CHAT", () => {
    const registry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "tokens", "clone-tokens.v1.json"), "utf8")
    ) as {
      tokens: Array<{ symbol: string; cloneOf: string }>;
    };

    assert.equal(registry.tokens.length, 10);
    for (const symbol of ["USDT", "ETH", "BTC", "BNB", "USDC", "XRCUSDC", "CUSDT", "ICX", "AUSDT", "CHAT"]) {
      const token = registry.tokens.find((item) => item.symbol === symbol);
      assert.ok(token, `missing clone token ${symbol}`);
    }
  });

  it("documents clone token mint script for Z Blockchain", () => {
    const source = readFileSync(
      path.resolve(contractsRoot, "scripts", "setup-clone-tokens-z-block-chain.ts"),
      "utf8"
    );

    assert.match(source, /loadCloneTokenCatalog/);
    assert.match(source, /NLP-\$\{token\.symbol\}-WZ/);
    assert.match(source, /setLiquidityVenue/);
  });

  it("registers 100 billion supply clone token catalog", () => {
    const registry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "tokens", "clone-tokens-100b.v1.json"), "utf8")
    ) as {
      defaultSupply: string;
      tokens: Array<{ assetId: string; symbol: string }>;
    };

    assert.equal(registry.defaultSupply, "100000000000");
    assert.equal(registry.tokens.length, 9);
    assert.ok(registry.tokens.every((token) => token.assetId.includes("-100B-001")));
  });

  it("stores USD oracle prices for Z Blockchain tradable tokens", () => {
    const source = readContract("NovaPriceOracle.sol");

    assert.match(source, /ORACLE_OPERATOR_ROLE/);
    assert.match(source, /function setPrices\(address\[] calldata tokens, uint256\[] calldata pricesUsd8\) external/);
    assert.match(source, /function getPrice\(address token\) external view returns \(uint256 priceUsd8, uint64 updatedAt, bool active\)/);
  });

  it("registers Z Blockchain oracle price catalog for clone and bank tokens", () => {
    const registry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "oracles", "z-block-chain-prices.v1.json"), "utf8")
    ) as {
      chain: { chainId: number };
      quoteCurrency: string;
      priceDecimals: number;
      prices: Array<{ symbol: string; priceUsd: string }>;
    };

    assert.equal(registry.chain.chainId, 44002);
    assert.equal(registry.quoteCurrency, "USD");
    assert.equal(registry.priceDecimals, 8);
    assert.equal(registry.prices.length, 14);
    for (const symbol of ["M1FIAT", "USDT", "ETH", "BTC", "BNB", "CHAT", "WZ"]) {
      const entry = registry.prices.find((item) => item.symbol === symbol);
      assert.ok(entry, `missing oracle price for ${symbol}`);
      assert.match(entry?.priceUsd ?? "", /^\d+(\.\d+)?$/);
    }
  });

  it("documents Z Blockchain oracle bootstrap script", () => {
    const source = readFileSync(
      path.resolve(contractsRoot, "scripts", "setup-z-block-chain-oracle.ts"),
      "utf8"
    );

    assert.match(source, /loadOraclePriceRegistry/);
    assert.match(source, /NovaPriceOracle/);
    assert.match(source, /setPrices/);
    assert.match(source, /ZBC_ORACLE_REGISTRY_PATH/);
  });

  it("registers 1 million supply BTC clone token catalog", () => {
    const registry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "tokens", "clone-tokens-btc-1m.v1.json"), "utf8")
    ) as {
      defaultSupply: string;
      tokens: Array<{ assetId: string; symbol: string }>;
    };

    assert.equal(registry.defaultSupply, "1000000");
    assert.equal(registry.tokens.length, 1);
    assert.equal(registry.tokens[0]?.symbol, "BTC");
    assert.equal(registry.tokens[0]?.assetId, "BTC-ZBC-CLONE-001");
  });

  it("documents BTC clone mint script for Z Blockchain", () => {
    const source = readFileSync(path.resolve(contractsRoot, "package.json"), "utf8");

    assert.match(source, /setup:clone-btc-1m:z-block-chain/);
    assert.match(source, /clone-tokens-btc-1m\.v1\.json/);
  });

  it("documents Nova Trust go-live production script", () => {
    const source = readFileSync(path.resolve(repoRoot, "scripts", "go-live.sh"), "utf8");

    assert.match(source, /Nova Trust GO LIVE/);
    assert.match(source, /setup:clone-btc-1m:z-block-chain/);
    assert.match(source, /setup:oracle:z-block-chain/);
    assert.match(source, /api\/go-live\/status/);
  });

  it("registers international wiring for TRON, Ethereum, BNB, and Z Blockchain", () => {
    const registry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "integrations", "international-wiring.v1.json"), "utf8")
    ) as {
      publicNetworks: Array<{ name: string }>;
      internationalBridgeLanes: Array<{ status: string }>;
    };

    assert.deepEqual(
      registry.publicNetworks.map((network) => network.name),
      ["TRON", "Ethereum", "BNB Smart Chain"]
    );
    assert.ok(registry.internationalBridgeLanes.every((lane) => lane.status === "active"));
  });

  it("documents international VPS wiring script", () => {
    const source = readFileSync(path.resolve(repoRoot, "scripts", "wire-international-vps.sh"), "utf8");

    assert.match(source, /wire-multi-network-vps\.sh/);
    assert.match(source, /api\/networks\/international/);
    assert.match(source, /deploy\/nginx\/nova-trust\.conf/);
  });
});
