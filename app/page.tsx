import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Compass,
  BookOpen,
  Globe2,
  Hammer,
  MapPin,
  ScanLine,
  Layers3,
  Navigation2,
  Map,
} from "lucide-react";
import { districts } from "../lib/content";
import { meta, absolute } from "../lib/seo";
export const metadata = meta(
  "/",
  "World Atlas",
  "Jelajahi SocioLine Digital World dari Central Hub ke tiga distrik W3. Temukan panggilan, pelajari komunitas, dan rancang karya bersama.",
);
const icons = [BookOpen, Globe2, Hammer];
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "SocioLine Digital World",
            url: absolute("/"),
          }),
        }}
      />
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow hero-label">
              <span className="dot" /> ATLAS KOTA INTERAKTIF
            </span>
            <h1>
              SocioLine
              <br />
              <em>Digital World.</em>
            </h1>
            <p>From Calling to Collaborative Impact.</p>
            <p className="summary">
              Jelajahi tiga distrik tempat iman, pengetahuan komunitas, dan
              karya bertemu. Mulai perjalananmu dari teras Central Hub.
            </p>
            <div className="actions">
              <Link prefetch={false} className="button gold" href="/explore">
                <Compass size={18} /> Masuk ke kota <ArrowRight size={16} />
              </Link>
              <Link prefetch={false} className="textbutton" href="#districts">
                Lihat distrik <span>↓</span>
              </Link>
            </div>
          </div>
          <figure className="hero-map">
            <img
              fetchPriority="high"
              src="/atlas.webp"
              alt="Panorama kota dari dalam permainan, dengan teras kedatangan dan tiga distrik di kaki pegunungan."
            />
            <span className="north">
              <Navigation2 size={19} />N
            </span>
            <span className="map-tag tag-hub">
              <i />
              Central Hub
            </span>
            <figcaption>
              <ScanLine size={13} /> PANORAMA KOTA
            </figcaption>
          </figure>
        </div>
        <div className="atlas-strip">
          <div>
            <span>
              <i /> PETA KOTA
            </span>
            <b>
              <MapPin />
              Central Hub
            </b>
            <b>
              <Layers3 />3 distrik terhubung
            </b>
            <b>
              <Map />
              Akses tamu
            </b>
          </div>
        </div>
      </section>
      <section className="districts wrap" id="districts">
        <span className="eyebrow">
          <span className="rule" /> DIREKTORI DISTRIK
        </span>
        <div className="section-title">
          <h2>
            Jelajahi distrik<span>.</span>
          </h2>
          <p>Satu perjalanan dari panggilan menuju karya bersama.</p>
        </div>
        <div className="cards">
          {districts.map((d, i) => {
            const Icon = icons[i];
            return (
              <Link
                prefetch={false}
                className={"district card-" + i}
                key={d.id}
                href={"/" + d.id}
              >
                <div className="district-pic">
                  <img
                    src={"/district-" + i + ".webp"}
                    alt={d.name + " district architecture"}
                  />
                  <span className="dist-label">
                    <i /> {["BARAT", "TENGAH", "TIMUR"][i]} DISTRICT
                  </span>
                </div>
                <div className="card-body">
                  <span className="ic">
                    <Icon size={21} />
                  </span>
                  <div>
                    <h3>{d.name}</h3>
                    <p>{d.theme}</p>
                  </div>
                  <ArrowUpRight className="card-arrow" size={19} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
