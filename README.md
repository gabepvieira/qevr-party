# qevr.party — the public site

First contact. A partier who has never heard of QEVR lands here. The arrival forks into
two doors, O MANIFESTO and O ESTÚDIO, and a bar keeps both one tap away from anywhere.

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
  mark, the wordmark, the doors and the block stack all sit on the same left edge.
  Desktop and phone agree; columns collapse, alignment never changes.
- Two exceptions only: the mascot centers inside his own frame, and a label that names
  a piece of art (CLICA EM MIM, a chip name) centers under that art.
- **Lime fill = where you are** (bar current page, the lead door). **White fill =
  hover.** Never the same treatment for both — a hover that looks like the active
  state is a lie.

## The section grammar

The manifesto is an accordion of four blocks — A CENA (open on arrival), O JEITO DELE,
REGRAS, UM PRESENTE — one open at a time, all four headings drawn at one shared cell
size, each heading carrying a small descriptor that says what sits behind it
(`sub` in the copy deck). A label that needs the click to explain itself is a bad label.

Inside a block there are exactly two kinds of content:

- **Prose** — narrative paragraphs, max 64ch, left column.
- **Deck** — any enumeration is numbered tiles: index, head, body, same borders, same
  paddings, everywhere. The nine stances, the eight nevers and the four people are the
  same component. A deck always ends on a full row (9 = 3×3, 8 = 4×2, people 2×2);
  a deck with a hole in it is a bug.

Interactive tiles open on tap (one at a time). The people tiles stay open — they are
the heart of A CENA, not a disclosure.

## Screen budget

Scrolling is the enemy. With A CENA open the whole manifesto is ~2 screens on a desktop
and ~2.9 on a phone. The accordion is what keeps it there: opening a block closes the
others. The studio does not scroll at all on desktop; on a phone only the face grid
scrolls, under a pinned stage. If you add content, keep the budget.

## The studio grid (why there is no 24th cell)

23 faces, 23 cells, nothing else in the grid. 23 is prime, so the rectangle closes by
stretching the last row: desktop runs rows of 6 with a final row of 5 slightly larger
chips, a phone runs rows of 3 with a final row of 2. The panel width is **solved** so
the grid fills the height exactly (see `planFor` in `studio/index.html`) and the stage
takes whatever width is left. Every cell keeps the mascot's exact aspect (23:25 of the
cropped 34×34 grid), so every cell is entirely QEVR — then a divider, then the name.

- Dividers are **3px of ground** between chips (`--chipgap`), not hairlines: a 1px dark
  line between two bright chips is invisible.
- Hover is an inset 2px white frame plus a lit name — it has to survive a cell that is
  100% mascot. Selected is the brand frame plus the brand name strip.
- "A REGRA DELE" (grade, 23 caras, só o rosto muda) lives at the bottom of the stage
  column. It is never a grid cell.

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
