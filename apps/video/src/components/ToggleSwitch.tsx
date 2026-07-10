import { interpolate } from 'remotion';

// Animated replica of apps/web/components/common/Toggle.tsx in dark mode.
// progress 0 = off (zinc track), progress 1 = on (white track); the thumb stays zinc-900 in both
// states, matching the real component's constant dark:bg-zinc-900 thumb.
export const ToggleSwitch = ({ progress }: { progress: number }) => {
  const thumbTranslate = interpolate(progress, [0, 1], [4, 24]);

  return (
    <div className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-zinc-500">
      <div className="absolute inset-0 rounded-full bg-white" style={{ opacity: progress }} />
      <span
        className="relative inline-block size-4 rounded-full bg-zinc-900 shadow-sm"
        style={{ transform: `translateX(${thumbTranslate}px)` }}
      />
    </div>
  );
};
