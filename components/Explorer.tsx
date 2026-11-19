"use client";
import Ambience from "./Ambience";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Component,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  Compass,
  ArrowRight,
  RotateCw,
  MapPin,
  Pause,
  Navigation,
  ArrowUpRight,
} from "lucide-react";
import {
  initialAvatar,
  validAvatar,
  hairStyles,
  skinTones,
  outfits,
  type AvatarData,
} from "./avatar-data";
import type { Input, Location } from "./GameScene";
import { interactives, districts, findPage } from "../lib/content";
const World = dynamic(() => import("./GameScene"), { ssr: false });
const Preview = dynamic(() => import("./GameScene").then((m) => m.Preview), {
  ssr: false,
});
class Guard extends Component<
  { children: ReactNode; fail: () => void },
  { broken: boolean }
> {
  state = { broken: false };
  static getDerivedStateFromError() {
    return { broken: true };
  }
  componentDidCatch() {
    this.props.fail();
  }
  render() {
    return this.state.broken ? null : this.props.children;
  }
}
const travelPoints = [
  { name: "Central Plaza", x: 0, z: 43 },
  ...districts.map((d) => ({ name: d.name, x: d.x, z: -18 })),
];
const key = "socioline.avatar.v1";
function Modal({
  children,
  close,
  title,
}: {
  children: ReactNode;
  close: () => void;
  title: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    const old = document.activeElement as HTMLElement;
    d?.showModal();
    return () => {
      d?.close();
      if (old?.isConnected) old.focus();
      else document.querySelector<HTMLCanvasElement>(".game canvas")?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      aria-label={title}
    >
      <span className="eyebrow">WORLD ATLAS</span>
      <h2>{title}</h2>
      {children}
      <button className="secondary" onClick={close}>
        Kembali ke kota
      </button>
    </dialog>
  );
}
export default function Explorer() {
  const [avatar, setAvatar] = useState(initialAvatar),
    [remember, setRemember] = useState(false),
    [playing, play] = useState(false),
    [rotation, rotate] = useState(0.2),
    [supported, webgl] = useState<boolean | null>(null),
    [modal, open] = useState(""),
    [quality, qualitySet] = useState("Balanced");
  const [travel, setTravel] = useState({ ...travelPoints[0], seq: 0 }),
    [loc, setLoc] = useState<Location>({ x: 0, z: 25, id: "" });
  const input = useRef<Input>({ dx: 0, dz: 0, jump: false, turn: 0, tilt: 4 });
  const [inside, setInside] = useState(false),
    [panorama, setPanorama] = useState(false),
    [distance, setDistance] = useState(7),
    [sound, setSound] = useState(false),
    [visited, setVisited] = useState<string[]>([]);
  const returnPoint = useRef({ x: -46, z: -23 });
  const launch = useCallback(
    (id: string) => {
      if (id === "word-library") {
        if (inside) {
          setTravel((t) => ({
            ...returnPoint.current,
            name: "Grand Library",
            seq: t.seq + 1,
          }));
          setInside(false);
        } else {
          returnPoint.current = { x: loc.x, z: loc.z };
          setTravel((t) => ({
            name: "Grand Library",
            x: -46,
            z: -27.3,
            seq: t.seq + 1,
          }));
          setInside(true);
        }
        setPanorama(false);
        return;
      }
      if (id) setVisited((v) => (v.includes(id) ? v : [...v, id]));
      open(id);
    },
    [inside, loc.x, loc.z],
  );
  const stage = useRef<HTMLDivElement>(null);
  const fail = useCallback(() => {
    webgl(false);
    play(false);
    open("");
    document
      .querySelector<HTMLDetailsElement>("#directory")
      ?.setAttribute("open", "");
  }, []);
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(key) ?? "null");
      if (validAvatar(value)) {
        setAvatar(value);
        setRemember(true);
      }
    } catch {}
    if (matchMedia("(pointer: coarse)").matches) qualitySet("Low");
    const el = document.createElement("canvas");
    const ctx = el.getContext("webgl2");
    if (!ctx) {
      fail();
      return;
    }
    ctx.getExtension("WEBGL_lose_context")?.loseContext();
    webgl(true);
  }, [fail]);
  useEffect(() => {
    if (!playing) return;
    const k = (e: KeyboardEvent) => {
      if (modal || e.repeat) return;
      if (e.code === "Escape") {
        e.preventDefault();
        open("pause");
      }
      if (e.code === "KeyM") open("travel");
      if (e.code === "KeyE" && loc.id) launch(loc.id);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [playing, loc.id, modal, launch]);
  const change = (v: Partial<AvatarData>) => setAvatar((a) => ({ ...a, ...v }));
  const save = () => {
    window.scrollTo(0, 0);
    try {
      if (remember) localStorage.setItem(key, JSON.stringify(avatar));
      else localStorage.removeItem(key);
    } catch {}
    const target = interactives.find(
      (l) =>
        l.id === new URLSearchParams(window.location.search).get("landmark"),
    );
    const dest = target
      ? {
          x: target.x,
          z: target.z + (target.kind === 7 ? 6 : 6),
          name: target.name,
        }
      : travelPoints[0];
    setInside(false);
    setPanorama(false);
    setTravel({ ...dest, seq: travel.seq + 1 });
    play(true);
  };
  const near = interactives.find((l) => l.id === loc.id),
    selected = interactives.find((l) => l.id === modal);
  const zone = inside
    ? "Grand Library"
    : loc.z > 1
      ? "Central Hub"
      : districts[loc.x < -23 ? 0 : loc.x > 23 ? 2 : 1].name;
  const stick = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    input.current.dx = Math.max(
      -1,
      Math.min(
        1,
        (e.clientX - rect.left - rect.width / 2) / (rect.width * 0.42),
      ),
    );
    input.current.dz = Math.max(
      -1,
      Math.min(
        1,
        (e.clientY - rect.top - rect.height / 2) / (rect.height * 0.42),
      ),
    );
  };
  return (
    <>
      <div className="entry-head">
        <span className="eyebrow">
          <i className="rule" />
          {playing ? "CITY EXPLORER" : "CENTRAL HUB"}
        </span>
        <h1>
          {playing ? zone : "Avatar Studio"}
          <span>.</span>
        </h1>
        <p>
          {playing
            ? "Susuri jalan kota dan dekati landmark untuk mempelajari materinya."
            : "Pilih karakter untuk menjelajahi kota sebagai tamu."}
        </p>
      </div>
      {supported === false ? (
        <section className="offline">
          <h2>Jelajahi dalam 2D</h2>
          <p>
            Browser ini belum dapat membuka tampilan 3D. Seluruh landmark
            tersedia dalam direktori di bawah.
          </p>
        </section>
      ) : !playing ? (
        <div className="studio">
          <div className="preview">
            <span className="eyebrow">PRATINJAU KARAKTER</span>
            {supported && (
              <Guard fail={fail}>
                <Preview avatar={avatar} rotation={rotation} />
              </Guard>
            )}
            <button
              className="secondary"
              onClick={() => rotate((r) => r + Math.PI / 4)}
            >
              <RotateCw size={15} /> Putar
            </button>
          </div>
          <div className="options">
            <fieldset>
              <legend>Karakter awal</legend>
              {(["Male", "Female"] as const).map((p) => (
                <button
                  key={p}
                  aria-pressed={avatar.preset === p}
                  onClick={() => change({ preset: p })}
                >
                  {p}
                </button>
              ))}
            </fieldset>
            <fieldset>
              <legend>Gaya rambut</legend>
              {hairStyles.map((h) => (
                <button
                  key={h}
                  aria-pressed={avatar.hair === h}
                  onClick={() => change({ hair: h })}
                >
                  {h}
                </button>
              ))}
            </fieldset>
            <fieldset>
              <legend>Warna rambut</legend>
              {["#372c29", "#714b34", "#c6a170", "#77776f"].map((color, i) => (
                <button
                  className="swatch"
                  key={color}
                  style={{ background: color }}
                  aria-label={["Hitam", "Cokelat", "Pirang", "Abu-abu"][i]}
                  aria-pressed={(avatar.hairColor ?? "#372c29") === color}
                  onClick={() => change({ hairColor: color })}
                />
              ))}
            </fieldset>
            <fieldset>
              <legend>Outfit</legend>
              {(["Field jacket", "T-shirt"] as const).map((garment) => (
                <button
                  key={garment}
                  aria-pressed={(avatar.garment ?? "Field jacket") === garment}
                  onClick={() => change({ garment })}
                >
                  {garment}
                </button>
              ))}
            </fieldset>
            {(["skin", "outfit"] as const).map((k) => (
              <fieldset key={k}>
                <legend>
                  {k === "skin" ? "Warna kulit" : "Warna pakaian"}
                </legend>
                {(k === "skin" ? skinTones : outfits).map((c, i) => (
                  <button
                    className="swatch"
                    style={{ background: c }}
                    aria-label={
                      (k === "skin"
                        ? ["Light", "Warm beige", "Tan", "Brown", "Deep brown"]
                        : ["Teal", "Terracotta", "Indigo", "Ochre"])[i]
                    }
                    aria-pressed={avatar[k] === c}
                    key={c}
                    onClick={() => change({ [k]: c })}
                  />
                ))}
              </fieldset>
            ))}
            <label>
              Nama panggilan (opsional)
              <input
                maxLength={24}
                value={avatar.name}
                onChange={(e) => change({ name: e.target.value })}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => {
                  setRemember(e.target.checked);
                  if (!e.target.checked)
                    try {
                      localStorage.removeItem(key);
                    } catch {}
                }}
              />{" "}
              Simpan avatar saya di perangkat ini
            </label>
            <button
              className="button gold"
              disabled={!supported}
              onClick={save}
            >
              <Compass size={18} />
              Masuk ke Central Plaza
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="game" ref={stage}>
          <Ambience enabled={sound} />
          <Guard fail={fail}>
            <World
              {...{
                avatar,
                input,
                travel,
                quality,
                inside,
                panorama,
                distance,
              }}
              paused={!!modal}
              report={setLoc}
              onFail={fail}
            />
          </Guard>
          <div className="hud">
            <Link
              prefetch={false}
              className="hud-brand"
              href="/"
              aria-label="SocioLine"
            >
              <img src="/socioline.webp" alt="SocioLine" />
            </Link>
            <b>
              <MapPin size={15} />
              {zone}
            </b>
            <button
              aria-label="Peta dan perjalanan"
              onClick={() => open("travel")}
            >
              <Navigation size={16} /> Peta
            </button>
            <button
              onClick={() => setPanorama((p) => !p)}
              aria-pressed={panorama}
            >
              {panorama ? "Kembali bermain" : "Panorama"}
            </button>
            <button aria-label="Pause city" onClick={() => open("pause")}>
              <Pause size={16} />
            </button>
          </div>
          <div
            className="mini"
            role="img"
            aria-label={
              "Minimap. Current position " +
              Math.round(loc.x) +
              ", " +
              Math.round(loc.z)
            }
          >
            <img alt="" src="/minimap.svg" />
            <i
              style={{
                left: ((loc.x + 80) / 160) * 100 + "%",
                top: ((loc.z + 72) / 120) * 100 + "%",
              }}
            />
          </div>
          <div className="controls">
            WASD gerak · Seret kamera · Shift lari · Spasi lompat · E interaksi
            · M peta · Esc jeda
          </div>
          {near && (
            <button className="interact" onClick={() => launch(near.id)}>
              {near.id === "word-library"
                ? inside
                  ? "Keluar perpustakaan"
                  : "Masuk Grand Library"
                : "Interaksi · " + near.name}
            </button>
          )}
          <div
            className="stick"
            aria-label="Touch joystick"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              stick(e);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) stick(e);
            }}
            onLostPointerCapture={() => {
              input.current.dx = 0;
              input.current.dz = 0;
            }}
          >
            ✥
          </div>
          <button
            className="jump"
            onClick={() => {
              input.current.jump = true;
            }}
          >
            Jump
          </button>
          {modal && (
            <Modal
              close={() => open("")}
              title={
                selected?.name ??
                (modal === "pause" ? "Pengaturan kota" : "Peta dan perjalanan")
              }
            >
              {selected ? (
                <>
                  <p>
                    {findPage(selected.url)?.intro ??
                      "Explore the city and customize your guest character."}
                  </p>
                  {findPage(selected.url)
                    ?.sections.slice(0, 2)
                    .map(([heading, body]) => (
                      <section key={heading}>
                        <h3>{heading}</h3>
                        <p>{body}</p>
                      </section>
                    ))}
                  {selected.id === "travel-station" && (
                    <button
                      className="secondary"
                      onClick={() => open("travel")}
                    >
                      Pilih tujuan
                    </button>
                  )}
                  {selected.id === "avatar-studio" && (
                    <button
                      className="secondary"
                      onClick={() => {
                        play(false);
                        open("");
                      }}
                    >
                      Sesuaikan avatar ini
                    </button>
                  )}
                  <a className="button dark" href={selected.url}>
                    Baca halaman lengkap <ArrowUpRight size={16} />
                  </a>
                </>
              ) : modal === "travel" ? (
                <>
                  <p>{visited.length} tempat dipelajari dalam sesi ini.</p>
                  <img
                    width="100%"
                    height="145"
                    src="/minimap.svg"
                    alt="Peta kota. Dari barat ke timur: The Word, The World, dan The Work. Central Hub berada di selatan."
                  />
                  <div className="related">
                    {travelPoints.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => {
                          setInside(false);
                          setPanorama(false);
                          setTravel({ ...t, seq: travel.seq + 1 });
                          open("");
                        }}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <label>
                    Jarak kamera
                    <input
                      type="range"
                      min="3"
                      max="12"
                      step=".5"
                      value={distance}
                      onChange={(e) => setDistance(Number(e.target.value))}
                    />
                  </label>
                  <button
                    className="secondary"
                    aria-pressed={sound}
                    onClick={() => setSound((v) => !v)}
                  >
                    Suara kota {sound ? "aktif" : "nonaktif"}
                  </button>
                  <label>
                    Kualitas grafis
                    <select
                      value={quality}
                      onChange={(e) => qualitySet(e.target.value)}
                    >
                      {["Balanced", "Low", "High"].map((q) => (
                        <option key={q}>{q}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="secondary"
                    onClick={() => {
                      play(false);
                      open("");
                    }}
                  >
                    Sesuaikan avatar
                  </button>
                </>
              )}
            </Modal>
          )}
        </div>
      )}
    </>
  );
}
