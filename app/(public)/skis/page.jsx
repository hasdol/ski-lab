'use client';

/* -------------------------------------------------------------------------- */
/*  Skis list page – prefix-searchable, paginated (32 per page), sortable.     */
/*  Now preserves selected skis in the view even if they don't match filters.  */
/*  Displays matching items first, then selected extras sorted by the same field. */
/* -------------------------------------------------------------------------- */

import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';

import usePaginatedSkis from '@/hooks/usePaginatedSkis';
import { useSkis } from '@/hooks/useSkis';
import SkiItem from './components/SkiItem';
import SkiTable from './components/SkiTable';
import SkiFilter from './components/SkiFilter';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import { TournamentContext } from '@/context/TournamentContext';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/common/Spinner/Spinner';
import Button from '@/components/common/Button';
import {
  RiFilter2Line,
  RiFilter2Fill,
  RiAddLine,
  RiLockLine,
  RiCloseLine,
  RiShoppingCartLine,
} from 'react-icons/ri';
import { MdFastForward } from 'react-icons/md';
import ResultsSearch from '../../../components/Search/Search';

const Skis = () => {
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
  const [styleFilter, setStyleFilter] = useState(
    () => (typeof window !== 'undefined'
      ? localStorage.getItem('styleFilter') || 'all'
      : 'all')
  );
  const [skiTypeFilter, setSkiTypeFilter] = useState(
    () => (typeof window !== 'undefined'
      ? localStorage.getItem('skiTypeFilter') || 'all'
      : 'all')
  );
  const [archivedFilter, setArchivedFilter] = useState(
    () => (typeof window !== 'undefined'
      ? localStorage.getItem('archivedFilter') || 'notArchived'
      : 'notArchived')
  );
  const [sortField, setSortField] = useState('serialNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState(
    () => (typeof window !== 'undefined'
      ? localStorage.getItem('viewMode') || 'card'
      : 'card')
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
  const skiLimit =
    plan === 'senior' ? 16 :
      plan === 'senior_pluss' ? 32 :
        plan === 'coach' ? 64 :
          plan === 'company' ? 5000 : 8;
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
    router.push('/skis/add');
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
    <div className='p-3 md:w-2/3 mx-auto'>
      <div className="container mx-auto animate-fade animate-duration-300">
        <h1 className="text-3xl font-bold text-gray-900 my-4">Skis</h1>

        {/* Top controls row */}
        <div className="flex items-end justify-between mb-4">
          <div className="flex flex-col justify-end">
            <h3 className="text-sm font-semibold mb-1">{
              getSelectedList().length > 1
                ? `${getSelectedList().length} skis selected`
                : 'Select skis to test'
            }</h3>
            <div className="flex space-x-3 items-end">
              <Button
                onClick={handleStartTournament}
                variant="primary"
                disabled={getSelectedList().length < 2}
              >New Test</Button>
              {!!currentRound.length && (
                <Button onClick={handleContinueTest} variant="primary"><MdFastForward /></Button>
              )}
            </div>
          </div>

          <div className="flex space-x-3 items-end">
            <div className="flex flex-col items-center w-fit">
              <label className="text-sm font-semibold mb-1">Plans</label>
              <Button onClick={() => router.push('/plans')} variant="secondary" className='text-indigo-500!'>
                <RiShoppingCartLine />
              </Button>
            </div>

            <div className="flex flex-col items-center w-fit">
              <label className={`text-sm font-semibold mb-1 ${hasReachedLimit && 'text-red-500'}`}>
                {skiCount === 0 ? 'Add ski' : `${skiCount}/${skiLimit}`}
              </label>              
              <Button
                onClick={handleAddSki}
                variant='primary'
                disabled={hasReachedLimit}
              >
                {hasReachedLimit ? <RiLockLine /> : <RiAddLine />}
              </Button>
            </div>

            <div className="flex flex-col items-center w-fit">
              <label className="text-sm font-semibold mb-1">Filter</label>
              <Button
                onClick={toggleFilterDrawer}
                variant="secondary"
                className={
                  styleFilter !== 'all' || skiTypeFilter !== 'all' || archivedFilter !== 'notArchived'
                    ? 'text-gray-800'
                    : ''
                }
              >
                {styleFilter !== 'all' || skiTypeFilter !== 'all' || archivedFilter !== 'notArchived'
                  ? <RiFilter2Fill />
                  : <RiFilter2Line />}
              </Button>
            </div>
          </div>
        </div>

        {/* Search box */}
        <ResultsSearch onSearch={setSearchRaw} />

        {/* Locked skis prompt */}
        {(hasLockedSkis || (hasReachedLimit && plan === 'free')) && (
          <div className="flex my-4 space-x-4">
            {hasLockedSkis && (
              <div className="flex space-x-5 border border-orange-400 py-4 rounded-md items-center justify-center w-full">
                <div className="space-y-1">
                  <h3 className="text-sm flex items-center"><RiLockLine /> {lockedSkisCount} locked ski(s)</h3>
                  <Button onClick={() => router.push('/skis/locked')} variant="secondary">View skis</Button>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm">Upgrade to unlock</h3>
                  <Button variant="primary" onClick={() => router.push('/plans')}>Upgrade</Button>
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* Active filter chips */}
        {(styleFilter !== 'all' || skiTypeFilter !== 'all' || archivedFilter !== 'notArchived') && (
          <div className="flex space-x-2 text-sm mt-2">
            {styleFilter !== 'all' && (
              <Button variant="tab" onClick={() => setStyleFilter('all')}><span className="flex">{styleFilter} <RiCloseLine /></span></Button>
            )}
            {skiTypeFilter !== 'all' && (
              <Button variant="tab" onClick={() => setSkiTypeFilter('all')}><span className="flex">{skiTypeFilter} <RiCloseLine /></span></Button>
            )}
            {archivedFilter !== 'notArchived' && (
              <Button variant="tab" onClick={() => setArchivedFilter('notArchived')}><span className="flex">{archivedFilter} <RiCloseLine /></span></Button>
            )}
          </div>
        )}

        {/* Ski list (cards or table) */}
        <div className="my-5">
          {loading && !skis.length ? (
            <div className="flex justify-center items-center mt-10"><Spinner /></div>
          ) : viewMode === 'card' ? (
            <div className={gloveMode ? 'grid grid-cols-2 gap-4' : 'flex flex-col space-y-2'}>
              {displayedSkis.map(ski => (
                <SkiItem
                  key={ski.id}
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
              ))}
            </div>
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
          {skis.length === 0 && !loading && user && <p className='mt-4'>You have no skis</p>}
          {!user && <span className='mt-4 italic'>You are not signed in</span>}
        </div>
      </div>
    </div>
  );
};

export default Skis;
