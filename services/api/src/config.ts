export interface ApiConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
}

export function loadApiConfig(): ApiConfig {
  return {
    port: Number(process.env.PORT ?? 4000),
    nodeEnv: process.env.NODE_ENV ?? "development",
    corsOrigin: process.env.NOVA_CORS_ORIGIN ?? "http://localhost:3000"
  };
}
