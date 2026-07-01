import { AllowanceType, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import { getTransactionalDb } from '@revoke.cash/core/db/client';
import { autoRevokeObservations } from '@revoke.cash/core/db/schema/auto-revoke';
import type { indexerAllowances } from '@revoke.cash/core/db/schema/indexer';
import { and, inArray } from 'drizzle-orm';
import type { RuleContext, TriggerDetails } from './rules';

export type Observation = typeof autoRevokeObservations.$inferSelect;
export type IndexedAllowance = typeof indexerAllowances.$inferSelect;

interface ObservationCandidate {
  subscriptionId: string;
  triggerType: Observation['triggerType'];
  triggerDetails: TriggerDetails;
  ruleSnapshot: RuleContext;
  allowance: TokenAllowanceData;
}

export const buildAllowanceFingerprint = (allowance: TokenAllowanceData): string => {
  const payload = allowance.payload;
  if (!payload) throw new Error('Cannot fingerprint an allowance without a payload');

  return [
    allowance.owner,
    allowance.chainId,
    payload.type,
    allowance.token.address,
    payload.spender,
    payload.type === AllowanceType.ERC721_SINGLE ? (payload.tokenId?.toString() ?? '') : '',
    payload.type === AllowanceType.PERMIT2 ? payload.permit2Address : '',
    payload.type === AllowanceType.PERMIT2 ? payload.expiration : '',
    payload.lastUpdated.transactionHash,
  ].join(':');
};

export const createObservations = async (candidates: ObservationCandidate[]): Promise<Observation[]> => {
  if (candidates.length === 0) return [];

  const observationValues = candidates.map((candidate) => {
    const payload = candidate.allowance.payload;
    if (!payload) throw new Error('Cannot create an observation for an allowance without a payload');

    return {
      subscriptionId: candidate.subscriptionId,
      address: candidate.allowance.owner,
      chainId: candidate.allowance.chainId,
      triggerType: candidate.triggerType,
      triggerDetails: candidate.triggerDetails,
      ruleSnapshot: candidate.ruleSnapshot,
      allowanceFingerprint: buildAllowanceFingerprint(candidate.allowance),
      allowanceType: payload.type,
      tokenAddress: candidate.allowance.token.address,
      spenderAddress: payload.spender,
      tokenId: payload.type === AllowanceType.ERC721_SINGLE ? payload.tokenId : null,
      permit2Address: payload.type === AllowanceType.PERMIT2 ? payload.permit2Address : null,
      expiration: payload.type === AllowanceType.PERMIT2 ? payload.expiration : null,
      lastUpdatedTxHash: payload.lastUpdated.transactionHash,
    };
  });

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
