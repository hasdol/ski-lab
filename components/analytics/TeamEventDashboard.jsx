import React, { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useEventTestResults } from '@/hooks/useEventTestResults';
import { useTeamAggregatedResults } from '@/hooks/useTeamAggregatedResults';
import { useEventProductTests } from '@/hooks/useEventProductTests';
import { deleteEventProductTestResult, updateEventProductTestResult } from '@/lib/firebase/teamFunctions';
import { formatDateWithOptions, getOsloDateKey } from '@/helpers/helpers';
import ProductTestModal from '@/components/analytics/teamEventDashboard/ProductTestModal';
import FalloffDetailModal from '@/components/analytics/teamEventDashboard/FalloffDetailModal';
import CombinedFalloffModal from '@/components/analytics/teamEventDashboard/CombinedFalloffModal';

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
    const dayKey = ts ? getOsloDateKey(ts) : null;
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
          dayKey: dayKey || 'unknown',
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

// Build row-per-(product in productTest) with meta we can filter on
function buildProductRows(productTests) {
  const rows = [];
  (productTests || []).forEach((t) => {
    const ts = t.timestamp?.toDate ? t.timestamp.toDate() : (t.timestamp?._seconds ? new Date(t.timestamp._seconds * 1000) : null);
    const dayKey = ts ? getOsloDateKey(ts) : null;
    const temp = Number.isFinite(Number(t.temperature)) ? Number(t.temperature) : null;
    const source = (t.snowCondition?.source || '').toLowerCase() || 'unknown';
    const grainType = (t.snowCondition?.grainType || '').toLowerCase() || 'unknown';

    const rankings = Array.isArray(t.rankings) ? [...t.rankings] : [];
    if (rankings.length === 0) return;

    rankings.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

    let i = 0;
    let currentRank = 1;
    while (i < rankings.length) {
      let j = i + 1;
      while (j < rankings.length && rankings[j].score === rankings[i].score) j++;
      const tieCount = j - i;
      const rel = relativeScoreFromRank(currentRank, tieCount, rankings.length);

      for (let k = i; k < j; k++) {
        const r = rankings[k];
        const brand = (r.productBrand || '').trim();
        const name = (r.productName || '').trim();
        const label = brand && name ? `${brand} • ${name}` : (brand || name || 'Unknown');

        rows.push({
          product: label,
          source,
          grainType,
          temp,
          dayKey: dayKey || 'unknown',
          rel,
          testDate: ts ? ts.getTime() : null,
          total: rankings.length,
          groupId: t.groupId || null,
          groupIndex: t.groupIndex || null,
          testsCount: t.testsCount || null,
          distanceBetweenTests: t.distanceBetweenTests || null,
        });
      }

      currentRank += tieCount;
      i = j;
    }
  });
  return rows;
}

function formatDistance(meters) {
  const n = Number(meters);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)} km`;
  return `${Math.round(n)} m`;
}

function safeNumber(n, fallback = null) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function distanceAtTestFromDoc(t) {
  const explicit = safeNumber(t?.distanceAtTest, null);
  if (explicit != null) return explicit;

  const before = safeNumber(t?.distanceBeforeTest, 0);
  const idx = safeNumber(t?.groupIndex, null);
  const between = safeNumber(t?.distanceBetweenTests, null);
  const count = safeNumber(t?.testsCount, 1);

  if (count > 1 && idx != null && between != null && between > 0) {
    return before + (idx - 1) * between;
  }
  return before;
}

function getRankedListFromTest(test) {
  const rankings = Array.isArray(test?.rankings) ? [...test.rankings] : [];
  if (rankings.length === 0) return [];
  rankings.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

  const out = [];
  let i = 0;
  let currentRank = 1;
  while (i < rankings.length) {
    let j = i + 1;
    while (j < rankings.length && rankings[j].score === rankings[i].score) j++;
    const tieCount = j - i;
    const rel = relativeScoreFromRank(currentRank, tieCount, rankings.length);

    for (let k = i; k < j; k++) {
      const r = rankings[k];
      const brand = (r.productBrand || '').trim();
      const name = (r.productName || '').trim();
      const label = brand && name ? `${brand} • ${name}` : (brand || name || 'Unknown');
      out.push({
        label,
        score: safeNumber(r.score, 0),
        rank: currentRank,
        rel,
      });
    }

    currentRank += tieCount;
    i = j;
  }

  return out;
}

function Sparkline({ points }) {
  const width = 140;
  const height = 36;
  const pad = 3;

  const clean = (points || [])
    .filter((p) => p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)))
    .map((p) => ({ x: Number(p.x), y: Number(p.y) }))
    .sort((a, b) => a.x - b.x);

  if (clean.length < 2) {
    return <div className="h-9 w-35 rounded bg-gray-50 border border-gray-200" />;
  }

  const xs = clean.map((p) => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = 0;
  const maxY = 10;

  const sx = (x) => {
    if (maxX === minX) return width / 2;
    return pad + ((x - minX) / (maxX - minX)) * (width - pad * 2);
  };
  const sy = (y) => {
    const clamped = Math.max(minY, Math.min(maxY, y));
    return pad + (1 - (clamped - minY) / (maxY - minY)) * (height - pad * 2);
  };

  const d = clean
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`)
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-label="Performance over distance"
      role="img"
    >
      <rect x="0" y="0" width={width} height={height} rx="8" className="fill-gray-50 stroke-gray-200" />
      <path d={d} className="fill-none stroke-blue-600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={sx(clean[0].x)} cy={sy(clean[0].y)} r="2.5" className="fill-blue-600" />
      <circle cx={sx(clean[clean.length - 1].x)} cy={sy(clean[clean.length - 1].y)} r="2.5" className="fill-blue-600" />
    </svg>
  );
}

function filterProductTestsByMeta(tests, { filterSource, filterGrain, filterTemp, filterDay, testType }) {
  return (tests || []).filter((t) => {
    const temp = Number.isFinite(Number(t.temperature)) ? Number(t.temperature) : null;
    const source = (t.snowCondition?.source || '').toLowerCase() || 'unknown';
    const grainType = (t.snowCondition?.grainType || '').toLowerCase() || 'unknown';
    const ts = t.timestamp?.toDate
      ? t.timestamp.toDate()
      : (t.timestamp?._seconds ? new Date(t.timestamp._seconds * 1000) : null);
    const dayKey = ts ? getOsloDateKey(ts) : null;

    if (filterSource !== 'all' && source !== filterSource) return false;
    if (filterGrain !== 'all' && grainType !== filterGrain) return false;
    if (filterTemp !== 'all') {
      const bin = temp == null ? null : Math.round(temp);
      if (bin !== filterTemp) return false;
    }
    if (filterDay !== 'all' && (dayKey || 'unknown') !== filterDay) return false;

    const isDistance = Number(t.testsCount) > 1;
    if (testType === 'single' && isDistance) return false;
    if (testType === 'distance' && !isDistance) return false;

    return true;
  });
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
    // filterDay is applied by pre-filtering row sources to keep buildHeatmap signature stable.
    return true;
  });

  // NOTE: day filtering is handled by the caller.

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
  const { productTests, loading: lp, error: ep } = useEventProductTests(teamId, eventId);

  // UI state: grouping and filters
  const [dashboardView, setDashboardView] = useState('member'); // 'member' | 'team'
  const [groupBy, setGroupBy] = useState('grind'); // member only: 'grind' | 'base'

  // Product analytics sub-tabs (only relevant in event scope)
  const [productAnalyticsTab, setProductAnalyticsTab] = useState('heatmap'); // 'heatmap' | 'falloff' | 'history'

  // Member filters (affect member heatmap + top list)
  const [memberFilterSource, setMemberFilterSource] = useState('all');
  const [memberFilterGrain, setMemberFilterGrain] = useState('all');
  const [memberFilterTemp, setMemberFilterTemp] = useState('all');
  const [memberFilterDay, setMemberFilterDay] = useState('all');

  // Team filters are per-section
  const [teamHeatmapFilterSource, setTeamHeatmapFilterSource] = useState('all');
  const [teamHeatmapFilterGrain, setTeamHeatmapFilterGrain] = useState('all');
  const [teamHeatmapFilterTemp, setTeamHeatmapFilterTemp] = useState('all');
  const [teamHeatmapFilterDay, setTeamHeatmapFilterDay] = useState('all');
  const [teamHeatmapTestType, setTeamHeatmapTestType] = useState('all');

  const [teamHistoryFilterSource, setTeamHistoryFilterSource] = useState('all');
  const [teamHistoryFilterGrain, setTeamHistoryFilterGrain] = useState('all');
  const [teamHistoryFilterTemp, setTeamHistoryFilterTemp] = useState('all');
  const [teamHistoryFilterDay, setTeamHistoryFilterDay] = useState('all');
  const [teamHistoryTestType, setTeamHistoryTestType] = useState('all');

  // Fall-off filters live inside the fall-off modal (per product)
  const [falloffFilterSource, setFalloffFilterSource] = useState('all');
  const [falloffFilterGrain, setFalloffFilterGrain] = useState('all');
  const [falloffFilterTemp, setFalloffFilterTemp] = useState('all');
  const [falloffFilterDay, setFalloffFilterDay] = useState('all');

  // Combined fall-off chart (multi-product)
  const [combinedFalloffOpen, setCombinedFalloffOpen] = useState(false);
  const [combinedFalloffFilterSource, setCombinedFalloffFilterSource] = useState('all');
  const [combinedFalloffFilterGrain, setCombinedFalloffFilterGrain] = useState('all');
  const [combinedFalloffFilterTemp, setCombinedFalloffFilterTemp] = useState('all');
  const [combinedFalloffFilterDay, setCombinedFalloffFilterDay] = useState('all');
  const [combinedHiddenProducts, setCombinedHiddenProducts] = useState(() => new Set());
  const [selectedProductTestId, setSelectedProductTestId] = useState(null);
  const [isEditingProductTest, setIsEditingProductTest] = useState(false);
  const [editProductTestForm, setEditProductTestForm] = useState({
    temperature: '',
    location: '',
    comment: '',
    source: '',
    grainType: '',
    distanceBeforeTest: 0,
    distanceBetweenTests: '',
  });
  const [savingProductTest, setSavingProductTest] = useState(false);

  const isEventScope = !!eventId;
  const loading = isEventScope ? l1 : l2;
  const error = isEventScope ? e1 : e2;
  const results = isEventScope ? eventResults : teamResults;

  const memberAllRows = useMemo(() => buildRows(results), [results]);

  // Member: day-filter rows outside buildHeatmap; other filters are passed into buildHeatmap.
  const memberRows = useMemo(() => {
    if (memberFilterDay === 'all') return memberAllRows;
    return memberAllRows.filter((r) => (r.dayKey || 'unknown') === memberFilterDay);
  }, [memberAllRows, memberFilterDay]);

  // Team: per-section filtered source lists
  const teamHeatmapTests = useMemo(() => {
    if (!isEventScope) return [];
    return filterProductTestsByMeta(productTests, {
      filterSource: teamHeatmapFilterSource,
      filterGrain: teamHeatmapFilterGrain,
      filterTemp: teamHeatmapFilterTemp,
      filterDay: teamHeatmapFilterDay,
      testType: teamHeatmapTestType,
    });
  }, [isEventScope, productTests, teamHeatmapFilterSource, teamHeatmapFilterGrain, teamHeatmapFilterTemp, teamHeatmapFilterDay, teamHeatmapTestType]);

  const teamHeatmapProductRows = useMemo(
    () => (isEventScope ? buildProductRows(teamHeatmapTests) : []),
    [isEventScope, teamHeatmapTests]
  );

  const teamHistoryTests = useMemo(() => {
    if (!isEventScope) return [];
    return filterProductTestsByMeta(productTests, {
      filterSource: teamHistoryFilterSource,
      filterGrain: teamHistoryFilterGrain,
      filterTemp: teamHistoryFilterTemp,
      filterDay: teamHistoryFilterDay,
      testType: teamHistoryTestType,
    });
  }, [isEventScope, productTests, teamHistoryFilterSource, teamHistoryFilterGrain, teamHistoryFilterTemp, teamHistoryFilterDay, teamHistoryTestType]);

  const productSeries = useMemo(() => {
    // Distance-series list shown on the dashboard (no filters here; filters are inside the fall-off modal).
    // IMPORTANT: must be distance tests only; fall-off is meaningless without a distance axis.
    const byProduct = new Map();
    (productTests || []).forEach((t) => {
      const testsCount = Number(t.testsCount);
      const groupIndex = Number(t.groupIndex);
      if (!Number.isFinite(testsCount) || testsCount <= 1) return;
      if (!Number.isFinite(groupIndex) || groupIndex <= 0) return;

      const x = distanceAtTestFromDoc(t);
      if (x == null) return;
      const xNum = Number(x);
      if (!Number.isFinite(xNum)) return;

      const rankings = Array.isArray(t.rankings) ? [...t.rankings] : [];
      if (rankings.length === 0) return;
      rankings.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

      let i = 0;
      let currentRank = 1;
      while (i < rankings.length) {
        let j = i + 1;
        while (j < rankings.length && rankings[j].score === rankings[i].score) j++;
        const tieCount = j - i;
        const rel = relativeScoreFromRank(currentRank, tieCount, rankings.length);

        for (let k = i; k < j; k++) {
          const r = rankings[k];
          const brand = (r.productBrand || '').trim();
          const name = (r.productName || '').trim();
          const label = brand && name ? `${brand} • ${name}` : (brand || name || 'Unknown');

          if (!byProduct.has(label)) byProduct.set(label, new Map());
          const byX = byProduct.get(label);
          if (!byX.has(xNum)) byX.set(xNum, []);
          byX.get(xNum).push({ rel, testId: t.id });
        }

        currentRank += tieCount;
        i = j;
      }
    });

    const curves = Array.from(byProduct.entries()).map(([product, byX]) => {
      const points = Array.from(byX.entries())
        .map(([x, entries]) => {
          const ys = entries.map((e) => e.rel);
          return {
            x,
            y: ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : null,
            n: ys.length,
            entries,
          };
        })
        .filter((p) => p.y != null)
        .sort((a, b) => a.x - b.x);
      const nTotal = points.reduce((s, p) => s + (p.n || 0), 0);
      return { product, points, nTotal };
    });

    // show products with most series data first
    curves.sort((a, b) => (b.nTotal || 0) - (a.nTotal || 0));
    return curves;
  }, [productTests]);

  const memberAvailableTemps = useMemo(() => {
    const set = new Set();
    memberAllRows.forEach((r) => {
      if (r.temp != null) set.add(Math.round(r.temp));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [memberAllRows]);

  const teamAvailableTemps = useMemo(() => {
    const set = new Set();
    (productTests || []).forEach((t) => {
      const temp = Number.isFinite(Number(t.temperature)) ? Number(t.temperature) : null;
      if (temp != null) set.add(Math.round(temp));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [productTests]);

  const memberAvailableDays = useMemo(() => {
    const set = new Set();
    (results || []).forEach((t) => {
      const ts = t.timestamp?.toDate ? t.timestamp.toDate() : (t.timestamp?._seconds ? new Date(t.timestamp._seconds * 1000) : null);
      const key = ts ? getOsloDateKey(ts) : null;
      if (key) set.add(key);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [results]);

  const teamAvailableDays = useMemo(() => {
    const set = new Set();
    (productTests || []).forEach((t) => {
      const ts = t.timestamp?.toDate ? t.timestamp.toDate() : (t.timestamp?._seconds ? new Date(t.timestamp._seconds * 1000) : null);
      const key = ts ? getOsloDateKey(ts) : null;
      if (key) set.add(key);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [productTests]);

  const heatmap = useMemo(
    () => buildHeatmap(memberRows, { groupBy, filterSource: memberFilterSource, filterGrain: memberFilterGrain, filterTemp: memberFilterTemp }),
    [memberRows, groupBy, memberFilterSource, memberFilterGrain, memberFilterTemp]
  );

  const productHeatmap = useMemo(
    () => (teamHeatmapProductRows.length ? buildHeatmap(teamHeatmapProductRows, { groupBy: 'product', filterSource: 'all', filterGrain: 'all', filterTemp: 'all' }) : null),
    [teamHeatmapProductRows]
  );

  // For the fall-off chart: determine if distance axis is real meters or just index.
  // Must be declared before any early returns to keep hook order stable.
  const seriesUsesMeters = useMemo(() => {
    return (productTests || []).some((t) => Number(t.testsCount) > 1 && distanceAtTestFromDoc(t) != null);
  }, [productTests]);

  const filteredProductTests = useMemo(() => {
    return [...(teamHistoryTests || [])].sort((a, b) => {
      const ta = a.timestamp?.seconds || 0;
      const tb = b.timestamp?.seconds || 0;
      return tb - ta;
    });
  }, [teamHistoryTests]);

  const selectedProductTest = useMemo(() => {
    if (!selectedProductTestId) return null;
    return (productTests || []).find((t) => t.id === selectedProductTestId) || null;
  }, [productTests, selectedProductTestId]);

  const selectedProductTestRankings = useMemo(() => getRankedListFromTest(selectedProductTest), [selectedProductTest]);

  const [falloffModal, setFalloffModal] = useState(null); // { product } | null
  const [falloffSelectedX, setFalloffSelectedX] = useState(null);

  const testsById = useMemo(() => {
    const m = new Map();
    (productTests || []).forEach((t) => m.set(t.id, t));
    return m;
  }, [productTests]);

  useEffect(() => {
    if (!selectedProductTest) {
      setIsEditingProductTest(false);
      return;
    }
    if (!isEditingProductTest) return;

    const snow = selectedProductTest.snowCondition || {};
    setEditProductTestForm({
      temperature: selectedProductTest.temperature ?? '',
      location: selectedProductTest.location ?? '',
      comment: selectedProductTest.comment ?? '',
      source: snow.source ?? '',
      grainType: snow.grainType ?? '',
      distanceBeforeTest: safeNumber(selectedProductTest.distanceBeforeTest, 0),
      distanceBetweenTests: selectedProductTest.distanceBetweenTests ?? '',
    });
  }, [selectedProductTest, isEditingProductTest]);

  const falloffModalPoints = useMemo(() => {
    if (!falloffModal?.product) return [];

    const filtered = filterProductTestsByMeta(productTests, {
      filterSource: falloffFilterSource,
      filterGrain: falloffFilterGrain,
      filterTemp: falloffFilterTemp,
      filterDay: falloffFilterDay,
      testType: 'distance',
    });

    const byX = new Map();
    (filtered || []).forEach((t) => {
      const testsCount = Number(t.testsCount);
      const groupIndex = Number(t.groupIndex);
      if (!Number.isFinite(testsCount) || testsCount <= 1) return;
      if (!Number.isFinite(groupIndex) || groupIndex <= 0) return;

      const x = distanceAtTestFromDoc(t);
      const rankings = Array.isArray(t.rankings) ? [...t.rankings] : [];
      if (rankings.length === 0) return;
      rankings.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

      let i = 0;
      let currentRank = 1;
      while (i < rankings.length) {
        let j = i + 1;
        while (j < rankings.length && rankings[j].score === rankings[i].score) j++;
        const tieCount = j - i;
        const rel = relativeScoreFromRank(currentRank, tieCount, rankings.length);

        for (let k = i; k < j; k++) {
          const r = rankings[k];
          const brand = (r.productBrand || '').trim();
          const name = (r.productName || '').trim();
          const label = brand && name ? `${brand} • ${name}` : (brand || name || 'Unknown');
          if (label !== falloffModal.product) continue;
          if (!byX.has(x)) byX.set(x, []);
          byX.get(x).push({ rel, testId: t.id });
        }

        currentRank += tieCount;
        i = j;
      }
    });

    return Array.from(byX.entries())
      .map(([x, entries]) => {
        const ys = entries.map((e) => e.rel);
        return {
          x: Number(x),
          y: ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : null,
          n: ys.length,
          entries,
        };
      })
      .filter((p) => p.y != null)
      .sort((a, b) => a.x - b.x);
  }, [falloffModal, productTests, falloffFilterSource, falloffFilterGrain, falloffFilterTemp, falloffFilterDay]);

  const combinedFalloffCurves = useMemo(() => {
    if (!isEventScope || !combinedFalloffOpen) return [];

    const filtered = filterProductTestsByMeta(productTests, {
      filterSource: combinedFalloffFilterSource,
      filterGrain: combinedFalloffFilterGrain,
      filterTemp: combinedFalloffFilterTemp,
      filterDay: combinedFalloffFilterDay,
      testType: 'distance',
    });

    const byProduct = new Map();

    (filtered || []).forEach((t) => {
      const testsCount = Number(t.testsCount);
      const groupIndex = Number(t.groupIndex);
      if (!Number.isFinite(testsCount) || testsCount <= 1) return;
      if (!Number.isFinite(groupIndex) || groupIndex <= 0) return;

      const x = distanceAtTestFromDoc(t);

      const rankings = Array.isArray(t.rankings) ? [...t.rankings] : [];
      if (rankings.length === 0) return;
      rankings.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

      let i = 0;
      let currentRank = 1;
      while (i < rankings.length) {
        let j = i + 1;
        while (j < rankings.length && rankings[j].score === rankings[i].score) j++;
        const tieCount = j - i;
        const rel = relativeScoreFromRank(currentRank, tieCount, rankings.length);

        for (let k = i; k < j; k++) {
          const r = rankings[k];
          const brand = (r.productBrand || '').trim();
          const name = (r.productName || '').trim();
          const label = brand && name ? `${brand} • ${name}` : (brand || name || 'Unknown');

          if (!byProduct.has(label)) byProduct.set(label, new Map());
          const byX = byProduct.get(label);
          if (!byX.has(x)) byX.set(x, []);
          byX.get(x).push(rel);
        }

        currentRank += tieCount;
        i = j;
      }
    });

    const curves = Array.from(byProduct.entries())
      .map(([product, byX]) => {
        const points = Array.from(byX.entries())
          .map(([x, rels]) => {
            const y = rels.length ? rels.reduce((a, b) => a + b, 0) / rels.length : null;
            return { x: Number(x), y, n: rels.length };
          })
          .filter((p) => p.y != null && Number.isFinite(Number(p.x)))
          .sort((a, b) => a.x - b.x);
        const nTotal = points.reduce((s, p) => s + (p.n || 0), 0);
        return { product, points, nTotal };
      })
      .filter((c) => (c.points || []).length >= 2);

    curves.sort((a, b) => (b.nTotal || 0) - (a.nTotal || 0));
    return curves;
  }, [isEventScope, combinedFalloffOpen, productTests, combinedFalloffFilterSource, combinedFalloffFilterGrain, combinedFalloffFilterTemp, combinedFalloffFilterDay]);

  const combinedFalloffAxis = useMemo(() => {
    const all = combinedFalloffCurves.flatMap((c) => c.points || []);
    const xs = all.map((p) => Number(p.x)).filter((x) => Number.isFinite(x));
    const minX = xs.length ? Math.min(...xs) : 0;
    const maxX = xs.length ? Math.max(...xs) : 0;
    return { minX, maxX };
  }, [combinedFalloffCurves]);

  const combinedVisibleFalloffCurves = useMemo(() => {
    if (!combinedFalloffCurves.length) return [];
    if (!combinedHiddenProducts || combinedHiddenProducts.size === 0) return combinedFalloffCurves;
    return combinedFalloffCurves.filter((c) => !combinedHiddenProducts.has(c.product));
  }, [combinedFalloffCurves, combinedHiddenProducts]);

  useEffect(() => {
    if (combinedFalloffOpen) setCombinedHiddenProducts(new Set());
  }, [combinedFalloffOpen]);

  const saveSelectedProductTestMeta = async () => {
    if (!teamId || !eventId || !selectedProductTest?.id) return;

    try {
      setSavingProductTest(true);
      const testsCount = safeNumber(selectedProductTest.testsCount, 1);
      const groupIndex = safeNumber(selectedProductTest.groupIndex, 1);
      const before = safeNumber(editProductTestForm.distanceBeforeTest, 0);
      const between = testsCount > 1 ? safeNumber(editProductTestForm.distanceBetweenTests, null) : null;
      const hasBetween = testsCount > 1 && between != null && between > 0;
      const distanceAtTest = hasBetween ? before + (groupIndex - 1) * between : before;

      await updateEventProductTestResult(teamId, eventId, selectedProductTest.id, {
        temperature: editProductTestForm.temperature,
        location: editProductTestForm.location,
        comment: editProductTestForm.comment,
        snowCondition: {
          source: editProductTestForm.source,
          grainType: editProductTestForm.grainType,
        },
        distanceBeforeTest: before,
        distanceBetweenTests: hasBetween ? between : null,
        distanceAtTest,
      });

      setIsEditingProductTest(false);
    } finally {
      setSavingProductTest(false);
    }
  };

  useEffect(() => {
    if (!falloffModal?.product) return;
    const firstX = falloffModalPoints?.[0]?.x ?? null;
    if (firstX == null) {
      setFalloffSelectedX(null);
      return;
    }
    setFalloffSelectedX((prev) => {
      const stillExists = falloffModalPoints.some((p) => p.x === prev);
      return stillExists ? prev : firstX;
    });
  }, [falloffModal, falloffModalPoints]);

  if (loading) return <div className="py-6 text-gray-500">Loading analytics…</div>;
  if (error) return <div className="py-6 text-red-600">Failed to load analytics</div>;
  if (!memberAllRows.length && !(isEventScope && (productTests || []).length)) return <div className="py-6 text-gray-500">No analytics yet</div>;

  const { groupList, tempList, cells, groupAvg } = heatmap;
  const groupLabel = groupBy === 'grind' ? 'Grind' : 'Base';

  // if a specific temperature is selected, show only that column
  const shownTemps = memberFilterTemp === 'all' ? tempList : tempList.filter((t) => t === memberFilterTemp);

  const memberEmpty = !memberRows.length;
  const teamEmpty = !(productTests || []).length;

  return (
    <div className="space-y-6">
      {/* Header + View switch + Filters */}
      <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
        <div className="space-y-2">
          <div className="inline-flex flex-col gap-1">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Analytics view</div>
            <div className="inline-flex rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
              <button
                type="button"
                className={`px-3 py-1.5 text-sm ${dashboardView === 'member' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setDashboardView('member')}
                aria-current={dashboardView === 'member' ? 'page' : undefined}
              >
                Member tests
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm ${dashboardView === 'team' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setDashboardView('team')}
                aria-current={dashboardView === 'team' ? 'page' : undefined}
              >
                Product tests
              </button>
            </div>
          </div>

          {/* Tabs above — card titles live inside each section now */}
        </div>

        {/* Member filters moved to their own row (rendered below header) */}
      </div>

      {/* Member filters were moved into the member performance container so they share the same background */}

      {/* MEMBER TESTS */}
      {dashboardView === 'member' && (
        memberEmpty ? (
          <div className="rounded-2xl border border-gray-200 bg-white/60 p-4 text-gray-500">No member tests yet</div>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white/60 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3 flex-col md:flex-row">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Member performance</h4>
                  <div className="text-xs text-gray-500 mt-1">Newer and larger tests have more influence</div>
                </div>
              </div>

              {/* Filters (moved inside the member card so filters share background with performance) */}
              <div className="mt-3">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 w-full">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs text-gray-600 mb-1">Group by</label>
                    <div className="flex rounded-2xl overflow-hidden border border-gray-200">
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

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Source</label>
                    <select
                      className="w-full border border-gray-300 rounded-2xl px-2 py-1.5 text-sm"
                      value={memberFilterSource}
                      onChange={(e) => setMemberFilterSource(e.target.value)}
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
                      value={memberFilterGrain}
                      onChange={(e) => setMemberFilterGrain(e.target.value)}
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
                      value={memberFilterTemp}
                      onChange={(e) => {
                        const v = e.target.value === 'all' ? 'all' : Number(e.target.value);
                        setMemberFilterTemp(v);
                      }}
                    >
                      <option value="all">All</option>
                      {memberAvailableTemps.map((t) => (
                        <option key={t} value={t}>{t}°C</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs text-gray-600 mb-1">Day</label>
                    <select
                      className="w-full border border-gray-300 rounded-2xl px-2 py-1.5 text-sm"
                      value={memberFilterDay}
                      onChange={(e) => setMemberFilterDay(e.target.value)}
                    >
                      <option value="all">All</option>
                      {memberAvailableDays.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Heatmap */}
              <div className="mt-4 overflow-x-auto touch-pan-y">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-gray-600 font-medium pb-3 pr-3">{groupLabel}</th>
                      {shownTemps.map((t) => (
                        <th key={t} className="text-center text-gray-600 font-medium pb-3 px-2">
                          {t}°C
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupList.map((g) => (
                      <tr key={g} className="border-b border-gray-100">
                        <td className="text-sm text-gray-700 font-medium py-2.5 pr-3">{g}</td>
                        {shownTemps.map((t) => {
                          const c = cells[g]?.[t];
                          const val = c?.avg10;
                          const ratio = val == null ? 0 : Math.max(0, Math.min(1, val / 10));
                          const bg = val == null ? '#f8fafc' : lerpColor(lowHex, highHex, ratio);
                          const fg = ratio > 0.6 ? '#fff' : '#0f172a';
                          return (
                            <td key={`${g}-${t}`} className="py-2 px-2 text-center">
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
              <div className="mt-5">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Top {groupLabel.toLowerCase()}s</h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {groupAvg.slice(0, 6).map((g) => (
                    <div key={g.group} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2.5 bg-white">
                      <span className="text-sm text-gray-800">{g.group}</span>
                      <span className="text-sm font-semibold text-gray-900">{g.avg != null ? `${g.avg.toFixed(1)} / 10` : '--'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )
      )}

      {/* PRODUCT TESTS */}
      {dashboardView === 'team' && (
        !isEventScope ? (
          <div className="rounded-2xl border border-gray-200 bg-white/60 p-4 text-gray-500">Product tests (coming soon)</div>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Product tests</h4>
                  <div className="text-xs text-gray-500">Heatmap can include single + distance tests. Fall-off is distance tests only.</div>
                </div>
              </div>

              <div className="mt-3">
                <div className="pl-3 border-l-2 border-gray-200">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Product analytics</div>
                  <div className="mt-1 inline-flex rounded-xl overflow-hidden border border-gray-200 bg-gray-50 p-1">
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-sm rounded-lg ${productAnalyticsTab === 'heatmap' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 hover:bg-white/70'}`}
                      onClick={() => setProductAnalyticsTab('heatmap')}
                      aria-current={productAnalyticsTab === 'heatmap' ? 'page' : undefined}
                    >
                      Heatmap
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-sm rounded-lg ${productAnalyticsTab === 'falloff' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 hover:bg-white/70'}`}
                      onClick={() => setProductAnalyticsTab('falloff')}
                      aria-current={productAnalyticsTab === 'falloff' ? 'page' : undefined}
                    >
                      Fall-off
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-sm rounded-lg ${productAnalyticsTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 hover:bg-white/70'}`}
                      onClick={() => setProductAnalyticsTab('history')}
                      aria-current={productAnalyticsTab === 'history' ? 'page' : undefined}
                    >
                      History
                    </button>
                  </div>
                </div>
              </div>

              {lp ? (
                <div className="py-3 text-gray-500">Loading product tests…</div>
              ) : ep ? (
                <div className="py-3 text-red-600">Failed to load product tests</div>
              ) : teamEmpty ? (
                <div className="py-3 text-gray-500">No product tests yet</div>
              ) : (
                <>
                  {productAnalyticsTab === 'heatmap' && (
                    <>
                      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 w-full">
                          <div className="col-span-2 md:col-span-2">
                            <label className="block text-xs text-gray-600 mb-1">Type</label>
                            <div className="inline-flex rounded-2xl overflow-hidden border border-gray-200 bg-white w-full">
                              <button
                                type="button"
                                className={`px-3 py-1.5 text-sm flex-1 ${teamHeatmapTestType === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                                onClick={() => setTeamHeatmapTestType('all')}
                              >
                                All
                              </button>
                              <button
                                type="button"
                                className={`px-3 py-1.5 text-sm flex-1 ${teamHeatmapTestType === 'single' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                                onClick={() => setTeamHeatmapTestType('single')}
                              >
                                Single
                              </button>
                              <button
                                type="button"
                                className={`px-3 py-1.5 text-sm flex-1 ${teamHeatmapTestType === 'distance' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                                onClick={() => setTeamHeatmapTestType('distance')}
                              >
                                Distance
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Source</label>
                            <select
                              className="w-full border border-gray-300 rounded-2xl px-2 py-1.5 text-sm"
                              value={teamHeatmapFilterSource}
                              onChange={(e) => setTeamHeatmapFilterSource(e.target.value)}
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
                              value={teamHeatmapFilterGrain}
                              onChange={(e) => setTeamHeatmapFilterGrain(e.target.value)}
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
                              value={teamHeatmapFilterTemp}
                              onChange={(e) => {
                                const v = e.target.value === 'all' ? 'all' : Number(e.target.value);
                                setTeamHeatmapFilterTemp(v);
                              }}
                            >
                              <option value="all">All</option>
                              {teamAvailableTemps.map((t) => (
                                <option key={t} value={t}>{t}°C</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs text-gray-600 mb-1">Day</label>
                            <select
                              className="w-full border border-gray-300 rounded-2xl px-2 py-1.5 text-sm"
                              value={teamHeatmapFilterDay}
                              onChange={(e) => setTeamHeatmapFilterDay(e.target.value)}
                            >
                              <option value="all">All</option>
                              {teamAvailableDays.map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {!teamHeatmapProductRows.length ? (
                        <div className="py-3 text-gray-500">No product tests match the selected filters</div>
                      ) : (
                        (() => {
                          const p = productHeatmap;
                          if (!p) return null;
                          const pShownTemps = teamHeatmapFilterTemp === 'all' ? p.tempList : p.tempList.filter((t) => t === teamHeatmapFilterTemp);
                          return (
                            <div className="mt-4 overflow-x-auto touch-pan-y">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left text-gray-600 font-medium pb-2 pr-2">Product</th>
                                    {pShownTemps.map((t) => (
                                      <th key={t} className="text-center text-gray-600 font-medium pb-2 px-2">{t}°C</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.groupList.map((g) => (
                                    <tr key={g} className="border-b border-gray-100">
                                      <td className="text-sm text-gray-700 font-medium py-2 pr-2">{g}</td>
                                      {pShownTemps.map((t) => {
                                        const c = p.cells[g]?.[t];
                                        const val = c?.avg10;
                                        const ratio = val == null ? 0 : Math.max(0, Math.min(1, val / 10));
                                        const bg = val == null ? '#f8fafc' : lerpColor(lowHex, highHex, ratio);
                                        const fg = ratio > 0.6 ? '#fff' : '#0f172a';
                                        return (
                                          <td key={`${g}-${t}`} className="py-2 px-2 text-center">
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
                          );
                        })()
                      )}
                    </>
                  )}

                  {productAnalyticsTab === 'falloff' && (
                    <div className="mt-5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h5 className="text-base font-semibold text-gray-900">Fall-off (distance tests)</h5>
                          <div className="text-xs text-gray-500">Higher is better. Shows how products change across repeated tests.</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-600">X-axis: {seriesUsesMeters ? 'distance' : 'test number'}</div>
                          <Button
                            variant="secondary"
                            onClick={() => setCombinedFalloffOpen(true)}
                            disabled={!productSeries.length}
                          >
                            Combined chart
                          </Button>
                        </div>
                      </div>

                      {!productSeries.length ? (
                        <div className="mt-2 text-gray-500 text-sm">No distance-series tests yet</div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {productSeries.slice(0, 8).map((s) => {
                            const first = s.points[0];
                            const last = s.points[s.points.length - 1];
                            const delta = last && first ? last.y - first.y : null;
                            const pointLabel = s.points
                              .slice(0, 4)
                              .map((p) => `${formatDistance(p.x) || p.x} → ${p.y.toFixed(1)}`)
                              .join('  •  ');
                            return (
                              <button
                                type="button"
                                key={s.product}
                                className="w-full text-left flex items-center justify-between gap-3 rounded border border-gray-200 bg-white px-3 py-2"
                                onClick={() => setFalloffModal({ product: s.product })}
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">{s.product}</div>
                                  <div className="text-xs text-gray-500">
                                    {s.points.length} points • Δ {delta == null ? '--' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`} / 10
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1 truncate" title={pointLabel}>
                                    {pointLabel}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Sparkline points={s.points} />
                                </div>
                              </button>
                            );
                          })}
                          <div className="text-xs text-gray-500">
                            Tip: Click a product to filter fall-off by conditions.
                            {seriesUsesMeters && (
                              <span> Distance between tests is taken from the protocol (e.g. {formatDistance((productTests || []).find((t) => Number(t.testsCount) > 1)?.distanceBetweenTests) || '—'}).</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {productAnalyticsTab === 'history' && (
                    <div className="mt-6">
                      <h5 className="text-base font-semibold text-gray-900">Test history</h5>
                      <div className="text-xs text-gray-500">Click a test to view, edit, or delete</div>

                      <div className="mt-3 grid grid-cols-2 md:grid-cols-6 gap-2 w-full">
                        <div className="col-span-2 md:col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Type</label>
                          <div className="inline-flex rounded-2xl overflow-hidden border border-gray-200 bg-white w-full">
                            <button
                              type="button"
                              className={`px-3 py-1.5 text-sm flex-1 ${teamHistoryTestType === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                              onClick={() => setTeamHistoryTestType('all')}
                            >
                              All
                            </button>
                            <button
                              type="button"
                              className={`px-3 py-1.5 text-sm flex-1 ${teamHistoryTestType === 'single' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                              onClick={() => setTeamHistoryTestType('single')}
                            >
                              Single
                            </button>
                            <button
                              type="button"
                              className={`px-3 py-1.5 text-sm flex-1 ${teamHistoryTestType === 'distance' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                              onClick={() => setTeamHistoryTestType('distance')}
                            >
                              Distance
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Source</label>
                          <select
                            className="w-full border border-gray-300 rounded-2xl px-2 py-1.5 text-sm"
                            value={teamHistoryFilterSource}
                            onChange={(e) => setTeamHistoryFilterSource(e.target.value)}
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
                            value={teamHistoryFilterGrain}
                            onChange={(e) => setTeamHistoryFilterGrain(e.target.value)}
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
                            value={teamHistoryFilterTemp}
                            onChange={(e) => {
                              const v = e.target.value === 'all' ? 'all' : Number(e.target.value);
                              setTeamHistoryFilterTemp(v);
                            }}
                          >
                            <option value="all">All</option>
                            {teamAvailableTemps.map((t) => (
                              <option key={t} value={t}>{t}°C</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2 md:col-span-1">
                          <label className="block text-xs text-gray-600 mb-1">Day</label>
                          <select
                            className="w-full border border-gray-300 rounded-2xl px-2 py-1.5 text-sm"
                            value={teamHistoryFilterDay}
                            onChange={(e) => setTeamHistoryFilterDay(e.target.value)}
                          >
                            <option value="all">All</option>
                            {teamAvailableDays.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {!filteredProductTests.length ? (
                        <div className="mt-2 text-gray-500 text-sm">No tests match the selected filters</div>
                      ) : (
                        <div className="mt-3 overflow-x-auto touch-pan-y">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left text-gray-600 font-medium pb-2 pr-2">When</th>
                                <th className="text-left text-gray-600 font-medium pb-2 pr-2">Type</th>
                                <th className="text-left text-gray-600 font-medium pb-2 pr-2">Distance</th>
                                <th className="hidden md:table-cell text-left text-gray-600 font-medium pb-2 pr-2">Summary</th>
                                <th className="text-right text-gray-600 font-medium pb-2">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredProductTests.slice(0, 50).map((t) => {
                                const isDistance = Number(t.testsCount) > 1;
                                const idx = safeNumber(t.groupIndex, 1);
                                const count = safeNumber(t.testsCount, 1);
                                const at = distanceAtTestFromDoc(t);
                                const atLabel = at != null ? (formatDistance(at) || `${Math.round(at)} m`) : '--';
                                const ts = t.timestamp?.toDate ? t.timestamp.toDate() : (t.timestamp?._seconds ? new Date(t.timestamp._seconds * 1000) : null);
                                const when = ts ? formatDateWithOptions(ts, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '--';
                                const top = getRankedListFromTest(t)[0]?.label || '—';
                                const selected = selectedProductTestId === t.id;
                                return (
                                  <tr key={t.id} className={`border-b border-gray-100 ${selected ? 'bg-blue-50/30' : ''}`}>
                                    <td className="text-sm text-gray-700 py-2 pr-2 whitespace-nowrap">{when}</td>
                                    <td className="py-2 pr-2">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isDistance ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {isDistance ? `Distance ${idx}/${count}` : 'Single'}
                                      </span>
                                    </td>
                                    <td className="text-sm text-gray-700 py-2 pr-2 whitespace-nowrap">{atLabel}</td>
                                    <td className="hidden md:table-cell text-sm text-gray-700 py-2 pr-2 min-w-50">Top: <span className="font-medium">{top}</span></td>
                                    <td className="py-2 text-right whitespace-nowrap">
                                      <Button
                                        variant="secondary"
                                        className="mr-2"
                                        onClick={() => setSelectedProductTestId(t.id)}
                                      >
                                        View
                                      </Button>
                                      <Button
                                        variant="danger"
                                        onClick={async () => {
                                          if (!confirm('Delete this product test? This cannot be undone.')) return;
                                          await deleteEventProductTestResult(teamId, eventId, t.id);
                                          if (selectedProductTestId === t.id) setSelectedProductTestId(null);
                                        }}
                                      >
                                        Delete
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {filteredProductTests.length > 50 && (
                            <div className="mt-2 text-xs text-gray-500">Showing latest 50 tests. Use filters to narrow.</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )
      )}

      {/* Product test modal (View) */}
      <ProductTestModal
        open={Boolean(selectedProductTest)}
        test={selectedProductTest}
        rankings={selectedProductTestRankings}
        isEditing={isEditingProductTest}
        setIsEditing={setIsEditingProductTest}
        onStartEdit={() => {
          if (!selectedProductTest) return;
          setIsEditingProductTest(true);
          const snow = selectedProductTest.snowCondition || {};
          setEditProductTestForm({
            temperature: selectedProductTest.temperature ?? '',
            location: selectedProductTest.location ?? '',
            comment: selectedProductTest.comment ?? '',
            source: snow.source ?? '',
            grainType: snow.grainType ?? '',
            distanceBeforeTest: safeNumber(selectedProductTest.distanceBeforeTest, 0),
            distanceBetweenTests: selectedProductTest.distanceBetweenTests ?? '',
          });
        }}
        editForm={editProductTestForm}
        setEditForm={setEditProductTestForm}
        saving={savingProductTest}
        onSave={saveSelectedProductTestMeta}
        onDelete={async () => {
          if (!selectedProductTest) return;
          if (!confirm('Delete this product test? This cannot be undone.')) return;
          await deleteEventProductTestResult(teamId, eventId, selectedProductTest.id);
          setSelectedProductTestId(null);
          setIsEditingProductTest(false);
        }}
        onClose={() => {
          setSelectedProductTestId(null);
          setIsEditingProductTest(false);
        }}
        safeNumber={safeNumber}
        formatDistance={formatDistance}
        distanceAtTestFromDoc={distanceAtTestFromDoc}
        formatDateWithOptions={formatDateWithOptions}
      />

      {/* Fall-off detail modal */}
      <FalloffDetailModal
        open={Boolean(falloffModal)}
        modal={falloffModal}
        onClose={() => {
          setFalloffModal(null);
          setFalloffSelectedX(null);
        }}
        points={falloffModalPoints}
        selectedX={falloffSelectedX}
        setSelectedX={setFalloffSelectedX}
        filterSource={falloffFilterSource}
        setFilterSource={setFalloffFilterSource}
        filterGrain={falloffFilterGrain}
        setFilterGrain={setFalloffFilterGrain}
        filterTemp={falloffFilterTemp}
        setFilterTemp={setFalloffFilterTemp}
        filterDay={falloffFilterDay}
        setFilterDay={setFalloffFilterDay}
        availableTemps={teamAvailableTemps}
        availableDays={teamAvailableDays}
        seriesUsesMeters={seriesUsesMeters}
        formatDistance={formatDistance}
        testsById={testsById}
        formatDateWithOptions={formatDateWithOptions}
        setSelectedProductTestId={setSelectedProductTestId}
        setIsEditingProductTest={setIsEditingProductTest}
      />

      {/* Combined fall-off chart modal */}
      <CombinedFalloffModal
        open={combinedFalloffOpen}
        onClose={() => setCombinedFalloffOpen(false)}
        filterSource={combinedFalloffFilterSource}
        setFilterSource={setCombinedFalloffFilterSource}
        filterGrain={combinedFalloffFilterGrain}
        setFilterGrain={setCombinedFalloffFilterGrain}
        filterTemp={combinedFalloffFilterTemp}
        setFilterTemp={setCombinedFalloffFilterTemp}
        filterDay={combinedFalloffFilterDay}
        setFilterDay={setCombinedFalloffFilterDay}
        availableTemps={teamAvailableTemps}
        availableDays={teamAvailableDays}
        curves={combinedFalloffCurves}
        visibleCurves={combinedVisibleFalloffCurves}
        axis={combinedFalloffAxis}
        hiddenProducts={combinedHiddenProducts}
        setHiddenProducts={setCombinedHiddenProducts}
        formatDistance={formatDistance}
      />

      <div className="text-xs text-gray-500">
        {dashboardView === 'member'
          ? 'Use the member filters to focus on specific conditions.'
          : 'Product test filters are per section. Fall-off filters are inside the product details.'}
      </div>
    </div>
  );
}