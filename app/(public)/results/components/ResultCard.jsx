'use client';
import React from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { RiEditLine, RiDeleteBinLine, RiGroup3Line, RiUser3Line } from 'react-icons/ri';
import { MdEvent } from "react-icons/md";
import { FaUsers } from "react-icons/fa6";


import {
  highlightSearchTerm,
  formatSourceLabel,
  formatSnowTypeLabel,
  formatDate,
} from '@/helpers/helpers';

export default function ResultCard({
  result,
  debouncedSearch,
  handleEdit,
  handleDelete,
  canEdit = true,
  footerLeft,
  ownerNameByUid = {}, // NEW (optional)
}) {
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
  const testQuality =
    result.testQuality ??
    result.additionalData?.testQuality ??
    result.meta?.testQuality ??
    null;

  const isCrossTest = !!result?.isCrossTest;

  const formatOwnerLabel = (uid) => {
    if (!uid) return '';
    const label = ownerNameByUid?.[uid];
    if (label) return label;
    // fallback: short uid
    return `${uid.slice(0, 6)}…${uid.slice(-4)}`;
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex relative items-center justify-between gap-3">
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

              {isCrossTest && (
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs px-2 py-0.5 rounded-full  bg-blue-50 text-blue-700">
                    <RiGroup3Line  />
                    Cross-user test
                  </span>
                </div>
              )}
            </div>

            {result.displayName && (
              <span className="bg-indigo-100 text-indigo-500 px-4 rounded-xl absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium py-1 ">
                {footerLeft !== undefined ? footerLeft : (result.displayName ? `${result.displayName}` : '')}
              </span>
            )}


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

          {/* Rankings */}
          <ul className="mt-4 grid grid-cols-1 gap-2 text-sm">
            {result.rankings.map((ranking, idx) => {
              const ownerUid = ranking?.ownerUid || null;

              // "Not your own" here means: not owned by the owner of THIS result doc
              // (so on your copy, it tags skis belonging to other users).
              const showOwnerBadge =
                isCrossTest &&
                !!ownerUid &&
                !!result?.userId &&
                ownerUid !== result.userId;

              return (
                <li key={idx} className="flex flex-col bg-gray-50 rounded-2xl p-2 px-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="font-medium truncate">
                        {ranking.skiId ? ranking.serialNumber : 'Deleted'}
                      </div>

                      {showOwnerBadge && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full
                                     border border-gray-200 bg-white/70 text-gray-700"
                          title={`Owned by ${formatOwnerLabel(ownerUid)}`}
                        >
                          <RiUser3Line />
                          <span className="max-w-[120px] truncate">{formatOwnerLabel(ownerUid)}</span>
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-medium">
                      {ranking.score} <span className="text-xs">cm</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-1 truncate">{ranking.grind}</div>
                </li>
              );
            })}
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

      <div className='flex justify-between'>
        {/* NEW: Test execution satisfaction */}

        <div className="mt-2 flex items-center gap-2 text-xs">
          {testQuality != null && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded ${testQuality > 7 ? 'bg-blue-100 text-blue-700' : testQuality<3 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'} font-medium`}>
              Test Execution {testQuality} / 10
            </span>
          )}
        </div>


        <span className='text-end text-xs font-medium mt-3 text-gray-500'>
          <MdEvent className="inline" /> {date ? formatDate(date, true) : '--'}
        </span>
      </div>


    </Card>
  );
};