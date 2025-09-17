'use client';
import React from 'react';
import Button from '@/components/ui/Button';
import { RiEditLine, RiDeleteBinLine } from 'react-icons/ri';
import {
  highlightSearchTerm,
  formatSourceLabel,
  formatSnowTypeLabel,
  formatDate,
} from '@/helpers/helpers';

const ResultCard = ({ result, debouncedSearch, handleEdit, handleDelete, canEdit = true, footerLeft }) => {
  const date = result.timestamp?.seconds
    ? new Date(result.timestamp.seconds * 1000)
    : result.timestamp instanceof Date
    ? result.timestamp
    : null;

  // support multiple possible field names for backward compatibility
  const snowTemp =
    result.snowCondition?.temperature ??
    result.snowTemperature ??
    result.snowTemp ??
    '';
  const humidity =
    result.snowCondition?.humidity ?? result.humidity ?? '';

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {highlightSearchTerm(
                  result.style.charAt(0).toUpperCase() + result.style.slice(1),
                  debouncedSearch
                )}{' '}
                <span className="text-sm text-gray-500">/ {result.temperature}°C</span>
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {highlightSearchTerm(result.location, debouncedSearch)}
              </p>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <Button onClick={() => handleEdit(result.id)} variant="secondary" className="p-2" aria-label="Edit">
                  <RiEditLine size={16} />
                </Button>
                <Button onClick={() => handleDelete(result.id)} variant="danger" className="p-2" aria-label="Delete">
                  <RiDeleteBinLine size={16} />
                </Button>
              </div>
            )}
          </div>

          {/* Rankings: compact, responsive */}
          <ul className="mt-4 grid grid-cols-1  gap-2 text-sm">
            {result.rankings.map((ranking, idx) => (
              <li key={idx} className="flex flex-col bg-gray-50 rounded-md p-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate">{ranking.skiId ? ranking.serialNumber : 'Deleted'}</div>
                  <div className="text-sm font-medium">{ranking.score} <span className="text-xs">cm</span></div>
                </div>
                <div className="text-xs text-gray-500 mt-1 truncate">{ranking.grind}</div>
              </li>
            ))}
          </ul>

          {/* Meta row: include snowTemperature and humidity */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div>
              <div className="text-gray-600 text-xs">Snow source</div>
              <div className="font-semibold">
                {result.snowCondition?.source
                  ? highlightSearchTerm(formatSourceLabel(result.snowCondition.source), debouncedSearch)
                  : '--'}
              </div>
            </div>

            <div>
              <div className="text-gray-600 text-xs">Snow type</div>
              <div className="font-semibold">
                {result.snowCondition?.grainType
                  ? highlightSearchTerm(formatSnowTypeLabel(result.snowCondition.grainType), debouncedSearch)
                  : '--'}
              </div>
            </div>

            <div>
              <div className="text-gray-600 text-xs">Snow temp</div>
              <div className="font-semibold">{snowTemp !== '' ? `${snowTemp}°C` : '--'}</div>
            </div>

            <div>
              <div className="text-gray-600 text-xs">Humidity</div>
              <div className="font-semibold">{humidity !== '' ? `${humidity}%` : '--'}</div>
            </div>

            <div className="col-span-2 sm:col-span-4">
              <div className="text-gray-600 text-xs">Comment</div>
              <div className="font-semibold">{result.comment ? highlightSearchTerm(result.comment, debouncedSearch) : '--'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-medium text-gray-500">
        <span className="italic">
          {footerLeft !== undefined ? footerLeft : (result.displayName ? `By ${result.displayName}` : '')}
        </span>
        <span>{date ? formatDate(date, true) : '--'}</span>
      </div>
    </div>
  );
};

export default ResultCard;