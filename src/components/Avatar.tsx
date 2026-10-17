import type { Person } from "../lib/model";

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

interface Props {
  person: Pick<Person, "name" | "photo" | "color">;
  size?: number;
  selected?: boolean;
}

export function Avatar({ person, size = 36, selected = false }: Props) {
  const style = { width: size, height: size, fontSize: size * 0.38, background: person.photo ? undefined : person.color };
  return (
    <div className={`avatar${selected ? " avatar--selected" : ""}`} style={style}>
      {person.photo ? <img src={person.photo} alt="" /> : <span>{initials(person.name)}</span>}
      {selected && (
        <span className="avatar__check">
          <svg viewBox="0 0 12 12" width="10" height="10">
            <path d="M2 6.5 4.8 9 10 3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  );
}
