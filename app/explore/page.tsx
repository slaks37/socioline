import Explorer from "../../components/Explorer";
import { absolute, meta } from "../../lib/seo";
import { districts, landmarks } from "../../lib/content";
export const metadata = meta(
  "/explore",
  "Jelajahi kota",
  "Pilih avatar tamu untuk berjalan di kota SocioLine atau kunjungi setiap landmark melalui direktori 2D.",
);
export default function Explore() {
  return (
    <div className="explore wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Jelajahi kota",
            url: absolute("/explore"),
            isPartOf: {
              "@type": "WebSite",
              name: "SocioLine Digital World",
              url: absolute("/"),
            },
          }),
        }}
      />
      <Explorer />
      <details className="directory" id="directory">
        <summary>Buka direktori kota 2D</summary>
        {[{ id: "hub", name: "Central Hub" }, ...districts].map((d) => (
          <section key={d.id}>
            <h2>{d.name}</h2>
            <div className="related">
              {landmarks
                .filter((l) => l.zone === d.id)
                .map((l) => (
                  <a key={l.id} href={l.url}>
                    {l.name}
                  </a>
                ))}
            </div>
          </section>
        ))}
      </details>
    </div>
  );
}
