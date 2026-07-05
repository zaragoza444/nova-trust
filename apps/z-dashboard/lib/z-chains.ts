export interface ChainProfile {
  name: string;
  chainId: number;
  slug: string;
  role: string;
  nativeSymbol: string;
  wrappedSymbol: string;
  status: string;
  networkType?: string;
  networkId?: string;
}

export const tronProfile: ChainProfile = {
  name: "TRON",
  chainId: 728126428,
  slug: "tron",
  role: "Basement foundation",
  nativeSymbol: "TRX",
  wrappedSymbol: "WTRX",
  status: "Foundation",
  networkType: "tron",
  networkId: "mainnet"
};

export const ethereumProfile: ChainProfile = {
  name: "Ethereum",
  chainId: 1,
  slug: "ethereum",
  role: "Public EVM settlement",
  nativeSymbol: "ETH",
  wrappedSymbol: "WETH",
  status: "Active",
  networkType: "evm"
};

export const bnbProfile: ChainProfile = {
  name: "BNB Smart Chain",
  chainId: 56,
  slug: "bnb-smart-chain",
  role: "Public EVM liquidity",
  nativeSymbol: "BNB",
  wrappedSymbol: "WBNB",
  status: "Active",
  networkType: "evm"
};

export const zBlockChainProfile: ChainProfile = {
  name: "Z Blockchain",
  chainId: 44002,
  slug: "z-block-chain",
  role: "Z Online Bank settlement",
  nativeSymbol: "Z",
  wrappedSymbol: "WZ",
  status: "Live",
  networkType: "evm"
};

export const zChainProfiles = [zBlockChainProfile, tronProfile, ethereumProfile, bnbProfile];
export const primaryChain = zBlockChainProfile;

export function formatChainIdentifier(chain: ChainProfile): string {
  if (chain.networkType === "tron") {
    return `TRON ${chain.networkId ?? "mainnet"}`;
  }
  return `Chain ${chain.chainId}`;
}
