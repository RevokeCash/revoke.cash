import { getTransactionalDb } from '@revoke.cash/core/db/client';
import {
  type AutoRevokeRuleSnapshot,
  type AutoRevokeTriggerDetails,
  autoRevokeObservations,
} from '@revoke.cash/core/db/schema/auto-revoke';
import type { indexerAllowances } from '@revoke.cash/core/db/schema/indexer';
import { and, inArray } from 'drizzle-orm';
import type { Address } from 'viem';

export type AutoRevokeObservation = typeof autoRevokeObservations.$inferSelect;
export type AutoRevokeObservationInsert = typeof autoRevokeObservations.$inferInsert;
export type IndexedAllowance = typeof indexerAllowances.$inferSelect;

export interface AutoRevokeObservationCandidate {
  subscriptionId: string;
  address: Address;
  chainId: number;
  triggerType: AutoRevokeObservation['triggerType'];
  triggerDetails: AutoRevokeTriggerDetails;
  ruleSnapshot: AutoRevokeRuleSnapshot;
  allowance: IndexedAllowance;
}

export const buildAllowanceFingerprint = (allowance: IndexedAllowance): string => {
  const tokenId = allowance.tokenId?.toString() ?? '';
  const permit2Address = allowance.permit2Address ?? '';

  return [
    allowance.address,
    allowance.chainId,
    allowance.allowanceType,
    allowance.tokenAddress,
    allowance.spenderAddress,
    tokenId,
    permit2Address,
    allowance.expiration ?? '',
    allowance.lastUpdatedTxHash,
  ].join(':');
};

export const createAutoRevokeObservations = async (
  candidates: AutoRevokeObservationCandidate[],
): Promise<AutoRevokeObservation[]> => {
  if (candidates.length === 0) return [];

  const observationValues = candidates.map((candidate) => ({
    subscriptionId: candidate.subscriptionId,
    address: candidate.address,
    chainId: candidate.chainId,
    triggerType: candidate.triggerType,
    triggerDetails: candidate.triggerDetails,
    ruleSnapshot: candidate.ruleSnapshot,
    allowanceFingerprint: buildAllowanceFingerprint(candidate.allowance),
    allowanceType: candidate.allowance.allowanceType,
    tokenAddress: candidate.allowance.tokenAddress,
    spenderAddress: candidate.allowance.spenderAddress,
    tokenId: candidate.allowance.tokenId,
    permit2Address: candidate.allowance.permit2Address,
    expiration: candidate.allowance.expiration,
    lastUpdatedTxHash: candidate.allowance.lastUpdatedTxHash,
  }));
  const allowanceFingerprints = observationValues.map((observation) => observation.allowanceFingerprint);
  const subscriptionIds = observationValues.map((observation) => observation.subscriptionId);
  const observationKeys = new Set(
    observationValues.map((observation) =>
      getObservationKey(observation.subscriptionId, observation.allowanceFingerprint),
    ),
  );

  return getTransactionalDb().transaction(async (trx) => {
    await trx.insert(autoRevokeObservations).values(observationValues).onConflictDoNothing();

    const observations = await trx.query.autoRevokeObservations.findMany({
      where: and(
        inArray(autoRevokeObservations.subscriptionId, subscriptionIds),
        inArray(autoRevokeObservations.allowanceFingerprint, allowanceFingerprints),
      ),
    });

    return observations.filter((observation) =>
      observationKeys.has(getObservationKey(observation.subscriptionId, observation.allowanceFingerprint)),
    );
  });
};

const getObservationKey = (subscriptionId: string, allowanceFingerprint: string): string =>
  `${subscriptionId}:${allowanceFingerprint}`;
