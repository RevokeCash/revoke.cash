import type { Edge, Node } from '@xyflow/react';
import type { BlockTag, Chain, GetTransactionReturnType, Hex, PublicClient, TransactionReceipt } from 'viem';
import { type Erc20TransferEvent, TokenEventType, parseTransferLog } from './events';
import { type TokenMetadata, createTokenContract, getTokenMetadata } from './tokens';

export interface TokenTransfer {
  metadata: TokenMetadata;
  event: Erc20TransferEvent;
  [key: string]: any;
}

export type TransactionData = GetTransactionReturnType<Chain, BlockTag>;
export type GraphEdge = Edge;
export type GraphNode = Node<TransactionInfo | TokenTransfer>;

export enum TransactionType {
  UNKNOWN = 'unknown',
  TRANSFER = 'transfer',
  SWAP = 'swap',
  APPROVAL = 'approval',
}

export interface TransactionInfo {
  block: number;
  tokens: Set<string>;
  recipients: Set<Hex>;
  transfers: TokenTransfer[];
  receipt: TransactionReceipt;
  predecessorHash?: Hex | null;
  transactionType?: TransactionType;
  swapDetails?: {
    tokenIn?: TokenTransfer; // Token received
    tokenOut?: TokenTransfer; // Token sent out
  };
  activeToken?: TokenTransfer; // Holds the token received (active token)
  [key: string]: any;
}

/**
 * Builds a graph by starting the recursive tracking at the given transaction hash.
 */
export async function buildGraph(publicClient: PublicClient, hash: Hex, maxDepth: number = 2) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const processedTxs = new Set<string>();
  const depthXPositions: Record<number, { left: number; right: number }> = {};

  // Start recursive tracking without an active token.
  await trackTransactionsRecursively(publicClient, hash, nodes, edges, processedTxs, 0, maxDepth, depthXPositions, 0);

  return { nodes, edges };
}

/**
 * Recursively tracks transactions, adds nodes/edges to the graph, and propagates the active token if set.
 */
async function trackTransactionsRecursively(
  publicClient: PublicClient,
  hash: Hex,
  nodes: GraphNode[],
  edges: GraphEdge[],
  processedTxs: Set<string>,
  currentDepth: number,
  maxDepth: number,
  depthXPositions: Record<number, { left: number; right: number }>,
  parentX: number,
  isLeft: boolean = false,
  activeToken?: TokenTransfer, // Propagate active token from a previous swap
) {
  if (processedTxs.has(hash) || currentDepth > maxDepth) return;
  processedTxs.add(hash);

  const txinfo = await getTransactionInfo(publicClient, hash);
  if (txinfo.transfers.length === 0) {
    console.log(`Skipping node with hash ${hash} because it has no transfers`);
    return;
  }

  const currentActiveToken =
    txinfo.transactionType === TransactionType.SWAP && txinfo.activeToken ? txinfo.activeToken : activeToken;
  if (txinfo.transactionType === TransactionType.SWAP && txinfo.activeToken) {
    console.log('New active token set:', JSON.stringify(activeToken, null, 2));
  }

  const nodeSpacing = 400;
  const levelSpacing = 300;
  const nodeWidth = 300;
  const nodeHeight = 200;
  if (!depthXPositions[currentDepth]) {
    depthXPositions[currentDepth] = { left: 0, right: 0 };
  }

  // Calculate x-position for the current node.
  let xPos: number;
  if (currentDepth === 0) {
    xPos = 0;
  } else {
    xPos = isLeft ? parentX - nodeSpacing : parentX + nodeSpacing;
    if (isLeft) {
      depthXPositions[currentDepth].left = Math.min(depthXPositions[currentDepth].left, xPos);
    } else {
      depthXPositions[currentDepth].right = Math.max(depthXPositions[currentDepth].right, xPos);
    }
  }
  const yPos = currentDepth * levelSpacing;

  // Add the current transaction as a node.
  nodes.push({
    id: hash,
    data: txinfo,
    type: 'transaction',
    position: { x: xPos, y: yPos },
    style: { width: nodeWidth, height: nodeHeight },
  });

  // Add an edge from the parent if not the root.
  if (currentDepth > 0) {
    edges.push({
      id: `${parentX}-${hash}`,
      source: nodes.find((n) => n.position.x === parentX && n.position.y === yPos - levelSpacing)?.id || '',
      target: hash,
      type: 'transaction',
      style: { stroke: '#888', strokeWidth: 2 },
    });
  }

  let nextRecipients: Set<Hex>;
  if (currentActiveToken) {
    nextRecipients = new Set(
      txinfo.transfers
        .filter(
          (transfer) =>
            transfer.metadata.symbol === currentActiveToken.metadata.symbol &&
            transfer.event.payload.from.toLowerCase() === txinfo.receipt.from.toLowerCase(),
        )
        .map((transfer) => transfer.event.payload.to),
    );
  } else {
    nextRecipients = txinfo.recipients;
  }
  console.log('the currrent Active token: ', currentActiveToken);

  if (currentDepth < maxDepth) {
    let childIndex = 0;
    for (const addr of nextRecipients) {
      const transactions = await getTransactions(publicClient, addr, txinfo.block, txinfo.block + 300000);
      for (const tx of transactions) {
        const isLeftChild = childIndex % 2 === 0;
        await trackTransactionsRecursively(
          publicClient,
          tx.hash,
          nodes,
          edges,
          processedTxs,
          currentDepth + 1,
          maxDepth,
          depthXPositions,
          xPos,
          isLeftChild,
          currentActiveToken, // Propagate the active token down the recursion
        );
        childIndex++;
      }
    }
  }
}

/**
 * Retrieves and parses transaction details including token transfer events.
 */
async function getTransactionInfo(publicClient: PublicClient, hash: Hex): Promise<TransactionInfo> {
  const transaction = await publicClient.getTransactionReceipt({ hash });
  const tokens: Set<string> = new Set();
  const recipients: Set<Hex> = new Set();

  const logs = transaction.logs
    .filter((log) => log.topics.length > 0)
    .map((log) => ({
      ...log,
      blockNumber: Number(log.blockNumber),
      topics: log.topics as [Hex, ...Hex[]],
    }));

  const transfers: TokenTransfer[] = [];
  for (const log of logs) {
    try {
      console.log(`Parsing log: ${JSON.stringify(log, null, 2)}`);
      if (!publicClient.chain?.id) {
        throw new Error('Chain ID is not available. Please ensure you are connected to the correct network.');
      }
      const parsedEvent = parseTransferLog(log, publicClient.chain.id, log.address);
      if (parsedEvent?.type === TokenEventType.TRANSFER_ERC20) {
        tokens.add(parsedEvent.token);
        recipients.add(parsedEvent.payload.to);
        const contract = createTokenContract(parsedEvent, publicClient);
        if (!contract) {
          throw new Error(`Failed to create contract for token: ${parsedEvent.token}`);
        }
        const metadata = await getTokenMetadata(contract, publicClient.chain.id);
        transfers.push({
          metadata,
          event: parsedEvent as Erc20TransferEvent,
        });
      }
    } catch (error) {
      console.error(`Error parsing transfer log: ${error}`);
    }
  }

  const txInfo: TransactionInfo = {
    hash,
    tokens,
    transfers,
    recipients,
    receipt: transaction,
    block: Number(transaction.blockNumber),
    transactionType: TransactionType.UNKNOWN,
  };

  detectSwap(txInfo);
  console.log(`Transaction type: ${JSON.stringify(txInfo.transactionType, null, 2)}`);
  return txInfo;
}

const getTransactions = async (
  publicClient: PublicClient,
  address: Hex,
  startBlock: number,
  endBlock: number,
  sourceHash?: Hex,
): Promise<TransactionInfo[]> => {
  const params = {
    address,
    endBlock: endBlock.toString(),
    startBlock: startBlock.toString(),
  };

  const chainId = publicClient.chain?.id;
  if (!chainId) {
    throw new Error('Chain ID is not available. Please ensure you are connected to the correct network.');
  }

  const response = await fetch(`/api/${chainId}/transactions?${new URLSearchParams(params)}`);
  const data = await response.json();
  console.log('Data type: ', typeof data);

  return Promise.all(
    data.transactions.map(async (tx: any) => {
      const receipt = await publicClient.getTransactionReceipt({ hash: tx.hash as Hex });
      const tokens = new Set<string>();
      const recipients = new Set<Hex>();
      const transfers: TokenTransfer[] = [];

      for (const log of receipt.logs) {
        try {
          const parsedEvent = parseTransferLog(
            {
              ...log,
              blockNumber: Number(log.blockNumber),
              topics: log.topics as [Hex, ...Hex[]],
            },
            chainId,
            log.address,
          );

          if (parsedEvent?.type === TokenEventType.TRANSFER_ERC20) {
            tokens.add(parsedEvent.token);
            recipients.add(parsedEvent.payload.to);
            const contract = createTokenContract(parsedEvent, publicClient);
            if (!contract) {
              throw new Error(`Failed to create contract for token: ${parsedEvent.token}`);
            }
            const metadata = await getTokenMetadata(contract, chainId);
            transfers.push({
              metadata,
              event: parsedEvent as Erc20TransferEvent,
            });
          }
        } catch (error) {
          console.error(`Error parsing transfer log: ${error}`);
        }
      }

      return {
        tokens,
        receipt,
        transfers,
        recipients,
        hash: tx.hash as Hex,
        block: Number(tx.blockNumber),
        predecessorHash: sourceHash || null,
      };
    }),
  );
};

/**
 * Detects if the transaction is a swap by examining its transfers.
 * If a swap is detected, assigns tokenIn as the token received and tokenOut as the token sent,
 * and sets the activeToken to the token received.
 */
function detectSwap(txInfo: TransactionInfo): void {
  if (txInfo.transfers.length < 2) {
    txInfo.transactionType = txInfo.transfers.length === 1 ? TransactionType.TRANSFER : TransactionType.UNKNOWN;
    return;
  }

  const userAddress = txInfo.receipt.from.toLowerCase();

  // Find transfers where the user sent tokens (tokenOut).
  const tokensOut = txInfo.transfers.filter((transfer) => transfer.event.payload.from.toLowerCase() === userAddress);
  // Find transfers where the user received tokens (tokenIn).
  const tokensIn = txInfo.transfers.filter((transfer) => transfer.event.payload.to.toLowerCase() === userAddress);

  if (tokensOut.length > 0 && tokensIn.length > 0) {
    txInfo.transactionType = TransactionType.SWAP;
    // Note: Adjust the order if needed. Here we assume the user receives (tokensIn) and sends (tokensOut)
    txInfo.swapDetails = {
      tokenIn: tokensIn[0],
      tokenOut: tokensOut[0],
    };
    // Use the received token as the active token.
    txInfo.activeToken = tokensIn[0];
    console.log(`Detected swap: ${tokensOut[0].metadata.symbol} → ${tokensIn[0].metadata.symbol}`);
  } else if (tokensOut.length > 0) {
    txInfo.transactionType = TransactionType.TRANSFER;
  }
}
