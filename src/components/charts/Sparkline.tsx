import { useId } from "react";
import type { HistoryPoint } from "@/services/market";

export function Sparkline({
  points,
  width = 96,
  height = 32,
  className = "",
}: {
  points: HistoryPoint[] | undefined;
  width?: number;
  height?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  if (!points || points.length < 2) {
    return <span className={`block ${className}`} style={{ width, height }} aria-hidden="true" />;
  }
  const vs = points.map((p) => p.v);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const xy = points.map((p, i) => [i * step, height - 2 - ((p.v - min) / span) * (height - 4)] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const up = vs[vs.length - 1] >= vs[0];
  const color = up ? "var(--up)" : "var(--down)";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${width} ${height} L0 ${height} Z`} fill={`url(#sp-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
