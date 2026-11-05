import { useState } from "react";
import { actions, DEFAULT_MODULES, makeSettings, MODULE_LABEL, type ModuleId } from "../store";

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [names, setNames] = useState<string[]>([""]);
  const [house, setHouse] = useState("");
  const [mods, setMods] = useState(DEFAULT_MODULES);

  const finish = (sample: boolean) => {
    const clean = names.map((n) => n.trim()).filter(Boolean);
    actions.finishOnboarding(makeSettings(clean.length ? clean : ["Me"], house.trim() || "My Home", mods), sample);
  };

  return (
    <main className="onboard">
      <div className="pmonth" aria-hidden="true">home</div>
      <h1 className="ob-title">board</h1>
      <p className="ob-sub hand">the fridge whiteboard, upgraded.</p>

      {step === 0 && (
        <form className="ob-step card form" onSubmit={(e) => { e.preventDefault(); setStep(1); }}>
          <span className="eyebrow">what should we call your board?</span>
          <input value={house} onChange={(e) => setHouse(e.target.value)} placeholder="My Home, The Smiths, Apt 4B…" aria-label="Board name" />
          <span className="eyebrow">who's on it?</span>
          <p className="hint">Just you, or add anyone you share plans with. Each person gets their own marker color.</p>
          {names.map((n, i) => (
            <div key={i} className="person">
              <input value={n} onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))} placeholder={i ? "Their name" : "Your name"} aria-label={`Person ${i + 1}`} />
              {names.length > 1 && <button type="button" className="x" onClick={() => setNames(names.filter((_, j) => j !== i))} aria-label="Remove">×</button>}
            </div>
          ))}
          <button type="button" className="btn" onClick={() => setNames([...names, ""])}>+ Add someone</button>
          <div className="actions"><button type="submit" className="btn primary">Next</button></div>
        </form>
      )}

      {step === 1 && (
        <div className="ob-step card form">
          <span className="eyebrow">what do you want on your board?</span>
          <p className="hint">Pick what's useful. You can change this anytime in Settings.</p>
          {(Object.keys(MODULE_LABEL) as ModuleId[]).map((m) => (
            <label key={m} className="toggle-row">
              <span className="hand">{MODULE_LABEL[m]}</span>
              <span className="switch"><input type="checkbox" checked={mods[m]} onChange={() => setMods({ ...mods, [m]: !mods[m] })} /><i /></span>
            </label>
          ))}
          <div className="actions">
            <button type="button" className="btn ghost" onClick={() => setStep(0)}>Back</button>
            <button type="button" className="btn" onClick={() => finish(true)}>Try with sample data</button>
            <button type="button" className="btn primary" onClick={() => finish(false)}>Start fresh</button>
          </div>
        </div>
      )}
    </main>
  );
}
