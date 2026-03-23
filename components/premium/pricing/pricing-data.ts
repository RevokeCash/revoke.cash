export type TierKey = 'free' | 'premium' | 'bundle';

export interface PricingFeature {
  labelKey: string;
  free: boolean | string;
  premium: boolean | string;
  bundle: boolean | string;
  /** Per-tier override for the card display label (keyed by tier key). */
  cardLabelKey?: Partial<Record<TierKey, string>>;
  /** Tiers where this feature is a meaningful upgrade from the lower tier (shown as unique in cards). */
  upgradedIn?: TierKey[];
}

export const FEATURES: PricingFeature[] = [
  { labelKey: 'revoke_approvals', free: 'one_chain', premium: true, bundle: true },
  { labelKey: 'approval_history', free: 'one_chain', premium: true, bundle: true },
  { labelKey: 'exploit_checker', free: 'one_chain', premium: true, bundle: true },
  {
    labelKey: 'batch_revoke',
    free: 'per_batch',
    premium: 'unlimited',
    bundle: 'unlimited',
    cardLabelKey: {
      free: 'batch_revoke_paid',
      premium: 'unlimited_batch_revokes',
      bundle: 'unlimited_batch_revokes',
    },
  },
  { labelKey: 'multichain_dashboard', free: false, premium: true, bundle: true },
  { labelKey: 'multichain_exploit_checker', free: false, premium: true, bundle: true },
  { labelKey: 'time_machine', free: false, premium: true, bundle: true },
  // { labelKey: 'priority_support', free: false, premium: true, bundle: true },
  {
    labelKey: 'address_slots',
    free: false,
    premium: 'one_address_slot',
    bundle: 'ten_address_slots',
    cardLabelKey: { premium: 'one_address_slot', bundle: 'ten_address_slots' },
    upgradedIn: ['bundle'],
  },
];

export const TIER_KEYS: TierKey[] = ['free', 'premium', 'bundle'];
