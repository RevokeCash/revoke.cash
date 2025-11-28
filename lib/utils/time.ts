export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY;
export const YEAR = 365 * DAY;

export const formatDateNormalised = (date: Date) => {
  const dateString = date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeString = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${dateString} ${timeString}`;
};

export const formatArticleDate = (dateString: string) => {
  const day = new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' });
  const month = new Date(dateString).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', timeZone: 'UTC' });
  return `${day} ${month} ${year}`;
};
