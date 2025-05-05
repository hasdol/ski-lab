// SkiTable.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit, MdDelete, MdArchive, MdUnarchive } from "react-icons/md";
import { RiSortAsc, RiSortDesc } from "react-icons/ri";

const SkiTable = ({
  skis,
  sortField,       // the current sort field
  sortDirection,   // 'asc' or 'desc'
  onSort,          // callback to parent to change sorting
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
}) => {
  const { t } = useTranslation();

  if (!skis || skis.length === 0) {
    return null;
  }

  // Helper: show sort icon if this column is the active sort
  const renderSortIndicator = (column) => {
    if (sortField === column) {
      return sortDirection === 'asc' ? <RiSortAsc /> : <RiSortDesc />;
    }
    return null;
  };

  return (
    <div className="overflow-x-auto pb-20">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-sbtn text-text">
            {/* Serial Number */}
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('serialNumber')}
              title={t('sort_by') + ' ' + t('serial_number')}
            >
              <div className="flex items-center space-x-1">
                <span>SNR</span>
                {renderSortIndicator('serialNumber')}
              </div>
            </th>

            {/* Style */}
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('style')}
              title={t('sort_by') + ' ' + t('style')}
            >
              <div className="flex items-center space-x-1">
                <span>{t('style')}</span>
                {renderSortIndicator('style')}
              </div>
            </th>

            {/* Brand */}
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('brand')}
              title={t('sort_by') + ' ' + t('brand')}
            >
              <div className="flex items-center space-x-1">
                <span>{t('brand')}</span>
                {renderSortIndicator('brand')}
              </div>
            </th>

            {/* Model */}
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('model')}
              title={t('sort_by') + ' ' + t('model')}
            >
              <div className="flex items-center space-x-1">
                <span>{t('model')}</span>
                {renderSortIndicator('model')}
              </div>
            </th>

            {/* Grind */}
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('grind')}
              title={t('sort_by') + ' ' + t('grind')}
            >
              <div className="flex items-center space-x-1">
                <span>{t('grind')}</span>
                {renderSortIndicator('grind')}
              </div>
            </th>

            {/* Base */}
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('base')}
              title={t('sort_by') + ' Base'}
            >
              <div className="flex items-center space-x-1">
                <span>Base</span>
                {renderSortIndicator('base')}
              </div>
            </th>

            {/* Length */}
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('length')}
              title={t('sort_by') + ' ' + t('length')}
            >
              <div className="flex items-center space-x-1">
                <span>{t('length')}</span>
                {renderSortIndicator('length')}
              </div>
            </th>

            {/* Stiffness */}
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('stiffness')}
              title={t('sort_by') + ' ' + t('stiffness')}
            >
              <div className="flex items-center space-x-1">
                <span>{t('stiffness')}</span>
                {renderSortIndicator('stiffness')}
              </div>
            </th>

            {/* Construction */}
            <th
              className="px-2 py-2 text-left cursor-pointer"
              onClick={() => onSort('construction')}
              title={t('sort_by') + ' ' + t('construction')}
            >
              <div className="flex items-center space-x-1">
                <span>{t('construction')}</span>
                {renderSortIndicator('construction')}
              </div>
            </th>

            <th className="px-2 py-2 text-center">{t('actions')}</th>
          </tr>
        </thead>

        <tbody>
          {skis.map((ski) => (
            <tr key={ski.id} className="border-b hover:bg-sbtn">
              <td className="px-2 py-2">{ski.serialNumber || '--'}</td>
              <td className="px-2 py-2">{t(ski.style) || '--'}</td>
              <td className="px-2 py-2">{ski.brand || '--'}</td>
              <td className="px-2 py-2">{ski.model || '--'}</td>
              <td className="px-2 py-2">{ski.grind || '--'}</td>
              <td className="px-2 py-2">{ski.base || '--'}</td>
              <td className="px-2 py-2">{ski.length || '--'}</td>
              <td className="px-2 py-2">{ski.stiffness || '--'}</td>
              <td className="px-2 py-2">{ski.construction || '--'}</td>
              <td className="px-2 py-2 flex justify-center">
                {/* Edit button */}
                <button
                  className="inline-block mx-1 p-2 rounded bg-btn text-btntxt hover:opacity-90"
                  title={t('edit')}
                  onClick={() => onEdit?.(ski)}
                >
                  <MdEdit />
                </button>

                {/* Archive / Unarchive */}
                {ski.archived ? (
                  <button
                    className="inline-block mx-1 p-2 rounded bg-btn text-btntxt hover:opacity-90"
                    title={t('unarchive')}
                    onClick={() => onUnarchive?.(ski.id)}
                  >
                    <MdUnarchive />
                  </button>
                ) : (
                  <button
                    className="inline-block mx-1 p-2 rounded bg-btn text-btntxt hover:opacity-90"
                    title={t('archive')}
                    onClick={() => onArchive?.(ski.id)}
                  >
                    <MdArchive />
                  </button>
                )}

                {/* Delete button */}
                <button
                  className="inline-block mx-1 p-2 rounded bg-white border border-delete text-delete hover:bg-sbtn"
                  title={t('delete')}
                  onClick={() => onDelete?.(ski.id)}
                >
                  <MdDelete />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SkiTable;
