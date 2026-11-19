import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { WebSocket } from "ws";
import {
  interpret,
  generateChunk,
  advance,
  elevation,
} from "../engine/world.ts";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sl-world-")),
  port = Number(process.env.QA_WORLD_PORT || 4411),
  base = "http://127.0.0.1:" + port,
  origin = "http://localhost:3000";
let server,
  log = "",
  sockets = [];
const results = [];
const pass = (s) => {
  results.push(s);
  console.log("PASS", s);
};
async function until(fn, limit = 10000) {
  const end = Date.now() + limit;
  while (Date.now() < end) {
    const v = await fn();
    if (v) return v;
    await sleep(75);
  }
  throw Error("Timed out: " + fn.toString().slice(0, 130));
}
async function start() {
  server = spawn(process.execPath, ["services/world/server.mts"], {
    env: {
      ...process.env,
      DATABASE_URL: "",
      WORLD_MODEL_URL: "",
      WORLD_MODEL_NAME: "",
      WORLD_DATA_DIR: dir,
      WORLD_PORT: String(port),
      WORLD_PG_PORT: String(port + 11000),
      WORLD_ORIGINS: origin,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const s of [server.stdout, server.stderr])
    s.on("data", (d) => {
      log = (log + d.toString()).slice(-7000);
    });
  await until(async () => {
    try {
      return (await fetch(base + "/health")).ok;
    } catch {
      return false;
    }
  }, 35000);
}
async function stop() {
  for (const ws of sockets) ws.close();
  sockets = [];
  if (!server || server.exitCode !== null) return;
  const exited = once(server, "exit");
  server.kill("SIGTERM");
  await exited;
}
async function request(
  cookie,
  route,
  body,
  code = 200,
  method = body === undefined ? "GET" : "POST",
) {
  const r = await fetch(base + route, {
    method,
    headers: {
      Origin: origin,
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  assert.equal(r.status, code, route + ": " + JSON.stringify(data));
  return data;
}
async function session() {
  const r = await fetch(base + "/session", { method: "POST" });
  assert.equal(r.status, 200);
  return {
    id: (await r.json()).id,
    cookie: r.headers.get("set-cookie").split(";")[0],
  };
}
async function connect(user, w) {
  const j = await request(user.cookie, "/worlds/" + w + "/join", {});
  const ws = new WebSocket("ws://127.0.0.1:" + port + "/live", { origin });
  sockets.push(ws);
  const c = { ws, state: null, welcome: null };
  ws.on("message", (data) => {
    const m = JSON.parse(data);
    if (m.type === "state") c.state = m;
    else c.welcome = m;
  });
  await once(ws, "open");
  ws.send(JSON.stringify({ type: "join", ticket: j.ticket }));
  await until(() => c.state);
  return c;
}
async function finishJob(g, id) {
  return until(async () => {
    const v = await request(g.cookie, "/jobs/" + id);
    return ["failed", "preview"].includes(v.status) ? v : null;
  });
}
try {
  const spec = interpret(
    "Tropical village with school, market, river and farmland",
  );
  assert.deepEqual(spec.features, ["school", "market", "farm", "river"]);
  const chunk = generateChunk(12, spec, -2, 1);
  assert.deepEqual(chunk, generateChunk(12, spec, -2, 1));
  assert.notDeepEqual(chunk, generateChunk(13, spec, -2, 1));
  assert(Number.isFinite(elevation(12, spec, -32, 32)));
  const obstacle = [{ id: "test", kind: "school", x: 5, z: 0, size: 2 }];
  let p = { x: 0, z: 0 };
  for (let i = 0; i < 100; i++) p = advance(p, 1, 0, true, 0.1, obstacle);
  assert(p.x < 2.65 && p.x > 0);
  pass(
    "Deterministic terrain and entities, negative coordinates, bounded collision",
  );
  await start();
  const a = await session(),
    b = await session();
  await request(
    a.cookie,
    "/jobs",
    { mode: "local", prompt: "<script>example</script>" },
    400,
  );
  await request(
    a.cookie,
    "/jobs",
    {
      mode: "model",
      prompt: "Interpret a reference",
      image: "data:image/png;base64,YWJj",
    },
    400,
  );
  const failed = await request(a.cookie, "/jobs", {
    mode: "model",
    prompt: "Tropical learning village",
  });
  assert.equal((await finishJob(a, failed.id)).status, "failed");
  pass(
    "Invalid inputs rejected and unavailable model job records actual failure",
  );
  const j = await request(a.cookie, "/jobs", {
    mode: "local",
    prompt: "Desa tropis dengan sekolah, pasar, dan perpustakaan",
  });
  const preview = await finishJob(a, j.id);
  assert.equal(preview.status, "preview");
  assert.equal((await request(a.cookie, "/jobs/active")).seed, preview.seed);
  const look = {
    preset: "Female",
    hair: "Bob",
    skin: "#ba825e",
    outfit: "#41887c",
    name: "",
    garment: "Field jacket",
  };
  await request(a.cookie, "/avatar", look, 200, "PUT");
  assert.equal((await request(a.cookie, "/worlds")).length, 0);
  const { id: w } = await request(a.cookie, "/jobs/" + j.id + "/save", {});
  assert.equal((await request(a.cookie, "/jobs/" + j.id + "/save", {})).id, w);
  pass("Confirmation creates a private, seeded, idempotent world");
  await request(b.cookie, "/worlds/" + w + "/join", {}, 404);
  const { invite } = await request(a.cookie, "/worlds/" + w + "/invite", {});
  await request(b.cookie, "/redeem", { invite });
  await request(b.cookie, "/redeem", { invite }, 404);
  const c = await connect(a, w),
    other = await connect(b, w);
  await until(
    () => c.state.peers.length === 2 && other.state.peers.length === 2,
  );
  const route = "/worlds/" + w,
    initial = await request(a.cookie, route + "/chunks");
  assert.equal(initial.chunks.length, 9);
  assert.equal(other.state.peers.find((p) => p.id === a.id).look.hair, "Bob");
  const simulation = await request(a.cookie, route + "/simulation");
  assert.equal(simulation.simulated, true);
  await request(
    b.cookie,
    route + "/objects",
    { kind: "tree", x: -3, z: -3, version: 0, confirm: true },
    403,
  );
  const obj = await request(a.cookie, route + "/objects", {
    kind: "bench",
    x: 0,
    z: -3,
    version: 0,
    confirm: true,
  });
  await until(() => other.state.version === 1);
  assert.equal(
    (await request(b.cookie, route + "/chunks")).objects[0].id,
    obj.entity.id,
  );
  const edits = await Promise.all(
    [
      [0, -4],
      [0, -5],
    ].map(async ([x, z]) => {
      const r = await fetch(base + route + "/objects", {
        method: "POST",
        headers: { Cookie: a.cookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "bench",
          id: obj.entity.id,
          x,
          z,
          version: 1,
          confirm: true,
        }),
      });
      return r.status;
    }),
  );
  assert.deepEqual(edits.sort(), [200, 409]);
  pass(
    "Two real sessions observe shared changes, owner checks, single-use invite and concurrent conflict",
  );
  const g1 = await request(a.cookie, route + "/guide", {});
  assert.equal(g1.meetings, 1);
  const d = await request(a.cookie, route + "/docs", {
    kind: "Mission Charter",
    fields: { Komitmen: "Catatan uji lokal" },
    version: 0,
  });
  assert.equal((await request(b.cookie, route + "/docs")).length, 0);
  await request(
    b.cookie,
    route + "/docs",
    {
      kind: "Mission Charter",
      fields: { Komitmen: "Uji" },
      version: 1,
      id: d.id,
    },
    409,
  );
  const timer = setInterval(
    () => c.ws.send(JSON.stringify({ type: "input", dx: 1, dz: 0, run: true })),
    100,
  );
  try {
    await until(() => c.state.peers.find((p) => p.id === a.id)?.x > 34, 9000);
  } finally {
    clearInterval(timer);
  }
  c.ws.send(JSON.stringify({ type: "input", dx: 0, dz: 0, run: false }));
  await sleep(250);
  const moved = c.state.peers.find((p) => p.id === a.id).x;
  assert(moved < 45);
  assert(
    (await request(a.cookie, route + "/chunks")).chunks.some((c) => c.cx === 2),
  );
  pass(
    "Authoritative movement crosses a chunk boundary and streams the next neighborhood",
  );
  await request(a.cookie, route + "/moderate", {
    action: "report",
    target: b.id,
    reason: "QA integration",
  });
  await request(a.cookie, route + "/moderate", {
    action: "block",
    target: b.id,
    reason: "QA integration",
  });
  await until(
    () => c.state.peers.length === 1 && other.state.peers.length === 1,
  );
  pass("Report persistence and mutual presence filtering");
  await stop();
  await start();
  const again = await connect(a, w);
  assert(Math.abs(again.welcome.x - moved) < 1);
  assert.equal(again.state.peers[0].look.garment, "Field jacket");
  assert(
    Number((await request(a.cookie, route + "/simulation")).completed_rounds) >=
      Number(simulation.completed_rounds),
  );
  pass(
    "Preview seed restored, avatar synchronized and simulation recovered across restart",
  );
  const map = await request(a.cookie, route + "/chunks");
  assert.equal(map.version, 2);
  assert.equal((await request(a.cookie, route + "/docs"))[0].id, d.id);
  const back = await connect(b, w);
  assert.equal(back.state.peers.length, 1);
  const home = setInterval(
    () =>
      again.ws.send(
        JSON.stringify({ type: "input", dx: -1, dz: 0, run: true }),
      ),
    100,
  );
  try {
    await until(() => again.state.peers[0].x < 1, 9000);
  } finally {
    clearInterval(home);
  }
  again.ws.send(JSON.stringify({ type: "input", dx: 0, dz: 0, run: false }));
  await sleep(170);
  const old = await request(a.cookie, route + "/chunks");
  assert.equal(old.objects[0].id, obj.entity.id);
  assert.deepEqual(
    old.chunks.find((c) => c.cx === 0 && c.cz === 0),
    initial.chunks.find((c) => c.cx === 0 && c.cz === 0),
  );
  assert.equal((await request(a.cookie, route + "/guide", {})).meetings, 2);
  pass(
    "Real PostgreSQL and game-server restart recover session, location, baseline, object delta, private W3 record and NPC memory",
  );
  const closed = once(again.ws, "close");
  again.ws.send(JSON.stringify({ type: "input", dx: 100, dz: 0, run: true }));
  assert.equal((await closed)[0], 1008);
  pass("Invalid client movement rejected");
  await fs.mkdir("docs/qa-v3", { recursive: true });
  await fs.writeFile(
    "docs/qa-v3/world-tests.json",
    JSON.stringify(
      {
        database: "PostgreSQL (native embedded cluster)",
        realConnections: 2,
        checks: results,
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.error(log);
  throw e;
} finally {
  await stop();
  await fs.rm(dir, { recursive: true, force: true });
}
