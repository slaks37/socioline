import { absolute } from "../lib/seo";
import { pages } from "../lib/content";
import { canvasPath, learningWeeks } from "../lib/learning-canvases";
export default function sitemap() {
  return [
    "/",
    "/explore",
    "/worlds",
    ...pages.map((p) => p.path),
    canvasPath,
    ...learningWeeks.map((week) => `${canvasPath}/${week.week}`),
    `${canvasPath}/perkembangan`,
  ].map((path) => ({
    url: absolute(path),
  }));
}
