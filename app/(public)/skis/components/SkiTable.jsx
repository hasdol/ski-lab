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
    <div className="bg-white rounded-md overflow-hidden transition-all duration-200">
      <div className="overflow-x-auto pb-20">
        <table className="min-w-full border-collapse text-sm text-center">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-700">
              <th className="px-4 py-3" />
              {['snr', 'style', 'brand', 'model', 'grind', 'base', 'length', 'stiffness', 'construction'].map((field) => (
                <th
                  key={field}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                  onClick={() => onSort(field)}
                >
                  <div className="flex justify-center items-center space-x-1">
                    <span className="capitalize">{field}</span>
                    {renderSortIndicator(field)}
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
                    <td className="px-4 py-2">{highlightSearchTerm(ski.serialNumber, search)}</td>
                    <td className="px-4 py-2 capitalize">{highlightSearchTerm(ski.style, search)}</td>
                    <td className="px-4 py-2">{highlightSearchTerm(ski.brand, search)}</td>
                    <td className="px-4 py-2">{highlightSearchTerm(ski.model, search) || '--'}</td>
                    <td className="px-4 py-2">{highlightSearchTerm(ski.grind, search)}</td>
                    <td className="px-4 py-2">{ski.base || '--'}</td>
                    <td className="px-4 py-2">{ski.length || '--'}</td>
                    <td className="px-4 py-2">{ski.stiffness || '--'}</td>
                    <td className="px-4 py-2">{ski.construction || '--'}</td>

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
