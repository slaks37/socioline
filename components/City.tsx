"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { districts, landmarks, type Landmark } from "../lib/content";
type Shape = "box" | "round" | "roof" | "cone" | "leaf" | "peak";
type Part = { s: Shape; p: number[]; size: number[]; c: string; r: number };
const palette = ["#d9bf92", "#e3d4b2", "#afc6b4", "#d1dfcd", "#c3b299"];
function parts() {
  const chunks: Record<string, Part[]> = {};
  let zone = "ground";
  function put(
    s: Shape,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: string,
    r = 0,
  ) {
    (chunks[zone] ??= []).push({ s, p: [x, y, z], size: [w, h, d], c, r });
  }
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: string,
    r = 0,
  ) => put("box", x, y, z, w, h, d, c, r);
  const cyl = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    c: string,
  ) => put("round", x, y, z, w, h, w, c);

  box(0, -0.63, -6, 165, 1, 131, "#d7be8e");
  box(0, -0.18, -6, 164, 0.35, 130, "#98ad81");
  for (const z of [-43, -23, 0, 38]) {
    box(0, 0.04, z, 144, 0.1, 5.4, "#677772");
    box(0, 0.1, z - 3.4, 144, 0.18, 1.4, "#decba7");
    box(0, 0.1, z + 3.4, 144, 0.18, 1.4, "#decba7");
    for (let x = -69; x < 71; x += 6)
      box(x, 0.105, z, 2, 0.04, 0.14, "#e1dabc");
  }
  for (const x of [-66, -23, 23, 66]) {
    box(x, 0.07, -1, 4.9, 0.14, 89, "#677772");
    for (let z = -40; z <= 38; z += 6)
      box(x, 0.16, z, 0.14, 0.04, 2, "#ddd3ad");
  }
  for (const x of [-23, 23])
    for (const z of [-23, 0, 38])
      for (let i = -2; i <= 2; i++)
        box(x + i * 0.85, 0.17, z + 4, 0.45, 0.04, 2, "#eee6ca");
  for (const d of districts) {
    box(d.x, 0.08, -24, 39, 0.16, 36, "#b0b68f");
    box(d.x, 0.17, -23, 39, 0.16, 4.9, "#687a75");
    for (let xx = -18; xx < 20; xx += 6)
      box(d.x + xx, 0.26, -23, 2, 0.035, 0.14, "#e4dbad");
    box(d.x, 0.15, -9, 3, 0.2, 21, "#d8c39c");
  }
  box(0, 0.12, 21, 37, 0.25, 31, "#d6c099");
  cyl(0, 0.32, 14, 20, 0.3, "#e6d1ab");
  cyl(0, 0.52, 14, 15, 0.3, "#97aea1");
  cyl(0, 0.7, 14, 12, 0.4, "#afcbaf");
  for (let x = -60; x < 65; x += 9) {
    for (const z of [-26.6, 3.2, 34.5]) {
      cyl(x, 1.65, z, 0.13, 3.3, "#42555a");
      box(x + 0.18, 3.35, z, 0.58, 0.15, 0.35, "#314e56");
      box(x + 0.2, 3.25, z, 0.42, 0.045, 0.29, "#efdeb4");
    }
  }
  function building(l: Landmark, i: number) {
    const { x, z, kind: k } = l;
    zone = l.zone;
    const hub = l.zone === "hub";
    const w = hub ? 7 : 8.4,
      d = hub ? 5 : 7;
    const h = (k === 3 ? 10 : k === 1 ? 7.4 : 5.4) + (i % 2);
    if (k === 5 || k >= 7) return;
    // Annexes use staggered glass bays, recessed lobbies and shaded roof terraces.
    const accent =
      l.zone === "the-word"
        ? "#82799c"
        : l.zone === "the-work"
          ? "#869765"
          : "#548a92";
    const floors = 1 + (i % 3),
      step = 2.9;
    for (let f = 0; f < floors; f++) {
      const span = w - f * 0.52,
        yy = f * step;
      box(x, yy + 0.18, z, span + 0.62, 0.34, d + 0.58, "#dad9c9");
      box(
        x,
        yy + 1.58,
        z - 0.25,
        span - 0.4,
        2.6,
        d - 0.8,
        ["#7b9a9e", "#637f86", "#94a8a5"][i % 3],
      );
      for (let j = -3; j <= 3; j++)
        box(
          x + j * (span / 7),
          yy + 1.57,
          z + d / 2 - 0.36,
          0.13,
          2.68,
          0.33,
          "#b5b9ac",
        );
      for (const k of [-1, 1])
        box(
          x + k * (span * 0.49),
          yy + 1.53,
          z,
          0.24,
          2.65,
          d - 0.18,
          "#c4c7b7",
        );
      box(x, yy + 2.91, z, span + 0.72, 0.29, d + 0.5, "#e0ded0");
    }
    box(x, 1.26, z + d / 2 - 0.27, 1.48, 2.26, 0.12, "#354f55");
    box(x, 2.56, z + d / 2 + 0.48, 3.4, 0.18, 1.8, accent);
    box(x, floors * step + 0.21, z, w - 1, 0.24, d - 0.6, "#8a9b71");
    if (i % 2 === 0) {
      for (let j = -2; j <= 2; j++)
        box(
          x + j * 1.1,
          floors * step + 0.49,
          z,
          0.94,
          0.13,
          d * 0.52,
          "#4e7380",
        );
    }
  }
  landmarks.forEach(building);
  zone = "ground";
  for (const x of [-54, 54]) {
    box(x, 0.12, 22, 15, 0.28, 18, "#d2c6a1");
    box(x, 0.29, 22, 13, 0.22, 16, "#77a9a6");
    box(x, 0.58, 22, 16, 0.45, 2.1, "#b59469");
    for (const v of [-1, 1])
      box(x, 1.24, 22 + v * 1.05, 16, 0.17, 0.17, "#aa8358");
  }
  for (let i = -5; i <= 5; i++) {
    const x = i * 10.7;
    box(x, 0.72, 7, 2.6, 0.35, 0.65, "#a78157");
    box(x, 1.04, 6.74, 2.6, 0.65, 0.16, "#a78157");
  }
  // Welcome terrace descends continuously toward the main plaza.
  for (let j = 0; j < 21; j++) {
    const z = 29 + j * 0.63,
      h = 0.12 + j * 0.13;
    box(0, h / 2, z, 13, h, 0.67, "#d6d4c8");
  }
  box(0, 1.37, 44, 20, 2.74, 5.7, "#c7c8ba");
  for (const k of [-1, 1]) {
    box(k * 8.6, 4, 44, 0.27, 2.6, 0.27, "#516a6c");
    box(k * 8.6, 2.98, 44, 2.9, 0.51, 4.6, "#799069");
  }
  for (const xx of [-46, 0, 46]) {
    box(xx, 0.02, -36, 34, 0.15, 31, "#d3d3c4");
  }
  for (const x of [-70, 69]) box(x, 0.01, -34, 5, 0.12, 61, "#667678");
  box(0, 0.01, -58, 145, 0.12, 5, "#667678");
  for (let i = 0; i < 8; i++) {
    const x = -62 + i * 16;
    box(x, 0.65, 38, 2.95, 0.72, 1.4, "#687e82");
    box(x - 0.12, 1.19, 38, 1.68, 0.53, 1.25, "#a6b9b6");
    for (const k of [-1, 1])
      for (const j of [-1, 1])
        box(x + k * 0.92, 0.32, 38 + j * 0.69, 0.52, 0.49, 0.19, "#3c484a");
  }
  return chunks;
}
const geos = () => ({
  box: new T.BoxGeometry(),
  round: new T.CylinderGeometry(0.5, 0.5, 1, 12),
  roof: new T.ConeGeometry(1, 1, 4),
  cone: new T.ConeGeometry(1, 1, 12),
  peak: new T.ConeGeometry(0.6, 1, 4),
  leaf: new T.IcosahedronGeometry(0.57, 1),
});
function Chunk({
  items,
  zone,
  overview,
}: {
  items: Part[];
  zone: string;
  overview: boolean;
}) {
  const group = useRef<T.Group>(null);
  const [detail, set] = useState(2);
  const tick = useRef(0);
  useFrame(({ camera }, dt) => {
    if (overview || zone === "ground") return;
    tick.current += dt;
    if (tick.current < 0.5) return;
    tick.current = 0;
    const d = districts.find((d) => d.id === zone);
    const dist = Math.hypot(
      camera.position.x - (d?.x ?? 0),
      camera.position.z - (d?.z ?? 22),
    );
    set(dist < 58 ? 2 : dist < 110 ? 1 : 0);
    if (group.current) group.current.visible = dist < 110;
  });
  const meshes = useMemo(() => {
    if (!detail) return [];
    const shapes = geos();
    const mat = new T.MeshStandardMaterial({
      roughness: 0.92,
      flatShading: false,
    });
    const dummy = new T.Object3D();
    return (Object.keys(shapes) as Shape[]).map((s) => {
      const arr = items.filter(
        (p) => p.s === s && (detail === 2 || Math.max(...p.size) > 3),
      );
      const m = new T.InstancedMesh(shapes[s], mat, arr.length);
      arr.forEach((p, i) => {
        dummy.position.fromArray(p.p);
        dummy.scale.fromArray(p.size);
        dummy.rotation.set(0, p.r, 0);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        m.setColorAt(i, new T.Color(p.c));
      });
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    });
  }, [items, detail]);
  useEffect(
    () => () => {
      meshes.forEach((m) => {
        m.geometry.dispose();
        m.dispose();
      });
      meshes[0]?.material.dispose();
    },
    [meshes],
  );
  return (
    <group ref={group}>
      {meshes.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
    </group>
  );
}
export function City({ overview = false }: { overview?: boolean }) {
  const chunks = useMemo(() => parts(), []);
  return (
    <>
      {Object.entries(chunks).map(([zone, items]) => (
        <Chunk key={zone} {...{ zone, items, overview }} />
      ))}
    </>
  );
}
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.22} />
      <hemisphereLight args={["#e0ecff", "#72816c", 0.69]} />
      <directionalLight
        castShadow
        position={[-36, 70, 45]}
        intensity={1.85}
        color="#ffefd7"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-95}
        shadow-camera-right={95}
        shadow-camera-top={75}
        shadow-camera-bottom={-75}
        shadow-camera-far={210}
        shadow-normalBias={0.12}
      />
    </>
  );
}
