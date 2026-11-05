import { useEffect, useState } from "react";
import { useAppState, type ModuleId } from "./store";
import { applyTheme, themeKey } from "./theme";
import { Icon } from "./ui/kit";
import { EventSheet, TodoSheet, type EventDraft, type TodoDraft } from "./ui/sheets";
import { Board } from "./screens/Board";
import { Calendar } from "./screens/Calendar";
import { Budget, Groceries, Meals, Todos } from "./screens/Lists";
import { Settings } from "./screens/Settings";
import { Onboarding } from "./screens/Onboarding";

export type Tab = "board" | ModuleId | "settings";
const TABS: { id: Tab; label: string }[] = [
  { id: "board", label: "Board" }, { id: "calendar", label: "Calendar" }, { id: "todos", label: "To-dos" },
  { id: "meals", label: "Meals" }, { id: "groceries", label: "Groceries" }, { id: "budget", label: "Budget" }, { id: "settings", label: "Settings" },
];

// "settings" is spelled "setup" in the URL so it never clashes with host pages that reserve #settings.
const toHash = (t: Tab) => (t === "settings" ? "setup" : t);
const readHash = (): Tab => { const h = location.hash.slice(1); return ((h === "setup" ? "settings" : h) as Tab) || "board"; };

export default function App() {
  const s = useAppState();
  const [tab, setTab] = useState<Tab>(readHash);
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [ev, setEv] = useState<EventDraft | null>(null);
  const [td, setTd] = useState<TodoDraft | null>(null);

  const tabs = TABS.filter((t) => t.id === "board" || t.id === "settings" || s.settings.modules[t.id as ModuleId]);
  const active = tabs.some((t) => t.id === tab) ? tab : "board";
  const go = (t: Tab) => { location.hash = toHash(t); setTab(t); window.scrollTo(0, 0); };

  useEffect(() => { const f = () => setTab(readHash()); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  // Calendar wears the theme of the month you're looking at; everything else follows the setting.
  useEffect(() => { applyTheme(themeKey(s.settings.theme, active === "calendar" ? month : undefined)); }, [s.settings.theme, active, month]);

  if (!s.onboarded) return <Onboarding />;

  return (
    <>
      <header className="top">
        <div className="brand"><img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={30} height={30} /><div><small>homeboard</small><h1>{s.settings.household}</h1></div></div>
        <nav className="tabs" aria-label="Sections">
          {tabs.map((t) => <button key={t.id} type="button" className="tab" aria-current={active === t.id ? "page" : undefined} onClick={() => go(t.id)}>{t.label}</button>)}
        </nav>
      </header>
      <main className="wrap">
        {active === "board" && <Board go={go} newEvent={setEv} newTodo={setTd} />}
        {active === "calendar" && <Calendar month={month} setMonth={setMonth} newEvent={setEv} />}
        {active === "todos" && <Todos newTodo={setTd} />}
        {active === "meals" && <Meals />}
        {active === "groceries" && <Groceries />}
        {active === "budget" && <Budget />}
        {active === "settings" && <Settings />}
      </main>
      <nav className="tabbar" aria-label="Sections" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))` }}>
        {tabs.map((t) => <button key={t.id} type="button" className="tab" aria-current={active === t.id ? "page" : undefined} onClick={() => go(t.id)}>{Icon[t.id]}<span>{t.label}</span></button>)}
      </nav>
      <EventSheet draft={ev} people={s.settings.people} onClose={() => setEv(null)} />
      <TodoSheet draft={td} people={s.settings.people} onClose={() => setTd(null)} />
    </>
  );
}
