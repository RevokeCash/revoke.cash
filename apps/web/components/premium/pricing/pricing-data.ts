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
  { labelKey: 'time_machine', free: false, premium: true, ultimate: true },
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
    labelKey: 'address_slots',
    free: false,
    premium: 'ten_address_slots',
    ultimate: 'ten_address_slots',
    comparisonOnly: true,
  },
];

export const TIER_KEYS: TierKey[] = ['free', 'premium', 'ultimate'];
