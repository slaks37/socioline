"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

export type Reading = { url: string; title: string };

export function ReadingLink({
  page,
  open,
  children,
}: {
  page: Reading;
  open: (page: Reading) => void;
  children: ReactNode;
}) {
  function read(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
      return;
    e.preventDefault();
    open(page);
  }
  return (
    <a className="button dark" href={page.url} onClick={read}>
      {children} <ArrowUpRight size={16} />
    </a>
  );
}

// The iframe uses the canonical page, including worksheet fields and draft storage.
export default function CityReader({
  page,
  resume,
}: {
  page: Reading;
  resume: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <p role="status">Membuka materi…</p>}
      <iframe
        className="city-reader-frame"
        style={{ visibility: loaded ? "visible" : "hidden" }}
        title={page.title}
        src={page.url}
        onLoad={(event) => {
          const frame = event.currentTarget;
          const doc = frame.contentDocument;
          if (!doc) return;
          doc.documentElement.dataset.cityReader = "";
          doc.addEventListener("keydown", (e) => {
            if (
              e.key === "Escape" &&
              !e.defaultPrevented &&
              !doc.querySelector("dialog[open]")
            ) {
              e.preventDefault();
              resume();
            }
          });
          doc.addEventListener(
            "click",
            (e) => {
              const link = (e.target as HTMLElement)?.closest?.("a[href]");
              if (!link || link.hasAttribute("download") || e.defaultPrevented)
                return;
              const url = new URL(link.getAttribute("href")!, doc.baseURI);
              if (
                url.origin === location.origin &&
                url.pathname === "/explore"
              ) {
                e.preventDefault();
                resume();
              } else if (url.origin !== location.origin) {
                link.setAttribute("target", "_blank");
                link.setAttribute("rel", "noopener noreferrer");
              }
            },
            true,
          );
          setLoaded(true);
        }}
      />
    </>
  );
}
