import * as T from "three";

type Portrait = "gentle" | "bright" | "laugh" | "wink" | "smirk" | "calm";
const expressions: Record<string, [Portrait[], Portrait[]]> = {
  indonesia: [
    ["gentle", "calm", "wink", "laugh", "smirk", "smirk"],
    ["gentle", "bright", "laugh", "calm", "wink", "gentle"],
  ],
  tiongkok: [
    ["gentle", "gentle", "wink", "laugh", "smirk", "calm"],
    ["gentle", "bright", "laugh", "calm", "wink", "gentle"],
  ],
  amerika: [
    ["gentle", "calm", "laugh", "wink", "smirk", "smirk"],
    ["gentle", "bright", "wink", "calm", "laugh", "gentle"],
  ],
  afrika: [
    ["gentle", "calm", "wink", "laugh", "smirk", "laugh", "smirk"],
    ["gentle", "bright", "laugh", "calm", "wink", "smirk"],
  ],
  australia: [
    ["gentle", "gentle", "laugh", "wink", "smirk", "gentle"],
    ["gentle", "bright", "laugh", "calm", "wink", "smirk"],
  ],
};

// Cross-sections progress from the crown through the cheeks to the pointed chin.
const rings = [
  [0, 0.001, 0.001, -0.02],
  [0.09, 0.12, 0.115, -0.02],
  [0.23, 0.159, 0.157, -0.016],
  [0.38, 0.166, 0.167, -0.012],
  [0.53, 0.165, 0.158, -0.005],
  [0.625, 0.157, 0.145, 0.001],
  [0.71, 0.14, 0.129, 0.011],
  [0.82, 0.106, 0.103, 0.023],
  [0.935, 0.053, 0.058, 0.037],
  [1, 0.001, 0.001, 0.05],
];
const profile = new T.CubicInterpolant(
  Float32Array.from(rings, (r) => r[0]),
  Float32Array.from(rings.flatMap((r) => r.slice(1))),
  3,
);
const bell = (x: number) => Math.exp(-x * x);

export function faceGeometry(female: boolean, index: number) {
  const columns = 72,
    rows = 50;
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    const [rx, rz, offset] = profile.evaluate(v);
    const jaw =
      (female ? -0.045 : 0.035) +
      [0, -0.025, 0.025, -0.01, 0.055, -0.035, 0.03][index % 7];
    for (let col = 0; col <= columns; col++) {
      const u = col / columns,
        angle = (u - 0.5) * 2 * Math.PI,
        c = Math.cos(angle),
        s = Math.sin(angle);
      const front = Math.max(c, 0),
        lateral = Math.abs(angle);
      // A broad plane across both eyes and a continuous nose bridge give an illustrated profile.
      const mask = 0.028 * s * s * front;
      const bridge = 0.028 * bell(lateral / 0.125) * bell((v - 0.58) / 0.094);
      const nose = 0.028 * bell(lateral / 0.132) * bell((v - 0.64) / 0.038);
      const cheek =
        0.008 * bell((lateral - 0.68) / 0.26) * bell((v - 0.625) / 0.095);
      const muzzle = 0.009 * bell(lateral / 0.37) * bell((v - 0.76) / 0.073);
      positions.push(
        s * rx * (1 + jaw * bell((v - 0.79) / 0.16)),
        (0.51 - v) * (female ? 0.407 : 0.419),
        offset + rz * c + mask + bridge + nose + cheek + muzzle,
      );
      uvs.push(u, 1 - v);
      if (row && col) {
        const d = row * (columns + 1) + col,
          a = d - columns - 2;
        indices.push(a, d - 1, d, a, d, a + 1);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute("normal"),
    shades: number[] = [];
  for (let i = 0; i < normals.count; i++) {
    const amount =
      normals.getZ(i) * 0.68 + normals.getY(i) * 0.51 - normals.getX(i) * 0.36;
    const shade = T.MathUtils.smoothstep(amount, -0.1, 0.22);
    shades.push(0.77 + 0.23 * shade, 0.65 + 0.35 * shade, 0.65 + 0.35 * shade);
  }
  geometry.setAttribute("color", new T.Float32BufferAttribute(shades, 3));
  return geometry;
}

export function faceTexture(
  collection: string,
  female: boolean,
  index: number,
  skin: string,
  hairColor: string,
) {
  const expression =
    (expressions[collection] ?? expressions.indonesia)[female ? 1 : 0][index] ??
    "gentle";
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(
    canvas.width / (Math.PI * 200),
    0,
    0,
    canvas.height / 200,
    canvas.width * 0.5,
    0,
  );
  function fill(d: string, color: string | CanvasGradient) {
    ctx.fillStyle = color;
    ctx.fill(new Path2D(d));
  }
  function stroke(d: string, color: string, width: number) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke(new Path2D(d));
  }
  function ellipse(
    x: number,
    y: number,
    rx: number,
    ry: number,
    color: string | CanvasGradient,
  ) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function blush(x: number, y: number, rx: number, ry: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    grad.addColorStop(0, "rgba(241,114,112,.33)");
    grad.addColorStop(1, "rgba(234,115,115,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
  const warm = skin.toLowerCase(),
    dark = ["#583b31", "#895c43", "#70432d", "#854b2f"].includes(warm);
  const ink = dark ? "#291923" : "#392431",
    outline = dark ? "#523239" : "#91574d";
  const brow = new T.Color(hairColor)
    .lerp(new T.Color("#553127"), 0.42)
    .getStyle();
  const ember = collection === "australia" && index === 2;
  for (const sign of [-1, 1]) {
    ctx.save();
    ctx.scale(sign, 1);
    blush(68, 124, 24, 9);
    if (!female && collection === "australia" && index === 4) {
      for (let i = 0; i < 9; i++)
        ellipse(22 + i * 5.5, 123 + 2 * Math.sin(i * 4), 0.8, 0.64, "#af7659");
    }
    const eyeY = female ? 103 : 104;
    ctx.translate((female ? 44 : 42) + ((index % 3) - 1) * 1.5, eyeY);
    ctx.rotate((female ? -0.085 : -0.035) + ((index % 3) - 1) * 0.03);
    ctx.scale(female ? 1 : 0.97, female ? 1 : 0.77);
    const shut =
      expression === "laugh" || (expression === "wink" && sign === 1);
    if (shut) {
      fill(
        "M-26 4 C-14 -8 -3 -17 13 -15 Q23 -15 29 -12 Q21 -14 15 -10 Q-7 -9 -26 4Z",
        ink,
      );
      stroke("M-19 4 Q-8 1 -3 2", "rgba(162,81,72,.55)", 0.8);
    } else {
      const eye =
        "M-26 3 Q-20 -9 -8 -13 Q8 -18 24 -13 Q28 -5 24 2 Q18 13 5 14 Q-13 15 -26 3Z";
      ctx.save();
      ctx.clip(new Path2D(eye));
      const white = ctx.createLinearGradient(0, -15, 0, 15);
      white.addColorStop(0, "#d3c6ca");
      white.addColorStop(0.4, "#fff9f1");
      white.addColorStop(1, "#fffefa");
      ctx.fillStyle = white;
      ctx.fillRect(-30, -20, 65, 40);
      const iris = ctx.createLinearGradient(0, -13, 0, 14);
      iris.addColorStop(0, "#221a27");
      iris.addColorStop(0.35, "#3b2732");
      iris.addColorStop(0.67, ember ? "#8e753e" : "#92532e");
      iris.addColorStop(1, ember ? "#d7ac65" : "#e7a76d");
      ellipse(-0.3, -0.5, 12.7, 15.2, "#38232a");
      ellipse(-0.3, -0.2, 11.2, 14.1, iris);
      ellipse(-1, -1.5, 5.4, 8.6, "#2a1c26");
      stroke("M-7 9 Q-.8 14.4 7.3 8.4", "#efb882", 1.25);
      ellipse(-4.3 * sign, -7.6, 3.9, 3.3, "#fffdf0");
      ellipse(5.2 * sign, 5.7, 1.7, 1.4, "#ffebbd");
      ctx.restore();
      fill(
        "M-26 3 Q-18 -14 0 -17 Q13 -20 24 -15 Q29 -14 32 -19 Q31 -14 28 -11 Q26 -7 25 -5 Q25 -13 17 -13 Q-8 -19 -26 3Z",
        ink,
      );
      if (female) fill("M20 -15 Q27 -18 29 -21 Q28 -16 24 -13Z", ink);
      stroke("M4 14 Q18 12.5 24 2", outline, 0.85);
      stroke("M-18 -14 Q-3 -23 13 -19", "rgba(150,84,69,.51)", 1);
    }
    ctx.translate(0, shut ? -23 : -22);
    ctx.rotate(0.21);
    const raise = expression === "bright" || expression === "laugh" ? -2.4 : 0;
    fill(
      `M-22 -.5 Q-16 -4 -4 ${-4 + raise} Q12 ${-5.3 + raise} 24 -1 Q13 -3 0 -1.8 Q-14 -.2 -21 1.7Z`,
      brow,
    );
    ctx.restore();
  }
  // The nose is mostly described by its profile, with two light, offset ink marks.
  stroke("M-3.1 127 Q-2.4 129 -1.2 129.2", outline, 1.0);
  stroke("M2.2 129.1 Q3.6 128.4 3.8 127.7", "#bf8271", 0.75);
  ellipse(-1.1, 124.2, 1.6, 1.15, "rgba(255,226,204,.8)");
  ctx.translate(0, 151);
  ctx.scale(1.18, 1);
  const open = ["bright", "laugh", "wink"].includes(expression);
  if (open) {
    const mouth =
      "M-19 -3 Q-7 -.5 1 -.5 Q12 -1 19 -5 Q16 8 8 13 Q1 17 -6 12 Q-15 7 -19 -3Z";
    fill(mouth, ink);
    ctx.save();
    ctx.clip(new Path2D(mouth));
    fill(
      "M-17 -4 Q-7 2 5 0 Q15 -1 20 -5 L16 1 Q7 6 -4 5 Q-14 3 -17 -4Z",
      "#fff4e6",
    );
    ellipse(3.5, 13, 13, 6.7, "#cd7874");
    ctx.restore();
  } else {
    const lift = expression === "smirk" ? -5.5 : -3.5;
    stroke(`M-17 -1.9 Q-10 1.6 -2 2 Q8 2 17 ${lift}`, outline, 1.25);
    stroke("M-5 6 Q.5 7 5 5.8", "rgba(247,178,156,.82)", 1.1);
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}
