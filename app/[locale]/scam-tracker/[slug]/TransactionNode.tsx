'use client';

import React from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { formatEther } from 'viem';
import Card from 'components/common/Card';

interface TransactionData {
  address: string;
  amount?: string;
  token?: string;
  type: 'sender' | 'receiver';
  timestamp?: number;
}

interface TransactionNodeData  extends Record<string, unknown>{
  transaction: TransactionData;
}

type TransactionNodeType = Node<TransactionNodeData>;

const TransactionNode = ({ data }: NodeProps<TransactionNodeType>) => {
  // Extract your domain data from the wrapper
  const { transaction } = data;

  return (
    <Card className="p-4 min-w-[200px]">
      <Handle type="target" position={Position.Top} />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-medium ${
              transaction.type === 'sender' ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {transaction.type === 'sender' ? 'From' : 'To'}
          </span>
          <span className="text-xs opacity-50">
            {transaction.timestamp
              ? new Date(transaction.timestamp * 1000).toLocaleString()
              : ''}
          </span>
        </div>
        <div className="text-sm font-mono break-all">{transaction.address}</div>
        {transaction.amount && (
          <div className="text-sm">
            {formatEther(BigInt(transaction.amount))} {transaction.token}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

export default TransactionNode;
