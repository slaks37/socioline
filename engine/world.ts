import { z } from "zod";
export const kinds = [
  "school",
  "market",
  "library",
  "farm",
  "community",
  "river",
  "lake",
] as const;
export const specification = z
  .object({
    name: z.string().trim().min(2).max(72),
    type: z.enum(["village", "campus", "city"]),
    biome: z.enum(["tropical", "temperate", "highland"]),
    terrain: z.enum(["rolling", "mountain", "plain"]),
    features: z.array(z.enum(kinds)).min(1).max(7),
  })
  .strict();
export type Specification = z.infer<typeof specification>;
export type Entity = {
  id: string;
  kind: string;
  x: number;
  z: number;
  size: number;
};
export type Chunk = { cx: number; cz: number; id: string; entities: Entity[] };
export type Position = { x: number; z: number };
export const CHUNK = 32,
  BOUND = 1024,
  VERSION = 1;
export function interpret(prompt: string): Specification {
  const p = prompt.normalize("NFKC").toLowerCase();
  const dictionary = [
    /sekolah|school/,
    /pasar|market/,
    /pustaka|library/,
    /pertanian|kebun|farm|sawah/,
    /komunitas|community/,
    /sungai|river/,
    /danau|lake/,
  ];
  const features = kinds.filter((_, i) => dictionary[i].test(p));
  const type = /kampus|campus|learning/.test(p)
      ? "campus"
      : /kota|city/.test(p)
        ? "city"
        : "village",
    biome = /tropi|tropic/.test(p)
      ? "tropical"
      : /pegunungan|mountain|highland/.test(p)
        ? "highland"
        : "temperate";
  return specification.parse({
    name:
      { campus: "Kampus", city: "Kota", village: "Desa" }[type] +
      " " +
      { tropical: "Tropis", highland: "Pegunungan", temperate: "Hijau" }[biome],
    type,
    biome,
    terrain: /gunung|mountain/.test(p)
      ? "mountain"
      : /datar|plain/.test(p)
        ? "plain"
        : "rolling",
    features: features.length ? features : ["community", "library"],
  });
}
function noise(seed: number, x: number, z: number, n: number) {
  let h =
    Math.imul(x + 3747, 73856093) ^
    Math.imul(z - 137, 19349663) ^
    Math.imul(n, 83492791) ^
    seed;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function elevation(
  seed: number,
  spec: Specification,
  x: number,
  z: number,
) {
  const amp =
    spec.terrain === "mountain" ? 3.4 : spec.terrain === "plain" ? 0.3 : 1.35;
  return (
    (Math.sin(x * 0.049 + (seed % 71)) * Math.cos(z * 0.04 + (seed % 31)) +
      0.31 * Math.sin((x + z) * 0.12)) *
    amp
  );
}
export function generateChunk(
  seed: number,
  spec: Specification,
  cx: number,
  cz: number,
): Chunk {
  const id = "v" + VERSION + "/" + cx + "/" + cz,
    entities: Entity[] = [];
  const add = (kind: string, x: number, z: number, size: number) =>
    entities.push({
      id: id + "/" + entities.length,
      kind,
      x: cx * CHUNK + x,
      z: cz * CHUNK + z,
      size,
    });
  const facilities = spec.features.filter((k) => k !== "lake" && k !== "river");
  if (facilities.length) {
    const i = (Math.abs(cx) + Math.abs(cz) * 3) % facilities.length;
    add(facilities[i], 10, 10, spec.type === "campus" ? 5.4 : 4.4);
    if (spec.type === "city")
      add(facilities[(i + 1) % facilities.length], 23, 8, 3);
  }
  if (spec.features.includes("river") && cx % 4 === 1) add("river", 22, 16, 3);
  else if (spec.features.includes("lake") && (cx + cz) % 4 === 2)
    add("lake", 22, 20, 4.6);
  for (let i = 0; i < (spec.biome === "tropical" ? 12 : 7); i++) {
    const x = 4 + noise(seed, cx, cz, i) * 24,
      z = 4 + noise(seed, cx, cz, i + 30) * 24;
    if (
      entities.some(
        (e) =>
          Math.hypot(e.x - (cx * 32 + x), e.z - (cz * 32 + z)) < e.size + 2,
      )
    )
      continue;
    add("tree", x, z, 1 + noise(seed, cx, cz, i + 60) * 1.2);
  }
  return { cx, cz, id, entities };
}
export function blocked(x: number, z: number, entities: Entity[]) {
  if (Math.abs(x) > BOUND - 3 || Math.abs(z) > BOUND - 3) return true;
  return entities.some((e) => {
    const dx = Math.abs(x - e.x),
      dz = Math.abs(z - e.z);
    switch (e.kind) {
      case "river":
        return dx < 2.5 && dz < 13;
      case "lake":
        return Math.hypot(dx, dz) < e.size;
      case "tree":
        return dx < 0.42 && dz < 0.42;
      case "bench":
        return dx < 1.22 && dz < 0.68;
      case "farm":
        return false;
      default:
        return dx < e.size + 0.35 && dz < e.size * 0.73 + 0.35;
    }
  });
}
export function advance(
  p: Position,
  dx: number,
  dz: number,
  run: boolean,
  dt: number,
  entities: Entity[],
) {
  const n = Math.hypot(dx, dz);
  if (n < 0.03) return { ...p };
  const step = (Math.min(0.15, dt) * (run ? 8 : 4.2)) / Math.max(1, n);
  const nx = p.x + dx * step,
    nz = p.z + dz * step;
  const x = blocked(nx, p.z, entities) ? p.x : nx;
  return { x, z: blocked(x, nz, entities) ? p.z : nz };
}
export const documentFields = {
  "Calling Map": ["Karunia", "Pengalaman", "Arah eksplorasi"],
  "Mission Charter": ["Panggilan", "Komitmen", "Batas etis"],
  "Community Profile": ["Konteks", "Aset komunitas", "Sumber berizin"],
  "Stakeholder Map": ["Pihak terkait", "Hubungan", "Pengambilan keputusan"],
  "Opportunity Brief": ["Kebutuhan", "Bukti", "Peluang"],
  "Value Proposition Canvas": ["Jobs", "Pains", "Gains", "Proposisi nilai"],
  "Cultural Map": ["Kebiasaan", "Bahasa dan nilai", "Sumber berizin"],
  "Mission Model Canvas": [
    "Mitra",
    "Penerima manfaat",
    "Sumber daya",
    "Keberlanjutan",
  ],
  "Experiment Evidence": ["Hipotesis", "Metode", "Hasil", "Keputusan"],
  "Delivery Log": ["Layanan", "Tanggal", "Catatan peserta", "Tindak lanjut"],
  "Follow-up Plan": ["Langkah", "Penanggung jawab", "Tanggal evaluasi"],
  "Business Model": ["Nilai", "Biaya", "Sumber pendapatan"],
  "Project Proposal": ["Tujuan", "Kegiatan", "Penanggung jawab"],
  "Impact Report": ["Kondisi awal", "Pengamatan", "Keterbatasan bukti"],
} as const;
export type Peer = {
  look?: import("./avatar.ts").AvatarData;
  id: string;
  x: number;
  z: number;
  heading: number;
  moving: boolean;
};
export type Snapshot = {
  type: "state";
  peers: Peer[];
  version: number;
  tick: number;
};
export function suggestedAction(
  text: string,
): "place-tree" | "place-bench" | "document" | "navigation" | "help" {
  const q = text.toLowerCase();
  if (/(tanam|tambah|buat|place|plant).*(pohon|tree)/.test(q))
    return "place-tree";
  if (/(tambah|buat|place|build).*(bangku|bench)/.test(q)) return "place-bench";
  if (/proposal|proyek|project|charter|dokumen/.test(q)) return "document";
  if (/ke |cari|arah|where|find|library|pustaka|peluang|opportunit/.test(q))
    return "navigation";
  return "help";
}
