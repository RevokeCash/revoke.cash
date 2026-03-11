'use client';

import { useCallback, useEffect, useRef } from 'react';

interface DebounceControls {
  cancel: () => void;
  flush: () => void;
}

// This is fully AI generated

/**
 * useDebouncedCallback returns a stable debounced function and controls to cancel/flush.
 * - Debounced function resets the timer on each call.
 * - cancel() clears any pending invocation.
 * - flush() immediately invokes with the last provided arguments (if any) and clears the timer.
 */
export default function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number,
): [(...args: TArgs) => void, DebounceControls] {
  const timeoutRef = useRef<number | null>(null);
  const latestCallbackRef = useRef<(...args: TArgs) => void>(callback);
  const lastArgsRef = useRef<TArgs | null>(null);

  useEffect(() => {
    latestCallbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      if (lastArgsRef.current) {
        latestCallbackRef.current(...lastArgsRef.current);
      }
    }
  }, []);

  const debounced = useCallback(
    (...args: TArgs) => {
      lastArgsRef.current = args;
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        latestCallbackRef.current(...args);
      }, delayMs);
    },
    [delayMs],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debounced, { cancel, flush }];
}
