import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { riseIn } from '../motion';

const STATS = [
  { value: '$140M+', label: 'protected from exploits' },
  { value: '2M+', label: 'total users' },
  { value: '20M+', label: 'approvals revoked' },
];

const STATS_APPEAR_AT = 55;

export const HookScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill className="items-center justify-center bg-black">
      <div className="flex max-w-[1400px] flex-col items-center gap-24 text-center">
        <h1 className="font-heading text-9xl font-semibold tracking-tight text-white">
          <span className="block" style={riseIn(frame, fps, 0)}>
            Your old token approvals
          </span>
          <span className="block text-brand" style={riseIn(frame, fps, 12)}>
            never expire.
          </span>
        </h1>
        <div className="flex items-center gap-20">
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2"
              style={riseIn(frame, fps, STATS_APPEAR_AT + index * 8)}
            >
              <span className="font-heading text-6xl font-semibold text-brand">{stat.value}</span>
              <span className="text-3xl text-zinc-400">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
