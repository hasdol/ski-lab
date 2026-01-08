// ./components/SkiItem/SkiItem.jsx
'use client';
import React, { useContext, useState } from 'react';
import {
  RiHistoryLine,
  RiExpandDiagonalFill,
  RiCollapseDiagonalLine,
  RiRunLine,
  RiRoadsterLine,
  RiFlashlightLine
} from "react-icons/ri";
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';

import SkiDetail from './details/SkiDetails';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import { isNew, highlightSearchTerm } from '@/helpers/helpers';
import Button from '@/components/ui/Button';

export default function SkiItem(props) {
  const {
    ski,
    search = '',
    handleCheckboxChange,
    handleEdit,
    handleArchive,
    handleDelete,
    handleUnarchive,
    selectedSkis,
    expandedSkiId,
    toggleDetails,
    allExpanded = false,
    ownerUserId,
    readOnly = false,     // controls edit/archive/delete actions
    selectable = true,    // NEW: controls selection UI/behavior
  } = props;

  const { gloveMode } = useContext(UserPreferencesContext);
  const selectionKey = ski?._key ?? ski?.id;
  const showDetails = allExpanded || (selectionKey === expandedSkiId);
  const [showFullSerial, setShowFullSerial] = useState(false);

  const serialDisplay = showFullSerial
    ? ski.serialNumber
    : String(ski.serialNumber).slice(-3).padStart(3, '0');
  const hasMoreDigits = String(ski.serialNumber).length > 3;

  const handleEditClick = async (e) => {
    e.stopPropagation();
    await handleEdit(ski);
  };

  const handleArchiveClick = async () => {
    await handleArchive(ski.id);
  };

  const handleDeleteFinalClick = async () => {
    await handleDelete(ski.id);
  };

  const handleUnarchiveClick = async () => {
    await handleUnarchive(ski.id);
  };

  const styleIcons = {
    classic: <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 text-xs font-bold" title="Classic">C</span>,
    skate: <span className="px-2 py-0.5 rounded bg-green-100 text-green-600 text-xs font-bold" title="Skate">S</span>,
    dp: <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-600 text-xs font-bold" title="DP">DP</span>
  };

  const styleCheckboxColors = {
    classic: 'accent-emerald-700',
    skate: 'accent-blue-700',
    dp: 'accent-fuchsia-700'
  };

  const isSelected = !!selectedSkis?.[selectionKey];

  return (
    <div className={`rounded-2xl bg-white/75 backdrop-blur-xl ring-1 ring-black/5 shadow-xs overflow-hidden transition-colors duration-200 ${showDetails ? '' : 'hover:bg-gray-100'}`}>
      <div
        className="py-2 px-3 flex items-center cursor-pointer"
        onClick={() => { if (selectable) handleCheckboxChange(selectionKey); }}
      >
        {selectable && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleCheckboxChange(selectionKey)}
            className={`mr-3 accent-btn border-2 rounded ${gloveMode ? 'w-10 h-10' : 'w-4 h-4'} ${styleCheckboxColors[ski.style] || 'accent-gray-400 border-gray-300'}`}
            aria-label="Select ski"
          />
        )}
        <div className="flex items-center gap-3 grow">
          <div className="flex items-center gap-0.5">
            <span className="font-semibold">{serialDisplay}</span>
            {hasMoreDigits && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullSerial((prev) => !prev);
                }}
                title={showFullSerial ? 'Hide full serial' : 'Show full serial'}
                aria-label={showFullSerial ? 'Hide full serial' : 'Show full serial'}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                {showFullSerial ? (
                  <MdVisibilityOff size={18} />
                ) : (
                  <MdVisibility size={18} />
                )}
              </button>
            )}
          </div>
          {ski.grind && (
            <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
              {highlightSearchTerm(ski.grind, search)}
            </span>
          )}
        </div>
        {!gloveMode && !allExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleDetails(selectionKey);
            }}
            className="py-3 px-2"
          >
            {showDetails ? <RiCollapseDiagonalLine size={18} /> : <RiExpandDiagonalFill size={18} />}
          </button>
        )}
      </div>
      {showDetails && !gloveMode && (
        <div className="border-t border-gray-200 p-4">
          <SkiDetail
            ski={ski}
            onEdit={handleEditClick}
            onArchive={handleArchiveClick}
            onUnarchive={handleUnarchiveClick}
            onDelete={handleDeleteFinalClick}
            ownerUserId={ownerUserId}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  );
};