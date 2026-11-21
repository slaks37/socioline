type Collection = "indonesia" | "tiongkok" | "amerika" | "afrika" | "australia";
export type Top =
  | "overshirt"
  | "blouse"
  | "tee"
  | "hoodie"
  | "blazer"
  | "mandarin"
  | "varsity"
  | "knit"
  | "vest"
  | "track"
  | "wrap"
  | "tank";
type Bottom = "cargo" | "slacks" | "jeans" | "shorts" | "skirt" | "dress";
export type Garment = {
  top: Top;
  color: string;
  bottom: Bottom;
  pants: string;
  inner: string;
  sleeve: "short" | "roll" | "long" | "puff" | "bare";
  art?: "fabric" | "panel" | "flower" | "bamboo" | "crest" | "surf";
  waist?: "batik" | "silk" | "plaid" | "print";
  bag?: "pack" | "tote" | "sling" | "straw";
  shoes?: "sandals" | "flats" | "loafers";
  motif: number;
};

function wear(
  top: Top,
  color: string,
  bottom: Bottom,
  pants: string,
  details: Partial<Garment> = {},
): Garment {
  return {
    top,
    color,
    bottom,
    pants,
    inner: "#f8f0e3",
    sleeve: "long",
    motif: 0,
    ...details,
  };
}

const navy = "#30344c",
  ivory = "#f2e7dc",
  oat = "#c7ad90",
  brown = "#684e4c",
  ink = "#33313c",
  denim = "#8096b4",
  olive = "#68705b",
  lilac = "#c4a4cc",
  peach = "#cd9b99",
  burgundy = "#844955",
  sand = "#dfccb4",
  blue = "#596b90";

type OutfitSet = { male: Garment[]; female: Garment[] };
// In reference sheet order: the full-length ensemble, then the six outfit thumbnails.
const wardrobe: Record<Collection, OutfitSet> = {
  indonesia: {
    male: [
      wear("overshirt", navy, "cargo", oat, { sleeve: "roll", bag: "pack" }),
      wear("hoodie", "#c8c5cd", "cargo", ink, { bag: "pack" }),
      wear("overshirt", navy, "slacks", ivory, { sleeve: "roll", inner: navy }),
      wear("overshirt", "#64472f", "slacks", ink, {
        art: "fabric",
        sleeve: "short",
      }),
      wear("blazer", brown, "slacks", ink),
      wear("mandarin", ivory, "slacks", ink, {
        art: "panel",
        sleeve: "roll",
        motif: 3,
      }),
      wear("overshirt", olive, "cargo", ink, { sleeve: "roll", bag: "sling" }),
    ],
    female: [
      wear("blouse", ivory, "skirt", "#59413e", {
        sleeve: "puff",
        waist: "batik",
        bag: "tote",
        shoes: "flats",
      }),
      wear("overshirt", sand, "jeans", denim, { bag: "tote" }),
      wear("blouse", peach, "skirt", "#9a7777", {
        bag: "sling",
        shoes: "flats",
      }),
      wear("wrap", navy, "slacks", ivory, { art: "fabric", sleeve: "short" }),
      wear("blazer", ivory, "slacks", sand, { inner: ink }),
      wear("wrap", navy, "skirt", navy, { art: "panel", motif: 1 }),
      wear("hoodie", lilac, "jeans", denim, { bag: "pack" }),
    ],
  },
  tiongkok: {
    male: [
      wear("mandarin", "#393647", "slacks", oat, {
        inner: ivory,
        sleeve: "roll",
        art: "crest",
        bag: "pack",
      }),
      wear("mandarin", "#424357", "slacks", oat, {
        inner: ivory,
        sleeve: "roll",
        art: "crest",
        bag: "pack",
      }),
      wear("knit", ivory, "slacks", ink, { art: "bamboo", bag: "sling" }),
      wear("mandarin", navy, "slacks", ink, { inner: navy, art: "crest" }),
      wear("blazer", brown, "slacks", sand, { inner: ink }),
      wear("hoodie", sand, "cargo", ink, { bag: "pack" }),
      wear("overshirt", ivory, "slacks", ink, {
        inner: ivory,
        art: "bamboo",
        sleeve: "roll",
      }),
    ],
    female: [
      wear("mandarin", ivory, "skirt", "#814c48", {
        sleeve: "puff",
        art: "flower",
        waist: "silk",
        shoes: "flats",
        bag: "tote",
      }),
      wear("blazer", sand, "slacks", ink),
      wear("blouse", lilac, "slacks", navy, { bag: "sling", art: "flower" }),
      wear("mandarin", ivory, "skirt", "#814c48", {
        sleeve: "puff",
        art: "flower",
        waist: "silk",
        shoes: "flats",
      }),
      wear("blazer", sand, "slacks", ivory, { inner: ink }),
      wear("track", burgundy, "cargo", ink, { bag: "pack" }),
      wear("mandarin", "#a3b6ce", "skirt", blue, {
        art: "flower",
        sleeve: "short",
        shoes: "flats",
      }),
    ],
  },
  amerika: {
    male: [
      wear("varsity", navy, "cargo", oat, { bag: "pack" }),
      wear("varsity", navy, "cargo", oat, { bag: "pack" }),
      wear("hoodie", ink, "cargo", ink, { bag: "sling" }),
      wear("track", ivory, "slacks", navy),
      wear("blazer", navy, "slacks", "#848795"),
      wear("vest", "#987653", "slacks", oat),
      wear("overshirt", olive, "jeans", ink, { sleeve: "roll" }),
    ],
    female: [
      wear("knit", ivory, "jeans", denim, { waist: "plaid", bag: "tote" }),
      wear("varsity", navy, "skirt", "#854f55", { waist: "plaid" }),
      wear("hoodie", "#4e4953", "cargo", ink, { bag: "pack" }),
      wear("track", ivory, "slacks", navy),
      wear("blazer", navy, "slacks", sand),
      wear("blouse", peach, "slacks", oat, {
        art: "fabric",
        motif: 1,
        sleeve: "short",
      }),
      wear("knit", ivory, "jeans", denim, { waist: "plaid", bag: "tote" }),
    ],
  },
  afrika: {
    male: [
      wear("overshirt", ivory, "cargo", ink, {
        inner: ink,
        art: "panel",
        bag: "pack",
        sleeve: "roll",
      }),
      wear("hoodie", sand, "slacks", ink, { bag: "pack" }),
      wear("track", navy, "slacks", navy),
      wear("overshirt", navy, "slacks", ink, {
        art: "panel",
        sleeve: "short",
        motif: 2,
      }),
      wear("blazer", navy, "slacks", ink),
      wear("mandarin", ivory, "slacks", ink, {
        art: "panel",
        motif: 3,
        sleeve: "roll",
      }),
      wear("overshirt", olive, "cargo", ink, { art: "panel", sleeve: "roll" }),
    ],
    female: [
      wear("blouse", ivory, "skirt", "#3b344b", {
        sleeve: "puff",
        waist: "print",
        bag: "tote",
        shoes: "sandals",
        motif: 2,
      }),
      wear("wrap", sand, "jeans", denim, { art: "panel", sleeve: "roll" }),
      wear("wrap", "#aa7769", "skirt", "#6f4b45", {
        art: "panel",
        shoes: "flats",
      }),
      wear("blouse", "#d18247", "skirt", denim, {
        art: "fabric",
        sleeve: "puff",
        motif: 2,
      }),
      wear("blouse", ivory, "slacks", brown, { bag: "tote", sleeve: "roll" }),
      wear("wrap", navy, "skirt", navy, { art: "panel" }),
      wear("blouse", ivory, "skirt", navy, {
        waist: "print",
        bag: "sling",
        motif: 2,
      }),
    ],
  },
  australia: {
    male: [
      wear("overshirt", olive, "shorts", oat, { sleeve: "roll", bag: "pack" }),
      wear("tee", ivory, "shorts", oat, { sleeve: "short", art: "surf" }),
      wear("overshirt", blue, "shorts", sand, {
        art: "fabric",
        sleeve: "short",
        motif: 1,
      }),
      wear("knit", navy, "slacks", ivory, { bag: "pack" }),
      wear("hoodie", olive, "cargo", oat, { inner: olive, bag: "pack" }),
      wear("tank", navy, "shorts", "#929aab", { sleeve: "bare", art: "surf" }),
      wear("blazer", oat, "slacks", ivory),
    ],
    female: [
      wear("wrap", ivory, "shorts", denim, {
        inner: ink,
        sleeve: "roll",
        bag: "straw",
        shoes: "sandals",
      }),
      wear("knit", ivory, "jeans", denim, { bag: "tote" }),
      wear("tank", blue, "dress", blue, {
        art: "fabric",
        sleeve: "bare",
        motif: 1,
        shoes: "sandals",
        bag: "straw",
      }),
      wear("overshirt", navy, "slacks", oat, { inner: navy, sleeve: "roll" }),
      wear("overshirt", olive, "cargo", oat, { sleeve: "roll" }),
      wear("hoodie", lilac, "shorts", denim),
      wear("blazer", ivory, "slacks", sand, { inner: ink }),
    ],
  },
};

export function getGarment(
  collection: Collection,
  female: boolean,
  index: number,
) {
  const line = wardrobe[collection][female ? "female" : "male"];
  return line[index] ?? line[0];
}
