import type { IncomingMessage, ServerResponse } from "node:http";
import { ZWalletService } from "../services/z-wallet-service";

const service = new ZWalletService();

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

export function handleZWalletOverview(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(service.getOverview(), null, 2));
}

export async function handleZWalletBalances(_request: IncomingMessage, response: ServerResponse) {
  try {
    const payload = await service.getBalances();
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(payload, null, 2));
  } catch (error) {
    response.writeHead(500, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to load Z Wallet balances"
      })
    );
  }
}

export async function handleZWalletTransfer(request: IncomingMessage, response: ServerResponse) {
  try {
    const body = await readJsonBody<{
      tokenSymbol?: string;
      toAddress?: string;
      amount?: string;
    }>(request);

    const result = await service.transfer({
      tokenSymbol: body.tokenSymbol ?? "",
      toAddress: body.toAddress ?? "",
      amount: body.amount ?? ""
    });

    response.setHeader("content-type", "application/json");
    response.writeHead(result.status === "accepted" ? 202 : 400);
    response.end(JSON.stringify(result, null, 2));
  } catch (error) {
    response.writeHead(400, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Invalid transfer request" }));
  }
}
