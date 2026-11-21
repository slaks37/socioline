import * as T from "three";
import { useEffect, useMemo } from "react";
import type { Garment } from "./avatar-wardrobe";

type Ring = [
  height: number,
  radiusX: number,
  radiusZ: number,
  offsetZ?: number,
];
function shade(geometry: T.BufferGeometry) {
  const n = geometry.getAttribute("normal"),
    colors: number[] = [];
  for (let i = 0; i < n.count; i++) {
    const light = n.getY(i) * 0.45 + n.getZ(i) * 0.42 - n.getX(i) * 0.38;
    const value =
      0.66 +
      0.32 * T.MathUtils.smoothstep(light, -0.55, 0.08) +
      0.08 * T.MathUtils.smoothstep(light, 0.48, 0.7);
    colors.push(value, value * 0.985, value * 0.985);
  }
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  return geometry;
}
function cut(rings: Ring[], pleats = 0, depth = 0) {
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  const segments = 48;
  const first = rings[0][0],
    span = rings[rings.length - 1][0] - first;
  for (const [row, [y, w, d, oz = 0]] of rings.entries()) {
    const t = (y - first) / span;
    for (let j = 0; j <= segments; j++) {
      const angle = (j / segments - 0.5) * 2 * Math.PI;
      const fold =
        1 + depth * (0.15 + 0.85 * t) * Math.cos(angle * pleats + 0.28);
      positions.push(
        w * fold * Math.sin(angle),
        y,
        oz + d * fold * Math.cos(angle),
      );
      uv.push(j / segments, 1 - t);
      if (row > 0 && j > 0) {
        const k = row * (segments + 1) + j,
          a = k - segments - 2;
        indices.push(a, k - 1, k, a, k, a + 1);
      }
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return shade(geo);
}
const sphere = shade(new T.SphereGeometry(1, 20, 15));
export const uprightNeck = cut([
  [0.134, 0.047, 0.052],
  [0.108, 0.058, 0.061],
  [0.056, 0.06, 0.059],
  [0.027, 0.072, 0.064],
  [0, 0.086, 0.072],
]);
export function Oval({
  p,
  s,
  color,
  tilt = 0,
}: {
  p: [number, number, number];
  s: [number, number, number];
  color: string;
  tilt?: number;
}) {
  return (
    <mesh position={p} scale={s} rotation-z={tilt} geometry={sphere} castShadow>
      <meshBasicMaterial color={color} vertexColors toneMapped={false} />
    </mesh>
  );
}
export function ClothMesh({
  geometry,
  color = "#ffffff",
  map,
  outline = false,
}: {
  geometry: T.BufferGeometry;
  color?: string;
  map?: T.Texture;
  outline?: boolean;
}) {
  return (
    <>
      {outline && (
        <mesh geometry={geometry} scale={[1.014, 1.001, 1.015]}>
          <meshBasicMaterial
            color="#443641"
            side={T.BackSide}
            toneMapped={false}
          />
        </mesh>
      )}
      <mesh geometry={geometry} castShadow>
        <meshBasicMaterial
          map={map || null}
          color={color}
          vertexColors
          toneMapped={false}
        />
      </mesh>
    </>
  );
}
export function useTailor(g: Garment, female: boolean) {
  const geometry = useMemo(() => {
    const shoulder = female ? 0.195 : 0.221,
      waist = female ? 0.128 : 0.155,
      chest = female ? 0.18 : 0.192;
    const loose =
      g.top === "hoodie" || g.top === "varsity" || g.top === "blazer";
    const hips = female ? 0.172 : 0.177;
    const short = g.bottom === "shorts",
      wide = g.bottom === "jeans" || g.bottom === "slacks";
    const torso = cut([
      [1.496, 0.064, 0.065],
      [1.481, 0.087, 0.078],
      [1.45, shoulder * 0.77, 0.098],
      [1.425, shoulder, 0.112],
      [1.392, shoulder * 1.01, 0.116],
      [1.344, chest + 0.013, 0.126, 0.006],
      [1.295, chest, 0.132, 0.009],
      [1.225, chest * 0.94, 0.119, 0.004],
      [1.152, waist + (loose ? 0.028 : 0.009), 0.103],
      [1.084, waist + (loose ? 0.034 : 0.006), 0.101],
      [1.055, waist + (loose ? 0.039 : 0.014), 0.104],
      [loose ? 0.985 : 1.032, hips + (loose ? 0.025 : 0), 0.119],
      [loose ? 0.979 : 1.026, hips + (loose ? 0.023 : 0), 0.116],
    ]);
    const hipsGeo = cut([
      [1.06, 0.138, 0.095],
      [1.036, hips * 0.93, 0.109],
      [1.008, hips, 0.123],
      [0.969, hips * 1.08, 0.13],
      [0.915, hips * 1.04, 0.119],
      [0.874, hips * 0.84, 0.104],
      [0.862, 0.09, 0.083],
    ]);
    const legRadius = female ? 0.083 : 0.094;
    const thigh = cut(
      [
        [0.068, legRadius * 0.71, 0.082],
        [0.045, legRadius * 0.97, 0.105],
        [0, legRadius * 1.05, 0.12],
        [-0.115, legRadius * 1.04, 0.108],
        [-0.24, legRadius, 0.102],
        [-0.315, legRadius * (short ? 1.18 : 0.9), 0.093],
        [
          short ? -0.329 : -0.411,
          legRadius * (short ? 1.17 : 0.8),
          short ? 0.094 : 0.078,
        ],
      ],
      3,
      0.024,
    );
    const shin = cut(
      [
        [0.02, 0.071, 0.079],
        [0, 0.075, 0.083],
        [-0.073, 0.077, 0.09, -0.008],
        [-0.149, 0.081, 0.092, -0.015],
        [-0.224, 0.074, 0.082, -0.012],
        [-0.301, wide ? 0.083 : 0.066, wide ? 0.083 : 0.075],
        [-0.353, wide ? 0.085 : 0.063, wide ? 0.088 : 0.07],
        [-0.38, wide ? 0.078 : 0.057, 0.069],
      ],
      4,
      0.03,
    );
    const bareThigh = cut([
      [-0.288, 0.074, 0.076],
      [-0.33, 0.07, 0.073],
      [-0.38, 0.061, 0.067],
      [-0.424, 0.061, 0.066],
    ]);
    const calf = cut([
      [0.023, 0.059, 0.062],
      [-0.004, 0.061, 0.067],
      [-0.082, 0.067, 0.074, -0.008],
      [-0.146, 0.061, 0.07, -0.013],
      [-0.23, 0.047, 0.06, -0.012],
      [-0.316, 0.04, 0.046],
      [-0.382, 0.044, 0.048],
    ]);
    const armWidth = female ? 0.061 : 0.069;
    const arm = cut([
      [0.034, 0.03, 0.036],
      [0.02, armWidth * 0.85, 0.074],
      [0, armWidth, 0.076],
      [-0.073, armWidth * 0.93, 0.07],
      [-0.163, armWidth * 0.76, 0.058],
      [-0.253, armWidth * 0.67, 0.049],
      [-0.318, armWidth * 0.76, 0.054],
      [-0.405, armWidth * 0.59, 0.045],
      [-0.48, armWidth * 0.42, 0.039],
    ]);
    const length = (
      { short: 0.196, roll: 0.32, long: 0.464, puff: 0.245, bare: 0.0 } as const
    )[g.sleeve];
    const puff = g.sleeve === "puff",
      w = armWidth * (puff ? 1.35 : 1.14);
    const sleeve = cut([
      [0.045, 0.024, 0.027],
      [0.034, w * 0.68, 0.067],
      [0.005, w * 0.98, puff ? 0.097 : 0.086],
      [-0.049, w * 1.05, puff ? 0.099 : 0.089],
      [-length * 0.56, w * (puff ? 1.28 : 0.93), puff ? 0.109 : 0.08],
      [-length * 0.79, w * (puff ? 1.24 : 0.86), puff ? 0.1 : 0.072],
      [-length + 0.022, w * (puff ? 0.8 : 0.82), 0.068],
      [-length, w * (puff ? 0.66 : 0.81), 0.064],
    ]);
    const skirtLength = g.waist === "plaid" ? 0.475 : 0.84;
    const skirt = cut(
      Array.from({ length: 19 }, (_, i): Ring => {
        const t = i / 18;
        const widen = 0.16 + 0.048 * Math.min(1, t * 4) + 0.062 * t;
        return [
          1.065 - skirtLength * t,
          widen,
          0.118 + 0.038 * Math.min(1, t * 3) + 0.072 * t,
        ];
      }),
      12,
      0.034,
    );
    const shoe = cut(
      [
        [0.115, 0.04, 0.059, -0.017],
        [0.094, 0.055, 0.075, -0.011],
        [0.077, 0.062, 0.096, 0.014],
        [0.062, 0.065, 0.114, 0.026],
        [0.034, 0.069, 0.12, 0.032],
        [0.018, 0.069, 0.119, 0.032],
        [0.009, 0.062, 0.108, 0.03],
      ],
      0,
    );
    const sole = cut([
      [0.032, 0.07, 0.122, 0.032],
      [0.016, 0.071, 0.123, 0.032],
      [0.004, 0.067, 0.12, 0.032],
      [0.002, 0.063, 0.113, 0.032],
    ]);
    return {
      torso,
      hips: hipsGeo,
      thigh,
      shin,
      bareThigh,
      calf,
      arm,
      sleeve,
      skirt,
      shoe,
      sole,
    };
  }, [g, female]);
  useEffect(
    () => () => Object.values(geometry).forEach((mesh) => mesh.dispose()),
    [geometry],
  );
  return geometry;
}
export function Trim({
  p,
  s,
  color,
  tilt = 0,
}: {
  p: [number, number, number];
  s: [number, number, number];
  color: string;
  tilt?: number;
}) {
  return (
    <mesh position={p} scale={s} rotation-z={tilt}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}
function Strap({
  points,
  color,
  width = 0.012,
}: {
  points: [number, number, number][];
  color: string;
  width?: number;
}) {
  const geo = useMemo(
    () =>
      new T.TubeGeometry(
        new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
        24,
        width,
        6,
        false,
      ),
    [points, width],
  );
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}
export function Carry({ bag }: { bag: Garment["bag"] }) {
  if (!bag) return null;
  if (bag === "pack")
    return (
      <group>
        <Oval
          p={[0, 1.207, -0.155]}
          s={[0.155, 0.209, 0.082]}
          color="#393440"
        />
        <Oval
          p={[0, 1.105, -0.211]}
          s={[0.128, 0.074, 0.039]}
          color="#524854"
        />
        <Trim
          p={[0, 1.145, -0.245]}
          s={[0.186, 0.008, 0.004]}
          color="#b39887"
        />
        {[-1, 1].map((k) => (
          <group key={k}>
            <Strap
              color="#55464b"
              width={0.018}
              points={[
                [k * 0.093, 1.14, -0.18],
                [k * 0.126, 1.426, -0.097],
                [k * 0.133, 1.462, 0.022],
                [k * 0.142, 1.382, 0.097],
                [k * 0.16, 1.224, 0.079],
                [k * 0.17, 1.135, -0.096],
              ]}
            />
            <Trim
              p={[k * 0.143, 1.328, 0.107]}
              s={[0.034, 0.019, 0.009]}
              color="#b69e7d"
            />
          </group>
        ))}
      </group>
    );
  const straw = bag === "straw",
    sling = bag === "sling",
    color = straw ? "#cca872" : sling ? "#3c3842" : "#e6cbb4";
  return (
    <group>
      <Strap
        color={straw ? "#af834c" : "#88654f"}
        width={0.009}
        points={[
          [0.19, 0.995, -0.071],
          [sling ? -0.114 : 0.145, 1.432, -0.06],
          [sling ? -0.125 : 0.151, 1.455, 0.019],
          [sling ? 0.01 : 0.165, 1.269, 0.13],
          [0.208, 0.988, 0.1],
        ]}
      />
      <Oval
        p={[0.213, 0.927, 0.014]}
        s={[0.039, 0.127, 0.117]}
        color={color}
        tilt={-0.055}
      />
      <Trim
        p={[0.244, 0.973, 0.018]}
        s={[0.007, 0.013, 0.176]}
        color={straw ? "#9f7844" : sling ? "#9b8479" : "#bc9f83"}
      />
    </group>
  );
}
