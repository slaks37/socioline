"use client";
import Ambience from "./Ambience";
import AvatarStudio from "./AvatarStudio";
import CityReader, { ReadingLink, type Reading } from "./CityReader";
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
import { MapPin, Pause, Navigation } from "lucide-react";
import { initialAvatar, validAvatar } from "./avatar-data";
import type { Input, Location, Pose } from "./GameScene";
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
const canvasWeeks: Record<string, number> = {
  "/the-word/encounter": 1,
  "/the-word/understand": 1,
  "/the-word/discern": 2,
  "/the-word/commit": 3,
  "/the-world/explore": 4,
  "/the-world/encounter": 4,
  "/the-world/listen": 5,
  "/the-world/research": 5,
  "/resources/listening-guide": 5,
  "/the-world/understand": 6,
  "/the-world/insights": 6,
  "/the-world/opportunities": 6,
  "/the-work/co-design": 7,
  "/the-work/mission-model": 8,
  "/the-work/venture-studio": 9,
  "/the-work/experiment": 10,
  "/the-work/serve": 11,
  "/the-work/multiply": 12,
};
function Modal({
  children,
  close,
  title,
  reading = false,
}: {
  reading?: boolean;
  children: ReactNode;
  close: () => void;
  title: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const resumeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (reading) resumeButton.current?.focus({ preventScroll: true });
  }, [reading]);
  useEffect(() => {
    const d = dialog.current;
    const old = document.activeElement as HTMLElement;
    d?.showModal();
    return () => {
      d?.close();
      const canvas = document.querySelector<HTMLCanvasElement>(".game canvas");
      if (canvas) canvas.focus({ preventScroll: true });
      else if (old?.isConnected) old.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={reading ? "city-reader" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      aria-label={title}
    >
      {reading ? (
        <div className="city-reader-bar">
          <h2>{title}</h2>
          <button className="button dark" ref={resumeButton} onClick={close}>
            Lanjutkan menjelajah
          </button>
        </div>
      ) : (
        <>
          <span className="eyebrow">WORLD ATLAS</span>
          <h2>{title}</h2>
        </>
      )}
      {children}
      {!reading && (
        <button className="secondary" onClick={close}>
          Lanjutkan menjelajah
        </button>
      )}
    </dialog>
  );
}
export default function Explorer() {
  const [avatar, setAvatar] = useState(initialAvatar),
    [remember, setRemember] = useState(false),
    [playing, play] = useState(false),
    [supported, webgl] = useState<boolean | null>(null),
    [modal, open] = useState(""),
    [quality, qualitySet] = useState("Balanced");
  const [reader, setReader] = useState<Reading | null>(null);
  const [editing, setEditing] = useState(false);
  const pose = useRef<Pose>({ x: 0, y: 0, z: 43, facing: Math.PI });
  const closePanel = useCallback(() => {
    open("");
    setReader(null);
  }, []);
  const editAvatar = () => {
    setEditing(true);
    play(false);
    closePanel();
  };
  const [travel, setTravel] = useState<{
      x: number;
      z: number;
      seq: number;
      name: string;
      resume?: Pose;
    }>({ ...travelPoints[0], seq: 0 }),
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
    setReader(null);
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
  const save = () => {
    window.scrollTo(0, 0);
    try {
      if (remember) localStorage.setItem(key, JSON.stringify(avatar));
      else localStorage.removeItem(key);
    } catch {}
    if (supported === false) {
      const directory =
        document.querySelector<HTMLDetailsElement>("#directory");
      if (directory) {
        directory.open = true;
        directory.querySelector("summary")?.focus();
        directory.scrollIntoView();
      }
      return;
    }
    if (editing) {
      const resume = { ...pose.current };
      setTravel((t) => ({
        name: t.name,
        x: resume.x,
        z: resume.z,
        resume,
        seq: t.seq + 1,
      }));
      setEditing(false);
      play(true);
      return;
    }
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
  const selectedPage = selected && findPage(selected.url);
  const week = selected && canvasWeeks[selected.url];
  const libraryLink =
    selected &&
    (week ||
      [
        "/resources",
        "/programs",
        "/programs/w3-journey",
        "/about/framework",
        "/the-word/resources",
      ].includes(selected.url));
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
      {!playing ? (
        <>
          {supported === false && (
            <section className="offline">
              <h2>Jelajahi dalam 2D</h2>
              <p>
                Browser ini belum dapat menampilkan kota 3D.{" "}
                <a href="#directory">Buka direktori kota 2D</a> untuk
                mengunjungi landmark.
              </p>
            </section>
          )}
          <AvatarStudio
            avatar={avatar}
            update={setAvatar}
            supported={supported}
            editing={editing}
            remember={remember}
            onEnter={save}
            onRemember={(value) => {
              setRemember(value);
              if (!value) {
                try {
                  localStorage.removeItem(key);
                } catch {}
              }
            }}
            renderPreview={(rotation, portrait) => (
              <Guard fail={fail}>
                <Preview
                  avatar={avatar}
                  rotation={rotation}
                  portrait={portrait}
                />
              </Guard>
            )}
          />
        </>
      ) : (
        <div className="game" ref={stage}>
          <Ambience enabled={sound} />
          <Guard fail={fail}>
            <World
              {...{
                avatar,
                pose,
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
              close={closePanel}
              reading={!!reader}
              title={
                reader?.title ??
                selected?.name ??
                (modal === "pause" ? "Pengaturan kota" : "Peta dan perjalanan")
              }
            >
              {reader ? (
                <CityReader page={reader} resume={closePanel} />
              ) : selected ? (
                <>
                  <p>
                    {selectedPage?.intro ??
                      (selected.id === "travel-station"
                        ? "Pilih tujuan untuk berpindah ke distrik lain."
                        : selected.id === "avatar-studio"
                          ? "Ubah tampilan avatarmu di studio."
                          : "Jelajahi ruang untuk merancang dunia bersama.")}
                  </p>
                  {selectedPage?.sections.slice(0, 2).map(([heading, body]) => (
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
                    <button className="secondary" onClick={editAvatar}>
                      Sesuaikan avatar ini
                    </button>
                  )}
                  <div className="city-reading-links">
                    {selected.url !== "/explore" && (
                      <ReadingLink
                        page={{
                          url: selected.url,
                          title: selectedPage?.title ?? selected.name,
                        }}
                        open={setReader}
                      >
                        {selected.url === "/worlds"
                          ? "Buka Lab Dunia"
                          : "Baca halaman lengkap"}
                      </ReadingLink>
                    )}
                    {week && (
                      <ReadingLink
                        page={{
                          url: "/resources/canvas/" + week,
                          title: "Canvas minggu " + week,
                        }}
                        open={setReader}
                      >
                        Isi canvas minggu {week}
                      </ReadingLink>
                    )}
                    {libraryLink && (
                      <ReadingLink
                        page={{
                          url: "/resources/canvas",
                          title: "Pustaka canvas W3",
                        }}
                        open={setReader}
                      >
                        Buka pustaka canvas
                      </ReadingLink>
                    )}
                  </div>
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
                  <button className="secondary" onClick={editAvatar}>
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
