"use client";
import { useMemo, useEffect } from "react";
import * as T from "three";
import { useLoader } from "@react-three/fiber";
import { measure, resolveLook, type AvatarData } from "./avatar-data";
import { faceGeometry, earGeometry } from "./avatar-face";
import { faceArt, facePaint } from "./avatar-face-paint";
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
  const jaw = measure(data, "jaw"),
    nose = measure(data, "nose"),
    eyes = measure(data, "eyes"),
    spacing = measure(data, "spacing"),
    mouth = measure(data, "mouth");
  const art = useMemo(
    () => faceArt(collection, female, faceIndex),
    [collection, female, faceIndex],
  );
  const sculpt = useMemo(
    () => faceGeometry(female, faceIndex, jaw, nose),
    [female, faceIndex, jaw, nose],
  );
  const atlas = useLoader(T.TextureLoader, art.src);
  const fiber = useLoader(T.TextureLoader, "/avatar-materials/hair-fiber.webp");
  const paint = useMemo(
    () =>
      facePaint(
        atlas,
        collection,
        female,
        faceIndex,
        art.base,
        skin,
        hairColor,
        eyes,
        spacing,
        mouth,
        nose,
      ),
    [
      atlas,
      collection,
      female,
      faceIndex,
      art.base,
      skin,
      hairColor,
      eyes,
      spacing,
      mouth,
      nose,
    ],
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
  const ear = useMemo(() => earGeometry(), []);
  useEffect(() => () => ear.dispose(), [ear]);
  useEffect(() => () => sculpt.dispose(), [sculpt]);
  useEffect(() => () => paint.dispose(), [paint]);
  useEffect(() => () => coiffure?.dispose(), [coiffure]);
  return (
    <group
      position={[0, 1.687, 0.012]}
      rotation={[-0.026, -0.055, 0.027]}
      scale={[
        measure(data, "faceWidth") * (female ? 0.76 : 0.78),
        female ? 0.81 : 0.82,
        0.8,
      ]}
    >
      <mesh geometry={sculpt} scale={1.011}>
        <meshBasicMaterial color="#51323b" side={T.BackSide} />
      </mesh>
      <mesh geometry={sculpt} material={paint} castShadow />
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={ear}
          scale-x={side}
          position={[side * 0.157, -0.006, 0.006]}
          rotation-z={-side * 0.2}
        >
          <meshBasicMaterial color={skin} vertexColors />
        </mesh>
      ))}
      {coiffure && (
        <mesh geometry={coiffure} castShadow>
          <meshBasicMaterial
            vertexColors
            map={fiber}
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
