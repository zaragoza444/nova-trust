import { JsonRpcProvider } from "ethers";

const requiredVars = [
  "ZBC_RPC_URL",
  "ZBC_DEPLOYER_PRIVATE_KEY",
  "ZBC_M1FIAT_SUPPLY",
  "ZBC_M1FIAT_LIQUIDITY",
  "ZBC_WZ_LIQUIDITY",
  "ZBC_ACX_SUPPLY",
  "ZBC_ACX_LIQUIDITY",
  "ZBC_WZ_ACX_LIQUIDITY",
  "ZBC_SHIVA_SUPPLY",
  "ZBC_SHIVA_LIQUIDITY",
  "ZBC_WZ_SHIVA_LIQUIDITY"
];

async function main() {
  const missing = requiredVars.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error("Missing required Z Blockchain environment variables:");
    for (const name of missing) console.error(`  - ${name}`);
    console.error("\nCopy contracts/z-block-chain.env.example to a private file, source it, then rerun preflight.");
    process.exit(1);
  }

  const rpcUrl = process.env.ZBC_RPC_URL!;
  const expectedChainId = BigInt(process.env.ZBC_EXPECTED_CHAIN_ID ?? "44002");
  const network = await new JsonRpcProvider(rpcUrl).getNetwork();

  if (network.chainId !== expectedChainId) {
    console.error(`RPC chain mismatch: connected to ${network.chainId}, expected ${expectedChainId}`);
    process.exit(1);
  }

  console.log("Z Blockchain preflight passed");
  console.log(`  RPC: ${rpcUrl}`);
  console.log(`  Chain: ${network.chainId} (${process.env.ZBC_NETWORK_NAME ?? "Z Blockchain"})`);
  console.log("  Pools: M1FIAT/WZ, ACX/WZ, SHIVA/WZ");
  console.log("\nRun bootstrap with:");
  console.log("  npm run setup:z-block-chain --workspace @nova/contracts");
}

main().catch((error) => {
  console.error("Z Blockchain preflight failed", error);
  process.exit(1);
});
