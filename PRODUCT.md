# HomeBoard — product brief (draft)

## The idea
Most couples run their household across five apps: a shared calendar, a notes app for groceries, a group text for "what's for dinner", a banking app, and memory. HomeBoard puts the everyday stuff in one calm, good-looking place that both people actually open.

## Who it's for (proposed — confirm)
- **Primary:** couples living together, 22–40, both on phones, no kids or young kids.
- **Secondary:** roommates and small families.
- **Job to be done:** "Help us know what's happening this week, who's doing what, and what we need — without nagging each other."

## What we learned from the prototype
Used daily by two people for about two weeks. What earned its place:
- **Today at a glance** (home screen): today's plans, reminders, meals.
- **Calendar** with color per person and simple month/week views.
- **Shared to-dos** with "someday" items (no due date).
- **Meal plan → grocery list**, with a fresh list per shopping trip.
- **Date ideas** list.

What was too much for most people:
- Full budget tracking with categories, receipts and card statements → move to a later "Spending" add-on, or drop.
- Receipt photo scanning (needs a paid AI API) → later.
- Per-meal ingredient lists, aisle sorting, estimated receipt → nice extras, not v1.
- Monthly poster themes → keep **one** signature look plus a seasonal accent, not 12 themes.

## v1 scope (proposed)
1. **Today** — one screen: today's events, to-dos, tonight's dinner, next 3 days.
2. **Calendar** — month + agenda views, color per person, repeating events, birthdays and holidays.
3. **To-dos** — shared list, assign to a person or both, optional date, "someday" bucket.
4. **Meals & groceries** — plan dinners for the week; one tap adds items to the grocery list; check off while shopping.
5. **Household** — invite your partner with a link; both see changes live.
6. **Reminders** — push notifications for events (1 day / 1 hour before) and dated to-dos.

Out of v1: budget, receipt scanning, date ideas (fast follow), multiple households.

## How it ships (proposed)
- **Installable web app (PWA)** first: works on iPhone, Android, iPad and desktop from one link, "Add to Home Screen", no App Store review. Wrap with Capacitor later for the App Store / Play Store if traction justifies it.
- **Stack:** React + Vite + TypeScript + Tailwind, Supabase (auth, Postgres, realtime sync, row-level security per household), hosted on Netlify or Vercel. Web push for reminders.
- **Pricing idea:** free for 1 household; premium ($3–5/mo) for themes, budget add-on, receipt scanning.

## Open questions for Luke
1. Who exactly is the target user — couples only, or families/roommates too?
2. Must-have for v1: which of the 6 above, and anything missing?
3. Keep budget tracking at all? (cut, later add-on, or v1)
4. Look and feel: calm/neutral pastel, bold poster style, or something new?
5. Name: keep "HomeBoard"?
6. Free, paid, or freemium?
