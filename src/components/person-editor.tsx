import { useMemo, useRef, useState } from "react";
import { type City, countryName, searchCities } from "../lib/cities";
import { SUPPORTED_COUNTRIES } from "../lib/holidays";
import { type Group, type Person, type Weekday, uid } from "../lib/model";
import { Avatar } from "./avatar";
import { Back, Camera, Plus, Trash } from "./icons";

interface Props {
  person: Person;
  isNew: boolean;
  groups: Group[];
  hour12: boolean;
  onSave: (person: Person) => void;
  onDelete: (id: string) => void;
  onAddGroup: (group: Group) => void;
  onBack: () => void;
}

const WEEKDAYS: { day: Weekday; label: string }[] = [
  { day: 0, label: "S" }, { day: 1, label: "M" }, { day: 2, label: "T" }, { day: 3, label: "W" }, { day: 4, label: "T" }, { day: 5, label: "F" }, { day: 6, label: "S" },
];

const PHOTO_SIZE = 128;

/** Reads an image file and returns a square, downscaled data URL. */
function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = PHOTO_SIZE;
      const ctx = canvas.getContext("2d")!;
      const side = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function hourOptions(hour12: boolean) {
  return Array.from({ length: 25 }, (_, h) => ({
    value: h,
    label: !hour12 ? `${String(h % 24).padStart(2, "0")}:00` : h % 24 === 0 ? "12:00 AM" : h === 12 ? "12:00 PM" : `${h % 12}:00 ${h < 12 ? "AM" : "PM"}`,
  }));
}

export function PersonEditor({ person, isNew, groups, hour12, onSave, onDelete, onAddGroup, onBack }: Props) {
  const [draft, setDraft] = useState<Person>(person);
  const [cityQuery, setCityQuery] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cityResults = useMemo(() => searchCities(cityQuery, 5), [cityQuery]);
  const hours = useMemo(() => hourOptions(hour12), [hour12]);

  const patch = (p: Partial<Person>) => setDraft((d) => ({ ...d, ...p }));
  const pickCity = (c: City) => {
    patch({ city: c.city, country: c.country, timeZone: c.timeZone, name: draft.name || "" });
    setCityQuery("");
  };
  const toggleGroup = (id: string) => patch({ groupIds: draft.groupIds.includes(id) ? draft.groupIds.filter((g) => g !== id) : [...draft.groupIds, id] });
  const toggleWeekend = (day: Weekday) => patch({ weekend: draft.weekend.includes(day) ? draft.weekend.filter((d) => d !== day) : [...draft.weekend, day].sort() });
  const createGroup = () => {
    const name = newGroup.trim();
    if (!name) return;
    const group = { id: uid(), name };
    onAddGroup(group);
    patch({ groupIds: [...draft.groupIds, group.id] });
    setNewGroup("");
  };
  const canSave = Boolean(draft.timeZone && (draft.name.trim() || draft.city));
  const holidaysSupported = SUPPORTED_COUNTRIES.includes(draft.country);

  return (
    <div className="panel">
      <div className="panel__head">
        <button className="iconbtn" onClick={onBack} title="Back"><Back /></button>
        <h2>{isNew ? "New person" : "Edit person"}</h2>
        {!isNew && (
          <button className="iconbtn iconbtn--danger" title="Remove" onClick={() => onDelete(draft.id)}><Trash /></button>
        )}
      </div>

      <div className="editor">
        <div className="editor__identity">
          <button className="editor__photo" onClick={() => fileRef.current?.click()} title="Choose a photo">
            <Avatar person={draft} size={56} />
            <span className="editor__photo-badge"><Camera size={12} /></span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) patch({ photo: await readPhoto(file) });
              e.target.value = "";
            }}
          />
          <div className="editor__fields">
            <input autoCorrect="off" autoCapitalize="off" spellCheck={false} className="field" placeholder="Name" value={draft.name} onChange={(e) => patch({ name: e.target.value })} autoFocus={isNew && Boolean(draft.city)} />
            <div className="field-wrap">
              <input
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="field"
                placeholder={draft.city ? `${draft.city}, ${countryName(draft.country)}` : "City"}
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && cityResults[0] && (e.preventDefault(), pickCity(cityResults[0]))}
              />
              {cityResults.length > 0 && (
                <ul className="results results--inline">
                  {cityResults.map((c) => (
                    <li key={`${c.city}|${c.country}`} onMouseDown={(e) => (e.preventDefault(), pickCity(c))}>
                      <span className="results__city">{c.city}<span className="results__country">{c.countryName}</span></span>
                      <span className="results__time">{c.timeZone}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {draft.photo && (
              <button className="linkbtn" onClick={() => patch({ photo: undefined })}>Remove photo</button>
            )}
          </div>
        </div>

        <section className="editor__section">
          <label className="editor__label">Groups</label>
          <div className="chips">
            {groups.map((g) => (
              <button key={g.id} className={`chip${draft.groupIds.includes(g.id) ? " is-on" : ""}`} onClick={() => toggleGroup(g.id)}>{g.name}</button>
            ))}
            <span className="chip chip--input">
              <input autoCorrect="off" autoCapitalize="off" spellCheck={false} placeholder="New group" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createGroup()} />
              <button className="iconbtn iconbtn--ghost" onClick={createGroup} title="Add group"><Plus size={12} /></button>
            </span>
          </div>
        </section>

        <section className="editor__section editor__section--row">
          <div>
            <label className="editor__label">Working hours</label>
            <div className="editor__hours">
              <select className="field field--select" value={draft.workStart} onChange={(e) => patch({ workStart: +e.target.value })}>
                {hours.slice(0, 24).map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
              <span>to</span>
              <select className="field field--select" value={draft.workEnd} onChange={(e) => patch({ workEnd: +e.target.value })}>
                {hours.slice(1).map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="editor__label">Weekend</label>
            <div className="weekdays">
              {WEEKDAYS.map(({ day, label }) => (
                <button key={day} className={`weekday${draft.weekend.includes(day) ? " is-on" : ""}`} onClick={() => toggleWeekend(day)} title={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <p className="editor__hint">
          {draft.timeZone}
          {draft.country && ` · Holidays for ${countryName(draft.country)}${holidaysSupported ? "" : " are not available offline yet"}`}
        </p>

        <div className="panel__foot">
          <button className="pill" onClick={onBack}>Cancel</button>
          <button className="pill pill--primary" disabled={!canSave} onClick={() => onSave({ ...draft, name: draft.name.trim() || draft.city })}>
            {isNew ? "Add person" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
