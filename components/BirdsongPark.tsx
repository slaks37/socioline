"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
export default function Birds() {
  const flock = useRef<T.Group>(null);
  const wings = useMemo(() => {
    const g = new T.BufferGeometry();
    g.setAttribute(
      "position",
      new T.Float32BufferAttribute(
        [
          0, 0, 0.25, -0.8, 0.12, 0, -0.22, 0, -0.12, 0, 0, 0.25, 0.22, 0,
          -0.12, 0.8, 0.12, 0,
        ],
        3,
      ),
    );
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (!flock.current) return;
    const t = clock.elapsedTime * 0.11;
    flock.current.position.set(
      Math.sin(t) * 27,
      16 + Math.sin(t * 2),
      -22 + Math.cos(t) * 14,
    );
    flock.current.rotation.y = t;
    flock.current.scale.y = 1 + Math.sin(t * 31) * 0.6;
  });
  return (
    <group ref={flock}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh
          key={i}
          geometry={wings}
          position={[i * 0.9, Math.sin(i) * 0.4, Math.abs(i - 3) * 1.3]}
        >
          <meshBasicMaterial color="#495a5e" side={T.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
