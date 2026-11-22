"use client";
import { useEffect, useRef, useState } from "react";
import type { Life } from "../engine/city-life";
type Options = {
  expectedInputs: { type: "text"; languages: string[] }[];
  expectedOutputs: { type: "text"; languages: string[] }[];
};
type Session = {
  prompt: (text: string, options: { signal: AbortSignal }) => Promise<string>;
  destroy: () => void;
};
type Model = {
  availability: (o: Options) => Promise<string>;
  create: (o: Options) => Promise<Session>;
};
function model(): Model | undefined {
  return (window as Window & { LanguageModel?: Model }).LanguageModel;
}
function options(lang: string): Options {
  return {
    expectedInputs: [
      { type: "text", languages: lang === "en" ? ["en"] : ["en", lang] },
    ],
    expectedOutputs: [{ type: "text", languages: [lang] }],
  };
}
export default function MentorChat({
  role,
  life,
}: {
  role: string;
  life: Life;
}) {
  const [lang, setLang] = useState(""),
    [question, ask] = useState(""),
    [reply, setReply] = useState(""),
    [busy, setBusy] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    let live = true;
    const api = model();
    if (api)
      void (async () => {
        for (const l of ["id", "en"]) {
          try {
            if ((await api.availability(options(l))) === "available") {
              if (live) setLang(l);
              break;
            }
          } catch {}
        }
      })();
    return () => {
      live = false;
      pending.current?.abort();
    };
  }, []);
  if (!lang) return null;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const api = model();
        if (!api || !question.trim() || pending.current) return;
        const request = new AbortController();
        pending.current = request;
        setBusy(true);
        setReply("");
        let session: Session | undefined;
        try {
          session = await api.create(options(lang));
          if (request.signal.aborted) return;
          const response = await session.prompt(
            `You are the ${role} learning mentor in SocioLine. Answer briefly in ${lang === "en" ? "English" : "Indonesian"}. Give one practical exercise. The game uses fictional coins. A material costs 2 coins, one product retails for 5, and a wholesale order of 3 earns 18. Seeds cost 1 coin and yield 3 materials in 30 seconds. Inventory: ${life.coins} coins, ${life.supplies} materials and ${life.stock} products. You can give advice only. Player question: ${question}`,
            { signal: request.signal },
          );
          if (!request.signal.aborted) setReply(response);
        } catch {
          if (!request.signal.aborted)
            setReply(
              "Model di perangkat sedang tidak tersedia. Panduan mentor tetap bisa digunakan.",
            );
        } finally {
          session?.destroy();
          pending.current = null;
          if (!request.signal.aborted) setBusy(false);
        }
      }}
    >
      <label>
        {lang === "en"
          ? "Tanya AI perangkat dalam bahasa Inggris"
          : "Tanya AI perangkat"}
        <input
          value={question}
          onChange={(e) => ask(e.target.value)}
          maxLength={400}
        />
      </label>
      <button disabled={busy || !question.trim()}>
        {busy ? "Menyiapkan jawaban…" : "Tanya mentor"}
      </button>
      <p aria-live="polite">{reply}</p>
    </form>
  );
}
