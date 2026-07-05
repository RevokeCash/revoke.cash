import type { TokenAllowanceData } from '@revoke.cash/core/allowances';
import { type DatabaseTransaction, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { autoRevokeRules } from '@revoke.cash/core/db/schema/auto-revoke';
import { indexerEventsState } from '@revoke.cash/core/db/schema/indexer';
import { premiumPlans, premiumSubscriptionAddresses, premiumSubscriptions } from '@revoke.cash/core/db/schema/premium';
import { isUltimatePlan } from '@revoke.cash/core/premium/plans';
import { isSubscriptionActive } from '@revoke.cash/core/premium/subscriptions';
import type { SpenderRiskData } from '@revoke.cash/core/whois';
import { and, asc, eq, gt, inArray, lte } from 'drizzle-orm';
import type { Address } from 'viem';
import { filterUnknownRiskFactors, getRiskLevel, type RiskFactor } from '../../risk';
import { ApiError } from '../../utils/errors';
import { DAY } from '../../utils/time';
import { requeueRulesBlockedActions } from '../actions';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '../config';

type RulesRecord = typeof autoRevokeRules.$inferSelect;

export type RiskSensitivity = 'exploits_only' | 'high' | 'medium';

export interface AutoRevokeRules {
  riskDetectionEnabled: boolean;
  riskSensitivity: RiskSensitivity;
  staleApprovalEnabled: boolean;
  staleApprovalThresholdDays: number;
}

export interface AddressRulesConfig {
  rulesSource: RulesSource;
  effectiveRules: AutoRevokeRules;
  customRules: AutoRevokeRules;
  availableSubscriptions: Array<{
    subscriptionId: string;
    planName: string;
    ownerAddress: Address;
  }>;
}

export interface RuleContext {
  rules: AutoRevokeRules;
  rulesSource: RulesSource;
}

export type RulesSource =
  | { type: 'custom' }
  | { type: 'subscription'; subscriptionId: string; planName: string; ownerAddress: Address };

export interface MatchedTrigger {
  type: 'exploit' | 'risk_score' | 'stale';
  riskFactors?: RiskFactor[];
}

export interface TriggerDetails {
  matchedTriggers: Array<MatchedTrigger>;
}

export const getSubscriptionRules = async (subscriptionId: string): Promise<AutoRevokeRules> => {
  const db = getDb();

  const row = await db.query.autoRevokeRules.findFirst({
    where: eq(autoRevokeRules.subscriptionId, subscriptionId),
  });

  return row ? mapRules(row) : DEFAULT_RULES;
};

export const upsertSubscriptionRules = async (
  subscriptionId: string,
  ruleData: Partial<AutoRevokeRules>,
): Promise<void> => {
  const db = getDb();

  await db
    .insert(autoRevokeRules)
    .values({
      type: 'subscription',
      subscriptionId,
      ...ruleData,
    })
    .onConflictDoUpdate({
      target: autoRevokeRules.subscriptionId,
      set: ruleData,
    });

  await scheduleReindexForSubscription(subscriptionId);
};

export const getAddressRules = async (address: Address): Promise<RulesRecord | null> => {
  const db = getDb();

  const rules = await db.query.autoRevokeRules.findFirst({
    where: eq(autoRevokeRules.address, address),
  });

  return rules ?? null;
};

export const upsertAddressRules = async (address: Address, ruleData: Partial<AutoRevokeRules>): Promise<void> => {
  const db = getDb();

  await db
    .insert(autoRevokeRules)
    .values({
      type: 'address',
      address,
      ...ruleData,
    })
    .onConflictDoUpdate({
      target: autoRevokeRules.address,
      set: ruleData,
    });

  await scheduleReindexForAddresses([address]);
};

export const getAddressRulesConfig = async (address: Address): Promise<AddressRulesConfig> => {
  const { rules: effectiveRules, rulesSource } = await getEffectiveRules(address);

  const addressRules = await getAddressRules(address);
  const customRules = addressRules ? mapRules(addressRules) : DEFAULT_RULES;
  const availableSubscriptions = await getAvailableSubscriptions(address);

  return { rulesSource, effectiveRules, customRules, availableSubscriptions };
};

export const getEffectiveRules = async (address: Address): Promise<RuleContext> => {
  const ownedSubscriptionRules = await getActiveSubscriptionRules(address, { ownerOnly: true });
  if (ownedSubscriptionRules) return ownedSubscriptionRules;

  const addressRules = await getAddressRules(address);

  const fallbackCustomRules = {
    rules: addressRules ? mapRules(addressRules) : DEFAULT_RULES,
    rulesSource: { type: 'custom' as const },
  };

  if (!addressRules) {
    const defaultSubscriptionRules = await getActiveSubscriptionRules(address);
    return defaultSubscriptionRules ?? fallbackCustomRules;
  }

  if (!addressRules.activeRulesId) return fallbackCustomRules;

  // Follow the pointer to the subscription rules, eager-loading the subscription + plan + membership.
  const db = getDb();
  const targetRules = await db.query.autoRevokeRules.findFirst({
    where: eq(autoRevokeRules.id, addressRules.activeRulesId),
    with: {
      subscription: {
        columns: { id: true, ownerAddress: true, startsAt: true, endsAt: true },
        with: {
          plan: { columns: { name: true, tier: true } },
          addresses: {
            where: (addresses, { eq }) => eq(addresses.address, address),
            columns: { id: true },
            limit: 1,
          },
        },
      },
    },
  });

  if (!targetRules?.subscription) return fallbackCustomRules;

  const { id: subscriptionId, plan, addresses, ownerAddress } = targetRules.subscription;
  const isEligible = isUltimatePlan(plan) && isSubscriptionActive(targetRules.subscription) && addresses.length > 0;

  if (!isEligible) return fallbackCustomRules;

  return {
    rules: mapRules(targetRules),
    rulesSource: {
      type: 'subscription',
      subscriptionId,
      planName: plan.name,
      ownerAddress,
    },
  };
};

const getActiveSubscriptionRules = async (
  address: Address,
  options?: { ownerOnly?: boolean },
): Promise<RuleContext | null> => {
  const db = getDb();
  const now = new Date();

  const [subscription] = await db
    .select({
      subscriptionId: premiumSubscriptions.id,
      planName: premiumPlans.name,
      ownerAddress: premiumSubscriptions.ownerAddress,
    })
    .from(premiumSubscriptionAddresses)
    .innerJoin(premiumSubscriptions, eq(premiumSubscriptions.id, premiumSubscriptionAddresses.subscriptionId))
    .innerJoin(
      premiumPlans,
      and(eq(premiumPlans.id, premiumSubscriptions.planId), eq(premiumPlans.version, premiumSubscriptions.planVersion)),
    )
    .where(
      and(
        eq(premiumSubscriptionAddresses.address, address),
        options?.ownerOnly ? eq(premiumSubscriptions.ownerAddress, address) : undefined,
        eq(premiumPlans.tier, 'ultimate'),
        lte(premiumSubscriptions.startsAt, now),
        gt(premiumSubscriptions.endsAt, now),
      ),
    )
    .orderBy(asc(premiumSubscriptions.startsAt))
    .limit(1);

  if (!subscription) return null;

  return {
    rules: await getSubscriptionRules(subscription.subscriptionId),
    rulesSource: {
      type: 'subscription',
      subscriptionId: subscription.subscriptionId,
      planName: subscription.planName,
      ownerAddress: subscription.ownerAddress,
    },
  };
};

export const switchRulesSource = async (
  address: Address,
  { subscriptionId }: { subscriptionId: string | null },
): Promise<void> => {
  const db = getTransactionalDb();

  await db.transaction(async (trx) => {
    const activeRulesId = await resolveActiveRulesId(trx, address, subscriptionId);
    await initAddressRules(trx, address, activeRulesId ?? undefined);
    await setActiveRules(trx, address, activeRulesId);
  });

  await scheduleReindexForAddresses([address]);
};

const scheduleReindexForAddresses = async (addresses: Address[]): Promise<void> => {
  if (addresses.length === 0) return;

  await requeueRulesBlockedActions(addresses);

  await getDb()
    .update(indexerEventsState)
    .set({ nextRunAt: new Date() })
    .where(
      and(
        inArray(indexerEventsState.address, addresses),
        inArray(indexerEventsState.chainId, [...AUTO_REVOKE_SUPPORTED_CHAINS]),
      ),
    );
};

const scheduleReindexForSubscription = async (subscriptionId: string): Promise<void> => {
  const members = await getDb()
    .select({ address: premiumSubscriptionAddresses.address })
    .from(premiumSubscriptionAddresses)
    .where(eq(premiumSubscriptionAddresses.subscriptionId, subscriptionId));

  await scheduleReindexForAddresses(members.map((member) => member.address));
};

const getAvailableSubscriptions = async (address: Address): Promise<AddressRulesConfig['availableSubscriptions']> => {
  const db = getDb();

  const subscriptionEntries = await db.query.premiumSubscriptionAddresses.findMany({
    where: eq(premiumSubscriptionAddresses.address, address),
    with: {
      subscription: {
        columns: { id: true, ownerAddress: true, startsAt: true, endsAt: true },
        with: { plan: { columns: { name: true, tier: true } } },
      },
    },
  });

  return subscriptionEntries
    .map(({ subscription }) => subscription)
    .filter((subscription) => isUltimatePlan(subscription.plan) && isSubscriptionActive(subscription))
    .map((subscription) => ({
      subscriptionId: subscription.id,
      planName: subscription.plan.name,
      ownerAddress: subscription.ownerAddress,
    }));
};

const resolveActiveRulesId = async (
  trx: DatabaseTransaction,
  address: Address,
  subscriptionId: string | null,
): Promise<string | null> => {
  if (subscriptionId === null) return null;

  const isAuthorized = await isAddressMemberOfActiveUltimateSubscription(trx, address, subscriptionId);
  if (!isAuthorized) throw new ApiError(403, 'Not authorized for this rules source');

  return ensureSubscriptionRulesId(trx, subscriptionId);
};

const isAddressMemberOfActiveUltimateSubscription = async (
  trx: DatabaseTransaction,
  address: Address,
  subscriptionId: string,
): Promise<boolean> => {
  const now = new Date();

  const rows = await trx
    .select({ id: premiumSubscriptions.id })
    .from(premiumSubscriptions)
    .innerJoin(premiumPlans, eq(premiumPlans.id, premiumSubscriptions.planId))
    .innerJoin(
      premiumSubscriptionAddresses,
      and(
        eq(premiumSubscriptionAddresses.subscriptionId, premiumSubscriptions.id),
        eq(premiumSubscriptionAddresses.address, address),
      ),
    )
    .where(
      and(
        eq(premiumSubscriptions.id, subscriptionId),
        eq(premiumPlans.tier, 'ultimate'),
        lte(premiumSubscriptions.startsAt, now),
        gt(premiumSubscriptions.endsAt, now),
      ),
    )
    .limit(1);

  return rows.length > 0;
};

const ensureSubscriptionRulesId = async (trx: DatabaseTransaction, subscriptionId: string): Promise<string> => {
  await trx.insert(autoRevokeRules).values({ type: 'subscription', subscriptionId }).onConflictDoNothing();

  const row = await trx.query.autoRevokeRules.findFirst({
    where: eq(autoRevokeRules.subscriptionId, subscriptionId),
    columns: { id: true },
  });

  if (!row) throw new Error('Failed to ensure subscription rules row');
  return row.id;
};

const initAddressRules = async (
  trx: DatabaseTransaction,
  address: Address,
  copyFromRulesId?: string,
): Promise<void> => {
  const sourceRules = copyFromRulesId
    ? await trx.query.autoRevokeRules.findFirst({ where: eq(autoRevokeRules.id, copyFromRulesId) })
    : undefined;

  await trx
    .insert(autoRevokeRules)
    .values({
      type: 'address',
      address,
      ...(sourceRules ? mapRules(sourceRules) : {}),
    })
    .onConflictDoNothing();
};

const setActiveRules = async (trx: DatabaseTransaction, address: Address, rulesId: string | null): Promise<void> => {
  await trx.update(autoRevokeRules).set({ activeRulesId: rulesId }).where(eq(autoRevokeRules.address, address));
};

const mapRules = (row: RulesRecord): AutoRevokeRules => ({
  riskDetectionEnabled: row.riskDetectionEnabled,
  riskSensitivity: row.riskSensitivity,
  staleApprovalEnabled: row.staleApprovalEnabled,
  staleApprovalThresholdDays: row.staleApprovalThresholdDays,
});

const DEFAULT_RULES: AutoRevokeRules = {
  riskDetectionEnabled: true,
  riskSensitivity: 'exploits_only',
  staleApprovalEnabled: false,
  staleApprovalThresholdDays: 180,
};

export const getMatchedTriggers = (allowance: TokenAllowanceData, rules: AutoRevokeRules): MatchedTrigger[] => {
  const payload = allowance.payload;

  const riskFactors = rules.riskDetectionEnabled ? getRiskFactors(payload.spenderData) : [];
  const triggers: MatchedTrigger[] = [];

  const exploitFactors = riskFactors.filter((riskFactor) => riskFactor.type === 'exploit');
  if (rules.riskDetectionEnabled && exploitFactors.length > 0) {
    triggers.push({ type: 'exploit', riskFactors: exploitFactors });
  }

  if (rules.riskDetectionEnabled && shouldMatchRiskScore(riskFactors, rules.riskSensitivity)) {
    triggers.push({ type: 'risk_score', riskFactors });
  }

  const isStale = Date.now() - payload.lastUpdated.timestamp * 1000 >= rules.staleApprovalThresholdDays * DAY;
  if (rules.staleApprovalEnabled && isStale) {
    triggers.push({ type: 'stale' });
  }

  return triggers;
};

export const getPrimaryTrigger = (matchedTriggers: MatchedTrigger[]): MatchedTrigger['type'] => {
  if (matchedTriggers.some((trigger) => trigger.type === 'exploit')) return 'exploit';
  if (matchedTriggers.some((trigger) => trigger.type === 'risk_score')) return 'risk_score';
  return 'stale';
};

const getRiskFactors = (spenderData: SpenderRiskData | null | undefined): RiskFactor[] =>
  filterUnknownRiskFactors(spenderData?.riskFactors ?? []);

const shouldMatchRiskScore = (riskFactors: RiskFactor[], sensitivity: RiskSensitivity): boolean => {
  if (sensitivity === 'exploits_only') return false;

  const riskLevel = getRiskLevel(riskFactors);
  if (sensitivity === 'high') return riskLevel === 'high';
  return riskLevel === 'medium' || riskLevel === 'high';
};
