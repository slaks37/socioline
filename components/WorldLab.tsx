"use client";
import { useState, useRef, useEffect } from "react";
import { validAvatar } from "../engine/avatar.ts";
import dynamic from "next/dynamic";
import { generateChunk, type Specification } from "../engine/world.ts";
import { realmApi as api } from "../lib/world-api";
const Room = dynamic(() => import("./SharedRoom"), { ssr: false });
type World = { id: string; name: string; role: string; spec: Specification };
type Job = {
  id: string;
  status: string;
  error?: string;
  spec?: Specification;
  provider?: string;
  seed?: number;
};
function Plan({ seed, spec }: { seed: number; spec: Specification }) {
  const chunks = Array.from({ length: 9 }, (_, i) =>
    generateChunk(seed, spec, (i % 3) - 1, Math.floor(i / 3) - 1),
  );
  return (
    <svg
      viewBox="-32 -32 96 96"
      role="img"
      aria-label={"Pratinjau sembilan chunk dengan " + spec.features.join(", ")}
      style={{ width: "100%", height: 190, background: "#d0d9b9" }}
    >
      {chunks.map((c) => (
        <g key={c.id}>
          <path
            d={`M${c.cx * 32} ${c.cz * 32 + 32}v-32h32`}
            stroke="#eee4ca"
            strokeWidth="3"
            fill="none"
          />
          {c.entities.map((e) =>
            e.kind === "tree" ? (
              <circle key={e.id} cx={e.x} cy={e.z} r={e.size} fill="#668b68" />
            ) : (
              <rect
                key={e.id}
                x={e.x - e.size}
                y={e.z - e.size * 0.7}
                width={e.size * 2}
                height={e.kind === "river" ? 12 : e.size * 1.4}
                rx="1"
                fill={
                  ["river", "lake"].includes(e.kind) ? "#57969b" : "#9c795b"
                }
              />
            ),
          )}
        </g>
      ))}
    </svg>
  );
}
export default function WorldLab() {
  const [ready, setReady] = useState(false),
    [worlds, list] = useState<World[]>([]),
    [selected, select] = useState<World | null>(null),
    [prompt, setPrompt] = useState(
      "Desa tropis dengan sekolah, pasar, sungai, dan kebun komunitas.",
    ),
    [mode, choose] = useState("local"),
    [modelConfigured, setModelConfigured] = useState(false),
    [file, image] = useState<File | null>(null),
    [job, preview] = useState<Job | null>(null),
    [busy, setBusy] = useState(false),
    [message, notify] = useState(""),
    [invite, setInvite] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    setInvite(new URLSearchParams(location.hash.slice(1)).get("invite") || "");
    return () => {
      mounted.current = false;
    };
  }, []);
  async function action(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    notify("");
    try {
      await fn();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  const refresh = async () => {
    const w = await api<World[]>("/worlds");
    list(w);
    return w;
  };
  async function generate() {
    let data: string | undefined;
    if (file) {
      if (
        file.size > 600000 ||
        !["image/png", "image/jpeg", "image/webp"].includes(file.type)
      )
        throw Error("Pilih PNG, JPEG atau WebP hingga 600 KB.");
      data = await new Promise<string>((resolve, reject) => {
        const f = new FileReader();
        f.onload = () => resolve(String(f.result));
        f.onerror = () => reject(Error("Gambar gagal dibaca."));
        f.readAsDataURL(file);
      });
    }
    const j = await api<Job>("/jobs", "POST", { prompt, mode, image: data });
    preview(j);
  }
  useEffect(() => {
    if (!job || !["queued", "running"].includes(job.status)) return;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const j = await api<Job>("/jobs/" + job.id);
        if (alive) preview(j);
      } catch (e) {
        if (alive) {
          notify((e as Error).message);
          preview(null);
        }
      }
    }, 450);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [job]);
  if (selected)
    return (
      <Room
        world={selected}
        leave={() => {
          select(null);
          void refresh().catch((e) => notify(e.message));
        }}
      />
    );
  return (
    <div className="world-lab">
      {message && <p role="alert">{message}</p>}
      {!ready ? (
        <section>
          <p>
            Buka sesi tamu untuk menyimpan dunia privat di server. Browser ini
            akan mengingat sesi melalui cookie.
          </p>
          <button
            className="button dark"
            disabled={busy}
            onClick={() =>
              action(async () => {
                await api("/session", "POST", {});
                await refresh();
                setModelConfigured(
                  (await api<{ modelConfigured: boolean }>("/health"))
                    .modelConfigured,
                );
                preview(await api<Job | null>("/jobs/active"));
                setReady(true);
              })
            }
          >
            Mulai sesi tamu
          </button>
        </section>
      ) : (
        <>
          <section>
            <h2>Rancang lingkungan</h2>
            <label>
              Deskripsi dunia
              <textarea
                rows={3}
                value={prompt}
                maxLength={1200}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </label>
            <label>
              Generator
              <select
                value={mode}
                onChange={(e) => {
                  choose(e.target.value);
                  image(null);
                }}
              >
                <option value="local">Prosedural lokal · aturan teks</option>
                <option value="model" disabled={!modelConfigured}>
                  {modelConfigured
                    ? "Model AI · teks atau gambar"
                    : "Model AI · jalankan layanan model"}
                </option>
              </select>
            </label>
            {mode === "model" && (
              <label>
                Referensi visual opsional. Saat membuat pratinjau, teks dan
                gambar dikirim ke penyedia model yang dikonfigurasi.
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => image(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
            <button
              className="button dark"
              disabled={busy || !!job}
              onClick={() => action(generate)}
            >
              Buat pratinjau
            </button>
            {job && (
              <div className="world-preview" role="status">
                {job.status === "failed" ? (
                  <p>{job.error}</p>
                ) : job.status !== "preview" ? (
                  <p>
                    {job.status === "queued"
                      ? "Menunggu worker…"
                      : "Menyusun spesifikasi…"}
                  </p>
                ) : (
                  <>
                    <h3>{job.spec?.name}</h3>
                    {job.spec && job.seed !== undefined && (
                      <Plan seed={job.seed} spec={job.spec} />
                    )}
                    <p>
                      {job.provider} · {job.spec?.biome} · {job.spec?.terrain}
                    </p>
                    <p>{job.spec?.features.join(" · ")}</p>
                    <button
                      className="button dark"
                      disabled={busy}
                      onClick={() =>
                        action(async () => {
                          const w = await api<{ id: string }>(
                            "/jobs/" + job.id + "/save",
                            "POST",
                            {},
                          );
                          preview(null);
                          const all = await refresh();
                          select(all.find((v) => v.id === w.id) ?? null);
                        })
                      }
                    >
                      Simpan dan masuki dunia
                    </button>
                  </>
                )}
                {["preview", "failed"].includes(job.status) && (
                  <button
                    className="secondary"
                    onClick={() =>
                      action(async () => {
                        await api("/jobs/" + job.id, "DELETE");
                        preview(null);
                      })
                    }
                  >
                    Tutup pratinjau
                  </button>
                )}
              </div>
            )}
          </section>
          <section>
            <h2>Dunia saya</h2>
            <button
              className="secondary"
              onClick={() =>
                action(async () => {
                  const v = JSON.parse(
                    localStorage.getItem("socioline.avatar.v1") ?? "null",
                  );
                  if (!validAvatar(v))
                    throw Error(
                      "Pilih dan simpan avatar lebih dahulu di Avatar Studio Central City.",
                    );
                  await api("/avatar", "PUT", v);
                  notify("Tampilan avatar tersimpan untuk ruang bersama.");
                })
              }
            >
              Gunakan avatar tersimpan dari Central City
            </button>
            {worlds.length ? (
              <div className="related">
                {worlds.map((w) => (
                  <button key={w.id} onClick={() => select(w)}>
                    {w.name} · {w.role === "owner" ? "Pemilik" : "Tamu"}
                  </button>
                ))}
              </div>
            ) : (
              <p>Dunia yang disimpan akan muncul di sini.</p>
            )}
            <label>
              Kode undangan
              <input
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                maxLength={80}
              />
            </label>
            <button
              className="secondary"
              disabled={busy || !invite}
              onClick={() =>
                action(async () => {
                  const w = await api<{ id: string }>("/redeem", "POST", {
                    invite,
                  });
                  setInvite("");
                  history.replaceState(null, "", location.pathname);
                  const all = await refresh();
                  select(all.find((v) => v.id === w.id) ?? null);
                })
              }
            >
              Gunakan undangan
            </button>
          </section>
        </>
      )}
    </div>
  );
}
