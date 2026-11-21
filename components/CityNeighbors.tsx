"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import Avatar from "./Avatar";
import type { Neighbor } from "./useCitySession";
export default function CityNeighbor({ peer }: { peer: Neighbor }) {
  const group = useRef<T.Group>(null),
    speed = useRef(0),
    target = useRef(new T.Vector3()),
    placed = useRef(false);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const p = peer.pose;
    target.current.set(p.x, p.y, p.z);
    const gap = g.position.distanceTo(target.current);
    if (!placed.current || gap > 14) {
      g.position.copy(target.current);
      placed.current = true;
    } else g.position.lerp(target.current, 1 - Math.exp(-5 * dt));
    speed.current = Math.min(7, gap * 4);
    g.rotation.y +=
      Math.atan2(
        Math.sin(p.facing - g.rotation.y),
        Math.cos(p.facing - g.rotation.y),
      ) *
      (1 - Math.exp(-7 * dt));
  });
  return (
    <group ref={group}>
      <Avatar data={peer.avatar} speed={speed} />
      <mesh position-y={2.38} rotation-z={Math.PI / 4}>
        <octahedronGeometry args={[0.09]} />
        <meshBasicMaterial color="#4ac2ad" />
      </mesh>
    </group>
  );
}
