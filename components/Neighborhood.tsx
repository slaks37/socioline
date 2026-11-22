"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useEffect, useRef, useState, type RefObject } from "react";
import * as T from "three";
import { doorSites, doorAmount } from "../lib/streets";
import { selectBase, selectCollection, initialAvatar } from "./avatar-data";
import Avatar from "./Avatar";
import { activitySites } from "../engine/city-life";
import type { Pose } from "./GameScene";

function Doors({ pose }: { pose: RefObject<Pose> }) {
  const mesh = useRef<T.InstancedMesh>(null);
  const o = useMemo(() => new T.Object3D(), []);
  useFrame(() => {
    if (!mesh.current) return;
    doorSites.forEach((door, i) => {
      const a = doorAmount(door.x, door.z, pose.current.x, pose.current.z);
      for (const [n, side] of [-1, 1].entries()) {
        o.position.set(door.x + side * (0.53 + 1.04 * a), 1.44, door.z + 0.04);
        o.updateMatrix();
        mesh.current!.setMatrixAt(i * 2 + n, o.matrix);
      }
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, doorSites.length * 2]}
      frustumCulled={false}
    >
      <boxGeometry args={[1.04, 2.28, 0.085]} />
      <meshStandardMaterial
        color="#739b98"
        transparent
        opacity={0.55}
        metalness={0.1}
        roughness={0.23}
      />
    </instancedMesh>
  );
}
function Plate({ text, x, z }: { text: string; x: number; z: number }) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 96;
    const g = c.getContext("2d")!;
    g.fillStyle = "#243e39";
    g.fillRect(0, 0, 512, 96);
    g.fillStyle = "#f2d9a0";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "600 39px sans-serif";
    g.fillText(text, 256, 50, 480);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[x, 2.2, z]}>
      <planeGeometry args={[2.65, 0.5]} />
      <meshBasicMaterial map={texture} side={T.DoubleSide} />
    </mesh>
  );
}
const mentors = (
  [
    ["office", "amerika", "Female"],
    ["farm", "indonesia", "Male"],
    ["home", "afrika", "Female"],
    ["academy", "tiongkok", "Male"],
  ] as const
).map(([id, region, gender]) => ({
  id,
  site: activitySites.find((s) => s.id === id)!,
  avatar: selectBase(selectCollection(initialAvatar, region), gender),
}));
function LocalMentors({ pose }: { pose: RefObject<Pose> }) {
  const [visible, setVisible] = useState<number>(0);
  const mask = useRef(0),
    elapsed = useRef(1);
  useFrame((_, dt) => {
    elapsed.current += dt;
    if (elapsed.current < 0.35) return;
    elapsed.current = 0;
    const next = mentors.reduce(
      (n, m, i) =>
        Math.hypot(m.site.x - pose.current.x, m.site.z - pose.current.z) <
        (mask.current & (1 << i) ? 26 : 22)
          ? n | (1 << i)
          : n,
      0,
    );
    if (next !== mask.current) {
      mask.current = next;
      setVisible(next);
    }
  });
  return (
    <>
      {mentors.map(
        (m, i) =>
          (visible & (1 << i)) !== 0 && (
            <group
              key={m.id}
              position={[
                m.site.x + 0.87,
                m.id === "farm" ? 0.02 : 0.3,
                m.site.z - 0.74,
              ]}
            >
              <Avatar data={m.avatar} />
            </group>
          ),
      )}
    </>
  );
}
export function Neighborhood({
  pose,
  decor,
  herd,
  crop,
}: {
  pose: RefObject<Pose>;
  decor: number;
  herd: boolean;
  crop: boolean;
}) {
  return (
    <>
      <Doors pose={pose} />
      <Plate text="SocioLine" x={0} z={14.28} />
      <Plate text="Transit Hub" x={18} z={43} />
      <LocalMentors pose={pose} />
      <group position={[-60, 0, 48]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position-x={-2 + i * 1.6}>
            <mesh position-y={0.13}>
              <boxGeometry args={[1.28, 0.25, 3.6]} />
              <meshStandardMaterial color="#885d44" />
            </mesh>
            {crop &&
              [-1, 0, 1].map((z) => (
                <mesh key={z} position={[0, 0.52, z]}>
                  <coneGeometry args={[0.38, 0.76, 6]} />
                  <meshStandardMaterial color="#6c983e" />
                </mesh>
              ))}
          </group>
        ))}
      </group>
      <group position={[-66, 0.02, 44]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 1.45, 0.54, 0]}>
            <boxGeometry args={[0.13, 0.23, 3.8]} />
            <meshStandardMaterial color="#9d7552" />
          </mesh>
        ))}
        {herd && (
          <group>
            <mesh position-y={0.83}>
              <boxGeometry args={[0.76, 0.75, 1.42]} />
              <meshStandardMaterial color="#e5dfcc" />
            </mesh>
            <mesh position={[0, 1.07, 0.85]}>
              <boxGeometry args={[0.52, 0.51, 0.57]} />
              <meshStandardMaterial color="#705347" />
            </mesh>
            {[-0.28, 0.28].flatMap((x) =>
              [-0.48, 0.48].map((z) => (
                <mesh key={x + "," + z} position={[x, 0.3, z]}>
                  <boxGeometry args={[0.16, 0.59, 0.18]} />
                  <meshStandardMaterial color="#624c3b" />
                </mesh>
              )),
            )}
          </group>
        )}
      </group>
      {activitySites.map((s) => (
        <Plate
          key={s.id}
          text={s.name}
          x={s.x}
          z={s.z + (s.id === "friend" ? -0.4 : -1.7)}
        />
      ))}
      <group position={[-7, 0.18, 27]}>
        <Avatar data={initialAvatar} />
      </group>
      <mesh position={[-33.65, 0.81, -7.95]}>
        <boxGeometry args={[1.39, 0.11, 0.65]} />
        <meshStandardMaterial
          color={["#ab694e", "#608779", "#797299"][decor]}
        />
      </mesh>
      <mesh position={[-31, 0.293, -9]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[2.65, 2.3]} />
        <meshStandardMaterial
          color={["#cca974", "#72938a", "#ac939c"][decor]}
        />
      </mesh>
    </>
  );
}
