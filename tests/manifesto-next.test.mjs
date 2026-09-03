import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");
const siteCss = await readFile(new URL("assets/site.css", root), "utf8");
const pt = JSON.parse(await readFile(new URL("assets/manifesto.pt.json", root), "utf8"));
const en = JSON.parse(await readFile(new URL("assets/manifesto.en.json", root), "utf8"));
const inlineMatch = html.match(/<script type="application\/json" id="deck-pt">\s*([\s\S]*?)\s*<\/script>/);
const inlinePt = inlineMatch ? JSON.parse(inlineMatch[1]) : null;

function blockBetween(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0, `missing ${start}`);
  assert.ok(to > from, `missing ${end} after ${start}`);
  return source.slice(from, to);
}

test("is-next is applied before stylesheet paint (always on since 2026-09-02) and exposed by one NEXT constant", () => {
  const head = blockBetween(html, "<head>", "</head>");
  const prepaintAt = head.indexOf('document.documentElement.classList.add("is-next")');
  const stylesheetAt = head.indexOf('<link rel="stylesheet" href="assets/site.css">');

  assert.ok(prepaintAt >= 0, "missing the is-next prepaint");
  assert.ok(prepaintAt < stylesheetAt, "the is-next prepaint must run before site.css loads");
  assert.doesNotMatch(head, /get\(["']next["']\)\s*===\s*["']1["']\)\s*document/, "the flag is always on; no query gate");
  assert.match(head, /document\.documentElement\.classList\.add\(["']is-next["']\)/);

  const declarations = html.match(/\bconst\s+NEXT\b/g) ?? [];
  assert.equal(declarations.length, 1, "the page must have one NEXT constant");
  assert.match(html, /const\s+NEXT\s*=\s*document\.documentElement\.classList\.contains\(["']is-next["']\)/);
});

test("boot reserves the final mascot rectangle before asynchronous deck loading", () => {
  const reserveAt = html.indexOf("reserveArrivalMascot();");
  const loadAt = html.indexOf("Promise.all([");
  assert.ok(reserveAt >= 0, "missing boot layout reservation");
  assert.ok(reserveAt < loadAt, "boot geometry must be reserved before async loading");

  const reserve = blockBetween(html, "function reserveArrivalMascot()", "function releaseArrivalMascotReservation()");
  assert.match(reserve, /window\.Qevr\.CROP/);
  assert.match(reserve, /arrivalCellFor\(\)/);
  assert.match(reserve, /style\.width/);
  assert.match(reserve, /style\.height/);
  assert.match(
    siteCss,
    /body\.is-booting\s+\.arrival__question:empty::before\s*\{[^}]*content:/s,
    "the late deck caption must reserve its line before copy arrives",
  );
  assert.match(
    siteCss,
    /body\.is-booting\s+\.arrival__color-controls\s+span:empty::before\s*\{[^}]*content:/s,
    "the late deck labels must reserve their button line before copy arrives",
  );
});

test("NEXT draws a zero-layout full-width page separator", () => {
  const allWidths = blockBetween(html, "<style>", "@media (max-width: 430px)");
  assert.match(html, /html\.is-next\s+\.arrival::after\s*\{/);
  const separator = blockBetween(html, "html.is-next .arrival::after {", "}");
  assert.match(separator, /position:\s*absolute/);
  assert.match(separator, /width:\s*100vw/);
  assert.match(separator, /calc\(50%\s*-\s*var\(--rail\)\s*\/\s*2\)/);
  assert.match(separator, /pointer-events:\s*none/);
  assert.match(html, /html\.is-next\s+body:not\(\.is-read-active\)\s+\.blocks\s*\{[^}]*visibility:\s*hidden/s);
  assert.match(html, /html\.is-next\s+body\.is-read-active\s+\.arrival\s*\{[^}]*visibility:\s*hidden/s);
  assert.match(html, /html\.is-next\s+body:not\(\.is-read-active\)\s+\.arrival\s*\{[^}]*position:\s*sticky[^}]*top:\s*var\(--bar\)[^}]*background:\s*var\(--ground\)/s);
  assert.match(allWidths, /html\.is-next\s+\.blocks\s*\{[^}]*min-height:\s*calc\(100svh\s*-\s*var\(--bar\)\)/s);

  const pager = blockBetween(html, "window.addEventListener(\"scroll\", function () {", "}, { passive: true });");
  assert.match(pager, /\(!NEXT\s*&&\s*!isSmall\(\)\)/, "NEXT pager must resolve the boundary at every width");
  assert.match(pager, /NEXT\s*\?\s*32\s*:\s*150/, "PROPOSED must settle within two frames without changing LIVE timing");
});

test("NEXT phone read is one flex frame: rows stretch in every state, the bay hugs its section", () => {
  const phone = blockBetween(html, "@media (max-width: 430px)", "</style>");
  assert.match(phone, /html\.is-next\s+\.blocks\s*\{/);
  assert.match(phone, /height:\s*calc\(100svh\s*-\s*var\(--bar\)\)/);
  assert.match(phone, /min-height:\s*calc\(100svh\s*-\s*var\(--bar\)\)/);
  assert.match(phone, /max-height:\s*calc\(100svh\s*-\s*var\(--bar\)\)/);
  assert.match(phone, /overflow:\s*clip/);
  assert.match(phone, /overflow-clip-margin:\s*var\(--rail\)/);
  assert.match(phone, /html\.is-next\s+\.blocks\s+\.doors\s*\{[^}]*flex:\s*0\s+0\s+auto/s);
  /* GP 2026-09-01: the rows stretch in EVERY state and absorb the leftover
     room; the bay is content-sized (its height authored once per section) */
  assert.match(phone, /html\.is-next\s+\.blocks\s+\.panel__head\s*\{[^}]*flex:\s*1\s+1\s+0/s);
  assert.match(phone, /html\.is-next\s+\.blocks\.is-open\s+\.panel__head\s*\{[^}]*flex:\s*1\s+1\s+0/s);
  assert.doesNotMatch(phone, /flex:\s*0\s+0\s+52px/);
  assert.match(phone, /html\.is-next\s+\.blocks\.is-open\s+\.panel__rail\s*>\s*\.panel__bay\s*\{[^}]*flex:\s*0\s+0\s+auto[^}]*overflow:\s*clip/s);
  /* the scale machinery is dead: nothing in the phone frame transforms type */
  assert.doesNotMatch(phone, /transform-origin/);
  assert.doesNotMatch(phone, /--bay-fit-scale/);
  /* the phone header carries one stacked unit: the colour chip over the
     language label, between the mark and the rooms */
  assert.match(phone, /\.bar__dock\s*\{[^}]*flex-direction:\s*column/s);
  assert.match(phone, /\.bar__dock\s+#colorToggle\s*\{[^}]*flex:\s*1\s+1\s+50%/s);
  assert.match(phone, /\.bar__dock\s+#langToggle\s*\{[^}]*flex:\s*1\s+1\s+50%/s);
  assert.match(phone, /\.bar__mark\s*\{[^}]*width:\s*auto/s);
  assert.doesNotMatch(phone, /100vh(?!\w)/);

  assert.match(html, /id="bayFitSlot"/);
  assert.match(html, /id="bayFit"/);
  assert.match(html, /function\s+isNextPhone\(\)\s*\{[^}]*NEXT[^}]*max-width:\s*430px/s);
  /* the fitter is now the envelope sizer: the bay hugs its section and the
     tallest inner line is reserved so expansion never resizes the box */
  const fitter = blockBetween(html, "function fitOpenBay()", "function queueBayFit()");
  assert.match(fitter, /resetBayFit\(\)/);
  assert.match(fitter, /measureTallestInnerExtra/);
  assert.match(fitter, /hugs its section/);
  assert.doesNotMatch(fitter, /applyScale|style\.transform/);
  /* labels fill their own rows: the per-word fit reads each row's height */
  const unify = blockBetween(html, "function unifyToggleHeadings()", "/* ---------- the doors out:");
  assert.match(unify, /byHeight/);
  assert.match(unify, /fills ITS OWN row/i);
  /* the stamp is UM PRESENTE's alone on the proposed phone */
  assert.match(html, /activeSection\s*!==\s*["']presente["']/);
  assert.match(html, /bayEl\.appendChild\(band\)/, "the gift stamp must be a direct child of the selected bay");
  assert.match(html, /isNextPhone\(\)[\s\S]*scrollReadIntoFrame\(\)/);
});

test("AS PESSOAS carries additive verbatim head-line data in every PT copy and EN", () => {
  assert.ok(inlinePt, "inline PT deck did not parse");
  assert.deepEqual(inlinePt, pt, "inline PT deck must mirror the canonical PT deck");

  for (const [name, deck] of [["external PT", pt], ["inline PT", inlinePt], ["external EN", en]]) {
    assert.ok(Array.isArray(deck.people.headLines), `${name} people.headLines is missing`);
    assert.deepEqual(
      deck.people.headLines,
      deck.people.items.map(([head, line]) => ({ head, line })),
      `${name} headLines must be derived without rewritten copy`,
    );
  }

  assert.match(html, /NEXT\s*&&\s*Array\.isArray\(COPY\.people\.headLines\)/);
  assert.match(html, /NEXT\s*&&\s*Array\.isArray\(COPY\.world\.headLines\)/);
  assert.match(html, /NEXT\s*&&\s*Array\.isArray\(COPY\.gift\.headLines\)/);
  assert.match(html, /buildHeadLines\(/);
  const nextPeople = blockBetween(html, "if (NEXT && Array.isArray(COPY.people.headLines))", "var stanzas");
  assert.doesNotMatch(
    nextPeople,
    /appendPeopleClose/,
    "GP 2026-08-31: the proposed AS PESSOAS is the accordion alone — no closing block",
  );
  assert.match(nextPeople, /fire/, "the deck-carried fire emphasis must reach the accordion");
  assert.equal(pt.world.headLines, undefined);
  assert.equal(pt.gift.headLines, undefined);
});

function deckShape(value) {
  if (Array.isArray(value)) return value.map(deckShape);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, deckShape(value[key])]),
    );
  }
  return typeof value;
}

test("inline PT, external PT, and EN keep identical recursive deck topology", () => {
  assert.ok(inlinePt, "inline PT deck did not parse");
  assert.deepEqual(inlinePt, pt, "inline PT must deep-equal external PT");
  assert.deepEqual(deckShape(pt), deckShape(en), "PT and EN nested fields and list beats drifted");
});

test("NEXT docks one destination-only language action and one destination-only colour action", () => {
  assert.match(html, /id="headerDock"/);
  assert.match(html, /function\s+syncHeaderDock\(readActive\)/);
  const dock = blockBetween(html, "function syncHeaderDock(readActive)", "function syncReadActive()");
  assert.match(dock, /appendChild\(langToggle\)/);
  assert.match(dock, /appendChild\(colorToggle\)/);
  assert.match(dock, /colorToggleHome\.insertBefore/);
  assert.doesNotMatch(dock, /appendChild\(arrivalColor\)/);

  const active = blockBetween(html, "function syncReadActive()", "function syncTitles()");
  assert.match(active, /classList\.toggle\(["']is-read-active["']/);
  assert.match(active, /syncHeaderDock\(readActive\)/);

  const bootRemovals = [...html.matchAll(/document\.body\.classList\.remove\("is-booting"\);/g)];
  assert.equal(bootRemovals.length, 2);
  for (const removal of bootRemovals) {
    assert.match(html.slice(removal.index, removal.index + 180), /onScroll\(\)/, "restored scroll state must sync after boot");
  }
});

test("NEXT thermometer exposes exactly twelve whole fill steps", () => {
  assert.match(html, /const\s+THERMO_STEPS\s*=\s*12/);
  const scroll = blockBetween(html, "function onScroll()", "/* ---------- A13:");
  assert.match(scroll, /Math\.floor\(p\s*\*\s*THERMO_STEPS\)/);
  assert.match(scroll, /Math\.min\(THERMO_STEPS/);
  assert.match(scroll, /thermo\.setAttribute\(["']data-step["']/);
  assert.match(scroll, /cells\s*\/\s*THERMO_STEPS\s*\*\s*100/);
  assert.match(
    scroll,
    /var\s+fire\s*=\s*NEXT\s*\?\s*cells\s*===\s*THERMO_STEPS\s*:\s*p\s*>\s*0\.92/,
    "GP 2026-09-02: the read is the document's end and the end is on fire — on every width",
  );
});

test("the manifesto consumes the ruled z ladder tokens", () => {
  for (const [selector, token] of [
    [".thermo", "--z-rail"],
    [".bar", "--z-header"],
    [".doors", "--z-doors"],
    [".poster", "--z-poster"],
    [".companion", "--z-companion"],
  ]) {
    assert.match(html, new RegExp(`${selector.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}[^}]*var\\(${token},`, "s"));
  }
});

test("NEXT rotates only the two existing signal strings and honors reduced motion", () => {
  assert.match(
    html,
    /html\.is-next\s+\.arrival__question\s*\{[^}]*display:\s*none/s,
    "the proposed landing swatches must not repeat the spoken colour caption",
  );
  const reveal = blockBetween(html, "function revealArrivalHint()", "/* ---------- L15:");
  assert.match(reveal, /COPY\.arrival\.mascotHint/);
  assert.match(reveal, /COPY\.arrival\.colorQuestion/);
  assert.match(reveal, /if\s*\(!NEXT\s*\|\|\s*reduce\)/);
  assert.match(reveal, /setInterval/);
  assert.match(reveal, /if\s*\(!hintBlinkTimer\)/, "the signal cursor must keep blinking in every mode");

  const chunks = blockBetween(html, "function signalChunks(full)", "function clearSignalSpeechTimers()");
  assert.match(chunks, /return\s*\[\s*words\.slice\(0,\s*first\)/s);
  assert.match(chunks, /\^VAI/);
  const typeLine = blockBetween(html, "function typeSignalLine(index)", "function takeSignalSlot(kind)");
  assert.match(typeLine, /if\s*\(reduce\)/);
  assert.match(typeLine, /chunkIndex\s*<\s*3/);

  assert.equal(pt.arrival.mascotHint, inlinePt.arrival.mascotHint);
  assert.equal(pt.arrival.colorQuestion, inlinePt.arrival.colorQuestion);

  const blink = blockBetween(html, "function startReducedBlink()", "/* ---------- L25:");
  assert.match(blink, /if\s*\(!reduce\s*\|\|\s*!mascot/);
  assert.match(blink, /mascot\.face\.name/);
  assert.match(blink, /mascot\.setFace\(["']Eyes Closed["'],\s*true\)/);
  assert.match(blink, /mascot\.setFace\(prior,\s*true\)/);
  assert.match(html, /if\s*\(reduce\)\s*\{[\s\S]*?startReducedBlink\(\)/);
});
