export type NetworkType = "evm" | "tron";

export interface ChainProfile {
  name: string;
  chainId: number;
  slug: string;
  role: string;
  nativeSymbol: string;
  wrappedSymbol: string;
  status: string;
  networkType: NetworkType;
  networkId?: string;
  tradableTokens?: string[];
}

export const tronProfile: ChainProfile = {
  name: "TRON",
  chainId: 728126428,
  slug: "tron",
  role: "Basement foundation network",
  nativeSymbol: "TRX",
  wrappedSymbol: "WTRX",
  status: "Foundation",
  networkType: "tron",
  networkId: "mainnet",
  tradableTokens: ["USDT", "USDC", "TRX"]
};

export const ethereumProfile: ChainProfile = {
  name: "Ethereum",
  chainId: 1,
  slug: "ethereum",
  role: "Public EVM settlement network",
  nativeSymbol: "ETH",
  wrappedSymbol: "WETH",
  status: "Active",
  networkType: "evm",
  tradableTokens: ["USDT", "USDC", "ETH"]
};

export const bnbSmartChainProfile: ChainProfile = {
  name: "BNB Smart Chain",
  chainId: 56,
  slug: "bnb-smart-chain",
  role: "Public EVM liquidity network",
  nativeSymbol: "BNB",
  wrappedSymbol: "WBNB",
  status: "Active",
  networkType: "evm",
  tradableTokens: ["USDT", "USDC", "BNB"]
};

export const chain138Profile: ChainProfile = {
  name: "Chain 138",
  chainId: 138,
  slug: "chain-138",
  role: "OMNL settlement and bank rail",
  nativeSymbol: "ETH",
  wrappedSymbol: "WNOVA",
  status: "Settlement",
  networkType: "evm",
  tradableTokens: ["M1FIAT", "ACX", "SHIVA"]
};

export const novaOneProfile: ChainProfile = {
  name: "Nova One",
  chainId: 22016,
  slug: "nova-one",
  role: "Primary settlement chain",
  nativeSymbol: "NOVA",
  wrappedSymbol: "WNOVA",
  status: "Primary",
  networkType: "evm",
  tradableTokens: ["M1FIAT", "ACX", "SHIVA"]
};

export const nrwWorldProfile: ChainProfile = {
  name: "NRW World",
  chainId: 33001,
  slug: "nrw-world",
  role: "World liquidity and bridge chain",
  nativeSymbol: "NRW",
  wrappedSymbol: "WNRW",
  status: "Bridge",
  networkType: "evm"
};

export const multiNetworkProfiles: ChainProfile[] = [tronProfile, ethereumProfile, bnbSmartChainProfile];

export const permissionedChainProfiles: ChainProfile[] = [
  chain138Profile,
  novaOneProfile,
  nrwWorldProfile
];

export const chainProfiles: ChainProfile[] = [...multiNetworkProfiles, ...permissionedChainProfiles];

export const basementNetwork = tronProfile;
export const primaryChain = novaOneProfile;
export const settlementChain = chain138Profile;
export const bridgeChain = nrwWorldProfile;

export function formatChainIdentifier(chain: ChainProfile): string {
  if (chain.networkType === "tron") {
    return `TRON ${chain.networkId ?? "mainnet"}`;
  }

  return `Chain ${chain.chainId}`;
}
