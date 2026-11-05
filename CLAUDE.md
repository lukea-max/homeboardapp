# HomeBoard — notes for Claude Code

- Product decisions live in `PRODUCT.md`. Update it when Luke decides something.
- `reference/home-board-v1.html` is a read-only design reference (a single-file prototype that depended on Claude-artifact storage APIs). Borrow ideas and visuals from it; do not build on top of it.
- Never put real household data (names, addresses, receipts, card numbers) in the repo or in seed data. Use obviously fake sample data.
- Mobile-first: design every screen at 390px wide first, then tablet and desktop. Tap targets ≥ 44px.
- Keep v1 small. If a feature isn't in the v1 list in `PRODUCT.md`, ask before building it.
