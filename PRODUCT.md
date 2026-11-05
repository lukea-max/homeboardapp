# HomeBoard — product brief

## The idea
Most households run their week across five apps: a shared calendar, a notes app for groceries, a group text for "what's for dinner", a banking app, and memory. HomeBoard puts the everyday stuff on one good-looking board that everyone in the home actually opens.

## Who it's for (decided)
Anyone who shares a home or a schedule — couples, families, students, roommates. **The app never asks which group you are.** People downloaded it for their own reason; sign-up only asks for a board name, who's on it, and which sections they want.

Positioning: **"the fridge whiteboard, upgraded."** One shared board, not another productivity tool.

## Core principles (decided)
1. **Your board, your way — set up in Settings.** Every section is a module you can switch on or off, and the board's widgets can be dragged to reorder or hidden. All of this lives in **Settings → Your board**, so the Board tab stays clean: only today's, day-to-day info.
2. **Budget is optional.** Off by default; one switch in Settings → Sections.
3. **Same look as the original board, new color every month.** The 12 color-block poster calendars (JAN pink, FEB blue, MAR green, APR teal, MAY orange, JUN yellow, JUL lime, AUG powder blue, SEP purple, OCT amber, NOV deep teal, DEC red) are the palette inspiration. "Seasonal" is the default, so the board changes color every month. Frosted acrylic glass cards, dry-erase handwriting for content.
4. **Phone first.** Designed at 390px, scales up to iPad and desktop.

## v1 scope
1. **Board** (home): customizable widgets — today, today's plan, this week, to-dos, meals, groceries, budget.
2. **Calendar**: month grid with per-month theme, any month/year, holidays, birthdays (yearly repeat), per-person color.
3. **To-dos**: assign to a person or everyone, optional date, "someday" bucket.
4. **Meals**: the whole week at a glance, one row per day with breakfast, lunch and dinner columns (like the original board). Any column can be hidden in Settings.
5. **Groceries**: one shared list, check off while shopping, clear checked.
6. **Budget** (optional module): log spending by category, weekly budget bar.
7. **Assistant** (its own tab): tell it what's going on in plain words ("dentist Tuesday at 3, tacos tomorrow, add tortillas") and it proposes calendar events, to-dos, meals, grocery items and expenses. Nothing is added until you tap "Add to board". Runs on Claude through Netlify AI Gateway (`netlify/functions/assistant.mts`, rate-limited per visitor).
8. **Settings** (gear in the header): your board layout, sections on/off, people & colors, theme.

Later: invite partner/family by link with live sync (Supabase), push reminders, receipt scanning, date ideas, multiple shopping lists, App Store wrap.

## How it ships
- **Installable web app (PWA)**: one link works on iPhone, Android, iPad and desktop; "Add to Home Screen".
- **Stack**: React + Vite + TypeScript, plain CSS design system. Data is local-first (`localStorage`) behind a small store so it can move to Supabase (auth, Postgres, realtime, row-level security per household) without touching screens. Host on Netlify or Vercel.
- **App stores later** via Capacitor once there's traction.

## Pricing (decided: freemium, with a subscription upgrade)
- **Free forever**: 1 board, up to 2 people, all core sections, seasonal theme (changes monthly) + 3 fixed themes.
- **HomeBoard Plus — $3.99/mo or $29.99/yr** (7-day free trial):
  - unlimited people, pin any of the 12 monthly themes
  - budget module with categories and reports
  - unlimited assistant messages (free plan gets a monthly allowance), push reminders, receipt scanning, recurring chores
  - priority sync across unlimited devices
- Why subscription over one-time: sync and reminders cost money every month; yearly plan gives a ~37% discount to pull people into annual.

## Open questions
- Name: keep "HomeBoard"? (check app-store and domain availability before launch)
- Should kids get a simplified "kid view" in the family plan?
