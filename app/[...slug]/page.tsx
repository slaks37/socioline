import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronRight, Compass } from "lucide-react";
import { pages, findPage, districts, landmarks } from "../../lib/content";
import { meta, absolute } from "../../lib/seo";
type Props = { params: Promise<{ slug: string[] }> };
export function generateStaticParams() {
  return pages.map((p) => ({ slug: p.path.slice(1).split("/") }));
}
export async function generateMetadata({ params }: Props) {
  const p = findPage("/" + (await params).slug.join("/"));
  return p
    ? meta(p.path, p.seo?.title ?? p.title, p.seo?.description ?? p.intro)
    : {};
}
export default async function PublicPage({ params }: Props) {
  const p = findPage("/" + (await params).slug.join("/"));
  if (!p) notFound();
  const i = districts.findIndex((d) => p.path === "/" + d.id);
  const place = landmarks.find((l) => l.url === p.path);
  return (
    <article className="article wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": p.path.startsWith("/news/")
              ? "NewsArticle"
              : p.path.startsWith("/blog/")
                ? "Article"
                : "WebPage",
            author: p.byline
              ? { "@type": "Person", name: p.byline }
              : undefined,
            datePublished: p.date,
            dateModified: p.updated,
            name: p.title,
            headline: p.title,
            description: p.intro,
            url: absolute(p.path),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <Link prefetch={false} className="crumb" href="/">
        World Atlas <ChevronRight size={14} />
      </Link>
      <div className="article-head max-w-4xl">
        <span className="eyebrow">
          <i className="rule" />
          {p.category}
        </span>
        <h1>{p.title}</h1>
        <p>{p.intro}</p>
        {p.byline && (
          <p>
            {p.byline} · <time dateTime={p.date}>{p.date?.slice(0, 10)}</time>
          </p>
        )}
        {p.cover && <img className="wide-img" src={p.cover} alt={p.title} />}
      </div>
      {i >= 0 && (
        <img
          className="wide-img"
          src={"/district-" + i + ".webp"}
          alt={p.title + " architecture"}
        />
      )}
      <div className="reading">
        {p.sections.map(([h, b]) => (
          <section key={h}>
            <h2>{h}</h2>
            <p>{b}</p>
          </section>
        ))}
        {p.links.length > 0 && (
          <section>
            <h2>
              {i >= 0
                ? "Jelajahi distrik"
                : p.path === "/programs/w3-journey"
                  ? "Tahapan program"
                  : "Baca selanjutnya"}
            </h2>
            <div className="related">
              {p.links.map((h) => (
                <Link prefetch={false} key={h} href={h}>
                  {findPage(h)?.title ?? h}
                  <ArrowUpRight size={17} />
                </Link>
              ))}
            </div>
          </section>
        )}
        <Link
          prefetch={false}
          className="button dark"
          href={place ? "/explore?landmark=" + place.id : "/explore"}
        >
          <Compass size={17} /> Kunjungi di kota
        </Link>
      </div>
    </article>
  );
}
