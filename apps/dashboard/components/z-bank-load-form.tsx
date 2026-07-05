"use client";

import { useState } from "react";

interface ZBankLoadFormProps {
  supportedTokens: string[];
  minAmounts: Record<string, string>;
}

interface LoadResult {
  requestId: string;
  status: "accepted" | "rejected";
  message: string;
  tokenSymbol: string;
  amount: string;
  walletAddress: string;
  supportedPlatforms: string[];
}

const apiBaseUrl = process.env.NEXT_PUBLIC_NOVA_API_URL ?? process.env.NOVA_API_URL ?? "http://127.0.0.1:4000";
const loadRole = process.env.NEXT_PUBLIC_NOVA_LOAD_ROLE ?? "TREASURY_OPERATOR";

export function ZBankLoadForm({ supportedTokens, minAmounts }: ZBankLoadFormProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState(supportedTokens[0] ?? "M1FIAT");
  const [amount, setAmount] = useState(minAmounts[supportedTokens[0] ?? "M1FIAT"] ?? "1");
  const [bankReference, setBankReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/zbank/load-funds`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-nova-role": loadRole
        },
        body: JSON.stringify({
          walletAddress,
          tokenSymbol,
          amount,
          bankReference: bankReference || undefined
        })
      });

      const payload = (await response.json()) as LoadResult & { error?: string };
      if (!response.ok && payload.error) {
        throw new Error(payload.error);
      }

      setResult(payload);
      if (payload.status === "rejected") {
        setError(payload.message);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Fund load request failed");
    } finally {
      setLoading(false);
    }
  }

  function handleTokenChange(nextSymbol: string) {
    setTokenSymbol(nextSymbol);
    setAmount(minAmounts[nextSymbol] ?? "1");
  }

  return (
    <div className="loadFormPanel">
      <form className="loadForm" onSubmit={handleSubmit}>
        <label className="formField">
          <span>Wallet address</span>
          <input
            required
            type="text"
            placeholder="0x..."
            value={walletAddress}
            onChange={(event) => setWalletAddress(event.target.value)}
          />
        </label>

        <label className="formField">
          <span>Token</span>
          <select value={tokenSymbol} onChange={(event) => handleTokenChange(event.target.value)}>
            {supportedTokens.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </label>

        <label className="formField">
          <span>Amount (min {minAmounts[tokenSymbol] ?? "1"})</span>
          <input
            required
            type="number"
            min={minAmounts[tokenSymbol] ?? "1"}
            step="0.000001"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>

        <label className="formField">
          <span>Z Bank reference (optional)</span>
          <input
            type="text"
            placeholder="M1 online transfer reference"
            value={bankReference}
            onChange={(event) => setBankReference(event.target.value)}
          />
        </label>

        <button className="primaryButton loadSubmit" type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Load funds from Z Bank online"}
        </button>
      </form>

      {error ? (
        <article className="loadResult rejected">
          <strong>Load rejected</strong>
          <p>{error}</p>
        </article>
      ) : null}

      {result?.status === "accepted" ? (
        <article className="loadResult accepted">
          <strong>Load accepted</strong>
          <p>{result.message}</p>
          <div className="loadResultMeta">
            <span>Request ID: {result.requestId}</span>
            <span>
              {result.amount} {result.tokenSymbol} → {result.walletAddress}
            </span>
            {result.supportedPlatforms.length > 0 ? (
              <span>Platforms: {result.supportedPlatforms.join(", ")}</span>
            ) : null}
          </div>
        </article>
      ) : null}
    </div>
  );
}
