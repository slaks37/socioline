import { absolute } from "../lib/seo";
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absolute("/sitemap.xml"),
  };
}
