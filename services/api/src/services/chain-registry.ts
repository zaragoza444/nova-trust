export interface ChainProfile {
  name: string;
  chainId: number;
  slug: string;
  role: string;
  nativeSymbol: string;
  wrappedSymbol: string;
  status: string;
}

export const chainProfiles: ChainProfile[] = [
  {
    name: "Nova One",
    chainId: 22016,
    slug: "nova-one",
    role: "Primary settlement chain",
    nativeSymbol: "NOVA",
    wrappedSymbol: "WNOVA",
    status: "Primary"
  },
  {
    name: "NRW World",
    chainId: 33001,
    slug: "nrw-world",
    role: "World liquidity and bridge chain",
    nativeSymbol: "NRW",
    wrappedSymbol: "WNRW",
    status: "Bridge"
  }
];

export const primaryChain = chainProfiles[0];
export const bridgeChain = chainProfiles[1];
