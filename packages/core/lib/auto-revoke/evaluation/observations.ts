import { type AllowancePayload, AllowanceType, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import { getTransactionalDb } from '@revoke.cash/core/db/client';
import { autoRevokeObservations } from '@revoke.cash/core/db/schema/auto-revoke';
import type { indexerAllowances } from '@revoke.cash/core/db/schema/indexer';
import { toLowercaseAddress } from '@revoke.cash/core/utils';
import { inArray } from 'drizzle-orm';
import type { RuleContext, TriggerDetails } from './rules';

export type Observation = typeof autoRevokeObservations.$inferSelect;
export type IndexedAllowance = typeof indexerAllowances.$inferSelect;

interface ObservationCandidate {
  triggerType: Observation['triggerType'];
  triggerDetails: TriggerDetails;
  ruleSnapshot: RuleContext;
  allowance: TokenAllowanceData;
}

const flattenPayloadIdentity = (payload: AllowancePayload) => ({
  tokenId: payload.type === AllowanceType.ERC721_SINGLE ? payload.tokenId : null,
  permit2Address: payload.type === AllowanceType.PERMIT2 ? payload.permit2Address : null,
  expiration: payload.type === AllowanceType.PERMIT2 ? payload.expiration : null,
});

export const buildAllowanceFingerprint = (allowance: TokenAllowanceData): string => {
  const { payload } = allowance;
  const { tokenId, permit2Address, expiration } = flattenPayloadIdentity(payload);

  return [
    toLowercaseAddress(allowance.owner),
    allowance.chainId,
    payload.type,
    toLowercaseAddress(allowance.token.address),
    toLowercaseAddress(payload.spender),
    tokenId?.toString() ?? '',
    permit2Address ? toLowercaseAddress(permit2Address) : '',
    expiration ?? '',
    payload.lastUpdated.transactionHash.toLowerCase(),
  ].join(':');
};

export const createObservations = async (candidates: ObservationCandidate[]): Promise<Observation[]> => {
  if (candidates.length === 0) return [];

  const observationValues = candidates.map((candidate) => {
    const payload = candidate.allowance.payload;
    const { tokenId, permit2Address, expiration } = flattenPayloadIdentity(payload);

    return {
      address: candidate.allowance.owner,
      chainId: candidate.allowance.chainId,
      triggerType: candidate.triggerType,
      triggerDetails: candidate.triggerDetails,
      ruleSnapshot: candidate.ruleSnapshot,
      allowanceFingerprint: buildAllowanceFingerprint(candidate.allowance),
      allowanceType: payload.type,
      tokenAddress: candidate.allowance.token.address,
      spenderAddress: payload.spender,
      tokenId,
      permit2Address,
      expiration,
      lastUpdatedTxHash: payload.lastUpdated.transactionHash,
    };
  });

  const allowanceFingerprints = observationValues.map((observation) => observation.allowanceFingerprint);

  return getTransactionalDb().transaction(async (trx) => {
    await trx.insert(autoRevokeObservations).values(observationValues).onConflictDoNothing();

    return trx.query.autoRevokeObservations.findMany({
      where: inArray(autoRevokeObservations.allowanceFingerprint, allowanceFingerprints),
    });
  });
};
