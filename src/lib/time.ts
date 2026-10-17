// Timezone math built only on Intl. No date library needed.

export interface ZonedParts {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = Sunday
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const partsFormatters = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(timeZone: string) {
  let f = partsFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      weekday: "short",
    });
    partsFormatters.set(timeZone, f);
  }
  return f;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const out: Record<string, string> = {};
  for (const p of partsFormatter(timeZone).formatToParts(date)) out[p.type] = p.value;
  return {
    year: +out.year,
    month: +out.month,
    day: +out.day,
    hour: +out.hour % 24,
    minute: +out.minute,
    weekday: WEEKDAYS.indexOf(out.weekday),
  };
}

/** Offset of `timeZone` from UTC in minutes at `date` (east positive). */
export function offsetMinutes(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  const truncated = Math.floor(date.getTime() / MINUTE) * MINUTE;
  return Math.round((asUtc - truncated) / MINUTE);
}

/** The instant of local midnight in `timeZone` for the calendar day containing `date`. */
export function startOfDay(date: Date, timeZone: string): Date {
  const p = zonedParts(date, timeZone);
  const guess = Date.UTC(p.year, p.month - 1, p.day);
  // Two passes handle a DST change between the guess and the real midnight.
  let t = guess - offsetMinutes(new Date(guess), timeZone) * MINUTE;
  t = guess - offsetMinutes(new Date(t), timeZone) * MINUTE;
  return new Date(t);
}

export function addDays(dayStart: Date, days: number, timeZone: string): Date {
  return startOfDay(new Date(dayStart.getTime() + days * DAY + 12 * HOUR), timeZone);
}

export function isSameDay(a: Date, b: Date, timeZone: string): boolean {
  const pa = zonedParts(a, timeZone);
  const pb = zonedParts(b, timeZone);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

/** Calendar-day difference of `date` in `timeZone` relative to `reference` in `referenceZone`. */
export function dayDelta(date: Date, timeZone: string, reference: Date, referenceZone: string): number {
  const a = zonedParts(date, timeZone);
  const b = zonedParts(reference, referenceZone);
  return Math.round((Date.UTC(a.year, a.month - 1, a.day) - Date.UTC(b.year, b.month - 1, b.day)) / DAY);
}

export function formatTime(date: Date, timeZone: string, hour12: boolean): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit", hour12 }).format(date);
}

export function formatDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short" }).format(date);
}

/** Short label for an hour tick: "12a", "3", "12p", "9" or "00", "03" … */
export function hourLabel(hour: number, hour12: boolean): string {
  if (!hour12) return String(hour).padStart(2, "0");
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  return String(hour % 12);
}

/** Human offset such as "+5:30" or "-3" relative to another zone, "" when equal. */
export function relativeOffset(date: Date, timeZone: string, referenceZone: string): string {
  const diff = offsetMinutes(date, timeZone) - offsetMinutes(date, referenceZone);
  if (diff === 0) return "";
  const sign = diff > 0 ? "+" : "-";
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

export interface DstTransition {
  at: Date;
  deltaMinutes: number; // positive when clocks spring forward
}

/** Finds the next UTC-offset change in `timeZone` within `days` of `from`, to the minute. */
export function nextDstTransition(from: Date, timeZone: string, days: number): DstTransition | null {
  const start = from.getTime();
  const end = start + days * DAY;
  const base = offsetMinutes(from, timeZone);
  let lo = start;
  let hi = -1;
  for (let t = start + HOUR; t <= end; t += HOUR) {
    if (offsetMinutes(new Date(t), timeZone) !== base) {
      hi = t;
      break;
    }
    lo = t;
  }
  if (hi < 0) return null;
  while (hi - lo > MINUTE) {
    const mid = Math.floor((lo + hi) / 2 / MINUTE) * MINUTE;
    if (offsetMinutes(new Date(mid), timeZone) !== base) hi = mid;
    else lo = mid;
  }
  return { at: new Date(hi), deltaMinutes: offsetMinutes(new Date(hi), timeZone) - base };
}

export const roundToMinutes = (date: Date, minutes: number) =>
  new Date(Math.round(date.getTime() / (minutes * MINUTE)) * minutes * MINUTE);
