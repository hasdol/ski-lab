import React from 'react';
import {
  RiSortAsc,
  RiSortDesc,
  RiExpandDiagonalFill,
  RiCollapseDiagonalLine,
  RiEditLine,
  RiDeleteBinLine,
  RiInboxArchiveLine,
  RiInboxUnarchiveLine
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
  onUnarchive,
  ownerUserId,
  readOnly = false,
  selectable = true,
}) => {
  const COLUMN_COUNT = 12;

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

  if (!skis || skis.length === 0) return null;

  const colSpan =
    (selectable ? 1 : 0) +
    columns.length +
    (!readOnly ? 1 : 0) +
    1; // details toggle column

  return (
    <div className="rounded-md overflow-hidden transition-all duration-200 md:w-3/4 md:mt-10 md:absolute md:left-1/2 md:-translate-x-1/2">
      <div className="overflow-x-auto pb-20">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {selectable && <th className="px-4 py-3">Select</th>}
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
              {!readOnly && <th className="px-4 py-3">Actions</th>}
              <th className="px-4 py-3" />
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {skis.map((ski) => {
              const selectionKey = ski?._key ?? ski?.id;
              const isSelected = !!selectedSkis?.[selectionKey];
              const showDetails = expandedSkiId === selectionKey;

              // If "selected extras" from other owners are displayed, never show mutate actions for them.
              const isRowOwnedByViewUser =
                !ski?.ownerUid || !ownerUserId || ski.ownerUid === ownerUserId;
              const canShowActions = !readOnly && isRowOwnedByViewUser;

              return (
                <React.Fragment key={selectionKey}>
                  <tr className="hover:bg-gray-50">
                    {selectable && (
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect?.(selectionKey)}
                          className="accent-btn w-4 h-4 mx-auto"
                          aria-label="Select"
                        />
                      </td>
                    )}

                    {columns.map((column) => (
                      <td key={column.id} className="px-4 py-2 text-center">
                        {highlightSearchTerm(ski[column.id] || '--', search)}
                      </td>
                    ))}

                    {!readOnly && (
                      <td className="px-4 py-2">
                        {canShowActions ? (
                          <div className="flex justify-center items-center gap-3">
                            <Button variant="secondary" title="Edit" onClick={() => onEdit?.(ski)}>
                              <RiEditLine size={16} />
                            </Button>

                            {ski.archived ? (
                              <Button
                                variant="secondary"
                                title="Unarchive"
                                onClick={() => onUnarchive?.(ski.id)}
                              >
                                <RiInboxUnarchiveLine size={16} />
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                title="Archive"
                                onClick={() => onArchive?.(ski.id)}
                              >
                                <RiInboxArchiveLine size={16} />
                              </Button>
                            )}

                            <Button variant="danger" title="Delete" onClick={() => onDelete?.(ski.id)}>
                              <RiDeleteBinLine size={16} />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center text-xs text-gray-400">—</div>
                        )}
                      </td>
                    )}

                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => onToggleDetails?.(selectionKey)}
                        className="py-3 px-2"
                        aria-label={showDetails ? 'Collapse details' : 'Expand details'}
                      >
                        {showDetails ? (
                          <RiCollapseDiagonalLine size={18} />
                        ) : (
                          <RiExpandDiagonalFill size={18} />
                        )}
                      </button>
                    </td>
                  </tr>

                  {showDetails && (
                    <tr>
                      <td colSpan={colSpan}>
                        <div className="bg-white p-4 shadow mb-5 rounded-b-lg">
                          <SkiDetails
                            ski={ski}
                            onEdit={() => canShowActions && onEdit?.(ski)}
                            onArchive={() => canShowActions && onArchive?.(ski.id)}
                            onUnarchive={() => canShowActions && onUnarchive?.(ski.id)}
                            onDelete={() => canShowActions && onDelete?.(ski.id)}
                            ownerUserId={ownerUserId}
                            readOnly={readOnly || !isRowOwnedByViewUser}
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