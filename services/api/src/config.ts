export interface ApiConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  corsOrigins: string[];
}

export function loadApiConfig(): ApiConfig {
  const corsOrigin = process.env.NOVA_CORS_ORIGIN ?? "http://localhost:3000";
  const corsOrigins = corsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    port: Number(process.env.PORT ?? 4000),
    nodeEnv: process.env.NODE_ENV ?? "development",
    corsOrigin,
    corsOrigins: corsOrigins.length > 0 ? corsOrigins : ["http://localhost:3000"]
  };
}

export function resolveCorsOrigin(requestOrigin: string | undefined, corsOrigins: string[]): string {
  if (!requestOrigin) {
    return corsOrigins[0];
  }

  if (corsOrigins.includes("*") || corsOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return corsOrigins[0];
}
