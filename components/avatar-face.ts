import * as T from "three";

type Portrait = "gentle" | "bright" | "laugh" | "wink" | "smirk" | "calm";
export const expressions: Record<string, [Portrait[], Portrait[]]> = {
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
  [0.625, 0.153, 0.145, 0.002],
  [0.71, 0.143, 0.127, 0.012],
  [0.82, 0.115, 0.101, 0.025],
  [0.925, 0.071, 0.072, 0.04],
  [0.977, 0.034, 0.05, 0.056],
  [1, 0.001, 0.001, 0.068],
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
    indices: number[] = [],
    coverage: number[] = [];
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
      const eyeSocket =
        -0.009 * bell((lateral - 0.48) / 0.23) * bell((v - 0.5) / 0.053);
      const brow =
        (female ? 0.005 : 0.01) *
        bell((lateral - 0.46) / 0.36) *
        bell((v - 0.414) / 0.053);
      const bridge =
        (female ? 0.023 : 0.029) *
        bell(lateral / 0.155) *
        bell((v - 0.565) / 0.116);
      const tip =
        (female ? 0.022 : 0.026) *
        bell(lateral / 0.18) *
        bell((v - 0.628) / 0.045);
      const nostril =
        0.011 * bell((lateral - 0.117) / 0.069) * bell((v - 0.642) / 0.027);
      const cheek =
        0.013 * bell((lateral - 0.68) / 0.26) * bell((v - 0.603) / 0.082);
      const muzzle = 0.013 * bell(lateral / 0.4) * bell((v - 0.74) / 0.065);
      const lip =
        (female ? 0.007 : 0.004) *
        bell(lateral / 0.24) *
        (bell((v - 0.748) / 0.022) + 0.7 * bell((v - 0.785) / 0.024));
      const chin = 0.015 * bell(lateral / 0.54) * bell((v - 0.88) / 0.082);
      const forward = offset + rz * c + 0.037 * s * s * front;
      positions.push(
        s * rx * (1 + jaw * bell((v - 0.81) / 0.13)),
        (0.51 - v) * (female ? 0.409 : 0.433),
        forward +
          eyeSocket +
          brow +
          (bridge + tip + nostril) * noseScale +
          cheek +
          muzzle +
          lip +
          chin,
      );
      // Register the illustration to the undeformed skull. Changing the jaw
      // then carries the painted cheek with the skin at the same vertex.
      uvs.push((s * rx) / 0.166, v);
      coverage.push(T.MathUtils.smoothstep(c, 0.12, 0.56));
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
  geometry.setAttribute(
    "paintVisibility",
    new T.Float32BufferAttribute(coverage, 1),
  );
  return geometry;
}

// A rolled outer ear, inner fold and recessed concha share one surface.
export function earGeometry() {
  const mesh = new T.SphereGeometry(1, 32, 23);
  const positions = mesh.attributes.position,
    colors: number[] = [];
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      y = positions.getY(i),
      z = positions.getZ(i);
    const outward = Math.max(0, x),
      radius = Math.hypot(y, z);
    const rim = bell((radius - 0.79) / 0.14);
    const bowl = bell((y - 0.05) / 0.47) * bell((z - 0.1) / 0.55);
    const fold = bell((z + 0.16 - 0.2 * y) / 0.17) * bell((y - 0.1) / 0.64);
    positions.setXYZ(
      i,
      0.024 * (x + outward * (0.24 * rim - 0.4 * bowl + 0.2 * fold)),
      0.047 * y,
      0.026 * (z * (0.86 + 0.12 * y) - 0.2 * y),
    );
    const shade = 1 - outward * (0.26 * bowl + 0.13 * (1 - rim) - 0.11 * fold);
    colors.push(
      shade,
      shade * (1 - 0.19 * bowl * outward),
      shade * (1 - 0.22 * bowl * outward),
    );
  }
  mesh.computeVertexNormals();
  mesh.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  return mesh;
}
