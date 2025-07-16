// ./components/SkiItem/SkiItem.jsx
'use client';
import React, { useContext } from 'react';
import {
  RiHistoryLine,
  RiExpandDiagonalFill,
  RiCollapseDiagonalLine
} from "react-icons/ri";

import SkiDetail from './details/SkiDetails';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import { isNew, highlightSearchTerm } from '@/helpers/helpers';
import Button from '@/components/ui/Button';

const SkiItem = ({
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
}) => {
  const { gloveMode } = useContext(UserPreferencesContext);
  const showDetails = allExpanded || (ski.id === expandedSkiId);

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

  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden transition-colors duration-200 ${showDetails ? '' : 'hover:bg-blue-50'}`}>
      {/* Main clickable row */}
      <div
        className="py-2 px-3 flex items-center cursor-pointer"
        onClick={() => handleCheckboxChange(ski.id)}
      >
        <input
          type="checkbox"
          checked={selectedSkis[ski.id] || false}
          readOnly
          className={`mr-3 accent-btn ${gloveMode ? 'w-10 h-10' : 'w-4 h-4'}`}
          aria-label="select ski"
        />
        <div className="flex-grow">
          {!gloveMode ? (
            <div className={`flex items-center space-x-2 ${showDetails && 'font-semibold'}`}>
              <span>{highlightSearchTerm(ski.serialNumber, search)}</span>
              <span className="text-gray-400">•</span>
              <span>{highlightSearchTerm(ski.grind, search)}</span>
              <span className="text-gray-400">•</span>
              <span>{highlightSearchTerm(ski.style.charAt(0).toUpperCase() + ski.style.slice(1), search)}</span>
              {ski.archived && <RiHistoryLine className="ml-2 text-gray-500" />}
              {isNew(ski) && !gloveMode && (
                <span className="ml-1 text-xs text-blue-600">New</span>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-lg font-bold">{ski.serialNumber}</span>
              <span>{ski.style}</span>
            </div>
          )}
        </div>
        {!gloveMode && !allExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleDetails(ski.id);
            }}
            className='py-3 px-2'
          >
            {showDetails ? <RiCollapseDiagonalLine size={18}/> : <RiExpandDiagonalFill size={18}/>}
          </button>
        )}
      </div>

      {/* Detailed info */}
      {showDetails && !gloveMode && (
        <div className="border-t border-gray-200 p-4">
          <SkiDetail
            ski={ski}
            onEdit={handleEditClick}
            onArchive={handleArchiveClick}
            onUnarchive={handleUnarchiveClick}
            onDelete={handleDeleteFinalClick}
          />
        </div>
      )}
    </div>
  );
};

export default SkiItem;