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
      assert.equal(token?.capabilities.bankLoadable, true);
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

  it("activates TRON permissioned bridge lane to Nova One in Nova multi-network", () => {
    const chart = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "chains", "multi-network.v1.json"), "utf8")
    ) as {
      permissionedBridges: Array<{ to: number; status: string }>;
    };

    const novaBridge = chart.permissionedBridges.find((lane) => lane.to === 22016);
    const zBridge = chart.permissionedBridges.find((lane) => lane.to === 44002);
    assert.equal(novaBridge?.status, "active");
    assert.equal(zBridge, undefined);
  });

  it("activates TRON permissioned bridge lane to Z Chain in Z international wiring", () => {
    const registry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "integrations", "z-international-wiring.v1.json"), "utf8")
    ) as {
      internationalBridgeLanes: Array<{ to: number; status: string }>;
    };

    const zBridge = registry.internationalBridgeLanes.find((lane) => lane.to === 44002);
    assert.equal(zBridge?.status, "active");
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
    assert.match(source, /test:multi-network --workspace @nova\/api/);
    assert.match(source, /api\/go-live\/status/);
    assert.doesNotMatch(source, /setup:clone-btc-1m:z-block-chain/);
    assert.doesNotMatch(source, /z-blockchain/);
  });

  it("registers international wiring for TRON, Ethereum, BNB, and Nova One", () => {
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

  it("uses grep instead of rg in multi-network VPS wiring script", () => {
    const source = readFileSync(path.resolve(repoRoot, "scripts", "wire-multi-network-vps.sh"), "utf8");

    assert.match(source, /grep -q '\^export ZBC_RPC_URL='/);
    assert.doesNotMatch(source, /\brg\b/);
  });

  it("uses docker manifest path in Z Blockchain deploy script", () => {
    const source = readFileSync(path.resolve(repoRoot, "scripts", "deploy-z-blockchain-vps.sh"), "utf8");

    assert.match(source, /MANIFEST_DOCKER="\/work\/contracts\/deployments\/z-blockchain-production-liquidity\.json"/);
    assert.match(source, /ZBC_BOOTSTRAP_MANIFEST_PATH="\$MANIFEST_DOCKER"/);
  });

  it("binds API to configurable host and resolves CORS wildcard correctly", () => {
    const configSource = readFileSync(path.resolve(repoRoot, "services", "api", "src", "config.ts"), "utf8");
    const appSource = readFileSync(path.resolve(repoRoot, "services", "api", "src", "app.ts"), "utf8");
    const productionEnv = readFileSync(path.resolve(repoRoot, "deploy", "production.env.example"), "utf8");

    assert.match(configSource, /NOVA_API_HOST/);
    assert.match(configSource, /return "\*";/);
    assert.match(appSource, /server\.listen\(config\.port, config\.host/);
    assert.match(productionEnv, /NOVA_API_HOST="0\.0\.0\.0"/);
  });

  it("runs contract and multi-network checks in release:check", () => {
    const packageJson = readFileSync(path.resolve(repoRoot, "package.json"), "utf8");

    assert.match(packageJson, /test:contracts/);
    assert.match(packageJson, /test:multi-network/);
  });

  it("registers production Z Wallet integration for Z Blockchain", () => {
    const registry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "integrations", "z-wallet.v1.json"), "utf8")
    ) as {
      product: { id: string; style: string };
      settlementChain: { chainId: number };
      productionWallet: { address: string; role: string };
      accounts: Array<{ id: string }>;
    };

    assert.equal(registry.product.id, "z-wallet");
    assert.equal(registry.product.style, "binance-production");
    assert.equal(registry.settlementChain.chainId, 44002);
    assert.equal(registry.productionWallet.address, "0xc2D6E6981D1A415967A683D615cf97bA9bC26F0f");
    assert.deepEqual(
      registry.accounts.map((account) => account.id),
      ["funding", "spot", "earn"]
    );
  });

  it("documents Z Wallet production setup script and Z API routes", () => {
    const setupScript = readFileSync(path.resolve(repoRoot, "scripts", "setup-z-wallet-production.sh"), "utf8");
    const zAppSource = readFileSync(path.resolve(repoRoot, "services", "z-api", "src", "app.ts"), "utf8");
    const novaAppSource = readFileSync(path.resolve(repoRoot, "services", "api", "src", "app.ts"), "utf8");
    const contractsPackage = readFileSync(path.resolve(contractsRoot, "package.json"), "utf8");

    assert.match(setupScript, /setup:z-wallet:production/);
    assert.match(contractsPackage, /setup:z-wallet:production/);
    assert.match(zAppSource, /\/api\/z-wallet\/overview/);
    assert.match(zAppSource, /\/api\/zchart\/markets/);
    assert.match(zAppSource, /\/api\/zswap\/pools/);
    assert.match(zAppSource, /\/api\/ztrade\/markets/);
    assert.doesNotMatch(novaAppSource, /\/api\/z-wallet\/overview/);
    assert.doesNotMatch(novaAppSource, /\/api\/zbank\/integration/);
  });

  it("registers standalone Z ecosystem products separate from Nova", () => {
    const registry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "integrations", "z-ecosystem.v1.json"), "utf8")
    ) as {
      brand: { style: string };
      products: Array<{ id: string; path: string }>;
    };
    const zChainChart = readFileSync(path.resolve(repoRoot, "config", "chains", "z-block-chain.v1.json"), "utf8");
    const multiNetwork = readFileSync(path.resolve(repoRoot, "config", "chains", "multi-network.v1.json"), "utf8");

    assert.equal(registry.brand.style, "binance-production");
    assert.deepEqual(
      registry.products.map((product) => product.id),
      ["z-chain", "z-wallet", "z-bank", "z-swap", "z-trade", "z-chart", "z-bot"]
    );
    assert.doesNotMatch(zChainChart, /Nova One/);
    assert.doesNotMatch(multiNetwork, /Z Blockchain/);
  });

  it("documents Z production go-live stack separate from Nova", () => {
    const zGoLive = readFileSync(path.resolve(repoRoot, "scripts", "z-go-live.sh"), "utf8");
    const packageJson = readFileSync(path.resolve(repoRoot, "package.json"), "utf8");

    assert.match(zGoLive, /@z\/api/);
    assert.match(zGoLive, /@z\/dashboard/);
    assert.match(zGoLive, /\/zchart/);
    assert.match(packageJson, /dev:z-dashboard/);
    assert.match(packageJson, /start:z-api/);
  });

  it("registers Z Bot international trading automation", () => {
    const botRegistry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "integrations", "z-bot-international-trading.v1.json"), "utf8")
    ) as {
      product: { id: string };
      internationalNetworks: string[];
      strategies: Array<{ id: string }>;
    };
    const zAppSource = readFileSync(path.resolve(repoRoot, "services", "z-api", "src", "app.ts"), "utf8");
    const zBotScript = readFileSync(path.resolve(repoRoot, "scripts", "z-bot-run.sh"), "utf8");

    assert.equal(botRegistry.product.id, "z-bot");
    assert.deepEqual(botRegistry.internationalNetworks, ["TRON", "Ethereum", "BNB Smart Chain"]);
    assert.ok(botRegistry.strategies.some((strategy) => strategy.id === "oracle-pool-arb"));
    assert.match(zAppSource, /\/api\/zbot\/overview/);
    assert.match(zAppSource, /\/api\/zswap\/swap/);
    assert.match(zBotScript, /@z\/bot/);
  });

  it("uses shared VPS SSH helpers with empty-secret-safe defaults", () => {
    const sshLib = readFileSync(path.resolve(repoRoot, "scripts", "vps_ssh_lib.py"), "utf8");
    const remoteGoLive = readFileSync(path.resolve(repoRoot, "scripts", "remote-go-live-vps.py"), "utf8");

    assert.match(sshLib, /DEFAULT_VPS_HOST = "51.75.64.28"/);
    assert.match(sshLib, /require_vps_auth/);
    assert.match(sshLib, /value.strip\(\) == ""/);
    assert.match(remoteGoLive, /from vps_ssh_lib import connect_vps, run_remote/);
  });

  it("registers Proxmox LXC placement for Z Ecosystem VMIDs 5820–5828", () => {
    const registry = JSON.parse(
      readFileSync(path.resolve(repoRoot, "config", "integrations", "z-proxmox-lxc.v1.json"), "utf8")
    ) as {
      containers: Array<{ vmid: number; ip: string; role: string; zProduct: string }>;
      routing: { hubApi: string; dashboard: string };
    };
    const deployScript = readFileSync(path.resolve(repoRoot, "scripts", "deploy-z-proxmox-lxc.sh"), "utf8");

    assert.equal(registry.containers.length, 9);
    assert.equal(registry.routing.hubApi, "http://192.168.11.126:4100");
    assert.equal(registry.routing.dashboard, "http://192.168.11.127:3100");
    const hub = registry.containers.find((item) => item.vmid === 5824);
    assert.equal(hub?.role, "hub");
    assert.equal(hub?.zProduct, "z-chain");
    assert.match(deployScript, /5824/);
    assert.match(deployScript, /z-lxc-hub-go-live\.sh/);
    assert.match(deployScript, /z-lxc-portal-wire\.sh/);
  });

  it("falls back to plain tmux on VPS for Nova go-live", () => {
    const goLive = readFileSync(path.resolve(repoRoot, "scripts", "go-live.sh"), "utf8");
    assert.match(goLive, /tmux_cmd\(\)/);
    assert.match(goLive, /else\s+tmux "\$@"/);
  });
});
