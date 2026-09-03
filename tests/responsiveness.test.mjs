import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { chromium } from "playwright";

const SITE = "http://localhost:4599";
const PHONE_STOPS = [
  [360, 800],
  [375, 812],
  [390, 844],
  [393, 852],
  [402, 874],
  [412, 915],
  [414, 896],
  [428, 926],
  [430, 932],
  [440, 956],
];
const DESKTOP_STOPS = [
  [1280, 800],
  [1366, 768],
  [1440, 900],
  [1512, 982],
  [1536, 864],
  [1728, 1117],
  [1920, 1080],
  [2560, 1440],
  [3840, 2160],
];
const ROUND2_PICKER_STOPS = [
  [360, 800],
  [375, 667],
  [390, 844],
  [412, 915],
  [430, 932],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
];
const PREVIEW_PHONE_STOPS = [
  [360, 800],
  [375, 667],
  [375, 812],
  [390, 844],
  [393, 852],
  [402, 874],
  [412, 915],
  [414, 896],
  [428, 926],
  [430, 932],
];
const PREVIEW_DESKTOP_STOPS = [
  [1280, 800],
  [1366, 768],
  [1440, 900],
  [1536, 864],
  [1920, 1080],
];
const ROUND2_ROUTES = ["/", "/estudio/", "/galeria/", "/sala/", "/canon/", "/404.html"];
const PINNED_SECTIONS = ["manifesto", "pessoas", "stances"];

let browser;

test("the shared z tokens preserve LIVE values and give PROPOSED the full ladder", async () => {
  const css = await readFile(new URL("../assets/site.css", import.meta.url), "utf8");
  for (const declaration of [
    "--z-rail: 55",
    "--z-content: 1",
    "--z-header: 60",
    "--z-doors: 56",
    "--z-poster: 90",
    "--z-companion: 57",
  ]) assert.match(css, new RegExp(declaration.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  assert.match(css, /html\.is-next\s*\{[^}]*--z-rail:[^}]*--z-content:[^}]*--z-header:[^}]*--z-doors:[^}]*--z-poster:[^}]*--z-companion:/s);
  assert.match(css, /\.thermo\s*\{[^}]*z-index:\s*var\(--z-rail\)/s);
  assert.match(css, /\.bar\s*\{[^}]*z-index:\s*var\(--z-header\)/s);
  assert.match(css, /\.doors\s*\{[^}]*z-index:\s*var\(--z-doors\)/s);
  assert.match(css, /\.poster\s*\{[^}]*z-index:\s*var\(--z-poster\)/s);
  assert.match(css, /\.companion\s*\{[^}]*z-index:\s*var\(--z-companion\)/s);
});

test("PROPOSED phone pages prefer dynamic viewport height with an svh fallback", async () => {
  const source = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(source, /html\.is-next \.blocks\s*\{[^}]*100svh[^}]*\}/s);
  assert.match(source, /@supports\s*\(height:\s*100dvh\)\s*\{[\s\S]*?html\.is-next \.arrival\s*\{[^}]*100dvh[^}]*\}[\s\S]*?html\.is-next \.blocks\s*\{[^}]*100dvh[^}]*\}/s);
});

before(async () => {
  browser = await chromium.launch({ channel: "chrome", headless: true });
});

after(async () => {
  await browser.close();
});

async function waitForRoute(page, route) {
  if (route === "/") {
    await page.waitForFunction(
      () => !document.body.classList.contains("is-booting"),
      { timeout: 10000 },
    );
  } else {
    await page.waitForLoadState("networkidle");
  }
}

async function layoutSignature(page, selectors) {
  return page.evaluate((wanted) => ({
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    bodyWidth: document.body.getBoundingClientRect().width,
    bodyHeight: document.body.getBoundingClientRect().height,
    boxes: wanted.map((selector) => {
      const element = document.querySelector(selector);
      if (!element) return [selector, null];
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return [selector, {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        display: style.display,
        position: style.position,
        overflow: style.overflow,
      }];
    }),
  }), selectors);
}

test("every phone section can align its heading directly under the fixed bar", async () => {
  const failures = [];

  for (const [width, height] of PHONE_STOPS) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    for (const section of PINNED_SECTIONS) {
      await page.goto(`${SITE}/?lang=pt`);
      await page.waitForFunction(
        () => !document.body.classList.contains("is-booting"),
      );
      await page.locator(`#${section}`).click();

      const geometry = await page.evaluate((sectionId) => {
        const head = document.getElementById(sectionId).getBoundingClientRect();
        const bar = document.querySelector(".bar").getBoundingClientRect();
        return {
          actualTop: Math.round(head.top),
          expectedTop: Math.round(bar.bottom + 2),
        };
      }, section);

      if (Math.abs(geometry.actualTop - geometry.expectedTop) > 2) {
        failures.push({
          stop: `${width}x${height}`,
          section,
          ...geometry,
        });
      }
    }

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("phone section rows run full bleed from the thermometer to the right edge", async () => {
  const failures = [];

  for (const [width, height] of PHONE_STOPS) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    await page.goto(`${SITE}/?lang=en`);
    await page.waitForFunction(
      () => !document.body.classList.contains("is-booting"),
    );

    const geometry = await page.evaluate(() => {
      const rail = document.querySelector(".thermo").getBoundingClientRect();
      return {
        horizontalOverflow:
          document.documentElement.scrollWidth - window.innerWidth,
        rows: [...document.querySelectorAll(".panel__head")].map((head) => {
          const rect = head.getBoundingClientRect();
          return {
            id: head.id,
            left: Math.round(rect.left),
            expectedLeft: Math.round(rail.right),
            right: Math.round(rect.right),
            expectedRight: window.innerWidth,
          };
        }),
      };
    });

    for (const row of geometry.rows) {
      if (
        Math.abs(row.left - row.expectedLeft) > 1 ||
        Math.abs(row.right - row.expectedRight) > 1
      ) {
        failures.push({ stop: `${width}x${height}`, ...row });
      }
    }
    if (geometry.horizontalOverflow > 0) {
      failures.push({
        stop: `${width}x${height}`,
        horizontalOverflow: geometry.horizontalOverflow,
      });
    }

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("the open Gift bay ends shortly after its stamp on phones", async () => {
  const failures = [];

  for (const [width, height] of PHONE_STOPS) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    await page.goto(`${SITE}/?lang=en`);
    await page.waitForFunction(
      () => !document.body.classList.contains("is-booting"),
    );
    await page.locator("#presente").click();

    const geometry = await page.evaluate(() => {
      const bay = document.getElementById("bay").getBoundingClientRect();
      const stamp = document.querySelector("#bay > .stampband").getBoundingClientRect();
      const doors = document.getElementById("doors").getBoundingClientRect();
      const firstRow = document.getElementById("manifesto").getBoundingClientRect();
      const giftRow = document.getElementById("presente").getBoundingClientRect();
      const bar = document.querySelector(".bar").getBoundingClientRect();
      return {
        emptyBayTail: Math.round(bay.bottom - stamp.bottom),
        bayToDoors: Math.round(doors.top - bay.bottom),
        readTop: Math.round(firstRow.top),
        barBottom: Math.round(bar.bottom),
        giftBottom: Math.round(giftRow.bottom),
        viewportBottom: window.innerHeight,
      };
    });

    if (
      geometry.emptyBayTail > 24 ||
      Math.abs(geometry.bayToDoors) > 2 ||
      geometry.readTop < geometry.barBottom - 2 ||
      geometry.giftBottom > geometry.viewportBottom
    ) {
      failures.push({ stop: `${width}x${height}`, ...geometry });
    }

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("the desktop open panel sits directly on the Studio and Gallery doors", async () => {
  const failures = [];

  for (const [width, height] of DESKTOP_STOPS) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    await page.goto(`${SITE}/?lang=en`);
    await page.waitForFunction(
      () => !document.body.classList.contains("is-booting"),
    );
    await page.locator("#presente").click();

    const geometry = await page.evaluate(() => {
      const panel = document.getElementById("panel").getBoundingClientRect();
      const doors = document.getElementById("doors").getBoundingClientRect();
      return {
        panelToDoors: Math.round(doors.top - panel.bottom),
      };
    });

    if (Math.abs(geometry.panelToDoors) > 1) {
      failures.push({ stop: `${width}x${height}`, ...geometry });
    }

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("the closed phone menu sits directly on the Studio and Gallery doors", async () => {
  const failures = [];

  for (const [width, height] of PHONE_STOPS) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    await page.goto(`${SITE}/?lang=en`);
    await page.waitForFunction(
      () => !document.body.classList.contains("is-booting"),
    );

    const geometry = await page.evaluate(() => {
      const rail = document.getElementById("panelRail").getBoundingClientRect();
      const doors = document.getElementById("doors").getBoundingClientRect();
      return {
        menuToDoors: Math.round(doors.top - rail.bottom),
      };
    });

    if (Math.abs(geometry.menuToDoors) > 1) {
      failures.push({ stop: `${width}x${height}`, ...geometry });
    }

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("an unfilled thermometer leaves no empty gutter beside the doors", async () => {
  const failures = [];
  const edgeStops = [PHONE_STOPS[4], DESKTOP_STOPS[2], DESKTOP_STOPS.at(-1)];

  for (const [width, height] of edgeStops) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    await page.goto(`${SITE}/?lang=en`);
    await page.waitForFunction(
      () => !document.body.classList.contains("is-booting"),
    );

    const geometry = await page.evaluate(() => {
      const doors = document.getElementById("doors").getBoundingClientRect();
      const thermo = document.getElementById("thermo");
      const fill = document.getElementById("thermoFill").getBoundingClientRect();
      return {
        doorLeft: Math.round(doors.left),
        doorRight: Math.round(doors.right),
        expectedRight: window.innerWidth,
        fillHeight: Math.round(fill.height),
        thermoBackground: getComputedStyle(thermo).backgroundColor,
      };
    });

    if (
      geometry.doorLeft !== 0 ||
      Math.abs(geometry.doorRight - geometry.expectedRight) > 1 ||
      geometry.fillHeight !== 0 ||
      geometry.thermoBackground !== "rgba(0, 0, 0, 0)"
    ) {
      failures.push({ stop: `${width}x${height}`, ...geometry });
    }

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("desktop heading surfaces fill their complete rail cells", async () => {
  const failures = [];

  for (const [width, height] of DESKTOP_STOPS) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    await page.goto(`${SITE}/?lang=en`);
    await page.waitForFunction(
      () => !document.body.classList.contains("is-booting"),
    );

    const geometry = await page.evaluate(() => {
      const blocks = document.querySelector(".blocks").getBoundingClientRect();
      const rail = document.getElementById("panelRail").getBoundingClientRect();
      return [...document.querySelectorAll(".panel__head")].map((head) => {
        const rect = head.getBoundingClientRect();
        return {
          id: head.id,
          left: Math.round(rect.left),
          expectedLeft: Math.round(blocks.left),
          right: Math.round(rect.right),
          expectedRight: Math.round(rail.right),
        };
      });
    });

    for (const row of geometry) {
      if (
        Math.abs(row.left - row.expectedLeft) > 1 ||
        Math.abs(row.right - row.expectedRight) > 1
      ) {
        failures.push({ stop: `${width}x${height}`, ...row });
      }
    }

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("the desktop panel grid meets the read's top rule", async () => {
  const failures = [];

  for (const [width, height] of DESKTOP_STOPS) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    await page.goto(`${SITE}/?lang=en`);
    await page.waitForFunction(
      () => !document.body.classList.contains("is-booting"),
    );

    const geometry = await page.evaluate(() => {
      const blocks = document.querySelector(".blocks").getBoundingClientRect();
      const panel = document.getElementById("panel").getBoundingClientRect();
      const rail = document.getElementById("panelRail").getBoundingClientRect();
      return {
        panelTopGap: Math.round(panel.top - blocks.top),
        railTopGap: Math.round(rail.top - blocks.top),
      };
    });

    if (
      Math.abs(geometry.panelTopGap) > 1 ||
      Math.abs(geometry.railTopGap) > 1
    ) {
      failures.push({ stop: `${width}x${height}`, ...geometry });
    }

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("mobile hover surfaces stay visible up to the PT and color buttons", async () => {
  const failures = [];

  for (const [width, height] of PHONE_STOPS) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    await page.goto(`${SITE}/?lang=en`);
    await page.waitForFunction(
      () => !document.body.classList.contains("is-booting"),
    );
    await page.locator("#manifesto").hover();

    const geometry = await page.evaluate(() => {
      const row = document.getElementById("manifesto").getBoundingClientRect();
      const switches = document.querySelector(".switches");
      return {
        rowRight: Math.round(row.right),
        expectedRight: window.innerWidth,
        rowBackground: getComputedStyle(document.getElementById("manifesto"))
          .backgroundColor,
        switchesBackground: getComputedStyle(switches).backgroundColor,
      };
    });

    if (
      Math.abs(geometry.rowRight - geometry.expectedRight) > 1 ||
      geometry.rowBackground !== "rgb(20, 20, 22)" ||
      geometry.switchesBackground !== "rgba(0, 0, 0, 0)"
    ) {
      failures.push({ stop: `${width}x${height}`, ...geometry });
    }

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("the native scrollbar is hidden while the page remains scrollable", async () => {
  const failures = [];

  for (const [width, height] of [[390, 844], DESKTOP_STOPS[2]]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    await page.goto(`${SITE}/?lang=en`);
    await page.waitForFunction(
      () => !document.body.classList.contains("is-booting"),
    );

    const geometry = await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      return {
        scrollbarWidth: getComputedStyle(document.documentElement).scrollbarWidth,
        htmlWebkitScrollbar: getComputedStyle(
          document.documentElement,
          "::-webkit-scrollbar",
        ).display,
        bodyWebkitScrollbar: getComputedStyle(
          document.body,
          "::-webkit-scrollbar",
        ).display,
        scrollY: window.scrollY,
      };
    });

    if (
      geometry.scrollbarWidth !== "none" ||
      geometry.htmlWebkitScrollbar !== "none" ||
      geometry.bodyWebkitScrollbar !== "none" ||
      geometry.scrollY <= 0
    ) {
      failures.push({ stop: `${width}x${height}`, ...geometry });
    }

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("the thermometer stays behind the Studio and Gallery doors", async () => {
  const failures = [];

  for (const [width, height] of [PHONE_STOPS[4], DESKTOP_STOPS[2]]) {
    for (const mode of ["live", "proposed"]) {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();

      await page.goto(`${SITE}/?lang=en${mode === "proposed" ? "&next=1" : ""}`);
      await page.waitForFunction(
        () => !document.body.classList.contains("is-booting"),
      );
      if (mode === "proposed") {
        const readTop = await page.evaluate(() =>
          Math.round(document.querySelector(".blocks").getBoundingClientRect().top + scrollY - document.querySelector(".bar").offsetHeight)
        );
        await page.evaluate((y) => window.scrollTo(0, y), readTop);
        await page.locator("#pessoas").click();
      }
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );

      const layering = await page.evaluate(() => {
        const door = document.getElementById("doorEstudio").getBoundingClientRect();
        const x = 7;
        const y = Math.max(
          0,
          Math.min(window.innerHeight - 1, Math.round((door.top + door.bottom) / 2)),
        );
        const top = document.elementFromPoint(x, y);
        return {
          x,
          y,
          topId: top?.id || null,
          topClass: top?.className || null,
          doorIsOnTop: Boolean(top?.closest?.(".doorband")),
        };
      });

      if (!layering.doorIsOnTop) {
        failures.push({ stop: `${width}x${height}`, mode, ...layering });
      }

      await context.close();
    }
  }

  assert.deepEqual(failures, []);
});

test("Gift doors absorb the remaining phone floor without opening a gap", async () => {
  const failures = [];

  for (const [width, height] of PHONE_STOPS) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    await page.goto(`${SITE}/?lang=en`);
    await page.waitForFunction(
      () => !document.body.classList.contains("is-booting"),
    );
    await page.locator("#presente").click();

    const geometry = await page.evaluate(() => {
      const blocks = document.querySelector(".blocks").getBoundingClientRect();
      const bay = document.getElementById("bay").getBoundingClientRect();
      const doors = document.getElementById("doors").getBoundingClientRect();
      return {
        giftToDoors: Math.round(doors.top - bay.bottom),
        doorsToFloor: Math.round(blocks.bottom - doors.bottom),
      };
    });

    if (
      Math.abs(geometry.giftToDoors) > 2 ||
      Math.abs(geometry.doorsToFloor) > 1
    ) {
      failures.push({ stop: `${width}x${height}`, ...geometry });
    }

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("the thermometer stays behind the QIQI header", async () => {
  const failures = [];

  for (const [width, height] of [PHONE_STOPS[4], DESKTOP_STOPS[2]]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    await page.goto(`${SITE}/?lang=en`);
    await page.waitForFunction(
      () => !document.body.classList.contains("is-booting"),
    );
    await page.evaluate(() =>
      window.scrollTo(0, Math.round(document.documentElement.scrollHeight / 2)),
    );

    const layering = await page.evaluate(() => {
      const bar = document.querySelector(".bar").getBoundingClientRect();
      const x = 7;
      const y = Math.round((bar.top + bar.bottom) / 2);
      const top = document.elementFromPoint(x, y);
      return {
        barLeft: Math.round(bar.left),
        barRight: Math.round(bar.right),
        viewportRight: window.innerWidth,
        topId: top?.id || null,
        topClass: top?.className || null,
        barIsOnTop: Boolean(top?.closest?.(".bar")),
      };
    });

    if (
      layering.barLeft !== 0 ||
      layering.barRight !== layering.viewportRight ||
      !layering.barIsOnTop
    ) {
      failures.push({ stop: `${width}x${height}`, ...layering });
    }

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("flag-off layout is identical with an inert next=0 query", async () => {
  const selectors = {
    "/": [".bar", "main", ".arrival", ".blocks"],
    "/estudio/": [".bar", ".maker", ".maker__frame"],
    "/galeria/": [".bar", ".studio", ".plate"],
    "/sala/": [".rooms", ".room-nav"],
    "/canon/": [".bar", ".canon-page", ".canon-head"],
    "/404.html": [".bar", ".wrong"],
  };
  const failures = [];

  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    for (const route of ROUND2_ROUTES) {
      const signatures = [];
      for (const query of ["", "?next=0"]) {
        const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
        const page = await context.newPage();
        await page.goto(`${SITE}${route}${query}`);
        await waitForRoute(page, route);
        const next = await page.locator("html").evaluate((element) => element.classList.contains("is-next"));
        signatures.push({ next, layout: await layoutSignature(page, selectors[route]) });
        await context.close();
      }
      if (signatures[0].next || signatures[1].next || JSON.stringify(signatures[0].layout) !== JSON.stringify(signatures[1].layout)) {
        failures.push({ stop: `${viewport.width}x${viewport.height}`, route, signatures });
      }
    }
  }

  assert.deepEqual(failures, []);
});

test("PROPOSED phone read keeps every section in one stable screen with no scrolling", async () => {
  const failures = [];

  for (const [width, height] of PREVIEW_PHONE_STOPS) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(`${SITE}/?lang=en&next=1`);
    await waitForRoute(page, "/");

    const top = await page.evaluate(() => {
      window.scrollTo(0, 0);
      const bar = document.querySelector(".bar").getBoundingClientRect();
      const arrival = document.querySelector(".arrival").getBoundingClientRect();
      const blocks = document.querySelector(".blocks").getBoundingClientRect();
      return {
        next: document.documentElement.classList.contains("is-next"),
        barBottom: bar.bottom,
        arrivalBottom: arrival.bottom,
        blocksTop: blocks.top,
        viewportHeight: innerHeight,
        readTop: Math.round(blocks.top + scrollY - bar.height),
      };
    });
    await page.evaluate((readTop) => window.scrollTo(0, readTop), top.readTop);
    await page.waitForTimeout(40);

    const landed = await page.evaluate(() => {
      const bar = document.querySelector(".bar").getBoundingClientRect();
      const arrival = document.querySelector(".arrival").getBoundingClientRect();
      const blocks = document.querySelector(".blocks").getBoundingClientRect();
      const doors = document.getElementById("doors").getBoundingClientRect();
      const heads = [...document.querySelectorAll(".panel__head")].map((head) => {
        const rect = head.getBoundingClientRect();
        return { top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height) };
      });
      return {
        barBottom: Math.round(bar.bottom),
        arrivalBottom: Math.round(arrival.bottom),
        blocksTop: Math.round(blocks.top),
        blocksHeight: Math.round(blocks.height),
        expectedBlocksHeight: Math.round(innerHeight - bar.height),
        pageEnd: document.documentElement.scrollHeight - innerHeight,
        scrollY: Math.round(scrollY),
        stampHidden: document.querySelector(".stampband").hidden,
        doorsTop: Math.round(doors.top),
        doorsBottom: Math.round(doors.bottom),
        heads,
        viewportHeight: innerHeight,
        horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
      };
    });

    const interactionHeadHeights = [];
    for (const id of ["manifesto", "pessoas", "stances", "regras", "presente"]) {
      await page.locator(`#${id}`).hover();
      interactionHeadHeights.push(await page.evaluate(() =>
        [...document.querySelectorAll(".panel__head")].map((head) => Math.round(head.getBoundingClientRect().height))
      ));
      await page.locator(`#${id}`).focus();
      interactionHeadHeights.push(await page.evaluate(() =>
        [...document.querySelectorAll(".panel__head")].map((head) => Math.round(head.getBoundingClientRect().height))
      ));
    }

    await page.locator("#pessoas").click();
    const opened = await page.evaluate(() => {
      const blocks = document.querySelector(".blocks").getBoundingClientRect();
      const bay = document.getElementById("bay");
      const bayRect = bay.getBoundingClientRect();
      const copyRect = document.getElementById("bayCopy").getBoundingClientRect();
      const peopleClose = bay.querySelector(".bay__close");
      const accordionRows = bay.querySelectorAll(".head-lines .stance").length;
      const stampElement = document.querySelector(".stampband");
      const doors = document.getElementById("doors").getBoundingClientRect();
      return {
        blocksHeight: Math.round(blocks.height),
        pageEnd: document.documentElement.scrollHeight - innerHeight,
        scrollY: Math.round(scrollY),
        bayOverflowY: getComputedStyle(bay).overflowY,
        bayScrolls: bay.scrollHeight > bay.clientHeight + 1,
        stampInsideBay: bay.contains(stampElement),
        stampHidden: stampElement.hidden,
        bayFollowsSelectedHead: bay.previousElementSibling?.id === "pessoas",
        remainingHeadsFollowBay: bay.nextElementSibling?.id === "stances",
        peopleClosePresent: Boolean(peopleClose),
        accordionRows,
        copyBottom: Math.round(copyRect.bottom),
        nextHeadTop: Math.round(document.getElementById("stances").getBoundingClientRect().top),
        heads: [...document.querySelectorAll(".panel__head")].map((head) => Math.round(head.getBoundingClientRect().height)),
        bayTop: Math.round(bayRect.top),
        bayBottom: Math.round(bayRect.bottom),
        copyTop: Math.round(copyRect.top),
        doorsTop: Math.round(doors.top),
        doorsBottom: Math.round(doors.bottom),
        viewportHeight: innerHeight,
        horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
      };
    });

    await page.mouse.move(width / 2, height / 2);
    await page.mouse.wheel(0, height * 2);
    await page.waitForTimeout(35);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(25);
    const floor = await page.evaluate(() => {
      const doors = document.getElementById("doors").getBoundingClientRect();
      return {
        scrollY: Math.round(scrollY),
        pageEnd: document.documentElement.scrollHeight - innerHeight,
        doorsBottom: Math.round(doors.bottom),
        viewportHeight: innerHeight,
      };
    });

    await page.locator("#pessoas").click();
    const closed = await page.evaluate(() => ({
      blocksHeight: Math.round(document.querySelector(".blocks").getBoundingClientRect().height),
      bayHidden: document.getElementById("bay").hidden,
      stampHidden: document.querySelector(".stampband").hidden,
    }));

    if (
      !top.next
      || top.blocksTop < top.viewportHeight - 2
      || landed.arrivalBottom > landed.barBottom + 2
      || Math.abs(landed.blocksTop - landed.barBottom) > 2
      || Math.abs(landed.blocksHeight - landed.expectedBlocksHeight) > 2
      || Math.abs(landed.pageEnd - top.readTop) > 2
      || Math.abs(landed.scrollY - top.readTop) > 2
      || !landed.stampHidden
      || landed.heads.length !== 5
      || landed.heads.some(({ height: headHeight }) => headHeight < 44)
      || Math.abs(landed.doorsTop - landed.heads[landed.heads.length - 1].bottom) > 2
      || interactionHeadHeights.some((heights) =>
        JSON.stringify(heights) !== JSON.stringify(landed.heads.map(({ height: headHeight }) => headHeight))
      )
      || landed.doorsTop < landed.barBottom
      || landed.doorsBottom > landed.viewportHeight + 1
      || landed.horizontalOverflow > 0
      || Math.abs(opened.blocksHeight - landed.blocksHeight) > 2
      || Math.abs(opened.pageEnd - top.readTop) > 2
      || Math.abs(opened.scrollY - top.readTop) > 2
      || !["hidden", "clip"].includes(opened.bayOverflowY)
      || opened.bayScrolls
      || opened.stampInsideBay
      || !opened.stampHidden
      || !opened.bayFollowsSelectedHead
      || !opened.remainingHeadsFollowBay
      || opened.peopleClosePresent
      || opened.accordionRows !== 4
      || opened.heads.some((headHeight) => headHeight < 44)
      || Math.max(...opened.heads) - Math.min(...opened.heads) > 1
      || opened.copyTop < opened.bayTop - 1
      || Math.abs(opened.nextHeadTop - opened.bayBottom) > 2
      || opened.horizontalOverflow > 0
      || Math.abs(floor.scrollY - top.readTop) > 2
      || Math.abs(floor.pageEnd - top.readTop) > 2
      || Math.abs(floor.doorsBottom - floor.viewportHeight) > 1
      || !closed.bayHidden
      || !closed.stampHidden
      || Math.abs(closed.blocksHeight - landed.blocksHeight) > 2
    ) failures.push({ stop: `${width}x${height}`, top, landed, opened, floor, closed });

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("PROPOSED phone boundary never paints an empty third frame", async () => {
  const failures = [];
  const stops = [[360, 800], [375, 667], [390, 844], [412, 915], [430, 932]];

  for (const [width, height] of stops) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(`${SITE}/?lang=en&next=1`);
    await waitForRoute(page, "/");

    const readTop = await page.evaluate(() => Math.round(
      document.querySelector(".blocks").getBoundingClientRect().top
      + scrollY
      - document.querySelector(".bar").offsetHeight
    ));
    const state = () => page.evaluate((target) => {
      const arrival = document.querySelector(".arrival");
      const blocks = document.querySelector(".blocks");
      const bar = document.querySelector(".bar").getBoundingClientRect();
      const arrivalRect = arrival.getBoundingClientRect();
      const blocksRect = blocks.getBoundingClientRect();
      const y = Math.round(scrollY);
      const onArrival = Math.abs(y) <= 1;
      const onRead = Math.abs(y - target) <= 1;
      return {
        y,
        onArrival,
        onRead,
        arrivalVisible: getComputedStyle(arrival).visibility !== "hidden",
        blocksVisible: getComputedStyle(blocks).visibility !== "hidden",
        readActive: document.body.classList.contains("is-read-active"),
        arrivalTop: Math.round(arrivalRect.top),
        arrivalBottom: Math.round(arrivalRect.bottom),
        blocksTop: Math.round(blocksRect.top),
        barBottom: Math.round(bar.bottom),
        viewportHeight: innerHeight,
      };
    }, readTop);
    const nextPaint = () => page.evaluate(() => new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    ));
    const validFrame = (sample) => (
      (
        sample.arrivalVisible
        && !sample.blocksVisible
        && !sample.readActive
        && Math.abs(sample.arrivalTop - sample.barBottom) <= 1
        && Math.abs(sample.arrivalBottom - sample.viewportHeight) <= 1
      ) || (
        !sample.arrivalVisible
        && sample.blocksVisible
        && sample.readActive
        && Math.abs(sample.blocksTop - sample.barBottom) <= 1
      )
    );

    const samples = {};
    for (const fraction of [0.25, 0.5, 0.75, 0.99]) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate((input) => window.scrollTo(0, Math.round(input.target * input.fraction)), { target: readTop, fraction });
      await nextPaint();
      samples[`pending-${fraction}`] = await state();
      await page.waitForTimeout(45);
      samples[`settled-${fraction}`] = await state();
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.wheel(0, height * 3);
    await nextPaint();
    samples.fastDown = await state();
    await page.mouse.wheel(0, -height * 3);
    await nextPaint();
    samples.fastUp = await state();

    const pendingValid = [0.25, 0.5, 0.75, 0.99]
      .every((fraction) => validFrame(samples[`pending-${fraction}`]));
    const settledValid = [0.25, 0.5, 0.75, 0.99].every((fraction) => {
      const sample = samples[`settled-${fraction}`];
      return fraction < 0.5 ? sample.onArrival : sample.onRead;
    });
    if (!pendingValid || !settledValid || !validFrame(samples.fastDown) || !validFrame(samples.fastUp)) {
      failures.push({ stop: `${width}x${height}`, readTop, samples });
    }
    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("an active PROPOSED phone read stays pinned through continuous viewport resizing", async () => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${SITE}/?lang=en&next=1`);
  await waitForRoute(page, "/");
  const readTop = await page.evaluate(() => Math.round(
    document.querySelector(".blocks").getBoundingClientRect().top
    + scrollY
    - document.querySelector(".bar").offsetHeight
  ));
  await page.evaluate((target) => window.scrollTo(0, target), readTop);
  await page.locator("#stances").click();
  await page.locator("#bay .stance").nth(2).click();
  await page.waitForTimeout(550);
  const expectedAnswer = await page.locator("#stancesGrid .stances__bay-copy").innerText();

  const failures = [];
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 360, height: 800 },
    { width: 430, height: 932 },
    { width: 375, height: 667 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForTimeout(220);
    const sample = await page.evaluate(() => {
      const bar = document.querySelector(".bar").getBoundingClientRect();
      const blocks = document.querySelector(".blocks").getBoundingClientRect();
      const bay = document.getElementById("bay");
      const doors = document.getElementById("doors").getBoundingClientRect();
      return {
        viewport: [innerWidth, innerHeight],
        active: document.body.classList.contains("is-read-active"),
        section: bay.dataset.section,
        blocksTop: blocks.top,
        barBottom: bar.bottom,
        doorsBottom: doors.bottom,
        pageEnd: document.documentElement.scrollHeight - innerHeight,
        scrollY,
        bayScrollTop: bay.scrollTop,
        bayScrolls: bay.scrollHeight > bay.clientHeight + 1,
        expanded: [...document.querySelectorAll("#stancesGrid > .stance")]
          .findIndex((stance) => stance.getAttribute("aria-expanded") === "true"),
        answer: document.querySelector("#stancesGrid .stances__bay-copy")?.innerText || "",
      };
    });
    if (
      !sample.active
      || sample.section !== "stances"
      || Math.abs(sample.blocksTop - sample.barBottom) > 1
      || Math.abs(sample.doorsBottom - viewport.height) > 1
      || Math.abs(sample.scrollY - sample.pageEnd) > 1
      || sample.bayScrollTop !== 0
      || sample.bayScrolls
      || sample.expanded !== 2
      || sample.answer !== expectedAnswer
    ) failures.push(sample);
  }
  await context.close();
  assert.deepEqual(failures, []);
});

test("an active PROPOSED phone read stays pinned when animation frames are throttled", async () => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${SITE}/?lang=en&next=1`);
  await waitForRoute(page, "/");
  const readTop = await page.evaluate(() => Math.round(
    document.querySelector(".blocks").getBoundingClientRect().top
    + scrollY
    - document.querySelector(".bar").offsetHeight
  ));
  await page.evaluate((target) => window.scrollTo(0, target), readTop);
  await page.locator("#stances").click();
  await page.locator("#bay .stance").nth(2).click();

  await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(30);

  const sample = await page.evaluate(() => {
    const bar = document.querySelector(".bar").getBoundingClientRect();
    const blocks = document.querySelector(".blocks").getBoundingClientRect();
    const bay = document.getElementById("bay");
    const doors = document.getElementById("doors").getBoundingClientRect();
    return {
      active: document.body.classList.contains("is-read-active"),
      section: bay.dataset.section,
      blocksTop: blocks.top,
      barBottom: bar.bottom,
      doorsBottom: doors.bottom,
      pageEnd: document.documentElement.scrollHeight - innerHeight,
      scrollY,
    };
  });

  await context.close();
  assert.equal(sample.active, true, JSON.stringify(sample));
  assert.equal(sample.section, "stances");
  assert.ok(Math.abs(sample.blocksTop - sample.barBottom) <= 1, JSON.stringify(sample));
  assert.ok(Math.abs(sample.doorsBottom - 844) <= 1, JSON.stringify(sample));
  assert.ok(Math.abs(sample.scrollY - sample.pageEnd) <= 1, JSON.stringify(sample));
});

test("the active PROPOSED phone frame stays visually pinned before resize scroll synchronization", async () => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${SITE}/?lang=en&next=1`);
  await waitForRoute(page, "/");
  const readTop = await page.evaluate(() => Math.round(
    document.querySelector(".blocks").getBoundingClientRect().top
    + scrollY
    - document.querySelector(".bar").offsetHeight
  ));
  await page.evaluate((target) => window.scrollTo(0, target), readTop);
  await page.locator("#manifesto").click();

  await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;
    window.scrollTo = () => {};
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(30);

  const sample = await page.evaluate(() => {
    const bar = document.querySelector(".bar").getBoundingClientRect();
    const blocks = document.querySelector(".blocks").getBoundingClientRect();
    const doors = document.getElementById("doors").getBoundingClientRect();
    return {
      active: document.body.classList.contains("is-read-active"),
      blocksTop: blocks.top,
      barBottom: bar.bottom,
      blocksBottom: blocks.bottom,
      doorsBottom: doors.bottom,
      viewportBottom: innerHeight,
    };
  });

  await context.close();
  assert.equal(sample.active, true, JSON.stringify(sample));
  assert.ok(Math.abs(sample.blocksTop - sample.barBottom) <= 1, JSON.stringify(sample));
  assert.ok(Math.abs(sample.blocksBottom - sample.viewportBottom) <= 1, JSON.stringify(sample));
  assert.ok(Math.abs(sample.doorsBottom - sample.viewportBottom) <= 1, JSON.stringify(sample));
});

test("an upward phone scroll wins a same-task race with viewport resizing", async () => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${SITE}/?lang=en&next=1`);
  await waitForRoute(page, "/");
  const pageEnd = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await page.evaluate((target) => window.scrollTo(0, target), pageEnd);
  await page.waitForTimeout(35);
  assert.equal(await page.evaluate(() => document.body.classList.contains("is-read-active")), true);

  await page.evaluate((target) => {
    window.scrollTo(0, Math.round(target * 0.25));
    visualViewport.dispatchEvent(new Event("resize"));
  }, pageEnd);
  await page.waitForTimeout(90);

  const sample = await page.evaluate(() => ({
    scrollY,
    active: document.body.classList.contains("is-read-active"),
    arrivalVisible: getComputedStyle(document.querySelector(".arrival")).visibility !== "hidden",
    blocksHidden: getComputedStyle(document.querySelector(".blocks")).visibility === "hidden",
    arrival: document.querySelector(".arrival").getBoundingClientRect().toJSON(),
    barBottom: document.querySelector(".bar").getBoundingClientRect().bottom,
  }));

  await context.close();
  assert.ok(sample.scrollY <= 1, JSON.stringify(sample));
  assert.equal(sample.active, false);
  assert.equal(sample.arrivalVisible, true);
  assert.equal(sample.blocksHidden, true);
  assert.ok(Math.abs(sample.arrival.top - sample.barBottom) <= 1, JSON.stringify(sample));
  assert.ok(Math.abs(sample.arrival.bottom - 844) <= 1, JSON.stringify(sample));
});

test("pinch zoom does not trigger the PROPOSED phone pager", async () => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${SITE}/?lang=en&next=1`);
  await waitForRoute(page, "/");
  const pageEnd = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await page.evaluate((target) => window.scrollTo(0, target), pageEnd);
  await page.waitForTimeout(35);
  await page.locator("#stances").click();
  await page.locator("#bay .stance").nth(2).click();

  const session = await context.newCDPSession(page);
  await session.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1.25 });
  await page.waitForFunction(() => visualViewport.scale > 1.1);
  const panTarget = Math.round(pageEnd * 0.25);
  await page.evaluate((target) => {
    window.scrollTo(0, target);
    visualViewport.dispatchEvent(new Event("resize"));
  }, panTarget);
  await page.waitForTimeout(90);

  const zoomed = await page.evaluate(() => ({
    scale: visualViewport.scale,
    scrollY,
    active: document.body.classList.contains("is-read-active"),
    section: document.getElementById("bay").dataset.section,
    expanded: [...document.querySelectorAll("#stancesGrid > .stance")]
      .findIndex((stance) => stance.getAttribute("aria-expanded") === "true"),
  }));

  await session.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });
  await page.waitForFunction(() => visualViewport.scale <= 1.01);
  await page.evaluate(() => visualViewport.dispatchEvent(new Event("resize")));
  await page.waitForTimeout(90);
  const reset = await page.evaluate(() => ({
    scale: visualViewport.scale,
    scrollY,
    pageEnd: document.documentElement.scrollHeight - innerHeight,
    active: document.body.classList.contains("is-read-active"),
    section: document.getElementById("bay").dataset.section,
    expanded: [...document.querySelectorAll("#stancesGrid > .stance")]
      .findIndex((stance) => stance.getAttribute("aria-expanded") === "true"),
  }));

  await context.close();
  assert.ok(zoomed.scale > 1.1, JSON.stringify(zoomed));
  assert.ok(Math.abs(zoomed.scrollY - panTarget) <= 2, JSON.stringify(zoomed));
  assert.equal(zoomed.active, true, JSON.stringify(zoomed));
  assert.equal(zoomed.section, "stances");
  assert.equal(zoomed.expanded, 2);
  assert.ok(Math.abs(reset.scrollY - reset.pageEnd) <= 1, JSON.stringify(reset));
  assert.equal(reset.active, true, JSON.stringify(reset));
  assert.equal(reset.section, "stances");
  assert.equal(reset.expanded, 2);
});

test("an open answer survives the shared 719px to 721px topology boundary", async () => {
  const failures = [];

  for (const mode of ["live", "proposed"]) {
    const context = await browser.newContext({
      viewport: { width: 719, height: 800 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(`${SITE}/?lang=en${mode === "proposed" ? "&next=1" : ""}`);
    await waitForRoute(page, "/");
    const readTop = await page.evaluate(() => Math.round(
      document.querySelector(".blocks").getBoundingClientRect().top
      + scrollY
      - document.querySelector(".bar").offsetHeight
    ));
    await page.evaluate((target) => window.scrollTo(0, target), readTop);
    await page.locator("#stances").click();
    await page.locator("#bay .stance").nth(2).click();
    await page.waitForTimeout(550);
    const expectedAnswer = await page.locator("#stancesGrid .stances__bay-copy").innerText();

    const inspect = () => page.evaluate(() => {
      const bay = document.getElementById("bay");
      const rail = document.getElementById("panelRail");
      const expanded = [...document.querySelectorAll("#stancesGrid > .stance")]
        .findIndex((stance) => stance.getAttribute("aria-expanded") === "true");
      return {
        width: innerWidth,
        parent: bay.parentElement?.id || null,
        previous: bay.previousElementSibling?.id || null,
        bayLeft: bay.getBoundingClientRect().left,
        railRight: rail.getBoundingClientRect().right,
        expanded,
        answer: document.querySelector("#stancesGrid .stances__bay-copy")?.innerText || "",
        focusIsExpanded: document.activeElement === document.querySelector("#stancesGrid > .stance[aria-expanded='true']"),
      };
    });

    const check = (stage, sample) => {
      const wide = sample.width > 720;
      if (
        sample.parent !== (wide ? "panel" : "panelRail")
        || (!wide && sample.previous !== "stances")
        || (wide && Math.abs(sample.bayLeft - sample.railRight) > 1.5)
        || sample.expanded !== 2
        || sample.answer !== expectedAnswer
        || !sample.focusIsExpanded
      ) failures.push({ mode, stage, ...sample, expectedAnswer });
    };

    await page.setViewportSize({ width: 721, height: 800 });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    check("721-immediate", await inspect());
    await page.waitForTimeout(220);
    check("721-settled", await inspect());

    await page.setViewportSize({ width: 719, height: 800 });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    check("719-immediate", await inspect());
    await page.waitForTimeout(220);
    check("719-settled", await inspect());

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("every PROPOSED phone section swaps into one fixed bay that spans to the next row", async () => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${SITE}/?lang=en&next=1`);
  await waitForRoute(page, "/");
  const readTop = await page.evaluate(() =>
    Math.round(document.querySelector(".blocks").getBoundingClientRect().top + scrollY - document.querySelector(".bar").offsetHeight)
  );
  await page.evaluate((y) => window.scrollTo(0, y), readTop);

  const failures = [];
  const ids = ["manifesto", "pessoas", "stances", "presente"];
  let bayBox = null;

  for (const [index, id] of ids.entries()) {
    await page.locator(`#${id}`).click();
    await page.waitForTimeout(35);
    const geometry = await page.evaluate(({ selectedId, nextId }) => {
      const bay = document.getElementById("bay");
      const copy = document.getElementById("bayCopy").getBoundingClientRect();
      const stampElement = document.querySelector(".stampband");
      const bayRect = bay.getBoundingClientRect();
      const selectedRect = document.getElementById(selectedId).getBoundingClientRect();
      const nextHead = nextId ? document.getElementById(nextId).getBoundingClientRect() : null;
      const doors = document.getElementById("doors").getBoundingClientRect();
      const stampRect = stampElement.getBoundingClientRect();
      const fitEl = document.getElementById("bayFit");
      const visibleKids = [...fitEl.children, stampElement]
        .filter((el) => el && !el.hidden && el.offsetHeight > 0 && bay.contains(el));
      const lastContentBottom = visibleKids.length
        ? Math.max(...visibleKids.map((el) => el.getBoundingClientRect().bottom))
        : bayRect.top;
      return {
        selectedId,
        bayAfterSelected: bay.previousElementSibling?.id === selectedId,
        bayHeight: Math.round(bayRect.height),
        bayWidth: Math.round(bayRect.width),
        bayAir: Math.round(bayRect.bottom - lastContentBottom),
        hasInnerList: Boolean(bay.querySelector(".head-lines, #stancesGrid")),
        bayTopGap: Math.round(bayRect.top - selectedRect.bottom),
        bayEndGap: Math.round((nextHead ? nextHead.top : doors.top) - bayRect.bottom),
        stampInsideBay: bay.contains(stampElement),
        stampHidden: stampElement.hidden,
        stampLow: stampElement.hidden ? null : Math.round(bayRect.bottom - stampRect.bottom),
        contentInsideBay: copy.top >= bayRect.top - 1 && copy.bottom <= bayRect.bottom + 1,
        bayOverflowY: getComputedStyle(bay).overflowY,
        bayScrolls: bay.scrollHeight > bay.clientHeight + 1,
        headHeights: [...document.querySelectorAll(".panel__head")].map((head) => Math.round(head.getBoundingClientRect().height)),
        pageEnd: document.documentElement.scrollHeight - innerHeight,
        scrollY: Math.round(scrollY),
        doorsBottom: Math.round(doors.bottom),
        viewportHeight: innerHeight,
      };
    }, { selectedId: id, nextId: id === "presente" ? null : ["pessoas", "stances", "regras", "presente"][index] });

    if (bayBox === null) bayBox = { width: geometry.bayWidth };

    if (
      !geometry.bayAfterSelected
      || Math.abs(geometry.bayWidth - bayBox.width) > 1
      || geometry.bayAir > (geometry.hasInnerList ? 110 : 20)
      || geometry.bayTopGap < -1 || geometry.bayTopGap > 2
      || geometry.bayEndGap < -1 || geometry.bayEndGap > 2
      || (geometry.selectedId === "presente"
        ? (!geometry.stampInsideBay || geometry.stampHidden || geometry.stampLow > 12)
        : (geometry.stampInsideBay || !geometry.stampHidden))
      || !geometry.contentInsideBay
      || !["hidden", "clip"].includes(geometry.bayOverflowY)
      || geometry.bayScrolls
      || geometry.headHeights.some((height) => height < 44)
      || Math.max(...geometry.headHeights) - Math.min(...geometry.headHeights) > 1
      || Math.abs(geometry.pageEnd - readTop) > 2
      || Math.abs(geometry.scrollY - readTop) > 2
      || Math.abs(geometry.doorsBottom - geometry.viewportHeight) > 1
    ) failures.push(geometry);

    await page.locator(`#${id}`).click();
  }

  await context.close();
  assert.deepEqual(failures, []);
});

test("the 375x667 floor fits every PT and EN section and every inner answer without clipping", async () => {
  const failures = [];

  for (const lang of ["pt", "en"]) {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(`${SITE}/?lang=${lang}&next=1`);
    await waitForRoute(page, "/");
    const readTop = await page.evaluate(() => Math.round(
      document.querySelector(".blocks").getBoundingClientRect().top
      + scrollY
      - document.querySelector(".bar").offsetHeight
    ));
    await page.evaluate((target) => window.scrollTo(0, target), readTop);
    await page.waitForTimeout(35);

    const inspect = (outerId, innerIndex = null) => page.evaluate(({ outerId, innerIndex, readTop }) => {
      const bay = document.getElementById("bay");
      const fit = document.getElementById("bayFit");
      const stamp = document.querySelector(".stampband");
      const doors = document.getElementById("doors");
      const bayRect = bay.getBoundingClientRect();
      const stampRect = stamp.getBoundingClientRect();
      const copyRect = document.getElementById("bayCopy").getBoundingClientRect();
      const nextHead = bay.nextElementSibling?.classList.contains("panel__head")
        ? bay.nextElementSibling.getBoundingClientRect()
        : null;
      const visible = [...fit.querySelectorAll(":scope > *, #bayCopy *")].filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      });
      const clipped = visible.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top < bayRect.top - 1.5
          || rect.bottom > bayRect.bottom + 1.5
          || rect.left < bayRect.left - 1.5
          || rect.right > bayRect.right + 1.5;
      }).map((element) => element.id || element.className || element.tagName);
      const scrollable = [".blocks", "#panel", "#panelRail", "#bay"].map((selector) => {
        const element = document.querySelector(selector);
        element.scrollTop = 9999;
        const positive = element.scrollTop;
        element.scrollTop = -9999;
        const negative = element.scrollTop;
        element.scrollTop = 0;
        return { selector, positive, negative, overflow: getComputedStyle(element).overflowY };
      });
      const headHeights = [...document.querySelectorAll(".panel__head")]
        .map((head) => head.getBoundingClientRect().height);
      const targetHeights = [...bay.querySelectorAll(".stance")]
        .map((target) => target.getBoundingClientRect().height);
      const answer = bay.querySelector(".stances__bay")?.getBoundingClientRect() || null;
      const innerHead = bay.querySelector(".stance__head");
      const answerParagraph = bay.querySelector(".stances__bay-copy p");
      const scale = bay.dataset.fitScale ?? null;
      const stampCanvas = stamp.querySelector("canvas");
      const stampCanvasRect = stampCanvas.getBoundingClientRect();
      const stampRatioX = stampCanvas.width / stampCanvasRect.width;
      const stampRatioY = stampCanvas.height / stampCanvasRect.height;
      const doorRect = doors.getBoundingClientRect();
      const railSamples = [0.2, 0.5, 0.8].map((fraction) => {
        const y = Math.max(0, Math.min(innerHeight - 1, doorRect.top + doorRect.height * fraction));
        return Boolean(document.elementFromPoint(7, y)?.closest?.(".doorband"));
      });
      return {
        outerId,
        innerIndex,
        scale,
        bayHeight: bayRect.height,
        clipped,
        scrollable,
        headHeights,
        targetHeights,
        innerHeadEffectivePx: innerHead ? parseFloat(getComputedStyle(innerHead).fontSize) : null,
        answerEffectivePx: answerParagraph ? parseFloat(getComputedStyle(answerParagraph).fontSize) : null,
        answerInside: !answer || (answer.top >= bayRect.top - 1.5 && answer.bottom <= bayRect.bottom + 1.5),
        stampHidden: stamp.hidden,
        stampDirectChild: stamp.parentElement === bay,
        stampNativeRaster: Math.abs(stampRatioX - devicePixelRatio) <= 0.02
          && Math.abs(stampRatioY - devicePixelRatio) <= 0.02,
        stampLow: stamp.hidden ? null : stampRect.bottom >= 0 ? Math.round(bayRect.bottom - stampRect.bottom) : null,
        pageEnd: document.documentElement.scrollHeight - innerHeight,
        scrollY: window.scrollY,
        readTop,
        doorsBottom: doorRect.bottom,
        viewportHeight: innerHeight,
        railSamples,
        thermoStep: Number(document.getElementById("thermo").dataset.step),
        thermoFire: document.getElementById("thermo").classList.contains("is-fire"),
      };
    }, { outerId, innerIndex, readTop });

    for (const outerId of ["manifesto", "pessoas", "stances", "presente"]) {
      await page.locator(`#${outerId}`).click();
      await page.waitForTimeout(45);
      const outer = await inspect(outerId);
      const maxHead = Math.max(...outer.headHeights);
      const minHead = Math.min(...outer.headHeights);
      const badOuter = outer.clipped.length
        || outer.scrollable.some(({ positive, negative }) => positive !== 0 || negative !== 0)
        || outer.targetHeights.some((height) => height < 19)
        || outer.scale !== null
        || (outerId === "presente"
          ? (outer.stampHidden || !outer.stampDirectChild || !outer.stampNativeRaster || outer.stampLow > 12)
          : (!outer.stampHidden || outer.stampDirectChild))
        || maxHead - minHead > 1.5
        || outer.headHeights.some((height) => height < 43.5)
        || Math.abs(outer.pageEnd - readTop) > 1
        || Math.abs(outer.scrollY - readTop) > 1
        || Math.abs(outer.doorsBottom - outer.viewportHeight) > 1
        || outer.railSamples.some((covered) => !covered)
        || outer.thermoStep !== 12 || outer.thermoFire;
      if (badOuter) failures.push({ lang, stage: "outer", ...outer });

      const innerCount = await page.locator("#bay .stance").count();
      for (let innerIndex = 0; innerIndex < innerCount; innerIndex += 1) {
        await page.locator("#bay .stance").nth(innerIndex).click();
        await page.waitForTimeout(45);
        const inner = await inspect(outerId, innerIndex);
        const maxInnerHead = Math.max(...inner.headHeights);
        const minInnerHead = Math.min(...inner.headHeights);
        const badInner = inner.clipped.length
          || inner.scrollable.some(({ positive, negative }) => positive !== 0 || negative !== 0)
          || inner.targetHeights.some((height) => height < 19)
          || Math.abs(inner.bayHeight - outer.bayHeight) > 1.5
          || maxInnerHead - minInnerHead > 1.5
          || inner.scale !== null
          || (outerId === "presente"
            ? (inner.stampHidden || !inner.stampDirectChild)
            : (!inner.stampHidden || inner.stampDirectChild))
          || (inner.innerHeadEffectivePx !== null && inner.innerHeadEffectivePx < 10.9)
          || (inner.answerEffectivePx !== null && inner.answerEffectivePx < 10.9)
          || !inner.answerInside
          || Math.abs(inner.pageEnd - readTop) > 1
          || Math.abs(inner.scrollY - readTop) > 1
          || Math.abs(inner.doorsBottom - inner.viewportHeight) > 1
          || inner.railSamples.some((covered) => !covered)
          || inner.thermoStep !== 12 || inner.thermoFire;
        if (badInner) failures.push({ lang, stage: "inner", ...inner });
      }
      await page.locator(`#${outerId}`).click();
    }

    await page.locator("#regras").focus();
    await page.locator("#regras").click();
    const poster = await page.evaluate(() => {
      const modal = document.getElementById("poster");
      const controls = modal.querySelector(".poster__controls").getBoundingClientRect();
      modal.scrollTop = 9999;
      return {
        open: modal.classList.contains("on"),
        scrollTop: modal.scrollTop,
        scrollHeight: modal.scrollHeight,
        clientHeight: modal.clientHeight,
        controlsBottom: controls.bottom,
        viewportHeight: innerHeight,
      };
    });
    if (!poster.open || poster.scrollTop !== 0 || poster.scrollHeight > poster.clientHeight + 1 || poster.controlsBottom > poster.viewportHeight) {
      failures.push({ lang, stage: "poster", poster });
    }
    await page.keyboard.press("Escape");
    const posterClosed = await page.evaluate(() => ({
      open: document.getElementById("poster").classList.contains("on"),
      focusId: document.activeElement?.id || null,
      bodyOverflow: document.body.style.overflow,
    }));
    if (posterClosed.open || posterClosed.focusId !== "regras" || posterClosed.bodyOverflow !== "") {
      failures.push({ lang, stage: "poster-close", posterClosed });
    }
    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("PROPOSED hard separator resolves at desktop widths and leaves the read free", async () => {
  const failures = [];

  for (const [width, height] of PREVIEW_DESKTOP_STOPS) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(`${SITE}/?lang=en&next=1`);
    await waitForRoute(page, "/");

    const boundary = await page.evaluate(() => {
      const bar = document.querySelector(".bar").getBoundingClientRect();
      const blocks = document.querySelector(".blocks").getBoundingClientRect();
      return {
        blocksTop: blocks.top,
        viewportHeight: innerHeight,
        readTop: Math.round(blocks.top + scrollY - bar.height),
      };
    });
    await page.evaluate((readTop) => window.scrollTo(0, Math.round(readTop * 0.35)), boundary.readTop);
    await page.waitForTimeout(240);
    const resolvedY = await page.evaluate(() => scrollY);

    await page.evaluate((readTop) => window.scrollTo(0, readTop), boundary.readTop);
    await page.waitForTimeout(40);
    const landed = await page.evaluate(() => {
      const bar = document.querySelector(".bar").getBoundingClientRect();
      const arrival = document.querySelector(".arrival").getBoundingClientRect();
      const blocks = document.querySelector(".blocks").getBoundingClientRect();
      return {
        barBottom: Math.round(bar.bottom),
        arrivalBottom: Math.round(arrival.bottom),
        blocksTop: Math.round(blocks.top),
        scrollY,
      };
    });

    await page.locator("#presente").click();
    const free = await page.evaluate((readTop) => {
      const target = Math.min(
        document.documentElement.scrollHeight - innerHeight,
        readTop + 140,
      );
      window.scrollTo(0, target);
      return { target, readTop };
    }, boundary.readTop);
    await page.waitForTimeout(50);
    free.actual = await page.evaluate(() => scrollY);

    const resolved = Math.abs(resolvedY) <= 2 || Math.abs(resolvedY - boundary.readTop) <= 2;
    const hasFreeRoom = free.target > free.readTop + 20;
    if (
      boundary.blocksTop < boundary.viewportHeight - 2
      || !resolved
      || landed.arrivalBottom > landed.barBottom + 2
      || Math.abs(landed.blocksTop - landed.barBottom) > 2
      || (hasFreeRoom && free.actual <= free.readTop + 20)
    ) failures.push({ stop: `${width}x${height}`, boundary, resolvedY, landed, free });

    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("PROPOSED dock exposes only independent destination actions with 44px targets", async () => {
  const failures = [];
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    for (const state of [
      { lang: "en", mode: "day", languageDestination: "PT", colourDestination: "PINK", colourClass: "to-pink" },
      { lang: "pt", mode: "party", languageDestination: "EN", colourDestination: "VERDE", colourClass: "to-green" },
    ]) {
      const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(`${SITE}/?lang=${state.lang}&mode=${state.mode}&next=1`);
      await waitForRoute(page, "/");

      const landing = await page.evaluate(() => ({
        dockIds: [...document.querySelectorAll("#headerDock > button")].map(({ id }) => id),
        landingSwatches: ["arrivalGreen", "arrivalPink"].filter((id) => {
          const element = document.getElementById(id);
          return element && getComputedStyle(element).display !== "none";
        }),
        readTop: Math.round(document.querySelector(".blocks").getBoundingClientRect().top + scrollY - document.querySelector(".bar").offsetHeight),
      }));
      await page.evaluate((readTop) => window.scrollTo(0, readTop), landing.readTop);
      await page.waitForTimeout(40);
      const read = await page.evaluate(() => ({
        buttons: [...document.querySelectorAll("#headerDock > button")].map((button) => {
          const rect = button.getBoundingClientRect();
          return {
            id: button.id,
            text: button.textContent.trim(),
            label: button.getAttribute("aria-label"),
            classes: [...button.classList],
            width: rect.width,
            height: rect.height,
          };
        }),
      }));

      const ids = read.buttons.map(({ id }) => id);
      const language = read.buttons.find(({ id }) => id === "langToggle");
      const colour = read.buttons.find(({ id }) => id === "colorToggle");
      if (
        JSON.stringify(landing.dockIds) !== JSON.stringify(["langToggle"])
        || JSON.stringify(landing.landingSwatches) !== JSON.stringify(["arrivalGreen", "arrivalPink"])
        || JSON.stringify(ids) !== JSON.stringify(["langToggle", "colorToggle"])
        || language?.text !== state.languageDestination
        || colour?.label !== state.colourDestination
        || !colour?.classes.includes(state.colourClass)
        || (viewport.width > 430
          ? read.buttons.some(({ width, height }) => width < 44 || height < 44)
          : !(colour && colour.width >= 34 && colour.height >= 20 && colour.height <= 30
            && language && language.height >= 20 && language.height <= 30))
      ) failures.push({ viewport, state, landing, read });
      await context.close();
    }
  }
  assert.deepEqual(failures, []);
});

test("PROPOSED thermo is read-relative on desktop and transition-relative on fixed phones", async () => {
  const failures = [];
  const viewports = [
    { width: 390, height: 844, source: "transition" },
    { width: 719, height: 800, source: "read" },
    { width: 720, height: 800, source: "read" },
    { width: 721, height: 800, source: "read" },
    { width: 1280, height: 800, source: "read" },
    { width: 1440, height: 900, source: "read" },
    { width: 1920, height: 1080, source: "read" },
  ];
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(`${SITE}/?lang=en&next=1`);
    await waitForRoute(page, "/");
    const positions = await page.evaluate(() => {
      const bar = document.querySelector(".bar");
      const blocks = document.querySelector(".blocks");
      const readTop = Math.max(0, Math.round(blocks.getBoundingClientRect().top + scrollY - bar.offsetHeight));
      const end = document.documentElement.scrollHeight - innerHeight;
      return { readTop, end };
    });
    const samples = [];
    const targets = viewport.source === "transition"
      ? [0, Math.round(positions.readTop / 2), positions.readTop]
      : [0, positions.readTop, Math.round((positions.readTop + positions.end) / 2), positions.end];
    for (const target of targets) {
      await page.evaluate((y) => window.scrollTo(0, y), target);
      await page.waitForTimeout(25);
      samples.push(await page.evaluate(() => ({
        y: Math.round(scrollY),
        step: Number(document.getElementById("thermo").getAttribute("data-step")),
        fire: document.getElementById("thermo").classList.contains("is-fire"),
      })));
    }
    const expected = viewport.source === "transition" ? [0, 6, 12] : [0, 0, 6, 12];
    if (
      (viewport.source === "read" && positions.end <= positions.readTop)
      ||
      samples.some((sample, index) => Math.abs(sample.step - expected[index]) > 1)
      || samples.at(-1).fire !== (viewport.source !== "transition")
      || samples.slice(0, -1).some(({ fire }) => fire)
    ) failures.push({ viewport, positions, samples, expected });
    await context.close();
  }
  assert.deepEqual(failures, []);
});

test("PROPOSED hold charge and ERRO exclusively own the signal slot, then speech resumes", async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${SITE}/?lang=pt&next=1`);
  await waitForRoute(page, "/");

  const mascot = page.locator("#mascotBtn");
  const box = await mascot.boundingBox();
  assert.ok(box, "arrival mascot did not render");
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.waitForFunction(() => document.getElementById("mascotHint").getAttribute("aria-label"));
  const initialLabel = await page.locator("#mascotHint").getAttribute("aria-label");
  await page.waitForTimeout(2900);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.waitForTimeout(850);
  const charging = await page.evaluate(() => ({
    takeover: document.getElementById("arrivalSignal").getAttribute("data-signal-takeover"),
    hintVisibility: getComputedStyle(document.getElementById("mascotHint")).visibility,
    chargeDisplay: getComputedStyle(document.getElementById("mascotCharge")).display,
    label: document.getElementById("mascotHint").getAttribute("aria-label"),
  }));
  await page.mouse.up();
  await page.waitForTimeout(80);
  const resumed = await page.evaluate(() => ({
    takeover: document.getElementById("arrivalSignal").getAttribute("data-signal-takeover"),
    hintVisibility: getComputedStyle(document.getElementById("mascotHint")).visibility,
    chargeDisplay: getComputedStyle(document.getElementById("mascotCharge")).display,
  }));

  for (let count = 0; count < 9; count += 1) await mascot.click({ delay: 8 });
  const erro = await page.evaluate(() => ({
    takeover: document.getElementById("arrivalSignal").getAttribute("data-signal-takeover"),
    hintVisibility: getComputedStyle(document.getElementById("mascotHint")).visibility,
    tagDisplay: getComputedStyle(document.getElementById("mascotTag")).display,
    tagInSignal: document.getElementById("mascotTag").parentElement === document.getElementById("arrivalSignal"),
  }));
  await page.waitForFunction(() => {
    const signal = document.getElementById("arrivalSignal");
    const hint = document.getElementById("mascotHint");
    return !signal.getAttribute("data-signal-takeover")
      && signal.classList.contains("is-ready")
      && getComputedStyle(hint).visibility === "visible";
  }, { timeout: 5000 });
  const errorResumed = await page.evaluate(() => ({
    takeover: document.getElementById("arrivalSignal").getAttribute("data-signal-takeover"),
    hintVisibility: getComputedStyle(document.getElementById("mascotHint")).visibility,
    label: document.getElementById("mascotHint").getAttribute("aria-label"),
  }));

  assert.deepEqual(charging, {
    takeover: "charge",
    hintVisibility: "hidden",
    chargeDisplay: "block",
    label: initialLabel,
  });
  assert.deepEqual(resumed, {
    takeover: null,
    hintVisibility: "visible",
    chargeDisplay: "none",
  });
  assert.deepEqual(erro, {
    takeover: "error",
    hintVisibility: "hidden",
    tagDisplay: "block",
    tagInSignal: true,
  });
  assert.deepEqual(errorResumed, {
    takeover: null,
    hintVisibility: "visible",
    label: initialLabel,
  });
  await context.close();
});

test("cold delayed deck and mascot data keep the reserved arrival geometry exact", async () => {
  const failures = [];

  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    let delayedResponses = 0;
    await context.route(/\/assets\/(?:manifesto\.en|qevr-expressions)\.json(?:\?.*)?$/, async (route) => {
      delayedResponses += 1;
      await new Promise((resolve) => setTimeout(resolve, 750));
      await route.continue();
    });
    const page = await context.newPage();
    await page.goto(`${SITE}/?lang=en&next=1`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.getElementById("mascotBtn")?.dataset.layoutReserved === "true");

    const readGeometry = () => page.evaluate(() => Object.fromEntries(
      ["#arrivalSignal", "#mascotBtn"].map((selector) => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return [selector, [rect.x, rect.y, rect.width, rect.height].map(Math.round)];
      }),
    ));
    const reserved = await readGeometry();
    await page.waitForFunction(() => !document.body.classList.contains("is-booting"), { timeout: 10000 });
    await page.waitForFunction(() => document.getElementById("arrivalSignal")?.classList.contains("is-ready"));
    const settled = await readGeometry();

    if (delayedResponses !== 2 || JSON.stringify(reserved) !== JSON.stringify(settled)) {
      failures.push({ viewport, delayedResponses, reserved, settled });
    }
    await context.close();
  }

  assert.deepEqual(failures, []);
});

test("B7 and proposed room headers render clear at their discovery geometries", async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();

  await page.goto(`${SITE}/estudio/`);
  await waitForRoute(page, "/estudio/");
  const liveWordmark = await page.locator(".bar__mark canvas").evaluate((canvas) => canvas.getBoundingClientRect().left);
  assert.ok(liveWordmark >= 14, `Estudio wordmark entered the 14px rail at ${liveWordmark}px`);

  await page.goto(`${SITE}/estudio/?next=1`);
  await waitForRoute(page, "/estudio/");
  const proposedStudio = await page.evaluate(() => {
    const switchBox = document.querySelector(".switches").getBoundingClientRect();
    const editor = document.querySelector(".maker__canvasbox").getBoundingClientRect();
    const tools = document.querySelector(".maker__tools");
    tools.scrollTop = tools.scrollHeight;
    const send = document.getElementById("btnSend").getBoundingClientRect();
    const toolBox = tools.getBoundingClientRect();
    return {
      overlap: switchBox.left < editor.right && switchBox.right > editor.left && switchBox.top < editor.bottom && switchBox.bottom > editor.top,
      documentOverflow: document.documentElement.scrollHeight - innerHeight,
      sendReachable: send.bottom <= toolBox.bottom + 1,
    };
  });
  assert.deepEqual(proposedStudio, { overlap: false, documentOverflow: 0, sendReachable: true });

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${SITE}/estudio/`);
  await waitForRoute(page, "/estudio/");
  const attachment = await page.evaluate(() => {
    const maker = document.querySelector(".maker").getBoundingClientRect();
    const door = document.querySelector(".canon-door").getBoundingClientRect();
    return { left: Math.abs(maker.left - door.left), bottom: Math.abs(maker.bottom - door.bottom) };
  });
  assert.ok(attachment.left <= 1 && attachment.bottom <= 1, `desktop CANON door detached: ${JSON.stringify(attachment)}`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${SITE}/galeria/?next=1`);
  await waitForRoute(page, "/galeria/");
  const proposedGallery = await page.evaluate(() => {
    const switchBox = document.querySelector(".switches").getBoundingClientRect();
    const frame = document.getElementById("frame");
    const frameBox = frame.getBoundingClientRect();
    const pressed = [...document.querySelectorAll(".face[aria-pressed='true']")];
    return {
      frameBelowDock: frameBox.top >= switchBox.bottom - 1,
      frameClips: getComputedStyle(frame).overflow === "hidden",
      pressedCount: pressed.length,
      pressedLabel: pressed[0]?.getAttribute("aria-label"),
      stageLabel: document.getElementById("stageName").getAttribute("aria-label"),
    };
  });
  assert.deepEqual(proposedGallery, {
    frameBelowDock: true,
    frameClips: true,
    pressedCount: 1,
    pressedLabel: proposedGallery.stageLabel,
    stageLabel: proposedGallery.stageLabel,
  });

  await page.setViewportSize({ width: 721, height: 800 });
  await page.goto(`${SITE}/galeria/?next=1`);
  await waitForRoute(page, "/galeria/");
  const wrapped = await page.locator(".stage__controls .ctl").evaluateAll((buttons) => buttons
    .filter((button) => button.scrollWidth > button.clientWidth + 1)
    .map((button) => ({ text: button.textContent, scrollWidth: button.scrollWidth, clientWidth: button.clientWidth })));
  assert.deepEqual(wrapped, []);
  await context.close();
});

test("touch activation, keyboard activation, and Escape preserve the manifesto paths", async () => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${SITE}/?next=1`);
  await waitForRoute(page, "/");
  const readTop = await page.evaluate(() => Math.round(
    document.querySelector(".blocks").getBoundingClientRect().top
      + scrollY
      - document.querySelector(".bar").offsetHeight,
  ));
  await page.evaluate((top) => scrollTo(0, top), readTop);
  await page.locator("#pessoas").tap();
  assert.equal(await page.locator("#pessoas").getAttribute("aria-selected"), "true");
  assert.equal(await page.locator("#doors").evaluate((doors) => doors.getBoundingClientRect().bottom <= innerHeight + 1), true);

  await page.locator("#regras").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#poster").evaluate((poster) => poster.classList.contains("on")), true);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#poster").evaluate((poster) => poster.classList.contains("on")), false);
  await context.close();
});

test("reduced motion keeps the invitation static and suppresses speech rotation", async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`${SITE}/?next=1`);
  await waitForRoute(page, "/");
  await page.waitForFunction(() => document.getElementById("mascotHint")?.getAttribute("data-signal-chunk") === "static");
  const first = await page.locator("#mascotHint").evaluate((hint) => ({
    label: hint.getAttribute("aria-label"),
    text: hint.querySelector(".arrival__hint-copy")?.textContent,
    chunk: hint.getAttribute("data-signal-chunk"),
  }));
  await page.waitForTimeout(3700);
  const later = await page.locator("#mascotHint").evaluate((hint) => ({
    label: hint.getAttribute("aria-label"),
    text: hint.querySelector(".arrival__hint-copy")?.textContent,
    chunk: hint.getAttribute("data-signal-chunk"),
  }));
  assert.deepEqual(later, first);
  await context.close();
});

test("key raster canvases keep integer backing scales at DPR 1, 2, and 3 in both modes", async () => {
  const selectors = {
    "/": "#mascotCanvas",
    "/estudio/": "#editor",
    "/galeria/": "#stageCanvas",
    "/sala/": "#storyCanvas",
    "/canon/": "#canonCanvas",
    "/404.html": "#mascotCanvas",
  };
  const failures = [];

  for (const dpr of [1, 2, 3]) {
    for (const proposed of [false, true]) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: dpr,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      for (const route of ROUND2_ROUTES) {
        await page.goto(`${SITE}${route}${proposed ? "?next=1" : ""}`);
        await waitForRoute(page, route);
        const readRaster = () => page.locator(selectors[route]).evaluate((canvas) => {
          const rect = canvas.getBoundingClientRect();
          const ratioX = canvas.width / rect.width;
          const ratioY = canvas.height / rect.height;
          const nearInteger = (value) => Math.abs(value - Math.round(value)) <= 0.02;
          return {
            rect: [rect.x, rect.y, rect.width, rect.height],
            backing: [canvas.width, canvas.height],
            ratioX,
            ratioY,
            dpr: devicePixelRatio,
            imageRendering: getComputedStyle(canvas).imageRendering,
            extentAligned: nearInteger(rect.width * ratioX) && nearInteger(rect.height * ratioY),
            integerScale: nearInteger(ratioX) && nearInteger(ratioY),
            evenScale: Math.abs(ratioX - ratioY) <= 0.02,
          };
        });
        const samples = [await readRaster()];
        for (const viewport of [{ width: 391, height: 845 }, { width: 390, height: 844 }]) {
          await page.setViewportSize(viewport);
          await page.waitForTimeout(220);
          samples.push(await readRaster());
        }
        for (const [sample, raster] of samples.entries()) {
          if (
            raster.dpr !== dpr
            || raster.imageRendering !== "pixelated"
            || !raster.extentAligned
            || !raster.integerScale
            || !raster.evenScale
            || raster.backing.some((value) => !Number.isInteger(value) || value <= 0)
          ) failures.push({ dpr, mode: proposed ? "PROPOSED" : "LIVE", route, sample, raster });
        }
      }
      await context.close();
    }
  }

  assert.deepEqual(failures, []);
});

test("the PROPOSED gift stamp stays at a native pixel scale through every fixed-width stop", async () => {
  const failures = [];
  for (const dpr of [1, 2, 3]) {
    for (const [width, height] of [[360, 800], [375, 667], [390, 844], [412, 915], [430, 932]]) {
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: dpr,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await page.goto(`${SITE}/?lang=en&next=1`);
      await waitForRoute(page, "/");
      const readTop = await page.evaluate(() => Math.round(
        document.querySelector(".blocks").getBoundingClientRect().top
        + scrollY
        - document.querySelector(".bar").offsetHeight
      ));
      await page.evaluate((target) => window.scrollTo(0, target), readTop);
      await page.locator("#presente").click();
      await page.waitForTimeout(35);
      const raster = await page.locator("#stampCanvas").evaluate((canvas) => {
        const rect = canvas.getBoundingClientRect();
        return {
          direct: canvas.closest(".stampband")?.parentElement?.id === "bay",
          ratioX: canvas.width / rect.width,
          ratioY: canvas.height / rect.height,
          dpr: devicePixelRatio,
          rendering: getComputedStyle(canvas).imageRendering,
          transform: getComputedStyle(canvas).transform,
        };
      });
      if (
        !raster.direct
        || Math.abs(raster.ratioX - dpr) > 0.02
        || Math.abs(raster.ratioY - dpr) > 0.02
        || raster.rendering !== "pixelated"
        || raster.transform !== "none"
      ) failures.push({ stop: `${width}x${height}`, dpr, raster });
      await context.close();
    }
  }
  assert.deepEqual(failures, []);
});

test("PROPOSED boot, speech, and room controls remain responsive under 4x CPU throttle", async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const session = await context.newCDPSession(page);
  await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.goto(`${SITE}/?next=1`);
  await page.waitForFunction(() => !document.body.classList.contains("is-booting"), { timeout: 20000 });
  await page.waitForFunction(() => document.getElementById("mascotHint")?.getAttribute("aria-label"), { timeout: 20000 });
  const invitation = await page.locator("#mascotHint").getAttribute("aria-label");
  await page.waitForFunction(
    (first) => document.getElementById("mascotHint")?.getAttribute("aria-label") !== first,
    invitation,
    { timeout: 20000 },
  );
  const rotated = await page.locator("#mascotHint").evaluate((hint) => ({
    label: hint.getAttribute("aria-label"),
    fits: hint.scrollWidth <= document.getElementById("arrivalSignal").clientWidth + 1,
    takeover: document.getElementById("arrivalSignal").getAttribute("data-signal-takeover"),
  }));
  assert.notEqual(rotated.label, invitation);
  assert.deepEqual({ fits: rotated.fits, takeover: rotated.takeover }, { fits: true, takeover: null });

  const readTop = await page.evaluate(() => Math.round(
    document.querySelector(".blocks").getBoundingClientRect().top
      + scrollY
      - document.querySelector(".bar").offsetHeight,
  ));
  await page.evaluate((top) => scrollTo(0, top), readTop);
  await page.locator("#pessoas").click();
  assert.equal(await page.locator("#pessoas").getAttribute("aria-selected"), "true");

  await page.goto(`${SITE}/estudio/?next=1`);
  await waitForRoute(page, "/estudio/");
  await page.locator("#btnReset").click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), true);

  await page.goto(`${SITE}/galeria/?next=1`);
  await waitForRoute(page, "/galeria/");
  await page.locator("#ctlHold").click();
  assert.equal(await page.locator("#ctlHold").getAttribute("aria-pressed"), "true");
  assert.deepEqual(errors, []);

  await session.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await context.close();
});

test("all routes avoid horizontal overflow at all eight picker stops in both modes", async () => {
  const failures = [];

  for (const [width, height] of ROUND2_PICKER_STOPS) {
    for (const proposed of [false, true]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
      const page = await context.newPage();
      for (const route of ROUND2_ROUTES) {
        const query = proposed ? "?next=1" : "";
        await page.goto(`${SITE}${route}${query}`);
        await waitForRoute(page, route);
        const geometry = await page.evaluate(() => ({
          next: document.documentElement.classList.contains("is-next"),
          htmlOverflow: document.documentElement.scrollWidth - innerWidth,
          bodyOverflow: document.body.scrollWidth - innerWidth,
        }));
        if (
          geometry.next !== proposed
          || geometry.htmlOverflow > 0
          || geometry.bodyOverflow > 0
        ) failures.push({ stop: `${width}x${height}`, mode: proposed ? "PROPOSED" : "LIVE", route, ...geometry });
      }
      await context.close();
    }
  }

  assert.deepEqual(failures, []);
});

test("safe-area floor rules and viewport-fit are present on every affected page", async () => {
  const [home, studio, gallery, sala, canon, notFound, siteCss, studioCss, galleryCss] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../estudio/index.html", import.meta.url), "utf8"),
    readFile(new URL("../galeria/index.html", import.meta.url), "utf8"),
    readFile(new URL("../sala/index.html", import.meta.url), "utf8"),
    readFile(new URL("../canon/index.html", import.meta.url), "utf8"),
    readFile(new URL("../404.html", import.meta.url), "utf8"),
    readFile(new URL("../assets/site.css", import.meta.url), "utf8"),
    readFile(new URL("../estudio/estudio.css", import.meta.url), "utf8"),
    readFile(new URL("../galeria/galeria.css", import.meta.url), "utf8"),
  ]);
  [home, studio, gallery, sala, canon, notFound].forEach((source) => assert.match(source, /viewport-fit=cover/));
  assert.match(siteCss, /\.doors\s*\{[^}]*env\(safe-area-inset-bottom/s);
  assert.match(
    siteCss,
    /\.bar\s*\{[^}]*padding:\s*env\(safe-area-inset-top,[^)]+\)\s+env\(safe-area-inset-right,[^)]+\)\s+0\s+max\(12px,\s*env\(safe-area-inset-left,[^)]+\)\)/s,
  );
  assert.match(
    siteCss,
    /@media\s*\(max-width:\s*720px\)[\s\S]*?\.bar\s*\{[^}]*padding-inline:\s*env\(safe-area-inset-left,[^)]+\)\s+env\(safe-area-inset-right,[^)]+\)/,
  );
  assert.match(studioCss, /\.canon-door\s*\{[^}]*env\(safe-area-inset-bottom/s);
  assert.match(galleryCss, /\.strip--bottom\s*\{[^}]*env\(safe-area-inset-bottom/s);
  assert.match(sala, /\.room-nav\s*\{[^}]*env\(safe-area-inset-bottom/s);
});

test("every public and kit viewport keeps pinch zoom enabled", async () => {
  const pages = [
    "../index.html",
    "../estudio/index.html",
    "../galeria/index.html",
    "../sala/index.html",
    "../canon/index.html",
    "../404.html",
    "../studio/index.html",
    "../kit/index.html",
  ];
  const failures = [];

  for (const relative of pages) {
    const source = await readFile(new URL(relative, import.meta.url), "utf8");
    const viewport = source.match(/<meta\s+name=["']viewport["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1]
      ?? source.match(/<meta\s+content=["']([^"']+)["'][^>]*name=["']viewport["'][^>]*>/i)?.[1]
      ?? "";
    if (
      /user-scalable\s*=\s*(?:no|0)/i.test(viewport)
      || /maximum-scale\s*=/i.test(viewport)
    ) failures.push({ relative, viewport });
  }

  assert.deepEqual(failures, []);
});
