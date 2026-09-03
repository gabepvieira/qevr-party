# qiqi — the public site (live at qevr.party)

First contact. A partier who has never heard of QIQI lands here. The first visible
thing is the loading bar. It builds and glitches him in, then becomes `VAI, CLICA EM
MIM`. The landing is two screens: the first is QIQI huge and centered, with that line above,
`EU TBM MUDO DE COR :3` and the VERDE/ROSA choice below, `SÃO PAULO` and the SCROLL
cue on the bottom edge. Scrolling past the fold starts the read (A PISTA onward). On
a phone the two screens are two PAGES: scroll snaps to him or to the read, never
between them (GP's ruling — "no half pages"); inside the read, scrolling is free.

**THE NAME:** ruled 2026-08-26 — the brand is **QIQI** (was QEVR). The site copy and
wordmark already say QIQI. Still pending in the rename cascade: the domain
(qevr.party stays until GP moves it), repo names, internal file/key names
(`qevr.js`, `qevr.mode`, canonical face codes) which are IDs, not display, and only
change when GP orders the deep rename.

**Live at https://qevr.party** (Cloudflare Pages, project `qevr-party`).

Static files only. No build step, no framework, no dependencies. Everything runs from
this folder exactly as it sits.

```
index.html                     the manifesto page. THE PT COPY DECK IS EMBEDDED
                               INLINE in the deck-pt block (view-source carries the
                               manifesto; the page boots without a fetch)
galeria/index.html             GALERIA: the 23 prototypes on the conveyor (was
                               studio/; studio/ now redirects here, old QRs keep
                               working)
estudio/index.html             ESTÚDIO: the face-maker. The visitor edits ONLY the
                               face band (rows 14-24 × cols 7-26); drag-paint, undo,
                               live previews, a 37-char code in the URL. Geometry
                               spec: docs/design-research/estudio-math-2026-08.md
sala/index.html                three interactive rooms about his story, DNA and
                               changes. Press-and-hold the arrival QIQI (~2s) enters.
canon/index.html               the canonical 34×34 grid and per-face diff inspector;
                               ESTÚDIO carries one quiet door here.
kit/index.html                 internal component workshop. every live piece on
                               the site, with knobs for its states, desktop and
                               phone. English chrome, noindex, not a public door.
                               localhost:4599/kit/
404.html                       the wrong room. Served by Cloudflare Pages on any
                               missing path. Him, Shocked then Dead, still pokeable.
assets/manifesto.pt.json       the PT deck FILE — canonical for galeria/estudio/404
                               (ui, doors, galeria, estudio, notFound keys).
                               ⚠ index.html embeds its own copy of the manifesto
                               deck inline: EDIT BOTH when copy changes.
assets/manifesto.en.json       the English deck. SAME shape, mirrored beat for beat.
assets/qevr-expressions.json   copy of handoff/qevr-expressions.json (canonical
                               prototypes). An entry MAY carry an optional
                               "credit": { "de": "DA", "name": "AMANDA" } — the
                               galeria then shows QIQI DA AMANDA / PROTÓTIPO N.
assets/qevr.js                 mascot renderer + brain (behaviours, blinks, cascade)
assets/pixelfont.js            5x7 cell type (now including parentheses)
assets/cascade.js              the QR room-change cascade
assets/site.css                VENOM + self-hosted Space Mono (assets/fonts/)
assets/fonts/                  Space Mono woff2, 400/700, latin + latin-ext.
                               GOOGLE FONTS IS GONE: SEM REVENDA DE DADOS includes
                               the fonts. Never re-add the googleapis links.
assets/og-card.png             the share card (1200×630), RENDERED from canon by
assets/og-galeria.png          scripts/render-og.mjs — never hand-drawn. Re-run the
                               script and commit when the canon or wordmark changes.
galeria/galeria.css            gallery layout (conveyor, strips, plate)
estudio/estudio.css            maker layout (large fixed workbench on desktop;
                               full-width, scroll-safe workbench on phones)
assets/favicon.svg             the mascot (Default), generated from the canon.
```

## Run it locally

```bash
npm run site          # from the repo root, serves http://localhost:4599
```

## GP testing mode

Open any public-site URL with `?qa=1`, for example
`http://localhost:4599/?qa=1` or `https://qevr.party/?qa=1`. The QA dock remains
available while moving between pages in the same browser session.

- **PICK** — tap a visible component, then record what happened and what should
  happen instead.
- **NOTE** — add a page-level open loop without selecting a component.
- **QA N** — review or remove notes, copy the text, or share/download one JSON
  report containing the notes, element selectors, device diagnostics, and the
  actual attached screenshots.
- **STOP QA** — hide the testing surface without deleting the saved report.

On an iPhone, take the system screenshot first, return to the page, select the
component, and use **ADD SCREENSHOT FROM PHOTOS**. Attach the resulting
`qevr-qa-*.json` file to the Codex task. Use `?qa=0` to disable QA mode for the
current browser session.

## The voice (get this right before anything else)

Copy is written the way a partier types to a friend. **VC, TÁ, TÃO, TBM, TÔ, CÊ stay.**
Never "correct" them to VOCÊ / ESTÁ / ESTÃO / TAMBÉM — the register is the product, and
expanding a contraction for correctness is how the site died once already. Fix only real
errors: accents, agreement, actual typos. Read every line out loud; if it would not be
said at a party, rewrite it. Write Portuguese, never translate English.

## The register law (P03, ruled 2026-08-26 — scope: EVERYTHING)

The voice law above governs **every user-facing string on every published surface** —
site pages, labels, buttons, OG tags, console output, share cards, posters, secret
rooms — not only the copy deck. For any agent writing PT:

- **Write the thought in Portuguese from scratch.** If a line back-translates cleanly
  into the English you started from, delete it and start again.
- **Subject is ELE / VC / A GENTE or a concrete thing.** Never a section name
  performing a metaphor (`A CHEGADA ENCENA...` is the canonical corpse).
- **Kill-list, on sight:** ENCENA, ESCALA (for escalate), TESE, DECK, PALCO,
  É SOBRE, `VISUAL —`, colon headlines, em dashes, exclamation points.
- **Spoken beats written.** `O LOTE VIROU` grammar: a fact, an order, a vocative, a
  spoken antithesis. Prefer the dumb line. Loanwords only if the pista already says
  them (LINE UP, AFTER, CRUSH, GAG).
- **The tests:** read it out loud; would someone text it at 3am? Then the
  back-translation kill switch. Then GP's ruling — no PT display string ships
  without it (P04). Every deploy includes a PT sweep of new strings.
- The internal docs corpus is NOT a register source (P07): the only imitable PT is
  the deck, the galeria labels, and GP-ruled strings.

English register note (PT-3): working documents and artifact chrome stay plain and
concrete — the dramatic register belongs to the manifesto, not to pages that ask
for rulings.

## The alignment standard

One rule, all pages, both breakpoints:

- Everything is **left-aligned** inside one shared container (`--wrap`); the bar
  mark, the wordmark, the block stack and the doors all sit on the same left edge.
- Exceptions: the arrival lockup centers; a label that names a piece of art centers
  with that art (gallery chip names, the maker caption).
- **Lime fill = where you are** (bar current page, active controls). **White fill =
  hover.** Never the same treatment for both.

## The read: the panel (ruled 2026-08-27)

The manifesto is ONE ROOM — five cell-type headings and one bay. Desktop: the
headings stack in a left rail, the bay is the right side. Phone: the headings
are five compact rows, the bay below. All five load CLOSED; the empty bay
holds only the blinking brand-bar cursor.

- **Closed headings render DIM; the open one is brand.** Hover flinches one
  shear beat. The opening CLICK runs the hard two-frame shear — the house
  glitch, never a color-flip effect.
- **The bay never resizes.** Its height is reserved for the tallest section
  (including the tallest open answer) on desktop; on phones it sizes to
  content and the read fills exactly one page — stamp and doors at its floor.
  Content arrives in three hard chunks; the brand-bar cursor keeps blinking
  forever.
- **AS PESSOAS speaks as stanzas** — name, a middle dot, the sentence. No
  numbers, no borders, no table.
- **O QIQI is a spoken list** — seven muted head-lines, no grid, no numbers;
  the open line turns brand and its answer speaks right below it inside the
  reserved room.
- **AS REGRAS opens as the POSTER**, not a bay: the A4-shaped popup, angry
  QIQI straddling the sheet's right edge (a third of him outside the frame),
  FECHAR/Esc closes. The downloadable print carries the same composition.
- **The companion JUMPS:** on desktop, opening a section moves the corner
  QIQI into the bay's right field wearing the section's face. On phones he
  re-scans for a clean spot and lands with the jump beat.
- **The stamp is a standing band below the panel** — `NOS VEMOS NA PISTA :)`
  in his cells, the smiley in the brand color. It assembles once per visit
  the FIRST time it becomes visible (click or scroll) and ends with one hard
  shear beat.
- After the stamp: TWO doors (ESTÚDIO / GALERIA), full-viewport bands,
  cell-type labels. Default is the WHITE flood with ink words; hover floods
  BRAND with the shear beat on the word.
- **Per-line emphasis comes from the deck** (`{ "t": ..., "em": "dim"|"mark" }`)
  — never from position heuristics. GP's pen decides which lines carry color.

## The one-screen read (shipped 2026-09-02 on GP's word; rulings pending)

The round-2 PROPOSED build plus Fable's fixes went live as the site, with the
`is-next` class always on (`?next=1` changes nothing). What is live now:

- **Phone (≤430px):** the read is exactly one screen. Five rows stretch to
  fill it; the five labels share ONE cell size (the longest word sets it);
  a tapped section opens a fixed bay right under its row. The bay is a
  mini rail: its list rows stretch at rest, compress when one line opens,
  and the bay never resizes or scrolls. Sub-titles are off on phones.
  The stamp lives only inside UM PRESENTE, low by the doors. The doors are
  fixed to the screen's floor, outside the frame. The companion lives in
  the empty right end of the rows and never sits on ink. The rail paints
  above the rows and below the doors; at the read it is ON FIRE with its
  one glow. AS REGRAS spreads its seven rules over the A4 sheet and hides
  the companion while up. Header: mark, the stacked colour chip + EN, then
  the three rooms.
- **Desktop:** one screen, as before. AS PESSOAS keeps its stanzas (the
  accordion is a phone device); its closing block is retired; the stamp
  shows only inside UM PRESENTE; the companion lives in the rail's empty
  lower half.
- **Rooms:** the header dock (EN/PT in the bar) on every room; estúdio
  scrolls on phones with CANON as a quiet door at the end of the tools.

Every item, with frames and a verdict ruler, is in
`docs/proposals/manifesto-rulings-2026-09-02/` — GP rules there; the copy
budget (M5) and the A PISTA heads (M7) wait for his pen.

## Motion law

Stepped, hard, no easing — zero exceptions: anchor moves are hard cuts
(`scroll-behavior: auto`). The thermometer is a fixed 14px rail on the LEFT
edge, constant width, climbing in TWELVE countable cells (viewport/12); at
the top it catches fire in three hard frames. The one glow stays ON FIRE.
The document scrollbar is the system's — never restyled.

## The entrance (every landing)

A stepped loading bar — in the ONE signal slot above his head, never centered
full-screen — is the first frame. QIQI builds himself in from cells (the page
itself never glitches on load), then `VAI, CLICA EM MIM` types on in three
hard chunks with a brand-bar cursor that KEEPS BLINKING, then the ritual:
DEFAULT → ANIME → FELIZ DA VIDA — then the brain takes over on **São Paulo
time** (MORRI at 8h on a Sunday). The hold-to-sala charge fills the SAME
slot (pink), replacing the hint, and only after 350ms of hold — a quick poke
never flashes it. Reduced motion goes straight to the still, but he KEEPS
BLINKING — a blink is a state swap, not motion.

## The poke ladder

Poke him once: normal reaction. He only dies after nine fast pokes. Before
that he escalates through glitches, row waves and reactions. On nine: Dead
face, unboxed pink ERRO tag, three violent glitch rounds ON HIS CANVAS — the
page itself NEVER shows glitch lines — then he breaks into the floor row by
row, the signal slot becomes the loading bar, and the network re-rezzes him
bottom-up. No gray anywhere: off states are structural, never colored.

## The gallery: one conveyor

As before (one crawling conveyor whose chips travel PAST the frame edges —
one continuous ring, never corner pops; same-size fully visible chips, phone
strips, never scrolls) with the ruled changes: PT labels are GP's spoken set
(TÔ BEM, APAGUEI :x, AMEIIII, KKKKKK, DE BOA, PLENO, Q BOM, APRONTANDO HIHI,
BRILHANDO, EITA, NA BAD, TÉDIO, TÔ GAG + the keepers), the stage name is
drawn in cell type and glitches WITH him, labels wrap instead of truncating,
`?face=NAME` deep-links and pins a prototype until the visitor picks another,
the controls read from the deck (SE MEXE / PARADO / VERDE / ROSA / GLITCH /
BAIXAR — GP-blessed, never hardcoded in JS), one clean `{N} PROTÓTIPOS` line
counts from the data with no divider above it, BAIXAR exports the current
face+color as a lock-screen PNG, and when the canon grows the newest face
arrives once per visitor as a small ceremony.

## The switches

Two blocks at the right edge under the bar, stacked (the classic boxes). Each
names what it TURNS INTO: site in PT shows `EN` (click: English; the block
now says `PT`); site green shows a PINK block (click: he molts first, the
page follows through the QR cascade, and the block turns green). The language
switch rides every page; the color block lives on the manifesto. In the bar,
QIQI sits at the extreme left and the three doors end at the extreme right,
tabs filling the bar's full height.

## The maker: O ESTÚDIO

Only the face band is a tool target — the body is not a verb, and the page never
explains that; you discover it by touching. The editor dominates the available
desktop space and fills phone width; phone gets a scroll-safe whole-him canvas with the band framed;
phone gets an INTEIRO / SÓ A CARA zoom toggle plus a drag loupe. Drag paints,
tap toggles, first cell locks the stroke's brush, one undo entry per stroke
(Ctrl/Cmd+Z works). The URL is the file: `?f=CODE37&n=NAME` — 220 band bits in 37
base64url chars (the code readout is the site's one sanctioned lowercase: it is
data). COPIAR LINK / BAIXAR CARD (a 1080×1920 story flyer: face huge, name in cell
type, the code visible as fine print) / MANDAR PRO QIQI (system share; fallback
copies the link — the reply arrives in the DM where the code arrived: the site
captures NOTHING). Full geometry: docs/design-research/estudio-math-2026-08.md.

## The three story rooms

Hold the arrival QIQI ~2 seconds: he charges (Anime), the cascade runs, and `sala/`
opens. HISTÓRIA shows QEVR becoming QIQI, DNA lets the visitor inspect face changes,
and MUDANÇAS lets the visitor drag through a transformation while the silhouette
stays intact. The old dawn, lore dump and empty room are gone.

## Rules this site keeps

- Copy rules: **The voice** + **The register law** above win over any older note.
- Square corners everywhere; hard offset shadows only; the single glow is ON FIRE.
- Four brand colours, locked. Gray (#9A9AA5 / #27272A) is TEXT AND CHROME ONLY —
  his body is never gray; off states are structural (fewer cells, collapse, de-rez).
- Headings are drawn cell by cell from the same 5x7 grid the mascot is made of.
- Face names in `qevr-expressions.json` are canonical and never renamed; PT labels
  map onto them.
- Fill the box. Hierarchy follows importance. The stamp is the loudest type.
- Never hijack the scroll inside the read (the poster pop and the phone snap are
  the two sanctioned exceptions, both GP-ruled).
- The time-of-day palette mechanic was DELETED (L17-C). The dawn palette lives only
  in `sala/`. `?mode=dawn` no longer exists on the main pages.

## Deploying to qevr.party

**Deploy = direct upload, then hash-verify:**

```bash
export CLOUDFLARE_API_TOKEN=$(cat ~/personal/.secrets/cloudflare-api-token)
export CLOUDFLARE_ACCOUNT_ID=$(cat ~/personal/.secrets/cloudflare-account-id)
npx -y wrangler@latest pages deploy apps/web-site --project-name=qevr-party --branch=main --commit-dirty=true
# then hash-verify https://qevr.party/<file> against this tree — live must equal tree
```

A push to the public GitHub repo does NOT update the live site. Keep the repo
(`gabepvieira/qevr-party`) as the public record and fallback: after a Cloudflare
deploy, rsync this folder over it (keep its `CNAME` + `.nojekyll`), commit, push.

DNS: the `qevr.party` zone lives on Cloudflare (nameservers `dante`/`raegan`
`.ns.cloudflare.com`); Porkbun is registrar only. Both hostnames are proxied
CNAMEs to `qevr-party.pages.dev`.

## Not built yet

- The party finder (A14 — ruled, shape pending GP's pick of WALL / BOARD / DOOR).
- The A04 card variants for sharing an existing prototype and for events (the
  your-creation story card is live in O ESTÚDIO; the BAIXAR button in the AS
  REGRAS poster covers the A09 print half).
- PWA (A17) is parked by ruling.
