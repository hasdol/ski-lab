'use client'
import React, { useContext, useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSkis } from '@/hooks/useSkis';
import SkiItem from './SkiItem/SkiItem';
import { SiRundeck } from "react-icons/si";
import { RiFilter2Line, RiFilter2Fill, RiAddLine, RiLockLine, RiCloseLine, RiShoppingCartLine } from "react-icons/ri";
import SkiTable from './SkiTable/SkiTable';
import SkiFilterDrawer from './SkiFilterDrawer/SkiFilterDrawer';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import { TournamentContext } from '@/context/TournamentContext';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/common/Spinner/Spinner';
import Button from '@/components/common/Button';

const Skis = () => {
  const { skis, loading, error, deleteSki, updateSki, lockedSkisCount } = useSkis();
  const { gloveMode } = useContext(UserPreferencesContext);
  const { userData } = useAuth();
  const { selectedSkis, setSelectedSkis, currentRound, resetTournament } = useContext(TournamentContext);
  const router = useRouter();
  const { t } = useTranslation();

  const [selectedSkisMap, setSelectedSkisMap] = useState({});
  const [sortField, setSortField] = useState('serialNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  const [expandedSkiId, setExpandedSkiId] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('viewMode') || 'card');
  // Filter states
  const [styleFilter, setStyleFilter] = useState(() => localStorage.getItem('styleFilter') || 'all');
  const [skiTypeFilter, setSkiTypeFilter] = useState(() => localStorage.getItem('skiTypeFilter') || 'all');
  const [archivedFilter, setArchivedFilter] = useState(() => localStorage.getItem('archivedFilter') || 'notArchived');
  // Filter drawer
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // persist to localStorage
  useEffect(() => {
    localStorage.setItem('styleFilter', styleFilter);
  }, [styleFilter]);

  useEffect(() => {
    localStorage.setItem('skiTypeFilter', skiTypeFilter);
  }, [skiTypeFilter]);

  useEffect(() => {
    localStorage.setItem('archivedFilter', archivedFilter);
  }, [archivedFilter]);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  const toggleFilterDrawer = () => {
    setIsFilterOpen((prev) => !prev);
  };

  const resetFilter = () => {
    setStyleFilter('all');
    setSkiTypeFilter('all');
    setArchivedFilter('notArchived');
    localStorage.removeItem('styleFilter');
    localStorage.removeItem('skiTypeFilter');
    localStorage.removeItem('archivedFilter');
  };

  const resetStyle = () => setStyleFilter('all');
  const resetSkiType = () => setSkiTypeFilter('all');
  const resetArchive = () => setArchivedFilter('notArchived');

  const toggleDetails = (skiId) => {
    setExpandedSkiId(expandedSkiId === skiId ? null : skiId);
  };

  const getSelectedSkis = () =>
    Object.entries(selectedSkisMap)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => skis.find((ski) => ski.id === id))
      .filter((ski) => ski);

  const handleSortChange = (field) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleArchive = async (skiId) => {
    if (window.confirm(t('archive_ski_promt'))) {
      const skiToUpdate = skis.find((ski) => ski.id === skiId);
      if (skiToUpdate) {
        await updateSki(skiId, { archived: true });
      }
    }
  };

  const handleUnarchive = async (skiId) => {
    const skiToUpdate = skis.find((ski) => ski.id === skiId);
    if (skiToUpdate) {
      await updateSki(skiId, { archived: false });
    }
  };

  const skiCount = userData?.skiCount || 0;
  const plan = userData?.plan || 'free';
  let skiLimit;
  if (plan === 'athlete') {
    skiLimit = 48;
  } else if (plan === 'coach') {
    skiLimit = 200;
  } else if (plan === 'company') {
    skiLimit = 5000;
  } else {
    skiLimit = 12;
  }
  const hasReachedLimit = skiCount >= skiLimit;
  const hasLockedSkis = lockedSkisCount > 0;

  // Updated add ski handler: do not redirect if limit is reached
  const handleAddSki = () => {
    if (hasReachedLimit) {
      if (plan === 'company') {
        alert('Max skis reached for your plan.');
      } else {
        alert(t('upgrade_your_account_to_add_more_skis'));
      }
      return;
    }
    router.push('/addSki');
  };

  const handleEdit = (ski) => {
    router.push(`/editSki/${ski.id}`);
  };

  const handleDelete = async (skiId) => {
    if (window.confirm(t('delete_ski_promt'))) {
      if (window.confirm(t('delete_ski_promt_2'))) {
        await deleteSki(skiId);
      }
    }
  };

  const handleCheckboxChange = (skiId) => {
    setSelectedSkisMap((prev) => ({ ...prev, [skiId]: !prev[skiId] }));
  };

  const handleStartNewTournament = () => {
    const selectedSkisForTournament = getSelectedSkis();
    if (selectedSkisForTournament.length > 1) {
      if (currentRound.length > 0) {
        const confirmOverwrite = window.confirm(t('confirm_overwrite_test'));
        if (confirmOverwrite) {
          resetTournament();
          setSelectedSkis(selectedSkisForTournament);
          router.push('/testing');
        }
      } else {
        setSelectedSkis(selectedSkisForTournament);
        router.push('/testing');
      }
    } else {
      alert(t('select_at_least_two_skis'));
    }
  };

  if (error) return <div className="m-2">Error: {error.message}</div>;

  // 5) Filter skis
  const filteredSkis = skis.filter((ski) => {
    if (archivedFilter === 'notArchived' && ski.archived) return false;
    if (archivedFilter === 'archived' && !ski.archived) return false;
    if (styleFilter !== 'all' && ski.style !== styleFilter) return false;
    if (skiTypeFilter !== 'all' && ski.skiType !== skiTypeFilter) return false;
    return true;
  });

  // 6) Sort function
  const applySort = (list, field, direction) => {
    return [...list].sort((a, b) => {
      if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
      if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };
  const sortedAndFilteredSkis = applySort(filteredSkis, sortField, sortDirection);

  const handlePlanClick = () => {
    router.push('/plans');
  }

  return (
    <>
      <Head>
        <title>Ski-Lab: Skis</title>
        <meta name="description" content="List of your added skis" />
      </Head>

      <div className="skis-page pb-2 px-2">
        {/* Top row: "Selected skis" + "Add Ski" button, etc. */}
        <div className="flex items-end justify-between p-2">
          {/* Left block: Selected skis and start new test */}
          <div className="flex flex-col justify-end">
            <h3 className="text-sm font-semibold mb-1">
              {getSelectedSkis().length > 1
                ? `${getSelectedSkis().length} ${t('skis_selected')}`
                : `${t('select_skis_to_test')} `}
            </h3>
            <div>
              <Button
                onClick={handleStartNewTournament}
                variant={'primary'}
                disabled={getSelectedSkis().length < 2}
              >
                {t('new_test')}
              </Button>
            </div>

          </div>

          {/* Right block: Ski count and add ski button */}
          <div className="flex space-x-3 items-end">
            <div className="flex flex-col items-center w-fit">
              <Button onClick={handlePlanClick} variant="secondary">
                <RiShoppingCartLine className="text-highlight" />
              </Button>
            </div>
            <div className="flex flex-col items-center w-fit">
              <label className={`text-sm font-semibold mb-1 ${hasReachedLimit && 'text-delete'}`}>
                {skiCount}/{skiLimit}
              </label>
              <Button
                onClick={handleAddSki}
                variant='secondary'
                disabled={hasReachedLimit}
                className={`${hasReachedLimit && 'text-red-500' }`}
              >
                {hasReachedLimit ? <RiLockLine /> : <RiAddLine />}
              </Button>
            </div>

            {/* Sorting, Filter & View toggles */}
            <div className="flex flex-col items-center w-fit">
              <div className="flex space-x-4 md:space-x-2">
                <div className="flex flex-col items-center w-fit">
                  <label className="text-sm font-semibold mb-1">{t('filter')}</label>
                  <Button
                    onClick={toggleFilterDrawer}
                    variant='secondary'
                    className={`${(styleFilter !== 'all' || skiTypeFilter !== 'all' || archivedFilter !== 'notArchived') && 'text-highlight'}`}
                  >
                    {(styleFilter !== 'all' || skiTypeFilter !== 'all' || archivedFilter !== 'notArchived')
                      ? <RiFilter2Fill />
                      : <RiFilter2Line />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Locked skis and upgrade prompt */}
        {(hasLockedSkis || (hasReachedLimit && plan === 'free')) && (
          <div className="flex mx-2 my-4 space-x-4">
            {hasLockedSkis && (
              <div className="flex space-x-5 border py-4 rounded items-center justify-center w-full">
                <div className="space-y-1">
                  <h3 className="text-sm flex items-center"><RiLockLine /> {lockedSkisCount} {t('locked_ski(s)')}</h3>
                  <button
                    onClick={() => router.push('/lockedSkis')}
                    className="flex cursor-pointer h-fit w-fit justify-center bg-btn text-btntxt py-3 px-5 rounded hover:opacity-90"
                  >
                    {t('view_skis')}
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm">Upgrade to unlock</h3>
                  <button className="flex cursor-pointer h-fit w-fit justify-center bg-gradient-to-r from-blue-600 to-blue-500 text-btntxt py-3 px-5 rounded hover:opacity-90" onClick={() => router.push('/plans')}>
                    {t('upgrade')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Drawer */}
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

        {/* Active filter tags */}
        {(styleFilter !== 'all' || skiTypeFilter !== 'all' || archivedFilter !== 'notArchived') && (
          <div className="flex space-x-2 text-sm mx-2 mt-2">
            {styleFilter !== 'all' && (
              <Button
                variant='secondary'
                onClick={resetStyle}
              >
                <span className='flex'>{t(styleFilter)} <RiCloseLine /></span>
              </Button>
            )}
            {skiTypeFilter !== 'all' && (
              <Button
                variant='secondary'
                onClick={resetSkiType}
              >
                <span className='flex'>{t(skiTypeFilter)} <RiCloseLine /></span>

              </Button>
            )}
            {archivedFilter !== 'notArchived' && (
              <Button
                variant='secondary'
                onClick={resetArchive}
              >
                <span className='flex'>{t(archivedFilter)} <RiCloseLine /></span>
              </Button>
            )}
          </div>
        )}

        {/* No skis message */}
        {sortedAndFilteredSkis.length === 0 && (
          <div className="my-4 mx-2">
            <div className="italic">{t('you_have_no')} {t('skis')}.</div>
          </div>
        )}

        {/* Ski list section */}
        <div className="m-2">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner />
            </div>
          ) : (
            viewMode === 'card' ? (
              <div className={`flex flex-col ${gloveMode ? 'grid grid-cols-2 gap-4' : 'space-y-2'}`}>
                {sortedAndFilteredSkis.map(ski => (
                  <SkiItem
                    key={ski.id}
                    ski={ski}
                    handleCheckboxChange={handleCheckboxChange}
                    handleEdit={() => handleEdit(ski)}
                    handleDelete={handleDelete}
                    handleArchive={handleArchive}
                    handleUnarchive={handleUnarchive}
                    selectedSkis={selectedSkisMap}
                    expandedSkiId={expandedSkiId}
                    toggleDetails={toggleDetails}
                  />
                ))}
              </div>
            ) : (
              <SkiTable
                skis={sortedAndFilteredSkis}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSortChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
              />
            )
          )}
        </div>
      </div>
    </>
  );
};

export default Skis;
