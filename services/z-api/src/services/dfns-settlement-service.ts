import { createHash } from "node:crypto";
import type { DfnsConfig } from "../config/custody-config";
import { DfnsCustodyClient } from "./dfns-client";

export interface ZBankSettlementPayload {
  requestId: string;
  walletAddress: string;
  tokenSymbol: string;
  amount: string;
  settlementChainId: number;
  bankReference?: string;
}

export interface DfnsSettlementResult {
  status: "signed" | "skipped" | "failed";
  walletId?: string;
  signatureId?: string;
  signature?: string;
  network?: string;
  message: string;
  error?: string;
}

function buildSettlementDigest(payload: ZBankSettlementPayload): string {
  const canonical = JSON.stringify({
    requestId: payload.requestId,
    walletAddress: payload.walletAddress.toLowerCase(),
    tokenSymbol: payload.tokenSymbol.toUpperCase(),
    amount: payload.amount,
    settlementChainId: payload.settlementChainId,
    bankReference: payload.bankReference ?? "",
    schema: "zbank-fund-load-v1"
  });

  return createHash("sha256").update(canonical).digest("hex");
}

export class DfnsSettlementService {
  constructor(
    private readonly config: DfnsConfig,
    private readonly dfnsClient: DfnsCustodyClient
  ) {}

  private async resolveTreasuryWalletId(): Promise<string> {
    const configured = process.env.DFNS_TREASURY_WALLET_ID?.trim();
    if (configured) {
      return configured;
    }

    const connectivity = await this.dfnsClient.testConnectivity(1);
    const wallet = connectivity.sampleWallets[0];
    if (!wallet?.id) {
      throw new Error("No Dfns treasury wallet available");
    }

    return wallet.id;
  }

  async signFundLoadSettlement(payload: ZBankSettlementPayload): Promise<DfnsSettlementResult> {
    if (!this.config.enabled) {
      return {
        status: "skipped",
        message: "Dfns custody is not configured; settlement signature skipped"
      };
    }

    try {
      const walletId = await this.resolveTreasuryWalletId();
      const client = this.dfnsClient.getSigningClient();
      const hash = buildSettlementDigest(payload);

      const signatureResponse = await client.wallets.generateSignature({
        walletId,
        body: {
          kind: "Hash",
          hash,
          network: "EthereumSepolia",
          externalId: payload.requestId
        }
      });

      return {
        status: "signed",
        walletId,
        signatureId: signatureResponse.id,
        signature: signatureResponse.signature?.encoded ?? signatureResponse.signedData ?? undefined,
        network: "EthereumSepolia",
        message: "Dfns treasury signed Z Bank fund load settlement attestation"
      };
    } catch (error) {
      return {
        status: "failed",
        message: "Dfns settlement signing failed",
        error: error instanceof Error ? error.message : "Unknown Dfns signing error"
      };
    }
  }
}
