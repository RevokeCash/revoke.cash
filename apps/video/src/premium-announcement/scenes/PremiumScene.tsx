import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ApprovalsTable } from '../../components/ApprovalsTable';
import { TimeMachinePanel } from '../../components/TimeMachinePanel';
import { MOCK_APPROVALS, MOCK_CHAIN_LOGOS } from '../../data/mock-data';
import { popIn, riseIn } from '../../motion';

// Beat 1: the multichain dashboard assembles. Beat 2: the time machine scrubs it back in time,
// and the exploit marker disappears — the approval was still "safe" back then. The headline hands
// off to a dedicated Time Machine title as the panel slides in, so the feature gets its own beat.
export const PremiumScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const historyBeatProgress = interpolate(frame, [118, 138], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scrubProgress = interpolate(frame, [150, 240], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scrubMonthsBack = scrubProgress * 36;
  const exploitedHighlightOpacity =
    1 -
    interpolate(scrubProgress, [0.45, 0.75], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  // The dashboard block shifts up as the time machine slides in below it.
  const beatShift = interpolate(frame, [120, 145], [80, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill className="items-center justify-center gap-16 bg-black">
      <div className="relative h-[150px] w-[1500px] text-center">
        <div className="absolute inset-0 flex flex-col items-center gap-6" style={{ opacity: 1 - historyBeatProgress }}>
          <h1 className="font-heading text-8xl font-semibold tracking-tight text-white" style={riseIn(frame, fps, 0)}>
            All your chains. <span className="text-brand">One dashboard.</span>
          </h1>
          <p className="text-4xl text-zinc-400" style={riseIn(frame, fps, 10)}>
            Premium — $99/yr · 10 wallets · 100+ networks
          </p>
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center gap-6"
          style={{ opacity: historyBeatProgress, transform: `translateY(${(1 - historyBeatProgress) * 28}px)` }}
        >
          <h1 className="whitespace-nowrap font-heading text-8xl font-semibold tracking-tight text-white">
            Travel back through <span className="text-brand">approval history.</span>
          </h1>
          <p className="text-4xl text-zinc-400">Time Machine · Included with Premium</p>
        </div>
      </div>
      <div
        className="flex items-center gap-8"
        style={{ opacity: 1 - historyBeatProgress, transform: `translateY(${historyBeatProgress * 55}px)` }}
      >
        {MOCK_CHAIN_LOGOS.map((logo, index) => (
          <Img
            key={logo}
            src={staticFile(logo)}
            className="h-20 w-20 rounded-full"
            style={popIn(frame, fps, 20 + index * 4)}
          />
        ))}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 text-2xl font-semibold text-zinc-300"
          style={popIn(frame, fps, 20 + MOCK_CHAIN_LOGOS.length * 4)}
        >
          +100
        </div>
      </div>
      <div
        className="flex flex-col items-stretch gap-6"
        style={{ transform: `translateY(${beatShift}px) scale(1.3)`, transformOrigin: 'center' }}
      >
        <div style={riseIn(frame, fps, 45)}>
          <ApprovalsTable
            approvals={MOCK_APPROVALS.slice(0, 3)}
            rowMotion={{ frame, fps, startAt: 50, stagger: 6 }}
            exploitedHighlightOpacity={exploitedHighlightOpacity}
            // Approvals vanish as the scrub moves back past the time they were granted.
            rowPresence={(approval) =>
              interpolate(scrubMonthsBack, [approval.monthsAgo - 5, approval.monthsAgo - 1], [1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            }
          />
        </div>
        <TimeMachinePanel progress={scrubProgress} style={riseIn(frame, fps, 125)} />
      </div>
    </AbsoluteFill>
  );
};
