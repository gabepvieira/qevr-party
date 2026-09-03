export const WIDTH_STOPS = [
  { id: 'android-360', label: 'ANDROID 360', width: 360, height: 800 },
  { id: 'iphone-se', label: 'iPHONE SE', width: 375, height: 667 },
  { id: 'iphone-14', label: 'iPHONE 14', width: 390, height: 844 },
  { id: 'android-412', label: 'ANDROID 412', width: 412, height: 915 },
  { id: 'iphone-16-plus', label: 'iPHONE 16 PLUS', width: 430, height: 932 },
  { id: 'laptop-13', label: '13" LAPTOP', width: 1280, height: 800 },
  { id: 'macbook-15', label: '15" MACBOOK', width: 1440, height: 900 },
  { id: 'display-1080p', label: '1080P DISPLAY', width: 1920, height: 1080 },
];

export const SCREEN_ORDER = [
  'manifesto',
  'estudio',
  'galeria',
  'sala',
  'canon',
  '404',
];

const exists = (selector) => ({ type: 'exists', selector });
const visible = (selector) => ({ type: 'visible', selector });
const missing = (selector) => ({ type: 'missing', selector });
const attr = (selector, name, equals) => ({ type: 'attribute', selector, name, equals });
const klass = (selector, name) => ({ type: 'class', selector, name });
const text = (selector, includes) => ({ type: 'text', selector, includes });
const value = (selector, equals) => ({ type: 'value', selector, equals });
const all = (...checks) => ({ type: 'all', checks });
const not = (check) => ({ type: 'not', check });
const unobservable = (reason) => ({ type: 'unobservable', reason });
const state = (id, name, action, current, extra = {}) => ({
  id,
  name,
  action,
  current,
  ...extra,
});
const component = (id, name, job, selectors, states, extra = {}) => ({
  id,
  name,
  job,
  selectors,
  states,
  bugs: [],
  ruled: [],
  ...extra,
});
const PREVIEW_STATUS = 'PREVIEW BUILT — VALIDATE IN PROPOSED';
const proposed = (extra = {}) => ({ status: PREVIEW_STATUS, ...extra });

const HEADER_DOCK = {
  id: 'header-dock-2026-08-31',
  text: 'EN/PT and the colour picker belong to the header. On the manifesto arrival the picker remains below QIQI; in the read it docks beside EN/PT and the hanging switch stack ends. On PROPOSED phones the bar runs the mark, then one stacked unit \u2014 the colour chip filling the top half of the bar, the language label its bottom half \u2014 then the three rooms; the QIQI mark fills the bar vertically (GP 2026-09-01).',
};

const HEADER_DESTINATION = {
  id: 'destination-only-header',
  text: 'Each docked toggle shows only its destination: EN shows PT, PT shows EN, green/day shows pink/party, and pink/party shows green/day. Language and colour calculate independently; the current option never appears as a second choice.',
};

const COMPANION_CORNER_ONLY = {
  id: 'companion-corner-only',
  text: 'Corner-only is ruled LIVE companion behavior. The retired bay jump and re-scan stay disabled; B1 changes only the companion z-order so it remains above the doors. In the PROPOSED phone read (GP 2026-08-31) he leaves the doors and floats bottom-right spatially ABOVE ESTÚDIO/GALERIA, hopping inside a zone whose ceiling is the live middle of the AS REGRAS row.',
};

const TEXT_STANDARD = {
  id: 'text-standard-2026-08-31',
  text: 'Every text section adopts the O QIQI head-line pattern. AS PESSOAS is built, while A PISTA and UM PRESENTE wait for GP-approved PT heads — GP has now asked for the UM PRESENTE list first (2026-08-31); the mechanism is armed and activates the moment gift.headLines lands in the deck. A head opens its full line. O QIQI is the live reference. AS REGRAS remains the poster.',
};

const MOBILE_READ = {
  id: 'mobile-read-law-2026-08-31',
  text: 'At widths up to 430px in PROPOSED, the manifesto read is exactly one screen with no page scroll and no nested section scroll. The five section rows stretch in every state and absorb all leftover room, their labels drawn per word to nearly fill each row from the left with a small right gutter. The selected section’s bay hugs its own content — sized once per section to its content plus the tallest inner line, so expanding an item never resizes the box — and its text never rescales. AS PESSOAS is a four-item accordion and its old closing block is retired. The NOS VEMOS NA PISTA stamp renders only inside UM PRESENTE, low by the doors. The thermometer stays a progress signal, not a scrollbar. ESTÚDIO and GALERIA doors stay at the screen floor. AS REGRAS keeps its modal behavior on a narrow recomposed sheet.',
};

const Z_LADDER = {
  id: 'z-ladder-2026-08-31',
  text: 'One site-wide ladder: thermo behind everything; content; header; doors; poster; companion in front of everything. One phone amendment (GP 2026-09-01): inside the PROPOSED phone read the thermometer paints ABOVE the section cards \u2014 a full-bleed hover surface slides in underneath the rail \u2014 while the header, doors and companion stay above it.',
};

const SPOKEN_COLOUR_LINE = {
  id: 'K2',
  text: 'In PROPOSED, QIQI alternates the existing invitation and colour line in one spoken signal slot. The landing swatches stay uncaptioned below him and dock into the header only when the read is active.',
};

const PT_PEN = {
  id: 'P04',
  text: 'PT is GP’s pen. A visible rejected-share state may reuse approved deck copy, but no new Portuguese display string is written without GP.',
};

const fullScreenState = state(
  'live-screen',
  'LIVE SCREEN',
  { type: 'reload' },
  exists('body'),
);

const COMPANION_SETUP = {
  type: 'scrollTo',
  selector: '.blocks',
  waitFor: not(klass('body', 'is-booting')),
  until: exists('#companionSlot > #mascotBtn'),
  timeout: 5000,
};

const READ_SETUP = { type: 'scrollTo', selector: '.blocks' };

const HEADER_DESTINATION_STATES = [
  state('header-show-pt', 'SHOWS PT · CURRENT EN', { type: 'click', selector: '#langToggle' }, all(
    attr('html', 'lang', 'en'),
    text('#langToggle', 'PT'),
  )),
  state('header-show-en', 'SHOWS EN · CURRENT PT', { type: 'click', selector: '#langToggle' }, all(
    attr('html', 'lang', 'pt-BR'),
    text('#langToggle', 'EN'),
  )),
  state('header-show-pink', 'SHOWS PINK · CURRENT GREEN', { type: 'click', selector: '#arrivalGreen' }, all(
    attr('html', 'data-mode', 'day'),
    visible('#headerDock #colorToggle'),
    klass('#headerDock #colorToggle', 'to-pink'),
    missing('#headerDock #arrivalGreen'),
    missing('#headerDock #arrivalPink'),
  )),
  state('header-show-green', 'SHOWS GREEN · CURRENT PINK', { type: 'click', selector: '#arrivalPink' }, all(
    attr('html', 'data-mode', 'party'),
    visible('#headerDock #colorToggle'),
    klass('#headerDock #colorToggle', 'to-green'),
    missing('#headerDock #arrivalGreen'),
    missing('#headerDock #arrivalPink'),
  )),
];

const COLOUR_PICKER_PREVIEW_STATES = [
  state('landing-pair', 'LANDING · GREEN + PINK', { type: 'scroll', top: 0 }, all(
    visible('#arrivalGreen'),
    visible('#arrivalPink'),
    not(visible('#arrivalColorQuestion')),
  )),
  state('docked-show-pink', 'DOCKED · SHOWS PINK', { type: 'click', selector: '#arrivalGreen' }, all(
    attr('html', 'data-mode', 'day'),
    visible('#headerDock #colorToggle'),
    klass('#headerDock #colorToggle', 'to-pink'),
    missing('#headerDock #arrivalGreen'),
    missing('#headerDock #arrivalPink'),
  )),
  state('docked-show-green', 'DOCKED · SHOWS GREEN', { type: 'click', selector: '#arrivalPink' }, all(
    attr('html', 'data-mode', 'party'),
    visible('#headerDock #colorToggle'),
    klass('#headerDock #colorToggle', 'to-green'),
    missing('#headerDock #arrivalGreen'),
    missing('#headerDock #arrivalPink'),
  )),
];

export const KIT_CATALOG = {
  manifesto: {
    id: 'manifesto',
    name: 'MANIFESTO',
    route: '/',
    colour: { green: '#arrivalGreen', pink: '#arrivalPink' },
    language: { toggle: '#langToggle' },
    components: [
      component(
        'full-screen',
        'FULL SCREEN',
        'Shows both live manifesto pages without any kit overlay.',
        'body',
        [
          state('arrival', 'ARRIVAL', { type: 'scroll', top: 0 }, { type: 'scroll', maxFraction: 0.45 }),
          state('read', 'THE READ', { type: 'scrollTo', selector: '.blocks' }, visible('.blocks')),
        ],
        {
          mode: 'screen',
          note: 'The arrival and read are the same live document.',
          ruled: [MOBILE_READ],
          preview: proposed({
            note: 'On phones the read fits one screen: rows stretch in every state, the bay hugs its section, nothing scrolls or rescales.',
            lawBoxes: [{ type: 'viewport', label: 'LAW · ONE-SCREEN PHONE READ', maxWidth: 430 }],
          }),
        },
      ),
      component(
        'speaking',
        'SPEAKING',
        'Carries QIQI’s boot, invitation, charge and error signals in one slot.',
        ['#arrivalSignal', '#mascotTag'],
        [
          state('boot-bar', 'BOOT BAR', { type: 'reload' }, klass('body', 'is-booting'), {
            spotSelectors: ['#bootBar'],
            effects: [{ selector: '#bootBar', label: '→ BOOT' }],
            lawBoxes: [{ type: 'selector', selector: '#arrivalSignal', label: 'LAW · SIGNAL SLOT' }],
          }),
          state('ready', 'VAI, CLICA EM MIM', { type: 'reload' }, klass('#arrivalSignal', 'is-ready'), {
            spotSelectors: ['#mascotHint'],
          }),
          state('hold-charge', 'HOLD-CHARGE', { type: 'hold', selector: '#mascotBtn', ms: 1000 }, all(
            klass('#arrivalSignal', 'is-charging'),
            klass('#mascotCharge', 'on'),
          ), {
            spotSelectors: ['#mascotCharge'],
            effects: [{ selector: '#mascotCharge', label: '→ CHARGE' }],
          }),
          state('error', 'ERRO', { type: 'repeatClick', selector: '#mascotBtn', count: 9, gap: 120 }, klass('#mascotTag', 'on'), {
            spotSelectors: ['#mascotTag', '#bootBar'],
            effects: [{ selector: '#mascotTag', label: '→ ERRO' }],
          }),
        ],
        {
          note: 'The live type-on never exposes a standalone VAI chunk; the invitation resolves as one three-chunk line.',
          ruled: [SPOKEN_COLOUR_LINE],
          bugs: [{
            id: 'boot-layout-jump',
            text: 'Before B2, is-booting put the signal slot and mascot about 220px below their final position, then jumped them up because hidden arrival siblings reserved no space.',
            minWidth: 360,
            maxWidth: 1920,
            observed: true,
            fixed: true,
            action: { type: 'reload' },
            lawBoxes: [{ type: 'selector', selector: '#arrivalSignal', label: 'LAW · SIGNAL SLOT' }],
          }],
          preview: proposed({
            selectors: ['#arrivalSignal', '#mascotTag'],
            states: [
              state('invitation-line', 'VAI, CLICA EM MIM', { type: 'waitFor', check: text('#mascotHint', 'VAI'), timeout: 9000 }, text('#mascotHint', 'VAI'), {
                spotSelectors: ['#mascotHint'],
              }),
              state('colour-line', 'EU TBM MUDO DE COR :3', { type: 'waitFor', check: text('#mascotHint', 'EU TBM'), timeout: 9000 }, text('#mascotHint', 'EU TBM'), {
                spotSelectors: ['#mascotHint'],
              }),
              state('hold-charge', 'HOLD-CHARGE', { type: 'hold', selector: '#mascotBtn', ms: 1000 }, all(
                klass('#arrivalSignal', 'is-charging'),
                klass('#mascotCharge', 'on'),
              ), {
                spotSelectors: ['#mascotCharge'],
                effects: [{ selector: '#mascotCharge', label: '→ CHARGE' }],
              }),
              state('error', 'ERRO', { type: 'repeatClick', selector: '#mascotBtn', count: 9, gap: 120 }, klass('#mascotTag', 'on'), {
                spotSelectors: ['#mascotTag', '#bootBar'],
                effects: [{ selector: '#mascotTag', label: '→ ERRO' }],
              }),
            ],
            lawBoxes: [{ type: 'selector', selector: '#arrivalSignal', label: 'LAW · ONE SPOKEN SLOT' }],
          }),
        },
      ),
      component(
        'mascot',
        'MASCOT',
        'Exposes the live poke ladder, death and hold entrance to SALA.',
        '#mascotBtn',
        [
          state('poke', 'POKE', { type: 'click', selector: '#mascotBtn' }, unobservable('The canvas reaction has no durable DOM state.')),
          state('nine-pokes', 'NINE-POKE LADDER', { type: 'repeatClick', selector: '#mascotBtn', count: 9, gap: 120 }, unobservable('The poke ladder is animated; ERRO is observed separately when its live class appears.'), {
            effects: [{ selector: '#mascotTag', label: '→ ERRO' }, { selector: '#bootBar', label: '→ REBUILD' }],
          }),
          state('hold-to-sala', 'HOLD TO SALA', { type: 'hold', selector: '#mascotBtn', ms: 2100 }, unobservable('The completed hold navigates away; it has no persistent state on this route.')),
        ],
        {
          bugs: [{
            id: 'mascot-context-menu',
            text: 'The brief flags the browser image menu eating a long press. The current CSS disables touch callout; this was not reproduced in the inspected browser.',
            minWidth: 360,
            maxWidth: 1920,
            observed: false,
            action: { type: 'hold', selector: '#mascotBtn', ms: 1000 },
          }],
        },
      ),
      component(
        'colour-picker',
        'COLOUR PICKER',
        'Lets the live arrival choose green or pink and mirrors the site colour state.',
        ['#arrivalColorQuestion', '#arrivalGreen', '#arrivalPink'],
        [
          state('green', 'VERDE', { type: 'click', selector: '#arrivalGreen' }, all(
            attr('html', 'data-mode', 'day'),
            attr('#arrivalGreen', 'aria-pressed', 'true'),
          )),
          state('pink', 'ROSA', { type: 'click', selector: '#arrivalPink' }, all(
            attr('html', 'data-mode', 'party'),
            attr('#arrivalPink', 'aria-pressed', 'true'),
          )),
        ],
        {
          ruled: [HEADER_DOCK, HEADER_DESTINATION, SPOKEN_COLOUR_LINE],
          preview: proposed({
            selectors: ['#arrivalGreen', '#arrivalPink', '#colorToggle'],
            states: COLOUR_PICKER_PREVIEW_STATES,
          }),
        },
      ),
      component(
        'page-break',
        'PAGE BREAK',
        'Marks the floor of the arrival and the handoff into the read.',
        ['#arrivalCity', '#arrivalScroll'],
        [
          state('arrival-floor', 'ARRIVAL FLOOR', { type: 'scroll', top: 0 }, visible('#arrivalScroll')),
          state('enter-read', 'ENTER THE READ', { type: 'scrollTo', selector: '.blocks' }, visible('.blocks'), {
            effects: [{ selector: '.blocks', label: '→ READ' }],
          }),
        ],
        { preview: proposed({ note: 'The arrival hands off into the one-screen phone read.' }) },
      ),
      component(
        'header',
        'HEADER',
        'Provides the fixed wordmark and full-height navigation chassis.',
        '.bar',
        [fullScreenState],
        {
          ruled: [HEADER_DOCK, HEADER_DESTINATION],
          preview: proposed({
            setup: READ_SETUP,
            states: HEADER_DESTINATION_STATES,
            lawBoxes: [{ type: 'selector', selector: '#headerDock', label: 'LAW · DESTINATIONS ONLY' }],
          }),
        },
      ),
      component(
        'header-nav',
        'HEADER NAV',
        'Moves between MANIFESTO, ESTÚDIO and GALERIA with one current-page rule.',
        '.bar__nav',
        [
          state('nav-manifesto', 'MANIFESTO', { type: 'click', selector: '#barManifesto' }, attr('#barManifesto', 'aria-current', 'page')),
          state('nav-estudio', 'ESTÚDIO', { type: 'click', selector: '#barEstudio' }, attr('#barEstudio', 'aria-current', 'page')),
          state('nav-galeria', 'GALERIA', { type: 'click', selector: '#barGaleria' }, attr('#barGaleria', 'aria-current', 'page')),
        ],
      ),
      component(
        'switches',
        'SWITCHES',
        'Holds the live language and colour target switches below the bar.',
        ['#langToggle', '#colorToggle'],
        [
          state('switch-pt', 'PT', { type: 'click', selector: '#langToggle' }, attr('html', 'lang', 'pt-BR')),
          state('switch-en', 'EN', { type: 'click', selector: '#langToggle' }, attr('html', 'lang', 'en')),
          state('switch-green', 'GREEN', { type: 'click', selector: '#colorToggle' }, attr('html', 'data-mode', 'day')),
          state('switch-pink', 'PINK', { type: 'click', selector: '#colorToggle' }, attr('html', 'data-mode', 'party')),
        ],
        {
          ruled: [HEADER_DOCK, HEADER_DESTINATION],
          preview: proposed({
            selectors: ['#headerDock #langToggle', '#headerDock #colorToggle'],
            setup: READ_SETUP,
            states: HEADER_DESTINATION_STATES,
            lawBoxes: [{ type: 'selector', selector: '#headerDock', label: 'LAW · DESTINATIONS ONLY' }],
          }),
        },
      ),
      component(
        'thermo',
        'THERMO',
        'Tracks scroll in twelve cells and catches fire at the document end.',
        ['#thermo', '#thermoFill'],
        [
          state('thermo-cold', 'COLD', { type: 'scroll', fraction: 0 }, { type: 'scroll', maxFraction: 0.05 }),
          state('thermo-climb', 'CLIMB', { type: 'scroll', fraction: 0.5 }, { type: 'scroll', minFraction: 0.2, maxFraction: 0.8 }),
          state('thermo-fire', 'FIRE', { type: 'scroll', fraction: 1 }, klass('#thermo', 'is-fire'), {
            effects: [{ selector: '#thermo', label: '→ FIRE' }],
          }),
        ],
        {
          ruled: [Z_LADDER, MOBILE_READ],
          preview: proposed({ note: 'The thermometer remains a progress signal, not a scrollbar. On PROPOSED phones the permanent transition-fire drops its glow and the rail rides above the cards, under the header and doors.' }),
        },
      ),
      component(
        'grid',
        'GRID',
        'Frames the five-title rail, reserved bay and blinking cursor.',
        '#panel',
        [
          state('grid-empty', 'EMPTY', { type: 'reload' }, all(
            missing('.panel__head[aria-selected="true"]'),
            exists('#bayCursor'),
          )),
          state('grid-open', 'WITH TEXT', { type: 'click', selector: '#manifesto' }, attr('#manifesto', 'aria-selected', 'true'), {
            effects: [{ selector: '#bay', label: '→ TEXT' }],
          }),
        ],
        {
          ruled: [MOBILE_READ],
          preview: proposed({
            note: 'The five stretched rows absorb all leftover room in every state; each label fills its own row.',
            lawBoxes: [{ type: 'viewport', label: 'LAW · ROWS ABSORB, BAY HUGS', maxWidth: 430 }],
          }),
        },
      ),
      component(
        'a-pista',
        'A PISTA',
        'Uses the five-title rail to open A PISTA in the live bay.',
        '#panelRail',
        [
          state('a-pista-closed', 'CLOSED', { type: 'reload' }, attr('#manifesto', 'aria-selected', 'false')),
          state('a-pista-open', 'OPEN', { type: 'click', selector: '#manifesto' }, attr('#manifesto', 'aria-selected', 'true'), {
            effects: [{ selector: '#bay', label: '→ TEXT' }],
          }),
        ],
        {
          ruled: [TEXT_STANDARD],
          note: 'LIVE is contained on phones. PROPOSED keeps today’s rendering until GP supplies the missing PT heads; the additive head-line mechanism is ready.',
        },
      ),
      component(
        'as-pessoas',
        'AS PESSOAS',
        'Uses the shared title rail to open the live stanzas in the bay.',
        '#panelRail',
        [
          state('as-pessoas-closed', 'CLOSED', { type: 'reload' }, attr('#pessoas', 'aria-selected', 'false')),
          state('as-pessoas-open', 'OPEN', { type: 'click', selector: '#pessoas' }, attr('#pessoas', 'aria-selected', 'true'), {
            effects: [{ selector: '#bay', label: '→ TEXT' }],
          }),
        ],
        {
          ruled: [TEXT_STANDARD],
          bugs: [{
            id: 'people-mobile-overflow',
            text: 'AS PESSOAS materially overflows the live phone read and is the worst section stress case.',
            minWidth: 360,
            maxWidth: 430,
            observed: true,
            action: { type: 'click', selector: '#pessoas' },
          }],
          preview: proposed({ note: 'A four-item accordion; one line opens inline; the old closing block is retired; the deck fire emphasis rides the last head.' }),
        },
      ),
      component(
        'o-qiqi',
        'O QIQI',
        'Provides the live head-line reference and opens answers inline.',
        '#panelRail',
        [
          state('o-qiqi-open', 'OPEN LIST', { type: 'click', selector: '#stances' }, attr('#stances', 'aria-selected', 'true'), {
            effects: [{ selector: '#bay', label: '→ TEXT' }],
          }),
          state('o-qiqi-answer', 'OPEN ANSWER', { type: 'click', selector: '#stancesGrid .stance:first-of-type' }, exists('#stancesGrid .stance[aria-expanded="true"]'), {
            effects: [{ selector: '.stances__bay', label: '→ ANSWER' }],
          }),
        ],
        {
          setup: { type: 'click', selector: '#stances' },
          ruled: [TEXT_STANDARD],
          preview: proposed({ note: 'A single column at reading rhythm; an open line compresses the others — the sections\u2019 logic inside the fixed bay.' }),
          bugs: [{
            id: 'qiqi-mobile-overflow',
            text: 'O QIQI is marginal at the live phone read floor: it fits only with almost no remaining vertical tolerance.',
            minWidth: 360,
            maxWidth: 430,
            observed: true,
            action: { type: 'click', selector: '#stances' },
          }],
        },
      ),
      component(
        'as-regras',
        'AS REGRAS',
        'Uses the shared title rail to open the poster instead of the text bay.',
        '#panelRail',
        [
          state('rules-open', 'OPEN POSTER', { type: 'click', selector: '#regras' }, klass('#poster', 'on'), {
            effects: [
              { selector: '.poster__sheet', label: '→ POSTER' },
              { selector: '.poster__controls', label: '→ CONTROLS' },
            ],
          }),
          state('rules-close', 'CLOSE', { type: 'click', selector: '#posterClose' }, missing('#poster.on')),
        ],
        {
          ruled: [TEXT_STANDARD, MOBILE_READ],
          preview: proposed({ note: 'AS REGRAS keeps its modal behavior outside the selected text bay.' }),
        },
      ),
      component(
        'um-presente',
        'UM PRESENTE',
        'Uses the shared title rail to open the gift text in the bay.',
        '#panelRail',
        [
          state('gift-closed', 'CLOSED', { type: 'reload' }, attr('#presente', 'aria-selected', 'false')),
          state('gift-open', 'OPEN', { type: 'click', selector: '#presente' }, attr('#presente', 'aria-selected', 'true'), {
            effects: [{ selector: '#bay', label: '→ TEXT' }],
          }),
        ],
        {
          ruled: [TEXT_STANDARD],
          note: 'PROPOSED keeps today’s rendering until GP supplies the missing PT heads; the additive head-line mechanism is ready.',
        },
      ),
      component(
        'text',
        'TEXT',
        'Shows the real bay content, chunk arrival and persistent cursor for each live text variant.',
        ['#baySub', '#bayCopy', '#bayCursor'],
        [
          state('text-pista', 'A PISTA', { type: 'click', selector: '#manifesto' }, attr('#manifesto', 'aria-selected', 'true')),
          state('text-people', 'AS PESSOAS', { type: 'click', selector: '#pessoas' }, attr('#pessoas', 'aria-selected', 'true')),
          state('text-qiqi', 'O QIQI', { type: 'click', selector: '#stances' }, attr('#stances', 'aria-selected', 'true')),
          state('text-rules-poster', 'AS REGRAS → POSTER', { type: 'click', selector: '#regras' }, klass('#poster', 'on'), {
            effects: [{ selector: '.poster__sheet', label: '→ POSTER' }],
          }),
          state('text-gift', 'UM PRESENTE', { type: 'click', selector: '#presente' }, attr('#presente', 'aria-selected', 'true')),
        ],
        {
          ruled: [TEXT_STANDARD, MOBILE_READ],
          note: 'The brief names five bay text variants; live truth has four bay text variants because AS REGRAS mounts the poster instead.',
          preview: proposed({
            note: 'The bay hugs its section at fixed type; the tallest inner line is reserved so expanding never resizes the box.',
            lawBoxes: [{ type: 'viewport', label: 'LAW · ONE FIXED BAY, FIXED TYPE', maxWidth: 430 }],
          }),
        },
      ),
      component(
        'poster',
        'POSTER',
        'Shows the live A4 room and its download and close controls.',
        ['.poster__sheet', '.poster__controls'],
        [
          state('poster-open', 'OPEN', { type: 'click', selector: '#regras' }, klass('#poster', 'on')),
          state('poster-download', 'DOWNLOAD', { type: 'click', selector: '#posterDownload' }, unobservable('A download command is not a persistent live state.')),
          state('poster-close', 'CLOSE', { type: 'click', selector: '#posterClose' }, missing('#poster.on')),
        ],
        { preview: proposed({ note: 'PROPOSED phones run the sheet narrow and tall, title fitted, the badge hung outside on the scrim.' }) },
      ),
      component(
        'see-you-on-the-floor',
        'SEE YOU ON THE FLOOR',
        'Reveals and assembles the standing NOS VEMOS NA PISTA :) band once.',
        '#stamp',
        [
          state('stamp-hidden', 'HIDDEN', { type: 'reload' }, attr('.stampband', 'hidden', '')),
          state('stamp-reveal', 'REVEAL', { type: 'click', selector: '#manifesto' }, visible('.stampband'), {
            effects: [{ selector: '#stamp', label: '→ BAND' }],
          }),
        ],
        {
          ruled: [MOBILE_READ],
          preview: proposed({ note: 'On PROPOSED phones the stamp lives only inside UM PRESENTE, long and low by the doors.' }),
        },
      ),
      component(
        'doors',
        'DOORS',
        'Offers the two live full-width exits at the floor of the read.',
        ['#doorEstudio', '#doorGaleria'],
        [
          state('door-estudio', 'ESTÚDIO', { type: 'click', selector: '#doorEstudio' }, unobservable('This navigation command leaves the current route.')),
          state('door-galeria', 'GALERIA', { type: 'click', selector: '#doorGaleria' }, unobservable('This navigation command leaves the current route.')),
        ],
        {
          bugs: [{
            id: 'doors-safe-area',
            text: 'Before B3, the phone doors had no safe-area-inset-bottom protection and occupied the home-indicator floor.',
            minWidth: 360,
            maxWidth: 430,
            observed: true,
            fixed: true,
            action: { type: 'scrollTo', selector: '#doors' },
          }],
          ruled: [MOBILE_READ],
          preview: proposed({
            note: 'ESTÚDIO and GALERIA doors stay at the phone screen floor.',
            lawBoxes: [{ type: 'selector', selector: '#doors', label: 'LAW · DOORS AT FLOOR', maxWidth: 430 }],
          }),
        },
      ),
      component(
        'companion',
        'COMPANION',
        'Shows the small live QIQI at the read corner and its section face changes.',
        '#companionSlot',
        [
          state('companion-corner', 'CORNER', COMPANION_SETUP, exists('#companionSlot > #mascotBtn')),
          state('companion-pista', 'A PISTA FACE', { type: 'click', selector: '#manifesto' }, attr('#manifesto', 'aria-selected', 'true'), {
            effects: [{ selector: '#companionSlot', label: '→ FACE' }],
          }),
          state('companion-people', 'AS PESSOAS FACE', { type: 'click', selector: '#pessoas' }, attr('#pessoas', 'aria-selected', 'true'), {
            effects: [{ selector: '#companionSlot', label: '→ FACE' }],
          }),
          state('companion-qiqi', 'O QIQI FACE', { type: 'click', selector: '#stances' }, attr('#stances', 'aria-selected', 'true'), {
            effects: [{ selector: '#companionSlot', label: '→ FACE' }],
          }),
          state('companion-rules', 'AS REGRAS FACE', { type: 'click', selector: '#regras' }, klass('#poster', 'on'), {
            effects: [{ selector: '#companionSlot', label: '→ FACE' }],
          }),
          state('companion-gift', 'UM PRESENTE FACE', { type: 'click', selector: '#presente' }, attr('#presente', 'aria-selected', 'true'), {
            effects: [{ selector: '#companionSlot', label: '→ FACE' }],
          }),
        ],
        {
          setup: COMPANION_SETUP,
          bugs: [{
            id: 'companion-under-doors',
            text: 'Before B1, the companion at z-index 50 rendered below the doors at z-index 56; the overlap existed at phone and desktop widths.',
            minWidth: 360,
            maxWidth: 1920,
            observed: true,
            fixed: true,
            action: COMPANION_SETUP,
            lawBoxes: [{ type: 'selector', selector: '#companionSlot', label: 'FIXED · COMPANION ABOVE DOORS' }],
          }],
          ruled: [COMPANION_CORNER_ONLY, Z_LADDER],
          note: 'Corner-only stays ruled in LIVE. On PROPOSED phones he floats above the doors under the AS REGRAS midline; B1 z-order is the only LIVE repair.',
          preview: proposed({ lawBoxes: [{ type: 'selector', selector: '#companionSlot', label: 'LAW · TOP OF Z-LADDER' }] }),
        },
      ),
    ],
  },

  estudio: {
    id: 'estudio',
    name: 'ESTÚDIO',
    route: '/estudio/',
    colour: null,
    language: { toggle: '#langToggle' },
    components: [
      component('estudio-full-screen', 'FULL SCREEN', 'Shows the live face workbench room without kit overlays.', 'body', [fullScreenState], {
        mode: 'screen',
        bugs: [{
          id: 'estudio-phone-scroll',
          text: 'The phone workbench document scrolls even though the room is ruled not to scroll.',
          minWidth: 360,
          maxWidth: 430,
          observed: true,
          action: { type: 'scroll', fraction: 1 },
        }],
        preview: proposed({ lawBoxes: [{ type: 'viewport', label: 'LAW · ONE-ROOM WORKBENCH', maxWidth: 430 }] }),
      }),
      component('estudio-header', 'HEADER', 'Shows the live fixed QIQI bar on the maker.', '.bar', [fullScreenState], {
        bugs: [{
          id: 'estudio-wordmark-rail',
          text: 'Before B7, at every locked phone width the Estúdio wordmark intruded into the 14px left rail.',
          minWidth: 360,
          maxWidth: 430,
          observed: true,
          fixed: true,
          action: { type: 'scroll', top: 0 },
        }],
      }),
      component('estudio-header-nav', 'HEADER NAV', 'Moves between the three public top-level rooms.', '.bar__nav', [
        state('estudio-nav-manifesto', 'MANIFESTO', { type: 'click', selector: '#barManifesto' }, attr('#barManifesto', 'aria-current', 'page')),
        state('estudio-nav-estudio', 'ESTÚDIO', { type: 'click', selector: '#barEstudio' }, attr('#barEstudio', 'aria-current', 'page')),
        state('estudio-nav-galeria', 'GALERIA', { type: 'click', selector: '#barGaleria' }, attr('#barGaleria', 'aria-current', 'page')),
      ]),
      component('estudio-en-switch', 'EN SWITCH', 'Drives the maker’s live language reload.', '#langToggle', [
        state('estudio-lang-pt', 'PT', { type: 'click', selector: '#langToggle' }, attr('html', 'lang', 'pt-BR')),
        state('estudio-lang-en', 'EN', { type: 'click', selector: '#langToggle' }, attr('html', 'lang', 'en')),
      ], {
        bugs: [
          {
            id: 'estudio-lang-face-overlap',
            text: 'After phone scroll, the fixed language switch overlaps the editor face.',
            minWidth: 360,
            maxWidth: 430,
            observed: true,
            proposedStatus: 'GONE IN PROPOSED',
            action: { type: 'scroll', fraction: 1 },
          },
          {
            id: 'estudio-lang-target',
            text: 'Before B4, the Estúdio language control measured about 41.5px wide instead of the 44px target floor.',
            minWidth: 360,
            maxWidth: 1920,
            observed: true,
            fixed: true,
            action: { type: 'scroll', top: 0 },
          },
        ],
        ruled: [HEADER_DESTINATION],
        preview: proposed({
          lawBoxes: [{ type: 'selector', selector: '#langToggle', label: 'LAW · CLEAR OF FACE' }],
        }),
      }),
      component('estudio-workbench', 'WORKBENCH', 'Exposes the real editor for pointer paint, tap toggle and a phone drag loupe; drag directly through the live hole.', '#editor', [
        state('estudio-paint', 'DRAG LIVE GRID', { type: 'scrollTo', selector: '#editor' }, unobservable('Painting requires a trusted pointer drag through the live canvas.'), {
          effects: [
            { selector: '#loupe', label: '→ LOUPE' },
          ],
        }),
      ], {
        bugs: [
          {
            id: 'estudio-hit-map',
            text: 'The brief says pointer mapping lands one cell up-left. Exact live cell tests did not reproduce it.',
            minWidth: 360,
            maxWidth: 1920,
            observed: false,
            action: { type: 'scrollTo', selector: '#editor' },
          },
          {
            id: 'estudio-small-targets',
            text: 'Before B4, compact Estúdio controls did not share a complete 44×44 minimum target.',
            minWidth: 360,
            maxWidth: 1920,
            observed: true,
            fixed: true,
            action: { type: 'scrollTo', selector: '#editor' },
          },
        ],
        preview: proposed({ lawBoxes: [{ type: 'viewport', label: 'LAW · NO DOCUMENT SCROLL', maxWidth: 430 }] }),
      }),
      component('estudio-zoom', 'ZOOM', 'Switches the phone editor between the whole mascot and face band.', ['#zoomWhole', '#zoomBand'], [
        state('zoom-whole', 'INTEIRO', { type: 'click', selector: '#zoomWhole' }, attr('#zoomWhole', 'aria-pressed', 'true'), { maxWidth: 430 }),
        state('zoom-band', 'SÓ A CARA', { type: 'click', selector: '#zoomBand' }, attr('#zoomBand', 'aria-pressed', 'true'), { maxWidth: 430 }),
      ], { preview: proposed() }),
      component('estudio-name', 'NAME', 'Uppercases a live name and writes it into the maker URL and previews.', ['#nameLabel', '#nameField'], [
        state('name-empty', 'EMPTY', { type: 'input', selector: '#nameField', value: '' }, value('#nameField', '')),
        state('name-sample', 'SAMPLE NAME', { type: 'input', selector: '#nameField', value: 'GP QIQI' }, value('#nameField', 'GP QIQI'), {
          effects: [{ selector: '#prevChipName', label: '→ NAME' }],
        }),
      ], { preview: proposed() }),
      component('estudio-edit-actions', 'EDIT ACTIONS', 'Runs the live undo and full face-band reset actions.', ['#btnUndo', '#btnReset'], [
        state('edit-undo', 'DESFAZER', { type: 'click', selector: '#btnUndo' }, unobservable('Undo changes canvas and code output without a dedicated current-state signal.'), {
          effects: [{ selector: '#editor', label: '→ EDITOR' }, { selector: '#codeOut', label: '→ CODE' }],
        }),
        state('edit-reset', 'APAGAR TUDO', { type: 'click', selector: '#btnReset' }, text('#codeOut', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'), {
          effects: [{ selector: '#editor', label: '→ EDITOR' }, { selector: '#codeOut', label: '→ CODE' }],
        }),
      ], { preview: proposed() }),
      component('estudio-previews', 'PREVIEWS', 'Mirrors the working grid as the live chip and corner previews.', ['#prevChip', '#prevChipName', '#prevComp', '#prevCompTag'], [
        state('previews-live', 'LIVE', { type: 'scrollTo', selector: '#prevChip' }, exists('#prevChip')),
      ], { preview: proposed() }),
      component('estudio-code', 'CODE', 'Shows the live 37-character face-band code.', ['#codeLabel', '#codeOut'], [
        state('code-live', 'LIVE CODE', { type: 'scrollTo', selector: '#codeOut' }, exists('#codeOut')),
      ], { preview: proposed() }),
      component('estudio-share-row', 'SHARE ROW', 'Runs the real copy, card download and system-share actions.', ['#btnLink', '#btnCard', '#btnSend', '#sendHint'], [
        state('share-link', 'COPIAR LINK', { type: 'click', selector: '#btnLink' }, unobservable('Clipboard completion is not a persistent page state.')),
        state('share-card', 'BAIXAR CARD', { type: 'click', selector: '#btnCard' }, unobservable('A download command is not a persistent page state.')),
        state('share-send', 'MANDAR PRO QIQI', { type: 'click', selector: '#btnSend' }, unobservable('The system share result has no durable success state.')),
      ], {
        ruled: [PT_PEN],
        note: 'The rejected-share geometry is built with the existing deck hint; a dedicated PT failure string is awaiting GP.',
        bugs: [
          {
            id: 'share-below-fold',
            text: 'The share buttons sit below the phone viewport fold.',
            minWidth: 360,
            maxWidth: 430,
            observed: true,
            action: { type: 'scrollTo', selector: '#btnLink' },
          },
          {
            id: 'share-rejection-silent',
            text: 'Before B6, a rejected system share was caught without any visible failure state.',
            minWidth: 360,
            maxWidth: 1920,
            observed: true,
            fixed: true,
            action: { type: 'scrollTo', selector: '#btnSend' },
          },
        ],
        preview: proposed(),
      }),
      component('estudio-canon-door', 'CANON DOOR', 'Provides the quiet fixed door from the maker to CANON.', '.canon-door', [
        state('canon-door-open', 'OPEN CANON', { type: 'click', selector: '.canon-door' }, unobservable('This navigation command leaves the current route.')),
      ], {
        bugs: [
          {
            id: 'canon-door-safe-area',
            text: 'Before B3, the Estúdio canon door was pinned to the raw viewport floor without safe-area protection.',
            minWidth: 360,
            maxWidth: 430,
            observed: true,
            fixed: true,
            action: { type: 'scroll', fraction: 1 },
          },
          {
            id: 'canon-door-phone-collision',
            text: 'The fixed door overlaps the code field and phone floor band.',
            minWidth: 360,
            maxWidth: 430,
            observed: true,
            action: { type: 'scroll', fraction: 1 },
          },
          {
            id: 'canon-door-1920-detach',
            text: 'Before B7, at 1920px the fixed Canon door remained at the viewport edge while the workbench centered far away.',
            minWidth: 1920,
            maxWidth: 1920,
            observed: true,
            fixed: true,
            action: { type: 'scroll', top: 0 },
          },
        ],
        preview: proposed({ lawBoxes: [{ type: 'viewport', label: 'LAW · COLLISION-FREE FLOOR', maxWidth: 430 }] }),
      }),
    ],
  },

  galeria: {
    id: 'galeria',
    name: 'GALERIA',
    route: '/galeria/',
    colour: { green: '#ctlGreen', pink: '#ctlPink' },
    language: { toggle: '#langToggle' },
    components: [
      component('galeria-full-screen', 'FULL SCREEN', 'Shows the live prototype gallery without kit overlays.', 'body', [fullScreenState], { mode: 'screen' }),
      component('galeria-header', 'HEADER', 'Shows the live fixed QIQI bar on the gallery.', '.bar', [fullScreenState]),
      component('galeria-header-nav', 'HEADER NAV', 'Moves between the three public top-level rooms.', '.bar__nav', [
        state('galeria-nav-manifesto', 'MANIFESTO', { type: 'click', selector: '#barManifesto' }, attr('#barManifesto', 'aria-current', 'page')),
        state('galeria-nav-estudio', 'ESTÚDIO', { type: 'click', selector: '#barEstudio' }, attr('#barEstudio', 'aria-current', 'page')),
        state('galeria-nav-galeria', 'GALERIA', { type: 'click', selector: '#barGaleria' }, attr('#barGaleria', 'aria-current', 'page')),
      ]),
      component('galeria-en-switch', 'EN SWITCH', 'Drives the gallery’s live language reload.', '#langToggle', [
        state('galeria-lang-pt', 'PT', { type: 'click', selector: '#langToggle' }, attr('html', 'lang', 'pt-BR')),
        state('galeria-lang-en', 'EN', { type: 'click', selector: '#langToggle' }, attr('html', 'lang', 'en')),
      ], {
        bugs: [{
          id: 'galeria-lang-chip-overlap',
          text: 'At phone widths the language switch overlaps the moving top-strip edge chip.',
          minWidth: 360,
          maxWidth: 430,
          observed: true,
          proposedStatus: 'GONE IN PROPOSED',
          action: { type: 'scroll', top: 0 },
        }],
        ruled: [HEADER_DESTINATION],
        preview: proposed({
          lawBoxes: [{ type: 'selector', selector: '#langToggle', label: 'LAW · CLEAR OF STRIP' }],
        }),
      }),
      component('galeria-conveyor', 'CONVEYOR', 'Runs the one desktop ring or two phone strips and uses every chip as the live face picker.', ['.face[data-name]', '#prototypeCount'], [
        state('conveyor-default', 'NORMAL', { type: 'click', selector: '.face[data-name="Default"]' }, attr('.face[data-name="Default"]', 'aria-pressed', 'true'), {
          effects: [{ selector: '#stageBtn', label: '→ STAGE' }, { selector: '#stageName', label: '→ NAME' }],
        }),
        state('conveyor-happy', 'TÔ BEM', { type: 'click', selector: '.face[data-name="Happy"]' }, attr('.face[data-name="Happy"]', 'aria-pressed', 'true'), {
          effects: [{ selector: '#stageBtn', label: '→ STAGE' }, { selector: '#stageName', label: '→ NAME' }],
        }),
      ], {
        bugs: [{
          id: 'conveyor-home-indicator',
          text: 'Before B3, the bottom strip captions occupied the phone home-indicator band.',
          minWidth: 360,
            maxWidth: 430,
            observed: true,
            fixed: true,
            action: { type: 'scroll', top: 0 },
          }],
        note: 'FIXED: first load now marks the chip for the face already shown on the stage with aria-pressed=true.',
      }),
      component('galeria-stage', 'STAGE', 'Shows and pokes the selected live face, cell-type name and optional credit.', ['#stageBtn', '#stageName', '#stageCredit'], [
        state('stage-poke', 'POKE', { type: 'click', selector: '#stageBtn' }, unobservable('The random canvas reaction has no dedicated current-state signal.'), {
          effects: [{ selector: '#stageName', label: '→ NAME' }, { selector: '.face[aria-pressed="true"]', label: '→ CHIP' }],
        }),
        state('stage-default', 'NORMAL', { type: 'click', selector: '.face[data-name="Default"]' }, attr('#stageName', 'aria-label', 'NORMAL'), {
          effects: [{ selector: '.face[data-name="Default"]', label: '→ CHIP' }],
        }),
      ]),
      component('galeria-controls', 'CONTROLS', 'Runs the gallery plate’s movement, colour, glitch and download controls.', ['.stage__controls', '#ctlLive', '#ctlHold', '#ctlGreen', '#ctlPink', '#ctlGlitch', '#ctlWall'], [
        state('controls-live', 'SE MEXE', { type: 'click', selector: '#ctlLive' }, attr('#ctlLive', 'aria-pressed', 'true'), {
          effects: [{ selector: '#stageBtn', label: '→ FACE' }],
        }),
        state('controls-hold', 'PARADO', { type: 'click', selector: '#ctlHold' }, attr('#ctlHold', 'aria-pressed', 'true'), {
          effects: [{ selector: '#stageBtn', label: '→ FACE' }],
        }),
        state('controls-green', 'VERDE', { type: 'click', selector: '#ctlGreen' }, attr('#ctlGreen', 'aria-pressed', 'true')),
        state('controls-pink', 'ROSA', { type: 'click', selector: '#ctlPink' }, attr('#ctlPink', 'aria-pressed', 'true')),
        state('controls-glitch', 'GLITCH', { type: 'click', selector: '#ctlGlitch' }, unobservable('The 100ms canvas shear has no DOM state.'), {
          effects: [{ selector: '#stageBtn', label: '→ FACE' }, { selector: '#stageName', label: '→ NAME' }],
        }),
        state('controls-download', 'BAIXAR', { type: 'click', selector: '#ctlWall' }, unobservable('A download command is not a persistent page state.')),
      ], {
        bugs: [{
          id: 'controls-move-wrap',
          text: 'Before B7, SE MEXE wrapped only through the intermediate 721–1072px range; the contradiction sat between locked picker stops.',
          minWidth: 721,
          maxWidth: 1072,
          observed: true,
          fixed: true,
          betweenStops: true,
          action: { type: 'scroll', top: 0 },
        }],
      }),
    ],
  },

  sala: {
    id: 'sala',
    name: 'SALA',
    route: '/sala/',
    colour: null,
    language: { toggle: '#langToggle' },
    components: [
      component('sala-full-screen', 'FULL SCREEN', 'Shows the live three-room floor; public entry is a two-second hold on the arrival mascot.', 'body', [fullScreenState], { mode: 'screen' }),
      component('sala-voltar', 'VOLTAR', 'Returns from SALA to the manifesto.', '#backLink', [
        state('sala-back', 'VOLTAR', { type: 'click', selector: '#backLink' }, unobservable('This navigation command leaves the current route.')),
      ], {
        bugs: [{
          id: 'sala-back-target',
          text: 'Before B4, the phone back control was shorter than the 44px touch-target floor.',
          minWidth: 360,
          maxWidth: 430,
          observed: true,
          fixed: true,
          action: { type: 'scroll', top: 0 },
        }],
      }),
      component('sala-en-switch', 'EN SWITCH', 'Drives the room deck’s live language reload.', '#langToggle', [
        state('sala-lang-pt', 'PT', { type: 'click', selector: '#langToggle' }, attr('html', 'lang', 'pt-BR')),
        state('sala-lang-en', 'EN', { type: 'click', selector: '#langToggle' }, attr('html', 'lang', 'en')),
      ], {
        bugs: [{
          id: 'sala-lang-target',
          text: 'Before B4, the phone language control was shorter than the 44px touch-target floor.',
          minWidth: 360,
          maxWidth: 430,
          observed: true,
          fixed: true,
          action: { type: 'scroll', top: 0 },
        }],
      }),
      component('sala-floor-nav', 'FLOOR NAV', 'Switches the live floor between HISTÓRIA, DNA and MUDANÇAS.', '.room-nav', [
        state('room-story', 'HISTÓRIA', { type: 'click', selector: '[data-open-room="Story"]' }, attr('[data-open-room="Story"]', 'aria-pressed', 'true'), {
          effects: [{ selector: '#roomStory', label: '→ ROOM' }],
        }),
        state('room-dna', 'DNA', { type: 'click', selector: '[data-open-room="Dna"]' }, attr('[data-open-room="Dna"]', 'aria-pressed', 'true'), {
          effects: [{ selector: '#roomDna', label: '→ ROOM' }],
        }),
        state('room-growth', 'MUDANÇAS', { type: 'click', selector: '[data-open-room="Growth"]' }, attr('[data-open-room="Growth"]', 'aria-pressed', 'true'), {
          effects: [{ selector: '#roomGrowth', label: '→ ROOM' }],
        }),
      ], {
        bugs: [
          {
            id: 'floor-nav-short-desktop',
            text: 'Before B7, at the short 1280×800 stop the fixed floor navigation overlapped room controls.',
            minWidth: 1280,
            maxWidth: 1280,
            observed: true,
            fixed: true,
            action: { type: 'scroll', top: 0 },
          },
          {
            id: 'floor-nav-safe-area',
            text: 'Before B3, the phone floor navigation sat directly in the home-indicator band.',
            minWidth: 360,
            maxWidth: 430,
            observed: true,
            fixed: true,
            action: { type: 'scroll', top: 0 },
          },
        ],
      }),
      component('sala-historia', 'HISTÓRIA', 'Moves through the three live QEVR-to-QIQI story stages.', '[data-story]', [
        state('story-qevr', 'QEVR', { type: 'click', selector: '[data-story="0"]' }, attr('[data-story="0"]', 'aria-pressed', 'true'), {
          effects: [{ selector: '#storyCanvas', label: '→ ART' }, { selector: '#storyTitle', label: '→ COPY' }],
        }),
        state('story-qiqi', 'QIQI', { type: 'click', selector: '[data-story="1"]' }, attr('[data-story="1"]', 'aria-pressed', 'true'), {
          effects: [{ selector: '#storyCanvas', label: '→ ART' }, { selector: '#storyTitle', label: '→ COPY' }],
        }),
        state('story-now', 'AGORA', { type: 'click', selector: '[data-story="2"]' }, attr('[data-story="2"]', 'aria-pressed', 'true'), {
          effects: [{ selector: '#storyCanvas', label: '→ ART' }, { selector: '#storyTitle', label: '→ COPY' }],
        }),
      ], {
        setup: { type: 'click', selector: '[data-open-room="Story"]' },
      }),
      component('sala-dna', 'DNA', 'Inspects live face diffs with previous and next controls.', ['#roomDna .exhibit', '#dnaPrev', '#dnaNext'], [
        state('dna-open', 'OPEN DNA', { type: 'click', selector: '[data-open-room="Dna"]' }, klass('#roomDna', 'on')),
        state('dna-prev', 'PREVIOUS', { type: 'click', selector: '#dnaPrev' }, unobservable('Previous changes canvas and copy without a command-state attribute.'), {
          effects: [{ selector: '#dnaCanvas', label: '→ FACE' }, { selector: '#dnaStats', label: '→ DIFF' }],
        }),
        state('dna-next', 'NEXT', { type: 'click', selector: '#dnaNext' }, unobservable('Next changes canvas and copy without a command-state attribute.'), {
          effects: [{ selector: '#dnaCanvas', label: '→ FACE' }, { selector: '#dnaStats', label: '→ DIFF' }],
        }),
      ], {
        setup: { type: 'click', selector: '[data-open-room="Dna"]' },
        bugs: [{
          id: 'dna-short-height',
          text: 'Before B7, the DNA collision appeared below 720px tall, including the short-screen stress stop.',
          minWidth: 360,
          maxWidth: 1920,
          maxHeight: 719,
          observed: true,
          fixed: true,
          action: { type: 'click', selector: '[data-open-room="Dna"]' },
        }],
      }),
      component('sala-mudancas', 'MUDANÇAS', 'Drives the live face transformation slider while the silhouette stays intact.', ['#roomGrowth .exhibit', '#growthRange'], [
        state('growth-zero', '0%', { type: 'input', selector: '#growthRange', value: '0' }, value('#growthRange', '0'), {
          effects: [{ selector: '#growthCanvas', label: '→ FACE' }, { selector: '#growthCopy', label: '→ COPY' }],
        }),
        state('growth-half', '50%', { type: 'input', selector: '#growthRange', value: '50' }, value('#growthRange', '50'), {
          effects: [{ selector: '#growthCanvas', label: '→ FACE' }, { selector: '#growthCopy', label: '→ COPY' }],
        }),
        state('growth-full', '100%', { type: 'input', selector: '#growthRange', value: '100' }, value('#growthRange', '100'), {
          effects: [{ selector: '#growthCanvas', label: '→ FACE' }, { selector: '#growthCopy', label: '→ COPY' }],
        }),
      ], {
        setup: { type: 'click', selector: '[data-open-room="Growth"]' },
        bugs: [{
          id: 'growth-track-phone',
          text: 'The phone and desktop transformation control keeps its 16px visual rail; before B4 its interaction area was also 16px, and it now has a repaired 44px hitbox.',
          minWidth: 360,
          maxWidth: 1920,
          observed: true,
          fixed: true,
          action: { type: 'click', selector: '[data-open-room="Growth"]' },
        }],
      }),
    ],
  },

  canon: {
    id: 'canon',
    name: 'CANON',
    route: '/canon/',
    colour: null,
    language: null,
    components: [
      component('canon-full-screen', 'FULL SCREEN', 'Shows the live canonical grid room without kit overlays.', 'body', [fullScreenState], {
        mode: 'screen',
        note: 'CANON has no English switch by design.',
      }),
      component('canon-header', 'HEADER', 'Shows the live QIQI bar; CANON intentionally has no EN switch.', '.bar', [fullScreenState], {
        bugs: [{
          id: 'canon-double-padding',
          text: 'The brief reports doubled bar padding. Current computed layout does not reproduce it.',
          minWidth: 360,
          maxWidth: 1920,
          observed: false,
          action: { type: 'scroll', top: 0 },
        }],
        note: 'LANGUAGE is disabled because its absence is part of the live design.',
      }),
      component('canon-back-link', 'VOLTAR AO ESTÚDIO', 'Returns from the canon to the maker.', '.canon-head a', [
        state('canon-back', 'VOLTAR AO ESTÚDIO', { type: 'click', selector: '.canon-head a' }, unobservable('This navigation command leaves the current route.')),
      ], {
        bugs: [{
          id: 'canon-back-target',
          text: 'Before B4, the phone link’s effective target was about 1.5px below the 44px floor.',
          minWidth: 360,
          maxWidth: 430,
          observed: true,
          fixed: true,
          action: { type: 'scroll', top: 0 },
        }],
      }),
      component('canon-grid', 'THE CANON GRID', 'Draws the canonical 34×34 live grid with pink diff cells.', ['.canon-grid', '#canonCanvas'], [
        state('canon-grid-live', 'DEFAULT GRID', { type: 'reload' }, all(
          text('#canonName', 'DEFAULT'),
          text('#canonStats', '/ DIFF 0'),
        )),
      ]),
      component('canon-inspector', 'INSPECTOR', 'Moves through canonical faces and reports live per-face data.', ['.canon-meta', '#canonPrev', '#canonNext'], [
        state('canon-previous', 'PREVIOUS', { type: 'click', selector: '#canonPrev' }, unobservable('Previous changes the inspected face without a command-state attribute.'), {
          effects: [{ selector: '#canonCanvas', label: '→ GRID' }, { selector: '#canonStats', label: '→ DATA' }],
        }),
        state('canon-next', 'NEXT', { type: 'click', selector: '#canonNext' }, unobservable('Next changes the inspected face without a command-state attribute.'), {
          effects: [{ selector: '#canonCanvas', label: '→ GRID' }, { selector: '#canonStats', label: '→ DATA' }],
        }),
      ]),
    ],
  },

  '404': {
    id: '404',
    name: '404',
    route: '/404.html',
    colour: null,
    language: { toggle: '#langToggle' },
    components: [
      component('404-full-screen', 'FULL SCREEN', 'Shows the live wrong-room page without kit overlays.', 'body', [fullScreenState], { mode: 'screen' }),
      component('404-header', 'HEADER', 'Shows the live QIQI bar on the wrong-room page.', '.bar', [fullScreenState]),
      component('404-en-switch', 'EN SWITCH', 'Drives the wrong-room deck’s live language reload.', '#langToggle', [
        state('404-lang-pt', 'PT', { type: 'click', selector: '#langToggle' }, attr('html', 'lang', 'pt-BR')),
        state('404-lang-en', 'EN', { type: 'click', selector: '#langToggle' }, attr('html', 'lang', 'en')),
      ]),
      component('404-pixel-code', 'PIXEL CODE', 'Draws the live 404 in the site’s cell type.', ['.wrong__code', '#codeWord'], [
        state('404-code-live', '404', { type: 'reload' }, attr('#codeWord', 'aria-label', '404')),
      ]),
      component('404-message', 'MESSAGE', 'Shows the live deck line and, only on a real missing route, the struck path.', ['#wrongLine', '#wrongPath'], [
        state('404-direct', 'DIRECT /404.HTML', { type: 'reload' }, attr('#wrongPath', 'hidden', '')),
        state('404-missing-path', 'REAL MISSING ROUTE', { type: 'reload' }, visible('#wrongPath'), {
          unavailable: 'The local static server does not route missing paths through 404.html; the kit does not fake this state.',
          effects: [{ selector: '#wrongPath', label: '→ PATH' }],
        }),
      ], {
        note: 'The struck path is intentionally absent on direct /404.html.',
      }),
      component('404-mascot', 'MASCOT', 'Shows the live wrong-room mascot and forwards real pokes.', '#mascotBtn', [
        state('404-arc', 'SHOCKED → DEAD', { type: 'reload' }, unobservable('The automatic canvas face arc has no DOM state.')),
        state('404-poke', 'POKE', { type: 'click', selector: '#mascotBtn' }, unobservable('The random canvas reaction has no dedicated current-state signal.')),
      ], {
        bugs: [{
          id: '404-poke-no-reaction',
          text: 'A tap can produce no visible mascot reaction; the canvas exposes no durable DOM state for the face.',
          minWidth: 360,
          maxWidth: 1920,
          observed: true,
          action: { type: 'click', selector: '#mascotBtn' },
        }],
        note: 'The live canvas starts Shocked and changes to Dead after 1.4s; those faces are not DOM-observable, so the kit does not invent a lime state.',
      }),
      component('404-door', 'DOOR', 'Returns from the wrong room to the manifesto.', '#wrongDoor', [
        state('404-door-open', 'MANIFESTO', { type: 'click', selector: '#wrongDoor' }, unobservable('This navigation command leaves the current route.')),
      ], {
        bugs: [{
          id: '404-door-cutoff',
          text: 'The brief reports desktop floor cutoff. It was not visible at any locked desktop stop.',
          minWidth: 1280,
          maxWidth: 1920,
          observed: false,
          action: { type: 'scroll', top: 0 },
        }],
      }),
    ],
  },
};
