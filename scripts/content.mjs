import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const categories = {
  blog: "/blog",
  news: "/news",
  events: "/events",
  projects: "/impact/projects",
};
const validText = (v) => typeof v === "string" && v.trim().length > 0;
function validSections(sections) {
  return (
    Array.isArray(sections) &&
    sections.every(
      (row) => Array.isArray(row) && row.length === 2 && row.every(validText),
    )
  );
}
export function compile(atlas, editorial, now = Date.now()) {
  const { districts, landmarks, pages } = structuredClone(atlas);
  const boards = structuredClone(editorial.billboards);
  const published = [];
  for (const [group, base] of Object.entries(categories)) {
    const approved = (editorial[group] ?? [])
      .filter(
        (r) =>
          (r.status
            ? ["published", "scheduled"].includes(r.status)
            : r.approved === true) && Date.parse(r.publishedAt) <= now,
      )
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    for (const r of approved) {
      assert(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug) &&
          validText(r.title) &&
          validText(r.summary) &&
          validSections(r.body) &&
          r.body.length &&
          Number.isFinite(Date.parse(r.publishedAt)),
        "Invalid approved " + group + " record",
      );
      const path = base + "/" + r.slug;
      pages.push({
        path,
        title: r.title,
        intro: r.summary,
        category: r.category ?? group,
        byline: r.author,
        cover: r.cover,
        seo: r.seo,
        updated: r.updatedAt,
        date: r.publishedAt,
        sections: r.body,
        links: [...new Set([base, ...(r.related ?? [])])],
      });
      const index = pages.find((p) => p.path === base);
      index.intro =
        "Tulisan dan informasi yang telah ditinjau oleh redaksi SocioLine.";
      if (r.featured) index.links.unshift(path);
      else index.links.push(path);
      if (r.billboard) {
        assert(
          Number.isFinite(r.billboard.x) && Number.isFinite(r.billboard.z),
        );
        boards.push({
          name: r.billboard.label || r.title,
          path,
          x: r.billboard.x,
          z: r.billboard.z,
        });
      }
      published.push({
        url: path,
        date: r.publishedAt,
        title: r.title,
        summary: r.summary,
      });
    }
  }
  for (const [prefix, x] of [
    ["/news/", -30],
    ["/impact/projects/", 30],
  ]) {
    const latest = published.find((r) => r.url.startsWith(prefix));
    if (latest) boards.push({ name: latest.title, path: latest.url, x, z: 10 });
  }
  const urls = new Set([
    "/",
    "/explore",
    "/worlds",
    ...pages.map((p) => p.path),
  ]);
  assert.equal(urls.size, pages.length + 3, "Duplicate public URL");
  for (const p of pages) {
    assert(
      validText(p.title) && validText(p.intro) && validSections(p.sections),
      "Invalid page " + p.path,
    );
    for (const link of p.links) assert(urls.has(link), "Unknown page " + link);
  }
  assert.equal(
    new Set(landmarks.map((l) => l.id)).size,
    landmarks.length,
    "Duplicate landmark ID",
  );
  for (const l of landmarks) {
    assert(
      urls.has(l.url) && Number.isFinite(l.x) && Number.isFinite(l.z),
      "Invalid landmark " + l.id,
    );
  }
  for (const b of boards) {
    assert(
      urls.has(b.path) && validText(b.name),
      "Invalid billboard " + b.name,
    );
  }
  return { districts, landmarks, pages, boards, published };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const load = (name) =>
    JSON.parse(
      readFileSync(
        new URL("../content/" + name + ".json", import.meta.url),
        "utf8",
      ),
    );
  const result = compile(load("atlas"), load("editorial"));
  writeFileSync(
    new URL("../content/public.json", import.meta.url),
    JSON.stringify(result) + "\n",
  );
  console.log(
    result.pages.length +
      " content pages and " +
      result.landmarks.length +
      " landmarks validated",
  );
}
