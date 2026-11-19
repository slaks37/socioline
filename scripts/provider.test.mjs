import { createServer } from "node:http";
import { once } from "node:events";
import { Worker } from "node:worker_threads";
import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";

test("Worker sends image to configured model and rejects out-of-schema responses", async () => {
  const spec = {
    name: "Kampus Uji",
    type: "campus",
    biome: "tropical",
    terrain: "plain",
    features: ["school", "farm"],
  };
  let response = spec;
  const requests = [];
  const stub = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    requests.push(JSON.parse(Buffer.concat(chunks).toString()));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(response) } }],
      }),
    );
  });
  stub.listen(0, "127.0.0.1");
  await once(stub, "listening");
  try {
    const png = await sharp({
      create: { width: 8, height: 8, channels: 3, background: "#75ad9c" },
    })
      .png()
      .toBuffer();
    const image = "data:image/png;base64," + png.toString("base64");
    async function run() {
      const worker = new Worker(
        new URL("../services/world/generate.mts", import.meta.url),
        {
          workerData: { prompt: "Kampus dengan kebun", mode: "model", image },
          env: {
            ...process.env,
            WORLD_MODEL_URL: "http://127.0.0.1:" + stub.address().port,
            WORLD_MODEL_NAME: "fixture",
            WORLD_MODEL_KEY: "",
          },
        },
      );
      try {
        return (await once(worker, "message"))[0];
      } finally {
        await worker.terminate();
      }
    }
    assert.deepEqual((await run()).result.spec, spec);
    assert.equal(requests[0].messages[1].content[1].image_url.url, image);
    response = { ...spec, features: ["unsupported"] };
    assert.match((await run()).error, /tidak valid/);
  } finally {
    await new Promise((resolve) => stub.close(resolve));
  }
});
