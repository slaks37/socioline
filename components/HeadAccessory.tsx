"use client";
import { useMemo, useEffect } from "react";
import * as T from "three";

type Point = [number, number, number];
const tau = Math.PI * 2;
function Trim({
  points,
  color,
  width = 0.003,
}: {
  points: Point[];
  color: string;
  width?: number;
}) {
  const path = useMemo(
    () => new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
    [points],
  );
  return (
    <mesh>
      <tubeGeometry
        args={[path, Math.max(10, points.length * 2), width, 5, false]}
      />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}
function Oval({
  p,
  scale,
  color,
  tilt = 0,
}: {
  p: Point;
  scale: Point;
  color: string;
  tilt?: number;
}) {
  return (
    <mesh position={p} scale={scale} rotation-z={tilt}>
      <sphereGeometry args={[1, 20, 14]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}
const fabricRows = [
  [0.248, 0.002, 0.002, 0],
  [0.236, 0.076, 0.084, 0],
  [0.197, 0.135, 0.147, 0.36],
  [0.136, 0.179, 0.183, 0.72],
  [0.082, 0.187, 0.192, 1.02],
  [0.005, 0.189, 0.187, 1.19],
  [-0.085, 0.179, 0.172, 1.0],
  [-0.155, 0.155, 0.145, 0.62],
  [-0.201, 0.139, 0.12, 0.01],
  [-0.237, 0.133, 0.135, 0],
  [-0.31, 0.182, 0.148, 0],
  [-0.36, 0.222, 0.134, 0],
];
function drapeGeometry() {
  const positions: number[] = [],
    indices: number[] = [],
    colors: number[] = [];
  const n = 64;
  for (let j = 0; j < fabricRows.length; j++)
    for (let i = 0; i <= n; i++) {
      const [y, rx, rz, opening] = fabricRows[j],
        a = opening + ((tau - 2 * opening) * i) / n;
      const fold =
        (0.007 * Math.sin(a * 8 + y * 14) + 0.003 * Math.cos(a * 12)) *
        T.MathUtils.smoothstep(-y, 0.105, 0.36);
      const shade =
        0.7 +
        0.3 * Math.max(0, Math.cos(a + 0.5)) +
        0.08 * Math.sin(a * 5 + y * 10) * T.MathUtils.smoothstep(-y, 0.1, 0.36);
      positions.push(
        (rx + fold) * Math.sin(a),
        y - 0.025 * Math.cos(a) * T.MathUtils.smoothstep(-y, 0.2, 0.36),
        (rz + fold) * Math.cos(a) - 0.012,
      );
      colors.push(shade, shade, shade);
      if (i && j) {
        const d = j * (n + 1) + i,
          a = d - n - 2;
        indices.push(a, d - 1, d, a, d, a + 1);
      }
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
function Scarf({ color }: { color: string }) {
  const geo = useMemo(() => drapeGeometry(), []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group>
      <mesh geometry={geo}>
        <meshBasicMaterial color={color} vertexColors side={T.DoubleSide} />
      </mesh>
      {[-1, 1].map((s) => (
        <Trim
          key={s}
          points={fabricRows
            .slice(2, 10)
            .map(([y, rx, rz, a]) => [
              s * Math.sin(a) * rx,
              y,
              rz * Math.cos(a) - 0.01,
            ])}
          color={new T.Color(color).multiplyScalar(0.67).getStyle()}
          width={0.0023}
        />
      ))}
    </group>
  );
}
function Spectacles({ sun }: { sun: boolean }) {
  const rim = sun ? "#624539" : "#493b42";
  return (
    <group position={[0, -0.003, 0.177]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.071, 0, -0.012]} rotation-y={s * 0.35}>
          <mesh scale={[1, 0.81, 1]}>
            <torusGeometry args={[0.052, sun ? 0.005 : 0.0026, 7, 40]} />
            <meshBasicMaterial color={rim} />
          </mesh>
          {sun && (
            <mesh scale={[0.051, 0.04, 1]}>
              <circleGeometry args={[1, 40]} />
              <meshBasicMaterial
                color="#453b45"
                transparent
                opacity={0.83}
                side={T.DoubleSide}
              />
            </mesh>
          )}
          <Trim
            points={[
              [s * 0.05, 0.003, 0],
              [s * 0.065, 0.008, -0.04],
              [s * 0.09, -0.002, -0.14],
              [s * 0.09, -0.026, -0.17],
            ]}
            color={rim}
            width={0.0027}
          />
        </group>
      ))}
      <Trim
        points={[
          [-0.023, 0.006, 0.002],
          [0, 0.015, 0.009],
          [0.023, 0.006, 0.002],
        ]}
        color={rim}
      />
    </group>
  );
}
function Hat({ kind }: { kind: string }) {
  const trim = "#80694f";
  if (kind === "Peci")
    return (
      <group position={[0, 0.161, -0.012]}>
        <mesh scale={[1, 1, 0.93]}>
          <cylinderGeometry args={[0.144, 0.179, 0.119, 40]} />
          <meshBasicMaterial color="#29282e" />
        </mesh>
        <mesh position-y={-0.049} scale={[1, 1, 0.93]}>
          <cylinderGeometry args={[0.179, 0.18, 0.015, 40]} />
          <meshBasicMaterial color="#45404b" />
        </mesh>
      </group>
    );
  const brim = kind === "Sun hat",
    knit = kind === "Beanie",
    color = brim ? "#c5a078" : knit ? "#87676c" : "#424b68";
  return (
    <group position={[0, 0.074, -0.014]}>
      <mesh scale={[0.194, brim ? 0.151 : 0.186, 0.2]}>
        <sphereGeometry args={[1, 36, 19, 0, tau, 0, Math.PI / 2]} />
        <meshBasicMaterial color={color} side={T.DoubleSide} />
      </mesh>
      {brim ? (
        <>
          <Oval
            p={[0, -0.003, 0]}
            scale={[0.28, 0.016, 0.28]}
            color="#d5b48a"
          />
          <mesh scale={[1, 1, 1.02]} position-y={0.012}>
            <cylinderGeometry args={[0.194, 0.197, 0.024, 42]} />
            <meshBasicMaterial color={trim} />
          </mesh>
        </>
      ) : knit ? (
        <mesh position-y={0.017}>
          <cylinderGeometry args={[0.196, 0.192, 0.052, 48]} />
          <meshBasicMaterial color="#795963" />
        </mesh>
      ) : (
        <Oval
          p={[0, -0.003, 0.151]}
          scale={[0.157, 0.014, 0.122]}
          color={color}
        />
      )}
    </group>
  );
}
export default function HeadAccessory({
  accessory,
  hood,
  collection,
  outfit,
  sunglassesRaised,
}: {
  accessory: string;
  hood: boolean;
  collection: string;
  outfit: number;
  sunglassesRaised: boolean;
}) {
  const gold = "#d4a253";
  const trim = ["Cap", "Beanie", "Peci", "Sun hat"].includes(accessory);
  const wrap = accessory === "Headwrap";
  return (
    <group>
      {hood &&
        (wrap ? (
          <group position={[0, 0.073, -0.017]}>
            <Oval
              p={[0, 0.026, 0]}
              scale={[0.194, 0.163, 0.19]}
              color="#d18529"
            />
            {[0, 1, 2].map((i) => (
              <mesh
                key={i}
                position-y={0.004 + i * 0.033}
                rotation={[Math.PI / 2, 0.12, 0.1]}
                scale={[1, 1.02, 0.7]}
              >
                <torusGeometry args={[0.181 - i * 0.007, 0.013, 8, 45]} />
                <meshBasicMaterial color={i === 1 ? "#363958" : "#ecae39"} />
              </mesh>
            ))}
          </group>
        ) : (
          <Scarf
            color={
              outfit === 5
                ? "#3e455f"
                : collection === "afrika"
                  ? "#994e3d"
                  : "#bd93ab"
            }
          />
        ))}
      {trim && <Hat kind={accessory} />}
      {(accessory === "Glasses" || accessory === "Sunglasses") && (
        <group
          rotation-x={sunglassesRaised ? -0.97 : 0}
          position-z={sunglassesRaised ? 0.029 : 0}
        >
          <Spectacles sun={accessory === "Sunglasses"} />
        </group>
      )}
      {accessory === "Headphones" && (
        <group>
          <Trim
            points={[
              [0.187, -0.021, -0.005],
              [0.193, 0.113, -0.016],
              [0.122, 0.216, -0.026],
              [0, 0.247, -0.034],
              [-0.122, 0.216, -0.026],
              [-0.193, 0.113, -0.016],
              [-0.187, -0.021, -0.005],
            ]}
            color="#393744"
            width={0.016}
          />
          {[-1, 1].map((s) => (
            <group key={s}>
              <Oval
                p={[s * 0.182, -0.012, -0.003]}
                scale={[0.037, 0.062, 0.045]}
                color="#3b3947"
              />
              <Oval
                p={[s * 0.211, -0.012, -0.003]}
                scale={[0.012, 0.044, 0.034]}
                color="#aa9eaf"
              />
            </group>
          ))}
        </group>
      )}
      {accessory === "Flower" && (
        <group position={[0.146, 0.094, 0.168]} rotation={[0.1, 0.45, 0.34]}>
          {Array.from({ length: 5 }, (_, i) => (
            <group key={i} rotation-z={(tau * i) / 5}>
              <Oval
                p={[0, 0.018, 0]}
                scale={[0.014, 0.024, 0.006]}
                color={i % 2 ? "#fff2da" : "#fff9e9"}
              />
            </group>
          ))}
          <Oval
            p={[0, 0, 0.008]}
            scale={[0.009, 0.009, 0.007]}
            color="#ecc468"
          />
        </group>
      )}
      {(accessory === "Gold pins" || accessory === "Hair clips") && (
        <group position={[0.145, 0.079, 0.166]} rotation-y={0.4}>
          {[0, 1].map((i) => (
            <Trim
              key={i}
              points={[
                [-0.015, i * 0.014, 0],
                [0.008, 0.014 + i * 0.014, -0.004],
                [0.033, 0.027 + i * 0.014, -0.018],
              ]}
              color={gold}
              width={0.0038}
            />
          ))}
          {accessory === "Gold pins" && (
            <>
              <Trim
                points={[
                  [0.035, 0.018, -0.011],
                  [0.045, -0.013, -0.011],
                  [0.046, -0.063, -0.011],
                ]}
                color={gold}
                width={0.0019}
              />
              <Oval
                p={[0.046, -0.07, -0.01]}
                scale={[0.005, 0.013, 0.006]}
                color="#bd4841"
              />
            </>
          )}
        </group>
      )}
      {accessory === "Hoops" &&
        [-1, 1].map((s) => (
          <mesh
            key={s}
            position={[s * 0.173, -0.067, 0.008]}
            rotation-y={s * 0.53}
            scale={[0.82, 1.05, 1]}
          >
            <torusGeometry args={[0.028, 0.0031, 6, 28]} />
            <meshBasicMaterial color={gold} />
          </mesh>
        ))}
    </group>
  );
}
