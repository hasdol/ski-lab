'use client'
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import CombinedConditionsHeatmap from './CombinedConditionsHeatmap/CombinedConditionsHeatmap';
import PerformanceChart from './PerformanceChart/PerformanceChart';
import SelectSeason from './PerformanceChart/SelectSeason';
import { useAuth } from '@/context/AuthContext';
import GrindHistory from '@/components/GrindHistory/GrindHistory';
import { formatDate, getTimestamp, getSeason } from '@/helpers/helpers';
import useSkiTests from '@/hooks/useSkiTests';
import Button from '@/components/common/Button';

const SkiDetail = ({ ski, onDelete, onEdit, onArchive, onUnarchive }) => {
  const { t } = useTranslation();
  const { tests, loading: testsLoading, error: testsError } = useSkiTests(ski.id);

  // Chart data for THIS ski
  const [chartData, setChartData] = useState([]);
  // Season filter (performance chart only)
  const [selectedSeason, setSelectedSeason] = useState('');
  // For the performance chart's container width/scroll
  const [containerWidth, setContainerWidth] = useState('100%');
  const chartContainerRef = useRef(null);
  // Additional filters for performance chart
  const [selectedSnowType, setSelectedSnowType] = useState('');
  const [selectedTemperature, setSelectedTemperature] = useState('');
  // Toggle for the current grind and current season (heatmap only)
  const [showCurrentGrind, setShowCurrentGrind] = useState(false);
  const [showCurrentSeason, setShowCurrentSeason] = useState(false);

  // Define possible sources and snow types
  const allSources = ['natural', 'artificial', 'mix'];
  const allSnowTypes = [
    'fresh',
    'fine_grained',
    'coarse_grained',
    'wet',
    'icy_conditions',
    'sugary_snow'
  ];

  // Build list of all snow combos
  const allSnowCombos = useMemo(() => {
    const combos = [];
    allSources.forEach((source) => {
      allSnowTypes.forEach((grainType) => {
        combos.push({ source, grainType });
      });
    });
    return combos;
  }, [allSources, allSnowTypes]);

  // Convert average score to performance category
  const getPerformanceCategory = useCallback((avgScore) => {
    if (avgScore === null || avgScore === undefined) return 'Unknown';
    if (avgScore >= 0.85) return 'great';
    if (avgScore >= 0.65) return 'good';
    if (avgScore >= 0.45) return 'average';
    if (avgScore >= 0.25) return 'bad';
    return 'very_bad';
  }, []);

  // Handle season change for performance chart
  const handleSeasonChange = useCallback((event) => {
    setSelectedSeason(event.target.value);
  }, []);

  // Custom tooltip for performance chart
  const CustomTooltip = useCallback(
    ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="custom-tooltip bg-background p-5 border border-sbtn shadow-xl rounded">
            <p className='font-semibold text-lg mb-2'>{`${data.rank}/${data.total}`}</p>
            <p className='text-sm'>{`${t('temperature')}: ${data.temp}°C`}</p>
            <p className='text-sm'>{`${t('location')}: ${data.location}`}</p>
            <p className="text-sm">
              {t('snow_source')}: {t(data.snowSource)}
            </p>
            <p className="text-sm">
              {t('snow_type')}: {t(data.snowType)}
            </p>
            <p className="text-sm">{`${t('test_date')}: ${new Date(label).toLocaleDateString()}`}</p>
          </div>
        );
      }
      return null;
    },
    [t]
  );

  // Get unique temperatures from chartData
  const dynamicTemperatureList = useMemo(() => {
    const temps = [...new Set(chartData.map((data) => data.temp))];
    return temps.sort((a, b) => a - b);
  }, [chartData]);

  // Filter chartData for performance chart based on selected season and additional filters
  const filteredChartData = useMemo(() => {
    return chartData.filter((data) => {
      const season = getSeason(data.testDate);
      const matchSeason = selectedSeason ? season === selectedSeason : true;
      const matchSnowType = selectedSnowType ? data.snowType === selectedSnowType : true;
      const matchTemp = selectedTemperature ? data.temp <= selectedTemperature : true;
      return matchSeason && matchSnowType && matchTemp;
    });
  }, [chartData, selectedSeason, selectedSnowType, selectedTemperature]);

  // Filter for heatmap: Use current grind and current season toggles
  const heatmapChartData = useMemo(() => {
    let filtered = chartData;
    if (showCurrentGrind) {
      const grindTs = getTimestamp(ski.grindDate);
      if (grindTs) {
        filtered = filtered.filter((d) => d.testDate >= grindTs);
      }
    }
    if (showCurrentSeason) {
      const now = Date.now();
      const currentSeason = getSeason(now);
      filtered = filtered.filter((d) => getSeason(d.testDate) === currentSeason);
    }
    return filtered;
  }, [chartData, showCurrentGrind, showCurrentSeason, ski.grindDate]);

  // Build combined performance data for heatmap
  const combinedPerformanceData = useMemo(() => {
    const performanceMap = {};
    dynamicTemperatureList.forEach((temp) => {
      allSnowCombos.forEach(({ source, grainType }) => {
        const key = `${temp}___${source}___${grainType}`;
        performanceMap[key] = {
          temperature: temp,
          source,
          snowType: grainType,
          sumWeightedScore: 0,
          sumWeights: 0,
          testCount: 0,
        };
      });
    });
    heatmapChartData.forEach((data) => {
      if (data.total < 4) return;
      const temp = data.temp;
      const source = data.snowSource.toLowerCase();
      const grainType = data.snowType.toLowerCase();
      const key = `${temp}___${source}___${grainType}`;
      if (performanceMap[key]) {
        performanceMap[key].sumWeightedScore += data.score * data.total;
        performanceMap[key].sumWeights += data.total;
        performanceMap[key].testCount += 1;
      }
    });
    return Object.values(performanceMap).map((item) => {
      if (item.sumWeights > 0) {
        const averageScore = item.sumWeightedScore / item.sumWeights;
        return {
          temperature: item.temperature,
          source: item.source,
          snowType: item.snowType,
          averageScore,
          category: getPerformanceCategory(averageScore),
          count: item.testCount
        };
      } else {
        return {
          temperature: item.temperature,
          source: item.source,
          snowType: item.snowType,
          averageScore: null,
          category: 'Unknown',
          count: 0
        };
      }
    });
  }, [heatmapChartData, dynamicTemperatureList, allSnowCombos, getPerformanceCategory]);

  const grindHistory = ski.grindHistory || [];

  // Filter grind history by selected season
  const filteredGrindHistory = useMemo(() => {
    if (!selectedSeason) return grindHistory;
    return grindHistory.filter((entry) => {
      const grindDateTimestamp = getTimestamp(entry.grindDate);
      if (!grindDateTimestamp) return false;
      const season = getSeason(grindDateTimestamp);
      return season === selectedSeason;
    });
  }, [selectedSeason, grindHistory]);

  // Combine test and grind dates
  const allDates = useMemo(() => [
    ...chartData.map((d) => d.testDate),
    ...filteredGrindHistory.map((d) => getTimestamp(d.grindDate)).filter(Boolean)
  ], [chartData, filteredGrindHistory]);

  const seasonMinDate = useMemo(() => (allDates.length ? Math.min(...allDates) : null), [allDates]);
  const seasonMaxDate = useMemo(() => (allDates.length ? Math.max(...allDates) : null), [allDates]);
  const maxRank = useMemo(() => (chartData.length ? Math.max(...chartData.map((d) => d.rank)) : 1), [chartData]);

  // Process test data and build chartData using the tests fetched by the hook
  useEffect(() => {
    const processData = () => {
      if (!tests || tests.length === 0) {
        setChartData([]);
        return;
      }
      const allRankings = [];
      tests.forEach((test) => {
        const sorted = [...test.rankings].sort((a, b) => a.score - b.score);
        let currentRank = 1;
        let i = 0;
        const computeRelativeScore = (rank, total) =>
          total <= 1 ? 1 : 1 - (rank - 1) / (total - 1);
        while (i < sorted.length) {
          const currentScore = sorted[i].score;
          const tiedGroup = [sorted[i]];
          let j = i + 1;
          while (j < sorted.length && sorted[j].score === currentScore) {
            tiedGroup.push(sorted[j]);
            j++;
          }
          const tiedCount = tiedGroup.length;
          const relScore = computeRelativeScore(currentRank, sorted.length);
          tiedGroup.forEach((r) => {
            allRankings.push({
              ...r,
              rank: currentRank,
              score: relScore,
              numberOfSkiesInTest: sorted.length,
              testDate: getTimestamp(test.timestamp),
              location: test.location,
              temp: test.temperature || 0,
              snowType: test.snowCondition?.grainType || '',
              snowSource: test.snowCondition?.source || ''
            });
          });
          currentRank += tiedCount;
          i = j;
        }
      });
      const mySki = allRankings.filter((r) => r.skiId === ski.id);
      mySki.sort((a, b) => a.testDate - b.testDate);
      const finalData = mySki.map((r) => ({
        testDate: r.testDate,
        rank: r.rank,
        score: r.score,
        total: r.numberOfSkiesInTest,
        location: r.location,
        temp: r.temp,
        snowType: r.snowType,
        snowSource: r.snowSource
      }));
      setChartData(finalData);
      if (finalData.length > 0) {
        const latestTimestamp = Math.max(...finalData.map((d) => d.testDate));
        const latestSeason = getSeason(latestTimestamp);
        setSelectedSeason(latestSeason);
      }
    };
    processData();
  }, [tests, testsLoading, ski.id]);

  // Adjust container width for performance chart
  useEffect(() => {
    const updateContainer = () => {
      if (!chartContainerRef.current) return;
      if (selectedSeason) {
        setContainerWidth('100%');
        chartContainerRef.current.scrollLeft = 0;
      } else {
        setContainerWidth('200%');
        setTimeout(() => {
          if (chartContainerRef.current) {
            chartContainerRef.current.scrollLeft = chartContainerRef.current.scrollWidth;
          }
        }, 400);
      }
    };
    const timer = setTimeout(updateContainer, 0);
    return () => clearTimeout(timer);
  }, [chartData, selectedSeason]);

  // Get available seasons from chartData and grind history
  const availableSeasons = useMemo(() => {
    const seasons = new Set();
    chartData.forEach((d) => {
      const season = getSeason(d.testDate);
      if (season) seasons.add(season);
    });
    grindHistory.forEach((item) => {
      const ts = getTimestamp(item.grindDate);
      if (ts) {
        const season = getSeason(ts);
        if (season) seasons.add(season);
      }
    });
    return Array.from(seasons).sort((a, b) => {
      const getSortKey = (season) => {
        if (season.startsWith('Summer')) {
          const year = parseInt(season.split(' ')[1], 10);
          return `${year}-S`;
        } else {
          const [start] = season.split('-').map(Number);
          return `${start}-W`;
        }
      };
      return getSortKey(a).localeCompare(getSortKey(b));
    });
  }, [chartData, grindHistory]);

  return (
    <div className="max-w-4xl mx-auto pb-2 mt-2 shadow-md border border-gray-300 rounded-md animate-fade-down animate-duration-300 relative">
      <div className="bg-white rounded-md p-4 md:p-5">
        {/* Ski Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 border-b pb-6">


          {/* Rest of the ski info items */}
          <div className="space-y-1">
            <label className="text-sm text-gray-500">{t('brand')}</label>
            <p className="font-semibold text-gray-800">{ski.brand || "--"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-500">{t('model')}</label>
            <p className="font-semibold text-gray-800">{ski.model || "--"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-500">{t('length')}</label>
            <p className="font-semibold text-gray-800">{ski.length || "--"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-500">{t('stiffness')}</label>
            <p className="font-semibold text-gray-800">{ski.stiffness || "--"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-500">Base</label>
            <p className="font-semibold text-gray-800">{ski.base || "--"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-500">{t('construction')}</label>
            <p className="font-semibold text-gray-800">{ski.construction || "--"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-500">{t('grind_date')}</label>
            <p className="font-semibold text-gray-800">{formatDate(ski.grindDate)}</p>
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-sm text-gray-500">{t('comment')}</label>
            <p className="font-semibold text-gray-800">{ski.comment || "--"}</p>
          </div>
        </div>

        {/* Performance Chart Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2 md:mb-0">
              {t('performance')}
            </h2>
            {tests && tests.length > 0 && (
              <SelectSeason
                selectedSeason={selectedSeason}
                handleSeasonChange={handleSeasonChange}
                availableSeasons={availableSeasons}
              />
            )}
          </div>

          {tests && tests.length > 0 ? (
            !chartData.length ? (
              <div className="text-center text-gray-500 py-4">
                {t('test_to_see_performance')}
              </div>
            ) : (
              <PerformanceChart
                ref={chartContainerRef}
                data={filteredChartData}
                filteredGrindHistory={filteredGrindHistory}
                selectedSeason={selectedSeason}
                minDate={seasonMinDate}
                maxDate={seasonMaxDate}
                maxRank={maxRank}
                CustomTooltip={CustomTooltip}
                containerWidth={containerWidth}
              />
            )
          ) : (
            <div className="text-center text-gray-500 py-4">
              {t('no_tests')}
            </div>
          )}
        </div>

        {/* Recommended Conditions Section */}
        <div className="mb-8">
          <div className="flex flex-col justify-between space-y-2">
            <h2 className="text-xl font-semibold text-gray-800">
              {t('recommended_conditions')}
            </h2>
            <div className="flex gap-4">
              {ski.grindDate && (
                <label className="flex items-center space-x-2">
                  <input
                    className="h-4 w-4 accent-blue-600"
                    type="checkbox"
                    checked={showCurrentGrind}
                    onChange={(e) => setShowCurrentGrind(e.target.checked)}
                  />
                  <span className="text-sm">{t('current_grind')}</span>
                </label>
              )}
              <label className="flex items-center space-x-2">
                <input
                  className="h-4 w-4 accent-blue-600"
                  type="checkbox"
                  checked={showCurrentSeason}
                  onChange={(e) => setShowCurrentSeason(e.target.checked)}
                />
                <span className="text-sm">{t('current_season')}</span>
              </label>
            </div>
          </div>

          {tests && tests.length > 0 ? (
            combinedPerformanceData?.length > 0 ? (
              <CombinedConditionsHeatmap
                temperatureList={dynamicTemperatureList}
                allSnowCombos={allSnowCombos}
                combinedPerformanceData={combinedPerformanceData}
                chartData={heatmapChartData}
              />
            ) : (
              <div className="text-center text-gray-500 py-4">
                {t('no_tests')}
              </div>
            )
          ) : (
            <div className="text-center text-gray-500 py-4">
              {t('no_tests')}
            </div>
          )}
        </div>

        {/* Grind History Section */}
        <GrindHistory grindHistory={grindHistory} />
        {/* Action Buttons - Now inside the grid */}
        <div className="col-span-2 md:col-span-3 flex space-x-2 mb-2">
          <Button
            onClick={onEdit}
            variant="secondary"
            className='text-xs py-1 px-3'
          >
            {t('edit')}
          </Button>
          {ski.archived ? (
            <Button
              onClick={onUnarchive}
              variant="primary"
              className='text-xs py-1 px-3'
            >
              {t('unarchive')}
            </Button>
          ) : (
            <Button
              onClick={onArchive}
              variant="primary"
              className='text-xs py-1 px-3'
            >
              {t('archive')}
            </Button>
          )}
          <Button
            onClick={onDelete}
            variant="danger"
            className='text-xs py-1 px-3'
          >
            {t('delete')}
          </Button>
        </div>

      </div>
    </div>
  );
};

export default SkiDetail;
