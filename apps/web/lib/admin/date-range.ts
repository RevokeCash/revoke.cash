// All dates are whole UTC days formatted 'YYYY-MM-DD'. Ranges are inclusive on both ends and always have from <= to.
export interface DateRange {
  from: string;
  to: string;
}

export type PeriodUnit = 'year' | 'quarter' | 'month' | 'week' | 'day';

export interface Period extends DateRange {
  unit: PeriodUnit;
}

// The range is exactly `count` consecutive whole periods of `unit` ('day' is the fallback)
export interface RangeShape {
  unit: PeriodUnit;
  count: number;
}

export interface IsoWeek {
  weekYear: number;
  week: number;
}

export interface QuickRange {
  label: string;
  dayCount: number;
}

// Covered share of a period as fractions 0..1
export interface PeriodOverlap {
  start: number;
  end: number;
}

export const EARLIEST_DATE = '2025-01-01';
export const RANGE_SEPARATOR = ' – '; // en dash U+2013, never an em dash

export const MONTH_SHORT_NAMES: readonly string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const MONTH_LONG_NAMES: readonly string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const WEEKDAY_SHORT_NAMES: readonly string[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
export const WEEKDAY_LONG_NAMES: readonly string[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const QUICK_RANGES: readonly QuickRange[] = [
  { label: 'Today', dayCount: 1 },
  { label: 'Last 7 days', dayCount: 7 },
  { label: 'Last 30 days', dayCount: 30 },
  { label: 'Last 90 days', dayCount: 90 },
  { label: 'Last 365 days', dayCount: 365 },
];

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

// Days

const parseDate = (date: string): Date => new Date(`${date}T00:00:00.000Z`);

const serializeDate = (date: Date): string => date.toISOString().slice(0, 10);

// Date.UTC rolls overflowing months and days into the next month or year
const buildDate = (year: number, monthIndex: number, day: number): string =>
  serializeDate(new Date(Date.UTC(year, monthIndex, day)));

// ISO dates sort as plain strings
export const minDate = (first: string, second: string): string => (first < second ? first : second);
const maxDate = (first: string, second: string): string => (first > second ? first : second);

export const getToday = (): string => serializeDate(new Date());

export const getYear = (date: string): number => parseDate(date).getUTCFullYear();

const getMonthIndex = (date: string): number => parseDate(date).getUTCMonth();

const getDayOfMonth = (date: string): number => parseDate(date).getUTCDate();

export const addDays = (date: string, days: number): string =>
  buildDate(getYear(date), getMonthIndex(date), getDayOfMonth(date) + days);

// The day is clamped to the target month length, so Jan 31 + 1 month is Feb 28 (or 29)
export const addMonths = (date: string, months: number): string => {
  const year = getYear(date);
  const monthIndex = getMonthIndex(date) + months;
  const targetMonthLength = getDayOfMonth(buildDate(year, monthIndex + 1, 0));
  return buildDate(year, monthIndex, Math.min(getDayOfMonth(date), targetMonthLength));
};

export const countDays = (range: DateRange): number =>
  (parseDate(range.to).getTime() - parseDate(range.from).getTime()) / DAY_IN_MILLISECONDS + 1;

// Counts the calendar months the range touches, so Jan 31 – Feb 1 is 2 months
export const countMonths = (range: DateRange): number =>
  (getYear(range.to) - getYear(range.from)) * 12 + getMonthIndex(range.to) - getMonthIndex(range.from) + 1;

// getUTCDay counts from Sunday = 0
export const getIsoWeekday = (date: string): number => parseDate(date).getUTCDay() || 7;

// A week belongs to the year of its Thursday, so week 1 is the week that holds the first Thursday of the year
export const getIsoWeek = (date: string): IsoWeek => {
  const thursday = addDays(date, 4 - getIsoWeekday(date));
  const weekYear = getYear(thursday);
  const dayOfYear = countDays({ from: buildDate(weekYear, 0, 1), to: thursday });
  return { weekYear, week: Math.floor((dayOfYear - 1) / 7) + 1 };
};

export const clampDate = (date: string, earliest: string, latest: string): string =>
  maxDate(earliest, minDate(date, latest));

// Ranges

export const isSameRange = (first: DateRange, second: DateRange): boolean =>
  first.from === second.from && first.to === second.to;

export const isRangeInside = (inner: DateRange, outer: DateRange): boolean =>
  inner.from >= outer.from && inner.to <= outer.to;

export const spanRanges = (first: DateRange, second: DateRange): DateRange => ({
  from: minDate(first.from, second.from),
  to: maxDate(first.to, second.to),
});

export const clampToToday = (range: DateRange, today: string): DateRange => ({
  from: range.from,
  to: minDate(range.to, today),
});

export const isSelectableRange = (range: DateRange, today: string): boolean =>
  range.from >= EARLIEST_DATE && range.from <= today;

export const getQuickRange = (dayCount: number, today: string): DateRange => ({
  from: addDays(today, 1 - dayCount),
  to: today,
});

// Periods

export const getPeriod = (unit: PeriodUnit, date: string): Period => {
  const year = getYear(date);
  const monthIndex = getMonthIndex(date);

  switch (unit) {
    case 'year':
      return { unit, from: buildDate(year, 0, 1), to: buildDate(year, 11, 31) };
    case 'quarter': {
      const firstMonthIndex = Math.floor(monthIndex / 3) * 3;
      return { unit, from: buildDate(year, firstMonthIndex, 1), to: buildDate(year, firstMonthIndex + 3, 0) };
    }
    case 'month':
      return { unit, from: buildDate(year, monthIndex, 1), to: buildDate(year, monthIndex + 1, 0) };
    case 'week': {
      const monday = addDays(date, 1 - getIsoWeekday(date));
      return { unit, from: monday, to: addDays(monday, 6) };
    }
    case 'day':
      return { unit, from: date, to: date };
  }
};

// Year, quarter and month periods start on the first of a month, so addMonths never clamps here
export const shiftPeriod = (period: Period, amount: number): Period => {
  switch (period.unit) {
    case 'year':
      return getPeriod('year', addMonths(period.from, 12 * amount));
    case 'quarter':
      return getPeriod('quarter', addMonths(period.from, 3 * amount));
    case 'month':
      return getPeriod('month', addMonths(period.from, amount));
    case 'week':
      return getPeriod('week', addDays(period.from, 7 * amount));
    case 'day':
      return getPeriod('day', addDays(period.from, amount));
  }
};

export const getPeriodsOfYear = (unit: 'quarter' | 'month', year: number): Period[] => {
  const firstPeriod = getPeriod(unit, buildDate(year, 0, 1));
  return Array.from({ length: unit === 'quarter' ? 4 : 12 }, (_, index) => shiftPeriod(firstPeriod, index));
};

// The last few years, reaching further back when the value starts earlier, but never before EARLIEST_DATE
export const getPeriodMapYears = (value: DateRange, today: string): number[] => {
  const lastYear = getYear(today);
  const firstYear = Math.max(getYear(EARLIEST_DATE), Math.min(getYear(value.from), lastYear - 3));
  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
};

// The largest unit wins, so Jan..Dec is a year and Feb 2027 (Monday to Sunday) is a month, not 4 weeks
const SHAPE_UNITS = ['year', 'quarter', 'month', 'week'] as const;

export const inferRangeShape = (range: DateRange): RangeShape => {
  const unit =
    SHAPE_UNITS.find(
      (candidate) =>
        getPeriod(candidate, range.from).from === range.from && getPeriod(candidate, range.to).to === range.to,
    ) ?? 'day';

  return { unit, count: countPeriods(unit, range) };
};

const countPeriods = (unit: PeriodUnit, range: DateRange): number => {
  switch (unit) {
    case 'year':
      return countMonths(range) / 12;
    case 'quarter':
      return countMonths(range) / 3;
    case 'month':
      return countMonths(range);
    case 'week':
      return countDays(range) / 7;
    case 'day':
      return countDays(range);
  }
};

// The periods of a unit that the range touches, clipped to the range: Jul 16 – Aug 3 by month is Jul 16 – 31 and Aug 1 – 3
export const splitRangeByUnit = (range: DateRange, unit: PeriodUnit): Period[] => {
  const firstPeriod = getPeriod(unit, range.from);
  const periodCount = countPeriods(unit, { from: firstPeriod.from, to: getPeriod(unit, range.to).to });

  return Array.from({ length: periodCount }, (_, index) => {
    const period = shiftPeriod(firstPeriod, index);
    return { unit, from: maxDate(period.from, range.from), to: minDate(period.to, range.to) };
  });
};

// Periods that have not started yet hold no data, so reports stop at the period that contains today
export const getStartedPeriods = (range: DateRange, unit: PeriodUnit, today: string): Period[] =>
  splitRangeByUnit(range, unit).filter((period) => period.from <= today);

// Moves the range by its own size, so Q2 steps to Q1 or Q3 and a 19 day range steps by 19 days
export const stepRange = (range: DateRange, direction: -1 | 1): DateRange => {
  const { unit, count } = inferRangeShape(range);
  const firstPeriod = shiftPeriod(getPeriod(unit, range.from), direction * count);
  const lastPeriod = shiftPeriod(firstPeriod, count - 1);
  return { from: firstPeriod.from, to: lastPeriod.to };
};

export const getPeriodOverlap = (period: DateRange, range: DateRange): PeriodOverlap | null => {
  if (range.to < period.from || range.from > period.to) return null;

  const periodDayCount = countDays(period);
  return {
    start: (countDays({ from: period.from, to: maxDate(range.from, period.from) }) - 1) / periodDayCount,
    end: countDays({ from: period.from, to: minDate(range.to, period.to) }) / periodDayCount,
  };
};

// Always 6 rows of 7 dates starting on a Monday, so the calendar height never changes between months
export const getCalendarWeeks = (monthStart: string): string[][] => {
  const firstMonday = getPeriod('week', monthStart).from;
  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => addDays(firstMonday, weekIndex * 7 + dayIndex)),
  );
};

// Formatting

export const formatMonthAndDay = (date: string): string =>
  `${MONTH_SHORT_NAMES[getMonthIndex(date)]} ${getDayOfMonth(date)}`;

export const formatDay = (date: string): string => `${formatMonthAndDay(date)}, ${getYear(date)}`;

export const formatLongDay = (date: string): string => {
  const weekdayName = WEEKDAY_LONG_NAMES[getIsoWeekday(date) - 1];
  return `${weekdayName}, ${MONTH_LONG_NAMES[getMonthIndex(date)]} ${getDayOfMonth(date)}, ${getYear(date)}`;
};

// Prints the shared month and year only once: 'Jul 16 – 20, 2026', 'Jul 16 – Aug 3, 2026', 'Dec 20, 2025 – Jan 5, 2026'
export const formatDayRange = (range: DateRange): string => {
  if (range.from === range.to) return formatDay(range.from);

  if (getYear(range.from) !== getYear(range.to)) {
    return `${formatDay(range.from)}${RANGE_SEPARATOR}${formatDay(range.to)}`;
  }

  if (getMonthIndex(range.from) === getMonthIndex(range.to)) {
    return `${formatMonthAndDay(range.from)}${RANGE_SEPARATOR}${getDayOfMonth(range.to)}, ${getYear(range.to)}`;
  }

  return `${formatMonthAndDay(range.from)}${RANGE_SEPARATOR}${formatDay(range.to)}`;
};

// Full names for screen readers
export const formatPeriodName = (period: Period): string => {
  switch (period.unit) {
    case 'year':
      return `Year ${getYear(period.from)}`;
    case 'month':
      return `${MONTH_LONG_NAMES[getMonthIndex(period.from)]} ${getYear(period.from)}`;
    case 'day':
      return formatLongDay(period.from);
    case 'quarter':
    case 'week':
      return formatShortPeriodName(period);
  }
};

// A whole period by its name, a clipped one by its dates: 'September 2026', 'Week 38, 2026', 'Jul 16 – 31, 2026'
export const formatPeriodOrDays = (period: Period): string =>
  isSameRange(period, getPeriod(period.unit, period.from)) ? formatPeriodName(period) : formatDayRange(period);

export const formatRangeLabel = (range: DateRange, today: string): string => {
  if (range.from === range.to) return formatSingleDayLabel(range.from, today);

  const { unit } = inferRangeShape(range);
  if (unit !== 'day') {
    const periodSpan = formatPeriodSpan(unit, range);
    return range.to > today ? `${periodSpan} to date` : periodSpan;
  }

  const quickRange = QUICK_RANGES.find(({ dayCount }) => isSameRange(getQuickRange(dayCount, today), range));
  return quickRange?.label ?? formatDayRange(range);
};

// The covered dates (left out when the label already shows them) and the day count, or progress for ranges that run past today
export const formatRangeDetail = (range: DateRange, today: string): string => {
  const coveredRange = clampToToday(range, today);
  const coveredDates = formatDayRange(coveredRange);
  const datesDetail = coveredDates === formatRangeLabel(range, today) ? null : coveredDates;

  return [datesDetail, formatDayCountDetail(range, coveredRange, today)]
    .filter((detail) => detail !== null)
    .join(' · ');
};

const formatDayCountDetail = (range: DateRange, coveredRange: DateRange, today: string): string | null => {
  if (range.to > today) return `day ${countDays(coveredRange)} of ${countDays(range)}`;
  if (countDays(range) > 1) return `${countDays(range)} days`;
  return null;
};

const formatSingleDayLabel = (date: string, today: string): string => {
  if (date === today) return 'Today';
  if (date === addDays(today, -1)) return 'Yesterday';
  return formatDay(date);
};

// Spans within one year print the year once: 'Q1 – Q3 2026', 'Jun – Aug 2026', 'Weeks 36 – 38, 2026'
const formatPeriodSpan = (unit: PeriodUnit, range: DateRange): string => {
  const firstPeriod = getPeriod(unit, range.from);
  const lastPeriod = getPeriod(unit, range.to);
  if (firstPeriod.from === lastPeriod.from) return formatShortPeriodName(firstPeriod);

  if (unit === 'week') {
    const firstWeek = getIsoWeek(firstPeriod.from);
    const lastWeek = getIsoWeek(lastPeriod.from);
    if (firstWeek.weekYear === lastWeek.weekYear) {
      return `Weeks ${firstWeek.week}${RANGE_SEPARATOR}${lastWeek.week}, ${lastWeek.weekYear}`;
    }
  }

  if ((unit === 'quarter' || unit === 'month') && getYear(firstPeriod.from) === getYear(lastPeriod.from)) {
    const periodNames = `${formatPeriodInYear(firstPeriod)}${RANGE_SEPARATOR}${formatPeriodInYear(lastPeriod)}`;
    return `${periodNames} ${getYear(lastPeriod.from)}`;
  }

  return `${formatShortPeriodName(firstPeriod)}${RANGE_SEPARATOR}${formatShortPeriodName(lastPeriod)}`;
};

export const formatShortPeriodName = (period: Period): string => {
  switch (period.unit) {
    case 'year':
      return String(getYear(period.from));
    case 'quarter':
    case 'month':
      return `${formatPeriodInYear(period)} ${getYear(period.from)}`;
    case 'week': {
      const { weekYear, week } = getIsoWeek(period.from);
      return `Week ${week}, ${weekYear}`;
    }
    case 'day':
      return formatDay(period.from);
  }
};

// 'Q3' for quarters, 'Aug' for months
export const formatPeriodInYear = (period: Period): string => {
  const monthIndex = getMonthIndex(period.from);
  return period.unit === 'quarter' ? `Q${Math.floor(monthIndex / 3) + 1}` : MONTH_SHORT_NAMES[monthIndex];
};
