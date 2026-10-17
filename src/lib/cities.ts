import rows from "../data/cities.json";

export interface City {
  city: string;
  country: string;
  countryName: string;
  timeZone: string;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const CITIES: City[] = (rows as [string, string, string][]).map(([city, country, timeZone]) => ({
  city,
  country,
  countryName: countryName(country),
  timeZone,
}));

const INDEX = CITIES.map((c) => ({ c, key: normalize(c.city), countryKey: normalize(c.countryName) }));

export function searchCities(query: string, limit = 6): City[] {
  const q = normalize(query.trim());
  if (!q) return [];
  const scored: { c: City; score: number }[] = [];
  for (const { c, key, countryKey } of INDEX) {
    let score = -1;
    if (key === q) score = 0;
    else if (key.startsWith(q)) score = 1;
    else if (key.split(" ").some((w) => w.startsWith(q))) score = 2;
    else if (key.includes(q)) score = 3;
    else if (countryKey.startsWith(q)) score = 4;
    if (score >= 0) scored.push({ c, score });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.c.city.localeCompare(b.c.city))
    .slice(0, limit)
    .map((s) => s.c);
}

/** Best guess of a city for an IANA zone (used to seed the "You" row). */
export function cityForZone(timeZone: string): City | undefined {
  const ianaName = normalize(timeZone.split("/").pop()!.replace(/_/g, " "));
  const candidates = CITIES.filter((c) => c.timeZone === timeZone);
  return candidates.find((c) => normalize(c.city) === ianaName) ?? candidates[0];
}
