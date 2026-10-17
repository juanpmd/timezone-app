import type { Person } from "./model";
import { dayDelta, formatDate, formatTime, localTimeZone } from "./time";

interface Line {
  name: string;
  city: string;
  time: string;
  tag: string; // "", "next day" or "prev day"
}

function lines(people: Person[], at: Date, hour12: boolean): Line[] {
  const home = localTimeZone();
  return people.map((p) => {
    const delta = dayDelta(at, p.timeZone, at, home);
    return {
      name: p.name,
      city: p.city,
      time: formatTime(at, p.timeZone, hour12),
      tag: delta > 0 ? "next day" : delta < 0 ? "prev day" : "",
    };
  });
}

/** One line, for Slack: `Thu 16 Oct · 9:00 AM Bogotá · 4:00 PM Berlin · 7:30 PM Mumbai (next day)` */
export function formatForSlack(people: Person[], at: Date, hour12: boolean): string {
  const parts = lines(people, at, hour12).map((l) => `${l.time} ${l.city || l.name}${l.tag ? ` (${l.tag})` : ""}`);
  return [formatDate(at, localTimeZone()), ...parts].join(" · ");
}

/** Multi-line, for email. */
export function formatForEmail(people: Person[], at: Date, hour12: boolean): string {
  const header = `${formatDate(at, localTimeZone())}, ${formatTime(at, localTimeZone(), hour12)} (${localTimeZone().split("/").pop()?.replace(/_/g, " ")})`;
  const width = Math.max(...people.map((p) => (p.name || p.city).length));
  const body = lines(people, at, hour12).map(
    (l) => `${(l.name || l.city).padEnd(width)}  ${l.time}${l.tag ? ` (${l.tag})` : ""}${l.city && l.name ? `  ·  ${l.city}` : ""}`,
  );
  return [header, "", ...body].join("\n");
}
