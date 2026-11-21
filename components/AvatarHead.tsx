"use client";
import { useMemo, useEffect } from "react";
import * as T from "three";
import { resolveLook, type AvatarData } from "./avatar-data";
import { faceGeometry, faceTexture } from "./avatar-face";
import { hairGeometry } from "./avatar-hair";
import HeadAccessory from "./HeadAccessory";

export default function AvatarHead({ data }: { data: AvatarData }) {
  const {
    collection,
    female,
    faceIndex,
    skin,
    hairColor,
    hair,
    accessory,
    outfitIndex,
  } = resolveLook(data);
  const sculpt = useMemo(
    () => faceGeometry(female, faceIndex),
    [female, faceIndex],
  );
  const paint = useMemo(
    () => faceTexture(collection, female, faceIndex, skin, hairColor),
    [collection, female, faceIndex, skin, hairColor],
  );
  const hood =
    accessory === "Headscarf" || accessory === "Headwrap" || hair === "Hijab";
  const hat = ["Peci", "Sun hat", "Cap", "Beanie"].includes(accessory);
  const style =
    hat && ["Afro", "Bun", "Braided bun"].includes(hair) ? "Curls" : hair;
  const coiffure = useMemo(
    () => (hood ? null : hairGeometry(style, hairColor, female)),
    [hood, style, hairColor, female],
  );
  useEffect(() => () => sculpt.dispose(), [sculpt]);
  useEffect(() => () => paint.dispose(), [paint]);
  useEffect(() => () => coiffure?.dispose(), [coiffure]);
  return (
    <group position={[0, 1.705, 0.009]}>
      <mesh geometry={sculpt} scale={1.011}>
        <meshBasicMaterial color="#51323b" side={T.BackSide} />
      </mesh>
      <mesh geometry={sculpt} castShadow>
        <meshBasicMaterial vertexColors map={paint} toneMapped={false} />
      </mesh>
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[side * 0.152, -0.011, -0.003]}
          rotation-z={-side * 0.22}
        >
          <mesh scale={[0.026, 0.047, 0.025]}>
            <sphereGeometry args={[1, 14, 12]} />
            <meshBasicMaterial color={skin} />
          </mesh>
          <mesh
            position={[side * 0.021, 0.002, 0.007]}
            scale={[0.003, 0.024, 0.011]}
          >
            <sphereGeometry args={[1, 10, 8]} />
            <meshBasicMaterial
              color={new T.Color(skin).lerp(new T.Color("#9d5b54"), 0.34)}
            />
          </mesh>
        </group>
      ))}
      {coiffure && (
        <mesh geometry={coiffure} castShadow>
          <meshBasicMaterial
            vertexColors
            side={T.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}
      <HeadAccessory
        accessory={accessory}
        hood={hood}
        collection={collection}
        outfit={outfitIndex}
        sunglassesRaised={
          female &&
          accessory === "Sunglasses" &&
          ((outfitIndex === 0 &&
            (collection === "amerika" || collection === "australia")) ||
            (collection === "australia" && faceIndex === 4))
        }
      />
    </group>
  );
}
