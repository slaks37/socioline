import type { Metadata } from "next";
export const base = new URL(process.env.SITE_URL || "http://localhost:3000");
export const absolute = (path: string) => new URL(path, base).href;
export function meta(
  path: string,
  title: string,
  description: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: absolute(path) },
    openGraph: {
      title,
      description,
      url: absolute(path),
      type:
        path.startsWith("/blog/") || path.startsWith("/news/")
          ? "article"
          : "website",
      images: [absolute("/atlas.webp")],
    },
  };
}
