import React, { useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { MdInfoOutline } from 'react-icons/md';
import { formatSnowTypeLabel, formatSourceLabel, formatDate } from '@/helpers/helpers';
import Overlay from '@/components/ui/Overlay';

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

  // Color scale by category
  const categoryColors = {
    great: 'var(--color-great)',
    good: 'var(--color-good)',
    average: 'var(--color-average)',
    bad: 'var(--color-bad)',
    very_bad: 'var(--color-veryBad)',
    unknown: '#BDC3C7',
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
    const tests = groupedChartData[key] || [];

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
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                isActive
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
        {[
          { key: 'great', label: 'Great' },
          { key: 'good', label: 'Good' },
          { key: 'average', label: 'Average' },
          { key: 'bad', label: 'Bad' },
          { key: 'very_bad', label: 'Very Bad' },
          { key: 'unknown', label: 'Unknown' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: categoryColors[key] }}
            />
            <span className="text-sm text-gray-700 whitespace-nowrap">{label}</span>
          </div>
        ))}
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
                  const bgColor = categoryColors[category] || '#FFF';
                  return (
                    <td key={temp} className="px-2 py-1 text-center">
                      {category !== 'unknown' ? (
                        <div
                          className="w-6 h-6 mx-auto rounded-full cursor-pointer transition-transform hover:scale-125 shadow-sm"
                          style={{ backgroundColor: bgColor }}
                          onClick={(e) =>
                            handleCellClick(e, temp, row.source, row.snowType, category)
                          }
                        />
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
          <div
            className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 md:w-2/3 rounded-lg bg-white shadow-lg p-4 md:text-base text-sm transition-opacity duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-800">
              {popupData.temp}°C • {formatSourceLabel(popupData.source)} • {formatSnowTypeLabel(popupData.snowType)}
            </h3>
            <span className="block text-gray-600">
              Number of tests: {popupData.tests.length}
            </span>

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
          </div>
        </>
      )}
    </div>
  );
};

export default SkiConditionHeatmap;