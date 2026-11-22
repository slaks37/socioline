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
  { id: "farm", name: "Kebun koperasi", x: -60, z: 45, item: "Kelola kebun" },
  {
    id: "office",
    name: "Kantor usaha",
    x: 30,
    z: -52,
    item: "Temui mentor bisnis",
  },
  {
    id: "academy",
    name: "Studio teknologi",
    x: -61,
    z: -9,
    item: "Temui mentor teknologi",
  },
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
  cropReady?: number;
  herd?: boolean;
  milkReady?: number;
  workshop?: boolean;
  homeOwner?: boolean;
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
    [v.cropReady, v.milkReady].every(
      (t) => t === undefined || (Number.isSafeInteger(t) && t >= 0),
    ) &&
    [v.herd, v.workshop, v.homeOwner].every(
      (t) => t === undefined || typeof t === "boolean",
    ) &&
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
  sow: { site: "farm", label: "Tanam benih · 1 koin" },
  harvest: { site: "farm", label: "Panen 3 bahan" },
  herd: { site: "farm", label: "Pelihara sapi · 6 koin" },
  feed: { site: "farm", label: "Beri pakan · 1 bahan" },
  milk: { site: "farm", label: "Ambil susu · 2 produk" },
  expand: { site: "office", label: "Tingkatkan bengkel · 10 koin" },
  wholesale: { site: "market", label: "Penuhi pesanan 3 produk · 18 koin" },
  own: { site: "home", label: "Beli rumah pribadi · 20 koin" },
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
  now = Date.now(),
): { state: Life; message: string } {
  const s = { ...old };
  switch (action) {
    case "sow":
      if (s.cropReady || s.coins < 1)
        return {
          state: old,
          message: s.cropReady
            ? "Petak masih ditanami."
            : "Perlu 1 koin untuk benih.",
        };
      s.coins--;
      s.cropReady = now + 30000;
      return {
        state: s,
        message: "Benih ditanam. Panen tersedia dalam 30 detik.",
      };
    case "harvest":
      if (!s.cropReady || now < s.cropReady)
        return { state: old, message: "Tanaman belum siap panen." };
      s.cropReady = 0;
      s.supplies += 3;
      return {
        state: s,
        message: "Panen selesai. Tiga bahan masuk ke persediaan.",
      };
    case "herd":
      if (s.herd || s.coins < 6)
        return {
          state: old,
          message: s.herd
            ? "Sapi sudah ada di kandang."
            : "Perlu 6 koin untuk membeli sapi.",
        };
      s.coins -= 6;
      s.herd = true;
      return {
        state: s,
        message: "Sapi tiba. Gunakan hasil kebun untuk pakannya.",
      };
    case "feed":
      if (!s.herd || s.supplies < 1 || s.milkReady)
        return {
          state: old,
          message: "Perlu sapi, satu bahan pakan, dan kandang yang siap.",
        };
      s.supplies--;
      s.milkReady = now + 20000;
      return {
        state: s,
        message: "Sapi diberi pakan. Susu siap dalam 20 detik.",
      };
    case "milk":
      if (!s.milkReady || now < s.milkReady)
        return { state: old, message: "Susu belum siap." };
      s.milkReady = 0;
      s.stock += 2;
      return { state: s, message: "Dua produk susu masuk ke stok gerai." };
    case "expand":
      if (s.workshop || s.coins < 10)
        return {
          state: old,
          message: s.workshop
            ? "Bengkel sudah ditingkatkan."
            : "Kumpulkan 10 koin untuk alat produksi.",
        };
      s.coins -= 10;
      s.workshop = true;
      return {
        state: s,
        message: "Alat baru menghasilkan dua produk per bahan.",
      };
    case "wholesale":
      if (s.stock < 3)
        return { state: old, message: "Pesanan membutuhkan tiga produk." };
      s.stock -= 3;
      s.coins += 18;
      return {
        state: s,
        message: "Pesanan grosir selesai. Pendapatan 18 koin.",
      };
    case "own":
      if (s.homeOwner || s.coins < 20)
        return {
          state: old,
          message: s.homeOwner
            ? "Rumah sudah menjadi milikmu."
            : "Perlu 20 koin untuk memiliki rumah.",
        };
      s.homeOwner = true;
      s.coins -= 20;
      return { state: s, message: "Rumah tercatat di progresmu." };
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
      s.stock += s.workshop ? 2 : 1;
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
