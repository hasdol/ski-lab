'use client';

import React from 'react';
import Button from '@/components/ui/Button';

export default function CombinedFalloffModal({
  open,
  onClose,
  filterSource,
  setFilterSource,
  filterGrain,
  setFilterGrain,
  filterTemp,
  setFilterTemp,
  filterDay,
  setFilterDay,
  availableTemps,
  availableDays,
  curves,
  visibleCurves,
  axis,
  hiddenProducts,
  setHiddenProducts,
  formatDistance,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl bg-white rounded-2xl shadow-md border border-gray-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-500 uppercase">Fall-off</div>
            <div className="text-lg font-semibold text-gray-900">Combined chart</div>
            <div className="text-xs text-gray-500 mt-1">Meters on X-axis, score on Y-axis. One line per product.</div>
          </div>
          <div className="shrink-0">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {/* Filters */}
          <div className="rounded-2xl border border-gray-200 bg-white p-3">
            <div className="text-sm font-semibold text-gray-900">Filters</div>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Source</label>
                <select
                  className="w-full border border-gray-300 rounded-2xl px-2 py-1.5 text-sm"
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="natural">Natural</option>
                  <option value="artificial">Artificial</option>
                  <option value="mix">Mix</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Snow type</label>
                <select
                  className="w-full border border-gray-300 rounded-2xl px-2 py-1.5 text-sm"
                  value={filterGrain}
                  onChange={(e) => setFilterGrain(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="fresh">Fresh</option>
                  <option value="fine_grained">Fine grained</option>
                  <option value="coarse_grained">Coarse grained</option>
                  <option value="wet">Wet</option>
                  <option value="icy">Icy</option>
                  <option value="sugary">Sugary</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Temperature</label>
                <select
                  className="w-full border border-gray-300 rounded-2xl px-2 py-1.5 text-sm"
                  value={filterTemp}
                  onChange={(e) => {
                    const v = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setFilterTemp(v);
                  }}
                >
                  <option value="all">All</option>
                  {(availableTemps || []).map((t) => (
                    <option key={t} value={t}>{t}°C</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Day</label>
                <select
                  className="w-full border border-gray-300 rounded-2xl px-2 py-1.5 text-sm"
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                >
                  <option value="all">All</option>
                  {(availableDays || []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">Only distance-series tests are included.</div>
          </div>

          {/* Chart */}
          {(() => {
            if (!curves?.length) {
              return <div className="rounded-2xl border border-gray-200 bg-white p-4 text-gray-500">No distance tests match these filters.</div>;
            }

            if (!visibleCurves?.length) {
              return <div className="rounded-2xl border border-gray-200 bg-white p-4 text-gray-500">All products are hidden. Toggle one on in the legend.</div>;
            }

            const width = 1100;
            const height = 380;
            const padL = 46;
            const padR = 14;
            const padT = 14;
            const padB = 34;

            const minX = axis?.minX ?? 0;
            const maxX = axis?.maxX ?? 0;
            const minY = 0;
            const maxY = 10;

            const sx = (x) => {
              if (!Number.isFinite(minX) || !Number.isFinite(maxX) || maxX === minX) return padL;
              return padL + ((x - minX) / (maxX - minX)) * (width - padL - padR);
            };
            const sy = (y) => {
              const clamped = Math.max(minY, Math.min(maxY, y));
              return padT + (1 - (clamped - minY) / (maxY - minY)) * (height - padT - padB);
            };

            const xTicks = [minX, minX + (maxX - minX) / 2, maxX]
              .map((v) => (Number.isFinite(v) ? Math.round(v) : 0));
            const yTicks = [0, 2, 4, 6, 8, 10];

            const palette = [
              'text-blue-600',
              'text-indigo-600',
              'text-violet-600',
              'text-cyan-600',
              'text-emerald-600',
              'text-amber-600',
              'text-rose-600',
              'text-slate-700',
              'text-teal-600',
              'text-fuchsia-600',
              'text-lime-600',
              'text-sky-600',
            ];

            const colorByProduct = new Map(
              (curves || []).map((c, idx) => [c.product, palette[idx % palette.length]])
            );

            return (
              <div className="rounded-2xl border border-gray-200 bg-white p-3">
                <div className="overflow-x-auto">
                  <svg
                    width="100%"
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    className="min-w-225"
                    role="img"
                    aria-label="Combined fall-off chart"
                  >
                    {/* axes */}
                    <line x1={padL} y1={padT} x2={padL} y2={height - padB} className="stroke-gray-300" />
                    <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} className="stroke-gray-300" />

                    {/* y grid + labels */}
                    {yTicks.map((t) => (
                      <g key={`y-${t}`}>
                        <line x1={padL} y1={sy(t)} x2={width - padR} y2={sy(t)} className="stroke-gray-100" />
                        <text x={padL - 8} y={sy(t) + 4} textAnchor="end" className="fill-gray-500" fontSize="11">
                          {t}
                        </text>
                      </g>
                    ))}

                    {/* x labels */}
                    {xTicks.map((t) => (
                      <g key={`x-${t}`}>
                        <line x1={sx(t)} y1={height - padB} x2={sx(t)} y2={height - padB + 5} className="stroke-gray-300" />
                        <text x={sx(t)} y={height - 12} textAnchor="middle" className="fill-gray-500" fontSize="11">
                          {formatDistance(t) || `${t} m`}
                        </text>
                      </g>
                    ))}

                    {/* lines */}
                    {(visibleCurves || []).map((c) => {
                      const pts = (c.points || []).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
                      if (pts.length < 2) return null;
                      const d = pts
                        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`)
                        .join(' ');
                      const cls = colorByProduct.get(c.product) || palette[0];
                      return (
                        <g key={c.product} className={cls}>
                          <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <circle cx={sx(pts[0].x)} cy={sy(pts[0].y)} r="2.5" fill="currentColor" />
                          <circle cx={sx(pts[pts.length - 1].x)} cy={sy(pts[pts.length - 1].y)} r="2.5" fill="currentColor" />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Legend */}
                <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {(curves || []).map((c, idx) => {
                    const cls = colorByProduct.get(c.product) || palette[idx % palette.length];
                    const hidden = hiddenProducts?.has?.(c.product);
                    const first = c.points?.[0];
                    const last = c.points?.[c.points.length - 1];
                    const delta = first && last ? (last.y - first.y) : null;

                    return (
                      <button
                        key={c.product}
                        type="button"
                        className={`flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2.5 bg-white text-left hover:bg-gray-50 transition-colors ${hidden ? 'opacity-50' : ''}`}
                        title={hidden ? 'Click to show' : 'Click to hide'}
                        onClick={() => {
                          setHiddenProducts?.((prev) => {
                            const next = new Set(prev);
                            if (next.has(c.product)) next.delete(c.product);
                            else next.add(c.product);
                            return next;
                          });
                        }}
                      >
                        <div className="min-w-0">
                          <div className={`text-sm font-medium truncate ${cls} ${hidden ? 'line-through' : ''}`}>{c.product}</div>
                          <div className="text-xs text-gray-500">{c.points.length} points • {c.nTotal} entries</div>
                        </div>
                        <div className="text-xs text-gray-700 whitespace-nowrap">
                          Δ {delta == null ? '--' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
