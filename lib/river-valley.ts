// Survey coordinates are shared by the terrain mesh, swim volume and collision mesh.
export const valley = { west: -150, east: -82, north: -72, south: 58, step: 1 };
export const riverX = (z: number) => -98 + 2.7 * Math.sin(z * 0.078);
export const waterLevel = (z: number) => (z < -42 ? 3.4 : -0.62);
const smooth = (a: number, b: number, t: number) => {
  const n = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return n * n * (3 - 2 * n);
};
export function terrainHeight(x: number, z: number) {
  const d = Math.abs(x - riverX(z));
  const high = 4.02 * (1 - smooth(-44, -41, z));
  const stream = -2.95 + high + smooth(2.5, 8, d) * 3.05;
  const ridge =
    smooth(7, 37, riverX(z) - x) *
    (11 + 6 * Math.cos(z * 0.085) + 3 * Math.sin(x * 0.27 - z * 0.06));
  return (stream + ridge) * (1 - smooth(-87, -82, x));
}
export function valleyGeometry() {
  const { west, east, north, south, step } = valley;
  const cols = (east - west) / step + 1,
    rows = (south - north) / step + 1;
  const vertices = new Float32Array(cols * rows * 3),
    indices = new Uint32Array((cols - 1) * (rows - 1) * 6);
  let i = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = west + c * step,
        z = north + r * step,
        n = r * cols + c;
      vertices.set([x, terrainHeight(x, z), z], n * 3);
      if (r === rows - 1 || c === cols - 1) continue;
      indices.set([n, n + cols, n + 1, n + 1, n + cols, n + cols + 1], i);
      i += 6;
    }
  return { vertices, indices };
}

export const bankTrees = Array.from({ length: 124 }, (_, i) => {
  const z = -69 + ((i * 47) % 125),
    side = i % 3 === 0 ? 1 : -1;
  const offset =
    side > 0 ? 6.8 + ((i * 13) % 50) / 10 : 7 + ((i * 17) % 280) / 10;
  const x = riverX(z) + side * offset;
  return { x, z, y: terrainHeight(x, z), h: 3.1 + ((i * 7) % 40) / 10 };
});
export const riverRocks = Array.from({ length: 60 }, (_, i) => {
  const falls = i < 18,
    z = falls ? -43 + (i % 3) * 0.84 : -66 + ((i * 23) % 117);
  const x =
    riverX(z) +
    (i % 2 === 0 ? 1 : -1) *
      (falls ? 3.7 + (i % 5) * 0.7 : 5.7 + (i % 4) * 0.6);
  const r = falls ? 1.25 + (i % 3) * 0.35 : 0.63 + (i % 4) * 0.21;
  return { x, z, y: terrainHeight(x, z) + r * 0.16, r };
});
