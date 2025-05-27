// ./components/SkiItem/SkiItem.jsx
import React, { useContext } from 'react';
import { RiHistoryLine, RiExpandDiagonalFill, RiCollapseDiagonalLine } from "react-icons/ri";

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
    <div
      className={`animate-fade-down animate-duration-300 transition-all rounded-md duration-200 border border-gray-300 ${showDetails
          ? ''
          : ' hover:bg-gray-50'
        }`}
    >
      {/* Main clickable row - now controls checkbox */}
      <div
        className="p-3 w-full cursor-pointer"
        variant='secondary'
        onClick={() => handleCheckboxChange(ski.id)}
      >
        <div className={`flex items-center space-x-1 ${showDetails && 'font-semibold'}`}>
          <input
            type="checkbox"
            checked={selectedSkis[ski.id] || false}
            readOnly
            className={`mr-2 accent-btn ${gloveMode ? 'w-10 h-10' : 'w-4 h-4'}`}
            aria-label='select ski'
          />

          {!gloveMode ? (
            <div className='flex space-x-1 items-center'>
              <span>{highlightSearchTerm(ski.serialNumber, search)}</span>
              <span>•</span>
              <span>{highlightSearchTerm(ski.grind, search)}</span>
              <span>•</span>
              <span>{highlightSearchTerm(ski.style.charAt(0).toUpperCase() + ski.style.slice(1), search)}</span>
              {/* Archive or New indicators */}
              {ski.archived && <RiHistoryLine />}
              {isNew(ski) && !gloveMode && <p className="text-highlight text-xs"> - New</p>}
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-lg font-bold">{ski.serialNumber}</span>
              <span>{ski.style}</span>
            </div>
          )}



          {/* Magnifying glass button for details */}
          {!gloveMode && !allExpanded && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                toggleDetails(ski.id);
              }}
              variant='secondary'
              className="ml-auto z-100 p-2!"
            >
              {showDetails ? <RiCollapseDiagonalLine /> : <RiExpandDiagonalFill />}

            </Button>
          )}

        </div>
      </div>

      {/* Detailed info if expanded */}
      {showDetails && !gloveMode && (
        <SkiDetail
          ski={ski}
          onEdit={handleEditClick}
          onArchive={handleArchiveClick}
          onUnarchive={handleUnarchiveClick}
          onDelete={handleDeleteFinalClick}
        />
      )}
    </div>
  );
};

export default SkiItem;