/** Ranking weeks start Monday at 00:00 UTC, independent of browser timezone. */
export function startOfWeek(date = new Date()): Date {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return start;
}
export function isThisWeek(value: string, now = new Date()): boolean {
  const time = new Date(value).getTime();
  return time >= startOfWeek(now).getTime() && time <= now.getTime();
}
