import data from "../content/public.json";
export type Landmark = {
  id: string;
  name: string;
  x: number;
  z: number;
  zone: string;
  url: string;
  kind: number;
};
export type Page = {
  path: string;
  title: string;
  intro: string;
  category: string;
  sections: string[][];
  byline?: string;
  date?: string;
  updated?: string;
  cover?: string;
  seo?: { title?: string; description?: string };
  links: string[];
};
export const districts = data.districts;
export const landmarks: Landmark[] = data.landmarks;
export const pages: Page[] = data.pages;
export const boards = data.boards;
export const published: {
  url: string;
  date: string;
  title: string;
  summary: string;
}[] = data.published;
export const findPage = (url: string) => pages.find((p) => p.path === url);
export const interactives: Landmark[] = [
  ...landmarks,
  ...boards.map((b, i) => ({
    id: "board-" + i,
    name: b.name,
    x: b.x,
    z: b.z,
    url: b.path,
    zone: "hub",
    kind: -1,
  })),
];
