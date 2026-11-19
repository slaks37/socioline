"use client";
import { useMemo, useEffect } from "react";
import * as T from "three";
import { boards, districts, landmarks } from "../lib/content";
function Sign({
  x,
  z,
  label,
  big,
  facade,
  kiosk,
}: {
  x: number;
  z: number;
  label: string;
  big?: boolean;
  facade?: boolean;
  kiosk?: boolean;
}) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 96;
    const g = c.getContext("2d")!;
    g.fillStyle = "#174547";
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = "#b2cbb6";
    g.lineWidth = 4;
    g.strokeRect(3, 3, 506, 90);
    g.fillStyle = "#fff5dc";
    g.font = "bold 32px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(label, 256, 48, 485);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  }, [label]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <group position={[x, 0, z]}>
      {!facade && !kiosk && (
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[0.28, 2.8, 0.28]} />
          <meshStandardMaterial color="#655b47" />
        </mesh>
      )}
      <mesh position={[0, kiosk ? 1.64 : facade ? 2.84 : 2.6, 0]}>
        <planeGeometry
          args={[
            kiosk ? 1.07 : big ? 4.6 : facade ? 3.25 : 3.6,
            kiosk ? 0.22 : big ? 0.87 : facade ? 0.61 : 0.69,
          ]}
        />
        <meshBasicMaterial map={tex} side={T.DoubleSide} />
      </mesh>
    </group>
  );
}
export default function Signs() {
  return (
    <>
      {landmarks
        .filter((l) => l.kind !== 5 && l.kind < 7)
        .map((l) => (
          <Sign
            facade
            key={l.id}
            x={l.x}
            z={l.z + (l.zone === "hub" ? 2.5 : 3.5) + 0.28}
            label={l.name}
          />
        ))}
      {landmarks
        .filter((l) => l.kind >= 7)
        .map((l) => (
          <Sign
            kiosk={l.kind === 8}
            key={l.id}
            x={l.kind === 8 ? l.x : l.x - 3.6}
            z={l.kind === 8 ? l.z + 0.22 : l.z}
            label={l.name}
          />
        ))}
      {boards.map((b) => (
        <Sign key={b.path + b.x} x={b.x} z={b.z} label={b.name} />
      ))}
      {districts.map((d) => (
        <Sign key={d.id} big x={d.x} z={-5.5} label={d.name.toUpperCase()} />
      ))}
    </>
  );
}
