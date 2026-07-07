import { ShowcaseFrame } from '../components/ShowcaseFrame';
import { TokenIcon } from '../components/TokenIcon';

// Still image for the premium pricing page's feature showcase (1200x630): a dark-mode mockup of
// batch revoking, with several approvals selected and no batch fee for subscribers.
// Rendered to apps/web/public/assets/images/premium/batch-revoke.jpg.

interface BatchRow {
  symbol: string;
  spender: string;
}

const BATCH_ROWS: BatchRow[] = [
  { symbol: 'USDC', spender: 'Uniswap Permit2' },
  { symbol: 'WETH', spender: 'Seaport 1.5 (OpenSea)' },
  { symbol: 'LINK', spender: '1inch Router v4' },
];

export const BatchRevokeStill = () => {
  return (
    <ShowcaseFrame title="Batch Revoke">
      <div className="divide-y divide-zinc-800">
        {BATCH_ROWS.map((row) => (
          <div key={row.symbol} className="flex items-center gap-5 px-10 py-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-xl font-bold text-zinc-900">
              ✓
            </div>
            <div className="flex items-center gap-3">
              <TokenIcon symbol={row.symbol} size={36} />
              <span className="text-2xl font-medium text-zinc-100">{row.symbol}</span>
              <span className="text-2xl text-zinc-400">{row.spender}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-zinc-800 px-10 py-6">
        <span className="text-xl text-zinc-400">3 approvals selected · No batch fee</span>
        <div className="rounded-lg bg-white px-7 py-2.5 text-lg font-medium text-zinc-900">Revoke All</div>
      </div>
    </ShowcaseFrame>
  );
};
