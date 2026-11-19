import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.QA_URL || "http://localhost:3000",
  out = "docs/qa-v3";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const p = await browser.newPage({ viewport: { width: 960, height: 720 } }),
  errors = [];
p.setDefaultTimeout(30000);
p.on("pageerror", (e) => errors.push(e.message));
const button = (n) => p.getByRole("button", { name: n, exact: true });
try {
  await p.goto(base + "/worlds");
  await button("Mulai sesi tamu").click();
  await button("Buat pratinjau").click();
  await button("Simpan dan masuki dunia").waitFor();
  await p.screenshot({ path: out + "/11-world-preview.png", fullPage: true });
  await button("Simpan dan masuki dunia").click();
  await p
    .getByText(/Terhubung · 1 pemain terhubung di sekitar · 9 chunk dimuat/)
    .waitFor();
  await p.locator(".realm-scene canvas").waitFor();
  await button("Bicara dengan pemandu NPC").click();
  await p.getByText(/Pertemuan 1/).waitFor();
  await p
    .locator(".realm-scene")
    .screenshot({ path: out + "/12-generated-world.png" });
  await p.getByText("Kelola ruang bersama", { exact: true }).click();
  await button("Tempatkan bangku").click();
  await button("Setujui perubahan").click();
  await p.getByText("Perubahan disimpan.", { exact: true }).waitFor();
  await p.getByText("Dokumen kerja W3", { exact: true }).click();
  await p
    .getByLabel("Karunia", { exact: true })
    .fill("Belajar mendengar bersama rekan.");
  await button("Simpan dokumen").click();
  await p.getByText("Dokumen tersimpan.", { exact: true }).waitFor();
  await button("Kembali ke laboratorium").click();
  await p.reload();
  await button("Mulai sesi tamu").click();
  await button("Desa Tropis · Pemilik").click();
  await p
    .getByText(/Terhubung · 1 pemain terhubung di sekitar · 9 chunk dimuat/)
    .waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS normal browser entry, world preview, gateway WebSocket, nine chunks, NPC, confirmed object, W3 document and reconnect",
  );
} catch (e) {
  console.error((await p.locator("body").innerText()).slice(-2300));
  throw e;
} finally {
  await browser.close();
}
