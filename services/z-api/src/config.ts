export interface ZApiConfig {
  port: number;
  host: string;
  nodeEnv: string;
  corsOrigin: string;
  corsOrigins: string[];
}

export function loadZApiConfig(): ZApiConfig {
  const corsOrigin = process.env.Z_CORS_ORIGIN ?? "http://localhost:3100";
  const corsOrigins = corsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    port: Number(process.env.Z_API_PORT ?? process.env.PORT ?? 4100),
    host: process.env.Z_API_HOST ?? "0.0.0.0",
    nodeEnv: process.env.NODE_ENV ?? "development",
    corsOrigin,
    corsOrigins: corsOrigins.length > 0 ? corsOrigins : ["http://localhost:3100"]
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
