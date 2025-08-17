import React, { useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { MdInfoOutline } from 'react-icons/md';
import { formatSnowTypeLabel, formatSourceLabel, formatDate } from '@/helpers/helpers';
import Overlay from '@/components/ui/Overlay';
import { motion } from 'framer-motion';

const SkiConditionHeatmap = ({
  temperatureList,
  allSnowCombos,
  combinedPerformanceData,
  chartData,
}) => {
  const router = useRouter();
  const containerRef = useRef(null);

  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  // Active tab: 'natural' | 'artificial' | 'mix'
  const [activeTab, setActiveTab] = useState('natural');

  // Color scale by category (fallback single-colors kept for 'unknown')
  // will derive category colors from the spectre below
  let categoryColors = {};

  // Dynamic perceptual spectre: pale (worst) → teal/green (best)
  const lowHex = '#f1f7fb';   // very pale (worst)
  const highHex = '#155dfc';  // teal/green (best)

  const hexToRgb = (hex) => {
    const c = hex.replace('#', '');
    return [parseInt(c.substring(0, 2), 16), parseInt(c.substring(2, 4), 16), parseInt(c.substring(4, 6), 16)];
  };
  const rgbToHex = (r, g, b) =>
    `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

  // RGB <-> HSL helpers for perceptual interpolation
  const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h * 360, s, l];
  };

  const hslToRgb = (h, s, l) => {
    h = h / 360;
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  // Interpolate in HSL space for a smoother perceptual gradient
  const scoreToHex = (score) => {
    const s = Math.max(0, Math.min(1, Number(score) || 0));
    const [r1, g1, b1] = hexToRgb(lowHex);
    const [r2, g2, b2] = hexToRgb(highHex);
    const [h1, s1, l1] = rgbToHsl(r1, g1, b1);
    const [h2, s2, l2] = rgbToHsl(r2, g2, b2);

    // Interpolate hue taking shortest direction around the circle
    let dh = h2 - h1;
    if (dh > 180) dh -= 360;
    if (dh < -180) dh += 360;
    const h = (h1 + dh * s + 360) % 360;
    const sat = s1 + (s2 - s1) * s;
    const light = l1 + (l2 - l1) * s;
    const [r, g, b] = hslToRgb(h, sat, light);
    return rgbToHex(r, g, b);
  };

  // contrast color for readable text on dots (keeps existing luminance test)
  const getContrastColor = (hex) => {
    if (!hex) return '#000';
    const [r, g, b] = hexToRgb(hex);
    const rs = r / 255;
    const gs = g / 255;
    const bs = b / 255;
    const lum =
      0.2126 * (rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4)) +
      0.7152 * (gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4)) +
      0.0722 * (bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4));
    // raise threshold a bit so mid-tone colours prefer dark text for clarity
    return lum > 0.4 ? '#000' : '#fff';
  };

  // derive discrete category colors from the same spectre so visual language is consistent
  categoryColors = {
    very_bad: scoreToHex(0),
    bad: scoreToHex(0.25),
    average: scoreToHex(0.5),
    good: scoreToHex(0.75),
    great: scoreToHex(1),
  };

  // Group raw chart data by key
  const groupedChartData = useMemo(() => {
    const map = {};
    chartData.forEach((test) => {
      const key = `${test.temp}___${test.snowSource.toLowerCase()}___${test.snowType.toLowerCase()}`;
      map[key] = map[key] || [];
      map[key].push(test);
    });
    return map;
  }, [chartData]);

  // Map combined performance data
  const performanceMap = useMemo(() => {
    const map = {};
    combinedPerformanceData.forEach((item) => {
      const key = `${item.temperature}___${item.source.toLowerCase()}___${item.snowType.toLowerCase()}`;
      map[key] = item;
    });
    return map;
  }, [combinedPerformanceData]);

  // Count non-unknown dots per source for the tabs
  const categoryDotCounts = useMemo(() => {
    const counts = { natural: 0, artificial: 0, mix: 0 };
    combinedPerformanceData.forEach((item) => {
      if (item.category.toLowerCase() !== 'unknown') {
        const src = item.source.toLowerCase();
        if (counts[src] != null) counts[src]++;
      }
    });
    return counts;
  }, [combinedPerformanceData]);

  // Filter rows by active tab (source)
  const rows = useMemo(
    () =>
      allSnowCombos
        .filter((c) => c.source.toLowerCase() === activeTab)
        .map((c) => ({ source: c.source, snowType: c.grainType })),
    [allSnowCombos, activeTab]
  );

  // Handle cell click → show popup
  const handleCellClick = (e, temp, source, snowType, category) => {
    if (category === 'unknown') return;
    const key = `${temp}___${source.toLowerCase()}___${snowType.toLowerCase()}`;
    // exclude tests with unknown category from the popup list
    const allTests = groupedChartData[key] || [];
    const tests = allTests.filter((t) => ((t.category || '').toLowerCase() !== 'unknown'));
    // compute position
    const containerRect = containerRef.current.getBoundingClientRect();
    const cellRect = e.currentTarget.getBoundingClientRect();
    const x = cellRect.left - containerRect.left + cellRect.width / 2;
    const y = cellRect.top - containerRect.top;

    setPopupData({ tests, temp, source, snowType });
    setPopupPos({ x, y });
    setShowPopup(true);
  };

  return (
    <div className="relative mt-5" ref={containerRef}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {['Natural', 'Artificial', 'Mix'].map((tabLabel) => {
          const tab = tabLabel.toLowerCase();
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${isActive
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {tabLabel}
              {categoryDotCounts[tab] > 0 && (
                <span className="ml-1 opacity-90">({categoryDotCounts[tab]})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4 px-1">
        {/* Dynamic gradient legend */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center text-sm text-gray-700">
            <div
              className="w-40 h-4 rounded-md shadow-sm"
              role="img"
              aria-label="Performance gradient from bad to great"
              style={{ background: `linear-gradient(to right, ${lowHex}, ${highHex})` }}
            />
            <div className="w-40 flex justify-between text-xs mt-1 text-gray-600">
              <span>Bad</span>
              <span>Great</span>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-gray-600 font-medium pb-3">
                Snow type
              </th>
              {temperatureList.map((temp) => (
                <th key={temp} className="text-center text-gray-600 font-medium pb-3 px-2">
                  {temp}°C
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.source}-${row.snowType}`}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="text-sm text-gray-500 py-2 pr-4 text-start">
                  {formatSourceLabel(row.source)} – {formatSnowTypeLabel(row.snowType)}
                </td>

                {temperatureList.map((temp) => {
                  const key = `${temp}___${row.source.toLowerCase()}___${row.snowType.toLowerCase()}`;
                  const item = performanceMap[key];
                  const category = (item?.category || 'unknown').toLowerCase();

                  // prefer using the numeric averageScore to pick a colour on the spectre,
                  // fall back to discrete category colours (unknown)
                  const bgColor =
                    item?.averageScore !== null && item?.averageScore !== undefined
                      ? scoreToHex(item.averageScore)
                      : categoryColors[category] || '#FFF';
                  const fgColor = getContrastColor(bgColor);

                  return (
                    <td key={temp} className="px-2 py-1 text-center">
                      {category !== 'unknown' ? (
                        <div
                          className="w-6 h-6 mx-auto rounded-full cursor-pointer transition-transform hover:scale-125 shadow-sm flex items-center justify-center text-xs font-semibold"
                          style={{
                            backgroundColor: bgColor,
                            color: fgColor,
                            // improve readability: subtle text-shadow for white text, small border for separation
                            textShadow: fgColor === '#fff' ? '0 1px 0 rgba(0,0,0,0.45)' : 'none',
                            border: fgColor === '#fff' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                          }}
                          onClick={(e) =>
                            handleCellClick(e, temp, row.source, row.snowType, category)
                          }
                        >
                          {item?.averageScore !== null && item?.averageScore !== undefined
                            ? (item.averageScore * 100).toFixed(0) / 10 // Show as 0.0–10.0, one decimal
                            : ''}
                        </div>
                      ) : (
                        <span className="text-sm">--</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Small-tests info */}
      {chartData.some((d) => d.total < 4) && (
        <div className="flex items-center bg-blue-50 text-blue-800 p-2 rounded-lg text-sm mt-4">
          <MdInfoOutline className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>
            {chartData.filter((d) => d.total < 4).length} tests are ignored. Tests with only two skis are ignored.
          </span>
        </div>
      )}

      {/* Popup */}
      {showPopup && popupData && (
        <>
          <Overlay isVisible={true} />
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 md:w-2/3 rounded-lg bg-white shadow-lg p-4 md:text-base text-sm transition-opacity duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-800">
              {popupData.temp}°C • {formatSourceLabel(popupData.source)} • {formatSnowTypeLabel(popupData.snowType)}
            </h3>
            <span className="block text-gray-600">
              Number of tests: {popupData.tests.length}
            </span>

            {/* Popup gradient scale: Bad ↔ Great */}
            <div className="my-3">
              <div
                className="w-full h-3 rounded-md"
                style={{ background: `linear-gradient(to right, ${lowHex}, ${highHex})` }}
              />
              <div className="w-full flex justify-between text-xs text-gray-600 mt-1">
                <span>Bad</span>
                <span>Great</span>
              </div>
            </div>

            <ul className="space-y-4 my-4">
              {popupData.tests
                .sort((a, b) => b.testDate - a.testDate)
                .map((test) => (
                  <li key={test.testId} className="flex bg-gray-50 p-2 rounded-lg flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">
                        {formatDate(new Date(test.testDate))}
                      </div>
                      <div className="text-sm text-gray-700">
                        Rank: {test.rank}/{test.total}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">{test.location}</div>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="xs"
                      onClick={() => router.push(`/results/${test.testId}`)}
                    >
                      Go to test
                    </Button>
                  </li>
                ))}
            </ul>

            <div className="mt-3 flex justify-end">
              <Button variant="secondary" size="xs" onClick={() => setShowPopup(false)}>
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default SkiConditionHeatmap;