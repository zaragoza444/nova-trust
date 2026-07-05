import type { IncomingMessage, ServerResponse } from "node:http";
import { loadTradableTokenRegistry, loadTradingPlatformRegistry } from "../services/tradable-tokens";

export function handleTradingTokensOverview(_request: IncomingMessage, response: ServerResponse) {
  const tokenRegistry = loadTradableTokenRegistry();
  const platformRegistry = loadTradingPlatformRegistry();

  response.setHeader("content-type", "application/json");
  response.end(
    JSON.stringify(
      {
        chain: tokenRegistry.chain,
        tokens: tokenRegistry.tokens,
        approvedPlatforms: platformRegistry.platforms,
        approvedTokens: platformRegistry.approvedTokens
      },
      null,
      2
    )
  );
}
