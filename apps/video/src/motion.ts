import type { CSSProperties } from 'react';
import { interpolate, spring } from 'remotion';

// Smooth rise-and-fade entrance without bounce, used for headlines, panels and rows.
export const riseIn = (frame: number, fps: number, delay: number): CSSProperties => {
  const progress = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 30 });
  return { opacity: progress, transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px)` };
};

// Bouncy scale entrance for pills, buttons and logos.
export const popIn = (frame: number, fps: number, delay: number): CSSProperties => {
  const progress = spring({ frame: frame - delay, fps, durationInFrames: 20 });
  return {
    opacity: interpolate(progress, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
    transform: `scale(${progress})`,
  };
};
