import { useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { actions, eventsOn, mealOn, todosOn, useAppState, WIDGET_LABEL, WIDGET_MODULE, type State, type WidgetId } from "../store";
import { addDays, DOW, fmtTime, holidaysOn, iso, MONTH_NAMES, parse, today, weekStart } from "../date";
import { Empty, Icon, WhoChip, whoColor } from "../ui/kit";
import type { EventDraft, TodoDraft } from "../ui/sheets";
import type { Tab } from "../App";

interface Ctx { s: State; go: (t: Tab) => void; newEvent: (d: EventDraft) => void; newTodo: (d: TodoDraft) => void }

export function PosterHead({ date, note }: { date: Date; note?: string }) {
  return (
    <header className="poster-head">
      <div className="pmonth" aria-hidden="true">{MONTH_NAMES[date.getMonth()].slice(0, 3)}</div>
      <div className="pside">
        <span className="pyear">{MONTH_NAMES[date.getMonth()]} {date.getFullYear()}</span>
        {note && <span className="pnote">{note}</span>}
      </div>
    </header>
  );
}

function greeting(s: State) {
  const t = today();
  const h = holidaysOn(t)[0];
  if (h) return `${h.emoji} ${h.name.toLowerCase()}!`;
  const hr = new Date().getHours();
  const part = hr < 12 ? "good morning" : hr < 18 ? "good afternoon" : "good evening";
  return s.settings.type === "couple" ? `${part}, you two` : `${part}!`;
}

/* ---------- widgets ---------- */
function TodayW({ s }: Ctx) {
  const t = today(), ev = eventsOn(s, t), td = todosOn(s, t).filter((x) => !x.done);
  return (
    <div className="tile t-date">
      <span className="kicker">today</span>
      <div className="day">{new Date().toLocaleDateString(undefined, { weekday: "long" }).toLowerCase()}</div>
      <div className="lbl">{new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" })}</div>
      <div className="meta">{ev.length} plan{ev.length === 1 ? "" : "s"} · {td.length} to-do{td.length === 1 ? "" : "s"}</div>
    </div>
  );
}

function AgendaW({ s, newEvent }: Ctx) {
  const t = today(), ev = eventsOn(s, t), hol = holidaysOn(t);
  return (
    <div className="card w-list">
      <div className="w-head"><h2 className="sec">today's plan</h2><button className="round" type="button" aria-label="Add event" onClick={() => newEvent({ date: t })}>{Icon.plus}</button></div>
      {hol.map((h) => <div key={h.name} className="hol-row"><span>{h.emoji}</span>{h.name}</div>)}
      {ev.length ? ev.map((e) => (
        <button key={e.id} type="button" className="ev" style={{ ["--who" as string]: whoColor(e.who, s.settings.people) }} onClick={() => newEvent(e)}>
          <span className="t">{e.start ? fmtTime(e.start) : "all day"}</span>
          <b className="hand">{e.title}</b>
          <WhoChip who={e.who} people={s.settings.people} />
        </button>
      )) : <Empty>Nothing planned. Enjoy the free time.</Empty>}
    </div>
  );
}

function WeekW({ s, go }: Ctx) {
  const ws = weekStart(new Date());
  return (
    <div className="card w-week">
      <div className="w-head"><h2 className="sec">this week</h2><button className="btn ghost" type="button" onClick={() => go("calendar")}>Calendar →</button></div>
      <div className="wk">
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(ws, i), ds = iso(d), ev = eventsOn(s, ds), din = mealOn(s, ds, "dinner");
          return (
            <div key={ds} className={"wkday" + (ds === today() ? " on" : "")}>
              <span className="wd">{DOW[i]}</span><span className="dn">{d.getDate()}</span>
              {ev.slice(0, 3).map((e) => <span key={e.id} className="wev hand" style={{ ["--hl" as string]: whoColor(e.who, s.settings.people) }}>{e.title}</span>)}
              {ev.length > 3 && <span className="more">+{ev.length - 3}</span>}
              {s.settings.modules.meals && din && <span className="wdin">🍽 {din.name}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TodosW({ s, newTodo, go }: Ctx) {
  const t = today();
  const open = s.todos.filter((x) => !x.done && (!x.date || x.date <= iso(addDays(new Date(), 2)))).sort((a, b) => (a.date || "9").localeCompare(b.date || "9")).slice(0, 6);
  return (
    <div className="card w-list">
      <div className="w-head"><h2 className="sec">to-dos</h2><button className="round" type="button" aria-label="Add to-do" onClick={() => newTodo({ date: t })}>{Icon.plus}</button></div>
      {open.length ? open.map((x) => (
        <label key={x.id} className="td">
          <input type="checkbox" checked={x.done} onChange={() => actions.toggleTodo(x.id)} />
          <b className="hand">{x.title}</b>
          <span className="when">{x.date ? (x.date < t ? "overdue" : x.date === t ? "today" : parse(x.date).toLocaleDateString(undefined, { weekday: "short" })) : "someday"}</span>
          <WhoChip who={x.who} people={s.settings.people} />
        </label>
      )) : <Empty>All caught up.</Empty>}
      <button className="btn ghost" type="button" onClick={() => go("todos")}>All to-dos →</button>
    </div>
  );
}

function MealsW({ s, go }: Ctx) {
  const days = [0, 1, 2].map((n) => iso(addDays(new Date(), n)));
  return (
    <div className="tile t-meal" onClick={() => go("meals")} role="button" tabIndex={0}>
      <span className="kicker">dinner</span>
      {days.map((ds, i) => {
        const m = mealOn(s, ds, "dinner");
        return <div key={ds} className={i ? "mrow" : "lbl"}>{i ? <span className="mday">{DOW[parse(ds).getDay()]}</span> : null}{m ? m.name : i ? "—" : "not planned yet"}</div>;
      })}
    </div>
  );
}

function GroceriesW({ s, go }: Ctx) {
  const left = s.groceries.filter((g) => !g.done);
  return (
    <div className="tile t-groc" onClick={() => go("groceries")} role="button" tabIndex={0}>
      <span className="kicker">groceries</span>
      <div className="big">{left.length}</div>
      <div className="meta">{left.length === 1 ? "thing" : "things"} to get</div>
      <div className="items">{left.slice(0, 4).map((g) => <span key={g.id} className="hand">{g.name}</span>)}</div>
    </div>
  );
}

function BudgetW({ s, go }: Ctx) {
  const ws = iso(weekStart(new Date())), we = iso(addDays(weekStart(new Date()), 6));
  const spent = s.expenses.filter((e) => e.date >= ws && e.date <= we).reduce((a, e) => a + e.amount, 0);
  const bud = s.settings.weeklyBudget;
  return (
    <div className="tile t-money" onClick={() => go("budget")} role="button" tabIndex={0}>
      <span className="kicker">spent this week</span>
      <div className="big">${spent.toFixed(0)}</div>
      {bud ? <><div className="tbar"><i style={{ width: Math.min(100, (spent / bud) * 100) + "%" }} /></div><div className="meta">${Math.max(0, bud - spent).toFixed(0)} left of ${bud}</div></> : <div className="meta">set a weekly budget in settings</div>}
    </div>
  );
}

const WIDGETS: Record<WidgetId, (c: Ctx) => JSX.Element> = { today: TodayW, agenda: AgendaW, week: WeekW, todos: TodosW, meals: MealsW, groceries: GroceriesW, budget: BudgetW };
const SIZE: Record<WidgetId, string> = { today: "s", agenda: "m", week: "l", todos: "m", meals: "s", groceries: "s", budget: "s" };

/* ---------- edit mode: drag to reorder, tap to hide ---------- */
function SortableItem({ id, on, onToggle }: { id: WidgetId; on: boolean; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={"edit-item card" + (isDragging ? " dragging" : "") + (on ? "" : " off")}>
      <button type="button" className="grip" aria-label={`Move ${WIDGET_LABEL[id]}`} {...attributes} {...listeners}>{Icon.grip}</button>
      <span className="hand">{WIDGET_LABEL[id]}</span>
      <label className="switch"><input type="checkbox" checked={on} onChange={onToggle} aria-label={`Show ${WIDGET_LABEL[id]}`} /><i /></label>
    </div>
  );
}

export function BoardEditor() {
  const s = useAppState();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const list = s.settings.widgets.filter((w) => { const m = WIDGET_MODULE[w.id]; return !m || s.settings.modules[m]; });
  const onEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const all = s.settings.widgets, from = all.findIndex((w) => w.id === e.active.id), to = all.findIndex((w) => w.id === e.over!.id);
    actions.updateSettings({ widgets: arrayMove(all, from, to) });
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
      <SortableContext items={list.map((w) => w.id)} strategy={rectSortingStrategy}>
        <div className="edit-list">
          {list.map((w) => <SortableItem key={w.id} id={w.id} on={w.on} onToggle={() => actions.updateSettings({ widgets: s.settings.widgets.map((x) => (x.id === w.id ? { ...x, on: !x.on } : x)) })} />)}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function Board(props: Omit<Ctx, "s">) {
  const s = useAppState();
  const [editing, setEditing] = useState(false);
  const visible = s.settings.widgets.filter((w) => { const m = WIDGET_MODULE[w.id]; return w.on && (!m || s.settings.modules[m]); });
  const ctx = { ...props, s };
  return (
    <section className="view">
      <PosterHead date={new Date()} note={greeting(s)} />
      <div className="board-bar">
        <span className="eyebrow">{eventsOn(s, today()).length ? "here's your day" : "a quiet day"}</span>
        <button type="button" className={"btn" + (editing ? " primary" : "")} onClick={() => setEditing((x) => !x)}>{editing ? "Done" : "Customize board"}</button>
      </div>
      {editing ? (
        <div className="editing">
          <p className="hint">Drag to reorder. Switch off anything you don't need. Turn whole sections on or off in Settings.</p>
          <BoardEditor />
        </div>
      ) : (
        <div className="mosaic">
          {visible.map((w) => <div key={w.id} className={"cell-w size-" + SIZE[w.id]}>{WIDGETS[w.id](ctx)}</div>)}
          {!visible.length && <Empty>Your board is empty. Tap Customize board to add sections.</Empty>}
        </div>
      )}
    </section>
  );
}
