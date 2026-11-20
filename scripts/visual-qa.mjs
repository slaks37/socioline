import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.QA_URL || "http://localhost:3000",
  out = "docs/qa-v3";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const page = await browser.newPage({ viewport: { width: 1120, height: 700 } });
page.setDefaultTimeout(60000);
const errors = [];
page.on("pageerror", (e) => {
  errors.push(e.message);
  console.error(e.message);
});
const rates = {};
async function frameRate(p) {
  return p.evaluate(
    () =>
      new Promise((resolve) => {
        let count = 0,
          start = performance.now();
        const tick = (t) => {
          count++;
          if (t - start > 5000 && count >= 8) {
            resolve(Math.round((count * 10000) / (t - start)) / 10);
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
}
const button = (name) => page.getByRole("button", { name, exact: true });
const shot = async (name, canvas = false) => {
  await page.waitForTimeout(700);
  await (canvas ? page.locator(".game canvas") : page).screenshot({
    path: out + "/" + name + ".png",
    timeout: 90000,
    style: canvas
      ? ".hud,.mini,.controls,.interact,.stick,.jump,nextjs-portal{visibility:hidden!important}"
      : "nextjs-portal{visibility:hidden!important}",
  });
  console.log("captured", name);
};
async function travel(name) {
  await page.keyboard.press("m");
  await page.getByRole("dialog").waitFor();
  await button(name).click();
  await page.locator(".game canvas").focus();
  await page.waitForTimeout(650);
}
async function walk(key, until) {
  await page.keyboard.down(key);
  try {
    await until.waitFor({ timeout: 75000 });
  } finally {
    await page.keyboard.up(key);
  }
}
try {
  await page.goto(base + "/explore");
  await page.locator("canvas").waitFor();
  await button("Cokelat").click();
  await page.evaluate(() => document.fonts.ready);
  await shot("03-avatar");
  await button("Masuk ke Central Plaza").click();
  await page.locator(".game canvas").waitFor();
  await page.waitForFunction(() =>
    performance
      .getEntriesByType("resource")
      .some((e) => e.name.includes("/models/grand-library")),
  );
  await page.waitForTimeout(1500);
  rates.desktop = await frameRate(page);
  await shot("02-street");
  await button("Panorama").click();
  await shot("01-aerial", true);
  await button("Kembali bermain").click();
  await travel("The Word");
  await button("Panorama").click();
  await shot("04-word", true);
  await button("Kembali bermain").click();
  await page.locator(".game canvas").focus();
  await walk("w", button("Masuk Grand Library"));
  await page.keyboard.press("e");
  await page.locator(".hud b").filter({ hasText: "Grand Library" }).waitFor();
  await button("Panorama").click();
  await shot("05-interior", true);
  await button("Kembali bermain").click();
  await page.locator(".game canvas").focus();
  await walk("w", button("Interaksi · Encounter — Misi Allah"));
  await page.keyboard.press("e");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  assert.equal(
    await dialog.getByRole("link").first().getAttribute("href"),
    "/the-word/encounter",
  );
  await shot("08-learning");
  await page.keyboard.press("Escape");
  await page.locator(".game canvas").focus();
  await walk("s", button("Keluar perpustakaan"));
  await page.keyboard.press("e");
  await page.locator(".hud b").filter({ hasText: "The Word" }).waitFor();
  await travel("The World");
  await button("Panorama").click();
  await shot("06-world", true);
  await travel("The Work");
  await button("Panorama").click();
  await shot("07-work", true);
  await page.goto(base + "/blog/calling-in-practice");
  await shot("10-article");
  await page.close();
  const m = await browser.newPage({
    viewport: { width: 390, height: 780 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  await m.goto(base + "/explore?landmark=word-library");
  await m.getByRole("button", { name: "Masuk ke Central Plaza" }).tap();
  await m.locator(".game canvas").waitFor();
  await m.waitForTimeout(2200);
  rates.mobile = await frameRate(m);
  await m.screenshot({ path: out + "/09-mobile.png" });
  await fs.writeFile(
    out + "/gameplay.json",
    JSON.stringify(
      {
        renderer: "Chromium headless / ANGLE SwiftShader",
        framesPerSecond: rates,
        desktop: "1120x700 balanced",
        mobile: "390x780 low, touch emulation",
      },
      null,
      2,
    ),
  );
  await m.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS portal, station, article, exit, map, travel and ten runtime views",
  );
} finally {
  await browser.close();
}
