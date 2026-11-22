import MentorChat from "./MentorChat";
import { useState } from "react";
import type { Life, Site } from "../engine/city-life";

export default function CityMentor({ site, life }: { site: Site; life: Life }) {
  const [units, setUnits] = useState(3);
  const teaching = {
    home: [
      "Ayu · arsitek",
      "Bagaimana menata rumah?",
      "Tempat tidur berada di ceruk belakang. Meja kerja dan bangku menghadap lorong tengah supaya pintu tetap mudah dilalui.",
    ],
    farm: [
      "Bima · petani",
      "Bagaimana memulai panen?",
      "Tanam benih dengan satu koin. Setelah 30 detik, panen tiga bahan. Pilih antara merakit produk di bengkel atau memakai satu bahan untuk pakan sapi.",
    ],
    office: ["Nara · mentor bisnis", "Berapa modal produksi saya?", ""],
    academy: [
      "Jun · mentor teknologi",
      "Bagaimana menguji ide layanan?",
      "Pilih satu masalah pengguna. Buat prototipe satu layar, minta seseorang mencoba tugas utama, lalu catat langkah yang membingungkan.",
    ],
  } as const;
  if (!(site in teaching)) return null;
  const [name, question, answer] = teaching[site as keyof typeof teaching];
  const batches = Math.ceil(units / (life.workshop ? 2 : 1)),
    buy = Math.max(0, batches - life.supplies);
  return (
    <details>
      <summary>
        {name} · {question}
      </summary>
      {site === "office" ? (
        <>
          <label>
            Target produk{" "}
            <input
              type="number"
              min={1}
              max={99}
              value={units}
              onChange={(e) =>
                setUnits(Math.max(1, Math.min(99, Number(e.target.value) || 1)))
              }
            />
          </label>
          <p>
            {batches} kali produksi memakai {batches} bahan dan {batches}{" "}
            energi. Dengan persediaanmu, beli {buy} bahan seharga {buy * 2}{" "}
            koin. Penjualan eceran {units} produk menghasilkan {units * 5} koin.
          </p>
          <a href="/the-work/mission-model" target="_blank" rel="noreferrer">
            Pelajari model bisnis
          </a>
        </>
      ) : (
        <p>{answer}</p>
      )}
      <MentorChat
        key={site}
        role={
          {
            office: "business",
            farm: "agriculture",
            home: "architecture",
            academy: "technology",
          }[site as keyof typeof teaching]
        }
        life={life}
      />
    </details>
  );
}
