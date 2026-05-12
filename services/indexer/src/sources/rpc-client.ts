export interface RpcRequest {
  method: string;
  params?: unknown[];
}

export class NovaRpcClient {
  constructor(private readonly rpcUrl: string) {}

  async request<T>(request: RpcRequest): Promise<T> {
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: request.method,
        params: request.params ?? []
      })
    });

    if (!response.ok) {
      throw new Error(`RPC request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { result?: T; error?: { message: string } };
    if (payload.error) {
      throw new Error(payload.error.message);
    }

    return payload.result as T;
  }
}
