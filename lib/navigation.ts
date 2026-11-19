import { landmarks } from "./content";
export function ground(
  x: number,
  z: number,
  inside: boolean,
  previous: number,
) {
  if (inside) {
    const dx = x + 46,
      dz = (z + 36) / 0.81,
      r = Math.hypot(dx, dz),
      angle = Math.abs(Math.atan2(dx, dz));
    if (r > 8.35 && r < 10.95 && angle >= 0.68 && angle <= 2.49)
      return 0.22 + ((angle - 0.68) / 1.792) * 3.8;
    if (previous > 3.45 && r > 7.35 && angle > 0.55) return 4.03;
    return 0.22;
  }
  if (Math.abs(x) < 6.65 && z > 28.6 && z < 41.9)
    return 0.3 + Math.max(0, z - 29) * 0.207;
  if (Math.abs(x) < 10 && z >= 41.3 && z < 47) return 2.87;
  return 0.28;
}
export function traversable(x: number, z: number, inside: boolean) {
  if (inside) {
    const dx = x + 46,
      dz = z + 36;
    if ((dx / 12.2) ** 2 + (dz / 9.75) ** 2 > 1) return false;
    return (
      !(Math.abs(dx) < 0.9 && Math.abs(dz - 3.6) < 0.52) &&
      ![-5.5, 5.5].some((v) => Math.hypot(dx - v, dz + 3) < 1.5) &&
      Math.hypot(dx + 3, dz + 2) > 1.45
    );
  }
  if (Math.abs(x) > 78 || z > 47 || z < -71) return false;
  if (((x + 46) / 13.2) ** 2 + ((z + 36) / 10.65) ** 2 < 1) return false;
  if (Math.abs(x - 46) < 13.8 && Math.abs(z + 36) < 7.3) return false;
  if (Math.abs(x) < 13.7 && z < -37 && z > -48) return false;
  if (Math.hypot(x, z + 33.2) < 4.8) return false;
  if (
    Math.abs(Math.abs(x) - 54) < 6.6 &&
    Math.abs(z - 22) < 8 &&
    Math.abs(z - 22) > 1.1
  )
    return false;
  return !landmarks.some(
    (l) =>
      l.kind < 7 &&
      Math.abs(x - l.x) < (l.kind === 5 ? 2.4 : l.zone === "hub" ? 4 : 4.8) &&
      Math.abs(z - l.z) < (l.kind === 5 ? 2.4 : l.zone === "hub" ? 3 : 4.1),
  );
}
