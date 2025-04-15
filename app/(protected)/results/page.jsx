'use client';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { RiFilter2Fill, RiFilter2Line, RiEditLine, RiDeleteBinLine } from 'react-icons/ri';

import useTournamentResults from '@/hooks/useTournamentResults';
import { useAuth } from '@/context/AuthContext';
import { isNew } from '@/helpers/helpers';
import Filter from './Filter/Filter';
import Spinner from '@/components/common/Spinner/Spinner';
import ResultsSearch from './ResultSearch/ResultSearch';
import DeleteTestModal from '@/components/DeleteTestModal/DeleteTestModal';

import { deleteTestResultEverywhere } from '@/lib/firebase/firestoreFunctions';
import Button from '@/components/common/Button';

const Results = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [resultsToShow, setResultsToShow] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc');
  const [tempRange, setTempRange] = useState([-30, 30]);
  const [defaultTempRange, setDefaultTempRange] = useState([-30, 30]);
  const [styleFilter, setStyleFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { results, loading, error } = useTournamentResults();
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  // State for delete modal
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTestId, setCurrentTestId] = useState(null);

  // Set default temperature range based on loaded results
  useEffect(() => {
    if (results.length > 0) {
      const temps = results.map((r) => r.temperature);
      const min = Math.min(...temps);
      const max = Math.max(...temps);
      setTempRange([min, max]);
      setDefaultTempRange([min, max]);
    }
  }, [results]);

  const handleTempChange = (_, newVal) => setTempRange(newVal);
  const toggleFilter = () => setIsFilterOpen((prev) => !prev);
  const resetFilter = () => {
    setSortOrder('desc');
    setTempRange(defaultTempRange);
    setStyleFilter('all');
    setSearchTerm('');
  };

  const isFilterActive =
    searchTerm.trim() !== '' ||
    sortOrder !== 'desc' ||
    tempRange[0] !== defaultTempRange[0] ||
    tempRange[1] !== defaultTempRange[1] ||
    styleFilter !== 'all';

  // Apply filters to the results
  useEffect(() => {
    const filtered = results
      .filter((result) => {
        if (styleFilter !== 'all' && result.style !== styleFilter) return false;
        const text = searchTerm.toLowerCase();
        const match = (val) => val?.toLowerCase().includes(text);
        return (
          match(t(result.style, { lng: 'en' })) ||
          match(t(result.style, { lng: 'no' })) ||
          match(result.location) ||
          match(t(result.snowCondition?.grainType, { lng: 'en' })) ||
          match(t(result.snowCondition?.grainType, { lng: 'no' })) ||
          match(t(result.snowCondition?.source, { lng: 'en' })) ||
          match(t(result.snowCondition?.source, { lng: 'no' })) ||
          result.rankings?.some((r) =>
            match(r.serialNumber) || match(r.grind) || match(r.brand)
          )
        ) && result.temperature >= tempRange[0] && result.temperature <= tempRange[1];
      })
      .sort((a, b) =>
        sortOrder === 'asc'
          ? a.timestamp.seconds - b.timestamp.seconds
          : b.timestamp.seconds - a.timestamp.seconds
      );
    setResultsToShow(filtered);
  }, [results, searchTerm, sortOrder, tempRange, t, styleFilter]);

  const handleEdit = (id) => router.push(`/editResult/${id}`);

  // Simplified delete: just set the test id and open the modal.
  const handleDelete = async (id) => {
    if (!user?.uid) return;
    setCurrentTestId(id);
    setModalOpen(true);
  };

  // Confirm deletion using our unified deletion function.
  const handleModalConfirm = async () => {
    try {
      const response = await deleteTestResultEverywhere({
        userId: user.uid,
        testId: currentTestId
      });
      // Update local state to remove the deleted test.
      setResultsToShow((prev) => prev.filter((r) => r.id !== currentTestId));
      alert(response.message);
    } catch (err) {
      console.error('Error deleting test result:', err);
      alert(t('error_deleting_result'));
    }
    setModalOpen(false);
    setCurrentTestId(null);
  };

  const highlightSearchTerm = (text) => {
    if (!searchTerm) return text;
    return text.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? <mark key={i}>{part}</mark> : part
    );
  };

  if (error) return <div>{t('error_loading_results')}: {error.message}</div>;

  return (
    <>
      <Head>
        <title>Ski-Lab: Results</title>
        <meta name="description" content="Displaying your test results" />
      </Head>
      <div className="px-4">
        <div className="flex justify-between items-end mb-4">
          <ResultsSearch onSearchChange={setSearchTerm} />
          <div className="flex flex-col items-center w-fit">
            <label className="text-sm font-semibold mb-1">{t('filter')}</label>
            <button
              onClick={toggleFilter}
              className={`bg-container cursor-pointer flex items-center p-3 mb-1 shadow rounded hover:bg-sbtn ${isFilterActive && 'text-btn'}`}
            >
              {isFilterActive ? <RiFilter2Fill /> : <RiFilter2Line />}
            </button>
          </div>
        </div>

        <Filter
          open={isFilterOpen}
          onClose={toggleFilter}
          tempRange={tempRange}
          handleTempChange={handleTempChange}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          resetFilter={resetFilter}
          styleFilter={styleFilter}
          setStyleFilter={setStyleFilter}
        />

        <div className="my-4">
          {loading ? (
            <div className="flex justify-center">
              <Spinner />
            </div>
          ) : resultsToShow.length > 0 ? (
            resultsToShow.map((result) => (
              <div key={result.id} className="bg-container shadow rounded mb-5 animate-fade-down animate-duration-300">
                <div className="flex justify-between p-4">
                  <div>
                    <h3 className="font-semibold text-xl">
                      {highlightSearchTerm(t(result.style))} / {highlightSearchTerm(`${result.temperature}°C`)}
                    </h3>
                    <i className="text-sm">{highlightSearchTerm(result.location)}</i>
                  </div>
                  <div className="space-x-2">
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

                <ul className="my-2 px-4 space-y-2">
                  {result.rankings.map((ranking, index) => (
                    <li key={index} className="flex py-1">
                      <span className="flex items-center w-1/3">
                        {highlightSearchTerm(ranking.skiId ? ranking.serialNumber : t('deleted'))}
                        {isNew(ranking) && (
                          <div className="flex items-center">
                            <span className="mx-2">-</span>
                            <p className="text-highlight text-xs"> {t('new')}</p>
                          </div>
                        )}
                      </span>
                      <span className="w-1/3 text-center">
                        {highlightSearchTerm(ranking.grind)}
                      </span>
                      <span className="w-1/3 text-end">{ranking.score}</span>
                    </li>
                  ))}
                </ul>

                <div className="my-5 px-4">
                  <p className="border-t border-sbtn mb-4"></p>
                  <ul className="text-sm grid grid-cols-2 gap-2">
                    <li className="flex flex-col">
                      {t('snow_type')}
                      <div className="font-semibold text-base">
                        {highlightSearchTerm(t(result.snowCondition?.grainType))}
                      </div>
                    </li>
                    <li className="flex flex-col">
                      {t('snow_source')}
                      <div className="font-semibold text-base">
                        {highlightSearchTerm(t(result.snowCondition?.source))}
                      </div>
                    </li>
                    <li className="flex flex-col">
                      {t('snow_temperature')}
                      <div className="font-semibold text-base">
                        {result?.snowTemperature || '--'}
                      </div>
                    </li>
                    <li className="flex flex-col">
                      {t('humidity')}
                      <div className="font-semibold text-base">
                        {result?.humidity || '--'}
                      </div>
                    </li>
                    <li className="flex flex-col col-span-2">
                      {t('comment')}
                      <div className="font-semibold text-base">
                        {result?.comment || '--'}
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-end mt-2 p-4">
                  <div className="flex items-center">
                    <span className="px-2 border-r">
                      {new Date(result.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="px-2">
                      {new Date(result.timestamp.seconds * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="my-4 italic">{t('no_test_results_available')}.</div>
          )}
        </div>
      </div>

      <DeleteTestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
      />
    </>
  );
};

export default Results;
