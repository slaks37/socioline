"use client";
import { useMemo, useEffect, useRef } from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import * as T from "three";
export type TreeData = { x: number; z: number; y?: number; h: number };
export function Crowns({ trees }: { trees: TreeData[] }) {
  const wind = useRef({ value: 0 });
  useFrame((_, dt) => {
    wind.current.value += dt;
  });
  const tex = useLoader(T.TextureLoader, "/materials/canopy.webp");
  const result = useMemo(() => {
    tex.colorSpace = T.SRGBColorSpace;
    const geo = new T.PlaneGeometry(1, 1),
      mat = new T.MeshStandardMaterial({
        map: tex,
        side: T.DoubleSide,
        alphaTest: 0.44,
        roughness: 0.96,
      });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.windTime = wind.current;
      shader.vertexShader =
        "uniform float windTime;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\ntransformed.x += .009 * (position.y+.5) * sin(windTime*1.35 + instanceMatrix[3].x*.31);",
        );
    };
    const mesh = new T.InstancedMesh(geo, mat, trees.length * 3),
      o = new T.Object3D();
    trees.forEach(({ x, z, h, y = 0 }, i) => {
      for (let j = 0; j < 3; j++) {
        o.position.set(x, y + h * 0.77, z);
        o.scale.set(h * 1.03, h * 0.95, 1);
        o.rotation.set(0, i + (j * Math.PI) / 3, 0);
        o.updateMatrix();
        mesh.setMatrixAt(i * 3 + j, o.matrix);
        mesh.setColorAt(
          i * 3 + j,
          new T.Color().setHSL(0.14 + (i % 6) * 0.012, 0.18, 0.78),
        );
      }
    });
    mesh.castShadow = true;
    return mesh;
  }, [trees, tex]);
  useEffect(
    () => () => {
      result.geometry.dispose();
      result.material.dispose();
      result.dispose();
    },
    [result],
  );
  return <primitive object={result} />;
}
export function Paving() {
  const tex = useLoader(T.TextureLoader, "/materials/limestone.webp");
  useEffect(() => {
    tex.colorSpace = T.SRGBColorSpace;
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.repeat.set(20, 15);
    tex.needsUpdate = true;
  }, [tex]);
  return (
    <>
      {[
        [-46, -35, 34, 29],
        [0, -35, 35, 29],
        [46, -34, 33, 30],
        [0, 20, 35, 27],
      ].map(([x, z, w, h]) => (
        <mesh
          key={x + "," + z}
          position={[x, 0.215, z]}
          rotation-x={-Math.PI / 2}
          receiveShadow
        >
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial map={tex} color="#c4c5b9" roughness={0.85} />
        </mesh>
      ))}
    </>
  );
}
