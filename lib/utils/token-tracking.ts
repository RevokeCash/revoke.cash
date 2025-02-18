import { type Address, type Hash, type PublicClient, type TransactionReceipt } from 'viem';
import { Log, parseTransferLog, TokenEventType, Erc20TransferEvent } from './events';
import { Hex } from 'viem';

export interface TokenTrackingData {
  address: Address;
  tokenTransfers: Erc20TransferEvent[];
  timestamp: number;
}

export async function getTokenTransfers(publicClient: PublicClient, txHash: Hash): Promise<Erc20TransferEvent[]> {
  try {
    if (!publicClient.chain?.id) {
      throw new Error('Chain ID is not available. Please ensure you are connected to the correct network.');
    }

    const receipt = await publicClient.getTransactionReceipt({ hash: txHash }).catch((error) => {
      throw new Error(`Failed to fetch transaction receipt: ${error.message}`);
    });

    const convertedLogs = receipt.logs
      .filter((log) => log.topics.length > 0)
      .map((log) => ({
        ...log,
        blockNumber: Number(log.blockNumber),
        topics: log.topics as [Hex, ...Hex[]],
      }));

    const transfers: Erc20TransferEvent[] = [];

    // Directly parse transfer logs
    for (const log of convertedLogs) {
      try {
        const parsedEvent = parseTransferLog(log, publicClient.chain.id, log.address);
        if (parsedEvent?.type === TokenEventType.TRANSFER_ERC20) {
          transfers.push(parsedEvent as Erc20TransferEvent);
        }
      } catch (error) {
        console.error(`Error parsing transfer log: ${error}`);
        continue;
      }
    }

    // Get subsequent transfers from new addresses
    const subsequentTransfers = await getSubsequentTransfers(publicClient, transfers, receipt.blockNumber);

    // Identify potential swaps by analyzing transfers within the same transaction
    const swapTransfers = identifySwaps(transfers);

    return [...transfers, ...subsequentTransfers, ...swapTransfers];
  } catch (error) {
    console.error('Error in getTokenTransfers:', error);
    throw error;
  }
}

async function getSubsequentTransfers(
  publicClient: PublicClient,
  initialTransfers: Erc20TransferEvent[],
  fromBlock: bigint
): Promise<Erc20TransferEvent[]> {
  const subsequentTransfers: Erc20TransferEvent[] = [];
  const processedAddresses = new Set<string>();

  for (const transfer of initialTransfers) {
    if (processedAddresses.has(transfer.payload.to)) continue;
    processedAddresses.add(transfer.payload.to);

    try {
      const logs = await publicClient.getLogs({
        address: transfer.token,
        event: {
          type: 'event',
          name: 'Transfer',
          inputs: [
            { type: 'address', name: 'from', indexed: true },
            { type: 'address', name: 'to', indexed: true },
            { type: 'uint256', name: 'amount', indexed: false }
          ]
        },
        fromBlock,
        args: {
          from: transfer.payload.to as Address
        }
      });

      const convertedLogs = logs
        .filter((log) => log.topics.length > 0)
        .map((log) => ({
          ...log,
          blockNumber: Number(log.blockNumber),
          topics: log.topics as [Hex, ...Hex[]],
        }));

      for (const log of convertedLogs) {
        const parsedEvent = parseTransferLog(log, publicClient.chain?.id ?? 1, log.address);
        if (parsedEvent && parsedEvent.type === TokenEventType.TRANSFER_ERC20) {
          subsequentTransfers.push(parsedEvent);
        }
      }
    } catch (error) {
      console.error(`Error fetching subsequent transfers: ${error}`);
      continue;
    }
  }

  return subsequentTransfers;
}

function identifySwaps(transfers: Erc20TransferEvent[]): Erc20TransferEvent[] {
  const swapTransfers: Erc20TransferEvent[] = [];
  const addressPairs = new Map<string, Set<string>>();

  // Group transfers by from/to address pairs
  transfers.forEach(transfer => {
    const key = `${transfer.payload.from}-${transfer.payload.to}`;
    if (!addressPairs.has(key)) {
      addressPairs.set(key, new Set());
    }
    addressPairs.get(key)?.add(transfer.token);
  });

  // If we see multiple tokens transferred between the same addresses, it's likely a swap
  addressPairs.forEach((tokens, key) => {
    if (tokens.size > 1) {
      const [from, to] = key.split('-');
      tokens.forEach(token => {
        const relevantTransfers = transfers.filter(
          t => t.payload.from === from && t.payload.to === to && t.token === token
        );
        swapTransfers.push(...relevantTransfers);
      });
    }
  });

  return swapTransfers;
}

export function trackTokenTransfers(transfers: Erc20TransferEvent[], timestamp: number): TokenTrackingData[] {
  const addressMap = new Map<string, TokenTrackingData>();

  transfers.forEach((transfer) => {
    // Track sender
    if (!addressMap.has(transfer.payload.from)) {
      addressMap.set(transfer.payload.from, {
        address: transfer.payload.from as Address,
        tokenTransfers: [],
        timestamp,
      });
    }
    addressMap.get(transfer.payload.from)?.tokenTransfers.push(transfer);

    // Track receiver
    if (!addressMap.has(transfer.payload.to)) {
      addressMap.set(transfer.payload.to, {
        address: transfer.payload.to as Address,
        tokenTransfers: [],
        timestamp,
      });
    }
    addressMap.get(transfer.payload.to)?.tokenTransfers.push(transfer);
  });

  return Array.from(addressMap.values());
}

export function analyzeTokenFlow(trackingData: TokenTrackingData[]): {
  incomingVolume: Map<string, number>;
  outgoingVolume: Map<string, number>;
} {
  const incomingVolume = new Map<string, number>();
  const outgoingVolume = new Map<string, number>();

  trackingData.forEach((data) => {
    data.tokenTransfers.forEach((transfer) => {
      const amount = Number(transfer.payload.amount);
      const token = transfer.token;

      if (transfer.payload.to === data.address) {
        incomingVolume.set(token, (incomingVolume.get(token) || 0) + amount);
      } else if (transfer.payload.from === data.address) {
        outgoingVolume.set(token, (outgoingVolume.get(token) || 0) + amount);
      }
    });
  });

  return { incomingVolume, outgoingVolume };
}

export interface GraphNode {
  id: string;
  label: string;
  value: number; // Size of node based on transaction volume
}

export interface GraphEdge {
  from: string;
  to: string;
  value: number; // Width of edge based on transfer amount
  label: string;
  token: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraphData(transfers: Erc20TransferEvent[]): GraphData {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  transfers.forEach((transfer) => {
    const { from, to } = transfer.payload;
    const amount = Number(transfer.payload.amount);

    // Add or update nodes
    if (!nodes.has(from)) {
      nodes.set(from, {
        id: from,
        label: `${from.slice(0, 6)}...${from.slice(-4)}`,
        value: 0
      });
    }
    if (!nodes.has(to)) {
      nodes.set(to, {
        id: to,
        label: `${to.slice(0, 6)}...${to.slice(-4)}`,
        value: 0
      });
    }

    // Update node values based on transaction volume
    nodes.get(from)!.value += amount;
    nodes.get(to)!.value += amount;

    // Create or update edge
    const edgeId = `${from}-${to}-${transfer.token}`;
    if (!edges.has(edgeId)) {
      edges.set(edgeId, {
        from,
        to,
        value: 0,
        label: '',
        token: transfer.token
      });
    }
    const edge = edges.get(edgeId)!;
    edge.value += amount;
    edge.label = `${edge.value.toFixed(2)} tokens`;
  });

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values())
  };
}