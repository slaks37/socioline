import { chromium } from "playwright-core";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
try {
  const p = await browser.newPage({ viewport: { width: 1080, height: 760 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto((process.env.QA_URL || "http://localhost:3000") + "/worlds");
  await p.getByRole("button", { name: "Mulai sesi tamu" }).click();
  await p.getByRole("combobox", { name: /Generator/ }).selectOption("model");
  await p
    .getByLabel("Deskripsi dunia")
    .fill("Rancang lingkungan untuk belajar bersama");
  await p.locator('input[type="file"]').setInputFiles("public/district-0.webp");
  await p.getByRole("button", { name: "Buat pratinjau", exact: true }).click();
  await p.getByText(/CLIP-ViT-B32-CPU ·/).waitFor();
  await p
    .locator(".world-preview")
    .screenshot({ path: "docs/qa-v3/13-image-preview.png" });
  await p.getByRole("button", { name: "Simpan dan masuki dunia" }).click();
  await p
    .getByText(/Terhubung · 1 pemain terhubung di sekitar · 9 chunk dimuat/)
    .waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS uploaded WebP through the public lab, real CPU model preview, confirmation and streamed world",
  );
} finally {
  await browser.close();
}
