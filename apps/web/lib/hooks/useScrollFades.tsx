'use client';

import { useEffect, useRef, useState } from 'react';

// Tracked with JS rather than CSS scroll-driven animations because those are unsupported in Safari and Firefox
export const useScrollFades = <T extends HTMLElement>() => {
  const scrollContainerRef = useRef<T>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const updateFades = () => {
      setCanScrollLeft(scrollContainer.scrollLeft > 1);
      setCanScrollRight(scrollContainer.scrollLeft + scrollContainer.clientWidth < scrollContainer.scrollWidth - 1);
    };

    updateFades();
    scrollContainer.addEventListener('scroll', updateFades, { passive: true });

    const resizeObserver = new ResizeObserver(updateFades);
    resizeObserver.observe(scrollContainer);
    if (scrollContainer.firstElementChild) resizeObserver.observe(scrollContainer.firstElementChild);

    return () => {
      scrollContainer.removeEventListener('scroll', updateFades);
      resizeObserver.disconnect();
    };
  }, []);

  return { scrollContainerRef, canScrollLeft, canScrollRight };
};
