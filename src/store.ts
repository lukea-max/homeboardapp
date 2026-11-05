import { useSyncExternalStore } from "react";
import { addDays, iso, today } from "./date";

/* ---------- types ---------- */
export type ModuleId = "calendar" | "todos" | "meals" | "groceries" | "budget";
export type WidgetId = "today" | "agenda" | "week" | "todos" | "meals" | "groceries" | "budget";
export type Repeat = "none" | "weekly" | "monthly" | "yearly";
export type Slot = "breakfast" | "lunch" | "dinner";

export interface Person { id: string; name: string; color: string }
export interface CalEvent { id: string; title: string; date: string; start?: string; end?: string; who: string; repeat: Repeat; note?: string }
export interface Todo { id: string; title: string; date?: string; who: string; done: boolean; note?: string; created: number }
export interface Meal { id: string; date: string; slot: Slot; name: string }
export interface Grocery { id: string; name: string; done: boolean }
export interface Expense { id: string; date: string; label: string; amount: number; category: string }

export interface Settings {
  household: string;
  people: Person[];
  modules: Record<ModuleId, boolean>;
  widgets: { id: WidgetId; on: boolean }[];
  theme: string; // "seasonal" or a month key
  mealSlots: Slot[];
  weeklyBudget: number | null;
}

export interface State {
  schema?: number;
  onboarded: boolean;
  settings: Settings;
  events: CalEvent[];
  todos: Todo[];
  meals: Meal[];
  groceries: Grocery[];
  expenses: Expense[];
}

/** "all" means everyone in the household. */
export const EVERYONE = "all";

export const MODULE_LABEL: Record<ModuleId, string> = {
  calendar: "Calendar", todos: "To-dos", meals: "Meals", groceries: "Groceries", budget: "Budget",
};
export const WIDGET_LABEL: Record<WidgetId, string> = {
  today: "Today", agenda: "Today's plan", week: "This week", todos: "To-dos", meals: "Meals", groceries: "Groceries", budget: "Budget",
};
/** Which module a widget belongs to (hidden when its module is off). */
export const WIDGET_MODULE: Record<WidgetId, ModuleId | null> = {
  today: null, agenda: "calendar", week: "calendar", todos: "todos", meals: "meals", groceries: "groceries", budget: "budget",
};
export const BUDGET_CATEGORIES = ["Groceries", "Dining out", "Shopping", "Transport", "Bills", "Fun", "Other"];

/* ---------- defaults ---------- */
export const DEFAULT_MODULES: Record<ModuleId, boolean> = { calendar: true, todos: true, meals: true, groceries: true, budget: false };
export const DEFAULT_WIDGETS: WidgetId[] = ["today", "agenda", "week", "todos", "meals", "groceries", "budget"];

const uid = () => Math.random().toString(36).slice(2, 10);
const COLORS = ["sky", "pink", "lime", "sun", "lilac", "coral"];

export function makePerson(name: string, index: number): Person {
  return { id: uid(), name, color: COLORS[index % COLORS.length] };
}

export function makeSettings(names: string[], household: string, modules: Record<ModuleId, boolean> = DEFAULT_MODULES): Settings {
  return {
    household,
    people: names.map((name, i) => makePerson(name, i)),
    modules: { ...modules },
    widgets: DEFAULT_WIDGETS.map((id) => ({ id, on: id === "budget" ? modules.budget : true })),
    theme: "seasonal",
    mealSlots: ["breakfast", "lunch", "dinner"],
    weeklyBudget: null,
  };
}

const fresh = (): State => ({
  schema: 2,
  onboarded: false,
  settings: makeSettings(["You"], "My Home"),
  events: [], todos: [], meals: [], groceries: [], expenses: [],
});

/* ---------- persistence (local-first; swap for Supabase later) ---------- */
const KEY = "homeboard:v1";
function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<State>;
      const st = { ...fresh(), ...saved } as State;
      // v2: the meal plan shows breakfast, lunch and dinner by default (boards made earlier had dinner only).
      if ((saved.schema ?? 1) < 2) {
        if (st.settings.mealSlots.join() === "dinner") st.settings = { ...st.settings, mealSlots: ["breakfast", "lunch", "dinner"] };
        st.schema = 2;
      }
      return st;
    }
  } catch { /* storage unavailable: start fresh */ }
  return fresh();
}
let state: State = load();
const subs = new Set<() => void>();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}
function set(fn: (s: State) => State) {
  state = fn(state);
  save();
  subs.forEach((f) => f());
}
const subscribe = (cb: () => void) => { subs.add(cb); return () => { subs.delete(cb); }; };
/** The whole app state; re-renders when anything changes (fine at household scale). */
export function useAppState(): State {
  return useSyncExternalStore(subscribe, () => state);
}
export const getState = () => state;

/* ---------- actions ---------- */
export const actions = {
  finishOnboarding(settings: Settings, withSample: boolean) {
    set(() => ({ ...fresh(), onboarded: true, settings, ...(withSample ? sampleData(settings) : {}) }));
  },
  updateSettings(patch: Partial<Settings>) {
    set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
  saveEvent(e: Omit<CalEvent, "id"> & { id?: string }) {
    set((s) => {
      const ev = { ...e, id: e.id || uid() } as CalEvent;
      return { ...s, events: e.id ? s.events.map((x) => (x.id === e.id ? ev : x)) : [...s.events, ev] };
    });
  },
  deleteEvent(id: string) { set((s) => ({ ...s, events: s.events.filter((x) => x.id !== id) })); },
  saveTodo(t: Omit<Todo, "id" | "created" | "done"> & { id?: string; done?: boolean }) {
    set((s) => {
      if (t.id) return { ...s, todos: s.todos.map((x) => (x.id === t.id ? { ...x, ...t } as Todo : x)) };
      return { ...s, todos: [...s.todos, { ...t, id: uid(), done: false, created: Date.now() }] };
    });
  },
  toggleTodo(id: string) { set((s) => ({ ...s, todos: s.todos.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) })); },
  deleteTodo(id: string) { set((s) => ({ ...s, todos: s.todos.filter((x) => x.id !== id) })); },
  setMeal(date: string, slot: Slot, name: string) {
    set((s) => {
      const id = `${date}-${slot}`;
      const rest = s.meals.filter((m) => m.id !== id);
      return { ...s, meals: name.trim() ? [...rest, { id, date, slot, name: name.trim() }] : rest };
    });
  },
  addGrocery(name: string) {
    const n = name.trim();
    if (!n) return;
    set((s) => s.groceries.some((g) => !g.done && g.name.toLowerCase() === n.toLowerCase()) ? s : { ...s, groceries: [...s.groceries, { id: uid(), name: n, done: false }] });
  },
  toggleGrocery(id: string) { set((s) => ({ ...s, groceries: s.groceries.map((g) => (g.id === id ? { ...g, done: !g.done } : g)) })); },
  deleteGrocery(id: string) { set((s) => ({ ...s, groceries: s.groceries.filter((g) => g.id !== id) })); },
  clearCheckedGroceries() { set((s) => ({ ...s, groceries: s.groceries.filter((g) => !g.done) })); },
  addExpense(e: Omit<Expense, "id">) { set((s) => ({ ...s, expenses: [...s.expenses, { ...e, id: uid() }] })); },
  deleteExpense(id: string) { set((s) => ({ ...s, expenses: s.expenses.filter((x) => x.id !== id) })); },
  resetAll() { set(() => fresh()); },
};

/* ---------- queries ---------- */
export function occursOn(e: CalEvent, ds: string) {
  if (e.date === ds) return true;
  if (e.repeat === "none" || ds < e.date) return false;
  const [y, m, d] = e.date.split("-");
  const [y2, m2, d2] = ds.split("-");
  if (e.repeat === "yearly") return m === m2 && d === d2;
  if (e.repeat === "monthly") return d === d2;
  const days = Math.round((new Date(+y2, +m2 - 1, +d2).getTime() - new Date(+y, +m - 1, +d).getTime()) / 864e5);
  return days % 7 === 0;
}
export const eventsOn = (s: State, ds: string) =>
  s.events.filter((e) => occursOn(e, ds)).sort((a, b) => (a.start || "99").localeCompare(b.start || "99"));
export const todosOn = (s: State, ds: string) => s.todos.filter((t) => t.date === ds);
export const mealOn = (s: State, ds: string, slot: Slot) => s.meals.find((m) => m.id === `${ds}-${slot}`);
export const personOf = (s: State, id: string) => s.settings.people.find((p) => p.id === id);

/* ---------- sample data (obviously fake) ---------- */
function sampleData(settings: Settings): Partial<State> {
  const [a, b] = settings.people;
  const d = (n: number) => iso(addDays(new Date(), n));
  const who = (p?: Person) => p?.id || EVERYONE;
  return {
    events: [
      { id: uid(), title: "Gym", date: d(0), start: "08:00", end: "09:00", who: who(a), repeat: "weekly" },
      { id: uid(), title: "Dentist", date: d(1), start: "15:30", who: who(b), repeat: "none" },
      { id: uid(), title: "Movie night", date: d(2), start: "19:00", who: EVERYONE, repeat: "none" },
      { id: uid(), title: "Farmers market", date: d(4), start: "10:00", who: EVERYONE, repeat: "none" },
    ],
    todos: [
      { id: uid(), title: "Pay the electric bill", date: d(0), who: who(a), done: false, created: 1 },
      { id: uid(), title: "Book a haircut", who: who(b), done: false, created: 2 },
      { id: uid(), title: "Water the plants", date: d(1), who: EVERYONE, done: false, created: 3 },
    ],
    meals: [
      { id: `${d(0)}-dinner`, date: d(0), slot: "dinner", name: "Taco bowls" },
      { id: `${d(1)}-dinner`, date: d(1), slot: "dinner", name: "Pasta night" },
      { id: `${d(2)}-dinner`, date: d(2), slot: "dinner", name: "Grilled chicken salad" },
    ],
    groceries: ["Eggs", "Tortillas", "Avocados", "Spinach", "Coffee"].map((name) => ({ id: uid(), name, done: false })),
    expenses: [
      { id: uid(), date: today(), label: "Grocery run", amount: 42.18, category: "Groceries" },
      { id: uid(), date: d(-1), label: "Coffee", amount: 6.5, category: "Dining out" },
    ],
  };
}
