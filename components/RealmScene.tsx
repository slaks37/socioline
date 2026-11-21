"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as T from "three";
import Avatar from "./Avatar";
import { initialAvatar, selectCollection, selectOutfit } from "./avatar-data";
import {
  elevation,
  type Chunk,
  type Entity,
  type Peer,
  type Specification,
} from "../engine/world.ts";
const guestLook = selectCollection(initialAvatar, "australia");
const guideLook = selectOutfit(selectCollection(initialAvatar, "afrika"), 3);
type Props = {
  chunks: Chunk[];
  objects: Entity[];
  peers: Peer[];
  self: string;
  seed: number;
  spec: Specification;
  send: (x: number, z: number, run: boolean) => void;
  paused: boolean;
  stick: React.RefObject<{ x: number; z: number }>;
};
function Terrain({
  chunk,
  seed,
  spec,
}: {
  chunk: Chunk;
  seed: number;
  spec: Specification;
}) {
  const geo = useMemo(() => {
    const g = new T.PlaneGeometry(32, 32, 32, 32);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position,
      c = [],
      col = new T.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + chunk.cx * 32 + 16,
        z = p.getZ(i) + chunk.cz * 32 + 16,
        h = elevation(seed, spec, x, z);
      p.setXYZ(i, x, h, z);
      const dx = Math.abs(x / 32 - Math.round(x / 32)) * 32,
        dz = Math.abs(z / 32 - Math.round(z / 32)) * 32;
      col.set(
        Math.min(dx, dz) < 1.7
          ? "#c5b599"
          : spec.biome === "highland"
            ? "#829978"
            : spec.biome === "tropical"
              ? "#79a371"
              : "#95a978",
      );
      col.multiplyScalar(0.96 + 0.04 * Math.sin(x * 2 + z));
      c.push(col.r, col.g, col.b);
    }
    g.setAttribute("color", new T.Float32BufferAttribute(c, 3));
    g.computeVertexNormals();
    return g;
  }, [chunk, seed, spec]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors />
    </mesh>
  );
}
const shapes = {
  box: new T.BoxGeometry(),
  round: new T.CylinderGeometry(0.5, 0.5, 1, 10),
  leaf: new T.IcosahedronGeometry(0.56, 1),
  roof: new T.ConeGeometry(0.75, 1, 4),
};
type Part = {
  kind: keyof typeof shapes;
  p: number[];
  s: number[];
  c: string;
  r: number;
};
function Objects({
  items,
  seed,
  spec,
}: {
  items: Entity[];
  seed: number;
  spec: Specification;
}) {
  const meshes = useMemo(() => {
    const parts: Part[] = [];
    for (const e of items) {
      const h = elevation(seed, spec, e.x, e.z),
        add = (
          kind: Part["kind"],
          x: number,
          y: number,
          z: number,
          w: number,
          height: number,
          d: number,
          c: string,
          r = 0,
        ) =>
          parts.push({
            kind,
            p: [e.x + x, h + y, e.z + z],
            s: [w, height, d],
            c,
            r,
          });
      const k = e.kind;
      if (k === "tree") {
        add("round", 0, 1.2, 0, 0.46, 2.5, 0.46, "#695a47");
        for (let j = 0; j < 4; j++)
          add(
            "leaf",
            Math.sin(j * 2.4) * 0.6,
            2.8 + j * 0.17,
            Math.cos(j * 2.4) * 0.7,
            e.size * 1.6,
            e.size * 1.9,
            e.size * 1.5,
            ["#52785c", "#779063", "#79965e", "#688457"][j],
          );
      } else if (k === "river" || k === "lake") {
        add(
          k === "lake" ? "round" : "box",
          0,
          0.22,
          0,
          k === "lake" ? 9 : 5,
          0.24,
          k === "lake" ? 9 : 26,
          "#5f9fa3",
        );
      } else if (k === "bench") {
        add("box", 0, 0.6, 0, 2.2, 0.17, 0.73, "#a57858");
        add("box", 0, 1, -0.26, 2.2, 0.64, 0.16, "#b68c67");
        for (const x of [-0.8, 0.8])
          add("round", x, 0.33, 0, 0.17, 0.62, 0.17, "#3a5554");
      } else if (k === "farm") {
        for (let j = -3; j <= 3; j++) {
          add("box", j * 1.1, 0.12, 0, 0.78, 0.21, 6, "#84654b");
          for (let n = -2; n <= 2; n++)
            add("leaf", j * 1.1, 0.47, n, 1, 1, 1, "#6e934d");
        }
      } else {
        const size = e.size;
        add("box", 0, 0.15, 0, size * 2.2, 0.3, size * 1.6, "#d3c2a4");
        add("box", 0, 1.86, -0.3, size * 2, 3.5, size * 1.34, "#d7c3a1");
        add(
          "roof",
          0,
          4.3,
          0,
          size * 2.3,
          1.8,
          size * 1.8,
          k === "school" ? "#ae7961" : k === "market" ? "#a59972" : "#68867c",
          Math.PI / 4,
        );
        for (let i = -2; i <= 2; i++) {
          add(
            "box",
            i * 1.54,
            1.63,
            size * 0.607,
            i === 0 ? 1.16 : 1.1,
            i === 0 ? 2.7 : 1.42,
            0.17,
            "#456b70",
          );
        }
        add("box", 0, 2.98, size * 0.73, 3.4, 0.18, 1.8, "#bfad8c");
      }
    }
    const mat = new T.MeshStandardMaterial({ roughness: 0.83 }),
      o = new T.Object3D();
    return (Object.keys(shapes) as (keyof typeof shapes)[]).map((kind) => {
      const group = parts.filter((p) => p.kind === kind),
        m = new T.InstancedMesh(shapes[kind], mat, group.length);
      group.forEach((p, i) => {
        o.position.fromArray(p.p);
        o.scale.fromArray(p.s);
        o.rotation.set(0, p.r, 0);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        m.setColorAt(i, new T.Color(p.c));
      });
      return m;
    });
  }, [items, seed, spec]);
  useEffect(
    () => () => {
      meshes.forEach((m) => m.dispose());
      meshes[0]?.material.dispose();
    },
    [meshes],
  );
  return (
    <>
      {meshes.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
    </>
  );
}
function Walker({
  peer,
  seed,
  spec,
  mine,
}: {
  peer: Peer;
  seed: number;
  spec: Specification;
  mine: boolean;
}) {
  const ref = useRef<T.Group>(null),
    speed = useRef(0),
    at = useRef(new T.Vector3());
  useFrame((_, dt) => {
    if (!ref.current) return;
    at.current.set(peer.x, elevation(seed, spec, peer.x, peer.z), peer.z);
    ref.current.position.lerp(at.current, Math.min(1, dt * 14));
    ref.current.rotation.y = peer.heading;
    speed.current = peer.moving ? 4 : 0;
  });
  return (
    <group ref={ref}>
      <Avatar
        data={peer.look ?? (mine ? initialAvatar : guestLook)}
        speed={speed}
      />
    </group>
  );
}
function Controller({ peers, self, seed, spec, send, paused, stick }: Props) {
  const pressed = useRef(new Set<string>()),
    yaw = useRef(0),
    time = useRef(0),
    target = useRef(new T.Vector3());
  useEffect(() => {
    const set = pressed.current;
    set.clear();
    if (paused) return;
    const handle = (e: KeyboardEvent, on: boolean) => {
      if ((e.target as HTMLElement)?.closest("input,select,textarea,dialog"))
        return;
      if (
        ![
          "KeyW",
          "KeyS",
          "KeyA",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "ShiftLeft",
          "ShiftRight",
        ].includes(e.code)
      )
        return;
      e.preventDefault();
      if (on) set.add(e.code);
      else set.delete(e.code);
    };
    const down = (e: KeyboardEvent) => handle(e, true),
      up = (e: KeyboardEvent) => handle(e, false),
      blur = () => set.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    const canvas = document.querySelector<HTMLCanvasElement>(
      ".realm-scene canvas",
    );
    const drag = (e: PointerEvent) => {
      if (canvas?.hasPointerCapture(e.pointerId))
        yaw.current -= e.movementX * 0.007;
    };
    const start = (e: PointerEvent) => canvas?.setPointerCapture(e.pointerId);
    canvas?.addEventListener("pointermove", drag);
    canvas?.addEventListener("pointerdown", start);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      canvas?.removeEventListener("pointermove", drag);
      canvas?.removeEventListener("pointerdown", start);
      set.clear();
    };
  }, [paused]);
  useFrame(({ camera }, dt) => {
    const p = peers.find((p) => p.id === self);
    if (!p) return;
    const k = pressed.current;
    time.current += dt;
    if (time.current > 0.1) {
      time.current = 0;
      let x =
          stick.current.x +
          Number(k.has("KeyD") || k.has("ArrowRight")) -
          Number(k.has("KeyA") || k.has("ArrowLeft")),
        z =
          stick.current.z +
          Number(k.has("KeyS") || k.has("ArrowDown")) -
          Number(k.has("KeyW") || k.has("ArrowUp"));
      const n = Math.max(1, Math.hypot(x, z));
      x /= n;
      z /= n;
      send(
        paused ? 0 : x * Math.cos(yaw.current) + z * Math.sin(yaw.current),
        paused ? 0 : z * Math.cos(yaw.current) - x * Math.sin(yaw.current),
        k.has("ShiftLeft") || k.has("ShiftRight"),
      );
    }
    const h = elevation(seed, spec, p.x, p.z);
    target.current.set(
      p.x + Math.sin(yaw.current) * 7,
      h + 3.9,
      p.z + Math.cos(yaw.current) * 7,
    );
    camera.position.lerp(target.current, 1 - Math.exp(-12 * dt));
    camera.lookAt(p.x, h + 1.55, p.z);
  });
  return null;
}
export default function RealmScene(props: Props) {
  const { chunks, objects, seed, spec, peers, self } = props;
  const items = useMemo(
    () => chunks.flatMap((c) => c.entities).concat(objects),
    [chunks, objects],
  );
  return (
    <Canvas
      dpr={[0.75, 1.25]}
      camera={{ fov: 58, far: 70, position: [0, 5, 8] }}
    >
      <color attach="background" args={["#c6dee4"]} />
      <fog attach="fog" args={["#c6dee4", 24, 54]} />
      <hemisphereLight args={["#f1f6ed", "#667f71", 1.3]} />
      <directionalLight position={[-18, 29, 12]} intensity={2.5} />
      {chunks.map((c) => (
        <Terrain key={c.id} chunk={c} {...{ seed, spec }} />
      ))}
      <Objects {...{ items, seed, spec }} />
      {peers.map((peer) => (
        <Walker
          key={peer.id}
          {...{ peer, seed, spec }}
          mine={peer.id === self}
        />
      ))}
      <group position={[-2, elevation(seed, spec, -2, -2), -2]}>
        <Avatar data={guideLook} />
      </group>
      <Controller {...props} />
    </Canvas>
  );
}
