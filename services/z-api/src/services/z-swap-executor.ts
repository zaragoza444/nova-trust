import { readFileSync } from "node:fs";
import path from "node:path";
import { Contract, JsonRpcProvider, MaxUint256, parseUnits, Wallet } from "ethers";
import { loadZWalletRuntimeConfig } from "../config/z-wallet-config";

const repoRoot = path.resolve(__dirname, "../../../..");

const poolAbi = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function reserve0() view returns (uint256)",
  "function reserve1() view returns (uint256)",
  "function quoteExactInput(address tokenIn, uint256 amountIn) view returns (uint256)",
  "function swapExactInput(address tokenIn, uint256 amountIn, uint256 minAmountOut, address recipient) returns (uint256)"
];

const erc20Abi = [
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)"
];

interface ManifestPool {
  symbol: string;
  name: string;
  token0: string;
  token1: string;
  pool: { address: string };
  initialAmounts?: Record<string, string>;
}

interface ManifestSnapshot {
  tradableTokens?: Array<{ symbol: string; address: string }>;
  liquidity?: {
    wrappedNativeToken?: { symbol: string; address: string };
    pools?: ManifestPool[];
  };
}

function loadManifest(relativePath: string): ManifestSnapshot | null {
  try {
    return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), "utf8")) as ManifestSnapshot;
  } catch {
    return null;
  }
}

function findPoolByPair(manifest: ManifestSnapshot, pair: string): ManifestPool | undefined {
  const [base] = pair.split("/");
  return manifest.liquidity?.pools?.find((pool) => pool.symbol === `NLP-${base}-WZ` || pool.name.startsWith(`${base} /`));
}

export class ZSwapExecutor {
  private readonly walletConfig = loadZWalletRuntimeConfig();
  private readonly manifestPath =
    process.env.ZBC_BOOTSTRAP_MANIFEST_PATH ?? "contracts/deployments/z-blockchain-production-liquidity.json";

  private getManifest() {
    return loadManifest(this.manifestPath);
  }

  private getProvider() {
    return new JsonRpcProvider(this.walletConfig.rpcUrl);
  }

  private getTokenAddress(manifest: ManifestSnapshot, symbol: string): string | undefined {
    if (symbol === "WZ") {
      return manifest.liquidity?.wrappedNativeToken?.address;
    }
    return manifest.tradableTokens?.find((token) => token.symbol === symbol)?.address;
  }

  listPools() {
    const manifest = this.getManifest();
    return (manifest?.liquidity?.pools ?? []).map((pool) => ({
      symbol: pool.symbol,
      name: pool.name,
      pair: pool.name.replace(" Liquidity Pool", "").replace(" / ", "/"),
      address: pool.pool.address,
      token0: pool.token0,
      token1: pool.token1
    }));
  }

  async quote(input: { pair: string; tokenInSymbol: string; amountIn: string }) {
    const manifest = this.getManifest();
    if (!manifest) {
      return { status: "rejected" as const, message: "Liquidity manifest not found" };
    }

    const poolEntry = findPoolByPair(manifest, input.pair);
    if (!poolEntry) {
      return { status: "rejected" as const, message: `Pool ${input.pair} not found` };
    }

    const tokenInAddress = this.getTokenAddress(manifest, input.tokenInSymbol.toUpperCase());
    if (!tokenInAddress) {
      return { status: "rejected" as const, message: `Token ${input.tokenInSymbol} not registered` };
    }

    const provider = this.getProvider();
    const tokenIn = new Contract(tokenInAddress, erc20Abi, provider);
    const pool = new Contract(poolEntry.pool.address, poolAbi, provider);
    const decimals = await tokenIn.decimals();
    const amountInWei = parseUnits(input.amountIn, decimals);
    const amountOutWei = await pool.quoteExactInput(tokenInAddress, amountInWei);
    const tokenOutAddress = tokenInAddress.toLowerCase() === poolEntry.token0.toLowerCase() ? poolEntry.token1 : poolEntry.token0;
    const tokenOut = new Contract(tokenOutAddress, erc20Abi, provider);
    const outDecimals = await tokenOut.decimals();
    const outSymbol = await tokenOut.symbol();

    return {
      status: "accepted" as const,
      pair: input.pair,
      poolAddress: poolEntry.pool.address,
      tokenIn: input.tokenInSymbol.toUpperCase(),
      tokenOut: outSymbol,
      amountIn: input.amountIn,
      amountOut: Number(amountOutWei) / 10 ** Number(outDecimals),
      amountOutFormatted: (Number(amountOutWei) / 10 ** Number(outDecimals)).toFixed(6),
      feeBps: 30
    };
  }

  async swap(input: { pair: string; tokenInSymbol: string; amountIn: string; minAmountOut?: string; slippageBps?: number }) {
    if (!process.env.Z_WALLET_PRIVATE_KEY) {
      return { status: "rejected" as const, message: "Z_WALLET_PRIVATE_KEY is not configured for swap execution" };
    }

    const quote = await this.quote(input);
    if (quote.status !== "accepted") {
      return quote;
    }

    const manifest = this.getManifest();
    if (!manifest) {
      return { status: "rejected" as const, message: "Liquidity manifest not found" };
    }

    const poolEntry = findPoolByPair(manifest, input.pair);
    if (!poolEntry) {
      return { status: "rejected" as const, message: `Pool ${input.pair} not found` };
    }

    const tokenInAddress = this.getTokenAddress(manifest, input.tokenInSymbol.toUpperCase());
    if (!tokenInAddress) {
      return { status: "rejected" as const, message: `Token ${input.tokenInSymbol} not registered` };
    }

    const provider = this.getProvider();
    const signer = new Wallet(process.env.Z_WALLET_PRIVATE_KEY, provider);
    const walletAddress = (await signer.getAddress()).toLowerCase();

    if (walletAddress !== this.walletConfig.walletAddress.toLowerCase()) {
      return { status: "rejected" as const, message: "Configured signing key does not match Z Wallet production address" };
    }

    const tokenIn = new Contract(tokenInAddress, erc20Abi, signer);
    const pool = new Contract(poolEntry.pool.address, poolAbi, signer);
    const decimals = await tokenIn.decimals();
    const amountInWei = parseUnits(input.amountIn, decimals);
    const quotedOut = await pool.quoteExactInput(tokenInAddress, amountInWei);
    const slippageBps = input.slippageBps ?? Number(process.env.Z_BOT_MAX_SLIPPAGE_BPS ?? 50);
    const minOut =
      input.minAmountOut !== undefined
        ? parseUnits(input.minAmountOut, 18)
        : (quotedOut * BigInt(10_000 - slippageBps)) / 10_000n;

    const allowance = await tokenIn.allowance(walletAddress, poolEntry.pool.address);
    if (allowance < amountInWei) {
      const approveTx = await tokenIn.approve(poolEntry.pool.address, MaxUint256);
      await approveTx.wait();
    }

    const tx = await pool.swapExactInput(tokenInAddress, amountInWei, minOut, walletAddress);
    const receipt = await tx.wait();

    return {
      status: "accepted" as const,
      txHash: receipt?.hash ?? tx.hash,
      pair: input.pair,
      poolAddress: poolEntry.pool.address,
      tokenIn: input.tokenInSymbol.toUpperCase(),
      tokenOut: quote.tokenOut,
      amountIn: input.amountIn,
      amountOut: quote.amountOutFormatted,
      slippageBps,
      message: `Swapped ${input.amountIn} ${input.tokenInSymbol.toUpperCase()} on ${input.pair}`
    };
  }
}
