import { useEffect, useRef, useState } from "react";
import { actions, EVERYONE, getState, type Repeat, type Slot, type State } from "../store";
import { addDays, DOW, fmtTime, iso, parse, today } from "../date";

/* ---------- what the assistant can propose ---------- */
interface Action { tool: string; input: Record<string, unknown> }
interface Msg { role: "user" | "assistant"; content: string; actions?: Action[]; applied?: boolean; error?: boolean }

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isTime = (v: unknown) => typeof v === "string" && /^\d{2}:\d{2}$/.test(v);

function whoId(s: State, name: unknown) {
  const n = str(name).toLowerCase();
  if (!n || n === "everyone" || n === "both" || n === "all") return EVERYONE;
  return s.settings.people.find((p) => p.name.toLowerCase() === n)?.id
    || s.settings.people.find((p) => p.name.toLowerCase().startsWith(n) || n.startsWith(p.name.toLowerCase()))?.id
    || EVERYONE;
}

/** One-line description of a proposed change, shown on its card. */
function describe(s: State, a: Action): { icon: string; text: string } | null {
  const i = a.input;
  const when = (d: unknown, t?: unknown) => (isDate(d) ? parse(d as string).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "") + (isTime(t) ? ` · ${fmtTime(t as string)}` : "");
  switch (a.tool) {
    case "add_event": return { icon: "📅", text: `${str(i.title)} — ${when(i.date, i.start)}` };
    case "update_event": { const e = s.events.find((x) => x.id === i.id); return e ? { icon: "✏️", text: `Change ${e.title}${i.date || i.start ? ` → ${when(i.date || e.date, i.start || e.start)}` : ""}` } : null; }
    case "delete_event": { const e = s.events.find((x) => x.id === i.id); return e ? { icon: "🗑️", text: `Remove ${e.title}` } : null; }
    case "add_todo": return { icon: "☑️", text: `${str(i.title)}${isDate(i.date) ? ` — ${when(i.date)}` : " — someday"}` };
    case "complete_todo": { const t = s.todos.find((x) => x.id === i.id); return t ? { icon: "✅", text: `Done: ${t.title}` } : null; }
    case "set_meal": return { icon: "🍽", text: str(i.name) ? `${str(i.slot)} ${when(i.date)}: ${str(i.name)}` : `Clear ${str(i.slot)} ${when(i.date)}` };
    case "add_groceries": { const items = (Array.isArray(i.items) ? i.items : []).map(str).filter(Boolean); return items.length ? { icon: "🛒", text: `Groceries: ${items.join(", ")}` } : null; }
    case "check_off_groceries": { const items = (Array.isArray(i.items) ? i.items : []).map(str).filter(Boolean); return items.length ? { icon: "🛍️", text: `Got: ${items.join(", ")}` } : null; }
    case "log_expense": return s.settings.modules.budget && typeof i.amount === "number" ? { icon: "💳", text: `${str(i.label)} $${(i.amount as number).toFixed(2)} · ${str(i.category)}` } : null;
  }
  return null;
}

function apply(a: Action) {
  const s = getState(), i = a.input;
  switch (a.tool) {
    case "add_event":
      if (str(i.title) && isDate(i.date)) actions.saveEvent({ title: str(i.title), date: i.date as string, start: isTime(i.start) ? (i.start as string) : undefined, end: isTime(i.end) ? (i.end as string) : undefined, who: whoId(s, i.who), repeat: (["weekly", "monthly", "yearly"].includes(str(i.repeat)) ? str(i.repeat) : "none") as Repeat, note: str(i.note) || undefined });
      break;
    case "update_event": {
      const e = s.events.find((x) => x.id === i.id);
      if (e) actions.saveEvent({ ...e, title: str(i.title) || e.title, date: isDate(i.date) ? (i.date as string) : e.date, start: isTime(i.start) ? (i.start as string) : e.start, end: isTime(i.end) ? (i.end as string) : e.end, who: i.who ? whoId(s, i.who) : e.who, note: str(i.note) || e.note });
      break;
    }
    case "delete_event": if (s.events.some((x) => x.id === i.id)) actions.deleteEvent(i.id as string); break;
    case "add_todo": if (str(i.title)) actions.saveTodo({ title: str(i.title), date: isDate(i.date) ? (i.date as string) : undefined, who: whoId(s, i.who), note: str(i.note) || undefined }); break;
    case "complete_todo": { const t = s.todos.find((x) => x.id === i.id); if (t && !t.done) actions.toggleTodo(t.id); break; }
    case "set_meal": if (isDate(i.date) && ["breakfast", "lunch", "dinner"].includes(str(i.slot))) actions.setMeal(i.date as string, str(i.slot) as Slot, str(i.name)); break;
    case "add_groceries": (Array.isArray(i.items) ? i.items : []).map(str).filter(Boolean).forEach((n) => actions.addGrocery(n)); break;
    case "check_off_groceries":
      (Array.isArray(i.items) ? i.items : []).map(str).filter(Boolean).forEach((n) => {
        const g = getState().groceries.find((x) => !x.done && x.name.toLowerCase() === n.toLowerCase());
        if (g) actions.toggleGrocery(g.id);
      });
      break;
    case "log_expense": if (s.settings.modules.budget && typeof i.amount === "number" && i.amount > 0) actions.addExpense({ label: str(i.label) || "Expense", amount: i.amount, category: str(i.category) || "Other", date: isDate(i.date) ? (i.date as string) : today() }); break;
  }
}

/** Compact snapshot of the board for the assistant. */
function snapshot(s: State) {
  const t = today(), soon = iso(addDays(new Date(), 60)), week = iso(addDays(new Date(), 14));
  const name = (id: string) => s.settings.people.find((p) => p.id === id)?.name || "everyone";
  return {
    TODAY: `${t} (${DOW[new Date().getDay()]})`,
    TIMEZONE: Intl.DateTimeFormat().resolvedOptions().timeZone,
    PEOPLE: s.settings.people.map((p) => p.name),
    SECTIONS: s.settings.modules,
    BUDGET: s.settings.modules.budget ? "on" : "off",
    MEAL_SLOTS: s.settings.mealSlots,
    EVENTS: s.events.filter((e) => e.repeat !== "none" || (e.date >= iso(addDays(new Date(), -7)) && e.date <= soon)).map((e) => ({ id: e.id, title: e.title, date: e.date, start: e.start, end: e.end, who: name(e.who), repeat: e.repeat })),
    TODOS: s.todos.filter((x) => !x.done).map((x) => ({ id: x.id, title: x.title, date: x.date || "someday", who: name(x.who) })),
    MEALS: s.meals.filter((m) => m.date >= iso(addDays(new Date(), -3)) && m.date <= week).map((m) => ({ date: m.date, slot: m.slot, name: m.name })),
    GROCERIES: s.groceries.filter((g) => !g.done).map((g) => g.name),
  };
}

/* Chat lives for the session so switching tabs keeps it. */
let history: Msg[] = [];

const EXAMPLES = [
  "Dentist Tuesday at 3pm for me",
  "Tacos for dinner tomorrow, add tortillas and sour cream to groceries",
  "Remind us to order dog food whenever",
  "What's on this week?",
];

export function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>(history);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { history = msgs; end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs]);

  const send = async (content: string) => {
    const c = content.trim();
    if (!c || busy) return;
    const next = [...msgs, { role: "user" as const, content: c }];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content })), context: snapshot(getState()) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || (res.status === 429 ? "Slow down a little and try again in a minute." : "The assistant isn't available here."));
      const acts: Action[] = (data.actions || []).filter((a: Action) => describe(getState(), a));
      setMsgs([...next, { role: "assistant", content: data.reply || (acts.length ? "Here's what I'll add." : "Got it."), actions: acts }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: e instanceof Error && e.message !== "Failed to fetch" ? e.message : "I can't reach the assistant right now. It only works on the live app.", error: true }]);
    } finally { setBusy(false); }
  };

  const applyAll = (idx: number) => {
    const m = msgs[idx];
    m.actions?.forEach(apply);
    setMsgs(msgs.map((x, j) => (j === idx ? { ...x, applied: true } : x)));
  };
  const dropOne = (idx: number, k: number) => setMsgs(msgs.map((x, j) => (j === idx ? { ...x, actions: x.actions?.filter((_, n) => n !== k) } : x)));

  return (
    <section className="view assistant">
      <div className="pagehead"><h2 className="sec big">assistant</h2>{!!msgs.length && <button type="button" className="btn ghost" onClick={() => setMsgs([])}>New chat</button>}</div>
      <div className="chat">
        {!msgs.length && (
          <div className="card intro">
            <p className="hand big-hand">tell me what's going on and i'll put it on the board.</p>
            <p className="hint">Plans, appointments, what you ate, what you need from the store. Say a few things at once. You'll see every change before it's added.</p>
            <div className="chips">{EXAMPLES.map((e) => <button key={e} type="button" className="ex" onClick={() => send(e)}>{e}</button>)}</div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={"msg " + m.role + (m.error ? " err" : "")}>
            <div className="bubble">{m.content}</div>
            {!!m.actions?.length && (
              <div className={"card proposals" + (m.applied ? " done" : "")}>
                {m.actions.map((a, k) => { const d = describe(getState(), a); return d && (
                  <div key={k} className="prop"><span aria-hidden="true">{d.icon}</span><span className="hand">{d.text}</span>{!m.applied && <button type="button" className="x" onClick={() => dropOne(i, k)} aria-label="Leave this one out">×</button>}</div>
                ); })}
                {m.applied ? <span className="eyebrow ok">added to your board ✓</span> : <button type="button" className="btn primary" onClick={() => applyAll(i)}>Add {m.actions.length > 1 ? `all ${m.actions.length}` : "it"} to board</button>}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="msg assistant"><div className="bubble typing" aria-label="Thinking"><i /><i /><i /></div></div>}
        <div ref={end} />
      </div>
      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} placeholder="Dinner tomorrow is pasta, add garlic…" aria-label="Message the assistant"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} />
        <button type="submit" className="btn primary" disabled={busy || !text.trim()}>Send</button>
      </form>
    </section>
  );
}
