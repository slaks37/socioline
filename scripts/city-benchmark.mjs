import { chromium } from "playwright-core";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const samples = [];
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({
      viewport: mobile
        ? { width: 390, height: 780 }
        : { width: 1120, height: 700 },
      isMobile: mobile,
      hasTouch: mobile,
    });
    await page.addInitScript(() => {
      const stats = new WeakMap();
      for (const name of [
        "drawElements",
        "drawArrays",
        "drawElementsInstanced",
        "drawArraysInstanced",
      ]) {
        const proto = WebGL2RenderingContext.prototype,
          original = proto[name];
        proto[name] = function (...args) {
          const s = stats.get(this) || { calls: 0, triangles: 0 };
          s.calls++;
          if (args[0] === this.TRIANGLES)
            s.triangles +=
              ((name.includes("Elements") ? args[1] : args[2]) / 3) *
              (name.endsWith("Instanced") ? args.at(-1) : 1);
          stats.set(this, s);
          return original.apply(this, args);
        };
      }
      window.renderCounters = (canvas) => ({
        ...stats.get(canvas.getContext("webgl2")),
      });
    });
    await page.goto(
      (process.env.QA_URL || "http://localhost:3000") + "/explore",
    );
    await page.getByRole("button", { name: "Masuk ke Central Plaza" }).click();
    await page.locator(".game canvas").waitFor();
    await page.waitForFunction(() =>
      performance
        .getEntriesByType("resource")
        .some((r) => r.name.includes("grand-library")),
    );
    await page.waitForFunction(
      () =>
        window.renderCounters(document.querySelector(".game canvas")).calls >
        500,
      null,
      { timeout: 60000 },
    );
    const result = await page.evaluate(async () => {
      const canvas = document.querySelector(".game canvas");
      const frame = () =>
        new Promise((resolve) => requestAnimationFrame(resolve));
      for (let i = 0; i < 12; i++) await frame();
      const before = window.renderCounters(canvas),
        start = await frame();
      let end = start,
        frames = 0;
      const initial = window.renderCounters(canvas);
      while (frames < 15 || end - start < 5000) {
        end = await frame();
        frames++;
      }
      const last = window.renderCounters(canvas);
      return {
        fps: +((1000 * frames) / (end - start)).toFixed(2),
        callsPerFrame: Math.round((last.calls - initial.calls) / frames),
        trianglesPerFrame: Math.round(
          (last.triangles - initial.triangles) / frames,
        ),
        frames,
        width: canvas.width,
        height: canvas.height,
        warmupDraws: before.calls,
      };
    });
    samples.push({ device: mobile ? "touch emulation" : "desktop", ...result });
    console.log(samples.at(-1));
    await page.close();
  }
  if (process.env.BENCH_OUTPUT)
    await fs.writeFile(
      process.env.BENCH_OUTPUT,
      JSON.stringify(samples, null, 2) + "\n",
    );
} finally {
  await browser.close();
}
