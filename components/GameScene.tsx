"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import * as T from "three";
import Landscape from "./Landscape";
import { traversable, ground } from "../lib/navigation";
import Signs from "./Signs";
import Avatar from "./Avatar";
import { City, Lighting } from "./City";
import type { AvatarData } from "./avatar-data";
import { landmarks, interactives } from "../lib/content";
export type Input = {
  dx: number;
  dz: number;
  jump: boolean;
  turn: number;
  tilt: number;
};
export type Location = { x: number; z: number; id: string };
export type Pose = { x: number; y: number; z: number; facing: number };
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
}: GameProps) {
  const root = useRef<T.Group>(null),
    keys = useRef(new Set<string>()),
    speed = useRef(0),
    vy = useRef(0),
    timer = useRef(0),
    reported = useRef<Location | null>(null),
    snap = useRef(true);
  const { gl, camera } = useThree();
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
        travel.resume?.y ?? ground(travel.x, travel.z, inside, 0),
        travel.z,
      );
      if (!travel.resume) input.current.turn = 0;
      root.current.rotation.y = travel.resume?.facing ?? Math.PI;
      vy.current = 0;
      snap.current = true;
    }
  }, [travel, inside, input]);
  useEffect(() => {
    const pressed = keys.current;
    pressed.clear();
    if (paused) {
      input.current.dx = 0;
      input.current.dz = 0;
      input.current.jump = false;
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
  useFrame((_, delta) => {
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
      mag > 0.08 ? (k.has("ShiftLeft") || k.has("ShiftRight") ? 10 : 5) : 0;
    if (speed.current) {
      dx /= mag;
      dz /= mag;
      const mx = dx * Math.cos(c.turn) + dz * Math.sin(c.turn),
        mz = dz * Math.cos(c.turn) - dx * Math.sin(c.turn);
      const free = (x: number, z: number) => traversable(x, z, inside);
      const nx = p.x + mx * dt * speed.current,
        nz = p.z + mz * dt * speed.current;
      if (free(nx, p.z)) p.x = nx;
      if (free(p.x, nz)) p.z = nz;
      const turn = Math.atan2(mx, mz) - g.rotation.y;
      g.rotation.y +=
        Math.atan2(Math.sin(turn), Math.cos(turn)) * (1 - Math.exp(-13 * dt));
    }
    const floor = ground(p.x, p.z, inside, p.y);
    if (!paused) {
      if (c.jump && p.y <= floor + 0.08) vy.current = 6;
      c.jump = false;
      vy.current -= 17 * dt;
      p.y = Math.max(floor, p.y + vy.current * dt);
      if (p.y <= floor) vy.current = 0;
    }
    const baseY = reduced.current ? floor : p.y;
    let arm = inside ? Math.min(distance, 3.6) : distance;
    for (let t = 0.6; t < arm; t += 0.45) {
      if (
        p.z < 40 &&
        !traversable(
          p.x + Math.sin(c.turn) * t,
          p.z + Math.cos(c.turn) * t,
          inside,
        )
      ) {
        arm = Math.max(0.5, t - 0.45);
        break;
      }
    }
    target.current.set(
      p.x + Math.sin(c.turn) * arm,
      baseY + Math.min(c.tilt, inside ? 2.55 : 3.4),
      p.z + Math.cos(c.turn) * arm,
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
      if (!last || last.x !== p.x || last.z !== p.z || last.id !== closest) {
        const next = { x: p.x, z: p.z, id: closest };
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
      <Avatar data={avatar} speed={speed} reading={paused} vertical={vy} />
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
function StudioCamera({ portrait }: { portrait: boolean }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const targetY = portrait ? 1.61 : 1.0;
    const height = portrait ? 0.91 : 2.24;
    const width = portrait ? 0.72 : 0.9;
    const aperture = Math.tan(T.MathUtils.degToRad(16));
    const distance =
      Math.max(height, (width * size.height) / size.width) / (2 * aperture);
    camera.position.set(0, targetY + 0.04, distance);
    camera.lookAt(0, targetY, 0);
  }, [camera, size, portrait]);
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
    <Canvas camera={{ position: [0, 1.65, 2], fov: 32 }} dpr={[1, 1.6]}>
      <StudioCamera portrait={portrait} />
      <hemisphereLight args={["#fff5e7", "#c3d4dc", 1.45]} />
      <directionalLight position={[-3, 4, 5]} intensity={1.8} color="#fff0df" />
      <directionalLight
        position={[2, 2, -3]}
        intensity={1.65}
        color="#d8eeff"
      />
      <group rotation-y={rotation}>
        <Avatar data={avatar} />
      </group>
    </Canvas>
  );
}
export default function GameScene(props: GameProps) {
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
      <Lighting />
      <Landscape
        low={props.quality === "Low"}
        high={props.quality === "High"}
      />
      <City />
      <Signs />
      {props.quality === "Balanced" && <Adaptive onChange={setBalancedDpr} />}
      {l && (
        <mesh position={[l.x, 0.41, l.z]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[1.04, 1.12, 32]} />
          <meshBasicMaterial color="#ffdc85" />
        </mesh>
      )}
      <Player
        {...props}
        report={(loc) => {
          setNear(loc.id);
          props.report(loc);
        }}
      />
    </Canvas>
  );
}
