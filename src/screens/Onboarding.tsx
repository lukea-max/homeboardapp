import { useState } from "react";
import { actions, makeSettings, MODULE_LABEL, PRESETS, type HouseholdType, type ModuleId } from "../store";

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [type, setType] = useState<HouseholdType>("couple");
  const [names, setNames] = useState<string[]>(PRESETS.couple.people);
  const [house, setHouse] = useState("Our Home");
  const [mods, setMods] = useState(PRESETS.couple.modules);

  const pick = (t: HouseholdType) => { setType(t); setNames([...PRESETS[t].people]); setMods({ ...PRESETS[t].modules }); setHouse(t === "student" ? "My Place" : t === "family" ? "The Family" : "Our Home"); setStep(1); };
  const finish = (sample: boolean) => {
    const s = makeSettings(type, names.map((n) => n.trim()).filter(Boolean).length ? names.map((n) => n.trim()).filter(Boolean) : ["You"], house.trim() || "Home");
    s.modules = mods;
    s.widgets = s.widgets.map((w) => (w.id === "budget" ? { ...w, on: mods.budget } : w));
    actions.finishOnboarding(s, sample);
  };

  return (
    <main className="onboard">
      <div className="pmonth" aria-hidden="true">home</div>
      <h1 className="ob-title">board</h1>
      <p className="ob-sub hand">the fridge whiteboard, upgraded.</p>

      {step === 0 && (
        <div className="ob-step">
          <span className="eyebrow">who's this board for?</span>
          {(Object.keys(PRESETS) as HouseholdType[]).map((t) => (
            <button key={t} type="button" className="card ob-opt" onClick={() => pick(t)}>
              <b>{PRESETS[t].label}</b><span>{PRESETS[t].blurb}</span>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <form className="ob-step card form" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
          <span className="eyebrow">name your board</span>
          <input value={house} onChange={(e) => setHouse(e.target.value)} aria-label="Board name" />
          <span className="eyebrow">who's in it?</span>
          {names.map((n, i) => (
            <div key={i} className="person">
              <input value={n} onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Person ${i + 1}`} />
              {names.length > 1 && <button type="button" className="x" onClick={() => setNames(names.filter((_, j) => j !== i))} aria-label="Remove">×</button>}
            </div>
          ))}
          <button type="button" className="btn" onClick={() => setNames([...names, ""])}>+ Add person</button>
          <div className="actions"><button type="button" className="btn ghost" onClick={() => setStep(0)}>Back</button><button type="submit" className="btn primary">Next</button></div>
        </form>
      )}

      {step === 2 && (
        <div className="ob-step card form">
          <span className="eyebrow">pick your sections</span>
          <p className="hint">You can change these anytime in Settings.</p>
          {(Object.keys(MODULE_LABEL) as ModuleId[]).map((m) => (
            <label key={m} className="toggle-row">
              <span className="hand">{MODULE_LABEL[m]}</span>
              <span className="switch"><input type="checkbox" checked={mods[m]} onChange={() => setMods({ ...mods, [m]: !mods[m] })} /><i /></span>
            </label>
          ))}
          <div className="actions">
            <button type="button" className="btn ghost" onClick={() => setStep(1)}>Back</button>
            <button type="button" className="btn" onClick={() => finish(true)}>Try with sample data</button>
            <button type="button" className="btn primary" onClick={() => finish(false)}>Start fresh</button>
          </div>
        </div>
      )}
    </main>
  );
}
