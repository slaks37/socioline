import * as T from "three";
import type { FaceDesign } from "../engine/avatar";

type Sculpt = {
  jaw: number;
  cheek: number;
  eyeSpacing: number;
  eyeTilt: number;
  browArch: number;
  nose: number;
  mouth: number;
};

// Individual portrait sculpts; each can be combined with either base and any palette.
const sculpts: Record<FaceDesign, Sculpt> = {
  sari: {
    jaw: 0.92,
    cheek: 0.97,
    eyeSpacing: 42,
    eyeTilt: 2,
    browArch: 4,
    nose: 0.91,
    mouth: 0.91,
  },
  toba: {
    jaw: 1.16,
    cheek: 1.03,
    eyeSpacing: 46,
    eyeTilt: 0,
    browArch: 2,
    nose: 1.09,
    mouth: 1.03,
  },
  ranah: {
    jaw: 0.83,
    cheek: 1.01,
    eyeSpacing: 40,
    eyeTilt: 3,
    browArch: 6,
    nose: 1.03,
    mouth: 0.97,
  },
  baliem: {
    jaw: 1.04,
    cheek: 1.07,
    eyeSpacing: 44,
    eyeTilt: 1,
    browArch: 3,
    nose: 0.96,
    mouth: 1.13,
  },
};
const skull = [
  // vertical fraction, half width, depth, forward offset
  [0, 0.0005, 0.001, -0.01],
  [0.06, 0.106, 0.093, -0.016],
  [0.16, 0.148, 0.142, -0.016],
  [0.31, 0.164, 0.16, -0.014],
  [0.47, 0.159, 0.159, -0.014],
  [0.57, 0.153, 0.153, -0.009],
  [0.66, 0.143, 0.14, -0.004],
  [0.78, 0.123, 0.12, 0.003],
  [0.89, 0.092, 0.085, 0.028],
  [0.96, 0.057, 0.049, 0.045],
  [1, 0.0005, 0.001, 0.051],
];
const headProfile = new T.CubicInterpolant(
  Float32Array.from(skull, ([fraction]) => fraction),
  Float32Array.from(skull.flatMap(([, ...dimensions]) => dimensions)),
  3,
);
const bell = (a: number) => Math.exp(-a * a);
export function faceGeometry(id: FaceDesign, male: boolean) {
  const s = sculpts[id],
    columns = 80,
    rows = 60;
  const pos: number[] = [],
    uv: number[] = [],
    index: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const t = row / rows,
      y = t * 200;
    const [width, depth, offset] = headProfile.evaluate(t);
    const jaw = (s.jaw - 1 + (male ? 0.09 : 0)) * bell((t - 0.8) / 0.135);
    const cheek = (s.cheek - 1) * bell((t - 0.57) / 0.13);
    for (let col = 0; col <= columns; col++) {
      const angle = (col / columns - 0.5) * Math.PI * 2;
      const x = angle * 100,
        ax = Math.abs(x);
      const arc = Math.cos(angle);
      const plane = (cx: number, cy: number, sx: number, sy: number) =>
        bell((ax - cx) / sx) * bell((y - cy) / sy);
      let z = offset + depth * arc;
      if (arc > 0) {
        // A flatter facial mask, recessed orbit, brow, malar and muzzle planes.
        z += 0.023 * Math.sin(angle) ** 2 * arc;
        z +=
          0.011 * plane(65, 116, 25, 17) -
          0.01 * plane(s.eyeSpacing, 100, 21, 8);
        z += (male ? 0.012 : 0.009) * plane(40, 86, 29, 7);
        z +=
          0.029 * plane(0, 110, 10, 19) +
          0.04 * plane(0, 125, 11 * s.nose, 7.5);
        z += 0.017 * plane(12 * s.nose, 128, 6.5, 4.5);
        z += 0.008 * plane(0, 148, 32, 11) + 0.009 * plane(0, 157, 18, 3.4);
        z += 0.012 * plane(0, 179, 25, 8);
      }
      pos.push(
        Math.sin(angle) * width * (1 + jaw + cheek),
        (0.51 - t) * (male ? 0.416 : 0.4),
        z,
      );
      uv.push(col / columns, 1 - t);
      if (row && col) {
        const d = row * (columns + 1) + col,
          a = d - columns - 2;
        index.push(a, d - 1, d, a, d, a + 1);
      }
    }
  }
  const result = new T.BufferGeometry();
  result.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  result.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  result.setIndex(index);
  result.computeVertexNormals();
  return result;
}

export function faceTexture(id: FaceDesign, male: boolean, skin: string) {
  const s = sculpts[id],
    canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(
    canvas.width / (200 * Math.PI),
    0,
    0,
    canvas.height / 200,
    canvas.width / 2,
    0,
  );
  const shape = (d: string, color: string) => {
    ctx.fillStyle = color;
    ctx.fill(new Path2D(d));
  };
  const line = (d: string, color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke(new Path2D(d));
  };
  const glow = (
    x: number,
    y: number,
    rx: number,
    ry: number,
    color: string,
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, color);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  };
  const ellipse = (
    x: number,
    y: number,
    rx: number,
    ry: number,
    color: string,
  ) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  for (const sign of [-1, 1]) {
    ctx.save();
    ctx.scale(sign, 1);
    glow(61, 119, 32, 15, "rgba(173,61,54,.24)");
    glow(21, 123, 13, 9, "rgba(105,52,41,.17)");
    glow(65, 110, 28, 4, "rgba(255,213,158,.16)");
    glow(85, 144, 36, 31, "rgba(94,52,42,.11)");
    ctx.translate(s.eyeSpacing, 100);
    ctx.rotate((-s.eyeTilt * Math.PI) / 180);
    ctx.scale(male ? 0.95 : 1, male ? 0.85 : 1);
    glow(0, -3, 31, 14, "rgba(98,48,43,.31)");
    line("M-20 -4 Q0 -16 23 -6", "rgba(88,48,41,.48)", 0.85);
    const eye = new Path2D(
      "M-24 2 Q-2 -11 21 -4 L25 -5 Q14 5 2 6 Q-11 7 -24 2Z",
    );
    ctx.save();
    ctx.clip(eye);
    ctx.fillStyle = "#eadbc9";
    ctx.fillRect(-26, -12, 54, 24);
    glow(3, 5, 24, 7, "#fff5e6");
    ellipse(0, -0.3, 8.8, 7.8, "#32251e");
    ellipse(0, 0, 7.4, 6.6, "#664937");
    glow(0, 3, 7, 3.7, "#bc8a59");
    ellipse(0, -0.8, 4.1, 4.2, "#2a201e");
    ellipse(-2.9 * sign, -2.85, 2.1, 1.5, "#fff8e9");
    ellipse(2.6 * sign, 2.8, 0.9, 0.7, "#dfba93");
    ctx.restore();
    shape("M-24 2 Q-2 -12 21 -5 L28 -8 Q25 -4 22 -3 Q-1 -9 -24 2Z", "#463029");
    line("M4 6 Q15 5 21 -1", "rgba(83,51,42,.63)", 0.75);
    line("M-17 7 Q-6 10 8 8", "rgba(255,222,182,.33)", 1.0);
    // Tapered brow with individual edge strokes.
    ctx.translate(0, -12 - s.browArch / 2);
    ctx.rotate(0.07);
    shape(
      `M-23 0 Q-12 -4 4 ${-4 - s.browArch} Q17 -7 27 -2 Q14 -5 5 -4 Q-15 2 -22 3Z`,
      male ? "#563a2d" : "#644332",
    );
    for (let i = 0; i < 7; i++) {
      line(`M${-22 + i * 2} ${2 - i * 0.3} l3 -3.3`, "rgba(64,43,35,.45)", 0.7);
    }
    ctx.restore();
    ctx.save();
    ctx.scale(sign * s.nose, 1);
    shape(
      "M5 129 Q10 125.5 15 128 Q14 130 11 130 Q8 130.3 5 129Z",
      "rgba(92,48,41,.74)",
    );
    line("M15 124 Q20 128 16 130", "rgba(110,59,45,.38)", 0.75);
    ctx.restore();
  }
  glow(0, 120.5, 9, 5, "rgba(255,219,177,.40)");
  glow(0, 130, 13, 2.9, "rgba(114,61,46,.28)");
  glow(0, 139, 4.5, 6.5, "rgba(107,54,42,.15)");
  ctx.save();
  ctx.translate(0, 150);
  ctx.scale(s.mouth, male ? 0.78 : 1.0);
  shape(
    "M-27 -1 Q-17 -2 -7 -4.5 Q-3 -5.5 0 -3 Q3 -5.5 7 -4.5 Q18 -2 27 -1 Q17 2 0 2 Q-13 2 -27 -1Z",
    "rgba(126,58,54,.77)",
  );
  shape(
    "M-27 -1 Q-7 2 0 1 Q12 2 27 -1 Q17 6 4 7 Q-13 8 -27 -1Z",
    "rgba(191,98,90,.64)",
  );
  line("M-27 -1 Q-17 0 -6 1 Q0 2 6 1 Q15 0 27 -1", "rgba(93,47,42,.87)", 0.94);
  glow(0, 4.6, 13, 1.6, "rgba(255,193,164,.5)");
  ctx.restore();
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}
