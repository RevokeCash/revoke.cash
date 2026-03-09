export type TierKey = 'free' | 'premium' | 'bundle';

export interface PricingFeature {
  labelKey: string;
  free: boolean | string;
  premium: boolean | string;
  bundle: boolean | string;
  /** Per-tier override for the card display label (keyed by tier key). */
  cardLabelKey?: Partial<Record<TierKey, string>>;
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
  { labelKey: 'priority_support', free: false, premium: true, bundle: true },
  {
    labelKey: 'address_slots',
    free: false,
    premium: 'one_address_slot',
    bundle: 'ten_address_slots',
    cardLabelKey: { premium: 'one_address_slot', bundle: 'ten_address_slots' },
  },
];

export const TIER_KEYS: TierKey[] = ['free', 'premium', 'bundle'];

export const TIER_PRICES: Record<TierKey, string> = {
  free: '$0',
  premium: '$99',
  bundle: '$299',
};

export const FEATURE_SECTIONS = [
  { key: 'multichain_approvals', image: '/assets/images/opengraph-image.jpg' },
  { key: 'multichain_history', image: '/assets/images/opengraph-image.jpg' },
  { key: 'multichain_exploit_checker', image: '/assets/images/opengraph-image.jpg' },
  { key: 'unlimited_batch_revokes', image: '/assets/images/opengraph-image.jpg' },
  { key: 'priority_support', image: '/assets/images/opengraph-image.jpg' },
] as const;

export const TIER_HREFS: Record<TierKey, string> = {
  free: '/token-approval-checker/ethereum',
  premium: '/account',
  bundle: '/account',
};
