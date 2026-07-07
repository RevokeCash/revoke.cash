import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { ApprovalsTable } from '../../components/ApprovalsTable';
import { MOCK_APPROVALS } from '../../data/mock-data';
import { riseIn } from '../../motion';

export const ProblemScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The red exploit highlight lands as its own beat after the table has settled.
  const exploitedHighlightOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill className="items-center justify-center gap-24 bg-black">
      <h1 className="text-center font-heading text-8xl font-semibold tracking-tight text-white">
        <span className="block" style={riseIn(frame, fps, 0)}>
          One forgotten approval
        </span>
        <span className="block text-red-400" style={riseIn(frame, fps, 10)}>
          is all it takes.
        </span>
      </h1>
      <div style={{ ...riseIn(frame, fps, 25), transform: 'scale(1.4)', transformOrigin: 'center' }}>
        <ApprovalsTable
          approvals={MOCK_APPROVALS}
          rowMotion={{ frame, fps, startAt: 35, stagger: 5 }}
          exploitedHighlightOpacity={exploitedHighlightOpacity}
        />
      </div>
    </AbsoluteFill>
  );
};
