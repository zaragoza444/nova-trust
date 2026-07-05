import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const contractsRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(contractsRoot, "..");

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

async function checkTron(rpcUrl: string): Promise<boolean> {
  const response = await fetch(`${rpcUrl.replace(/\/$/, "")}/wallet/getnowblock`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}"
  });
  const payload = (await response.json()) as { block_header?: { raw_data?: { number?: number } } };
  const block = payload.block_header?.raw_data?.number;
  console.log(`  TRON latest block: ${block ?? "unknown"}`);
  return response.ok && typeof block === "number";
}

async function checkEvm(name: string, rpcUrl: string, expectedChainId: number): Promise<boolean> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] })
  });
  const payload = (await response.json()) as { result?: string };
  const chainId = payload.result ? Number.parseInt(payload.result, 16) : NaN;
  console.log(`  ${name} chainId: ${chainId}`);
  return response.ok && chainId === expectedChainId;
}

async function main() {
  const tronRpc = requireEnv("TRON_RPC_URL");
  const ethRpc = requireEnv("ETH_RPC_URL");
  const bscRpc = requireEnv("BSC_RPC_URL");
  const zbcRpc = process.env.ZBC_RPC_URL?.trim() || "http://127.0.0.1:8546";

  console.log("Multi-network RPC preflight");
  console.log("---------------------------");
  console.log(`TRON_RPC_URL=${tronRpc}`);
  console.log(`ETH_RPC_URL=${ethRpc}`);
  console.log(`BSC_RPC_URL=${bscRpc}`);
  console.log(`ZBC_RPC_URL=${zbcRpc}`);
  console.log("");

  const registry = JSON.parse(
    readFileSync(path.resolve(repoRoot, "config/chains/multi-network.v1.json"), "utf8")
  ) as {
    permissionedBridges: Array<{ status: string }>;
  };

  const bridgesActive = registry.permissionedBridges.every((lane) => lane.status === "active");
  console.log(`Permissioned bridge lanes active: ${bridgesActive ? "yes" : "no"}`);

  const [tronOk, ethOk, bscOk, zbcOk] = await Promise.all([
    checkTron(tronRpc),
    checkEvm("Ethereum", ethRpc, 1),
    checkEvm("BNB Smart Chain", bscRpc, 56),
    checkEvm("Z Blockchain", zbcRpc, 44002)
  ]);

  if (!tronOk || !ethOk || !bscOk) {
    console.error("\nPublic multi-network RPC preflight failed.");
    process.exit(1);
  }

  if (!zbcOk) {
    console.warn("\nZ Blockchain RPC not reachable (optional for public-only checks).");
  }

  console.log("\nMulti-network preflight passed.");
}

void main();
