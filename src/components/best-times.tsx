import type { Slot } from "../lib/schedule";
import { formatTime, localTimeZone } from "../lib/time";
import { Sparkle } from "./icons";

interface Props {
  slots: Slot[];
  total: number; // people considered
  scoped: boolean; // true when a manual selection is active
  cursor: Date;
  hour12: boolean;
  onPick: (date: Date) => void;
}

export function BestTimes({ slots, total, scoped, cursor, hour12, onPick }: Props) {
  const zone = localTimeZone();
  const everyone = slots.length > 0 && slots[0]!.available === total;
  const who = scoped ? "Selected people" : "Everyone";
  const label = slots.length === 0 ? `No shared working hours${scoped ? " for the selection" : ""}` : everyone ? `${who === "Everyone" ? "Everyone's" : `${who} are`} free at` : `Best overlap (${slots[0]!.available} of ${total}) at`;

  return (
    <div className="besttimes">
      <span className="besttimes__label">
        <span className="besttimes__spark"><Sparkle /></span>
        {label}
      </span>
      <div className="chips">
        {slots.map((s) => {
          const active = Math.abs(s.start.getTime() - cursor.getTime()) < 30 * 60_000;
          return (
            <button key={s.start.getTime()} className={`chip chip--time${active ? " is-on" : ""}`} onClick={() => onPick(s.start)}>
              {formatTime(s.start, zone, hour12)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
