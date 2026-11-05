import { useEffect, useRef, type ReactNode } from "react";
import { EVERYONE, type Person } from "../store";
import { marker } from "../theme";

/** Bottom sheet on phones, centered dialog on larger screens. */
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="sheet" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} aria-label={title}>
      {open && (
        <div className="sheet-body">
          <div className="sheet-head">
            <h3>{title}</h3>
            <button type="button" className="round" onClick={onClose} aria-label="Close">×</button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

/** Marker-colored chip for a person (or "Everyone"). */
export function WhoChip({ who, people }: { who: string; people: Person[] }) {
  const p = people.find((x) => x.id === who);
  if (!p) return <span className="chip chip-all">{people.length > 2 ? "Everyone" : "Both"}</span>;
  const m = marker(p.color);
  return <span className="chip" style={{ background: m.hex, color: m.ink }}>{p.name}</span>;
}

export function whoColor(who: string, people: Person[]) {
  const p = people.find((x) => x.id === who);
  return p ? marker(p.color).hex : "var(--letter)";
}

/** Segmented picker for who something belongs to. */
export function WhoPicker({ value, people, onChange }: { value: string; people: Person[]; onChange: (v: string) => void }) {
  const opts = [...people.map((p) => ({ id: p.id, label: p.name })), ...(people.length > 1 ? [{ id: EVERYONE, label: people.length > 2 ? "Everyone" : "Both" }] : [])];
  return (
    <div className="segmented" role="radiogroup" aria-label="Who">
      {opts.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export const Icon = {
  board: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="9" rx="2" /><rect x="13.5" y="3" width="7.5" height="5" rx="2" /><rect x="13.5" y="11" width="7.5" height="10" rx="2" /><rect x="3" y="15" width="7.5" height="6" rx="2" /></svg>,
  calendar: <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
  todos: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="m8 12 3 3 5-6" /></svg>,
  meals: <svg viewBox="0 0 24 24"><path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 3c-2 2-2 6 0 8v10" /></svg>,
  groceries: <svg viewBox="0 0 24 24"><path d="M6 8h12l-1.2 11a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>,
  budget: <svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18M7 15h3" /></svg>,
  settings: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>,
  grip: <svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" /><circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" /><circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" /></svg>,
  plus: <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>,
};
