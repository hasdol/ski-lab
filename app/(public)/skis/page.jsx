'use client';

/* -------------------------------------------------------------------------- */
/*  Skis list page – prefix-searchable, paginated (32 per page), sortable.     */
/*  Now preserves selected skis in the view even if they don't match filters.  */
/*  Displays matching items first, then selected extras sorted by the same field. */
/* -------------------------------------------------------------------------- */

import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { AnimatePresence, motion } from 'framer-motion';

import usePaginatedSkis from '@/hooks/usePaginatedSkis';
import { useSkis } from '@/hooks/useSkis';
import SkiItem from './components/SkiItem';
import SkiTable from './components/SkiTable';
import SkiFilter from './components/SkiFilter';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import { TournamentContext } from '@/context/TournamentContext';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/common/Spinner/Spinner';
import Button from '@/components/ui/Button';
import {
  RiFilter2Line,
  RiFilter2Fill,
  RiAddLine,
  RiLockLine,
  RiCloseLine,
  RiDeleteBinLine
} from 'react-icons/ri';
import { TiFlowParallel } from "react-icons/ti";
import { VscDebugContinue } from "react-icons/vsc";
import Search from '../../../components/Search/Search';
import { PLAN_LIMITS } from '@/lib/constants/planLimits';
import useIsStandalone from '@/hooks/useIsStandalone';

const Skis = () => {
  const isStandalone = useIsStandalone();
  const router = useRouter();
  const { gloveMode } = useContext(UserPreferencesContext);
  const { user, userData } = useAuth();
  const {
    selectedSkis: selectedGlobal,
    setSelectedSkis,
    currentRound,
    resetTournament,
  } = useContext(TournamentContext);

  // --- local search
  const [searchRaw, setSearchRaw] = useState('');
  const [debouncedTerm] = useDebounce(searchRaw.toLowerCase(), 300);

  // --- filters & sort
  const [styleFilter, setStyleFilter] = useState('all');
  const [skiTypeFilter, setSkiTypeFilter] = useState('all');
  const [archivedFilter, setArchivedFilter] = useState('notArchived');
  const [sortField, setSortField] = useState('serialNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState('card');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStyleFilter(localStorage.getItem('styleFilter') || 'all');
      setSkiTypeFilter(localStorage.getItem('skiTypeFilter') || 'all');
      setArchivedFilter(localStorage.getItem('archivedFilter') || 'notArchived');
      setSortField(localStorage.getItem('sortField') || 'serialNumber');
      setSortDirection(localStorage.getItem('sortDirection') || 'asc');
      setViewMode(localStorage.getItem('viewMode') || 'card');
    }
  }, []);

  // --- data fetching
  const {
    docs: skis,
    loading,
    error,
    exhausted,
    refresh,
    loadMore,
  } = usePaginatedSkis({
    term: debouncedTerm,
    style: styleFilter,
    skiType: skiTypeFilter,
    archived: archivedFilter,
    sortField,
    sortDirection,
  });

  // --- mutations
  const { deleteSki, updateSki, lockedSkisCount } = useSkis();

  // --- selection + persistence
  const [selectedMap, setSelectedMap] = useState({});
  const [selectedSkisDataMap, setSelectedSkisDataMap] = useState(() => new Map());

  const toggleSelect = (id) => {
    setSelectedMap(prev => {
      const nowSelected = !prev[id];
      const newMap = { ...prev, [id]: nowSelected };

      setSelectedSkisDataMap(prevMap => {
        const m = new Map(prevMap);
        if (nowSelected) {
          const skiObj = skis.find(s => s.id === id);
          if (skiObj) m.set(id, skiObj);
        } else {
          m.delete(id);
        }
        return m;
      });

      return newMap;
    });
  };

  const getSelectedList = () => Array.from(selectedSkisDataMap.values());

  // --- detail toggle
  const [expandedSkiId, setExpandedSkiId] = useState(null);
  const toggleDetails = (id) => {
    setExpandedSkiId(prev => (prev === id ? null : id));
  };

  // --- build displayedSkis: matching items first, then selected extras
  const displayedSkis = useMemo(() => {
    const matched = skis;
    const matchedIds = new Set(matched.map(s => s.id));
    const extras = Array.from(selectedSkisDataMap.values()).filter(s => !matchedIds.has(s.id));
    if (extras.length) {
      const compare = (a, b) => {
        const aVal = a[sortField] ?? '';
        const bVal = b[sortField] ?? '';
        const cmp = typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDirection === 'asc' ? cmp : -cmp;
      };
      extras.sort(compare);
    }
    return [...matched, ...extras];
  }, [skis, selectedSkisDataMap, sortField, sortDirection]);

  // ensure we know how many skis are selected so we can add bottom padding
  const selectionCount = getSelectedList().length;

  // --- persist filter/view into localStorage
  useEffect(() => { localStorage.setItem('viewMode', viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem('styleFilter', styleFilter); }, [styleFilter]);
  useEffect(() => { localStorage.setItem('skiTypeFilter', skiTypeFilter); }, [skiTypeFilter]);
  useEffect(() => { localStorage.setItem('archivedFilter', archivedFilter); }, [archivedFilter]);

  // --- delete/archive
  const mutate = async (fn) => { await fn(); await refresh(); };
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this ski?') && confirm('Are you really sure? You can not undo this')) {
      await mutate(() => deleteSki(id));
      setSelectedMap(m => ({ ...m, [id]: false }));
      setSelectedSkisDataMap(m => { const mm = new Map(m); mm.delete(id); return mm; });
    }
  };
  const handleArchive = async (id) => {
    if (confirm('This will filter the ski from you active list. You can get them back using the filter')) await mutate(() => updateSki(id, { archived: true }));
  };
  const handleUnarchive = (id) => mutate(() => updateSki(id, { archived: false }));

  // --- plan limits
  const skiCount = userData?.skiCount || 0;
  const plan = userData?.plan || 'free';
  const skiLimit = PLAN_LIMITS[plan] ?? PLAN_LIMITS['free'];
  const hasReachedLimit = skiCount >= skiLimit;
  const hasLockedSkis = lockedSkisCount > 0;

  // --- handlers
  const toggleFilterDrawer = () => setIsFilterOpen(o => !o);
  const resetFilter = () => {
    setStyleFilter('all');
    setSkiTypeFilter('all');
    setArchivedFilter('notArchived');
  };
  const handleAddSki = () => {
    if (hasReachedLimit) {
      return alert(plan === 'company'
        ? 'Max skis reached for your plan.'
        : 'Upgrade your account to add more skis'
      );
    }
    router.push('/skis/create');
  };
  const handleStartTournament = () => {
    const list = getSelectedList();
    if (list.length < 2) return alert('Select at least two skis');
    if (currentRound.length && !confirm('Do you want to overwrite the existing test?')) return;
    resetTournament();
    setSelectedSkis(list);
    router.push('/testing');
  };
  const handleContinueTest = () => router.push('/testing/summary');

  if (error) return <div className="m-2">Error: {error.message}</div>;

  return (
    <div className={`p-4 max-w-4xl w-full self-center ${selectionCount > 0 ? 'pb-10 md:pb-20' : ''}`}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <TiFlowParallel className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skis</h1>
          <div className="text-xs text-gray-600 mt-1 flex flex-col  gap-2">
            <span>
              <span className="font-semibold text-gray-700">{skiCount}</span> / {skiLimit} skis
              <span className="ml-2">({plan.charAt(0).toUpperCase() + plan.slice(1)} plan)</span>
            </span>
            {hasReachedLimit && plan !== 'company' && (
              <Button variant="primary" onClick={() => router.push('/pricing')} >
                Upgrade
              </Button>
            )}
          </div>
        </div>
        {!hasReachedLimit &&
          <Button
            onClick={handleAddSki}
            variant='primary'
            disabled={hasReachedLimit}
            className="ml-auto flex items-center gap-2"
          >
            <RiAddLine />
            <span>Add Ski</span>
          </Button>
        }

      </div>

      {/* Search */}
      <div className="mb-4">
        <Search onSearch={setSearchRaw} />
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
                className={`px-4 py-2 font-medium text-sm capitalize rounded-lg border transition
                  ${active ? `${tabColors[style]} ` : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}
                `}
              >
                {style}
              </button>
            );
          })}
        </div>
        <Button
          onClick={toggleFilterDrawer}
          variant="secondary"
          className={`ml-2 ${styleFilter !== 'all' || skiTypeFilter !== 'all' || archivedFilter !== 'notArchived' ? 'text-gray-800' : ''}`}
        >
          {styleFilter !== 'all' || skiTypeFilter !== 'all' || archivedFilter !== 'notArchived'
            ? <RiFilter2Fill />
            : <RiFilter2Line />}
        </Button>
      </div>

      {/* Active filter chips */}
      {(skiTypeFilter !== 'all' || archivedFilter !== 'notArchived') && (
        <div className="flex space-x-2 text-sm mb-4">
          {skiTypeFilter !== 'all' && (
            <Button variant="tab" onClick={() => setSkiTypeFilter('all')}><span className="flex">{skiTypeFilter} <RiCloseLine /></span></Button>
          )}
          {archivedFilter !== 'notArchived' && (
            <Button variant="tab" onClick={() => setArchivedFilter('notArchived')}><span className="flex">{archivedFilter} <RiCloseLine /></span></Button>
          )}
        </div>
      )}

      {/* Selection controls - only show if skis selected */}
      {getSelectedList().length > 0 && (
        <div className={`fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg z-50 flex items-center justify-between px-4 py-3 ${isStandalone ? 'pb-8' : ''}`}>
          <div className="text-sm font-semibold">
            {getSelectedList().length} ski{getSelectedList().length > 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleStartTournament}
              variant="primary"
              disabled={getSelectedList().length < 2}
            >
              New Test
            </Button>
            {!!currentRound.length && (
              <Button onClick={handleContinueTest} variant="primary"><VscDebugContinue /></Button>
            )}
          </div>
        </div>
      )}

      {/* Locked skis or plan upgrade prompt */}
      {hasLockedSkis ? (
        <div className="flex my-4 space-x-4">
          <div className="flex space-x-5 border border-dashed border-gray-300 p-4 rounded-lg items-center justify-center w-full">
            <div className="space-y-1">
              <h3 className="text-sm flex items-center"><RiLockLine /> {lockedSkisCount} locked ski(s)</h3>
              <Button onClick={() => router.push('/skis/locked')} variant="secondary">View skis</Button>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm">Upgrade to unlock</h3>
              <Button variant="primary" onClick={() => router.push('/pricing')}>Upgrade</Button>
            </div>
          </div>
        </div>
      ) : hasReachedLimit && plan !== 'company' ? (
        <div className="flex my-4">
          <div className="flex space-x-5 border border-dashed border-gray-300 p-4 rounded-lg items-center justify-center w-full">
            <h3 className="text-sm">You’ve reached your limit. Upgrade to add more skis.</h3>
            <Button variant="primary" onClick={() => router.push('/pricing')}>Upgrade</Button>
          </div>
        </div>
      ) : null}


      {/* Filter drawer */}
      <SkiFilter
        open={isFilterOpen}
        onClose={toggleFilterDrawer}
        styleFilter={styleFilter}
        setStyleFilter={setStyleFilter}
        skiTypeFilter={skiTypeFilter}
        setSkiTypeFilter={setSkiTypeFilter}
        archivedFilter={archivedFilter}
        setArchivedFilter={setArchivedFilter}
        resetFilter={resetFilter}
        sortField={sortField}
        setSortField={setSortField}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Ski list (cards or table) */}
      <div className="mb-5">
        {loading && !skis.length ? (
          <div className="flex justify-center items-center mt-10"><Spinner /></div>
        ) : viewMode === 'card' ? (
          <AnimatePresence>
            <div className={gloveMode ? 'grid grid-cols-2 gap-2' : 'flex flex-col space-y-2'}>
              {Object.entries(groupSkisByStyle(displayedSkis)).map(([style, skis]) =>
                skis.length > 0 && (
                  <React.Fragment key={style}>
                    <div className={`my-2 flex items-center gap-2 px-2 py-1 rounded font-semibold
                      ${style === 'classic' ? 'text-emerald-700' : ''}
                      ${style === 'skate' ? 'text-blue-700' : ''}
                      ${style === 'dp' ? 'text-fuchsia-700' : ''}
                    `}>
                      <span className="capitalize">{style}</span>
                      <span className="text-xs text-gray-400 font-normal">{skis.length} ski{skis.length > 1 ? 's' : ''}</span>
                    </div>
                    {skis.map(ski => (
                      <motion.div
                        key={ski.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <SkiItem
                          ski={ski}
                          search={debouncedTerm}
                          handleCheckboxChange={toggleSelect}
                          selectedSkis={selectedMap}
                          expandedSkiId={expandedSkiId}
                          toggleDetails={toggleDetails}
                          handleArchive={handleArchive}
                          handleUnarchive={handleUnarchive}
                          handleDelete={handleDelete}
                          handleEdit={() => router.push(`/skis/${ski.id}/edit`)}
                        />
                      </motion.div>
                    ))}
                  </React.Fragment>
                )
              )}
            </div>
          </AnimatePresence>
        ) : (
          <SkiTable
            skis={displayedSkis}
            search={debouncedTerm}
            selectedSkis={selectedMap}
            onToggleSelect={toggleSelect}
            expandedSkiId={expandedSkiId}
            onToggleDetails={toggleDetails}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={(field) => {
              if (field === sortField) {
                setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
              } else {
                setSortField(field);
                setSortDirection('asc');
              }
            }}
            onEdit={ski => router.push(`/skis/${ski.id}/edit`)}
            onDelete={handleDelete}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
          />
        )}

        {/* Load more button */}
        {!exhausted && !loading && user && (
          <div className="flex justify-center my-4">
            <Button onClick={loadMore}>Load more</Button>
          </div>
        )}
        {skis.length === 0 && !loading && user && (
          <GettingStartedGuide
            onAddSki={handleAddSki}
            onLearnMore={() => router.push('/about')}
          />
        )}
        {!user && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg mt-4">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TiFlowParallel className="text-gray-500 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Please sign in to view and manage your skis.
            </p>
            <Button onClick={() => router.push('/login')} variant="primary">
              Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Add this new component near the top of the file
function GettingStartedGuide({ onAddSki, onLearnMore }) {
  return (
    <div className="flex flex-col items-center p-6 border border-dashed border-gray-300 rounded-lg">
      <h2 className="text-xl font-bold mb-2">Welcome to Ski Lab!</h2>
      <p className="text-gray-600 text-center mb-4">
        Let's get started! Follow these simple steps:
      </p>
      <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-1">
        <li>Click on the "Add Ski" button below to add your first ski.</li>
        <li>Fill in your ski's details.</li>
        <li>Once added, start testing and managing your skis.</li>
      </ol>
      <div className="flex space-x-4">
        <Button onClick={onAddSki} variant="primary">Add Ski</Button>
        <Button onClick={onLearnMore} variant="secondary">Learn More</Button>
      </div>
    </div>
  );
}

function groupSkisByStyle(skis) {
  const groups = { classic: [], skate: [], dp: [] };
  skis.forEach(ski => {
    if (groups[ski.style]) groups[ski.style].push(ski);
  });
  return groups;
}

export default Skis;