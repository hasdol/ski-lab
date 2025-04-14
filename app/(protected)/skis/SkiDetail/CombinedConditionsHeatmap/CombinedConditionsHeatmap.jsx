import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdInfoOutline } from "react-icons/md";

const CombinedConditionsHeatmap = ({
  temperatureList,
  allSnowCombos,
  combinedPerformanceData,
  chartData,
}) => {
  const { t } = useTranslation();

  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);

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

  // 1) Group the raw chart data by "temp___source___snowType" for the test popup
  const groupedChartData = useMemo(() => {
    const map = {};
    chartData.forEach((test) => {
      const key = `${test.temp}___${test.snowSource.toLowerCase()}___${test.snowType.toLowerCase()}`;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(test);
    });
    return map;
  }, [chartData]);

  // 2) Convert combinedPerformanceData to a map for quick lookups (heatmap cells)
  const performanceMap = useMemo(() => {
    const map = {};
    combinedPerformanceData.forEach((item) => {
      const key = `${item.temperature}___${item.source.toLowerCase()}___${item.snowType.toLowerCase()}`;
      map[key] = item;
    });
    return map;
  }, [combinedPerformanceData]);

  // 3) Count how many *non-unknown* dots are in each category (natural/artif./mix)
  //    (i.e. how many items have `category !== 'Unknown'`).
  const categoryDotCounts = useMemo(() => {
    // Start at 0 for each tab
    const counts = {
      natural: 0,
      artificial: 0,
      mix: 0
    };
    combinedPerformanceData.forEach((item) => {
      if (item.category.toLowerCase() !== 'unknown') {
        const src = item.source.toLowerCase(); // "natural", "artificial", or "mix"
        if (counts[src] !== undefined) {
          counts[src]++;
        }
      }
    });
    return counts;
  }, [combinedPerformanceData]);

  // Filter combos based on activeTab
  const filteredRows = useMemo(() => {
    return allSnowCombos.filter(
      (combo) => combo.source.toLowerCase() === activeTab
    );
  }, [allSnowCombos, activeTab]);

  // Each row is { source, snowType }
  const rows = useMemo(() => {
    return filteredRows.map((combo) => ({
      source: combo.source,
      snowType: combo.grainType,
    }));
  }, [filteredRows]);

  // Handle cell click → popup
  const handleCellClick = (temp, source, grainType, category) => {
    if (category.toLowerCase() === 'unknown') {
      return;
    }
    const key = `${temp}___${source.toLowerCase()}___${grainType.toLowerCase()}`;
    const tests = groupedChartData[key] || [];
    setPopupData({ tests, temp, source, grainType });
    setShowPopup(true);
  };

  return (
    <div className="relative overflow-x-auto overflow-y-hidden pb-2">
      <div className='flex flex-col md:flex-row md:justify-between'>
        {/* Tabs with counts */}
        <div className="flex space-x-2 mb-2">
          <button
            className={`px-4 py-2 rounded-t h-fit focus:outline-none ${activeTab === 'natural' ? 'bg-btn text-btntxt' : 'bg-sbtn shadow'
              }`}
            onClick={() => setActiveTab('natural')}
          >
            {/* Show “Natural” plus the count in parentheses */}
            {t('natural')}
            {!!categoryDotCounts.natural && (
              <span className="ml-1">({categoryDotCounts.natural})</span>
            )}
          </button>
          <button
            className={`px-4 py-2 rounded-t h-fit focus:outline-none ${activeTab === 'artificial' ? 'bg-btn text-btntxt' : 'bg-sbtn shadow'
              }`}
            onClick={() => setActiveTab('artificial')}
          >
            {t('artificial')}
            {!!categoryDotCounts.artificial && (
              <span className="ml-1">({categoryDotCounts.artificial})</span>
            )}
          </button>
          <button
            className={`px-4 py-2 rounded-t h-fit focus:outline-none ${activeTab === 'mix' ? 'bg-btn text-btntxt' : 'bg-sbtn shadow'
              }`}
            onClick={() => setActiveTab('mix')}
          >
            {t('mix')}
            {!!categoryDotCounts.mix && (
              <span className="ml-1">({categoryDotCounts.mix})</span>
            )}
          </button>
        </div>

        {/* Info about small tests if any */}
        {chartData.some((d) => d.total < 4) && (
          <div className="text-sm h-fit my-4 md:my-0 font-semibold flex md:w-fit">
            <MdInfoOutline size={20} />
            <span className='mx-1 font-semibold'>
              {chartData.filter((d) => d.total < 4).length}
            </span>
            {t('small_tests_ignored_in_heatmap')}
          </div>
        )}
      </div>

      {/* The Heatmap */}
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="text-left font-semibold">{t('snow_type')}</th>
            {temperatureList.map((temp, index) => (
              <th key={index} className="text-center font-semibold">
                {temp}°C
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const rowLabel = `${t(row.source)} – ${t(row.snowType)}`;
            return (
              <tr key={rowIndex}>
                <td className="text-sm">{rowLabel}</td>
                {temperatureList.map((temp, colIndex) => {
                  const perfKey = `${temp}___${row.source}___${row.snowType}`;
                  const item = performanceMap[perfKey];
                  const category = item?.category?.toLowerCase() || 'unknown';
                  const bgColor = categoryColors[category] || '#FFFFFF';

                  return (
                    <td key={colIndex} className="px-2 py-1 text-center">
                      {category !== 'unknown' ? (
                        <div
                          className="w-5 h-5 mx-auto rounded-full cursor-pointer transition-all hover:scale-110"
                          style={{ backgroundColor: bgColor }}
                          title={t(category)}
                          onClick={() =>
                            handleCellClick(temp, row.source, row.snowType, category)
                          }
                        />
                      ) : (
                        <span className="text-sm">--</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="grid grid-cols-3 mt-4 gap-y-2">
        {Object.entries(categoryColors).map(([cat, color]) => (
          <div key={cat} className="flex items-center space-x-1">
            {cat === 'unknown' ? (
              <span className='w-4 h-4 flex items-center justify-center'>--</span>
            ) : (
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
            <span className="text-sm">{t(cat)}</span>
          </div>
        ))}
      </div>

      {/* Popup with the tests that generated this cell */}
      {showPopup && popupData && (
        <div className="flex flex-col  animate-fade animate-duration-300 p-4 mt-4 border border-gray-300 rounded">
          <h3 className="font-semibold text-lg mb-2 text-center">
            {`${popupData.temp}°C, ${t(popupData.source)} – ${t(popupData.grainType)}`}
          </h3>
          {popupData.tests.length > 0 ? (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 max-h-64 overflow-auto py-2">
              {[...popupData.tests]
                .sort((a, b) => b.testDate - a.testDate)
                .map((test, idx) => (
                  <li key={idx} className="bg-background border border-gray-300 p-4 space-y-1 rounded">
                    <div className="text-sm">
                      <strong>{t('test_date')}:</strong>{' '}
                      {new Date(test.testDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm">
                      <strong>{t('rank')}:</strong> {test.rank}/{test.total}
                    </div>
                    <div className="text-sm">
                      <strong>{t('location')}:</strong> {test.location}
                    </div>
                    <div className="text-sm">
                      <strong>{t('temperature')}:</strong> {test.temp}°C
                    </div>
                    <div className="text-sm">
                      <strong>{t('snow_source')}:</strong> {t(test.snowSource)}
                    </div>
                    <div className="text-sm">
                      <strong>{t('snow_type')}:</strong> {t(test.snowType)}
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <p>{t('no_tests_for_this_condition')}</p>
          )}
          <div className="text-right mt-4">
            <button
              className="px-4 py-2 bg-sbtn text-text rounded hover:opacity-90"
              onClick={() => setShowPopup(false)}
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CombinedConditionsHeatmap;
