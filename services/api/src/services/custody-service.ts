import { readFileSync } from "node:fs";
import path from "node:path";
import { getCustodyConfigStatus, loadCustodyConfig } from "../config/custody-config";
import { CoboCustodyClient } from "./cobo-client";
import { DfnsCustodyClient } from "./dfns-client";

const repoRoot = path.resolve(__dirname, "../../../..");

export interface CustodyRegistry {
  schemaVersion: number;
  settlementChain: {
    chainId: number;
    name: string;
    wrappedNativeSymbol?: string;
  };
  providers: Array<{
    id: string;
    name: string;
    role: string;
    access?: string;
    capabilities: string[];
    settlementUseCases?: string[];
    notes?: string;
  }>;
  flows: Record<string, unknown>;
}

export interface CustodyOverview {
  registry: CustodyRegistry;
  configStatus: ReturnType<typeof getCustodyConfigStatus>;
  settlement: {
    chainId: number;
    chainName: string;
    wrappedNativeSymbol?: string;
  };
}

export interface CustodyHealthReport {
  checkedAt: string;
  settlementChainId: number;
  dfns: Awaited<ReturnType<DfnsCustodyClient["testConnectivity"]>>;
  cobo: Awaited<ReturnType<CoboCustodyClient["testConnectivity"]>>;
  readyForProduction: boolean;
  notes: string[];
}

function loadCustodyRegistry(): CustodyRegistry {
  const filePath = path.join(repoRoot, "config/integrations/custody.v1.json");
  return JSON.parse(readFileSync(filePath, "utf8")) as CustodyRegistry;
}

export class CustodyService {
  private readonly config = loadCustodyConfig();
  private readonly dfns = new DfnsCustodyClient(this.config.dfns);
  private readonly cobo = new CoboCustodyClient(this.config.cobo);

  getOverview(): CustodyOverview {
    const registry = loadCustodyRegistry();

    return {
      registry,
      configStatus: getCustodyConfigStatus(this.config),
      settlement: {
        chainId: registry.settlementChain.chainId,
        chainName: registry.settlementChain.name,
        wrappedNativeSymbol: registry.settlementChain.wrappedNativeSymbol
      }
    };
  }

  getDfnsClient(): DfnsCustodyClient {
    return this.dfns;
  }

  getCoboClient(): CoboCustodyClient {
    return this.cobo;
  }

  async runHealthCheck(): Promise<CustodyHealthReport> {
    const registry = loadCustodyRegistry();
    const [dfns, cobo] = await Promise.all([
      this.dfns.testConnectivity(),
      this.cobo.testConnectivity()
    ]);

    const notes: string[] = [];
    if (!cobo.apiKeyMatches && cobo.ok) {
      notes.push("Cobo COBO_API_KEY does not match the public key derived from COBO_API_SECRET.");
    }
    if (cobo.ok && cobo.environmentUsed && cobo.environmentUsed !== loadCustodyConfig().cobo.environment) {
      notes.push(
        `Update COBO_ENV to "${cobo.environmentUsed}" — the registered Cobo key is active in that environment.`
      );
    }
    if (cobo.ok) {
      notes.push("Register Cobo webhook and callback URLs on Cobo Portal before enabling production withdrawals.");
    }

    return {
      checkedAt: new Date().toISOString(),
      settlementChainId: registry.settlementChain.chainId,
      dfns,
      cobo,
      readyForProduction: dfns.ok && cobo.ok,
      notes
    };
  }
}
