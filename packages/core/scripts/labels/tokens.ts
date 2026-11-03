// The labels.tokens hand-edit writers of the labels CLI. They write no audit rows; the CLI does.
import type { TokenLabelAuditValues } from '@revoke.cash/core/audit/actions';
import type { DatabaseWriter } from '@revoke.cash/core/db/client';
import { labelsTokens } from '@revoke.cash/core/db/schema/labels';
import { and, eq, sql } from 'drizzle-orm';
import type { Address } from 'viem';

// The columns of a hand edit (`yarn labels token set`), which are the audited columns
export type TokenLabelFields = Partial<TokenLabelAuditValues>;

// A hand edit updates only the given columns plus edited_at, in one statement, so an importer update to another column
// that commits while the CLI waits for its prompt is kept. The set edited_at takes the row away from the importer.
// Postgres checks the CHECK constraints on the proposed insert row even when the row exists, so the insert gets the
// whole planned row.
export const editTokenLabel = async (
  writer: DatabaseWriter,
  chainId: number,
  address: Address,
  fields: TokenLabelFields,
  plannedRow: TokenLabelAuditValues,
): Promise<void> => {
  await writer
    .insert(labelsTokens)
    .values({ chainId, address, ...plannedRow, editedAt: sql`now()` })
    .onConflictDoUpdate({
      target: [labelsTokens.chainId, labelsTokens.address],
      set: { ...fields, editedAt: sql`now()` },
    });
};

export const deleteTokenLabel = async (writer: DatabaseWriter, chainId: number, address: Address): Promise<void> => {
  await writer.delete(labelsTokens).where(and(eq(labelsTokens.chainId, chainId), eq(labelsTokens.address, address)));
};
