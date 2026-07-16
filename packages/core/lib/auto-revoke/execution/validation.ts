import { getDb } from '@revoke.cash/core/db/client';
import { indexerAllowances } from '@revoke.cash/core/db/schema/indexer';
import { eqOrIsNull } from '@revoke.cash/core/db/utils';
import { serializeAllowanceFromRow } from '@revoke.cash/core/indexer/allowances';
import { getCompleteSpenderMetadata } from '@revoke.cash/core/indexer/spender-metadata';
import { getCompleteTokenMetadata, isUsableTokenMetadata } from '@revoke.cash/core/indexer/token-metadata';
import { DAY } from '@revoke.cash/core/utils/time';
import { and, eq } from 'drizzle-orm';
import type { ActionFailure } from '../actions';
import type { IndexedAllowance, Observation } from '../evaluation/observations';
import { getEffectiveRules, getMatchedTriggers } from '../evaluation/rules';
import {
  findActivePermission,
  isPermissionEnabledOnChain,
  markPermissionRevoked,
  type PermissionRecord,
} from '../permissions';
import { findBillingSubscriptionIds } from './budget';

export type EligibilityResult = { failure: ActionFailure } | { permission: PermissionRecord; isUrgent: boolean };

// Returns the permission to execute with, or the failure that parks the action
export const checkExecutionEligibility = async (observation: Observation): Promise<EligibilityResult> => {
  // The permission is checked before anything else: unlike blocked_budget and queued, that state is hidden from
  // the activity feed and only wakes when the user grants the permission.
  const permission = await findActivePermission(observation.address, observation.chainId);
  if (!permission) {
    return { failure: { status: 'blocked_permission', errorCode: 'missing_permission' } };
  }

  if (!(await isPermissionEnabledOnChain(permission))) {
    await markPermissionRevoked(permission.id);
    return { failure: { status: 'blocked_permission', errorCode: 'permission_disabled' } };
  }

  // No billable subscription is a waiting state, not a terminal one: a subscription can lapse and
  // renew, or the address can be re-added to one, so the action resumes through the normal retry loop.
  const billingSubscriptionIds = await findBillingSubscriptionIds(getDb(), observation.address);
  if (billingSubscriptionIds.length === 0) {
    return {
      failure: {
        status: 'blocked_budget',
        errorCode: 'subscription_inactive',
        nextRetryAt: new Date(Date.now() + DAY),
      },
    };
  }

  const row = await getObservationAllowanceRow(observation);
  if (!row) return { failure: { status: 'skipped', errorCode: 'allowance_not_found' } };

  const [spenderMetadataByAddress, tokenMetadataByAddress, { rules }] = await Promise.all([
    getCompleteSpenderMetadata(observation.chainId, [observation.spenderAddress]),
    getCompleteTokenMetadata(observation.chainId, [observation.tokenAddress]),
    getEffectiveRules(observation.address),
  ]);

  const tokenMetadata = tokenMetadataByAddress.get(observation.tokenAddress);
  if (!isUsableTokenMetadata(tokenMetadata))
    return { failure: { status: 'skipped', errorCode: 'token_metadata_unusable' } };

  const spenderMetadata = spenderMetadataByAddress.get(observation.spenderAddress);
  const allowance = serializeAllowanceFromRow(row, tokenMetadata!, spenderMetadata);

  const matchedTriggers = getMatchedTriggers(allowance, rules);
  if (matchedTriggers.length === 0) {
    return { failure: { status: 'blocked_rules', errorCode: 'rules_no_longer_match' } };
  }

  const isUrgent = matchedTriggers.some((trigger) => trigger.type === 'exploit');
  return { permission, isUrgent };
};

const getObservationAllowanceRow = async (observation: Observation): Promise<IndexedAllowance | null> => {
  const allowance = await getDb().query.indexerAllowances.findFirst({
    where: and(
      eq(indexerAllowances.address, observation.address),
      eq(indexerAllowances.chainId, observation.chainId),
      eq(indexerAllowances.tokenAddress, observation.tokenAddress),
      eq(indexerAllowances.spenderAddress, observation.spenderAddress),
      eq(indexerAllowances.allowanceType, observation.allowanceType),
      eqOrIsNull(indexerAllowances.tokenId, observation.tokenId),
      eqOrIsNull(indexerAllowances.permit2Address, observation.permit2Address),
      eqOrIsNull(indexerAllowances.expiration, observation.expiration),
      eq(indexerAllowances.lastUpdatedTxHash, observation.lastUpdatedTxHash),
    ),
  });

  return allowance ?? null;
};
