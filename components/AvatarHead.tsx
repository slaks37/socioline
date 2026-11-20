"use client";
import { useEffect, useMemo } from "react";
import * as T from "three";
import { defaultFace, type AvatarData } from "./avatar-data";
import { faceGeometry, faceTexture } from "./avatar-face";
import { hairGeometry } from "./avatar-hair";

export default function AvatarHead({ data }: { data: AvatarData }) {
  const face = data.face ?? defaultFace,
    male = data.preset === "Male";
  const sculpt = useMemo(() => faceGeometry(face, male), [face, male]);
  const map = useMemo(
    () => faceTexture(face, male, data.skin),
    [face, male, data.skin],
  );
  const hair = useMemo(() => hairGeometry(data.hair), [data.hair]);
  useEffect(() => () => sculpt.dispose(), [sculpt]);
  useEffect(() => () => map.dispose(), [map]);
  useEffect(() => () => hair.dispose(), [hair]);
  return (
    <group position={[0, 1.705, 0.009]}>
      <mesh geometry={sculpt} castShadow>
        <meshStandardMaterial map={map} roughness={0.81} />
      </mesh>
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[side * 0.148, -0.014, -0.009]}
          rotation-z={-side * 0.17}
        >
          <mesh scale={[0.025, 0.045, 0.029]}>
            <sphereGeometry args={[1, 14, 10]} />
            <meshStandardMaterial color={data.skin} />
          </mesh>
          <mesh
            position={[side * 0.022, 0, 0.005]}
            scale={[0.003, 0.024, 0.012]}
          >
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial
              color={new T.Color(data.skin).multiplyScalar(0.68)}
            />
          </mesh>
        </group>
      ))}
      <mesh geometry={hair} castShadow>
        <meshStandardMaterial
          color={data.hairColor ?? "#372c29"}
          vertexColors
          roughness={0.68}
          side={T.DoubleSide}
        />
      </mesh>
    </group>
  );
}
