# Policy Compass — Design

A swipe-driven political compass. The player is a legislator reviewing a docket of
**real bills** stripped of their sponsor. Swipe **right to Ratify (yes)**, **left to
Strike Down (no)**. Bills are drawn from across the world and across history. An
adaptive Bayesian engine reads the votes and, at the end, places the player on a
single **Communist ◀──▶ Fascist** spectrum across five policy domains and reveals
the real leaders and parties their record echoes.

## Aesthetic — "The Dossier"
Aged parchment on a dark desk; wax seals; red `CLASSIFIED`/`TABLED` stamps.
Type system: **Cormorant Garamond** (display), **EB Garamond** (body),
**Courier Prime** (labels/data), **Caveat** (handwritten margin notes).
Everything is full-screen and **never scrolls** — content is laid out to fit the
viewport as a broadsheet.

## The card (full-screen broadsheet)
- Kicker (`Bill Nº`), big title, dek question. No sponsor shown.
- **The Current Problem** — prose + an **Exhibit** data graphic (bar/line) sized to
  show how bad the problem is, with a handwritten annotation pointing at the key bar.
- **Key Figures** — 2–3 stat chips.
- **The Offer** / **The Intent**.
- **What the Analysts Say** — for / against, each point stat-led with a real,
  clickable source link.
- Red (left) / green (right) swipe gutters with the accent flush to the screen edge.
  Footer = just `Bill n / total`.

## The engine (Bayesian adaptive)
Five axes, all on Communist(−1)↔Fascist(+1): **economic, fiscal, social, identity,
law_order**. Each bill is hand-tagged + adversarially calibrated with one primary
(optional secondary) `AxisLoading { axis, direction, extremity 0..1, clarity 0.2..1 }`.

Per axis we keep a posterior grid over θ ∈ [−1,1].
`P(ratify|θ) = sigmoid(a·dir·(θ − dir·extremity))`, `a = 1.2 + clarity·2.8`.
Each swipe multiplies the grid by the likelihood and renormalises. **Mean = position,
std = the variation band.** Next bill = max Fisher information at the current mean on
the least-certain axis → the deck "follows you out to the tail" (extreme historical
bills exist precisely to measure genuine radicals). Pool ~50, serve ~25.

## The verdict
Full-screen dossier. Headline standing bar + five domain bars, each with seven dotted
zones, a shaded variation band, a pin, and **per-zone hover** showing the parties /
ideologies that sit there. Archetype title + blurb (nearest prototype). **Leader echo**
and **party echo** by % alignment (distance in 5-axis space). Tally + a **Paper Trail**
view (full-screen) replaying how each vote moved each axis.

## Data (baked into the bundle)
`src/data/bills.ts`, `leaders.ts`, `parties.ts`, `archetypes.ts`, `zoneLabels.ts` —
all real-world, web-researched, and (for bills) adversarially calibrated for unbiased
ideological placement. See `src/types.ts` for the exact contracts.

## Stack
React 18 + Vite + TypeScript + Framer Motion. Plain CSS (`styles/theme.css`).
