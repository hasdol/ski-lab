import React, { useMemo } from 'react';
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

function buildRows(testResults) {
  const rows = [];
  (testResults || []).forEach((t) => {
    const ts = t.timestamp?.toDate ? t.timestamp.toDate() : (t.timestamp?._seconds ? new Date(t.timestamp._seconds * 1000) : null);
    const temp = Number.isFinite(Number(t.temperature)) ? Number(t.temperature) : null;
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
        rows.push({
          grind: rankings[k].grind || 'Unknown',
          temp,
          rel, // 0–10
          testDate: ts ? ts.getTime() : null,
          total: rankings.length,
          // you can extend: source/grainType if you want another dimension
        });
      }
      currentRank += tieCount;
      i = j;
    }
  });
  return rows;
}

// aggregate grind x temp bins with weighting: w = w_field * 2^(-d/H)
function buildHeatmap(rows) {
  const HALF_LIFE_DAYS = 180;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const map = new Map();
  const grinds = new Set();
  const temps = new Set();

  const now = Date.now();

  rows.forEach((r) => {
    if (r.temp == null) return;
    const tempBin = Math.round(r.temp); // 1°C bins; adjust if needed
    const grind = r.grind || 'Unknown';
    const dDays = r.testDate ? (now - r.testDate) / MS_PER_DAY : 3650;
    const wRecency = Math.pow(2, -(dDays / HALF_LIFE_DAYS));
    const wField = Math.min(1, (r.total || 0) / 8); // cap around 8 skis
    const w = wRecency * wField;
    const key = `${grind}___${tempBin}`;

    if (!map.has(key)) map.set(key, { sumW: 0, sumWR: 0, count: 0 });
    const bucket = map.get(key);
    bucket.sumW += w;
    bucket.sumWR += (r.rel / 10) * w; // normalize to 0–1 inside
    bucket.count += 1;

    grinds.add(grind);
    temps.add(tempBin);
  });

  const grindList = Array.from(grinds).sort((a, b) => a.localeCompare(b));
  const tempList = Array.from(temps).sort((a, b) => a - b);

  const cells = {};
  grindList.forEach((g) => {
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

  // overall average per grind
  const grindAvg = grindList.map((g) => {
    let s = 0, w = 0;
    tempList.forEach((t) => {
      const c = cells[g][t];
      if (c.avg10 != null) {
        // uniform average across temps (could also weight by count)
        s += c.avg10;
        w += 1;
      }
    });
    return { grind: g, avg: w > 0 ? Math.round((s / w) * 10) / 10 : null };
  }).sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));

  return { grindList, tempList, cells, grindAvg };
}

export default function TeamEventDashboard({ teamId, eventId }) {
  // Scope: event → only that event; team → aggregate all events
  const { testResults: eventResults, loading: l1, error: e1 } = useEventTestResults(teamId, eventId);
  const { results: teamResults, loading: l2, error: e2 } = useTeamAggregatedResults(teamId);

  const isEventScope = !!eventId;
  const loading = isEventScope ? l1 : l2;
  const error = isEventScope ? e1 : e2;
  const results = isEventScope ? eventResults : teamResults;

  const rows = useMemo(() => buildRows(results), [results]);
  const heatmap = useMemo(() => buildHeatmap(rows), [rows]);

  if (loading) return <div className="py-6 text-gray-500">Loading analytics…</div>;
  if (error) return <div className="py-6 text-red-600">Failed to load analytics</div>;
  if (!rows.length) return <div className="py-6 text-gray-500">No data available</div>;

  const { grindList, tempList, cells, grindAvg } = heatmap;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold text-gray-800">
          Grind performance by temperature
        </h3>
        <div className="text-xs text-gray-500">
          Newer and larger tests have more influence
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-gray-600 font-medium pb-2 pr-2">Grind</th>
              {tempList.map((t) => (
                <th key={t} className="text-center text-gray-600 font-medium pb-2 px-2">
                  {t}°C
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grindList.map((g) => (
              <tr key={g} className="border-b border-gray-100">
                <td className="text-sm text-gray-700 font-medium py-2 pr-2">{g}</td>
                {tempList.map((t) => {
                  const c = cells[g][t];
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

      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Top grinds (overall)</h4>
        <div className="grid sm:grid-cols-2 gap-2">
          {grindAvg.slice(0, 6).map((g) => (
            <div key={g.grind} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
              <span className="text-sm text-gray-800">{g.grind}</span>
              <span className="text-sm font-semibold text-gray-900">{g.avg != null ? `${g.avg.toFixed(1)} / 10` : '--'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        We compute a standardized relative performance per test , then average per grind x temperature with weight .
      </div>
    </div>
  );
}