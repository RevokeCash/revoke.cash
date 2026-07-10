import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';

// Shared frame for the premium pricing page's feature showcase stills (1200x630): a dark-mode
// UI-mockup card floating over a blurred dashboard backdrop. The card is sized to fill most of
// the frame while keeping its content inside the center band that survives object-cover crops
// next to the text column.
export const ShowcaseFrame = ({
  title,
  headerRight,
  children,
}: {
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
}) => {
  return (
    <AbsoluteFill
      className="items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #27272a 0%, #09090b 100%)' }}
    >
      <BlurredPageBackdrop />
      <div className="relative w-[800px] overflow-hidden rounded-2xl border border-zinc-700 bg-black shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-10 py-6">
          <h2 className="text-3xl font-bold text-zinc-100">{title}</h2>
          {headerRight}
        </div>
        {children}
      </div>
    </AbsoluteFill>
  );
};

// Abstract suggestion of the dark-mode dashboard behind the card, heavily blurred.
const BlurredPageBackdrop = () => {
  return (
    <AbsoluteFill style={{ filter: 'blur(14px)' }} className="opacity-70">
      <div className="absolute inset-x-0 top-0 h-16 bg-zinc-800" />
      <div className="absolute top-28 left-16 h-10 w-64 rounded-lg bg-zinc-800" />
      <div className="absolute top-28 right-16 h-10 w-40 rounded-lg bg-zinc-200" />
      <div className="absolute inset-x-16 top-48 rounded-xl bg-zinc-900 p-6">
        <div className="flex flex-col gap-6">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center gap-8">
              <div className="h-6 w-6 rounded-full bg-zinc-700" />
              <div className="h-4 w-40 rounded-sm bg-zinc-800" />
              <div className="h-4 w-64 rounded-sm bg-zinc-800" />
              <div className="ml-auto h-8 w-28 rounded-lg border border-zinc-700" />
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
