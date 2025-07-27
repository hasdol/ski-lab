'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { formatDate } from '@/helpers/helpers';

const ComparisonLineChart = ({ selectedSkis, visibleSkis, filters }) => {
  
  // Generate mock time series data for demonstration
  const mockTimeSeriesData = useMemo(() => {
    if (!selectedSkis || selectedSkis.length === 0) return [];

    // Generate dates over the last year
    const dates = [];
    const now = new Date();
    for (let i = 365; i >= 0; i -= 30) { // Monthly data points
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }

    return dates.map(date => {
      const dataPoint = {
        date: date.getTime(),
        dateFormatted: formatDate(date),
      };

      // Add performance data for each ski
      selectedSkis.forEach(ski => {
        // Mock performance trend based on ski characteristics
        const baseRank = Math.random() * 10 + 1; // 1-11 base rank
        const seasonality = Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 2; // Seasonal variation
        const randomness = (Math.random() - 0.5) * 3; // Random variation
        
        const rank = Math.max(1, Math.min(15, baseRank + seasonality + randomness));
        dataPoint[`ski_${ski.id}`] = Math.round(rank * 10) / 10; // Round to 1 decimal
      });

      return dataPoint;
    });
  }, [selectedSkis]);

  // Colors for different ski lines
  const skiColors = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#f97316', // orange-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
  ];

  const visibleSkisList = selectedSkis.filter(ski => visibleSkis[ski.id]);

  if (!selectedSkis || selectedSkis.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No skis selected for comparison
      </div>
    );
  }

  if (visibleSkisList.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No skis are currently visible. Toggle ski visibility above.
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{formatDate(new Date(label))}</p>
          {payload.map((entry, index) => {
            const ski = selectedSkis.find(s => `ski_${s.id}` === entry.dataKey);
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                <span className="font-medium">{ski?.brand} {ski?.model}:</span> Rank {entry.value}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={mockTimeSeriesData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(tick) => formatDate(new Date(tick)).split(' ')[0]} // Show only date part
              stroke="#4a5568"
            />
            <YAxis
              domain={[15, 1]} // Inverted scale (1 is best rank)
              label={{
                value: 'Rank',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
              stroke="#4a5568"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {visibleSkisList.map((ski, index) => (
              <Line
                key={ski.id}
                type="monotone"
                dataKey={`ski_${ski.id}`}
                name={`${ski.brand} ${ski.model}`}
                stroke={skiColors[index % skiColors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with ski details */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Ski Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleSkisList.map((ski, index) => (
            <div key={ski.id} className="flex items-center gap-3">
              <div
                className="w-4 h-1 rounded"
                style={{ backgroundColor: skiColors[index % skiColors.length] }}
              />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {ski.brand} {ski.model}
                </div>
                <div className="text-xs text-gray-500">
                  {ski.serialNumber} • {ski.style}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
        💡 <strong>Demo Note:</strong> This line chart shows mock performance trends over time for demonstration. 
        In the full implementation, this would display real test results plotted chronologically, showing how each ski's ranking evolved across different test sessions.
      </div>
    </div>
  );
};

export default ComparisonLineChart;