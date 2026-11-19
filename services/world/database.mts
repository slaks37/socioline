import { Pool, type PoolClient } from "pg";
import { randomBytes, createHash } from "node:crypto";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export const secret = () => randomBytes(32).toString("base64url");
export const rootCity = "10000000-0000-4000-a000-000000000005",
  region = "10000000-0000-4000-a000-000000000004";
export async function database() {
  let url = process.env.DATABASE_URL;
  let stop = async () => {};
  if (!url) {
    const { default: Embedded } = await import("embedded-postgres");
    const dir = path.resolve(process.env.WORLD_DATA_DIR || ".world-data");
    await mkdir(dir, { recursive: true, mode: 0o700 });
    let password: string;
    const key = path.join(dir, ".pg-password");
    try {
      password = await readFile(key, "utf8");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      password = secret();
      await writeFile(key, password, { mode: 0o600, flag: "wx" });
    }
    const port = Number(process.env.WORLD_PG_PORT || 55432);
    const cluster = new Embedded({
      databaseDir: path.join(dir, "postgres"),
      user: "socioline",
      password,
      port,
      persistent: true,
      autoRehydrateSymlinks: true,
      initdbFlags: ["--auth=scram-sha-256"],
      postgresFlags: ["-c", "listen_addresses=127.0.0.1"],
      onLog: () => {},
      onError: () => {},
    });
    let fresh = false;
    try {
      await access(path.join(dir, "postgres", "PG_VERSION"));
    } catch {
      fresh = true;
    }
    if (fresh) await cluster.initialise();
    await cluster.start();
    stop = () => cluster.stop();
    url =
      "postgresql://socioline:" + password + "@127.0.0.1:" + port + "/postgres";
  }
  const db = new Pool({ connectionString: url, max: 12 });
  async function tx<T>(fn: (c: PoolClient) => Promise<T>) {
    const c = await db.connect();
    try {
      await c.query("BEGIN");
      const r = await fn(c);
      await c.query("COMMIT");
      return r;
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  }
  await tx(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(935109)");
    await c.query(
      await readFile(new URL("./migrations/001.sql", import.meta.url), "utf8"),
    );
    await c.query(
      await readFile(new URL("./migrations/002.sql", import.meta.url), "utf8"),
    );
    await c.query(
      await readFile(new URL("./migrations/003.sql", import.meta.url), "utf8"),
    );
    let parent: string | null = null;
    for (const [n, kind] of [
      "universe",
      "planet",
      "continent",
      "region",
      "city",
    ].entries()) {
      const id = "10000000-0000-4000-a000-" + String(n + 1).padStart(12, "0");
      await c.query(
        "INSERT INTO nodes(id,parent_id,kind,name) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",
        [
          id,
          parent,
          kind,
          [
            "SocioLine",
            "Terra",
            "Nusantara",
            "Kawasan W3",
            "SocioLine Central City",
          ][n],
        ],
      );
      parent = id;
    }
  });
  return {
    db,
    tx,
    close: async () => {
      await db.end();
      await stop();
    },
  };
}
export type Store = Awaited<ReturnType<typeof database>>;
