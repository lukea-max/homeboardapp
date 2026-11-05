# HomeBoard — product brief

## The idea
Most households run their week across five apps: a shared calendar, a notes app for groceries, a group text for "what's for dinner", a banking app, and memory. HomeBoard puts the everyday stuff on one good-looking board that everyone in the home actually opens.

## Who it's for (decided)
One app, three kinds of households. You pick yours at sign-up and the board sets itself up for you; everything can be changed later.

| Household | Board starts with | Language tweaks |
| --- | --- | --- |
| **Couple** | Today, week, shared to-dos, dinner plan, groceries, date ideas | "us", partner colors |
| **Family** | Today, week, to-dos/chores per person, meal plan, groceries | kids as people with their own color |
| **Student / roommates** | Today, classes & deadlines, to-dos, budget, shared groceries & bills | "classes", "split" |

Positioning: **"the fridge whiteboard, upgraded."** One shared board, not another productivity tool.

## Core principles (decided)
1. **Your board, your way.** Every section is a module you can switch on or off in Settings, and the home board is made of widgets you can drag to reorder or hide.
2. **Budget is optional.** Off by default for couples and families, on for students. Lives in Settings → Modules.
3. **Same look as the original board.** Monthly color-block poster themes, frosted acrylic glass cards, dry-erase handwriting for content. Twelve monthly palettes plus "follow the season".
4. **Phone first.** Designed at 390px, scales up to iPad and desktop.

## v1 scope
1. **Board** (home): customizable widgets — today, today's plan, this week, to-dos, meals, groceries, budget.
2. **Calendar**: month grid with per-month theme, any month/year, holidays, birthdays (yearly repeat), per-person color.
3. **To-dos**: assign to a person or everyone, optional date, "someday" bucket.
4. **Meals**: week plan (dinner only, or breakfast/lunch/dinner in Settings).
5. **Groceries**: one shared list, check off while shopping, clear checked.
6. **Budget** (optional module): log spending by category, weekly budget bar.
7. **Settings**: household type, people & colors, modules on/off, board layout, theme.

Later: invite partner/family by link with live sync (Supabase), push reminders, receipt scanning, date ideas, multiple shopping lists, App Store wrap.

## How it ships
- **Installable web app (PWA)**: one link works on iPhone, Android, iPad and desktop; "Add to Home Screen".
- **Stack**: React + Vite + TypeScript, plain CSS design system. Data is local-first (`localStorage`) behind a small store so it can move to Supabase (auth, Postgres, realtime, row-level security per household) without touching screens. Host on Netlify or Vercel.
- **App stores later** via Capacitor once there's traction.

## Pricing (decided: freemium, with a subscription upgrade)
- **Free forever**: 1 household, up to 2 people, all core modules, 3 themes.
- **HomeBoard Plus — $3.99/mo or $29.99/yr** (7-day free trial):
  - unlimited people (families, roommates), all 12 monthly themes
  - budget module with categories and reports
  - push reminders, receipt scanning, recurring chores
  - priority sync across unlimited devices
- Why subscription over one-time: sync and reminders cost money every month; yearly plan gives a ~37% discount to pull people into annual.

## Open questions
- Name: keep "HomeBoard"? (check app-store and domain availability before launch)
- Should kids get a simplified "kid view" in the family plan?
