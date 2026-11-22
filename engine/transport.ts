export const vehicles = {
  motor: {
    label: "Motor",
    x: 16,
    z: 44,
    width: 0.8,
    length: 2.05,
    height: 1.55,
    speed: 12,
  },
  mobil: {
    label: "Mobil",
    x: 22,
    z: 44,
    width: 1.78,
    length: 3.65,
    height: 1.52,
    speed: 15,
  },
  helikopter: {
    label: "Helikopter",
    x: 33,
    z: 48,
    width: 2.15,
    length: 5.1,
    height: 2.32,
    speed: 19,
  },
} as const;
export type Ride = keyof typeof vehicles;
export const rideIds = Object.keys(vehicles) as Ride[];
export type Parking = { x: number; y: number; z: number; facing: number };
export const newFleet = () =>
  Object.fromEntries(
    rideIds.map((id) => [
      id,
      { x: vehicles[id].x, y: 0.12, z: vehicles[id].z, facing: Math.PI / 2 },
    ]),
  ) as Record<Ride, Parking>;
