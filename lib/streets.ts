import { landmarks } from "./content";
import { MathUtils } from "three";
export const doorAmount = (x: number, z: number, px: number, pz: number) =>
  MathUtils.smoothstep(4.3 - Math.hypot(x - px, z - pz), 0.15, 2.2);
export const doorSites = landmarks
  .filter((l) => l.kind < 7 && l.kind !== 5)
  .map((l) => ({ x: l.x, z: l.z + (l.zone === "hub" ? 2.5 : 3.5) }));
export const rand = (i: number) => {
  const v = Math.sin(i * 127.1 + 73.5) * 43758.5453;
  return v - Math.floor(v);
};
export function streetTrees(low: boolean) {
  const result: { x: number; z: number; h: number }[] = [];
  function tree(x: number, z: number, _index: number, h: number) {
    if (z > 37 && z < 58 && ((x > 5 && x < 48) || (x > -74 && x < -49))) return;
    result.push({ x, z, h });
  }
  for (let i = 0; i < 390; i++) {
    const x = (rand(i + 5) - 0.5) * 260,
      z = (rand(i + 430) - 0.5) * 225;
    if (low && i >= 170 && (Math.abs(x) > 82 || z < -72 || z > 58)) continue;
    if (x < -77 && z > -72 && z < 58) continue;
    if (Math.abs(x) > 76 || z < -69 || z > 49)
      tree(x, z, i, 4 + rand(i + 200) * 6);
  }
  for (let i = 0; i < 28; i++) {
    for (const z of [5, 44])
      if (Math.abs(i * 5 - 68) > 6)
        tree(i * 5 - 68, z, i + 90, 4 + rand(i) * 2.8);
  }
  for (let j = 0; j < landmarks.length; j++) {
    const l = landmarks[j];
    if (l.kind < 5) tree(l.x + 5.5, l.z + 3.5, 400 + j, 3.8 + rand(j) * 2.8);
  }
  for (const x of [-54, 54])
    for (let j = 0; j < 5; j++) tree(x - 8, 13 + j * 4, j, 5 + rand(j) * 1.8);
  return result;
}
