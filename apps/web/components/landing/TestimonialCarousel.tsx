'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import TestimonialCard from './TestimonialCard';
import type { TranslatedTestimonial } from './testimonials-data';

const INTERVAL_MS = 6000;

interface Props {
  testimonials: TranslatedTestimonial[];
}

const TestimonialCarousel = ({ testimonials }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  const restartTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, INTERVAL_MS);
  }, [testimonials.length]);

  useEffect(() => {
    restartTimer();
    return () => clearInterval(timerRef.current);
  }, [restartTimer]);

  // Deliberate selection stops the rotation so the chosen testimonial stays; it resumes on mouse leave
  const selectTestimonial = (index: number) => {
    setActiveIndex(index);
    stopTimer();
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Testimonials"
      className="relative"
      onMouseEnter={stopTimer}
      onMouseLeave={restartTimer}
      onFocus={stopTimer}
      onBlur={restartTimer}
    >
      {/* Grid trick: all cards occupy the same cell, so the container sizes to the tallest */}
      <div className="grid">
        {testimonials.map((testimonial, index) => (
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
      {/* Positioned inside the card's reserved bottom padding, so the controls fill its footer space */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {testimonials.map((testimonial, index) => (
          <button
            key={testimonial.tweetUrl}
            type="button"
            onClick={() => selectTestimonial(index)}
            className={twMerge(
              'flex rounded-full transition duration-300',
              index === activeIndex ? 'ring-2 ring-brand' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0',
            )}
            aria-label={`Show testimonial from ${testimonial.name}`}
          >
            <Image src={testimonial.avatar} alt="" width={24} height={24} className="rounded-full" unoptimized />
          </button>
        ))}
      </div>
    </section>
  );
};

export default TestimonialCarousel;
