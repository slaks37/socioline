"use client";
import { useEffect, useMemo } from "react";
import * as T from "three";
import { bankTrees, riverRocks } from "../lib/river-valley";
import { Crowns } from "./Planting";
export default function RiverBank() {
  const meshes = useMemo(() => {
    const o = new T.Object3D(),
      mat = new T.MeshStandardMaterial({ roughness: 0.91 });
    const rocks = new T.InstancedMesh(
      new T.IcosahedronGeometry(1, 1),
      mat,
      riverRocks.length,
    );
    riverRocks.forEach((b, i) => {
      o.position.set(b.x, b.y, b.z);
      o.scale.set(b.r, b.r * 0.7, b.r * 0.88);
      o.rotation.set(0.12 * i, i * 0.76, 0.08 * i);
      o.updateMatrix();
      rocks.setMatrixAt(i, o.matrix);
      rocks.setColorAt(
        i,
        new T.Color(["#87877a", "#7c8176", "#979585", "#8a887c"][i % 4]),
      );
    });
    const poles = new T.InstancedMesh(
      new T.CylinderGeometry(0.25, 0.42, 1, 7),
      mat,
      bankTrees.length,
    );
    bankTrees.forEach((b, i) => {
      o.position.set(b.x, b.y + b.h * 0.38, b.z);
      o.rotation.set(0, i * 0.31, 0);
      o.scale.set(b.h * 0.13, b.h * 0.75, b.h * 0.13);
      o.updateMatrix();
      poles.setMatrixAt(i, o.matrix);
      poles.setColorAt(i, new T.Color("#77634f"));
    });
    return [poles, rocks];
  }, []);
  useEffect(
    () => () => {
      for (const m of meshes) {
        m.geometry.dispose();
        m.dispose();
      }
      meshes[0].material.dispose();
    },
    [meshes],
  );
  return (
    <>
      {meshes.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
      <Crowns trees={bankTrees} />
    </>
  );
}
