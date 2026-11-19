import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { specification } from "../engine/world.ts";

const base = process.env.QA_MODEL_GAME_URL || "http://127.0.0.1:4100";
const login = await fetch(base + "/session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{}",
});
assert.equal(login.status, 200);
const cookie = login.headers.get("set-cookie").split(";")[0];
async function request(path, body) {
  const response = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      Cookie: cookie,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  assert.equal(response.status, 200, path);
  return result;
}
const outcomes = [];
for (const sample of [
  {
    prompt:
      "Create a tropical village surrounded by mountains, containing a school, a market, a river, farmland, and a community center.",
  },
  {
    prompt: "Rancang lingkungan untuk belajar bersama",
    file: "public/district-0.webp",
  },
]) {
  const image = sample.file
    ? "data:image/webp;base64," +
      (await fs.readFile(sample.file)).toString("base64")
    : undefined;
  const start = performance.now();
  const j = await request("/jobs", {
    mode: "model",
    prompt: sample.prompt,
    image,
  });
  let job;
  while (performance.now() - start < 35000) {
    job = await request("/jobs/" + j.id);
    if (["failed", "preview"].includes(job.status)) break;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  assert.equal(job?.status, "preview", job?.error);
  const spec = specification.parse(job.spec);
  if (!image) {
    assert.equal(spec.terrain, "mountain");
    assert.equal(spec.biome, "tropical");
    assert.equal(spec.type, "village");
    for (const feature of ["school", "market", "river", "farm", "community"])
      assert(spec.features.includes(feature));
  }
  const world = await request("/jobs/" + j.id + "/save", {});
  const joined = await request("/worlds/" + world.id + "/join", {});
  assert.equal(job.seed, joined.seed);
  assert.deepEqual(spec, joined.spec);
  outcomes.push({
    input: sample.file || sample.prompt,
    provider: job.provider,
    spec,
    jobMilliseconds: Math.round(performance.now() - start),
  });
}
await fs.writeFile("docs/qa-v3/model.json", JSON.stringify(outcomes, null, 2));
console.log(
  "PASS real model, text and image workers, preview validation and persisted seed/spec",
  outcomes,
);
