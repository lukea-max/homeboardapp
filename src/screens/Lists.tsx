import { useState } from "react";
import { actions, BUDGET_CATEGORIES, EVERYONE, mealOn, useAppState, type Slot } from "../store";
import { addDays, DOW, iso, parse, today, weekStart } from "../date";
import { Empty, Icon, WhoChip } from "../ui/kit";
import type { TodoDraft } from "../ui/sheets";

/* ---------- To-dos ---------- */
export function Todos({ newTodo }: { newTodo: (d: TodoDraft) => void }) {
  const s = useAppState();
  const [filter, setFilter] = useState(EVERYONE + ":view");
  const [quick, setQuick] = useState("");
  const t = today();
  const people = s.settings.people;
  const mine = (who: string) => filter === EVERYONE + ":view" || who === filter || who === EVERYONE;
  const open = s.todos.filter((x) => !x.done && mine(x.who));
  const groups = [
    { name: "Overdue", items: open.filter((x) => x.date && x.date < t) },
    { name: "Today", items: open.filter((x) => x.date === t) },
    { name: "Coming up", items: open.filter((x) => x.date && x.date > t).sort((a, b) => a.date!.localeCompare(b.date!)) },
    { name: "Someday", items: open.filter((x) => !x.date) },
  ];
  const done = s.todos.filter((x) => x.done && mine(x.who)).slice(-10).reverse();
  return (
    <section className="view">
      <div className="pagehead"><h2 className="sec big">to-dos</h2><button className="btn primary" type="button" onClick={() => newTodo({ date: t })}>{Icon.plus} New</button></div>
      {people.length > 1 && (
        <div className="segmented filter">
          <button type="button" aria-pressed={filter === EVERYONE + ":view"} onClick={() => setFilter(EVERYONE + ":view")}>All</button>
          {people.map((p) => <button key={p.id} type="button" aria-pressed={filter === p.id} onClick={() => setFilter(p.id)}>{p.name}</button>)}
        </div>
      )}
      <form className="quick card" onSubmit={(e) => { e.preventDefault(); if (quick.trim()) { actions.saveTodo({ title: quick, who: filter.endsWith(":view") ? EVERYONE : filter }); setQuick(""); } }}>
        <input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Quick add to Someday…" aria-label="Quick add a to-do" />
        <button className="btn" type="submit">Add</button>
      </form>
      <div className="stack">
        {groups.filter((g) => g.items.length).map((g) => (
          <div key={g.name} className="card w-list">
            <h4 className="grp">{g.name} <span>{g.items.length}</span></h4>
            {g.items.map((x) => (
              <div key={x.id} className="td">
                <input type="checkbox" checked={x.done} onChange={() => actions.toggleTodo(x.id)} aria-label={`Done: ${x.title}`} />
                <button type="button" className="tdtext" onClick={() => newTodo(x)}><b className="hand">{x.title}</b>{x.date && <small>{parse(x.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</small>}{x.note && <small>{x.note}</small>}</button>
                <WhoChip who={x.who} people={people} />
              </div>
            ))}
          </div>
        ))}
        {!open.length && <Empty>Nothing to do. Nice.</Empty>}
        {!!done.length && (
          <details className="card w-list done-list">
            <summary>Done ({done.length})</summary>
            {done.map((x) => (
              <div key={x.id} className="td done">
                <input type="checkbox" checked onChange={() => actions.toggleTodo(x.id)} aria-label={`Undo: ${x.title}`} />
                <b className="hand">{x.title}</b>
                <button type="button" className="x" onClick={() => actions.deleteTodo(x.id)} aria-label={`Delete ${x.title}`}>×</button>
              </div>
            ))}
          </details>
        )}
      </div>
    </section>
  );
}

/* ---------- Meals ---------- */
function MealInput({ ds, slot }: { ds: string; slot: Slot }) {
  const s = useAppState();
  const cur = mealOn(s, ds, slot)?.name || "";
  const [v, setV] = useState(cur);
  const [focused, setFocused] = useState(false);
  return (
    <input className="meal-in hand" value={focused ? v : cur} placeholder="+ add"
      onFocus={() => { setV(cur); setFocused(true); }}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { setFocused(false); if (v !== cur) actions.setMeal(ds, slot, v); }}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      aria-label={`${slot} on ${ds}`} />
  );
}

export function Meals() {
  const s = useAppState();
  const [offset, setOffset] = useState(0);
  const ws = addDays(weekStart(new Date()), offset * 7);
  const we = addDays(ws, 6);
  const slots = s.settings.mealSlots;
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const planned = Array.from({ length: 7 }, (_, i) => iso(addDays(ws, i))).reduce((n, ds) => n + slots.filter((sl) => mealOn(s, ds, sl)).length, 0);
  return (
    <section className="view">
      <div className="pagehead">
        <div><span className="eyebrow">{offset === 0 ? "this week" : offset === 1 ? "next week" : offset === -1 ? "last week" : "week of"} · {fmt(ws)} – {fmt(we)}</span><h2 className="sec big">meals</h2></div>
        <div className="navbtns">
          <button className="round" type="button" onClick={() => setOffset(offset - 1)} aria-label="Previous week">‹</button>
          {offset !== 0 && <button className="btn" type="button" onClick={() => setOffset(0)}>This week</button>}
          <button className="round" type="button" onClick={() => setOffset(offset + 1)} aria-label="Next week">›</button>
        </div>
      </div>
      <p className="hint">{planned} of {7 * slots.length} meals planned. Tap any box to type; it saves when you leave it.</p>
      <div className="mealweek" style={{ ["--cols" as string]: slots.length }}>
        <div className="colheads" aria-hidden="true"><span /> {slots.map((sl) => <span key={sl}>{sl}</span>)}</div>
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(ws, i), ds = iso(d);
          return (
            <div key={ds} className={"mday" + (ds === today() ? " on" : "") + (ds < today() ? " past" : "")}>
              <div className="dayname"><b>{DOW[i]}</b><span>{d.getDate()}</span>{ds === today() && <em>today</em>}</div>
              {slots.map((sl) => {
                const has = !!mealOn(s, ds, sl);
                return (
                  <label key={sl} className={"meal card" + (has ? "" : " blank")}>
                    <span className="slot">{sl}</span>
                    <MealInput ds={ds} slot={sl} />
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Groceries ---------- */
export function Groceries() {
  const s = useAppState();
  const [v, setV] = useState("");
  const left = s.groceries.filter((g) => !g.done), got = s.groceries.filter((g) => g.done);
  return (
    <section className="view">
      <div className="pagehead"><h2 className="sec big">groceries</h2><span className="eyebrow">{got.length} of {s.groceries.length} in cart</span></div>
      <div className="card receipt">
        <form className="quick" onSubmit={(e) => { e.preventDefault(); actions.addGrocery(v); setV(""); }}>
          <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Add an item…" aria-label="Add grocery item" />
          <button className="btn primary" type="submit">Add</button>
        </form>
        <div className="bar"><i style={{ width: s.groceries.length ? (got.length / s.groceries.length) * 100 + "%" : 0 }} /></div>
        {left.map((g) => (
          <label key={g.id} className="gi">
            <input type="checkbox" checked={false} onChange={() => actions.toggleGrocery(g.id)} />
            <span className="nm hand">{g.name}</span>
            <button type="button" className="x" onClick={(e) => { e.preventDefault(); actions.deleteGrocery(g.id); }} aria-label={`Remove ${g.name}`}>×</button>
          </label>
        ))}
        {!left.length && <Empty>{got.length ? "Everything's in the cart." : "The list is empty. Add what you need."}</Empty>}
        {!!got.length && (
          <div className="incart">
            <div className="w-head"><span className="eyebrow">in the cart</span><button className="btn ghost" type="button" onClick={actions.clearCheckedGroceries}>Clear checked</button></div>
            {got.map((g) => (
              <label key={g.id} className="gi done">
                <input type="checkbox" checked onChange={() => actions.toggleGrocery(g.id)} />
                <span className="nm hand">{g.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Budget (optional module) ---------- */
export function Budget() {
  const s = useAppState();
  const [f, setF] = useState({ label: "", amount: "", category: BUDGET_CATEGORIES[0], date: today() });
  const ws = iso(weekStart(new Date())), we = iso(addDays(weekStart(new Date()), 6));
  const week = s.expenses.filter((e) => e.date >= ws && e.date <= we);
  const spent = week.reduce((a, e) => a + e.amount, 0);
  const bud = s.settings.weeklyBudget;
  const byCat = BUDGET_CATEGORIES.map((c) => ({ c, v: week.filter((e) => e.category === c).reduce((a, e) => a + e.amount, 0) })).filter((x) => x.v);
  const recent = [...s.expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  return (
    <section className="view">
      <div className="pagehead"><h2 className="sec big">budget</h2></div>
      <div className="budget">
        <div className="tile t-money">
          <span className="kicker">spent this week</span>
          <div className="big">${spent.toFixed(2)}</div>
          {bud ? <><div className="tbar"><i style={{ width: Math.min(100, (spent / bud) * 100) + "%" }} /></div><div className="meta">{spent > bud ? `$${(spent - bud).toFixed(0)} over` : `$${(bud - spent).toFixed(0)} left`} of ${bud}</div></> : <div className="meta">no weekly budget set</div>}
          <div className="cats">{byCat.map((x) => <span key={x.c}>{x.c} <b>${x.v.toFixed(0)}</b></span>)}</div>
        </div>
        <form className="card form" onSubmit={(e) => { e.preventDefault(); const amount = parseFloat(f.amount); if (!f.label.trim() || !(amount > 0)) return; actions.addExpense({ label: f.label.trim(), amount, category: f.category, date: f.date }); setF({ ...f, label: "", amount: "" }); }}>
          <span className="eyebrow">log spending</span>
          <input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="What was it?" aria-label="What" required />
          <div className="row3">
            <input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="$0.00" aria-label="Amount" required />
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} aria-label="Category">{BUDGET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} aria-label="Date" />
          </div>
          <button className="btn primary" type="submit">Add</button>
        </form>
      </div>
      <div className="card w-list">
        <h4 className="grp">Recent</h4>
        {recent.map((e) => (
          <div key={e.id} className="exp">
            <span className="hand">{e.label}</span><small>{e.category} · {parse(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small>
            <b>${e.amount.toFixed(2)}</b>
            <button type="button" className="x" onClick={() => actions.deleteExpense(e.id)} aria-label={`Delete ${e.label}`}>×</button>
          </div>
        ))}
        {!recent.length && <Empty>No spending logged yet.</Empty>}
      </div>
    </section>
  );
}

