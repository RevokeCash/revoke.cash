'use client';

import { useScrollFades } from 'lib/hooks/useScrollFades';
import type { ReactNode } from 'react';
import ScrollFade from './ScrollFade';

interface Props {
  children: ReactNode;
}

// Margins do not collapse through a scroll box, so the outer box takes the prose table margin (2em of 0.875em text)
const MarkdownTable = ({ children }: Props) => {
  const { scrollContainerRef, canScrollLeft, canScrollRight } = useScrollFades<HTMLDivElement>();

  return (
    <div className="relative my-[1.75em]">
      <div ref={scrollContainerRef} className="overflow-x-auto">
        <table className="my-0!">{children}</table>
      </div>
      <ScrollFade side="left" visible={canScrollLeft} />
      <ScrollFade side="right" visible={canScrollRight} />
    </div>
  );
};

export default MarkdownTable;
