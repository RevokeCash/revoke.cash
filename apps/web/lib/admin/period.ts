import { getToday, minDate } from 'lib/admin/date-range';
import { z } from 'zod';

// Admin reports take whole UTC days: from the start of the first day to the end of the last day
export const periodQuerySchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
});

export const toUtcPeriod = (fromDate: string, toDate: string): { from: Date; to: Date } => ({
  from: new Date(`${fromDate}T00:00:00.000Z`),
  to: new Date(`${toDate}T23:59:59.999Z`),
});

// Selected periods can reach into the future (whole quarters, years). The reports already stop at now, but printed
// period labels and filenames need an honest end date, so they end today at the latest.
export const getPrintedEndDate = (toDate: string): string => minDate(toDate, getToday());
