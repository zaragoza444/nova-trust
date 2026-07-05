import { loadCustodyConfig, type CoboEnvironment } from "../config/custody-config";
import { appendCoboWebhookRecord, listCoboWebhookRecords } from "./cobo-webhook-store";
import { getCoboWebhookPublicKey, verifyCoboWebhookSignature } from "./cobo-webhook-verifier";

export interface CoboWebhookHandleResult {
  ok: boolean;
  recordId?: string;
  error?: string;
}

function resolveVerificationEnvironment(preferred: CoboEnvironment): CoboEnvironment[] {
  return preferred === "dev" ? ["dev", "prod"] : ["prod", "dev"];
}

function extractEventType(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.type === "string") {
    return record.type;
  }
  if (typeof record.event_type === "string") {
    return record.event_type;
  }
  if (typeof record.kind === "string") {
    return record.kind;
  }

  return undefined;
}

export class CoboWebhookService {
  private readonly config = loadCustodyConfig();

  getRegistrationInfo() {
    return {
      webhookUrl: "/api/custody/cobo/webhook",
      callbackUrl: "/api/custody/cobo/callback",
      recommendedPublicBaseUrl: process.env.COBO_CALLBACK_URL?.replace(/\/api\/custody\/cobo\/(webhook|callback)$/, "") ?? null,
      environment: this.config.cobo.environment,
      publicKey: getCoboWebhookPublicKey(this.config.cobo.environment),
      recentEvents: listCoboWebhookRecords(10)
    };
  }

  handleSignedPayload(input: {
    channel: "webhook" | "callback";
    rawBody: string;
    timestamp: string;
    signature: string;
  }): CoboWebhookHandleResult {
    let payload: unknown;
    try {
      payload = JSON.parse(input.rawBody) as unknown;
    } catch {
      return { ok: false, error: "Invalid JSON payload" };
    }

    const environments = resolveVerificationEnvironment(this.config.cobo.environment);
    const verified = environments.some((environment) =>
      verifyCoboWebhookSignature({
        rawBody: input.rawBody,
        timestamp: input.timestamp,
        signature: input.signature,
        environment
      })
    );

    if (!verified) {
      return { ok: false, error: "Signature verification failed" };
    }

    const record = appendCoboWebhookRecord({
      channel: input.channel,
      environment: this.config.cobo.environment,
      eventType: extractEventType(payload),
      payload
    });

    return { ok: true, recordId: record.id };
  }
}
