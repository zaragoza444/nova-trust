import type { IncomingMessage, ServerResponse } from "node:http";
import { ZBankFundLoaderService } from "../services/z-bank-fund-loader";

const service = new ZBankFundLoaderService();

function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? (JSON.parse(raw) as T) : ({} as T));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

export function handleZBankIntegrationOverview(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(service.getIntegrationOverview(), null, 2));
}

export async function handleZBankLoadFunds(request: IncomingMessage, response: ServerResponse) {
  try {
    const body = await readJsonBody<{
      walletAddress?: string;
      tokenSymbol?: string;
      amount?: string;
      bankReference?: string;
    }>(request);

    const result = await service.requestFundLoad({
      walletAddress: body.walletAddress ?? "",
      tokenSymbol: body.tokenSymbol ?? "",
      amount: body.amount ?? "",
      bankReference: body.bankReference
    });

    response.setHeader("content-type", "application/json");
    response.writeHead(result.status === "accepted" ? 202 : 400);
    response.end(JSON.stringify(result, null, 2));
  } catch {
    response.writeHead(400, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "Invalid fund load request body" }));
  }
}
