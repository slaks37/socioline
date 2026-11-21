"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { landmarks } from "../lib/content";
import {
  initialAvatar,
  selectBase,
  selectCollection,
  type Collection,
} from "./avatar-data";
import { Crowns, Paving, type TreeData } from "./Planting";
import Birds from "./BirdsongPark";
import Avatar from "./Avatar";
export const heroSites = [
  { id: "word-library", file: "grand-library", x: -46, z: -36 },
  { id: "global-discovery-center", file: "discovery-center", x: 0, z: -36 },
  { id: "innovation-campus", file: "innovation-campus", x: 46, z: -36 },
];
function Asset({
  file,
  x,
  z,
  distant = false,
}: {
  file: string;
  x: number;
  z: number;
  distant?: boolean;
}) {
  const model = useLoader(GLTFLoader, "/models/" + file + ".glb");
  const scene = useMemo(() => {
    const root = distant ? model.scene.clone(true) : model.scene;
    root.traverse((o) => {
      if (!(o instanceof T.Mesh)) return;
      if (distant) {
        const source = o.material as T.MeshStandardMaterial;
        o.material = new T.MeshLambertMaterial({
          vertexColors: true,
          side: source.side,
          transparent: source.transparent,
          opacity: source.opacity,
        });
      }
      o.castShadow = !distant && !o.material.transparent;
      o.receiveShadow = !distant;
    });
    return root;
  }, [model, distant]);
  useEffect(
    () => () => {
      if (distant)
        scene.traverse((o) => {
          if (o instanceof T.Mesh) o.material.dispose();
        });
    },
    [scene, distant],
  );
  return <primitive object={scene} position={[x, 0.12, z]} />;
}
function LandmarkAsset({
  file,
  x,
  z,
  high,
}: {
  file: string;
  x: number;
  z: number;
  high: boolean;
}) {
  const [near, setNear] = useState(false);
  useFrame(({ camera }) => {
    const range = Math.hypot(camera.position.x - x, camera.position.z - z);
    if (!near && range < 29) setNear(true);
    else if (near && range > 37) setNear(false);
  });
  const fallback = <Asset file={file + "-far"} x={x} z={z} distant />;
  return (
    <Suspense fallback={null}>
      {near || high ? (
        <Suspense fallback={fallback}>
          <Asset file={file} x={x} z={z} />
        </Suspense>
      ) : (
        fallback
      )}
    </Suspense>
  );
}
function Reflection() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const room = new RoomEnvironment(),
      pm = new T.PMREMGenerator(gl),
      rt = pm.fromScene(room, 0.06);
    scene.environment = rt.texture;
    scene.environmentIntensity = 0.34;
    return () => {
      scene.environment = null;
      rt.dispose();
      pm.dispose();
      room.dispose();
    };
  }, [gl, scene]);
  return null;
}
const rand = (i: number) => {
  const v = Math.sin(i * 127.1 + 73.5) * 43758.5453;
  return v - Math.floor(v);
};
function Hills() {
  const geo = useMemo(() => {
    const g = new T.PlaneGeometry(800, 800, 72, 72);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position,
      c = [],
      color = new T.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i);
      const r = Math.hypot(x * 0.93, z);
      const strength = T.MathUtils.smoothstep(r, 108, 155);
      const ridge =
        9 +
        15 * Math.abs(Math.sin(x * 0.018 + z * 0.021)) +
        11 * Math.sin(x * 0.054 + Math.sin(z * 0.031)) +
        6 * Math.cos(z * 0.09 + x * 0.023) +
        3 * Math.sin(x * 0.13 - z * 0.08);
      const h = -0.58 + strength * (ridge + Math.max(0, r - 145) * 0.095);
      p.setY(i, x < -77 && x > -161 && z > -85 && z < 72 ? -8 : h);
      color.setHSL(
        0.27 + 0.036 * Math.sin(z * 0.03),
        0.19 + 0.12 * rand(i),
        0.28 + 0.14 * rand(i) + h * 0.001,
      );
      c.push(color.r, color.g, color.b);
    }
    g.setAttribute("color", new T.Float32BufferAttribute(c, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}
type Instance = {
  p: [number, number, number];
  s: [number, number, number];
  r?: number;
  color: string;
};
function Batch({
  items,
  kind,
}: {
  items: Instance[];
  kind: "box" | "leaf" | "trunk";
}) {
  const mesh = useMemo(() => {
    const geo =
      kind === "leaf"
        ? new T.IcosahedronGeometry(1, 1)
        : kind === "trunk"
          ? new T.CylinderGeometry(0.35, 0.55, 1, 7)
          : new T.BoxGeometry();
    const mat = new T.MeshStandardMaterial({
      roughness: kind === "box" ? 0.56 : 0.92,
      metalness: kind === "box" ? 0.23 : 0,
    });
    const m = new T.InstancedMesh(geo, mat, items.length),
      o = new T.Object3D();
    for (const [i, d] of items.entries()) {
      o.position.fromArray(d.p);
      o.scale.fromArray(d.s);
      o.rotation.set(0, d.r ?? 0, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, new T.Color(d.color));
    }
    m.receiveShadow = true;
    m.castShadow = kind !== "box";
    return m;
  }, [items, kind]);
  useEffect(
    () => () => {
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh.dispose();
    },
    [mesh],
  );
  return <primitive object={mesh} />;
}
function Scenery({ low }: { low: boolean }) {
  const { trunks, trees, city } = useMemo(() => {
    const trunks: Instance[] = [],
      trees: TreeData[] = [],
      city: Instance[] = [];
    function tree(x: number, z: number, i: number, h: number) {
      trunks.push({
        p: [x, h * 0.37, z],
        s: [0.46, h * 0.75, 0.46],
        color: "#746c59",
      });
      trees.push({ x, z, h });
    }

    for (let i = 0; i < (low ? 170 : 390); i++) {
      const x = (rand(i + 5) - 0.5) * 260,
        z = (rand(i + 430) - 0.5) * 225;
      if (x < -77 && z > -72 && z < 58) continue;
      if (Math.abs(x) > 76 || z < -69 || z > 49)
        tree(x, z, i, 4 + rand(i + 200) * 6);
    }
    for (let i = 0; i < 28; i++) {
      for (const z of [5, 44])
        if (Math.abs(i * 5 - 68) > 6)
          tree(i * 5 - 68, z, i + 90, 4 + rand(i) * 2.8);
    }
    for (let j = 0; j < landmarks.length; j++) {
      const l = landmarks[j];
      if (l.kind < 5) tree(l.x + 5.5, l.z + 3.5, 400 + j, 3.8 + rand(j) * 2.8);
    }
    for (const x of [-54, 54])
      for (let j = 0; j < 5; j++) tree(x - 8, 13 + j * 4, j, 5 + rand(j) * 1.8);
    for (let i = 0; i < 64; i++) {
      const a = (tau * i) / 64,
        r = 102 + rand(i + 102) * 43,
        x = Math.sin(a) * r,
        z = Math.cos(a) * r;
      if (x < -77 && z > -75 && z < 61) continue;
      const h = 5 + rand(i + 88) ** 3 * 33,
        w = 3 + rand(i) * 6,
        d = 4 + rand(i + 22) * 6;
      for (let col = 0; col < 4; col++) {
        for (let f = 0; f < h / 3.5; f++) {
          if ((i + f + col) % 4 === 0) continue;
          city.push({
            p: [
              x - w * 0.36 + col * w * 0.24,
              1.5 + f * 3.35,
              z + d * 0.5 + 0.035,
            ],
            s: [w * 0.15, 1.28, 0.07],
            color: (i + col) % 4 ? "#6c8894" : "#bbbab0",
          });
        }
      }
      city.push({
        p: [x, h / 2, z],
        s: [w, h, d],
        color: ["#7e9caa", "#92a8ad", "#738d9b", "#aab3ab"][i % 4],
      });
      for (let j = 2; j < h; j += 2.5)
        city.push({
          p: [x, j, z],
          s: [w + 0.15, 0.55, d + 0.15],
          color: "#758b95",
        });
      if (i % 3 === 0)
        city.push({
          p: [x, h + 1.5, z],
          s: [w * 0.7, 3, d * 0.7],
          color: "#90a0a2",
        });
    }
    return { trunks, trees, city };
  }, [low]);
  return (
    <>
      <Batch items={trunks} kind="trunk" />
      <Crowns trees={trees} />
      <Paving />
      <Batch items={city} kind="box" />
    </>
  );
}
function Globe() {
  const texture = useLoader(T.TextureLoader, "/materials/globe.webp");
  texture.colorSpace = T.SRGBColorSpace;
  return (
    <mesh position={[0, 3.12, -33.2]} rotation-y={1.6}>
      <sphereGeometry args={[2.02, 48, 32]} />
      <meshStandardMaterial map={texture} roughness={0.36} metalness={0.13} />
    </mesh>
  );
}
const tau = 2 * Math.PI;
function Sky() {
  const mat = useRef<T.MeshBasicMaterial>(null);
  useFrame(() => {
    const dusk = (1 - Math.cos(((Date.now() / 1000) * Math.PI) / 180)) * 0.5;
    mat.current?.color.setRGB(
      1 - dusk * 0.73,
      1 - dusk * 0.68,
      1 - dusk * 0.52,
    );
  });
  const sky = useLoader(T.TextureLoader, "/materials/sky.webp");
  sky.colorSpace = T.SRGBColorSpace;
  return (
    <mesh scale={390} renderOrder={-10}>
      <sphereGeometry args={[1, 32, 16]} />
      <meshBasicMaterial
        ref={mat}
        map={sky}
        side={T.BackSide}
        depthWrite={false}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  );
}
// Use the same wardrobe and palette on both sides of the pedestrian detail transition.
const pedestrians = (
  [
    ["indonesia", "Male", "#34415c", "#b39b80"],
    ["afrika", "Female", "#f3e4cf", "#403044"],
    ["australia", "Male", "#727254", "#ae9874"],
    ["tiongkok", "Female", "#eee2d1", "#783e46"],
    ["amerika", "Male", "#333751", "#af9479"],
    ["australia", "Female", "#eee0d4", "#88a6ce"],
  ] as const satisfies ReadonlyArray<
    readonly [Collection, "Male" | "Female", string, string]
  >
).map(([collection, preset, top, bottom]) => ({
  avatar: selectCollection(selectBase(initialAvatar, preset), collection),
  top,
  bottom,
}));
function DistantWalker({ i }: { i: number }) {
  const phase = useRef({ value: i });
  const geometry = useMemo(() => {
    const parts: T.BufferGeometry[] = [];
    function oval(
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      tint: string,
    ) {
      const g = new T.SphereGeometry(1, 7, 5).scale(w, h, d).translate(x, y, z);
      const colors = new Float32Array(g.attributes.position.count * 3),
        color = new T.Color(tint);
      for (let n = 0; n < colors.length; n += 3) color.toArray(colors, n);
      g.setAttribute("color", new T.BufferAttribute(colors, 3));
      parts.push(g);
    }
    const { avatar, top: shirt, bottom } = pedestrians[i];
    const { skin, hairColor = "#372c29" } = avatar;
    const skirt =
      avatar.preset === "Female" && avatar.collection !== "australia";
    const shorts = avatar.collection === "australia";
    oval(0, 1.67, 0, 0.16, 0.2, 0.15, skin);
    oval(0, 1.79, -0.015, 0.17, 0.12, 0.16, hairColor);
    if (avatar.preset === "Female") {
      oval(
        0,
        avatar.hair === "Bun" ? 1.86 : 1.59,
        -0.1,
        0.14,
        0.17,
        0.095,
        hairColor,
      );
    }
    oval(0, 1.18, 0, 0.25, 0.34, 0.16, shirt);
    if (skirt) oval(0, 0.68, 0, 0.245, 0.34, 0.17, bottom);
    for (const side of [-1, 1]) {
      oval(side * 0.245, 1.18, 0, 0.08, 0.22, 0.08, shirt);
      oval(side * 0.25, 0.96, 0.015, 0.06, 0.13, 0.06, skin);
      oval(
        side * 0.115,
        0.53,
        0,
        0.097,
        0.42,
        0.103,
        shorts || skirt ? skin : bottom,
      );
      if (shorts) oval(side * 0.115, 0.72, 0, 0.12, 0.21, 0.13, bottom);
      oval(side * 0.115, 0.15, 0.055, 0.105, 0.085, 0.16, "#4c423b");
    }
    return mergeGeometries(parts);
  }, [i]);
  const material = useMemo(() => {
    const m = new T.MeshLambertMaterial({ vertexColors: true });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.stepPhase = phase.current;
      shader.vertexShader =
        "uniform float stepPhase;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\ntransformed.z+=sin(stepPhase)*sign(position.x)*max(0.,.92-position.y)*.25;",
        );
    };
    return m;
  }, []);
  useFrame((_, dt) => {
    phase.current.value += dt * 3.6;
  });
  return <mesh geometry={geometry} material={material} />;
}
function Pedestrian({ i }: { i: number }) {
  const g = useRef<T.Group>(null),
    speed = useRef(1.65);
  const [near, setNear] = useState(false);
  useFrame(({ clock, camera }) => {
    if (!g.current) return;
    const t = clock.elapsedTime * 0.14 + i * 1.31;
    const x = ((i % 3) - 1) * 46 + Math.sin(t) * 6,
      z = (i < 3 ? -19 : 9) + Math.cos(t) * 1.7;
    const range = Math.hypot(camera.position.x - x, camera.position.z - z);
    if (!near && range < 10) setNear(true);
    else if (near && range > 14) setNear(false);
    g.current.position.set(x, 0.25, z);
    g.current.rotation.y = Math.atan2(6 * Math.cos(t), -1.7 * Math.sin(t));
  });
  return (
    <group ref={g}>
      {near ? (
        <Avatar data={pedestrians[i].avatar} speed={speed} />
      ) : (
        <DistantWalker i={i} />
      )}
    </group>
  );
}
export default function Landscape({
  low = false,
  high = false,
}: {
  low?: boolean;
  high?: boolean;
}) {
  return (
    <>
      <Sky />
      {!low && <Birds />}
      {high && <Reflection />}
      <Globe />
      <Hills />
      <Suspense fallback={null}>
        <LandmarkAsset file="plaza" x={0} z={14} high={high} />
      </Suspense>
      <Scenery low={low} />
      {heroSites.map((site) => (
        <LandmarkAsset key={site.id} {...site} high={high} />
      ))}
      {Array.from({ length: low ? 3 : 6 }, (_, i) => (
        <Pedestrian key={i} i={i} />
      ))}
    </>
  );
}
