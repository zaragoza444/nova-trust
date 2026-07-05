import type { IncomingMessage, ServerResponse } from "node:http";
import { chainProfiles, primaryChain, zBlockChainProfile } from "../services/chain-registry";

export function handleHealth(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(
    JSON.stringify(
      {
        status: "ok",
        ecosystem: "z",
        chain: primaryChain.name,
        chainId: primaryChain.chainId,
        settlementChain: zBlockChainProfile.name,
        settlementChainId: zBlockChainProfile.chainId,
        chains: chainProfiles,
        timestamp: new Date().toISOString()
      },
      null,
      2
    )
  );
}
