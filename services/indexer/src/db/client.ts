import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import type { IndexerConfig } from "../config";

let pool: Pool | null = null;

function resolveSchemaPath() {
  return path.resolve(__dirname, "../../src/db/schema.sql");
}

export function getIndexerDbPool(config: IndexerConfig) {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl
    });
  }

  return pool;
}

export async function ensureIndexerSchema(config: IndexerConfig) {
  const schemaSql = readFileSync(resolveSchemaPath(), "utf8");
  await getIndexerDbPool(config).query(schemaSql);
}
