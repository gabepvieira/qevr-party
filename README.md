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

## The section grammar (the read)

The manifesto is an accordion of five blocks — A PISTA (open on arrival), AS PESSOAS,
O QIQI, AS REGRAS, UM PRESENTE — one open at a time. Ruled behavior (2026-08-26):

- **Closed headings render DIM (muted); only the open block's heading is lime.**
  Opening IGNITES the heading — cells flip muted→brand in random chunks. Touching a
  closed heading makes it flinch one shear beat (hover on desktop; the opening tap
  carries the beat on phones).
- **Tiles stay short.** Opening a tile slides its body into a full-width BAY under
  that tile's row, at full reading size, in white — the doctrine answers at full
  volume. The bay types in 3-4 hard chunks (~300ms), the block cursor blinks twice
  and dies, and then the final period quietly disappears (GP's ruling: only the
  period). The bay reserves its final height first so nothing below jumps.
- **AS PESSOAS is not a pricing grid:** full-width stanzas, always open, body at
  copy size in white. They are the heart, not a disclosure.
- **AS REGRAS opens as the POSTER**, not a dropdown: a centered A4-shaped popup,
  angry QIQI beside the seven rules; FECHAR/Esc closes. (Same composition as the
  printable poster.)
- **The companion JUMPS:** on desktop, opening a block moves the corner QIQI into
  that block's empty right field wearing the block's face; closing sends him back.
  On phones the copy keeps its full width and he scans both edges for an empty
  place, moving whenever he would cover a word, cell heading or language control.
- The stamp is drawn in his own cells at the largest size on the page —
  `NOS VEMOS NA PISTA :)` with the smiley in the current brand color — and
  assembles once per visit on the first opening of UM PRESENTE.
- After the stamp: TWO doors on one line (ESTÚDIO / GALERIA), full-viewport bands,
  cell-type labels, hover floods white.

## Motion law

Stepped, hard, no easing — now with zero exceptions: anchor moves are hard cuts
(`scroll-behavior: auto`), and the thermometer climbs in 14px cell steps; at the
top it catches fire in three hard frames. The one glow stays ON FIRE.

## The entrance (every landing)

A stepped loading bar is the only first frame. Then QIQI builds himself in from
cells, the bar becomes `VAI, CLICA EM MIM`, then the
ritual: DEFAULT → ANIME → FELIZ DA VIDA — then the brain takes over on **São Paulo
time** (his resting face follows SP's clock for the whole world; MORRI at 8h on a
Sunday). Reduced motion goes straight to the still, but he KEEPS BLINKING — a blink
is a state swap, not motion.

## The poke ladder

Poke him once: normal reaction. He only dies after nine fast pokes. Before that he
escalates through glitches, row waves and reactions. On nine: Dead face, unboxed
pink ERRO text and a whole-page glitch; he breaks into the floor row by row, the
phrase becomes the same loading bar, and the network re-rezzes him bottom-up before
the phrase returns. No gray anywhere: off states are structural, never colored.

## The gallery: one conveyor

As before (one crawling conveyor, same-size fully visible chips, phone strips, never scrolls) with
the ruled changes: PT labels are GP's spoken set (TÔ BEM, APAGUEI :x, AMEIIII,
KKKKKK, DE BOA, PLENO, Q BOM, APRONTANDO HIHI, BRILHANDO, EITA, NA BAD, TÉDIO,
TÔ GAG + the keepers), the stage name is drawn in cell type and glitches WITH him,
labels wrap instead of truncating, `?face=NAME` deep-links and pins a prototype until
the visitor picks another, the BAIXAR control exports the current face+color as a
lock-screen PNG, and when the canon
grows the newest face arrives once per visitor as a small ceremony.

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
