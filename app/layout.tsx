import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import localFont from "next/font/local";
const bodyFont = localFont({
  src: "../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2",
  weight: "100 1000",
  variable: "--body-font",
  display: "swap",
});
const displayFont = localFont({
  src: "../node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-600-normal.woff2",
  weight: "600",
  variable: "--display-font",
  display: "swap",
});
import "./style.css";
import { base } from "../lib/seo";
export const metadata: Metadata = {
  metadataBase: base,
  title: {
    default: "SocioLine Digital World",
    template: "%s | SocioLine Digital World",
  },
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
};
function Brand() {
  return (
    <Link prefetch={false} className="brand" href="/">
      <img
        src="/socioline-sl.svg"
        width="75"
        height="42"
        style={{ objectFit: "contain" }}
        alt="SocioLine"
      />
    </Link>
  );
}
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={bodyFont.variable + " " + displayFont.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "SocioLine",
              url: base.href,
              logo: new URL("/socioline-sl.svg", base).href,
            }),
          }}
        />
        <Link prefetch={false} className="skip" href="#main">
          Skip to content
        </Link>
        <header>
          <div className="top">
            <Brand />
            <nav aria-label="Primary"><Link prefetch={false} href="/worlds">Lab Dunia</Link>
              <Link prefetch={false} href="/">
                Atlas kota
              </Link>
              <Link prefetch={false} href="/about/framework">
                Kerangka W3
              </Link>
              <Link prefetch={false} href="/programs">
                Program
              </Link>
              <Link prefetch={false} href="/blog">
                Jurnal
              </Link>
            </nav>
            <Link prefetch={false} className="topbtn" href="/explore">
              Masuk kota <ArrowUpRight size={16} />
            </Link>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer>
          <Brand />
          <nav aria-label="Footer">
            <Link prefetch={false} href="/about">
              Tentang
            </Link>
            <Link prefetch={false} href="/news">
              Berita
            </Link>
            <Link prefetch={false} href="/impact">
              Dampak
            </Link>
            <Link prefetch={false} href="/resources">
              Pustaka
            </Link>
            <Link prefetch={false} href="/events">
              Agenda
            </Link>
            <Link prefetch={false} href="/collaborate/partner">
              Kolaborasi
            </Link>
            <Link prefetch={false} href="/contact">
              Kontak
            </Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
