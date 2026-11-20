import { getDb } from '@revoke.cash/core/db/client';
import { premiumUnmatchedTransfers } from '@revoke.cash/core/db/schema/premium';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import type { Address, Hash } from 'viem';

export interface UnmatchedTransfer {
  id: string;
  chainId: number;
  transactionHash: Hash;
  senderAddress: Address;
  tokenSymbol: string;
  tokenDecimals: number;
  // Raw token units as a decimal string
  amount: string;
  note: string | null;
  dismissedAt: string | null;
  createdAt: string;
}

export interface DismissedUnmatchedTransfer {
  chainId: number;
  transactionHash: Hash;
  senderAddress: Address;
}

// Shared predicate so the admin health count always matches the rows that still need attention
const openUnmatchedTransferConditions = () => isNull(premiumUnmatchedTransfers.dismissedAt);

export const getOpenUnmatchedTransferCount = async (): Promise<number> => {
  const [{ count: openCount }] = await getDb()
    .select({ count: count() })
    .from(premiumUnmatchedTransfers)
    .where(openUnmatchedTransferConditions());

  return openCount;
};

// Dismissed transfers stay in the list after the open ones, because their notes are the only record of what happened
// with the money
export const getUnmatchedTransfers = async (): Promise<UnmatchedTransfer[]> => {
  const unmatchedTransfers = await getDb()
    .select()
    .from(premiumUnmatchedTransfers)
    .orderBy(desc(openUnmatchedTransferConditions()), desc(premiumUnmatchedTransfers.createdAt));

  return unmatchedTransfers.map((unmatchedTransfer) => ({
    id: unmatchedTransfer.id,
    chainId: unmatchedTransfer.chainId,
    transactionHash: unmatchedTransfer.transactionHash,
    senderAddress: unmatchedTransfer.senderAddress,
    tokenSymbol: unmatchedTransfer.tokenSymbol,
    tokenDecimals: unmatchedTransfer.tokenDecimals,
    amount: unmatchedTransfer.amount.toString(),
    note: unmatchedTransfer.note,
    dismissedAt: unmatchedTransfer.dismissedAt?.toISOString() ?? null,
    createdAt: unmatchedTransfer.createdAt.toISOString(),
  }));
};

// Returns null when the transfer does not exist or was already dismissed
export const dismissUnmatchedTransfer = async (
  unmatchedTransferId: string,
  note: string | null,
): Promise<DismissedUnmatchedTransfer | null> => {
  const [dismissedTransfer] = await getDb()
    .update(premiumUnmatchedTransfers)
    .set({ dismissedAt: new Date(), note })
    .where(and(eq(premiumUnmatchedTransfers.id, unmatchedTransferId), openUnmatchedTransferConditions()))
    .returning({
      chainId: premiumUnmatchedTransfers.chainId,
      transactionHash: premiumUnmatchedTransfers.transactionHash,
      senderAddress: premiumUnmatchedTransfers.senderAddress,
    });

  return dismissedTransfer ?? null;
};
