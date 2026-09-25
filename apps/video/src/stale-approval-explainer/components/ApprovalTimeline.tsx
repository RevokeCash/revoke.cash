import { Easing, interpolate, interpolateColors, spring } from 'remotion';
import { Pill } from '../../components/Pill';
import { popIn } from '../../motion';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Magic Eden's Ethereum marketplace shut down on 9 March 2026, so every approval it created is at
// least that old. Even an approval from that very last day passed the default 180-day Stale Approval
// Cleanup threshold on 5 September, 20 days before the exploit on 25 September.
export const MAGIC_EDEN_CLOSED_AT = Date.UTC(2026, 2, 9);
export const STALE_THRESHOLD_DAYS = 180;
export const STALE_REVOKED_AT = MAGIC_EDEN_CLOSED_AT + STALE_THRESHOLD_DAYS * DAY_IN_MS;
export const EXPLOIT_AT = Date.UTC(2026, 8, 25);
export const TIMELINE_START = Date.UTC(2026, 0, 1);
const TIMELINE_END = Date.UTC(2026, 10, 1);
const MONTH_STARTS = Array.from({ length: 10 }, (_, monthIndex) => Date.UTC(2026, monthIndex, 1));
// Spelled out instead of toLocaleDateString, whose en-GB output abbreviates September as "Sept".
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TIMELINE_WIDTH = 1600;
const MARKER_LABEL_TOP = 10;
const MARKER_LINE_TOP = MARKER_LABEL_TOP + 84;
const TRACKS_TOP = 124;
const TRACK_SPACING = 132;
const BAR_HEIGHT = 58;
const BRACKET_OFFSET = BAR_HEIGHT + 30;
const AXIS_TOP = TRACKS_TOP + 2 * TRACK_SPACING;
const TIMELINE_HEIGHT = AXIS_TOP + 100;
// The approval existed before the timeline starts, so the bar fades in from the left edge.
const BAR_FADE_WIDTH = 120;

export interface PlayheadKeyframe {
  frame: number;
  date: number;
}

interface Props {
  frame: number;
  fps: number;
  keyframes: PlayheadKeyframe[];
}

// The same approval on a Jan-Oct 2026 axis, twice: once left alone, once with Stale Approval Cleanup.
// One playhead sweeps through the keyframes for both tracks and every marker appears when the
// playhead reaches its date.
export const ApprovalTimeline = ({ frame, fps, keyframes }: Props) => {
  const playhead = interpolate(
    frame,
    keyframes.map((keyframe) => keyframe.frame),
    keyframes.map((keyframe) => keyframe.date),
    { easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const exploitAt = frameWhenReached(keyframes, EXPLOIT_AT);

  return (
    <div className="relative" style={{ width: TIMELINE_WIDTH, height: TIMELINE_HEIGHT }}>
      <EventMarker
        frame={frame}
        fps={fps}
        appearAt={frameWhenReached(keyframes, MAGIC_EDEN_CLOSED_AT)}
        x={dateToX(MAGIC_EDEN_CLOSED_AT)}
        align="left"
        date="9 Mar"
        title="Magic Eden closes on Ethereum"
        titleClassName="text-zinc-100"
      />
      <EventMarker
        frame={frame}
        fps={fps}
        appearAt={exploitAt}
        x={dateToX(EXPLOIT_AT)}
        align="right"
        date="25 Sep"
        title="Exploit"
        titleClassName="text-red-400"
      />
      <ApprovalTrack
        frame={frame}
        fps={fps}
        top={TRACKS_TOP}
        label="Without cleanup"
        playhead={playhead}
        exploitAt={exploitAt}
        revokedAt={null}
      />
      <ApprovalTrack
        frame={frame}
        fps={fps}
        top={TRACKS_TOP + TRACK_SPACING}
        label="With Revoke Ultimate"
        playhead={playhead}
        exploitAt={exploitAt}
        revokedAt={frameWhenReached(keyframes, STALE_REVOKED_AT)}
      />
      <Axis />
      <Playhead playhead={playhead} />
    </div>
  );
};

const dateToX = (date: number) => ((date - TIMELINE_START) / (TIMELINE_END - TIMELINE_START)) * TIMELINE_WIDTH;

// Markers sit on keyframe dates, so the playhead reaches one at the first keyframe at or past its date.
const frameWhenReached = (keyframes: PlayheadKeyframe[], date: number) =>
  keyframes.find((keyframe) => keyframe.date >= date)?.frame ?? Number.POSITIVE_INFINITY;

const formatDate = (date: number) => {
  const dateObject = new Date(date);
  return `${dateObject.getUTCDate()} ${MONTH_NAMES[dateObject.getUTCMonth()]}`;
};

interface EventMarkerProps {
  frame: number;
  fps: number;
  appearAt: number;
  x: number;
  // Which side of the label the drop line sits on, so labels near the right edge grow leftwards.
  align: 'left' | 'right';
  date: string;
  title: string;
  titleClassName: string;
}

const EventMarker = ({ frame, fps, appearAt, x, align, date, title, titleClassName }: EventMarkerProps) => {
  if (frame < appearAt) return null;

  const lineGrow = spring({ frame: frame - appearAt, fps, config: { damping: 200 }, durationInFrames: 20 });

  return (
    <>
      <div
        className="absolute w-[3px] origin-top bg-zinc-500"
        style={{
          left: x - 1.5,
          top: MARKER_LINE_TOP,
          height: AXIS_TOP - MARKER_LINE_TOP,
          transform: `scaleY(${lineGrow})`,
        }}
      />
      <div
        className="absolute flex flex-col gap-1 whitespace-nowrap"
        style={{
          top: MARKER_LABEL_TOP,
          ...(align === 'left' ? { left: x } : { right: TIMELINE_WIDTH - x }),
          alignItems: align === 'left' ? 'flex-start' : 'flex-end',
          ...popIn(frame, fps, appearAt),
          transformOrigin: align === 'left' ? 'bottom left' : 'bottom right',
        }}
      >
        <span className="text-2xl text-zinc-400">{date}</span>
        <span className={`font-heading text-[40px] leading-none font-semibold ${titleClassName}`}>{title}</span>
      </div>
    </>
  );
};

interface ApprovalTrackProps {
  frame: number;
  fps: number;
  top: number;
  label: string;
  playhead: number;
  exploitAt: number;
  // The frame Stale Approval Cleanup revokes the approval, or null when nothing ever revokes it.
  revokedAt: number | null;
}

const ApprovalTrack = ({ frame, fps, top, label, playhead, exploitAt, revokedAt }: ApprovalTrackProps) => {
  const isCleanedUp = revokedAt !== null;
  const approvalEnd = isCleanedUp ? Math.min(playhead, STALE_REVOKED_AT) : playhead;
  const endStateAt = revokedAt ?? exploitAt;

  return (
    <>
      <EmptyTrack top={top} />
      <ApprovalBar
        frame={frame}
        fps={fps}
        top={top}
        label={label}
        approvalEnd={approvalEnd}
        isCleanedUp={isCleanedUp}
        endStateAt={endStateAt}
      />
      <ExploitPulse frame={frame} top={top} exploitAt={exploitAt} />
      <DayCountBracket
        frame={frame}
        fps={fps}
        top={top + BRACKET_OFFSET}
        playhead={playhead}
        end={isCleanedUp ? STALE_REVOKED_AT : EXPLOIT_AT}
        completeAt={endStateAt}
        isCleanedUp={isCleanedUp}
      />
      {/* Raised above the playhead, which stops on the exploit date right behind this pill. */}
      {isCleanedUp && frame >= exploitAt && (
        <div
          className="absolute z-10"
          style={{ left: dateToX(EXPLOIT_AT), top: top + BAR_HEIGHT / 2, transform: 'translate(-50%, -50%)' }}
        >
          <div style={popIn(frame, fps, exploitAt + 6)}>
            <Pill className="whitespace-nowrap bg-green-900 px-4 py-1.5 text-2xl text-green-400">Not affected</Pill>
          </div>
        </div>
      )}
    </>
  );
};

// The dashed track shows where no approval exists, which is what the exploit hits after a revoke.
const EmptyTrack = ({ top }: { top: number }) => {
  return (
    <div
      className="absolute rounded-xl border-2 border-dashed border-zinc-800"
      style={{ left: 0, top, width: TIMELINE_WIDTH, height: BAR_HEIGHT }}
    />
  );
};

interface ApprovalBarProps {
  frame: number;
  fps: number;
  top: number;
  label: string;
  approvalEnd: number;
  isCleanedUp: boolean;
  // The frame the bar turns red (exploited) or dims (revoked).
  endStateAt: number;
}

const ApprovalBar = ({ frame, fps, top, label, approvalEnd, isCleanedUp, endStateAt }: ApprovalBarProps) => {
  const endStateProgress = interpolate(frame, [endStateAt, endStateAt + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const endStateColor = isCleanedUp ? '#3f3f46' : '#dc2626';
  const endStateTextColor = isCleanedUp ? '#a1a1aa' : '#ffffff';

  return (
    <div
      className="absolute flex items-center overflow-hidden rounded-r-xl"
      style={{
        left: 0,
        top,
        width: dateToX(approvalEnd),
        height: BAR_HEIGHT,
        backgroundColor: interpolateColors(endStateProgress, [0, 1], ['#e4e4e7', endStateColor]),
        maskImage: `linear-gradient(to right, transparent 0, black ${BAR_FADE_WIDTH}px)`,
      }}
    >
      <span
        className="shrink-0 pl-[110px] text-[28px] font-semibold whitespace-nowrap"
        style={{ color: interpolateColors(endStateProgress, [0, 1], ['#18181b', endStateTextColor]) }}
      >
        {label}
      </span>
      {frame >= endStateAt && (
        <div className="ml-auto pr-3" style={popIn(frame, fps, endStateAt)}>
          {isCleanedUp ? (
            <Pill className="whitespace-nowrap bg-green-900 px-4 py-1.5 text-2xl text-green-400">Revoked</Pill>
          ) : (
            <Pill className="whitespace-nowrap bg-red-950 px-4 py-1.5 text-2xl text-red-300">Exploited</Pill>
          )}
        </div>
      )}
    </div>
  );
};

// A red ring that expands from the exploit date on a track, whether or not it hits an approval.
const ExploitPulse = ({ frame, top, exploitAt }: { frame: number; top: number; exploitAt: number }) => {
  if (frame < exploitAt) return null;

  const progress = interpolate(frame, [exploitAt, exploitAt + 20], [0, 1], { extrapolateRight: 'clamp' });
  const size = interpolate(progress, [0, 1], [20, 180]);

  return (
    <div
      className="absolute rounded-full border-4 border-red-500"
      style={{
        left: dateToX(EXPLOIT_AT) - size / 2,
        top: top + BAR_HEIGHT / 2 - size / 2,
        width: size,
        height: size,
        opacity: 1 - progress,
      }}
    />
  );
};

interface DayCountBracketProps {
  frame: number;
  fps: number;
  top: number;
  playhead: number;
  end: number;
  completeAt: number;
  isCleanedUp: boolean;
}

// Counts the days since Magic Eden closed while the playhead moves, then settles on the outcome:
// still approved after 200 days, or auto-revoked after 180.
const DayCountBracket = ({ frame, fps, top, playhead, end, completeAt, isCleanedUp }: DayCountBracketProps) => {
  if (playhead <= MAGIC_EDEN_CLOSED_AT) return null;

  const bracketEnd = Math.min(playhead, end);
  const dayCount = Math.round((bracketEnd - MAGIC_EDEN_CLOSED_AT) / DAY_IN_MS);
  const isComplete = frame >= completeAt;
  const completeColor = isCleanedUp ? 'text-green-400' : 'text-red-400';
  const completeLineColor = isCleanedUp ? 'bg-green-400' : 'bg-red-400';
  const lineColor = isComplete ? completeLineColor : 'bg-zinc-500';
  const outcome = isCleanedUp ? 'auto-revoked' : 'still approved';
  const outcomePop = spring({ frame: frame - completeAt, fps, durationInFrames: 15 });

  const left = dateToX(MAGIC_EDEN_CLOSED_AT);
  const width = dateToX(bracketEnd) - left;

  // The count sits on the bracket line like a dimension label, with a black backing that cuts the line.
  return (
    <div className="absolute" style={{ left, top, width }}>
      <div className={`absolute left-0 h-4 w-[3px] ${lineColor}`} style={{ top: -6 }} />
      <div className={`absolute right-0 h-4 w-[3px] ${lineColor}`} style={{ top: -6 }} />
      <div className={`h-[3px] w-full ${lineColor}`} />
      <div className="absolute inset-x-0 flex justify-center" style={{ top: -20 }}>
        <span
          className={`whitespace-nowrap bg-black px-4 font-heading text-[30px] leading-[40px] font-semibold tabular-nums ${isComplete ? completeColor : 'text-zinc-300'}`}
          style={isComplete ? { transform: `scale(${interpolate(outcomePop, [0, 1], [0.85, 1])})` } : undefined}
        >
          {dayCount} days{isComplete ? `: ${outcome}` : ''}
        </span>
      </div>
    </div>
  );
};

const Axis = () => {
  return (
    <>
      <div className="absolute h-[3px] bg-zinc-700" style={{ left: 0, top: AXIS_TOP, width: TIMELINE_WIDTH }} />
      {MONTH_STARTS.map((monthStart) => (
        <div key={monthStart} className="absolute" style={{ left: dateToX(monthStart), top: AXIS_TOP }}>
          <div className="h-3 w-[3px] bg-zinc-700" />
          <span className="absolute top-4 left-3 text-2xl text-zinc-500">
            {MONTH_NAMES[new Date(monthStart).getUTCMonth()]}
          </span>
        </div>
      ))}
    </>
  );
};

const Playhead = ({ playhead }: { playhead: number }) => {
  const x = dateToX(playhead);

  return (
    <>
      <div
        className="absolute w-[3px] bg-white"
        style={{ left: x - 1.5, top: TRACKS_TOP - 16, height: AXIS_TOP - TRACKS_TOP + 16 }}
      />
      <div className="absolute" style={{ left: x, top: AXIS_TOP + 54, transform: 'translateX(-50%)' }}>
        <div className="whitespace-nowrap rounded-full bg-white px-4 py-1 text-2xl font-semibold text-zinc-900 tabular-nums">
          {formatDate(playhead)} 2026
        </div>
      </div>
    </>
  );
};
