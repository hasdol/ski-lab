'use client';

import React from 'react';
import Button from '@/components/ui/Button';

export default function FalloffDetailModal({
  open,
  modal,
  onClose,
  points,
  selectedX,
  setSelectedX,
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
  seriesUsesMeters,
  formatDistance,
  testsById,
  formatDateWithOptions,
  setSelectedProductTestId,
  setIsEditingProductTest,
}) {
  if (!open || !modal) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-md border border-gray-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-500 uppercase">Fall-off</div>
            <div className="text-lg font-semibold text-gray-900 truncate">{modal.product}</div>
            <div className="text-xs text-gray-500 mt-1">Click a distance to see the tests behind the score.</div>
          </div>
          <div className="shrink-0">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto">
          <div className="rounded-2xl border border-gray-200 bg-white p-3 mb-3">
            <div className="text-sm font-semibold text-gray-900">Filter fall-off</div>
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
            <div className="mt-2 text-xs text-gray-500">Filters apply only to this product’s fall-off view.</div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-1 rounded-2xl border border-gray-200 bg-white p-3">
              <div className="text-sm font-semibold text-gray-900">Distances</div>
              <div className="mt-2 space-y-2">
                {!points?.length ? (
                  <div className="text-sm text-gray-500">No distance tests match these filters.</div>
                ) : (points || []).map((p) => {
                  const xLabel = seriesUsesMeters ? (formatDistance(p.x) || `${Math.round(p.x)} m`) : `#${Math.round(p.x) + 1}`;
                  const selected = selectedX === p.x;
                  return (
                    <button
                      key={p.x}
                      type="button"
                      className={`w-full text-left rounded-xl border px-3 py-2 ${selected ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-white'}`}
                      onClick={() => setSelectedX(p.x)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium text-gray-900">{xLabel}</div>
                        <div className="text-sm font-semibold text-gray-900">{p.y.toFixed(1)}</div>
                      </div>
                      <div className="text-xs text-gray-500">{p.n} test entries</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-3">
              <div className="text-sm font-semibold text-gray-900">Why this score</div>
              <div className="text-xs text-gray-500">Lists the tests contributing at the selected distance.</div>

              {(() => {
                const point = (points || []).find((p) => p.x === selectedX) || null;
                if (!point) return <div className="mt-3 text-sm text-gray-500">Select a distance.</div>;

                const rows = (point.entries || [])
                  .map((e) => {
                    const t = testsById?.get?.(e.testId);
                    if (!t) return null;
                    const ts = t.timestamp?.toDate ? t.timestamp.toDate() : (t.timestamp?._seconds ? new Date(t.timestamp._seconds * 1000) : null);
                    const when = ts ? formatDateWithOptions(ts, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '--';
                    const temp = t.temperature != null && t.temperature !== '' ? `${Math.round(Number(t.temperature))}°C` : '--';
                    const source = t.snowCondition?.source || 'unknown';
                    const grain = t.snowCondition?.grainType || 'unknown';
                    return { testId: e.testId, rel: e.rel, when, temp, source, grain };
                  })
                  .filter(Boolean)
                  .sort((a, b) => (b.rel ?? 0) - (a.rel ?? 0));

                return (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left text-gray-600 font-medium pb-2 pr-2">When</th>
                          <th className="text-left text-gray-600 font-medium pb-2 pr-2">Temp</th>
                          <th className="text-left text-gray-600 font-medium pb-2 pr-2">Snow</th>
                          <th className="text-right text-gray-600 font-medium pb-2 pr-2">Rel</th>
                          <th className="text-right text-gray-600 font-medium pb-2">Open</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.testId} className="border-b border-gray-100">
                            <td className="text-sm text-gray-700 py-2 pr-2 whitespace-nowrap">{r.when}</td>
                            <td className="text-sm text-gray-700 py-2 pr-2 whitespace-nowrap">{r.temp}</td>
                            <td className="text-sm text-gray-700 py-2 pr-2 whitespace-nowrap">{r.source} / {r.grain}</td>
                            <td className="text-sm text-gray-700 py-2 pr-2 text-right whitespace-nowrap">{Number(r.rel).toFixed(1)}</td>
                            <td className="py-2 text-right">
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  setSelectedProductTestId?.(r.testId);
                                  setIsEditingProductTest?.(false);
                                }}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
