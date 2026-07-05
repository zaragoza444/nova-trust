import { readFileSync } from "node:fs";
import path from "node:path";
import { Contract, formatEther, formatUnits, JsonRpcProvider, parseUnits, Wallet } from "ethers";
import { getZWalletConfigStatus, loadZWalletRuntimeConfig } from "../config/z-wallet-config";
import { getOraclePriceOverview } from "./price-oracle";
import { loadTradableTokenRegistry } from "./tradable-tokens";

const repoRoot = path.resolve(__dirname, "../../../..");
const erc20Abi = [
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

interface ManifestSnapshot {
  zWallet?: {
    address: string;
    role?: string;
    registeredAt?: string;
    nativeBalanceZ?: string;
  };
  tradableTokens?: Array<{ symbol: string; address: string }>;
  contracts?: {
    wrappedZBlockChainToken?: { address: string };
  };
}

function loadManifest(relativePath: string): ManifestSnapshot | null {
  try {
    return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), "utf8")) as ManifestSnapshot;
  } catch {
    return null;
  }
}

function parseUsdValue(balance: string, priceUsd?: string): string {
  if (!priceUsd) {
    return "0";
  }
  const amount = Number(balance);
  const price = Number(priceUsd);
  if (!Number.isFinite(amount) || !Number.isFinite(price)) {
    return "0";
  }
  return (amount * price).toFixed(2);
}

export class ZWalletService {
  private readonly config = loadZWalletRuntimeConfig();

  getOverview() {
    const tokenRegistry = loadTradableTokenRegistry();
    const manifest = loadManifest(this.config.manifestPath);

    return {
      product: this.config.registry.product,
      settlementChain: this.config.registry.settlementChain,
      wallet: {
        address: this.config.walletAddress,
        label: this.config.registry.productionWallet.label,
        role: this.config.registry.productionWallet.role,
        registered: manifest?.zWallet?.address?.toLowerCase() === this.config.walletAddress,
        registeredAt: manifest?.zWallet?.registeredAt ?? null
      },
      accounts: this.config.registry.accounts,
      capabilities: this.config.registry.capabilities,
      integrations: {
        zBankLoadEndpoint: "/api/zbank/load-funds",
        tradingEndpoint: "/api/trading/tokens",
        oracleEndpoint: "/api/oracle/prices",
        depositAddress: this.config.walletAddress
      },
      runtime: getZWalletConfigStatus(this.config),
      supportedTokens: tokenRegistry.tokens.map((token) => token.symbol)
    };
  }

  async getBalances() {
    const manifest = loadManifest(this.config.manifestPath);
    const oracle = getOraclePriceOverview();
    const priceMap = new Map(oracle.prices.map((entry) => [entry.symbol, entry.priceUsd]));
    const provider = new JsonRpcProvider(this.config.rpcUrl);
    const walletAddress = this.config.walletAddress;

    const nativeBalance = await provider.getBalance(walletAddress);
    const nativeBalanceFormatted = formatEther(nativeBalance);
    const nativePrice = priceMap.get("Z") ?? priceMap.get("WZ") ?? "0";

    const assets: Array<{
      symbol: string;
      name: string;
      account: string;
      balance: string;
      available: string;
      priceUsd: string;
      valueUsd: string;
      tokenAddress?: string;
    }> = [
      {
        symbol: this.config.registry.settlementChain.nativeSymbol,
        name: `${this.config.registry.settlementChain.name} Native`,
        account: "funding",
        balance: nativeBalanceFormatted,
        available: nativeBalanceFormatted,
        priceUsd: nativePrice,
        valueUsd: parseUsdValue(nativeBalanceFormatted, nativePrice)
      }
    ];

    for (const token of manifest?.tradableTokens ?? []) {
      try {
        const contract = new Contract(token.address, erc20Abi, provider);
        const [balance, symbol, decimals] = await Promise.all([
          contract.balanceOf(walletAddress),
          contract.symbol(),
          contract.decimals()
        ]);
        const formatted = formatUnits(balance, decimals);
        const priceUsd = priceMap.get(symbol) ?? "0";
        assets.push({
          symbol,
          name: symbol,
          account: token.symbol === "M1FIAT" || token.symbol === "USDT" || token.symbol === "USDC" ? "funding" : "spot",
          balance: formatted,
          available: formatted,
          priceUsd,
          valueUsd: parseUsdValue(formatted, priceUsd),
          tokenAddress: token.address
        });
      } catch {
        assets.push({
          symbol: token.symbol,
          name: token.symbol,
          account: "spot",
          balance: "0",
          available: "0",
          priceUsd: priceMap.get(token.symbol) ?? "0",
          valueUsd: "0",
          tokenAddress: token.address
        });
      }
    }

    const totalUsd = assets.reduce((sum, asset) => sum + Number(asset.valueUsd), 0).toFixed(2);
    const fundingUsd = assets
      .filter((asset) => asset.account === "funding")
      .reduce((sum, asset) => sum + Number(asset.valueUsd), 0)
      .toFixed(2);
    const spotUsd = assets
      .filter((asset) => asset.account === "spot")
      .reduce((sum, asset) => sum + Number(asset.valueUsd), 0)
      .toFixed(2);

    return {
      checkedAt: new Date().toISOString(),
      walletAddress,
      settlementChain: this.config.registry.settlementChain,
      portfolio: {
        totalUsd,
        fundingUsd,
        spotUsd,
        earnUsd: "0.00"
      },
      accounts: this.config.registry.accounts.map((account) => ({
        ...account,
        valueUsd: account.id === "funding" ? fundingUsd : account.id === "spot" ? spotUsd : "0.00"
      })),
      assets
    };
  }

  async transfer(input: { tokenSymbol: string; toAddress: string; amount: string }) {
    if (!this.config.signingReady || !process.env.Z_WALLET_PRIVATE_KEY) {
      return {
        status: "rejected" as const,
        message: "Z_WALLET_PRIVATE_KEY is not configured for production signing"
      };
    }

    if (!input.toAddress.startsWith("0x")) {
      return { status: "rejected" as const, message: "Destination address must be a valid 0x address" };
    }

    const manifest = loadManifest(this.config.manifestPath);
    const provider = new JsonRpcProvider(this.config.rpcUrl);
    const signer = new Wallet(process.env.Z_WALLET_PRIVATE_KEY, provider);
    const fromAddress = (await signer.getAddress()).toLowerCase();

    if (fromAddress !== this.config.walletAddress) {
      return { status: "rejected" as const, message: "Configured signing key does not match Z Wallet production address" };
    }

    const symbol = input.tokenSymbol.toUpperCase();
    if (symbol === this.config.registry.settlementChain.nativeSymbol) {
      const tx = await signer.sendTransaction({
        to: input.toAddress,
        value: parseUnits(input.amount, 18)
      });
      await tx.wait();
      return {
        status: "accepted" as const,
        txHash: tx.hash,
        from: fromAddress,
        to: input.toAddress,
        amount: input.amount,
        tokenSymbol: symbol,
        message: `Transferred ${input.amount} ${symbol} on Z Blockchain`
      };
    }

    const token = manifest?.tradableTokens?.find((entry) => entry.symbol.toUpperCase() === symbol);
    if (!token) {
      return { status: "rejected" as const, message: `Token ${input.tokenSymbol} is not registered on Z Blockchain` };
    }

    const contract = new Contract(
      token.address,
      [...erc20Abi, "function transfer(address to,uint256 value) external returns (bool)"],
      signer
    );
    const decimals = await contract.decimals();
    const tx = await contract.transfer(input.toAddress, parseUnits(input.amount, decimals));
    await tx.wait();

    return {
      status: "accepted" as const,
      txHash: tx.hash,
      from: fromAddress,
      to: input.toAddress,
      amount: input.amount,
      tokenSymbol: symbol,
      tokenAddress: token.address,
      message: `Transferred ${input.amount} ${symbol} on Z Blockchain`
    };
  }
}
