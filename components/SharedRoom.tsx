"use client";
import Link from "next/link";
import { suggestedAction } from "../engine/world.ts";
import { landmarks } from "../lib/content";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { realmApi as api } from "../lib/world-api";
import type {
  Chunk,
  Entity,
  Peer,
  Specification,
  Snapshot,
} from "../engine/world.ts";
import ProjectRecord from "./ProjectRecord";
const Scene = dynamic(() => import("./RealmScene"), { ssr: false });
type World = { id: string; name: string; role: string; spec: Specification };
type Welcome = {
  ticket: string;
  seed: number;
  spec: Specification;
  id: string;
  role: string;
};
type MapData = { chunks: Chunk[]; objects: Entity[]; version: number };
class ViewGuard extends Component<{ children: ReactNode }, { lost: boolean }> {
  state = { lost: false };
  static getDerivedStateFromError() {
    return { lost: true };
  }
  render() {
    return this.state.lost ? (
      <p>WebGL tidak tersedia. Gunakan peta teks dan dokumen kerja di bawah.</p>
    ) : (
      this.props.children
    );
  }
}
export default function SharedRoom({
  world,
  leave,
}: {
  world: World;
  leave: () => void;
}) {
  const url = "/worlds/" + world.id;
  const [join, setJoin] = useState<Welcome | null>(null),
    [peers, setPeers] = useState<Peer[]>([]),
    [map, setMap] = useState<MapData>({ chunks: [], objects: [], version: 0 }),
    [status, setStatus] = useState("Menghubungkan…"),
    [message, note] = useState(""),
    [revision, rev] = useState(0),
    [retry, connect] = useState(0),
    [invite, share] = useState(""),
    [pending, confirm] = useState<{
      kind: "tree" | "bench";
      id?: string;
      x: number;
      z: number;
      version: number;
    } | null>(null),
    [guide, speak] = useState(""),
    [busy, setBusy] = useState(false);
  const [command, setCommand] = useState(""),
    [suggestions, setSuggestions] = useState<typeof landmarks>([]);
  function assist() {
    const intent = suggestedAction(command);
    setSuggestions([]);
    if (intent === "place-tree" || intent === "place-bench") {
      if (!owner || !current) {
        note("Pemilik ruang yang terhubung dapat menempatkan objek.");
        return;
      }
      candidate(intent === "place-tree" ? "tree" : "bench");
      document
        .querySelector<HTMLDetailsElement>(".management")
        ?.setAttribute("open", "");
      note("Tinjau posisi dan setujui perubahan pada panel pengelolaan.");
    } else if (intent === "document") {
      document
        .querySelector<HTMLDetailsElement>(".project-record")
        ?.setAttribute("open", "");
      note("Pilih jenis dokumen W3 dan isi berdasarkan bukti yang tersedia.");
    } else if (intent === "navigation") {
      const words = command
        .toLowerCase()
        .replace(/perpustakaan|pustaka/g, "library")
        .replace(/peluang/g, "opportunity")
        .split(/\s+/)
        .filter((v) => v.length > 3);
      const hits = landmarks.filter((l) =>
        words.some((w) => (l.name + " " + l.url).toLowerCase().includes(w)),
      );
      setSuggestions(hits.slice(0, 4));
      note(
        hits.length
          ? "Landmark terkait di Central City."
          : "Landmark belum ditemukan. Coba “library” atau “opportunity”.",
      );
    } else
      note(
        "Coba “tanam pohon”, “buat bangku”, “cari perpustakaan”, atau “buat proposal proyek”.",
      );
  }
  const socket = useRef<WebSocket | null>(null),
    stick = useRef({ x: 0, z: 0 }),
    current = peers.find((p) => p.id === join?.id),
    online = status === "Terhubung",
    owner = world.role === "owner";
  useEffect(() => {
    let alive = true,
      ws: WebSocket | undefined,
      reconnect: ReturnType<typeof setTimeout> | undefined;
    async function start() {
      try {
        const j = await api<Welcome>(url + "/join", "POST", {});
        if (!alive) return;
        setJoin(j);
        const u =
          process.env.NEXT_PUBLIC_WORLD_WS ||
          (location.protocol === "https:" ? "wss://" : "ws://") +
            location.host +
            "/realm/live";
        ws = new WebSocket(u);
        socket.current = ws;
        ws.onopen = () =>
          ws!.send(JSON.stringify({ type: "join", ticket: j.ticket }));
        ws.onmessage = (e) => {
          if (!alive) return;
          const value = JSON.parse(e.data);
          if (value.type === "welcome") {
            setStatus("Terhubung");
            rev((n) => n + 1);
            return;
          }
          const state = value as Snapshot;
          if (state.type === "state") {
            setPeers(state.peers);
            setVersion(state.version);
          }
        };
        ws.onclose = (e) => {
          if (!alive) return;
          setPeers([]);
          setStatus(e.code === 4000 ? "Sesi aktif di tab lain" : "Terputus");
          if (e.code !== 4000)
            reconnect = setTimeout(() => connect((n) => n + 1), 2400);
        };
        ws.onerror = () => {
          if (alive) setStatus("Tidak dapat menghubungi server");
        };
      } catch (e) {
        if (alive) {
          setStatus("Terputus");
          note((e as Error).message);
        }
      }
    }
    void start();
    return () => {
      alive = false;
      clearTimeout(reconnect);
      ws?.close();
      socket.current = null;
    };
  }, [url, retry]);
  const [version, setVersion] = useState(0),
    cx = current ? Math.floor(current.x / 32) : null,
    cz = current ? Math.floor(current.z / 32) : null;
  useEffect(() => {
    if (!online || cx === null) return;
    let alive = true,
      t: ReturnType<typeof setTimeout> | undefined;
    const fetchMap = () =>
      api<MapData>(url + "/chunks")
        .then((v) => {
          if (alive) setMap(v);
        })
        .catch((e) => {
          if (alive) {
            note(e.message);
            t = setTimeout(fetchMap, 1800);
          }
        });
    void fetchMap();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [url, online, cx, cz, version, revision]);
  const send = (dx: number, dz: number, run: boolean) => {
    const ws = socket.current;
    if (ws?.readyState === WebSocket.OPEN)
      ws.send(JSON.stringify({ type: "input", dx, dz, run }));
  };
  async function action(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    note("");
    try {
      await fn();
    } catch (e) {
      note((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const candidate = (kind: "tree" | "bench", id?: string) => {
    if (!current) return;
    confirm({
      kind,
      id,
      x: Math.round((current.x + 3) * 2) / 2,
      z: Math.round((current.z + 2) * 2) / 2,
      version: map.version,
    });
  };
  const others = peers.filter((p) => p.id !== join?.id);
  const nearGuide = !!current && Math.hypot(current.x + 2, current.z + 2) <= 6;
  const nearest = map.chunks
    .flatMap((c) => c.entities)
    .filter(
      (e) =>
        ["school", "community", "market", "library", "farm"].includes(e.kind) &&
        current &&
        Math.hypot(e.x - current.x, e.z - current.z) < 9,
    )
    .at(0);
  return (
    <div className="shared-room">
      <div className="room-heading">
        <h2>{world.name}</h2>
        <button className="secondary" onClick={leave}>
          Kembali ke laboratorium
        </button>
      </div>
      <p role="status">
        {status} · {peers.length} pemain terhubung di sekitar ·{" "}
        {map.chunks.length} chunk dimuat
      </p>
      {!online && (
        <button className="secondary" onClick={() => connect((n) => n + 1)}>
          Sambungkan ulang
        </button>
      )}
      <div className="realm-scene">
        {join && (
          <ViewGuard>
            <Scene
              chunks={map.chunks}
              objects={map.objects}
              peers={peers}
              self={join.id}
              seed={join.seed}
              spec={join.spec}
              send={send}
              paused={!online || !!pending}
              stick={stick}
            />
          </ViewGuard>
        )}
        <div className="realm-coords">
          X {current?.x.toFixed(1) ?? "—"} · Z {current?.z.toFixed(1) ?? "—"}
        </div>
        <div
          className="stick"
          aria-label="Joystick dunia"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const r = e.currentTarget.getBoundingClientRect();
            stick.current = {
              x: ((e.clientX - r.left) / r.width) * 2 - 1,
              z: ((e.clientY - r.top) / r.height) * 2 - 1,
            };
          }}
          onPointerMove={(e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            const r = e.currentTarget.getBoundingClientRect();
            stick.current = {
              x: Math.max(
                -1,
                Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1),
              ),
              z: Math.max(
                -1,
                Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1),
              ),
            };
          }}
          onLostPointerCapture={() => {
            stick.current = { x: 0, z: 0 };
          }}
        >
          ✥
        </div>
      </div>
      <p>
        WASD atau panah untuk berjalan, Shift untuk berlari, seret untuk melihat
        sekitar. Pemandu berpakaian oker adalah NPC simulasi.
      </p>
      {nearGuide && (
        <button
          className="secondary"
          onClick={() =>
            action(async () => {
              const v = await api<{
                meetings: number;
                message: string;
                activity: string;
              }>(url + "/guide", "POST", {});
              speak(
                v.activity + " · Pertemuan " + v.meetings + ". " + v.message,
              );
            })
          }
        >
          Bicara dengan pemandu NPC
        </button>
      )}
      {guide && (
        <p>
          {guide}{" "}
          <Link prefetch={false} href="/the-world/listen">
            Baca praktik Listen ↗
          </Link>
        </p>
      )}
      {nearest && (
        <p>
          Fasilitas simulasi · {nearest.kind}.{" "}
          <a
            href={
              nearest.kind === "library"
                ? "/the-word/encounter"
                : nearest.kind === "farm"
                  ? "/the-work/experiment"
                  : "/the-world/explore"
            }
          >
            Buka materi W3 ↗
          </a>
        </p>
      )}
      {owner && (
        <details className="management">
          <summary>Kelola ruang bersama</summary>
          <button
            className="secondary"
            disabled={!online}
            onClick={() => candidate("tree")}
          >
            Tempatkan pohon
          </button>
          <button
            className="secondary"
            disabled={!online}
            onClick={() => candidate("bench")}
          >
            Tempatkan bangku
          </button>
          {map.objects.map((o) => (
            <button
              className="secondary"
              key={o.id}
              onClick={() => candidate(o.kind as "tree" | "bench", o.id)}
            >
              Pindah {o.kind} · {o.id.slice(0, 5)}
            </button>
          ))}
          {pending && (
            <section
              className="world-preview"
              aria-label="Persetujuan perubahan"
            >
              <p>
                {pending.id ? "Pindahkan" : "Tambahkan"} {pending.kind} ke (
                {pending.x}, {pending.z})? Semua anggota ruang dapat melihat
                perubahan ini.
              </p>
              <button
                className="button dark"
                disabled={busy}
                onClick={() =>
                  action(async () => {
                    await api(url + "/objects", "POST", {
                      ...pending,
                      confirm: true,
                    });
                    confirm(null);
                    rev((n) => n + 1);
                    note("Perubahan disimpan.");
                  })
                }
              >
                Setujui perubahan
              </button>
              <button className="secondary" onClick={() => confirm(null)}>
                Batal
              </button>
            </section>
          )}
          <button
            className="secondary"
            onClick={() =>
              action(async () => {
                const v = await api<{ invite: string }>(
                  url + "/invite",
                  "POST",
                  {},
                );
                share(v.invite);
              })
            }
          >
            Buat undangan satu kali
          </button>
          {invite && (
            <label>
              Kode undangan · berlaku 30 menit
              <input
                readOnly
                value={invite}
                onFocus={(e) => e.target.select()}
              />
            </label>
          )}
        </details>
      )}
      {others.length > 0 && (
        <details>
          <summary>Pemain sekitar</summary>
          {others.map((p) => (
            <div key={p.id}>
              Tamu {p.id.slice(0, 6)}{" "}
              {(["block", "report"] as const).map((a) => (
                <button
                  className="secondary"
                  key={a}
                  onClick={() =>
                    action(async () => {
                      await api(url + "/moderate", "POST", {
                        action: a,
                        target: p.id,
                        reason: "Permintaan pengguna dari menu pemain sekitar",
                      });
                      note(
                        a === "block" ? "Pemain diblokir." : "Laporan dicatat.",
                      );
                    })
                  }
                >
                  {a === "block" ? "Blokir" : "Laporkan"}
                </button>
              ))}
            </div>
          ))}
        </details>
      )}
      <details>
        <summary>Asisten dunia · aturan lokal</summary>
        <label>
          Perintah singkat
          <input
            value={command}
            maxLength={180}
            onChange={(e) => setCommand(e.target.value)}
          />
        </label>
        <button className="secondary" onClick={assist}>
          Tinjau perintah
        </button>
        {suggestions.map((l) => (
          <p key={l.id}>
            <Link href={"/explore?landmark=" + l.id}>{l.name} ↗</Link>
          </p>
        ))}
      </details>
      <details>
        <summary>Simulasi NPC</summary>
        <p>
          Pemandu mengikuti jadwal tiga aktivitas. Satu giliran berlangsung dua
          menit. Hasil ini adalah catatan simulasi.
        </p>
        <button
          className="secondary"
          onClick={() =>
            action(async () => {
              const v = await api<{
                role: string;
                last_activity: string;
                completed_rounds: string;
              }>(url + "/simulation");
              note(
                v.role +
                  " · " +
                  v.last_activity +
                  " · " +
                  v.completed_rounds +
                  " giliran tercatat.",
              );
            })
          }
        >
          Periksa jadwal NPC
        </button>
      </details>
      <ProjectRecord world={world.id} />
      {message && <p role="status">{message}</p>}
    </div>
  );
}
