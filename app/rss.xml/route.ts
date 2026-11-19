import { pages, published } from "../../lib/content";
import { absolute } from "../../lib/seo";
export const dynamic = "force-static";
const xml = (v: string) =>
  v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
export function GET() {
  const entries = pages.filter(
    (p) =>
      p.path.startsWith("/blog/") || published.some((n) => n.url === p.path),
  );
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SocioLine Field Journal</title><description>Writing and updates from SocioLine Digital World</description><link>' +
      xml(absolute("/blog")) +
      "</link>" +
      entries
        .map(
          (p) =>
            "<item><title>" +
            xml(p.title) +
            "</title><description>" +
            xml(p.intro) +
            "</description><link>" +
            xml(absolute(p.path)) +
            "</link><guid>" +
            xml(absolute(p.path)) +
            "</guid></item>",
        )
        .join("") +
      "</channel></rss>",
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
  );
}
