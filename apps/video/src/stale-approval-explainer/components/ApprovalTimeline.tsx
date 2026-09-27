import { Easing, interpolate, interpolateColors, spring } from 'remotion';
import { Pill } from '../../components/Pill';
import { popIn } from '../../motion';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Magic Eden stopped using Payment Processor in October 2024, so every approval it created is at
// least that old. Counting from the last day of that month, those approvals passed the default 180-day
// Stale Approval Cleanup threshold on 29 April 2025. Auto-Revoking only launched on 16 July 2026, so
// that is the earliest it could revoke them: ten weeks before the exploit on 24 September 2026.
export const MAGIC_EDEN_STOPPED_AT = Date.UTC(2024, 9, 31);
export const STALE_THRESHOLD_DAYS = 180;
export const STALE_AT = MAGIC_EDEN_STOPPED_AT + STALE_THRESHOLD_DAYS * DAY_IN_MS;
export const ULTIMATE_LAUNCHED_AT = Date.UTC(2026, 6, 16);
export const EXPLOIT_AT = Date.UTC(2026, 8, 24);
export const TIMELINE_START = Date.UTC(2024, 6, 1);
const TIMELINE_END = Date.UTC(2026, 10, 1);
// One axis label per quarter, from July 2024 to October 2026. January shows the year instead.
const QUARTER_STARTS = Array.from({ length: 10 }, (_, quarterIndex) => Date.UTC(2024, 6 + quarterIndex * 3, 1));
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

// The same approval on a July 2024 to October 2026 axis, twice: once left alone, and once with
// Stale Approval Cleanup from the day Revoke Ultimate launched. Both turn stale after 180 days. One
// playhead sweeps through the keyframes for both tracks and every marker appears when the playhead
// reaches its date.
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
        appearAt={frameWhenReached(keyframes, MAGIC_EDEN_STOPPED_AT)}
        x={dateToX(MAGIC_EDEN_STOPPED_AT)}
        align="left"
        date="Oct 2024"
        title="Magic Eden drops Payment Processor"
        titleClassName="text-zinc-100"
      />
      <EventMarker
        frame={frame}
        fps={fps}
        appearAt={frameWhenReached(keyframes, ULTIMATE_LAUNCHED_AT)}
        x={dateToX(ULTIMATE_LAUNCHED_AT)}
        align="right"
        date="16 Jul 2026"
        title="Ultimate launches"
        titleClassName="text-brand"
      />
      <EventMarker
        frame={frame}
        fps={fps}
        appearAt={exploitAt}
        x={dateToX(EXPLOIT_AT)}
        align="left"
        date="24 Sep 2026"
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
        dayCount={{
          until: EXPLOIT_AT,
          completeAt: exploitAt,
          outcome: 'still approved',
          textClassName: 'text-red-400',
          lineClassName: 'bg-red-400',
          labelAtEnd: false,
        }}
      />
      <ApprovalTrack
        frame={frame}
        fps={fps}
        top={TRACKS_TOP + TRACK_SPACING}
        label="With Revoke Ultimate"
        playhead={playhead}
        exploitAt={exploitAt}
        revokedAt={frameWhenReached(keyframes, ULTIMATE_LAUNCHED_AT)}
        dayCount={{
          until: STALE_AT,
          completeAt: frameWhenReached(keyframes, STALE_AT),
          outcome: 'stale',
          textClassName: 'text-zinc-100',
          lineClassName: 'bg-zinc-300',
          labelAtEnd: true,
        }}
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
  return `${dateObject.getUTCDate()} ${MONTH_NAMES[dateObject.getUTCMonth()]} ${dateObject.getUTCFullYear()}`;
};

interface EventMarkerProps {
  frame: number;
  fps: number;
  appearAt: number;
  x: number;
  // Which side of the label the drop line sits on: left-aligned labels grow rightwards from it.
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

interface DayCount {
  until: number;
  completeAt: number;
  outcome: string;
  textClassName: string;
  lineClassName: string;
  // A short bracket is narrower than its label, so its count rides just past the bracket's end.
  labelAtEnd: boolean;
}

interface ApprovalTrackProps {
  frame: number;
  fps: number;
  top: number;
  label: string;
  playhead: number;
  exploitAt: number;
  // The frame Stale Approval Cleanup revokes the approval, or null when nothing ever revokes it.
  revokedAt: number | null;
  dayCount: DayCount;
}

const ApprovalTrack = ({ frame, fps, top, label, playhead, exploitAt, revokedAt, dayCount }: ApprovalTrackProps) => {
  const isCleanedUp = revokedAt !== null;
  const approvalEnd = isCleanedUp ? Math.min(playhead, ULTIMATE_LAUNCHED_AT) : playhead;
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
      <DayCountBracket frame={frame} fps={fps} top={top + BRACKET_OFFSET} playhead={playhead} dayCount={dayCount} />
      {/* Centered on the exploit date, small enough to stay inside the timeline's right edge, and raised
          above the playhead line that stops right behind it. */}
      {isCleanedUp && frame >= exploitAt && (
        <div
          className="absolute z-10"
          style={{ left: dateToX(EXPLOIT_AT), top: top + BAR_HEIGHT / 2, transform: 'translate(-50%, -50%)' }}
        >
          <div style={popIn(frame, fps, exploitAt + 6)}>
            <Pill className="whitespace-nowrap bg-green-900 px-3 py-1 text-xl text-green-400">Not affected</Pill>
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
  const barWidth = dateToX(approvalEnd);
  const staleX = dateToX(STALE_AT);

  return (
    <div
      className="absolute flex items-center overflow-hidden rounded-r-xl"
      style={{
        left: 0,
        top,
        width: barWidth,
        height: BAR_HEIGHT,
        backgroundColor: interpolateColors(endStateProgress, [0, 1], ['#e4e4e7', endStateColor]),
        maskImage: `linear-gradient(to right, transparent 0, black ${BAR_FADE_WIDTH}px)`,
      }}
    >
      {/* Past the 180-day threshold the approval is stale, until the end state takes over. Grey stripes
          rather than a warning color, like the neutral Stale trigger badge in the product. */}
      <div
        className="absolute inset-y-0"
        style={{
          left: staleX,
          width: Math.max(0, barWidth - staleX),
          opacity: 1 - endStateProgress,
          background: 'repeating-linear-gradient(135deg, #a1a1aa 0 14px, #8e8e96 14px 28px)',
        }}
      />
      <span
        className="relative shrink-0 pl-[110px] text-[28px] font-semibold whitespace-nowrap"
        style={{ color: interpolateColors(endStateProgress, [0, 1], ['#18181b', endStateTextColor]) }}
      >
        {label}
      </span>
      {frame >= endStateAt && (
        <div className="relative ml-auto pr-3" style={popIn(frame, fps, endStateAt)}>
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
  dayCount: DayCount;
}

// Counts the days since Magic Eden stopped using Payment Processor while the playhead moves, then
// settles on the outcome: stale after 180 days, or still approved when the exploit hits after 693.
const DayCountBracket = ({ frame, fps, top, playhead, dayCount }: DayCountBracketProps) => {
  if (playhead <= MAGIC_EDEN_STOPPED_AT) return null;

  const bracketEnd = Math.min(playhead, dayCount.until);
  const days = Math.round((bracketEnd - MAGIC_EDEN_STOPPED_AT) / DAY_IN_MS);
  const isComplete = frame >= dayCount.completeAt;
  const lineColor = isComplete ? dayCount.lineClassName : 'bg-zinc-500';
  const outcomePop = spring({ frame: frame - dayCount.completeAt, fps, durationInFrames: 15 });

  const left = dateToX(MAGIC_EDEN_STOPPED_AT);
  const width = dateToX(bracketEnd) - left;

  // A long bracket carries its count in the middle like a dimension label, with a black backing that
  // cuts the line.
  const labelPosition = dayCount.labelAtEnd ? 'absolute left-full ml-4' : 'absolute inset-x-0 flex justify-center';
  return (
    <div className="absolute" style={{ left, top, width }}>
      <div className={`absolute left-0 h-4 w-[3px] ${lineColor}`} style={{ top: -6 }} />
      <div className={`absolute right-0 h-4 w-[3px] ${lineColor}`} style={{ top: -6 }} />
      <div className={`h-[3px] w-full ${lineColor}`} />
      <div className={labelPosition} style={{ top: -20 }}>
        <span
          className={`whitespace-nowrap bg-black px-4 font-heading text-[30px] leading-[40px] font-semibold tabular-nums ${isComplete ? dayCount.textClassName : 'text-zinc-300'}`}
          style={isComplete ? { transform: `scale(${interpolate(outcomePop, [0, 1], [0.85, 1])})` } : undefined}
        >
          {days} days{isComplete ? `: ${dayCount.outcome}` : ''}
        </span>
      </div>
    </div>
  );
};

const Axis = () => {
  return (
    <>
      <div className="absolute h-[3px] bg-zinc-700" style={{ left: 0, top: AXIS_TOP, width: TIMELINE_WIDTH }} />
      {QUARTER_STARTS.map((quarterStart) => {
        const quarterDate = new Date(quarterStart);
        const isYearStart = quarterDate.getUTCMonth() === 0;
        return (
          <div key={quarterStart} className="absolute" style={{ left: dateToX(quarterStart), top: AXIS_TOP }}>
            <div className="h-3 w-[3px] bg-zinc-700" />
            <span
              className={`absolute top-4 left-3 text-2xl ${isYearStart ? 'font-semibold text-zinc-300' : 'text-zinc-500'}`}
            >
              {isYearStart ? quarterDate.getUTCFullYear() : MONTH_NAMES[quarterDate.getUTCMonth()]}
            </span>
          </div>
        );
      })}
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
          {formatDate(playhead)}
        </div>
      </div>
    </>
  );
};
