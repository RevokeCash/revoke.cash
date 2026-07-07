import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Panel } from '../components/Panel';
import { type ActivityStatus, StatusPill } from '../components/StatusPill';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { TokenIcon } from '../components/TokenIcon';
import { TriggerPill } from '../components/TriggerPill';
import { riseIn } from '../motion';

// The flagship beat: rules flip on, then the activity feed shows revokes happening on their own —
// the USDT exploit goes Pending -> Submitting -> Revoked while you watch.
export const AutoRevokeScene = () => {
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
          Threats revoked. <span className="text-brand">Automatically.</span>
        </h1>
        <p className="text-4xl text-zinc-400" style={riseIn(frame, fps, 10)}>
          Ultimate — $199/yr · set-and-forget protection, even while you sleep
        </p>
      </div>
      <div
        className="flex flex-col items-center gap-8"
        style={{ transform: 'translateY(60px) scale(1.6)', transformOrigin: 'center' }}
      >
        <div className="flex items-stretch gap-12">
          <div style={panelSlide(20, -60)}>
            <RulesPanel frame={frame} fps={fps} />
          </div>
          <div style={panelSlide(27, 60)}>
            <ActivityPanel frame={frame} fps={fps} />
          </div>
        </div>
        <p className="text-sm text-zinc-500" style={riseIn(frame, fps, 220)}>
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

const RulesPanel = ({ frame, fps }: SceneClock) => {
  return (
    <Panel title="Auto-Revoke Rules" className="h-full w-[440px]">
      <div className="flex flex-col gap-4">
        <RuleRow
          frame={frame}
          fps={fps}
          toggleAt={45}
          name="Risky Approval Detection"
          description="Auto-revoke approvals to risky or exploited spenders."
          value="Exploits only"
        />
        <RuleRow
          frame={frame}
          fps={fps}
          toggleAt={58}
          name="Stale Approval Cleanup"
          description="Revoke approvals older than the specified number of days."
          value="180 days"
        />
      </div>
    </Panel>
  );
};

interface RuleRowProps extends SceneClock {
  toggleAt: number;
  name: string;
  description: string;
  value: string;
}

const RuleRow = ({ frame, fps, toggleAt, name, description, value }: RuleRowProps) => {
  const toggleProgress = spring({ frame: frame - toggleAt, fps, durationInFrames: 20 });
  const valueOpacity = interpolate(frame, [toggleAt + 12, toggleAt + 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-zinc-100">{name}</span>
        <span className="text-xs text-zinc-400">{description}</span>
        <span className="text-xs font-medium text-brand" style={{ opacity: valueOpacity }}>
          {value}
        </span>
      </div>
      <ToggleSwitch progress={toggleProgress} />
    </div>
  );
};

interface ActivityEntry {
  symbol: string;
  spender: string;
  trigger: 'exploit' | 'risky' | 'stale';
  appearAt: number;
  statusTimeline: Array<{ at: number; status: ActivityStatus }>;
}

const ACTIVITY_ENTRIES: ActivityEntry[] = [
  {
    symbol: 'USDT',
    spender: '0xd00d...Feed',
    trigger: 'exploit',
    appearAt: 80,
    statusTimeline: [
      { at: 0, status: 'pending' },
      { at: 125, status: 'submitting' },
      { at: 175, status: 'revoked' },
    ],
  },
  {
    symbol: 'WETH',
    spender: 'Old DEX Router',
    trigger: 'stale',
    appearAt: 92,
    statusTimeline: [
      { at: 0, status: 'pending' },
      { at: 200, status: 'submitting' },
    ],
  },
  {
    symbol: 'PEPE',
    spender: '0x1337...Beef',
    trigger: 'risky',
    appearAt: 104,
    statusTimeline: [{ at: 0, status: 'pending' }],
  },
];

const ActivityPanel = ({ frame, fps }: SceneClock) => {
  return (
    <Panel title="Activity" className="h-full w-[440px]">
      <div className="flex flex-col gap-3">
        {ACTIVITY_ENTRIES.map((entry) => (
          <div
            key={entry.symbol}
            className="flex items-center justify-between gap-4"
            style={riseIn(frame, fps, entry.appearAt)}
          >
            <div className="flex items-center gap-2 text-sm text-zinc-100">
              <TokenIcon symbol={entry.symbol} size={20} />
              <span className="font-medium">{entry.symbol}</span>
              <span className="text-zinc-400">{entry.spender}</span>
            </div>
            <div className="flex items-center gap-2">
              <TriggerPill trigger={entry.trigger} />
              <AnimatedStatusPill frame={frame} fps={fps} timeline={entry.statusTimeline} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
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
