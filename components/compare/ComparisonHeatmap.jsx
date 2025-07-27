'use client';

import React, { useMemo, useState } from 'react';
import { formatSnowTypeLabel, formatSourceLabel } from '@/helpers/helpers';

const ComparisonHeatmap = ({ selectedSkis, visibleSkis, filters }) => {
  const [activeTab, setActiveTab] = useState('natural');

  // Mock data structure for demonstration
  // In real implementation, this would come from the test data aggregation
  const mockPerformanceData = useMemo(() => {
    if (!selectedSkis || selectedSkis.length === 0) return {};
    
    const temperatures = [-20, -15, -10, -5, -1, 0, 2, 5];
    const snowCombos = [
      { source: 'natural', grainType: 'fine' },
      { source: 'natural', grainType: 'medium' },
      { source: 'natural', grainType: 'coarse' },
      { source: 'artificial', grainType: 'fine' },
      { source: 'artificial', grainType: 'medium' },
      { source: 'artificial', grainType: 'coarse' },
      { source: 'mix', grainType: 'fine' },
      { source: 'mix', grainType: 'medium' },
      { source: 'mix', grainType: 'coarse' },
    ];

    const data = {};
    
    // Generate mock performance scores for each ski
    selectedSkis.forEach(ski => {
      data[ski.id] = {};
      temperatures.forEach(temp => {
        snowCombos.forEach(combo => {
          const key = `${temp}_${combo.source}_${combo.grainType}`;
          // Mock scoring based on ski properties (just for demo)
          const baseScore = Math.random() * 5 + 1; // 1-6 scale
          const variance = (Math.random() - 0.5) * 2; // -1 to 1 variance
          data[ski.id][key] = {
            averageScore: Math.max(1, Math.min(6, baseScore + variance)),
            testCount: Math.floor(Math.random() * 10) + 1,
            category: baseScore > 4.5 ? 'great' : baseScore > 3.5 ? 'good' : baseScore > 2.5 ? 'average' : baseScore > 1.5 ? 'bad' : 'very_bad'
          };
        });
      });
    });

    return data;
  }, [selectedSkis]);

  // Color scale
  const categoryColors = {
    great: '#22c55e',    // green-500
    good: '#84cc16',     // lime-500  
    average: '#eab308',  // yellow-500
    bad: '#f97316',      // orange-500
    very_bad: '#ef4444', // red-500
    unknown: '#9ca3af',  // gray-400
  };

  const temperatures = [-20, -15, -10, -5, -1, 0, 2, 5];
  
  // Filter rows by active tab
  const rows = useMemo(() => {
    const allSnowCombos = [
      { source: 'natural', grainType: 'fine' },
      { source: 'natural', grainType: 'medium' },
      { source: 'natural', grainType: 'coarse' },
      { source: 'artificial', grainType: 'fine' },
      { source: 'artificial', grainType: 'medium' },
      { source: 'artificial', grainType: 'coarse' },
      { source: 'mix', grainType: 'fine' },
      { source: 'mix', grainType: 'medium' },
      { source: 'mix', grainType: 'coarse' },
    ];
    
    return allSnowCombos.filter(combo => combo.source === activeTab);
  }, [activeTab]);

  if (!selectedSkis || selectedSkis.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No skis selected for comparison
      </div>
    );
  }

  const visibleSkisList = selectedSkis.filter(ski => visibleSkis[ski.id]);

  if (visibleSkisList.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No skis are currently visible. Toggle ski visibility above.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['natural', 'artificial', 'mix'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm focus:outline-none capitalize ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        {[
          { key: 'great', label: 'Great' },
          { key: 'good', label: 'Good' },
          { key: 'average', label: 'Average' },
          { key: 'bad', label: 'Bad' },
          { key: 'very_bad', label: 'Very Bad' },
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

      {/* Heatmap Tables - One per visible ski */}
      <div className="space-y-8">
        {visibleSkisList.map(ski => (
          <div key={ski.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">
                {ski.brand} {ski.model}
                <span className="text-sm text-gray-500 ml-2">({ski.style})</span>
              </h4>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white border-b border-gray-200">
                    <th className="text-left text-gray-600 font-medium p-3 w-48">
                      Snow type
                    </th>
                    {temperatures.map((temp) => (
                      <th key={temp} className="text-center text-gray-600 font-medium p-2 min-w-16">
                        {temp}°C
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.source}-${row.grainType}`} className="border-b border-gray-100 last:border-0">
                      <td className="text-sm text-gray-700 p-3 font-medium">
                        {formatSourceLabel(row.source)} – {formatSnowTypeLabel(row.grainType)}
                      </td>
                      {temperatures.map((temp) => {
                        const key = `${temp}_${row.source}_${row.grainType}`;
                        const data = mockPerformanceData[ski.id]?.[key];
                        const category = data?.category || 'unknown';
                        
                        return (
                          <td key={temp} className="p-2 text-center">
                            {data ? (
                              <div
                                className="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                                style={{ backgroundColor: categoryColors[category] }}
                                title={`Avg: ${data.averageScore.toFixed(1)}, Tests: ${data.testCount}`}
                              >
                                {data.averageScore.toFixed(1)}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">--</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
        💡 <strong>Demo Note:</strong> This heatmap shows mock performance data for demonstration. 
        In the full implementation, this would display real aggregated test results with average scores and test counts per condition.
      </div>
    </div>
  );
};

export default ComparisonHeatmap;