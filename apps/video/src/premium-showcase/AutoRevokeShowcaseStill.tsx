import { Pill } from '../components/Pill';
import { ShowcaseFrame } from '../components/ShowcaseFrame';
import { TokenIcon } from '../components/TokenIcon';

// Still image for the premium pricing page's feature showcase (1200x630): a dark-mode mockup of
// the auto-revoking activity log, showing the pipeline from pending to revoked across the three
// trigger types. Rendered to apps/web/public/assets/images/premium/auto-revoke.jpg.

interface ActivityRow {
  symbol: string;
  spender: string;
  trigger: { label: string; className: string };
  status: { label: string; className: string };
}

const ACTIVITY_ROWS: ActivityRow[] = [
  {
    symbol: 'USDT',
    spender: '0xd00d...Feed',
    trigger: { label: 'Exploit', className: 'bg-red-400' },
    status: { label: 'Revoked', className: 'bg-green-400' },
  },
  {
    symbol: 'WETH',
    spender: 'Old DEX Router',
    trigger: { label: 'Stale', className: 'bg-zinc-300' },
    status: { label: 'Submitting', className: 'bg-blue-300' },
  },
  {
    symbol: 'PEPE',
    spender: '0x1337...Beef',
    trigger: { label: 'Risky', className: 'bg-orange-300' },
    status: { label: 'Pending', className: 'bg-yellow-300' },
  },
];

export const AutoRevokeShowcaseStill = () => {
  return (
    <ShowcaseFrame title="Activity">
      <div className="divide-y divide-zinc-800">
        {ACTIVITY_ROWS.map((row) => (
          <div key={row.symbol} className="flex items-center justify-between gap-5 px-10 py-8">
            <div className="flex items-center gap-3">
              <TokenIcon symbol={row.symbol} size={40} />
              <span className="text-2xl font-medium text-zinc-100">{row.symbol}</span>
              <span className="text-2xl text-zinc-400">{row.spender}</span>
            </div>
            <div className="flex items-center gap-3">
              <Pill className={`px-4 py-1.5 text-lg text-zinc-900 ${row.trigger.className}`}>{row.trigger.label}</Pill>
              <Pill className={`w-36 py-1.5 text-lg text-zinc-900 ${row.status.className}`}>{row.status.label}</Pill>
            </div>
          </div>
        ))}
      </div>
    </ShowcaseFrame>
  );
};
