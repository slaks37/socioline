import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const args = process.argv.slice(2);
const dev = !args.includes("--production");
const children = new Set();
let stopping = false;

function stop() {
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
}
function start(program, argv, options = {}) {
  if (stopping) throw Error("Peluncuran dihentikan.");
  const child = spawn(program, argv, { stdio: "inherit", ...options });
  children.add(child);
  child.once("close", () => children.delete(child));
  return child;
}
async function step(program, argv) {
  const [code] = await once(start(program, argv), "exit");
  if (code !== 0) throw Error("Gagal menjalankan " + program + " " + argv[0]);
}
function supervise(child) {
  child.once("error", (e) => {
    console.error(e.message);
    process.exitCode = 1;
    stop();
  });
  child.once("exit", (code) => {
    if (!stopping) {
      process.exitCode = code ?? 1;
      stop();
    }
  });
}
async function localModel() {
  const data = path.resolve(process.env.WORLD_DATA_DIR || ".world-data");
  const directory = path.join(data, "models", "clip"),
    venv = path.join(data, "model-env");
  const python = path.join(
    venv,
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
  );
  const requirements = "services/model/requirements.txt";
  const checksum = createHash("sha256")
    .update(await readFile(requirements))
    .digest("hex");
  const marker = path.join(venv, ".socioline-requirements");
  await mkdir(data, { recursive: true });
  if ((await readFile(marker, "utf8").catch(() => "")) !== checksum) {
    await step(process.env.PYTHON || "python3", ["-m", "venv", venv]);
    await step(python, ["-m", "pip", "install", "-r", requirements]);
    await writeFile(marker, checksum);
  }
  await step(python, ["services/model/fetch.py", "--directory", directory]);
  const port = process.env.WORLD_LOCAL_MODEL_PORT || "4120";
  const model = start(
    python,
    ["services/model/server.py", "--directory", directory, "--port", port],
    { stdio: ["ignore", "pipe", "inherit"] },
  );
  supervise(model);
  await new Promise((resolve, reject) => {
    model.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
      if (chunk.toString().includes("CLIP CPU ready")) resolve();
    });
    model.once("error", reject);
    model.once("exit", () => reject(Error("Model lokal berhenti.")));
  });
  return {
    WORLD_MODEL_URL: "http://127.0.0.1:" + port + "/v1/chat/completions",
    WORLD_MODEL_NAME: "CLIP-ViT-B32-CPU",
    WORLD_MODEL_KEY: "",
  };
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
try {
  const env = {
    ...process.env,
    ...(args.includes("--ai") ? await localModel() : {}),
  };
  supervise(start(process.execPath, ["services/world/server.mts"], { env }));
  supervise(
    start(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        dev ? "dev" : "start",
        ...(dev ? ["--webpack"] : []),
        "--hostname",
        "127.0.0.1",
      ],
      { env },
    ),
  );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
  stop();
}
