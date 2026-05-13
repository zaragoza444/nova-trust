import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface DeploymentManifest {
  contracts?: {
    identityRegistry?: { address: string };
    complianceRegistry?: { address: string };
    settlementToken?: { address: string };
    assetFactory?: { address: string };
    treasuryController?: { address: string };
    auditEvents?: { address: string };
  };
}

export function loadDeploymentManifest(manifestPath: string) {
  const resolvedPath = path.resolve(process.cwd(), manifestPath);
  if (!existsSync(resolvedPath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(resolvedPath, "utf8")) as DeploymentManifest;
  } catch {
    return null;
  }
}
