'use client';

import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';
import Card from 'components/common/Card';
import ChainOverlayLogo from 'components/common/ChainOverlayLogo';
import { formatBalance, shortenAddress } from 'lib/utils/formatting';
import type { TransactionInfo } from 'lib/utils/token-tracking';

type TransactionNodeType = Node<TransactionInfo>;

const TransactionNode = ({ data }: NodeProps<TransactionNodeType>) => {
  // Format all amounts as a comma-separated list
  const amounts = data.transfers
    .map((transfer) =>
      formatBalance(
        transfer.metadata.symbol, // Don't include symbol in the formatted balance
        transfer.event.payload.amount,
        transfer.metadata.decimals,
      ).trim(),
    )
    .join(', ');

  // Get unique recipient addresses from transfers
  const recipientAddresses = [...data.recipients].map((address) => shortenAddress(address));

  // Maximum number of token logos to display
  const MAX_LOGOS = 5;

  const uniqueTokens = new Set();
  const uniqueTransfers = data.transfers.filter((transfer) => {
    const key = `${transfer.metadata.symbol}-${transfer.event.chainId}`;
    if (!uniqueTokens.has(key)) {
      uniqueTokens.add(key);
      return true;
    }
    return false;
  });

  const hasMoreTokens = uniqueTransfers.length > MAX_LOGOS;

  return (
    <Card className="p-2 min-w-[300px] min-h-[200px] cursor-pointer relative">
      <Handle type="target" position={Position.Top} />
      <div className="flex flex-col gap-1 mb-2">
        <div className="text-xs font-bold">Tx: {shortenAddress(data.receipt.transactionHash)}</div>
        <div className="text-xs">From: {shortenAddress(data.receipt.from)}</div>
        {/* Display recipient addresses */}
        {recipientAddresses.length > 0 && <div className="text-xs mt-1">To: {recipientAddresses.join(', ')}</div>}

        {/* Amounts Seperated by commas */}
        <div className="text-xs">Amount: {amounts}</div>

        {/* Display token logos in a row */}
        <div className="flex items-center gap-1 text-xs mt-1">
          Token Type:
          <div className="flex items-center gap-1 flex-wrap">
            {uniqueTransfers.slice(0, MAX_LOGOS).map((transfer) => (
              <ChainOverlayLogo
                key={`${transfer.metadata.symbol}-${transfer.event.chainId}`}
                src={transfer.metadata.icon}
                alt={transfer.metadata.symbol}
                chainId={transfer.event.chainId}
                size={20}
                overlaySize={0}
              />
            ))}
            {hasMoreTokens && <span className="text-xs">...</span>}
          </div>
        </div>

        <div className="text-xs font-semibold mt-1">Transfers: {data.transfers.length}</div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

export default TransactionNode;
