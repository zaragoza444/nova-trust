import { DfnsApiClient } from "@dfns/sdk";
import { AsymmetricKeySigner } from "@dfns/sdk-keysigner";
import type { DfnsConfig } from "../config/custody-config";

export interface DfnsWalletSummary {
  id: string;
  network: string;
  address?: string;
  name?: string;
  status?: string;
}

export interface DfnsConnectivityResult {
  ok: boolean;
  walletCount: number;
  sampleWallets: DfnsWalletSummary[];
  message: string;
  error?: string;
}

export class DfnsCustodyClient {
  constructor(private readonly config: DfnsConfig) {}

  private createReadClient(): DfnsApiClient {
    return new DfnsApiClient({
      baseUrl: this.config.baseUrl,
      orgId: this.config.orgId,
      authToken: this.config.authToken
    });
  }

  private createSigningClient(): DfnsApiClient {
    const signer = new AsymmetricKeySigner({
      credId: this.config.credId,
      privateKey: this.config.privateKey
    });

    return new DfnsApiClient({
      baseUrl: this.config.baseUrl,
      orgId: this.config.orgId,
      authToken: this.config.authToken,
      signer
    });
  }

  getSigningClient(): DfnsApiClient {
    if (!this.config.enabled) {
      throw new Error("Dfns custody is not configured");
    }

    return this.createSigningClient();
  }

  async testConnectivity(limit = 5): Promise<DfnsConnectivityResult> {
    if (!this.config.enabled) {
      return {
        ok: false,
        walletCount: 0,
        sampleWallets: [],
        message: "Dfns credentials are not configured",
        error: "missing-env"
      };
    }

    try {
      const client = this.createReadClient();
      const response = await client.wallets.listWallets({ query: { limit } });
      const items = response.items ?? [];

      return {
        ok: true,
        walletCount: items.length,
        sampleWallets: items.slice(0, limit).map((wallet) => ({
          id: wallet.id,
          network: wallet.network,
          address: wallet.address,
          name: wallet.name,
          status: wallet.status
        })),
        message: `Dfns connectivity OK — listed ${items.length} wallet(s)`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Dfns error";
      return {
        ok: false,
        walletCount: 0,
        sampleWallets: [],
        message: "Dfns connectivity test failed",
        error: message
      };
    }
  }
}
