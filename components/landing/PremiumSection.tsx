import { CheckIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';

const HIGHLIGHTS = [
  'Multichain dashboard — all chains at once',
  'Unlimited batch revokes',
  'Multichain exploit checker',
  'Full approval history across networks',
  'Priority support',
  'Up to 10 address slots',
];

const PremiumSection = () => {
  return (
    <div className="w-full px-4">
      <div className="max-w-3xl mx-auto rounded-xl border border-brand/40 bg-brand/5 dark:bg-brand/10 p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2>Revoke.cash Premium</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage approvals across 100+ networks from a single dashboard. Starting at $99/year.
          </p>
        </div>

        <ul className="flex flex-col sm:grid sm:grid-cols-2 gap-x-8 gap-y-2">
          {HIGHLIGHTS.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <CheckIcon className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3">
          <Button href="/premium" router style="primary" size="md">
            View pricing
          </Button>
          <Button href="/account" router style="secondary" size="md">
            Subscribe now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PremiumSection;
