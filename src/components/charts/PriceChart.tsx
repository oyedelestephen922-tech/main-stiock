"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { HistoryPoint, Range } from "@/services/market";
import { formatPercent, formatUsd } from "@/lib/format";

interface Props {
  points: HistoryPoint[];
  range: Range;
  height?: number;
  label: string;
}

const PAD = { top: 16, right: 64, bottom: 28, left: 8 };

function formatTime(t: number, range: Range) {
  const d = new Date(t);
  if (range === "1D") return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (range === "1W" || range === "1M" || range === "3M")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + 1e-9; v += step) ticks.push(v);
  return ticks;
}

/**
 * Interactive price chart: pointer or arrow keys move a crosshair,
 * the readout above shows price and change from the start of the range.
 * Colours come from CSS variables so it follows the theme automatically.
 */
export function PriceChart({ points, range, height = 320, label }: Props) {
  const id = useId().replace(/:/g, "");
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    if (points.length < 2 || width === 0) return null;
    const vs = points.map((p) => p.v);
    const min = Math.min(...vs);
    const max = Math.max(...vs);
    const pad = (max - min) * 0.08 || 1;
    const lo = min - pad;
    const hi = max + pad;
    const w = width - PAD.left - PAD.right;
    const h = height - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (i / (points.length - 1)) * w;
    const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * h;
    const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
    const area = `${line} L${x(points.length - 1).toFixed(1)} ${PAD.top + h} L${PAD.left} ${PAD.top + h} Z`;
    const ticks = niceTicks(lo, hi);
    const xLabels = [0, Math.floor((points.length - 1) / 2), points.length - 1];
    return { x, y, line, area, ticks, xLabels, h, w };
  }, [points, width, height]);

  const first = points[0]?.v;
  const last = points[points.length - 1]?.v;
  const up = last != null && first != null ? last >= first : true;
  const color = up ? "var(--electric)" : "var(--down)";
  const active = hover != null ? points[hover] : points[points.length - 1];
  const activeChange = active && first ? ((active.v - first) / first) * 100 : null;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!geo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left - PAD.left) / geo.w;
    setHover(Math.max(0, Math.min(points.length - 1, Math.round(rel * (points.length - 1)))));
  };

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const cur = hover ?? points.length - 1;
    const step = e.shiftKey ? 10 : 1;
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? points.length - 1 : cur + (e.key === "ArrowLeft" ? -step : step);
    setHover(Math.max(0, Math.min(points.length - 1, next)));
  };

  return (
    <div>
      <div className="mb-2 flex min-h-6 flex-wrap items-baseline gap-x-3 text-sm" aria-live="polite">
        {active && (
          <>
            <span className="type-figure text-ink">{formatUsd(active.v)}</span>
            <span className={`type-figure ${activeChange != null && activeChange < 0 ? "text-down" : "text-up"}`}>
              {formatPercent(activeChange)}
            </span>
            <span className="text-ink-3">{formatTime(active.t, range)}</span>
          </>
        )}
      </div>
      <div ref={wrap} className="relative w-full" style={{ height }}>
        {geo && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`${label} price chart, ${range}. Use left and right arrow keys to inspect values.`}
            tabIndex={0}
            className="block touch-pan-y"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
            onKeyDown={onKey}
            onBlur={() => setHover(null)}
          >
            <defs>
              <linearGradient id={`pc-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={color} stopOpacity={up ? 0.28 : 0.18} />
                <stop offset="1" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {geo.ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + geo.w}
                  y1={geo.y(t)}
                  y2={geo.y(t)}
                  stroke="var(--line)"
                  strokeDasharray="2 4"
                />
                <text x={width - PAD.right + 10} y={geo.y(t) + 4} fill="var(--ink-3)" fontSize="11" className="tabular">
                  {t >= 1000 ? t.toLocaleString("en-US", { maximumFractionDigits: 0 }) : t.toFixed(t < 10 ? 2 : 0)}
                </text>
              </g>
            ))}

            {geo.xLabels.map((i, k) => (
              <text
                key={i}
                x={geo.x(i)}
                y={height - 8}
                fill="var(--ink-3)"
                fontSize="11"
                textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}
              >
                {formatTime(points[i].t, range)}
              </text>
            ))}

            <path key={`a-${range}`} d={geo.area} fill={`url(#pc-${id})`} className="fade-in" />
            <path
              key={`l-${range}`}
              d={geo.line}
              fill="none"
              stroke={color}
              strokeWidth="1.8"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1"
              style={{ animation: "chart-draw 0.9s ease-out both" }}
            />

            {/* baseline at the range's opening value */}
            {first != null && (
              <line
                x1={PAD.left}
                x2={PAD.left + geo.w}
                y1={geo.y(first)}
                y2={geo.y(first)}
                stroke="var(--ink-3)"
                strokeOpacity="0.5"
                strokeDasharray="1 3"
              />
            )}

            {hover != null && (
              <g>
                <line
                  x1={geo.x(hover)}
                  x2={geo.x(hover)}
                  y1={PAD.top}
                  y2={PAD.top + geo.h}
                  stroke="var(--line-strong)"
                />
                <circle cx={geo.x(hover)} cy={geo.y(points[hover].v)} r="8" fill={color} opacity="0.18" />
                <circle cx={geo.x(hover)} cy={geo.y(points[hover].v)} r="3.5" fill={color} stroke="var(--surface)" strokeWidth="2" />
              </g>
            )}
            {hover == null && last != null && (
              <circle cx={geo.x(points.length - 1)} cy={geo.y(last)} r="3.5" fill={color} stroke="var(--surface)" strokeWidth="2" />
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
