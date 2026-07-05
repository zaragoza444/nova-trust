const apiBaseUrl = process.env.Z_API_URL ?? "http://127.0.0.1:4100";
const apiRole = process.env.Z_BOT_ROLE ?? process.env.Z_DASHBOARD_ROLE ?? "TREASURY_OPERATOR";
const intervalSeconds = Number(process.env.Z_BOT_INTERVAL_SECONDS ?? 60);
const autoStart = process.env.Z_BOT_AUTO_START !== "false";

async function callApi<T>(path: string, method: "GET" | "POST" = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-z-role": apiRole
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Z Bot API ${method} ${path} failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

async function main() {
  console.log(`Z Bot worker connecting to ${apiBaseUrl}`);

  const overview = await callApi<{ product: { name: string } }>("/api/zbot/overview");
  console.log(`Loaded ${overview.product.name}`);

  if (autoStart) {
    const status = await callApi<{ running: boolean; mode: string }>("/api/zbot/status");
    if (!status.running) {
      await callApi("/api/zbot/start", "POST", { intervalSeconds });
      console.log(`Started Z Bot (${status.mode}) with ${intervalSeconds}s interval`);
    } else {
      console.log(`Z Bot already running (${status.mode})`);
    }
  }

  setInterval(async () => {
    try {
      const status = await callApi<{
        running: boolean;
        mode: string;
        lastCycle: { cycleId: string; executions: number; signals: unknown[] } | null;
      }>("/api/zbot/status");
      const cycle = status.lastCycle;
      if (!cycle) {
        console.log(`[${new Date().toISOString()}] waiting for first cycle`);
        return;
      }
      console.log(
        `[${new Date().toISOString()}] ${status.running ? "running" : "idle"} · ${cycle.cycleId} · signals ${cycle.signals?.length ?? 0} · executions ${cycle.executions}`
      );
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    }
  }, intervalSeconds * 1000);
}

void main();
