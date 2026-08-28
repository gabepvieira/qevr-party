import assert from "node:assert/strict";
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
const PINNED_SECTIONS = ["manifesto", "pessoas", "stances"];

let browser;

before(async () => {
  browser = await chromium.launch({ channel: "chrome", headless: true });
});

after(async () => {
  await browser.close();
});

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
      failures.push({ stop: `${width}x${height}`, ...layering });
    }

    await context.close();
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
