import React from 'react';
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
import { highlightSearchTerm } from '@/helpers/helpers';

const SkiTable = ({
  skis,
  search = '',
  selectedSkis = {},
  onToggleSelect,
  expandedSkiId,
  onToggleDetails,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive
}) => {

  if (!skis || skis.length === 0) {
    return null;
  }

  const renderSortIndicator = (column) => {
    if (sortField === column) {
      return sortDirection === 'asc' ? <RiSortAsc /> : <RiSortDesc />;
    }
    return null;
  };

  const COLUMN_COUNT = 12;

  return (
    <div className="overflow-x-auto pb-20">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-300 bg-gray-100 text-text">
            {/* Selection checkbox */}
            <th className="px-2 py-2 text-center" />

            {/* Data columns (all centered now) */}
            <th
              className="px-2 py-2 text-center cursor-pointer"
              onClick={() => onSort('serialNumber')}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>SNR</span>
                {renderSortIndicator('serialNumber')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-center cursor-pointer"
              onClick={() => onSort('style')}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>Style</span>
                {renderSortIndicator('style')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-center cursor-pointer"
              onClick={() => onSort('brand')}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>Brand</span>
                {renderSortIndicator('brand')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-center cursor-pointer"
              onClick={() => onSort('model')}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>Model</span>
                {renderSortIndicator('model')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-center cursor-pointer"
              onClick={() => onSort('grind')}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>Grind</span>
                {renderSortIndicator('grind')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-center cursor-pointer"
              onClick={() => onSort('base')}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>Base</span>
                {renderSortIndicator('base')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-center cursor-pointer"
              onClick={() => onSort('length')}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>Length</span>
                {renderSortIndicator('length')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-center cursor-pointer"
              onClick={() => onSort('stiffness')}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>Stiffness</span>
                {renderSortIndicator('stiffness')}
              </div>
            </th>
            <th
              className="px-2 py-2 text-center cursor-pointer"
              onClick={() => onSort('construction')}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>Construction</span>
                {renderSortIndicator('construction')}
              </div>
            </th>

            {/* Action column header */}
            <th className="px-2 py-2 text-center ">Actions</th>

            {/* Expand / collapse */}
            <th className="px-2 py-2 text-center" />
          </tr>
        </thead>

        <tbody>
          {skis.map((ski) => {
            const showDetails = expandedSkiId === ski.id;
            return (
              <React.Fragment key={ski.id}>
                {/* Main data row */}
                <tr className="border-b border-gray-300 hover:bg-gray-50">
                  {/* Selection */}
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={!!selectedSkis[ski.id]}
                      onChange={() => onToggleSelect?.(ski.id)}
                      className="accent-btn w-4 h-4"
                      aria-label='Select'
                    />
                  </td>

                  {/* Data columns */}
                  <td className="p-2 text-center">
                    {highlightSearchTerm(ski.serialNumber, search)}
                  </td>
                  <td className="p-2 text-center">
                    {highlightSearchTerm(t(ski.style), search)}
                  </td>
                  <td className="p-2 text-center">
                    {highlightSearchTerm(ski.brand, search)}
                  </td>
                  <td className="p-2 text-center">
                    {highlightSearchTerm(ski.model, search)}
                  </td>
                  <td className="p-2 text-center">
                    {highlightSearchTerm(ski.grind, search)}
                  </td>
                  <td className="p-2 text-center">
                    {ski.base || '--'}
                  </td>
                  <td className="p-2 text-center">
                    {ski.length || '--'}
                  </td>
                  <td className="p-2 text-center">
                    {ski.stiffness || '--'}
                  </td>
                  <td className="p-2 text-center">
                    {ski.construction || '--'}
                  </td>

                  {/* Row actions */}
                  <td className="p-2 flex justify-center gap-3">
                    <Button
                      variant="secondary"
                      title='Edit'
                      onClick={() => onEdit?.(ski)}
                    >
                      <MdEdit />
                    </Button>

                    {ski.archived ? (
                      <Button
                        variant="primary"
                        title='unarchive'
                        onClick={() => onUnarchive?.(ski.id)}
                      >
                        <MdUnarchive />
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        title='archive'
                        onClick={() => onArchive?.(ski.id)}
                      >
                        <MdArchive />
                      </Button>
                    )}

                    <Button
                      variant="danger"
                      title='delete'
                      onClick={() => onDelete?.(ski.id)}
                    >
                      <MdDelete />
                    </Button>
                  </td>

                  {/* Expand / collapse */}
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
