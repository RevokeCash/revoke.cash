interface Props {
  label: string;
  value: string;
  detail: string;
  // A smaller second reading of the same data point, e.g. the current month below the selected period
  secondary?: {
    label: string;
    value: string;
    detail: string;
  };
}

const StatTile = ({ label, value, detail, secondary }: Props) => (
  <div className="flex h-full flex-col gap-1">
    <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
    <span className="text-2xl font-semibold">{value}</span>
    <span className="text-xs text-zinc-500 dark:text-zinc-500">{detail}</span>
    {secondary && (
      // Pinned to the bottom, so the secondary readings of tiles in the same row line up when a detail wraps
      <div className="mt-auto pt-2">
        <div className="flex flex-col gap-0.5 border-t border-zinc-200 pt-2 dark:border-zinc-800">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">{secondary.label}</span>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold">{secondary.value}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-500">{secondary.detail}</span>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default StatTile;
