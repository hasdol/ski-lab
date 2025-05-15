// ./components/SkiItem/SkiItem.jsx
import React, { useContext } from 'react';
import { RiHistoryLine, RiExpandDiagonalFill, RiCollapseDiagonalLine } from "react-icons/ri";
import { useTranslation } from 'react-i18next';

import SkiDetail from './details/Details';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import { isNew } from '@/helpers/helpers';
import Button from '@/components/common/Button';
import highlight from '@/helpers/highlightSearchTerm';

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
  const { t } = useTranslation();
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
      className={`p-2 px-3 transition-all duration-200 border-l-2 ${showDetails
          ? 'border-gray-400'
          : 'border-gray-300 hover:bg-gray-50'
        }`}
    >
      {/* Main clickable row - now controls checkbox */}
      <div
        className="w-full cursor-pointer"
        variant='secondary'
        onClick={() => handleCheckboxChange(ski.id)}
      >
        <div className={`flex items-center space-x-1 ${showDetails && 'font-semibold'}`}>
          <input
            type="checkbox"
            checked={selectedSkis[ski.id] || false}
            readOnly
            className={`mr-2 accent-btn ${gloveMode ? 'w-10 h-10' : 'w-4 h-4'}`}
            aria-label={t('selectSki')}
          />

          {!gloveMode ? (
            <div className='flex space-x-1 items-center'>
              <span>{highlight(ski.serialNumber, search)}</span>
              <span>•</span>
              <span>{highlight(ski.grind, search)}</span>
              <span>•</span>
              <span>{highlight(t(ski.style), search)}</span>
              {/* Archive or New indicators */}
              {ski.archived && <RiHistoryLine />}
              {isNew(ski) && !gloveMode && <p className="text-highlight text-xs"> - {t('new')}</p>}
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-lg font-bold">{ski.serialNumber}</span>
              <span>{t(ski.style)}</span>
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