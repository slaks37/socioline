// Local, trusted editor workflow. No public write endpoint or browser credentials.
import { readFile, writeFile, rename, open, unlink } from "node:fs/promises";
import assert from "node:assert/strict";
import { compile } from "./content.mjs";
const [action, collection, slug, argument] = process.argv.slice(2);
const file = new URL("../content/editorial.json", import.meta.url);
if (
  ![
    "new",
    "edit",
    "review",
    "publish",
    "schedule",
    "withdraw",
    "list",
  ].includes(action) ||
  !["blog", "news", "events", "projects"].includes(collection)
) {
  console.error(
    "Usage: npm run editor -- <new|edit|review|publish|schedule|withdraw|list> <blog|news|events|projects> [slug] [input.json or ISO date]",
  );
  process.exit(2);
}
const lock = new URL(file.href + ".lock");
const handle = await open(lock, "wx");
try {
  const data = JSON.parse(await readFile(file, "utf8")),
    records = (data[collection] ??= []);
  data[collection] = records;
  if (action === "list") {
    console.table(
      records.map(({ slug, status, updatedAt }) => ({
        slug,
        status,
        updatedAt,
      })),
    );
  } else {
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), "Invalid slug");
    let r = records.find((r) => r.slug === slug);
    const now = new Date().toISOString();
    if (action === "new" || action === "edit") {
      assert(
        action === "new" ? !r : r?.status === "draft",
        "Edit a draft or create a new slug",
      );
      const input = JSON.parse(await readFile(argument, "utf8"));
      const draft = {
        ...input,
        slug,
        status: "draft",
        approved: false,
        updatedAt: now,
      };
      if (r) Object.assign(r, draft);
      else records.push(draft);
    } else {
      assert(r, "Missing record");
      if (action === "review") {
        assert(r.status === "draft");
        r.status = "review";
      } else if (action === "withdraw") {
        r.status = "draft";
        r.approved = false;
      } else {
        assert(r.status === "review", "Review is required");
        assert(
          r.author?.trim() &&
            r.category?.trim() &&
            r.title?.trim() &&
            r.summary?.trim() &&
            r.body?.length,
          "Missing editorial fields",
        );
        r.publishedAt =
          action === "schedule" ? new Date(argument).toISOString() : now;
        r.status = action === "schedule" ? "scheduled" : "published";
      }
      r.updatedAt = now;
    }
    const atlas = JSON.parse(
      await readFile(new URL("../content/atlas.json", import.meta.url), "utf8"),
    );
    compile(atlas, data, Infinity);
    const tmp = new URL(file.href + ".tmp");
    await writeFile(tmp, JSON.stringify(data, null, 2) + "\n");
    await rename(tmp, file);
    console.log("Editorial record saved. Rebuild to refresh public pages.");
  }
} finally {
  await handle.close();
  await unlink(lock);
}
