import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { riseIn } from '../../motion';
import {
  ApprovalTimeline,
  EXPLOIT_AT,
  MAGIC_EDEN_CLOSED_AT,
  type PlayheadKeyframe,
  STALE_REVOKED_AT,
  TIMELINE_START,
} from '../components/ApprovalTimeline';

// The playhead pauses briefly on each event so the markers have time to land.
const PLAYHEAD_KEYFRAMES: PlayheadKeyframe[] = [
  { frame: 18, date: TIMELINE_START },
  { frame: 40, date: MAGIC_EDEN_CLOSED_AT },
  { frame: 50, date: MAGIC_EDEN_CLOSED_AT },
  { frame: 110, date: STALE_REVOKED_AT },
  { frame: 126, date: STALE_REVOKED_AT },
  { frame: 144, date: EXPLOIT_AT },
];

// The core argument: the same Magic Eden approval without cleanup runs into the exploit, and with
// Stale Approval Cleanup it is revoked 20 days before the exploit hits.
export const CleanupComparisonScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill className="items-center justify-center gap-16 bg-black">
      <h1 className="text-center font-heading text-[88px] leading-[1.05] font-semibold tracking-tight text-white">
        <span className="block" style={riseIn(frame, fps, 0)}>
          Magic Eden left Ethereum in March.
        </span>
        <span className="block text-brand" style={riseIn(frame, fps, 8)}>
          Stale approvals don&apos;t have to stay.
        </span>
      </h1>
      <div style={riseIn(frame, fps, 10)}>
        <ApprovalTimeline frame={frame} fps={fps} keyframes={PLAYHEAD_KEYFRAMES} />
      </div>
    </AbsoluteFill>
  );
};
