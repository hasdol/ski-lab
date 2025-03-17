'use client'
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback
} from 'react';
import { useTranslation } from 'react-i18next';
import CombinedConditionsHeatmap from './CombinedConditionsHeatmap/CombinedConditionsHeatmap';
import PerformanceChart from './PerformanceChart/PerformanceChart';
import SelectSeason from './PerformanceChart/SelectSeason';
import { RiInboxArchiveLine, RiInboxUnarchiveLine, RiEditLine, RiDeleteBinLine, RiCloseLine } from "react-icons/ri";

import { getSkiTests } from '@/lib/firebase/firestoreFunctions';
import { useAuth } from '@/context/AuthContext';
import GrindHistory from '@/components/GrindHistory/GrindHistory';
import { formatDate, getTimestamp, getSeason } from '@/helpers/helpers';

const SkiDetail = ({ ski, onDelete, onArchive, onUnarchive }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Chart data for THIS ski
  const [chartData, setChartData] = useState([]);
  // Season filter (performance chart only)
  const [selectedSeason, setSelectedSeason] = useState('');
  // For the performance chart's container width/scroll
  const [containerWidth, setContainerWidth] = useState('100%');
  const chartContainerRef = useRef(null);
  // Cache for test results (key = testId)
  const [testResultsCache, setTestResultsCache] = useState({});
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

  // Bygg en liste med alle kombinasjoner av source og snowType
  const allSnowCombos = useMemo(() => {
    const combos = [];
    allSources.forEach((source) => {
      allSnowTypes.forEach((grainType) => {
        combos.push({ source, grainType });
      });
    });
    return combos;
  }, [allSources, allSnowTypes]);

  // Konverterer et gjennomsnittlig score til en kategorietikett
  const getPerformanceCategory = useCallback((avgScore) => {
    if (avgScore === null || avgScore === undefined) return 'Unknown';
    if (avgScore >= 0.85) return 'great';
    if (avgScore >= 0.65) return 'good';
    if (avgScore >= 0.45) return 'average';
    if (avgScore >= 0.25) return 'bad';
    return 'very_bad';
  }, []);

  // Håndter sesongendring for performance chart
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

  // Hent unike temperaturer fra chartData
  const dynamicTemperatureList = useMemo(() => {
    const temps = [...new Set(chartData.map((data) => data.temp))];
    return temps.sort((a, b) => a - b);
  }, [chartData]);

  // Filter chartData for performance chart basert på valgt sesong og ekstra filtre
  const filteredChartData = useMemo(() => {
    return chartData.filter((data) => {
      const season = getSeason(data.testDate);
      const matchSeason = selectedSeason ? season === selectedSeason : true;
      const matchSnowType = selectedSnowType ? data.snowType === selectedSnowType : true;
      const matchTemp = selectedTemperature ? data.temp <= selectedTemperature : true;
      return matchSeason && matchSnowType && matchTemp;
    });
  }, [chartData, selectedSeason, selectedSnowType, selectedTemperature]);

  // Filter for heatmap: Bruk current grind og current season
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

  // Bygg samlet performance data for heatmap
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

  // Filter grind history etter valgt sesong
  const filteredGrindHistory = useMemo(() => {
    if (!selectedSeason) return grindHistory;
    return grindHistory.filter((entry) => {
      const grindDateTimestamp = getTimestamp(entry.grindDate);
      if (!grindDateTimestamp) return false;
      const season = getSeason(grindDateTimestamp);
      return season === selectedSeason;
    });
  }, [selectedSeason, grindHistory]);

  // Kombiner test- og grind-datoer
  const allDates = useMemo(() => [
    ...chartData.map((d) => d.testDate),
    ...filteredGrindHistory.map((d) => getTimestamp(d.grindDate)).filter(Boolean)
  ], [chartData, filteredGrindHistory]);

  const seasonMinDate = useMemo(() => (allDates.length ? Math.min(...allDates) : null), [allDates]);
  const seasonMaxDate = useMemo(() => (allDates.length ? Math.max(...allDates) : null), [allDates]);
  const maxRank = useMemo(() => (chartData.length ? Math.max(...chartData.map((d) => d.rank)) : 1), [chartData]);

  // Hent testdata fra Firestore
  useEffect(() => {
    const fetchTests = async () => {
      if (!ski.testIds || ski.testIds.length === 0) return;
      const uncached = ski.testIds.filter((id) => !testResultsCache[id]);
      if (uncached.length === 0) return;
      try {
        const fetched = await getSkiTests(user.uid, uncached);
        setTestResultsCache((prev) => {
          const newCache = { ...prev };
          fetched.forEach((test) => {
            newCache[test.id] = test;
          });
          return newCache;
        });
      } catch (err) {
        console.error('Error fetching ski tests:', err);
      }
    };
    fetchTests();
  }, [ski.testIds, testResultsCache, user.uid]);

  // Prosesser testdata og bygg chartData
  useEffect(() => {
    const processData = () => {
      if (!ski.testIds || ski.testIds.length === 0) {
        setChartData([]);
        return;
      }
      const allAvailable = ski.testIds.every((id) => testResultsCache[id]);
      if (!allAvailable) return;
      const allTests = ski.testIds.map((id) => testResultsCache[id]).filter(Boolean);
      const allRankings = [];
      allTests.forEach((test) => {
        const sorted = [...test.rankings].sort((a, b) => a.score - b.score);
        let currentRank = 1;
        let i = 0;
        const computeRelativeScore = (rank, total) => total <= 1 ? 1 : 1 - (rank - 1) / (total - 1);
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
  }, [testResultsCache, ski.testIds, ski.id]);

  // Juster container-bredde for performance chart
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

  // Hent tilgjengelige sesonger fra chartData og grind history
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
    <div className="px-3 pb-4 animate-fade-down animate-duration-300">
      {/* Ski Info */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm" htmlFor="brand">{t('brand')}</label>
          <p className="font-semibold">{ski.brand || "--"}</p>
        </div>
        <div>
          <label className="text-sm" htmlFor="model">{t('model')}</label>
          <p className="font-semibold">{ski.model || "--"}</p>
        </div>
        <div>
          <label className="text-sm" htmlFor="length">{t('length')}</label>
          <p className="font-semibold">{ski.length || "--"}</p>
        </div>
        <div>
          <label className="text-sm" htmlFor="stiffness">{t('stiffness')}</label>
          <p className="font-semibold">{ski.stiffness || "--"}</p>
        </div>
        <div>
          <label className="text-sm" htmlFor="base">Base</label>
          <p className="font-semibold">{ski.base || "--"}</p>
        </div>
        <div>
          <label className="text-sm" htmlFor="construction">{t('construction')}</label>
          <p className="font-semibold">{ski.construction || "--"}</p>
        </div>
        <div>
          <label className="text-sm" htmlFor="grind_date">{t('grind_date')}</label>
          <p className="font-semibold">{formatDate(ski.grindDate)}</p>
        </div>
        <div>
          <label className="text-sm" htmlFor="comment">{t('comment')}</label>
          <p className="font-semibold">{ski.comment || "--"}</p>
        </div>
      </div>

      {/* Performance Chart Section */}
      <div>
        <div className="flex justify-between items-center my-5">
          <h2 className="text-2xl font-semibold">{t('performance')}</h2>
          {ski.testIds && ski.testIds.length > 0 && (
            <SelectSeason
              selectedSeason={selectedSeason}
              handleSeasonChange={handleSeasonChange}
              availableSeasons={availableSeasons}
            />
          )}
        </div>
        {ski.testIds && ski.testIds.length > 0 ? (
          !chartData.length ? (
            <span>{t('test_to_see_performance')}</span>
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
          <i>{t('no_tests')}</i>
        )}
      </div>

      {/* Recommended Conditions Section (Heatmap) */}
      <div>
        <h2 className="text-2xl my-4 font-semibold">{t('recommended_conditions')}</h2>
        {ski.testIds && ski.testIds.length > 0 ? (
          combinedPerformanceData && combinedPerformanceData.length > 0 ? (
            <div className="flex flex-col">
              <div className="flex space-x-4">
                {ski.grindDate && (
                  <div className="mb-4">
                    <label className="inline-flex items-center space-x-2">
                      <input
                        className="h-5 w-5 accent-btn"
                        type="checkbox"
                        checked={showCurrentGrind}
                        onChange={(e) => setShowCurrentGrind(e.target.checked)}
                      />
                      <span>{t('current_grind')}</span>
                    </label>
                  </div>
                )}
                <div className="mb-4">
                  <label className="inline-flex items-center space-x-2">
                    <input
                      className="h-5 w-5 accent-btn"
                      type="checkbox"
                      checked={showCurrentSeason}
                      onChange={(e) => setShowCurrentSeason(e.target.checked)}
                    />
                    <span>{t('current_season')}</span>
                  </label>
                </div>
              </div>
              <CombinedConditionsHeatmap
                temperatureList={dynamicTemperatureList}
                allSnowCombos={allSnowCombos}
                combinedPerformanceData={combinedPerformanceData}
                chartData={heatmapChartData}
              />
            </div>
          ) : (
            <i>{t('no_tests')}</i>
          )
        ) : (
          <i>{t('no_tests')}</i>
        )}
      </div>

      {/* Grind History Section */}
      <GrindHistory grindHistory={grindHistory} />

      {/* Action Buttons */}
      <div className="flex bg-sbtn py-5 mt-5 rounded items-center justify-center space-x-10 w-full ">
        {ski.archived ? (
          <div className="flex flex-col space-y-2 items-center justify-center">
            <button
              onClick={onUnarchive}
              className="bg-btn text-btntxt hover:opacity-90 rounded-full p-3 cursor-pointer"
            >
              <RiInboxUnarchiveLine />
            </button>
            <label className="text-sm" htmlFor="unarchive">{t('unarchive')}</label>
          </div>
        ) : (
          <div className="flex flex-col space-y-2 items-center justify-center">
            <button
              onClick={onArchive}
              className="bg-btn text-btntxt hover:opacity-90 rounded-full p-3 cursor-pointer"
            >
              <RiInboxArchiveLine />
            </button>
            <label className="text-sm" htmlFor="archive">{t('archive')}</label>
          </div>
        )}
        <div className="flex flex-col space-y-2 items-center justify-center">
          <button
            onClick={onDelete}
            className="bg-btn text-btntxt hover:opacity-90 rounded-full p-3 cursor-pointer"
          >
            <RiDeleteBinLine />
          </button>
          <label className="text-sm" htmlFor="delete">{t('delete')}</label>
        </div>
      </div>
    </div>
  );
};

export default SkiDetail;
