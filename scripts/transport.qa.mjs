import { chromium } from "playwright-core";
import assert from "node:assert/strict";
(async () => {
  const base = process.env.QA_URL || "http://localhost:3000",
    b = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    });
  try {
    const page = await b.newPage({ viewport: { width: 1080, height: 750 } });
    page.setDefaultTimeout(45000);
    const errors = [];
    page.on("pageerror", (e) => {
      errors.push(e.message);
      console.log(e.message);
    });
    await page.goto(base + "/explore");
    const btn = (n) => page.getByRole("button", { name: n, exact: true }),
      mini = page.locator(".mini");
    await btn("Masuk ke Central Plaza").click();
    await mini.waitFor();
    const travel = async (n) => {
      await btn("Peta dan perjalanan").click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: n, exact: true })
        .click();
    };
    const height = async () =>
      parseFloat((await mini.getAttribute("title")).split(" ")[1]);
    const move = async (key, condition, arg) => {
      await page.keyboard.down(key);
      try {
        await page.waitForFunction(condition, arg, { timeout: 30000 });
      } finally {
        await page.keyboard.up(key);
      }
    };
    await travel("Tangga Discovery Center");
    await page.waitForFunction(() =>
      document
        .querySelector(".mini")
        .getAttribute("aria-label")
        .includes("8, -31"),
    );
    await move(
      "w",
      () =>
        parseFloat(document.querySelector(".mini").title.split(" ")[1]) > 3.85,
    );
    console.log("Discovery staircase walked", await height());
    for (const running of [false, true]) {
      await travel("Tangga atap koperasi");
      await page.waitForFunction(() =>
        document
          .querySelector(".mini")
          .getAttribute("aria-label")
          .includes("31, 30"),
      );
      if (running) await page.keyboard.down("Shift");
      try {
        await move(
          "w",
          () =>
            parseFloat(document.querySelector(".mini").title.split(" ")[1]) >
            3.68,
        );
        // Run up to the back rail before turning, as well as turning on the last tread.
        if (running) {
          await move(
            "w",
            () =>
              Number(
                document
                  .querySelector(".mini")
                  .getAttribute("aria-label")
                  .split(", ")
                  .at(-1),
              ) <= 21,
          );
        }
        await move(
          "d",
          () =>
            parseFloat(
              document
                .querySelector(".mini")
                .getAttribute("aria-label")
                .split("position ")[1],
            ) >= 33,
        );
      } finally {
        if (running) await page.keyboard.up("Shift");
      }
      await page.waitForTimeout(350);
      assert(
        (await height()) > 3.5,
        "Avatar must stay on the roof after turning",
      );
      console.log(
        running ? "Ran onto the roof" : "Walked onto the roof",
        await height(),
      );
    }
    await travel("Tangga panjat studio");
    await btn("Panjat ke atap").click();
    await page.waitForFunction(
      () =>
        parseFloat(document.querySelector(".mini").title.split(" ")[1]) > 3.4 &&
        document
          .querySelector(".mini")
          .getAttribute("aria-label")
          .includes("-19, 24"),
    );
    console.log("ladder", await height());
    for (const [spot, id] of [
      ["Garasi motor", "Motor"],
      ["Garasi mobil", "Mobil"],
      ["Helipad", "Helikopter"],
    ]) {
      await travel(spot);
      await btn("Naik " + id).click();
      await btn("Turun dari " + id).waitFor();
      const start = await mini.getAttribute("aria-label");
      if (id === "Helikopter") {
        await page.locator(".game canvas").focus();
        await move(
          "Space",
          () =>
            parseFloat(document.querySelector(".mini").title.split(" ")[1]) > 4,
        );
        console.log("flight", await height());
      }
      await move(
        "w",
        (s) => document.querySelector(".mini").getAttribute("aria-label") !== s,
        start,
      );
      await page.waitForTimeout(1300);
      if (id === "Helikopter") {
        await move(
          "c",
          () =>
            parseFloat(document.querySelector(".mini").title.split(" ")[1]) <
            0.25,
        );
      }
      await btn("Turun dari " + id).click();
      await btn("Naik " + id).waitFor();
      console.log("board move exit", id);
    }
    await travel("Kebun koperasi");
    await btn("Kelola kebun").click();
    await btn("Tanam benih · 1 koin").click();
    await page.getByText("Benih ditanam.", { exact: false }).waitFor();
    await btn("Lanjutkan menjelajah").click();
    await travel("Kantor usaha");
    await btn("Temui mentor bisnis").click();
    await page.locator("summary").filter({ hasText: "Berapa modal" }).click();
    await page.getByRole("spinbutton").fill("7");
    await page.getByText(/35 koin/).waitFor();
    await btn("Lanjutkan menjelajah").click();
    assert.deepEqual(errors, []);
    console.log("farm & business OK");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
