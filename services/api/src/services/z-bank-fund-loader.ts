import { randomUUID } from "node:crypto";
import {
  getTradableToken,
  loadTradableTokenRegistry,
  loadTradingPlatformRegistry,
  loadZBankIntegration,
  validateLoadAmount
} from "./tradable-tokens";
import { getCustodyConfigStatus } from "../config/custody-config";

export interface FundLoadRequest {
  walletAddress: string;
  tokenSymbol: string;
  amount: string;
  bankReference?: string;
}

export interface FundLoadResult {
  requestId: string;
  status: "accepted" | "rejected";
  provider: string;
  channel: string;
  walletAddress: string;
  tokenSymbol: string;
  amount: string;
  chainId: number;
  settlementChainId: number;
  capabilities: {
    transferable: boolean;
    tradable: boolean;
    swappable: boolean;
    crossBankUsable: boolean;
    platformTradingUsable: boolean;
  };
  supportedPlatforms: string[];
  message: string;
  createdAt: string;
}

export class ZBankFundLoaderService {
  getIntegrationOverview() {
    const integration = loadZBankIntegration();
    const tokenRegistry = loadTradableTokenRegistry();
    const platforms = loadTradingPlatformRegistry();

    return {
      provider: integration.provider,
      supportedChains: integration.supportedChains,
      supportedTokens: integration.supportedTokens,
      loadMethods: integration.loadMethods,
      capabilities: integration.capabilities,
      tradableTokens: tokenRegistry.tokens.map((token) => ({
        symbol: token.symbol,
        name: token.name,
        minLoadAmount: token.minLoadAmount,
        capabilities: token.capabilities,
        liquidityPairs: token.liquidityPairs
      })),
      approvedPlatforms: platforms.platforms.map((platform) => ({
        id: platform.id,
        name: platform.name,
        type: platform.type,
        supportedTokens: platform.supportedTokens,
        capabilities: platform.capabilities
      })),
      custody: {
        settlementChainId: integration.primaryLiquidityChain?.chainId ?? 44002,
        providers: getCustodyConfigStatus(),
        healthEndpoint: "/api/custody/health"
      }
    };
  }

  requestFundLoad(input: FundLoadRequest): FundLoadResult {
    const integration = loadZBankIntegration();
    const tokenRegistry = loadTradableTokenRegistry();
    const platforms = loadTradingPlatformRegistry();
    const token = getTradableToken(input.tokenSymbol);

    if (!token) {
      return this.reject(input, integration.provider.name, `Token ${input.tokenSymbol} is not registered for Chain 138`);
    }

    const amountCheck = validateLoadAmount(input.tokenSymbol, input.amount);
    if (!amountCheck.valid) {
      return this.reject(input, integration.provider.name, amountCheck.reason ?? "Invalid load amount");
    }

    if (!input.walletAddress || !input.walletAddress.startsWith("0x")) {
      return this.reject(input, integration.provider.name, "A valid wallet address is required");
    }

    const supportedPlatforms = platforms.platforms
      .filter((platform) => platform.supportedTokens.includes(token.symbol))
      .map((platform) => platform.name);

    return {
      requestId: randomUUID(),
      status: "accepted",
      provider: integration.provider.name,
      channel: integration.provider.channel,
      walletAddress: input.walletAddress,
      tokenSymbol: token.symbol,
      amount: input.amount,
      chainId: tokenRegistry.chain.settlementChain?.chainId ?? 44002,
      settlementChainId: 44002,
      capabilities: {
        transferable: token.capabilities.transferable,
        tradable: token.capabilities.tradable,
        swappable: token.capabilities.swappable,
        crossBankUsable: integration.capabilities.crossBankUsable,
        platformTradingUsable: integration.capabilities.platformTradingUsable
      },
      supportedPlatforms,
      message:
        `Z Bank online accepted ${input.amount} ${token.symbol} load to ${input.walletAddress}. ` +
        "Funds settle on Z Block Chain (44002) and become swappable, tradable, and transferable across approved banks and trading platforms.",
      createdAt: new Date().toISOString()
    };
  }

  private reject(input: FundLoadRequest, provider: string, message: string): FundLoadResult {
    return {
      requestId: randomUUID(),
      status: "rejected",
      provider,
      channel: "M1",
      walletAddress: input.walletAddress,
      tokenSymbol: input.tokenSymbol,
      amount: input.amount,
      chainId: 138,
      settlementChainId: 22016,
      capabilities: {
        transferable: false,
        tradable: false,
        swappable: false,
        crossBankUsable: false,
        platformTradingUsable: false
      },
      supportedPlatforms: [],
      message,
      createdAt: new Date().toISOString()
    };
  }
}
