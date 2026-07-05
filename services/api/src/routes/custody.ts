import type { IncomingMessage, ServerResponse } from "node:http";
import { CustodyService } from "../services/custody-service";
import { CoboWebhookService } from "../services/cobo-webhook-service";

const custodyService = new CustodyService();
const coboWebhookService = new CoboWebhookService();

function readRawBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

export function handleCustodyOverview(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(
    JSON.stringify(
      {
        ...custodyService.getOverview(),
        coboEndpoints: coboWebhookService.getRegistrationInfo()
      },
      null,
      2
    )
  );
}

export async function handleCustodyHealth(_request: IncomingMessage, response: ServerResponse) {
  try {
    const report = await custodyService.runHealthCheck();
    response.setHeader("content-type", "application/json");
    response.writeHead(report.readyForProduction ? 200 : 503);
    response.end(JSON.stringify(report, null, 2));
  } catch (error) {
    response.writeHead(500, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        error: "Custody health check failed",
        details: error instanceof Error ? error.message : "Unknown error"
      })
    );
  }
}

export async function handleCoboWebhook(request: IncomingMessage, response: ServerResponse) {
  try {
    const rawBody = await readRawBody(request);
    const timestamp = String(request.headers["biz_timestamp"] ?? "");
    const signature = String(request.headers["biz_resp_signature"] ?? "");

    const result = coboWebhookService.handleSignedPayload({
      channel: "webhook",
      rawBody,
      timestamp,
      signature
    });

    if (!result.ok) {
      response.writeHead(401, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: result.error ?? "Unauthorized" }));
      return;
    }

    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, recordId: result.recordId }));
  } catch (error) {
    response.writeHead(500, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        error: "Cobo webhook handling failed",
        details: error instanceof Error ? error.message : "Unknown error"
      })
    );
  }
}

export async function handleCoboCallback(request: IncomingMessage, response: ServerResponse) {
  try {
    const rawBody = await readRawBody(request);
    const timestamp = String(request.headers["biz_timestamp"] ?? "");
    const signature = String(request.headers["biz_resp_signature"] ?? "");

    const result = coboWebhookService.handleSignedPayload({
      channel: "callback",
      rawBody,
      timestamp,
      signature
    });

    if (!result.ok) {
      response.writeHead(401, { "content-type": "text/plain" });
      response.end("unauthorized");
      return;
    }

    response.writeHead(200, { "content-type": "text/plain" });
    response.end("ok");
  } catch {
    response.writeHead(500, { "content-type": "text/plain" });
    response.end("error");
  }
}
