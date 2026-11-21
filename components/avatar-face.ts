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
  [0.82, 0.119, 0.108, 0.022],
  [0.925, 0.071, 0.07, 0.034],
  [0.977, 0.036, 0.042, 0.041],
  [1, 0.001, 0.001, 0.05],
];
const profile = new T.CubicInterpolant(
  Float32Array.from(rings, (r) => r[0]),
  Float32Array.from(rings.flatMap((r) => r.slice(1))),
  3,
);
const bell = (x: number) => Math.exp(-x * x);

export function faceGeometry(
  female: boolean,
  index: number,
  jawScale = 1,
  noseScale = 1,
) {
  const columns = 72,
    rows = 50;
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    const [rx, rz, offset] = profile.evaluate(v);
    const jaw =
      jawScale -
      1 +
      (female ? -0.042 : 0.09) +
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
      const bridge = 0.026 * bell(lateral / 0.16) * bell((v - 0.56) / 0.119);
      const nose = 0.015 * bell(lateral / 0.22) * bell((v - 0.635) / 0.05);
      const cheek =
        0.008 * bell((lateral - 0.68) / 0.26) * bell((v - 0.625) / 0.095);
      const muzzle = 0.009 * bell(lateral / 0.37) * bell((v - 0.76) / 0.073);
      positions.push(
        s * rx * (1 + jaw * bell((v - 0.79) / 0.16)),
        (0.51 - v) * (female ? 0.407 : 0.419),
        offset + rz * c + mask + (bridge + nose) * noseScale + cheek + muzzle,
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
    const shade = T.MathUtils.smoothstep(amount, 0.0, 0.58);
    shades.push(0.72 + 0.28 * shade, 0.53 + 0.47 * shade, 0.55 + 0.45 * shade);
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
  eyes = 1,
  spacing = 1,
  mouthScale = 1,
  eyeArt: CanvasImageSource,
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
    grad.addColorStop(0, "rgba(237,124,115,.20)");
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
  // Glaze the forehead, temples and cheek planes like the painted portraits.
  function glaze(x: number, y: number, rx: number, ry: number, color: string) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
  glaze(0, 95, 108, 95, "rgba(255,223,190,.20)");
  for (const side of [-1, 1]) {
    glaze(side * 88, 124, 26, 32, "rgba(185,87,74,.095)");
    glaze(side * 37, 95, 29, 11, "rgba(148,72,68,.30)");
  }
  fill(
    "M-1 115 Q-2 123 -6 127 Q-4 131 .7 131 Q-2 129 -.8 126Z",
    "rgba(162,77,65,.16)",
  );
  glaze(2, 122, 4, 8, "rgba(255,232,205,.30)");
  for (const sign of [-1, 1]) {
    ctx.save();
    ctx.scale(sign, 1);
    blush(60, 124, 29, 12);
    if (!female && collection === "australia" && index === 4) {
      for (let i = 0; i < 9; i++)
        ellipse(22 + i * 5.5, 123 + 2 * Math.sin(i * 4), 0.8, 0.64, "#af7659");
    }
    const eyeY = female ? 104 : 105;
    ctx.translate((female ? 39 : 38) * spacing + ((index % 3) - 1) * 1.5, eyeY);
    ctx.rotate((female ? -0.085 : -0.035) + ((index % 3) - 1) * 0.03);
    ctx.scale(eyes * (female ? 1.02 : 0.99), eyes * (female ? 0.93 : 0.68));
    const shut =
      expression === "laugh" || (expression === "wink" && sign === 1);
    if (shut) {
      fill(
        "M-26 4 C-14 -8 -3 -17 13 -15 Q23 -15 29 -12 Q21 -14 15 -10 Q-7 -9 -26 4Z",
        ink,
      );
      stroke("M-19 4 Q-8 1 -3 2", "rgba(162,81,72,.55)", 0.8);
    } else {
      // Independent mirrored decals preserve the painted lash and iris detail
      // while letting both the width and spacing controls act before projection.
      const height = female ? 37 : 29;
      ctx.save();
      if (ember) ctx.filter = "hue-rotate(10deg)";
      ctx.drawImage(eyeArt, -27, -height * 0.62, 55, height);
      ctx.restore();
      stroke("M-20 -9 Q-8 -20 9 -17", "rgba(147,78,66,.54)", 1.1);
    }
    ctx.translate(0, shut ? -23 : -22);
    ctx.rotate(female ? 0.08 : -0.1);
    const raise = expression === "bright" || expression === "laugh" ? -2.4 : 0;
    ctx.scale(1.06, female ? 1.15 : 1.85);
    fill(
      `M-22 -.5 Q-16 -4 -4 ${-4 + raise} Q12 ${-5.3 + raise} 24 -1 Q13 -3 0 -1.8 Q-14 -.2 -21 1.7Z`,
      brow,
    );
    ctx.restore();
  }
  // The nose is mostly described by its profile, with two light, offset ink marks.
  stroke("M-3.1 127 Q-2.4 129 -1.2 129.2", outline, 1.0);
  stroke("M2.2 129.1 Q3.6 128.4 3.8 127.7", "#bf8271", 0.75);

  ctx.translate(0, 150);
  ctx.scale(1.18 * mouthScale, 1);
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
    fill(
      `M-18 -.6 Q-7 1 0 .4 Q7 .4 17 ${lift} Q11 5 1 6 Q-9 6 -18 -.6Z`,
      female ? "rgba(200,100,94,.43)" : "rgba(190,111,95,.24)",
    );
    stroke(`M-18 -.6 Q-9 1.6 -2 1.7 Q8 1.8 17 ${lift}`, outline, 1.6);
    stroke("M-5 6 Q.5 7 5 5.8", "rgba(247,178,156,.82)", 1.1);
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}
