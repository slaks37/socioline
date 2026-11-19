import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compile } from "./content.mjs";
const load = (name) =>
  JSON.parse(
    readFileSync(new URL("../content/" + name + ".json", import.meta.url)),
  );
test("Only approved records reach static pages, feeds, and city billboards", () => {
  const editorial = load("editorial");
  const fixture = {
    slug: "qa-fixture",
    title: "Internal QA fixture",
    summary: "Integration test only.",
    body: [["Fixture", "Test copy."]],
    publishedAt: "2026-01-01",
    approved: true,
  };
  editorial.news = [
    fixture,
    { ...fixture, approved: false, slug: "private-draft" },
  ];
  editorial.projects = [fixture];
  const result = compile(load("atlas"), editorial);
  for (const path of ["/news/qa-fixture", "/impact/projects/qa-fixture"]) {
    assert(result.pages.some((p) => p.path === path));
    assert(result.boards.some((b) => b.path === path));
    assert(result.published.some((p) => p.url === path));
  }
  assert(!JSON.stringify(result).includes("private-draft"));
});
test("Broken destination and duplicate route fail the content build", () => {
  const atlas = load("atlas");
  atlas.landmarks[0].url = "/missing";
  assert.throws(() => compile(atlas, load("editorial")), /Invalid landmark/);
  atlas.pages.push(atlas.pages[0]);
  assert.throws(() => compile(atlas, load("editorial")), /Duplicate/);
});
test("Review and future schedules stay private until their publication build", () => {
  const e = load("editorial");
  const r = {
    slug: "local-test",
    title: "Editorial fixture",
    summary: "Local fixture",
    body: [["Practice", "Test"]],
    author: "Test",
    category: "Test",
    status: "scheduled",
    publishedAt: "2030-04-02T00:00:00Z",
    billboard: { x: 2, z: 5 },
  };
  e.blog = [r, { ...r, status: "review", slug: "review-test" }];
  const before = compile(load("atlas"), e, Date.parse("2030-04-01"));
  assert(!JSON.stringify(before).includes("local-test"));
  const after = compile(load("atlas"), e, Date.parse("2030-04-03"));
  assert(after.boards.some((b) => b.path === "/blog/local-test"));
  assert(!JSON.stringify(after).includes("review-test"));
});
