export const activitySites = [
  { id: "home", name: "Rumah singgah", x: -31, z: -9, item: "Beristirahat" },
  {
    id: "work",
    name: "Bengkel koperasi",
    x: 46,
    z: -54,
    item: "Kerja di bengkel",
  },
  { id: "market", name: "Gerai koperasi", x: 35, z: 25, item: "Buka gerai" },
  { id: "friend", name: "Rani · warga NPC", x: -7, z: 27, item: "Sapa Rani" },
] as const;
export type Site = (typeof activitySites)[number]["id"];
export type Life = {
  energy: number;
  coins: number;
  stock: number;
  supplies: number;
  friendship: number;
  parcel: boolean;
  decor: number;
};
export const freshLife: Life = {
  energy: 4,
  coins: 8,
  stock: 0,
  supplies: 1,
  friendship: 0,
  parcel: false,
  decor: 0,
};
export function validLife(value: unknown): value is Life {
  if (!value || typeof value !== "object") return false;
  const v = value as Life;
  return (
    typeof v.parcel === "boolean" &&
    (
      ["energy", "coins", "stock", "supplies", "friendship", "decor"] as const
    ).every(
      (k) =>
        Number.isSafeInteger(v[k]) &&
        v[k] >= 0 &&
        v[k] <=
          ({ energy: 5, friendship: 5, decor: 2 }[k as "energy"] ?? 1000000),
    )
  );
}
export const actions = {
  rest: { site: "home", label: "Istirahat di bangku" },
  decorate: { site: "home", label: "Ganti warna ruang" },
  shift: { site: "work", label: "Ambil pesanan antar" },
  craft: { site: "work", label: "Rakit produk" },
  buy: { site: "market", label: "Beli bahan · 2 koin" },
  sell: { site: "market", label: "Jual produk · 5 koin" },
  deliver: { site: "market", label: "Serahkan pesanan · 4 koin" },
  talk: { site: "friend", label: "Mengobrol" },
  gift: { site: "friend", label: "Hadiahkan produk" },
} as const;
export type Activity = keyof typeof actions;
export function act(
  old: Life,
  action: Activity,
): { state: Life; message: string } {
  const s = { ...old };
  switch (action) {
    case "rest":
      s.energy = 5;
      return { state: s, message: "Kamu selesai beristirahat. Energi penuh." };
    case "decorate":
      s.decor = (s.decor + 1) % 3;
      return { state: s, message: "Warna ruang rumahmu sudah diganti." };
    case "shift":
      if (s.parcel)
        return {
          state: old,
          message: "Antar pesanan yang kamu bawa ke Gerai koperasi.",
        };
      if (!s.energy)
        return { state: old, message: "Istirahat dulu di Rumah singgah." };
      s.energy--;
      s.parcel = true;
      return {
        state: s,
        message: "Pesanan siap. Bawa ke Gerai koperasi di Central Hub.",
      };
    case "deliver":
      if (!s.parcel)
        return {
          state: old,
          message: "Ambil pesanan di Bengkel koperasi dahulu.",
        };
      s.parcel = false;
      s.coins += 4;
      return { state: s, message: "Pesanan diterima. Kamu memperoleh 4 koin." };
    case "buy":
      if (s.coins < 2)
        return {
          state: old,
          message: "Kamu memerlukan 2 koin untuk membeli bahan.",
        };
      s.coins -= 2;
      s.supplies++;
      return { state: s, message: "Satu bahan siap dibawa ke bengkel." };
    case "craft":
      if (!s.energy || !s.supplies)
        return {
          state: old,
          message: "Kamu perlu satu energi dan satu bahan dari gerai.",
        };
      s.energy--;
      s.supplies--;
      s.stock++;
      return {
        state: s,
        message: "Produk selesai. Jual di gerai atau hadiahkan ke Rani.",
      };
    case "sell":
      if (!s.stock)
        return { state: old, message: "Rakit produk dahulu di bengkel." };
      s.stock--;
      s.coins += 5;
      return {
        state: s,
        message: "Pembeli menerima produkmu. Kamu memperoleh 5 koin.",
      };
    case "talk":
      return {
        state: s,
        message:
          s.friendship >= 2
            ? "Rani: Senang melihatmu lagi! Bagaimana kabar bengkel?"
            : "Rani: Aku suka hasil karya bengkel. Pernah membuat satu?",
      };
    case "gift":
      if (!s.stock)
        return {
          state: old,
          message: "Bawa satu produk buatanmu dari bengkel.",
        };
      if (s.friendship === 5)
        return { state: old, message: "Kalian sudah menjadi sahabat." };
      s.stock--;
      s.friendship++;
      return { state: s, message: "Rani: Terima kasih sudah mengingatku!" };
  }
}
