import { MONTH_KEYS, type MonthKey } from "./date";

/** Monthly color-block poster palettes. mk = marker ink: "d" dark ink, "l" light ink. */
export const POSTER: Record<MonthKey, { name: string; base: string; letter: string; deep: string; mk: "d" | "l" }> = {
  jan: { name: "Fresh Start", base: "#E8868E", letter: "#F7CBBB", deep: "#5A1E26", mk: "d" },
  feb: { name: "Love Letter", base: "#1029E0", letter: "#BCD5E8", deep: "#0A1460", mk: "l" },
  mar: { name: "Clover", base: "#3F5F22", letter: "#E3F1A8", deep: "#1C2B0E", mk: "l" },
  apr: { name: "Rain Showers", base: "#4E8E9C", letter: "#ABD1D8", deep: "#0E2C33", mk: "d" },
  may: { name: "Poppy", base: "#E5693A", letter: "#F8CBB6", deep: "#4A1606", mk: "d" },
  jun: { name: "Sunshine", base: "#E9B43D", letter: "#F5E45F", deep: "#4A3305", mk: "d" },
  jul: { name: "Lime Pop", base: "#8DC05A", letter: "#E1F3A4", deep: "#22370F", mk: "d" },
  aug: { name: "Coastal", base: "#93AAC7", letter: "#DFEFF4", deep: "#1D2C40", mk: "d" },
  sep: { name: "Plum", base: "#5F4287", letter: "#D4B6E7", deep: "#2A1640", mk: "l" },
  oct: { name: "Spooky Season", base: "#D78A3A", letter: "#F6D9B9", deep: "#3F2208", mk: "d" },
  nov: { name: "Harbor", base: "#1E3A4A", letter: "#5AA1AE", deep: "#0B1B23", mk: "l" },
  dec: { name: "Holiday Glow", base: "#A8282B", letter: "#F0909A", deep: "#4A0A0C", mk: "l" },
};

/** Free plan themes; the rest are HomeBoard Plus. */
export const FREE_THEMES: MonthKey[] = ["nov", "apr", "oct"];

/** Marker colors people can pick. */
export const MARKERS = [
  { id: "sky", hex: "#4FC3F7", ink: "#11222c" },
  { id: "pink", hex: "#FF8BB8", ink: "#2c1120" },
  { id: "lime", hex: "#9BE36D", ink: "#15260c" },
  { id: "sun", hex: "#FFD54A", ink: "#2c2306" },
  { id: "lilac", hex: "#C9A7FF", ink: "#22113c" },
  { id: "coral", hex: "#FF9E7A", ink: "#3a1406" },
];
export const marker = (id: string) => MARKERS.find((m) => m.id === id) || MARKERS[0];

export function themeKey(setting: string, viewing?: Date): MonthKey {
  if (setting !== "seasonal" && setting in POSTER) return setting as MonthKey;
  return MONTH_KEYS[(viewing || new Date()).getMonth()];
}

/** Writes the palette as CSS variables on :root. */
export function applyTheme(key: MonthKey) {
  const P = POSTER[key];
  const L = P.mk === "l";
  const v: Record<string, string> = {
    "--bg": P.base,
    "--letter": P.letter,
    "--deep": P.deep,
    "--ink": L ? "#FFFBF4" : P.deep,
    "--muted": L ? "rgba(255,251,244,.72)" : `color-mix(in srgb, ${P.deep} 72%, ${P.base})`,
    "--line": L ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.55)",
    "--edge": L ? "rgba(255,255,255,.26)" : "rgba(255,255,255,.6)",
    "--glass": L ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.26)",
    "--screw": L ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.85)",
    "--danger": L ? "#FFD0D6" : "#7A0016",
    "--hl-alpha": L ? ".4" : ".6",
  };
  const root = document.documentElement;
  for (const [k, val] of Object.entries(v)) root.style.setProperty(k, val);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", P.base);
}
