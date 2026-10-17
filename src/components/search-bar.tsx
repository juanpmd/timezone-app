import { useEffect, useMemo, useRef, useState } from "react";
import { type City, searchCities } from "../lib/cities";
import { formatTime } from "../lib/time";
import { Clock, Gear } from "./icons";

interface Props {
  now: Date;
  hour12: boolean;
  onPick: (city: City) => void;
  onOpenSettings: () => void;
  focusSignal: number; // bump to refocus the input
}

export function SearchBar({ now, hour12, onPick, onOpenSettings, focusSignal }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchCities(query), [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [focusSignal]);

  const pick = (city: City) => {
    onPick(city);
    setQuery("");
    setActive(0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => (a + 1) % results.length));
    else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => (a - 1 + results.length) % results.length));
    else if (e.key === "Enter") (e.preventDefault(), pick(results[active]!));
    else if (e.key === "Escape") (e.stopPropagation(), setQuery(""));
  };

  return (
    <div className="searchbar">
      <div className="searchbar__icon">
        <Clock />
      </div>
      <input
        ref={inputRef}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="searchbar__input"
        placeholder="Add a city or person…"
        value={query}
        onChange={(e) => (setQuery(e.target.value), setActive(0))}
        onKeyDown={onKeyDown}
      />
      <button className="iconbtn" title="Settings" onClick={onOpenSettings}>
        <Gear />
      </button>

      {results.length > 0 && (
        <ul className="results">
          {results.map((c, i) => (
            <li key={`${c.city}|${c.country}`} className={i === active ? "is-active" : ""} onMouseEnter={() => setActive(i)} onMouseDown={(e) => (e.preventDefault(), pick(c))}>
              <span className="results__city">
                {c.city}
                <span className="results__country">{c.countryName}</span>
              </span>
              <span className="results__time">{formatTime(now, c.timeZone, hour12)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
