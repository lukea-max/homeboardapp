# HomeBoard

A shared home board for couples and households: one calendar, one to-do list, one meal plan and grocery list, and a simple view of what you're spending — on every phone, tablet and laptop in the house.

> Status: **v1 in progress** — installable web app, data saved on the device. Accounts and live sync between phones come next. The original single-file prototype lives in [`reference/home-board-v1.html`](reference/home-board-v1.html) (all personal data removed). It was built to run inside Claude artifacts, so it won't save data when opened on its own — it's here as a design and feature reference only.

## What's in this repo

| Path | What it is |
| --- | --- |
| `src/` | The app |
| `reference/home-board-v1.html` | The original prototype: calendar with monthly themes, to-dos, meals, grocery trips with an estimated receipt, shopping lists, budget, date ideas |
| `PRODUCT.md` | Who this is for, what v1 includes, what we're cutting, and open questions |
| `CLAUDE.md` | Working notes for Claude Code on this project |

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## How it's built

- React + Vite + TypeScript, plain CSS (`src/styles.css`), fonts bundled with Fontsource.
- `src/store.ts` — all data and actions. Local-first (`localStorage`) today; swap the persistence layer for Supabase to add accounts and sync.
- `src/theme.ts` — the 12 monthly poster palettes. The calendar wears the theme of the month you're viewing.
- `src/screens/` — Board (customizable widgets), Calendar, To-dos/Meals/Groceries/Budget, Settings, Onboarding.
- PWA: `public/manifest.webmanifest` + `public/sw.js` so it can be added to the home screen and opens offline.
