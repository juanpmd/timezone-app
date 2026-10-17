import { useCallback, useMemo, useRef } from "react";
import type { Person } from "../lib/model";
import { daySegments, dayStatus } from "../lib/schedule";
import { DAY, HOUR, MINUTE, dayDelta, formatTime, hourLabel, localTimeZone, nextDstTransition, offsetMinutes, relativeOffset } from "../lib/time";
import { Avatar } from "./avatar";
import { Pencil } from "./icons";

const SNAP_MINUTES = 15;
const DST_WARNING_DAYS = 7;
const LABEL_EVERY_HOURS = 3;

interface Props {
  people: Person[];
  dayStart: Date;
  dayEnd: Date;
  /** Instant shown in the right column and marked on the grid (hover, pinned pick or now). */
  cursor: Date;
  hour12: boolean;
  selected: Set<string>;
  /** Pointer is over the grid at this instant; null when it leaves. */
  onHover: (date: Date | null) => void;
  /** Click on the grid pins this instant. */
  onPick: (date: Date) => void;
  onToggleSelect: (id: string) => void;
  onEdit: (person: Person) => void;
}

const fraction = (t: Date, start: Date, end: Date) => (t.getTime() - start.getTime()) / (end.getTime() - start.getTime());

/** Instants at which the viewer's local clock reads each whole hour of the day. */
function hourMarks(dayStart: Date, dayEnd: Date, zone: string): { hour: number; at: Date }[] {
  const base = offsetMinutes(dayStart, zone);
  const marks: { hour: number; at: Date }[] = [];
  for (let h = 0; h < 24; h++) {
    const guess = dayStart.getTime() + h * HOUR;
    const at = new Date(guess - (offsetMinutes(new Date(guess), zone) - base) * MINUTE);
    if (at < dayEnd) marks.push({ hour: h, at });
  }
  return marks;
}

export function Timeline({ people, dayStart, dayEnd, cursor, hour12, selected, onHover, onPick, onToggleSelect, onEdit }: Props) {
  const zone = localTimeZone();
  const trackRef = useRef<HTMLDivElement>(null);
  const marks = useMemo(() => hourMarks(dayStart, dayEnd, zone).filter((m) => m.hour % LABEL_EVERY_HOURS === 0), [dayStart, dayEnd, zone]);
  const cursorX = fraction(cursor, dayStart, dayEnd);
  const cursorVisible = cursorX >= 0 && cursorX <= 1;

  // Snap the pointer to 15-minute steps on the axis.
  const dateFromPointer = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const f = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const raw = dayStart.getTime() + f * (dayEnd.getTime() - dayStart.getTime());
      const snapped = Math.round(raw / (SNAP_MINUTES * MINUTE)) * SNAP_MINUTES * MINUTE;
      return new Date(Math.min(dayEnd.getTime() - MINUTE, snapped));
    },
    [dayStart, dayEnd],
  );

  return (
    <div className="timeline">
      <div className="timeline__axis">
        <div className="timeline__spacer" />
        <div className="axis">
          {marks.slice(1).map((m) => (
            <span key={m.hour} className="axis__label" style={{ left: `${fraction(m.at, dayStart, dayEnd) * 100}%` }}>
              {hourLabel(m.hour, hour12)}
            </span>
          ))}
        </div>
        <div className="timeline__spacer timeline__spacer--right" />
      </div>

      <div className="timeline__body">
        {people.map((person) => (
          <PersonRow key={person.id} person={person} dayStart={dayStart} dayEnd={dayEnd} cursor={cursor} hour12={hour12} marks={marks} selected={selected.has(person.id)} onToggleSelect={() => onToggleSelect(person.id)} onEdit={() => onEdit(person)} />
        ))}
      </div>

      {/* Pointer layer + marker, aligned with the track column and spanning axis + rows */}
      <div className="timeline__overlay">
        <div className="timeline__spacer" />
        <div
          ref={trackRef}
          className="cursor-layer"
          onMouseMove={(e) => onHover(dateFromPointer(e.clientX))}
          onMouseLeave={() => onHover(null)}
          onClick={(e) => {
            const d = dateFromPointer(e.clientX);
            if (d) onPick(d);
          }}
        >
          {cursorVisible && (
            <div className="cursor" style={{ left: `${cursorX * 100}%` }}>
              <div className="cursor__badge">{formatTime(cursor, zone, hour12)}</div>
              <div className="cursor__line" />
            </div>
          )}
        </div>
        <div className="timeline__spacer timeline__spacer--right" />
      </div>
    </div>
  );
}

interface RowProps {
  person: Person;
  dayStart: Date;
  dayEnd: Date;
  cursor: Date;
  hour12: boolean;
  marks: { hour: number; at: Date }[];
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
}

function PersonRow({ person, dayStart, dayEnd, cursor, hour12, marks, selected, onToggleSelect, onEdit }: RowProps) {
  const zone = localTimeZone();
  const work = useMemo(() => daySegments(person, dayStart, dayEnd).filter((s) => s.phase === "work"), [person, dayStart, dayEnd]);
  const status = dayStatus(person, cursor);
  const dst = useMemo(() => nextDstTransition(cursor, person.timeZone, DST_WARNING_DAYS), [cursor, person.timeZone]);
  const delta = dayDelta(cursor, person.timeZone, cursor, zone);
  const offset = relativeOffset(cursor, person.timeZone, zone).replace("-", "−").replace(/^([+−]\d+)$/, "$1h");
  const day = delta > 0 ? "Tomorrow" : delta < 0 ? "Yesterday" : null;

  const dstLabel = dst
    ? `Clocks ${dst.deltaMinutes > 0 ? "go forward" : "go back"} ${Math.abs(dst.deltaMinutes) / 60}h on ${new Intl.DateTimeFormat("en-GB", { timeZone: person.timeZone, weekday: "short", day: "numeric", month: "short" }).format(dst.at)}`
    : null;

  return (
    <div className={`row${selected ? " is-selected" : ""}`}>
      <div className="row__who">
        <button className="row__avatar" title={selected ? "Remove from best-time search" : "Include in best-time search"} onClick={onToggleSelect}>
          <Avatar person={person} selected={selected} size={32} />
        </button>
        <div className="row__text">
          <div className="row__name">{person.name || person.city}</div>
          <div className="row__meta">
            {person.city || person.timeZone.split("/").pop()?.replace(/_/g, " ")}
            {offset && <span className="row__offset"> · {offset}</span>}
          </div>
        </div>
        <button className="iconbtn iconbtn--ghost row__edit" title="Edit" onClick={onEdit}>
          <Pencil />
        </button>
      </div>

      <div className="track">
        {marks.slice(1).map((m) => (
          <div key={m.hour} className="track__tick" style={{ left: `${fraction(m.at, dayStart, dayEnd) * 100}%` }} />
        ))}
        {work.map((s, i) => (
          <div key={i} className="track__work" style={{ left: `${s.start * 100}%`, width: `${(s.end - s.start) * 100}%` }} />
        ))}
        {(status.holidays.length > 0 || status.weekend || dst) && (
          <div className="track__badges">
            {status.holidays.map((h) => (
              <span key={h} className="badge badge--holiday" title={`Public holiday: ${h}`}>
                {h}
              </span>
            ))}
            {status.weekend && status.holidays.length === 0 && <span className="badge">Weekend</span>}
            {dst && dstLabel && (
              <span className="badge badge--dst" title={dstLabel}>
                DST {dst.deltaMinutes > 0 ? "+" : "−"}{Math.abs(dst.deltaMinutes) / 60}h soon
              </span>
            )}
          </div>
        )}
      </div>

      <div className="row__time">
        <div className="row__clock">{formatTime(cursor, person.timeZone, hour12)}</div>
        {day && <div className="row__day">{day}</div>}
      </div>
    </div>
  );
}

export const VISIBLE_DAY = DAY;
