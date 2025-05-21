'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RiFilter2Fill,
  RiFilter2Line,
  RiEditLine,
  RiDeleteBinLine,
  RiCloseLine,
} from 'react-icons/ri';
import { useDebounce } from 'use-debounce';

import usePaginatedResults from '@/hooks/usePaginatedResults';
import { useAuth } from '@/context/AuthContext';
import Filter from './components/ResultsFilter';
import Spinner from '@/components/common/Spinner/Spinner';
import ResultsSearch from '../../../components/Search/Search';
import DeleteTestModal from '@/components/DeleteTestModal/DeleteTestModal';
import { deleteTestResultEverywhere } from '@/lib/firebase/firestoreFunctions';
import Button from '@/components/common/Button';
import { formatSnowTypeLabel, formatSourceLabel, highlightSearchTerm } from '@/helpers/helpers';

const Results = () => {
  // ------------------------------------------------------------
  // Local UI state
  // ------------------------------------------------------------
  const [searchTermRaw, setSearchTermRaw] = useState('');
  const [debouncedSearch] = useDebounce(searchTermRaw.toLowerCase(), 300);
  const [tempRange, setTempRange] = useState([-30, 30]);
  const defaultTempRange = [-30, 30];
  const [styleFilter, setStyleFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTestId, setCurrentTestId] = useState(null);

  const { user } = useAuth();
  const router = useRouter();

  // ------------------------------------------------------------
  // Data hook – pulls a page at a time
  // ------------------------------------------------------------
  const {
    docs: resultsToShow,
    loadMore,
    exhausted,
    loading,
    refresh,
  } = usePaginatedResults({
    term: debouncedSearch,
    temp: tempRange,
    style: styleFilter,
    sortOrder,
  });

  // ------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------
  const handleSearch = (val) => {
    setSearchTermRaw(val);
  };
  const handleTempCommit = (newVal) => setTempRange(newVal);
  const toggleFilter = () => setIsFilterOpen((prev) => !prev);
  const resetFilter = () => {
    setSearchTermRaw('');
    setTempRange(defaultTempRange);
    setStyleFilter('all');
  };
  const isFilterActive =
    tempRange[0] !== defaultTempRange[0] ||
    tempRange[1] !== defaultTempRange[1] ||
    styleFilter !== 'all';

  const handleEdit = (id) => router.push(`/results/${id}/edit`);
  const handleDelete = (id) => {
    if (!user?.uid) return;
    setCurrentTestId(id);
    setModalOpen(true);
  };
  const handleModalConfirm = async () => {
    try {
      const response = await deleteTestResultEverywhere({
        userId: user.uid,
        testId: currentTestId,
      });
      alert(response.message);
    } catch (err) {
      console.error('Error deleting test result:', err);
      alert('Error deleting result');
    }
    setModalOpen(false);
    setCurrentTestId(null);
    refresh();
  };


  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div className='p-3 md:w-2/3 mx-auto'>

      <div className="animate-fade animate-duration-300">
        <h1 className="text-3xl font-bold text-gray-900 my-4">
          Results
        </h1>

        {/* Search + filter button */}
        <div className="flex items-end justify-between mb-2">
          <ResultsSearch onSearch={handleSearch} />
          <div className="flex flex-col items-center w-fit">
            <label className="text-sm font-semibold mb-1">Filter</label>
            <Button
              onClick={toggleFilter}
              variant="secondary"
              className={isFilterActive ? 'text-gray-800' : ''}
            >
              {isFilterActive ? <RiFilter2Fill /> : <RiFilter2Line />}
            </Button>
          </div>
        </div>

        {/* Active filter chips */}
        {isFilterActive && (
          <div className="flex space-x-2 text-sm">
            {styleFilter !== 'all' && (
              <Button
                variant="tab"
                onClick={() => setStyleFilter('all')}
              >
                <span className="flex">
                  {styleFilter} <RiCloseLine />
                </span>
              </Button>
            )}
            {(tempRange[0] !== defaultTempRange[0] ||
              tempRange[1] !== defaultTempRange[1]) && (
                <Button variant="secondary" onClick={resetFilter}>
                  <span className="flex">
                    Temperature filter <RiCloseLine />
                  </span>
                </Button>
              )}
          </div>
        )}

        {/* Filter drawer */}
        <Filter
          open={isFilterOpen}
          onClose={toggleFilter}
          tempRange={tempRange}
          onTempCommit={handleTempCommit}
          styleFilter={styleFilter}
          setStyleFilter={setStyleFilter}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          resetFilter={resetFilter}
        />

        {/* Results list */}
        <div className="my-5">
          {loading && resultsToShow.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
            </div>
          ) : resultsToShow.length === 0 && user ? (
            <p className="mt-4">
              You have no results
            </p>
          ) : (
            <div className="grid gap-4">
              {resultsToShow.map((result) => (
                <div
                  key={result.id}
                  className="border border-gray-300 rounded-md p-5 flex flex-col justify-between animate-fade-down animate-duration-300 space-y-5"
                >
                  {/* header */}
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold text-xl">
                        {highlightSearchTerm(
                          result.style.charAt(0).toUpperCase() + result.style.slice(1),
                          debouncedSearch
                        )} /{' '}
                        {highlightSearchTerm(`${result.temperature}°C`, debouncedSearch)}
                      </h3>
                      <i className="text-sm">
                        {highlightSearchTerm(result.location, debouncedSearch)}
                      </i>
                    </div>
                    <div className="space-x-2 shrink-0">
                      <Button
                        onClick={() => handleEdit(result.id)}
                        variant="secondary"
                      >
                        <RiEditLine />
                      </Button>
                      <Button
                        onClick={() => handleDelete(result.id)}
                        variant="danger"
                      >
                        <RiDeleteBinLine />
                      </Button>
                    </div>
                  </div>

                  {/* ranking table */}
                  <ul className="space-y-2">
                    {result.rankings.map((ranking, idx) => (
                      <li
                        key={idx}
                        className="flex py-1 text-sm"
                      >
                        <span className="flex items-center w-1/3">
                          {highlightSearchTerm(
                            ranking.skiId
                              ? ranking.serialNumber
                              : 'Deleted',
                            debouncedSearch
                          )}
                          {ranking.score === 0 && (
                            <span className="mx-2 text-highlight text-xs">
                              - New
                            </span>
                          )}
                        </span>
                        <span className="w-1/3 text-center">
                          {highlightSearchTerm(ranking.grind, debouncedSearch)}
                        </span>
                        <span className="w-1/3 text-end">
                          {ranking.score}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className='border-t border-gray-300'></div>

                  {/* extra meta */}
                  <ul className="grid grid-cols-2 gap-4 text-sm">
                    <li className="flex flex-col">
                      <span className="text-gray-700">Humidity:</span>
                      <span className="font-semibold">
                        {result.humidity != ""
                          ? `${result.humidity}%`
                          : '--'}
                      </span>
                    </li>
                    <li className="flex flex-col">
                      <span className="text-gray-700">Snow temperature:</span>
                      <span className="font-semibold">

                        {result.snowTemperature != ""
                          ? `${result.snowTemperature}°C`
                          : '--'}
                      </span>
                    </li>
                    <li className="flex flex-col">
                      <span className="text-gray-700">Snow source:</span>
                      <span className="font-semibold">
                        {result.snowCondition?.source
                          ? highlightSearchTerm(
                            formatSourceLabel(result.snowCondition.source),
                            debouncedSearch
                          )
                          : '--'}
                      </span>
                    </li>
                    <li className="flex flex-col">
                      <span className="text-gray-700">Snow type:</span>
                      <span className="font-semibold">
                        {result.snowCondition?.grainType
                          ? highlightSearchTerm(
                            formatSnowTypeLabel(result.snowCondition.grainType),
                            debouncedSearch
                          )
                          : '--'}
                      </span>
                    </li>
                    <li className="col-span-2 flex flex-col">
                      <span className="text-gray-700">Comment:</span>
                      <span className="font-semibold">
                        {result.comment
                          ? highlightSearchTerm(result.comment, debouncedSearch)

                          : '--'}
                      </span>
                    </li>
                  </ul>


                  {/* timestamp */}
                  <div className="flex justify-end mt-2 text-xs text-gray-600">
                    <span>
                      {new Date(
                        result.timestamp.seconds * 1000
                      ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="ml-2">
                      {new Date(
                        result.timestamp.seconds * 1000
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load more button */}
          {!exhausted && !loading && (
            <div className="flex justify-center my-4">
              <Button onClick={loadMore}>Load more</Button>
            </div>
          )}
          {!user && <div className='mt-4 italic'>You are not signed in</div>}

        </div>
      </div>

      {/* Delete-confirmation modal */}
      <DeleteTestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};

export default Results;
