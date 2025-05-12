import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdEdit,
  MdDelete,
  MdArchive,
  MdUnarchive
} from "react-icons/md";
import {
  RiSortAsc,
  RiSortDesc,
  RiExpandDiagonalFill,
  RiCollapseDiagonalLine
} from "react-icons/ri";

import Button from '@/components/common/Button';
import SkiDetails from './details/Details';

const SkiTable = ({
  skis,
  /* selection */
  selectedSkis = {},
  onToggleSelect,
  /* details */
  expandedSkiId,
  onToggleDetails,
  /* sorting */
  sortField,
  sortDirection,
  onSort,
  /* actions */
  onEdit,
  onDelete,
  onArchive,
  onUnarchive
}) => {
  const { t } = useTranslation();

  if (!skis || skis.length === 0) {
    return null;
  }

  /**
   * Show ↑ / ↓ icon for currently active sort column.
   */
  const renderSortIndicator = (column) => {
    if (sortField === column) {
      return sortDirection === 'asc' ? <RiSortAsc /> : <RiSortDesc />;
    }
    return null;
  };

  // Total columns (update if you add/remove columns)
  const COLUMN_COUNT = 12;

  return (
    <div className="overflow-x-auto pb-20">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-300 bg-gray-100 text-text">
            {/* Selection checkbox */}
            <th className="px-2 py-2 text-center" />
            {/* Expand / collapse */}
            <th className="px-2 py-2 text-center" />

            {/* Data columns */}
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('serialNumber')}
            >
              <div className="flex items-center space-x-1">
                <span>SNR</span>
                {renderSortIndicator('serialNumber')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('style')}
            >
              <div className="flex items-center space-x-1">
                <span>{t('style')}</span>
                {renderSortIndicator('style')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('brand')}
            >
              <div className="flex items-center space-x-1">
                <span>{t('brand')}</span>
                {renderSortIndicator('brand')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('model')}
            >
              <div className="flex items-center space-x-1">
                <span>{t('model')}</span>
                {renderSortIndicator('model')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('grind')}
            >
              <div className="flex items-center space-x-1">
                <span>{t('grind')}</span>
                {renderSortIndicator('grind')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('base')}
            >
              <div className="flex items-center space-x-1">
                <span>Base</span>
                {renderSortIndicator('base')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('length')}
            >
              <div className="flex items-center space-x-1">
                <span>{t('length')}</span>
                {renderSortIndicator('length')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('stiffness')}
            >
              <div className="flex items-center space-x-1">
                <span>{t('stiffness')}</span>
                {renderSortIndicator('stiffness')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('construction')}
            >
              <div className="flex items-center space-x-1">
                <span>{t('construction')}</span>
                {renderSortIndicator('construction')}
              </div>
            </th>
            {/* Action column header */}
            <th className="px-2 py-2 text-center">{t('actions')}</th>
          </tr>
        </thead>

        <tbody>
          {skis.map((ski) => {
            const showDetails = expandedSkiId === ski.id;
            return (
              <React.Fragment key={ski.id}>
                {/* Main data row */}
                <tr className="border-b border-gray-300 hover:bg-gray-100">
                  {/* ✅ Selection */}
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={!!selectedSkis[ski.id]}
                      onChange={() => onToggleSelect?.(ski.id)}
                      className="accent-btn w-4 h-4"
                      aria-label={t('select')}
                    />
                  </td>

                  {/* 🔍 Expand / collapse */}
                  <td className="p-2 text-center">
                    <Button
                      variant="secondary"
                      onClick={() => onToggleDetails?.(ski.id)}
                      title={showDetails ? t('collapse') : t('expand')}
                    >
                      {showDetails ? (
                        <RiCollapseDiagonalLine />
                      ) : (
                        <RiExpandDiagonalFill />
                      )}
                    </Button>
                  </td>

                  {/* Data columns */}
                  <td className="p-2">{ski.serialNumber || '--'}</td>
                  <td className="p-2">{t(ski.style) || '--'}</td>
                  <td className="p-2">{ski.brand || '--'}</td>
                  <td className="p-2">{ski.model || '--'}</td>
                  <td className="p-2">{ski.grind || '--'}</td>
                  <td className="p-2">{ski.base || '--'}</td>
                  <td className="p-2">{ski.length || '--'}</td>
                  <td className="p-2">{ski.stiffness || '--'}</td>
                  <td className="p-2">{ski.construction || '--'}</td>

                  {/* 🔧 Row actions */}
                  <td className="p-2 flex justify-center gap-4">
                    <Button
                      variant="secondary"
                      title={t('edit')}
                      onClick={() => onEdit?.(ski)}
                    >
                      <MdEdit />
                    </Button>

                    {ski.archived ? (
                      <Button
                        variant="primary"
                        title={t('unarchive')}
                        onClick={() => onUnarchive?.(ski.id)}
                      >
                        <MdUnarchive />
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        title={t('archive')}
                        onClick={() => onArchive?.(ski.id)}
                      >
                        <MdArchive />
                      </Button>
                    )}

                    <Button
                      variant="danger"
                      title={t('delete')}
                      onClick={() => onDelete?.(ski.id)}
                    >
                      <MdDelete />
                    </Button>
                  </td>
                </tr>

                {/* Expanded details row */}
                {showDetails && (
                  <tr className="bg-gray-50">
                    <td colSpan={COLUMN_COUNT} className="p-4">
                      <SkiDetails
                        ski={ski}
                        onEdit={() => onEdit?.(ski)}
                        onArchive={() => onArchive?.(ski.id)}
                        onUnarchive={() => onUnarchive?.(ski.id)}
                        onDelete={() => onDelete?.(ski.id)}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SkiTable;