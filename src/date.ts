// Small date helpers. All dates are local "YYYY-MM-DD" strings.

export const pad = (n: number) => String(n).padStart(2, "0");
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const today = () => iso(new Date());
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const weekStart = (d: Date) => addDays(d, -d.getDay());
export const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
export type MonthKey = (typeof MONTH_KEYS)[number];
export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function fmtTime(t?: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "pm" : "am";
  const hh = h % 12 || 12;
  return m ? `${hh}:${pad(m)}${ap}` : `${hh}${ap}`;
}

export function relDay(ds: string) {
  const t = today();
  if (ds === t) return "Today";
  if (ds === iso(addDays(new Date(), 1))) return "Tomorrow";
  if (ds === iso(addDays(new Date(), -1))) return "Yesterday";
  return parse(ds).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/** US holidays and fun days, computed for any year. */
const cache: Record<number, Record<string, { name: string; emoji: string }[]>> = {};
export function holidays(y: number) {
  if (cache[y]) return cache[y];
  const out: Record<string, { name: string; emoji: string }[]> = {};
  const put = (m: number, d: number, name: string, emoji: string) => {
    const k = iso(new Date(y, m, d));
    (out[k] ||= []).push({ name, emoji });
  };
  const nth = (m: number, dow: number, n: number) => 1 + ((dow - new Date(y, m, 1).getDay() + 7) % 7) + (n - 1) * 7;
  const last = (m: number, dow: number) => {
    const l = new Date(y, m + 1, 0);
    return l.getDate() - ((l.getDay() - dow + 7) % 7);
  };
  // Easter (anonymous Gregorian algorithm)
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7, mm = Math.floor((a + 11 * h + 22 * l) / 451);
  const em = Math.floor((h + l - 7 * mm + 114) / 31) - 1, ed = ((h + l - 7 * mm + 114) % 31) + 1;
  put(0, 1, "New Year's Day", "🎆"); put(0, nth(0, 1, 3), "MLK Jr. Day", "✊");
  put(1, 14, "Valentine's Day", "💘"); put(1, nth(1, 1, 3), "Presidents' Day", "🇺🇸");
  put(2, 17, "St. Patrick's Day", "☘️"); put(em, ed, "Easter", "🐣");
  put(4, nth(4, 0, 2), "Mother's Day", "💐"); put(4, last(4, 1), "Memorial Day", "🇺🇸");
  put(5, nth(5, 0, 3), "Father's Day", "👔"); put(5, 19, "Juneteenth", "✊"); put(6, 4, "Independence Day", "🎇");
  put(8, nth(8, 1, 1), "Labor Day", "🛠️"); put(9, 31, "Halloween", "🎃"); put(10, 11, "Veterans Day", "🎖️");
  put(10, nth(10, 4, 4), "Thanksgiving", "🦃");
  put(11, 24, "Christmas Eve", "🎄"); put(11, 25, "Christmas", "🎁"); put(11, 31, "New Year's Eve", "🥂");
  return (cache[y] = out);
}
export const holidaysOn = (ds: string) => holidays(+ds.slice(0, 4))[ds] || [];
