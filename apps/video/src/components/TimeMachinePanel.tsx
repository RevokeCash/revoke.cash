// Mock of the premium time-machine control (apps/web/components/allowances/dashboard/controls/
// DateTimeSlider.tsx): a slider scrubbing the dashboard back in time, with absolute date labels
// and the real control's plain zinc track and white thumb. progress 0 = now, 1 = three years back.
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The mock timeline scrubs back from a fixed "now" of July 2026.
const NOW_TOTAL_MONTHS = 2026 * 12 + 6;

export const TimeMachinePanel = ({ progress, style }: { progress: number; style?: React.CSSProperties }) => {
  const monthsBack = Math.round(progress * 36);
  const thumbPosition = 100 - progress * 100;

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-zinc-800 bg-black p-4" style={style}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-400">Time Machine</span>
        <span className="font-medium text-xl text-zinc-200 tabular-nums">{formatScrubbedDate(monthsBack)}</span>
      </div>
      <div className="relative h-2 rounded-full bg-zinc-700">
        <div
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          style={{ left: `${thumbPosition}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-400">
        <span>10 Jul 2023</span>
        <span>Now</span>
      </div>
    </div>
  );
};

const formatScrubbedDate = (monthsBack: number): string => {
  if (monthsBack === 0) return 'Now';
  const totalMonths = NOW_TOTAL_MONTHS - monthsBack;
  return `10 ${MONTH_LABELS[totalMonths % 12]} ${Math.floor(totalMonths / 12)}, 19:55`;
};
