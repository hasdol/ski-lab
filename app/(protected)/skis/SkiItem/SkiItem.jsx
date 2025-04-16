// ./components/SkiItem/SkiItem.jsx
import React, { useContext } from 'react';
import { RiHistoryLine, RiEyeLine, RiEyeOffLine   } from "react-icons/ri";
import { useTranslation } from 'react-i18next';

import SkiDetail from '../SkiDetail/SkiDetail';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import { isNew } from '@/helpers/helpers';
import Button from '@/components/common/Button';

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
    <div className={`animate-fade-down animate-duration-300`}>
      {/* Main clickable row - now controls checkbox */}
      <Button
        className={`w-full ${gloveMode && 'py-2'}`}
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
              <span>{ski.serialNumber}</span>
              <span>/</span>
              <span>{ski.grind}</span>
              <span>/</span>
              <span>{t(ski.style)}</span>
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
              className="ml-auto"
            >
              {showDetails?<RiEyeOffLine size={12} />:<RiEyeLine size={12}/>}
              
            </Button>
          )}

        </div>
      </Button>

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