import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { Pool } from "pg";
import { validAvatar } from "../../../engine/avatar";
import {
  actions,
  act,
  activitySites,
  freshLife,
  type Life,
  type Activity,
} from "../../../engine/city-life";
import { z } from "zod";

export const runtime = "nodejs";
export const preferredRegion = "sin1";
const cookie = "socioline_city_guest";
const shared = globalThis as typeof globalThis & { cityPool?: Pool };
function pool() {
  return (shared.cityPool ??= new Pool({
    connectionString: process.env.CITY_DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 9000,
  }));
}
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const position = z.object({
  x: z.number().min(-152).max(84),
  z: z.number().min(-74).max(60),
  y: z.number().min(-6).max(55),
  ride: z.enum(["motor", "mobil", "helikopter"]).optional(),
  facing: z.number().finite().min(-10000).max(10000),
});
function answer(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export async function POST(req: NextRequest) {
  if (!process.env.CITY_DATABASE_URL)
    return answer({ error: "Server kota bersama belum terhubung." }, 503);
  const origin = req.headers.get("origin");
  if (
    !origin ||
    ![req.headers.get("host"), req.nextUrl.host].some(
      (host) =>
        host && (origin === "https://" + host || origin === "http://" + host),
    ) ||
    !req.headers.get("content-type")?.startsWith("application/json")
  )
    return answer({ error: "Permintaan tidak valid." }, 403);
  const raw = await req.text();
  if (raw.length > 5000) return answer({}, 413);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return answer({}, 400);
  }
  if (!body || typeof body !== "object") return answer({}, 400);
  const token = req.cookies.get(cookie)?.value;
  const key = token && /^[a-f0-9]{64}$/.test(token) ? hash(token) : null;
  const db = pool();
  try {
    if (body.op === "join") {
      if (!validAvatar(body.avatar)) return answer({}, 400);
      const look = { ...body.avatar, name: "" };
      let stored = key
        ? (
            await db.query(
              "update city_guests set avatar=$2, seen=now(),online=true where token=$1 returning id,life,pose",
              [key, look],
            )
          ).rows[0]
        : null;
      let newToken = "";
      if (!stored) {
        const addr =
          req.headers.get("x-vercel-forwarded-for")?.split(",")[0] ?? "local";
        const bucket = hash(addr + "|" + Math.floor(Date.now() / 3600000));
        const count = await db.query(
          "insert into city_joins(bucket,n) values($1,1) on conflict(bucket) do update set n=city_joins.n+1 returning n",
          [bucket],
        );
        if (count.rows[0].n > 80)
          return answer({ error: "Coba lagi nanti." }, 429);
        newToken = randomBytes(32).toString("hex");
        stored = (
          await db.query(
            "insert into city_guests(token,id,avatar,life) values($1,$2,$3,$4) returning id,life,pose",
            [hash(newToken), randomUUID(), look, freshLife],
          )
        ).rows[0];
        await db.query(
          "delete from city_joins where created < now()-interval '2 hours'",
        );
      }
      const res = answer(stored);
      if (newToken)
        res.cookies.set(cookie, newToken, {
          httpOnly: true,
          sameSite: "strict",
          secure: req.nextUrl.protocol === "https:",
          path: "/api/city",
          maxAge: 60 * 60 * 24 * 365,
        });
      return res;
    }
    if (!key) return answer({}, 401);
    if (body.op === "leave") {
      await db.query("update city_guests set online=false where token=$1", [
        key,
      ]);
      return answer({ ok: true });
    }
    if (body.op === "pulse") {
      const pos = position.safeParse(body.pose);
      if (!pos.success) return answer({}, 400);
      const updated = await db.query(
        "update city_guests set pose=$2,seen=now() where token=$1 and online and seen < now()-interval '300 milliseconds' returning id",
        [key, pos.data],
      );
      if (!updated.rowCount) return answer({}, 409);
      const peers = (
        await db.query(
          "select id, avatar, pose from city_guests where token<>$1 and online and seen>now()-interval '12 seconds' and pose is not null and abs((pose->>'x')::float-$2)<65 and abs((pose->>'z')::float-$3)<65 order by seen desc limit 12",
          [key, pos.data.x, pos.data.z],
        )
      ).rows;
      const town = (
        await db.query("select deliveries from city_commons where id=1")
      ).rows[0];
      return answer({ peers, deliveries: town.deliveries });
    }
    if (
      body.op === "act" &&
      typeof body.action === "string" &&
      Object.hasOwn(actions, body.action) &&
      z.string().uuid().safeParse(body.request).success
    ) {
      const action = body.action as Activity,
        pos = position.safeParse(body.pose);
      if (!pos.success) return answer({}, 400);
      const site = activitySites.find((s) => s.id === actions[action].site)!;
      if (
        Math.hypot(pos.data.x - site.x, pos.data.z - site.z) > 2.65 ||
        pos.data.y > 1.5
      )
        return answer({ error: "Dekati tempat aktivitas." }, 400);
      const client = await db.connect();
      try {
        await client.query("begin");
        const row = (
          await client.query(
            "select id,life,last_request,last_reply from city_guests where token=$1 and online for update",
            [key],
          )
        ).rows[0];
        if (!row) {
          await client.query("rollback");
          return answer({}, 401);
        }
        if (row.last_request === body.request) {
          await client.query("commit");
          return answer(row.last_reply);
        }
        const next = act(row.life as Life, action);
        if (action === "deliver" && row.life.parcel && !next.state.parcel)
          await client.query(
            "update city_commons set deliveries=deliveries+1 where id=1",
          );
        await client.query(
          "update city_guests set life=$2,last_request=$3,last_reply=$4,seen=now() where token=$1",
          [key, next.state, body.request, next],
        );
        await client.query("commit");
        return answer(next);
      } catch (e) {
        await client.query("rollback");
        throw e;
      } finally {
        client.release();
      }
    }
    return answer({}, 400);
  } catch {
    return answer({ error: "Koneksi kota terputus. Coba lagi." }, 503);
  }
}
