"use client";
import RiverBank from "./RiverBank";
import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import {
  riverX,
  valleyGeometry,
  terrainHeight,
  waterLevel,
} from "../lib/river-valley";
import { liftSite, liftAt, trafficAt } from "./city-physics";

function Land() {
  const geom = useMemo(() => {
    const { vertices, indices } = valleyGeometry(),
      g = new T.BufferGeometry(),
      colors = new Float32Array(vertices.length),
      color = new T.Color();
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i],
        y = vertices[i + 1],
        z = vertices[i + 2];
      color.set(
        y > 9 ? "#918976" : Math.abs(x - riverX(z)) < 7 ? "#bbad86" : "#83a67b",
      );
      color.multiplyScalar(
        0.89 + 0.11 * Math.sin(x * 0.49 + z * 0.21) * Math.cos(z * 0.55),
      );
      color.toArray(colors, i);
    }
    g.setAttribute("position", new T.BufferAttribute(vertices, 3));
    g.setAttribute("color", new T.BufferAttribute(colors, 3));
    g.setIndex(new T.BufferAttribute(indices, 1));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geom} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.94} />
    </mesh>
  );
}
function Water({ from, to }: { from: number; to: number }) {
  const geom = useMemo(() => {
    const verts: number[] = [],
      indices: number[] = [],
      uv: number[] = [];
    for (let z = from; z <= to; z++) {
      const i = verts.length / 3;
      for (const side of [-1, 1]) {
        verts.push(riverX(z) + side * 6.6, waterLevel(from), z);
        uv.push(side, z);
      }
      if (i) indices.push(i - 2, i, i - 1, i - 1, i, i + 1);
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    return g;
  }, [from, to]);
  const mat = useRef<T.ShaderMaterial>(null);
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.time.value += dt;
  });
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  return (
    <mesh geometry={geom}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        side={T.DoubleSide}
        vertexShader={
          "varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
        }
        fragmentShader={
          "uniform float time; varying vec3 v; void main(){float wave=sin(v.z*3.6+v.x*.8-time*1.6+sin(v.x*3.))+sin(v.x*5.6+v.z*1.3-time*.9);vec3 c=mix(vec3(.10,.33,.34),vec3(.19,.48,.46),.5+.25*wave); c+=.055*smoothstep(1.38,1.98,wave);gl_FragColor=vec4(c,1.);}"
        }
      />
    </mesh>
  );
}
function Traffic({ lane }: { lane: number }) {
  const car = useRef<T.Group>(null);
  useFrame(({ clock }) => {
    const obj = car.current;
    if (!obj) return;
    const t = trafficAt(Date.now() / 1000, lane);
    obj.position.set(t.x, 0.17, t.z);
    obj.rotation.y = t.angle;
  });
  return (
    <group ref={car}>
      <mesh position-y={0.47}>
        <boxGeometry args={[1.43, 0.68, 3.1]} />
        <meshStandardMaterial color={lane ? "#ab5941" : "#59877c"} />
      </mesh>
      <mesh position={[0, 0.99, -0.16]}>
        <boxGeometry args={[1.25, 0.5, 1.65]} />
        <meshStandardMaterial color="#507079" />
      </mesh>
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((end) => (
          <mesh
            key={side + ":" + end}
            position={[side * 0.7, 0.29, end * 0.96]}
            rotation-z={Math.PI / 2}
          >
            <cylinderGeometry args={[0.3, 0.3, 0.18, 12]} />
            <meshStandardMaterial color="#353d40" />
          </mesh>
        )),
      )}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.48, 0.56, 1.56]}>
          <boxGeometry args={[0.28, 0.13, 0.04]} />
          <meshBasicMaterial color="#fff0bb" />
        </mesh>
      ))}
    </group>
  );
}
function Falls() {
  const drops = useRef<T.InstancedMesh>(null);
  const matrix = useMemo(() => new T.Matrix4(), []);
  useFrame(({ clock }) => {
    const m = drops.current;
    if (!m) return;
    for (let i = 0; i < 70; i++) {
      const phase =
        (i * 0.618 + clock.elapsedTime * (0.65 + (i % 5) * 0.03)) % 1;
      matrix.makeTranslation(
        riverX(-42) + (((i * 37) % 70) / 70 - 0.5) * 8,
        3.38 - 4 * phase * phase,
        -42.4 + 1.8 * phase,
      );
      m.setMatrixAt(i, matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <mesh position={[riverX(-42), 1.32, -42]}>
        <boxGeometry args={[8, 4.0, 0.78]} />
        <meshStandardMaterial color="#a0d3cf" transparent opacity={0.85} />
      </mesh>
      <instancedMesh
        ref={drops}
        args={[undefined, undefined, 70]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.095, 6, 4]} />
        <meshBasicMaterial color="#e3f5ed" />
      </instancedMesh>
    </>
  );
}
export function CityEnvironment({
  weather,
}: {
  weather: "auto" | "sun" | "rain";
}) {
  const [nearBank, setNearBank] = useState(false);
  const lift = useRef<T.Mesh>(null),
    sun = useRef<T.DirectionalLight>(null),
    rain = useRef<T.LineSegments>(null);
  const rainGeo = useMemo(() => {
    const points = [];
    for (let i = 0; i < 320; i++) {
      const x = Math.sin(i * 113) * 12,
        z = Math.sin(i * 71) * 12,
        y = ((i * 0.618) % 1) * 14;
      points.push(x, y, z, x + 0.07, y - 0.48, z);
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(points, 3));
    return g;
  }, []);
  useFrame(({ clock, camera, scene }) => {
    const t = Date.now() / 1000;
    if (!nearBank && camera.position.x < -45) setNearBank(true);
    else if (nearBank && camera.position.x > -34) setNearBank(false);
    if (lift.current) lift.current.position.y = liftAt(t) - 0.085;
    const night = (1 - Math.cos((t * Math.PI) / 180)) * 0.5,
      wet =
        weather === "rain" ||
        (weather === "auto" && Math.floor(t / 75) % 4 === 2);
    if (sun.current) {
      sun.current.intensity = (wet ? 0.42 : 1.8) * (1 - night * 0.83);
      sun.current.position.set(
        42 * Math.cos(t / 90),
        25 + 45 * (1 - night),
        36,
      );
      sun.current.color.setHSL(0.09 - night * 0.07, 0.27 + night * 0.12, 0.88);
    }
    if (scene.fog instanceof T.Fog)
      scene.fog.color.setHSL(
        0.53 + night * 0.1,
        0.2,
        0.8 - night * 0.56 - (wet ? 0.12 : 0),
      );
    if (rain.current) {
      rain.current.visible = wet;
      rain.current.position.set(
        camera.position.x,
        camera.position.y - 4 - ((t * 9) % 6),
        camera.position.z,
      );
    }
  });
  return (
    <>
      <Land />
      {nearBank && <RiverBank />}
      <Water from={-72} to={-42} />
      <Water from={-42 + 1} to={58} />
      <Falls />
      <directionalLight ref={sun} />
      <lineSegments ref={rain} geometry={rainGeo} frustumCulled={false}>
        <lineBasicMaterial color="#c5dde3" transparent opacity={0.65} />
      </lineSegments>
      <mesh ref={lift} position={[liftSite.x, 0, liftSite.z]}>
        <boxGeometry args={[2, 0.17, 1.6]} />
        <meshStandardMaterial color="#d8a556" />
      </mesh>
      <mesh position={[liftSite.x + 1.11, 2.15, liftSite.z]}>
        <boxGeometry args={[0.12, 4.3, 0.14]} />
        <meshStandardMaterial color="#596969" />
      </mesh>
      <Traffic lane={0} />
      <Traffic lane={1} />
    </>
  );
}
export function spawnFloor(x: number, z: number) {
  return x < -82 ? Math.max(terrainHeight(x, z), waterLevel(z) - 0.75) : 0;
}
