'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { RiLineChartLine } from 'react-icons/ri';
import ComparisonHeatmap from '@/components/compare/ComparisonHeatmap';
import ComparisonLineChart from '@/components/compare/ComparisonLineChart';

// Mock ski data for demonstration
const mockSkis = [
  {
    id: '1',
    brand: 'Salomon',
    model: 'S/Race Skate',
    serialNumber: 'SAL001',
    style: 'skate'
  },
  {
    id: '2',
    brand: 'Fischer',
    model: 'Speedmax 3D',
    serialNumber: 'FIS002',
    style: 'skate'
  },
  {
    id: '3',
    brand: 'Rossignol',
    model: 'X-IUM Classic',
    serialNumber: 'ROS003',
    style: 'classic'
  },
  {
    id: '4',
    brand: 'Atomic',
    model: 'Redster C9',
    serialNumber: 'ATO004',
    style: 'classic'
  }
];

const CompareSkisDemo = () => {
  const router = useRouter();
  
  // Selected skis for comparison
  const [selectedSkiIds, setSelectedSkiIds] = useState(['1', '2']);
  
  // Filters
  const [seasonFilter, setSeasonFilter] = useState('all');
  const [snowSourceFilter, setSnowSourceFilter] = useState('all');
  const [grainTypeFilter, setGrainTypeFilter] = useState('all');
  
  // Ski visibility toggles - initialized with selected skis visible
  const [visibleSkis, setVisibleSkis] = useState({ '1': true, '2': true });

  // Handle ski selection
  const handleSkiToggle = (skiId) => {
    setSelectedSkiIds(prev => {
      if (prev.includes(skiId)) {
        const newIds = prev.filter(id => id !== skiId);
        // Remove from visible skis as well
        setVisibleSkis(vis => {
          const newVis = { ...vis };
          delete newVis[skiId];
          return newVis;
        });
        return newIds;
      } else {
        // Add to visible skis by default
        setVisibleSkis(vis => ({ ...vis, [skiId]: true }));
        return [...prev, skiId];
      }
    });
  };

  // Toggle ski visibility in charts
  const toggleSkiVisibility = (skiId) => {
    setVisibleSkis(prev => ({ ...prev, [skiId]: !prev[skiId] }));
  };

  // Get selected skis data
  const selectedSkis = useMemo(() => {
    return mockSkis.filter(ski => selectedSkiIds.includes(ski.id));
  }, [selectedSkiIds]);

  // Filter applied count
  const activeFiltersCount = [seasonFilter, snowSourceFilter, grainTypeFilter].filter(f => f !== 'all').length;

  return (
    <div className="p-4 max-w-6xl w-full self-center">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <RiLineChartLine className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compare Skis</h1>
          <p className="text-gray-600 mt-1">
            Select multiple skis to compare their performance across different conditions
          </p>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">🚀 Demo Mode</h3>
        <p className="text-sm text-yellow-800">
          This is a demonstration of the ski comparison feature with mock data. 
          In the real app, this would show your actual ski inventory and test results.
        </p>
      </div>

      {/* Ski Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Select Skis to Compare</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mockSkis.map(ski => (
              <label key={ski.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSkiIds.includes(ski.id)}
                  onChange={() => handleSkiToggle(ski.id)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {ski.brand} {ski.model}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {ski.serialNumber} • {ski.style}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Selection Summary and Filters */}
      {selectedSkis.length > 0 && (
        <div className="mb-6 space-y-4">
          {/* Selected skis */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Selected for comparison ({selectedSkis.length} skis):
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedSkis.map(ski => (
                <span key={ski.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {ski.brand} {ski.model}
                  <button
                    onClick={() => handleSkiToggle(ski.id)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Filters</h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    setSeasonFilter('all');
                    setSnowSourceFilter('all');
                    setGrainTypeFilter('all');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear all ({activeFiltersCount})
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Season</label>
                <select
                  value={seasonFilter}
                  onChange={(e) => setSeasonFilter(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All seasons</option>
                  <option value="2023-24">2023-24</option>
                  <option value="2022-23">2022-23</option>
                  <option value="2021-22">2021-22</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Snow Source</label>
                <select
                  value={snowSourceFilter}
                  onChange={(e) => setSnowSourceFilter(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All sources</option>
                  <option value="natural">Natural</option>
                  <option value="artificial">Artificial</option>
                  <option value="mix">Mix</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Grain Type</label>
                <select
                  value={grainTypeFilter}
                  onChange={(e) => setGrainTypeFilter(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All types</option>
                  <option value="fine">Fine</option>
                  <option value="medium">Medium</option>
                  <option value="coarse">Coarse</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Charts */}
      {selectedSkis.length >= 2 ? (
        <div className="space-y-8">
          {/* Ski Toggles for Charts */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Chart Visibility</h3>
            <div className="flex flex-wrap gap-2">
              {selectedSkis.map(ski => (
                <button
                  key={ski.id}
                  onClick={() => toggleSkiVisibility(ski.id)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    visibleSkis[ski.id] 
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    visibleSkis[ski.id] ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  {ski.brand} {ski.model}
                </button>
              ))}
            </div>
          </div>

          {/* Heatmap Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Heatmap</h3>
            <ComparisonHeatmap 
              selectedSkis={selectedSkis}
              visibleSkis={visibleSkis}
              filters={{ seasonFilter, snowSourceFilter, grainTypeFilter }}
            />
          </div>

          {/* Line Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
            <ComparisonLineChart 
              selectedSkis={selectedSkis}
              visibleSkis={visibleSkis}
              filters={{ seasonFilter, snowSourceFilter, grainTypeFilter }}
            />
          </div>
        </div>
      ) : selectedSkis.length === 1 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select More Skis</h3>
          <p className="text-gray-600">
            Select at least 2 skis to see comparison charts
          </p>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Skis Selected</h3>
          <p className="text-gray-600">
            Select skis from the list above to start comparing their performance
          </p>
        </div>
      )}
    </div>
  );
};

export default CompareSkisDemo;