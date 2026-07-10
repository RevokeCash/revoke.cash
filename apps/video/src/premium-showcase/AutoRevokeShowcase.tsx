import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Pill } from '../components/Pill';
import { ShowcaseFrame } from '../components/ShowcaseFrame';
import { TokenIcon } from '../components/TokenIcon';
import { riseIn } from '../motion';

// Animated mockup for the premium pricing page's feature showcase (1200x630): the auto-revoking
// activity log, where the detected approvals advance through the pipeline from pending to revoked
// across the three trigger types. Rendered to apps/web/public/assets/videos/premium/auto-revoke.mp4;
// the final frame doubles as the poster at apps/web/public/assets/images/premium/auto-revoke.jpg.

interface StatusStep {
  at: number;
  label: string;
  className: string;
}

interface ActivityRow {
  symbol: string;
  spender: string;
  appearAt: number;
  trigger: { label: string; className: string };
  statusTimeline: StatusStep[];
}

// Pill colors follow the real StatusLabel dark-mode variants and the real badge mappings in
// AutoRevokeActivityStatusBadge.tsx / AutoRevokeActivityTriggerBadge.tsx.
const ACTIVITY_ROWS: ActivityRow[] = [
  {
    symbol: 'USDT',
    spender: '0xd00dfa...C0Ffee',
    appearAt: 5,
    trigger: { label: 'Exploit', className: 'bg-red-900/40 text-red-400' },
    statusTimeline: [
      { at: 5, label: 'Pending', className: 'bg-yellow-900/40 text-yellow-400' },
      { at: 85, label: 'Submitting', className: 'bg-blue-900/40 text-blue-400' },
      { at: 150, label: 'Revoked', className: 'bg-green-900/40 text-green-400' },
    ],
  },
  {
    symbol: 'WETH',
    spender: 'Old DEX Router',
    appearAt: 15,
    trigger: { label: 'Stale', className: 'bg-zinc-800 text-zinc-400' },
    statusTimeline: [
      { at: 15, label: 'Pending', className: 'bg-yellow-900/40 text-yellow-400' },
      { at: 190, label: 'Submitting', className: 'bg-blue-900/40 text-blue-400' },
    ],
  },
  {
    symbol: 'PEPE',
    spender: '0x1337de...aDBeef',
    appearAt: 25,
    trigger: { label: 'Risky', className: 'bg-yellow-900/40 text-yellow-400' },
    statusTimeline: [{ at: 25, label: 'Pending', className: 'bg-yellow-900/40 text-yellow-400' }],
  },
];

export const AutoRevokeShowcase = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <ShowcaseFrame title="Activity">
      <div className="divide-y divide-zinc-800">
        {ACTIVITY_ROWS.map((row) => (
          <div
            key={row.symbol}
            className="flex items-center justify-between gap-5 px-10 py-8"
            style={riseIn(frame, fps, row.appearAt)}
          >
            <div className="flex items-center gap-3">
              <TokenIcon symbol={row.symbol} size={40} />
              <span className="text-2xl font-medium text-zinc-100">{row.symbol}</span>
              <span className="text-2xl text-zinc-400">{row.spender}</span>
            </div>
            <div className="flex items-center gap-3">
              <Pill className={`px-4 py-1.5 text-lg ${row.trigger.className}`}>{row.trigger.label}</Pill>
              <AnimatedStatusPill frame={frame} fps={fps} timeline={row.statusTimeline} />
            </div>
          </div>
        ))}
      </div>
    </ShowcaseFrame>
  );
};

interface AnimatedStatusPillProps {
  frame: number;
  fps: number;
  timeline: StatusStep[];
}

const AnimatedStatusPill = ({ frame, fps, timeline }: AnimatedStatusPillProps) => {
  const current = timeline.filter((step) => frame >= step.at).at(-1) ?? timeline[0];
  const changePop = spring({ frame: frame - current.at, fps, durationInFrames: 15 });

  return (
    <div style={{ transform: `scale(${interpolate(changePop, [0, 1], [0.7, 1])})` }}>
      <Pill className={`w-36 py-1.5 text-lg ${current.className}`}>{current.label}</Pill>
    </div>
  );
};
