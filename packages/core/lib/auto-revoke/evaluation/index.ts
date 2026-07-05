import { isAutoRevokeSupportedChain } from '@revoke.cash/core/auto-revoke/config';
import { getDb } from '@revoke.cash/core/db/client';
import { indexerAllowances } from '@revoke.cash/core/db/schema/indexer';
import type { Exploit } from '@revoke.cash/core/exploits';
import { loadEnrichedAddressAllowances } from '@revoke.cash/core/indexer/allowances-read';
import { isAllowanceCacheFresh } from '@revoke.cash/core/indexer/cache-state';
import { addSpenderRiskFactor } from '@revoke.cash/core/indexer/spender-metadata';
import { isNullish } from '@revoke.cash/core/utils';
import { and, eq, or } from 'drizzle-orm';
import type { Address } from 'viem';
import { findBillingSubscriptionIds } from '../execution/budget';
import { createObservations, type Observation } from './observations';
import { getEffectiveRules, getMatchedTriggers, getPrimaryTrigger } from './rules';

export interface EvaluationResult {
  skipped: boolean;
  observations: Observation[];
  reason?: SkipReason;
}

type SkipReason =
  | 'unsupported_chain'
  | 'allowance_cache_not_fresh'
  | 'no_active_ultimate_subscription'
  | 'no_allowances'
  | 'no_matches'
  | 'no_observations';

export interface ExploitAffectedAddress {
  address: Address;
  chainId: number;
}

const skipWithReason = (reason: SkipReason): EvaluationResult => ({
  skipped: true,
  observations: [],
  reason,
});

export const evaluateAddress = async (address: Address, chainId: number): Promise<EvaluationResult> => {
  if (!isAutoRevokeSupportedChain(chainId)) return skipWithReason('unsupported_chain');

  const cacheFresh = await isAllowanceCacheFresh(address, chainId);
  if (!cacheFresh) return skipWithReason('allowance_cache_not_fresh');

  const billingSubscriptionIds = await findBillingSubscriptionIds(getDb(), address);
  if (billingSubscriptionIds.length === 0) return skipWithReason('no_active_ultimate_subscription');

  const allowances = await loadEnrichedAddressAllowances(address, chainId);
  if (allowances.length === 0) return skipWithReason('no_allowances');

  const ruleSnapshot = await getEffectiveRules(address);

  const candidates = allowances
    .map((allowance) => {
      const matchedTriggers = getMatchedTriggers(allowance, ruleSnapshot.rules);
      if (matchedTriggers.length === 0) return null;

      return {
        triggerType: getPrimaryTrigger(matchedTriggers),
        triggerDetails: { matchedTriggers },
        ruleSnapshot,
        allowance,
      };
    })
    .filter((candidate) => !isNullish(candidate));

  if (candidates.length === 0) return skipWithReason('no_matches');

  const observations = await createObservations(candidates);
  if (observations.length === 0) return skipWithReason('no_observations');

  return { skipped: false, observations };
};

// Record the exploit as a spender risk factor so the normal evaluation detects it like any other
// risk, then return every address with allowances to the exploit's spenders. The caller pushes each
// one back through the indexing pipeline so it is re-evaluated against freshly indexed allowances.
export const prepareExploitEvaluation = async (exploit: Exploit): Promise<ExploitAffectedAddress[]> => {
  await addSpenderRiskFactor(exploit.addresses, { type: 'exploit', source: 'whois', data: exploit.name });

  const affectedAddresses = getDb()
    .selectDistinct({ address: indexerAllowances.address, chainId: indexerAllowances.chainId })
    .from(indexerAllowances)
    .where(
      or(
        ...exploit.addresses.map(({ chainId, address }) =>
          and(eq(indexerAllowances.chainId, chainId), eq(indexerAllowances.spenderAddress, address)),
        ),
      ),
    );

  return affectedAddresses;
};
