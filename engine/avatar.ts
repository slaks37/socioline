// These are four individual character designs. Skin, hair and clothing stay independent.
export const faceDesigns = [
  { id: "sari", label: "Jawa" },
  { id: "toba", label: "Batak Toba" },
  { id: "ranah", label: "Minangkabau" },
  { id: "baliem", label: "Dani (Papua)" },
] as const;
export type FaceDesign = (typeof faceDesigns)[number]["id"];
export const defaultFace = faceDesigns[0].id;

export type AvatarData = {
  preset: "Male" | "Female";
  face?: FaceDesign;
  hair: string;
  skin: string;
  outfit: string;
  name: string;
  hairColor?: string;
  garment?: "Field jacket" | "T-shirt";
};
export const initialAvatar: AvatarData = {
  preset: "Female",
  face: defaultFace,
  hair: "Bob",
  skin: "#ba825e",
  outfit: "#41887c",
  name: "",
  garment: "Field jacket",
};
export const hairLabels: Record<string, string> = {
  Bob: "Bob",
  Crop: "Pendek",
  Curls: "Ikal",
  "Side part": "Belah samping",
  Bun: "Cepol",
  Braids: "Kepang dua",
  Buzz: "Cepak",
  Waves: "Gelombang panjang",
};
export const hairStyles = Object.keys(hairLabels);
export const skinTones = [
  "#f1c8a2",
  "#d8a47d",
  "#ba825e",
  "#895c43",
  "#583b31",
];
export const outfits = ["#41887c", "#bb7652", "#5e70a0", "#c49c53"];
export function validAvatar(v: unknown): v is AvatarData {
  if (!v || typeof v !== "object") return false;
  const a = v as AvatarData;
  return (
    ["Male", "Female"].includes(a.preset) &&
    (a.hairColor === undefined ||
      ["#372c29", "#714b34", "#c6a170", "#77776f"].includes(a.hairColor)) &&
    (a.face === undefined || faceDesigns.some(({ id }) => id === a.face)) &&
    hairStyles.includes(a.hair) &&
    skinTones.includes(a.skin) &&
    outfits.includes(a.outfit) &&
    (a.garment === undefined ||
      ["Field jacket", "T-shirt"].includes(a.garment)) &&
    typeof a.name === "string" &&
    a.name.length <= 24
  );
}
