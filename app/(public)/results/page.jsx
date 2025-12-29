'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import {
  RiFilter2Fill,
  RiFilter2Line,
  RiCloseLine,
  RiBarChart2Line,
  RiUser3Line
} from 'react-icons/ri';
import { RiInformationLine } from 'react-icons/ri'; // + add this
import { AnimatePresence, motion } from 'framer-motion';

import usePaginatedResults from '@/hooks/usePaginatedResults';
import { useAuth } from '@/context/AuthContext';
import Filter from './components/ResultsFilter';
import Spinner from '@/components/common/Spinner/Spinner';
import Search from '../../../components/Search/Search';
import DeleteTestModal from '@/components/DeleteTestModal/DeleteTestModal';
import Button from '@/components/ui/Button';
import { exportResultsToCSV } from '@/helpers/helpers';
import { subscribeSharesAsReader } from '@/lib/firebase/shareFunctions';
import { listAccessibleUsers } from '@/lib/firebase/shareFunctions';

import ResultCard from './components/ResultCard';
import { deleteTestResultEverywhere } from '@/lib/firebase/firestoreFunctions';
import PageHeader from '@/components/layout/PageHeader';
import UserPicker from '@/components/UserPicker/UserPicker';
import SignInRequiredCard from '@/components/common/SignInRequiredCard';
import EmptyStateCard from '@/components/common/EmptyStateCard';

const VIEW_USER_STORAGE_KEY = 'viewUserId'; // <── ADD THIS

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
  const [viewUserId, setViewUserId] = useState(null);
  const [owners, setOwners] = useState([]);
  const [accessibleUsers, setAccessibleUsers] = useState({ self: null, owners: [] });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false); // + add this

  const ownerNameByUid = useMemo(() => {
    const m = {};
    const self = accessibleUsers?.self;
    if (self?.id) m[self.id] = self.displayName || 'Me';

    for (const o of accessibleUsers?.owners || []) {
      if (o?.id) m[o.id] = o.displayName || 'User';
    }

    // ensure current signed-in user is present as a fallback
    if (user?.uid && !m[user.uid]) m[user.uid] = user.displayName || 'Me';

    return m;
  }, [accessibleUsers, user]);

  const handleUserSelect = (idOrNull) => {        // <── ADD THIS
    const val = idOrNull || null;
    setViewUserId(val);
    if (typeof window !== 'undefined') {
      if (val) localStorage.setItem(VIEW_USER_STORAGE_KEY, val);
      else localStorage.removeItem(VIEW_USER_STORAGE_KEY);
    }
  };

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
    ownerUserId: viewUserId || undefined, // FIX: apply user filter
  });

  // Load owners with display names
  useEffect(() => {
    if (!user) {
      setOwners([]);
      setAccessibleUsers({ self: null, owners: [] });
      setViewUserId(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(VIEW_USER_STORAGE_KEY);   // <── CLEAR ON SIGN-OUT
      }
      return;
    }
    (async () => {
      try {
        const acc = await listAccessibleUsers();
        setOwners(acc.owners);
        setAccessibleUsers(acc);
      } catch {
        setOwners([]);
        setAccessibleUsers({ self: null, owners: [] });
      }
    })();
  }, [user]);

  // Hydrate viewUserId from localStorage when accessible users are known
  useEffect(() => {                                  // <── ADD THIS EFFECT
    if (!user) return;
    if (typeof window === 'undefined') return;

    if (!accessibleUsers.self && (!accessibleUsers.owners || accessibleUsers.owners.length === 0)) {
      return;
    }

    const stored = localStorage.getItem(VIEW_USER_STORAGE_KEY);
    if (!stored) {
      setViewUserId(null);
      return;
    }

    const allowedIds = (accessibleUsers.owners || []).map(o => o.id);
    if (allowedIds.includes(stored)) {
      setViewUserId(stored);
    } else {
      setViewUserId(null);
      localStorage.removeItem(VIEW_USER_STORAGE_KEY);
    }
  }, [user, accessibleUsers]);

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

  // listen for global "downloadResultsCSV" event from the subnav
  const handleDownloadFromNav = useCallback(() => {
    exportResultsToCSV(resultsToShow);
  }, [resultsToShow]);

  useEffect(() => {
    window.addEventListener('downloadResultsCSV', handleDownloadFromNav);
    return () => window.removeEventListener('downloadResultsCSV', handleDownloadFromNav);
  }, [handleDownloadFromNav]);

  useEffect(() => {
    if (!user) { setOwners([]); setViewUserId(null); return; }
    const unsub = subscribeSharesAsReader(user.uid, setOwners);
    return () => unsub();
  }, [user]);

  const isFilterActive =
    tempRange[0] !== defaultTempRange[0] ||
    tempRange[1] !== defaultTempRange[1] ||
    styleFilter !== 'all';

  const handleAddOldResult = () => {
    // Block adding results when viewing someone else's data
    if (viewUserId) return;
    router.push('/testing/summary?manual=1');
  };
  const handleNewTest = () => {
    router.push('/skis');
  };

  return (
    <div className="p-4 max-w-4xl w-full self-center">
      <PageHeader
        icon={<RiBarChart2Line className="text-blue-600 text-2xl" />}
        title="Test Results"
        subtitle="View and manage your test results"
        actions={
          <div className="flex flex-col md:flex-row gap-5 items-center">
            {!!user && (
              <button
                className="inline-flex items-center gap-2 bg-blue-50 text-blue-500 border rounded-2xl px-2 py-1 text-sm"
                onClick={() => setIsPickerOpen(true)}
                aria-label="Pick user"
                title="Pick user"
              >
                <RiUser3Line />
                <span className="max-w-35 truncate">
                  {viewUserId
                    ? (accessibleUsers.owners.find(o => o.id === viewUserId)?.displayName || 'User')
                    : (accessibleUsers.self?.displayName || 'Me')}
                </span>
              </button>
            )}

            <div className="flex gap-3 items-center">
              <Button
                variant="primary"
                onClick={handleAddOldResult}
                disabled={!!viewUserId} // disable when viewing others
              >
                Add Result
              </Button>
              <Button
                onClick={() => setShowInfo(prev => !prev)}
                variant="secondary"
                className="flex items-center gap-2"
                aria-label={showInfo ? 'Hide information' : 'Show information'}
                aria-expanded={showInfo}
              >
                <RiInformationLine size={18} />
                {showInfo ? 'Hide Info' : 'Show Info'}
              </Button>
            </div>
          </div>
        }
      />

      {/* Info Box (mirrors skis page) */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <RiInformationLine className="text-blue-500 mt-0.5 shrink-0" />
                <div className="text-blue-800">
                  <h3 className="block font-semibold mb-4">How the Results page works:</h3>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Search, filter, and sort your results by style, temperature, and date.</li>
                    <li>Use the user picker to switch between your results and shared results you can view.</li>
                    <li>Click “New Test” to start testing; “Add Result” lets you log a result manually.</li>
                    <li>Open a result to view rankings and details, or edit to correct metadata.</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="mb-4">
        <Search onSearch={handleSearch} />
      </div>

      {/* Style tabs + Filter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          {['all', 'classic', 'skate', 'dp'].map((style) => {
            const tabColors = {
              all: 'bg-gray-100 text-gray-700  border-gray-300',
              classic: 'bg-emerald-50 text-emerald-700 border-emerald-300',
              skate: 'bg-blue-50 text-blue-700 border-blue-300',
              dp: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-300'
            };
            const active = styleFilter === style;
            return (
              <button
                key={style}
                onClick={() => setStyleFilter(style)}
                className={`px-4 py-2 font-medium text-sm capitalize rounded-2xl border transition
                  ${active ? `${tabColors[style]} ` : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}
                `}
              >
                {style}
              </button>
            );
          })}
        </div>
        <Button
          onClick={toggleFilter}
          variant="secondary"
          className={`ml-2 ${isFilterActive ? 'text-gray-800' : ''}`}
        >
          {isFilterActive ? <RiFilter2Fill /> : <RiFilter2Line />}
        </Button>
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
          <EmptyStateCard
            className="py-8 border-2 border-dashed border-gray-300 rounded-2xl"
            icon={<RiBarChart2Line className="text-gray-500 text-2xl" />}
            title="No Results Yet"
            description="Try adjusting your filters or start a new test to see results here."
          />
        )}

        {!user && (
          <SignInRequiredCard
            icon={<RiBarChart2Line className="text-gray-500 text-2xl" />}
            resourceLabel="results"
            onSignIn={() => router.push('/login')}
          />
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
                  canEdit={!viewUserId}
                  ownerNameByUid={ownerNameByUid} // NEW
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

      <UserPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        self={accessibleUsers.self || { id: user?.uid, displayName: user?.displayName || 'Me' }}
        owners={accessibleUsers.owners}
        currentId={viewUserId}
        onSelect={handleUserSelect}   // <── CHANGED
      />
    </div>
  );
};

export default Results;
