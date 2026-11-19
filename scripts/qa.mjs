import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  base = process.env.QA_URL || "http://localhost:3000",
  origin = process.env.SITE_URL || "http://localhost:3000";
const map = await (await fetch(base + "/sitemap.xml")).text(),
  paths = Array.from(
    map.matchAll(/<loc>(.*?)<\/loc>/g),
    (m) => new URL(m[1]).pathname,
  );
const links = new Set(),
  titles = new Set(),
  schemas = {};
for (const path of paths) {
  const r = await fetch(base + path);
  assert.equal(r.status, 200, path);
  const html = await r.text();
  assert(
    html.includes("<h1") &&
      html.includes('property="og:title"') &&
      html.includes('name="description"'),
    path,
  );
  assert.equal(
    new URL(html.match(/<link rel="canonical" href="([^"]+)"/)[1]).href,
    new URL(path, origin).href,
  );
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert(title && !titles.has(title), path);
  titles.add(title);
  for (const m of html.matchAll(/<a\s[^>]*?href="(\/[^"#]*)"/g))
    links.add(m[1].replaceAll("&amp;", "&"));
  for (const m of html.matchAll(
    /<script type="application\/ld\+json">(.*?)<\/script>/gs,
  )) {
    const t = JSON.parse(m[1])["@type"];
    schemas[t] = (schemas[t] || 0) + 1;
  }
}
for (const p of links) assert.equal((await fetch(base + p)).status, 200, p);
assert((await (await fetch(base + "/rss.xml")).text()).includes("<item>"));
assert((await (await fetch(base + "/robots.txt")).text()).includes("Sitemap:"));
assert.equal((await fetch(base + "/news/unpublished")).status, 404);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-webgl"],
});
const axe = {};
try {
  const p = await browser.newPage();
  for (const path of [
    "/",
    "/explore",
    "/the-word/encounter",
    "/blog/calling-in-practice",
  ]) {
    await p.goto(base + path);
    await p.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    axe[path] = await p.evaluate(async () =>
      (
        await window.axe.run(document, {
          runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        })
      ).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    );
    if (path === "/explore")
      assert((await p.locator("#directory").getAttribute("open")) !== null);
  }
  const n = await browser.newPage({ javaScriptEnabled: false });
  await n.goto(base + "/explore");
  await n.locator("summary").click();
  await n
    .getByRole("link", { name: "Encounter — Misi Allah", exact: true })
    .click();
  assert.equal(new URL(n.url()).pathname, "/the-word/encounter");
  await n.getByRole("heading", { name: "Hasil yang dibawa" }).waitFor();
} finally {
  await browser.close();
}
const report = {
  pages: paths.length,
  internalTargets: links.size,
  schemas,
  axe,
};
await fs.mkdir("docs/qa-v3", { recursive: true });
await fs.writeFile("docs/qa-v3/seo.json", JSON.stringify(report, null, 2));
console.log(report);
assert(Object.values(axe).every((v) => v.length === 0));
