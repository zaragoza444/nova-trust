export interface PublicNetworkRpcConfig {
  name: string;
  chainId: number;
  networkType: "evm" | "tron";
  networkId?: string;
  rpcUrl: string;
  configured: boolean;
}

export interface MultiNetworkConfig {
  basementChainId: number;
  zBlockChainRpcUrl: string;
  tron: PublicNetworkRpcConfig;
  ethereum: PublicNetworkRpcConfig;
  bnbSmartChain: PublicNetworkRpcConfig;
  tronApiKeyConfigured: boolean;
}

function trimOrEmpty(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function loadMultiNetworkConfig(): MultiNetworkConfig {
  const tronRpcUrl = trimOrEmpty(process.env.TRON_RPC_URL) || "https://api.trongrid.io";
  const ethRpcUrl = trimOrEmpty(process.env.ETH_RPC_URL) || "https://ethereum.publicnode.com";
  const bscRpcUrl = trimOrEmpty(process.env.BSC_RPC_URL) || "https://bsc-dataseed.binance.org";
  const zBlockChainRpcUrl = trimOrEmpty(process.env.ZBC_RPC_URL) || "http://127.0.0.1:8546";

  return {
    basementChainId: Number(process.env.MULTI_NETWORK_BASEMENT_CHAIN_ID ?? 728126428),
    zBlockChainRpcUrl,
    tronApiKeyConfigured: Boolean(trimOrEmpty(process.env.TRON_API_KEY)),
    tron: {
      name: "TRON",
      chainId: 728126428,
      networkType: "tron",
      networkId: trimOrEmpty(process.env.TRON_NETWORK_ID) || "mainnet",
      rpcUrl: tronRpcUrl,
      configured: Boolean(trimOrEmpty(process.env.TRON_RPC_URL))
    },
    ethereum: {
      name: "Ethereum",
      chainId: 1,
      networkType: "evm",
      rpcUrl: ethRpcUrl,
      configured: Boolean(trimOrEmpty(process.env.ETH_RPC_URL))
    },
    bnbSmartChain: {
      name: "BNB Smart Chain",
      chainId: 56,
      networkType: "evm",
      rpcUrl: bscRpcUrl,
      configured: Boolean(trimOrEmpty(process.env.BSC_RPC_URL))
    }
  };
}

export function getMultiNetworkConfigStatus(config: MultiNetworkConfig = loadMultiNetworkConfig()) {
  return {
    basementChainId: config.basementChainId,
    zBlockChainRpcUrl: config.zBlockChainRpcUrl,
    tron: {
      rpcUrl: config.tron.rpcUrl,
      networkId: config.tron.networkId,
      configured: config.tron.configured,
      apiKeyConfigured: config.tronApiKeyConfigured
    },
    ethereum: {
      rpcUrl: config.ethereum.rpcUrl,
      configured: config.ethereum.configured
    },
    bnbSmartChain: {
      rpcUrl: config.bnbSmartChain.rpcUrl,
      configured: config.bnbSmartChain.configured
    }
  };
}
