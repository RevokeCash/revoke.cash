// The labels.spenders writers of the labels CLI. They write no audit rows; the CLI does.
import type { DatabaseWriter } from '@revoke.cash/core/db/client';
import { labelsSpenders } from '@revoke.cash/core/db/schema/labels';
import { excluded } from '@revoke.cash/core/db/utils';
import type { SpenderLabelRiskFactor, SpenderLabelWithRole } from '@revoke.cash/core/labels/merge';
import { deduplicateArray } from '@revoke.cash/core/utils';
import { and, eq } from 'drizzle-orm';
import type { Address } from 'viem';

export const setSpenderLabel = async (writer: DatabaseWriter, label: SpenderLabelWithRole): Promise<void> => {
  await writer
    .insert(labelsSpenders)
    .values(label)
    .onConflictDoUpdate({
      target: [labelsSpenders.chainId, labelsSpenders.address],
      set: {
        name: excluded(labelsSpenders.name),
        contractRole: excluded(labelsSpenders.contractRole),
        riskFactors: excluded(labelsSpenders.riskFactors),
      },
    });
};

export const deleteSpenderLabel = async (writer: DatabaseWriter, chainId: number, address: Address): Promise<void> => {
  await writer
    .delete(labelsSpenders)
    .where(and(eq(labelsSpenders.chainId, chainId), eq(labelsSpenders.address, address)));
};

// The one form of a risk_factors list for writes and comparisons: no duplicates, sorted by type and then data, and the
// keys in one order (jsonb returns them as data, type)
export const toStoredRiskFactors = (riskFactors: SpenderLabelRiskFactor[]): SpenderLabelRiskFactor[] => {
  const storedRiskFactors = riskFactors.map(({ type, data }) => (data === undefined ? { type } : { type, data }));
  return deduplicateArray(storedRiskFactors, getRiskFactorSortKey).toSorted((first, second) =>
    getRiskFactorSortKey(first).localeCompare(getRiskFactorSortKey(second)),
  );
};

// A factor without data sorts before the factors of its type with data
const getRiskFactorSortKey = ({ type, data }: SpenderLabelRiskFactor): string => {
  return data === undefined ? type : `${type}=${data}`;
};
