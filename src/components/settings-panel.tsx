import { useState } from "react";
import type { Group, Person, Settings } from "../lib/model";
import { quitApp } from "../lib/native";
import { Back, Trash } from "./icons";

interface Props {
  settings: Settings;
  people: Person[];
  groups: Group[];
  onChange: (patch: Partial<Settings>) => void;
  onRenameGroup: (id: string, name: string) => void;
  onRemoveGroup: (id: string) => void;
  onBack: () => void;
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.value} className={o.value === value ? "is-on" : ""} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className={`toggle${on ? " is-on" : ""}`} role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

/** Captures a key combination in the format the global-shortcut plugin parses. */
function HotkeyRecorder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [recording, setRecording] = useState(false);
  const onKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    if (e.key === "Escape") return setRecording(false);
    if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) return;
    const mods = [e.metaKey && "Super", e.ctrlKey && "Control", e.altKey && "Alt", e.shiftKey && "Shift"].filter(Boolean) as string[];
    if (mods.length === 0) return;
    const key = e.code.startsWith("Key") ? e.code.slice(3) : e.code.startsWith("Digit") ? e.code.slice(5) : e.code;
    onChange([...mods, key].join("+"));
    setRecording(false);
  };
  return (
    <button className={`hotkey${recording ? " is-recording" : ""}`} onClick={() => setRecording(true)} onBlur={() => setRecording(false)} onKeyDown={recording ? onKeyDown : undefined}>
      {recording ? "Press keys…" : value.replace("Super", "⌘").replace("Control", "⌃").replace("Alt", "⌥").replace("Shift", "⇧").replace(/\+/g, " ")}
    </button>
  );
}

export function SettingsPanel({ settings, people, groups, onChange, onRenameGroup, onRemoveGroup, onBack }: Props) {
  return (
    <div className="panel">
      <div className="panel__head">
        <button className="iconbtn" onClick={onBack} title="Back"><Back /></button>
        <h2>Settings</h2>
      </div>

      <div className="settings">
        <div className="setting">
          <span>Appearance</span>
          <Segmented value={settings.theme} options={[{ value: "system", label: "System" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} onChange={(theme) => onChange({ theme })} />
        </div>
        <div className="setting">
          <span>Clock</span>
          <Segmented value={settings.hour12 ? "12" : "24"} options={[{ value: "12", label: "12-hour" }, { value: "24", label: "24-hour" }]} onChange={(v) => onChange({ hour12: v === "12" })} />
        </div>
        <div className="setting">
          <span>Launch at login</span>
          <Toggle on={settings.launchAtLogin} onChange={(launchAtLogin) => onChange({ launchAtLogin })} />
        </div>
        <div className="setting">
          <span>Global hotkey</span>
          <HotkeyRecorder value={settings.hotkey} onChange={(hotkey) => onChange({ hotkey })} />
        </div>
        <div className="setting">
          <span>Menu bar shows</span>
          <div className="setting__stack">
            <Segmented value={settings.menuBar} options={[{ value: "icon", label: "Icon" }, { value: "person", label: "Someone's time" }]} onChange={(menuBar) => onChange({ menuBar })} />
            {settings.menuBar === "person" && (
              <select className="field field--select" value={settings.menuBarPersonId ?? people[0]?.id ?? ""} onChange={(e) => onChange({ menuBarPersonId: e.target.value })}>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.city}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="setting setting--column">
          <span>Groups</span>
          {groups.length === 0 && <p className="muted">Create groups from a person's editor.</p>}
          {groups.map((g) => (
            <div key={g.id} className="grouprow">
              <input autoCorrect="off" autoCapitalize="off" spellCheck={false} className="field" value={g.name} onChange={(e) => onRenameGroup(g.id, e.target.value)} />
              <button className="iconbtn iconbtn--danger" title="Delete group" onClick={() => onRemoveGroup(g.id)}><Trash /></button>
            </div>
          ))}
        </div>

        <div className="panel__foot panel__foot--spread">
          <span className="muted">Timezone 0.1.0</span>
          <button className="pill" onClick={() => void quitApp()}>Quit Timezone</button>
        </div>
      </div>
    </div>
  );
}
