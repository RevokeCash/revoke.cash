import { isAutoRevokeSupportedChain } from '@revoke.cash/core/auto-revoke/config';
import { getDb } from '@revoke.cash/core/db/client';
import { indexerAllowances } from '@revoke.cash/core/db/schema/indexer';
import { premiumPlans, premiumSubscriptionAddresses, premiumSubscriptions } from '@revoke.cash/core/db/schema/premium';
import type { Exploit } from '@revoke.cash/core/exploits';
import { isAllowanceCacheFresh } from '@revoke.cash/core/indexer/cache-state';
import {
  addSpenderRiskFactor,
  getCompleteSpenderMetadata,
  type SpenderMetadataByAddress,
} from '@revoke.cash/core/indexer/spender-metadata';
import { getCompleteTokenMetadata, isUsableTokenMetadata } from '@revoke.cash/core/indexer/token-metadata';
import { filterUnknownRiskFactors, getRiskLevel, type RiskFactor } from '@revoke.cash/core/risk';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import { DAY } from '@revoke.cash/core/utils/time';
import { and, asc, eq, gt, lte, or, sql } from 'drizzle-orm';
import type { Address } from 'viem';
import { type AutoRevokeObservation, createAutoRevokeObservations, type IndexedAllowance } from './observations';
import { getEffectiveRules } from './rules';
import type { AutoRevokeRules, AutoRevokeRulesSource, RiskSensitivity } from './types';

export interface AutoRevokeEvaluationResult {
  skipped: boolean;
  observations: AutoRevokeObservation[];
  reason?: AutoRevokeEvaluationSkipReason;
}

type AutoRevokeEvaluationSkipReason =
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

interface MatchedTrigger {
  type: 'exploit' | 'risk_score' | 'stale';
  riskFactors?: RiskFactor[];
}

interface RuleContext {
  rules: AutoRevokeRules;
  rulesSource: AutoRevokeRulesSource;
  subscriptionId: string | null;
}

const skipWithReason = (reason: AutoRevokeEvaluationSkipReason): AutoRevokeEvaluationResult => ({
  skipped: true,
  observations: [],
  reason,
});

export const evaluateAddress = async (address: Address, chainId: number): Promise<AutoRevokeEvaluationResult> => {
  if (!isAutoRevokeSupportedChain(chainId)) return skipWithReason('unsupported_chain');

  const cacheFresh = await isAllowanceCacheFresh(address, chainId);
  if (!cacheFresh) return skipWithReason('allowance_cache_not_fresh');

  const { rules, rulesSource, subscriptionId } = await getRuleContext(address);
  if (!subscriptionId) return skipWithReason('no_active_ultimate_subscription');

  const allowances = await getDb().query.indexerAllowances.findMany({
    where: and(eq(indexerAllowances.address, address), eq(indexerAllowances.chainId, chainId)),
  });

  if (allowances.length === 0) return skipWithReason('no_allowances');

  const spenderAddresses = deduplicateArray(allowances.map((allowance) => allowance.spenderAddress));
  const tokenAddresses = deduplicateArray(allowances.map((allowance) => allowance.tokenAddress));
  const [spenderMetadataByAddress, tokenMetadataByAddress] = await Promise.all([
    getCompleteSpenderMetadata(chainId, spenderAddresses),
    getCompleteTokenMetadata(chainId, tokenAddresses),
  ]);

  const candidates = allowances
    .map((allowance) => {
      if (!isUsableTokenMetadata(tokenMetadataByAddress.get(allowance.tokenAddress))) return null;

      const matchedTriggers = getMatchedTriggers(allowance, rules, spenderMetadataByAddress);
      if (matchedTriggers.length === 0) return null;

      return {
        subscriptionId,
        address,
        chainId,
        triggerType: getPrimaryTrigger(matchedTriggers),
        triggerDetails: { matchedTriggers },
        ruleSnapshot: { rules, rulesSource },
        allowance,
      };
    })
    .filter((candidate) => !isNullish(candidate));

  if (candidates.length === 0) return skipWithReason('no_matches');

  const observations = await createAutoRevokeObservations(candidates);
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

const getMatchedTriggers = (
  allowance: IndexedAllowance,
  rules: AutoRevokeRules,
  spenderMetadataByAddress: SpenderMetadataByAddress,
): MatchedTrigger[] => {
  const riskFactors = rules.riskDetectionEnabled ? getRiskFactors(allowance, spenderMetadataByAddress) : [];
  const triggers: MatchedTrigger[] = [];

  const exploitFactors = riskFactors.filter((riskFactor) => riskFactor.type === 'exploit');
  if (rules.riskDetectionEnabled && exploitFactors.length > 0) {
    triggers.push({ type: 'exploit', riskFactors: exploitFactors });
  }

  if (rules.riskDetectionEnabled && shouldMatchRiskScore(riskFactors, rules.riskSensitivity)) {
    triggers.push({ type: 'risk_score', riskFactors });
  }

  const isStale = Date.now() - allowance.lastUpdatedTimestamp * 1000 >= rules.staleApprovalThresholdDays * DAY;
  if (rules.staleApprovalEnabled && isStale) {
    triggers.push({ type: 'stale' });
  }

  return triggers;
};

const getPrimaryTrigger = (matchedTriggers: MatchedTrigger[]): MatchedTrigger['type'] => {
  if (matchedTriggers.some((trigger) => trigger.type === 'exploit')) return 'exploit';
  if (matchedTriggers.some((trigger) => trigger.type === 'risk_score')) return 'risk_score';
  return 'stale';
};

const getRiskFactors = (
  allowance: IndexedAllowance,
  spenderMetadataByAddress: SpenderMetadataByAddress,
): RiskFactor[] => {
  const spenderMetadata = spenderMetadataByAddress.get(allowance.spenderAddress);
  return filterUnknownRiskFactors(spenderMetadata?.riskFactors ?? []);
};

const shouldMatchRiskScore = (riskFactors: RiskFactor[], sensitivity: RiskSensitivity): boolean => {
  if (sensitivity === 'exploits_only') return false;

  const riskLevel = getRiskLevel(riskFactors);
  if (sensitivity === 'high') return riskLevel === 'high';
  return riskLevel === 'medium' || riskLevel === 'high';
};

const getRuleContext = async (address: Address): Promise<RuleContext> => {
  const { rules, rulesSource } = await getEffectiveRules(address);
  const subscriptionId = await findBudgetSubscriptionForAddress(address);
  return { rules, rulesSource, subscriptionId };
};

const findBudgetSubscriptionForAddress = async (address: Address): Promise<string | null> => {
  const db = getDb();

  const [subscription] = await db
    .select({ id: premiumSubscriptions.id })
    .from(premiumSubscriptionAddresses)
    .innerJoin(premiumSubscriptions, eq(premiumSubscriptions.id, premiumSubscriptionAddresses.subscriptionId))
    .innerJoin(
      premiumPlans,
      and(eq(premiumPlans.id, premiumSubscriptions.planId), eq(premiumPlans.version, premiumSubscriptions.planVersion)),
    )
    .where(
      and(
        eq(premiumSubscriptionAddresses.address, address),
        eq(premiumPlans.tier, 'ultimate'),
        lte(premiumSubscriptions.startsAt, sql`now()`),
        gt(premiumSubscriptions.endsAt, sql`now()`),
      ),
    )
    .orderBy(asc(premiumSubscriptions.startsAt))
    .limit(1);

  return subscription?.id ?? null;
};
