import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { ShowcaseFrame } from '../components/ShowcaseFrame';
import { pulseOnce } from '../motion';

// Animated mockup for the premium pricing page's feature showcase (1200x630): the time machine
// scrubbing the approval state back to a point in the past and returning, as a seamless loop.
// Rendered to apps/web/public/assets/videos/premium/time-machine.mp4; the mid-hold frame doubles
// as the poster at apps/web/public/assets/images/premium/time-machine.jpg.

const SCRUB_EASING = Easing.inOut(Easing.cubic);

// The mock timeline runs from the slider's left label (January 2019) to "Now" (July 2026).
const TIMELINE_TOTAL_MONTHS = 90;
const TIMELINE_START_YEAR = 2019;
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const TimeMachineShowcase = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scrub from "Now" back to 62%, hold, then return to "Now" so the video loops seamlessly.
  const scrubPosition =
    frame < 130
      ? interpolate(frame, [20, 90], [1, 0.62], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: SCRUB_EASING,
        })
      : interpolate(frame, [170, 230], [0.62, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: SCRUB_EASING,
        });

  const monthsFromStart = Math.round(scrubPosition * TIMELINE_TOTAL_MONTHS);
  const scrubbedDateLabel = `4 ${MONTH_LABELS[monthsFromStart % 12]} ${TIMELINE_START_YEAR + Math.floor(monthsFromStart / 12)}, 19:55`;
  const selectedDateLabel = scrubPosition > 0.995 ? 'Now' : scrubbedDateLabel;

  return (
    <ShowcaseFrame title="Time Machine">
      <div className="flex flex-col gap-6 px-10 py-9">
        {/* The real DateTimeSlider is a plain zinc track with a white thumb and no progress fill. */}
        <div className="relative h-2.5 rounded-full bg-zinc-700">
          <div
            className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ left: `${scrubPosition * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-lg text-zinc-400">
          <span>13 Jan 2019</span>
          <span>Now</span>
        </div>
        <div className="text-center font-medium text-3xl text-zinc-200 tabular-nums">{selectedDateLabel}</div>
      </div>
      <div className="flex justify-end border-t border-zinc-800 px-10 py-6">
        <div
          className="rounded-lg bg-white px-8 py-2.5 text-lg font-medium text-zinc-900"
          style={pulseOnce(frame, fps, 105)}
        >
          Apply
        </div>
      </div>
    </ShowcaseFrame>
  );
};
