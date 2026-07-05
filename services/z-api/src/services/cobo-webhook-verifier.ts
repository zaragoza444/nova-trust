import { createHash } from "node:crypto";
import type { CoboEnvironment } from "../config/custody-config";

const COBO_WEBHOOK_PUBLIC_KEYS: Record<CoboEnvironment, string> = {
  dev: "a04ea1d5fa8da71f1dcfccf972b9c4eba0a2d8aba1f6da26f49977b08a0d2718",
  prod: "8d4a482641adb2a34b726f05827dba9a9653e5857469b8749052bf4458a86729"
};

function doubleSha256(message: string): Buffer {
  const first = createHash("sha256").update(message).digest();
  return createHash("sha256").update(first).digest();
}

export function verifyCoboWebhookSignature(input: {
  rawBody: string;
  timestamp: string;
  signature: string;
  environment: CoboEnvironment;
}): boolean {
  if (process.env.COBO_WEBHOOK_SKIP_VERIFY === "true") {
    return true;
  }

  const publicKeyHex = COBO_WEBHOOK_PUBLIC_KEYS[input.environment];
  if (!publicKeyHex || !input.signature || !input.timestamp) {
    return false;
  }

  const message = `${input.rawBody}|${input.timestamp}`;
  const messageHash = doubleSha256(message);
  const signatureBytes = Buffer.from(input.signature, "hex");
  const publicKeyBytes = Buffer.from(publicKeyHex, "hex");

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nacl = require("tweetnacl") as typeof import("tweetnacl");
  return nacl.sign.detached.verify(messageHash, signatureBytes, publicKeyBytes);
}

export function getCoboWebhookPublicKey(environment: CoboEnvironment): string {
  return COBO_WEBHOOK_PUBLIC_KEYS[environment];
}
