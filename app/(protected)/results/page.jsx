'use client'
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import useTournamentResults from '@/hooks/useTournamentResults';
import { useAuth } from '@/context/AuthContext';
import { RiFilter2Fill, RiFilter2Line, RiEditLine, RiDeleteBinLine } from "react-icons/ri";
import { useTranslation } from 'react-i18next';
import Filter from './Filter/Filter'; // Adjust the path as needed
import Spinner from '@/components/common/Spinner/Spinner';
import { isNew } from '@/helpers/helpers';
import ResultsSearch from './ResultSearch/ResultSearch';

const Results = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [resultsToShow, setResultsToShow] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc');

  // Temperature Range
  const [tempRange, setTempRange] = useState([-30, 30]);
  const [defaultTempRange, setDefaultTempRange] = useState([-30, 30]);

  // Style Filter
  const [styleFilter, setStyleFilter] = useState('all');

  const { results, loading, error, deleteResult } = useTournamentResults();
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  // State for Filter Drawer
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Initialize temperature range from results
  useEffect(() => {
    if (results.length > 0) {
      const temperatures = results.map((r) => r.temperature);
      const min = Math.min(...temperatures);
      const max = Math.max(...temperatures);
      setTempRange([min, max]);
      setDefaultTempRange([min, max]);
    }
  }, [results]);

  const handleTempChange = (event, newValue) => {
    setTempRange(newValue);
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Reset all filters
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

  // Filter + sort results
  useEffect(() => {
    const filteredSortedResults = results
      .filter((result) => {
        // Style filter
        if (styleFilter !== 'all' && result.style !== styleFilter) return false;

        // Text search (style, location, snowCondition, or details from "rankings")
        const styleEnglish = t(result.style, { lng: 'en' }).toLowerCase();
        const styleNorwegian = t(result.style, { lng: 'no' }).toLowerCase();
        const snowSourceEnglish = t(result.snowCondition?.source, { lng: 'en' }).toLowerCase();
        const snowSourceNorwegian = t(result.snowCondition?.source, { lng: 'no' }).toLowerCase();
        const snowTypeEnglish = t(result.snowCondition?.grainType, { lng: 'en' }).toLowerCase();
        const snowTypeNorwegian = t(result.snowCondition?.grainType, { lng: 'no' }).toLowerCase();

        const matchesSearchTerm =
          styleEnglish.includes(searchTerm.toLowerCase()) ||
          styleNorwegian.includes(searchTerm.toLowerCase()) ||
          snowSourceEnglish.includes(searchTerm.toLowerCase()) ||
          snowSourceNorwegian.includes(searchTerm.toLowerCase()) ||
          snowTypeEnglish.includes(searchTerm.toLowerCase()) ||
          snowTypeNorwegian.includes(searchTerm.toLowerCase()) ||
          result.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.rankings.some((ranking) =>
            ranking.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ranking.grind.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ranking.brand.toLowerCase().includes(searchTerm.toLowerCase())
          );

        // Temperature range
        const withinTempRange =
          result.temperature >= tempRange[0] && result.temperature <= tempRange[1];

        return matchesSearchTerm && withinTempRange;
      })
      .sort((a, b) => {
        const dateA = new Date(a.timestamp.seconds * 1000);
        const dateB = new Date(b.timestamp.seconds * 1000);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });

    setResultsToShow(filteredSortedResults);
  }, [results, searchTerm, sortOrder, tempRange, t, styleFilter]);

  // Edit a result
  const handleEdit = (resultId) => {
    // We simply navigate to /edit-result/[resultId]
    // In Next.js, passing state via router push is not typical.
    router.push(`/editResult/${resultId}`);
  };

  // Delete a result
  const handleDelete = async (resultId) => {
    if (window.confirm(t('are_you_sure_delete_result'))) {
      try {
        await deleteResult(user.uid, resultId);
        const updated = resultsToShow.filter((r) => r.id !== resultId);
        setResultsToShow(updated);
      } catch (err) {
        console.error(t('error_deleting_result'), err);
      }
    }
  };

  // For highlighting search terms
  const highlightSearchTerm = (text) => {
    if (!searchTerm.trim()) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? <mark key={index}>{part}</mark> : part
    );
  };

  if (loading) return <Spinner />;
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
              className={`bg-container cursor-pointer flex items-center p-3 mb-1 shadow rounded hover:bg-btn hover:text-btntxt ${
                isFilterActive && 'text-btn'
              }`}
            >
              {isFilterActive ? <RiFilter2Fill /> : <RiFilter2Line />}
            </button>
          </div>
        </div>

        {/* The filter drawer */}
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

        {resultsToShow.length > 0 ? (
          resultsToShow.map((result) => (
            <div
              key={result.id}
              className="bg-container shadow rounded mb-5 animate-fade-down animate-duration-300"
            >
              {/* Header row with edit/delete */}
              <div className="flex justify-between p-4">
                <div>
                  <h3 className="font-semibold text-xl">
                    {highlightSearchTerm(t(result.style))} /{' '}
                    {highlightSearchTerm(`${result.temperature}°C`)}
                  </h3>
                  <i className="text-sm">{highlightSearchTerm(result.location)}</i>
                </div>
                <div className="flex bg-background p-2 rounded-full items-center space-x-3">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(result.id);
                    }}
                    className="shadow bg-container text-btn hover:bg-btn hover:text-btntxt rounded-full p-3 cursor-pointer"
                  >
                    <RiEditLine />
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(result.id);
                    }}
                    className="shadow text-delete bg-container hover:bg-delete hover:text-white rounded-full p-3 cursor-pointer"
                  >
                    <RiDeleteBinLine />
                  </div>
                </div>
              </div>

              {/* Rankings list */}
              <ul className="my-2 px-4 space-y-2">
                {result.rankings.map((ranking, index) => (
                  <li key={index} className="flex py-1">
                    <span className="flex items-center w-1/3">
                      {highlightSearchTerm(ranking.skiId ? ranking.serialNumber : t('deleted'))}
                      {isNew(ranking) && (
                        <p className="text-btn text-xs ml-1">- {t('new')}</p>
                      )}
                    </span>
                    <span className="w-1/3 text-center">
                      {highlightSearchTerm(ranking.grind)}
                    </span>
                    <span className="w-1/3 text-end">{ranking.score}</span>
                  </li>
                ))}
              </ul>

              {/* Additional details */}
              <div className="my-5 px-4">
                <h3 className="font-semibold text-dominant mb-4 text-lg">{t('details')}</h3>
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
                    <div className="font-semibold text-base">{result?.humidity || '--'}</div>
                  </li>
                  <li className="flex flex-col col-span-2">
                    {t('comment')}
                    <div className="font-semibold text-base">{result?.comment || '--'}</div>
                  </li>
                </ul>
              </div>

              {/* Timestamp */}
              <div className="flex justify-end mt-2 p-4">
                <div className="flex items-center">
                  <span className="px-2 border-r">
                    {new Date(result.timestamp.seconds * 1000).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="px-2">
                    {new Date(result.timestamp.seconds * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="my-4">
            <div className="italic">{t('no_test_results_available')}.</div>
          </div>
        )}
      </div>
    </>
  );
};

export default Results;
