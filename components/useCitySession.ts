"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { type AvatarData } from "./avatar-data";
import { type Life, type Activity } from "../engine/city-life";
import type { Pose } from "./GameScene";
export type Neighbor = { id: string; avatar: AvatarData; pose: Pose };
async function request(payload: object, signal?: AbortSignal) {
  const response = await fetch("/api/city", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal,
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "Koneksi kota terputus.");
  return data;
}
export function useCitySession(pose: RefObject<Pose>) {
  const [online, setOnline] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  const [peers, setPeers] = useState<Neighbor[]>([]),
    [deliveries, setDeliveries] = useState(0);
  const actionLock = useRef(false);
  async function join(
    avatar: AvatarData,
  ): Promise<{ life: Life; pose: Pose | null } | undefined> {
    if (busy) return;
    setBusy(true);
    try {
      const data = await request({ op: "join", avatar });
      setOnline(true);
      setStatus("");
      return data;
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const leave = useCallback(() => {
    setOnline(false);
    setPeers([]);
    void request({ op: "leave" }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    const ctrl = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const data = await request(
          { op: "pulse", pose: pose.current },
          ctrl.signal,
        );
        if (cancelled) return;
        setPeers(data.peers);
        setDeliveries(data.deliveries);
        setStatus("");
      } catch {
        if (!cancelled) {
          setPeers([]);
          setStatus("Menyambungkan kembali…");
        }
      }
      if (!cancelled) timer = setTimeout(poll, document.hidden ? 4700 : 1250);
    };
    timer = setTimeout(poll, 600);
    const exit = () => {
      void fetch("/api/city", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "leave" }),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener("pagehide", exit);
    return () => {
      cancelled = true;
      ctrl.abort();
      clearTimeout(timer);
      window.removeEventListener("pagehide", exit);
    };
  }, [online, pose]);
  async function perform(action: Activity) {
    if (actionLock.current) return;
    actionLock.current = true;
    const payload = {
      op: "act",
      action,
      request: crypto.randomUUID(),
      pose: { ...pose.current },
    };
    try {
      return (await request(payload)) as { state: Life; message: string };
    } catch {
      try {
        return (await request(payload)) as { state: Life; message: string };
      } catch {
        setStatus("Aktivitas belum terkonfirmasi. Sambungkan kembali.");
      }
    } finally {
      actionLock.current = false;
    }
  }
  return { online, busy, status, peers, deliveries, join, leave, perform };
}
