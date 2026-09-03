import { KIT_CATALOG, SCREEN_ORDER, WIDTH_STOPS } from './catalog.mjs';
import {
  chooseBugStop,
  clipRect,
  componentForMode,
  computeStageScale,
  formatKitHash,
  formatPreviewRoute,
  isInGate,
  parseKitHash,
  shouldUseBugHighlight,
  unionRectangles,
  writeKitHash,
} from './logic.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';
const $ = (selector) => document.querySelector(selector);

const catalogNav = $('#catalogNav');
const componentSheet = $('#componentSheet');
const navTrigger = $('#navTrigger');
const navBackdrop = $('#navBackdrop');
const widthSelect = $('#widthSelect');
const modeField = $('#modeField');
const colourField = $('#colourField');
const languageField = $('#languageField');
const stageArea = $('#stageArea');
const deviceWrap = $('#deviceWrap');
const device = $('#device');
const stageFrame = $('#stageFrame');
const spotlight = $('#spotlight');
const scrimPath = $('#scrimPath');
const lawLayer = $('#lawLayer');
const outlineLayer = $('#outlineLayer');
const stageFlash = $('#stageFlash');

let selectedScreenId = 'manifesto';
let selectedComponentId = 'full-screen';
let selectedStop = WIDTH_STOPS.find(({ id }) => id === 'laptop-13') ?? WIDTH_STOPS[0];
let selectedKitMode = 'live';
let activeStateId = null;
let activeStateWasCurrent = false;
let activeStateExpiresAt = 0;
let detectedEffectStateId = null;
let selectedBugId = null;
let pendingAction = null;
let pendingLawBoxes = [];
let frameReady = false;
let lastOverlaySignature = '';
let lastPollAt = 0;
let lastSpotAt = 0;
let flashTimer = 0;
let pointerSequence = 1000;

function currentScreen() {
  return KIT_CATALOG[selectedScreenId];
}

function currentComponent() {
  return currentScreen().components.find(({ id }) => id === selectedComponentId)
    ?? currentScreen().components[0];
}

function currentComponentView() {
  return componentForMode(currentComponent(), selectedKitMode);
}

function frameDocument() {
  if (!frameReady) return null;
  try {
    return stageFrame.contentDocument;
  } catch (_error) {
    return null;
  }
}

function frameWindow() {
  if (!frameReady) return null;
  try {
    return stageFrame.contentWindow;
  } catch (_error) {
    return null;
  }
}

function syncKitLocation(options = {}) {
  const hash = formatKitHash(selectedScreenId, selectedComponentId, KIT_CATALOG, {
    mode: selectedKitMode,
    widthId: selectedStop.id,
  });
  if (location.hash !== hash) writeKitHash(history, hash, options);
}

function flash(message) {
  clearTimeout(flashTimer);
  stageFlash.textContent = message;
  stageFlash.classList.add('is-on');
  flashTimer = setTimeout(() => stageFlash.classList.remove('is-on'), 1100);
}

function closeNav() {
  document.body.classList.remove('nav-open');
  navTrigger.setAttribute('aria-expanded', 'false');
}

function buildWidthControls() {
  widthSelect.replaceChildren(...WIDTH_STOPS.map((stop) => {
    const option = document.createElement('option');
    option.value = stop.id;
    option.textContent = `${stop.label} · ${stop.width}×${stop.height}`;
    return option;
  }));
  widthSelect.value = selectedStop.id;
}

function buildCatalog() {
  catalogNav.replaceChildren(...SCREEN_ORDER.map((screenId) => {
    const screen = KIT_CATALOG[screenId];
    const group = document.createElement('section');
    group.className = 'screen-group';
    group.dataset.screenId = screenId;

    const title = document.createElement('button');
    title.className = 'screen-title';
    title.type = 'button';
    title.textContent = screen.name;
    title.addEventListener('click', () => {
      selectComponent(screenId, screen.components[0].id, { forceRoute: true });
    });

    const rows = document.createElement('div');
    rows.className = 'component-rows';
    rows.append(...screen.components.map((item, index) => {
      const row = document.createElement('button');
      row.className = 'component-row';
      row.type = 'button';
      row.dataset.componentId = item.id;
      row.innerHTML = `<span class="row-index">${String(index + 1).padStart(2, '0')}</span><span class="row-name"></span>`;
      row.querySelector('.row-name').textContent = item.name;
      if (item.preview) {
        const chip = document.createElement('span');
        chip.className = 'preview-chip';
        chip.textContent = 'PREVIEW';
        row.append(chip);
      }
      row.addEventListener('click', () => selectComponent(screenId, item.id));
      return row;
    }));

    group.append(title, rows);
    return group;
  }));
}

function refreshCatalogSelection() {
  catalogNav.querySelectorAll('.screen-group').forEach((group) => {
    group.classList.toggle('is-open', group.dataset.screenId === selectedScreenId);
  });
  catalogNav.querySelectorAll('.component-row').forEach((row) => {
    const group = row.closest('.screen-group');
    row.classList.toggle(
      'is-current',
      group.dataset.screenId === selectedScreenId && row.dataset.componentId === selectedComponentId,
    );
  });
}

function stateAvailability(item) {
  if (item.unavailable) return item.unavailable;
  return isInGate(item, selectedStop) ? '' : `NOT AT ${selectedStop.width} PX`;
}

function renderStateList(item) {
  const list = $('#stateList');
  list.replaceChildren(...item.states.map((itemState) => {
    const unavailable = stateAvailability(itemState);
    const row = document.createElement('div');
    row.className = `state-row${unavailable ? ' is-unavailable' : ''}`;

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.stateId = itemState.id;
    button.textContent = itemState.name;
    button.disabled = Boolean(unavailable);
    button.addEventListener('click', () => runState(itemState));

    const availability = document.createElement('span');
    availability.className = 'state-availability';
    availability.textContent = unavailable
      || (itemState.current.type === 'unobservable' ? 'ACTION · NO DOM STATE' : 'AVAILABLE');
    if (itemState.current.reason) availability.title = itemState.current.reason;
    row.append(button, availability);
    return row;
  }));
}

function renderBugList(item) {
  const list = $('#bugList');
  const allBugs = item.bugs ?? [];
  const children = allBugs.map((bug) => {
    const button = document.createElement('button');
    const proposedStatus = selectedKitMode === 'proposed'
      && bug.proposedStatus === 'GONE IN PROPOSED'
      ? bug.proposedStatus
      : '';
    const observedClass = bug.observed === false ? ' is-not-observed' : '';
    const fixedClass = bug.fixed || proposedStatus ? ' is-fixed' : '';
    const outOfRangeClass = isInGate(bug, selectedStop) ? '' : ' is-out-of-range';
    const selectedClass = selectedBugId === bug.id ? ' is-selected' : '';
    button.className = `bug-row${observedClass}${fixedClass}${outOfRangeClass}${selectedClass}`;
    button.type = 'button';
    button.textContent = bug.text;
    const meta = document.createElement('small');
    const heightGate = bug.maxHeight != null ? ` · ≤${bug.maxHeight} PX TALL` : '';
    const range = `${bug.minWidth}–${bug.maxWidth} PX${heightGate}`;
    const status = proposedStatus || (bug.fixed
      ? 'FIXED'
      : (bug.observed === false ? 'NOT REPRODUCED IN LIVE CHECK' : 'OBSERVED · JUMP'));
    meta.textContent = `${status} · ${range}`;
    button.append(meta);
    if (isInGate(bug, selectedStop)) {
      button.addEventListener('click', () => jumpToBug(bug));
    } else {
      button.disabled = true;
    }
    return button;
  });

  if (!children.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-row';
    empty.textContent = 'NONE RECORDED';
    children.push(empty);
  }

  list.replaceChildren(...children);
}

function renderRuledList(item) {
  const previewStatus = currentComponent().preview?.status;
  const ruled = [
    ...(previewStatus ? [{ id: 'PREVIEW', text: previewStatus }] : []),
    ...(item.ruled ?? []),
  ];
  $('#ruledSection').hidden = ruled.length === 0;
  $('#ruledList').replaceChildren(...ruled.map((note) => {
    const box = document.createElement('div');
    box.className = 'ruled-note';
    const label = document.createElement('strong');
    label.textContent = note.id;
    const copy = document.createElement('span');
    copy.textContent = note.text;
    box.append(label, copy);
    return box;
  }));
}

function renderSheet() {
  const screen = currentScreen();
  const item = currentComponentView();
  $('#sheetScreen').textContent = screen.name;
  $('#sheetName').textContent = item.name;
  $('#sheetJob').textContent = item.job;
  $('#sheetNote').hidden = !item.note;
  $('#sheetNote').textContent = item.note ?? '';
  $('#whereReadout').textContent = `${screen.route} · ${Array.isArray(item.selectors) ? item.selectors.join(', ') : item.selectors}`;
  $('#modeReadout').textContent = `${selectedKitMode.toUpperCase()} / ${screen.name} / ${item.name}`;
  renderStateList(item);
  renderBugList(item);
  renderRuledList(item);
  updateGlobalControls();
}

function expectedPath(route) {
  return new URL(route, location.origin).pathname;
}

function loadCurrentScreen(action = null, lawBoxes = []) {
  const screen = currentScreen();
  pendingAction = action ?? currentComponentView().setup ?? null;
  pendingLawBoxes = lawBoxes;
  frameReady = false;
  lastOverlaySignature = '';
  const route = formatPreviewRoute(screen.route, selectedKitMode);
  stageFrame.contentWindow.location.replace(route);
  $('#routeReadout').textContent = route;
}

async function activateCurrentComponent() {
  const componentId = selectedComponentId;
  const setup = currentComponentView().setup;
  if (setup) await runAction(setup);
  if (componentId !== selectedComponentId) return;
  focusSpecimen();
  updateSpotlight(true);
}

function needsRouteReset() {
  try {
    const frameLocation = stageFrame.contentWindow.location;
    const wrongPath = frameLocation.pathname !== expectedPath(currentScreen().route);
    const next = new URLSearchParams(frameLocation.search).get('next') === '1';
    return wrongPath || next !== (selectedKitMode === 'proposed');
  } catch (_error) {
    return true;
  }
}

function selectComponent(screenId, componentId, options = {}) {
  const screenChanged = selectedScreenId !== screenId;
  const componentChanged = selectedComponentId !== componentId;
  selectedScreenId = screenId;
  selectedComponentId = componentId;
  activeStateId = null;
  activeStateWasCurrent = false;
  activeStateExpiresAt = 0;
  detectedEffectStateId = null;
  selectedBugId = null;
  pendingLawBoxes = [];
  refreshCatalogSelection();
  renderSheet();
  if (options.history !== false && (screenChanged || componentChanged)) syncKitLocation();
  closeNav();

  if (screenChanged || options.forceRoute || !frameReady || needsRouteReset()) {
    loadCurrentScreen();
  } else {
    activateCurrentComponent();
  }
}

function resizeStage() {
  const padding = parseFloat(getComputedStyle(stageArea).paddingLeft) || 0;
  const scale = computeStageScale(
    stageArea.clientWidth,
    stageArea.clientHeight,
    selectedStop.width,
    selectedStop.height,
    padding,
  );
  device.style.width = `${selectedStop.width}px`;
  device.style.height = `${selectedStop.height}px`;
  device.style.transform = `scale(${scale})`;
  deviceWrap.style.width = `${selectedStop.width * scale}px`;
  deviceWrap.style.height = `${selectedStop.height * scale}px`;
  stageFrame.style.width = `${selectedStop.width}px`;
  stageFrame.style.height = `${selectedStop.height}px`;
  spotlight.setAttribute('viewBox', `0 0 ${selectedStop.width} ${selectedStop.height}`);
  $('#sizeReadout').textContent = `${selectedStop.width} × ${selectedStop.height}`;
  $('#scaleReadout').textContent = `SCALE ${Math.round(scale * 100)}%`;
  lastOverlaySignature = '';
  updateSpotlight(true);
}

function applyWidth(stop, options = {}) {
  const changed = selectedStop.id !== stop.id;
  selectedStop = stop;
  widthSelect.value = stop.id;
  resizeStage();
  renderSheet();
  if (changed && options.history !== false) syncKitLocation();
}

function checkCurrent(check) {
  const doc = frameDocument();
  const win = frameWindow();
  if (!doc || !win || !check) return false;

  try {
    if (check.type === 'all') return check.checks.every(checkCurrent);
    if (check.type === 'any') return check.checks.some(checkCurrent);
    if (check.type === 'not') return !checkCurrent(check.check);

    const element = check.selector ? doc.querySelector(check.selector) : null;
    if (check.type === 'exists') return Boolean(element);
    if (check.type === 'missing') return !element;
    if (check.type === 'class') return Boolean(element?.classList.contains(check.name));
    if (check.type === 'attribute') {
      if (!element) return false;
      if (check.equals === '') return element.hasAttribute(check.name);
      return element.getAttribute(check.name) === check.equals;
    }
    if (check.type === 'text') return Boolean(element?.textContent.includes(check.includes));
    if (check.type === 'value') return String(element?.value ?? '') === String(check.equals);
    if (check.type === 'visible') {
      if (!element) return false;
      const style = win.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && rect.width > 0
        && rect.height > 0
        && rect.bottom > 0
        && rect.right > 0
        && rect.top < win.innerHeight
        && rect.left < win.innerWidth;
    }
    if (check.type === 'scroll') {
      const max = Math.max(1, doc.documentElement.scrollHeight - win.innerHeight);
      const fraction = win.scrollY / max;
      if (check.minFraction != null && fraction < check.minFraction) return false;
      if (check.maxFraction != null && fraction > check.maxFraction) return false;
      return true;
    }
  } catch (_error) {
    return false;
  }
  return false;
}

function refreshCurrentStates() {
  const item = currentComponentView();
  let effectState = null;
  let activeIsCurrent = false;
  componentSheet.querySelectorAll('[data-state-id]').forEach((button) => {
    const itemState = item.states.find(({ id }) => id === button.dataset.stateId);
    const isCurrent = itemState ? checkCurrent(itemState.current) : false;
    button.classList.toggle('is-current', isCurrent);
    if (isCurrent && itemState.effects?.length) effectState = itemState;
    if (itemState?.id === activeStateId) activeIsCurrent = isCurrent;
  });

  const active = item.states.find(({ id }) => id === activeStateId);
  if (active) {
    if (activeIsCurrent) activeStateWasCurrent = true;
    const observationEnded = performance.now() >= activeStateExpiresAt;
    if (
      (active.current.type === 'unobservable' && observationEnded)
      || (active.current.type !== 'unobservable' && activeStateWasCurrent && !activeIsCurrent)
      || (!activeStateWasCurrent && observationEnded)
    ) {
      activeStateId = null;
      activeStateWasCurrent = false;
      activeStateExpiresAt = 0;
    }
  }
  detectedEffectStateId = effectState?.id ?? null;
  updateGlobalControls();
}

function actionElement(selector) {
  const doc = frameDocument();
  return doc?.querySelector(selector) ?? null;
}

function pointerEvent(win, type, element, pointerId, buttons) {
  const rect = element.getBoundingClientRect();
  return new win.PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId,
    pointerType: 'mouse',
    isPrimary: true,
    buttons,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  });
}

function clickElement(element, win) {
  pointerSequence += 1;
  element.dispatchEvent(pointerEvent(win, 'pointerdown', element, pointerSequence, 1));
  element.dispatchEvent(pointerEvent(win, 'pointerup', element, pointerSequence, 0));
  element.click();
}

async function waitForCheck(check, timeout = 3000) {
  const startedAt = performance.now();
  while (performance.now() - startedAt < timeout) {
    if (checkCurrent(check)) return true;
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  return false;
}

async function finishAction(action) {
  if (!action.until) return true;
  const appeared = await waitForCheck(action.until, action.timeout);
  if (!appeared) flash('LIVE STATE DID NOT APPEAR');
  return appeared;
}

async function runAction(action) {
  const win = frameWindow();
  const doc = frameDocument();
  if (!win || !doc || !action) return;

  if (action.waitFor) {
    const ready = await waitForCheck(action.waitFor, action.timeout);
    if (!ready) return flash('LIVE STATE NOT READY');
  }

  if (action.type === 'reload') {
    win.scrollTo(0, 0);
    frameReady = false;
    win.location.reload();
    return;
  }

  if (action.type === 'waitFor') {
    const appeared = await waitForCheck(action.check, action.timeout ?? 3000);
    if (!appeared) flash('LIVE STATE DID NOT APPEAR');
    return;
  }

  if (action.type === 'click') {
    const element = actionElement(action.selector);
    if (!element) return flash(`MISSING ${action.selector}`);
    clickElement(element, win);
    await finishAction(action);
    return;
  }

  if (action.type === 'repeatClick') {
    const element = actionElement(action.selector);
    if (!element) return flash(`MISSING ${action.selector}`);
    for (let index = 0; index < action.count; index += 1) {
      clickElement(element, win);
      await new Promise((resolve) => setTimeout(resolve, action.gap));
    }
    await finishAction(action);
    return;
  }

  if (action.type === 'hold') {
    const element = actionElement(action.selector);
    if (!element) return flash(`MISSING ${action.selector}`);
    pointerSequence += 1;
    element.dispatchEvent(pointerEvent(win, 'pointerdown', element, pointerSequence, 1));
    await new Promise((resolve) => setTimeout(resolve, action.ms));
    element.dispatchEvent(pointerEvent(win, 'pointerup', element, pointerSequence, 0));
    await finishAction(action);
    return;
  }

  if (action.type === 'scroll') {
    const max = Math.max(0, doc.documentElement.scrollHeight - win.innerHeight);
    const top = action.top ?? Math.round(max * (action.fraction ?? 0));
    win.scrollTo(0, top);
    await finishAction(action);
    return;
  }

  if (action.type === 'scrollTo') {
    const element = actionElement(action.selector);
    if (!element) return flash(`MISSING ${action.selector}`);
    element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
    await finishAction(action);
    return;
  }

  if (action.type === 'input') {
    const element = actionElement(action.selector);
    if (!element) return flash(`MISSING ${action.selector}`);
    element.value = action.value;
    element.dispatchEvent(new win.Event('input', { bubbles: true }));
    element.dispatchEvent(new win.Event('change', { bubbles: true }));
    await finishAction(action);
  }
}

async function runState(itemState) {
  if (itemState.unavailable) return flash(itemState.unavailable);
  activeStateId = itemState.id;
  activeStateWasCurrent = checkCurrent(itemState.current);
  activeStateExpiresAt = performance.now() + (
    itemState.current.type === 'unobservable'
      ? (itemState.observationMs ?? 1600)
      : 5000
  );
  detectedEffectStateId = null;
  selectedBugId = null;
  renderSheet();
  if (!activeStateWasCurrent) await runAction(itemState.action);
  refreshCurrentStates();
  lastOverlaySignature = '';
  updateSpotlight(true);
}

function jumpToBug(bug) {
  const stop = chooseBugStop(bug, selectedStop, WIDTH_STOPS);
  const widthChanged = stop.id !== selectedStop.id;
  selectedBugId = bug.id;
  activeStateId = null;
  activeStateWasCurrent = false;
  activeStateExpiresAt = 0;
  detectedEffectStateId = null;
  applyWidth(stop, { history: false });
  renderSheet();
  if (widthChanged) syncKitLocation();
  loadCurrentScreen(bug.action ?? null, bug.lawBoxes ?? []);
}

function activeState() {
  const item = currentComponentView();
  return item.states.find(({ id }) => id === activeStateId)
    ?? item.states.find(({ id }) => id === detectedEffectStateId)
    ?? null;
}

function selectedBug() {
  return currentComponentView().bugs?.find(({ id }) => id === selectedBugId) ?? null;
}

function specimenSelectors() {
  const item = currentComponentView();
  const itemState = activeState();
  const selected = itemState?.spotSelectors ?? item.selectors;
  return Array.isArray(selected) ? selected : [selected];
}

function selectorRects(selector, label, kind = 'specimen') {
  const doc = frameDocument();
  if (!doc) return [];
  try {
    return [...doc.querySelectorAll(selector)].map((element) => {
      const rect = clipRect(element.getBoundingClientRect(), selectedStop.width, selectedStop.height);
      return rect ? { ...rect, label, kind } : null;
    }).filter(Boolean);
  } catch (_error) {
    return [];
  }
}

function specimenHoles() {
  const item = currentComponentView();
  const holes = specimenSelectors().flatMap((selector) => selectorRects(selector, item.name));
  const itemState = activeState();
  const effects = itemState?.effects ?? [];
  effects.forEach((effect) => {
    holes.push(...selectorRects(effect.selector, effect.label, 'effect'));
  });
  return holes;
}

function lawBoxes() {
  const item = currentComponentView();
  const itemState = activeState();
  const configurations = [
    ...(item.lawBoxes ?? []),
    ...(itemState?.lawBoxes ?? []),
    ...(selectedBug()?.lawBoxes ?? []),
    ...pendingLawBoxes,
  ];
  const boxes = [];
  configurations.forEach((law) => {
    if (!isInGate(law, selectedStop)) return;
    if (law.type === 'viewport') {
      boxes.push({ x: 1, y: 1, width: selectedStop.width - 2, height: selectedStop.height - 2, label: law.label });
      return;
    }
    if (law.type === 'selector') {
      boxes.push(...selectorRects(law.selector, law.label, 'law'));
    }
  });
  return boxes;
}

function svgElement(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function labelNodes(rect, label, bug) {
  const labelWidth = Math.min(selectedStop.width, Math.max(48, label.length * 6.4 + 10));
  const labelX = Math.max(0, Math.min(selectedStop.width - labelWidth, rect.x));
  const labelY = rect.y >= 15 ? rect.y - 15 : rect.y;
  const background = svgElement('rect', {
    x: labelX,
    y: labelY,
    width: labelWidth,
    height: 14,
    class: `spot-label-bg${bug ? ' is-bug' : ''}`,
  });
  const copy = svgElement('text', {
    x: labelX + 5,
    y: labelY + 10.5,
    class: 'spot-label',
  });
  copy.textContent = label;
  return [background, copy];
}

function renderHoles(holes, boxes, bug) {
  const outer = `M0 0H${selectedStop.width}V${selectedStop.height}H0Z`;
  const cuts = unionRectangles(holes)
    .map((rect) => `M${rect.x} ${rect.y}H${rect.x + rect.width}V${rect.y + rect.height}H${rect.x}Z`)
    .join('');
  scrimPath.setAttribute('d', `${outer}${cuts}`);

  outlineLayer.replaceChildren(...holes.flatMap((rect, index) => {
    const outline = svgElement('rect', {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      class: 'spot-outline',
    });
    const suffix = holes.filter(({ label }) => label === rect.label).length > 1 ? ` ${index + 1}` : '';
    return [outline, ...labelNodes(rect, `${rect.label}${suffix}`, bug)];
  }));

  lawLayer.replaceChildren(...boxes.flatMap((box) => {
    const outline = svgElement('rect', {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      class: 'law-box',
    });
    const width = Math.min(selectedStop.width, Math.max(90, box.label.length * 6.4 + 10));
    const x = Math.max(0, Math.min(selectedStop.width - width, box.x));
    const y = Math.max(0, box.y);
    const background = svgElement('rect', { x, y, width, height: 15, class: 'law-label-bg' });
    const label = svgElement('text', { x: x + 5, y: y + 11, class: 'law-label' });
    label.textContent = box.label;
    return [outline, background, label];
  }));
}

function updateSpotlight(force = false) {
  const item = currentComponentView();
  if (!frameReady || item.mode === 'screen') {
    spotlight.toggleAttribute('hidden', true);
    return;
  }

  const holes = specimenHoles();
  const boxes = lawBoxes();
  const bug = shouldUseBugHighlight(
    selectedBug(),
    item.bugs ?? [],
    selectedStop,
    selectedKitMode,
  );
  const signature = JSON.stringify({ holes, boxes, bug });
  if (!force && signature === lastOverlaySignature) return;
  lastOverlaySignature = signature;
  spotlight.toggleAttribute('hidden', false);
  renderHoles(holes, boxes, bug);
}

function focusSpecimen() {
  const item = currentComponentView();
  if (!frameReady || item.mode === 'screen' || item.id === 'speaking') return;
  const doc = frameDocument();
  const selector = specimenSelectors()[0];
  const element = doc?.querySelector(selector);
  if (!element) return;
  const rect = element.getBoundingClientRect();
  if (rect.bottom <= 0 || rect.top >= selectedStop.height) {
    element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
  }
}

function updateGlobalControls() {
  const screen = currentScreen();
  const doc = frameDocument();
  colourField.disabled = !screen.colour;
  languageField.disabled = !screen.language;
  const mode = doc?.documentElement.getAttribute('data-mode');
  document.querySelectorAll('[data-global-colour]').forEach((button) => {
    const expected = button.dataset.globalColour === 'green' ? 'day' : 'party';
    button.classList.toggle('is-current', Boolean(screen.colour) && mode === expected);
  });
  const language = doc?.documentElement.lang;
  document.querySelectorAll('[data-global-language]').forEach((button) => {
    const expected = button.dataset.globalLanguage === 'pt' ? 'pt-BR' : 'en';
    button.classList.toggle('is-current', Boolean(screen.language) && language === expected);
  });
  modeField.querySelectorAll('[data-kit-mode]').forEach((button) => {
    const current = button.dataset.kitMode === selectedKitMode;
    button.classList.toggle('is-current', current);
    button.setAttribute('aria-pressed', String(current));
  });
}

function setKitMode(mode) {
  if (!['live', 'proposed'].includes(mode) || mode === selectedKitMode) return;
  selectedKitMode = mode;
  document.documentElement.dataset.kitMode = mode;
  activeStateId = null;
  activeStateWasCurrent = false;
  activeStateExpiresAt = 0;
  detectedEffectStateId = null;
  selectedBugId = null;
  pendingLawBoxes = [];
  renderSheet();
  syncKitLocation();
  loadCurrentScreen();
}

function driveGlobalColour(colour) {
  const screen = currentScreen();
  if (!screen.colour) return;
  const expected = colour === 'green' ? 'day' : 'party';
  const doc = frameDocument();
  if (doc?.documentElement.getAttribute('data-mode') === expected) return;
  runAction({ type: 'click', selector: screen.colour[colour] });
}

function driveGlobalLanguage(language) {
  const screen = currentScreen();
  if (!screen.language) return;
  const expected = language === 'pt' ? 'pt-BR' : 'en';
  const doc = frameDocument();
  if (doc?.documentElement.lang === expected) return;
  runAction({ type: 'click', selector: screen.language.toggle });
}

function keyboardMove(direction) {
  const components = currentScreen().components;
  const index = components.findIndex(({ id }) => id === selectedComponentId);
  const nextIndex = (index + direction + components.length) % components.length;
  selectComponent(selectedScreenId, components[nextIndex].id);
  catalogNav.querySelector('.component-row.is-current')?.focus({ preventScroll: false });
}

function restoreKitLocation() {
  const target = parseKitHash(location.hash, KIT_CATALOG, SCREEN_ORDER, WIDTH_STOPS);
  const stop = WIDTH_STOPS.find(({ id }) => id === target.widthId) ?? WIDTH_STOPS[0];
  const screenChanged = target.screenId !== selectedScreenId;
  const componentChanged = target.componentId !== selectedComponentId;
  const modeChanged = target.mode !== selectedKitMode;
  const widthChanged = stop.id !== selectedStop.id;

  if (!screenChanged && !componentChanged && !modeChanged && !widthChanged) {
    syncKitLocation({ replace: true });
    return;
  }

  selectedKitMode = target.mode;
  selectedStop = stop;
  document.documentElement.dataset.kitMode = selectedKitMode;
  widthSelect.value = selectedStop.id;
  if (widthChanged) resizeStage();
  selectComponent(target.screenId, target.componentId, {
    forceRoute: screenChanged || modeChanged,
    history: false,
  });
}

function animationLoop(timestamp) {
  if (timestamp - lastPollAt > 150) {
    lastPollAt = timestamp;
    refreshCurrentStates();
  }
  if (timestamp - lastSpotAt > 80) {
    lastSpotAt = timestamp;
    updateSpotlight();
  }
  requestAnimationFrame(animationLoop);
}

stageFrame.addEventListener('load', async () => {
  frameReady = true;
  lastOverlaySignature = '';
  try {
    const frameLocation = stageFrame.contentWindow.location;
    const hasNext = new URLSearchParams(frameLocation.search).get('next') === '1';
    const wantsNext = selectedKitMode === 'proposed';
    if (hasNext !== wantsNext) {
      const corrected = new URL(frameLocation.href);
      if (wantsNext) corrected.searchParams.set('next', '1');
      else corrected.searchParams.delete('next');
      frameReady = false;
      stageFrame.contentWindow.location.replace(corrected.href);
      return;
    }
    $('#routeReadout').textContent = `${frameLocation.pathname}${frameLocation.search}`;
  } catch (_error) {
    $('#routeReadout').textContent = currentScreen().route;
  }
  updateGlobalControls();
  if (pendingAction) {
    const action = pendingAction;
    pendingAction = null;
    await new Promise((resolve) => setTimeout(resolve, 80));
    await runAction(action);
  } else if (currentComponentView().setup) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    await runAction(currentComponentView().setup);
  }
  setTimeout(focusSpecimen, 80);
  updateSpotlight(true);
});

scrimPath.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  event.stopPropagation();
  flash('OUTSIDE THE SPECIMEN');
});

scrimPath.addEventListener('wheel', (event) => {
  event.preventDefault();
  event.stopPropagation();
  frameWindow()?.scrollBy(0, event.deltaY);
}, { passive: false });

widthSelect.addEventListener('change', () => {
  const stop = WIDTH_STOPS.find(({ id }) => id === widthSelect.value);
  if (stop) applyWidth(stop);
});

modeField.querySelectorAll('[data-kit-mode]').forEach((button) => {
  button.addEventListener('click', () => setKitMode(button.dataset.kitMode));
});

document.querySelectorAll('[data-global-colour]').forEach((button) => {
  button.addEventListener('click', () => driveGlobalColour(button.dataset.globalColour));
});

document.querySelectorAll('[data-global-language]').forEach((button) => {
  button.addEventListener('click', () => driveGlobalLanguage(button.dataset.globalLanguage));
});

navTrigger.addEventListener('click', () => {
  const open = !document.body.classList.contains('nav-open');
  document.body.classList.toggle('nav-open', open);
  navTrigger.setAttribute('aria-expanded', String(open));
});

navBackdrop.addEventListener('click', closeNav);

addEventListener('keydown', (event) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
  if (/^(input|select|textarea)$/i.test(event.target.tagName)) return;
  if (event.key.toLowerCase() === 'j') {
    event.preventDefault();
    keyboardMove(1);
  }
  if (event.key.toLowerCase() === 'k') {
    event.preventDefault();
    keyboardMove(-1);
  }
});

addEventListener('hashchange', () => {
  restoreKitLocation();
});

addEventListener('popstate', restoreKitLocation);

new ResizeObserver(resizeStage).observe(stageArea);

const initial = parseKitHash(location.hash, KIT_CATALOG, SCREEN_ORDER, WIDTH_STOPS);
selectedScreenId = initial.screenId;
selectedComponentId = initial.componentId;
selectedKitMode = initial.mode;
selectedStop = WIDTH_STOPS.find(({ id }) => id === initial.widthId) ?? WIDTH_STOPS[0];
document.documentElement.dataset.kitMode = selectedKitMode;
buildWidthControls();
buildCatalog();
refreshCatalogSelection();
renderSheet();
syncKitLocation({ replace: true });
resizeStage();
loadCurrentScreen();
requestAnimationFrame(animationLoop);
