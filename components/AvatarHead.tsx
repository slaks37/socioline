"use client";
import { useMemo, useEffect } from "react";
import * as T from "three";
import { useLoader } from "@react-three/fiber";
import { measure, resolveLook, type AvatarData } from "./avatar-data";
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
  const jaw = measure(data, "jaw"),
    nose = measure(data, "nose"),
    eyes = measure(data, "eyes"),
    spacing = measure(data, "spacing"),
    mouth = measure(data, "mouth");
  const sculpt = useMemo(
    () => faceGeometry(female, faceIndex, jaw, nose),
    [female, faceIndex, jaw, nose],
  );
  const [eyeArt, fiber] = useLoader(T.TextureLoader, [
    `/avatar-materials/eye-${female ? "f" : "m"}.webp`,
    "/avatar-materials/hair-fiber.webp",
  ]);
  const paint = useMemo(
    () =>
      faceTexture(
        collection,
        female,
        faceIndex,
        skin,
        hairColor,
        eyes,
        spacing,
        mouth,
        eyeArt.image,
      ),
    [
      collection,
      female,
      faceIndex,
      skin,
      hairColor,
      eyes,
      spacing,
      mouth,
      eyeArt,
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
      <mesh geometry={sculpt} castShadow receiveShadow>
        <meshLambertMaterial
          vertexColors
          map={paint}
          color="#c4b9bd"
          emissive="#ffffff"
          emissiveMap={paint}
          emissiveIntensity={0.48}
          toneMapped={false}
        />
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
