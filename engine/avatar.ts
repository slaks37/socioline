export type AvatarData = {
  preset: "Male" | "Female";
  hair: string;
  skin: string;
  outfit: string;
  name: string;
  hairColor?: string;
  garment?: "Field jacket" | "T-shirt";
};
export const initialAvatar: AvatarData = {
  preset: "Female",
  hair: "Bob",
  skin: "#ba825e",
  outfit: "#41887c",
  name: "",
  garment: "Field jacket",
};
export const hairStyles = ["Bob", "Crop", "Curls"];
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
    hairStyles.includes(a.hair) &&
    skinTones.includes(a.skin) &&
    outfits.includes(a.outfit) &&
    (a.garment === undefined ||
      ["Field jacket", "T-shirt"].includes(a.garment)) &&
    typeof a.name === "string" &&
    a.name.length <= 24
  );
}
