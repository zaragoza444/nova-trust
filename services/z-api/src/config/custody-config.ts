export type CoboEnvironment = "dev" | "prod";

export interface DfnsConfig {
  enabled: boolean;
  baseUrl: string;
  orgId: string;
  authToken: string;
  credId: string;
  privateKey: string;
}

export interface CoboConfig {
  enabled: boolean;
  environment: CoboEnvironment;
  apiKey: string;
  apiSecret: string;
}

export interface CustodyConfig {
  dfns: DfnsConfig;
  cobo: CoboConfig;
}

function normalizePrivateKey(raw: string | undefined): string {
  if (!raw) {
    return "";
  }

  const trimmed = raw.trim();
  if (trimmed.includes("\\n")) {
    return trimmed.replace(/\\n/g, "\n");
  }

  return trimmed;
}

function resolveCoboEnvironment(raw: string | undefined): CoboEnvironment {
  return raw?.toLowerCase() === "prod" ? "prod" : "dev";
}

export function loadCustodyConfig(): CustodyConfig {
  const dfnsAuthToken = process.env.DFNS_AUTH_TOKEN?.trim() ?? "";
  const dfnsPrivateKey = normalizePrivateKey(process.env.DFNS_PRIVATE_KEY);
  const dfnsCredId = process.env.DFNS_CRED_ID?.trim() ?? "";
  const dfnsOrgId = process.env.DFNS_ORG_ID?.trim() ?? "";
  const dfnsBaseUrl = process.env.DFNS_API_BASE_URL?.trim() || "https://api.dfns.io";

  const coboApiKey = process.env.COBO_API_KEY?.trim() ?? "";
  const coboApiSecret = process.env.COBO_API_SECRET?.trim() ?? "";

  const dfnsConfigured =
    Boolean(dfnsAuthToken) && Boolean(dfnsPrivateKey) && Boolean(dfnsCredId) && Boolean(dfnsOrgId);
  const coboConfigured = Boolean(coboApiSecret);

  return {
    dfns: {
      enabled: dfnsConfigured,
      baseUrl: dfnsBaseUrl,
      orgId: dfnsOrgId,
      authToken: dfnsAuthToken,
      credId: dfnsCredId,
      privateKey: dfnsPrivateKey
    },
    cobo: {
      enabled: coboConfigured,
      environment: resolveCoboEnvironment(process.env.COBO_ENV),
      apiKey: coboApiKey,
      apiSecret: coboApiSecret
    }
  };
}

export function getCustodyConfigStatus(config: CustodyConfig = loadCustodyConfig()) {
  return {
    dfns: {
      configured: config.dfns.enabled,
      baseUrl: config.dfns.baseUrl,
      orgIdConfigured: Boolean(config.dfns.orgId)
    },
    cobo: {
      configured: config.cobo.enabled,
      environment: config.cobo.environment,
      apiKeyConfigured: Boolean(config.cobo.apiKey)
    }
  };
}
