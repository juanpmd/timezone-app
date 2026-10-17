// Builds src/data/cities.json from the system IANA tables plus a curated list
// of major cities that IANA does not name. Run with: bun scripts/build-cities.ts
//
// Output shape: Array<[city, countryCode, timeZone]>, sorted by city name.

import { readFileSync, writeFileSync } from "node:fs";

const ZONE_TAB = "/usr/share/zoneinfo/zone.tab";
const OUT = new URL("../src/data/cities.json", import.meta.url);

type Row = [city: string, country: string, zone: string];

// Cities that are not IANA zone names but people type constantly.
const EXTRAS: Row[] = [
  // Americas
  ["San Francisco", "US", "America/Los_Angeles"], ["Seattle", "US", "America/Los_Angeles"],
  ["San Diego", "US", "America/Los_Angeles"], ["Portland", "US", "America/Los_Angeles"],
  ["Las Vegas", "US", "America/Los_Angeles"], ["San Jose", "US", "America/Los_Angeles"],
  ["Oakland", "US", "America/Los_Angeles"], ["Sacramento", "US", "America/Los_Angeles"],
  ["Salt Lake City", "US", "America/Denver"], ["Albuquerque", "US", "America/Denver"],
  ["Austin", "US", "America/Chicago"], ["Dallas", "US", "America/Chicago"],
  ["Houston", "US", "America/Chicago"], ["San Antonio", "US", "America/Chicago"],
  ["Minneapolis", "US", "America/Chicago"], ["Kansas City", "US", "America/Chicago"],
  ["St. Louis", "US", "America/Chicago"], ["Nashville", "US", "America/Chicago"],
  ["Milwaukee", "US", "America/Chicago"], ["New Orleans", "US", "America/Chicago"],
  ["Oklahoma City", "US", "America/Chicago"], ["Omaha", "US", "America/Chicago"],
  ["Boston", "US", "America/New_York"], ["Washington", "US", "America/New_York"],
  ["Philadelphia", "US", "America/New_York"], ["Miami", "US", "America/New_York"],
  ["Atlanta", "US", "America/New_York"], ["Charlotte", "US", "America/New_York"],
  ["Pittsburgh", "US", "America/New_York"], ["Baltimore", "US", "America/New_York"],
  ["Orlando", "US", "America/New_York"], ["Tampa", "US", "America/New_York"],
  ["Raleigh", "US", "America/New_York"], ["Columbus", "US", "America/New_York"],
  ["Cleveland", "US", "America/New_York"], ["Cincinnati", "US", "America/New_York"],
  ["Buffalo", "US", "America/New_York"], ["Richmond", "US", "America/New_York"],
  ["Brooklyn", "US", "America/New_York"], ["Jersey City", "US", "America/New_York"],
  ["Honolulu", "US", "Pacific/Honolulu"],
  ["Montreal", "CA", "America/Toronto"], ["Ottawa", "CA", "America/Toronto"],
  ["Calgary", "CA", "America/Edmonton"], ["Quebec City", "CA", "America/Toronto"],
  ["Mexico City", "MX", "America/Mexico_City"], ["Guadalajara", "MX", "America/Mexico_City"],
  ["Monterrey", "MX", "America/Monterrey"], ["Medellín", "CO", "America/Bogota"],
  ["Cali", "CO", "America/Bogota"], ["Cartagena", "CO", "America/Bogota"],
  ["Barranquilla", "CO", "America/Bogota"], ["Bucaramanga", "CO", "America/Bogota"],
  ["Quito", "EC", "America/Guayaquil"], ["Bogotá", "CO", "America/Bogota"], ["Rio de Janeiro", "BR", "America/Sao_Paulo"],
  ["Brasília", "BR", "America/Sao_Paulo"], ["Belo Horizonte", "BR", "America/Sao_Paulo"],
  ["Curitiba", "BR", "America/Sao_Paulo"], ["Porto Alegre", "BR", "America/Sao_Paulo"],
  ["Salvador", "BR", "America/Bahia"], ["Florianópolis", "BR", "America/Sao_Paulo"],
  ["Córdoba", "AR", "America/Argentina/Cordoba"], ["Rosario", "AR", "America/Argentina/Buenos_Aires"],
  ["Valparaíso", "CL", "America/Santiago"], ["San José", "CR", "America/Costa_Rica"],
  ["Guatemala City", "GT", "America/Guatemala"], ["San Salvador", "SV", "America/El_Salvador"],
  ["Panama City", "PA", "America/Panama"], ["Santo Domingo", "DO", "America/Santo_Domingo"],
  ["San Juan", "PR", "America/Puerto_Rico"], ["Havana", "CU", "America/Havana"],
  ["Kingston", "JM", "America/Jamaica"], ["Buenos Aires", "AR", "America/Argentina/Buenos_Aires"],
  // Europe
  ["Munich", "DE", "Europe/Berlin"], ["Frankfurt", "DE", "Europe/Berlin"],
  ["Hamburg", "DE", "Europe/Berlin"], ["Cologne", "DE", "Europe/Berlin"],
  ["Stuttgart", "DE", "Europe/Berlin"], ["Düsseldorf", "DE", "Europe/Berlin"],
  ["Leipzig", "DE", "Europe/Berlin"], ["Dresden", "DE", "Europe/Berlin"],
  ["Milan", "IT", "Europe/Rome"], ["Turin", "IT", "Europe/Rome"], ["Naples", "IT", "Europe/Rome"],
  ["Florence", "IT", "Europe/Rome"], ["Bologna", "IT", "Europe/Rome"], ["Venice", "IT", "Europe/Rome"],
  ["Barcelona", "ES", "Europe/Madrid"], ["Valencia", "ES", "Europe/Madrid"],
  ["Seville", "ES", "Europe/Madrid"], ["Bilbao", "ES", "Europe/Madrid"], ["Málaga", "ES", "Europe/Madrid"],
  ["Palma", "ES", "Europe/Madrid"], ["Porto", "PT", "Europe/Lisbon"],
  ["Lyon", "FR", "Europe/Paris"], ["Marseille", "FR", "Europe/Paris"], ["Toulouse", "FR", "Europe/Paris"],
  ["Nice", "FR", "Europe/Paris"], ["Bordeaux", "FR", "Europe/Paris"], ["Nantes", "FR", "Europe/Paris"],
  ["Lille", "FR", "Europe/Paris"], ["Strasbourg", "FR", "Europe/Paris"],
  ["Manchester", "GB", "Europe/London"], ["Birmingham", "GB", "Europe/London"],
  ["Edinburgh", "GB", "Europe/London"], ["Glasgow", "GB", "Europe/London"],
  ["Leeds", "GB", "Europe/London"], ["Liverpool", "GB", "Europe/London"],
  ["Bristol", "GB", "Europe/London"], ["Cambridge", "GB", "Europe/London"],
  ["Oxford", "GB", "Europe/London"], ["Cardiff", "GB", "Europe/London"], ["Belfast", "GB", "Europe/London"],
  ["Cork", "IE", "Europe/Dublin"], ["Galway", "IE", "Europe/Dublin"],
  ["Rotterdam", "NL", "Europe/Amsterdam"], ["The Hague", "NL", "Europe/Amsterdam"],
  ["Utrecht", "NL", "Europe/Amsterdam"], ["Eindhoven", "NL", "Europe/Amsterdam"],
  ["Antwerp", "BE", "Europe/Brussels"], ["Ghent", "BE", "Europe/Brussels"],
  ["Geneva", "CH", "Europe/Zurich"], ["Basel", "CH", "Europe/Zurich"], ["Bern", "CH", "Europe/Zurich"],
  ["Lausanne", "CH", "Europe/Zurich"], ["Gothenburg", "SE", "Europe/Stockholm"],
  ["Malmö", "SE", "Europe/Stockholm"], ["Bergen", "NO", "Europe/Oslo"],
  ["Aarhus", "DK", "Europe/Copenhagen"], ["Tampere", "FI", "Europe/Helsinki"],
  ["Kraków", "PL", "Europe/Warsaw"], ["Wrocław", "PL", "Europe/Warsaw"], ["Gdańsk", "PL", "Europe/Warsaw"],
  ["Poznań", "PL", "Europe/Warsaw"], ["Brno", "CZ", "Europe/Prague"],
  ["Graz", "AT", "Europe/Vienna"], ["Salzburg", "AT", "Europe/Vienna"],
  ["Thessaloniki", "GR", "Europe/Athens"], ["Cluj-Napoca", "RO", "Europe/Bucharest"],
  ["Timișoara", "RO", "Europe/Bucharest"], ["Lviv", "UA", "Europe/Kyiv"], ["Odesa", "UA", "Europe/Kyiv"],
  ["Saint Petersburg", "RU", "Europe/Moscow"], ["Kazan", "RU", "Europe/Moscow"],
  ["Novosibirsk", "RU", "Asia/Novosibirsk"], ["Yekaterinburg", "RU", "Asia/Yekaterinburg"],
  ["Split", "HR", "Europe/Zagreb"], ["Reykjavík", "IS", "Atlantic/Reykjavik"],
  ["Ankara", "TR", "Europe/Istanbul"], ["Izmir", "TR", "Europe/Istanbul"], ["Antalya", "TR", "Europe/Istanbul"],
  // Middle East & Africa
  ["Abu Dhabi", "AE", "Asia/Dubai"], ["Sharjah", "AE", "Asia/Dubai"], ["Doha", "QA", "Asia/Qatar"],
  ["Jeddah", "SA", "Asia/Riyadh"], ["Mecca", "SA", "Asia/Riyadh"], ["Medina", "SA", "Asia/Riyadh"],
  ["Dammam", "SA", "Asia/Riyadh"], ["Manama", "BH", "Asia/Bahrain"], ["Kuwait City", "KW", "Asia/Kuwait"],
  ["Muscat", "OM", "Asia/Muscat"], ["Tel Aviv", "IL", "Asia/Jerusalem"], ["Haifa", "IL", "Asia/Jerusalem"],
  ["Alexandria", "EG", "Africa/Cairo"], ["Giza", "EG", "Africa/Cairo"],
  ["Marrakesh", "MA", "Africa/Casablanca"], ["Rabat", "MA", "Africa/Casablanca"],
  ["Cape Town", "ZA", "Africa/Johannesburg"], ["Durban", "ZA", "Africa/Johannesburg"],
  ["Pretoria", "ZA", "Africa/Johannesburg"], ["Abuja", "NG", "Africa/Lagos"],
  ["Mombasa", "KE", "Africa/Nairobi"], ["Addis Ababa", "ET", "Africa/Addis_Ababa"],
  ["Dar es Salaam", "TZ", "Africa/Dar_es_Salaam"], ["Kigali", "RW", "Africa/Kigali"],
  ["Accra", "GH", "Africa/Accra"], ["Dakar", "SN", "Africa/Dakar"], ["Tunis", "TN", "Africa/Tunis"],
  // Asia
  ["Mumbai", "IN", "Asia/Kolkata"], ["Bengaluru", "IN", "Asia/Kolkata"], ["Bangalore", "IN", "Asia/Kolkata"],
  ["Delhi", "IN", "Asia/Kolkata"], ["New Delhi", "IN", "Asia/Kolkata"], ["Hyderabad", "IN", "Asia/Kolkata"],
  ["Chennai", "IN", "Asia/Kolkata"], ["Pune", "IN", "Asia/Kolkata"], ["Ahmedabad", "IN", "Asia/Kolkata"],
  ["Gurugram", "IN", "Asia/Kolkata"], ["Noida", "IN", "Asia/Kolkata"], ["Jaipur", "IN", "Asia/Kolkata"],
  ["Kochi", "IN", "Asia/Kolkata"], ["Chandigarh", "IN", "Asia/Kolkata"], ["Lucknow", "IN", "Asia/Kolkata"],
  ["Surat", "IN", "Asia/Kolkata"], ["Indore", "IN", "Asia/Kolkata"], ["Goa", "IN", "Asia/Kolkata"],
  ["Lahore", "PK", "Asia/Karachi"], ["Islamabad", "PK", "Asia/Karachi"],
  ["Chittagong", "BD", "Asia/Dhaka"], ["Kandy", "LK", "Asia/Colombo"],
  ["Beijing", "CN", "Asia/Shanghai"], ["Shenzhen", "CN", "Asia/Shanghai"], ["Guangzhou", "CN", "Asia/Shanghai"],
  ["Hangzhou", "CN", "Asia/Shanghai"], ["Chengdu", "CN", "Asia/Shanghai"], ["Nanjing", "CN", "Asia/Shanghai"],
  ["Wuhan", "CN", "Asia/Shanghai"], ["Xi'an", "CN", "Asia/Shanghai"], ["Tianjin", "CN", "Asia/Shanghai"],
  ["Suzhou", "CN", "Asia/Shanghai"], ["Chongqing", "CN", "Asia/Shanghai"],
  ["Osaka", "JP", "Asia/Tokyo"], ["Kyoto", "JP", "Asia/Tokyo"], ["Nagoya", "JP", "Asia/Tokyo"],
  ["Yokohama", "JP", "Asia/Tokyo"], ["Fukuoka", "JP", "Asia/Tokyo"], ["Sapporo", "JP", "Asia/Tokyo"],
  ["Busan", "KR", "Asia/Seoul"], ["Incheon", "KR", "Asia/Seoul"], ["Daegu", "KR", "Asia/Seoul"],
  ["Kaohsiung", "TW", "Asia/Taipei"], ["Taichung", "TW", "Asia/Taipei"],
  ["Hanoi", "VN", "Asia/Bangkok"], ["Da Nang", "VN", "Asia/Ho_Chi_Minh"],
  ["Chiang Mai", "TH", "Asia/Bangkok"], ["Phuket", "TH", "Asia/Bangkok"],
  ["Penang", "MY", "Asia/Kuala_Lumpur"], ["Johor Bahru", "MY", "Asia/Kuala_Lumpur"],
  ["Bali", "ID", "Asia/Makassar"], ["Denpasar", "ID", "Asia/Makassar"], ["Surabaya", "ID", "Asia/Jakarta"],
  ["Bandung", "ID", "Asia/Jakarta"], ["Yogyakarta", "ID", "Asia/Jakarta"],
  ["Cebu", "PH", "Asia/Manila"], ["Davao", "PH", "Asia/Manila"], ["Quezon City", "PH", "Asia/Manila"],
  ["Phnom Penh", "KH", "Asia/Phnom_Penh"], ["Vientiane", "LA", "Asia/Vientiane"],
  ["Astana", "KZ", "Asia/Almaty"], ["Tashkent", "UZ", "Asia/Tashkent"],
  // Oceania
  ["Canberra", "AU", "Australia/Sydney"], ["Gold Coast", "AU", "Australia/Brisbane"],
  ["Newcastle", "AU", "Australia/Sydney"], ["Wollongong", "AU", "Australia/Sydney"],
  ["Geelong", "AU", "Australia/Melbourne"], ["Wellington", "NZ", "Pacific/Auckland"],
  ["Christchurch", "NZ", "Pacific/Auckland"], ["Queenstown", "NZ", "Pacific/Auckland"],
];

// IANA ids that are not meaningful cities to show in a picker.
const SKIP = /^(Etc|SystemV)\//;

function cityFromZone(zone: string): string {
  const last = zone.split("/").pop()!;
  return last.replace(/_/g, " ");
}

const zoneRows: Row[] = readFileSync(ZONE_TAB, "utf8")
  .split("\n")
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => line.split("\t"))
  .filter(([, , zone]) => !SKIP.test(zone))
  .map(([country, , zone]) => [cityFromZone(zone), country, zone]);

// Prefer the curated row when both name the same city in the same country.
const byKey = new Map<string, Row>();
for (const row of [...zoneRows, ...EXTRAS]) byKey.set(`${row[0]}|${row[1]}`, row);

const rows = [...byKey.values()].sort((a, b) => a[0].localeCompare(b[0]));
writeFileSync(OUT, JSON.stringify(rows));
console.log(`wrote ${rows.length} cities to ${OUT.pathname}`);
