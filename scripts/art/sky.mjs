// Bake the stationary cloud field once. Coordinates match Three.js sphere UVs.
import sharp from "sharp";
const width = 1024,
  height = 512,
  pixels = Buffer.alloc(width * height * 3);
const fract = (v) => v - Math.floor(v);
const hash = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (t) => {
  const v = Math.max(0, Math.min(1, t));
  return v * v * (3 - 2 * v);
};
function noise(x, y) {
  const a = Math.floor(x),
    b = Math.floor(y),
    fx = smooth(x - a),
    fy = smooth(y - b);
  return mix(
    mix(hash(a, b), hash(a + 1, b), fx),
    mix(hash(a, b + 1), hash(a + 1, b + 1), fx),
    fy,
  );
}
for (let row = 0; row < height; row++) {
  const theta = ((row + 0.5) / height) * Math.PI,
    h = Math.max(0, Math.cos(theta)),
    r = (Math.sin(theta) * 2) / Math.max(0.08, h);
  for (let col = 0; col < width; col++) {
    const phi = ((col + 0.5) / width) * 2 * Math.PI,
      x = -Math.cos(phi) * r,
      z = Math.sin(phi) * r;
    const n =
      noise(x, z) * 0.57 +
      noise(x * 2.1, z * 2.1) * 0.28 +
      noise(x * 4.3, z * 4.3) * 0.15;
    const cloud = smooth((n - 0.53) / 0.24) * smooth((h - 0.03) / 0.2) * 0.9;
    for (let c = 0; c < 3; c++)
      pixels[(row * width + col) * 3 + c] = Math.round(
        255 *
          mix(
            mix([0.74, 0.85, 0.87][c], [0.18, 0.48, 0.76][c], h ** 0.58),
            [0.98, 0.97, 0.92][c],
            cloud,
          ),
      );
  }
}
await sharp(pixels, { raw: { width, height, channels: 3 } })
  .webp({ quality: 88 })
  .toFile("public/materials/sky.webp");
