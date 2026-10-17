import { useEffect, useMemo, useRef, useState } from "react";
import { BestTimes } from "./components/best-times";
import { DayHeader } from "./components/day-header";
import { PersonEditor } from "./components/person-editor";
import { SearchBar } from "./components/search-bar";
import { SettingsPanel } from "./components/settings-panel";
import { Timeline } from "./components/timeline";
import { useAppState } from "./hooks/use-app-state";
import { useNow } from "./hooks/use-now";
import type { City } from "./lib/cities";
import { type Person, newPerson } from "./lib/model";
import { fitHeight, getAutostart, hideWindow, isTauri, onPopoverShown, setAutostart, setHotkey, setTrayTitle } from "./lib/native";
import { bestSlots } from "./lib/schedule";
import { MINUTE, addDays, formatTime, localTimeZone, startOfDay } from "./lib/time";

type View = { kind: "timeline" } | { kind: "settings" } | { kind: "edit"; person: Person; isNew: boolean };

export default function App() {
  const store = useAppState();
  const now = useNow();
  const zone = localTimeZone();

  const [view, setView] = useState<View>({ kind: "timeline" });
  const [cursor, setCursor] = useState<Date | null>(null); // pinned by click or keyboard; null → follows "now"
  const [hovered, setHovered] = useState<Date | null>(null); // pointer over the grid
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusSignal, setFocusSignal] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const effectiveCursor = hovered ?? cursor ?? now;
  const following = cursor === null && hovered === null;
  const dayStart = useMemo(() => startOfDay(effectiveCursor, zone), [effectiveCursor, zone]);
  const dayEnd = useMemo(() => addDays(dayStart, 1, zone), [dayStart, zone]);

  const settings = store.state?.settings;
  const people = store.state?.people ?? [];
  const groups = store.state?.groups ?? [];
  const visible = useMemo(() => (activeGroup ? people.filter((p) => p.groupIds.includes(activeGroup)) : people), [people, activeGroup]);
  const scoped = visible.filter((p) => selected.has(p.id));
  const bestFor = scoped.length > 0 ? scoped : visible;
  const slots = useMemo(() => bestSlots(bestFor, dayStart, dayEnd), [bestFor, dayStart, dayEnd]);

  // --- native integration -------------------------------------------------

  useEffect(() => {
    const root = document.documentElement;
    if (!settings || settings.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", settings.theme);
  }, [settings?.theme]);

  useEffect(() => {
    if (settings) void setHotkey(settings.hotkey);
  }, [settings?.hotkey]);

  useEffect(() => {
    if (!settings || !isTauri) return;
    getAutostart().then((enabled) => enabled !== settings.launchAtLogin && setAutostart(settings.launchAtLogin));
  }, [settings?.launchAtLogin]);

  useEffect(() => {
    if (!settings) return;
    const person = settings.menuBar === "person" ? (people.find((p) => p.id === settings.menuBarPersonId) ?? people[0]) : undefined;
    void setTrayTitle(person ? `${person.name.split(" ")[0]} ${formatTime(now, person.timeZone, settings.hour12)}` : null);
  }, [now, people, settings?.menuBar, settings?.menuBarPersonId, settings?.hour12]);

  // Size the native window to the rendered card.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => void fitHeight(Math.ceil(entry!.contentRect.height)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () =>
      onPopoverShown(() => {
        setCursor(null);
        setHovered(null);
        setView({ kind: "timeline" });
        setFocusSignal((n) => n + 1);
      }),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "SELECT";
      if (e.key === "Escape") {
        if (view.kind !== "timeline") setView({ kind: "timeline" });
        else if (!typing || !(e.target as HTMLInputElement).value) void hideWindow();
      } else if (!typing && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        setCursor(new Date(effectiveCursor.getTime() + (e.key === "ArrowLeft" ? -15 : 15) * MINUTE));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view.kind, effectiveCursor]);

  // --- actions --------------------------------------------------------------

  const addFromCity = (city: City) =>
    setView({ kind: "edit", isNew: true, person: newPerson({ city: city.city, country: city.country, timeZone: city.timeZone, groupIds: activeGroup ? [activeGroup] : [] }) });

  const shiftDay = (days: number) => setCursor(new Date(effectiveCursor.getTime() + (addDays(dayStart, days, zone).getTime() - dayStart.getTime())));

  // Clicking the pinned time again unpins it.
  const pick = (at: Date) => setCursor((prev) => (prev?.getTime() === at.getTime() ? null : at));

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (!store.state || !settings) return <div ref={rootRef} className="popover" />;

  return (
    <div ref={rootRef} className="popover">
      <div className="card">
        {view.kind === "settings" ? (
          <SettingsPanel settings={settings} people={people} groups={groups} onChange={store.setSettings} onRenameGroup={store.renameGroup} onRemoveGroup={store.removeGroup} onBack={() => setView({ kind: "timeline" })} />
        ) : view.kind === "edit" ? (
          <PersonEditor
            key={view.person.id}
            person={view.person}
            isNew={view.isNew}
            groups={groups}
            hour12={settings.hour12}
            onAddGroup={store.addGroup}
            onSave={(p) => (store.upsertPerson(p), setView({ kind: "timeline" }))}
            onDelete={(id) => (store.removePerson(id), setView({ kind: "timeline" }))}
            onBack={() => setView({ kind: "timeline" })}
          />
        ) : (
          <>
            <SearchBar now={now} hour12={settings.hour12} onPick={addFromCity} onOpenSettings={() => setView({ kind: "settings" })} focusSignal={focusSignal} />
            <div className="card__body">
              <DayHeader dayStart={dayStart} now={now} following={following} groups={groups} activeGroup={activeGroup} onGroup={setActiveGroup} onShift={shiftDay} onNow={() => setCursor(null)} />
              {visible.length === 0 ? (
                <p className="empty">{people.length === 0 ? "Search for a city above to add your first person." : "Nobody in this group yet."}</p>
              ) : (
                <>
                  <Timeline people={visible} dayStart={dayStart} dayEnd={dayEnd} cursor={effectiveCursor} hour12={settings.hour12} selected={selected} onHover={setHovered} onPick={pick} onToggleSelect={toggleSelect} onEdit={(person) => setView({ kind: "edit", person, isNew: false })} />
                  <BestTimes slots={slots} total={bestFor.length} scoped={scoped.length > 0} cursor={effectiveCursor} hour12={settings.hour12} onPick={setCursor} />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
