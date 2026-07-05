export interface ChainProfile {
  name: string;
  chainId: number;
  slug: string;
  role: string;
  nativeSymbol: string;
  wrappedSymbol: string;
  status: string;
  tradableTokens?: string[];
}

export const chain138Profile: ChainProfile = {
  name: "Chain 138",
  chainId: 138,
  slug: "chain-138",
  role: "OMNL settlement and bank rail",
  nativeSymbol: "ETH",
  wrappedSymbol: "WNOVA",
  status: "Settlement",
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
  tradableTokens: ["M1FIAT", "ACX", "SHIVA"]
};

export const zBlockChainProfile: ChainProfile = {
  name: "Z Block Chain",
  chainId: 44002,
  slug: "z-block-chain",
  role: "Z Online Bank liquidity and world chain",
  nativeSymbol: "Z",
  wrappedSymbol: "WZ",
  status: "Production",
  tradableTokens: ["M1FIAT", "ACX", "SHIVA"]
};

export const nrwWorldProfile: ChainProfile = {
  name: "NRW World",
  chainId: 33001,
  slug: "nrw-world",
  role: "World liquidity and bridge chain",
  nativeSymbol: "NRW",
  wrappedSymbol: "WNRW",
  status: "Bridge"
};

export const chainProfiles: ChainProfile[] = [chain138Profile, novaOneProfile, nrwWorldProfile, zBlockChainProfile];

export const primaryChain = novaOneProfile;
export const settlementChain = chain138Profile;
export const bridgeChain = nrwWorldProfile;
export const zBankChain = zBlockChainProfile;
