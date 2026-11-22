export const cityDistricts = [
  { name: "City Center", use: "Kantor dan bisnis", x: 30, z: -47 },
  { name: "Residential", use: "Rumah dan sosial", x: -31, z: -4 },
  { name: "Green District", use: "Kebun dan peternakan", x: -60, z: 46 },
  { name: "Marketplace", use: "Toko dan perdagangan", x: 35, z: 29 },
  { name: "Academy", use: "Belajar AI dan keterampilan", x: -46, z: -24 },
  { name: "Industrial", use: "Bengkel dan produksi", x: 46, z: -49 },
  { name: "Nature Park", use: "Air terjun dan sungai", x: -91, z: -40 },
  { name: "Social Plaza", use: "Komunitas", x: 0, z: 23 },
  { name: "Transit Hub", use: "Garasi dan helipad", x: 18, z: 46 },
] as const;
export function districtAt(x: number, z: number) {
  if (x < -82) return cityDistricts[6];
  return cityDistricts.reduce((a, b) =>
    Math.hypot(x - b.x, z - b.z) < Math.hypot(x - a.x, z - a.z) ? b : a,
  );
}
