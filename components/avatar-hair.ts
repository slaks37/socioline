import * as T from "three";

const tau = 2 * Math.PI;
type Point = [number, number, number];

// Merge cap, strands and braids into one mesh so a hairstyle costs one draw call.
export function hairGeometry(style: string) {
  const pos: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  const buzz = style === "Buzz",
    bob = style === "Bob",
    waves = style === "Waves";
  const crop = style === "Crop",
    part = style === "Side part";
  const curls = style === "Curls",
    tied = style === "Bun" || style === "Braids";
  function vertex(x: number, y: number, z: number, shade: number) {
    pos.push(x, y, z);
    colors.push(shade, shade, shade);
  }
  function grid(start: number, rows: number, cols: number, flip = false) {
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const a = start + j * (cols + 1) + i,
          b = a + 1,
          c = a + cols + 1,
          d = c + 1;
        if (flip) indices.push(a, b, d, a, d, c);
        else indices.push(a, c, d, a, d, b);
      }
  }
  const rows = 30,
    cols = 112,
    shell = buzz ? 1.035 : 1.075;
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    for (let i = 0; i <= cols; i++) {
      const a = (i / cols - 0.5) * tau,
        side = Math.abs(a);
      const sweep = Math.sin(a + 0.36);
      const sides = T.MathUtils.smoothstep(side, 0.55, 1.4);
      const rear = T.MathUtils.smoothstep(side, 1.35, 2.6);
      const fringe = !tied && !buzz && !curls;
      const frontEdge =
        1.12 +
        (fringe
          ? 0.18 * sweep + 0.08 * Math.cos(a * 5)
          : 0.06 * Math.cos(a * 4));
      const maxAngle = frontEdge * (1 - sides) + (1.86 + 0.34 * rear) * sides;
      const polar = t * maxAngle;
      const channels =
        a * (tied ? 44 : 28) + (part || bob ? 7 : 2.5) * (1 - t) * (1 - t);
      const ridge = buzz
        ? 0
        : Math.sin(channels) * Math.sin(channels) * 0.0028 * t;
      let radius = Math.sin(polar);
      if (bob || waves)
        radius = Math.max(radius, T.MathUtils.smoothstep(t, 0.58, 0.85) * 0.96);
      const length = (bob ? 0.105 : waves ? 0.267 : 0) * sides;
      const ripple = waves ? 0.016 * Math.sin(t * 12 + a * 5) * sides * t : 0;
      const x = Math.sin(a) * (0.174 * shell * radius + ripple + ridge);
      const y =
        0.017 +
        Math.cos(polar) * (buzz ? 0.216 : 0.226) -
        length * T.MathUtils.smoothstep(t, 0.65, 1) +
        ridge;
      const z =
        -0.013 + Math.cos(a) * (0.174 * shell * radius + ridge + ripple);
      const shade = buzz
        ? 0.82 + 0.17 * Math.sin(i * 87 + j * 33) ** 2
        : 0.78 +
          0.34 * (0.5 + 0.5 * Math.cos(channels + 0.3)) ** 3 +
          0.2 * Math.sin(polar) ** 2;
      vertex(x, y, z, shade);
    }
  }
  grid(0, rows, cols);
  const edge = rows * (cols + 1);
  for (let i = 0; i <= cols; i++) {
    const idx = (edge + i) * 3;
    vertex(pos[idx] * 0.86, pos[idx + 1] + 0.003, pos[idx + 2] * 0.86, 0.62);
  }
  grid(edge, 1, cols);

  function strand(
    points: Point[],
    width: number,
    depth: number,
    shade: number,
  ) {
    const curve = new T.CatmullRomCurve3(
      points.map((point) => new T.Vector3(...point)),
    );
    const segments = points.length * 3;
    const frames = curve.computeFrenetFrames(segments, false);
    const start = pos.length / 3,
      facets = 9;
    for (let j = 0; j <= segments; j++) {
      const t = j / segments,
        p = curve.getPointAt(t);
      const taper = Math.max(0.01, Math.sin(Math.PI * t) ** 0.54);
      for (let i = 0; i <= facets; i++) {
        const angle = (tau * i) / facets,
          point = p.clone();
        point.addScaledVector(
          frames.normals[j],
          Math.cos(angle) * width * taper,
        );
        point.addScaledVector(
          frames.binormals[j],
          Math.sin(angle) * depth * taper,
        );
        vertex(point.x, point.y, point.z, shade + 0.18 * Math.cos(angle) ** 2);
      }
    }
    grid(start, segments, facets, true);
  }
  if (part || crop || bob || waves) {
    // Sweeping overlapping locks follow the curve from the crown to the temples.
    for (const direction of [-1, 1]) {
      const count = crop ? 4 : 6;
      for (let i = 0; i < count; i++) {
        const t = i / count,
          side = direction,
          offset = part || crop ? -0.052 : -0.01;
        const fringeY = crop ? 0.095 : 0.06;
        strand(
          [
            [offset + side * 0.012, 0.214 - t * 0.025, 0.035 + t * 0.05],
            [offset + side * 0.052, 0.193 - t * 0.036, 0.089 + t * 0.044],
            [side * (0.093 + 0.038 * t), 0.145 - t * 0.039, 0.134 - t * 0.016],
            [
              side * (0.126 + 0.031 * t),
              fringeY - t * 0.033,
              0.106 - t * 0.041,
            ],
          ],
          crop ? 0.023 : 0.027,
          0.014,
          0.83 + (i % 3) * 0.08,
        );
      }
    }
  }
  if (curls) {
    // Short, overlapping locks follow the hairline, clearing the eyes in front.
    for (let ring = 0; ring < 6; ring++) {
      const count = 3 + ring * 5;
      for (let i = 0; i < count; i++) {
        const a = (tau * (i + ring * 0.38)) / count;
        const variation = Math.sin(i * 17 + ring * 6);
        const hairline = 1.1 + (0.77 * (1 - Math.cos(a))) / 2;
        const polar = 0.14 + (ring / 5) * hairline + 0.036 * variation;
        const base = new T.Vector3(
          0.183 * Math.sin(a) * Math.sin(polar),
          0.024 + 0.224 * Math.cos(polar),
          -0.014 + 0.183 * Math.cos(a) * Math.sin(polar),
        );
        const normal = new T.Vector3(
          Math.sin(a) * Math.sin(polar),
          Math.cos(polar),
          Math.cos(a) * Math.sin(polar),
        );
        const across = new T.Vector3(Math.cos(a), 0, -Math.sin(a));
        const down = new T.Vector3().crossVectors(normal, across);
        const points: Point[] = [];
        for (let k = 0; k <= 8; k++) {
          const t = k / 8,
            arc = t * tau * (0.61 + 0.09 * variation) + i;
          const p = base
            .clone()
            .addScaledVector(normal, 0.005 + 0.016 * Math.sin(t * Math.PI))
            .addScaledVector(across, 0.02 * Math.cos(arc))
            .addScaledVector(down, 0.016 * Math.sin(arc));
          points.push([p.x, p.y, p.z]);
        }
        strand(points, 0.013, 0.012, 0.82 + 0.065 * (i % 4));
      }
    }
  }
  if (style === "Braids" || style === "Bun") {
    const bun = style === "Bun";
    for (const side of bun ? [1] : [-1, 1]) {
      for (let i = 0; i < (bun ? 9 : 3); i++) {
        const pts: Point[] = [];
        for (let k = 0; k <= 24; k++) {
          const t = k / 24,
            a = t * tau * (bun ? 0.8 : 3.4) + (i * tau) / (bun ? 9 : 3);
          const r = bun
            ? 0.088 * Math.sin(Math.PI * t)
            : 0.028 * (1 - 0.64 * t);
          pts.push([
            (bun ? 0 : side * (0.144 + 0.025 * Math.sin(t * Math.PI))) +
              r * Math.cos(a),
            bun ? 0.106 + t * 0.155 : 0.01 - t * 0.32,
            (bun ? -0.138 : -0.045 + t * 0.106) + r * Math.sin(a),
          ]);
        }
        strand(
          pts,
          bun ? 0.031 : 0.024,
          bun ? 0.03 : 0.024,
          0.89 + 0.06 * (i % 3),
        );
      }
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
