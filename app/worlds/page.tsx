import WorldLab from "../../components/WorldLab";
import { meta, absolute } from "../../lib/seo";
export const metadata = meta(
  "/worlds",
  "Laboratorium Dunia",
  "Buat ruang simulasi privat SocioLine dari deskripsi, jelajahi wilayah bersama, dan simpan dokumen proyek W3.",
);
export default function Worlds() {
  return (
    <article className="wrap explore">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Laboratorium Dunia",
            url: absolute("/worlds"),
          }),
        }}
      />
      <div className="entry-head">
        <span className="eyebrow">SOCIOLINE INFINITE WORLD</span>
        <h1>
          Laboratorium Dunia<span>.</span>
        </h1>
        <p>
          Rancang lingkungan simulasi, undang rekan untuk menjelajah, dan bawa
          hasil belajarmu ke dokumen proyek.
        </p>
      </div>
      <WorldLab />
    </article>
  );
}
