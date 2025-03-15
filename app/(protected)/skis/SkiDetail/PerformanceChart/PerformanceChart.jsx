// components/SkiDetail/PerformanceChart/PerformanceChart.jsx

import React, { useMemo, forwardRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { getTimestamp } from '@/helpers/helpers';

const PerformanceChart = forwardRef(({
  data,
  filteredGrindHistory,
  selectedSeason,
  minDate,
  maxDate,
  maxRank,
  CustomTooltip,
  containerWidth,
}, ref) => {
  const { t } = useTranslation();

  // Generate unique ticks for the XAxis
  const xTicks = useMemo(() => {
    const testDates = data.map(d => d.testDate);
    const grindDates = filteredGrindHistory.map(d => getTimestamp(d.grindDate)).filter(Boolean);
    return [...new Set([...testDates, ...grindDates])].sort((a, b) => a - b);
  }, [data, filteredGrindHistory]);

  // Define the season's date range and calculate start/end timestamps
  const { seasonStart, seasonEnd } = useMemo(() => {
    if (!selectedSeason) return { seasonStart: null, seasonEnd: null };
    if (selectedSeason.startsWith('Summer')) {
      const year = parseInt(selectedSeason.split(' ')[1], 10);
      const startDate = new Date(year, 4, 1).getTime(); // May 1st
      const endDate = new Date(year, 8, 30).getTime(); // September 30th
      return { seasonStart: startDate, seasonEnd: endDate };
    } else {
      const [startYear, endYear] = selectedSeason.split('-').map(Number);
      const startDate = new Date(startYear, 9, 1).getTime(); // October 1st
      const endDate = new Date(endYear, 3, 30).getTime(); // April 30th
      return { seasonStart: startDate, seasonEnd: endDate };
    }
  }, [selectedSeason]);

  // Define the domain for the XAxis
  const xAxisDomain = useMemo(() => {
    if (!selectedSeason) return [minDate, maxDate];
    return [seasonStart, seasonEnd];
  }, [selectedSeason, seasonStart, seasonEnd, minDate, maxDate]);

  return (
    <div ref={ref} className='overflow-auto scroll-smooth'>
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
            tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
            ticks={xTicks}
            label={{ value: t('test_date'), position: 'insideBottom', offset: -30, fontSize: 14, fill: 'var(--color-text)' }}
            stroke='var(--color-text)'
            tickMargin={10}
          />
          <YAxis
            type="number"
            domain={[maxRank, 1]} // Inverted domain for rank
            allowDecimals={false}
            label={{ value: t('rank'), angle: -90, position: 'insideLeft', fontSize: 14, fill: 'var(--color-text)' }}
            stroke='var(--color-text)'
          />
          <Tooltip content={CustomTooltip} />
          <Legend align="left" verticalAlign="bottom"/>
          <Line
            type="monotone"
            dataKey="rank"
            name={t('rank')}
            stroke="var(--color-line)"
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
          {filteredGrindHistory.map((grind, index) => (
            <ReferenceLine
              key={`grind-${index}`}
              x={getTimestamp(grind.grindDate)}
              stroke='var(--color-reference)'
              strokeWidth={2}
              label={{
                value: `${grind.grind}`,
                position: 'top',
                offset: 15,
                fontSize: 12,
                fill: "var(--color-text)",
              }}
            />
          ))}

          {/* Add Reference Lines for Season Start and End */}
          {seasonStart && (
            <ReferenceLine
              x={seasonStart}
              label={{
                value: `${new Date(seasonStart).toLocaleDateString()}`,
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
                value: `${new Date(seasonEnd).toLocaleDateString()}`,
                position: 'bottom',
                offset: 12,
                fontSize: 12,
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

const MemoizedPerformanceChart = React.memo(PerformanceChart);

export default MemoizedPerformanceChart;
