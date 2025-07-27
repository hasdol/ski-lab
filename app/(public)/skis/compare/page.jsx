'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSkis } from '@/hooks/useSkis';
import useSkiTests from '@/hooks/useSkiTests';
import Button from '@/components/ui/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { TiFlowParallel } from "react-icons/ti";
import { RiLineChartLine } from 'react-icons/ri';

const CompareSkis = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { skis, loading: skisLoading } = useSkis();
  
  // Selected skis for comparison
  const [selectedSkiIds, setSelectedSkiIds] = useState([]);

  // Handle ski selection
  const handleSkiToggle = (skiId) => {
    setSelectedSkiIds(prev => {
      if (prev.includes(skiId)) {
        return prev.filter(id => id !== skiId);
      } else {
        return [...prev, skiId];
      }
    });
  };

  // Get selected skis data
  const selectedSkis = useMemo(() => {
    return skis.filter(ski => selectedSkiIds.includes(ski.id));
  }, [skis, selectedSkiIds]);

  if (!user) {
    return (
      <div className="p-4 max-w-4xl w-full self-center">
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg mt-4">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <RiLineChartLine className="text-gray-500 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Please sign in to compare your skis.
          </p>
          <Button onClick={() => router.push('/login')} variant="primary">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (skisLoading) {
    return (
      <div className="p-4 max-w-4xl w-full self-center">
        <div className="flex justify-center items-center mt-10">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl w-full self-center">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <RiCompareLine className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compare Skis</h1>
          <p className="text-gray-600 mt-1">
            Select multiple skis to compare their performance across different conditions
          </p>
        </div>
      </div>

      {/* Ski Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Select Skis to Compare</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {skis.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">You don't have any skis yet.</p>
              <Button onClick={() => router.push('/skis')} variant="primary">
                Go to Skis
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {skis.map(ski => (
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
          )}
        </div>
      </div>

      {/* Selection Summary */}
      {selectedSkis.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
      )}

      {/* Comparison Charts */}
      {selectedSkis.length >= 2 ? (
        <div className="space-y-8">
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Comparison Charts Coming Soon</h3>
            <p className="text-gray-600">
              Heatmap and line chart comparisons will be displayed here
            </p>
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

export default CompareSkis;