# Terms — Design Spec

A political-career roguelike, a sibling mode to the Policy Compass test. The player is a
newly elected member of a fictional-but-grounded Republic's House. Runs are curated,
choose-your-own-story careers: survive terms, climb offices, and be remembered. Every
piece of legislation is a **real bill** from the existing calibrated pool; everything
fictional (blocs, crises, scandals, characters) is a **composite of documented history
and cites its precedents** the way bills cite sources.

> Revision 2 — incorporates the three-lens design review (systems/exploits, codebase
> feasibility, player experience). Tuning constants here are the source of truth;
> `scripts/terms-audit.mts` and `scripts/terms-sim.mts` are the acceptance gates.

Design pillars:

1. **Real bills only.** The fiction lives in the connective tissue, never in legislation.
2. **Failure is systemic.** No event kills the player directly; only state ends a career —
   with one earned, foreshadowed exception (§ Scandals).
3. **Legislation is swiped, life is answered.** Bills keep the broadsheet + swipe. Events
   are paper artifacts (telegram, front page, whip note, letter) and are tapped.
4. **Your vote is not the outcome.** The House passes bills, not the player. Expression
   (what the compass reads) and power (what changes the Republic) are separate currencies.
5. **The instrument becomes an antagonist.** The posterior that scores the test watches
   the player: the Republic remembers who you've been.
6. **Punish with attribution.** Every hidden-state delta that matters surfaces on the next
   paper artifact with its cause named. Numbers live behind paper, but thresholds are
   printed beside figures ("Confidence 24 — the whips talk at twenty").

Difficulty target: a first-time player should die in roughly half of runs; an informed
defensive player should still lose ~15%. `scripts/terms-sim.mts` (§ Acceptance) checks
this against scripted voter profiles.

## Run shape

One scenario ships in v1: **"The Member for Halloway"** (§ Scenario). A run is a career of
up to three terms, ~10–15 minutes:

```
Prologue  — the returning officer's letter: pick a party (3), pick a seat (safe/marginal)
Term I    — The Backbench   (8 bills + ~3 events)  → Election night
Branch    — promotion offer: Treasury / Home Office / refuse the whip (the Wilderness)
Term II   — The Ministry / The Wilderness (8 bills + ~3 events) → Election night
Branch    — leadership contest against the rival, or loyal service
Term III  — The House at Bay (8 bills + ~3 events, full whip powers)
Epilogue  — History's verdict: the obituary, filed to the Archive
```

Runs are **event-sourced**: persistence stores `{ seed, scenarioId, schemaVersion,
billsVersion, setup, actions[] }` and resumes by replaying actions through the pure
reducer (the `rebuildSession` pattern). Refreshing mid-run cannot reroll anything because
**every roll is derived statelessly**: `roll = mulberry32(hash(seed, tag))()` where `tag`
names the draw site and docket position (e.g. `"hesitant:12:national"`,
`"scandal:17"`). No PRNG cursor exists to desync; reducers stay pure under StrictMode
double-invocation. Runs and archive entries are stamped with `TERMS_SCHEMA_VERSION` and
`BILLS_VERSION`; a mismatched resume is dropped with an in-fiction notice (obituaries are
self-contained snapshots and always readable).

## State model (the numbers game)

All simulation state lives in `TermsState`; every transition is a pure reducer.

- **Trust** `0–100` (start 55). At `< 20` the **ultimatum** fires (recover to ≥ 30 within
  the term, else vote of no confidence). Moves: promise kept `+2..8` scaled by
  improbability (§ Promises), broken `−14`; mood-matched division `+1` (cap; this faucet
  is deliberately weak); election won `+6`; **per-term decay `−4`** applied at each
  election ("the shine wears off") so passivity is not shelter; whip-note defiance `−2`
  (the party briefs against you); Emergency Whip `−4`; scandal/event outcomes per card.
- **Blocs.** 3 founding + 2 emergent. Each: 5-axis vector, `seats`, `relations −100..100`,
  `fervour 0–3` (fractional internally). Fervour ≥ 2 generates unrest events; the
  revolution check is § Endings. **Appeasement symmetry:** relation gains from
  *events, promises, and negotiation* (never routine division drift) apply `+0.25`
  fervour to the axis-opposite bloc; the centrist Reform Union's pressure lands on
  whichever flank currently holds the highest fervour. **Fervour decays** `−0.5` per
  election survived, and some telegrams sell a cooling option at a trust/treasury price —
  unrest is a state the player can climb out of.
- **Zeitgeist.** National `AxisVector` (scenario start values). Every **passed** bill
  shifts its loaded axes by `direction · extremity · 0.15` (secondary loading
  half-weight); major telegram/branch options move it directly (`±0.08–0.12`, authored).
  Crossing `|axis| ≥ 0.25` on economic or identity **spawns** that pole's radical bloc
  (once per pole per run) with **12 seats** taken from founding blocs by largest-remainder
  in proportion to ideological adjacency; the spawn fires an authored "NEW PARTY FOUNDED"
  front page.
- **Conviction** `0–100` (start 70), the self-consistency meter. Scored against the
  posterior **snapshot taken before the vote's own update**: when
  `P(vote | pre-vote mean) < 0.35` on the primary axis, apply
  `−round(9 × max(certainty, 0.4))` — no hard certainty gate, so incoherence always
  costs and costs more once the record is established. Voting in line at certainty > 0.55
  recovers `+2` (cap 100; "in line" means clearly so — `P(vote | mean) ≥ 0.65` — so
  coin-flip votes neither pay nor recover). The spouse's letters are the only event-driven recovery
  (`+5` — tuned down from +10 after simulation showed four letters refunding a
  coin-flip voter's entire weathervane drain). Consequences: `< 40` worsens scandal gambles and election swing (−3); `≥ 70`
  slows expulsion (§ Endings) and softens the party's briefing (defiance trust cost −1
  instead of −2). Every weathervane hit is attributed: the next result slip carries the
  sketch-writer's line ("They say the Member has turned his coat") and the ledger prints
  the figure.
- **Treasury** `0–100` (start 50). Curated fiscal/economic bills carry a **mandatory
  authored treasury delta** in scenario data (sized so a spendthrift or slash-and-burn
  record moves ~±30/run); adaptive fills use the derived fallback (fiscal loading,
  `dir · extremity × 8`). Events both threaten and spend it (bail out the bank −20;
  refuse: +1 fervour, −trust). At `< 15` the fiscal-crisis telegram schedules.
- **Promises.** Slots: 3 (marginal seat: 4). Max 1 per bloc. Fulfilling pays scaled by
  improbability: `reward = round(8 × (1 − P(player would have voted that way | posterior)))`,
  min `+1` trust — promising what you'd do anyway is worth almost nothing; promising
  against your record pays fully **and** arms the weathervane when you deliver. Breaking:
  `−14` trust, `−30` relations, `+1` fervour, and a permanent `grudge` (halves future
  relation gains with that bloc). Ledger rows print "falls due in N divisions".
- **Office.** `backbencher → minister(portfolio) → leader`. Gates agency (§ The floor).

## The floor (divisions)

The House seats 100: 99 bloc seats + the player (the player's party fields
`seats − 1`). The player's swipe is their **vote** — always recorded, always read by the
compass posterior. Passage is resolved around them:

- **Stance** (side-based, not IRT-threshold — the review proved threshold semantics pass
  ~0 of the real pool): per bloc,
  `stance = sigmoid(a · (dir · θ_bloc − β · extremity + c))` with `θ_bloc` the bloc's
  position on the loaded axis, `a = 3.2`, `β = 0.35`, `c = 0.15` (secondary loadings at
  half weight). Validated on the real pool: ~37/107 passable, ~47/107 contested (±8),
  ~23/107 near-knife-edge.
- Seats vote For (stance > 0.62) / Against (< 0.38) / Hesitant (between). Hesitant seats
  break individually by stateless seeded roll weighted by stance.
- **Knife-edge** divisions (projected margin ≤ 2 without the player) are decided by the
  player, and the stage is dressed **before** the swipe ("The chamber is full. The chair
  will look to Halloway."). Pipeline order per bill:
  `project → whip note? → negotiation? → knife-edge dressing? → swipe → slip`.
  `floor.projectDivision()` is computed pre-vote and consumed by the shell.
- **Agency by office:** backbencher — vote only, **except** blocs approach even a
  backbencher when their one seat decides it (projected knife-edge); minister — may
  negotiate with one bloc per contested division; leader — negotiates freely + once per
  term an **Emergency Whip** (forces party hesitants, −4 trust).
- **Negotiation** (pacing budget: offers trigger on at most 2 divisions per term — the
  tightest projected margins). The bloc's demand is drawn from upcoming curated bills
  **where the bloc's stance opposes the player's current posterior lean** — they ask for
  what you would not otherwise give. Accept (enter the promise in the ledger) or walk
  away free.
- **Whip notes** (max 2 per term; Act I's first is authored on bill 2). A whip-note
  division always costs something: defy — party relations `−(8+4·extremity)` doubled on a
  safe seat, trust `−2`, and a **defiance strike**; obey against your own posterior —
  weathervane exposure. Three strikes in one term convene an expulsion vote (§ Endings).
- **Result slips are tiered** (pacing): lopsided divisions get a one-line ribbon
  (`AYES 61 · NOES 38 — PASSED`, stamp only); contested, knife-edge, whip-named and
  promise-relevant divisions get the full slip — two ledgers side by side: **The Record**
  (your vote: relations tone, conviction mark, sketch-writer line) and **The Republic**
  (passage: zeitgeist drift, treasury figure). The full slip is the mode's teaching beat
  for pillar 4.

Only **passed** bills move zeitgeist/treasury. Relations always move (blocs judge your
vote, not the outcome): `±(4 + 4·extremity)` per bloc, doubled for your party on
whip-note bills. Abstention (the deck may gain the gesture when `feat/engagement`
merges): no posterior update, no conviction change, relations at half weight, and the
player's seat is absent on knife-edges — the chair notes it acidly. The v1 wrapper maps
only ratify/strike; the adapter (§ Architecture) owns the translation.

## Events (paper artifacts)

Events interleave the docket at authored positions or fire systemically from state. All
tapped, 2–3 options, each an artifact on the **PaperArtifact chassis** (§ Architecture).
**Every authored event carries a `precedents` footnote** — the real episodes it
composites, rendered like bill sources (on mobile, on the verso: tap the folded corner).

| Genre | Artifact | Trigger | Role |
|---|---|---|---|
| Crisis | **Telegram** — torn paper, urgent mono, reply slips | authored + systemic (treasury < 15, fervour ≥ 2) | Big trades; meter repair at a price; direct zeitgeist movers |
| Scandal | **Front page** — morning paper, statement drafts | seeded schedule + conviction/trust gates | Risk management (§ Scandals) |
| Party pressure | **Whip's note** — handwritten card before a named division | authored (first) + systemic | Telegraphs the priced choice on the next swipe |
| Personal | **Letter** — read at night, no figures shown | keyed to state flags | Only conviction recovery (+5); tone anchor |
| Mandate | **Patron's card** — an offer of backing | authored positions | Run-modifier relics (max 2 held, pinned in the ledger) |
| World | **Front page** — "NEW PARTY FOUNDED" | radical-bloc spawn | The run's biggest world event gets its beat |

**Scandals** resolve by stateless seeded gamble weighted by conviction, trust and mandate
bonuses. Options are variants of: **face it** (high conviction → vindication),
**hush it** (safe now: −conviction, plants a buried counter — the option copy states the
risk at choice time: "The editor keeps the affidavit in his safe", and the buried item
renders in the ledger as a redacted clipping), or **resign the whip** (guaranteed office
demotion). A second hush **detonates** — both stories break stacked; the one sanctioned
event death (`DISGRACED`), fully foreshadowed.

**Mandates:** press baron (softens scandal rolls, permanently reserves a promise slot);
union compact (+relations on economic-left divisions, strikes at the second cross);
industrialists' trust (+treasury cushion, −relations with Labour on acceptance). Effects
are declarative `MandateHooks`.

**First-run marginalia (onboarding).** One-shot handwritten notes (Caveat, the product's
marginalia idiom), gated by seen-flags in state: the prologue letter explains party and
seat **in words**; the whip's welcome note explains relations; the first result slip
carries "The House passes bills, not you — but the record is yours"; an authored
pollster's-memo event after bill 2 opens the ledger and teaches where the numbers live;
the spouse's first letter introduces conviction. Six strings, no new screens — and it
directly counters the test's "you are the deciding vote" framing, which is the exact
wrong mental model here.

## Elections (the boss fight)

Term end → **Election Night**, a seeded sequence of result slips (bloc by bloc, then the
player's own count — no bespoke animated screen).

- **National swing** per bloc: `score = 12 · alignment(zeitgeist, bloc) − 2 · fervour +
  treasuryTerm` (±4 for blocs aligned with the sitting arrangement); the 99 bloc seats are
  reapportioned **zero-sum by largest-remainder** over scores.
- **Personal seat**: margin `M` (safe 8, marginal 2). Points:
  `personal = partySwingPoints + (trust − 50)/8 + (conviction < 40 ? −3 : 0) − defiancesThisTerm`
  where `partySwingPoints = (partySeatsAfter − partySeatsBefore) / 2`. **Hold iff
  `personal + M > 0`.** The returning-officer's note itemises every term in words with
  small printed figures — the boss fight ends legibly.
- Seat choice is a real tradeoff, stated on the prologue letter: **safe** = the party's
  machine seat (M 8, but whip defiance relations penalty doubled); **marginal** = your own
  ground (M 2, +1 promise slot, half whip weight).
- Survive → trust +6, fervour −0.5 all blocs, trust decay −4, next term's branch letter.

## Endings & the obituary

All systemic: `DEFEATED` (personal + M ≤ 0), `NO CONFIDENCE` (ultimatum failed),
`EXPELLED` (expulsion vote: 3 whip-defiance strikes in a term — conviction ≥ 70 grants a
fourth strike — or party relations ≤ −60; the high-conviction relations floor is **−45**,
slowing, never preventing), `REVOLUTION` (a radical bloc at fervour 3 with > 20 seats and
zeitgeist |axis| ≥ 0.40), `DISGRACED` (the earned detonation), `RETIRED WITH HONOURS`
(survive all three terms).

The **obituary** (one full-screen dossier): stamp, career timeline, 3 signature divisions
(highest |relations+conviction| impact), the compass verdict from the run's real votes
(archetype + leader/party echo via the existing verdict engine), cause of death, epitaph
assembled from record facts, and brag figures (terms survived, divisions on the winning
side, promises kept/broken, scandals survived). Careers ended in Term I render the
**CUT SHORT** variant: the verdict speaks in the variation-band idiom ("the record was
too thin to read") and epitaph fragments key to terms served. Actions: **File to
Archive**, **copy link** (own `#t=` hash namespace: seed, party, seat, branch picks,
ending, verdict summary — decoded by a read-only SharedObituary view with a
"same seed — take office" challenge CTA), **save image** (dossier PNG via a
terms-specific canvas layout).

**The Archive**: a filing cabinet of completed careers (localStorage
`policy-compass.terms.archive`, schema- and bills-versioned, self-contained snapshots),
browsable via the CaseFiles row pattern rendering the same Obituary component. No
vertical power creep; replay value is horizontal (party × seat × branches × seeds).

## Scenario v1 — "The Member for Halloway"

Nation-agnostic, timeless Republic (Westminster-ish furniture). All 24 curated docket
bills come from the existing pool, pinned as `{ billId, expectTitle }` — the pool is
machine-regenerated with positional ids, so `scripts/terms-audit.mts` **fails loudly** on
any id/title mismatch, and `BILLS_VERSION` is recorded on every run and archive entry.
Adaptive fill slots (2–3/term) draw from `pool − all curated ids (both branch variants)
− served ids`, scored by the existing Fisher-information math with a **seeded sample of
the top 3** (variety without breaking determinism). Docket audit acceptance bands per
run-path: 40–60% projected passage, ≥ 25% contested, 1–3 knife-edges.

**Founding blocs** (composites; blurbs cite real referents; vectors triangulated from
`parties.ts`):

- **The Labour Front** — left (economic −0.65, fiscal −0.55). 38 seats. Composite: UK
  Labour (1945), SPD, the trade-union movement.
- **The National Party** — right (economic +0.5, identity +0.45, law_order +0.4).
  40 seats. Composite: UK Conservatives, CDU, US mid-century GOP.
- **The Reform Union** — radical centre (social −0.35, fiscal +0.25). 22 seats (the
  kingmaker). Composite: UK Liberals, FDP, social-liberal parties.

**Emergent:** **The People's Vanguard** (far left; composite: militant syndicalism, early
Comintern parties) and **The Iron League** (far right; composite: interwar leagues — BUF,
Croix-de-Feu). Spawn by polarization only; each arrives with its authored front page.

**Authored beats.** Act I: the whip's welcome note (teaching beat); first whip-note
division on bill 2; a guaranteed knife-edge with a backbencher-reachable offer mid-act;
Lord Corran's mandate card (press baron; composite Beaverbrook/Hearst); the bank-run
telegram (composite 1907 Knickerbocker/Northern Rock) closing the act. Act II Treasury:
fiscal/economic docket + the currency-crisis telegram (composite 1931/Black Wednesday).
Act II Home Office: law_order/identity docket + the general-strike telegram (composite
1926). Act II Wilderness (refused the whip): conscience docket, double conviction stakes,
no negotiation. Act III: leadership contest against the rival (**Edmund Vane**, vector
sampled at distance from the player), then the war-scare telegram (composite July 1914 /
Suez) as the final gauntlet. The spouse (**Margaret/Edward Halloway**; composite of the
political-spouse memoir tradition: Clementine Churchill, Denis Thatcher) writes 4 letters
keyed to state flags.

Event library v1: **~20 authored events** — 6 telegrams, 4 scandal front pages, 2 spawn
front pages, 3 mandate cards, 4 letters, 1 ultimatum — plus systemic whip notes generated
from data.

## Dialogue scenes (the storyline layer)

Terms carries its story through **scenes** — short visual-novel-style conversations
between the player and the cast, played on the desk. A scene replaces a wall of letter
text wherever people would actually be talking; the **prologue is the first scene**: the
returning officer receives you, the three parties' whips each make their pitch (choosing
whom you shake hands with IS the party choice), and Margaret's aside frames safe-versus-
marginal as a conversation, not a form.

- **Presentation:** the speaking character's portrait stands on the desk as a clipped
  paper cutout (the Vanity Fair lithographs in `public/terms/cast/` — demo assets, see
  CREDITS.md), nameplate in Courier, one line at a time on a paper slip, tap/space to
  advance, choices render as the player's own reply slips. The player has no portrait;
  narrator lines render as unattributed stage direction in the margin hand.
- **Data:** `DialogueLine { speaker: characterId | 'narrator' | 'player'; text: string }`;
  `DialogueChoice { prompt: string; options: { id; label; detail?; effects?: EffectSet }[] }`;
  `DialogueScene { id: string; beats: (DialogueLine | DialogueChoice)[] }`. Scenes live in
  scenario data (`data/scenes.ts`), are staged like events (authored slots or state
  gates), and their choices can resolve setup decisions (party, seat), branch options, or
  plain EffectSets — one system, no parallel machinery.
- **v1 scope:** the prologue scene (party + seat resolved conversationally) and the
  election-night victory/defeat exchange with the returning officer — both presentation
  over existing state, no reducer changes, so event-sourcing is untouched (scene
  tap-through is not an action; only the terminal choices feed `start()` / `advance`).
  Margaret's post-scandal beat stays a letter in v1 and graduates to a scene next pass.
  Characters carry `portrait` paths into `public/terms/cast/`.
- Scene copy follows the tone rules: composites, dossier register, wit in character
  voice. Scenes are skippable (tap-through); no timing pressure.

## The desk (presentation & disclosure)

Terms is played on a desk, not in an app — and on a large screen the desk is wide.

- **Documents scale to the viewer.** Artifacts are sized like papers held close: on
  desktop a memo or front page stands ~55–70vh tall with body type ~1.3–1.5rem
  (EB Garamond) and hand annotations ≥1.15rem (Caveat is illegible small); dialogue
  portraits stand ~70vh with the spoken line on a wide slip (≤68ch, ~1.4rem). Type
  hierarchy keeps ≥1.25 scale steps. Mobile keeps the compact sizing.
- **Desk rails (≥1200px).** The political state is never a separate page on desktop.
  During run stages the centre paper is flanked by pinned index-card rails: left,
  **The House** — each bloc's seats, relations tone (word + small printed figure),
  fervour as temperature; right, **The Standing** — the pollster's figures beside
  their threshold lines ("Confidence 24 — the whips talk at twenty"), promises with
  falls-due counts, pinned mandates, redacted clippings. Rails are passive paper (no
  focus traps, no key handlers); rows that changed on the last division glow briefly.
  Below 1200px the rails collapse into the docket strip's tap-to-open ledger page.
- **The desk scales up, Frostpunk-style.** Nothing but the paper for the opening
  divisions; the Standing rail fades in when the pollster's memo arrives; the House
  rail when the whip first leans on you; promise rows with the first promise, mandate
  cards when held, clippings when buried. Disclosure derives from run state (events
  seen, promises held) — never wall-clock or component-local memory — so replays and
  resumes reveal identically.

## Architecture

New code is **additive**: no existing engine/component/style file is modified. The
compass test must behave identically.

**Concurrent-branch contract (`feat/engagement`).** That branch is rewriting shared
contracts (graded votes, abstain, `VoteRecord.verdict`, `SessionConfig`, a `Conviction`
type, `posterior.update(…, weight)`). Terms therefore: (1) consumes the deck only through
a single adapter in `shell/` mapping the deck's commit payload to Terms' own vote type —
a signature change on merge is a one-line fix; (2) defines abstain semantics now
(§ The floor) but ships the binary mapping; (3) names its meter **conviction score** and
exports no `Conviction` type; (4) treats `update()`'s eventual weight param as
defaulting to 1.

```
scripts/
  terms-audit.mts    # acceptance: curated ids/titles valid; passage/contested/knife-edge bands
  terms-sim.mts      # acceptance: voter-profile trajectories (turtle, coin-flip, firebrand,
                     #   party-liner, vote-seller) hit the difficulty & conviction targets
src/terms/
  types.ts           # all Terms contracts
  engine/
    rng.ts           # stateless rolls: mulberry32(hash(seed, tag))
    alignment.ts     # bloc-stance math (side-based form above) + zeitgeist alignment
    floor.ts         # projectDivision / resolveDivision: stances, hesitants, knife-edge, offers
    effects.ts       # tagged delta records {field, delta, cause} → attribution lines
    conviction.ts    # pre-vote posterior snapshot scoring (wraps engine/posterior)
    events.ts        # scheduling: authored slots + systemic triggers + gates + gambles
    election.ts      # swing scores, largest-remainder reapportionment, personal seat
    session.ts       # pure reducer + event-sourced replay (actions log)
    obituary.ts      # ending detection + obituary assembly (reuses engine/scoring)
  data/
    scenario.ts      # acts, slots {billId, expectTitle, whip?, treasury?}, branches
    blocs.ts  characters.ts  endings.ts
    events-telegrams.ts  events-frontpages.ts  events-personal.ts  mandates.ts
    events.ts        # barrel + gate wiring
  lib/
    storage.ts       # TERMS_SCHEMA_VERSION; versioned run + archive keys; drop-on-mismatch
    share.ts         # #t= namespace encode/decode (compass #r= untouched)
    obituaryImage.ts # dossier PNG canvas
  hooks/useTermsRun.ts
  components/
    TermsApp.tsx     # the mode's phase machine; owns ALL terms hooks
    artifacts/       # PaperArtifact chassis + skins: Telegram, FrontPage, WhipNote,
                     #   Letter, MandateCard, TermsSheet (negotiation), BranchLetter
    shell/           # docket frame (≤36px header strip; tap opens ledger), deck adapter
    ledger/          # one scrollable paper: memo w/ thresholds, correspondence, promises,
                     #   pinned mandates, redacted clippings
    slips/           # ResultRibbon + ResultSlip (The Record ∥ The Republic)
    setup/           # prologue: two faces of one returning-officer letter
    election/        # seeded slip sequence + returning-officer's note
    obituary/        # Obituary, SharedObituary, Archive (CaseFiles row pattern)
  styles/terms.css  terms-screens.css
```

**Integration invariants:**

- `App.tsx`: `mode` is a `useState` declared with the other top-level hooks; the terms
  branch is a case in the existing `let content` if-chain **after all hooks** (the
  `shared` early-return above a `useEffect` is a pre-existing landmine — do not imitate);
  `mode` joins the `AnimatePresence` motion key. App gains zero hooks below a return.
- Home: the desk shows **two stamped dossiers** — the existing briefing card and a
  "CAREER — The Member for Halloway" folder opening the Terms prologue; Terms saved runs
  and the Archive live inside that folder (CaseFiles semantics intact).
- **Exactly one surface mounted at a time.** SwipeCard binds global arrow-key listeners,
  so the deck is unmounted (never overlaid) whenever the ledger, an artifact, or the
  terms sheet is up; the whip-note → negotiation → vote flow is phase-sequenced.
- CSS: every new class is `t-`-prefixed; never reuse existing layout classes (`.ledger`
  is taken by the verdict). Shared tokens (`.desk`, `.sheet`, `.stamp`, `.kicker`,
  `.hand`) are fair game. The shell wraps SwipeDeck in a `position:relative` inset
  container (deck-row is `absolute inset:0`). Each screen declares its scroll container
  (html/body are overflow:hidden by design).
- Mobile (390px): artifact options stick to the paper's foot; precedents live on the
  verso (tap the folded corner); the ledger is one scrollable full-screen paper; the
  docket strip is tap-only (no drag — it would fight the gutters and `.b-scroll`).
- BillCard's interior copy ("Session XII · Tabled for Vote", `Bill n/total` footer) is
  compass-flavoured and stays; term flavour is carried entirely by the shell chrome.

**Reuse:** `engine/posterior.ts` (conviction scoring + run posterior),
`engine/scoring.ts` + reference data (obituary verdict), `engine/posterior.fisherInfo`
(fill scoring), `SwipeDeck`/`BillCard` (unmodified, adapter-wrapped), verdict primitives
(SpectrumBar/EchoList) inside the obituary, `Highlighted`, chart theme.

## Acceptance gates

1. `npx tsx scripts/terms-audit.mts` — every curated id resolves and matches
   `expectTitle`; per-path docket bands (40–60% projected passage, ≥ 25% contested, 1–3
   knife-edges); every fiscal/economic curated bill carries an authored treasury delta;
   fill exclusion covers both branch variants.
2. `npx tsx scripts/terms-sim.mts` — scripted profiles over the real scenario:
   *turtle* (safe seat, declines everything, votes posterior-consistently) must still
   face ≥ 15% loss rate across seeds; *coin-flip* ends conviction < 45; *party-liner
   against posterior* accumulates weathervane hits; *firebrand* (consistent extremist)
   can spawn a radical bloc by mid-Term II and reach the revolution gate in Term III;
   *vote-seller* (accepts every offer) fares strictly worse than the turtle — higher
   death rate and fewer honours (trust is not the metric: a seller's corpse can be
   trusted and still be a corpse).
3. `npm run typecheck` and `npm run build` clean; compass mode byte-identical in
   behaviour.

## Tone & content rules

- Bills verbatim from the pool; never edited, never fictionalised.
- Events/characters: composites only; every authored event cites ≥ 1 real precedent.
- Voice: the scholarly dossier register; wit lives in marginalia (the whip's hand, the
  sketch-writer, the spouse), never in system copy.
- The obituary carries the test verdict's disclaimer.

## Guards against degenerate play

- Appeasement symmetry (event/promise/negotiation gains only; RU pressure lands on the
  hotter flank) blocks single-bloc max — including via the kingmaker.
- Promise slots + grudges + improbability-scaled rewards block promise farming: selling
  votes you'd cast anyway pays ~+1.
- The ungated weathervane penalty prices vote-selling and incoherence; it is scored
  pre-update so the vote cannot launder itself.
- Whip notes are priced on both sides; trust decays per term; the safe seat costs
  independence — turtling is a strategy, not a solution.
- Stateless seeded rolls + event-sourced resume: no reroll scumming.
- No suppression verbs exist; the Emergency Whip is the only coercion and costs trust
  every use.
