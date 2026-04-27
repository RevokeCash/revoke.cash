import { type DatabaseTransaction, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { autoRevokeRules } from '@revoke.cash/core/db/schema/auto-revoke';
import { premiumPlans, premiumSubscriptionAddresses, premiumSubscriptions } from '@revoke.cash/core/db/schema/premium';
import { isUltimatePlan } from '@revoke.cash/core/premium/plans';
import { isSubscriptionActive } from '@revoke.cash/core/premium/subscriptions';
import { toLowercaseAddress } from '@revoke.cash/core/utils';
import { and, eq, gt, lte } from 'drizzle-orm';
import { type Address, getAddress } from 'viem';
import type { AutoRevokeAddressRulesConfig, AutoRevokeRules, AutoRevokeRulesSource } from './types';

type RulesRecord = typeof autoRevokeRules.$inferSelect;

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
};

export const getAddressRulesConfig = async (address: Address): Promise<AutoRevokeAddressRulesConfig> => {
  const normalizedAddress = toLowercaseAddress(address);

  const { rules: effectiveRules, rulesSource } = await getEffectiveRules(address);

  const addressRules = await getAddressRules(address);
  const customRules = addressRules ? mapRules(addressRules) : DEFAULT_RULES;
  const availableSubscriptions = await getAvailableSubscriptions(normalizedAddress);

  return { rulesSource, effectiveRules, customRules, availableSubscriptions };
};

export const getEffectiveRules = async (
  address: Address,
): Promise<{ rules: AutoRevokeRules; rulesSource: AutoRevokeRulesSource }> => {
  const normalizedAddress = toLowercaseAddress(address);
  const addressRules = await getAddressRules(address);

  const fallbackCustomRules = {
    rules: addressRules ? mapRules(addressRules) : DEFAULT_RULES,
    rulesSource: { type: 'custom' as const },
  };

  if (!addressRules || !addressRules.activeRulesId) return fallbackCustomRules;

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
            where: (addresses, { eq }) => eq(addresses.address, normalizedAddress),
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
      ownerAddress: getAddress(ownerAddress),
    },
  };
};

export const getAddressRules = async (address: Address): Promise<RulesRecord | null> => {
  const db = getDb();
  const normalizedAddress = toLowercaseAddress(address);

  const rules = await db.query.autoRevokeRules.findFirst({
    where: eq(autoRevokeRules.address, normalizedAddress),
  });

  return rules ?? null;
};

export const upsertAddressRules = async (address: Address, ruleData: Partial<AutoRevokeRules>): Promise<void> => {
  const db = getDb();
  const normalizedAddress = toLowercaseAddress(address);

  await db
    .insert(autoRevokeRules)
    .values({
      type: 'address',
      address: normalizedAddress,
      ...ruleData,
    })
    .onConflictDoUpdate({
      target: autoRevokeRules.address,
      set: ruleData,
    });
};

export const switchAutoRevokeRulesSource = async (
  address: Address,
  { subscriptionId }: { subscriptionId: string | null },
): Promise<void> => {
  const db = getTransactionalDb();
  const normalizedAddress = toLowercaseAddress(address);

  await db.transaction(async (trx) => {
    const activeRulesId = await resolveActiveRulesId(trx, normalizedAddress, subscriptionId);
    await initAddressRules(trx, normalizedAddress, activeRulesId ?? undefined);
    await setActiveRules(trx, normalizedAddress, activeRulesId);
  });
};

const getAvailableSubscriptions = async (
  normalizedAddress: Address,
): Promise<AutoRevokeAddressRulesConfig['availableSubscriptions']> => {
  const db = getDb();

  const subscriptionEntries = await db.query.premiumSubscriptionAddresses.findMany({
    where: eq(premiumSubscriptionAddresses.address, normalizedAddress),
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
      ownerAddress: getAddress(subscription.ownerAddress),
    }));
};

const resolveActiveRulesId = async (
  trx: DatabaseTransaction,
  normalizedAddress: Address,
  subscriptionId: string | null,
): Promise<string | null> => {
  if (subscriptionId === null) return null;

  const isAuthorized = await isAddressMemberOfActiveUltimateSubscription(trx, normalizedAddress, subscriptionId);
  if (!isAuthorized) throw new Error('Not authorized for this rules source');

  return ensureSubscriptionRulesId(trx, subscriptionId);
};

const isAddressMemberOfActiveUltimateSubscription = async (
  trx: DatabaseTransaction,
  normalizedAddress: Address,
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
        eq(premiumSubscriptionAddresses.address, normalizedAddress),
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
  normalizedAddress: Address,
  copyFromRulesId?: string,
): Promise<void> => {
  const sourceRules = copyFromRulesId
    ? await trx.query.autoRevokeRules.findFirst({ where: eq(autoRevokeRules.id, copyFromRulesId) })
    : undefined;

  await trx
    .insert(autoRevokeRules)
    .values({
      type: 'address',
      address: normalizedAddress,
      ...(sourceRules ? mapRules(sourceRules) : {}),
    })
    .onConflictDoNothing();
};

const setActiveRules = async (
  trx: DatabaseTransaction,
  normalizedAddress: Address,
  rulesId: string | null,
): Promise<void> => {
  await trx
    .update(autoRevokeRules)
    .set({ activeRulesId: rulesId })
    .where(eq(autoRevokeRules.address, normalizedAddress));
};

const mapRules = (row: RulesRecord): AutoRevokeRules => ({
  riskDetectionEnabled: row.riskDetectionEnabled,
  riskSensitivity: row.riskSensitivity,
  staleApprovalEnabled: row.staleApprovalEnabled,
  staleApprovalThresholdDays: row.staleApprovalThresholdDays ?? 30,
});

const DEFAULT_RULES: AutoRevokeRules = {
  riskDetectionEnabled: true,
  riskSensitivity: 'exploits_only',
  staleApprovalEnabled: false,
  staleApprovalThresholdDays: 30,
};
