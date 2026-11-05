import { useState } from "react";
import { eventsOn, todosOn, actions, useAppState } from "../store";
import { addDays, DOW, fmtTime, holidaysOn, iso, MONTH_KEYS, MONTH_NAMES, parse, today } from "../date";
import { POSTER } from "../theme";
import { Empty, Icon, WhoChip, whoColor } from "../ui/kit";
import type { EventDraft } from "../ui/sheets";

export function Calendar({ month, setMonth, newEvent }: { month: Date; setMonth: (d: Date) => void; newEvent: (d: EventDraft) => void }) {
  const s = useAppState();
  const [sel, setSel] = useState(today());
  const [picker, setPicker] = useState(false);
  const [pickYear, setPickYear] = useState(month.getFullYear());
  const people = s.settings.people;
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  const go = (n: number) => { const d = new Date(month.getFullYear(), month.getMonth() + n, 1); setMonth(d); setSel(iso(d)); };
  const jump = (y: number, m: number) => { const d = new Date(y, m, 1); setMonth(d); setSel(iso(d)); setPicker(false); };
  const selEv = eventsOn(s, sel), selTd = todosOn(s, sel), selHol = holidaysOn(sel);

  return (
    <section className="view">
      <div className="calhead">
        <div className="mwrap">
          <button className="mbtn" type="button" aria-expanded={picker} onClick={() => { setPickYear(month.getFullYear()); setPicker((x) => !x); }}>
            {MONTH_NAMES[month.getMonth()]} <small>{month.getFullYear()}</small> <span className="caret">▾</span>
          </button>
          {picker && (
            <div className="mpick card" role="dialog" aria-label="Pick a month">
              <div className="mpy"><button className="round" type="button" onClick={() => setPickYear(pickYear - 1)} aria-label="Previous year">‹</button><b>{pickYear}</b><button className="round" type="button" onClick={() => setPickYear(pickYear + 1)} aria-label="Next year">›</button></div>
              <div className="mpg">
                {MONTH_KEYS.map((k, i) => (
                  <button key={k} type="button" className={"mpc" + (pickYear === month.getFullYear() && i === month.getMonth() ? " on" : "")} style={{ background: POSTER[k].base, color: POSTER[k].letter }} onClick={() => jump(pickYear, i)}>
                    <b>{MONTH_NAMES[i].slice(0, 3)}</b><small>{POSTER[k].name}</small>
                  </button>
                ))}
              </div>
              <button className="btn ghost" type="button" onClick={() => { const n = new Date(); jump(n.getFullYear(), n.getMonth()); setSel(today()); }}>Jump to today</button>
            </div>
          )}
        </div>
        <div className="navbtns">
          <button className="round" type="button" onClick={() => go(-1)} aria-label="Previous month">‹</button>
          <button className="btn" type="button" onClick={() => { const n = new Date(); setMonth(new Date(n.getFullYear(), n.getMonth(), 1)); setSel(today()); }}>Today</button>
          <button className="round" type="button" onClick={() => go(1)} aria-label="Next month">›</button>
        </div>
      </div>

      <div className="calgrid">
        <div className="card monthcard">
          <div className="dow">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
          <div className="cells">
            {Array.from({ length: 42 }, (_, i) => {
              const d = addDays(start, i), ds = iso(d), ev = eventsOn(s, ds), td = todosOn(s, ds).filter((x) => !x.done), hol = holidaysOn(ds);
              const out = d.getMonth() !== month.getMonth();
              return (
                <button key={ds} type="button" className={"cell" + (out ? " out" : "") + (ds === today() ? " today" : "") + (ds === sel ? " sel" : "")} onClick={() => setSel(ds)} aria-label={`${d.toDateString()}, ${ev.length} events`}>
                  <span className="n">{d.getDate()}</span>
                  {hol.map((h) => <span key={h.name} className="hol" title={h.name}><span>{h.emoji}</span><span className="hn">{h.name}</span></span>)}
                  {ev.slice(0, 2).map((e) => <span key={e.id} className="pill hand" style={{ ["--hl" as string]: whoColor(e.who, people) }}>{e.title}</span>)}
                  {ev.length + td.length > 2 && <span className="more">+{ev.length + td.length - 2}</span>}
                  {!!(ev.length + td.length) && <span className="dots">{ev.slice(0, 3).map((e) => <i key={e.id} style={{ background: whoColor(e.who, people) }} />)}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="card daypanel">
          <div className="w-head">
            <h3>{parse(sel).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</h3>
            <button className="round" type="button" aria-label="Add event" onClick={() => newEvent({ date: sel })}>{Icon.plus}</button>
          </div>
          {selHol.map((h) => <div key={h.name} className="hol-row"><span>{h.emoji}</span>{h.name}</div>)}
          {selEv.map((e) => (
            <button key={e.id} type="button" className="ev" style={{ ["--who" as string]: whoColor(e.who, people) }} onClick={() => newEvent(e)}>
              <span className="t">{e.start ? fmtTime(e.start) : "all day"}</span>
              <b className="hand">{e.title}</b>
              <WhoChip who={e.who} people={people} />
            </button>
          ))}
          {selTd.map((x) => (
            <label key={x.id} className="td">
              <input type="checkbox" checked={x.done} onChange={() => actions.toggleTodo(x.id)} />
              <b className="hand">{x.title}</b><WhoChip who={x.who} people={people} />
            </label>
          ))}
          {!selEv.length && !selTd.length && !selHol.length && <Empty>Nothing on this day.</Empty>}
        </aside>
      </div>
    </section>
  );
}
