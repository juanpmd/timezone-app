import type { Group } from "../lib/model";
import { dayDelta, formatDate, localTimeZone } from "../lib/time";
import { ChevronLeft, ChevronRight } from "./icons";

interface Props {
  dayStart: Date;
  now: Date;
  following: boolean;
  groups: Group[];
  activeGroup: string | null;
  onGroup: (id: string | null) => void;
  onShift: (days: number) => void;
  onNow: () => void;
}

function relativeLabel(delta: number): string {
  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta === -1) return "Yesterday";
  return delta > 0 ? `In ${delta} days` : `${-delta} days ago`;
}

export function DayHeader({ dayStart, now, following, groups, activeGroup, onGroup, onShift, onNow }: Props) {
  const zone = localTimeZone();
  const delta = dayDelta(dayStart, zone, now, zone);
  return (
    <div className="dayheader">
      <div className="dayheader__title">
        <strong>{relativeLabel(delta)}</strong>
        <span>{formatDate(dayStart, zone)}</span>
      </div>
      {groups.length > 0 && (
        <div className="chips chips--filter">
          <button className={`chip${activeGroup === null ? " is-on" : ""}`} onClick={() => onGroup(null)}>All</button>
          {groups.map((g) => (
            <button key={g.id} className={`chip${activeGroup === g.id ? " is-on" : ""}`} onClick={() => onGroup(g.id)}>{g.name}</button>
          ))}
        </div>
      )}
      <div className="dayheader__nav">
        {!following && <button className="pill pill--small" onClick={onNow}>Now</button>}
        <button className="roundbtn" title="Previous day" onClick={() => onShift(-1)}><ChevronLeft /></button>
        <button className="roundbtn" title="Next day" onClick={() => onShift(1)}><ChevronRight /></button>
      </div>
    </div>
  );
}
