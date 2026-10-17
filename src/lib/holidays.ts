// Offline public-holiday rules. Covers fixed-date, nth-weekday and Easter-relative
// holidays for the most common countries. Holidays set by lunar or Islamic
// calendars (Eid, Diwali, Lunar New Year…) move every year and are intentionally
// left out rather than guessed.

type Rule =
  | { name: string; m: number; d: number; sub?: Substitution }
  | { name: string; m: number; weekday: number; n: number } // n < 0 counts from month end
  | { name: string; easter: number }; // days relative to Western Easter Sunday

/** How a fixed holiday that lands on a weekend is observed. */
type Substitution = "us" | "mon"; // us: Sat→Fri, Sun→Mon. mon: Sat/Sun→next Mon(s)

export interface Holiday {
  name: string;
  date: Date; // UTC midnight of the calendar date
}

const US_SUB: Substitution = "us";
const UK_SUB: Substitution = "mon";

const fixed = (name: string, m: number, d: number, sub?: Substitution): Rule => ({ name, m, d, sub });
const nth = (name: string, m: number, weekday: number, n: number): Rule => ({ name, m, weekday, n });
const easter = (name: string, offset: number): Rule => ({ name, easter: offset });

const WESTERN_EUROPE_COMMON = [fixed("New Year's Day", 1, 1), easter("Easter Monday", 1), fixed("Christmas Day", 12, 25)];

const RULES: Record<string, Rule[]> = {
  US: [
    fixed("New Year's Day", 1, 1, US_SUB), nth("Martin Luther King Jr. Day", 1, 1, 3), nth("Presidents' Day", 2, 1, 3),
    nth("Memorial Day", 5, 1, -1), fixed("Juneteenth", 6, 19, US_SUB), fixed("Independence Day", 7, 4, US_SUB),
    nth("Labor Day", 9, 1, 1), nth("Columbus Day", 10, 1, 2), fixed("Veterans Day", 11, 11, US_SUB),
    nth("Thanksgiving", 11, 4, 4), fixed("Christmas Day", 12, 25, US_SUB),
  ],
  CA: [
    fixed("New Year's Day", 1, 1, UK_SUB), easter("Good Friday", -2), nth("Victoria Day", 5, 1, -2),
    fixed("Canada Day", 7, 1, UK_SUB), nth("Labour Day", 9, 1, 1), fixed("Truth and Reconciliation Day", 9, 30, UK_SUB),
    nth("Thanksgiving", 10, 1, 2), fixed("Remembrance Day", 11, 11), fixed("Christmas Day", 12, 25, UK_SUB), fixed("Boxing Day", 12, 26, UK_SUB),
  ],
  MX: [
    fixed("Año Nuevo", 1, 1), nth("Día de la Constitución", 2, 1, 1), nth("Natalicio de Benito Juárez", 3, 1, 3),
    fixed("Día del Trabajo", 5, 1), fixed("Día de la Independencia", 9, 16), nth("Día de la Revolución", 11, 1, 3), fixed("Navidad", 12, 25),
  ],
  BR: [
    fixed("Confraternização Universal", 1, 1), easter("Carnaval", -48), easter("Carnaval", -47), easter("Sexta-feira Santa", -2),
    fixed("Tiradentes", 4, 21), fixed("Dia do Trabalhador", 5, 1), easter("Corpus Christi", 60), fixed("Independência", 9, 7),
    fixed("Nossa Senhora Aparecida", 10, 12), fixed("Finados", 11, 2), fixed("Proclamação da República", 11, 15),
    fixed("Consciência Negra", 11, 20), fixed("Natal", 12, 25),
  ],
  AR: [
    fixed("Año Nuevo", 1, 1), easter("Carnaval", -48), easter("Carnaval", -47), fixed("Día de la Memoria", 3, 24),
    easter("Viernes Santo", -2), fixed("Día del Veterano", 4, 2), fixed("Día del Trabajador", 5, 1), fixed("Revolución de Mayo", 5, 25),
    fixed("Güemes", 6, 17), fixed("Belgrano", 6, 20), fixed("Independencia", 7, 9), fixed("San Martín", 8, 17),
    fixed("Diversidad Cultural", 10, 12), fixed("Soberanía Nacional", 11, 20), fixed("Inmaculada Concepción", 12, 8), fixed("Navidad", 12, 25),
  ],
  CO: [
    fixed("Año Nuevo", 1, 1), fixed("Reyes Magos", 1, 6, UK_SUB), fixed("San José", 3, 19, UK_SUB), easter("Jueves Santo", -3), easter("Viernes Santo", -2),
    fixed("Día del Trabajo", 5, 1), easter("Ascensión", 43), easter("Corpus Christi", 64), easter("Sagrado Corazón", 71),
    fixed("San Pedro y San Pablo", 6, 29, UK_SUB), fixed("Independencia", 7, 20), fixed("Batalla de Boyacá", 8, 7),
    fixed("Asunción", 8, 15, UK_SUB), fixed("Día de la Raza", 10, 12, UK_SUB), fixed("Todos los Santos", 11, 1, UK_SUB),
    fixed("Independencia de Cartagena", 11, 11, UK_SUB), fixed("Inmaculada Concepción", 12, 8), fixed("Navidad", 12, 25),
  ],
  CL: [
    fixed("Año Nuevo", 1, 1), easter("Viernes Santo", -2), fixed("Día del Trabajo", 5, 1), fixed("Glorias Navales", 5, 21),
    fixed("San Pedro y San Pablo", 6, 29), fixed("Virgen del Carmen", 7, 16), fixed("Asunción", 8, 15), fixed("Independencia", 9, 18),
    fixed("Glorias del Ejército", 9, 19), fixed("Encuentro de Dos Mundos", 10, 12), fixed("Todos los Santos", 11, 1),
    fixed("Inmaculada Concepción", 12, 8), fixed("Navidad", 12, 25),
  ],
  PE: [
    fixed("Año Nuevo", 1, 1), easter("Jueves Santo", -3), easter("Viernes Santo", -2), fixed("Día del Trabajo", 5, 1),
    fixed("San Pedro y San Pablo", 6, 29), fixed("Fiestas Patrias", 7, 28), fixed("Fiestas Patrias", 7, 29), fixed("Santa Rosa de Lima", 8, 30),
    fixed("Combate de Angamos", 10, 8), fixed("Todos los Santos", 11, 1), fixed("Inmaculada Concepción", 12, 8), fixed("Navidad", 12, 25),
  ],
  GB: [
    fixed("New Year's Day", 1, 1, UK_SUB), easter("Good Friday", -2), easter("Easter Monday", 1), nth("Early May Bank Holiday", 5, 1, 1),
    nth("Spring Bank Holiday", 5, 1, -1), nth("Summer Bank Holiday", 8, 1, -1), fixed("Christmas Day", 12, 25, UK_SUB), fixed("Boxing Day", 12, 26, UK_SUB),
  ],
  IE: [
    fixed("New Year's Day", 1, 1, UK_SUB), nth("St Brigid's Day", 2, 1, 1), fixed("St Patrick's Day", 3, 17, UK_SUB), easter("Easter Monday", 1),
    nth("May Bank Holiday", 5, 1, 1), nth("June Bank Holiday", 6, 1, 1), nth("August Bank Holiday", 8, 1, 1), nth("October Bank Holiday", 10, 1, -1),
    fixed("Christmas Day", 12, 25, UK_SUB), fixed("St Stephen's Day", 12, 26, UK_SUB),
  ],
  DE: [
    ...WESTERN_EUROPE_COMMON, easter("Karfreitag", -2), fixed("Tag der Arbeit", 5, 1), easter("Christi Himmelfahrt", 39),
    easter("Pfingstmontag", 50), fixed("Tag der Deutschen Einheit", 10, 3), fixed("Zweiter Weihnachtstag", 12, 26),
  ],
  AT: [
    ...WESTERN_EUROPE_COMMON, fixed("Heilige Drei Könige", 1, 6), fixed("Staatsfeiertag", 5, 1), easter("Christi Himmelfahrt", 39),
    easter("Pfingstmontag", 50), easter("Fronleichnam", 60), fixed("Mariä Himmelfahrt", 8, 15), fixed("Nationalfeiertag", 10, 26),
    fixed("Allerheiligen", 11, 1), fixed("Mariä Empfängnis", 12, 8), fixed("Stefanitag", 12, 26),
  ],
  CH: [
    fixed("Neujahr", 1, 1), easter("Karfreitag", -2), easter("Ostermontag", 1), easter("Auffahrt", 39), easter("Pfingstmontag", 50),
    fixed("Bundesfeier", 8, 1), fixed("Weihnachten", 12, 25), fixed("Stephanstag", 12, 26),
  ],
  FR: [
    ...WESTERN_EUROPE_COMMON, fixed("Fête du Travail", 5, 1), fixed("Victoire 1945", 5, 8), easter("Ascension", 39), easter("Lundi de Pentecôte", 50),
    fixed("Fête Nationale", 7, 14), fixed("Assomption", 8, 15), fixed("Toussaint", 11, 1), fixed("Armistice", 11, 11),
  ],
  BE: [
    ...WESTERN_EUROPE_COMMON, fixed("Fête du Travail", 5, 1), easter("Ascension", 39), easter("Lundi de Pentecôte", 50), fixed("Fête Nationale", 7, 21),
    fixed("Assomption", 8, 15), fixed("Toussaint", 11, 1), fixed("Armistice", 11, 11),
  ],
  NL: [
    ...WESTERN_EUROPE_COMMON, easter("Goede Vrijdag", -2), fixed("Koningsdag", 4, 27), fixed("Bevrijdingsdag", 5, 5), easter("Hemelvaartsdag", 39),
    easter("Tweede Pinksterdag", 50), fixed("Tweede Kerstdag", 12, 26),
  ],
  LU: [...WESTERN_EUROPE_COMMON, fixed("Fête du Travail", 5, 1), fixed("Journée de l'Europe", 5, 9), easter("Ascension", 39), easter("Lundi de Pentecôte", 50), fixed("Fête Nationale", 6, 23), fixed("Assomption", 8, 15), fixed("Toussaint", 11, 1), fixed("Saint-Étienne", 12, 26)],
  ES: [
    fixed("Año Nuevo", 1, 1), fixed("Epifanía", 1, 6), easter("Viernes Santo", -2), fixed("Día del Trabajador", 5, 1), fixed("Asunción", 8, 15),
    fixed("Fiesta Nacional", 10, 12), fixed("Todos los Santos", 11, 1), fixed("Día de la Constitución", 12, 6), fixed("Inmaculada Concepción", 12, 8), fixed("Navidad", 12, 25),
  ],
  PT: [
    fixed("Ano Novo", 1, 1), easter("Sexta-feira Santa", -2), fixed("Dia da Liberdade", 4, 25), fixed("Dia do Trabalhador", 5, 1), easter("Corpo de Deus", 60),
    fixed("Dia de Portugal", 6, 10), fixed("Assunção", 8, 15), fixed("Implantação da República", 10, 5), fixed("Todos os Santos", 11, 1),
    fixed("Restauração da Independência", 12, 1), fixed("Imaculada Conceição", 12, 8), fixed("Natal", 12, 25),
  ],
  IT: [
    fixed("Capodanno", 1, 1), fixed("Epifania", 1, 6), easter("Lunedì dell'Angelo", 1), fixed("Festa della Liberazione", 4, 25), fixed("Festa del Lavoro", 5, 1),
    fixed("Festa della Repubblica", 6, 2), fixed("Ferragosto", 8, 15), fixed("Ognissanti", 11, 1), fixed("Immacolata", 12, 8), fixed("Natale", 12, 25), fixed("Santo Stefano", 12, 26),
  ],
  GR: [
    fixed("Πρωτοχρονιά", 1, 1), fixed("Θεοφάνεια", 1, 6), fixed("25η Μαρτίου", 3, 25), fixed("Εργατική Πρωτομαγιά", 5, 1),
    fixed("Κοίμηση της Θεοτόκου", 8, 15), fixed("Επέτειος του Όχι", 10, 28), fixed("Χριστούγεννα", 12, 25), fixed("Σύναξη Θεοτόκου", 12, 26),
  ],
  SE: [
    fixed("Nyårsdagen", 1, 1), fixed("Trettondedag jul", 1, 6), easter("Långfredagen", -2), easter("Annandag påsk", 1), fixed("Första maj", 5, 1),
    easter("Kristi himmelsfärdsdag", 39), fixed("Nationaldagen", 6, 6), fixed("Julafton", 12, 24), fixed("Juldagen", 12, 25), fixed("Annandag jul", 12, 26), fixed("Nyårsafton", 12, 31),
  ],
  NO: [
    fixed("Nyttårsdag", 1, 1), easter("Skjærtorsdag", -3), easter("Langfredag", -2), easter("Andre påskedag", 1), fixed("Arbeidernes dag", 5, 1),
    fixed("Grunnlovsdag", 5, 17), easter("Kristi himmelfartsdag", 39), easter("Andre pinsedag", 50), fixed("Første juledag", 12, 25), fixed("Andre juledag", 12, 26),
  ],
  DK: [
    fixed("Nytårsdag", 1, 1), easter("Skærtorsdag", -3), easter("Langfredag", -2), easter("2. påskedag", 1), easter("Kristi himmelfartsdag", 39),
    easter("2. pinsedag", 50), fixed("Juledag", 12, 25), fixed("2. juledag", 12, 26),
  ],
  FI: [
    fixed("Uudenvuodenpäivä", 1, 1), fixed("Loppiainen", 1, 6), easter("Pitkäperjantai", -2), easter("2. pääsiäispäivä", 1), fixed("Vappu", 5, 1),
    easter("Helatorstai", 39), fixed("Itsenäisyyspäivä", 12, 6), fixed("Jouluaatto", 12, 24), fixed("Joulupäivä", 12, 25), fixed("Tapaninpäivä", 12, 26),
  ],
  PL: [
    fixed("Nowy Rok", 1, 1), fixed("Trzech Króli", 1, 6), easter("Poniedziałek Wielkanocny", 1), fixed("Święto Pracy", 5, 1), fixed("Święto Konstytucji", 5, 3),
    easter("Boże Ciało", 60), fixed("Wniebowzięcie", 8, 15), fixed("Wszystkich Świętych", 11, 1), fixed("Święto Niepodległości", 11, 11),
    fixed("Wigilia", 12, 24), fixed("Boże Narodzenie", 12, 25), fixed("Boże Narodzenie", 12, 26),
  ],
  CZ: [
    fixed("Nový rok", 1, 1), easter("Velký pátek", -2), easter("Velikonoční pondělí", 1), fixed("Svátek práce", 5, 1), fixed("Den vítězství", 5, 8),
    fixed("Cyril a Metoděj", 7, 5), fixed("Jan Hus", 7, 6), fixed("Den české státnosti", 9, 28), fixed("Vznik Československa", 10, 28),
    fixed("Den boje za svobodu", 11, 17), fixed("Štědrý den", 12, 24), fixed("1. svátek vánoční", 12, 25), fixed("2. svátek vánoční", 12, 26),
  ],
  HU: [fixed("Újév", 1, 1), fixed("Nemzeti ünnep", 3, 15), easter("Nagypéntek", -2), easter("Húsvéthétfő", 1), fixed("A munka ünnepe", 5, 1), easter("Pünkösdhétfő", 50), fixed("Államalapítás", 8, 20), fixed("Nemzeti ünnep", 10, 23), fixed("Mindenszentek", 11, 1), fixed("Karácsony", 12, 25), fixed("Karácsony", 12, 26)],
  RO: [fixed("Anul Nou", 1, 1), fixed("Anul Nou", 1, 2), fixed("Unirea Principatelor", 1, 24), fixed("Ziua Muncii", 5, 1), fixed("Ziua Copilului", 6, 1), fixed("Adormirea Maicii Domnului", 8, 15), fixed("Sfântul Andrei", 11, 30), fixed("Ziua Națională", 12, 1), fixed("Crăciunul", 12, 25), fixed("Crăciunul", 12, 26)],
  UA: [fixed("Новий рік", 1, 1), fixed("Міжнародний жіночий день", 3, 8), fixed("День праці", 5, 1), fixed("День пам'яті", 5, 8), fixed("День Конституції", 6, 28), fixed("День Державності", 7, 15), fixed("День Незалежності", 8, 24), fixed("День захисників", 10, 1), fixed("Різдво", 12, 25)],
  RU: [fixed("Новый год", 1, 1), fixed("Новогодние каникулы", 1, 2), fixed("Новогодние каникулы", 1, 3), fixed("Новогодние каникулы", 1, 4), fixed("Новогодние каникулы", 1, 5), fixed("Новогодние каникулы", 1, 6), fixed("Рождество", 1, 7), fixed("Новогодние каникулы", 1, 8), fixed("День защитника Отечества", 2, 23), fixed("Международный женский день", 3, 8), fixed("Праздник Весны и Труда", 5, 1), fixed("День Победы", 5, 9), fixed("День России", 6, 12), fixed("День народного единства", 11, 4)],
  TR: [fixed("Yılbaşı", 1, 1), fixed("Ulusal Egemenlik ve Çocuk Bayramı", 4, 23), fixed("Emek ve Dayanışma Günü", 5, 1), fixed("Atatürk'ü Anma", 5, 19), fixed("Demokrasi ve Millî Birlik Günü", 7, 15), fixed("Zafer Bayramı", 8, 30), fixed("Cumhuriyet Bayramı", 10, 29)],
  IL: [fixed("Yom HaAtzmaut (approx.)", 5, 14)],
  AE: [fixed("New Year's Day", 1, 1), fixed("Commemoration Day", 12, 1), fixed("National Day", 12, 2), fixed("National Day", 12, 3)],
  SA: [fixed("Founding Day", 2, 22), fixed("National Day", 9, 23)],
  QA: [fixed("National Sports Day", 2, 1), fixed("National Day", 12, 18)],
  EG: [fixed("Coptic Christmas", 1, 7), fixed("Revolution Day", 1, 25), fixed("Sinai Liberation Day", 4, 25), fixed("Labour Day", 5, 1), fixed("June 30 Revolution", 6, 30), fixed("Revolution Day", 7, 23), fixed("Armed Forces Day", 10, 6)],
  ZA: [fixed("New Year's Day", 1, 1, UK_SUB), fixed("Human Rights Day", 3, 21, UK_SUB), easter("Good Friday", -2), easter("Family Day", 1), fixed("Freedom Day", 4, 27, UK_SUB), fixed("Workers' Day", 5, 1, UK_SUB), fixed("Youth Day", 6, 16, UK_SUB), fixed("National Women's Day", 8, 9, UK_SUB), fixed("Heritage Day", 9, 24, UK_SUB), fixed("Day of Reconciliation", 12, 16, UK_SUB), fixed("Christmas Day", 12, 25, UK_SUB), fixed("Day of Goodwill", 12, 26, UK_SUB)],
  NG: [fixed("New Year's Day", 1, 1), easter("Good Friday", -2), easter("Easter Monday", 1), fixed("Workers' Day", 5, 1), fixed("Democracy Day", 6, 12), fixed("Independence Day", 10, 1), fixed("Christmas Day", 12, 25), fixed("Boxing Day", 12, 26)],
  KE: [fixed("New Year's Day", 1, 1, UK_SUB), easter("Good Friday", -2), easter("Easter Monday", 1), fixed("Labour Day", 5, 1, UK_SUB), fixed("Madaraka Day", 6, 1, UK_SUB), fixed("Mazingira Day", 10, 10, UK_SUB), fixed("Mashujaa Day", 10, 20, UK_SUB), fixed("Jamhuri Day", 12, 12, UK_SUB), fixed("Christmas Day", 12, 25, UK_SUB), fixed("Boxing Day", 12, 26, UK_SUB)],
  GH: [fixed("New Year's Day", 1, 1), fixed("Constitution Day", 1, 7), fixed("Independence Day", 3, 6), easter("Good Friday", -2), easter("Easter Monday", 1), fixed("May Day", 5, 1), fixed("Founders' Day", 8, 4), fixed("Kwame Nkrumah Memorial Day", 9, 21), fixed("Farmers' Day", 12, 6), fixed("Christmas Day", 12, 25), fixed("Boxing Day", 12, 26)],
  IN: [fixed("Republic Day", 1, 26), fixed("Independence Day", 8, 15), fixed("Gandhi Jayanti", 10, 2), fixed("Christmas Day", 12, 25)],
  PK: [fixed("Kashmir Day", 2, 5), fixed("Pakistan Day", 3, 23), fixed("Labour Day", 5, 1), fixed("Independence Day", 8, 14), fixed("Iqbal Day", 11, 9), fixed("Quaid-e-Azam Day", 12, 25)],
  BD: [fixed("Language Martyrs' Day", 2, 21), fixed("Sheikh Mujib's Birthday", 3, 17), fixed("Independence Day", 3, 26), fixed("Bengali New Year", 4, 14), fixed("May Day", 5, 1), fixed("National Mourning Day", 8, 15), fixed("Victory Day", 12, 16), fixed("Christmas Day", 12, 25)],
  LK: [fixed("Tamil Thai Pongal", 1, 14), fixed("Independence Day", 2, 4), fixed("Sinhala & Tamil New Year", 4, 13), fixed("Sinhala & Tamil New Year", 4, 14), fixed("May Day", 5, 1), fixed("Christmas Day", 12, 25)],
  CN: [fixed("元旦", 1, 1), fixed("清明节", 4, 4), fixed("劳动节", 5, 1), fixed("劳动节", 5, 2), fixed("劳动节", 5, 3), fixed("国庆节", 10, 1), fixed("国庆节", 10, 2), fixed("国庆节", 10, 3), fixed("国庆节", 10, 4), fixed("国庆节", 10, 5), fixed("国庆节", 10, 6), fixed("国庆节", 10, 7)],
  HK: [fixed("New Year's Day", 1, 1), easter("Good Friday", -2), easter("Holy Saturday", -1), easter("Easter Monday", 1), fixed("Ching Ming", 4, 4), fixed("Labour Day", 5, 1), fixed("HKSAR Establishment Day", 7, 1), fixed("National Day", 10, 1), fixed("Christmas Day", 12, 25), fixed("Boxing Day", 12, 26)],
  TW: [fixed("元旦", 1, 1), fixed("和平紀念日", 2, 28), fixed("兒童節", 4, 4), fixed("清明節", 4, 5), fixed("國慶日", 10, 10)],
  JP: [
    fixed("元日", 1, 1), nth("成人の日", 1, 1, 2), fixed("建国記念の日", 2, 11), fixed("天皇誕生日", 2, 23), fixed("春分の日", 3, 20), fixed("昭和の日", 4, 29),
    fixed("憲法記念日", 5, 3), fixed("みどりの日", 5, 4), fixed("こどもの日", 5, 5), nth("海の日", 7, 1, 3), fixed("山の日", 8, 11), nth("敬老の日", 9, 1, 3),
    fixed("秋分の日", 9, 23), nth("スポーツの日", 10, 1, 2), fixed("文化の日", 11, 3), fixed("勤労感謝の日", 11, 23),
  ],
  KR: [fixed("신정", 1, 1), fixed("삼일절", 3, 1), fixed("어린이날", 5, 5), fixed("현충일", 6, 6), fixed("광복절", 8, 15), fixed("개천절", 10, 3), fixed("한글날", 10, 9), fixed("크리스마스", 12, 25)],
  SG: [fixed("New Year's Day", 1, 1, UK_SUB), easter("Good Friday", -2), fixed("Labour Day", 5, 1, UK_SUB), fixed("National Day", 8, 9, UK_SUB), fixed("Christmas Day", 12, 25, UK_SUB)],
  MY: [fixed("New Year's Day", 1, 1), fixed("Federal Territory Day", 2, 1), fixed("Labour Day", 5, 1), fixed("Agong's Birthday", 6, 2), fixed("National Day", 8, 31), fixed("Malaysia Day", 9, 16), fixed("Christmas Day", 12, 25)],
  TH: [fixed("New Year's Day", 1, 1), fixed("Chakri Day", 4, 6), fixed("Songkran", 4, 13), fixed("Songkran", 4, 14), fixed("Songkran", 4, 15), fixed("Labour Day", 5, 1), fixed("Coronation Day", 5, 4), fixed("Queen's Birthday", 6, 3), fixed("King's Birthday", 7, 28), fixed("Mother's Day", 8, 12), fixed("King Bhumibol Memorial Day", 10, 13), fixed("Chulalongkorn Day", 10, 23), fixed("Father's Day", 12, 5), fixed("Constitution Day", 12, 10), fixed("New Year's Eve", 12, 31)],
  VN: [fixed("Tết Dương lịch", 1, 1), fixed("Giải phóng miền Nam", 4, 30), fixed("Quốc tế Lao động", 5, 1), fixed("Quốc khánh", 9, 2)],
  PH: [fixed("New Year's Day", 1, 1), easter("Maundy Thursday", -3), easter("Good Friday", -2), fixed("Araw ng Kagitingan", 4, 9), fixed("Labor Day", 5, 1), fixed("Independence Day", 6, 12), nth("National Heroes Day", 8, 1, -1), fixed("Bonifacio Day", 11, 30), fixed("Christmas Day", 12, 25), fixed("Rizal Day", 12, 30)],
  ID: [fixed("Tahun Baru", 1, 1), easter("Wafat Isa Almasih", -2), fixed("Hari Buruh", 5, 1), easter("Kenaikan Isa Almasih", 39), fixed("Hari Lahir Pancasila", 6, 1), fixed("Hari Kemerdekaan", 8, 17), fixed("Hari Natal", 12, 25)],
  AU: [
    fixed("New Year's Day", 1, 1, UK_SUB), fixed("Australia Day", 1, 26, UK_SUB), easter("Good Friday", -2), easter("Easter Monday", 1),
    fixed("Anzac Day", 4, 25), nth("King's Birthday", 6, 1, 2), fixed("Christmas Day", 12, 25, UK_SUB), fixed("Boxing Day", 12, 26, UK_SUB),
  ],
  NZ: [
    fixed("New Year's Day", 1, 1, UK_SUB), fixed("Day after New Year's Day", 1, 2, UK_SUB), fixed("Waitangi Day", 2, 6, UK_SUB), easter("Good Friday", -2),
    easter("Easter Monday", 1), fixed("Anzac Day", 4, 25, UK_SUB), nth("King's Birthday", 6, 1, 1), nth("Labour Day", 10, 1, 4),
    fixed("Christmas Day", 12, 25, UK_SUB), fixed("Boxing Day", 12, 26, UK_SUB),
  ],
};

export const SUPPORTED_COUNTRIES = Object.keys(RULES);

/** Western (Gregorian) Easter Sunday, Anonymous Gregorian algorithm. */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const shift = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  if (n > 0) {
    const first = utc(year, month, 1);
    const delta = (weekday - first.getUTCDay() + 7) % 7;
    return shift(first, delta + (n - 1) * 7);
  }
  const last = utc(year, month + 1, 0);
  const delta = (last.getUTCDay() - weekday + 7) % 7;
  return shift(last, -delta + (n + 1) * 7);
}

function substitute(date: Date, sub: Substitution | undefined, taken: Set<number>): Date {
  if (!sub) return date;
  const dow = date.getUTCDay();
  let observed = date;
  if (sub === "us") {
    if (dow === 6) observed = shift(date, -1);
    else if (dow === 0) observed = shift(date, 1);
  } else {
    while (observed.getUTCDay() === 0 || observed.getUTCDay() === 6 || taken.has(observed.getTime())) observed = shift(observed, 1);
  }
  return observed;
}

const cache = new Map<string, Holiday[]>();

export function holidaysInYear(country: string, year: number): Holiday[] {
  const key = `${country}:${year}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const rules = RULES[country] ?? [];
  const easterDate = easterSunday(year);
  const taken = new Set<number>();
  const list: Holiday[] = [];
  for (const rule of rules) {
    let date: Date;
    if ("easter" in rule) date = shift(easterDate, rule.easter);
    else if ("weekday" in rule) date = nthWeekday(year, rule.m, rule.weekday, rule.n);
    else date = substitute(utc(year, rule.m, rule.d), rule.sub, taken);
    taken.add(date.getTime());
    list.push({ name: rule.name, date });
  }
  list.sort((a, b) => a.date.getTime() - b.date.getTime());
  cache.set(key, list);
  return list;
}

/** Holiday names on a given calendar date (year, month 1–12, day) in `country`. */
export function holidaysOn(country: string, year: number, month: number, day: number): string[] {
  const target = Date.UTC(year, month - 1, day);
  return holidaysInYear(country, year)
    .filter((h) => h.date.getTime() === target)
    .map((h) => h.name);
}
