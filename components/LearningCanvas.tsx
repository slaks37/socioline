"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { assessmentScale, type CanvasSection } from "../lib/learning-canvases";

type Props = { sheet: string; title: string; sections: CanvasSection[] };

export default function LearningCanvas({ sheet, title, sections }: Props) {
  const prefix = `socioline.w3.canvas.v1.${sheet}.`;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    function read() {
      const saved: Record<string, string> = {};
      try {
        for (const { fields } of sections) {
          for (const { key } of fields) {
            const value = localStorage.getItem(prefix + key);
            if (value !== null) saved[key] = value;
          }
        }
        setAnswers(saved);
      } catch {
        setStorageFailed(true);
      }
      setReady(true);
    }
    function sync(event: StorageEvent) {
      if (event.storageArea !== localStorage) return;
      if (event.key === null) read();
      else if (event.key.startsWith(prefix)) {
        const key = event.key.slice(prefix.length);
        setAnswers((previous) => ({
          ...previous,
          [key]: event.newValue ?? "",
        }));
      }
    }
    read();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [prefix, sections]);

  function update(key: string, value: string) {
    setAnswers((previous) => ({ ...previous, [key]: value }));
    setConfirmClear(false);
    try {
      if (value) localStorage.setItem(prefix + key, value);
      else localStorage.removeItem(prefix + key);
      setNotice("Perubahan tersimpan di browser ini.");
    } catch {
      setStorageFailed(true);
    }
  }

  function download() {
    const text = [
      title,
      ...sections.map(({ title, fields }) =>
        [
          title,
          ...fields.map(({ key, label }) => `${label}\n${answers[key] || "—"}`),
        ].join("\n\n"),
      ),
    ].join("\n\n──────────\n\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `SocioLine-W3-${sheet}.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function clear() {
    setAnswers({});
    try {
      for (const section of sections) {
        for (const field of section.fields)
          localStorage.removeItem(prefix + field.key);
      }
      setNotice("Isian lembar ini telah dihapus.");
    } catch {
      setNotice("Sebagian isian tidak dapat dihapus dari penyimpanan browser.");
    }
    setConfirmClear(false);
  }

  return (
    <div className="workbook-editor">
      <aside className="workbook-tools" aria-label="Penyimpanan lembar">
        <div>
          <strong>Isian pribadi</strong>
          <p>
            Jawaban tersimpan di browser dan perangkat ini. Unduh salinan untuk
            dibawa ke sesi belajar bersama mentor.
          </p>
          <noscript>
            <p>Aktifkan JavaScript untuk mengisi dan menyimpan jawaban.</p>
          </noscript>
          <div role="status" className="canvas-status">
            {storageFailed
              ? "Penyimpanan browser bermasalah. Unduh salinan sebelum meninggalkan lembar ini."
              : notice}
          </div>
        </div>
        <div className="workbook-tool-actions">
          <button
            type="button"
            className="button dark"
            onClick={download}
            disabled={!ready}
          >
            Unduh jawaban <Download size={15} />
          </button>
          {confirmClear ? (
            <div className="workbook-confirm">
              <span>Hapus isian lembar ini dari browser?</span>
              <button type="button" onClick={clear}>
                Ya, hapus
              </button>
              <button type="button" onClick={() => setConfirmClear(false)}>
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="workbook-erase"
              disabled={!Object.values(answers).some(Boolean)}
              onClick={() => setConfirmClear(true)}
            >
              Hapus isian lembar
            </button>
          )}
        </div>
        <label className="workbook-jump">
          <span>Ke bagian</span>
          <select
            defaultValue=""
            onChange={(event) => {
              const element = document.getElementById(event.target.value);
              element?.focus({ preventScroll: true });
              element?.scrollIntoView({ block: "start" });
              event.target.value = "";
            }}
          >
            <option value="">Pilih bagian lembar</option>
            {sections.map((section) => (
              <option key={section.id} value={`canvas-${section.id}`}>
                {section.title}
              </option>
            ))}
          </select>
        </label>
      </aside>
      <div className="workbook-fields">
        {sections.map((section) => (
          <div key={section.id}>
            {section.id === "skill-1" && (
              <div className="workbook-rubric">
                <h2>Penilaian kemampuan</h2>
                <p>
                  Nilai setiap kemampuan sebelum dan sesudah praktik. Tuliskan
                  pengamatan yang mendukung pilihanmu.
                </p>
                <ol>
                  {assessmentScale.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ol>
              </div>
            )}
            <fieldset
              className="workbook-section"
              id={`canvas-${section.id}`}
              tabIndex={-1}
              disabled={!ready}
            >
              <legend>{section.title}</legend>
              {section.description && <p>{section.description}</p>}
              <div className="workbook-input-grid">
                {section.fields.map(({ key, label, type }) => {
                  const value = answers[key] || "";
                  const labelId = `canvas-${sheet}-${key}-label`;
                  return (
                    <label
                      key={key}
                      className={type ? "workbook-short" : "workbook-long"}
                    >
                      <span id={labelId}>{label}</span>
                      {type === "score" || type === "evidence" ? (
                        <select
                          aria-labelledby={labelId}
                          value={value}
                          onChange={(event) => update(key, event.target.value)}
                        >
                          <option value="">Belum diisi</option>
                          {type === "score"
                            ? assessmentScale.map((label, i) => (
                                <option key={label} value={String(i + 1)}>
                                  {i + 1} · {label}
                                </option>
                              ))
                            : ["Ya", "Belum"].map((label) => (
                                <option key={label}>{label}</option>
                              ))}
                        </select>
                      ) : type ? (
                        <input
                          aria-labelledby={labelId}
                          type={type}
                          value={value}
                          onChange={(event) => update(key, event.target.value)}
                        />
                      ) : (
                        <textarea
                          aria-labelledby={labelId}
                          rows={3}
                          value={value}
                          onChange={(event) => update(key, event.target.value)}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>
        ))}
      </div>
    </div>
  );
}
