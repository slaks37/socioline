"use client";
import * as T from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import AvatarHead from "./AvatarHead";
import type { AvatarData } from "./avatar-data";
const sphere = new T.SphereGeometry(1, 16, 12);
// Ring profiles taper at the jaw, cuffs, waist and ankles. Geometry is shared between limbs.
function profile(points: number[][]) {
  return new T.LatheGeometry(
    points.map(([radius, height]) => new T.Vector2(radius, height)),
    24,
  );
}
const fabric = profile([
  [0, -0.01],
  [0.85, 0],
  [0.91, 0.06],
  [0.84, 0.2],
  [0.94, 0.35],
  [1, 0.44],
  [0.94, 0.47],
  [0.42, 0.53],
  [0, 0.53],
]);
const thigh = profile([
  [0, -0.45],
  [0.69, -0.445],
  [0.79, -0.38],
  [0.91, -0.23],
  [1, -0.075],
  [0.85, 0],
  [0, 0.025],
]);
const shin = profile([
  [0, -0.38],
  [0.72, -0.379],
  [0.75, -0.3],
  [0.97, -0.15],
  [0.93, -0.055],
  [0.83, 0],
  [0, 0.015],
]);
const sleeve = profile([
  [0, -0.246],
  [0.82, -0.24],
  [0.88, -0.2],
  [1, -0.095],
  [0.89, 0],
  [0.52, 0.04],
  [0, 0.054],
]);
function Oval({
  p,
  s,
  c,
}: {
  p: [number, number, number];
  s: [number, number, number];
  c: string;
}) {
  return (
    <mesh geometry={sphere} position={p} scale={s} castShadow>
      <meshStandardMaterial color={c} roughness={0.85} />
    </mesh>
  );
}
export default function Avatar({
  data,
  speed,
  reading = false,
  vertical,
}: {
  data: AvatarData;
  speed?: React.RefObject<number>;
  reading?: boolean;
  vertical?: React.RefObject<number>;
}) {
  const legs = useRef<(T.Group | null)[]>([]),
    knees = useRef<(T.Group | null)[]>([]),
    arms = useRef<(T.Group | null)[]>([]),
    phase = useRef(0),
    gait = useRef(0);
  const { skin, outfit, preset } = data;
  const jacket = data.garment !== "T-shirt";
  const width = preset === "Male" ? 0.285 : 0.25;
  useFrame((_, dt) => {
    gait.current = T.MathUtils.damp(gait.current, speed?.current ?? 0, 12, dt);
    const motion = gait.current;
    phase.current += dt * (motion > 5 ? 13 : 9);
    for (let i = 0; i < 2; i++) {
      const swing =
        Math.sin(phase.current + i * Math.PI) * Math.min(motion / 5, 1) * 0.65;
      if (legs.current[i]) legs.current[i]!.rotation.x = swing;
      if (knees.current[i])
        knees.current[i]!.rotation.x = Math.max(0, -swing) * 0.95;
      if (arms.current[i]) {
        const aim = reading
          ? -0.77 + Math.sin(phase.current * 0.19 + i) * 0.13
          : -swing +
            Math.sin(phase.current * 0.24 + i) * 0.035 -
            (Math.abs(vertical?.current ?? 0) > 0.6 ? 0.22 : 0);
        arms.current[i]!.rotation.x = T.MathUtils.damp(
          arms.current[i]!.rotation.x,
          aim,
          11,
          dt,
        );
      }
    }
  });
  return (
    <group>
      <mesh
        geometry={fabric}
        position={[0, 0.956, 0]}
        scale={[width, 1, 0.155]}
        castShadow
      >
        <meshStandardMaterial color={outfit} />
      </mesh>
      <Oval
        p={[0, 1.467, 0.02]}
        s={[0.108, 0.027, 0.089]}
        c={jacket ? "#e8dec5" : outfit}
      />
      {jacket && (
        <group>
          <mesh position={[0, 1.215, 0.14]}>
            <boxGeometry args={[0.023, 0.47, 0.015]} />
            <meshStandardMaterial color="#695c41" />
          </mesh>
          {[1.05, 1.17, 1.29, 1.405].map((y) => (
            <Oval
              key={y}
              p={[0, y, 0.153]}
              s={[0.013, 0.013, 0.006]}
              c="#d4c39f"
            />
          ))}
          {[-1, 1].map((k) => (
            <group key={k}>
              <mesh position={[k * 0.121, 1.292, 0.132]} rotation-y={k * 0.27}>
                <boxGeometry args={[0.09, 0.075, 0.012]} />
                <meshStandardMaterial color={outfit} />
              </mesh>
              <mesh position={[k * 0.121, 1.332, 0.14]} rotation-y={k * 0.27}>
                <boxGeometry args={[0.105, 0.019, 0.015]} />
                <meshStandardMaterial color="#bcb292" />
              </mesh>
              <mesh position={[k * 0.07, 1.44, 0.093]} rotation-z={k * 0.55}>
                <boxGeometry args={[0.095, 0.06, 0.024]} />
                <meshStandardMaterial color={outfit} />
              </mesh>
            </group>
          ))}
        </group>
      )}
      <Oval p={[0, 0.94, 0]} s={[0.22, 0.18, 0.15]} c="#39494e" />
      <Oval p={[0, 1.5, 0]} s={[0.089, 0.12, 0.085]} c={skin} />
      <AvatarHead data={data} />
      {[-1, 1].map((k, i) => (
        <group key={k}>
          <group
            position={[k * 0.114, 0.94, 0]}
            ref={(n) => {
              legs.current[i] = n;
            }}
          >
            <mesh geometry={thigh} scale={[0.112, 1, 0.125]} castShadow>
              <meshStandardMaterial color="#3e555b" />
            </mesh>
            <group
              position={[0, -0.436, 0]}
              ref={(n) => {
                knees.current[i] = n;
              }}
            >
              <mesh geometry={shin} scale={[0.092, 1, 0.099]} castShadow>
                <meshStandardMaterial color="#40565a" />
              </mesh>
              <Oval
                p={[0, -0.4, 0.046]}
                s={[0.093, 0.074, 0.148]}
                c="#ae8964"
              />
              <Oval
                p={[0, -0.438, 0.061]}
                s={[0.097, 0.035, 0.155]}
                c="#ede3c9"
              />
              {[-0.015, 0.018, 0.051].map((z) => (
                <Oval
                  key={z}
                  p={[0, -0.343, z + 0.048]}
                  s={[0.059, 0.007, 0.009]}
                  c="#e5dbc1"
                />
              ))}
            </group>
          </group>
          <group
            position={[k * width * 0.93, 1.37, 0]}
            rotation-z={k * 0.085}
            ref={(n) => {
              arms.current[i] = n;
            }}
          >
            <mesh
              geometry={sleeve}
              scale={[0.096, jacket ? 1.2 : 1, 0.1]}
              castShadow
            >
              <meshStandardMaterial color={outfit} />
            </mesh>
            <Oval p={[0, -0.356, 0]} s={[0.066, 0.167, 0.071]} c={skin} />
            <Oval p={[0, -0.514, 0.008]} s={[0.065, 0.087, 0.054]} c={skin} />
          </group>
        </group>
      ))}
    </group>
  );
}
