import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { riseIn } from '../../motion';
import {
  ApprovalTimeline,
  EXPLOIT_AT,
  MAGIC_EDEN_STOPPED_AT,
  type PlayheadKeyframe,
  STALE_AT,
  TIMELINE_START,
  ULTIMATE_LAUNCHED_AT,
} from '../components/ApprovalTimeline';

// The playhead pauses briefly on each event so the markers have time to land. The event frames sit on
// the soundtrack's beat grid (every 12 frames in the full video), so keep them in step with
// scripts/stale-approval-soundtrack/arrangement.mjs.
const PLAYHEAD_KEYFRAMES: PlayheadKeyframe[] = [
  { frame: 18, date: TIMELINE_START },
  { frame: 36, date: MAGIC_EDEN_STOPPED_AT },
  { frame: 44, date: MAGIC_EDEN_STOPPED_AT },
  { frame: 73, date: STALE_AT },
  { frame: 79, date: STALE_AT },
  { frame: 109, date: ULTIMATE_LAUNCHED_AT },
  { frame: 121, date: ULTIMATE_LAUNCHED_AT },
  { frame: 144, date: EXPLOIT_AT },
];

// The core argument: the same Magic Eden approval turns stale in April 2025. Left alone, it runs into
// the exploit; with Stale Approval Cleanup, it is revoked once Revoke Ultimate launches in July 2026,
// ten weeks before the exploit hits.
export const CleanupComparisonScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill className="items-center justify-center gap-16 bg-black">
      <h1 className="text-center font-heading text-[88px] leading-[1.05] font-semibold tracking-tight text-white">
        <span className="block" style={riseIn(frame, fps, 0)}>
          Approved in 2024. Exploited in 2026.
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
