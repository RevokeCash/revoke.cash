import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ShowcaseFrame } from '../components/ShowcaseFrame';
import { TokenIcon } from '../components/TokenIcon';
import { popIn, pulseOnce, riseIn } from '../motion';

// Animated mockup for the premium pricing page's feature showcase (1200x630): batch revoking,
// with the approvals getting selected one by one and no batch fee for subscribers. Rendered to
// apps/web/public/assets/videos/premium/batch-revoke.mp4; the final frame doubles as the poster
// at apps/web/public/assets/images/premium/batch-revoke.jpg.

interface BatchRow {
  symbol: string;
  spender: string;
  tickAt: number;
}

const BATCH_ROWS: BatchRow[] = [
  { symbol: 'USDC', spender: 'Uniswap Permit2', tickAt: 60 },
  { symbol: 'WETH', spender: 'Seaport 1.5 (OpenSea)', tickAt: 78 },
  { symbol: 'LINK', spender: '1inch Router v4', tickAt: 96 },
];

export const BatchRevokeShowcase = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const selectedCount = BATCH_ROWS.filter((row) => frame >= row.tickAt).length;
  const selectedLabel = selectedCount === 1 ? '1 approval selected' : `${selectedCount} approvals selected`;

  return (
    <ShowcaseFrame title="Batch Revoke">
      <div className="divide-y divide-zinc-800">
        {BATCH_ROWS.map((row, index) => (
          <div
            key={row.symbol}
            className="flex items-center gap-5 px-10 py-6"
            style={riseIn(frame, fps, 8 + index * 8)}
          >
            <div className="relative h-8 w-8 rounded-md border-2 border-zinc-700">
              <div
                className="absolute -inset-0.5 flex items-center justify-center rounded-md bg-brand text-xl font-bold text-zinc-900"
                style={popIn(frame, fps, row.tickAt)}
              >
                ✓
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TokenIcon symbol={row.symbol} size={36} />
              <span className="text-2xl font-medium text-zinc-100">{row.symbol}</span>
              <span className="text-2xl text-zinc-400">{row.spender}</span>
            </div>
          </div>
        ))}
      </div>
      <div
        className="flex items-center justify-between border-t border-zinc-800 px-10 py-6"
        style={riseIn(frame, fps, 32)}
      >
        <span className="text-xl text-zinc-400">{selectedLabel} · No batch fee</span>
        <div
          className="rounded-lg bg-white px-7 py-2.5 text-lg font-medium text-zinc-900"
          style={pulseOnce(frame, fps, 130)}
        >
          Revoke Selected
        </div>
      </div>
    </ShowcaseFrame>
  );
};
