import React, { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import { useEventTestResults } from '@/hooks/useEventTestResults';
import { useTeamAggregatedResults } from '@/hooks/useTeamAggregatedResults';

// Color ramp helpers
const lowHex = '#f1f7fb';
const highHex = '#155dfc';
const hexToRgb = (hex) => {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return [r, g, b];
};
const rgbToHex = (r, g, b) =>
  `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
const lerp = (a, b, t) => a + (b - a) * t;
const lerpColor = (h1, h2, t) => {
  const [r1, g1, b1] = hexToRgb(h1);
  const [r2, g2, b2] = hexToRgb(h2);
  return rgbToHex(Math.round(lerp(r1, r2, t)), Math.round(lerp(g1, g2, t)), Math.round(lerp(b1, b2, t)));
};

// compute relative score from ranking position — same logic as SkiDetails
function relativeScoreFromRank(rankStart, tieCount, total) {
  if (!total || total <= 1) return 10;
  const avgRank = rankStart + (tieCount - 1) / 2;
  const rel01 = (total - avgRank) / (total - 1);
  return Math.max(0, Math.min(1, rel01)) * 10;
}

// Build row-per-(ski in test) with meta we can filter on
function buildRows(testResults) {
  const rows = [];
  (testResults || []).forEach((t) => {
    const ts = t.timestamp?.toDate ? t.timestamp.toDate() : (t.timestamp?._seconds ? new Date(t.timestamp._seconds * 1000) : null);
    const temp = Number.isFinite(Number(t.temperature)) ? Number(t.temperature) : null;
    const source = (t.snowCondition?.source || '').toLowerCase() || 'unknown';
    const grainType = (t.snowCondition?.grainType || '').toLowerCase() || 'unknown';

    const rankings = Array.isArray(t.rankings) ? [...t.rankings] : [];
    if (rankings.length === 0) return;

    // Sort by score asc (lower = better in your tests)
    rankings.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

    // tie grouping by exact score
    let i = 0;
    let currentRank = 1;
    while (i < rankings.length) {
      let j = i + 1;
      while (j < rankings.length && rankings[j].score === rankings[i].score) j++;
      const tieCount = j - i;
      const rel = relativeScoreFromRank(currentRank, tieCount, rankings.length);

      for (let k = i; k < j; k++) {
        const r = rankings[k];
        rows.push({
          // groupable fields
          grind: r.grind || 'Unknown',
          base: r.base || 'Unknown', // may be missing in older results; falls back to 'Unknown'
          // filters
          source,
          grainType,
          temp,
          // metrics
          rel, // 0–10
          testDate: ts ? ts.getTime() : null,
          total: rankings.length,
        });
      }
      currentRank += tieCount;
      i = j;
    }
  });
  return rows;
}

// aggregate [groupBy] x temp bins with weighting: w = w_field * 2^(-d/H)
function buildHeatmap(rows, { groupBy, filterSource, filterGrain, filterTemp }) {
  const HALF_LIFE_DAYS = 180;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const map = new Map();
  const groups = new Set();
  const temps = new Set();
  const now = Date.now();

  // Apply filters first
  const filtered = rows.filter((r) => {
    if (filterSource !== 'all' && (r.source || 'unknown') !== filterSource) return false;
    if (filterGrain !== 'all' && (r.grainType || 'unknown') !== filterGrain) return false;
    if (filterTemp !== 'all') {
      const bin = r.temp == null ? null : Math.round(r.temp);
      if (bin !== filterTemp) return false;
    }
    return true;
  });

  filtered.forEach((r) => {
    if (r.temp == null) return;
    const tempBin = Math.round(r.temp);
    const group = (r[groupBy] || 'Unknown');
    const dDays = r.testDate ? (now - r.testDate) / MS_PER_DAY : 3650;
    const wRecency = Math.pow(2, -(dDays / HALF_LIFE_DAYS));
    const wField = Math.min(1, (r.total || 0) / 8); // cap around ~8 skis
    const w = wRecency * wField;
    const key = `${group}___${tempBin}`;

    if (!map.has(key)) map.set(key, { sumW: 0, sumWR: 0, count: 0 });
    const bucket = map.get(key);
    bucket.sumW += w;
    bucket.sumWR += (r.rel / 10) * w; // normalize to 0–1 inside
    bucket.count += 1;

    groups.add(group);
    temps.add(tempBin);
  });

  const groupList = Array.from(groups).sort((a, b) => a.localeCompare(b));
  const tempList = Array.from(temps).sort((a, b) => a - b);

  const cells = {};
  groupList.forEach((g) => {
    cells[g] = {};
    tempList.forEach((t) => {
      const key = `${g}___${t}`;
      if (!map.has(key) || map.get(key).sumW <= 0) {
        cells[g][t] = { avg10: null, count: 0 };
      } else {
        const { sumW, sumWR, count } = map.get(key);
        const avg01 = sumWR / sumW;
        cells[g][t] = { avg10: Math.round(avg01 * 100) / 10, count }; // one decimal
      }
    });
  });

  // overall average per group
  const groupAvg = groupList.map((g) => {
    let s = 0, w = 0;
    tempList.forEach((t) => {
      const c = cells[g][t];
      if (c.avg10 != null) {
        s += c.avg10;
        w += 1;
      }
    });
    return { group: g, avg: w > 0 ? Math.round((s / w) * 10) / 10 : null };
  }).sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));

  return { groupList, tempList, cells, groupAvg };
}

export default function TeamEventDashboard({ teamId, eventId }) {
  // Scope: event → only that event; team → aggregate all events
  const { testResults: eventResults, loading: l1, error: e1 } = useEventTestResults(teamId, eventId);
  const { results: teamResults, loading: l2, error: e2 } = useTeamAggregatedResults(teamId);

  // UI state: grouping and filters
  const [groupBy, setGroupBy] = useState('grind'); // 'grind' | 'base'
  const [filterSource, setFilterSource] = useState('all'); // 'all' | 'natural' | 'artificial' | 'mix' | 'unknown'
  const [filterGrain, setFilterGrain] = useState('all'); // 'all' | fresh | fine_grained | ...
  const [filterTemp, setFilterTemp] = useState('all'); // 'all' | integer bin

  const isEventScope = !!eventId;
  const loading = isEventScope ? l1 : l2;
  const error = isEventScope ? e1 : e2;
  const results = isEventScope ? eventResults : teamResults;

  const rows = useMemo(() => buildRows(results), [results]);

  // available temp bins for selector (from unfiltered rows)
  const availableTemps = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      if (r.temp != null) set.add(Math.round(r.temp));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [rows]);

  const heatmap = useMemo(
    () => buildHeatmap(rows, { groupBy, filterSource, filterGrain, filterTemp }),
    [rows, groupBy, filterSource, filterGrain, filterTemp]
  );

  if (loading) return <div className="py-6 text-gray-500">Loading analytics…</div>;
  if (error) return <div className="py-6 text-red-600">Failed to load analytics</div>;
  if (!rows.length) return <div className="py-6 text-gray-500">No analytics yet</div>;

  const { groupList, tempList, cells, groupAvg } = heatmap;
  const groupLabel = groupBy === 'grind' ? 'Grind' : 'Base';

  // if a specific temperature is selected, show only that column
  const shownTemps = filterTemp === 'all' ? tempList : tempList.filter((t) => t === filterTemp);

  return (
    <div className="space-y-6">
      {/* Header + Controls */}
      <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            {groupLabel} performance
          </h3>
          <div className="text-xs text-gray-500">
            Newer and larger tests have more influence
          </div>
        </div>

        {/* Controls: mobile-friendly stacked */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full md:w-auto">
          {/* Group by */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs text-gray-600 mb-1">Group by</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                type="button"
                className={`px-3 py-1.5 text-sm flex-1 ${groupBy === 'grind' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                onClick={() => setGroupBy('grind')}
              >
                Grind
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm flex-1 ${groupBy === 'base' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                onClick={() => setGroupBy('base')}
              >
                Base
              </button>
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Source</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
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

          {/* Snow type */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Snow type</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
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

          {/* Temperature */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Temperature</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              value={filterTemp}
              onChange={(e) => {
                const v = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setFilterTemp(v);
              }}
            >
              <option value="all">All</option>
              {availableTemps.map((t) => (
                <option key={t} value={t}>{t}°C</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-gray-600 font-medium pb-2 pr-2">{groupLabel}</th>
              {shownTemps.map((t) => (
                <th key={t} className="text-center text-gray-600 font-medium pb-2 px-2">
                  {t}°C
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupList.map((g) => (
              <tr key={g} className="border-b border-gray-100">
                <td className="text-sm text-gray-700 font-medium py-2 pr-2">{g}</td>
                {shownTemps.map((t) => {
                  const c = cells[g]?.[t];
                  const val = c?.avg10;
                  const ratio = val == null ? 0 : Math.max(0, Math.min(1, val / 10));
                  const bg = val == null ? '#f8fafc' : lerpColor(lowHex, highHex, ratio);
                  const fg = ratio > 0.6 ? '#fff' : '#0f172a';
                  return (
                    <td key={`${g}-${t}`} className="py-1 px-2 text-center">
                      {val == null ? (
                        <span className="text-sm text-gray-400">--</span>
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-semibold"
                          style={{ backgroundColor: bg, color: fg, textShadow: fg === '#fff' ? '0 1px 0 rgba(0,0,0,0.35)' : 'none' }}
                          title={`${val.toFixed(1)} / 10 (${c.count} tests) at ${t}°C`}
                        >
                          {val.toFixed(1)}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top groups */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Top {groupLabel.toLowerCase()}s (for selected filters)</h4>
        <div className="grid sm:grid-cols-2 gap-2">
          {groupAvg.slice(0, 6).map((g) => (
            <div key={g.group} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
              <span className="text-sm text-gray-800">{g.group}</span>
              <span className="text-sm font-semibold text-gray-900">{g.avg != null ? `${g.avg.toFixed(1)} / 10` : '--'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Use the filters to focus on a specific snow source, snow type, and temperature.
      </div>
    </div>
  );
}