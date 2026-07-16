'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// This is fully AI generated

/**
 * Returns a debounced version of the provided value. The returned value only
 * updates after it has not changed for `delayMs` milliseconds.
 */
export default function useDebouncedValue<TValue>(
  value: TValue,
  delayMs: number,
): [TValue, { flushWith: (nextValue: TValue) => void }] {
  const [debouncedValue, setDebouncedValue] = useState<TValue>(value);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setDebouncedValue(value);
      timeoutRef.current = null;
    }, delayMs);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, delayMs]);

  const flushWith = useCallback((nextValue: TValue) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setDebouncedValue(nextValue);
  }, []);

  return [debouncedValue, { flushWith }];
}
