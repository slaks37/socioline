"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect, useState, useMemo } from "react";
import * as T from "three";
import Landscape from "./Landscape";
import { ground } from "../lib/navigation";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { heroSites } from "./Landscape";
import { makePhysics, readyPhysics, liftAt, liftSite } from "./city-physics";
import { CityEnvironment, spawnFloor } from "./RiverValley";
import { riverX, waterLevel } from "../lib/river-valley";
import CityNeighbor from "./CityNeighbors";
import type { Neighbor } from "./useCitySession";
import { Neighborhood } from "./Neighborhood";
import Signs from "./Signs";
import Avatar from "./Avatar";
import { City, Lighting } from "./City";
import { measure, type AvatarData } from "./avatar-data";
import { landmarks, interactives } from "../lib/content";
import {
  newFleet,
  rideIds,
  vehicles,
  type Ride,
  type Parking,
} from "../engine/transport";
import { Vehicle, MotorPool } from "./Transport";
export type Input = {
  board?: boolean;
  run?: boolean;
  descend?: boolean;
  climb?: boolean;
  dx: number;
  dz: number;
  jump: boolean;
  hold?: boolean;
  turn: number;
  tilt: number;
};
export type Location = {
  x: number;
  z: number;
  id: string;
  mode?: string;
  ride?: Ride;
  nearbyRide?: Ride;
  canClimb?: boolean;
  rideHint?: string;
  kmh?: number;
  y?: number;
};
export type Pose = {
  x: number;
  y: number;
  z: number;
  facing: number;
  ride?: Ride;
};
export type GameProps = {
  pose: React.RefObject<Pose>;
  avatar: AvatarData;
  paused: boolean;
  input: React.RefObject<Input>;
  travel: { x: number; z: number; seq: number; resume?: Pose };
  report: (l: Location) => void;
  quality: string;
  inside: boolean;
  panorama: boolean;
  distance: number;
  onFail: () => void;
  peers: Neighbor[];
  deliveries: number;
  decor: number;
  herd: boolean;
  crop: boolean;
  weather: "auto" | "sun" | "rain";
};
function Player({
  pose,
  avatar,
  paused,
  input,
  travel,
  report,
  onFail,
  inside,
  panorama,
  distance,
  fleet,
  mounted,
}: GameProps & {
  fleet: React.RefObject<Record<Ride, Parking>>;
  mounted: React.RefObject<Ride | undefined>;
}) {
  const [ride, setRide] = useState<Ride>();
  const velocity = useRef(0),
    notice = useRef("");
  const root = useRef<T.Group>(null),
    keys = useRef(new Set<string>()),
    speed = useRef(0),
    vy = useRef(0),
    timer = useRef(0),
    reported = useRef<Location | null>(null),
    snap = useRef(true);
  const { gl, camera } = useThree();
  const sites = useMemo(
    () => [...heroSites, { x: 0, z: 14, file: "plaza" }],
    [],
  );
  const models = useLoader(
    GLTFLoader,
    sites.map((s) => "/models/" + s.file + "-far.glb"),
  );
  const physics = useRef<ReturnType<typeof makePhysics> | null>(null);
  const autoClimb = useRef(false);
  const locomotion = useRef("");
  const feetGrounded = useRef(false);
  const heightScale = measure(avatar, "height"),
    build = measure(avatar, "build");
  useEffect(() => {
    let active = true;
    readyPhysics()
      .then(() => {
        if (active)
          physics.current = makePhysics(
            sites.map((s, i) => ({ ...s, scene: models[i].scene })),
            heightScale,
            build,
          );
      })
      .catch(() => {
        if (active) onFail();
      });
    return () => {
      active = false;
      physics.current?.dispose();
      physics.current = null;
    };
  }, [models, sites, heightScale, build, onFail]);
  const rayOrigin = useMemo(() => new T.Vector3(), []),
    rayDirection = useMemo(() => new T.Vector3(), []);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", onFail);
    return () => canvas.removeEventListener("webglcontextlost", onFail);
  }, [gl, onFail]);
  const target = useRef(new T.Vector3());
  const reduced = useRef(false);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reduced.current = m.matches;
    };
    sync();
    m.addEventListener("change", sync);
    return () => m.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (root.current) {
      root.current.position.set(
        travel.x,
        travel.resume?.y ??
          (travel.x < -82
            ? spawnFloor(travel.x, travel.z) + 0.05
            : ground(
                travel.x,
                travel.z,
                travel.x < -34 &&
                  travel.x > -58 &&
                  travel.z < -26 &&
                  travel.z > -46,
                0,
              )),
        travel.z,
      );
      if (mounted.current && !travel.resume)
        fleet.current[mounted.current] = newFleet()[mounted.current];
      mounted.current = travel.resume?.ride;
      setRide(mounted.current);
      velocity.current = 0;
      notice.current = "";
      if (mounted.current)
        Object.assign(fleet.current[mounted.current], travel.resume);
      input.current.board = false;
      input.current.climb = false;
      autoClimb.current = false;
      if (!travel.resume) input.current.turn = 0;
      root.current.rotation.y = travel.resume?.facing ?? Math.PI;
      vy.current = 0;
      snap.current = true;
    }
  }, [travel, input, fleet, mounted]);
  useEffect(() => {
    const pressed = keys.current;
    pressed.clear();
    if (paused) {
      input.current.dx = 0;
      input.current.dz = 0;
      input.current.jump = false;
      input.current.hold = false;
      speed.current = 0;
      return;
    }
    const move = (e: KeyboardEvent, down: boolean) => {
      if ((e.target as HTMLElement)?.closest("dialog,input,select,textarea"))
        return;
      const k = e.code;
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ShiftLeft",
          "ShiftRight",
          "Space",
          "KeyC",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
        ].includes(k)
      ) {
        if (k === "Space" && (e.target as HTMLElement)?.closest("button,a"))
          return;
        e.preventDefault();
        if (down) {
          pressed.add(k);
          if (k === "Space" && !e.repeat) input.current.jump = true;
        } else pressed.delete(k);
      }
    };
    const kd = (e: KeyboardEvent) => move(e, true),
      ku = (e: KeyboardEvent) => move(e, false),
      clear = () => pressed.clear();
    const el = gl.domElement;
    let drag = false;
    const start = (e: PointerEvent) => {
        drag = true;
        el.setPointerCapture(e.pointerId);
        el.focus();
      },
      end = () => {
        drag = false;
      },
      look = (e: PointerEvent) => {
        if (drag) {
          input.current.turn -= e.movementX * 0.006;
          input.current.tilt = T.MathUtils.clamp(
            input.current.tilt + e.movementY * 0.023,
            1.5,
            8,
          );
        }
      };
    el.tabIndex = 0;
    el.setAttribute("aria-label", "City camera. Drag to look around.");
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", clear);
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointermove", look);
    el.addEventListener("lostpointercapture", end);
    return () => {
      clear();
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", clear);
      el.removeEventListener("pointerdown", start);
      el.removeEventListener("pointermove", look);
      el.removeEventListener("lostpointercapture", end);
    };
  }, [paused, gl, input]);
  useFrame(({ clock }, delta) => {
    const g = root.current;
    if (!g) return;
    const p = g.position,
      dt = Math.min(delta, 0.1),
      c = input.current,
      k = keys.current;
    let dx =
        paused || panorama
          ? 0
          : c.dx +
            Number(k.has("KeyD") || k.has("ArrowRight")) -
            Number(k.has("KeyA") || k.has("ArrowLeft")),
      dz =
        paused || panorama
          ? 0
          : c.dz +
            Number(k.has("KeyS") || k.has("ArrowDown")) -
            Number(k.has("KeyW") || k.has("ArrowUp"));
    const mag = Math.hypot(dx, dz);
    speed.current =
      mag > 0.08
        ? c.run || k.has("ShiftLeft") || k.has("ShiftRight")
          ? 10
          : 5
        : 0;
    if (!physics.current) return;
    let vehicle = mounted.current;
    const nearby = rideIds.find((id) => {
      const parked = fleet.current[id];
      return (
        Math.abs(p.y - parked.y) < 1.3 &&
        Math.hypot(p.x - parked.x, p.z - parked.z) <
          vehicles[id].width / 2 + 2.15
      );
    });
    if (c.board && !paused && !panorama) {
      c.board = false;
      if (vehicle) {
        const exit = physics.current.exit(p, g.rotation.y, vehicle);
        if (Math.abs(velocity.current) > 1.1 || !exit)
          notice.current =
            "Berhenti di permukaan datar dengan ruang di samping untuk turun.";
        else {
          p.copy(exit);
          vehicle = undefined;
          velocity.current = 0;
          vy.current = 0;
          notice.current = "";
        }
      } else if (nearby) {
        vehicle = nearby;
        const seat = fleet.current[nearby];
        p.set(seat.x, seat.y + 0.03, seat.z);
        g.rotation.y = seat.facing;
        c.turn = seat.facing - Math.PI;
        velocity.current = 0;
        notice.current = "";
      }
      gl.domElement.focus({ preventScroll: true });
      mounted.current = vehicle;
      setRide(vehicle);
    }
    physics.current.fleet(fleet.current, vehicle);
    const swimming =
      p.x < -82 &&
      Math.abs(p.x - riverX(p.z)) < 5.2 &&
      p.y < waterLevel(p.z) + 0.08;
    const ladder = landmarks.find(
      (l) =>
        l.kind < 7 &&
        l.kind !== 5 &&
        Math.abs(p.x - (l.x + (l.zone === "hub" ? 3.5 : 4.2) + 0.9)) < 0.94 &&
        Math.abs(p.z - l.z) < 0.72,
    );
    const roof = ladder ? 3.52 + (landmarks.indexOf(ladder) % 3) * 0.22 : 0;
    const canClimb = !!ladder && !vehicle && p.y < roof - 0.08;
    if (c.climb) {
      autoClimb.current = canClimb;
      c.climb = false;
    }
    if (!ladder || vehicle) autoClimb.current = false;
    const climb =
      !!ladder &&
      !vehicle &&
      (autoClimb.current || c.jump || c.hold || k.has("Space")) &&
      !paused;
    const elevator =
      Math.abs(p.x - liftSite.x) < 0.93 && Math.abs(p.z - liftSite.z) < 0.69;
    const mode = vehicle
      ? vehicles[vehicle].label
      : climb
        ? "Memanjat"
        : swimming
          ? "Berenang"
          : elevator
            ? "Lift"
            : !feetGrounded.current
              ? "Di udara"
              : speed.current > 5
                ? "Berlari"
                : "Berjalan";
    locomotion.current = mode;
    if (!paused && !panorama) {
      if (vehicle) {
        const spec = vehicles[vehicle],
          air = vehicle === "helikopter";
        const throttle = T.MathUtils.clamp(-dz, -1, 1);
        velocity.current = T.MathUtils.damp(
          velocity.current,
          throttle * (throttle < 0 ? 0.38 : 1) * spec.speed,
          throttle ? 2.2 : 5.5,
          dt,
        );
        const steer =
          -T.MathUtils.clamp(dx, -1, 1) *
          (air
            ? 1
            : Math.min(1, Math.abs(velocity.current) / 1.6) *
              Math.sign(velocity.current));
        const heading =
          g.rotation.y + steer * dt * (vehicle === "motor" ? 2.4 : 1.65);
        if (physics.current.turn(p, heading)) g.rotation.y = heading;
        c.turn +=
          Math.atan2(
            Math.sin(g.rotation.y - Math.PI - c.turn),
            Math.cos(g.rotation.y - Math.PI - c.turn),
          ) *
          (1 - Math.exp(-3 * dt));
        const rise = air
          ? Number(c.hold || k.has("Space")) -
            Number(c.descend || k.has("KeyC"))
          : 0;
        const steps = Math.ceil(dt / 0.025) || 1;
        for (let i = 0; i < steps; i++) {
          const step = dt / steps;
          vy.current = air
            ? rise > 0 && p.y >= 34
              ? 0
              : rise * 5
            : Math.max(-18, vy.current - 17 * step);
          const startX = p.x,
            startZ = p.z;
          const grounded = physics.current.move(
            p,
            Math.sin(g.rotation.y) * velocity.current * step,
            vy.current * step,
            Math.cos(g.rotation.y) * velocity.current * step,
            Date.now() / 1000,
          );
          const forward =
            (p.x - startX) * Math.sin(g.rotation.y) +
            (p.z - startZ) * Math.cos(g.rotation.y);
          if (Math.abs(forward) < Math.abs(velocity.current) * step * 0.55)
            velocity.current = forward / step;
          if (grounded && vy.current < 0) vy.current = 0;
        }
        Object.assign(fleet.current[vehicle], {
          x: p.x,
          y: p.y,
          z: p.z,
          facing: g.rotation.y,
        });
        c.jump = false;
      } else {
        let vx = 0,
          vz = 0;
        if (speed.current) {
          dx /= mag;
          dz /= mag;
          vx =
            (dx * Math.cos(c.turn) + dz * Math.sin(c.turn)) *
            speed.current *
            (swimming ? 0.56 : 1);
          vz =
            (dz * Math.cos(c.turn) - dx * Math.sin(c.turn)) *
            speed.current *
            (swimming ? 0.56 : 1);
          const turn = Math.atan2(vx, vz) - g.rotation.y;
          g.rotation.y +=
            Math.atan2(Math.sin(turn), Math.cos(turn)) *
            (1 - Math.exp(-13 * dt));
        }
        if (climb && ladder) {
          const sideX = ladder.x + (ladder.zone === "hub" ? 3.5 : 4.2) + 0.94;
          vx = T.MathUtils.clamp((sideX - p.x) * 10, -4, 4);
          vz = T.MathUtils.clamp((ladder.z - p.z) * 10, -3, 3);
          g.rotation.y = -Math.PI / 2;
        }
        if (c.jump && feetGrounded.current && !climb) vy.current = 6;
        const jumps = c.jump;
        c.jump = false;
        const steps = Math.max(1, Math.ceil(dt / (1 / 45))),
          step = dt / steps;
        for (let i = 0; i < steps; i++) {
          const time = Date.now() / 1000 - dt + step * (i + 1);
          vy.current = climb
            ? 2.8
            : swimming
              ? (waterLevel(p.z) - 0.91 - p.y) * 4 + (jumps ? 2 : 0)
              : Math.max(-28, vy.current - 17 * step);
          const liftY = liftAt(time);
          if (elevator && Math.abs(p.y - liftY) < 0.3 && vy.current <= 0) {
            p.y = liftY + 0.025;
            vy.current = -0.45;
          }
          feetGrounded.current = physics.current.move(
            p,
            vx * step,
            vy.current * step,
            vz * step,
            time,
          );
          if (feetGrounded.current && vy.current < 0) vy.current = 0;
          if (
            climb &&
            ladder &&
            p.y > 3.6 + (landmarks.indexOf(ladder) % 3) * 0.22
          ) {
            physics.current.move(p, -1.55, -0.035, 0, time);
            autoClimb.current = false;
            vy.current = 0;
            break;
          }
        }
      }
    }
    const kmh = vehicle
      ? Math.round(Math.abs(velocity.current) * 3.6)
      : undefined;
    const baseY = p.y;
    const arm = inside ? Math.min(distance, 3.6) : distance;
    rayOrigin.set(p.x, baseY + 1.45 * heightScale, p.z);
    target.current.set(
      p.x + Math.sin(c.turn) * arm,
      baseY + Math.min(c.tilt, inside ? 2.55 : 3.4),
      p.z + Math.cos(c.turn) * arm,
    );
    rayDirection.copy(target.current).sub(rayOrigin);
    const len = rayDirection.length();
    rayDirection.normalize();
    target.current
      .copy(rayOrigin)
      .addScaledVector(
        rayDirection,
        physics.current.camera(rayOrigin, rayDirection, len),
      );
    if (panorama) {
      if (inside) {
        target.current.set(-41, 2.35, -28.8);
        camera.lookAt(-47, 4, -38);
      } else if (p.z > 1) {
        target.current.set(58, 40, 76);
        camera.lookAt(0, 2, -20);
      } else {
        const cx = p.x < -23 ? -46 : p.x > 23 ? 46 : 0;
        target.current.set(cx + 16.5, 7.5, -13);
        camera.lookAt(cx, 4, -36);
      }
      camera.position.copy(target.current);
      const cx = p.x < -23 ? -46 : p.x > 23 ? 46 : 0;
      if (inside) camera.lookAt(-47, 4, -38);
      else if (p.z > 1) camera.lookAt(0, 2, -20);
      else camera.lookAt(cx, 4, -36);
    } else {
      camera.position.lerp(
        target.current,
        snap.current || reduced.current ? 1 : 1 - Math.exp(-10 * dt),
      );
      camera.lookAt(
        p.x - Math.sin(c.turn) * 2.7,
        baseY + 1.76,
        p.z - Math.cos(c.turn) * 2.7,
      );
    }
    pose.current.ride = vehicle;
    pose.current.x = p.x;
    pose.current.y = p.y;
    pose.current.z = p.z;
    pose.current.facing = g.rotation.y;
    snap.current = false;
    timer.current += dt;
    if (timer.current > 0.13) {
      timer.current = 0;
      let closest = "",
        dist = 9;
      for (const l of interactives) {
        if (
          (l.id === "encounter-station" && !inside) ||
          (inside && l.id !== "encounter-station" && l.id !== "word-library")
        )
          continue;
        const n = Math.hypot(p.x - l.x, p.z - l.z);
        if (
          n < dist &&
          n <
            (l.id === "encounter-station"
              ? 3.4
              : l.id === "word-library"
                ? 4.4
                : 8)
        ) {
          dist = n;
          closest = l.id;
        }
      }
      const last = reported.current;
      if (
        !last ||
        last.x !== p.x ||
        last.z !== p.z ||
        last.id !== closest ||
        last.mode !== mode ||
        last.kmh !== kmh ||
        last.nearbyRide !== nearby ||
        last.canClimb !== canClimb ||
        last.rideHint !== notice.current ||
        Math.abs((last.y ?? 0) - p.y) > 0.1
      ) {
        const next = {
          x: p.x,
          y: p.y,
          z: p.z,
          id: closest,
          mode,
          ride: vehicle,
          kmh,
          nearbyRide: nearby,
          canClimb,
          rideHint: notice.current,
        };
        reported.current = next;
        report(next);
      }
    }
  });
  return (
    <group ref={root}>
      <mesh position={[0, 0.15, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.4, 20]} />
        <meshBasicMaterial
          color="#283829"
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>
      {ride && <Vehicle id={ride} active />}
      {ride !== "helikopter" && (
        <group
          scale={ride === "mobil" ? 0.85 / heightScale : 1}
          position={[
            ride === "mobil" ? -0.33 : 0,
            ride === "mobil" ? -0.24 : ride ? -0.15 : 0,
            0,
          ]}
        >
          <Avatar
            seated={!!ride}
            data={avatar}
            speed={speed}
            reading={paused}
            vertical={vy}
            locomotion={locomotion}
          />
        </group>
      )}
    </group>
  );
}
function ShadowRefresh({
  quality,
  travel,
}: {
  quality: string;
  travel: number;
}) {
  const { gl } = useThree();
  useEffect(() => {
    gl.shadowMap.needsUpdate = true;
    const id = setTimeout(() => {
      gl.shadowMap.needsUpdate = true;
    }, 1200);
    return () => clearTimeout(id);
  }, [gl, quality, travel]);
  return null;
}
function Adaptive({ onChange }: { onChange: (value: number) => void }) {
  const elapsed = useRef(0),
    frames = useRef(0),
    fast = useRef(0);
  useFrame((_, dt) => {
    elapsed.current += dt;
    frames.current++;
    if (elapsed.current < 2 || frames.current < 3) return;
    const duration = elapsed.current / frames.current;
    fast.current = duration < 0.025 ? fast.current + 1 : 0;
    if (duration > 0.12) onChange(0.5);
    else if (duration > 0.04) onChange(0.75);
    else if (fast.current >= 3)
      onChange(Math.min(window.devicePixelRatio, 1.5));
    elapsed.current = 0;
    frames.current = 0;
  });
  return null;
}
function StudioCamera({
  portrait,
  heightScale,
}: {
  portrait: boolean;
  heightScale: number;
}) {
  const { camera, size } = useThree();
  useEffect(() => {
    const targetY = (portrait ? 1.615 : 0.96) * heightScale;
    const height = (portrait ? 0.71 : 2.12) * Math.max(1, heightScale);
    const width = portrait ? 0.72 : 0.9;
    const aperture = Math.tan(T.MathUtils.degToRad(16));
    const distance =
      Math.max(height, (width * size.height) / size.width) / (2 * aperture);
    camera.position.set(0, targetY + 0.04, distance);
    camera.lookAt(0, targetY, 0);
  }, [camera, size, portrait, heightScale]);
  return null;
}
export function Preview({
  avatar,
  rotation,
  portrait,
}: {
  avatar: AvatarData;
  rotation: number;
  portrait: boolean;
}) {
  return (
    <Canvas
      shadows={{ type: T.PCFShadowMap }}
      camera={{ position: [0, 1.65, 2], fov: 32 }}
      dpr={[1, 2]}
    >
      <StudioCamera
        portrait={portrait}
        heightScale={measure(avatar, "height")}
      />
      <hemisphereLight args={["#fff5e7", "#c3d4dc", 1.45]} />
      <directionalLight
        position={[-2.4, 4.2, 3.6]}
        intensity={2.1}
        color="#fff3e9"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-left={-1.1}
        shadow-camera-right={1.1}
        shadow-camera-top={2.2}
        shadow-camera-bottom={-0.25}
        shadow-camera-near={0.2}
        shadow-camera-far={9}
        shadow-normalBias={0.004}
        shadow-bias={-0.0002}
      />
      <directionalLight
        position={[2, 2, -3]}
        intensity={1.65}
        color="#d8eeff"
      />
      {!portrait && (
        <mesh
          position={[0, 0.002, 0]}
          rotation-x={-Math.PI / 2}
          scale={[0.39, 0.24, 1]}
        >
          <circleGeometry args={[1, 48]} />
          <meshBasicMaterial
            color="#847292"
            transparent
            opacity={0.24}
            depthWrite={false}
          />
        </mesh>
      )}
      <group rotation-y={rotation}>
        <Avatar data={avatar} />
      </group>
    </Canvas>
  );
}
export default function GameScene(props: GameProps) {
  const fleet = useRef(newFleet()),
    mounted = useRef<Ride | undefined>(undefined);
  const [near, setNear] = useState("");
  const [balancedDpr, setBalancedDpr] = useState(1);
  const l = interactives.find((l) => l.id === near);
  return (
    <Canvas
      frameloop={props.paused ? "demand" : "always"}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      }}
      shadows={props.quality === "High" ? { type: T.PCFShadowMap } : false}
      dpr={
        props.quality === "Low"
          ? 0.72
          : props.quality === "High"
            ? 1.45
            : balancedDpr
      }
      camera={{ far: 440, near: 0.1, fov: 61 }}
      onCreated={({ gl }) => {
        gl.shadowMap.autoUpdate = false;
        gl.shadowMap.needsUpdate = true;
      }}
    >
      <color attach="background" args={["#cdded2"]} />
      <fog
        attach="fog"
        args={["#b5cfd9", 78, props.quality === "Low" ? 185 : 335]}
      />
      <ShadowRefresh quality={props.quality} travel={props.travel.seq} />
      <Lighting dynamicSun />
      <CityEnvironment weather={props.weather} />
      <Landscape
        low={props.quality === "Low"}
        high={props.quality === "High"}
      />
      <City />
      <MotorPool fleet={fleet} ride={mounted} pose={props.pose} />
      <Neighborhood
        pose={props.pose}
        decor={props.decor}
        herd={props.herd}
        crop={props.crop}
      />
      {props.peers.map((peer) => (
        <CityNeighbor key={peer.id} peer={peer} />
      ))}
      <Signs />
      {props.quality === "Balanced" && <Adaptive onChange={setBalancedDpr} />}
      {l && (
        <mesh position={[l.x, 0.41, l.z]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[1.04, 1.12, 32]} />
          <meshBasicMaterial color="#ffdc85" />
        </mesh>
      )}
      <Player
        fleet={fleet}
        mounted={mounted}
        {...props}
        report={(loc) => {
          setNear(loc.id);
          props.report(loc);
        }}
      />
    </Canvas>
  );
}
