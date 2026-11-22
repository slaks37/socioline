"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as T from "three";
import {
  vehicles,
  rideIds,
  type Ride,
  type Parking,
} from "../engine/transport";

type XYZ = [number, number, number];
function Panel({ p, s, c, r = 0 }: { p: XYZ; s: XYZ; c: string; r?: number }) {
  return (
    <mesh position={p} rotation-x={r} castShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={0.43} />
    </mesh>
  );
}
function Wheel({ x, z, r }: { x: number; z: number; r: number }) {
  return (
    <group position={[x, r, z]} rotation-z={Math.PI / 2}>
      <mesh castShadow>
        <cylinderGeometry args={[r, r, 0.19, 18]} />
        <meshStandardMaterial color="#252c33" />
      </mesh>
      <mesh>
        <cylinderGeometry args={[r * 0.53, r * 0.53, 0.197, 12]} />
        <meshStandardMaterial
          color="#a9b8b8"
          metalness={0.5}
          roughness={0.32}
        />
      </mesh>
    </group>
  );
}
function Coachwork({
  points,
  width,
  color,
  glass = false,
}: {
  points: number[][];
  width: number;
  color: string;
  glass?: boolean;
}) {
  const shape = useMemo(() => {
    const outline = new T.Shape();
    points.forEach(([z, y], i) =>
      i ? outline.lineTo(z, y) : outline.moveTo(z, y),
    );
    outline.closePath();
    return outline;
  }, [points]);
  return (
    <mesh position-x={width / 2} rotation-y={-Math.PI / 2} castShadow={!glass}>
      <extrudeGeometry
        args={[
          shape,
          {
            depth: width,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.055,
            bevelThickness: 0.055,
          },
        ]}
      />
      <meshStandardMaterial
        color={color}
        roughness={glass ? 0.14 : 0.4}
        metalness={glass ? 0.05 : 0.2}
        transparent={glass}
        opacity={glass ? 0.44 : 1}
        depthWrite={!glass}
      />
    </mesh>
  );
}
const bodyProfile = [
  [-1.71, 0.34],
  [-1.76, 0.66],
  [-1.62, 0.89],
  [-1.0, 0.96],
  [0.66, 0.93],
  [1.54, 0.83],
  [1.73, 0.71],
  [1.73, 0.43],
  [1.45, 0.33],
];
const cabinProfile = [
  [-1.28, 0.91],
  [-0.87, 1.38],
  [-0.62, 1.46],
  [0.21, 1.46],
  [0.78, 0.92],
];
const roofProfile = [
  [-0.89, 1.38],
  [-0.67, 1.46],
  [0.21, 1.46],
  [0.3, 1.41],
];
export function Vehicle({
  id,
  active = false,
  approach,
}: {
  id: Ride;
  active?: boolean;
  approach?: RefObject<boolean>;
}) {
  const door = useRef<T.Group>(null);
  const rotor = useRef<T.Group>(null);
  useFrame((_, dt) => {
    if (door.current)
      door.current.rotation.y = T.MathUtils.damp(
        door.current.rotation.y,
        approach?.current ? 1.04 : 0,
        5,
        dt,
      );
    if (rotor.current && active) rotor.current.rotation.y += dt * 28;
  });
  if (id === "motor")
    return (
      <group>
        <Wheel x={0} z={-0.7} r={0.34} />
        <Wheel x={0} z={0.71} r={0.34} />
        <Panel p={[0, 0.51, -0.12]} s={[0.39, 0.29, 1.22]} c="#35434a" />
        <Panel
          p={[0, 0.77, 0.15]}
          s={[0.46, 0.32, 0.61]}
          c="#c87637"
          r={-0.17}
        />
        <Panel p={[0, 0.78, -0.38]} s={[0.44, 0.14, 0.62]} c="#303237" />
        {[-0.16, 0.16].map((x) => (
          <Panel
            key={x}
            p={[x, 0.68, 0.6]}
            s={[0.066, 0.76, 0.08]}
            r={-0.28}
            c="#9dadaf"
          />
        ))}
        <Panel p={[0, 1.04, 0.5]} s={[0.75, 0.065, 0.085]} c="#343a3e" />
        <Panel p={[0, 0.97, 0.61]} s={[0.24, 0.17, 0.12]} c="#fff0b1" />
      </group>
    );
  if (id === "mobil")
    return (
      <group>
        {[-0.82, 0.82].flatMap((x) =>
          [-1.1, 1.1].map((z) => (
            <Wheel key={x + "," + z} x={x} z={z} r={0.34} />
          )),
        )}
        <Coachwork points={bodyProfile} width={1.6} color="#237873" />
        <Coachwork points={cabinProfile} width={1.4} color="#536e7c" glass />
        <Coachwork points={roofProfile} width={1.42} color="#378f84" />
        <Panel p={[0, 0.53, 1.774]} s={[0.88, 0.16, 0.036]} c="#28373b" />
        <Panel p={[0, 0.41, -1.75]} s={[1.54, 0.11, 0.06]} c="#374247" />
        <Panel p={[0, 0.64, -1.78]} s={[0.4, 0.12, 0.022]} c="#dfd7b7" />
        <group
          ref={door}
          position={[-0.8, 0.78, 0.56]}
          rotation-y={active ? 1.04 : 0}
        >
          <Panel p={[0, -0.07, -0.44]} s={[0.065, 0.4, 0.86]} c="#298378" />
          <Panel
            p={[-0.01, 0.15, -0.44]}
            s={[0.078, 0.039, 0.84]}
            c="#acbab6"
          />
          <Panel p={[0, 0.33, -0.83]} s={[0.065, 0.46, 0.065]} c="#264d4f" />
          <Panel p={[-0.062, 0, -0.7]} s={[0.03, 0.04, 0.14]} c="#cbd4c6" />
        </group>
        {[-1, 1].map((k) => (
          <group key={k}>
            <Panel
              p={[k * 0.62, 0.68, 1.81]}
              s={[0.38, 0.14, 0.04]}
              c="#fff1c6"
            />
            <Panel
              p={[k * 0.64, 0.65, -1.81]}
              s={[0.31, 0.15, 0.04]}
              c="#cf594d"
            />
            <Panel
              p={[k * 0.77, 1.06, -0.23]}
              s={[0.048, 0.5, 0.088]}
              c="#397c77"
            />
            <Panel
              p={[k * 0.858, 0.77, -0.42]}
              s={[0.03, 0.04, 0.16]}
              c="#c1d6d1"
            />
          </group>
        ))}
      </group>
    );
  return (
    <group>
      <mesh position={[0, 1.17, 0.28]} scale={[0.99, 0.82, 1.53]} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color="#407f8b" />
      </mesh>
      <mesh position={[0, 1.39, 0.94]} scale={[0.87, 0.57, 0.95]}>
        <sphereGeometry args={[1, 18, 14]} />
        <meshStandardMaterial
          color="#243f50"
          metalness={0.25}
          roughness={0.22}
        />
      </mesh>
      <Panel p={[0, 1.27, -1.57]} s={[0.32, 0.32, 2.43]} c="#e6b766" r={0.08} />
      <Panel p={[0, 1.63, -2.59]} s={[0.1, 0.9, 0.49]} c="#43828b" />
      {[-0.85, 0.85].map((x) => (
        <group key={x}>
          <Panel p={[x, 0.14, 0.04]} s={[0.11, 0.12, 2.36]} c="#373f45" />
          <Panel
            p={[x * 0.82, 0.42, 0.04]}
            s={[0.11, 0.54, 0.12]}
            c="#49565d"
          />
        </group>
      ))}
      <Panel p={[0, 2.02, 0]} s={[0.14, 0.55, 0.14]} c="#3d464b" />
      <group ref={rotor} position-y={2.3}>
        <Panel p={[0, 0, 0]} s={[5.7, 0.055, 0.17]} c="#3d464b" />
        <Panel p={[0, 0, 0]} s={[0.17, 0.055, 5.7]} c="#3d464b" />
      </group>
    </group>
  );
}
function Parked({
  id,
  fleet,
  ride,
  pose,
}: {
  id: Ride;
  fleet: RefObject<Record<Ride, Parking>>;
  ride: RefObject<Ride | undefined>;
  pose: RefObject<Parking>;
}) {
  const approach = useRef(false);
  const g = useRef<T.Group>(null);
  useFrame(() => {
    if (g.current) {
      const p = fleet.current[id];
      approach.current =
        !ride.current &&
        Math.hypot(p.x - pose.current.x, p.z - pose.current.z) < 3 &&
        Math.abs(p.y - pose.current.y) < 1.2;
      g.current.visible = ride.current !== id;
      g.current.position.set(p.x, p.y, p.z);
      g.current.rotation.y = p.facing;
    }
  });
  return (
    <group ref={g}>
      <Vehicle id={id} approach={approach} />
    </group>
  );
}
export function MotorPool({
  fleet,
  ride,
  pose,
}: {
  fleet: RefObject<Record<Ride, Parking>>;
  ride: RefObject<Ride | undefined>;
  pose: RefObject<Parking>;
}) {
  return (
    <>
      {rideIds.map((id) => (
        <group key={id}>
          <Parked {...{ fleet, ride, id, pose }} />
          <mesh
            position={[vehicles[id].x, 0.097, vehicles[id].z]}
            rotation-x={-Math.PI / 2}
          >
            <ringGeometry
              args={id === "helikopter" ? [3.36, 3.52, 48] : [1.85, 1.9, 40]}
            />
            <meshBasicMaterial color="#e4d6aa" />
          </mesh>
        </group>
      ))}
    </>
  );
}
