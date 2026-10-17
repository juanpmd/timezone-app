export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface Person {
  id: string;
  name: string;
  city: string;
  country: string; // ISO 3166-1 alpha-2
  timeZone: string; // IANA
  photo?: string; // data URL
  color: string; // avatar fallback hue
  groupIds: string[];
  workStart: number; // hour, 0–24
  workEnd: number; // hour, 0–24
  weekend: Weekday[];
}

export interface Group {
  id: string;
  name: string;
}

export type MenuBarMode = "icon" | "person";

export interface Settings {
  hour12: boolean;
  theme: "system" | "light" | "dark";
  hotkey: string;
  launchAtLogin: boolean;
  menuBar: MenuBarMode;
  menuBarPersonId?: string;
}

export interface AppState {
  people: Person[];
  groups: Group[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  hour12: true,
  theme: "system",
  hotkey: "Alt+Shift+T",
  launchAtLogin: false,
  menuBar: "icon",
};

export const AVATAR_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export const uid = () => Math.random().toString(36).slice(2, 10);

export function newPerson(partial: Partial<Person> = {}): Person {
  return {
    id: uid(),
    name: "",
    city: "",
    country: "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    groupIds: [],
    workStart: 9,
    workEnd: 17,
    weekend: [0, 6],
    ...partial,
  };
}
