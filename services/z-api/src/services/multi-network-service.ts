import {
  getMultiNetworkConfigStatus,
  loadMultiNetworkConfig,
  type MultiNetworkConfig,
  type PublicNetworkRpcConfig
} from "../config/multi-network-config";
import { getMultiNetworkOverview } from "./chain-chart";

export interface NetworkRpcHealth {
  name: string;
  chainId: number;
  networkType: "evm" | "tron";
  rpcUrl: string;
  ok: boolean;
  latencyMs: number;
  chainIdMatch?: boolean;
  latestBlock?: number | string;
  error?: string;
}

export interface MultiNetworkHealthReport {
  checkedAt: string;
  basementNetwork: string;
  rpcEndpoints: NetworkRpcHealth[];
  permissionedRpc: NetworkRpcHealth | null;
  allPublicNetworksHealthy: boolean;
  bridgesOperational: boolean;
  notes: string[];
}

async function timedFetch(input: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkTronRpc(config: PublicNetworkRpcConfig, apiKey?: string): Promise<NetworkRpcHealth> {
  const started = Date.now();
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (apiKey) {
    headers["TRON-PRO-API-KEY"] = apiKey;
  }

  try {
    const response = await timedFetch(`${config.rpcUrl.replace(/\/$/, "")}/wallet/getnowblock`, {
      method: "POST",
      headers,
      body: "{}"
    });
    const payload = (await response.json()) as {
      block_header?: { raw_data?: { number?: number } };
    };
    const latestBlock = payload.block_header?.raw_data?.number;

    return {
      name: config.name,
      chainId: config.chainId,
      networkType: config.networkType,
      rpcUrl: config.rpcUrl,
      ok: response.ok && typeof latestBlock === "number",
      latencyMs: Date.now() - started,
      latestBlock
    };
  } catch (error) {
    return {
      name: config.name,
      chainId: config.chainId,
      networkType: config.networkType,
      rpcUrl: config.rpcUrl,
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

async function checkEvmRpc(config: PublicNetworkRpcConfig): Promise<NetworkRpcHealth> {
  const started = Date.now();

  try {
    const response = await timedFetch(config.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] })
    });
    const payload = (await response.json()) as { result?: string };
    const observedChainId = payload.result ? Number.parseInt(payload.result, 16) : NaN;
    const blockResponse = await timedFetch(config.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "eth_blockNumber", params: [] })
    });
    const blockPayload = (await blockResponse.json()) as { result?: string };
    const latestBlock = blockPayload.result ? Number.parseInt(blockPayload.result, 16) : undefined;

    return {
      name: config.name,
      chainId: config.chainId,
      networkType: config.networkType,
      rpcUrl: config.rpcUrl,
      ok: response.ok && observedChainId === config.chainId,
      latencyMs: Date.now() - started,
      chainIdMatch: observedChainId === config.chainId,
      latestBlock
    };
  } catch (error) {
    return {
      name: config.name,
      chainId: config.chainId,
      networkType: config.networkType,
      rpcUrl: config.rpcUrl,
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

async function checkZBlockChainRpc(rpcUrl: string): Promise<NetworkRpcHealth> {
  const started = Date.now();

  try {
    const response = await timedFetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] })
    });
    const payload = (await response.json()) as { result?: string };
    const observedChainId = payload.result ? Number.parseInt(payload.result, 16) : NaN;

    return {
      name: "Z Blockchain",
      chainId: 44002,
      networkType: "evm",
      rpcUrl,
      ok: response.ok && observedChainId === 44002,
      latencyMs: Date.now() - started,
      chainIdMatch: observedChainId === 44002
    };
  } catch (error) {
    return {
      name: "Z Blockchain",
      chainId: 44002,
      networkType: "evm",
      rpcUrl,
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export class MultiNetworkService {
  private readonly config: MultiNetworkConfig = loadMultiNetworkConfig();

  getOverview() {
    const overview = getMultiNetworkOverview();
    const configStatus = getMultiNetworkConfigStatus(this.config);

    return {
      ...overview,
      rpc: configStatus,
      bridges: {
        public: overview.chart.bridgeLanes,
        permissioned: overview.chart.permissionedBridges,
        allActive: [...overview.chart.bridgeLanes, ...overview.chart.permissionedBridges].every(
          (lane) => lane.status === "active"
        )
      }
    };
  }

  async runHealthCheck(): Promise<MultiNetworkHealthReport> {
    const tronApiKey = process.env.TRON_API_KEY?.trim();
    const [tron, ethereum, bnbSmartChain, zBlockchain] = await Promise.all([
      checkTronRpc(this.config.tron, tronApiKey),
      checkEvmRpc(this.config.ethereum),
      checkEvmRpc(this.config.bnbSmartChain),
      checkZBlockChainRpc(this.config.zBlockChainRpcUrl)
    ]);

    const overview = getMultiNetworkOverview();
    const allPublicNetworksHealthy = tron.ok && ethereum.ok && bnbSmartChain.ok;
    const bridgesOperational = [...overview.chart.bridgeLanes, ...overview.chart.permissionedBridges].every(
      (lane) => lane.status === "active"
    );

    const notes: string[] = [];
    if (!this.config.tron.configured) {
      notes.push("TRON_RPC_URL not set; using default TronGrid endpoint.");
    }
    if (!this.config.ethereum.configured) {
      notes.push("ETH_RPC_URL not set; using default public Ethereum endpoint.");
    }
    if (!this.config.bnbSmartChain.configured) {
      notes.push("BSC_RPC_URL not set; using default BNB Smart Chain endpoint.");
    }
    if (!zBlockchain.ok) {
      notes.push("Z Blockchain RPC unreachable; set ZBC_RPC_URL for permissioned bridge settlement.");
    }
    if (bridgesOperational) {
      notes.push("All TRON basement bridge lanes are active for Z Blockchain international settlement.");
    }

    return {
      checkedAt: new Date().toISOString(),
      basementNetwork: "TRON",
      rpcEndpoints: [tron, ethereum, bnbSmartChain],
      permissionedRpc: zBlockchain,
      allPublicNetworksHealthy,
      bridgesOperational,
      notes
    };
  }
}
