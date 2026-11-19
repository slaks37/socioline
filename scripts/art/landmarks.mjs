import { kit, stone, metal, tau } from "./kit.mjs";
const wood = "#9b6948",
  warm = "#f0d7ae",
  glass = "glass";
async function library() {
  const { box, ball, cyl, beam, ribbon, planter, seat, save } = kit();
  const point = (a, r, h) => [Math.sin(a) * r, h, Math.cos(a) * r * 0.81];
  cyl("#ddd6c4", 0, 0.04, 0, 14, 0.08, 11.35);
  // Three elliptical galleries surround a full-height void. The entrance faces south.
  for (let f = 0; f < 3; f++) {
    const y = 0.08 + f * 3.8,
      r = 12.8 + Math.sin(f * 1.6) * 1.2;
    if (f > 0) {
      ribbon(stone, 7.4, r, y, 0.38, 0.55, tau - 0.55, 0.81);
      ribbon("light", 7.38, 7.48, y - 0.28, 0.06, 0.55, tau - 0.55, 0.81);
      ribbon("glass", 7.4, 7.43, y + 0.87, 0.8, 0.55, tau - 0.55, 0.81);
      ribbon(metal, 7.38, 7.47, y + 0.93, 0.06, 0.55, tau - 0.55, 0.81);
    }
    for (let j = 0; j < 36; j++) {
      let a = ((j + 0.5) * tau) / 36;
      if (f === 0 && (a < 0.32 || a > tau - 0.32)) continue;
      const p = point(a, r, y),
        q = point(a + tau / 36, r, y),
        len = Math.hypot(q[0] - p[0], q[2] - p[2]);
      const rot = Math.atan2(-(q[2] - p[2]), q[0] - p[0]);
      box(
        glass,
        (q[0] + p[0]) / 2,
        y + 1.84,
        (q[2] + p[2]) / 2,
        len - 0.04,
        3.58,
        0.07,
        rot,
      );
      beam(metal, p, point(a, r, y + 3.77), 0.055);
      if (j % 2 === 0) beam(metal, p, point(a + tau / 18, r, y + 3.77), 0.075);
      if (j % 2 === 1) beam(metal, p, point(a - tau / 18, r, y + 3.77), 0.075);
    }
    ribbon(stone, r - 0.36, r + 0.2, y + 3.76, 0.28, 0, tau, 0.81);
    // Shelves and individual book spines on the rear arc, visible through the façade.
    for (let j = 0; j < 11; j++) {
      const a = 1.65 + j * 0.29,
        p = point(a, r - 1.3, y),
        rot = a;
      for (let level = 0; level < 4; level++) {
        box(wood, p[0], y + 0.3 + level * 0.57, p[2], 2.6, 0.09, 0.62, rot);
        for (let n = 0; n < 11; n++) {
          const off = (n - 5) * 0.208;
          box(
            ["#38574f", "#936447", "#d0b681", "#667785", "#926d63"][
              (j + level + n) % 5
            ],
            p[0] + Math.cos(rot) * off,
            y + 0.57 + level * 0.57,
            p[2] - Math.sin(rot) * off,
            0.175,
            0.38 + (n % 3) * 0.045,
            0.42,
            rot,
          );
        }
      }
    }
  }
  for (const side of [-1, 1]) {
    for (let j = 0; j < 16; j++) {
      const a = 0.68 + j * 0.112,
        r = 9.6;
      const p = point(a, r, 0.09 + (3.8 * j) / 16);
      const q = point(a + 0.112, r, 0.09 + (3.8 * (j + 1)) / 16);
      beam(
        metal,
        [p[0] * side, p[1] + 1, p[2]],
        [q[0] * side, q[1] + 1, q[2]],
        0.055,
      );
      beam(
        metal,
        [p[0] * side, p[1], p[2]],
        [p[0] * side, p[1] + 1, p[2]],
        0.03,
      );
    }
    ribbon(
      stone,
      8.4,
      10.9,
      side === 1 ? 0.1 : 3.9,
      0.17,
      side === 1 ? 0.68 : tau - 2.472,
      side === 1 ? 2.472 : tau - 0.68,
      0.81,
      side === 1 ? 3.8 : -3.8,
      0,
      0,
    );
  }
  ribbon("#788f92", 8.4, 12.65, 11.58, 0.26, 0, tau, 0.81);
  for (let j = 0; j < 20; j++)
    beam(metal, point((j * tau) / 20, 12.8, 11.55), [0, 13.25, 0], 0.065);
  ball("glass", 0, 11.58, 0, 12.5, 2.85, 10);
  for (let j = 0; j < 24; j++) {
    const a = (j * tau) / 24;
    for (let k = 0; k < 7; k++) {
      const t = (k * Math.PI) / 14,
        u = ((k + 1) * Math.PI) / 14;
      const arch = (b) => [
        Math.sin(a) * 12.5 * Math.cos(b),
        11.58 + 2.85 * Math.sin(b),
        Math.cos(a) * 10 * Math.cos(b),
      ];
      beam(metal, arch(t), arch(u), 0.043);
    }
  }
  for (let f = 1; f <= 2; f++) {
    for (let k = 0; k < 54; k++) {
      const a = 0.6 + k * 0.095;
      const u = point(a, 7.75, 3.8 * f - 0.33),
        v = point(a, 11.65, 3.8 * f - 0.33);
      beam(wood, u, v, 0.055);
    }
  }
  for (const side of [-1, 1]) {
    for (let j = 0; j < 4; j++) {
      const x = side * (2.4 + j * 0.67),
        z = -5.7;
      ball("#b39274", x, 0.59, z, 0.38, 0.18, 0.38);
      ball("#907767", x, 0.89, z - 0.29, 0.36, 0.35, 0.14);
      cyl(metal, x, 0.33, z, 0.095, 0.55);
    }
  }
  planter(-3, 0.1, -2, 1.2);
  for (const x of [-5.5, 5.5]) {
    cyl(warm, x, 0.79, -3, 1.24, 0.12);
    cyl(metal, x, 0.4, -3, 0.12, 0.8);
    seat(x, 0, -1.5);
    seat(x, 0, -4.6);
  }
  for (let f = 0; f < 3; f++) {
    for (let j = 0; j < 28; j++) {
      const a = (j * tau) / 28;
      const r = 11.5;
      const [x, y, z] = point(a, r, 3.42 + f * 3.8);
      cyl("light", x, y, z, 0.11, 0.09);
      if (f > 0 && j % 4 === 0 && a > 0.55 && a < tau - 0.55) {
        const v = point(a, 9.7, 0.17 + f * 3.8);
        seat(...v, a);
      }
    }
  }
  for (let j = 0; j < 26; j++) {
    const a = 1.62 + j * 0.115;
    const p = point(a, 12.65, 0.2);
    beam(wood, p, [p[0], 11.4, p[2]], 0.086);
  }
  for (let j = 0; j < 6; j++) {
    const a = (j * tau) / 6;
    const p = point(a, 4.7, 0.23);
    cyl("#b39163", p[0], 0.26, p[2], 0.12, 0.05);
  }
  box(metal, 0, 1.02, 3.6, 1.25, 1.93, 0.34);
  box("#547e88", 0, 1.45, 3.79, 1.12, 0.7, 0.04);
  box("light", 0, 1.9, 3.79, 1.12, 0.05, 0.04);
  for (const k of [-1, 1]) {
    box(wood, k * 2.5, 1.7, 10.35, 0.25, 3.4, 0.52);
    box("light", k * 2.25, 1.64, 10.67, 0.07, 3.1, 0.08);
  }
  box(stone, 0, 3.53, 10.38, 5.5, 0.4, 1.35);
  await save("grand-library");
}
async function discovery() {
  const { box, cyl, ball, beam, ribbon, planter, seat, save } = kit();
  cyl("#cbd5d1", 0, 0.06, 0, 15, 0.12, 12);
  for (let f = 0; f < 3; f++) {
    const y = f * 3.65;
    const r = 13.5 - f * 0.45;
    ribbon(stone, 9.4, r, y + 0.26, 0.36, 0.99, tau - 0.99, 0.84);
    ribbon("glass", 9.4, 9.46, y + 1.17, 0.88, 0.99, tau - 0.99, 0.84);
    for (let j = 0; j < 20; j++) {
      const a = 1.04 + (j * (tau - 2.08)) / 20,
        b = a + (tau - 2.08) / 20;
      const x = Math.sin(a) * r,
        z = Math.cos(a) * r * 0.84,
        X = Math.sin(b) * r,
        Z = Math.cos(b) * r * 0.84;
      beam(metal, [x, y, z], [x, y + 3.55, z], 0.1);
      box(
        "glass",
        (x + X) / 2,
        y + 1.87,
        (z + Z) / 2,
        Math.hypot(X - x, Z - z),
        3.45,
        0.095,
        Math.atan2(z - Z, X - x),
      );
    }
    ribbon(stone, 9.2, r + 0.4, y + 3.59, 0.29, 0.99, tau - 0.99, 0.84);
  }
  cyl("#3b6873", 0, 0.26, 2.8, 5.3, 0.42);
  cyl("water", 0, 0.52, 2.8, 5, 0.08);
  cyl(stone, 0, 0.69, 2.8, 2.05, 0.49);
  ball("#4a94a5", 0, 3, 2.8, 1.95, 1.95, 1.95);
  for (let j = 0; j < 11; j++) {
    const lat = (j - 5) * 0.24;
    const r = 1.96 * Math.cos(lat);
    ribbon(
      "#8cbdbf",
      r - 0.014,
      r + 0.014,
      3 + 1.96 * Math.sin(lat),
      0.025,
      0,
      tau,
      1,
      0,
      0,
      2.8,
    );
  }

  for (const k of [-1, 1]) {
    for (let j = 0; j < 21; j++)
      box(
        stone,
        k * 8,
        0.09 + j * 0.087,
        4 - j * 0.38,
        2.8,
        0.2 + j * 0.174,
        0.43,
      );
    beam(metal, [k * 9.4, 1, 4.3], [k * 9.4, 4.6, -4], 0.064);
    planter(k * 8.6, 0, 6.7, 1.12);
    seat(k * 5.5, 0, 8.2);
  }
  await save("discovery-center");
}
async function innovation() {
  const { box, cyl, ball, beam, planter, seat, save } = kit();
  for (let f = 0; f < 4; f++) {
    const y = f * 3.35,
      w = 26 - f * 3.3,
      d = 13.5 - f * 1.5,
      x = f * 0.95,
      z = -f * 0.85;
    box(stone, x, y + 0.15, z, w + 0.9, 0.38, d + 0.9);
    box("#495b5c", x, y + 1.85, z - 1, w * 0.8, 3.1, d * 0.65);
    box("glass", x, y + 1.8, z + d / 2, w, 3.15, 0.12);
    for (let side of [-1, 1]) {
      box("glass", x + (side * w) / 2, y + 1.8, z, 0.13, 3.15, d);
      for (let i = 0; i <= 8; i++)
        box(
          stone,
          x + side * (w / 2 + 0.18),
          y + 1.85,
          z - d / 2 + (d * i) / 8,
          0.31,
          3.05,
          0.14,
        );
    }
    for (let i = 0; i <= 18; i++) {
      const xx = x - w / 2 + (w * i) / 18;
      box(
        f > 1 ? stone : metal,
        xx,
        y + 1.82,
        z + d / 2 + 0.22,
        f > 1 ? 0.18 : 0.08,
        3.2,
        f > 1 ? 0.68 : 0.17,
      );
    }
    box(stone, x, y + 3.34, z, w + 1.15, 0.26, d + 0.85);
    box("#71945e", x, y + 3.54, z, w + 0.8, 0.16, d + 0.5);
    for (let i = 0; i < 13; i++) {
      const xx = x - w / 2 + ((i + 0.4) * w) / 13;
      ball(
        i % 2 ? "#6f8852" : "#98aa66",
        xx,
        y + 3.77,
        z + d / 2 - 0.13,
        0.55,
        0.42,
        0.52,
      );
    }
  }
  for (const k of [-1, 1]) {
    planter(k * 11, 0.04, 9.5, 1);
    seat(k * 7, 0.04, 10.8);
  }
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 5.6,
      z = 8.9;
    cyl(stone, x, 0.25, z, 1.65, 0.46);
    cyl(metal, x, 0.67, z, 0.42, 0.5);
    const a = [x, 0.9, z],
      b = [x - 0.5, 1.95, z],
      c = [x + 0.34, 2.36, z],
      d = [x + 0.69, 1.91, z];
    beam(stone, a, b, 0.19);
    beam(stone, b, c, 0.15);
    beam(metal, c, d, 0.08);
    for (const p of [a, b, c]) ball(metal, ...p, 0.21, 0.21, 0.21);
  }
  await save("innovation-campus");
}
await library();
await discovery();
await innovation();
async function plaza() {
  const { ribbon, beam, ball, cyl, box, planter, seat, save } = kit();
  // A folded bronze ribbon marks the crossing of the city's three pedestrian routes.
  for (let i = 0; i < 110; i++) {
    const t = (i * tau) / 110,
      u = ((i + 1) * tau) / 110,
      at = (a) => [
        2.55 * Math.sin(a),
        4.3 + 2.6 * Math.sin(2 * a + 0.3),
        0.93 * Math.cos(a),
      ];
    beam("#987e54", at(t), at(u), 0.245);
    const p = at(t),
      q = at(u);
    beam(
      "#e4c48d",
      [p[0], p[1] + 0.17, p[2]],
      [q[0], q[1] + 0.17, q[2]],
      0.105,
    );
  }
  cyl("#a59d8b", 0, 0.66, 0, 3.7, 0.28);
  cyl(stone, 0, 0.91, 0, 3, 0.28);
  cyl("#354b51", 0, 1.22, 0, 1.96, 0.38);
  for (let j = 0; j < 4; j++) {
    const a = (j * tau) / 4 + 0.36;
    ribbon(stone, 7.1, 8.6, 0.52, 0.39, a, a + 1.02);
    ribbon("#729051", 7.23, 8.5, 0.6, 0.1, a, a + 1.02);
    for (let k = 0; k < 13; k++) {
      const t = a + 0.035 + k * 0.077,
        r = 7.8 + 0.14 * Math.sin(k);
      ball(
        ["#7a955e", "#849563", "#a58c91"][k % 3],
        Math.sin(t) * r,
        0.8,
        Math.cos(t) * r,
        0.26,
        0.32,
        0.26,
      );
    }
  }
  for (let j = 0; j < 4; j++) {
    const a = (j * tau) / 4 + 0.87;
    seat(6.8 * Math.sin(a), 0.14, 6.8 * Math.cos(a), a);
  }
  await save("plaza");
}
await plaza();
