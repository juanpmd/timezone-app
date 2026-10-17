// Per-person day classification (working / off-hours / night) and the
// "best time" search that finds slots inside everyone's working hours.

import { holidaysOn } from "./holidays";
import type { Person } from "./model";
import { MINUTE, zonedParts } from "./time";

export type Phase = "night" | "off" | "work";

export const NIGHT_START = 22;
export const NIGHT_END = 7;

export interface DayStatus {
  weekend: boolean;
  holidays: string[];
}

export function dayStatus(person: Person, at: Date): DayStatus {
  const p = zonedParts(at, person.timeZone);
  return {
    weekend: person.weekend.includes(p.weekday as Person["weekend"][number]),
    holidays: holidaysOn(person.country, p.year, p.month, p.day),
  };
}

/** Which phase of the day `at` falls into for `person`, local to them. */
export function phaseAt(person: Person, at: Date): Phase {
  const p = zonedParts(at, person.timeZone);
  const h = p.hour + p.minute / 60;
  if (h >= NIGHT_START || h < NIGHT_END) return "night";
  const { weekend, holidays } = dayStatus(person, at);
  if (!weekend && holidays.length === 0 && h >= person.workStart && h < person.workEnd) return "work";
  return "off";
}

export interface Segment {
  phase: Phase;
  start: number; // 0–1 fraction of the visible day
  end: number;
}

/** Splits the visible day [dayStart, dayEnd) into phase segments for `person`. */
export function daySegments(person: Person, dayStart: Date, dayEnd: Date, stepMinutes = 15): Segment[] {
  const total = dayEnd.getTime() - dayStart.getTime();
  const segments: Segment[] = [];
  for (let t = dayStart.getTime(); t < dayEnd.getTime(); t += stepMinutes * MINUTE) {
    const phase = phaseAt(person, new Date(t + MINUTE)); // nudge past the boundary
    const end = Math.min(1, (t + stepMinutes * MINUTE - dayStart.getTime()) / total);
    const last = segments[segments.length - 1];
    if (last && last.phase === phase) last.end = end;
    else segments.push({ phase, start: (t - dayStart.getTime()) / total, end });
  }
  return segments;
}

export interface Slot {
  start: Date;
  available: number; // people inside working hours
}

/**
 * Top slots (30-minute grid) where the most people are within working hours,
 * preferring times near the middle of everyone's workday. Returns at most `count`
 * slots at least an hour apart.
 */
export function bestSlots(people: Person[], dayStart: Date, dayEnd: Date, count = 3): Slot[] {
  if (people.length === 0) return [];
  const step = 30 * MINUTE;
  const scored: { slot: Slot; score: number }[] = [];

  for (let t = dayStart.getTime(); t + step <= dayEnd.getTime(); t += step) {
    const start = new Date(t);
    let available = 0;
    let centrality = 0;
    for (const person of people) {
      if (phaseAt(person, start) !== "work" || phaseAt(person, new Date(t + step - MINUTE)) !== "work") continue;
      available++;
      const p = zonedParts(start, person.timeZone);
      const mid = (person.workStart + person.workEnd) / 2;
      centrality += Math.abs(p.hour + p.minute / 60 + 0.25 - mid);
    }
    if (available > 0) scored.push({ slot: { start, available }, score: available * 1000 - centrality });
  }

  scored.sort((a, b) => b.score - a.score || a.slot.start.getTime() - b.slot.start.getTime());
  const best = scored[0]?.slot.available ?? 0;
  const picked: Slot[] = [];
  for (const { slot } of scored) {
    if (slot.available < best) break;
    if (picked.some((s) => Math.abs(s.start.getTime() - slot.start.getTime()) < 60 * MINUTE)) continue;
    picked.push(slot);
    if (picked.length === count) break;
  }
  return picked.sort((a, b) => a.start.getTime() - b.start.getTime());
}
