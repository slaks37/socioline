"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";

import {
  cityParts,
  sectorCenter,
  type Shape,
  type Part,
} from "../lib/city-plan";
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
  const [detail, set] = useState(overview || zone === "ground" ? 2 : 0);
  const tick = useRef(0);
  useFrame(({ camera }, dt) => {
    if (overview || zone === "ground") return;
    tick.current += dt;
    if (tick.current < 0.5) return;
    tick.current = 0;
    const d = sectorCenter(zone);
    const dist = Math.hypot(camera.position.x - d.x, camera.position.z - d.z);
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
  const chunks = useMemo(() => cityParts(), []);
  return (
    <>
      {Object.entries(chunks).map(([zone, items]) => (
        <Chunk key={zone} {...{ zone, items, overview }} />
      ))}
    </>
  );
}
export function Lighting({
  dynamicSun = false,
}: { dynamicSun?: boolean } = {}) {
  return (
    <>
      <ambientLight intensity={0.22} />
      <hemisphereLight args={["#e0ecff", "#72816c", 0.69]} />
      <directionalLight
        castShadow
        position={[-36, 70, 45]}
        intensity={dynamicSun ? 0.18 : 1.85}
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
