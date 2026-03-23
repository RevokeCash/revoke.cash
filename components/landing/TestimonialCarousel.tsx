'use client';

import { useCallback, useEffect, useState } from 'react';
import TestimonialCard from './TestimonialCard';
import { TESTIMONIALS } from './testimonials-data';

const INTERVAL_MS = 6000;

const TestimonialCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const advance = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(advance, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPaused, advance]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: we're using a div, but we want to pause the carousel on hover
    <div className="flex flex-col gap-3" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      {/* Grid trick: all cards occupy the same cell, so the container sizes to the tallest */}
      <div className="grid">
        {TESTIMONIALS.map((testimonial, index) => (
          <div
            key={testimonial.tweetUrl}
            className={`col-start-1 row-start-1 transition-opacity duration-500 ${
              index === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
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
            onClick={() => setActiveIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === activeIndex ? 'w-4 bg-zinc-400 dark:bg-zinc-500' : 'w-1.5 bg-zinc-200 dark:bg-zinc-700'
            }`}
            aria-label={`Show testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default TestimonialCarousel;
