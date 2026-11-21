import { districts, landmarks, type Landmark } from "./content";
export type Shape = "box" | "round" | "roof" | "cone" | "leaf" | "peak";
export type Part = {
  s: Shape;
  p: number[];
  size: number[];
  c: string;
  r: number;
};

export function sectorCenter(id: string) {
  const [cx, cz] = id.split(",").map(Number);
  return { x: (cx + 0.5) * 32, z: (cz + 0.5) * 32 };
}
export function cityParts() {
  const chunks: Record<string, Part[]> = {};
  let zone = "ground";
  function put(
    s: Shape,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: string,
    r = 0,
  ) {
    (chunks[zone] ??= []).push({ s, p: [x, y, z], size: [w, h, d], c, r });
  }
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: string,
    r = 0,
  ) => put("box", x, y, z, w, h, d, c, r);
  const cyl = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    c: string,
  ) => put("round", x, y, z, w, h, w, c);

  box(0, -0.63, -6, 165, 1, 131, "#d7be8e");
  box(0, -0.18, -6, 164, 0.35, 130, "#98ad81");
  for (const z of [-59, -23, 0, 38]) {
    if (z === 38) {
      for (const side of [-1, 1])
        box(side * 39, 0.04, z, 66, 0.1, 5.4, "#677772");
    } else box(0, 0.04, z, 144, 0.1, 5.4, "#677772");
    box(0, 0.1, z - 3.4, 144, 0.18, 1.4, "#decba7");
    box(0, 0.1, z + 3.4, 144, 0.18, 1.4, "#decba7");
    for (let x = -69; x < 71; x += 6)
      if (z !== 38 || Math.abs(x) > 8)
        box(x, 0.105, z, 2, 0.04, 0.14, "#e1dabc");
  }
  for (const x of [-71, -24, 24, 71]) {
    box(x, 0.07, -20, 3.7, 0.14, 41, "#677772");
    for (let z = -40; z <= 0; z += 6) box(x, 0.16, z, 0.14, 0.04, 2, "#ddd3ad");
  }
  for (const x of [-23, 23])
    for (const z of [-23, 0, 38])
      for (let i = -2; i <= 2; i++)
        box(x + i * 0.85, 0.17, z + 4, 0.45, 0.04, 2, "#eee6ca");
  for (const d of districts) {
    box(d.x, 0.08, -24, 39, 0.16, 36, "#b0b68f");
    box(d.x, 0.17, -23, 39, 0.16, 4.9, "#687a75");
    for (let xx = -18; xx < 20; xx += 6)
      box(d.x + xx, 0.26, -23, 2, 0.035, 0.14, "#e4dbad");
    box(d.x, 0.15, -9, 3, 0.2, 21, "#d8c39c");
  }
  box(0, 0.12, 21, 37, 0.25, 31, "#d6c099");
  for (let x = -60; x < 65; x += 9) {
    for (const z of [-26.6, 3.2, 34.5]) {
      cyl(x, 1.65, z, 0.13, 3.3, "#42555a");
      box(x + 0.18, 3.35, z, 0.58, 0.15, 0.35, "#314e56");
      box(x + 0.2, 3.25, z, 0.42, 0.045, 0.29, "#efdeb4");
    }
  }
  function building(l: Landmark, i: number) {
    const { x, z, kind: k } = l;
    zone = Math.floor(x / 32) + "," + Math.floor(z / 32);
    const hub = l.zone === "hub";
    const w = hub ? 7 : 8.4,
      d = hub ? 5 : 7;
    if (k === 5 || k >= 7) return;
    const accent =
      l.zone === "the-word"
        ? "#9c7460"
        : l.zone === "the-work"
          ? "#628375"
          : "#507d91";
    const plaster = ["#f1ddbb", "#f3e6ce", "#dcc9ad"][i % 3];
    const height = 3.22 + (i % 3) * 0.22;
    const shelf = "#91654b";
    // A continuous entrance leads into a furnished room, with daylight on both sides.
    box(x, 0.14, z, w + 0.55, 0.28, d + 0.55, "#cbb893");
    for (const side of [-1, 1]) {
      box(x + side * (w / 2 - 0.1), height / 2, z, 0.2, height, d, plaster);
      box(
        x + side * (w / 4 + 0.54),
        0.85,
        z + d / 2,
        w / 2 - 1.08,
        1.42,
        0.18,
        accent,
      );
      for (const offset of [0.09, 0.96]) {
        box(
          x + side * (1.1 + offset * (w / 2 - 1.1)),
          2.08,
          z + d / 2,
          0.11,
          1.4,
          0.14,
          shelf,
        );
      }
      box(
        x + side * (w / 4 + 0.54),
        2.17,
        z + d / 2,
        w / 2 - 1.1,
        1.12,
        0.08,
        "#acc9c7",
      );
    }
    box(x, height / 2, z - d / 2, w, height, 0.22, plaster);
    box(x, height - 0.24, z + d / 2, w, 0.46, 0.25, accent);
    box(x, height + 0.1, z, w + 0.76, 0.26, d + 0.72, "#d8c3a3");
    box(x, height + 0.26, z, w - 0.24, 0.08, d - 0.24, "#c9ad87");
    if (l.id === "collaboration-center") {
      const stairs = 19;
      for (let step = 0; step < stairs; step++) {
        const rise = 0.23 + ((height + 0.07) * step) / (stairs - 1);
        box(
          x - w / 2 - 0.96,
          rise / 2,
          z + 3.65 - step * 0.33,
          1.55,
          rise,
          0.35,
          "#bc9976",
        );
      }
    } else box(x - w / 2 - 0.2, height + 0.55, z, 0.12, 0.54, d, "#95735b");
    if (i % 3 === 1) {
      // Shaded veranda and painted louvers give each block a street-facing entrance.
      for (let s = -3; s <= 3; s++)
        box(
          x + s * 0.67,
          2.96,
          z + d / 2 + 0.8,
          0.65,
          0.13,
          1.64,
          s % 2 === 0 ? accent : "#e2cc9c",
        );
      for (const side of [-1, 1])
        box(x + side * 2.28, 1.5, z + d / 2 + 1.35, 0.1, 2.89, 0.1, shelf);
    } else if (i % 3 === 2) {
      for (const side of [-1, 1])
        for (let j = 0; j < 4; j++)
          box(
            x + side * (w / 2 - 0.26 - j * 0.25),
            2.04,
            z + d / 2 + 0.09,
            0.065,
            0.96,
            0.18,
            shelf,
            -0.28,
          );
    }
    if (l.kind === 3 || l.kind === 4) {
      box(
        x - w * 0.18,
        height + 0.91,
        z - 0.75,
        w * 0.44,
        1.3,
        d * 0.4,
        accent,
      );
      box(
        x - w * 0.18,
        height + 1.62,
        z - 0.75,
        w * 0.5,
        0.14,
        d * 0.49,
        plaster,
      );
      box(
        x - w * 0.18,
        height + 1.02,
        z - 0.75 + d * 0.2,
        w * 0.35,
        0.55,
        0.07,
        "#b0cecb",
      );
    }
    for (const end of [-1, 1])
      box(
        x + w / 2 + 0.2,
        height + 0.55,
        z + end * (d / 4 + 0.35),
        0.12,
        0.54,
        d / 2 - 0.7,
        "#95735b",
      );
    box(x, height + 0.55, z - d / 2, w, 0.54, 0.12, "#95735b");
    box(x, 2.8, z + d / 2 + 0.45, 3, 0.14, 1.15, accent);
    // Bench, work surface, legs, shelves and books inside the room.
    box(x - w * 0.28, 0.56, z - 0.35, 1.4, 0.22, 0.66, "#b78057");
    box(x - w * 0.28, 0.33, z - 0.35, 1.12, 0.37, 0.48, shelf);
    box(x + w * 0.22, 0.99, z - 1.15, 1.65, 0.14, 0.9, "#a86f48");
    for (const side of [-1, 1])
      box(x + w * 0.22 + side * 0.67, 0.61, z - 1.15, 0.11, 0.69, 0.65, shelf);
    for (let row = 0; row < 3; row++) {
      box(x, 0.86 + row * 0.58, z - d / 2 + 0.33, 3, 0.1, 0.5, shelf);
      for (let book = 0; book < 8; book++)
        box(
          x - 1.12 + book * 0.29,
          1.08 + row * 0.58,
          z - d / 2 + 0.3,
          0.19,
          0.36,
          0.27,
          [accent, "#c69d66", "#9e6557"][book % 3],
        );
    }
    // Exterior ladder on the right wall. It terminates inside the roof parapet opening.
    for (const dz of [-0.4, 0.4])
      box(
        x + w / 2 + 0.4,
        height * 0.52,
        z + dz,
        0.07,
        height + 0.45,
        0.07,
        "#495a59",
      );
    for (let y = 0.45; y < height + 0.35; y += 0.34)
      box(x + w / 2 + 0.45, y, z, 0.09, 0.065, 0.85, "#c49a63");
  }
  landmarks.forEach(building);
  zone = "ground";
  for (const x of [-54, 54]) {
    box(x, 0.12, 22, 15, 0.28, 18, "#d2c6a1");
    box(x, 0.29, 22, 13, 0.22, 16, "#77a9a6");
    box(x, 0.58, 22, 16, 0.45, 2.1, "#b59469");
    for (const v of [-1, 1])
      box(x, 1.24, 22 + v * 1.05, 16, 0.17, 0.17, "#aa8358");
  }
  for (let i = -5; i <= 5; i++) {
    const x = i * 10.7;
    box(x, 0.72, 7, 2.6, 0.35, 0.65, "#a78157");
    box(x, 1.04, 6.74, 2.6, 0.65, 0.16, "#a78157");
  }
  // Welcome terrace descends continuously toward the main plaza.
  for (let j = 0; j < 21; j++) {
    const z = 29 + j * 0.63,
      h = 0.12 + j * 0.13;
    box(0, h / 2, z, 13, h, 0.67, "#d6d4c8");
  }
  box(0, 1.37, 44, 20, 2.74, 5.7, "#c7c8ba");
  for (const k of [-1, 1]) {
    box(k * 8.6, 4, 44, 0.27, 2.6, 0.27, "#516a6c");
    box(k * 8.6, 2.98, 44, 2.9, 0.51, 4.6, "#799069");
  }
  for (const xx of [-46, 0, 46]) {
    box(xx, 0.02, -36, 34, 0.15, 31, "#d3d3c4");
  }
  for (const x of [-70, 69]) box(x, 0.01, -34, 5, 0.12, 61, "#667678");
  return chunks;
}
