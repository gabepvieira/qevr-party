import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEST_PORT = 4603;
const PAGE_PATHS = {
  sala: path.join(SITE_ROOT, "sala/index.html"),
  canon: path.join(SITE_ROOT, "canon/index.html"),
  notFound: path.join(SITE_ROOT, "404.html"),
};

async function pageSource(name) {
  return readFile(PAGE_PATHS[name], "utf8");
}

function cssRule(source, selector) {
  const css = [...source.matchAll(/<style>([\s\S]*?)<\/style>/g)]
    .map((match) => match[1])
    .join("\n");
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `missing CSS rule for ${selector}`);
  return match[1];
}

function runPrepaint(source, search) {
  const stylesheetAt = source.indexOf('<link rel="stylesheet"');
  assert.notEqual(stylesheetAt, -1, "page must load the shared stylesheet");
  const beforeStylesheet = source.slice(0, stylesheetAt);
  const script = beforeStylesheet.match(/<script>([\s\S]*?is-next[\s\S]*?)<\/script>/);
  assert.ok(script, "is-next prepaint script must run before the stylesheet");

  const classes = new Set();
  vm.runInNewContext(script[1], {
    document: {
      documentElement: {
        classList: {
          toggle(name, force) {
            if (force) classes.add(name);
            else classes.delete(name);
          },
        },
      },
    },
    location: { search },
    URLSearchParams,
  });
  return classes;
}

test("SALA, CANON, and 404 prepaint the optional NEXT state without changing flag-off", async () => {
  for (const name of Object.keys(PAGE_PATHS)) {
    const source = await pageSource(name);
    assert.match(
      source,
      /<meta name="viewport" content="[^"]*viewport-fit=cover[^"]*">/,
      `${name} must opt into safe viewport bounds`,
    );
    assert.equal(runPrepaint(source, "").has("is-next"), false, `${name} flag-off must remain off`);
    assert.equal(runPrepaint(source, "?next=0").has("is-next"), false, `${name} must ignore next=0`);
    assert.equal(runPrepaint(source, "?next=1").has("is-next"), true, `${name} must prepaint next=1`);
    assert.equal(
      runPrepaint(source, "?qa=1&next=1").has("is-next"),
      true,
      `${name} must preserve next=1 when another query parameter is present`,
    );
    assert.equal(
      (source.match(/\bconst\s+NEXT\s*=/g) || []).length,
      1,
      `${name} must declare exactly one NEXT constant`,
    );
    assert.match(
      source,
      /const\s+NEXT\s*=\s*document\.documentElement\.classList\.contains\("is-next"\)/,
      `${name} NEXT must derive from the prepainted class`,
    );
  }
});

test("SALA reserves every affected safe edge and separates the range track from its hitbox", async () => {
  const source = await pageSource("sala");
  const nav = cssRule(source, ".room-nav");
  assert.match(nav, /left\s*:\s*max\([^;]*env\(safe-area-inset-left\s*,\s*0px\)/);
  assert.match(nav, /right\s*:\s*env\(safe-area-inset-right\s*,\s*0px\)/);
  assert.match(nav, /padding-bottom\s*:\s*env\(safe-area-inset-bottom\s*,\s*0px\)/);
  const rooms = cssRule(source, ".rooms");
  assert.match(rooms, /padding-top\s*:\s*calc\([^;]*env\(safe-area-inset-top\s*,\s*0px\)/);
  assert.match(rooms, /padding-right\s*:\s*max\([^;]*env\(safe-area-inset-right\s*,\s*0px\)/);
  assert.match(rooms, /padding-bottom\s*:\s*calc\([^;]*env\(safe-area-inset-bottom\s*,\s*0px\)/);
  assert.match(rooms, /padding-left\s*:\s*max\([^;]*env\(safe-area-inset-left\s*,\s*0px\)/);
  assert.match(cssRule(source, ".switches"), /top\s*:\s*env\(safe-area-inset-top\s*,\s*0px\)/);
  assert.match(cssRule(source, ".switches"), /right\s*:\s*env\(safe-area-inset-right\s*,\s*0px\)/);
  for (const selector of [".back", "#langToggle"]) {
    const rule = cssRule(source, selector);
    assert.match(rule, /min-width\s*:\s*44px/);
    assert.match(rule, /min-height\s*:\s*44px/);
  }
  const back = cssRule(source, ".back");
  assert.match(back, /left\s*:\s*max\([^;]*env\(safe-area-inset-left\s*,\s*0px\)/);
  assert.match(back, /top\s*:\s*env\(safe-area-inset-top\s*,\s*0px\)/);
  const range = cssRule(source, ".growth-range");
  assert.match(range, /min-height\s*:\s*44px/);
  assert.match(cssRule(source, ".growth-range::-webkit-slider-runnable-track"), /height\s*:\s*16px/);
  assert.match(cssRule(source, ".growth-range::-moz-range-track"), /height\s*:\s*16px/);
});

test("CANON keeps its back target safe and intentionally has no language control", async () => {
  const source = await pageSource("canon");
  const rule = cssRule(source, ".canon-head a");
  assert.match(rule, /min-width\s*:\s*44px/);
  assert.match(rule, /min-height\s*:\s*44px/);
  const page = cssRule(source, ".canon-page");
  assert.match(page, /env\(safe-area-inset-left\s*,\s*0px\)/);
  assert.match(page, /env\(safe-area-inset-right\s*,\s*0px\)/);
  assert.match(page, /env\(safe-area-inset-bottom\s*,\s*0px\)/);
  assert.doesNotMatch(source, /id="langToggle"|class="switches"|\bLANG_KEY\b/);
});

function contentType(filename) {
  return {
    ".css": "text/css",
    ".html": "text/html",
    ".js": "text/javascript",
    ".json": "application/json",
    ".mjs": "text/javascript",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webmanifest": "application/manifest+json",
  }[path.extname(filename)] || "application/octet-stream";
}

async function startSite() {
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      let filename = path.resolve(SITE_ROOT, `.${pathname}`);
      if (!filename.startsWith(`${SITE_ROOT}${path.sep}`) && filename !== SITE_ROOT) throw new Error("outside site root");
      if (pathname.endsWith("/")) filename = path.join(filename, "index.html");
      const body = await readFile(filename);
      response.writeHead(200, { "content-type": contentType(filename) });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("not found");
    }
  });
  await new Promise((resolve) => server.listen(TEST_PORT, "127.0.0.1", resolve));
  return server;
}

async function box(page, selector) {
  const value = await page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  assert.ok(value.width >= 44, `${selector} width was ${value.width}px`);
  assert.ok(value.height >= 44, `${selector} height was ${value.height}px`);
}

test("the repaired SALA and CANON targets measure at least 44 by 44 on phone and desktop", async (t) => {
  const server = await startSite();
  const address = server.address();
  assert.equal(typeof address, "object");
  assert.equal(address.port, TEST_PORT);
  const base = `http://127.0.0.1:${TEST_PORT}`;
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  t.after(async () => {
    await browser.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  const page = await browser.newPage();
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(viewport);
    await page.goto(`${base}/sala/?next=1`, { waitUntil: "domcontentloaded" });
    assert.equal(await page.locator("html").evaluate((element) => element.classList.contains("is-next")), true);
    await box(page, ".back");
    await box(page, "#langToggle");
    await page.locator('[data-open-room="Growth"]').click();
    await box(page, ".growth-range");

    await page.goto(`${base}/canon/?next=1`, { waitUntil: "domcontentloaded" });
    assert.equal(await page.locator("html").evaluate((element) => element.classList.contains("is-next")), true);
    await box(page, ".canon-head a");
  }
  await page.goto(`${base}/404.html`, { waitUntil: "domcontentloaded" });
  assert.equal(await page.locator("html").evaluate((element) => element.classList.contains("is-next")), false);
  await page.goto(`${base}/404.html?next=1`, { waitUntil: "domcontentloaded" });
  assert.equal(await page.locator("html").evaluate((element) => element.classList.contains("is-next")), true);
});

async function salaClearance(page, base, { width, height, next = false, room, revisitStory = false }) {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}/sala/${next ? "?next=1" : ""}`, { waitUntil: "networkidle" });
  if (revisitStory) {
    await page.locator('[data-open-room="Dna"]').click();
    await page.locator('[data-open-room="Story"]').click();
  } else {
    await page.locator(`[data-open-room="${room}"]`).click();
  }
  return page.evaluate(() => {
    const exhibit = document.querySelector(".room.on .exhibit").getBoundingClientRect();
    const controls = document.querySelector(".room.on .exhibit__controls")?.getBoundingClientRect();
    const nav = document.querySelector(".room-nav").getBoundingClientRect();
    return {
      exhibitBottom: exhibit.bottom,
      controlsBottom: controls?.bottom ?? exhibit.bottom,
      navTop: nav.top,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
}

test("SALA floor navigation never covers a revisited room at 1280 by 800", async (t) => {
  const server = await startSite();
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  t.after(async () => {
    await browser.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  const page = await browser.newPage();
  for (const next of [false, true]) {
    const geometry = await salaClearance(page, `http://127.0.0.1:${TEST_PORT}`, {
      width: 1280,
      height: 800,
      next,
      revisitStory: true,
    });
    assert.ok(
      geometry.exhibitBottom <= geometry.navTop,
      `${next ? "PROPOSED" : "LIVE"} story exhibit ended at ${geometry.exhibitBottom}px under nav top ${geometry.navTop}px`,
    );
    assert.equal(geometry.scrollWidth, geometry.clientWidth);
  }
});

test("SALA DNA controls clear the floor navigation on a sub-720px-height phone", async (t) => {
  const server = await startSite();
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  t.after(async () => {
    await browser.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  const page = await browser.newPage();
  for (const next of [false, true]) {
    const geometry = await salaClearance(page, `http://127.0.0.1:${TEST_PORT}`, {
      width: 375,
      height: 600,
      next,
      room: "Dna",
    });
    assert.ok(
      geometry.controlsBottom <= geometry.navTop,
      `${next ? "PROPOSED" : "LIVE"} DNA controls ended at ${geometry.controlsBottom}px under nav top ${geometry.navTop}px`,
    );
    assert.equal(geometry.scrollWidth, geometry.clientWidth);
  }
});

test("SALA DNA art resizes continuously across 719, 720, and 721px heights", async (t) => {
  const server = await startSite();
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  t.after(async () => {
    await browser.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  const page = await browser.newPage({ viewport: { width: 375, height: 719 } });
  await page.goto(`http://127.0.0.1:${TEST_PORT}/sala/`, { waitUntil: "networkidle" });
  await page.locator('[data-open-room="Dna"]').click();
  const heights = [];
  for (const height of [719, 720, 721]) {
    await page.setViewportSize({ width: 375, height });
    heights.push(await page.locator("#roomDna .exhibit__art").evaluate((element) => element.getBoundingClientRect().height));
  }
  assert.ok(Math.abs(heights[1] - heights[0]) <= 2, `719→720 art jump was ${heights[1] - heights[0]}px`);
  assert.ok(Math.abs(heights[2] - heights[1]) <= 2, `720→721 art jump was ${heights[2] - heights[1]}px`);
});
