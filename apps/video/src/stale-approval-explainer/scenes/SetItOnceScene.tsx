import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Panel } from '../../components/Panel';
import { type ActivityStatus, StatusPill } from '../../components/StatusPill';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { TokenIcon } from '../../components/TokenIcon';
import { TriggerPill } from '../../components/TriggerPill';
import { riseIn } from '../../motion';

// The product beat: Stale Approval Cleanup switches on, then the activity feed revokes old
// approvals on its own, starting with the Payment Processor V2 approval from the timeline.
export const SetItOnceScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelSlide = (delay: number, fromX: number) => {
    const progress = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 30 });
    return { opacity: progress, transform: `translateX(${interpolate(progress, [0, 1], [fromX, 0])}px)` };
  };

  return (
    <AbsoluteFill className="items-center justify-center gap-20 bg-black">
      <div className="flex flex-col items-center gap-6">
        <h1 className="font-heading text-8xl font-semibold tracking-tight text-white" style={riseIn(frame, fps, 0)}>
          Set it once. <span className="text-brand">Ultimate does the rest.</span>
        </h1>
        <p className="text-4xl text-zinc-400" style={riseIn(frame, fps, 10)}>
          Pick your own limit, from 1 to 365 days.
        </p>
      </div>
      <div
        className="flex flex-col items-center gap-8"
        style={{ transform: 'translateY(50px) scale(1.5)', transformOrigin: 'center' }}
      >
        <div className="flex items-stretch gap-10">
          <div style={panelSlide(12, -60)}>
            <RulesPanel frame={frame} fps={fps} />
          </div>
          <div style={panelSlide(18, 60)}>
            <ActivityPanel frame={frame} fps={fps} />
          </div>
        </div>
        <p className="text-sm text-zinc-500" style={riseIn(frame, fps, 130)}>
          Requires MetaMask · Supported on select networks
        </p>
      </div>
    </AbsoluteFill>
  );
};

interface SceneClock {
  frame: number;
  fps: number;
}

const STALE_TOGGLE_AT = 32;

const RulesPanel = ({ frame, fps }: SceneClock) => {
  const toggleProgress = spring({ frame: frame - STALE_TOGGLE_AT, fps, durationInFrames: 20 });
  const thresholdOpacity = interpolate(frame, [STALE_TOGGLE_AT + 10, STALE_TOGGLE_AT + 22], [0.4, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <Panel title="Rules" className="h-full w-[420px]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-zinc-100">Stale Approval Cleanup</span>
            <span className="text-xs text-zinc-400">Revoke approvals older than the specified number of days.</span>
          </div>
          <div className="flex items-center gap-2" style={{ opacity: thresholdOpacity }}>
            <div className="w-16 rounded-md border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-zinc-100">
              180
            </div>
            <span className="text-xs text-zinc-400">days</span>
          </div>
        </div>
        <ToggleSwitch progress={toggleProgress} />
      </div>
    </Panel>
  );
};

interface ActivityEntry {
  asset: 'NFT' | 'WETH' | 'PEPE';
  assetLabel: string;
  spender: string;
  date: string;
  appearAt: number;
  statusTimeline: Array<{ at: number; status: ActivityStatus }>;
}

const ACTIVITY_ENTRIES: ActivityEntry[] = [
  {
    asset: 'NFT',
    assetLabel: 'NFT Collection',
    spender: 'Payment Processor V2',
    date: '5 Sep',
    appearAt: 50,
    statusTimeline: [
      { at: 0, status: 'pending' },
      { at: 78, status: 'submitting' },
      { at: 98, status: 'revoked' },
    ],
  },
  {
    asset: 'WETH',
    assetLabel: 'WETH',
    spender: 'Old DEX Router',
    date: '5 Sep',
    appearAt: 56,
    statusTimeline: [
      { at: 0, status: 'pending' },
      { at: 90, status: 'submitting' },
      { at: 110, status: 'revoked' },
    ],
  },
  {
    asset: 'PEPE',
    assetLabel: 'PEPE',
    spender: '0x1337de...aDBeef',
    date: '5 Sep',
    appearAt: 62,
    statusTimeline: [
      { at: 0, status: 'pending' },
      { at: 102, status: 'submitting' },
      { at: 122, status: 'revoked' },
    ],
  },
];

const ActivityPanel = ({ frame, fps }: SceneClock) => {
  return (
    <Panel title="Activity" className="h-full w-[600px]">
      <div className="flex flex-col gap-3">
        {ACTIVITY_ENTRIES.map((entry) => (
          <div
            key={entry.spender}
            className="flex items-center justify-between gap-4"
            style={riseIn(frame, fps, entry.appearAt)}
          >
            <div className="flex items-center gap-2 text-sm text-zinc-100">
              {entry.asset === 'NFT' ? <NftCollectionIcon /> : <TokenIcon symbol={entry.asset} size={20} />}
              <span className="font-medium">{entry.assetLabel}</span>
              <span className="text-zinc-400">{entry.spender}</span>
            </div>
            <div className="flex items-center gap-2">
              <TriggerPill trigger="stale" />
              <AnimatedStatusPill frame={frame} fps={fps} timeline={entry.statusTimeline} />
              <span className="w-10 text-right text-xs text-zinc-400">{entry.date}</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

// Generic square artwork, since NFT collections have square images rather than round token logos.
const NftCollectionIcon = () => {
  return (
    <div className="size-5 shrink-0 rounded-md" style={{ background: 'linear-gradient(135deg, #c084fc, #4f46e5)' }} />
  );
};

interface AnimatedStatusPillProps extends SceneClock {
  timeline: ActivityEntry['statusTimeline'];
}

const AnimatedStatusPill = ({ frame, fps, timeline }: AnimatedStatusPillProps) => {
  const current = timeline.filter((step) => frame >= step.at).at(-1) ?? timeline[0];
  const changePop = spring({ frame: frame - current.at, fps, durationInFrames: 15 });

  return (
    <div style={{ transform: `scale(${interpolate(changePop, [0, 1], [0.7, 1])})` }}>
      <StatusPill status={current.status} />
    </div>
  );
};
