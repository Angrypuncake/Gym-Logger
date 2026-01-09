// src/lib/datesSydney.ts
export const SYDNEY_TZ = "Australia/Sydney" as const;

export function sydneyKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SYDNEY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function monthStartKey(year: number, month0: number) {
  return sydneyKey(new Date(Date.UTC(year, month0, 1)));
}

export function monthEndKey(year: number, month0: number) {
  return sydneyKey(new Date(Date.UTC(year, month0 + 1, 0)));
}

export function sydneyWeekStartDate(now: Date) {
  // Monday..Sunday week start in Sydney, returned as a Date in UTC backing.
  const weekdayShort = new Intl.DateTimeFormat("en-US", {
    timeZone: SYDNEY_TZ,
    weekday: "short",
  }).format(now);

  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const offset = Math.max(0, order.indexOf(weekdayShort));

  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - offset);
  return weekStart;
}
