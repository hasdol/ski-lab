'use client';
import React, {
  useMemo,
  forwardRef,
  useCallback,
  useState,
  useRef,
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

/* ───────────────────────────────────────────────
   Helpers
────────────────────────────────────────────── */
const useChartTooltip = () => {
  const [activePoint, setActivePoint] = useState(null); // { payload, cx, cy }
  const show = useCallback((point) => setActivePoint(point), []);
  const hide = useCallback(() => setActivePoint(null), []);
  return { activePoint, show, hide };
};

// Custom Dot that enlarges on hover using local hoverIndex state
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

/* ───────────────────────────────────────────────
   Tooltip overlay – only the requested fields
────────────────────────────────────────────── */
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
  } = point.payload;

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
        <span>Rank: {rank}</span>
        <span className="text-gray-600">{formatDate(testDate)}</span>
      </div>

      {rows.map(({ key, value }) => (
        <div key={key} className="flex justify-between mb-1 text-gray-700">
          <span className="mr-2">{key}</span>
          <span>{String(value)}</span>
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

/* ───────────────────────────────────────────────
   Main component
────────────────────────────────────────────── */
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
    },
    ref
  ) => {
    const { activePoint, show: showTooltip, hide: hideTooltip } =
      useChartTooltip();
    const wrapperRef = useRef(null);

    // Hovered dot index state
    const [hoveredIndex, setHoveredIndex] = useState(null);

    /* ───────────────────────────────────────────────
       X-axis ticks & season bounds
    ─────────────────────────────────────────────── */
    // Calculate ticks normally, then remove the boundary values.
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

    // Define startValue and endValue before computing xTicks
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

    /* ───────────────────────────────────────────────
       Render
    ─────────────────────────────────────────────── */
    return (
      <div
        ref={wrapperRef}
        className="relative scroll-smooth bg-white"
        onClick={() => {
          setHoveredIndex(null);
        }}
      >
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
                fontSize: 14,
                fill: '#4a5568',
              }}
              stroke="#4a5568"
              tickMargin={25}
            />
            <YAxis
              type="number"
              domain={[maxRank, 1]}
              allowDecimals={false}
              label={{
                value: 'Rank',
                angle: -90,
                position: 'insideLeft',
                fontSize: 14,
                fill: '#4a5568',
              }}
              stroke="#4a5568"
            />
            <Legend
              align="left"
              verticalAlign="top"
              wrapperStyle={{ top: 0, left: 0 }}
              iconSize={10}
              wrapperClassName="text-gray-700 font-medium"
            />
            <Line
              type="monotone"
              dataKey="rank"
              name="rank"
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
      </div>
    );
  }
);

export default React.memo(PerformanceChart);