"use client";
import { useEffect } from "react";
export default function Ambience({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const ctx = new AudioContext(),
      buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate),
      a = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < a.length; i++) {
      last = (last + 0.035 * (Math.random() * 2 - 1)) / 1.025;
      a[i] = last * 0.48;
    }
    const noise = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 650;
    noise.buffer = buf;
    noise.loop = true;
    noise.connect(filter).connect(ctx.destination);
    noise.start();
    void ctx.resume();
    const bird = () => {
      const t = ctx.currentTime,
        o = ctx.createOscillator(),
        v = ctx.createGain();
      o.frequency.setValueAtTime(1700, t);
      o.frequency.exponentialRampToValueAtTime(2600, t + 0.14);
      v.gain.setValueAtTime(0.001, t);
      v.gain.linearRampToValueAtTime(0.014, t + 0.04);
      v.gain.exponentialRampToValueAtTime(0.0001, t + 0.21);
      o.connect(v).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.22);
      o.onended = () => {
        o.disconnect();
        v.disconnect();
      };
    };
    const id = setInterval(bird, 8300);
    return () => {
      clearInterval(id);
      noise.stop();
      void ctx.close();
    };
  }, [enabled]);
  return null;
}
