import { readFile } from "node:fs/promises";
import pg from "pg";

if (process.env.CITY_DATABASE_URL) {
  const client = new pg.Client({
    connectionString: process.env.CITY_DATABASE_URL,
    connectionTimeoutMillis: 12000,
  });
  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(920176)");
    await client.query(
      await readFile(
        new URL("../services/world/migrations/city.sql", import.meta.url),
        "utf8",
      ),
    );
    await client.query("COMMIT");
    console.log("Central City database schema ready.");
  } finally {
    await client.end();
  }
}
