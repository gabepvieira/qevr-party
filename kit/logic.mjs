const DEFAULT_MODE = 'live';
const DEFAULT_WIDTH_ID = 'laptop-13';

function defaultWidthId(widthStops) {
  return widthStops.some(({ id }) => id === DEFAULT_WIDTH_ID)
    ? DEFAULT_WIDTH_ID
    : widthStops[0]?.id;
}

export function parseKitHash(hash, catalog, screenOrder, widthStops = []) {
  const fallbackScreenId = screenOrder[0];
  const fallbackComponentId = catalog[fallbackScreenId].components[0].id;
  const clean = String(hash || '').replace(/^#/, '');
  const questionAt = clean.indexOf('?');
  const path = questionAt === -1 ? clean : clean.slice(0, questionAt);
  const query = questionAt === -1 ? '' : clean.slice(questionAt + 1);
  const [screenId, componentId] = path.split('/').map(decodeURIComponent);
  const params = new URLSearchParams(query);
  const mode = params.get('mode') === 'proposed' ? 'proposed' : DEFAULT_MODE;
  const requestedWidthId = params.get('width');
  const widthId = widthStops.some(({ id }) => id === requestedWidthId)
    ? requestedWidthId
    : defaultWidthId(widthStops);
  const screen = catalog[screenId];

  if (!screen) {
    return {
      screenId: fallbackScreenId,
      componentId: fallbackComponentId,
      mode,
      widthId,
    };
  }

  const component = componentId
    ? screen.components.find(({ id }) => id === componentId)
    : screen.components[0];

  return {
    screenId,
    componentId: component?.id ?? screen.components[0].id,
    mode,
    widthId,
  };
}

export function formatKitHash(screenId, componentId, catalog, options = {}) {
  const firstId = catalog[screenId].components[0].id;
  const path = componentId === firstId
    ? `#${encodeURIComponent(screenId)}`
    : `#${encodeURIComponent(screenId)}/${encodeURIComponent(componentId)}`;
  const params = new URLSearchParams();
  if (options.mode === 'proposed') params.set('mode', 'proposed');
  if (options.widthId && options.widthId !== DEFAULT_WIDTH_ID) {
    params.set('width', options.widthId);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function writeKitHash(historyApi, hash, options = {}) {
  const method = options.replace ? 'replaceState' : 'pushState';
  historyApi[method](null, '', hash);
}

export function formatPreviewRoute(route, mode) {
  const url = new URL(route, 'https://kit.invalid');
  if (mode === 'proposed') url.searchParams.set('next', '1');
  else url.searchParams.delete('next');
  return `${url.pathname}${url.search}${url.hash}`;
}

export function componentForMode(component, mode) {
  if (mode !== 'proposed' || !component.preview) return component;
  const { status: _status, ...overrides } = component.preview;
  return { ...component, ...overrides, preview: component.preview };
}

export function computeStageScale(
  stageWidth,
  stageHeight,
  deviceWidth,
  deviceHeight,
  padding = 0,
) {
  const availableWidth = Math.max(1, stageWidth - padding * 2);
  const availableHeight = Math.max(1, stageHeight - padding * 2);
  return Math.min(1, availableWidth / deviceWidth, availableHeight / deviceHeight);
}

export function clipRect(rect, viewportWidth, viewportHeight) {
  const left = Math.max(0, Math.min(viewportWidth, rect.left));
  const top = Math.max(0, Math.min(viewportHeight, rect.top));
  const right = Math.max(0, Math.min(viewportWidth, rect.right));
  const bottom = Math.max(0, Math.min(viewportHeight, rect.bottom));
  const width = right - left;
  const height = bottom - top;

  return width > 0 && height > 0
    ? { x: left, y: top, width, height }
    : null;
}

export function isInGate(gatedItem, stop) {
  if (stop.width < (gatedItem.minWidth ?? -Infinity)) return false;
  if (stop.width > (gatedItem.maxWidth ?? Infinity)) return false;
  if (stop.height < (gatedItem.minHeight ?? -Infinity)) return false;
  if (stop.height > (gatedItem.maxHeight ?? Infinity)) return false;
  return true;
}

export function chooseBugStop(bug, currentStop, widthStops) {
  const matchingStops = widthStops.filter((stop) => isInGate(bug, stop));
  const candidates = matchingStops.length
    ? matchingStops
    : widthStops.filter((stop) => (
      stop.width >= bug.minWidth && stop.width <= bug.maxWidth
    ));

  if (!candidates.length) return currentStop;
  if (candidates.some(({ id }) => id === currentStop.id)) return currentStop;

  return [...candidates].sort((left, right) => (
    Math.abs(left.width - currentStop.width) - Math.abs(right.width - currentStop.width)
  ))[0];
}

export function shouldUseBugHighlight(selectedBug, bugs, stop, mode = 'live') {
  if (mode !== 'live') return false;
  if (selectedBug) return selectedBug.observed !== false && !selectedBug.fixed;
  return bugs.some((bug) => bug.observed !== false && !bug.fixed && isInGate(bug, stop));
}

export function unionRectangles(rectangles) {
  const usable = rectangles.filter(({ x, y, width, height }) => (
    [x, y, width, height].every(Number.isFinite) && width > 0 && height > 0
  ));
  if (!usable.length) return [];

  const xStops = [...new Set(usable.flatMap(({ x, width }) => [x, x + width]))]
    .sort((left, right) => left - right);
  const strips = [];

  for (let index = 0; index < xStops.length - 1; index += 1) {
    const x = xStops[index];
    const right = xStops[index + 1];
    if (right <= x) continue;

    const intervals = usable
      .filter((rect) => rect.x < right && rect.x + rect.width > x)
      .map((rect) => [rect.y, rect.y + rect.height])
      .sort(([leftStart, leftEnd], [rightStart, rightEnd]) => (
        leftStart - rightStart || leftEnd - rightEnd
      ));
    const merged = [];

    intervals.forEach(([start, end]) => {
      const previous = merged.at(-1);
      if (previous && start <= previous[1]) {
        previous[1] = Math.max(previous[1], end);
      } else {
        merged.push([start, end]);
      }
    });

    merged.forEach(([top, bottom]) => {
      const adjacent = strips.findLast((rect) => (
        rect.y === top
        && rect.height === bottom - top
        && rect.x + rect.width === x
      ));
      if (adjacent) {
        adjacent.width = right - adjacent.x;
      } else {
        strips.push({ x, y: top, width: right - x, height: bottom - top });
      }
    });
  }

  return strips;
}
