'use client';
import React from 'react';
import Button from '@/components/ui/Button';
import { RiEditLine, RiDeleteBinLine } from 'react-icons/ri';
import {
  highlightSearchTerm,
  formatSourceLabel,
  formatSnowTypeLabel,
  formatDate, // helper
} from '@/helpers/helpers';

const ResultCard = ({ result, debouncedSearch, handleEdit, handleDelete }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-lg">
            {highlightSearchTerm(
              result.style.charAt(0).toUpperCase() + result.style.slice(1),
              debouncedSearch
            )}{' '}
            /{' '}
            {highlightSearchTerm(`${result.temperature}°C`, debouncedSearch)}
          </h3>
          <p className="text-sm text-gray-500">
            {highlightSearchTerm(result.location, debouncedSearch)}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => handleEdit(result.id)} variant="secondary">
            <RiEditLine size={18} />
          </Button>
          <Button onClick={() => handleDelete(result.id)} variant="danger">
            <RiDeleteBinLine size={18} />
          </Button>
        </div>
      </div>

      <ul className="divide-y divide-gray-200 text-sm my-6">
        {result.rankings.map((ranking, idx) => (
          <li key={idx} className="flex justify-between py-1">
            <span className="w-1/3 truncate">
              {highlightSearchTerm(
                ranking.skiId ? ranking.serialNumber : 'Deleted',
                debouncedSearch
              )}
              {ranking.score === 0 && (
                <span className="ml-2 text-highlight text-xs">- New</span>
              )}
            </span>
            <span className="w-1/3 text-center">
              {highlightSearchTerm(ranking.grind, debouncedSearch)}
            </span>
            <span className="w-1/3 text-right">
              {ranking.score}{' '}
              <span className="text-xs">cm</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-700">Humidity</div>{' '}
          <strong>{result.humidity ? `${result.humidity}%` : '--'}</strong>
        </div>
        <div>
          <div className="text-gray-700">Snow temp</div>{' '}
          <strong>
            {result.snowTemperature ? `${result.snowTemperature}°C` : '--'}
          </strong>
        </div>
        <div>
          <div className="text-gray-700">Snow source</div>{' '}
          <strong>
            {result.snowCondition?.source
              ? highlightSearchTerm(
                  formatSourceLabel(result.snowCondition.source),
                  debouncedSearch
                )
              : '--'}
          </strong>
        </div>
        <div>
          <div className="text-gray-700">Snow type</div>{' '}
          <strong>
            {result.snowCondition?.grainType
              ? highlightSearchTerm(
                  formatSnowTypeLabel(result.snowCondition.grainType),
                  debouncedSearch
                )
              : '--'}
          </strong>
        </div>
        <div className="col-span-2">
          <div className="text-gray-700">Comment</div>{' '}
          <strong>
            {result.comment
              ? highlightSearchTerm(result.comment, debouncedSearch)
              : '--'}
          </strong>
        </div>
      </div>

      <div className="text-right text-xs text-gray-500 mt-2">
        {formatDate(new Date(result.timestamp.seconds * 1000), true)}
      </div>
    </div>
  );
};

export default ResultCard;