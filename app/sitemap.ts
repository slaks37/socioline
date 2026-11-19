import { absolute } from "../lib/seo";
import { pages } from "../lib/content";
export default function sitemap() {
  return ["/", "/explore", "/worlds", ...pages.map((p) => p.path)].map(
    (path) => ({
      url: absolute(path),
    }),
  );
}
