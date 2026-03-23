'use client';

import type { ReactNode } from 'react';
import { Children, useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  children: ReactNode;
  stagger?: boolean;
  staggerDelay?: number;
  className?: string;
}

const FadeIn = ({ children, stagger = false, staggerDelay = 120, className }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fadeClassName = twMerge(
    'transition-all duration-1000 ease-expo-out',
    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
  );

  if (stagger) {
    return (
      <div ref={ref} className={className}>
        {Children.toArray(children).map((child, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: stable list
            key={i}
            className={twMerge('*:h-full', fadeClassName)}
            style={{ transitionDelay: isVisible ? `${i * staggerDelay}ms` : '0ms' }}
          >
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className={twMerge(fadeClassName, className)}>
      {children}
    </div>
  );
};

export default FadeIn;
