import { validAvatar } from "../../engine/avatar.ts";
import Fastify, { type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import cookies from "@fastify/cookie";
import limits from "@fastify/rate-limit";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { Worker } from "node:worker_threads";
import { z } from "zod";
import { database, digest, secret, region } from "./database.mts";
import { multiplayer } from "./rooms.mts";
import {
  generateChunk,
  specification,
  documentFields,
  blocked,
  BOUND,
  VERSION,
  type Entity,
} from "../../engine/world.ts";
const store = await database(),
  { db, tx } = store;
const app = Fastify({ bodyLimit: 900000, logger: false });
const origins = new Set(
  (
    process.env.WORLD_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000"
  ).split(","),
);
await app.register(cors, { origin: [...origins], credentials: true });
await app.register(cookies);
await app.register(limits, { max: 420, timeWindow: "1 minute" });
const fail = (statusCode: number, message: string): never => {
  throw Object.assign(new Error(message), { statusCode });
};
app.addHook("onRequest", async (r) => {
  if (r.headers.origin && !origins.has(r.headers.origin))
    fail(403, "Origin tidak diizinkan.");
});
app.setErrorHandler((error, _, res) => {
  const e = error as Error & { statusCode?: number };
  const code = e instanceof z.ZodError ? 400 : (e.statusCode ?? 500);
  res.status(code).send({
    error:
      code === 500
        ? "Operasi gagal."
        : e instanceof z.ZodError
          ? "Input tidak sesuai skema."
          : e.message,
  });
});
const uuid = z.string().uuid();
async function guest(r: FastifyRequest) {
  const raw = r.cookies.sl_world;
  const q =
    raw &&
    (await db.query(
      "SELECT id FROM guests WHERE session_hash=$1 AND expires_at>now()",
      [digest(raw)],
    ));
  if (!q || !q.rowCount) return fail(401, "Mulai sesi tamu terlebih dahulu.");
  return q.rows[0].id as string;
}
async function scope(r: FastifyRequest, owner = false) {
  const g = await guest(r),
    w = uuid.parse((r.params as { w: string }).w);
  const q = await db.query(
    "SELECT w.*,n.name,m.role FROM worlds w JOIN nodes n ON n.id=w.id JOIN membership m ON m.world_id=w.id WHERE w.id=$1 AND m.guest_id=$2",
    [w, g],
  );
  if (!q.rowCount) fail(404, "Dunia tidak tersedia.");
  if (owner && q.rows[0].role !== "owner")
    fail(403, "Hanya pemilik dapat mengubah ruang ini.");
  return { g, w, world: q.rows[0] };
}
const rooms = multiplayer(app.server, store, origins);
app.get("/health", async () => ({
  ready: true,
  generator: VERSION,
  modelConfigured: Boolean(
    process.env.WORLD_MODEL_URL && process.env.WORLD_MODEL_NAME,
  ),
}));
app.post(
  "/session",
  { config: { rateLimit: { max: 24, timeWindow: "1 minute" } } },
  async (r, res) => {
    try {
      return { id: await guest(r) };
    } catch (e) {
      if ((e as { statusCode?: number }).statusCode !== 401) throw e;
    }
    const token = secret(),
      id = randomUUID();
    await db.query("INSERT INTO guests(id,session_hash) VALUES($1,$2)", [
      id,
      digest(token),
    ]);
    res.setCookie("sl_world", token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      secure: process.env.WORLD_SECURE_COOKIE === "true",
      maxAge: 60 * 60 * 24 * 30,
    });
    return { id };
  },
);
app.put("/avatar", async (r) => {
  const g = await guest(r);
  if (!validAvatar(r.body)) return fail(400, "Pilihan avatar tidak valid.");
  const { preset, hair, skin, outfit, garment, hairColor } = r.body;
  await db.query(
    "INSERT INTO avatars(guest_id,look) VALUES($1,$2) ON CONFLICT(guest_id) DO UPDATE SET look=excluded.look,updated_at=now()",
    [g, { preset, hair, skin, outfit, garment, hairColor, name: "" }],
  );
  return { ok: true };
});
app.get("/worlds/:w/simulation", async (r) => {
  const { w } = await scope(r);
  const cycle = Math.floor(Date.now() / 120000);
  const activities = [
    "Membuka meja informasi",
    "Memandu observasi komunitas",
    "Merangkum catatan kunjungan",
  ];
  const activity = activities[cycle % 3];
  const q = await db.query(
    "INSERT INTO simulation(world_id,cycle,last_activity) VALUES($1,$2,$3) ON CONFLICT(world_id) DO UPDATE SET completed_rounds=simulation.completed_rounds+GREATEST(0,excluded.cycle-simulation.cycle),cycle=GREATEST(simulation.cycle,excluded.cycle),last_activity=excluded.last_activity RETURNING completed_rounds,last_activity",
    [w, cycle, activity],
  );
  return { simulated: true, role: "Pemandu komunitas", ...q.rows[0] };
});
app.get("/worlds", async (r) => {
  const id = await guest(r);
  return (
    await db.query(
      "SELECT w.id,n.name,w.revision,w.spec,m.role FROM membership m JOIN worlds w ON w.id=m.world_id JOIN nodes n ON n.id=w.id WHERE m.guest_id=$1 ORDER BY n.created_at DESC",
      [id],
    )
  ).rows;
});
app.post(
  "/jobs",
  { config: { rateLimit: { max: 12, timeWindow: "1 minute" } } },
  async (r) => {
    const g = await guest(r);
    const b = z
      .object({
        prompt: z
          .string()
          .trim()
          .min(4)
          .max(1200)
          .refine((s) => !/[\u0000-\u0008<>]/.test(s)),
        mode: z.enum(["local", "model"]),
        image: z.string().max(820000).optional(),
      })
      .strict()
      .parse(r.body);
    if (b.image) {
      if (b.mode !== "model") fail(400, "Gambar memerlukan penyedia model.");
      const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
        b.image,
      );
      if (!m) throw fail(400, "Gunakan PNG, JPEG atau WebP.");
      try {
        const image = await sharp(Buffer.from(m[2], "base64"), {
          limitInputPixels: 4000000,
        })
          .resize(768, 768, { fit: "inside", withoutEnlargement: true })
          .webp()
          .toBuffer();
        b.image = "data:image/webp;base64," + image.toString("base64");
      } catch {
        fail(400, "Gambar tidak valid.");
      }
    }
    const id = randomUUID();
    await tx(async (c) => {
      await c.query("SELECT id FROM guests WHERE id=$1 FOR UPDATE", [g]);
      const count = await c.query(
        "SELECT count(*) FROM jobs WHERE owner_id=$1 AND status IN ('queued','running','preview')",
        [g],
      );
      if (Number(count.rows[0].count) >= 10)
        fail(429, "Selesaikan pratinjau yang tertunda.");
      await c.query(
        "INSERT INTO jobs(id,owner_id,status,request) VALUES($1,$2,'queued',$3)",
        [id, g, b],
      );
    });
    return { id, status: "queued" };
  },
);
app.get("/jobs/active", async (r) => {
  const g = await guest(r);
  return (
    (
      await db.query(
        "SELECT id,status,spec,provider,error,seed FROM jobs WHERE owner_id=$1 AND status IN ('queued','running','preview') ORDER BY created_at DESC LIMIT 1",
        [g],
      )
    ).rows[0] ?? null
  );
});
app.get("/jobs/:id", async (r) => {
  const g = await guest(r),
    id = uuid.parse((r.params as { id: string }).id);
  const q = await db.query(
    "SELECT id,status,spec,provider,error,world_id,seed FROM jobs WHERE id=$1 AND owner_id=$2",
    [id, g],
  );
  return q.rows[0] ?? fail(404, "Job tidak tersedia.");
});
app.delete("/jobs/:id", async (r) => {
  const g = await guest(r),
    id = uuid.parse((r.params as { id: string }).id);
  await db.query(
    "DELETE FROM jobs WHERE id=$1 AND owner_id=$2 AND status IN ('failed','preview','queued')",
    [id, g],
  );
  return { ok: true };
});
app.post("/jobs/:id/save", async (r) => {
  const g = await guest(r),
    id = uuid.parse((r.params as { id: string }).id);
  return tx(async (c) => {
    const q = await c.query(
        "SELECT * FROM jobs WHERE id=$1 AND owner_id=$2 FOR UPDATE",
        [id, g],
      ),
      j = q.rows[0];
    if (!j) fail(404, "Job tidak tersedia.");
    if (j.status === "saved") return { id: j.world_id };
    if (j.status !== "preview") fail(409, "Pratinjau belum siap.");
    const spec = specification.parse(j.spec),
      w = randomUUID(),
      seed = j.seed;
    await c.query(
      "INSERT INTO nodes(id,parent_id,kind,name,metadata) VALUES($1,$2,'city',$3,$4)",
      [
        w,
        region,
        spec.name,
        { status: "active", coordinates: [0, 0], preset: spec.biome },
      ],
    );
    await c.query(
      "INSERT INTO nodes(id,parent_id,kind,name) VALUES($1,$2,'district','Distrik eksplorasi')",
      [randomUUID(), w],
    );
    await c.query(
      "INSERT INTO worlds(id,owner_id,seed,gen_version,spec) VALUES($1,$2,$3,$4,$5)",
      [w, g, seed, VERSION, spec],
    );
    await c.query("INSERT INTO membership VALUES($1,$2,'owner')", [w, g]);
    await c.query(
      "UPDATE jobs SET status='saved',world_id=$1,request='{}' WHERE id=$2",
      [w, id],
    );
    return { id: w };
  });
});
app.post("/worlds/:w/invite", async (r) => {
  const { w } = await scope(r, true),
    token = secret();
  await db.query(
    "INSERT INTO invites VALUES($1,$2,now()+interval '30 minutes')",
    [digest(token), w],
  );
  return { invite: token };
});
app.post("/redeem", async (r) => {
  const g = await guest(r),
    { invite } = z.object({ invite: z.string().min(32).max(80) }).parse(r.body);
  return tx(async (c) => {
    const q = await c.query(
      "DELETE FROM invites WHERE hash=$1 AND expires_at>now() RETURNING world_id",
      [digest(invite)],
    );
    if (!q.rowCount) fail(404, "Undangan tidak berlaku.");
    const w = q.rows[0].world_id;
    await c.query(
      "INSERT INTO membership VALUES($1,$2,'visitor') ON CONFLICT DO NOTHING",
      [w, g],
    );
    return { id: w };
  });
});
app.post("/worlds/:w/join", async (r) => {
  const { g, w, world } = await scope(r);
  return {
    ticket: rooms.ticket(g, w),
    seed: world.seed,
    spec: world.spec,
    id: g,
    role: world.role,
  };
});
app.get("/worlds/:w/chunks", async (r) => {
  const { g, w, world } = await scope(r);
  const pos = rooms.position(w, g);
  if (!pos) fail(409, "Hubungkan ulang pemain.");
  const cx = Math.floor(pos!.x / 32),
    cz = Math.floor(pos!.z / 32);
  const chunks = await tx(async (c) => {
    const existing = (
      await c.query(
        "SELECT baseline FROM chunks WHERE world_id=$1 AND cx BETWEEN $2 AND $3 AND cz BETWEEN $4 AND $5",
        [w, cx - 1, cx + 1, cz - 1, cz + 1],
      )
    ).rows.map((r) => r.baseline);
    for (let x = cx - 1; x <= cx + 1; x++)
      for (let z = cz - 1; z <= cz + 1; z++) {
        if (existing.some((b) => b.cx === x && b.cz === z)) continue;
        const b = generateChunk(world.seed, world.spec, x, z);
        await c.query(
          "INSERT INTO chunks(world_id,cx,cz,baseline,generation_version,district_id) VALUES($1,$2,$3,$4,$5,(SELECT id FROM nodes WHERE parent_id=$1 AND kind='district' LIMIT 1)) ON CONFLICT DO NOTHING",
          [w, x, z, b, VERSION],
        );
        existing.push(b);
      }
    return existing;
  });
  const mods = await db.query(
    "SELECT entity FROM modifications WHERE world_id=$1 AND (entity->>'x')::real BETWEEN $2 AND $3 AND (entity->>'z')::real BETWEEN $4 AND $5",
    [w, (cx - 1) * 32, (cx + 2) * 32, (cz - 1) * 32, (cz + 2) * 32],
  );
  return {
    chunks,
    objects: mods.rows.map((o) => o.entity),
    version: world.revision,
  };
});
app.post("/worlds/:w/objects", async (r) => {
  const { g, w, world } = await scope(r, true);
  const b = z
    .object({
      id: uuid.optional(),
      kind: z.enum(["tree", "bench"]),
      x: z.number().finite(),
      z: z.number().finite(),
      version: z.number().int().nonnegative(),
      confirm: z.literal(true),
    })
    .strict()
    .parse(r.body);
  const p = rooms.position(w, g);
  if (
    !p ||
    Math.hypot(b.x - p.x, b.z - p.z) > 10 ||
    Math.abs(b.x) > BOUND - 3 ||
    Math.abs(b.z) > BOUND - 3
  )
    return fail(400, "Lokasi di luar jangkauan.");
  const result = await tx(async (c) => {
    const q = await c.query(
      "SELECT revision FROM worlds WHERE id=$1 FOR UPDATE",
      [w],
    );
    if (q.rows[0].revision !== b.version)
      fail(409, "Versi dunia berubah. Muat ulang objek.");
    const rows = await c.query(
      "SELECT entity FROM modifications WHERE world_id=$1",
      [w],
    );
    const mods: Entity[] = rows.rows.map((v) => v.entity);
    if (b.id && !mods.some((m) => m.id === b.id && m.kind === b.kind))
      fail(404, "Objek tidak tersedia.");
    if (!b.id && mods.length >= 128)
      fail(409, "Kapasitas objek dunia tercapai.");
    const cx = Math.floor(b.x / 32),
      cz = Math.floor(b.z / 32);
    const entities = generateChunk(
      world.seed,
      world.spec,
      cx,
      cz,
    ).entities.concat(mods.filter((m) => m.id !== b.id));
    if (
      blocked(b.x, b.z, entities) ||
      entities.some((e) => Math.hypot(e.x - b.x, e.z - b.z) < 2.3) ||
      Math.hypot(p.x - b.x, p.z - b.z) < 1.5
    )
      fail(400, "Pilih tempat kosong dekat pemain.");
    const id = b.id ?? randomUUID(),
      entity = { id, kind: b.kind, x: b.x, z: b.z, size: 1 },
      version = b.version + 1;
    await c.query(
      "INSERT INTO modifications VALUES($1,$2,$3,$4) ON CONFLICT(world_id,id) DO UPDATE SET entity=excluded.entity,revision=excluded.revision",
      [w, id, entity, version],
    );
    await c.query("UPDATE worlds SET revision=$2 WHERE id=$1", [w, version]);
    await c.query("UPDATE nodes SET updated_at=now() WHERE id=$1", [w]);
    await c.query(
      "INSERT INTO audit_events(world_id,guest_id,kind,detail) VALUES($1,$2,'object',$3)",
      [w, g, { entity, version }],
    );
    return { entity, version };
  });
  rooms.changed(w, result.version, result.entity);
  return result;
});
app.post("/worlds/:w/guide", async (r) => {
  const { g, w } = await scope(r);
  const p = rooms.position(w, g);
  if (!p || Math.hypot(p.x + 2, p.z + 2) > 6)
    fail(400, "Dekati pemandu di titik kedatangan.");
  const n = await db.query(
    "INSERT INTO npc_state VALUES($1,$2,'guide',1,now()) ON CONFLICT(world_id,guest_id,npc) DO UPDATE SET meetings=npc_state.meetings+1,last_seen=now() RETURNING meetings",
    [w, g],
  );
  const hour = new Date().getUTCHours();
  return {
    simulated: true,
    meetings: n.rows[0].meetings,
    activity: hour < 12 ? "Memandu observasi" : "Meninjau catatan",
    message:
      n.rows[0].meetings === 1
        ? "Mulailah dengan mendengar. Catat aset komunitas sebelum merumuskan peluang."
        : "Selamat kembali. Tinjau catatan terakhirmu dan periksa asumsi bersama rekan.",
    url: "/the-world/listen",
  };
});
app.get("/worlds/:w/docs", async (r) => {
  const { g, w } = await scope(r);
  return (
    await db.query(
      "SELECT id,kind,fields,version FROM project_docs WHERE world_id=$1 AND author_id=$2 ORDER BY updated_at DESC",
      [w, g],
    )
  ).rows;
});
app.post("/worlds/:w/docs", async (r) => {
  const { g, w } = await scope(r);
  const b = z
    .object({
      id: uuid.optional(),
      kind: z.enum(
        Object.keys(documentFields) as [
          keyof typeof documentFields,
          ...(keyof typeof documentFields)[],
        ],
      ),
      version: z.number().int().nonnegative(),
      fields: z.record(z.string(), z.string().max(1600)),
    })
    .strict()
    .parse(r.body);
  const keys = Object.keys(b.fields);
  if (
    !keys.length ||
    keys.some(
      (k) => !(documentFields[b.kind] as readonly string[]).includes(k),
    ) ||
    !Object.values(b.fields).some((v) => v.trim())
  )
    fail(400, "Periksa kolom dokumen.");
  if (b.id) {
    const q = await db.query(
      "UPDATE project_docs SET fields=$1,version=version+1,updated_at=now() WHERE id=$2 AND world_id=$3 AND author_id=$4 AND version=$5 AND kind=$6 RETURNING id,version",
      [b.fields, b.id, w, g, b.version, b.kind],
    );
    return q.rows[0] ?? fail(409, "Versi dokumen berubah.");
  }
  const id = randomUUID();
  await db.query(
    "INSERT INTO project_docs(id,world_id,author_id,kind,fields) VALUES($1,$2,$3,$4,$5)",
    [id, w, g, b.kind, b.fields],
  );
  return { id, version: 1 };
});
app.post("/worlds/:w/moderate", async (r) => {
  const { g, w } = await scope(r);
  const b = z
    .object({
      action: z.enum(["block", "report"]),
      target: uuid,
      reason: z.string().trim().min(2).max(300),
    })
    .parse(r.body);
  if (
    b.target === g ||
    !(
      await db.query(
        "SELECT 1 FROM membership WHERE world_id=$1 AND guest_id=$2",
        [w, b.target],
      )
    ).rowCount
  )
    fail(400, "Pemain tidak valid.");
  if (b.action === "block") {
    await db.query("INSERT INTO blocks VALUES($1,$2) ON CONFLICT DO NOTHING", [
      g,
      b.target,
    ]);
    rooms.block(g, b.target);
  } else
    await db.query(
      "INSERT INTO reports(id,actor,target,world_id,reason) VALUES($1,$2,$3,$4,$5)",
      [randomUUID(), g, b.target, w, b.reason],
    );
  return { ok: true };
});
let busy = false,
  stopping = false,
  worker: Worker | undefined;
const lease = await db.connect();
if (
  !(await lease.query("SELECT pg_try_advisory_lock(935110) AS ok")).rows[0].ok
)
  throw Error(
    "Only one authoritative local realm service may run per database.",
  );
await db.query(
  "UPDATE jobs SET status=CASE WHEN attempts<3 THEN 'queued' ELSE 'failed' END,error='Pemulihan worker' WHERE status='running'",
);
const poll = setInterval(async () => {
  if (busy || stopping) return;
  busy = true;
  try {
    const q = await db.query(
      "UPDATE jobs SET status='running',attempts=attempts+1 WHERE id=(SELECT id FROM jobs WHERE status='queued' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING id,request",
    );
    if (!q.rowCount) return;
    const j = q.rows[0];
    let result;
    try {
      result = await new Promise<{
        result?: { spec: unknown; provider: string };
        error?: string;
      }>((resolve, reject) => {
        worker = new Worker(new URL("./generate.mts", import.meta.url), {
          workerData: j.request,
        });
        worker.once("message", resolve);
        worker.once("error", reject);
        worker.once("exit", (c) => {
          if (c !== 0) reject(Error("Worker stopped"));
        });
      });
      if (!result.result) throw Error(result.error);
      const s = specification.parse(result.result.spec);
      await db.query(
        "UPDATE jobs SET status='preview',spec=$2,provider=$3,request='{}',error=NULL WHERE id=$1",
        [j.id, s, result.result.provider],
      );
    } catch (e) {
      if (!stopping)
        await db.query(
          "UPDATE jobs SET status='failed',error=$2,request='{}' WHERE id=$1",
          [j.id, (e as Error).message.slice(0, 200)],
        );
    } finally {
      worker = undefined;
    }
  } catch {
    if (!stopping) console.error("Generation queue unavailable");
  } finally {
    busy = false;
  }
}, 250);
await app.listen({
  port: Number(process.env.WORLD_PORT || 4100),
  host: process.env.WORLD_HOST || "127.0.0.1",
});
console.log("World service ready");
async function shutdown() {
  if (stopping) return;
  stopping = true;
  clearInterval(poll);
  await worker?.terminate();
  await rooms.close();
  await app.close();
  lease.release();
  await store.close();
}
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
