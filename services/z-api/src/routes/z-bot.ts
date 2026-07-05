import type { IncomingMessage, ServerResponse } from "node:http";
import { ZBotService } from "../services/z-bot-service";
import { ZSwapExecutor } from "../services/z-swap-executor";

const botService = new ZBotService();
const swapExecutor = new ZSwapExecutor();

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

export function handleZBotOverview(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(botService.getOverview(), null, 2));
}

export function handleZBotStatus(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(botService.getStatus(), null, 2));
}

export async function handleZBotRun(_request: IncomingMessage, response: ServerResponse) {
  try {
    const result = await botService.runCycle();
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(result, null, 2));
  } catch (error) {
    response.writeHead(500, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Z Bot cycle failed" }));
  }
}

export async function handleZBotStart(request: IncomingMessage, response: ServerResponse) {
  try {
    const body = await readJsonBody<{ intervalSeconds?: number }>(request);
    const status = await botService.start(body.intervalSeconds);
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(status, null, 2));
  } catch (error) {
    response.writeHead(400, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to start Z Bot" }));
  }
}

export function handleZBotStop(_request: IncomingMessage, response: ServerResponse) {
  const status = botService.stop();
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(status, null, 2));
}

export async function handleZBotSignals(_request: IncomingMessage, response: ServerResponse) {
  try {
    const signals = await botService.analyzeOpportunities();
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ checkedAt: new Date().toISOString(), signalCount: signals.length, signals }, null, 2));
  } catch (error) {
    response.writeHead(500, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to analyze signals" }));
  }
}

export async function handleZSwapQuote(request: IncomingMessage, response: ServerResponse) {
  try {
    const body = await readJsonBody<{ pair?: string; tokenInSymbol?: string; amountIn?: string }>(request);
    const result = await swapExecutor.quote({
      pair: body.pair ?? "",
      tokenInSymbol: body.tokenInSymbol ?? "",
      amountIn: body.amountIn ?? "1"
    });
    response.setHeader("content-type", "application/json");
    response.writeHead(result.status === "accepted" ? 200 : 400);
    response.end(JSON.stringify(result, null, 2));
  } catch (error) {
    response.writeHead(400, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Invalid swap quote request" }));
  }
}

export async function handleZSwapExecute(request: IncomingMessage, response: ServerResponse) {
  try {
    const body = await readJsonBody<{
      pair?: string;
      tokenInSymbol?: string;
      amountIn?: string;
      minAmountOut?: string;
      slippageBps?: number;
    }>(request);
    const result = await swapExecutor.swap({
      pair: body.pair ?? "",
      tokenInSymbol: body.tokenInSymbol ?? "",
      amountIn: body.amountIn ?? "",
      minAmountOut: body.minAmountOut,
      slippageBps: body.slippageBps
    });
    response.setHeader("content-type", "application/json");
    response.writeHead(result.status === "accepted" ? 202 : 400);
    response.end(JSON.stringify(result, null, 2));
  } catch (error) {
    response.writeHead(400, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Invalid swap request" }));
  }
}
