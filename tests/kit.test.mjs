import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const catalogUrl = new URL('../kit/catalog.mjs', import.meta.url);
const catalogExists = existsSync(catalogUrl);
const catalogModule = catalogExists
  ? await import(catalogUrl)
  : { KIT_CATALOG: {}, SCREEN_ORDER: [], WIDTH_STOPS: [] };
const { KIT_CATALOG, SCREEN_ORDER, WIDTH_STOPS } = catalogModule;
const logicUrl = new URL('../kit/logic.mjs', import.meta.url);
const logicExists = existsSync(logicUrl);
const logicModule = logicExists ? await import(logicUrl) : {};

const EXPECTED_WIDTH_STOPS = [
  { id: 'android-360', label: 'ANDROID 360', width: 360, height: 800 },
  { id: 'iphone-se', label: 'iPHONE SE', width: 375, height: 667 },
  { id: 'iphone-14', label: 'iPHONE 14', width: 390, height: 844 },
  { id: 'android-412', label: 'ANDROID 412', width: 412, height: 915 },
  { id: 'iphone-16-plus', label: 'iPHONE 16 PLUS', width: 430, height: 932 },
  { id: 'laptop-13', label: '13" LAPTOP', width: 1280, height: 800 },
  { id: 'macbook-15', label: '15" MACBOOK', width: 1440, height: 900 },
  { id: 'display-1080p', label: '1080P DISPLAY', width: 1920, height: 1080 },
];

test('the new machine-readable catalog exists', () => {
  assert.ok(catalogExists, 'kit/catalog.mjs has not been created');
});

test('the kit interaction logic exists', () => {
  assert.ok(logicExists, 'kit/logic.mjs has not been created');
});

test('the eight width stops match the locked labels and pixels', () => {
  assert.deepEqual(WIDTH_STOPS, EXPECTED_WIDTH_STOPS);
});

test('the catalog keeps the locked screen order and routes', () => {
  assert.deepEqual(SCREEN_ORDER, [
    'manifesto',
    'estudio',
    'galeria',
    'sala',
    'canon',
    '404',
  ]);

  assert.deepEqual(
    SCREEN_ORDER.map((id) => KIT_CATALOG[id].route),
    ['/', '/estudio/', '/galeria/', '/sala/', '/canon/', '/404.html'],
  );
});

test('every screen starts with FULL SCREEN and every component is operable', () => {
  const ids = new Set();

  for (const screenId of SCREEN_ORDER) {
    const screen = KIT_CATALOG[screenId];
    assert.ok(screen, `missing screen ${screenId}`);
    assert.equal(screen.components[0]?.name, 'FULL SCREEN', `${screenId} first row`);

    for (const component of screen.components) {
      assert.equal(typeof component.id, 'string');
      assert.ok(component.id.length > 0, `${screenId} has an empty id`);
      assert.ok(!ids.has(component.id), `duplicate component id ${component.id}`);
      ids.add(component.id);

      assert.equal(typeof component.job, 'string', `${component.id} job type`);
      assert.ok(component.job.trim(), `${component.id} missing job`);

      const selectors = Array.isArray(component.selectors)
        ? component.selectors
        : [component.selectors];
      assert.ok(selectors.length > 0, `${component.id} missing selectors`);
      assert.ok(
        selectors.every((selector) => typeof selector === 'string' && selector.trim()),
        `${component.id} has an invalid selector`,
      );

      assert.ok(Array.isArray(component.states), `${component.id} states type`);
      assert.ok(component.states.length > 0, `${component.id} missing states`);
      for (const state of component.states) {
        assert.ok(state.id && state.name, `${component.id} has an unnamed state`);
        assert.equal(typeof state.action, 'object', `${component.id}/${state.id} action`);
        assert.equal(typeof state.current, 'object', `${component.id}/${state.id} current`);
      }
    }
  }
});

test('the catalog keeps every required row in exact visual order', () => {
  const expected = {
    manifesto: ['FULL SCREEN', 'SPEAKING', 'MASCOT', 'COLOUR PICKER', 'PAGE BREAK', 'HEADER', 'HEADER NAV', 'SWITCHES', 'THERMO', 'GRID', 'A PISTA', 'AS PESSOAS', 'O QIQI', 'AS REGRAS', 'UM PRESENTE', 'TEXT', 'POSTER', 'SEE YOU ON THE FLOOR', 'DOORS', 'COMPANION'],
    estudio: ['FULL SCREEN', 'HEADER', 'HEADER NAV', 'EN SWITCH', 'WORKBENCH', 'ZOOM', 'NAME', 'EDIT ACTIONS', 'PREVIEWS', 'CODE', 'SHARE ROW', 'CANON DOOR'],
    galeria: ['FULL SCREEN', 'HEADER', 'HEADER NAV', 'EN SWITCH', 'CONVEYOR', 'STAGE', 'CONTROLS'],
    sala: ['FULL SCREEN', 'VOLTAR', 'EN SWITCH', 'FLOOR NAV', 'HISTÓRIA', 'DNA', 'MUDANÇAS'],
    canon: ['FULL SCREEN', 'HEADER', 'VOLTAR AO ESTÚDIO', 'THE CANON GRID', 'INSPECTOR'],
    404: ['FULL SCREEN', 'HEADER', 'EN SWITCH', 'PIXEL CODE', 'MESSAGE', 'MASCOT', 'DOOR'],
  };

  for (const screenId of SCREEN_ORDER) {
    assert.deepEqual(
      KIT_CATALOG[screenId].components.map(({ name }) => name),
      expected[screenId],
      `${screenId} row order`,
    );
  }
});

test('every catalog finding has a valid gate, including named between-stop evidence', () => {
  const widths = WIDTH_STOPS.map(({ width }) => width);
  const minimum = Math.min(...widths);
  const maximum = Math.max(...widths);

  for (const screenId of SCREEN_ORDER) {
    for (const component of KIT_CATALOG[screenId].components) {
      for (const bug of component.bugs ?? []) {
        assert.ok(bug.id && bug.text, `${component.id} has an incomplete bug`);
        assert.equal(typeof bug.minWidth, 'number', `${bug.id} minWidth`);
        assert.equal(typeof bug.maxWidth, 'number', `${bug.id} maxWidth`);
        assert.ok(bug.minWidth >= minimum, `${bug.id} starts below the matrix`);
        assert.ok(bug.maxWidth <= maximum, `${bug.id} ends above the matrix`);
        assert.ok(bug.minWidth <= bug.maxWidth, `${bug.id} gate is reversed`);
        const reachable = WIDTH_STOPS.some((stop) => logicModule.isInGate(bug, stop));
        if (bug.betweenStops) {
          assert.equal(reachable, false, `${bug.id} is not actually between locked stops`);
        } else {
          assert.ok(reachable, `${bug.id} is unreachable at every locked device stop`);
        }
      }
    }
  }
});

test('room-owned components activate their live room before isolating it', () => {
  const components = Object.fromEntries(
    KIT_CATALOG.sala.components.map((component) => [component.id, component]),
  );
  assert.deepEqual(components['sala-historia'].setup, {
    type: 'click',
    selector: '[data-open-room="Story"]',
  });
  assert.deepEqual(components['sala-dna'].setup, {
    type: 'click',
    selector: '[data-open-room="Dna"]',
  });
  assert.deepEqual(components['sala-mudancas'].setup, {
    type: 'click',
    selector: '[data-open-room="Growth"]',
  });
});

test('transient commands never claim that mere element existence is a current state', () => {
  const byState = new Map();
  for (const screenId of SCREEN_ORDER) {
    for (const component of KIT_CATALOG[screenId].components) {
      for (const itemState of component.states) byState.set(itemState.id, itemState);
    }
  }
  const actionOnly = [
    'poke', 'nine-pokes', 'hold-to-sala', 'poster-download',
    'door-estudio', 'door-galeria', 'estudio-paint', 'edit-undo',
    'share-link', 'share-card', 'share-send', 'canon-door-open',
    'stage-poke', 'controls-glitch', 'controls-download', 'dna-prev',
    'dna-next', 'canon-back', 'canon-previous', 'canon-next',
    '404-arc', '404-poke', '404-door-open',
  ];
  actionOnly.forEach((id) => {
    assert.equal(byState.get(id)?.current?.type, 'unobservable', `${id} current truth`);
  });
});

test('catalog records live effects and contradictions without inventing canvas state', () => {
  const component = (screenId, id) => KIT_CATALOG[screenId].components.find((item) => item.id === id);
  const stateById = (screenId, componentId, stateId) => (
    component(screenId, componentId).states.find((itemState) => itemState.id === stateId)
  );

  assert.match(component('manifesto', 'text').note, /four bay text variants/i);
  assert.ok(stateById('manifesto', 'text', 'text-rules-poster'));
  assert.ok(component('manifesto', 'text').ruled?.some(({ id }) => id === 'mobile-read-law-2026-08-31'));
  assert.ok(component('manifesto', 'doors').ruled?.some(({ id }) => id === 'mobile-read-law-2026-08-31'));
  assert.deepEqual(
    component('manifesto', 'companion').states.map(({ name }) => name),
    ['CORNER', 'A PISTA FACE', 'AS PESSOAS FACE', 'O QIQI FACE', 'AS REGRAS FACE', 'UM PRESENTE FACE'],
  );

  assert.ok(stateById('estudio', 'estudio-workbench', 'estudio-paint').effects
    .some(({ selector }) => selector === '#loupe'));
  assert.equal(stateById('estudio', 'estudio-previews', 'previews-live').action.type, 'scrollTo');
  assert.equal(stateById('estudio', 'estudio-code', 'code-live').action.type, 'scrollTo');
  assert.deepEqual(component('galeria', 'galeria-conveyor').selectors, ['.face[data-name]', '#prototypeCount']);
  assert.equal(stateById('galeria', 'galeria-conveyor', 'conveyor-happy').name, 'TÔ BEM');
  assert.ok(stateById('galeria', 'galeria-stage', 'stage-poke').effects.length >= 2);
  assert.ok(stateById('galeria', 'galeria-controls', 'controls-live').effects
    .some(({ selector }) => selector === '#stageBtn'));

  assert.deepEqual(
    component('404', '404-mascot').states.map(({ name }) => name),
    ['SHOCKED → DEAD', 'POKE'],
  );
  assert.match(component('404', '404-mascot').note, /not DOM-observable/i);
});

test('every ruled note carries its ruling text', () => {
  for (const screenId of SCREEN_ORDER) {
    for (const component of KIT_CATALOG[screenId].components) {
      for (const ruled of component.ruled ?? []) {
        assert.equal(typeof ruled.text, 'string', `${component.id} ruled text type`);
        assert.ok(ruled.text.trim(), `${component.id} has an empty ruled note`);
      }
    }
  }
});

test('preview components declare their proposed body and validation status', () => {
  const required = [
    ['manifesto', 'full-screen'],
    ['manifesto', 'speaking'],
    ['manifesto', 'colour-picker'],
    ['manifesto', 'header'],
    ['manifesto', 'switches'],
    ['manifesto', 'thermo'],
    ['manifesto', 'grid'],
    ['manifesto', 'as-pessoas'],
    ['manifesto', 'text'],
    ['manifesto', 'doors'],
    ['manifesto', 'companion'],
    ['estudio', 'estudio-full-screen'],
    ['estudio', 'estudio-en-switch'],
    ['estudio', 'estudio-workbench'],
    ['estudio', 'estudio-share-row'],
    ['estudio', 'estudio-canon-door'],
    ['galeria', 'galeria-en-switch'],
  ];

  for (const [screenId, componentId] of required) {
    const item = KIT_CATALOG[screenId].components.find(({ id }) => id === componentId);
    assert.ok(item?.preview, `${screenId}/${componentId} is missing preview metadata`);
    assert.equal(item.preview.status, 'PREVIEW BUILT — VALIDATE IN PROPOSED');
  }

  const speaking = KIT_CATALOG.manifesto.components.find(({ id }) => id === 'speaking');
  assert.ok(speaking.preview.states.some(({ id }) => id === 'colour-line'));
  assert.equal(speaking.preview.states.find(({ id }) => id === 'invitation-line').name, 'VAI, CLICA EM MIM');
  assert.ok(speaking.ruled.some(({ id }) => id === 'K2'));
  const picker = KIT_CATALOG.manifesto.components.find(({ id }) => id === 'colour-picker');
  assert.ok(picker.preview.selectors.includes('#colorToggle'));
  assert.ok(picker.ruled.some(({ id }) => id === 'K2'));

  const header = KIT_CATALOG.manifesto.components.find(({ id }) => id === 'header');
  assert.deepEqual(
    header.preview.states.map(({ id }) => id),
    ['header-show-pt', 'header-show-en', 'header-show-pink', 'header-show-green'],
  );
  assert.ok(header.ruled.some(({ id }) => id === 'destination-only-header'));
  assert.deepEqual(
    picker.preview.states.map(({ id }) => id),
    ['landing-pair', 'docked-show-pink', 'docked-show-green'],
  );

  const currentChecks = (itemState) => JSON.stringify(itemState.current);
  assert.match(currentChecks(header.preview.states[2]), /#headerDock #colorToggle/);
  assert.match(currentChecks(header.preview.states[2]), /to-pink/);
  assert.match(currentChecks(header.preview.states[3]), /#headerDock #colorToggle/);
  assert.match(currentChecks(header.preview.states[3]), /to-green/);
  assert.deepEqual(
    KIT_CATALOG.manifesto.components.find(({ id }) => id === 'switches').preview.selectors,
    ['#headerDock #langToggle', '#headerDock #colorToggle'],
  );

  const share = KIT_CATALOG.estudio.components.find(({ id }) => id === 'estudio-share-row');
  assert.ok(share.ruled.some(({ id }) => id === 'P04'));

  for (const componentId of ['a-pista', 'um-presente']) {
    const item = KIT_CATALOG.manifesto.components.find(({ id }) => id === componentId);
    assert.equal(item.preview, undefined, `${componentId} must wait for GP's PT heads`);
  }
});

test('repaired findings remain honest and the ruled contradiction gates are exact', () => {
  const components = SCREEN_ORDER.flatMap((screenId) => KIT_CATALOG[screenId].components);
  const findings = new Map(components.flatMap((item) => (item.bugs ?? []).map((bug) => [bug.id, bug])));

  assert.equal(findings.get('companion-under-doors')?.fixed, true);
  assert.equal(findings.get('boot-layout-jump')?.fixed, true);
  assert.equal(findings.get('estudio-lang-target')?.fixed, true);
  assert.equal(findings.get('estudio-small-targets')?.fixed, true);
  assert.equal(findings.get('canon-door-safe-area')?.fixed, true);
  assert.match(findings.get('boot-layout-jump')?.text ?? '', /220px/i);
  assert.deepEqual(
    [findings.get('controls-move-wrap')?.minWidth, findings.get('controls-move-wrap')?.maxWidth],
    [721, 1072],
  );
  assert.equal(findings.get('controls-move-wrap')?.betweenStops, true);
  assert.equal(findings.get('dna-short-height')?.maxHeight, 719);
  assert.equal(findings.get('growth-track-phone')?.maxWidth, 1920);
  assert.match(findings.get('growth-track-phone')?.text ?? '', /16px visual rail/i);
  assert.match(findings.get('growth-track-phone')?.text ?? '', /44px hitbox/i);
});

test('the five completed B7 repairs are fixed history and text previews stay scoped', () => {
  const components = SCREEN_ORDER.flatMap((screenId) => KIT_CATALOG[screenId].components);
  const findings = new Map(components.flatMap((item) => (item.bugs ?? []).map((bug) => [bug.id, bug])));
  const b7Repairs = [
    'estudio-wordmark-rail',
    'canon-door-1920-detach',
    'floor-nav-short-desktop',
    'dna-short-height',
    'controls-move-wrap',
  ];

  for (const id of b7Repairs) {
    assert.equal(findings.get(id)?.fixed, true, `${id} must render as FIXED`);
    assert.match(findings.get(id)?.text ?? '', /^Before B7\b/, `${id} must describe historical truth`);
  }

  const textRule = KIT_CATALOG.manifesto.components
    .find(({ id }) => id === 'as-pessoas')
    .ruled.find(({ id }) => id === 'text-standard-2026-08-31');
  assert.match(textRule.text, /AS PESSOAS is built/);
  assert.match(textRule.text, /A PISTA and UM PRESENTE wait for GP-approved PT heads/);
});

test('proposed phone reading is one stable screen without page or section scroll', () => {
  const component = (id) => KIT_CATALOG.manifesto.components.find((item) => item.id === id);
  const screenRule = component('full-screen').ruled
    .find(({ id }) => id === 'mobile-read-law-2026-08-31');

  assert.match(screenRule.text, /exactly one screen/i);
  assert.match(screenRule.text, /no page scroll/i);
  assert.match(screenRule.text, /no nested section scroll/i);
  assert.match(screenRule.text, /rows stretch in every state/i);
  assert.match(screenRule.text, /hugs its own content/i);
  assert.match(screenRule.text, /never resizes the box/i);
  assert.match(screenRule.text, /nearly fill each row/i);
  assert.match(screenRule.text, /four-item accordion/i);
  assert.match(screenRule.text, /only inside UM PRESENTE/i);
  assert.match(screenRule.text, /thermometer stays.+not a scrollbar/i);
  assert.match(screenRule.text, /ESTÚDIO and GALERIA doors stay at the screen floor/i);
  assert.match(screenRule.text, /AS REGRAS keeps its modal behavior/i);

  const phoneReadLanguage = JSON.stringify(
    ['full-screen', 'page-break', 'grid', 'as-regras', 'text', 'see-you-on-the-floor', 'doors']
      .map((id) => {
        const item = component(id);
        return { ruled: item.ruled, lawBoxes: item.lawBoxes, preview: item.preview };
      }),
  );
  assert.doesNotMatch(
    phoneReadLanguage,
    /page-level|normal document flow|document floor|document page scrolls|expanding bay/i,
  );

  assert.match(component('as-regras').job, /poster instead of the text bay/i);
  assert.ok(component('as-regras').states.some(({ id }) => id === 'rules-open'));
});

test('catalog truth names corner-only companion law, section overflow, and proposed overlap removal', () => {
  const component = (screenId, id) => (
    KIT_CATALOG[screenId].components.find((item) => item.id === id)
  );
  const finding = (screenId, componentId, bugId) => (
    component(screenId, componentId).bugs.find(({ id }) => id === bugId)
  );

  const companion = component('manifesto', 'companion');
  assert.deepEqual(
    companion.bugs.filter(({ fixed }) => fixed).map(({ id }) => id),
    ['companion-under-doors'],
  );
  assert.ok(companion.ruled.some(({ id }) => id === 'companion-corner-only'));
  assert.match(
    companion.ruled.find(({ id }) => id === 'companion-corner-only').text,
    /corner-only/i,
  );
  assert.match(companion.note, /ruled/i);
  assert.doesNotMatch(companion.note, /divergence/i);

  assert.match(component('manifesto', 'speaking').note, /never.*standalone VAI/i);
  assert.match(component('manifesto', 'a-pista').note, /contained/i);
  assert.match(finding('manifesto', 'as-pessoas', 'people-mobile-overflow').text, /materially/i);
  assert.match(finding('manifesto', 'o-qiqi', 'qiqi-mobile-overflow').text, /marginal/i);

  assert.equal(
    finding('estudio', 'estudio-en-switch', 'estudio-lang-face-overlap').proposedStatus,
    'GONE IN PROPOSED',
  );
  assert.equal(
    finding('galeria', 'galeria-en-switch', 'galeria-lang-chip-overlap').proposedStatus,
    'GONE IN PROPOSED',
  );
});

test('kit chrome exposes LIVE and PROPOSED without using the site font', async () => {
  const html = await readFile(new URL('../kit/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../kit/kit.css', import.meta.url), 'utf8');
  const source = await readFile(new URL('../kit/kit.js', import.meta.url), 'utf8');

  assert.match(html, /data-kit-mode=["']live["']/i);
  assert.match(html, /data-kit-mode=["']proposed["']/i);
  assert.match(source, /formatPreviewRoute/);
  assert.match(source, /preview-chip/);
  assert.match(css, /ui-monospace,\s*["']SF Mono["'],\s*Menlo,\s*Consolas,\s*monospace/);
  assert.doesNotMatch(css, /Space Mono/i);
});

test('the kit is excluded from search and link following', async () => {
  const indexUrl = new URL('../kit/index.html', import.meta.url);
  assert.ok(existsSync(indexUrl), 'kit/index.html has not been created');
  const html = await readFile(indexUrl, 'utf8');
  assert.match(
    html,
    /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex[^"']*nofollow[^"']*["']\s*\/?>/i,
  );
});

test('fragment-path deep links round-trip component, mode, and width on reload', () => {
  const { parseKitHash, formatKitHash } = logicModule;
  assert.equal(typeof parseKitHash, 'function');
  assert.deepEqual(parseKitHash('', KIT_CATALOG, SCREEN_ORDER, WIDTH_STOPS), {
    screenId: 'manifesto',
    componentId: 'full-screen',
    mode: 'live',
    widthId: 'laptop-13',
  });
  assert.deepEqual(parseKitHash('#manifesto/a-pista', KIT_CATALOG, SCREEN_ORDER, WIDTH_STOPS), {
    screenId: 'manifesto',
    componentId: 'a-pista',
    mode: 'live',
    widthId: 'laptop-13',
  });
  assert.deepEqual(
    parseKitHash(
      '#manifesto/text?mode=proposed&width=iphone-se',
      KIT_CATALOG,
      SCREEN_ORDER,
      WIDTH_STOPS,
    ),
    {
      screenId: 'manifesto',
      componentId: 'text',
      mode: 'proposed',
      widthId: 'iphone-se',
    },
  );
  assert.deepEqual(
    parseKitHash(
      '#not-real?mode=unknown&width=not-real',
      KIT_CATALOG,
      SCREEN_ORDER,
      WIDTH_STOPS,
    ),
    {
    screenId: 'manifesto',
    componentId: 'full-screen',
      mode: 'live',
      widthId: 'laptop-13',
    },
  );
  assert.equal(formatKitHash('manifesto', 'full-screen', KIT_CATALOG), '#manifesto');
  assert.equal(formatKitHash('manifesto', 'a-pista', KIT_CATALOG), '#manifesto/a-pista');
  assert.equal(
    formatKitHash('manifesto', 'text', KIT_CATALOG, { mode: 'proposed' }),
    '#manifesto/text?mode=proposed',
  );
  assert.equal(
    formatKitHash('manifesto', 'text', KIT_CATALOG, {
      mode: 'proposed',
      widthId: 'iphone-se',
    }),
    '#manifesto/text?mode=proposed&width=iphone-se',
  );

  const generated = formatKitHash('galeria', 'galeria-controls', KIT_CATALOG, {
    mode: 'proposed',
    widthId: 'display-1080p',
  });
  assert.deepEqual(
    parseKitHash(generated, KIT_CATALOG, SCREEN_ORDER, WIDTH_STOPS),
    {
      screenId: 'galeria',
      componentId: 'galeria-controls',
      mode: 'proposed',
      widthId: 'display-1080p',
    },
  );
});

test('interactive kit navigation pushes history while canonical reload setup replaces it', () => {
  const { writeKitHash } = logicModule;
  assert.equal(typeof writeKitHash, 'function');
  const calls = [];
  const history = {
    pushState: (...args) => calls.push(['pushState', ...args]),
    replaceState: (...args) => calls.push(['replaceState', ...args]),
  };

  writeKitHash(history, '#manifesto/text?mode=proposed&width=iphone-se');
  writeKitHash(history, '#galeria/galeria-controls?width=display-1080p', { replace: true });

  assert.deepEqual(calls, [
    ['pushState', null, '', '#manifesto/text?mode=proposed&width=iphone-se'],
    ['replaceState', null, '', '#galeria/galeria-controls?width=display-1080p'],
  ]);
});

test('framed route changes replace their nested history entry', async () => {
  const source = await readFile(new URL('../kit/kit.js', import.meta.url), 'utf8');
  const loadStart = source.indexOf('function loadCurrentScreen');
  const loadEnd = source.indexOf('async function activateCurrentComponent', loadStart);
  const loadSource = source.slice(loadStart, loadEnd);
  assert.match(loadSource, /stageFrame\.contentWindow\.location\.replace\(route\)/);
  assert.doesNotMatch(loadSource, /stageFrame\.src\s*=\s*route/);
});

test('LIVE and PROPOSED stage routes differ only by the next query', () => {
  const { formatPreviewRoute } = logicModule;
  assert.equal(typeof formatPreviewRoute, 'function');
  assert.equal(formatPreviewRoute('/', 'live'), '/');
  assert.equal(formatPreviewRoute('/', 'proposed'), '/?next=1');
  assert.equal(formatPreviewRoute('/galeria/', 'live'), '/galeria/');
  assert.equal(formatPreviewRoute('/galeria/', 'proposed'), '/galeria/?next=1');
  assert.equal(formatPreviewRoute('/404.html', 'proposed'), '/404.html?next=1');
});

test('follow-spot component views are mode-parallel and never mutate catalog metadata', () => {
  const { componentForMode } = logicModule;
  assert.equal(typeof componentForMode, 'function');
  const component = KIT_CATALOG.manifesto.components.find(({ id }) => id === 'speaking');
  const before = structuredClone(component);
  const live = componentForMode(component, 'live');
  const proposed = componentForMode(component, 'proposed');

  assert.equal(live, component);
  assert.notEqual(proposed, component);
  assert.deepEqual(component, before);
  assert.deepEqual(proposed.selectors, component.preview.selectors);
  assert.equal(proposed.preview, component.preview);
});

test('kit source restores popstate without mutating the framed page for follow-spot', async () => {
  const source = await readFile(new URL('../kit/kit.js', import.meta.url), 'utf8');
  assert.match(source, /addEventListener\(['"]popstate['"],\s*restoreKitLocation\)/);
  assert.match(source, /writeKitHash\(history,/);

  const focusSource = source.match(/function focusSpecimen\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(focusSource, /getBoundingClientRect\(\)/);
  assert.match(focusSource, /scrollIntoView/);
  assert.doesNotMatch(focusSource, /append|replaceChildren|setAttribute|classList|\.style\b/);
});

test('a framed language reload reapplies the selected preview setup', async () => {
  const source = await readFile(new URL('../kit/kit.js', import.meta.url), 'utf8');
  const loadStart = source.indexOf("stageFrame.addEventListener('load'");
  const loadEnd = source.indexOf("scrimPath.addEventListener('pointerdown'", loadStart);
  const loadSource = source.slice(loadStart, loadEnd);
  assert.match(
    loadSource,
    /else if \(currentComponentView\(\)\.setup\)[\s\S]*runAction\(currentComponentView\(\)\.setup\)/,
  );
});

test('stage geometry preserves true device pixels and clips live rectangles', () => {
  const { computeStageScale, clipRect } = logicModule;
  assert.equal(computeStageScale(900, 700, 1280, 800, 24), 0.665625);
  assert.equal(computeStageScale(500, 1000, 390, 844, 24), 1);
  assert.deepEqual(
    clipRect({ left: -10, top: 20, right: 50, bottom: 100 }, 390, 844),
    { x: 0, y: 20, width: 50, height: 80 },
  );
  assert.equal(clipRect({ left: 500, top: 20, right: 550, bottom: 100 }, 390, 844), null);
});

test('live bug jumps choose a locked width inside the bug gate', () => {
  const { isInGate, chooseBugStop } = logicModule;
  const phoneBug = { minWidth: 360, maxWidth: 430 };
  assert.equal(isInGate(phoneBug, { width: 390, height: 844 }), true);
  assert.equal(isInGate(phoneBug, { width: 1280, height: 800 }), false);
  assert.equal(
    chooseBugStop(phoneBug, WIDTH_STOPS.find(({ id }) => id === 'laptop-13'), WIDTH_STOPS).id,
    'iphone-16-plus',
  );
  assert.equal(
    chooseBugStop({ minWidth: 1920, maxWidth: 1920 }, WIDTH_STOPS[1], WIDTH_STOPS).id,
    'display-1080p',
  );
});

test('pink highlighting is reserved for observed live bugs', () => {
  const { shouldUseBugHighlight } = logicModule;
  const stop = WIDTH_STOPS[3];
  const unobserved = { observed: false, minWidth: 360, maxWidth: 1920 };
  const observed = { observed: true, minWidth: 360, maxWidth: 1920 };
  const fixed = { observed: true, fixed: true, minWidth: 360, maxWidth: 1920 };
  assert.equal(typeof shouldUseBugHighlight, 'function');
  assert.equal(shouldUseBugHighlight(null, [unobserved], stop), false);
  assert.equal(shouldUseBugHighlight(null, [observed], stop), true);
  assert.equal(shouldUseBugHighlight(unobserved, [observed], stop), false);
  assert.equal(shouldUseBugHighlight(observed, [unobserved], stop), true);
  assert.equal(shouldUseBugHighlight(fixed, [observed], stop), false);
  assert.equal(shouldUseBugHighlight(null, [fixed], stop), false);
  assert.equal(shouldUseBugHighlight(null, [observed], stop, 'proposed'), false);
});

test('the sheet prints verified proposed removals instead of presenting them as live jumps', async () => {
  const source = await readFile(new URL('../kit/kit.js', import.meta.url), 'utf8');
  assert.match(source, /bug\.proposedStatus/);
  assert.match(source, /GONE IN PROPOSED/);
});

test('screen mode hides the SVG overlay with the real hidden attribute', async () => {
  const source = await readFile(new URL('../kit/kit.js', import.meta.url), 'utf8');
  assert.match(source, /spotlight\.toggleAttribute\(['"]hidden['"]/);
  assert.doesNotMatch(source, /spotlight\.hidden\s*=/);
});

test('panel actions preserve real pointer prerequisites and current-state idempotence', async () => {
  const source = await readFile(new URL('../kit/kit.js', import.meta.url), 'utf8');
  assert.match(source, /function clickElement[\s\S]*pointerdown[\s\S]*pointerup[\s\S]*element\.click\(\)/);
  assert.match(source, /checkCurrent\(itemState\.current\)[\s\S]*runAction\(itemState\.action\)/);
  assert.match(source, /currentComponentView\(\)\.setup/);
});

test('overlapping specimen rectangles become non-overlapping cutouts', () => {
  const { unionRectangles } = logicModule;
  assert.equal(typeof unionRectangles, 'function');
  assert.deepEqual(unionRectangles([
    { x: 0, y: 0, width: 100, height: 100 },
    { x: 20, y: 20, width: 30, height: 30 },
  ]), [{ x: 0, y: 0, width: 100, height: 100 }]);
  assert.deepEqual(unionRectangles([
    { x: 0, y: 0, width: 40, height: 40 },
    { x: 20, y: 0, width: 40, height: 40 },
  ]), [{ x: 0, y: 0, width: 60, height: 40 }]);
});
