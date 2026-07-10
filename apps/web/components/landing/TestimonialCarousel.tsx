'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import TestimonialCard from './TestimonialCard';
import { TESTIMONIALS } from './testimonials-data';

const INTERVAL_MS = 6000;

const TestimonialCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const restartTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, INTERVAL_MS);
  }, []);

  useEffect(() => {
    restartTimer();
    return () => clearInterval(timerRef.current);
  }, [restartTimer]);

  const selectTestimonial = (index: number) => {
    setActiveIndex(index);
    restartTimer();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Grid trick: all cards occupy the same cell, so the container sizes to the tallest */}
      <div className="grid">
        {TESTIMONIALS.map((testimonial, index) => (
          <div
            key={testimonial.tweetUrl}
            className={twMerge(
              'col-start-1 row-start-1 transition-opacity duration-500',
              index === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          >
            <TestimonialCard testimonial={testimonial} />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5">
        {TESTIMONIALS.map((testimonial, index) => (
          <button
            key={testimonial.tweetUrl}
            type="button"
            onClick={() => selectTestimonial(index)}
            className={twMerge(
              'h-1.5 rounded-full transition-all duration-300',
              index === activeIndex ? 'w-4 bg-zinc-400 dark:bg-zinc-500' : 'w-1.5 bg-zinc-200 dark:bg-zinc-700',
            )}
            aria-label={`Show testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default TestimonialCarousel;
