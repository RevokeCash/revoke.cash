'use client';

import {
  clampDate,
  clampToToday,
  type DateRange,
  EARLIEST_DATE,
  getPeriod,
  inferRangeShape,
  isSameRange,
  isSelectableRange,
  type Period,
  type RangeShape,
  spanRanges,
} from 'lib/admin/date-range';
import { type PointerEvent, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

interface PeriodSelectionOptions {
  value: DateRange;
  today: string;
  onSelect: (range: DateRange) => void;
}

// The range the panel shows: the committed value, or a preview of what the current gesture would select
export interface RangeDisplay {
  range: DateRange;
  shape: RangeShape;
  coveredRange: DateRange;
  isPreview: boolean;
}

export interface PeriodSelection {
  display: RangeDisplay;
  pendingStart: string | null;
  activatePeriod: (period: Period, shiftKey: boolean) => void;
  pressPeriod: (period: Period, event: PointerEvent<HTMLButtonElement>) => void;
  enterPeriod: (period: Period, shiftKey: boolean) => void;
  leavePeriods: () => void;
  setChipPreview: (range: DateRange | null) => void;
}

interface Drag {
  anchor: Period;
  target: Period;
}

interface HoveredPeriod {
  period: Period;
  shiftKey: boolean;
}

// Every map cell, week number and calendar day is a period. A click selects it, a shift-click or drag spans from
// another period to it, and a click on a day starts a range that the next clicked period finishes.
export const usePeriodSelection = ({ value, today, onSelect }: PeriodSelectionOptions): PeriodSelection => {
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hovered, setHovered] = useState<HoveredPeriod | null>(null);
  const [chipPreview, setChipPreview] = useState<DateRange | null>(null);

  const resolveSelection = (target: Period, shiftKey: boolean): DateRange => {
    if (pendingStart) return spanRanges(getPeriod('day', pendingStart), target);
    if (shiftKey) {
      // The week that contains EARLIEST_DATE starts before it, so a span anchored on that week is clamped
      const span = spanRanges(getPeriod(target.unit, value.from), target);
      return { from: clampDate(span.from, EARLIEST_DATE, span.to), to: span.to };
    }

    return target;
  };

  const activatePeriod = (period: Period, shiftKey: boolean) => {
    if (period.unit === 'day' && !pendingStart && !shiftKey) {
      setPendingStart(period.from);
      return;
    }

    onSelect(resolveSelection(period, shiftKey));
  };

  // Plain clicks go through onClick, so a drag only commits when the mouse is released on a different period.
  // Disabled buttons still get pointer events, and a macOS ctrl-click opens a context menu that swallows the pointerup.
  const pressPeriod = (period: Period, event: PointerEvent<HTMLButtonElement>) => {
    const isPlainMousePress = event.pointerType === 'mouse' && event.button === 0 && !event.shiftKey && !event.ctrlKey;
    if (!isPlainMousePress || pendingStart || !isSelectableRange(period, today)) return;
    setDrag({ anchor: period, target: period });
  };

  useEffect(() => {
    if (!drag) return;

    const commitDrag = () => {
      if (!isSameRange(drag.anchor, drag.target)) onSelect(spanRanges(drag.anchor, drag.target));
      setDrag(null);
    };
    const cancelDrag = () => setDrag(null);

    window.addEventListener('pointerup', commitDrag);
    window.addEventListener('pointercancel', cancelDrag);
    return () => {
      window.removeEventListener('pointerup', commitDrag);
      window.removeEventListener('pointercancel', cancelDrag);
    };
  }, [drag, onSelect]);

  const enterPeriod = (period: Period, shiftKey: boolean) => {
    if (!isSelectableRange(period, today)) return;

    if (drag) {
      // Pointer enters are not urgent for React, so without flushSync a quick release could still see the old target
      flushSync(() => setDrag({ anchor: drag.anchor, target: period }));
      return;
    }

    // A plain hover shows no preview, and setting null again does not re-render
    setHovered(pendingStart || shiftKey ? { period, shiftKey } : null);
  };

  const getPreviewRange = (): DateRange | null => {
    if (drag) return spanRanges(drag.anchor, drag.target);
    if (hovered) return resolveSelection(hovered.period, hovered.shiftKey);
    if (pendingStart) return getPeriod('day', pendingStart);
    return chipPreview;
  };

  const previewRange = getPreviewRange();
  const displayRange = previewRange ?? value;

  return {
    display: {
      range: displayRange,
      shape: inferRangeShape(displayRange),
      coveredRange: clampToToday(displayRange, today),
      isPreview: previewRange !== null,
    },
    pendingStart,
    activatePeriod,
    pressPeriod,
    enterPeriod,
    leavePeriods: () => setHovered(null),
    setChipPreview,
  };
};
