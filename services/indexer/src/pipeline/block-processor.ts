import { Contract, EventLog, JsonRpcProvider } from "ethers";
import type { IndexerConfig } from "../config";
import type { AssetIssuanceRecord, AssetRecord, BlockRecord, TransactionRecord, ValidatorRecord } from "../domain/types";
import { loadDeploymentManifest } from "../sources/deployment-manifest";
import { NovaRpcClient } from "../sources/rpc-client";
import { materializeDashboardMetrics } from "./analytics-service";

export interface IndexedSnapshot {
  blocks: BlockRecord[];
  transactions: TransactionRecord[];
  validators: ValidatorRecord[];
  assets: AssetRecord[];
  issuanceRequests: AssetIssuanceRecord[];
  metrics: ReturnType<typeof materializeDashboardMetrics>;
}

interface RawRpcTransaction {
  hash: string;
  blockNumber: string;
  from: string;
  to: string | null;
  value: string;
}

interface RawRpcBlock {
  number: string;
  hash: string;
  parentHash: string;
  timestamp: string;
  gasUsed: string;
  miner?: string;
  transactions: RawRpcTransaction[];
}

interface RawRpcReceipt {
  status?: string;
}

const assetFactoryAbi = [
  "function getAssets() view returns ((address assetToken,string assetId,string assetClass,string jurisdiction,uint256 issueSize,address issuer,uint64 createdAt)[])"
];

const assetTokenAbi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

function hexToNumber(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  return Number(BigInt(value));
}

function toIsoTimestamp(unixSecondsHex: string) {
  return new Date(hexToNumber(unixSecondsHex) * 1000).toISOString();
}

function buildFallbackSnapshot(): IndexedSnapshot {
  const blocks: BlockRecord[] = [
    {
      number: 12402,
      hash: "0xblock12402",
      parentHash: "0xblock12401",
      timestamp: "2026-05-12T00:00:00Z",
      transactionCount: 42,
      validator: "Validator Alpha",
      gasUsed: 2800000
    },
    {
      number: 12401,
      hash: "0xblock12401",
      parentHash: "0xblock12400",
      timestamp: "2026-05-11T23:59:55Z",
      transactionCount: 37,
      validator: "Validator Beta",
      gasUsed: 2611000
    }
  ];

  const transactions: TransactionRecord[] = [
    {
      hash: "0xtx001",
      blockNumber: 12402,
      from: "0x1000000000000000000000000000000000000001",
      to: "0x1000000000000000000000000000000000000002",
      value: "145000",
      status: "success",
      category: "settlement"
    },
    {
      hash: "0xtx002",
      blockNumber: 12402,
      from: "0x1000000000000000000000000000000000000003",
      to: "0x1000000000000000000000000000000000000004",
      value: "98000",
      status: "failed",
      category: "settlement"
    },
    {
      hash: "0xtx003",
      blockNumber: 12401,
      from: "0x1000000000000000000000000000000000000005",
      to: "0x1000000000000000000000000000000000000006",
      value: "50000",
      status: "success",
      category: "asset"
    }
  ];

  const validators: ValidatorRecord[] = [
    {
      address: "0xvalidator1",
      moniker: "Validator Alpha",
      status: "active",
      peerCount: 6,
      signedBlocks24h: 7200
    },
    {
      address: "0xvalidator2",
      moniker: "Validator Beta",
      status: "warning",
      peerCount: 5,
      signedBlocks24h: 7104
    }
  ];

  const assets: AssetRecord[] = [
    {
      assetId: "NST-2026-001",
      name: "Nova Settlement Token",
      symbol: "NST",
      assetClass: "Cash equivalent",
      jurisdiction: "AE",
      contractAddress: "0x8F4B0D4CcA83fF4dD08f0f5f2E1f3B9E15B93521",
      issueSize: 25000000,
      issuer: "Treasury Ops",
      treasury: "Primary Treasury Vault",
      status: "Live",
      createdAt: "2026-05-11T10:15:00Z"
    },
    {
      assetId: "NBI-2026-002",
      name: "Nova Bond Income Series A",
      symbol: "NBI-A",
      assetClass: "Bond",
      jurisdiction: "EU",
      contractAddress: "0x6F903A9A517D6fD0f6E0aF5C6404A5e6bB953142",
      issueSize: 12000000,
      issuer: "Capital Markets Desk",
      treasury: "Investor Distribution Vault",
      status: "Bookbuilding",
      createdAt: "2026-05-12T08:00:00Z"
    },
    {
      assetId: "NMM-2026-003",
      name: "Nova Money Market Token",
      symbol: "NMM",
      assetClass: "Fund",
      jurisdiction: "SG",
      contractAddress: "0x4eC74F5E67E43c5f86D1E71B0c8187b2c63B96EE",
      issueSize: 8000000,
      issuer: "Structured Products",
      treasury: "Fund Reserve Wallet",
      status: "Pre-issuance",
      createdAt: "2026-05-12T12:25:00Z"
    }
  ];

  const issuanceRequests: AssetIssuanceRecord[] = [
    {
      id: "AS-104",
      assetId: "NBI-2026-002",
      name: "Nova Bond Income Series A",
      owner: "Capital Markets Desk",
      stage: "Legal review",
      status: "Awaiting checker",
      targetRaise: "$12.0M",
      jurisdiction: "EU"
    },
    {
      id: "AS-105",
      assetId: "NMM-2026-003",
      name: "Nova Money Market Token",
      owner: "Structured Products",
      stage: "Metadata mint prep",
      status: "Scheduled",
      targetRaise: "$8.0M",
      jurisdiction: "SG"
    },
    {
      id: "AS-106",
      assetId: "NCP-2026-004",
      name: "Nova Commercial Paper 30D",
      owner: "Treasury Ops",
      stage: "Compliance screening",
      status: "In review",
      targetRaise: "$5.5M",
      jurisdiction: "AE"
    }
  ];

  return {
    blocks,
    transactions,
    validators,
    assets,
    issuanceRequests,
    metrics: materializeDashboardMetrics(blocks, transactions, validators)
  };
}

async function readValidators(rpcClient: NovaRpcClient): Promise<ValidatorRecord[]> {
  try {
    const [validatorAddresses, peerCountHex] = await Promise.all([
      rpcClient.request<string[]>({ method: "qbft_getValidatorsByBlockNumber", params: ["latest"] }),
      rpcClient.request<string>({ method: "net_peerCount" })
    ]);

    if (!Array.isArray(validatorAddresses) || validatorAddresses.length === 0) {
      return buildFallbackSnapshot().validators;
    }

    const peerCount = hexToNumber(peerCountHex);
    return validatorAddresses.map((address, index) => ({
      address,
      moniker: `Validator ${index + 1}`,
      status: "active",
      peerCount: Math.max(peerCount, 1),
      signedBlocks24h: 0
    }));
  } catch {
    return buildFallbackSnapshot().validators;
  }
}

async function readAssetsFromChain(provider: JsonRpcProvider, assetFactoryAddress: string): Promise<AssetRecord[]> {
  const factory = new Contract(assetFactoryAddress, assetFactoryAbi, provider);
  const definitions = (await factory.getAssets()) as Array<{
    assetToken: string;
    assetId: string;
    assetClass: string;
    jurisdiction: string;
    issueSize: bigint;
    issuer: string;
    createdAt: bigint;
  }>;

  const assets = await Promise.all(
    definitions.map(async (definition) => {
      const token = new Contract(definition.assetToken, assetTokenAbi, provider);
      const [name, symbol, transferEvents] = await Promise.all([
        token.name() as Promise<string>,
        token.symbol() as Promise<string>,
        token.queryFilter(token.filters.Transfer(), 0, "latest")
      ]);

      const firstTransferEvent = transferEvents.find((event): event is EventLog => "args" in event);
      const treasury = firstTransferEvent?.args?.to ? String(firstTransferEvent.args.to) : "Unknown treasury";

      return {
        assetId: definition.assetId,
        name,
        symbol,
        assetClass: definition.assetClass,
        jurisdiction: definition.jurisdiction,
        contractAddress: definition.assetToken,
        issueSize: Number(definition.issueSize),
        issuer: definition.issuer,
        treasury,
        status: "Live" as const,
        createdAt: new Date(Number(definition.createdAt) * 1000).toISOString()
      };
    })
  );

  return assets;
}

async function readRecentBlocks(rpcClient: NovaRpcClient, blockWindowSize: number): Promise<RawRpcBlock[]> {
  const latestBlockHex = await rpcClient.request<string>({ method: "eth_blockNumber" });
  const latestBlock = hexToNumber(latestBlockHex);
  const blockNumbers = Array.from({ length: Math.min(blockWindowSize, latestBlock + 1) }, (_, index) => latestBlock - index);

  const rawBlocks = await Promise.all(
    blockNumbers.map((blockNumber) =>
      rpcClient.request<RawRpcBlock>({
        method: "eth_getBlockByNumber",
        params: [`0x${blockNumber.toString(16)}`, true]
      })
    )
  );

  return rawBlocks.filter(Boolean);
}

export async function buildIndexedSnapshot(config: IndexerConfig): Promise<IndexedSnapshot> {
  const fallback = buildFallbackSnapshot();

  try {
    const rpcClient = new NovaRpcClient(config.rpcUrl);
    const provider = new JsonRpcProvider(config.rpcUrl);
    const deploymentManifest = loadDeploymentManifest(config.deploymentManifestPath);
    const rawBlocks = await readRecentBlocks(rpcClient, config.blockWindowSize);
    const validators = await readValidators(rpcClient);

    const blocks: BlockRecord[] = rawBlocks.map((block, index) => ({
      number: hexToNumber(block.number),
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: toIsoTimestamp(block.timestamp),
      transactionCount: block.transactions.length,
      validator: block.miner ?? validators[index % Math.max(validators.length, 1)]?.moniker ?? "Unknown validator",
      gasUsed: hexToNumber(block.gasUsed)
    }));

    const assetFactoryAddress = deploymentManifest?.contracts?.assetFactory?.address ?? "";
    const settlementTokenAddress =
      deploymentManifest?.contracts?.settlementToken?.address ?? config.settlementTokenAddress ?? "";

    const assets =
      assetFactoryAddress !== ""
        ? await readAssetsFromChain(provider, assetFactoryAddress)
        : fallback.assets;

    const assetAddresses = new Set(assets.map((asset) => asset.contractAddress.toLowerCase()));
    if (assetFactoryAddress) {
      assetAddresses.add(assetFactoryAddress.toLowerCase());
    }

    const transactions: TransactionRecord[] = [];

    for (const block of rawBlocks) {
      for (const transaction of block.transactions) {
        const receipt = await rpcClient.request<RawRpcReceipt>({
          method: "eth_getTransactionReceipt",
          params: [transaction.hash]
        });

        const normalizedTo = transaction.to?.toLowerCase() ?? "";
        const category: TransactionRecord["category"] =
          normalizedTo === settlementTokenAddress.toLowerCase()
            ? "settlement"
            : assetAddresses.has(normalizedTo)
              ? "asset"
              : transaction.to === null
                ? "contract"
                : "admin";

        transactions.push({
          hash: transaction.hash,
          blockNumber: hexToNumber(transaction.blockNumber),
          from: transaction.from,
          to: transaction.to ?? "0x0000000000000000000000000000000000000000",
          value: String(hexToNumber(transaction.value)),
          status: receipt?.status === "0x0" ? "failed" : "success",
          category
        });
      }
    }

    return {
      blocks,
      transactions,
      validators,
      assets,
      issuanceRequests: assetFactoryAddress ? [] : fallback.issuanceRequests,
      metrics: materializeDashboardMetrics(blocks, transactions, validators)
    };
  } catch {
    return fallback;
  }
}
