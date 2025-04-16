import Button from '@/components/common/Button';
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
    <div className="relative bg-white rounded-md mt-5">
      <div className='flex flex-col md:flex-row md:justify-between mb-4'>
        {/* Tabs with counts */}
        <div className="flex space-x-2 overflow-x-auto pb-3 md:mb-0">
          {['natural', 'artificial', 'mix'].map((tab) => (
            <Button
              key={tab}
              variant={`${activeTab === tab ? 'primary' : 'secondary'}`}
              onClick={() => setActiveTab(tab)}
              className='text-xs'
            >
              {t(tab)}
              {!!categoryDotCounts[tab] && (
                <span className="ml-1 opacity-90">({categoryDotCounts[tab]})</span>
              )}
            </Button>
          ))}
        </div>

        {/* Info about small tests */}
        {chartData.some((d) => d.total < 4) && (
          <div className="flex items-center bg-blue-50 text-blue-800 px-4 py-2 rounded-md text-sm">
            <MdInfoOutline className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>
              {chartData.filter((d) => d.total < 4).length} {t('small_tests_ignored_in_heatmap')}
            </span>
          </div>
        )}
      </div>

      {/* The Heatmap */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-gray-600 font-medium pb-3">{t('snow_type')}</th>
              {temperatureList.map((temp, index) => (
                <th key={index} className="text-center text-gray-600 font-medium pb-3 px-2">
                  {temp}°C
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const rowLabel = `${t(row.source)} – ${t(row.snowType)}`;
              return (
                <tr key={rowIndex} className="border-b border-gray-100 last:border-0">
                  <td className="text-sm text-gray-500 py-2 pr-4">{rowLabel}</td>
                  {temperatureList.map((temp, colIndex) => {
                    const perfKey = `${temp}___${row.source}___${row.snowType}`;
                    const item = performanceMap[perfKey];
                    const category = item?.category?.toLowerCase() || 'unknown';
                    const bgColor = categoryColors[category] || '#FFFFFF';

                    return (
                      <td key={colIndex} className="px-2 py-1 text-center">
                        {category !== 'unknown' ? (
                          <div
                            className="w-6 h-6 mx-auto rounded-full cursor-pointer transition-all 
                            hover:scale-125 shadow-sm"
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
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6">
        {Object.entries(categoryColors).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-2">
            {cat === 'unknown' ? (
              <span className="w-5 h-5 flex items-center justify-center text-gray-400">--</span>
            ) : (
              <span
                className="w-5 h-5 rounded-full shadow-sm"
                style={{ backgroundColor: color }}
              />
            )}
            <span className="text-sm text-gray-600">{t(cat)}</span>
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
            <Button
              onClick={() => setShowPopup(false)}
              variant='secondary'
              className='text-xs'
            >
              {t('close')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CombinedConditionsHeatmap;
