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

// Single scale pulse to draw attention to a button after the state around it has settled.
export const pulseOnce = (frame: number, fps: number, at: number): CSSProperties => {
  const progress = spring({ frame: frame - at, fps, config: { damping: 200 }, durationInFrames: 24 });
  return { transform: `scale(${1 + Math.sin(progress * Math.PI) * 0.06})` };
};
