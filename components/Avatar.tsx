"use client";

import { useMemo, useRef, type RefObject } from "react";
import * as T from "three";
import { useFrame } from "@react-three/fiber";
import AvatarHead from "./AvatarHead";
import { measure, resolveLook, type AvatarData } from "./avatar-data";
import { getGarment } from "./avatar-wardrobe";
import {
  Carry,
  ClothMesh,
  Oval,
  Trim,
  uprightNeck,
  useTailor,
} from "./avatar-tailoring";
import { useCloth } from "./avatar-cloth";

export default function Avatar({
  data,
  speed,
  reading = false,
  vertical,
  locomotion,
}: {
  data: AvatarData;
  speed?: RefObject<number>;
  reading?: boolean;
  vertical?: RefObject<number>;
  locomotion?: RefObject<string>;
}) {
  const { collection, female, outfitIndex, skin } = resolveLook(data);
  const garment = getGarment(collection, female, outfitIndex);
  const pieces = useTailor(garment, female);
  const maps = useCloth(garment, collection, female, outfitIndex);
  const skirted = garment.bottom === "skirt" || garment.bottom === "dress";
  const shorts = garment.bottom === "shorts",
    sandals = garment.shoes === "sandals",
    flats = garment.shoes === "flats";
  const shoulder = female ? 0.19 : 0.215;
  const legs = useRef<(T.Group | null)[]>([]),
    knees = useRef<(T.Group | null)[]>([]),
    arms = useRef<(T.Group | null)[]>([]);
  const swimRig = useRef<T.Group>(null);
  const upperBody = useRef<T.Group>(null),
    hips = useRef<T.Group>(null);
  const phase = useRef(0),
    gait = useRef(0);
  const skirtPositions = pieces.skirt.getAttribute(
    "position",
  ) as T.BufferAttribute;
  const restSkirt = useMemo(
    () => new Float32Array(skirtPositions.array),
    [skirtPositions],
  );
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.08);
    gait.current = T.MathUtils.damp(gait.current, speed?.current ?? 0, 10, dt);
    const motion = gait.current,
      stride = Math.min(motion / 4.5, 1),
      running = motion > 5;
    phase.current += dt * (motion > 0.08 ? (running ? 12.8 : 9.4) : 1.7);
    const climbing = locomotion?.current === "Memanjat",
      swimming = locomotion?.current === "Berenang";
    if (climbing || swimming) phase.current += dt * 4;
    if (swimRig.current) {
      const rig = swimRig.current;
      const pitch = T.MathUtils.damp(
        rig.rotation.x,
        swimming ? 0.92 : 0,
        8,
        dt,
      );
      rig.rotation.x = pitch;
      // Rotate the entire clothed skeleton about the hips while treading water.
      rig.position.set(
        0,
        0.97 * (1 - Math.cos(pitch)),
        -0.97 * Math.sin(pitch),
      );
    }
    const phaseAngle = phase.current,
      swing = Math.sin(phaseAngle) * stride * (skirted ? 0.42 : 0.65);
    const bounce = (1 - Math.cos(phaseAngle * 2)) * 0.011 * stride;
    if (upperBody.current) {
      upperBody.current.position.y =
        bounce + Math.sin(phaseAngle) * 0.004 * (1 - stride);
      upperBody.current.rotation.z = 0.025 * stride * Math.sin(phaseAngle);
      upperBody.current.rotation.y = 0.062 * stride * Math.cos(phaseAngle);
      upperBody.current.rotation.x = running ? 0.035 : 0.005;
    }
    if (hips.current) hips.current.position.y = bounce;
    for (let i = 0; i < 2; i++) {
      const direction = i === 0 ? -1 : 1;
      const leg = legs.current[i],
        knee = knees.current[i],
        arm = arms.current[i];
      const angle = swing * direction;
      if (leg)
        leg.rotation.x = climbing
          ? -0.35 + 0.42 * Math.sin(phaseAngle + i * Math.PI)
          : angle;
      if (knee) knee.rotation.x = Math.max(0, -angle) * (running ? 1.18 : 0.87);
      if (arm) {
        const aim = climbing
          ? -2.1 + 0.55 * Math.sin(phaseAngle + i * Math.PI)
          : swimming
            ? -1.0 + Math.sin(phaseAngle + i * Math.PI) * 0.84
            : reading
              ? -0.66 + Math.sin(phaseAngle * 0.65 + i) * 0.07
              : -angle * 0.92 +
                Math.sin(phaseAngle + i) * 0.025 -
                (Math.abs(vertical?.current ?? 0) > 0.6 ? 0.26 : 0);
        arm.rotation.x = T.MathUtils.damp(arm.rotation.x, aim, 12, dt);
      }
    }
    if (
      skirted &&
      (stride > 0.001 ||
        Math.abs(skirtPositions.getZ(0) - restSkirt[2]) > 0.001)
    ) {
      // Let each half of the pleated hem follow its nearest thigh, blending at the centre seam.
      for (let i = 0; i < skirtPositions.count; i++) {
        const x = restSkirt[i * 3],
          y = restSkirt[i * 3 + 1],
          z = restSkirt[i * 3 + 2];
        const weight = T.MathUtils.smoothstep(1.06 - y, 0.02, 0.78);
        const side = T.MathUtils.clamp(x / 0.12, -1, 1);
        const fold = side * swing * (1.06 - y) * weight;
        skirtPositions.setXYZ(
          i,
          x,
          y + weight * Math.abs(fold) * 0.1,
          z - fold,
        );
      }
      skirtPositions.needsUpdate = true;
    }
  });
  return (
    <group
      scale={[
        measure(data, "build"),
        measure(data, "height"),
        Math.sqrt(measure(data, "build")),
      ]}
    >
      <group ref={swimRig}>
        <group ref={hips}>
          <ClothMesh geometry={pieces.hips} color={garment.pants} />
          {([-1, 1] as const).map((side, i) => (
            <group
              key={side}
              position={[side * (female ? 0.083 : 0.091), 0.925, 0]}
              ref={(el) => {
                legs.current[i] = el;
              }}
            >
              {!skirted && (
                <ClothMesh
                  geometry={pieces.thigh}
                  color={garment.pants}
                  outline
                />
              )}
              {shorts && <ClothMesh geometry={pieces.bareThigh} color={skin} />}
              {garment.bottom === "cargo" && (
                <group
                  position={[side * 0.079, -0.191, 0]}
                  rotation-z={side * -0.06}
                >
                  <Oval
                    p={[0, 0, 0]}
                    s={[0.026, 0.085, 0.074]}
                    color={garment.pants}
                  />
                  <Trim
                    p={[side * 0.021, 0.047, 0.005]}
                    s={[0.007, 0.014, 0.105]}
                    color="#8c7d70"
                  />
                </group>
              )}
              <group
                position={[0, -0.402, 0]}
                ref={(el) => {
                  knees.current[i] = el;
                }}
              >
                <ClothMesh
                  geometry={shorts || skirted ? pieces.calf : pieces.shin}
                  color={shorts || skirted ? skin : garment.pants}
                  outline={!skirted}
                />
                <group position={[0, -0.523, 0.012]} scale={[1, 1, 1]}>
                  <ClothMesh
                    geometry={pieces.shoe}
                    color={sandals ? skin : flats ? "#ebd5b6" : "#ebe5e3"}
                  />
                  <ClothMesh
                    geometry={pieces.sole}
                    color={sandals ? "#a27754" : flats ? "#aa8060" : "#dcd4d6"}
                    outline
                  />
                  {sandals || flats ? (
                    <group>
                      <Trim
                        p={[0, 0.069, 0.078]}
                        s={[0.107, 0.016, 0.029]}
                        color={sandals ? "#997654" : "#d7b38c"}
                      />
                      {sandals && (
                        <Trim
                          p={[0, 0.098, -0.014]}
                          s={[0.103, 0.017, 0.034]}
                          color="#bd9168"
                        />
                      )}
                    </group>
                  ) : (
                    <group>
                      {[0.015, 0.042, 0.068].map((z, j) => (
                        <Trim
                          key={z}
                          p={[0, 0.099 - j * 0.009, z]}
                          s={[0.074 - j * 0.005, 0.004, 0.008]}
                          color="#b6abae"
                          tilt={(j - 1) * 0.035}
                        />
                      ))}
                    </group>
                  )}
                </group>
                {!shorts && !skirted && (
                  <Oval
                    p={[0, -0.416, -0.012]}
                    s={[0.06, 0.058, 0.065]}
                    color={garment.pants}
                  />
                )}
                {(shorts || skirted) && (
                  <Oval
                    p={[0, -0.408, -0.005]}
                    s={[0.044, 0.066, 0.048]}
                    color={sandals || flats ? skin : "#f3e8db"}
                  />
                )}
              </group>
            </group>
          ))}
          {skirted && (
            <ClothMesh geometry={pieces.skirt} map={maps.lower} outline />
          )}
          {garment.waist === "plaid" && (
            <group position={[0, 1.034, 0]}>
              <mesh scale={[0.183, 0.046, 0.13]}>
                <sphereGeometry args={[1, 32, 12]} />
                <meshBasicMaterial color="#874a48" />
              </mesh>
              {[-1, 1].map((side) => (
                <group
                  key={side}
                  position={[side * 0.09, -0.107, 0.118]}
                  rotation-z={side * 0.24}
                >
                  <Oval
                    p={[0, 0, 0]}
                    s={[0.043, 0.159, 0.025]}
                    color="#924e49"
                  />
                  {[-0.09, -0.016, 0.059].map((y) => (
                    <Trim
                      key={y}
                      p={[0, y, 0.022]}
                      s={[0.066, 0.012, 0.002]}
                      color="#34364b"
                    />
                  ))}
                  <Trim
                    p={[0, 0, 0.024]}
                    s={[0.012, 0.236, 0.002]}
                    color="#34364b"
                  />
                </group>
              ))}
            </group>
          )}
        </group>
        <group ref={upperBody}>
          <group position={[0, 1.455, 0]}>
            <ClothMesh geometry={uprightNeck} color={skin} />
          </group>
          <ClothMesh geometry={pieces.torso} map={maps.torso} outline />
          {garment.top === "hoodie" && (
            <Oval
              p={[0, 1.398, -0.098]}
              s={[0.146, 0.1, 0.064]}
              color={garment.color}
            />
          )}
          {([-1, 1] as const).map((side, i) => (
            <group
              key={side}
              position={[side * shoulder, 1.411, 0]}
              rotation-z={side * 0.076}
              ref={(el) => {
                arms.current[i] = el;
              }}
            >
              <ClothMesh geometry={pieces.arm} color={skin} />
              {garment.sleeve !== "bare" && (
                <ClothMesh geometry={pieces.sleeve} map={maps.sleeve} outline />
              )}
              <group position={[0, -0.47, 0]} rotation-z={side * -0.075}>
                <Oval
                  p={[0, -0.041, 0.003]}
                  s={[0.037, 0.063, 0.026]}
                  color={skin}
                  tilt={side * 0.05}
                />
                <Oval
                  p={[-side * 0.023, -0.028, 0.024]}
                  s={[0.014, 0.034, 0.014]}
                  color={skin}
                  tilt={side * -0.3}
                />
                {[-1, 0, 1].map((finger) => (
                  <Oval
                    key={finger}
                    p={[
                      side * finger * 0.016,
                      -0.083 + 0.005 * Math.abs(finger),
                      0.008,
                    ]}
                    s={[0.011, 0.029, 0.013]}
                    color={skin}
                  />
                ))}
              </group>
            </group>
          ))}
          <Carry bag={garment.bag} />
          <AvatarHead data={data} />
        </group>
      </group>
    </group>
  );
}
