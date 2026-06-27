# Policy Compass

A political compass test you play by **swiping**. You're the deciding vote on a docket of **real bills** — drawn from parliaments and regimes across the world and across history, each **stripped of its sponsor**. Swipe right to **Ratify**, left to **Strike Down**. When the docket closes, the floor reads your record and places you on a single **Communist ◀──▶ Fascist** spectrum across five policy domains, naming the leaders and parties your votes echo.

No party labels while you vote. Just the policy: the problem it targets, what it offers, its stated intent, and the case for and against.

## How it works

### The cards
Each bill is a full-screen dossier: the **Current Problem** (with a real, sourced data exhibit), the **Offer**, the **Intent**, **Key Figures**, and **What the Analysts Say** — a balanced for/against case argued *ex-ante* (as it stood before the decision), with footnoted sources. The sponsor stays hidden; you judge the policy on its merits.

### The engine (Bayesian adaptive)
Five axes — **Economic, Fiscal, Social, Identity & Nation, Law & Order** — each scored on one Communist(−1)↔Fascist(+1) spectrum.

Every bill carries hidden, calibrated weights: which axis it loads on, which direction a *yes* implies, how extreme, and how sharply it discriminates. Per axis the app keeps a posterior over your latent position and updates it with each swipe via a logistic (2-parameter IRT) model. The **mean is your position; the spread is the variation band.** The deck is **adaptive**: it serves the bill that most shrinks your least-certain axis, so it follows you out toward the tails. The pool holds ~107 bills; a session serves ~25, and never repeats a law within a run.

### The verdict
A dossier ledger: a headline standing plus five zoned spectrum bars with hover party context, a named **archetype**, the **leaders** and **parties** your record echoes (by 5-axis distance), a per-axis breakdown of what moved you most, a full **Paper Trail** of every vote, and a **shareable** result (copy link or save image).

## The data pipeline

The deck is not hand-written — it's generated and quality-controlled by multi-agent workflows, then baked into the bundle:

1. **Authoring** — agents web-research real bills across the spectrum (including historical extremes), writing neutral, sponsor-blind copy with real sources and data exhibits.
2. **Adversarial calibration** — a blind panel independently scores each bill's ideological weights and fact-checks the sources; weights are reconciled by median.
3. **Plain language** — archaic units and jargon (e.g. `9d`, `cwt`, "Gini coefficient") are glossed for a general audience.
4. **Ex-ante analysts** — the for/against case is rewritten as arguments and predictions, never spoiling how the policy actually turned out, and favouring constructive alternatives over vague hedges.
5. **Dedupe + controversy** — duplicates are removed and one-sided cards replaced with genuinely contested ones where thoughtful people disagree.

Reference data (real leaders, parties, archetype prototypes, zone labels) is web-grounded with 5-axis vectors. See `docs/DESIGN.md` for the full spec and `docs/bills-audit.json` for per-bill calibration provenance.

## Tech

React 18 · TypeScript · Vite · Framer Motion (swipe physics) · Recharts (exhibits). No backend — the deck and engine run entirely client-side, with runs persisted to `localStorage` (versioned so deck changes never break old runs).

```bash
npm install
npm run dev        # local dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

## Project structure

```
src/
  types.ts            # core domain + scoring contracts
  engine/             # posterior, adaptive selection, scoring, session
  data/               # bills, leaders, parties, archetypes, zone labels, version
  hooks/              # useRun (session + persistence), useSwipe
  lib/                # share links, result image, storage, highlighting
  components/
    charts/           # registry-based exhibit charts (bar/line)
    bill/  deck/       # the dossier card + swipe deck
    verdict/  screens/ # verdict ledger, home, shared-standing
  styles/             # dossier theme + responsive overrides
docs/                 # design spec + calibration audit
```

## Disclaimer

Bills are real policies presented for reflection, not endorsement. Ideological placements are best-effort, adversarially-reviewed estimates — a conversation starter, not a verdict on anyone's worth.
