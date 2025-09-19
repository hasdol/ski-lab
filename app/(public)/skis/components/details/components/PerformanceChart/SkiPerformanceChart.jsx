'use client';
import React, {
  useMemo,
  forwardRef,
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { formatDate, formatSnowTypeLabel, formatSourceLabel, getTimestamp } from '@/helpers/helpers';
import Button from '@/components/ui/Button';
import Overlay from '@/components/ui/Overlay';
import { motion } from 'framer-motion';
import { MdInfoOutline } from 'react-icons/md';
import { MdScreenRotation } from 'react-icons/md'; // add

const useChartTooltip = () => {
  const [activePoint, setActivePoint] = useState(null);
  const show = useCallback((point) => setActivePoint(point), []);
  const hide = useCallback(() => setActivePoint(null), []);
  return { activePoint, show, hide };
};

const ClickableDot = ({
  cx,
  cy,
  payload,
  index,
  showTooltip,
  hoveredIndex,
  setHoveredIndex,
}) => {
  if (cx == null || cy == null) return null;

  const isHovered = hoveredIndex === index;
  const radius = isHovered ? 9 : 6;

  const openTooltip = (e) => {
    e.stopPropagation();
    showTooltip({ payload, cx, cy });
  };

  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      className="fill-[var(--color-line)] stroke-white stroke-2 cursor-pointer touch-manipulation transition-all duration-150"
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      onClick={openTooltip}
      onTouchStart={(e) => {
        setHoveredIndex(index);
        openTooltip(e);
      }}
    />
  );
};

const FloatingTooltip = ({ point, hideTooltip }) => {
  const router = useRouter();

  const {
    rank,
    testDate,
    testId,
    location,
    temp,
    snowType,
    snowSource,
    total: payloadTotal,
    numberOfSkiesInTest,
    score: relativeScore,
  } = point.payload;

  const total =
    payloadTotal ?? numberOfSkiesInTest ?? point.payload.totalSkis ?? null;

  const rows = [
    { key: 'Location', value: location },
    { key: 'Temperature', value: temp },
    { key: 'Snow type', value: formatSnowTypeLabel(snowType) },
    { key: 'Snow source', value: formatSourceLabel(snowSource) },
  ].filter(({ value }) => value !== undefined && value !== null && value !== '');

  return (
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 md:w-2/3 rounded-lg bg-white shadow-lg p-4 text-sm transition-opacity duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="font-semibold mb-2 flex justify-between text-gray-800">
        <span>Position: {rank}{total ? `/${total}` : ''}</span>
        <span className="text-gray-600">{formatDate(testDate)}</span>
      </div>

      {relativeScore !== undefined && relativeScore !== null && (
        <div className="mb-2">
          <div className="text-xs text-gray-500">Relative score</div>
          <div className="text-lg font-semibold">{Number(relativeScore).toFixed(1)} / 10</div>
        </div>
      )}

      {rows.map(({ key, value }) => (
        <div key={key} className="flex justify-between mb-1 text-gray-700">
          <span className="mr-2">{key}</span>
          <span className="font-medium">{String(value)}</span>
        </div>
      ))}

      <div className="mt-3 flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={hideTooltip}>
          Close
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={() => router.push(`/results/${testId}`)}
        >
          Go to test
        </Button>
      </div>
    </motion.div>
  );
};

const PerformanceChart = forwardRef(
  (
    {
      data,
      filteredGrindHistory,
      selectedSeason,
      minDate,
      maxDate,
      maxRank,
      containerWidth,
      // external control (moved info button to parent)
      showInfo: showInfoProp,
      setShowInfo: setShowInfoProp,
    },
    ref
  ) => {
    const { activePoint, show: showTooltip, hide: hideTooltip } =
      useChartTooltip();
    const wrapperRef = useRef(null);
    const [localShowInfo, setLocalShowInfo] = useState(false);
    const showInfo = showInfoProp !== undefined ? showInfoProp : localShowInfo;
    const setShowInfo = setShowInfoProp !== undefined ? setShowInfoProp : setLocalShowInfo;

    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [showRelative, setShowRelative] = useState(false);
    const [showRotateHint, setShowRotateHint] = useState(false);

    useEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;

      const check = () => {
        const small = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
        const portrait = typeof window !== 'undefined'
          ? window.matchMedia && window.matchMedia('(orientation: portrait)').matches
          : false;
        const overflow = el.scrollWidth > el.clientWidth + 8;
        setShowRotateHint(small && portrait && overflow);
      };

      check();
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', check);
        window.addEventListener('orientationchange', check);
      }
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', check);
          window.removeEventListener('orientationchange', check);
        }
      };
    }, [data, containerWidth, selectedSeason]);

    const yAxisProps = showRelative
      ? {
          type: 'number',
          domain: [0, 10],
          reversed: false,
          allowDecimals: true,
          ticks: [0, 2, 4, 6, 8, 10],
          label: {
            value: 'Relative score',
            angle: -90,
            position: 'insideLeft',
            fontSize: 14,
            fill: '#4a5568',
          },
        }
      : {
          type: 'number',
          domain: [maxRank, 1],
          reversed: true,
          allowDecimals: false,
          label: {
            value: 'Position',
            angle: -90,
            position: 'insideLeft',
            fontSize: 14,
            fill: '#4a5568',
          },
        };

    const lineKey = showRelative ? 'score' : 'rank';
    const lineName = showRelative ? 'Relative score' : 'Position';

    const { seasonStart, seasonEnd } = useMemo(() => {
      if (!selectedSeason) return { seasonStart: null, seasonEnd: null };
      if (selectedSeason.startsWith('Summer')) {
        const year = parseInt(selectedSeason.split(' ')[1], 10);
        return {
          seasonStart: new Date(year, 4, 1).getTime(),
          seasonEnd: new Date(year, 8, 30).getTime(),
        };
      }
      const [startYear, endYear] = selectedSeason.split('-').map(Number);
      return {
        seasonStart: new Date(startYear, 9, 1).getTime(),
        seasonEnd: new Date(endYear, 3, 30).getTime(),
      };
    }, [selectedSeason]);

    const startValue = selectedSeason ? seasonStart : minDate;
    const endValue = selectedSeason ? seasonEnd : maxDate;

    const xTicks = useMemo(() => {
      let ticks = [
        ...new Set([
          ...data.map((d) => d.testDate),
          ...filteredGrindHistory.map((d) => getTimestamp(d.grindDate)),
        ]),
      ].sort((a, b) => a - b);

      if (startValue != null) {
        ticks = ticks.filter((t) => t !== startValue);
      }
      if (endValue != null) {
        ticks = ticks.filter((t) => t !== endValue);
      }
      return ticks;
    }, [data, filteredGrindHistory, startValue, endValue]);

    const xAxisDomain = useMemo(() => {
      return selectedSeason ? [seasonStart, seasonEnd] : [minDate, maxDate];
    }, [selectedSeason, seasonStart, seasonEnd, minDate, maxDate]);

    // Local colors for compact legend when showRelative is active
    const lowHex = '#f1f7fb';
    const highHex = '#155dfc';

    return (
      <div
        ref={wrapperRef}
        className="relative mt-5 scroll-smooth bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-sm"
        onClick={() => {
          setHoveredIndex(null);
        }}
      >
        {/* Toolbar: tabs (Position | Relative score) left, compact legend + info right */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
          <div className="flex">
            <button
              type="button"
              onClick={() => setShowRelative(false)}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                !showRelative
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-current={!showRelative ? 'page' : undefined}
            >
              Position
            </button>
            <button
              type="button"
              onClick={() => setShowRelative(true)}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                showRelative
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-current={showRelative ? 'page' : undefined}
            >
              Relative score
            </button>
          </div>

          
        </div>

        {/* Rotate hint (mobile, portrait, overflow) */}
        {showRotateHint && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/85 text-gray-700 md:hidden">
            <MdScreenRotation className="w-10 h-10 mb-2" />
            <div className="text-sm font-medium">Rotate device for a better view</div>
            <button
              type="button"
              className="mt-2 text-xs underline"
              onClick={(e) => {
                e.stopPropagation();
                setShowRotateHint(false);
              }}
            >
              Show anyway
            </button>
          </div>
        )}

        <ResponsiveContainer width={containerWidth} height={250}>
          <LineChart
            data={data}
            margin={{ top: 40, right: 20, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="testDate"
              type="number"
              domain={xAxisDomain}
              tickFormatter={(tick) => formatDate(tick)}
              ticks={xTicks}
              label={{
                value: 'Test date',
                position: 'insideBottom',
                offset: -30,
              }}
              stroke="#4a5568"
              tick={{ fontSize: 12 }}
            />
            <YAxis {...yAxisProps} stroke="#4a5568" />
            <Line
              type="monotone"
              dataKey={lineKey}
              name={lineName}
              stroke="var(--color-line)"
              strokeWidth={2}
              dot={({ key: dotKey, ...dotProps }) => (
                <ClickableDot
                  key={dotKey}
                  {...dotProps}
                  showTooltip={showTooltip}
                  hoveredIndex={hoveredIndex}
                  setHoveredIndex={setHoveredIndex}
                />
              )}
              activeDot={false}
            />
            {filteredGrindHistory.map((grind, i) => (
              <ReferenceLine
                key={i}
                x={getTimestamp(grind.grindDate)}
                stroke="#68d391"
                strokeWidth={2}
                label={{
                  value: `${grind.grind}`,
                  position: 'top',
                  offset: 20,
                  fontSize: 12,
                  fill: '#4a5568',
                }}
              />
            ))}
            {startValue && (
              <ReferenceLine
                x={startValue}
                label={{
                  value: formatDate(new Date(startValue)),
                  position: 'bottom',
                  offset: 12,
                  fontSize: 12,
                  fill: '#4a5568',
                }}
              />
            )}
            {endValue && (
              <ReferenceLine
                x={endValue}
                label={{
                  value: formatDate(new Date(endValue)),
                  position: 'bottom',
                  offset: 12,
                  fontSize: 12,
                  fill: '#4a5568',
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {activePoint && <Overlay isVisible={true} />}
        {activePoint && <FloatingTooltip point={activePoint} hideTooltip={hideTooltip} />}

        {showInfo && (
          <>
            <Overlay isVisible={true} />
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-11/12 rounded-lg bg-white shadow-lg p-5 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-gray-800 mb-2">How the performance chart works</h3>
              <div className="text-gray-700 space-y-2">
                <p>
                  The chart shows test results over time. Use the tabs to switch between Position (rank within a test) and Relative score (standardized 0–10).
                </p>
                <p>
                  The horizontal axis is the test date. Reference lines mark grind events and season bounds when a season is selected. Click a dot to see details and open the full test.
                </p>
                <p>
                  Small tests with only two skis are excluded from aggregated views.
                </p>
              </div>

              <div className="mt-4 flex justify-end">
                <Button variant="secondary" className="text-sm" onClick={() => setShowInfo(false)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </div>
    );
  }
);

export default React.memo(PerformanceChart);