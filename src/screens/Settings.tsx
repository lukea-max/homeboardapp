import { useState } from "react";
import { actions, makeSettings, MODULE_LABEL, PRESETS, useAppState, type HouseholdType, type ModuleId, type Slot } from "../store";
import { MONTH_KEYS } from "../date";
import { FREE_THEMES, MARKERS, POSTER } from "../theme";
import { Field } from "../ui/kit";
import { BoardEditor } from "./Board";

export function Settings() {
  const s = useAppState();
  const st = s.settings;
  const [confirmReset, setConfirmReset] = useState(false);
  const setPerson = (id: string, patch: { name?: string; color?: string }) =>
    actions.updateSettings({ people: st.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const toggleSlot = (sl: Slot) => {
    const has = st.mealSlots.includes(sl);
    const next = (["breakfast", "lunch", "dinner"] as Slot[]).filter((x) => (x === sl ? !has : st.mealSlots.includes(x)));
    if (next.length) actions.updateSettings({ mealSlots: next });
  };
  return (
    <section className="view">
      <div className="pagehead"><h2 className="sec big">settings</h2></div>
      <div className="settings">
        <div className="card form">
          <span className="eyebrow">household</span>
          <Field label="Board name"><input value={st.household} onChange={(e) => actions.updateSettings({ household: e.target.value })} /></Field>
          <Field label="Type">
            <div className="segmented">
              {(Object.keys(PRESETS) as HouseholdType[]).map((t) => <button key={t} type="button" aria-pressed={st.type === t} onClick={() => actions.updateSettings({ type: t })}>{PRESETS[t].label}</button>)}
            </div>
          </Field>
          <span className="eyebrow">people</span>
          {st.people.map((p) => (
            <div key={p.id} className="person">
              <input value={p.name} onChange={(e) => setPerson(p.id, { name: e.target.value })} aria-label="Name" />
              <div className="swatches">{MARKERS.map((m) => <button key={m.id} type="button" className={"sw" + (p.color === m.id ? " on" : "")} style={{ background: m.hex }} onClick={() => setPerson(p.id, { color: m.id })} aria-label={`${m.id} for ${p.name}`} />)}</div>
              {st.people.length > 1 && <button type="button" className="x" onClick={() => actions.updateSettings({ people: st.people.filter((x) => x.id !== p.id) })} aria-label={`Remove ${p.name}`}>×</button>}
            </div>
          ))}
          <button type="button" className="btn" onClick={() => { const extra = makeSettings(st.type, ["New person"], "").people[0]; actions.updateSettings({ people: [...st.people, { ...extra, color: MARKERS[st.people.length % MARKERS.length].id }] }); }}>+ Add person</button>
          <p className="hint">Inviting people to their own phones is coming with accounts &amp; sync.</p>
        </div>

        <div className="card form">
          <span className="eyebrow">sections</span>
          <p className="hint">Turn on only what your home needs. Off sections disappear from the tabs and the board.</p>
          {(Object.keys(MODULE_LABEL) as ModuleId[]).map((m) => (
            <label key={m} className="toggle-row">
              <span className="hand">{MODULE_LABEL[m]}{m === "budget" && <small> optional</small>}</span>
              <span className="switch"><input type="checkbox" checked={st.modules[m]} onChange={() => {
                const on = !st.modules[m];
                actions.updateSettings({ modules: { ...st.modules, [m]: on }, widgets: st.widgets.map((w) => (w.id === m ? { ...w, on } : w)) });
              }} /><i /></span>
            </label>
          ))}
          {st.modules.meals && (
            <Field label="Meals to plan">
              <div className="segmented">{(["breakfast", "lunch", "dinner"] as Slot[]).map((sl) => <button key={sl} type="button" aria-pressed={st.mealSlots.includes(sl)} onClick={() => toggleSlot(sl)}>{sl}</button>)}</div>
            </Field>
          )}
          {st.modules.budget && (
            <Field label="Weekly budget"><input inputMode="decimal" value={st.weeklyBudget ?? ""} placeholder="e.g. 200" onChange={(e) => actions.updateSettings({ weeklyBudget: e.target.value ? Number(e.target.value) || null : null })} /></Field>
          )}
        </div>

        <div className="card form">
          <span className="eyebrow">board layout</span>
          <p className="hint">Drag to reorder what shows on your board.</p>
          <BoardEditor />
        </div>

        <div className="card form">
          <span className="eyebrow">theme</span>
          <div className="themes">
            <button type="button" className={"th seasonal" + (st.theme === "seasonal" ? " on" : "")} onClick={() => actions.updateSettings({ theme: "seasonal" })}><b>Seasonal</b><small>changes every month</small></button>
            {MONTH_KEYS.map((k) => (
              <button key={k} type="button" className={"th" + (st.theme === k ? " on" : "")} style={{ background: POSTER[k].base, color: POSTER[k].letter }} onClick={() => actions.updateSettings({ theme: k })}>
                <b>{POSTER[k].name}</b>{!FREE_THEMES.includes(k) && <small>Plus</small>}
              </button>
            ))}
          </div>
        </div>

        <div className="card form">
          <span className="eyebrow">data</span>
          <p className="hint">Everything is saved on this device for now.</p>
          <button type="button" className="btn danger" onClick={() => { if (confirmReset) actions.resetAll(); else { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); } }}>{confirmReset ? "Tap again to erase everything" : "Start over"}</button>
        </div>
      </div>
    </section>
  );
}
