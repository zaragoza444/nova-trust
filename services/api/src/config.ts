export interface ApiConfig {
  port: number;
  host: string;
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
    host: process.env.NOVA_API_HOST ?? "127.0.0.1",
    nodeEnv: process.env.NODE_ENV ?? "development",
    corsOrigin,
    corsOrigins: corsOrigins.length > 0 ? corsOrigins : ["http://localhost:3000"]
  };
}

export function resolveCorsOrigin(requestOrigin: string | undefined, corsOrigins: string[]): string {
  if (corsOrigins.includes("*")) {
    return "*";
  }

  if (!requestOrigin) {
    return corsOrigins[0];
  }

  if (corsOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return corsOrigins[0];
}
