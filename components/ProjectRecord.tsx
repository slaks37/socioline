"use client";
import { useEffect, useState } from "react";
import { documentFields } from "../engine/world.ts";
import { realmApi as api } from "../lib/world-api";
type Kind = keyof typeof documentFields;
type Doc = {
  id: string;
  kind: Kind;
  fields: Record<string, string>;
  version: number;
};
export default function ProjectRecord({ world }: { world: string }) {
  const [docs, setDocs] = useState<Doc[]>([]),
    [d, set] = useState<Doc>({
      id: "",
      kind: "Calling Map",
      fields: {},
      version: 0,
    }),
    [msg, notice] = useState(""),
    [busy, wait] = useState(false);
  const url = "/worlds/" + world + "/docs";
  useEffect(() => {
    api<Doc[]>(url)
      .then(setDocs)
      .catch((e) => notice(e.message));
  }, [url]);
  return (
    <details className="project-record">
      <summary>Dokumen kerja W3</summary>
      <p>
        Catatan pribadi milik sesi tamu ini. Pisahkan pengamatan simulasi dari
        bukti lapangan.
      </p>
      <label>
        Dokumen tersimpan
        <select
          value={d.id}
          onChange={(e) => {
            const stored = docs.find((v) => v.id === e.target.value);
            set(
              stored ?? { id: "", kind: "Calling Map", version: 0, fields: {} },
            );
          }}
        >
          <option value="">Dokumen baru</option>
          {docs.map((v) => (
            <option key={v.id} value={v.id}>
              {v.kind} · {v.id.slice(0, 6)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Jenis dokumen
        <select
          disabled={!!d.id}
          value={d.kind}
          onChange={(e) =>
            set({ ...d, kind: e.target.value as Kind, fields: {} })
          }
        >
          {Object.keys(documentFields).map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      {documentFields[d.kind].map((k) => (
        <label key={k}>
          {k}
          <textarea
            value={d.fields[k] ?? ""}
            maxLength={1600}
            rows={2}
            onChange={(e) =>
              set({ ...d, fields: { ...d.fields, [k]: e.target.value } })
            }
          />
        </label>
      ))}
      <button
        className="secondary"
        disabled={busy}
        onClick={async () => {
          wait(true);
          try {
            const saved = await api<{ id: string; version: number }>(
              url,
              "POST",
              { ...d, id: d.id || undefined },
            );
            set({ ...d, ...saved });
            setDocs(await api<Doc[]>(url));
            notice("Dokumen tersimpan.");
          } catch (e) {
            notice((e as Error).message);
          } finally {
            wait(false);
          }
        }}
      >
        Simpan dokumen
      </button>
      <button
        className="secondary"
        onClick={() => {
          const file = new Blob(
            [
              "# " +
                d.kind +
                "\n\n" +
                Object.entries(d.fields)
                  .map(([k, v]) => "## " + k + "\n\n" + v)
                  .join("\n\n"),
            ],
            { type: "text/markdown;charset=utf-8" },
          );
          const u = URL.createObjectURL(file),
            a = document.createElement("a");
          a.href = u;
          a.download = d.kind + ".md";
          a.click();
          setTimeout(() => URL.revokeObjectURL(u), 1000);
        }}
      >
        Ekspor Markdown
      </button>
      <p role="status">{msg}</p>
    </details>
  );
}
