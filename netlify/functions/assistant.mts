import Anthropic from "@anthropic-ai/sdk";
import type { Config } from "@netlify/functions";

/**
 * HomeBoard assistant. The app sends the chat so far plus a snapshot of the board;
 * Claude answers in plain words and proposes changes as tool calls. Nothing is
 * written here: the app shows the proposed changes and the user taps to apply them.
 * Credentials come from Netlify AI Gateway (ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL).
 */

const WHO = { type: "string", description: "A person's name exactly as listed in PEOPLE, or \"everyone\" when it's for the whole household or unclear." };
const DATE = { type: "string", description: "YYYY-MM-DD. Resolve words like today, tomorrow, Friday, next week from TODAY." };
const TIME = { type: "string", description: "24-hour HH:MM. Omit for all-day." };

const tools: Anthropic.Tool[] = [
  { name: "add_event", description: "Put a plan, appointment, meeting, trip, bill due date, birthday or anything with a date on the calendar.",
    input_schema: { type: "object", properties: { title: { type: "string" }, date: DATE, start: TIME, end: TIME, who: WHO, repeat: { type: "string", enum: ["none", "weekly", "monthly", "yearly"], description: "yearly for birthdays and anniversaries" }, note: { type: "string" } }, required: ["title", "date"] } },
  { name: "update_event", description: "Change an existing calendar event (move it, rename it, change the time). Use the id from EVENTS.",
    input_schema: { type: "object", properties: { id: { type: "string" }, title: { type: "string" }, date: DATE, start: TIME, end: TIME, who: WHO, note: { type: "string" } }, required: ["id"] } },
  { name: "delete_event", description: "Remove a calendar event that was cancelled. Use the id from EVENTS.",
    input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  { name: "add_todo", description: "Add a task or reminder. Leave date empty for 'whenever' / someday items.",
    input_schema: { type: "object", properties: { title: { type: "string" }, date: DATE, who: WHO, note: { type: "string" } }, required: ["title"] } },
  { name: "complete_todo", description: "Mark a to-do as done. Use the id from TODOS.",
    input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  { name: "set_meal", description: "Plan or record a meal. Use an empty name to clear a slot. Swapping two meals is two calls.",
    input_schema: { type: "object", properties: { date: DATE, slot: { type: "string", enum: ["breakfast", "lunch", "dinner"] }, name: { type: "string" } }, required: ["date", "slot", "name"] } },
  { name: "add_groceries", description: "Add items to the shared grocery list. Short item names, one per entry.",
    input_schema: { type: "object", properties: { items: { type: "array", items: { type: "string" } } }, required: ["items"] } },
  { name: "check_off_groceries", description: "Mark grocery items as bought, by name as they appear in GROCERIES.",
    input_schema: { type: "object", properties: { items: { type: "array", items: { type: "string" } } }, required: ["items"] } },
  { name: "log_expense", description: "Record money spent (receipts, card charges). Only when the budget section is on.",
    input_schema: { type: "object", properties: { label: { type: "string" }, amount: { type: "number" }, category: { type: "string", enum: ["Groceries", "Dining out", "Shopping", "Transport", "Bills", "Fun", "Other"] }, date: DATE }, required: ["label", "amount", "category", "date"] } },
];

const SYSTEM = `You are the helper inside HomeBoard, a shared household board (calendar, to-dos, meals, groceries, optional budget).
People tell you about their plans in everyday language, often several things in one message. Turn everything they mention into tool calls in the same reply: one call per event, to-do, meal or grocery batch. Do not ask for permission; the app shows your proposed changes and the person taps to apply them.

Rules:
- Resolve relative dates from TODAY and the weekday given. "Tonight" is today's dinner. "This weekend" is the coming Saturday.
- Assign "who" from context ("my mom's birthday" is everyone's; "I have a dentist appointment" is the speaker, who is the first person in PEOPLE unless they say otherwise).
- Things to buy go on the grocery list; things to do go in to-dos; things happening at a time or on a day go on the calendar.
- Things with no date ("whenever we get to it", Amazon orders) are to-dos with no date.
- When someone says what they ate, record it with set_meal. If a planned meal moves to another day, clear the old slot and set the new one.
- Only use update/delete/complete with ids that exist in the snapshot. Never invent ids.
- Only call log_expense if BUDGET is on.
- If something is genuinely ambiguous (no day at all for an appointment), make the sensible guess and say so, or ask one short question instead of guessing wildly.
- After the tool calls, reply in 1-3 short, warm sentences saying what you set up. No lists, no markdown headings.
- If they ask a question about their schedule, answer from the snapshot.`;

interface Body { messages?: { role: "user" | "assistant"; content: string }[]; context?: unknown }

export default async (req: Request) => {
  if (req.method !== "POST") return Response.json({ error: "Use POST" }, { status: 405 });
  if (!process.env.ANTHROPIC_BASE_URL && !process.env.ANTHROPIC_API_KEY)
    return Response.json({ error: "The assistant isn't switched on for this site yet." }, { status: 503 });

  let body: Body;
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  const messages = (body.messages || [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user")
    return Response.json({ error: "Say something first" }, { status: 400 });
  const snapshot = JSON.stringify(body.context ?? {}).slice(0, 60000);

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: process.env.HOMEBOARD_MODEL || "claude-haiku-5-5",
      max_tokens: 2048,
      system: [{ type: "text", text: SYSTEM }, { type: "text", text: `BOARD SNAPSHOT (JSON):\n${snapshot}` }],
      tools,
      messages,
    });
    const reply = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n").trim();
    const actions = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use").map((b) => ({ tool: b.name, input: b.input }));
    return Response.json({ reply, actions });
  } catch (e) {
    console.error("assistant error", e);
    return Response.json({ error: "The assistant couldn't answer right now. Try again in a moment." }, { status: 502 });
  }
};

export const config: Config = {
  path: "/api/assistant",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 15 },
};
