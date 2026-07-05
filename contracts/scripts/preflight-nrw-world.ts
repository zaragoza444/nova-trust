import { JsonRpcProvider } from "ethers";

const requiredVars = [
  "NRW_RPC_URL",
  "NRW_DEPLOYER_PRIVATE_KEY",
  "NRW_M1FIAT_SUPPLY",
  "NRW_M1FIAT_LIQUIDITY",
  "NRW_WNRW_LIQUIDITY",
  "NRW_ACX_SUPPLY",
  "NRW_ACX_LIQUIDITY",
  "NRW_WNRW_ACX_LIQUIDITY",
  "NRW_SHIVA_SUPPLY",
  "NRW_SHIVA_LIQUIDITY",
  "NRW_WNRW_SHIVA_LIQUIDITY"
];

async function main() {
  const missing = requiredVars.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error("Missing required NRW World environment variables:");
    for (const name of missing) console.error(`  - ${name}`);
    console.error("\nCopy contracts/nrw-world.env.example to a private file, source it, then rerun preflight.");
    process.exit(1);
  }

  const rpcUrl = process.env.NRW_RPC_URL!;
  const expectedChainId = BigInt(process.env.NRW_EXPECTED_CHAIN_ID ?? "33001");
  const network = await new JsonRpcProvider(rpcUrl).getNetwork();

  if (network.chainId !== expectedChainId) {
    console.error(`RPC chain mismatch: connected to ${network.chainId}, expected ${expectedChainId}`);
    process.exit(1);
  }

  console.log("NRW World preflight passed");
  console.log(`  RPC: ${rpcUrl}`);
  console.log(`  Chain: ${network.chainId} (${process.env.NRW_NETWORK_NAME ?? "NRW World"})`);
  console.log("  Pools: M1FIAT/WNRW, ACX/WNRW, SHIVA/WNRW");
  console.log("\nRun bootstrap with:");
  console.log("  npm run setup:nrw-world --workspace @nova/contracts");
}

main().catch((error) => {
  console.error("NRW World preflight failed", error);
  process.exit(1);
});
