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

import Button from '@/components/ui/Button';
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
  const COLUMN_COUNT = 12;
  
  // Define columns with proper field IDs
  const columns = [
    { id: 'serialNumber', label: 'snr', sortable: true },
    { id: 'style', label: 'style', sortable: true },
    { id: 'brand', label: 'brand', sortable: true },
    { id: 'model', label: 'model', sortable: true },
    { id: 'grind', label: 'grind', sortable: true },
    { id: 'base', label: 'base', sortable: true },
    { id: 'length', label: 'length', sortable: true },
    { id: 'stiffness', label: 'stiffness', sortable: true },
    { id: 'construction', label: 'construction', sortable: true },
  ];

  const renderSortIndicator = (columnId) => {
    if (sortField === columnId) {
      return sortDirection === 'asc' ? <RiSortAsc /> : <RiSortDesc />;
    }
    return null;
  };

  if (!skis || skis.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-md overflow-hidden transition-all duration-200">
      <div className="overflow-x-auto pb-20">
        <table className="min-w-full border-collapse text-sm text-center">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-700">
              <th className="px-4 py-3" />
              {columns.map((column) => (
                <th
                  key={column.id}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                  onClick={() => column.sortable && onSort(column.id)}
                >
                  <div className="flex justify-center items-center space-x-1">
                    <span className="capitalize">{column.label}</span>
                    {column.sortable && renderSortIndicator(column.id)}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3">Actions</th>
              <th className="px-4 py-3">Expand</th>
            </tr>
          </thead>

          <tbody>
            {skis.map((ski) => {
              const showDetails = expandedSkiId === ski.id;
              const isSelected = !!selectedSkis[ski.id];

              return (
                <React.Fragment key={ski.id}>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect?.(ski.id)}
                        className="accent-btn w-4 h-4 mx-auto"
                        aria-label='Select'
                      />
                    </td>

                    {/* Render data cells using column definitions */}
                    {columns.map(column => (
                      <td key={column.id} className="px-4 py-2">
                        {highlightSearchTerm(ski[column.id] || '--', search)}
                      </td>
                    ))}

                    <td className="">
                      <div className="flex justify-center items-center gap-3">
                        <Button
                          variant="primary"
                          title='Edit'
                          onClick={() => onEdit?.(ski)}
                        >
                          <MdEdit size={16} />
                        </Button>

                        {ski.archived ? (
                          <Button
                            variant="archive"
                            title='Unarchive'
                            onClick={() => onUnarchive?.(ski.id)}
                          >
                            <MdUnarchive />
                          </Button>
                        ) : (
                          <Button
                            variant="archive"
                            title='Archive'
                            onClick={() => onArchive?.(ski.id)}
                          >
                            <MdArchive size={16} />
                          </Button>
                        )}

                        <Button
                          variant="danger"
                          title='Delete'
                          onClick={() => onDelete?.(ski.id)}
                        >
                          <MdDelete size={16} />
                        </Button>
                      </div>
                    </td>

                    <td className="px-4 py-2">
                      <Button
                        variant="secondary"
                        onClick={() => onToggleDetails?.(ski.id)}
                      >
                        {showDetails ? (
                          <RiCollapseDiagonalLine size={16} />
                        ) : (
                          <RiExpandDiagonalFill size={16} />
                        )}
                      </Button>
                    </td>
                  </tr>

                  {showDetails && (
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td colSpan={COLUMN_COUNT} className="px-4 py-4">
                        <div className="bg-white p-4 rounded-md border border-gray-300">
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