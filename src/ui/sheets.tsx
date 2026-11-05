import { useEffect, useState } from "react";
import { actions, EVERYONE, type CalEvent, type Person, type Repeat, type Todo } from "../store";
import { Field, Sheet, WhoPicker } from "./kit";

export type EventDraft = Partial<CalEvent> & { date: string };

export function EventSheet({ draft, people, onClose }: { draft: EventDraft | null; people: Person[]; onClose: () => void }) {
  const [f, setF] = useState<EventDraft>({ date: "" });
  useEffect(() => { if (draft) setF({ who: EVERYONE, repeat: "none", ...draft }); }, [draft]);
  const up = (p: Partial<EventDraft>) => setF((x) => ({ ...x, ...p }));
  const save = () => {
    if (!f.title?.trim() || !f.date) return;
    actions.saveEvent({ id: f.id, title: f.title.trim(), date: f.date, start: f.start || undefined, end: f.end || undefined, who: f.who || EVERYONE, repeat: (f.repeat as Repeat) || "none", note: f.note?.trim() || undefined });
    onClose();
  };
  return (
    <Sheet open={!!draft} title={f.id ? "Edit event" : "New event"} onClose={onClose}>
      <form className="form" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="What"><input autoFocus value={f.title || ""} onChange={(e) => up({ title: e.target.value })} placeholder="Dinner with friends" required /></Field>
        <div className="row3">
          <Field label="Date"><input type="date" value={f.date} onChange={(e) => up({ date: e.target.value })} required /></Field>
          <Field label="Start"><input type="time" value={f.start || ""} onChange={(e) => up({ start: e.target.value })} /></Field>
          <Field label="End"><input type="time" value={f.end || ""} onChange={(e) => up({ end: e.target.value })} /></Field>
        </div>
        <Field label="Who"><WhoPicker value={f.who || EVERYONE} people={people} onChange={(who) => up({ who })} /></Field>
        <Field label="Repeats">
          <select value={f.repeat || "none"} onChange={(e) => up({ repeat: e.target.value as Repeat })}>
            <option value="none">Doesn't repeat</option>
            <option value="weekly">Every week</option>
            <option value="monthly">Every month</option>
            <option value="yearly">Every year (birthdays, anniversaries)</option>
          </select>
        </Field>
        <Field label="Notes"><input value={f.note || ""} onChange={(e) => up({ note: e.target.value })} placeholder="Address, link, anything" /></Field>
        <div className="actions">
          {f.id && <button type="button" className="btn ghost danger" onClick={() => { actions.deleteEvent(f.id!); onClose(); }}>Delete</button>}
          <button type="submit" className="btn primary">Save</button>
        </div>
      </form>
    </Sheet>
  );
}

export type TodoDraft = Partial<Todo>;

export function TodoSheet({ draft, people, onClose }: { draft: TodoDraft | null; people: Person[]; onClose: () => void }) {
  const [f, setF] = useState<TodoDraft>({});
  useEffect(() => { if (draft) setF({ who: EVERYONE, ...draft }); }, [draft]);
  const up = (p: Partial<TodoDraft>) => setF((x) => ({ ...x, ...p }));
  const save = () => {
    if (!f.title?.trim()) return;
    actions.saveTodo({ id: f.id, title: f.title.trim(), date: f.date || undefined, who: f.who || EVERYONE, note: f.note?.trim() || undefined });
    onClose();
  };
  return (
    <Sheet open={!!draft} title={f.id ? "Edit to-do" : "New to-do"} onClose={onClose}>
      <form className="form" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="What needs doing"><input autoFocus value={f.title || ""} onChange={(e) => up({ title: e.target.value })} placeholder="Call the landlord" required /></Field>
        <Field label="Who"><WhoPicker value={f.who || EVERYONE} people={people} onChange={(who) => up({ who })} /></Field>
        <Field label="When (leave empty for someday)"><input type="date" value={f.date || ""} onChange={(e) => up({ date: e.target.value })} /></Field>
        <Field label="Notes"><input value={f.note || ""} onChange={(e) => up({ note: e.target.value })} placeholder="Optional" /></Field>
        <div className="actions">
          {f.id && <button type="button" className="btn ghost danger" onClick={() => { actions.deleteTodo(f.id!); onClose(); }}>Delete</button>}
          <button type="submit" className="btn primary">Save</button>
        </div>
      </form>
    </Sheet>
  );
}
