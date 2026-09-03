import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [estudioHtml, estudioCss, galeriaHtml, galeriaCss, ptDeck, enDeck] = await Promise.all([
  readFile(new URL('../estudio/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../estudio/estudio.css', import.meta.url), 'utf8'),
  readFile(new URL('../galeria/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../galeria/galeria.css', import.meta.url), 'utf8'),
  readFile(new URL('../assets/manifesto.pt.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../assets/manifesto.en.json', import.meta.url), 'utf8').then(JSON.parse),
]);

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing function ${name}`);
  const next = source.indexOf('\n  function ', start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

function cssBlock(source, header) {
  const start = source.indexOf(header);
  assert.notEqual(start, -1, `missing CSS block ${header}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  assert.fail(`unclosed CSS block ${header}`);
}

test('both rooms prepaint ?next=1 before styles and declare exactly one NEXT constant', () => {
  for (const [room, html] of [['estudio', estudioHtml], ['galeria', galeriaHtml]]) {
    const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
    const prepaint = head.indexOf('classList.add("is-next")');
    const firstStyle = head.indexOf('rel="stylesheet"');

    assert.match(head, /URLSearchParams\(location\.search\)\.get\("next"\)\s*===\s*"1"/);
    assert.ok(prepaint > -1 && prepaint < firstStyle, `${room} must prepaint before CSS`);

    const declarations = html.match(/\bconst\s+NEXT\b/g) ?? [];
    assert.equal(declarations.length, 1, `${room} must have one NEXT constant`);
    assert.match(html, /const NEXT\s*=\s*document\.documentElement\.classList\.contains\("is-next"\);/);
  }
});

test('both viewport declarations opt into safe-area geometry', () => {
  assert.match(estudioHtml, /<meta name="viewport" content="[^"]*viewport-fit=cover[^"]*">/);
  assert.match(galeriaHtml, /<meta name="viewport" content="[^"]*viewport-fit=cover[^"]*">/);
});

test('the gallery bottom captions and Estudio canon door clear safe-area insets', () => {
  assert.match(
    galeriaCss,
    /\.strip--bottom \.face__name\s*{[^}]*height:\s*calc\([^;]*var\(--face-name\)[^;]*env\(safe-area-inset-bottom,\s*0px\)[^;]*\)[^}]*padding-bottom:\s*env\(safe-area-inset-bottom,\s*0px\)/s,
  );
  assert.match(
    estudioCss,
    /\.canon-door\s*{[^}]*left:\s*max\([^;]*env\(safe-area-inset-left,\s*0px\)[^;]*\)[^}]*bottom:\s*env\(safe-area-inset-bottom,\s*0px\)/s,
  );
});

test('every compact Estudio button and the canon door has a 44px target', () => {
  assert.match(
    estudioCss,
    /\.maker \.ctl,\s*\.switches button,\s*\.canon-door\s*{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/s,
  );
  assert.match(
    estudioCss,
    /\.canon-door\s*{[^}]*display:\s*(?:flex|grid|inline-flex|inline-grid)/s,
    'min-height must apply to the canon anchor box',
  );
});

test('gallery chips exist before first setCurrent and setCurrent updates detached chips', () => {
  const setCurrent = functionSource(galeriaHtml, 'setCurrent');
  assert.match(setCurrent, /chips\.forEach\(function \(chip\)/);
  assert.match(setCurrent, /chip\.el\.setAttribute\("aria-pressed",\s*String\(chip\.name\s*===\s*name\)\)/);

  const boot = galeriaHtml.slice(galeriaHtml.indexOf('var startFace = "Default"'));
  assert.ok(
    boot.indexOf('makeChips();') < boot.indexOf('setCurrent(startFace);'),
    'first selection must be applied after the chip buttons are created',
  );

  const ceremony = functionSource(galeriaHtml, 'maybeCeremony');
  assert.match(
    ceremony,
    /stage\.setFace\("Default",\s*true\);\s*setCurrent\("Default"\);/,
    'the temporary ceremony face must also own aria-pressed',
  );
});

test('a rejected native share exposes a visible state without unruled copy', () => {
  assert.equal(ptDeck.estudio.shareFailure, undefined, 'P04: no approved PT failure line exists');
  assert.equal(enDeck.estudio.shareFailure, undefined, 'the decks must remain mirrored');

  const failure = functionSource(estudioHtml, 'showShareFailure');
  assert.match(failure, /classList\.add\("is-failure"\)/);
  assert.match(failure, /setAttribute\("role",\s*"alert"\)/);
  assert.match(failure, /scrollIntoView\(\{ block:\s*"nearest" \}\)/);
  assert.doesNotMatch(failure, /textContent|innerHTML/, 'failure state must reuse the deck hint');
  assert.match(estudioHtml, /navigator\.share\(\{ url: url \}\)\.catch\(showShareFailure\)/);
  assert.match(
    estudioCss,
    /\.maker__hint\.is-failure\s*{[^}]*border:[^;]*solid\s+var\(--qevr-pink\)[^}]*color:\s*var\(--qevr-pink\)/s,
  );
});

test('next-mode phone Estudio is a fixed room with an internally reachable tool well', () => {
  assert.match(
    estudioCss,
    /html\.is-next,\s*html\.is-next body\s*{[^}]*height:\s*100%[^}]*overflow:\s*hidden/s,
  );
  assert.match(
    estudioCss,
    /html\.is-next \.maker\s*{[^}]*height:\s*100svh[^}]*min-height:\s*0[^}]*overflow:\s*hidden/s,
  );
  assert.match(
    estudioCss,
    /html\.is-next \.maker__tools\s*{[^}]*min-height:\s*0[^}]*overflow-y:\s*auto[^}]*overscroll-behavior:\s*contain/s,
  );
  assert.match(
    estudioCss,
    /html\.is-next \.maker__frame\s*{[^}]*padding-bottom:\s*calc\([^;]*44px[^;]*env\(safe-area-inset-bottom,\s*0px\)[^;]*\)/s,
  );
});

test('next-mode Estudio has explicit portrait and landscape contracts', () => {
  assert.match(
    estudioCss,
    /@media \(max-width:\s*720px\) and \(orientation:\s*portrait\)\s*{[\s\S]*?html\.is-next \.maker__frame\s*{[^}]*flex-direction:\s*column[\s\S]*?html\.is-next \.maker__art\s*{[^}]*height:\s*clamp\(/,
  );
  assert.match(
    estudioCss,
    /@media \(orientation:\s*landscape\) and \(max-height:\s*499px\)\s*{[\s\S]*?html\.is-next \.maker__frame\s*{[^}]*flex-direction:\s*row[\s\S]*?html\.is-next \.maker__tools\s*{[^}]*overflow-y:\s*auto/,
  );
  assert.match(
    estudioHtml,
    /if \(NEXT && window\.matchMedia\("\(orientation: landscape\)"\)\.matches\)\s*{[^}]*box\.clientHeight[^}]*Math\.floor\(h \/ rows\)/s,
  );
});

test('next-mode short landscape covers 844x390 and 896x414 without changing LIVE', () => {
  const rotatedPhones = [
    { width: 844, height: 390 },
    { width: 896, height: 414 },
  ];
  for (const stop of rotatedPhones) {
    assert.ok(stop.width > stop.height && stop.height <= 499, `${stop.width}x${stop.height} gate`);
  }

  const common = cssBlock(
    estudioCss,
    '@media (max-width: 720px), (orientation: landscape) and (max-height: 499px)',
  );
  const landscape = cssBlock(
    estudioCss,
    '@media (orientation: landscape) and (max-height: 499px)',
  );
  assert.match(common, /html\.is-next \.maker\s*{[^}]*height:\s*100svh[^}]*overflow:\s*hidden/s);
  assert.match(landscape, /html\.is-next \.maker__zoom\s*{[^}]*display:\s*flex/s);
  assert.doesNotMatch(common, /(?:^|})\s*\.(?:maker|maker__)/, 'common fixes must stay behind is-next');
  assert.doesNotMatch(landscape, /(?:^|})\s*\.(?:maker|maker__)/, 'landscape fixes must stay behind is-next');

  const isPhone = functionSource(estudioHtml, 'isPhone');
  assert.match(isPhone, /NEXT[^}]*orientation:\s*landscape[^}]*max-height:\s*499px/s);
});

test('rotated next-mode keeps every Estudio control reachable above the canon floor', () => {
  const landscape = cssBlock(
    estudioCss,
    '@media (orientation: landscape) and (max-height: 499px)',
  );
  assert.match(landscape, /html\.is-next \.maker__tools\s*{[^}]*overflow-y:\s*auto/s);
  assert.match(
    landscape,
    /html\.is-next \.maker__frame\s*{[^}]*padding:[^;]*calc\([^;]*44px[^;]*env\(safe-area-inset-bottom,\s*0px\)[^;]*\)/s,
  );

  const toolsStart = estudioHtml.indexOf('<div class="maker__tools">');
  const doorStart = estudioHtml.indexOf('<a class="canon-door"');
  const tools = estudioHtml.slice(toolsStart, doorStart);
  for (const id of [
    'nameField', 'zoomWhole', 'zoomBand', 'btnUndo', 'btnReset',
    'btnLink', 'btnCard', 'btnSend', 'sendHint',
  ]) {
    assert.match(tools, new RegExp(`id="${id}"`), `${id} must remain in the scrollable tool well`);
  }
});

test('the next flag survives Estudio URL-as-file updates', () => {
  const syncCode = functionSource(estudioHtml, 'syncCode');
  assert.match(syncCode, /if \(NEXT\) qs \+= "&next=1";/);
});

test('Estudio clears the 14px rail at phone width without shrinking the wordmark', () => {
  const phone = cssBlock(estudioCss, '@media (max-width: 720px)');
  assert.match(
    phone,
    /\.bar__mark\s*{[^}]*margin-left:\s*var\(--rail\)/s,
    'the room-specific phone header must reserve the existing rail width before QIQI',
  );
});

test('Estudio attaches the canon door to the desktop workbench', () => {
  const desktop = cssBlock(estudioCss, '@media (min-width: 721px)');
  assert.match(desktop, /\.maker\s*{[^}]*position:\s*relative/s);
  assert.match(
    desktop,
    /\.canon-door\s*{[^}]*position:\s*absolute[^}]*left:\s*0/s,
    'the 1920px door must share the workbench containing block and left edge',
  );
});

test('Galeria control words stay atomic through the former 721-1072px wrap range', () => {
  assert.match(
    galeriaCss,
    /\.stage__controls \.ctl\s*{[^}]*white-space:\s*nowrap/s,
    'SE MEXE and every sibling control must remain one unbroken label',
  );
});

test('each room keeps one destination-language action', () => {
  for (const [room, html] of [['Estudio', estudioHtml], ['Galeria', galeriaHtml]]) {
    const switches = html.slice(html.indexOf('<div class="switches">'), html.indexOf('</div>', html.indexOf('<div class="switches">')));
    assert.equal((switches.match(/<button\b/g) ?? []).length, 1, `${room} must not render both language choices`);
    assert.match(html, /langToggle"\)\.textContent\s*=\s*LANG\s*===\s*"pt"\s*\?\s*"EN"\s*:\s*"PT"/);
  }
});

test('proposed Estudio and Galeria dock language into one safe full-height header slot', () => {
  for (const [room, css] of [['Estudio', estudioCss], ['Galeria', galeriaCss]]) {
    assert.match(
      css,
      /html\.is-next \.bar__nav\s*{[^}]*margin-right:\s*44px/s,
      `${room} must reserve the destination-language slot instead of covering content`,
    );
    assert.match(
      css,
      /html\.is-next \.switches\s*{[^}]*top:\s*env\(safe-area-inset-top,\s*0px\)[^}]*height:\s*calc\(var\(--bar\)\s*-\s*env\(safe-area-inset-top,\s*0px\)\)[^}]*padding:\s*0[^}]*z-index:\s*var\(--z-header\)/s,
      `${room} proposed language action must occupy header content below the safe top`,
    );
    assert.match(
      css,
      /html\.is-next \.switches button\s*{[^}]*width:\s*44px[^}]*height:\s*100%[^}]*min-height:\s*44px/s,
      `${room} proposed language action must stay full-height and touch-safe`,
    );
  }
});

test('Galeria gives every control pair a full row through 721-1072px', () => {
  const formerWrapRange = cssBlock(
    galeriaCss,
    '@media (min-width: 721px) and (max-width: 1072px)',
  );
  assert.match(
    formerWrapRange,
    /\.stage__controls\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
    'nowrap is insufficient when SE MEXE still overflows a four-across 721px row',
  );
});

test('proposed Galeria clips the moving desktop lane below the docked header', () => {
  assert.match(
    galeriaCss,
    /html\.is-next \.frame\s*{[^}]*overflow:\s*hidden/s,
    'side-lane chips must not travel behind the proposed language slot',
  );
});

test('the proposed Estudio tool well keeps its system scrollbar', () => {
  const proposedPhone = cssBlock(
    estudioCss,
    '@media (max-width: 720px), (orientation: landscape) and (max-height: 499px)',
  );
  assert.doesNotMatch(proposedPhone, /scrollbar-width|::-webkit-scrollbar/);
});
