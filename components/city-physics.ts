import R from "@dimforge/rapier3d-compat";
import * as T from "three";
import { cityParts, sectorCenter, type Part } from "../lib/city-plan";
import {
  valleyGeometry,
  valley,
  bankTrees,
  riverRocks,
} from "../lib/river-valley";

let initialized: Promise<void> | undefined;
export const readyPhysics = () => (initialized ??= R.init());
export const liftSite = { x: -35, z: 20.4, roof: 4.09 };
export const liftAt = (seconds: number) => {
  const t = ((seconds % 16) + 16) % 16;
  return (
    0.18 +
    (liftSite.roof - 0.18) *
      Math.min(1, Math.max(0, Math.min((t - 3) / 4, (14 - t) / 4)))
  );
};
export const trafficAt = (seconds: number, lane: number) => {
  const phase = seconds * 0.11 + lane * Math.PI;
  return {
    x: 59 * Math.cos(phase),
    z: -59 + 1.25 * Math.sin(phase),
    angle: Math.atan2(-59 * Math.sin(phase), 1.25 * Math.cos(phase)),
  };
};
export function makePhysics(
  models: { scene: T.Object3D; x: number; z: number }[],
  height: number,
  build: number,
) {
  const world = new R.World({ x: 0, y: -17, z: 0 });
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    angle = 0,
  ) => {
    const desc = R.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setTranslation(
      x,
      y,
      z,
    );
    if (angle)
      desc.setRotation({
        x: 0,
        y: Math.sin(angle / 2),
        z: 0,
        w: Math.cos(angle / 2),
      });
    return world.createCollider(desc);
  };
  function mountSector(pieces: Part[]) {
    const active: R.Collider[] = [];
    for (const part of pieces) {
      const [x, y, z] = part.p,
        [w, h, d] = part.size;
      if (
        Math.max(w, h, d) < 0.75 ||
        (part.s === "box" && h < 0.12 && Math.min(w, d) < 0.4)
      )
        continue;
      if (part.s === "round")
        active.push(
          world.createCollider(
            R.ColliderDesc.cylinder(h / 2, w / 2).setTranslation(x, y, z),
          ),
        );
      else active.push(box(x, y, z, w, h, d, part.r));
    }
    return active;
  }
  const { ground, ...sectors } = cityParts();
  mountSector(ground);
  const mounted = new Map<string, R.Collider[]>();
  let lastX = Infinity,
    lastZ = Infinity;
  function stream(x: number, z: number) {
    if (Math.hypot(x - lastX, z - lastZ) < 5) return;
    lastX = x;
    lastZ = z;
    for (const [id, pieces] of Object.entries(sectors)) {
      const center = sectorCenter(id),
        dist = Math.hypot(x - center.x, z - center.z);
      const existing = mounted.get(id);
      if (!existing && dist < 51) mounted.set(id, mountSector(pieces));
      else if (existing && dist > 65) {
        for (const collider of existing) world.removeCollider(collider, false);
        mounted.delete(id);
      }
    }
  }
  // Use the coarsened landmark models for physics regardless of graphical quality.
  for (const { scene, x, z } of models) {
    scene.updateMatrixWorld(true);
    scene.traverse((obj) => {
      if (!(obj instanceof T.Mesh)) return;
      const geom = obj.geometry,
        attr = geom.getAttribute("position");
      const verts = new Float32Array(attr.count * 3),
        v = new T.Vector3();
      for (let i = 0; i < attr.count; i++) {
        v.fromBufferAttribute(attr, i).applyMatrix4(obj.matrixWorld);
        verts.set([v.x, v.y, v.z], i * 3);
      }
      const idx = geom.index
        ? Uint32Array.from(geom.index.array)
        : Uint32Array.from({ length: attr.count }, (_, i) => i);
      world.createCollider(
        R.ColliderDesc.trimesh(verts, idx).setTranslation(x, 0.12, z),
      );
    });
  }
  for (const tree of bankTrees)
    world.createCollider(
      R.ColliderDesc.cylinder(tree.h * 0.38, tree.h * 0.047).setTranslation(
        tree.x,
        tree.y + tree.h * 0.38,
        tree.z,
      ),
    );
  for (const rock of riverRocks)
    world.createCollider(
      R.ColliderDesc.ball(rock.r * 0.79).setTranslation(rock.x, rock.y, rock.z),
    );
  const land = valleyGeometry();
  world.createCollider(R.ColliderDesc.trimesh(land.vertices, land.indices));
  for (const [x, z, w, d] of [
    [valley.west - 1, -7, 2, 135],
    [82.5, -7, 1, 135],
    [-34, -72.5, 235, 1],
    [-34, 58.5, 235, 1],
  ])
    box(x, 15, z, w, 60, d);
  const lift = box(liftSite.x, 0, liftSite.z, 2, 0.17, 1.6);
  const vehicles = [box(0, 0, 0, 1.4, 1.45, 3.1), box(0, 0, 0, 1.4, 1.45, 3.1)];
  const half = height * 0.94,
    radius = 0.26 * build;
  const player = world.createCollider(
    R.ColliderDesc.capsule(half - radius, radius).setTranslation(0, 4, 43),
  );
  const motor = world.createCharacterController(0.016);
  motor.enableAutostep(0.3, 0.15, true);
  motor.enableSnapToGround(0.2);
  motor.setMaxSlopeClimbAngle(Math.PI * 0.29);
  motor.setMinSlopeSlideAngle(Math.PI * 0.34);
  const setPosition = (p: T.Vector3) =>
    player.setTranslation({ x: p.x, y: p.y + half, z: p.z });
  return {
    world,
    move(p: T.Vector3, dx: number, dy: number, dz: number, clock: number) {
      stream(p.x, p.z);
      lift.setEnabled(p.y >= liftAt(clock) - 0.33);
      lift.setTranslation({
        x: liftSite.x,
        y: liftAt(clock) - 0.085,
        z: liftSite.z,
      });
      vehicles.forEach((car, i) => {
        const t = trafficAt(clock, i);
        car.setTranslation({ x: t.x, y: 0.83, z: t.z });
        car.setRotation({
          x: 0,
          y: Math.sin(t.angle / 2),
          z: 0,
          w: Math.cos(t.angle / 2),
        });
      });
      setPosition(p);
      world.updateSceneQueries();
      motor.computeColliderMovement(player, { x: dx, y: dy, z: dz });
      const m = motor.computedMovement();
      p.x += m.x;
      p.y += m.y;
      p.z += m.z;
      return motor.computedGrounded();
    },
    camera(origin: T.Vector3, direction: T.Vector3, len: number) {
      const hit = world.castRay(
        new R.Ray(origin, direction),
        len,
        true,
        undefined,
        undefined,
        player,
      );
      return hit ? Math.max(0.18, hit.toi - 0.15) : len;
    },
    dispose() {
      world.free();
    },
  };
}
