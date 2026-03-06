'use client';

import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';
import Label from 'components/common/Label';
import { twMerge } from 'tailwind-merge';

type TierKey = 'free' | 'premium' | 'bundle';

interface PricingFeature {
  label: string;
  free: boolean | string;
  premium: boolean | string;
  bundle: boolean | string;
  /** Per-tier override for the card display label (keyed by tier key). */
  cardLabel?: Partial<Record<TierKey, string>>;
}

const FEATURES: PricingFeature[] = [
  { label: 'Revoke approvals on 100+ networks', free: 'One chain at a time', premium: true, bundle: true },
  { label: 'Approval history', free: 'One chain at a time', premium: true, bundle: true },
  { label: 'Exploit checker', free: 'One chain at a time', premium: true, bundle: true },
  {
    label: 'Batch revoke',
    free: '$1.50 per batch',
    premium: 'Unlimited',
    bundle: 'Unlimited',
    cardLabel: {
      free: 'Batch revoke ($1.50/batch)',
      premium: 'Unlimited batch revokes',
      bundle: 'Unlimited batch revokes',
    },
  },
  { label: 'Multichain dashboard', free: false, premium: true, bundle: true },
  { label: 'Multichain exploit checker', free: false, premium: true, bundle: true },
  { label: 'Priority support', free: false, premium: true, bundle: true },
  {
    label: 'Address slots',
    free: false,
    premium: '1',
    bundle: '10',
    cardLabel: { premium: '1 address slot', bundle: '10 address slots' },
  },
];

interface PricingTier {
  key: TierKey;
  name: string;
  price: string;
  period: string;
  description: string;
  highlighted?: boolean;
  cta: string;
  href: string;
}

const TIERS: PricingTier[] = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    description: 'Essential tools to inspect and revoke token approvals.',
    cta: 'Get started',
    href: '/token-approval-checker/ethereum',
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '$99',
    period: '/year',
    description: 'Full access to the multichain dashboard, history, and unlimited batch revokes.',
    highlighted: true,
    cta: 'Subscribe',
    href: '/account',
  },
  {
    key: 'bundle',
    name: 'Premium Bundle',
    price: '$299',
    period: '/year',
    description: 'Everything in Premium for up to 10 wallet addresses.',
    cta: 'Subscribe',
    href: '/account',
  },
];

const FeatureValue = ({ value }: { value: boolean | string }) => {
  if (value === true) return <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />;
  if (value === false) return <XMarkIcon className="w-5 h-5 text-zinc-300 dark:text-zinc-600 mx-auto" />;
  return <span className="text-sm text-zinc-700 dark:text-zinc-300">{value}</span>;
};

const PricingPage = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col gap-12">
      <div className="text-center flex flex-col gap-3">
        <h1 className="text-4xl font-semibold">Pricing</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Stay safe in web3 with the tools you need. Upgrade to Premium for the full experience.
        </p>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={twMerge(
              'relative flex flex-col gap-6 rounded-xl border p-6',
              tier.highlighted
                ? 'border-brand bg-brand/5 dark:bg-brand/10 ring-1 ring-brand'
                : 'border-zinc-200 dark:border-zinc-700',
            )}
          >
            {tier.highlighted && (
              <Label className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-zinc-900">Most popular</Label>
            )}

            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">{tier.name}</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{tier.price}</span>
                {tier.period && <span className="text-sm text-zinc-500 dark:text-zinc-400">{tier.period}</span>}
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{tier.description}</p>
            </div>

            <Button
              href={tier.href}
              router
              style={tier.highlighted ? 'primary' : 'secondary'}
              size="md"
              className="w-full justify-center"
            >
              {tier.cta}
            </Button>

            <ul className="flex flex-col gap-2.5">
              {FEATURES.map((feature) => {
                const value = feature[tier.key];
                const included = value !== false;

                return (
                  <li key={feature.label} className="flex items-center gap-2 text-sm">
                    {included ? (
                      <CheckIcon className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />
                    ) : (
                      <XMarkIcon className="w-4 h-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
                    )}
                    <span className={included ? undefined : 'text-zinc-400 dark:text-zinc-600'}>
                      {feature.cardLabel?.[tier.key] ?? feature.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-center">Compare plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="text-left py-3 pr-4 font-medium text-zinc-600 dark:text-zinc-400">Feature</th>
                {TIERS.map((tier) => (
                  <th key={tier.name} className="py-3 px-4 font-semibold text-center">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature) => (
                <tr key={feature.label} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">{feature.label}</td>
                  {TIERS.map((tier) => (
                    <td key={tier.key} className="py-3 px-4 text-center">
                      <FeatureValue value={feature[tier.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
