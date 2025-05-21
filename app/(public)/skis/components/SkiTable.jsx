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
import SkiDetails from './details/SkiDetails';
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
    <div className={`bg-white rounded-md overflow-hidden transition-all duration-200 
    }`}>
      <div className="overflow-x-auto pb-20">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-700">
              {/* Selection checkbox */}
              <th className="px-4 py-3 text-left" />

              {/* Data columns */}
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('serialNumber')}
              >
                <div className="flex items-center space-x-1">
                  <span>SNR</span>
                  {renderSortIndicator('serialNumber')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('style')}
              >
                <div className="flex items-center space-x-1">
                  <span>Style</span>
                  {renderSortIndicator('style')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('brand')}
              >
                <div className="flex items-center space-x-1">
                  <span>Brand</span>
                  {renderSortIndicator('brand')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('model')}
              >
                <div className="flex items-center space-x-1">
                  <span>Model</span>
                  {renderSortIndicator('model')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('grind')}
              >
                <div className="flex items-center space-x-1">
                  <span>Grind</span>
                  {renderSortIndicator('grind')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('base')}
              >
                <div className="flex items-center space-x-1">
                  <span>Base</span>
                  {renderSortIndicator('base')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('length')}
              >
                <div className="flex items-center space-x-1">
                  <span>Length</span>
                  {renderSortIndicator('length')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('stiffness')}
              >
                <div className="flex items-center space-x-1">
                  <span>Stiffness</span>
                  {renderSortIndicator('stiffness')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('construction')}
              >
                <div className="flex items-center space-x-1">
                  <span>Construction</span>
                  {renderSortIndicator('construction')}
                </div>
              </th>

              {/* Action column header */}
              <th className="px-4 py-3 text-left">Actions</th>

              {/* Expand/collapse */}
              <th className="px-4 py-3 text-left" />
            </tr>
          </thead>

          <tbody>
            {skis.map((ski) => {
              const showDetails = expandedSkiId === ski.id;
              const isSelected = !!selectedSkis[ski.id];
              
              return (
                <React.Fragment key={ski.id}>
                  {/* Main data row */}
                  <tr className={`border-b border-gray-200 `}>
                    {/* Selection */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect?.(ski.id)}
                        className="accent-btn w-4 h-4"
                        aria-label='Select'
                      />
                    </td>

                    {/* Data columns */}
                    <td className="px-4 py-3">
                      {highlightSearchTerm(ski.serialNumber, search)}
                    </td>
                    <td className="px-4 py-3">
                      {highlightSearchTerm(ski.style, search)}
                    </td>
                    <td className="px-4 py-3">
                      {highlightSearchTerm(ski.brand, search)}
                    </td>
                    <td className="px-4 py-3">
                      {highlightSearchTerm(ski.model, search)}
                    </td>
                    <td className="px-4 py-3">
                      {highlightSearchTerm(ski.grind, search)}
                    </td>
                    <td className="px-4 py-3">
                      {ski.base || '--'}
                    </td>
                    <td className="px-4 py-3">
                      {ski.length || '--'}
                    </td>
                    <td className="px-4 py-3">
                      {ski.stiffness || '--'}
                    </td>
                    <td className="px-4 py-3">
                      {ski.construction || '--'}
                    </td>

                    {/* Row actions */}
                    <td className="px-4 py-3 flex items-center gap-2">
                      <Button
                        variant="primary"
                        title='Edit'
                        onClick={() => onEdit?.(ski)}
                      >
                        <MdEdit  />
                      </Button>

                      {ski.archived ? (
                        <Button
                          variant="archive"
                          title='Unarchive'
                          onClick={() => onUnarchive?.(ski.id)}
                        >
                          <MdUnarchive  />
                        </Button>
                      ) : (
                        <Button
                          variant="archive"
                          title='Archive'
                          onClick={() => onArchive?.(ski.id)}
                        >
                          <MdArchive />
                        </Button>
                      )}

                      <Button
                        variant="danger"
                        title='Delete'
                        onClick={() => onDelete?.(ski.id)}
                      >
                        <MdDelete />
                      </Button>
                    </td>

                    {/* Expand/collapse */}
                    <td className="px-4 py-3">
                      <Button
                        variant="secondary"
                        onClick={() => onToggleDetails?.(ski.id)}
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
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td colSpan={COLUMN_COUNT} className="px-4 py-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                          <SkiDetails
                            ski={ski}
                            onEdit={() => onEdit?.(ski)}
                            onArchive={() => onArchive?.(ski.id)}
                            onUnarchive={() => onUnarchive?.(ski.id)}
                            onDelete={() => onDelete?.(ski.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SkiTable;