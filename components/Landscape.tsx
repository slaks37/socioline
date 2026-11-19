"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { landmarks } from "../lib/content";
import { initialAvatar } from "./avatar-data";
import { Crowns, Paving, type TreeData } from "./Planting";
import Birds from "./BirdsongPark";
import Avatar from "./Avatar";
export const heroSites = [
  { id: "word-library", file: "grand-library", x: -46, z: -36 },
  { id: "global-discovery-center", file: "discovery-center", x: 0, z: -36 },
  { id: "innovation-campus", file: "innovation-campus", x: 46, z: -36 },
];
function Asset({ file, x, z }: { file: string; x: number; z: number }) {
  const { scene } = useLoader(GLTFLoader, "/models/" + file + ".glb");
  useEffect(() => {
    scene.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.castShadow = !o.material.transparent;
        o.receiveShadow = true;
      }
    });
  }, [scene]);
  return <primitive object={scene} position={[x, 0.12, z]} />;
}
function Signature({ site }: { site: (typeof heroSites)[number] }) {
  const [x, z] = [site.x, site.z];
  return (
    <Suspense fallback={null}>
      <Asset file={site.file} x={x} z={z} />
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
    const g = new T.PlaneGeometry(800, 800, 144, 144);
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
      p.setY(i, h);
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
      <meshStandardMaterial vertexColors roughness={1} />
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
  return (
    <mesh scale={390}>
      <sphereGeometry args={[1, 48, 24]} />
      <shaderMaterial
        side={T.BackSide}
        depthWrite={false}
        vertexShader={
          "varying vec3 dir; void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
        }
        fragmentShader={`varying vec3 dir;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 void main(){vec3 d=normalize(dir);float h=max(d.y,0.);vec3 s=mix(vec3(.74,.85,.87),vec3(.18,.48,.76),pow(h,.58));vec2 p=d.xz/max(.08,h)*2.;float n=noise(p)*.57+noise(p*2.1)*.28+noise(p*4.3)*.15;s=mix(s,vec3(.98,.97,.92),smoothstep(.53,.77,n)*smoothstep(.03,.23,h)*.9);gl_FragColor=vec4(s,1.);}`}
      />
    </mesh>
  );
}
function Pedestrian({ i }: { i: number }) {
  const g = useRef<T.Group>(null),
    speed = useRef(1.65);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime * 0.14 + i * 1.31;
    const x = ((i % 3) - 1) * 46 + Math.sin(t) * 6,
      z = (i < 3 ? -19 : 9) + Math.cos(t) * 1.7;
    g.current.position.set(x, 0.25, z);
    g.current.rotation.y = Math.atan2(6 * Math.cos(t), -1.7 * Math.sin(t));
  });
  return (
    <group ref={g}>
      <Avatar
        data={{
          ...initialAvatar,
          preset: i % 2 ? "Female" : "Male",
          skin: ["#895c43", "#f1c8a2", "#ba825e"][i % 3],
          outfit: ["#516987", "#b38b70", "#5d887a", "#c0af70"][i % 4],
          hair: ["Bob", "Curls", "Crop"][i % 3],
        }}
        speed={speed}
      />
    </group>
  );
}
export default function Landscape({ low = false }: { low?: boolean }) {
  return (
    <>
      <Sky />
      {!low && <Birds />}
      <Reflection />
      <Globe />
      <Hills />
      <Suspense fallback={null}>
        <Asset file="plaza" x={0} z={14} />
      </Suspense>
      <Scenery low={low} />
      {heroSites.map((site) => (
        <Signature key={site.id} site={site} />
      ))}
      {Array.from({ length: low ? 3 : 6 }, (_, i) => (
        <Pedestrian key={i} i={i} />
      ))}
    </>
  );
}
