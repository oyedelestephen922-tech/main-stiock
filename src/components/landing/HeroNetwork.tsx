"use client";

import { useEffect, useRef } from "react";
import type { Quote } from "@/services/market";

/**
 * The hero visual: a live "financial network".
 * - a faint grid and a band of candlesticks at the base
 * - market lines that flow slowly from right to left
 * - asset nodes joined by links, with light travelling along the links
 * - pointer proximity lights up a node and its connections
 *
 * Canvas keeps it cheap; it pauses off-screen and when the tab is hidden,
 * and draws a single still frame under prefers-reduced-motion.
 */

const NODES: { t: string; x: number; y: number }[] = [
  { t: "NVDA", x: 0.62, y: 0.2 },
  { t: "AAPL", x: 0.8, y: 0.32 },
  { t: "MSFT", x: 0.52, y: 0.45 },
  { t: "TSLA", x: 0.9, y: 0.56 },
  { t: "AMZN", x: 0.7, y: 0.58 },
  { t: "META", x: 0.58, y: 0.74 },
  { t: "GOOGL", x: 0.84, y: 0.8 },
  { t: "AMD", x: 0.42, y: 0.66 },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 4], [2, 4], [1, 3], [3, 4], [4, 5], [2, 7], [5, 7], [4, 6], [3, 6], [5, 6], [0, 4],
];

type Palette = Record<"line" | "lineStrong" | "ink" | "ink2" | "ink3" | "electric" | "bright" | "soft" | "brand" | "down" | "surface", string>;

function readPalette(): Palette {
  const s = getComputedStyle(document.documentElement);
  const v = (n: string) => s.getPropertyValue(n).trim();
  return {
    line: v("--line"),
    lineStrong: v("--line-strong"),
    ink: v("--ink"),
    ink2: v("--ink-2"),
    ink3: v("--ink-3"),
    electric: v("--electric"),
    bright: v("--bright"),
    soft: v("--soft"),
    brand: v("--brand"),
    down: v("--down"),
    surface: v("--surface"),
  };
}

function noise(seed: number, x: number) {
  return (
    Math.sin(x * 1.7 + seed) * 0.5 +
    Math.sin(x * 3.1 + seed * 2.3) * 0.28 +
    Math.sin(x * 7.3 + seed * 0.7) * 0.14 +
    Math.sin(x * 15.1 + seed * 4.1) * 0.06
  );
}

export function HeroNetwork({ quotes }: { quotes: Quote[] | undefined }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const quotesRef = useRef<Map<string, Quote>>(new Map());
  const pointer = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    quotesRef.current = new Map((quotes ?? []).map((q) => [q.ticker, q]));
  }, [quotes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let palette = readPalette();
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let start = performance.now();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced.matches) draw(0);
    };

    const nodePos = (i: number, t: number) => {
      const n = NODES[i];
      const narrow = w < 768;
      const bx = narrow ? 0.12 + n.x * 0.82 : n.x;
      const by = narrow ? 0.18 + n.y * 0.7 : n.y;
      const drift = reduced.matches ? 0 : 1;
      return {
        x: bx * w + Math.sin(t * 0.00035 + i * 1.9) * 6 * drift,
        y: by * h + Math.cos(t * 0.0003 + i * 2.7) * 5 * drift,
      };
    };

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h);
      const c = ctx!;
      const p = palette;

      // ── candlestick band
      const candleW = 7;
      const gap = 6;
      const count = Math.ceil(w / (candleW + gap)) + 2;
      const shift = reduced.matches ? 0 : ((t * 0.006) % (candleW + gap));
      const baseY = h * 0.9;
      c.globalAlpha = 0.22;
      for (let i = 0; i < count; i++) {
        const idx = i + Math.floor((t * 0.006) / (candleW + gap));
        const x = i * (candleW + gap) - shift;
        const o = noise(1.3, idx * 0.11) * 26;
        const cl = noise(1.3, (idx + 1) * 0.11) * 26;
        const hi = Math.min(o, cl) - 6 - Math.abs(noise(4.2, idx * 0.7)) * 10;
        const lo = Math.max(o, cl) + 6 + Math.abs(noise(2.2, idx * 0.9)) * 10;
        const up = cl < o;
        c.strokeStyle = up ? p.electric : p.ink3;
        c.fillStyle = up ? p.electric : p.ink3;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x + candleW / 2, baseY + hi);
        c.lineTo(x + candleW / 2, baseY + lo);
        c.stroke();
        c.fillRect(x, baseY + Math.min(o, cl), candleW, Math.max(1.5, Math.abs(cl - o)));
      }
      c.globalAlpha = 1;

      // ── flowing market lines
      const lines = [
        { seed: 0.4, y: 0.34, amp: 0.1, color: p.brand, alpha: 0.5, width: 1.2 },
        { seed: 2.1, y: 0.52, amp: 0.14, color: p.electric, alpha: 0.75, width: 1.6 },
        { seed: 5.7, y: 0.68, amp: 0.08, color: p.soft, alpha: 0.35, width: 1 },
      ];
      for (const L of lines) {
        const phase = reduced.matches ? 0 : t * 0.00008;
        c.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const k = x / w;
          const rise = (k - 0.5) * -0.12; // gentle upward drift to the right
          const y = (L.y + rise + noise(L.seed, k * 2.4 + phase) * L.amp) * h;
          if (x === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        const grad = c.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.25, L.color);
        grad.addColorStop(1, L.color);
        c.strokeStyle = grad;
        c.globalAlpha = L.alpha;
        c.lineWidth = L.width;
        c.stroke();
        c.globalAlpha = 1;
      }

      // ── network
      const pos = NODES.map((_, i) => nodePos(i, t));
      let hot = -1;
      if (pointer.current) {
        let best = 90 * 90;
        pos.forEach((q, i) => {
          const d = (q.x - pointer.current!.x) ** 2 + (q.y - pointer.current!.y) ** 2;
          if (d < best) {
            best = d;
            hot = i;
          }
        });
      }

      EDGES.forEach(([a, b], k) => {
        const lit = hot === a || hot === b;
        c.strokeStyle = lit ? p.electric : p.lineStrong;
        c.globalAlpha = lit ? 0.9 : 0.55;
        c.lineWidth = lit ? 1.4 : 1;
        c.beginPath();
        c.moveTo(pos[a].x, pos[a].y);
        c.lineTo(pos[b].x, pos[b].y);
        c.stroke();

        // light travelling along the link
        if (!reduced.matches) {
          const speed = 0.00012 + (k % 4) * 0.00003;
          const f = (t * speed + k * 0.37) % 1;
          const x = pos[a].x + (pos[b].x - pos[a].x) * f;
          const y = pos[a].y + (pos[b].y - pos[a].y) * f;
          c.globalAlpha = Math.sin(f * Math.PI) * (lit ? 1 : 0.8);
          c.fillStyle = p.bright;
          c.beginPath();
          c.arc(x, y, lit ? 2.4 : 1.8, 0, Math.PI * 2);
          c.fill();
        }
      });
      c.globalAlpha = 1;

      const showLabels = w >= 520;
      pos.forEach((q, i) => {
        const node = NODES[i];
        const quote = quotesRef.current.get(node.t);
        const isHot = i === hot;
        const pulse = reduced.matches ? 0 : (Math.sin(t * 0.002 + i) + 1) / 2;

        c.fillStyle = p.electric;
        c.globalAlpha = 0.12 + pulse * 0.1 + (isHot ? 0.2 : 0);
        c.beginPath();
        c.arc(q.x, q.y, isHot ? 16 : 10 + pulse * 3, 0, Math.PI * 2);
        c.fill();

        c.globalAlpha = 1;
        c.fillStyle = p.surface;
        c.strokeStyle = isHot ? p.soft : p.electric;
        c.lineWidth = 1.6;
        c.beginPath();
        c.arc(q.x, q.y, isHot ? 6 : 4.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = isHot ? p.soft : p.bright;
        c.beginPath();
        c.arc(q.x, q.y, 2, 0, Math.PI * 2);
        c.fill();

        if (showLabels || isHot) {
          c.font = `650 12px "Archivo Variable", system-ui, sans-serif`;
          c.fillStyle = isHot ? p.ink : p.ink2;
          c.textBaseline = "middle";
          c.fillText(node.t, q.x + 12, q.y - 7);
          if (quote) {
            const ch = quote.changePercent;
            c.font = `500 11px "Archivo Variable", system-ui, sans-serif`;
            c.fillStyle = ch >= 0 ? p.bright : p.down;
            const label = isHot
              ? `$${quote.price.toFixed(2)}  ${ch >= 0 ? "+" : "−"}${Math.abs(ch).toFixed(2)}%`
              : `${ch >= 0 ? "+" : "−"}${Math.abs(ch).toFixed(2)}%`;
            c.fillText(label, q.x + 12, q.y + 8);
          }
        }
      });
    }

    const loop = (now: number) => {
      draw(now - start);
      raf = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      cancelAnimationFrame(raf);
      if (reduced.matches || !visible || document.hidden) {
        draw(0);
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      startLoop();
    });
    io.observe(canvas);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mo = new MutationObserver(() => {
      palette = readPalette();
      if (reduced.matches) draw(0);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const onVis = () => startLoop();
    document.addEventListener("visibilitychange", onVis);
    const onMotion = () => {
      start = performance.now();
      startLoop();
    };
    reduced.addEventListener("change", onMotion);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (reduced.matches) draw(0);
    };
    const onLeave = () => {
      pointer.current = null;
      if (reduced.matches) draw(0);
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    resize();
    startLoop();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      reduced.removeEventListener("change", onMotion);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label="Animated network of market assets with flowing price lines"
    />
  );
}
