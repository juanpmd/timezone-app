import { useCallback, useEffect, useRef, useState } from "react";
import { cityForZone } from "../lib/cities";
import { type AppState, DEFAULT_SETTINGS, type Group, type Person, newPerson } from "../lib/model";
import { loadState, saveState } from "../lib/native";
import { localTimeZone } from "../lib/time";

function seedState(): AppState {
  const zone = localTimeZone();
  const city = cityForZone(zone);
  return {
    people: [newPerson({ name: "You", city: city?.city ?? zone.split("/").pop()?.replace(/_/g, " ") ?? "", country: city?.country ?? "", timeZone: zone })],
    groups: [
      { id: "team", name: "Team" },
      { id: "clients", name: "Clients" },
      { id: "family", name: "Family" },
    ],
    settings: DEFAULT_SETTINGS,
  };
}

function migrate(raw: Partial<AppState>): AppState {
  return {
    people: (raw.people ?? []).map((p) => newPerson(p)),
    groups: raw.groups ?? [],
    settings: { ...DEFAULT_SETTINGS, ...raw.settings },
  };
}

export function useAppState() {
  const [state, setState] = useState<AppState | null>(null);
  const saveTimer = useRef<number>(undefined);

  useEffect(() => {
    loadState()
      .then((json) => setState(json ? migrate(JSON.parse(json)) : seedState()))
      .catch(() => setState(seedState()));
  }, []);

  // Persist shortly after each change.
  useEffect(() => {
    if (!state) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void saveState(JSON.stringify(state)), 300);
  }, [state]);

  const update = useCallback((patch: (s: AppState) => AppState) => setState((s) => (s ? patch(s) : s)), []);

  return {
    state,
    setSettings: (patch: Partial<AppState["settings"]>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    upsertPerson: (person: Person) =>
      update((s) => ({
        ...s,
        people: s.people.some((p) => p.id === person.id) ? s.people.map((p) => (p.id === person.id ? person : p)) : [...s.people, person],
      })),
    removePerson: (id: string) => update((s) => ({ ...s, people: s.people.filter((p) => p.id !== id) })),
    addGroup: (group: Group) => update((s) => ({ ...s, groups: [...s.groups, group] })),
    renameGroup: (id: string, name: string) => update((s) => ({ ...s, groups: s.groups.map((g) => (g.id === id ? { ...g, name } : g)) })),
    removeGroup: (id: string) =>
      update((s) => ({
        ...s,
        groups: s.groups.filter((g) => g.id !== id),
        people: s.people.map((p) => ({ ...p, groupIds: p.groupIds.filter((g) => g !== id) })),
      })),
  };
}
