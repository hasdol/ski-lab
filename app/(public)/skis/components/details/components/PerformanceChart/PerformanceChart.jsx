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
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { getTimestamp } from '@/helpers/helpers';
import Button from '@/components/common/Button';

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
  const { t } = useTranslation();

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
    { key: 'location', value: location },
    { key: 'temperature', value: temp },
    { key: 'snow_type', value: snowType },
    { key: 'snow_source', value: snowSource },
  ].filter(({ value }) => value !== undefined && value !== null && value !== '');

  return (
    <div
      className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 rounded-lg bg-white shadow-lg p-4 md:text-base text-sm transition-opacity duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="font-medium text-sm mb-2 flex justify-between">
        <span>
          {t('rank')}: {rank}
        </span>
        <span className="text-muted-foreground">
          {new Date(testDate).toLocaleDateString()}
        </span>
      </div>

      {rows.map(({ key, value }) => (
        <div key={key} className="flex justify-between mb-1">
          <span className="mr-2 ">{t(key)}</span>
          <span>{t(String(value))}</span>
        </div>
      ))}

      <div className="mt-4 flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={hideTooltip}>
          {t('hide')}
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={() => router.push(`/results/${testId}`)}
        >
          {t('go_to_test')}
        </Button>
      </div>
    </div>
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
    const { t } = useTranslation();
    const { activePoint, show: showTooltip, hide: hideTooltip } =
      useChartTooltip();
    const wrapperRef = useRef(null);

    // Hovered dot index state
    const [hoveredIndex, setHoveredIndex] = useState(null);

    /* ───────────────────────────────────────────────
       X-axis ticks & season bounds
    ─────────────────────────────────────────────── */
    const xTicks = useMemo(() => {
      const testDates = data.map((d) => d.testDate);
      const grindDates = filteredGrindHistory
        .map((d) => getTimestamp(d.grindDate))
        .filter(Boolean);
      return [...new Set([...testDates, ...grindDates])].sort((a, b) => a - b);
    }, [data, filteredGrindHistory]);

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

    const xAxisDomain = useMemo(() => {
      return selectedSeason ? [seasonStart, seasonEnd] : [minDate, maxDate];
    }, [selectedSeason, seasonStart, seasonEnd, minDate, maxDate]);

    /* ───────────────────────────────────────────────
       Render
    ─────────────────────────────────────────────── */
    return (
      <div
        ref={wrapperRef}
        className="relative scroll-smooth"
        onClick={() => {
          hideTooltip();
          setHoveredIndex(null);
        }}
        onTouchStart={hideTooltip}
      >
        <ResponsiveContainer width={containerWidth} height={250}>
          <LineChart
            data={data}
            margin={{ top: 50, right: 50, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="testDate"
              type="number"
              domain={xAxisDomain}
              tickFormatter={(tick) =>
                new Date(tick).toLocaleDateString(undefined, {
                  year: '2-digit',
                  month: 'short',
                  day: 'numeric',
                })
              }
              ticks={xTicks}
              label={{
                value: t('test_date'),
                position: 'insideBottom',
                offset: -30,
                fontSize: 14,
                fill: 'var(--color-text)',
              }}
              stroke="var(--color-text)"
              tickMargin={20}
            />
            <YAxis
              type="number"
              domain={[maxRank, 1]}
              allowDecimals={false}
              label={{
                value: t('rank'),
                angle: -90,
                position: 'insideLeft',
                fontSize: 14,
                fill: 'var(--color-text)',
              }}
              stroke="var(--color-text)"
            />
            <Legend align="left" verticalAlign="bottom" />
            <Line
              type="monotone"
              dataKey="rank"
              name={t('rank')}
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
                stroke="var(--color-reference)"
                strokeWidth={2}
                label={{
                  value: `${grind.grind}`,
                  position: 'top',
                  offset: 15,
                  fontSize: 12,
                  fill: 'var(--color-text)',
                }}
              />
            ))}
            {seasonStart && (
              <ReferenceLine
                x={seasonStart}
                label={{
                  value: new Date(seasonStart).toLocaleDateString(),
                  position: 'bottom',
                  offset: 12,
                  fontSize: 12,
                }}
              />
            )}
            {seasonEnd && (
              <ReferenceLine
                x={seasonEnd}
                label={{
                  value: new Date(seasonEnd).toLocaleDateString(),
                  position: 'bottom',
                  offset: 12,
                  fontSize: 12,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {activePoint && <FloatingTooltip point={activePoint} hideTooltip={hideTooltip} />}
      </div>
    );
  }
);

export default React.memo(PerformanceChart);