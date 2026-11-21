export const collections = [
  "indonesia",
  "tiongkok",
  "amerika",
  "afrika",
  "australia",
] as const;
export type Collection = (typeof collections)[number];
export const collectionLabels: Record<Collection, string> = {
  indonesia: "Indonesia",
  tiongkok: "Tiongkok",
  amerika: "Amerika",
  afrika: "Afrika",
  australia: "Australia",
};

export const hairLabels: Record<string, string> = {
  Tousled: "Berlapis",
  "Side part": "Belah samping",
  Bob: "Bob",
  Crop: "Pendek",
  Curls: "Ikal",
  Bun: "Cepol",
  Braids: "Kepang",
  Buzz: "Cepak",
  Waves: "Gelombang panjang",
  Ponytail: "Ekor kuda",
  Locs: "Locs",
  "Braided bun": "Cepol kepang",
  Afro: "Afro",
  Hijab: "Hijab",
};
export const hairStyles = Object.keys(hairLabels);
export const accessoryLabels: Record<string, string> = {
  None: "Tanpa aksesori",
  Glasses: "Kacamata",
  Sunglasses: "Kacamata surya",
  Flower: "Bunga",
  "Gold pins": "Tusuk rambut emas",
  Hoops: "Anting lingkar",
  Headscarf: "Kerudung",
  Headwrap: "Ikat kepala kain",
  Cap: "Topi bisbol",
  Peci: "Peci",
  Beanie: "Kupluk",
  "Sun hat": "Topi lebar",
  Headphones: "Headphone",
  "Hair clips": "Jepit rambut",
};
export const hairColors = [
  "#372c29",
  "#714b34",
  "#c6a170",
  "#77776f",
  "#251e24",
  "#9c5139",
  "#e7bb79",
];
export const skinTones = [
  "#f1c8a2",
  "#d8a47d",
  "#ba825e",
  "#895c43",
  "#583b31",
  "#f7d8bd",
  "#a56d48",
];
// These keys are still accepted by the guest profile API for avatars saved before the design sheets.
export const outfits = ["#41887c", "#bb7652", "#5e70a0", "#c49c53"];
const legacyFaces = ["sari", "toba", "ranah", "baliem"] as const;
export type FaceDesign = (typeof legacyFaces)[number];
export const proportions = {
  height: { label: "Tinggi badan", min: 150, max: 200, base: 173 },
  build: { label: "Lebar tubuh", min: 80, max: 125, base: 100 },
  faceWidth: { label: "Lebar wajah", min: 85, max: 115, base: 100 },
  jaw: { label: "Lebar rahang", min: 65, max: 140, base: 100 },
  nose: { label: "Profil hidung", min: 50, max: 155, base: 100 },
  eyes: { label: "Ukuran mata", min: 75, max: 125, base: 100 },
  spacing: { label: "Jarak mata", min: 80, max: 120, base: 100 },
  mouth: { label: "Lebar mulut", min: 65, max: 140, base: 100 },
} as const;
export type Proportion = keyof typeof proportions;
export function measure(avatar: AvatarData, key: Proportion) {
  return (avatar.shape?.[key] ?? proportions[key].base) / proportions[key].base;
}
export type AvatarData = {
  shape?: Partial<Record<Proportion, number>>;
  preset: "Male" | "Female";
  collection?: Collection;
  faceIndex?: number;
  outfitIndex?: number;
  accessory?: string;
  face?: FaceDesign;
  hair: string;
  skin: string;
  outfit: string;
  name: string;
  hairColor?: string;
  garment?: "Field jacket" | "T-shirt";
};

type Face = {
  label: string;
  hair: string;
  accessory: string;
  hairColor?: string;
  skin?: string;
};
const face = (
  label: string,
  hair: string,
  accessory = "None",
  hairColor?: string,
  skin?: string,
): Face => ({ label, hair, accessory, hairColor, skin });
type Clothes = [label: string, accessory?: string];
type Lineup = { faces: Face[]; clothes: Clothes[] };
type Set = { male: Lineup; female: Lineup };
const catalogue: Record<Collection, Set> = {
  indonesia: {
    male: {
      faces: [
        face("Belah alami", "Tousled"),
        face("Kacamata bulat", "Side part", "Glasses"),
        face("Senyum berponi", "Bun"),
        face("Tertawa", "Crop"),
        face("Cepak rapi", "Buzz"),
        face("Senyum tipis", "Side part"),
      ],
      clothes: [
        ["Kemeja navy & kargo"],
        ["Hoodie harian"],
        ["Kemeja kota"],
        ["Batik modern"],
        ["Blazer santai"],
        ["Baju koko", "Peci"],
        ["Jaket jalanan", "Cap"],
      ],
    },
    female: {
      faces: [
        face("Gelombang berbunga", "Waves", "Flower"),
        face("Bob ceria", "Bob"),
        face("Senyum berhijab", "Hijab", "Headscarf"),
        face("Cepol berkacamata", "Bun", "Glasses"),
        face("Kuncir ceria", "Ponytail"),
        face("Rambut berjepit", "Waves", "Hair clips"),
      ],
      clothes: [
        ["Blus & selendang batik"],
        ["Kardigan harian"],
        ["Tunik lembut", "Headscarf"],
        ["Batik modern", "Flower"],
        ["Blazer kota", "Glasses"],
        ["Rompi tenun", "Headscarf"],
        ["Hoodie lilac", "Cap"],
      ],
    },
  },
  tiongkok: {
    male: {
      faces: [
        face("Poni berlapis", "Tousled"),
        face("Belah berkacamata", "Side part", "Glasses"),
        face("Cepol tersenyum", "Bun"),
        face("Tertawa lepas", "Crop"),
        face("Potongan pendek", "Buzz"),
        face("Belah santai", "Side part"),
      ],
      clothes: [
        ["Jaket kerah Mandarin"],
        ["Jaket kota"],
        ["Sweater bambu", "Headphones"],
        ["Jaket motif awan"],
        ["Blazer gelap"],
        ["Anorak jalanan", "Cap"],
        ["Kemeja bordir bambu"],
      ],
    },
    female: {
      faces: [
        face("Bunga di rambut", "Waves", "Flower"),
        face("Bob ceria", "Bob"),
        face("Sanggul emas", "Bun", "Gold pins"),
        face("Cepol berkacamata", "Bun", "Glasses"),
        face("Kepang berbunga", "Braids", "Flower"),
        face("Sanggul klasik", "Bun", "Gold pins"),
      ],
      clothes: [
        ["Blus plum & rok sulam"],
        ["Blazer krem"],
        ["Sweater lilac"],
        ["Blus motif plum", "Gold pins"],
        ["Blazer kota", "Glasses"],
        ["Jaket jalanan", "Cap"],
        ["Blus kerah Mandarin"],
      ],
    },
  },
  amerika: {
    male: {
      faces: [
        face("Poni santai", "Tousled"),
        face("Belah berkacamata", "Side part", "Glasses"),
        face("Gelombang pirang", "Tousled", "None", "#e7bb79"),
        face("Keriting ceria", "Afro", "None", "#372c29", "#a56d48"),
        face("Cepak rapi", "Buzz"),
        face("Senyum tipis", "Side part"),
      ],
      clothes: [
        ["Varsity & kargo"],
        ["Varsity kampus"],
        ["Hoodie jalanan", "Cap"],
        ["Jaket olahraga"],
        ["Blazer kasual"],
        ["Rompi rajut"],
        ["Overshirt zaitun", "Beanie"],
      ],
    },
    female: {
      faces: [
        face("Gelombang klasik", "Waves", "Hoops"),
        face("Ikal ceria", "Curls", "Hoops", "#372c29", "#a56d48"),
        face("Pirang tersenyum", "Waves", "None", "#e7bb79"),
        face("Cepol berkacamata", "Bun", "Glasses"),
        face("Cepol tembaga", "Bun", "Hoops", "#9c5139"),
        face("Kepang panjang", "Braids", "Hoops", "#372c29", "#895c43"),
      ],
      clothes: [
        ["Rajut & flanel pinggang", "Sunglasses"],
        ["Varsity kampus"],
        ["Hoodie jalanan", "Beanie"],
        ["Jaket olahraga", "Cap"],
        ["Blazer kasual", "Glasses"],
        ["Blus studio"],
        ["Rajut santai", "Sunglasses"],
      ],
    },
  },
  afrika: {
    male: {
      faces: [
        face("Keriting pendek", "Curls"),
        face("Keriting berkacamata", "Curls", "Glasses"),
        face("Locs ceria", "Locs"),
        face("Kepang tersenyum", "Braids"),
        face("Fade rapi", "Crop"),
        face("Afro ceria", "Afro"),
        face("Cepak halus", "Buzz"),
      ],
      clothes: [
        ["Overshirt & panel motif"],
        ["Hoodie harian"],
        ["Jaket kota", "Headphones"],
        ["Kemeja panel motif"],
        ["Blazer santai"],
        ["Tunik sulam"],
        ["Overshirt bercorak", "Cap"],
      ],
    },
    female: {
      faces: [
        face("Kepang emas", "Braided bun", "Hoops"),
        face("Afro bervolume", "Afro", "Hoops"),
        face("Ikat kain bermotif", "Bun", "Headwrap"),
        face("Cepol berkacamata", "Braided bun", "Glasses"),
        face("Locs ceria", "Locs", "Hoops"),
        face("Ikal pendek", "Curls", "Hoops"),
      ],
      clothes: [
        ["Blus & rok lilit motif", "Hoops"],
        ["Kardigan harian"],
        ["Tunik berselendang", "Headscarf"],
        ["Blus motif grafis"],
        ["Blazer kota", "Glasses"],
        ["Rompi motif", "Headscarf"],
        ["Kemeja & ikat kain", "Headwrap"],
      ],
    },
  },
  australia: {
    male: {
      faces: [
        face("Poni bertekstur", "Tousled"),
        face("Ikal berkacamata", "Curls", "Glasses"),
        face("Pirang tersenyum", "Tousled", "None", "#e7bb79"),
        face("Pendek ceria", "Crop"),
        face("Cepak berbintik", "Buzz"),
        face("Topi lebar", "Side part", "Sun hat"),
      ],
      clothes: [
        ["Overshirt & celana pendek"],
        ["Kaus santai"],
        ["Kemeja pesisir"],
        ["Rajut kota"],
        ["Jaket jelajah", "Sun hat"],
        ["Singlet olahraga", "Cap"],
        ["Blazer pasir"],
      ],
    },
    female: {
      faces: [
        face("Gelombang pantai", "Waves"),
        face("Pirang ceria", "Waves", "Hoops", "#e7bb79"),
        face("Cepol santai", "Bun"),
        face("Cepol pirang", "Bun", "Glasses", "#e7bb79"),
        face("Ikal berkacamata surya", "Curls", "Sunglasses"),
        face("Bob berjepit", "Bob", "Hair clips"),
      ],
      clothes: [
        ["Kemeja simpul & denim", "Sunglasses"],
        ["Kardigan pantai"],
        ["Gaun pesisir", "Sun hat"],
        ["Kemeja kota", "Glasses"],
        ["Jaket jelajah", "Cap"],
        ["Jaket olahraga", "Headphones"],
        ["Blazer pasir"],
      ],
    },
  },
};

function lineup(collection: Collection, female: boolean): Lineup {
  return catalogue[collection][female ? "female" : "male"];
}
export function getFaceOptions(collection: Collection, female: boolean) {
  return lineup(collection, female).faces.map((f) => f.label);
}
export function getOutfitOptions(collection: Collection, female: boolean) {
  return lineup(collection, female).clothes.map(([label]) => label);
}
function basePalette(collection: Collection) {
  return {
    skin: collection === "afrika" ? "#a56d48" : "#f1c8a2",
    hairColor: "#372c29",
  };
}
function newLook(
  base: AvatarData,
  collection: Collection,
  preset: AvatarData["preset"],
): AvatarData {
  const female = preset === "Female";
  const hero = lineup(collection, female).faces[0];
  const australianHero = female && collection === "australia";
  return {
    ...base,
    collection,
    preset,
    face: undefined,
    garment: undefined,
    faceIndex: 0,
    outfitIndex: 0,
    ...basePalette(collection),
    hair: australianHero ? "Bun" : hero.hair,
    hairColor: australianHero ? "#e7bb79" : "#372c29",
    accessory: lineup(collection, female).clothes[0][1] ?? hero.accessory,
  };
}
export const initialAvatar: AvatarData = newLook(
  {
    preset: "Female",
    name: "",
    outfit: outfits[0],
    skin: skinTones[0],
    hair: "Waves",
  },
  "indonesia",
  "Female",
);

export function resolveLook(data: AvatarData) {
  const collection = data.collection ?? "indonesia";
  const female = data.preset === "Female";
  const legacyIndex = data.face ? legacyFaces.indexOf(data.face) : 0;
  return {
    collection,
    female,
    faceIndex: data.faceIndex ?? Math.max(0, legacyIndex),
    outfitIndex: data.outfitIndex ?? (data.garment === "T-shirt" ? 1 : 0),
    hair: data.hair,
    hairColor: data.hairColor ?? "#372c29",
    skin: data.skin,
    accessory: data.accessory ?? "None",
  };
}

export function selectCollection(data: AvatarData, collection: Collection) {
  return newLook(data, collection, data.preset);
}

export function selectBase(data: AvatarData, preset: AvatarData["preset"]) {
  return newLook(data, resolveLook(data).collection, preset);
}

export function selectFace(data: AvatarData, index: number): AvatarData {
  const { collection, female } = resolveLook(data);
  const choice = lineup(collection, female).faces[index];
  if (!choice) return data;
  return {
    ...data,
    faceIndex: index,
    hair: choice.hair,
    accessory: choice.accessory,
    hairColor: choice.hairColor ?? "#372c29",
    skin: choice.skin ?? basePalette(collection).skin,
  };
}

export function selectOutfit(data: AvatarData, index: number): AvatarData {
  const { collection, female } = resolveLook(data);
  const choice = lineup(collection, female).clothes[index];
  if (!choice) return data;
  // Release the previous outfit's headwear when switching looks. Keep individual face accessories.
  const previous = lineup(collection, female).clothes[
    resolveLook(data).outfitIndex
  ]?.[1];
  const faceChoice = lineup(collection, female).faces[
    resolveLook(data).faceIndex
  ];
  return {
    ...data,
    outfitIndex: index,
    accessory:
      choice[1] ??
      (previous && data.accessory === previous
        ? (faceChoice?.accessory ?? "None")
        : data.accessory),
  };
}

export function validAvatar(v: unknown): v is AvatarData {
  if (!v || typeof v !== "object") return false;
  const a = v as AvatarData;
  if (a.preset !== "Male" && a.preset !== "Female") return false;
  if (a.collection !== undefined && !collections.includes(a.collection))
    return false;
  if (
    a.shape !== undefined &&
    (!a.shape ||
      typeof a.shape !== "object" ||
      Array.isArray(a.shape) ||
      !Object.entries(a.shape).every(([key, value]) => {
        if (!Object.hasOwn(proportions, key)) return false;
        const { min, max } = proportions[key as Proportion];
        return Number.isInteger(value) && value >= min && value <= max;
      }))
  )
    return false;
  const options = lineup(a.collection ?? "indonesia", a.preset === "Female");
  return (
    (a.faceIndex === undefined ||
      (Number.isInteger(a.faceIndex) &&
        a.faceIndex >= 0 &&
        a.faceIndex < options.faces.length)) &&
    (a.outfitIndex === undefined ||
      (Number.isInteger(a.outfitIndex) &&
        a.outfitIndex >= 0 &&
        a.outfitIndex < options.clothes.length)) &&
    (a.accessory === undefined ||
      (typeof a.accessory === "string" &&
        Object.hasOwn(accessoryLabels, a.accessory))) &&
    (a.face === undefined || legacyFaces.includes(a.face)) &&
    hairStyles.includes(a.hair) &&
    (a.hairColor === undefined || hairColors.includes(a.hairColor)) &&
    skinTones.includes(a.skin) &&
    outfits.includes(a.outfit) &&
    (a.garment === undefined ||
      ["Field jacket", "T-shirt"].includes(a.garment)) &&
    typeof a.name === "string" &&
    a.name.length <= 24
  );
}
