// Original architectural kit. Repeated components share geometry and material in glTF.
import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { writeFile } from "node:fs/promises";
globalThis.FileReader = class {
  readAsArrayBuffer(b) {
    b.arrayBuffer().then((v) => {
      this.result = v;
      this.onloadend?.();
    });
  }
};
export const tau = 2 * Math.PI;
const stone = "#e4e1d5",
  metal = "#304c54";
export { stone, metal };
export function kit() {
  const scene = new T.Scene(),
    types = new Map(),
    mats = new Map(),
    buffers = new Map(),
    pos = new T.Vector3(),
    up = new T.Vector3(0, 1, 0);
  function geometry(id, build) {
    if (!types.has(id)) types.set(id, build());
    return types.get(id);
  }
  function mat(c) {
    if (!mats.has(c)) {
      const glass = c === "glass",
        lamp = c === "light",
        water = c === "water";
      mats.set(
        c,
        new T.MeshStandardMaterial({
          name: c,
          color: glass ? "#78b6c1" : lamp ? "#ffdb94" : water ? "#459ba7" : c,
          roughness: glass ? 0.11 : water ? 0.18 : c === metal ? 0.31 : 0.74,
          metalness: glass ? 0.42 : c === metal ? 0.5 : 0.05,
          transparent: glass,
          opacity: glass ? 0.28 : 1,
          emissive: lamp ? "#ffce77" : "#000000",
          emissiveIntensity: lamp ? 0.9 : 0,
          side: T.DoubleSide,
        }),
      );
    }
    return mats.get(c);
  }
  function add(g, c, x, y, z, w, h, d, rotation = 0) {
    const key = g.uuid + c;
    let b = buffers.get(key);
    if (!b) {
      b = { g, material: mat(c), m: [] };
      buffers.set(key, b);
    }
    const q =
      typeof rotation === "number"
        ? new T.Quaternion().setFromAxisAngle(up, rotation)
        : rotation;
    b.m.push(
      new T.Matrix4().compose(pos.set(x, y, z), q, new T.Vector3(w, h, d)),
    );
  }
  const box = (c, x, y, z, w, h, d, r = 0) =>
    add(
      geometry("box", () => new T.BoxGeometry()),
      c,
      x,
      y,
      z,
      w,
      h,
      d,
      r,
    );
  const cyl = (c, x, y, z, r, h, rz = r) =>
    add(
      geometry("cyl", () => new T.CylinderGeometry(1, 1, 1, 48)),
      c,
      x,
      y,
      z,
      r,
      h,
      rz,
    );
  const ball = (c, x, y, z, w, h, d) =>
    add(
      geometry("orb", () => new T.SphereGeometry(1, 20, 14)),
      c,
      x,
      y,
      z,
      w,
      h,
      d,
    );
  function beam(c, a, b, width = 0.085) {
    const v = new T.Vector3(...b).sub(new T.Vector3(...a));
    const q = new T.Quaternion().setFromUnitVectors(up, v.clone().normalize());
    add(
      geometry("strut", () => new T.CylinderGeometry(1, 1, 1, 6)),
      c,
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
      (a[2] + b[2]) / 2,
      width,
      v.length(),
      width,
      q,
    );
  }
  function ribbon(
    c,
    r1,
    r2,
    height,
    thick,
    a = 0,
    b = tau,
    ell = 1,
    rise = 0,
    cx = 0,
    cz = 0,
  ) {
    const geo = new T.BufferGeometry(),
      v = [],
      ind = [];
    const n = Math.max(6, Math.ceil((b - a) * 12));
    for (let i = 0; i <= n; i++) {
      const t = a + ((b - a) * i) / n,
        y = height + (rise * i) / n;
      for (const [r, h] of [
        [r1, y],
        [r2, y],
        [r1, y - thick],
        [r2, y - thick],
      ])
        v.push(Math.sin(t) * r, h, Math.cos(t) * r * ell);
    }
    for (let i = 0; i < n; i++) {
      const j = i * 4;
      for (const [a, b, c, d] of [
        [0, 4, 5, 1],
        [2, 3, 7, 6],
        [0, 2, 6, 4],
        [1, 5, 7, 3],
      ])
        ind.push(j + a, j + b, j + c, j + a, j + c, j + d);
    }
    geo.setAttribute("position", new T.Float32BufferAttribute(v, 3));
    geo.setIndex(ind);
    geo.computeVertexNormals();
    add(geo, c, cx, 0, cz, 1, 1, 1);
  }
  function tree(x, y, z, h = 3) {
    cyl("#766552", x, y + h * 0.32, z, (0.1 * h) / 3, h * 0.64);
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4,
        r = h * 0.21;
      ball(
        ["#487250", "#587e50", "#769459"][i % 3],
        x + Math.sin(a) * r,
        y + h * (0.72 + 0.1 * Math.sin(i)),
        z + Math.cos(a) * r,
        h * 0.25,
        h * 0.32,
        h * 0.26,
      );
    }
  }
  function seat(x, y, z, r = 0) {
    box("#a57952", x, y + 0.47, z, 1.7, 0.13, 0.56, r);
    for (const k of [-1, 1])
      cyl(
        metal,
        x + k * 0.6 * Math.cos(r),
        y + 0.21,
        z - k * 0.6 * Math.sin(r),
        0.06,
        0.42,
      );
  }
  function planter(x, y, z, r = 1) {
    cyl(stone, x, y + 0.25, z, r, 0.5);
    cyl("#638553", x, y + 0.52, z, r * 0.96, 0.08);
    tree(x, y + 0.55, z, 2.5 * r);
  }
  async function save(name) {
    for (const { g, material, m } of buffers.values()) {
      if (m.length === 1) {
        const mesh = new T.Mesh(g, material);
        m[0].decompose(mesh.position, mesh.quaternion, mesh.scale);
        scene.add(mesh);
      } else {
        const mesh = new T.InstancedMesh(g, material, m.length);
        m.forEach((v, i) => mesh.setMatrixAt(i, v));
        scene.add(mesh);
      }
    }
    const coarse = new Map([
      [types.get("orb"), new T.SphereGeometry(1, 7, 4)],
      [types.get("cyl"), new T.CylinderGeometry(1, 1, 1, 12)],
      [types.get("strut"), new T.CylinderGeometry(1, 1, 1, 3)],
    ]);
    const distant = new T.Scene(),
      groups = [[], []];
    for (const { g, material, m } of buffers.values()) {
      const source = coarse.get(g) ?? g;
      for (const transform of m) {
        const size = new T.Vector3().setFromMatrixScale(transform);
        if (source !== g || g === types.get("box")) {
          if (Math.max(size.x, size.y, size.z) < 0.85) continue;
          if (g === types.get("strut") && size.x < 0.07) continue;
        }
        const geometry = source.clone().applyMatrix4(transform);
        geometry.deleteAttribute("uv");
        const vertices = geometry.getAttribute("position").count;
        const colors = new Uint8Array(vertices * 3);
        const rgb = material.color
          .toArray()
          .map((channel) => Math.round(channel * 255));
        for (let v = 0; v < vertices; v++) colors.set(rgb, v * 3);
        geometry.setAttribute("color", new T.BufferAttribute(colors, 3, true));
        groups[Number(material.transparent)].push(geometry);
      }
    }
    for (const [index, geometries] of groups.entries()) {
      if (!geometries.length) continue;
      const material = new T.MeshStandardMaterial({
        vertexColors: true,
        transparent: !!index,
        opacity: index ? 0.28 : 1,
        side: index ? T.DoubleSide : T.FrontSide,
      });
      distant.add(new T.Mesh(mergeGeometries(geometries), material));
    }
    const distantBytes = await new GLTFExporter().parseAsync(distant, {
      binary: true,
    });
    await writeFile(
      "public/models/" + name + "-far.glb",
      Buffer.from(distantBytes),
    );
    const bytes = await new GLTFExporter().parseAsync(scene, { binary: true });
    await writeFile("public/models/" + name + ".glb", Buffer.from(bytes));
  }
  return { box, cyl, ball, beam, ribbon, tree, seat, planter, save };
}
