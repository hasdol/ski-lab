'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import {
  RiFilter2Fill,
  RiFilter2Line,
  RiCloseLine,
  RiBarChart2Line,
} from 'react-icons/ri';
import { AnimatePresence, motion } from 'framer-motion';

import usePaginatedResults from '@/hooks/usePaginatedResults';
import { useAuth } from '@/context/AuthContext';
import Filter from './components/ResultsFilter';
import Spinner from '@/components/common/Spinner/Spinner';
import Search from '../../../components/Search/Search';
import DeleteTestModal from '@/components/DeleteTestModal/DeleteTestModal';
import Button from '@/components/ui/Button';

import ResultCard from './components/ResultCard';
import { deleteTestResultEverywhere } from '@/lib/firebase/firestoreFunctions';

const Results = () => {
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

  const handleSearch = (val) => setSearchTermRaw(val);
  const handleTempCommit = (newVal) => setTempRange(newVal);
  const toggleFilter = () => setIsFilterOpen((prev) => !prev);
  const resetFilter = () => {
    setSearchTermRaw('');
    setTempRange(defaultTempRange);
    setStyleFilter('all');
  };
  const handleEdit = (id) => router.push(`/results/${id}/edit`);
  const handleDelete = (id) => {
    if (!user?.uid) return;
    setCurrentTestId(id);
    setModalOpen(true);
  };
  const handleModalConfirm = async (scope) => {
    try {
      // When no event context, always delete the private copy
      const options =
        scope === 'all'
          ? { deletePrivate: true, deleteShared: true, deleteCurrentEvent: true }
          : { deletePrivate: true, deleteShared: false, deleteCurrentEvent: false };

      const response = await deleteTestResultEverywhere({
        userId: user.uid,
        testId: currentTestId,
        options
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

  const isFilterActive =
    tempRange[0] !== defaultTempRange[0] ||
    tempRange[1] !== defaultTempRange[1] ||
    styleFilter !== 'all';

  return (
    <div className="p-4 max-w-4xl w-full mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <RiBarChart2Line className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
          <p className="text-gray-600">Manage and view your test results</p>
        </div>
      </div>

      {/* Style Filter Tabs */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-2 mb-6">
        <div>
          {['all', 'classic', 'skate'].map((style) => (
            <button
              key={style}
              onClick={() => setStyleFilter(style)}
              className={`px-4 py-2 font-medium text-sm capitalize ${styleFilter === style
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {style}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={toggleFilter}
            variant="secondary"
            className={`flex items-center ${isFilterActive ? 'text-gray-800' : ''}`}
          >
            {isFilterActive ? <RiFilter2Fill /> : <RiFilter2Line />}
            <span className="ml-1">Filter</span>
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
        <Search onSearch={handleSearch} />
      </div>

      {/* Active Filter Tags */}
      {isFilterActive && (
        <div className="flex space-x-2 text-sm mb-4">
          {(tempRange[0] !== defaultTempRange[0] ||
            tempRange[1] !== defaultTempRange[1]) && (
              <Button variant="secondary" onClick={resetFilter}>
                <span className="flex items-center gap-1">
                  Temperature filter <RiCloseLine />
                </span>
              </Button>
            )}
        </div>
      )}

      {/* Filter Drawer */}
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

      {/* Results Section */}
      <section>
        {loading && resultsToShow.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" className="text-indigo-600" />
            <p className="mt-4 text-gray-600 font-medium">
              Loading your results...
            </p>
          </div>
        )}

        {!loading && resultsToShow.length === 0 && user && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-md">
            <div className="bg-gray-100 w-16 h-16 rounded-md flex items-center justify-center mx-auto mb-4">
              <RiBarChart2Line className="text-gray-500 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Results Yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your filters or start a new test to see results here.
            </p>
          </div>
        )}

        {!user && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-md">
            <div className="bg-gray-100 w-16 h-16 rounded-md flex items-center justify-center mx-auto mb-4">
              <RiBarChart2Line className="text-gray-500 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sign In Required
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Please sign in to view and manage your results.
            </p>
            <Button onClick={() => router.push('/login')} variant="primary">
              Sign In
            </Button>
          </div>
        )}

        {/* Result Cards */}
        <AnimatePresence>
          <div className="grid gap-6">
            {resultsToShow.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ResultCard
                  result={result}
                  debouncedSearch={debouncedSearch}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {!exhausted && !loading && resultsToShow.length > 0 && (
          <div className="flex justify-center mt-6">
            <Button onClick={loadMore}>Load More</Button>
          </div>
        )}
      </section>

      <DeleteTestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};

export default Results;
