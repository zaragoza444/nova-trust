import { randomUUID } from "node:crypto";
import { getCustodyConfigStatus, loadCustodyConfig } from "../config/custody-config";
import { DfnsCustodyClient } from "./dfns-client";
import { DfnsSettlementService } from "./dfns-settlement-service";
import {
  getTradableToken,
  loadTradableTokenRegistry,
  loadTradingPlatformRegistry,
  loadZBankIntegration,
  validateLoadAmount
} from "./tradable-tokens";

export interface FundLoadRequest {
  walletAddress: string;
  tokenSymbol: string;
  amount: string;
  bankReference?: string;
}

export interface FundLoadCustody {
  provider: "dfns";
  status: "signed" | "skipped" | "failed";
  walletId?: string;
  signatureId?: string;
  signature?: string;
  network?: string;
  message: string;
  error?: string;
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
  custody?: FundLoadCustody;
  message: string;
  createdAt: string;
}

export class ZBankFundLoaderService {
  private readonly custodyConfig = loadCustodyConfig();
  private readonly dfnsSettlement = new DfnsSettlementService(
    this.custodyConfig.dfns,
    new DfnsCustodyClient(this.custodyConfig.dfns)
  );

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
        healthEndpoint: "/api/custody/health",
        webhookEndpoint: "/api/custody/cobo/webhook",
        callbackEndpoint: "/api/custody/cobo/callback"
      }
    };
  }

  async requestFundLoad(input: FundLoadRequest): Promise<FundLoadResult> {
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

    const requestId = randomUUID();
    const settlementChainId = integration.primaryLiquidityChain?.chainId ?? 44002;
    const custody = await this.dfnsSettlement.signFundLoadSettlement({
      requestId,
      walletAddress: input.walletAddress,
      tokenSymbol: token.symbol,
      amount: input.amount,
      settlementChainId,
      bankReference: input.bankReference
    });

    if (custody.status === "failed" && this.custodyConfig.dfns.enabled) {
      return this.reject(
        input,
        integration.provider.name,
        custody.error ?? "Dfns treasury could not sign the Z Bank settlement attestation"
      );
    }

    return {
      requestId,
      status: "accepted",
      provider: integration.provider.name,
      channel: integration.provider.channel,
      walletAddress: input.walletAddress,
      tokenSymbol: token.symbol,
      amount: input.amount,
      chainId: tokenRegistry.chain.settlementChain?.chainId ?? settlementChainId,
      settlementChainId,
      capabilities: {
        transferable: token.capabilities.transferable,
        tradable: token.capabilities.tradable,
        swappable: token.capabilities.swappable,
        crossBankUsable: integration.capabilities.crossBankUsable,
        platformTradingUsable: integration.capabilities.platformTradingUsable
      },
      supportedPlatforms,
      custody: {
        provider: "dfns",
        status: custody.status,
        walletId: custody.walletId,
        signatureId: custody.signatureId,
        signature: custody.signature,
        network: custody.network,
        message: custody.message,
        error: custody.error
      },
      message:
        custody.status === "signed"
          ? `Z Bank online accepted ${input.amount} ${token.symbol} load to ${input.walletAddress}. Dfns treasury signed settlement for Z Blockchain (${settlementChainId}).`
          : `Z Bank online accepted ${input.amount} ${token.symbol} load to ${input.walletAddress}. Funds settle on Z Blockchain (${settlementChainId}) and become swappable, tradable, and transferable across approved banks and trading platforms.`,
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
