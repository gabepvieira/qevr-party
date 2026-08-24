# qevr.party — the public site

First contact. A partier who has never heard of QEVR lands here. The arrival forks into
two doors, O MANIFESTO and O ESTÚDIO, and a bar keeps both one tap away from anywhere.

**Live at http://qevr.party** (GitHub Pages, repo `gabepvieira/qevr-party`).

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
```

## Run it locally

```bash
npm run site          # from the repo root, serves http://localhost:4599
```

## Screen budget

Scrolling is the enemy. The manifesto is four sections, each sized to about one screen:
the arrival, O MUNDO, COMO ELE FALA, and the nevers sharing a screen with O PRESENTE.
That lands near 3.8 screens on a desktop and 4.5 on a phone. The long passage runs in two
columns above 1000px, and the nine stances are headline tiles that open in place rather
than nine stacked paragraphs. The studio does not scroll at all: the stage holding Qevr is
a fixed row, and only the face grid moves, so you never lose sight of him while picking a
face. If you add content, keep the budget.

## Rules this site keeps

- Copy is 100% uppercase, SpaceMono, no em dashes, no exclamation points, no emoji.
- Square corners everywhere (`border-radius: 0` is forced globally).
- Hard offset shadows only. The single glow is the thermometer at ON FIRE.
- Four brand colours, locked. Nothing else.
- Headings are drawn cell by cell from the same 5x7 grid the mascot is made of.
- Face names in `qevr-expressions.json` are canonical and never renamed. The studio
  shows a Portuguese label next to the canonical name.
- Copy is written in the register of O MUNDO. Nothing careta: no UX vocabulary, no
  corporate softening. If a line would not be said out loud at a party, rewrite it.
- Write Portuguese, never translate English. "DAR UM DEFEITO NELE" was a word-for-word
  rendering of "give him a defect" and means nothing. Read every string aloud first.
- Fill the box. A layout that sizes to its content and leaves the remainder black reads
  as broken, not as breathing room. Grids stretch; the last cell spans the gap.
- Hierarchy follows importance. The closing stamp is the loudest type on the page, not
  a footnote.
- Padding is structure, not decoration. A mascot fills its cell, then a rule, then a name.
- Never hijack the scroll. No scroll-snap, no scrolljacking. The reader drives.

## The time of day mechanic (built, currently off)

When enabled, the page reads the visitor's local clock and nothing explains it:

| Local time      | Mode    | What changes                            |
| --------------- | ------- | --------------------------------------- |
| 23:00 to 06:59  | `party` | Brand flips to pink. The room is open.   |
| 07:00 to 07:59  | `dawn`  | Ground lifts, pink accents. The one tender hour. |
| 08:00 to 22:59  | `day`   | Lime.                                    |

Force a state while working on it: `?mode=day`, `?mode=party`, `?mode=dawn`.

## Editing the copy

Everything a reader sees lives in `assets/manifesto.pt.json`. Nine stances, eight nevers,
the world passage, the gift passage, the closing stamp. Change a word there and reload.
Keep the rules above or the page stops being QEVR.

## Colour

Lime only for now. The time-of-day flip (pink after 23:00, quiet at 07:00) is built and
sitting in `site.css`, switched off by `TIME_AWARE = false` at the top of the page script
in both `index.html` and `studio/index.html`. Flip that to `true` to bring it back.
`?mode=party` and `?mode=dawn` still preview those palettes at any hour.

## Deploying to qevr.party

Two facts shape this. The GitHub account `gabepvieira` has no paid plan, and GitHub Pages
from a private repo requires one, so the site needs its own **public** repo. Separately,
`gabepvieira` has push but not admin on `PalomoLH/mvp-qevr-monorepo`, so Pages could not be
enabled there in any case.

### GitHub Pages

```bash
# from the repo root
DEPLOY=$(mktemp -d)
cp -R apps/web-site/. "$DEPLOY"/
printf 'qevr.party\n' > "$DEPLOY/CNAME"
touch "$DEPLOY/.nojekyll"

gh repo create gabepvieira/qevr-party --public -d "qevr.party public site"

cd "$DEPLOY"
git init -b main && git add -A
git commit -m "qevr.party: manifesto page and mascot studio"
git remote add origin https://github.com/gabepvieira/qevr-party.git
git push -u origin main

gh api -X POST repos/gabepvieira/qevr-party/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
```

### Porkbun DNS

The domain currently holds Porkbun's parking records. Delete the `ALIAS` on the root and the
wildcard `CNAME`, both pointing at `pixie.porkbun.com`, then add:

| Type  | Host  | Answer                    |
| ----- | ----- | ------------------------- |
| A     | (blank, root) | `185.199.108.153` |
| A     | (blank, root) | `185.199.109.153` |
| A     | (blank, root) | `185.199.110.153` |
| A     | (blank, root) | `185.199.111.153` |
| CNAME | `www` | `gabepvieira.github.io`   |

The Porkbun MCP server is already registered locally and connected, so this can be done
from a Claude Code session rather than by hand.

### Cloudflare Pages instead

Also fine, and it avoids the public repo, but it needs a browser login to your Cloudflare
account. Connect the repo there, leave the build command empty, set the output directory to
`apps/web-site`, then point the domain at the `pages.dev` hostname.

## Porkbun MCP (already registered on this machine)

1. Go to porkbun.com/account/api and create a key pair (public `pk1_...`, secret `sk1_...`).
2. On that page, turn on **Opt In All Domains**, or enable API access on `qevr.party`
   individually under Domain Management. Without this the API refuses the domain.
3. Register the server locally, so the keys stay out of the repo:

```bash
claude mcp add porkbun -s local \
  -e PORKBUN_API_KEY=pk1_xxx \
  -e PORKBUN_SECRET_API_KEY=sk1_xxx \
  -- npx -y @porkbunllc/mcp-server
```

`-s local` writes to your machine's Claude config, not to `.mcp.json`. Never commit the keys.

## Studio controls

Every control is written in Portuguese a person would actually say, never a translation
of an English label. "ELE SE MEXE SOZINHO?" with SIM and NÃO runs or freezes the behaviour
loop. "MUDE A COR DO QEVR" with VERDE and ROSA repaints him and all 23 chips. "CLIQUE
AQUI" fires one GLITCH burst. All six strings live in `assets/manifesto.pt.json` under
`studio`, so copy never hides in the markup.

## Not built yet

- The Workshop screen from the original studio (a grid editor for authoring new faces).
  It is an internal authoring tool, so it stayed out of the public site.
- A shareable memory artifact, which is the thing item [25] says is the only advertisement.
