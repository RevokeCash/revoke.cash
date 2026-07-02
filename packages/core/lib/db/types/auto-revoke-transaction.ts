import { customType } from 'drizzle-orm/pg-core';
import type { Hash, Hex } from 'viem';

export interface AutoRevokeActionTransaction {
  txHash: Hash;
  txHashes: Hash[];
  rawTransaction: Hex;
  nonce: number;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedGas: bigint;
  finalGasUsed: bigint | null;
  broadcastedAt: Date | null;
}

// Mirrors Drizzle's built-in jsonb round-trip (stringify on write, parse on read), with the
// bigint/Date codec layered on top — the same boundary trick as lowercaseAddress does for text.
export const autoRevokeTransaction = customType<{ data: AutoRevokeActionTransaction; driverData: string }>({
  dataType() {
    return 'jsonb';
  },
  toDriver(value) {
    return JSON.stringify({
      txHash: value.txHash,
      txHashes: value.txHashes,
      rawTransaction: value.rawTransaction,
      nonce: value.nonce,
      maxFeePerGas: value.maxFeePerGas.toString(),
      maxPriorityFeePerGas: value.maxPriorityFeePerGas.toString(),
      estimatedGas: value.estimatedGas.toString(),
      finalGasUsed: value.finalGasUsed?.toString() ?? null,
      broadcastedAt: value.broadcastedAt?.toISOString() ?? null,
    });
  },
  fromDriver(value) {
    const data = typeof value === 'string' ? JSON.parse(value) : value;
    return {
      txHash: data.txHash,
      txHashes: data.txHashes,
      rawTransaction: data.rawTransaction,
      nonce: data.nonce,
      maxFeePerGas: BigInt(data.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(data.maxPriorityFeePerGas),
      estimatedGas: BigInt(data.estimatedGas),
      finalGasUsed: data.finalGasUsed != null ? BigInt(data.finalGasUsed) : null,
      broadcastedAt: data.broadcastedAt ? new Date(data.broadcastedAt) : null,
    };
  },
});
