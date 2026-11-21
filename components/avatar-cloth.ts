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
// Design fronts in garment UV space. A full turn wraps at the back seam,
// so the button placket, neckline and grain stay centred as the torso turns.
function sewFront(ctx: CanvasRenderingContext2D, g: Garment, skin: string) {
  const ink = "rgba(42,29,41,.58)";
  function panel(d: string, fill: string, edge?: string, width = 1.4) {
    const path = new Path2D(d);
    ctx.fillStyle = fill;
    ctx.fill(path);
    if (edge) {
      ctx.lineWidth = width;
      ctx.strokeStyle = edge;
      ctx.stroke(path);
    }
  }
  function seam(d: string, color = ink, width = 1.4) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke(new Path2D(d));
  }
  const jacket = ["overshirt", "blazer", "varsity", "vest", "track"].includes(
    g.top,
  );
  const shirt = g.top === "blouse" || g.top === "mandarin";
  const closed = g.art === "fabric" || g.inner === g.color;
  const jacketEdge = g.top === "blazer" ? 32 : 22;
  if (jacket && !closed) {
    const side = jacketEdge;
    panel(
      `M212 -4 Q231 38 ${256 - side} 125 Q${260 - side} 255 ${246 - side} 384 L${269 + side} 384 Q${248 + side} 250 ${256 + side} 125 Q284 35 300 -4Z`,
      g.inner,
      ink,
      2,
    );
    seam("M215 0 Q254 62 297 0", "rgba(97,73,76,.35)", 3);
    seam("M226 371 Q253 375 279 369", "rgba(97,73,76,.35)");
  }
  if (g.top === "overshirt" && !closed) {
    panel("M224 -4 Q231 6 238 12 Q257 27 279 12 Q286 6 289 -4Z", skin);
    seam("M225 0 Q253 41 286 0", "rgba(117,84,76,.61)", 2);
  }
  if (shirt || closed) seam("M255 8 Q255 176 258 383", "rgba(92,62,65,.52)", 2);
  if (g.top === "overshirt" || g.top === "blazer") {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(256, 0);
      ctx.scale(side, 1);
      panel(
        g.top === "blazer"
          ? "M27 -1 L53 26 41 44 50 56 21 145 17 90Z"
          : "M27 -2 Q43 9 48 22 L35 59 17 27Z",
        g.color,
        ink,
        2,
      );
      panel(
        "M38 107 Q50 110 64 106 L64 145 51 151 38 143Z",
        "rgba(255,255,255,.035)",
        "rgba(45,35,47,.4)",
      );
      seam("M39 111 Q50 114 63 110", "rgba(255,236,209,.39)");
      ctx.restore();
    }
  }
  if (g.top === "blouse") {
    panel("M177 -5 Q217 37 255 57 Q289 33 333 -5Z", skin, ink);
    seam("M180 1 Q216 39 255 64 Q294 36 328 2", "rgba(127,93,82,.50)", 2);
  }
  if (shirt || g.top === "overshirt" || g.top === "blazer") {
    const x = jacket && !closed ? 256 - jacketEdge - 4 : 258;
    for (let y = 72; y < 362; y += 55) {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(x, y + 1, 2.7, 3.8, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = g.top === "mandarin" ? "#d9ad72" : "#d3c6b6";
      ctx.beginPath();
      ctx.ellipse(x - 0.5, y, 1.8, 2.7, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  if (g.top === "hoodie") {
    panel(
      "M202 -1 Q221 44 256 64 Q291 42 310 -1 L290 -2 Q270 26 256 32 Q236 16 224 -2Z",
      g.color,
      ink,
    );
    for (const x of [240, 272]) seam(`M${x} 37 q-1 34 2 57`, g.inner, 3);
    seam("M217 275 Q256 270 295 275 L305 333 Q256 345 205 333Z");
  }
  if (g.top === "wrap") seam("M309 0 Q285 84 204 181 Q197 217 197 265", ink, 4);
  if (g.top === "mandarin") {
    seam("M232 0 Q229 25 255 32 Q274 35 280 48 L282 142", ink, 2.4);
    for (const y of [55, 88, 122])
      seam(`M272 ${y} q11 -6 19 0 q-9 4 -19 0`, "#c29862", 3);
  }
  if (g.top === "varsity") {
    ctx.font = "bold 42px Georgia";
    ctx.fillStyle = g.inner;
    ctx.fillText("S", 292, 115);
  }
  if (g.art === "surf") {
    seam(
      "M291 108 Q298 88 311 91 Q302 93 306 100 Q312 105 322 98 Q314 113 301 108Z",
      "#829bb4",
      2.4,
    );
  } else if (g.art === "crest") {
    seam(
      "M288 88 Q300 94 312 88 L311 107 Q306 115 300 119 Q293 114 289 106Z M294 104 Q300 94 306 104",
      "#c79f6c",
      2,
    );
  } else if (g.art === "flower" || g.art === "bamboo") {
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(299 + i * 4, 90 + i * 12);
      ctx.rotate(i * 0.4);
      seam(
        "M-8 6 Q0 0 7 -19 M-1 -3 Q-13 -4 -12 -12 Q-5 -12 -1 -3 M3 -10 Q9 -20 14 -18 Q11 -12 3 -10",
        "#b68d65",
        1.8,
      );
      if (g.art === "flower") {
        ctx.translate(6, -18);
        for (let petal = 0; petal < 5; petal++) {
          ctx.rotate((Math.PI * 2) / 5);
          panel("M0 0 Q-6 -3 -2 -8 Q3 -10 4 -6 Q5 -3 0 0Z", "#d4a09a");
        }
      }
      ctx.restore();
    }
  }
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(256, 0);
    ctx.scale(side, 1);
    panel(
      "M78 84 Q65 113 44 134 Q68 125 82 102Z M80 191 Q58 210 44 215 Q69 208 84 198Z M71 246 Q47 272 23 275 Q45 279 77 253Z M70 358 Q45 336 25 339 Q44 339 62 364Z",
      "rgba(70,41,55,.14)",
    );
    seam("M30 274 Q47 273 68 255", "rgba(255,246,224,.27)", 2);
    ctx.restore();
  }
}

function paint(g: Garment, skin: string, swatch?: HTMLImageElement) {
  const shirt = garmentCanvas(),
    skirt = garmentCanvas(),
    sleeve = garmentCanvas();
  const top = shirt.getContext("2d")!,
    lower = skirt.getContext("2d")!,
    arm = sleeve.getContext("2d")!;
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
  sewFront(top, g, skin);
  if (g.sleeve === "roll" || g.sleeve === "puff") {
    arm.fillStyle = "rgba(255,240,218,.24)";
    arm.fillRect(0, 325, 512, 53);
    arm.strokeStyle = seam;
    arm.lineWidth = 3;
    arm.stroke(new Path2D("M0 326 Q128 334 256 326 T512 326 M0 372 L512 372"));
  }
  const trousers = garmentCanvas(),
    boots = garmentCanvas();
  const leg = trousers.getContext("2d")!,
    shoe = boots.getContext("2d")!;
  leg.fillStyle = g.pants;
  leg.fillRect(0, 0, 512, 384);
  for (const x of [116, 396]) {
    leg.strokeStyle = "rgba(52,39,45,.36)";
    leg.lineWidth = 2.5;
    leg.stroke(new Path2D(`M${x} 0 Q${x - 5} 180 ${x + 3} 384`));
    leg.strokeStyle = "rgba(255,238,208,.40)";
    leg.lineWidth = 1.3;
    leg.stroke(new Path2D(`M${x + 3} 0 Q${x - 2} 180 ${x + 6} 384`));
  }
  leg.fillStyle = "rgba(63,44,52,.18)";
  leg.fill(
    new Path2D(
      "M127 11 Q179 43 240 65 Q184 57 145 37Z M355 152 Q318 164 281 192 Q306 163 355 152Z M168 278 Q213 302 267 304 Q224 312 188 295Z M336 330 Q286 349 228 349 Q290 358 342 338Z",
    ),
  );
  leg.strokeStyle = "rgba(255,248,221,.37)";
  leg.lineWidth = 2;
  leg.stroke(
    new Path2D(
      "M152 37 Q177 51 212 57 M241 347 Q296 344 325 333 M0 375 L512 375",
    ),
  );
  const loafer = g.shoes === "loafers",
    sandal = g.shoes === "sandals",
    flat = g.shoes === "flats";
  shoe.fillStyle = sandal
    ? skin
    : flat
      ? "#e6cfac"
      : loafer
        ? "#584239"
        : "#e9e4df";
  shoe.fillRect(0, 0, 512, 384);
  shoe.fillStyle = "rgba(105,75,65,.16)";
  shoe.fill(
    new Path2D(
      "M60 0 L179 0 Q205 90 215 140 Q146 128 85 223Z M452 0 L333 0 Q309 90 297 140 Q366 128 427 223Z",
    ),
  );
  shoe.strokeStyle = "rgba(98,76,72,.56)";
  shoe.lineWidth = 2;
  shoe.stroke(
    new Path2D(
      "M0 291 Q100 285 160 264 Q207 248 217 221 Q256 233 295 221 Q330 279 512 291",
    ),
  );
  if (!sandal && !flat && !loafer) {
    shoe.stroke(
      new Path2D("M198 0 Q213 84 219 153 Q251 167 292 152 Q298 66 314 0"),
    );
    for (let i = 0; i < 4; i++) {
      const y = 20 + i * 29;
      shoe.strokeStyle = "#93878c";
      shoe.lineWidth = 7;
      const lace = new Path2D(
        `M216 ${y} L291 ${y + 15} M292 ${y} L215 ${y + 15}`,
      );
      shoe.stroke(lace);
      shoe.strokeStyle = "#fffbef";
      shoe.lineWidth = 4;
      shoe.stroke(lace);
    }
  }
  const belt = garmentCanvas(),
    waist = belt.getContext("2d")!;
  waist.fillStyle = g.pants;
  waist.fillRect(0, 0, 512, 384);
  waist.fillStyle = "rgba(39,29,35,.22)";
  waist.fillRect(0, 39, 512, 43);
  waist.strokeStyle = "rgba(80,58,62,.49)";
  waist.lineWidth = 2.4;
  waist.stroke(
    new Path2D(
      "M257 73 Q255 140 259 277 M270 74 Q278 191 259 242 M212 79 Q196 143 154 187 M301 79 Q316 145 354 187 M0 85 L512 85",
    ),
  );
  waist.fillStyle = "#847161";
  waist.fillRect(249, 53, 13, 13);
  return {
    torso: mapOf(shirt),
    lower: mapOf(skirt),
    sleeve: mapOf(sleeve),
    trousers: mapOf(trousers),
    belt: mapOf(belt),
    shoe: mapOf(boots),
  };
}
export function useCloth(g: Garment, collection: Collection, skin: string) {
  const source = `/avatar-textiles/${collection}.webp`;
  const [loaded, setLoaded] = useState<{
    source: string;
    swatch: HTMLImageElement;
  }>();
  useEffect(() => {
    let live = true;
    image(source)
      .then((swatch) => {
        if (live) setLoaded({ source, swatch });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [source]);
  const maps = useMemo(
    () => paint(g, skin, loaded?.source === source ? loaded.swatch : undefined),
    [g, skin, loaded, source],
  );
  useEffect(
    () => () => Object.values(maps).forEach((texture) => texture.dispose()),
    [maps],
  );
  return maps;
}
