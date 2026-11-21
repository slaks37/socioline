import { useEffect, useMemo, useState } from "react";
import * as T from "three";
import type { Collection } from "../engine/avatar";
import type { Garment } from "./avatar-wardrobe";

const images = new Map<string, Promise<HTMLImageElement>>();
function image(url: string) {
  let pending = images.get(url);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Avatar artwork unavailable"));
      img.src = url;
    });
    images.set(url, pending);
    pending.catch(() => images.delete(url));
  }
  return pending;
}

// Pixel coordinates in the original cropped full-length illustrations: chest centre and garment hem.
const heroFront: Record<Collection, [number[], number[]]> = {
  indonesia: [
    [132, 122, 132, 323, 44, 55],
    [134, 182, 141, 266, 29, 37],
  ],
  tiongkok: [
    [137, 115, 137, 308, 39, 53],
    [136, 171, 145, 265, 32, 38],
  ],
  amerika: [
    [121, 119, 127, 313, 46, 57],
    [141, 178, 141, 263, 32, 38],
  ],
  afrika: [
    [151, 125, 145, 315, 45, 49],
    [135, 174, 135, 254, 31, 36],
  ],
  australia: [
    [130, 120, 130, 315, 36, 53],
    [142, 180, 144, 282, 31, 35],
  ],
};
function garmentCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 384;
  return canvas;
}
function mapOf(canvas: HTMLCanvasElement) {
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}
function paintFabric(
  ctx: CanvasRenderingContext2D,
  swatch: HTMLImageElement,
  motif: number,
  scale: number,
) {
  const tile = document.createElement("canvas");
  tile.width = scale;
  tile.height = Math.round(scale * 0.73);
  tile
    .getContext("2d")!
    .drawImage(swatch, motif * 42, 0, 42, 30, 0, 0, tile.width, tile.height);
  return ctx.createPattern(tile, "repeat")!;
}
function shirtFront(
  collection: Collection,
  female: boolean,
  index: number,
  original: HTMLImageElement,
) {
  const overlay = garmentCanvas(),
    ctx = overlay.getContext("2d")!;
  const tile = original.naturalWidth / 6;
  const center = tile * (index - 0.5);
  const [topX, topY, hemX, hemY, topWidth, hemWidth] =
    index === 0
      ? heroFront[collection][female ? 1 : 0]
      : [
          center,
          female ? 63 : 54,
          center,
          female ? 120 : 132,
          tile * 0.194,
          tile * 0.22,
        ];
  // Project only the fabric between the armholes. The collar, arms and hem are separate surfaces.
  for (let y = 0; y < 384; y++) {
    const t = y / 383;
    const mid = T.MathUtils.lerp(topX, hemX, t),
      half = T.MathUtils.lerp(topWidth, hemWidth, t);
    const sy = T.MathUtils.lerp(topY, hemY, t);
    ctx.drawImage(original, mid - half, sy, 2 * half, 1, 132, y, 248, 1);
  }
  ctx.globalCompositeOperation = "destination-in";
  const sides = ctx.createLinearGradient(132, 0, 380, 0);
  sides.addColorStop(0, "transparent");
  sides.addColorStop(0.13, "#000");
  sides.addColorStop(0.87, "#000");
  sides.addColorStop(1, "transparent");
  ctx.fillStyle = sides;
  ctx.fillRect(0, 0, 512, 384);
  const ends = ctx.createLinearGradient(0, 0, 0, 384);
  ends.addColorStop(0, "transparent");
  ends.addColorStop(0.08, "#000");
  ends.addColorStop(0.94, "#000");
  ends.addColorStop(1, "transparent");
  ctx.fillStyle = ends;
  ctx.fillRect(0, 0, 512, 384);
  return overlay;
}
function paint(
  g: Garment,
  collection: Collection,
  female: boolean,
  index: number,
  sources?: HTMLImageElement[],
) {
  const shirt = garmentCanvas(),
    skirt = garmentCanvas(),
    sleeve = garmentCanvas();
  const top = shirt.getContext("2d")!,
    lower = skirt.getContext("2d")!,
    arm = sleeve.getContext("2d")!;
  const swatch = sources?.[1];
  const pattern = swatch
    ? paintFabric(top, swatch, g.motif, g.waist === "print" ? 44 : 33)
    : g.color;
  for (const c of [top, arm]) {
    c.fillStyle = g.art === "fabric" ? pattern : g.color;
    c.fillRect(0, 0, 512, 384);
  }
  lower.fillStyle = g.pants;
  lower.fillRect(0, 0, 512, 384);
  if (g.art === "panel") {
    top.fillStyle = pattern;
    top.fillRect(255, 0, 32, 384);
    arm.fillStyle = pattern;
    arm.fillRect(0, 335, 512, 38);
  }
  if (g.top === "varsity" || g.top === "vest") {
    arm.fillStyle = g.inner;
    arm.fillRect(0, 0, 512, 384);
  }
  // Tailored back yoke, double-stitched hem and broad graphic fabric folds.
  const seam = "rgba(43,32,40,.34)";
  for (const c of [top, arm, lower]) {
    c.strokeStyle = seam;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0, 372);
    c.lineTo(512, 372);
    c.stroke();
    c.strokeStyle = "rgba(255,251,232,.33)";
    c.beginPath();
    c.moveTo(0, 370);
    c.lineTo(512, 370);
    c.stroke();
  }
  top.fillStyle = "rgba(45,30,47,.13)";
  const folds = new Path2D(
    "M0 252 Q48 294 81 278 L23 300Z M511 250 Q460 302 434 278 L491 307Z M69 133 Q65 246 38 263 L71 236Z M129 366 L144 300 135 371Z M411 371 L398 305 400 375Z",
  );
  top.fill(folds);
  top.strokeStyle = seam;
  top.lineWidth = 2;
  top.stroke(new Path2D("M0 66 Q46 66 108 38 M512 66 Q463 66 405 38"));
  arm.fillStyle = "rgba(50,34,49,.13)";
  arm.fill(
    new Path2D(
      "M5 284 Q89 320 168 289 L74 323Z M148 219 Q210 232 245 214 L183 246Z M372 307 L489 279 429 308Z",
    ),
  );
  if (g.top === "varsity" || g.top === "track") {
    for (const c of [top, arm]) {
      c.fillStyle = g.color;
      c.fillRect(0, 345, 512, 39);
      c.fillStyle = g.inner;
      for (const y of [350, 364]) c.fillRect(0, y, 512, 6);
    }
  }
  if (g.bottom === "skirt" || g.bottom === "dress") {
    if (g.bottom === "dress" && g.art === "fabric") {
      lower.fillStyle = pattern;
      lower.fillRect(0, 0, 512, 384);
    }
    for (let i = 0; i < 15; i++) {
      const x = i * 36;
      lower.fillStyle = "rgba(51,33,49,.17)";
      lower.fill(
        new Path2D(
          `M${x} 0 Q${x + 12} 130 ${x + 26} 384 L${x + 12} 384 Q${x + 7} 145 ${x} 0Z`,
        ),
      );
    }
    if (g.waist) {
      lower.fillStyle = g.waist === "silk" ? "#702e38" : pattern;
      lower.fillRect(0, 0, 512, 27);
      if (g.waist === "batik" || g.waist === "print") {
        lower.fill(
          new Path2D(
            "M175 0 L284 0 247 141 196 181Z M250 10 L292 6 309 104 276 91Z",
          ),
        );
        if (g.waist === "print") lower.fillRect(0, 352, 512, 28);
      }
      if (g.waist === "silk") {
        lower.strokeStyle = "#eabb73";
        lower.lineWidth = 3;
        lower.stroke(
          new Path2D(
            "M221 24 Q196 91 147 120 Q171 111 179 91 M191 90 Q169 87 164 68 M194 86 Q207 84 216 65",
          ),
        );
        for (const [x, y] of [
          [174, 80],
          [161, 107],
          [211, 69],
          [186, 90],
        ]) {
          for (let i = 0; i < 5; i++) {
            lower.fillStyle = "#eac7a4";
            lower.beginPath();
            lower.ellipse(
              x + 4 * Math.cos(i * 1.256),
              y + 4 * Math.sin(i * 1.256),
              3,
              2,
              i * 1.256,
              0,
              6.29,
            );
            lower.fill();
          }
        }
      }
    }
  }
  if (sources)
    top.drawImage(shirtFront(collection, female, index, sources[0]), 0, 0);
  return { torso: mapOf(shirt), lower: mapOf(skirt), sleeve: mapOf(sleeve) };
}
export function useCloth(
  g: Garment,
  collection: Collection,
  female: boolean,
  index: number,
) {
  const source = `/avatars/${collection}/${female ? "female" : "male"}-${index === 0 ? "hero" : "outfits"}.webp`;
  const [loaded, setLoaded] = useState<{
    source: string;
    images: HTMLImageElement[];
  }>();
  useEffect(() => {
    let live = true;
    Promise.all([image(source), image(`/avatar-textiles/${collection}.webp`)])
      .then((images) => {
        if (live) setLoaded({ source, images });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [source, collection]);
  const maps = useMemo(
    () =>
      paint(
        g,
        collection,
        female,
        index,
        loaded?.source === source ? loaded.images : undefined,
      ),
    [g, collection, female, index, loaded, source],
  );
  useEffect(
    () => () => Object.values(maps).forEach((texture) => texture.dispose()),
    [maps],
  );
  return maps;
}
