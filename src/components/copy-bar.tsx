import { useEffect, useState } from "react";
import { formatForEmail, formatForSlack } from "../lib/clipboard";
import type { Person } from "../lib/model";
import { copyText } from "../lib/native";
import { formatDate, formatTime, localTimeZone } from "../lib/time";

interface Props {
  people: Person[];
  cursor: Date;
  hour12: boolean;
}

export function CopyBar({ people, cursor, hour12 }: Props) {
  const zone = localTimeZone();
  const [copied, setCopied] = useState<"slack" | "email" | null>(null);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(null), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copy = async (kind: "slack" | "email") => {
    const text = kind === "slack" ? formatForSlack(people, cursor, hour12) : formatForEmail(people, cursor, hour12);
    await copyText(text);
    setCopied(kind);
  };

  const shifted = people.filter((p) => formatDate(cursor, p.timeZone) !== formatDate(cursor, zone)).length;

  return (
    <div className="copybar">
      <div className="copybar__info">
        <div className="copybar__title">
          {formatDate(cursor, zone)} · {formatTime(cursor, zone, hour12)}
        </div>
        <div className="copybar__sub">
          {people.length} {people.length === 1 ? "person" : "people"}
          {shifted > 0 && ` · ${shifted} on a different date`}
        </div>
      </div>
      <div className="copybar__actions">
        <button className="pill" onClick={() => copy("slack")} disabled={people.length === 0}>
          {copied === "slack" ? "Copied ✓" : "Copy for Slack"}
        </button>
        <button className="pill pill--primary" onClick={() => copy("email")} disabled={people.length === 0}>
          {copied === "email" ? "Copied ✓" : "Copy for Email"}
        </button>
      </div>
    </div>
  );
}
