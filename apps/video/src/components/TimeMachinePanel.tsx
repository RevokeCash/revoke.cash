// Mock of the premium time-machine control: a slider scrubbing the dashboard back in time.
// progress 0 = today, 1 = three years back.
export const TimeMachinePanel = ({ progress, style }: { progress: number; style?: React.CSSProperties }) => {
  const monthsBack = Math.round(progress * 36);
  const thumbPosition = 100 - progress * 100;

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-zinc-800 bg-black p-4" style={style}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-400">Time Machine</span>
        <span className="text-xl font-semibold text-brand">{formatMonthsBack(monthsBack)}</span>
      </div>
      <div className="relative h-2 rounded-full bg-zinc-800">
        <div className="absolute inset-y-0 rounded-full bg-brand/40" style={{ left: `${thumbPosition}%`, right: 0 }} />
        <div
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand"
          style={{ left: `${thumbPosition}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>3 years ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};

const formatMonthsBack = (monthsBack: number): string => {
  if (monthsBack === 0) return 'Today';
  if (monthsBack < 12) return `${monthsBack} month${monthsBack === 1 ? '' : 's'} ago`;
  const yearsBack = Math.floor(monthsBack / 12);
  return `${yearsBack} year${yearsBack === 1 ? '' : 's'} ago`;
};
