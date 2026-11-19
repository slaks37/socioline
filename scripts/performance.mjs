import { chromium } from "playwright-core";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const source = await fs.readFile(
  "node_modules/web-vitals/dist/web-vitals.iife.js",
  "utf8",
);
const results = [];
try {
  for (const path of [
    "/",
    "/the-word/encounter",
    "/resources/listening-guide",
  ]) {
    for (let run = 1; run <= 3; run++) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
      });
      const p = await context.newPage();
      const sample = { path, run };
      await p.exposeFunction("recordMetric", (name, value) => {
        sample[name] = value;
      });
      await p.addInitScript({
        content:
          source +
          '\nfor(const name of ["LCP","CLS","INP"])webVitals["on"+name](m=>window.recordMetric(name,m.value),{reportAllChanges:true});',
      });
      await p.goto((process.env.QA_URL || "http://localhost:3000") + path);
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(500);
      await p.locator("h1").click();
      await p.waitForTimeout(450);
      await p.keyboard.press("Tab");
      await p.waitForTimeout(180);
      await p.goto("about:blank");
      await p.waitForTimeout(150);
      results.push(sample);
      await context.close();
    }
  }
} finally {
  await browser.close();
  await fs.mkdir("docs/qa-v3", { recursive: true });
  await fs.writeFile(
    "docs/qa-v3/performance.json",
    JSON.stringify(results, null, 2),
  );
  console.table(results);
}
