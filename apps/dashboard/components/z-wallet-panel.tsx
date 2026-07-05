"use client";

import { useMemo, useState } from "react";

interface WalletAccountTab {
  id: string;
  name: string;
  description: string;
  valueUsd: string;
}

interface WalletAssetRow {
  symbol: string;
  name: string;
  account: string;
  balance: string;
  available: string;
  priceUsd: string;
  valueUsd: string;
}

interface ZWalletPanelProps {
  walletAddress: string;
  accounts: WalletAccountTab[];
  assets: WalletAssetRow[];
  capabilities: Record<string, boolean>;
}

export function ZWalletPanel({ walletAddress, accounts, assets, capabilities }: ZWalletPanelProps) {
  const [activeAccount, setActiveAccount] = useState(accounts[0]?.id ?? "funding");
  const [copied, setCopied] = useState(false);

  const visibleAssets = useMemo(() => {
    if (activeAccount === "earn") {
      return [];
    }
    return assets.filter((asset) => asset.account === activeAccount);
  }, [assets, activeAccount]);

  async function copyAddress() {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="zWalletPanel">
      <div className="zWalletTabs">
        {accounts.map((account) => (
          <button
            key={account.id}
            type="button"
            className={activeAccount === account.id ? "zWalletTab active" : "zWalletTab"}
            onClick={() => setActiveAccount(account.id)}
          >
            <span>{account.name}</span>
            <strong>${account.valueUsd}</strong>
          </button>
        ))}
      </div>

      <div className="zWalletToolbar">
        <div>
          <span className="eyebrow">Deposit address</span>
          <strong>{walletAddress}</strong>
        </div>
        <div className="zWalletActions">
          <button type="button" className="secondaryButton" onClick={() => void copyAddress()}>
            {copied ? "Copied" : "Copy address"}
          </button>
          {capabilities.zBankLoad ? (
            <a href="/zbank" className="primaryButton">
              Load from Z Bank
            </a>
          ) : null}
          {capabilities.trade ? (
            <a href="/trading" className="secondaryButton">
              Trade
            </a>
          ) : null}
        </div>
      </div>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Available</th>
              <th>Price</th>
              <th>Value (USD)</th>
            </tr>
          </thead>
          <tbody>
            {visibleAssets.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  {activeAccount === "earn"
                    ? "Earn positions will appear here when liquidity programs are active."
                    : "No assets in this account yet. Deposit Z or load funds from Z Bank online."}
                </td>
              </tr>
            ) : (
              visibleAssets.map((asset) => (
                <tr key={`${asset.account}-${asset.symbol}`}>
                  <td>
                    <strong>{asset.symbol}</strong>
                    <div className="metricDelta">{asset.name}</div>
                  </td>
                  <td>{asset.available}</td>
                  <td>${asset.priceUsd}</td>
                  <td>${asset.valueUsd}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
