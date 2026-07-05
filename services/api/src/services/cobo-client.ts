import type { CoboConfig } from "../config/custody-config";

// Cobo SDK is CommonJS-only; require keeps runtime exports intact under our TS build.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CoboWaas2 = require("@cobo/cobo-waas2") as typeof import("@cobo/cobo-waas2").default;

export interface CoboWalletSummary {
  walletId?: string;
  name?: string;
  walletType?: string;
  walletSubtype?: string;
}

export interface CoboConnectivityResult {
  ok: boolean;
  walletCount: number;
  environmentUsed?: CoboConfig["environment"];
  derivedApiKey?: string;
  apiKeyMatches: boolean;
  sampleWallets: CoboWalletSummary[];
  message: string;
  error?: string;
}

function resolveCoboEnv(environment: CoboConfig["environment"]) {
  return environment === "prod" ? CoboWaas2.Env.PROD : CoboWaas2.Env.DEV;
}

function isCoboEnvironmentMismatch(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("body" in error)) {
    return false;
  }

  const body = (error as { body?: { error_code?: number } }).body;
  return body?.error_code === 2024;
}

async function listCoboWallets(environment: CoboConfig["environment"], apiSecret: string, limit: number) {
  const apiClient = CoboWaas2.ApiClient.instance;
  apiClient.setEnv(resolveCoboEnv(environment));
  apiClient.setPrivateKey(apiSecret);

  const walletsApi = new CoboWaas2.WalletsApi();
  const response = await walletsApi.listWallets({ limit });
  return response?.data ?? [];
}

export class CoboCustodyClient {
  constructor(private readonly config: CoboConfig) {}

  private configureApiClient() {
    const apiClient = CoboWaas2.ApiClient.instance;
    apiClient.setEnv(resolveCoboEnv(this.config.environment));
    apiClient.setPrivateKey(this.config.apiSecret);
    return apiClient;
  }

  getWalletsApi(): InstanceType<typeof CoboWaas2.WalletsApi> {
    if (!this.config.enabled) {
      throw new Error("Cobo custody is not configured");
    }

    this.configureApiClient();
    return new CoboWaas2.WalletsApi();
  }

  async testConnectivity(limit = 5): Promise<CoboConnectivityResult> {
    if (!this.config.enabled) {
      return {
        ok: false,
        walletCount: 0,
        apiKeyMatches: false,
        sampleWallets: [],
        message: "Cobo credentials are not configured",
        error: "missing-env"
      };
    }

    const derivedApiKey = (() => {
      const apiClient = CoboWaas2.ApiClient.instance;
      apiClient.setEnv(resolveCoboEnv(this.config.environment));
      apiClient.setPrivateKey(this.config.apiSecret);
      return apiClient.signer?.getPublicKey?.() as string | undefined;
    })();

    const apiKeyMatches = this.config.apiKey
      ? derivedApiKey?.toLowerCase() === this.config.apiKey.toLowerCase()
      : true;

    const environments: CoboConfig["environment"][] =
      this.config.environment === "dev" ? ["dev", "prod"] : ["prod", "dev"];

    let lastError: string | undefined;

    for (const environment of environments) {
      try {
        const wallets = await listCoboWallets(environment, this.config.apiSecret, limit);

        return {
          ok: true,
          walletCount: wallets.length,
          environmentUsed: environment,
          derivedApiKey,
          apiKeyMatches,
          sampleWallets: wallets.slice(0, limit).map((wallet: Record<string, unknown>) => ({
            walletId: wallet.wallet_id as string | undefined,
            name: wallet.name as string | undefined,
            walletType: wallet.wallet_type as string | undefined,
            walletSubtype: wallet.wallet_subtype as string | undefined
          })),
          message:
            environment === this.config.environment
              ? `Cobo connectivity OK — listed ${wallets.length} wallet(s) in ${environment}`
              : `Cobo connectivity OK — key is registered in ${environment} (COBO_ENV=${this.config.environment} did not match)`
        };
      } catch (error) {
        if (isCoboEnvironmentMismatch(error)) {
          lastError = `Key not registered in ${environment}`;
          continue;
        }

        const message =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "body" in error
              ? JSON.stringify((error as { body?: unknown }).body)
              : "Unknown Cobo error";

        return {
          ok: false,
          walletCount: 0,
          apiKeyMatches,
          sampleWallets: [],
          message: "Cobo connectivity test failed",
          error: message
        };
      }
    }

    return {
      ok: false,
      walletCount: 0,
      apiKeyMatches,
      sampleWallets: [],
      message: "Cobo connectivity test failed",
      error: lastError ?? "No Cobo environment accepted the API key"
    };
  }
}
