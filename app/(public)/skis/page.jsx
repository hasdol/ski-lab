// src/app/(protected)/skis/page.jsx
'use client';

/* -------------------------------------------------------------------------- */
/*  Skis list page – prefix‑searchable, paginated (32 per page), sortable.     */
/*  Combines:                                                                  */
/*    • usePaginatedSkis  (data fetching, keyword search, pagination)          */
/*    • useSkis            (mutations + lockedSkisCount)                       */
/*    • all original UI (filter drawer, card/table, test selection logic)      */
/* -------------------------------------------------------------------------- */

import React, { useContext, useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'use-debounce';

import usePaginatedSkis from '@/hooks/usePaginatedSkis';
import { useSkis } from '@/hooks/useSkis';
import SkiItem from './components/Item';
import SkiTable from './components/Table';
import SkiFilterDrawer from './components/FilterDrawer';
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
  const { t } = useTranslation();
  const router = useRouter();
  const { gloveMode } = useContext(UserPreferencesContext);
  const { userData } = useAuth();
  const {
    selectedSkis: selectedGlobal,
    setSelectedSkis,
    currentRound,
    resetTournament,
  } = useContext(TournamentContext);

  /* ----------------------------- local search ----------------------------- */
  const [searchRaw, setSearchRaw] = useState('');
  const [debouncedTerm] = useDebounce(searchRaw.toLowerCase(), 300);

  /* ----------------------------- filters & sort --------------------------- */
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

  /* ----------------------------- data fetching ---------------------------- */
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

  /* ---------------------------- mutations (useSkis) ----------------------- */
  const { deleteSki, updateSki, lockedSkisCount } = useSkis();

  /* -------------------------- selection + expand -------------------------- */
  const [selectedMap, setSelectedMap] = useState({});
  const [expandedSkiId, setExpandedSkiId] = useState(null);

  const toggleSelect = (id) =>
    setSelectedMap((p) => ({ ...p, [id]: !p[id] }));

  const toggleDetails = (id) =>
    setExpandedSkiId((prev) => (prev === id ? null : id));

  const getSelectedList = () =>
    Object.entries(selectedMap)
      .filter(([, v]) => v)
      .map(([id]) => skis.find((s) => s.id === id))
      .filter(Boolean);

  /* ------------------------------ localStorage ---------------------------- */
  useEffect(() => { localStorage.setItem('viewMode', viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem('styleFilter', styleFilter); }, [styleFilter]);
  useEffect(() => { localStorage.setItem('skiTypeFilter', skiTypeFilter); }, [skiTypeFilter]);
  useEffect(() => { localStorage.setItem('archivedFilter', archivedFilter); }, [archivedFilter]);

  /* --------------------------- delete / archive --------------------------- */
  const mutate = async (fn) => { await fn(); await refresh(); };
  const handleDelete = async (id) => {
    if (confirm(t('delete_ski_promt')) && confirm(t('delete_ski_promt_2')))
      mutate(() => deleteSki(id));
  };
  const handleArchive = async (id) => {
    if (confirm(t('archive_ski_promt')))
      mutate(() => updateSki(id, { archived: true }));
  };
  const handleUnarchive = (id) =>
    mutate(() => updateSki(id, { archived: false }));

  /* --------------------------- plan + limits ----------------------------- */
  const skiCount = userData?.skiCount || 0;
  const plan = userData?.plan || 'free';
  const skiLimit =
    plan === 'senior'
      ? 16
      : plan === 'senior_pluss'
      ? 32
      : plan === 'coach'
      ? 64
      : plan === 'company'
      ? 5000
      : 8;
  const hasReachedLimit = skiCount >= skiLimit;
  const hasLockedSkis = lockedSkisCount > 0;

  /* ------------------------------ handlers ------------------------------- */
  const toggleFilterDrawer = () => setIsFilterOpen((o) => !o);
  const resetFilter = () => {
    setStyleFilter('all');
    setSkiTypeFilter('all');
    setArchivedFilter('notArchived');
  };
  const handleAddSki = () => {
    if (hasReachedLimit)
      return alert(
        plan === 'company'
          ? 'Max skis reached for your plan.'
          : t('upgrade_your_account_to_add_more_skis')
      );
    router.push('/skis/add');
  };
  const handleStartTournament = () => {
    const list = getSelectedList();
    if (list.length < 2) return alert(t('select_at_least_two_skis'));
    if (
      currentRound.length &&
      !confirm(t('confirm_overwrite_test'))
    )
      return;
    resetTournament();
    setSelectedSkis(list);
    router.push('/testing');
  };
  const handleContinueTest = () => router.push('/testing/summary');

  /* ----------------------------------------------------------------------- */
  if (error) return <div className="m-2">Error: {error.message}</div>;

  return (
    <>
      <Head>
        <title>Ski‑Lab: Skis</title>
      </Head>

      <div className="container mx-auto animate-fade animate-duration-300">
        <h1 className="text-3xl font-bold text-gray-900 mb-5">
          {t('skipark')}
        </h1>

        {/* ─── top controls row ─────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-4">
          {/* left – selection + test controls */}
          <div className="flex flex-col justify-end">
            <h3 className="text-sm font-semibold mb-1">
              {getSelectedList().length > 1
                ? `${getSelectedList().length} ${t('skis_selected')}`
                : t('select_skis_to_test')}
            </h3>
            <div className="flex space-x-3 items-end">
              <Button
                onClick={handleStartTournament}
                variant="primary"
                disabled={getSelectedList().length < 2}
              >
                {t('new_test')}
              </Button>
              {!!currentRound.length && (
                <Button
                  onClick={handleContinueTest}
                  variant="primary"
                >
                  <MdFastForward />
                </Button>
              )}
            </div>
          </div>

          {/* right – counters + filter + add */}
          <div className="flex space-x-3 items-end">
            {/* plan button */}
            <Button
              onClick={() => router.push('/plans')}
              variant="secondary"
            >
              <RiShoppingCartLine className="text-highlight" />
            </Button>

            {/* add ski */}
            <div className="flex flex-col items-center w-fit">
              <label
                className={`text-sm font-semibold mb-1 ${
                  hasReachedLimit && 'text-delete'
                }`}
              >
                {skiCount}/{skiLimit}
              </label>
              <Button
                onClick={handleAddSki}
                variant="secondary"
                disabled={hasReachedLimit}
                className={hasReachedLimit ? 'text-red-500' : ''}
              >
                {hasReachedLimit ? <RiLockLine /> : <RiAddLine />}
              </Button>
            </div>

            {/* filter */}
            <div className="flex flex-col items-center w-fit">
              <label className="text-sm font-semibold mb-1">
                {t('filter')}
              </label>
              <Button
                onClick={toggleFilterDrawer}
                variant="secondary"
                className={
                  styleFilter !== 'all' ||
                  skiTypeFilter !== 'all' ||
                  archivedFilter !== 'notArchived'
                    ? 'text-gray-800'
                    : ''
                }
              >
                {styleFilter !== 'all' ||
                skiTypeFilter !== 'all' ||
                archivedFilter !== 'notArchived' ? (
                  <RiFilter2Fill />
                ) : (
                  <RiFilter2Line />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* search box */}
        <ResultsSearch onSearch={setSearchRaw} />

        {/* locked skis prompt */}
        {(hasLockedSkis || (hasReachedLimit && plan === 'free')) && (
          <div className="flex my-4 space-x-4">
            {hasLockedSkis && (
              <div className="flex space-x-5 border border-gray-300 py-4 rounded-md items-center justify-center w-full">
                <div className="space-y-1">
                  <h3 className="text-sm flex items-center">
                    <RiLockLine /> {lockedSkisCount}{' '}
                    {t('locked_ski(s)')}
                  </h3>
                  <Button
                    onClick={() => router.push('/skis/locked')}
                    variant="secondary"
                  >
                    {t('view_skis')}
                  </Button>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm">{t('upgrade_to_unlock')}</h3>
                  <Button
                    variant="primary"
                    onClick={() => router.push('/plans')}
                  >
                    {t('upgrade')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* filter drawer */}
        <SkiFilterDrawer
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

        {/* active filter chips */}
        {(styleFilter !== 'all' ||
          skiTypeFilter !== 'all' ||
          archivedFilter !== 'notArchived') && (
          <div className="flex space-x-2 text-sm  mt-2">
            {styleFilter !== 'all' && (
              <Button
                variant="secondary"
                onClick={() => setStyleFilter('all')}
              >
                <span className="flex">
                  {t(styleFilter)} <RiCloseLine />
                </span>
              </Button>
            )}
            {skiTypeFilter !== 'all' && (
              <Button
                variant="secondary"
                onClick={() => setSkiTypeFilter('all')}
              >
                <span className="flex">
                  {t(skiTypeFilter)} <RiCloseLine />
                </span>
              </Button>
            )}
            {archivedFilter !== 'notArchived' && (
              <Button
                variant="secondary"
                onClick={() => setArchivedFilter('notArchived')}
              >
                <span className="flex">
                  {t(archivedFilter)} <RiCloseLine />
                </span>
              </Button>
            )}
          </div>
        )}

        {/* list */}
        <div className="my-2">
          {loading && !skis.length ? (
            <div className="flex justify-center items-center mt-10">
              <Spinner />
            </div>
          ) : viewMode === 'card' ? (
            <div
              className={
                gloveMode
                  ? 'grid grid-cols-2 gap-4'
                  : 'flex flex-col space-y-2'
              }
            >
              {skis.map((ski) => (
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
                  handleEdit={() =>
                    router.push(`/skis/${ski.id}/edit`)
                  }
                />
              ))}
            </div>
          ) : (
            <SkiTable
              skis={skis}
              search={debouncedTerm}
              selectedSkis={selectedMap}
              onToggleSelect={toggleSelect}
              expandedSkiId={expandedSkiId}
              onToggleDetails={toggleDetails}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={(field) => {
                field === sortField
                  ? setSortDirection((d) =>
                      d === 'asc' ? 'desc' : 'asc'
                    )
                  : (setSortField(field), setSortDirection('asc'));
              }}
              onEdit={(ski) =>
                router.push(`/skis/${ski.id}/edit`)
              }
              onDelete={handleDelete}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
            />
          )}

          {/* Load more button */}
          {!exhausted && !loading && (
            <div className="flex justify-center my-4">
              <Button onClick={loadMore}>{t('load_more')}</Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Skis;
