import { ShowcaseFrame } from '../components/ShowcaseFrame';

// Still image for the premium pricing page's feature showcase (1200x630): a dark-mode mockup of
// the time machine, scrubbing the approval state back to a point in the past.
// Rendered to apps/web/public/assets/images/premium/time-machine.jpg.

const SCRUB_POSITION = '62%';

export const TimeMachineStill = () => {
  return (
    <ShowcaseFrame title="Time Machine">
      <div className="flex flex-col gap-6 px-10 py-9">
        <div className="relative h-2.5 rounded-full bg-zinc-800">
          <div className="absolute inset-y-0 left-0 rounded-full bg-brand/40" style={{ width: SCRUB_POSITION }} />
          <div
            className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand"
            style={{ left: SCRUB_POSITION }}
          />
        </div>
        <div className="flex justify-between text-lg text-zinc-500">
          <span>13 Jan 2019</span>
          <span>Now</span>
        </div>
        <div className="text-center text-3xl font-semibold text-zinc-100">4 Feb 2023, 19:55</div>
      </div>
      <div className="flex justify-end border-t border-zinc-800 px-10 py-6">
        <div className="rounded-lg bg-white px-8 py-2.5 text-lg font-medium text-zinc-900">Apply</div>
      </div>
    </ShowcaseFrame>
  );
};
