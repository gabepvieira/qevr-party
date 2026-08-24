# qevr.party — the public site

First contact. A partier who has never heard of QEVR lands here. The landing is two
screens: the first is ONLY him — QEVR huge and centered, `VAI, CLICA EM MIM` above,
`EU TBM MUDO DE COR :3` and the VERDE/ROSA choice below, nothing else. Scrolling past
the fold starts the read (A CENA onward). The bar keeps O MANIFESTO and O ESTÚDIO one
tap away from anywhere; the one door on the page is the studio exit after the stamp.

**Live at https://qevr.party** (GitHub Pages, repo `gabepvieira/qevr-party`).

Static files only. No build step, no framework, no dependencies. Everything runs from
this folder exactly as it sits.

```
index.html                     the manifesto page
studio/index.html              the mascot studio, all 23 faces
assets/manifesto.pt.json       ALL THE COPY. edit words here, never in the HTML
assets/qevr-expressions.json   copy of handoff/qevr-expressions.json (canonical faces)
assets/qevr.js                 mascot renderer + brain (behaviours, blinks, cascade)
assets/pixelfont.js            5x7 cell type, so headings are made of mascot cells
assets/site.css                VENOM. square, hard shadows, uppercase
studio/studio.css              studio-only layout
assets/favicon.svg             the mascot himself (Default face), generated from
                               qevr-expressions.json. favicon-32 / apple-touch-icon
                               are renders of the same SVG. never hand-draw an icon.
```

## Run it locally

```bash
npm run site          # from the repo root, serves http://localhost:4599
```

## The voice (get this right before anything else)

Copy is written the way a partier types to a friend. **VC, TÁ, TÃO, TBM, TÔ, CÊ stay.**
Never "correct" them to VOCÊ / ESTÁ / ESTÃO / TAMBÉM — the register is the product, and
expanding a contraction for correctness is how the site died once already. Fix only real
errors: accents, agreement, actual typos. Read every line out loud; if it would not be
said at a party, rewrite it. Write Portuguese, never translate English.

A punchline has to mean something. "O ESCURO É O CHÃO. A COR É A LUZ CHEGANDO." sounded
impactful and said nothing; it is now "SÓ TEM COR QUANDO TEM COISA VIVA.", which says the
actual mechanic. If a head only works after you read the body, the head is wrong.

Everything else about the copy: CAIXA ALTA always, no em dashes, no exclamation points,
no emoji, and it all lives in `assets/manifesto.pt.json` — never in markup.

## The alignment standard

One rule, both pages, both breakpoints:

- Everything is **left-aligned** inside one shared container (`--wrap`), and the bar
  mark, the wordmark, the block stack and the studio exit door all sit on the same
  left edge. Desktop and phone agree; columns collapse, alignment never changes.
- Two exceptions only: the arrival (the mascot's own full first screen — him, his
  line, the colour choice) centers as a lockup, and a label that names a piece of art
  (a chip name) centers with that art.
- **Lime fill = where you are** (bar current page, the lead door). **White fill =
  hover.** Never the same treatment for both — a hover that looks like the active
  state is a lie.

## The section grammar

The manifesto is an accordion of five blocks — A CENA (open on arrival), AS PESSOAS,
O JEITO DELE, REGRAS, UM PRESENTE — one open at a time, all headings drawn at one
shared cell size, each heading carrying a small descriptor that says what sits behind
it (`sub` in the copy deck). A label that needs the click to explain itself is a bad
label.

Inside a block there are exactly two kinds of content:

- **Prose** — narrative paragraphs, max 64ch, left column.
- **Deck** — any enumeration is numbered tiles: index, head, body, same borders, same
  paddings, everywhere. The nine stances, the eight nevers and the four people are the
  same component. A deck always ends on a full row (9 = 3×3, 8 = 4×2, people 2×2);
  a deck with a hole in it is a bug.

Interactive tiles open on tap (one at a time). The people tiles stay open — they are
the heart of AS PESSOAS, not a disclosure.

## Screen budget

Scrolling is the enemy. The landing's first screen is exactly one viewport (him and
the colour choice); the read below stays ~1.5 screens with one block open. The
accordion is what keeps it there: opening a block closes the others. The studio
never scrolls — on ANY device; a phone explores the face strips by swiping them
sideways. If you add content, keep the budget.

## The studio: one conveyor

The studio is one frame: the 23 faces crawling slowly clockwise around one big
center cell where QEVR lives with his playground (name, code, the three controls,
the meta line). Every chip is the SAME size — the size is solved from the viewport
(`solveChipSize`), so a 4K monitor gets bigger faces, never mismatched ones. The
top and bottom belts own the full width; the side belts sit inset between them,
and at each corner a chip de-rezzes off one belt and re-rezzes on the next — the
same glitch language as the cascade. Faces never teleport between seats.

A phone gets no side belts and the page NEVER scrolls: one strip of faces up top
(12), one below (11), the playground pinned between them. Each strip drifts
slowly on its own and swipes left/right to explore; a finger on a strip owns it,
and the crawl resumes a beat after it lets go.

- `LANE_SPEED` / `STRIP_SPEED` in `studio/index.html` set the crawl. A hand over
  the frame (or focus in it) holds the desktop lane still; reduced motion turns
  all drift off.
- The selection highlight lives on the face itself and travels with it.
- Face labels live in the `PT` map in `studio/index.html` — GP's voice, mapped
  onto the canonical codes, which never change.
- Dividers are 3px of ground; hover is a white inset frame; selected is brand.
- The color choice (VERDE/ROSA) persists across pages via `localStorage`
  `qevr.mode`; `?mode=` previews without persisting. The arrival question on
  the manifesto writes the same key.

## Rules this site keeps

- Copy rules and voice: see **The voice** above. That section wins over any older note.
- Square corners everywhere (`border-radius: 0` is forced globally).
- Hard offset shadows only. The single glow is the thermometer at ON FIRE.
- Four brand colours, locked. Nothing else.
- Headings are drawn cell by cell from the same 5x7 grid the mascot is made of.
- Face names in `qevr-expressions.json` are canonical and never renamed. The studio
  shows a Portuguese label next to the canonical name.
- Fill the box. A layout that sizes to its content and leaves the remainder black reads
  as broken, not as breathing room.
- Hierarchy follows importance. The closing stamp is the loudest type on the page.
- Never hijack the scroll. No scroll-snap, no scrolljacking. The reader drives.

## The time of day mechanic (built, currently off)

When enabled, the page reads the visitor's local clock and nothing explains it:

| Local time      | Mode    | What changes                            |
| --------------- | ------- | --------------------------------------- |
| 23:00 to 06:59  | `party` | Brand flips to pink. The room is open.   |
| 07:00 to 07:59  | `dawn`  | Ground lifts, pink accents. The one tender hour. |
| 08:00 to 22:59  | `day`   | Lime.                                    |

Force a state while working on it: `?mode=day`, `?mode=party`, `?mode=dawn`.
Lime only for now: `TIME_AWARE = false` at the top of the page script in both
`index.html` and `studio/index.html`.

## Deploying to qevr.party

The GitHub account `gabepvieira` has no paid plan and GitHub Pages from a private repo
requires one, so the site deploys from its own **public** repo, `gabepvieira/qevr-party`.
Copy this folder over that repo's contents (keep its `CNAME` and `.nojekyll`), commit,
push to `main`. Pages serves it; DNS at Porkbun already points the apex at GitHub Pages
and `www` at `gabepvieira.github.io` (the Porkbun MCP server is registered locally if
records ever need touching).

## Not built yet

- The Workshop screen from the original studio (a grid editor for authoring new faces).
  It is an internal authoring tool, so it stayed out of the public site.
- A shareable memory artifact, which is the thing item [25] says is the only advertisement.
