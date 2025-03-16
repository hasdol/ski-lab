// ./components/SkiItem/SkiItem.jsx
import React, { useContext } from 'react';
import { MdArrowDropDown, MdArrowDropUp } from "react-icons/md";
import { RiEditLine, RiHistoryLine } from "react-icons/ri";
import { useTranslation } from 'react-i18next';

import SkiDetail from '../SkiDetail/SkiDetail';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import { isNew } from '@/helpers/helpers';

const SkiItem = ({
  ski,
  handleCheckboxChange,
  handleEdit,
  handleArchive,
  handleDelete,
  handleUnarchive,
  selectedSkis,
  expandedSkiId,
  toggleDetails,

  // NEW: “Expand All” logic
  allExpanded = false, // default to false if not passed
}) => {
  const { t } = useTranslation();
  const { gloveMode } = useContext(UserPreferencesContext);

  // If "allExpanded" is true, always show details.
  // Otherwise, show details only if the expanded ID matches this ski.
  const showDetails = allExpanded || (ski.id === expandedSkiId);

  const handleEditClick = async () => {
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
      className={`shadow ${!showDetails ? 'hover:bg-sbtn shadow-none' : ''
        } ${!gloveMode && 'bg-container rounded'} ${selectedSkis[ski.id] && ''
        } animate-fade-down animate-duration-300`}
    >
      {/* Main clickable row */}
      <div
        className={`pl-3 p-1 cursor-pointer flex justify-between items-center ${gloveMode && 'py-2'}`}
        onClick={() => {
          // Only toggle details if allExpanded is *not* active
          // (otherwise user’s click might be confusing if everything is forced open).
          if (!allExpanded) {
            toggleDetails(ski.id);
          }
        }}
      >
        <div className={`flex items-center space-x-1 ${showDetails && 'font-semibold'}`}>
          <input
            type="checkbox"
            checked={selectedSkis[ski.id] || false}
            onChange={() => handleCheckboxChange(ski.id)}
            className={`mr-2 accent-btn ${gloveMode ? 'w-10 h-10' : 'w-4 h-4'}`}
            onClick={(e) => e.stopPropagation()}
          />

          {!gloveMode ? (
            <>
              <span>{ski.serialNumber}</span>
              <span>/</span>
              <span>{ski.grind}</span>
              <span>/</span>
              <span>{t(ski.style)}</span>
            </>
          ) : (
            <div className="flex flex-col">
              <span className="text-lg font-bold">{ski.serialNumber}</span>
              <span>{t(ski.style)}</span>
            </div>
          )}

          {/* Up/Down arrow, only if we're not forced open by "allExpanded" */}
          {!gloveMode && !allExpanded && (
            <p className="mr-1">
              {showDetails ? <MdArrowDropUp size={20} /> : <MdArrowDropDown size={20} />}
            </p>
          )}

          {/* Archive or New icons */}
          {ski.archived && <RiHistoryLine />}
          {isNew(ski) && !gloveMode && <p className="text-highlight text-xs">{t('new')}</p>}
        </div>

        {/* Edit Button */}
        {!gloveMode &&
          <div className="flex p-2 rounded-full bg-background ">
            <button
              onClick={handleEditClick}
              className='shadow bg-btn text-btntxt hover:opacity-90  rounded-full p-2 cursor-pointer'
            >
              <RiEditLine />
            </button>
          </div>
        }

      </div>

      {/* Detailed info if expanded */}
      {showDetails && !gloveMode && (
        <div className="mt-2">
          <SkiDetail
            ski={ski}
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
