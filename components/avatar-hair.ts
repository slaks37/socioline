import * as T from "three";

type Point = [number, number, number];
const tau = Math.PI * 2;
const ease = T.MathUtils.smoothstep;

// A solid cap, overlapping tapered locks and their ink and gloss bands share one draw.
export function hairGeometry(style: string, color: string, female: boolean) {
  const pos: number[] = [],
    rgb: number[] = [],
    index: number[] = [];
  const base = new T.Color(color);
  const dark = base.clone().lerp(new T.Color("#1b1327"), 0.62);
  const mid = base.clone().lerp(new T.Color("#67474a"), 0.13);
  const light = base.clone().lerp(new T.Color("#d5a187"), 0.39);
  const shade = new T.Color();
  function vertex(x: number, y: number, z: number, tone: number) {
    pos.push(x, y, z);
    if (tone <= 0.53) shade.lerpColors(dark, mid, Math.max(0, tone / 0.53));
    else shade.lerpColors(mid, light, Math.min(1, (tone - 0.53) / 0.47));
    rgb.push(shade.r, shade.g, shade.b);
  }
  function stitch(start: number, rows: number, cols: number) {
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const a = start + j * (cols + 1) + i,
          b = a + 1,
          c = a + cols + 1,
          d = c + 1;
        index.push(a, c, d, a, d, b);
      }
  }
  const long = style === "Waves",
    bob = style === "Bob",
    tousled = style === "Tousled" || style === "Crop",
    sidePart = style === "Side part";
  const coiled = style === "Curls" || style === "Afro",
    braided = ["Braids", "Locs", "Braided bun"].includes(style);
  const tied = ["Bun", "Braided bun", "Ponytail"].includes(style);
  const buzz = style === "Buzz";
  const scalp = (a: number, p: number, inflate = 0): Point => [
    (0.184 + inflate) * Math.sin(p) * Math.sin(a),
    0.011 + (0.221 + inflate) * Math.cos(p),
    -0.017 + (0.183 + inflate) * Math.sin(p) * Math.cos(a),
  ];
  function ribbon(
    points: Point[],
    width: number,
    thickness: number,
    roll = 0,
    highlight = 1,
    rootWidth = 0.36,
  ) {
    const path = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p)));
    const rows = Math.max(12, (points.length - 1) * 5),
      cols = 10,
      start = pos.length / 3;
    for (let j = 0; j <= rows; j++) {
      const t = j / rows,
        p = path.getPoint(t),
        tangent = path.getTangent(t);
      const outward = new T.Vector3(p.x, p.y * 0.42, p.z + 0.017).normalize();
      const side = new T.Vector3().crossVectors(tangent, outward);
      if (side.lengthSq() < 0.0001) side.set(1, 0, 0);
      side.normalize().applyAxisAngle(tangent, roll);
      const normal = new T.Vector3().crossVectors(side, tangent).normalize();
      const taper =
        (rootWidth + (1 - rootWidth) * Math.sin(Math.PI * t * 0.95) ** 0.6) *
        Math.max(0.014, 1 - ease(t, 0.65, 1));
      for (let i = 0; i <= cols; i++) {
        const angle = (tau * i) / cols,
          s = Math.sin(angle),
          c = Math.cos(angle);
        const pt = p
          .clone()
          .addScaledVector(side, s * width * taper)
          .addScaledVector(normal, c * thickness * taper);
        // One broad reflected band and a finer stroke run down the curved lock.
        const glint =
          highlight *
          (Math.max(0, 1 - Math.abs(t - 0.38 + s * 0.09) * 4.6) * 0.23 +
            0.15 * Math.max(0, 1 - Math.abs(s + 0.42) * 3));
        const tone = c <= 0 ? 0.07 : 0.2 + 0.39 * c + glint;
        vertex(pt.x, pt.y, pt.z, tone);
      }
    }
    stitch(start, rows, cols);
  }
  function cap() {
    const rows = 29,
      cols = 104;
    for (let j = 0; j <= rows; j++) {
      const t = j / rows;
      for (let i = 0; i <= cols; i++) {
        const a = tau * (i / cols - 0.5),
          side = ease(Math.abs(a), 0.5, 1.47),
          rear = ease(Math.abs(a), 1.28, 2.7);
        const edge =
          (buzz || coiled || braided || tied ? 1.02 : 1.1) +
          0.81 * side +
          0.37 * rear +
          0.024 * Math.cos(9 * a);
        const p = t * edge;
        const [x, y, z] = scalp(a, p, buzz ? -0.002 : 0);
        const channel =
          a * (braided ? 33 : 20) + (1 - t) ** 2 * (sidePart ? 5.5 : 3.1);
        const lines = Math.cos(channel),
          shine = Math.max(
            0,
            1 - Math.abs(p - 0.89 - 0.14 * Math.cos(a - 1)) * 4.5,
          );
        const tone = buzz
          ? 0.46 + 0.1 * Math.sin(i * 91 + j * 15) ** 2
          : 0.34 + 0.14 * lines + 0.21 * shine + 0.08 * Math.cos(a + 1.1);
        vertex(x, y, z, tone);
      }
    }
    stitch(0, rows, cols);
  }
  cap();
  if (long) {
    // Wavy mane with a continuous lining, so even a rear camera sees a filled silhouette.
    const rows = 32,
      cols = 66,
      start = pos.length / 3;
    function wavePoint(a: number, t: number, layer: number): Point {
      const sweep = a + 0.1 * Math.sin(8 * t + a) * Math.sin(Math.PI * t);
      const side = Math.abs(Math.sin(sweep)),
        tail = ease(t, 0.21, 0.65);
      const r =
        0.155 +
        0.022 * Math.sin(Math.PI * t) +
        tail * (0.045 + 0.036 * Math.sin(t * 10.6 + a * 0.6));
      const drop = 0.36 + 0.04 * Math.cos(a * 3.4) + 0.018 * Math.cos(a * 8.3);
      return [
        Math.sin(sweep) * (r + layer),
        0.127 - (0.127 + drop) * t,
        -0.025 +
          Math.cos(sweep) * (r + layer) +
          tail * (0.025 * Math.sin(9 * t + a) + 0.035 * side),
      ];
    }
    for (let j = 0; j <= rows; j++)
      for (let i = 0; i <= cols; i++) {
        const u = i / cols,
          t = j / rows;
        const theta = 0.96 + u * (tau - 1.92),
          a = theta + 0.05 * Math.sin((t - 0.2) * 6 + theta);
        const [x, y, z] = wavePoint(a, t, 0);
        const lock = Math.cos(18 * theta + 0.8 * Math.sin(t * 7 + theta));
        vertex(
          x,
          y + 0.026 * ease(t, 0.72, 1) * lock,
          z,
          0.25 + 0.11 * lock + 0.12 * Math.cos(5 * t + a),
        );
      }
    stitch(start, rows, cols);
    for (let i = 0; i < 16; i++) {
      const a = 0.98 + (i / 15) * (tau - 1.96);
      const pts: Point[] = Array.from({ length: 10 }, (_, j) => {
        const t = j / 9;
        const p = wavePoint(a + 0.085 * Math.sin(t * 8.6 + i * 0.34), t, 0.012);
        p[1] -= 0.04 * ease(t, 0.73, 1) * (1 + Math.sin(i * 2.3));
        return p;
      });
      ribbon(
        pts,
        0.034 + (0.5 + 0.5 * Math.cos(i * 3)) * 0.008,
        0.012,
        0.21 * Math.sin(i),
        1,
        0.95,
      );
    }
    // The two front locks turn towards the chest, then turn out and back at their tips.
    for (const side of [-1, 1]) {
      ribbon(
        [
          [side * 0.066, 0.194, 0.093],
          [side * 0.141, 0.125, 0.144],
          [side * 0.167, 0.027, 0.129],
          [side * 0.157, -0.071, 0.15],
          [side * 0.182, -0.146, 0.158],
          [side * 0.219, -0.211, 0.132],
          [side * 0.221, -0.279, 0.116],
          [side * 0.182, -0.338, 0.134],
          [side * 0.191, -0.39, 0.147],
        ],
        0.034,
        0.013,
        side * 0.3,
        1,
        0.65,
      );
      ribbon(
        [
          [side * 0.098, 0.166, 0.101],
          [side * 0.163, 0.083, 0.117],
          [side * 0.183, -0.034, 0.101],
          [side * 0.182, -0.121, 0.115],
          [side * 0.24, -0.211, 0.103],
          [side * 0.247, -0.279, 0.076],
          [side * 0.223, -0.306, 0.073],
        ],
        0.023,
        0.01,
        -side * 0.2,
        1,
      );
    }
    // Asymmetrical curtain fringe sweeping away from the face from one part.
    ribbon(
      [
        [0.049, 0.214, 0.052],
        [0.018, 0.194, 0.118],
        [-0.068, 0.152, 0.165],
        [-0.123, 0.096, 0.145],
        [-0.15, 0.06, 0.119],
      ],
      0.049,
      0.014,
      -0.1,
    );
    ribbon(
      [
        [0.059, 0.217, 0.042],
        [0.016, 0.209, 0.102],
        [-0.069, 0.18, 0.149],
        [-0.136, 0.119, 0.132],
        [-0.157, 0.086, 0.114],
      ],
      0.038,
      0.012,
      -0.2,
    );
    ribbon(
      [
        [0.056, 0.209, 0.061],
        [0.088, 0.18, 0.108],
        [0.119, 0.13, 0.153],
        [0.157, 0.084, 0.126],
        [0.178, 0.05, 0.096],
      ],
      0.04,
      0.013,
      0.22,
    );
  }
  if (bob || tousled || sidePart || (tied && !braided)) {
    // Sweep the part across the crown; points on both sides converge on separate tips.
    const count = tousled ? 15 : 20;
    for (let i = 0; i < count; i++) {
      const a = -Math.PI + (tau * (i + 0.5)) / count,
        abs = Math.abs(a);
      const perimeter = ease(abs, 0.58, 1.45),
        back = ease(abs, 1.5, 2.7);
      const sweep = sidePart ? 0.57 : tied ? 0.63 : 0.41;
      const wave = Math.sin(i * 4.13);
      const end =
        (tied ? 0.91 : 1.37) +
        0.75 * perimeter +
        0.31 * back +
        (tousled ? 0.11 : 0.045) * wave;
      const drift =
        (sidePart ? -0.54 : Math.sin(a + 0.45) * -0.35) + 0.07 * wave;
      const length = tied
        ? 0
        : (long ? 0.4 : bob ? 0.13 : tousled ? 0.045 : 0.04) * perimeter;
      const points: Point[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6,
          p = 0.2 + (Math.min(end, 2.15) - 0.2) * t;
        const angle = a + drift * (1 - t) + sweep * Math.sin(Math.PI * t);
        const [x, y, z] = scalp(
          angle,
          p,
          0.005 + 0.012 * Math.sin(Math.PI * t),
        );
        const tail = ease(t, 0.55, 1),
          endFlip = (tousled ? 0.042 : long ? 0.032 : 0.015) * tail;
        points.push([
          x +
            Math.sin(a) *
              (endFlip + (long ? 0.021 * Math.sin(9 * t + i) : 0) * tail),
          y - length * tail,
          z + Math.cos(a) * endFlip - (long ? 0.035 * back * tail : 0),
        ]);
      }
      ribbon(
        points,
        tied ? 0.021 : tousled ? 0.046 : 0.041,
        tousled ? 0.015 : 0.011,
        ((i % 3) - 1) * 0.13,
        1,
      );
    }
    if (!tied) {
      // Layered face-framing bangs. The sloping tips leave both pupils uncovered.
      const bangs: Point[][] = [
        [
          [-0.042, 0.211, 0.025],
          [-0.009, 0.206, 0.09],
          [0.042, 0.164, 0.152],
          [0.068, 0.106, 0.176],
          [0.036, 0.065, 0.174],
        ],
        [
          [-0.037, 0.207, 0.044],
          [-0.068, 0.175, 0.119],
          [-0.105, 0.116, 0.155],
          [-0.125, 0.061, 0.15],
          [-0.152, 0.022, 0.114],
        ],
        [
          [-0.018, 0.217, 0.017],
          [0.041, 0.205, 0.083],
          [0.093, 0.145, 0.136],
          [0.129, 0.094, 0.145],
          [0.149, 0.072, 0.115],
        ],
        [
          [-0.065, 0.196, 0.053],
          [-0.109, 0.155, 0.106],
          [-0.149, 0.089, 0.118],
          [-0.165, 0.024, 0.093],
          [-0.145, -0.019, 0.103],
        ],
      ];
      bangs.forEach((points, i) => {
        const delta = sidePart ? 0.024 : 0;
        const path: Point[] = points.map(([x, y, z], j) => [
          x + delta * (1 - j / 4),
          y + (tousled ? 0.012 * Math.sin(j + i) : 0),
          z + 0.005,
        ]);
        ribbon(path, i === 0 ? 0.047 : 0.037, 0.012, i % 2 ? 0.12 : -0.1, 1);
      });
      if (tied && !braided) {
        ribbon(
          [
            [0.015, 0.22, 0.045],
            [-0.042, 0.205, 0.111],
            [-0.121, 0.139, 0.149],
            [-0.163, 0.065, 0.123],
            [-0.138, 0.006, 0.124],
          ],
          0.03,
          0.011,
          -0.2,
        );
        ribbon(
          [
            [0.016, 0.22, 0.03],
            [0.078, 0.196, 0.1],
            [0.142, 0.123, 0.13],
            [0.171, 0.042, 0.104],
            [0.154, -0.021, 0.1],
          ],
          0.028,
          0.012,
          0.2,
        );
      }
      if (tousled) {
        // Flyaways break the silhouette at the part and temples.
        ribbon(
          [
            [-0.04, 0.18, 0.025],
            [0.012, 0.248, -0.005],
            [0.059, 0.243, -0.05],
            [0.084, 0.208, -0.04],
          ],
          0.02,
          0.008,
        );
        for (const side of [-1, 1]) {
          ribbon(
            [
              [side * 0.092, 0.171, -0.06],
              [side * 0.167, 0.125, -0.054],
              [side * 0.205, 0.105, -0.089],
              [side * 0.212, 0.132, -0.11],
            ],
            0.029,
            0.012,
          );
          ribbon(
            [
              [side * 0.116, 0.1, -0.108],
              [side * 0.176, 0.051, -0.102],
              [side * 0.207, 0.015, -0.125],
            ],
            0.027,
            0.012,
          );
        }
      }
    }
  }
  function coilShell() {
    // Rounded interlocking lobes produce the silhouette of tight natural curls.
    // Individual highlights follow each curl without using a stack of torus meshes.
    const afro = style === "Afro",
      rings = afro ? 7 : 6;
    for (let r = 0; r < rings; r++) {
      const count = 3 + r * 5;
      for (let i = 0; i < count; i++) {
        const a = (tau * (i + r * 0.41)) / count,
          variation = Math.sin(i * 7.13 + r * 3.4);
        const end = 1.2 + ((0.87 + (afro ? 0.14 : 0)) * (1 - Math.cos(a))) / 2;
        const p = 0.13 + (r / (rings - 1)) * end + variation * 0.045;
        const [cx, cy, cz] = scalp(a, p, afro ? 0.038 : 0.012);
        const radius = (afro ? 0.052 : 0.038) * (1 + variation * 0.11),
          start = pos.length / 3,
          n = 10,
          m = 7;
        for (let j = 0; j <= m; j++)
          for (let k = 0; k <= n; k++) {
            const u = (k / n) * tau,
              v = (j / m) * Math.PI;
            const dx = Math.sin(v) * Math.sin(u),
              dy = Math.cos(v),
              dz = Math.sin(v) * Math.cos(u);
            const groove = 0.85 + 0.15 * Math.cos(u * 3 + v * 1.5 + variation),
              shade =
                0.3 +
                0.24 * Math.max(0, dy * 0.72 + dz * 0.35 - dx * 0.54) +
                0.14 * Math.max(0, Math.cos(u * 3 + v)) * Math.sin(v) ** 2;
            vertex(
              cx + dx * radius * groove,
              cy + dy * radius * 0.93,
              cz + dz * radius * groove,
              shade,
            );
          }
        stitch(start, m, n);
      }
    }
  }
  if (coiled) coilShell();
  if (braided || style === "Ponytail" || style === "Bun") {
    const bun = style === "Bun" || style === "Braided bun",
      pony = style === "Ponytail";
    // Cornrows and swept longitudinal gathers originate at the visible hairline.
    for (let i = -4; i <= 4; i++) {
      const x = i * 0.031,
        side = i / 4;
      ribbon(
        [
          [x, 0.122 + 0.012 * Math.abs(side), 0.143 - 0.043 * side ** 2],
          [x * 1.1, 0.2 - 0.039 * side ** 2, 0.091],
          [x, 0.227 - 0.037 * side ** 2, -0.004],
          [x * 0.83, 0.195, -0.106],
          [x * 0.67, 0.146, -0.154],
        ],
        braided ? 0.01 : 0.016,
        0.009,
        0,
        0.75,
      );
    }
    if (bun) {
      for (let i = 0; i < 10; i++) {
        const pts: Point[] = [];
        for (let j = 0; j <= 8; j++) {
          const t = j / 8,
            a = t * tau * 0.73 + (i * tau) / 10,
            r = 0.087 * Math.sin(t * Math.PI);
          pts.push([
            r * Math.cos(a),
            0.122 + 0.161 * t,
            -0.116 + r * Math.sin(a),
          ]);
        }
        ribbon(pts, 0.03, 0.026, 0, 1);
      }
    }
    if ((!bun || style === "Braided bun") && (female || style !== "Braids")) {
      const total = pony ? 8 : style === "Braided bun" ? 11 : 16;
      for (let i = 0; i < total; i++) {
        const a = pony
          ? Math.PI + (i / total - 0.5) * 1.8
          : 0.98 + (i / (total - 1)) * (tau - 1.96);
        const sway = Math.sin(i * 6.91),
          length = pony
            ? 0.365
            : style === "Locs"
              ? 0.24 + 0.12 * (0.5 + 0.5 * sway)
              : 0.3 + 0.095 * (0.5 + 0.5 * sway);
        const braids = style === "Locs" || pony ? 1 : 3;
        for (let n = 0; n < braids; n++) {
          const pts: Point[] = [];
          for (let j = 0; j <= 16; j++) {
            const t = j / 16,
              twist = t * tau * 3.7 + (n * tau) / braids;
            const radius = pony
              ? 0.053 + 0.092 * Math.sin(Math.PI * t * 0.8)
              : 0.153 + 0.038 * Math.sin(Math.PI * t * 0.88);
            const weave = braids > 1 ? 0.008 * (1 - 0.6 * t) : 0;
            pts.push([
              Math.sin(a) * radius +
                0.019 * Math.sin(7 * t + i) * t +
                weave * Math.cos(twist),
              (pony ? 0.12 : 0.07) - length * t + 0.012 * Math.sin(a),
              (pony ? -0.138 : -0.016) +
                Math.cos(a) * radius +
                0.047 * t * (1 - Math.cos(a)) +
                weave * Math.sin(twist),
            ]);
          }
          ribbon(
            pts,
            pony ? 0.03 : style === "Locs" ? 0.017 : 0.012,
            pony ? 0.024 : 0.012,
            0,
            0.85,
            0.72,
          );
        }
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  geometry.setAttribute("color", new T.Float32BufferAttribute(rgb, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}
