"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "cn";

/**
 * Lightweight map drawn with SVG (no map API key needed).
 * Pins are placed from each place's latitude/longitude.
 * - Discover: purple dots; the hovered place (or every place, if there are
 *   only a few) gets a name label.
 * - Route Builder (`route`): numbered pins joined by a line in order.
 * The SVG measures its box, so text never gets stretched on wide or tall screens.
 */
export default function MapPreview({ places = [], route = false, highlightId = null, className, label }) {
  const boxRef = useRef(null);
  const [size, setSize] = useState({ w: 400, h: 300 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: Math.round(width), h: Math.round(height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { w: W, h: H } = size;
  const PAD = 36;
  const points = places.filter((p) => p?.latitude != null && p?.longitude != null);
  const xy = projectPoints(points, W, H, PAD);
  const showAllLabels = !route && points.length <= 4;

  const description =
    label ??
    (points.length
      ? `Map with ${points.length} ${points.length === 1 ? "place" : "places"}${route ? " in route order" : ""}: ${points
          .map((p) => p.name)
          .join(", ")}`
      : "Map preview. No places to show yet.");

  return (
    <div
      ref={boxRef}
      className={cn(
        "relative h-full w-full overflow-hidden rounded-2xl border border-brand/30 bg-slate-100 dark:bg-slate-900",
        className
      )}
    >
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={description} className="absolute inset-0 h-full w-full">
        {/* Decorative streets, parks and water, like the Figma placeholder map */}
        <g stroke="white" strokeLinecap="round" className="dark:opacity-20">
          <line x1={-20} y1={H * 0.12} x2={W + 20} y2={H * 0.92} strokeWidth="16" />
          <line x1={W + 20} y1={H * 0.05} x2={-20} y2={H} strokeWidth="16" />
          <line x1={0} y1={H * 0.55} x2={W} y2={H * 0.53} strokeWidth="12" />
          <line x1={W * 0.3} y1={0} x2={W * 0.36} y2={H} strokeWidth="6" />
          <line x1={W * 0.74} y1={0} x2={W * 0.7} y2={H} strokeWidth="6" />
        </g>
        <rect x="0" y={H * 0.78} width={W * 0.25} height={H * 0.22} className="fill-sky-200/70 dark:fill-sky-900/60" />
        <rect x={W * 0.65} y="0" width={W * 0.35} height={H * 0.18} className="fill-emerald-200/60 dark:fill-emerald-900/50" />

        {!points.length && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="13" className="fill-slate-500">
            No places to show yet
          </text>
        )}

        {route && xy.length > 1 && (
          <polyline
            points={xy.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            className="stroke-brand"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {points.map((place, i) => {
          const { x, y } = xy[i];
          if (route) {
            return (
              <g key={`${place.id}-${i}`} transform={`translate(${x},${y})`}>
                <title>{`${i + 1}. ${place.name}`}</title>
                <circle r="13" className="fill-brand stroke-white" strokeWidth="3" />
                <text textAnchor="middle" dy="4.5" fontSize="12" fontWeight="700" fill="white">
                  {i + 1}
                </text>
              </g>
            );
          }
          const active = highlightId === place.id;
          return (
            <g key={place.id} transform={`translate(${x},${y})`}>
              <title>{place.name}</title>
              <circle r={active ? 9 : 7} className="fill-brand stroke-white" strokeWidth="3" />
            </g>
          );
        })}

        {/* Labels drawn last so they sit on top of every pin */}
        {!route &&
          points.map((place, i) => {
            const active = highlightId === place.id;
            if (!active && !showAllLabels) return null;
            const name = place.name.length > 22 ? `${place.name.slice(0, 21)}…` : place.name;
            const w = name.length * 6.6 + 20;
            const { x, y } = xy[i];
            const left = Math.min(Math.max(x - w / 2, 4), W - w - 4);
            return (
              <g key={`label-${place.id}`} transform={`translate(${left},${y - 36})`}>
                <rect width={w} height="24" rx="12" className={active ? "fill-brand" : "fill-white dark:fill-slate-800"} stroke="currentColor" strokeOpacity="0.15" />
                <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="600" className={active ? "fill-white" : "fill-slate-800 dark:fill-slate-100"}>
                  {name}
                </text>
              </g>
            );
          })}
      </svg>
    </div>
  );
}

/** Fit lat/lng points into a W x H box, keeping real proportions. Exported for tests. */
export function projectPoints(points, W, H, PAD = 36) {
  if (!points.length) return [];
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const minX = Math.min(...lngs) * kx;
  const maxX = Math.max(...lngs) * kx;
  const minY = Math.min(...lats);
  const maxY = Math.max(...lats);
  const spanX = Math.max(maxX - minX, 0.005);
  const spanY = Math.max(maxY - minY, 0.005);
  const scale = Math.min((W - PAD * 2) / spanX, (H - PAD * 2) / spanY);
  const offX = (W - spanX * scale) / 2;
  const offY = (H - spanY * scale) / 2;
  return points.map((p) => ({
    x: offX + (p.longitude * kx - minX) * scale,
    y: offY + (maxY - p.latitude) * scale,
  }));
}
