import { JsonRpcProvider } from "ethers";

const requiredVars = [
  "NOVA_RPC_URL",
  "NOVA_DEPLOYER_PRIVATE_KEY",
  "NOVA_M1FIAT_SUPPLY",
  "NOVA_M1FIAT_LIQUIDITY",
  "NOVA_WNOVA_LIQUIDITY",
  "NOVA_ACX_SUPPLY",
  "NOVA_ACX_LIQUIDITY",
  "NOVA_WNOVA_ACX_LIQUIDITY",
  "NOVA_SHIVA_SUPPLY",
  "NOVA_SHIVA_LIQUIDITY",
  "NOVA_WNOVA_SHIVA_LIQUIDITY"
];

async function main() {
  const missing = requiredVars.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    for (const name of missing) {
      console.error(`  - ${name}`);
    }
    console.error("\nCopy contracts/production.env.example to a private file, fill values, then:");
    console.error("  source /tmp/nova-production.env");
    console.error("  npm run setup:production:preflight --workspace @nova/contracts");
    process.exit(1);
  }

  const rpcUrl = process.env.NOVA_RPC_URL!;
  const expectedChainId = BigInt(process.env.NOVA_EXPECTED_CHAIN_ID ?? "22016");
  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();

  if (network.chainId !== expectedChainId) {
    console.error(`RPC chain mismatch: connected to ${network.chainId.toString()}, expected ${expectedChainId.toString()}`);
    process.exit(1);
  }

  console.log("Production preflight passed");
  console.log(`  RPC: ${rpcUrl}`);
  console.log(`  Chain: ${network.chainId.toString()} (${process.env.NOVA_NETWORK_NAME ?? "Nova One"})`);
  console.log("  Tokens: M1FIAT, ACX, SHIVA");
  console.log("  Pools: M1FIAT/WNOVA, ACX/WNOVA, SHIVA/WNOVA");
  console.log("\nRun bootstrap with:");
  console.log("  npm run setup:production --workspace @nova/contracts");
}

main().catch((error) => {
  console.error("Production preflight failed", error);
  process.exit(1);
});
