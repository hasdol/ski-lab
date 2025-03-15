'use client'
import React, { useContext, useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSkis } from '@/hooks/useSkis';
import SkiItem from './SkiItem/SkiItem';
import { SiRundeck } from "react-icons/si";
import { RiFilter2Line, RiFilter2Fill, RiAddLine, RiLockLine, RiCloseLine } from "react-icons/ri";
import SkiTable from './SkiTable/SkiTable';
import SkiFilterDrawer from './SkiFilterDrawer/SkiFilterDrawer';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import { TournamentContext } from '@/context/TournamentContext';
import { useAuth } from '@/context/AuthContext';
import GetPro from '@/components/getPro/GetPro';
import Spinner from '@/components/common/Spinner/Spinner';

const Skis = () => {
  const { skis, loading, error, updateSkisList, deleteSki, updateSki, totalSkis, lockedSkisCount } = useSkis();
  const { gloveMode } = useContext(UserPreferencesContext);
  const { userData } = useAuth();
  const { selectedSkis, setSelectedSkis, currentRound, resetTournament } = useContext(TournamentContext);

  const [selectedSkisMap, setSelectedSkisMap] = useState({});
  const [sortField, setSortField] = useState('serialNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  const [expandedSkiId, setExpandedSkiId] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('viewMode') || 'card');

  // Filter states
  const [styleFilter, setStyleFilter] = useState(() => localStorage.getItem('styleFilter') || 'all');
  const [skiTypeFilter, setSkiTypeFilter] = useState(() => localStorage.getItem('skiTypeFilter') || 'all');
  const [archivedFilter, setArchivedFilter] = useState(() => localStorage.getItem('archivedFilter') || 'notArchived');

  // Sort function
  const applySort = (list, field, direction) => {
    return [...list].sort((a, b) => {
      if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
      if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  useEffect(() => {
    localStorage.setItem('styleFilter', styleFilter);
    localStorage.setItem('skiTypeFilter', skiTypeFilter);
    localStorage.setItem('archivedFilter', archivedFilter);
    localStorage.setItem('viewMode', viewMode);
  }, [styleFilter, skiTypeFilter, archivedFilter, viewMode]);

  // MUI Drawer for filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const toggleFilterDrawer = () => {
    setIsFilterOpen(prev => !prev);
  };

  const isFilterActive =
    styleFilter !== 'all' ||
    skiTypeFilter !== 'all' ||
    archivedFilter !== 'notArchived';

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

  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    // Oppdater utvalgte ski for turneringen hver gang selection endres
    getSelectedSkis();
  }, [selectedSkisMap, skis]);

  const toggleDetails = (skiId) => {
    setExpandedSkiId(expandedSkiId === skiId ? null : skiId);
  };

  const getSelectedSkis = () =>
    Object.entries(selectedSkisMap)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => skis.find(ski => ski.id === id))
      .filter(ski => ski);

  const handleSortChange = (field) => {
    if (field === sortField) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleArchive = async (skiId) => {
    if (window.confirm(t('archive_ski_promt'))) {
      const skiToUpdate = skis.find(ski => ski.id === skiId);
      if (skiToUpdate) {
        await updateSki(skiId, { archived: true });
      }
    }
  };

  const handleUnarchive = async (skiId) => {
    const skiToUpdate = skis.find(ski => ski.id === skiId);
    if (skiToUpdate) {
      await updateSki(skiId, { archived: false });
    }
  };

  const handleAddSki = () => {
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
    setSelectedSkisMap(prev => ({ ...prev, [skiId]: !prev[skiId] }));
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

  // Ski count and limit
  const skiCount = userData?.skiCount || 0;
  const skiLimit = userData?.isPro ? 48 : 12;
  const hasReachedLimit = skiCount >= skiLimit;
  const hasLockedSkis = lockedSkisCount > 0;

  if (loading) return <Spinner />;
  if (error) return <div className="m-2">Error: {error.message}</div>;

  // 5) Filter skis based on archived, style, and skiType
  const filteredSkis = skis.filter(ski => {
    if (archivedFilter === 'notArchived' && ski.archived) return false;
    if (archivedFilter === 'archived' && !ski.archived) return false;
    if (styleFilter !== 'all' && ski.style !== styleFilter) return false;
    if (skiTypeFilter !== 'all' && ski.skiType !== skiTypeFilter) return false;
    return true;
  });

  // 6) Sort skis
  const sortedAndFilteredSkis = applySort(filteredSkis, sortField, sortDirection);

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
          <div className="flex flex-col items-center justify-end">
            <h3 className="text-sm font-semibold mb-1">
              {getSelectedSkis().length} {t('skipairs_selected')}
            </h3>
            <button
              onClick={handleStartNewTournament}
              className={`flex  h-fit items-center justify-center bg-btn text-btntxt shadow py-3 px-5 text-center rounded w-full max-w-xs ${
                getSelectedSkis().length < 2 ? "opacity-50 cursor-default" : "hover:opacity-90 cursor-pointer"
              }`}
              disabled={getSelectedSkis().length < 2}
              title={getSelectedSkis().length < 2 ? t('select_at_least_two_skis') : ''}
            >
              {t('new_test')}
              <SiRundeck className="ml-2" />
            </button>
          </div>

          {/* Right block: Ski count and add ski button */}
          <div className="flex space-x-2 items-end">
            <div className="flex flex-col items-center w-fit">
              <label className={`text-sm font-semibold mb-1 ${hasReachedLimit && 'text-delete'}`}>
                {skiCount}/{skiLimit}
              </label>
              <button
                onClick={handleAddSki}
                disabled={hasReachedLimit}
                className={`bg-container flex items-center p-3 shadow rounded hover:bg-btn hover:text-btntxt ${
                  hasReachedLimit ? 'opacity-50 text-delete cursor-not-allowed disabled:pointer-events-none' : 'cursor-pointer'
                }`}
                title={hasReachedLimit ? t('max_skis_reached') : ''}
              >
                {hasReachedLimit ? <RiLockLine /> : <RiAddLine />}
              </button>
            </div>

            {/* Sorting, Filter & View toggles */}
            <div className="flex flex-col items-center w-fit">
              <div className="flex space-x-4 md:space-x-2">
                <div className="flex flex-col items-center w-fit">
                  <label className="text-sm font-semibold mb-1">{t('filter')}</label>
                  <button
                    onClick={toggleFilterDrawer}
                    className={`bg-container cursor-pointer flex items-center p-3 shadow rounded hover:bg-btn hover:text-btntxt ${isFilterActive && 'text-btn'}`}
                  >
                    {isFilterActive ? <RiFilter2Fill /> : <RiFilter2Line />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Locked skis and upgrade prompt */}
        {(hasLockedSkis || (hasReachedLimit && !userData.isPro)) && (
          <div className="flex mx-2 my-4 space-x-4">
            {hasLockedSkis && (
              <div className="flex flex-1 flex-col bg-container shadow py-4 rounded items-center justify-end text-center space-y-2">
                <div className="flex space-x-1">
                  <RiLockLine />
                  <h3 className="text-sm">{lockedSkisCount} {t('locked_ski(s)')}</h3>
                </div>
                <button
                  onClick={() => router.push('/manage-locked-skis')}
                  className="flex cursor-pointer h-fit w-fit justify-center bg-delete text-btntxt shadow py-3 px-5 rounded"
                >
                  {t('view_skis')}
                </button>
              </div>
            )}
            {hasReachedLimit && !userData.isPro && (
              <div className="flex flex-1 flex-col bg-container shadow py-4 rounded items-center justify-end text-center space-y-2">
                <h3 className="text-sm">{t('upgrade_promt')}</h3>
                <GetPro />
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
              <span className="flex items-center bg-container shadow rounded p-2 cursor-pointer hover:bg-background" onClick={resetStyle}>
                {t(styleFilter)} <RiCloseLine />
              </span>
            )}
            {skiTypeFilter !== 'all' && (
              <span className="flex items-center bg-container shadow rounded p-2 cursor-pointer hover:bg-background" onClick={resetSkiType}>
                {t(skiTypeFilter)} <RiCloseLine />
              </span>
            )}
            {archivedFilter !== 'notArchived' && (
              <span className="flex items-center bg-container shadow rounded p-2 cursor-pointer hover:bg-background" onClick={resetArchive}>
                {t(archivedFilter)} <RiCloseLine />
              </span>
            )}
          </div>
        )}

        {/* No skis message */}
        {sortedAndFilteredSkis.length === 0 && (
          <div className="my-4 mx-2">
            <div className="italic">{t('you_have_no')} {t('skis')}.</div>
          </div>
        )}

        {/* Render either Card view or Table view */}
        {viewMode === 'card' ? (
          <div className={`flex flex-col ${gloveMode ? 'grid grid-cols-2 gap-4' : 'space-y-2'} m-2`}>
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
          <div className="m-2">
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
          </div>
        )}
      </div>
    </>
  );
};

export default Skis;
