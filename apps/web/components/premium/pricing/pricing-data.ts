export type TierKey = 'free' | 'premium' | 'ultimate';

export interface PricingFeature {
  labelKey: string;
  free: boolean | string;
  premium: boolean | string;
  ultimate: boolean | string;
  cardLabelKey?: Partial<Record<TierKey, string>>;
  upgradedIn?: TierKey[];
  tooltipKey?: string;
  comparisonOnly?: boolean;
}

export const FEATURES: PricingFeature[] = [
  { labelKey: 'revoke_approvals', free: 'one_chain', premium: true, ultimate: true },
  { labelKey: 'approval_history', free: 'one_chain', premium: true, ultimate: true },
  { labelKey: 'exploit_checker', free: 'one_chain', premium: true, ultimate: true },
  {
    labelKey: 'batch_revoke',
    free: 'per_batch',
    premium: 'unlimited',
    ultimate: 'unlimited',
    cardLabelKey: {
      free: 'batch_revoke_paid',
      premium: 'unlimited_batch_revokes',
      ultimate: 'unlimited_batch_revokes',
    },
    upgradedIn: ['premium'],
  },
  { labelKey: 'multichain_dashboard', free: false, premium: true, ultimate: true },
  { labelKey: 'multichain_exploit_checker', free: false, premium: true, ultimate: true },
  // Time machine is hidden until its standalone launch
  // { labelKey: 'time_machine', free: false, premium: true, ultimate: true },
  { labelKey: 'priority_support', free: false, premium: true, ultimate: true },
  { labelKey: 'continuous_monitoring', free: false, premium: false, ultimate: true, upgradedIn: ['ultimate'] },
  {
    labelKey: 'automated_revoking',
    free: false,
    premium: false,
    ultimate: true,
    upgradedIn: ['ultimate'],
    tooltipKey: 'automated_revoking',
  },
  {
    labelKey: 'gas_allowance',
    free: false,
    premium: false,
    ultimate: 'gas_allowance_amount',
    cardLabelKey: { ultimate: 'gas_allowance_included' },
  },
  {
    labelKey: 'address_slots',
    free: false,
    premium: 'address_slots_count',
    ultimate: 'address_slots_count',
    comparisonOnly: true,
  },
];

export const TIER_KEYS: TierKey[] = ['free', 'premium', 'ultimate'];

export const TIER_MAX_ADDRESSES: Record<TierKey, number> = {
  free: 0,
  premium: 10,
  ultimate: 10,
};
