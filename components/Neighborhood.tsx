"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useEffect, useRef, type RefObject } from "react";
import * as T from "three";
import { landmarks } from "../lib/content";
import { initialAvatar } from "./avatar-data";
import Avatar from "./Avatar";
import { activitySites } from "../engine/city-life";
import type { Pose } from "./GameScene";

export const doorAmount = (x: number, z: number, px: number, pz: number) =>
  T.MathUtils.smoothstep(4.3 - Math.hypot(x - px, z - pz), 0.15, 2.2);
export const doorSites = landmarks
  .filter((l) => l.kind < 7 && l.kind !== 5)
  .map((l) => ({ x: l.x, z: l.z + (l.zone === "hub" ? 2.5 : 3.5) }));
function Doors({ pose }: { pose: RefObject<Pose> }) {
  const mesh = useRef<T.InstancedMesh>(null);
  const o = useMemo(() => new T.Object3D(), []);
  useFrame(() => {
    if (!mesh.current) return;
    doorSites.forEach((door, i) => {
      const a = doorAmount(door.x, door.z, pose.current.x, pose.current.z);
      for (const [n, side] of [-1, 1].entries()) {
        o.position.set(door.x + side * (0.53 + 1.04 * a), 1.44, door.z + 0.04);
        o.updateMatrix();
        mesh.current!.setMatrixAt(i * 2 + n, o.matrix);
      }
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, doorSites.length * 2]}
      frustumCulled={false}
    >
      <boxGeometry args={[1.04, 2.28, 0.085]} />
      <meshStandardMaterial
        color="#739b98"
        transparent
        opacity={0.55}
        metalness={0.1}
        roughness={0.23}
      />
    </instancedMesh>
  );
}
function Plate({ text, x, z }: { text: string; x: number; z: number }) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 96;
    const g = c.getContext("2d")!;
    g.fillStyle = "#243e39";
    g.fillRect(0, 0, 512, 96);
    g.fillStyle = "#f2d9a0";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "600 39px sans-serif";
    g.fillText(text, 256, 50, 480);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[x, 2.2, z]}>
      <planeGeometry args={[2.65, 0.5]} />
      <meshBasicMaterial map={texture} side={T.DoubleSide} />
    </mesh>
  );
}
export function Neighborhood({
  pose,
  decor,
}: {
  pose: RefObject<Pose>;
  decor: number;
}) {
  return (
    <>
      <Doors pose={pose} />
      {activitySites.map((s) => (
        <Plate
          key={s.id}
          text={s.name}
          x={s.x}
          z={s.z + (s.id === "friend" ? -0.4 : -1.7)}
        />
      ))}
      <group position={[-7, 0.18, 27]}>
        <Avatar data={initialAvatar} />
      </group>
      <mesh position={[-33.31, 0.7, -9.35]}>
        <boxGeometry args={[1.39, 0.11, 0.65]} />
        <meshStandardMaterial
          color={["#ab694e", "#608779", "#797299"][decor]}
        />
      </mesh>
      <mesh position={[-31, 0.293, -9]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[2.65, 2.3]} />
        <meshStandardMaterial
          color={["#cca974", "#72938a", "#ac939c"][decor]}
        />
      </mesh>
    </>
  );
}
