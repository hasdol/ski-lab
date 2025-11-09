'use client';

import React, { useContext, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSkis } from '@/hooks/useSkis'; // new import
import { useAuth } from '@/context/AuthContext';
import { mapRankingsToTournamentData } from '@/helpers/helpers';
import SummaryResultList from './components/SummaryResultList';
import Spinner from '@/components/common/Spinner/Spinner';
import { TournamentContext } from '@/context/TournamentContext';
import { addTestResult } from '@/lib/firebase/firestoreFunctions';
import { shareTestResult } from '@/lib/firebase/teamFunctions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ShareWithEventSelector from '@/components/ShareWithEvents/ShareWithEvents';
import { WEATHER_ENDPOINT } from '@/lib/firebase/weatherEndpoint';
import { SiTestrail } from 'react-icons/si';
import { MdDelete, MdArrowBack } from "react-icons/md";


const TestSummaryPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams(); // replaced window-based parsing
  const isManualMode = searchParams?.get('manual') === '1';

  const { user } = useAuth();
  const {
    selectedSkis,
    calculateRankings,
    resetTournament,
    restoreRoundFromHistory
  } = useContext(TournamentContext);

  const { skis: inventorySkis } = useSkis(); // inventory hook

  const [loading, setLoading] = useState(false);
  const [locationError, setLocationErr] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]); // { teamId, eventId }

  /* ───────────── redirect if no skis ───────────── */
  useEffect(() => {
    if (!isManualMode && !hasSubmitted && (!selectedSkis || selectedSkis.length === 0)) {
      router.push('/skis');
    }
  }, [selectedSkis, router, hasSubmitted, isManualMode]);

  const [rankings, setRankings] = useState(isManualMode ? [] : calculateRankings());

  useEffect(() => {
    setRankings(calculateRankings());
  }, [selectedSkis, calculateRankings]);

  // Change handleScoreChange to use skiId
  const handleScoreChange = (skiId, newScore) => {
    setRankings(prev =>
      prev.map((item) =>
        item.skiId === skiId ? { ...item, cumulativeScore: newScore } : item
      )
    );
  };

  /* ───────────── form state ───────────── */
  const determineInitialStyle = () => {
    const styles = [...new Set(selectedSkis.map((s) => s.style))];
    if (styles.length === 1) return styles[0];
    if (styles.length > 1) return 'classic';
    return '';
  };

  const [additionalData, setAdditionalData] = useState({
    location: '',
    style: determineInitialStyle(),
    temperature: '',
    humidity: '',
    snowTemperature: '',
    comment: '',
    snowCondition: { source: '', grainType: '' },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'source' || name === 'grainType') {
      setAdditionalData((prev) => ({
        ...prev,
        snowCondition: { ...prev.snowCondition, [name]: value },
      }));
    } else {
      setAdditionalData((prev) => ({ ...prev, [name]: value }));
    }
  };

  /* ───────────── GEO + MET weather ───────────── */
  useEffect(() => {
    /* tiny helper */
    const getPos = () =>
      new Promise((ok, err) => {
        if (!navigator.geolocation) return err(new Error('no geo'));
        navigator.geolocation.getCurrentPosition(ok, err);
      });

    /* fetch from your Cloud Function */
    const fetchWeather = async (lat, lon) => {
      try {
        const res = await fetch(`${WEATHER_ENDPOINT}?lat=${lat}&lon=${lon}`);
        const data = await res.json();

        const instant = data.properties.timeseries[0].data.instant.details;

        /* Optional reverse‑geo for prettier place‑name */
        let place = '';
        try {
          const rev = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          ).then((r) => r.json());

          place =
            rev.address?.quarter ||
            rev.address?.city ||
            rev.address?.town ||
            '';
        } catch (_) {
          /* ignore – coords are fine */
        }

        setAdditionalData((prev) => ({
          ...prev,
          location: place,
          temperature: Math.round(instant.air_temperature).toString(),
          humidity: Math.round(instant.relative_humidity).toString(),
        }));
      } catch (error) {
        console.error('Weather error', error);
      }
    };

    getPos()
      .then((p) => fetchWeather(p.coords.latitude, p.coords.longitude))
      .catch((err) => {
        console.error('Location error', err);
        setLocationErr(true);
      });
  }, []);

  /* ───────────── save results ───────────── */
  const handleSaveResults = async (e) => {
    e.preventDefault();
    const resultRankings = isManualMode ? rankings : rankings;
    if (isManualMode) {
      if (!resultRankings.length) {
        alert('Please add at least one ski from your inventory.');
        return;
      }
      const invalid = resultRankings.some(
        (r) => !r.skiId || r.cumulativeScore === null || r.cumulativeScore === undefined
      );
      if (invalid) {
        alert('Please select a ski from your inventory and enter a score for each entry.');
        return;
      }
    }

    // Build enriched ranking snapshots for analytics
    const skiSource = isManualMode ? inventorySkis : selectedSkis;
    const { rankings: payloadRankings } = mapRankingsToTournamentData(resultRankings, skiSource);

    try {
      setLoading(true);
      // Save using addTestResult (existing helper)
      const newId = await addTestResult(
        user.uid,
        { rankings: payloadRankings },
        additionalData
      );

      // NEW: share with selected live events BEFORE resetting state
      if (selectedEvents.length) {
        const baseTestData = {
          ...additionalData,
          rankings: payloadRankings,
        };
        try {
          await Promise.all(
            selectedEvents.map(({ teamId, eventId }) =>
              shareTestResult(teamId, eventId, user.uid, newId, baseTestData)
            )
          );
        } catch (shareErr) {
          console.error('Sharing to events failed:', shareErr);
          alert('Result saved, but sharing to one or more events failed.');
        }
      }

      // Clear tournament state so localStorage is removed and UI resets
      resetTournament();
      setHasSubmitted(true);
      setSelectedEvents([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tournamentState');
      }

      router.push('/results');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Error saving result');
    } finally {
      setLoading(false);
    }
  };

  /* ───────────── misc helpers ───────────── */
  const handleResetTest = () => {
    if (window.confirm('Do you want to delete the test')) resetTournament();
  };

  const handleBackToTesting = () => {
    restoreRoundFromHistory();
    router.push('/testing');
  };

  const styleOptions = [
    { label: 'Classic', value: 'classic' },
    { label: 'Skate', value: 'skate' },
    { label: 'DP', value: 'dp' },
  ];

  const snowSourceOptions = [
    { label: 'Natural', value: 'natural' },
    { label: 'Artificial', value: 'artificial' },
    { label: 'Mix', value: 'mix' },
  ];

  const snowGrainOptions = [
    { label: 'Fresh', value: 'fresh' },
    { label: 'Fine grained', value: 'fine_grained' },
    { label: 'Coarse grained', value: 'coarse_grained' },
    { label: 'Wet', value: 'wet' },
    { label: 'Icy', value: 'icy' },
    { label: 'Sugary', value: 'sugary' },
  ];

  // Handler for manual entry
  const handleManualAddRanking = () => {
    // Default to first available ski if any
    const first = inventorySkis && inventorySkis.length > 0 ? inventorySkis[0] : null;
    setRankings((prev) => [
      ...prev,
      {
        skiId: first ? first.id : '',
        serialNumber: first ? first.serialNumber : '',
        grind: first ? first.grind : '',
        cumulativeScore: 0, // default 0
      },
    ]);
  };

  const handleManualRankingChange = (idx, field, value) => {
    setRankings((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        // If user selects a ski id, copy serialNumber/grind from inventory
        if (field === 'skiId') {
          const ski = inventorySkis.find((s) => s.id === value);
          return {
            ...r,
            skiId: value,
            serialNumber: ski ? ski.serialNumber : '',
            grind: ski ? ski.grind : '',
          };
        }
        if (field === 'cumulativeScore') {
          // ensure numeric value, default 0
          const num = value === '' || value == null ? 0 : Number(value);
          return { ...r, cumulativeScore: Number.isNaN(num) ? 0 : num };
        }
        return { ...r, [field]: value };
      })
    );
  };

  /* ───────────── render ───────────── */
  return (
    <div className="p-4 max-w-4xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center md:flex-row gap-4 mb-6">
        <div className="bg-blue-100 p-3 rounded-xl">
          <SiTestrail className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Summary</h1>
          <p className="text-xs text-gray-600 mt-1 flex flex-col gap-2">Review and finalize your ski test</p>
        </div>
        <div className="md:ml-auto flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className='flex items-center'
            onClick={handleBackToTesting}
            size="sm"
          >
            <MdArrowBack className="mr-1"/> Back
          </Button>
          <Button
            type="button"
            variant="danger"
            className='flex items-center'
            onClick={handleResetTest}
            size="sm"
          >
            <MdDelete className="mr-1" /> Delete
          </Button>
        </div>
      </div>



      {/* Results Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          {isManualMode ? "Manual Ski Entries" : "Test Results"}
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner />
          </div>
        ) : isManualMode ? (
          <div className="space-y-3">
            {rankings.map((r, idx) => (
              <div
                key={idx}
                className="flex flex-col md:flex-row items-end justify gap-3 rounded-lg p-5 border border-gray-200"
              >
                <div className="w-full md:w-1/2">
                  <Input
                    type="select"
                    name={`ski-${idx}`}
                    value={r.skiId}
                    onChange={(e) => handleManualRankingChange(idx, 'skiId', e.target.value)}
                    options={inventorySkis.map((s) => ({
                      label: `${s.serialNumber} ${s.brand ? '• ' + s.brand : ''}`,
                      value: s.id,
                    }))}
                    placeholder="Select ski"
                    className='bg-white'
                    required
                  />
                </div>
                <div className="w-full md:w-1/4">
                  <Input
                    type="number"
                    name={`score-${idx}`}
                    value={r.cumulativeScore}
                    onChange={(e) => handleManualRankingChange(idx, 'cumulativeScore', e.target.value)}
                    placeholder="Difference to winner (cm)"
                    required
                    min={0}
                  />
                </div>
                <div className="w-full md:w-auto flex-shrink-0 flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    className='ml-auto flex items-center text-sm'
                    onClick={() => setRankings((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <MdDelete className="mr-1" /> Remove
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="secondary"
                onClick={handleManualAddRanking}
                disabled={!inventorySkis || inventorySkis.length === 0}
                size="sm"
              >
                + Add Ski
              </Button>
              {(!inventorySkis || inventorySkis.length === 0) && (
                <span className="text-xs text-gray-400">No skis in inventory</span>
              )}
            </div>
          </div>
        ) : (
          <SummaryResultList
            rankings={rankings}
            onScoreChange={(idxOrId, newScore) => {
              // If idxOrId is a skiId, use directly; if index, get skiId from rankings
              const skiId = typeof idxOrId === 'string' ? idxOrId : rankings[idxOrId]?.skiId;
              if (skiId) handleScoreChange(skiId, newScore);
            }}
          />
        )}
      </div>

      {/* --- FORM STARTS HERE --- */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Test Details</h2>
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={handleSaveResults}
        >
          <Input
            type="text"
            name="location"
            placeholder='Location'
            onChange={handleInputChange}
            value={additionalData.location}
            required
          />
          <Input
            type="select"
            name="style"
            placeholder='Style'
            onChange={handleInputChange}
            value={additionalData.style}
            options={styleOptions}
            required
          />
          <Input
            type="number"
            name="temperature"
            placeholder='Temperature (°C)'
            value={additionalData.temperature}
            onChange={handleInputChange}
            required
          />
          <Input
            type="radio"
            name="source"
            placeholder='Snow source'
            value={additionalData.snowCondition.source}
            onChange={handleInputChange}
            options={snowSourceOptions}
            required
          />
          <Input
            type="select"
            name="grainType"
            placeholder='Snow type'
            value={additionalData.snowCondition.grainType}
            onChange={handleInputChange}
            options={snowGrainOptions}
            required
          />
          <Input
            type="number"
            name="snowTemperature"
            placeholder='Snow temperature (°C)'
            value={additionalData.snowTemperature}
            onChange={handleInputChange}
          />
          <Input
            type="number"
            name="humidity"
            placeholder='Humidity (%)'
            value={additionalData.humidity}
            onChange={handleInputChange}
          />
          <Input
            type="text"
            name="comment"
            placeholder='Comment'
            value={additionalData.comment}
            onChange={handleInputChange}
          />
          <div className="md:col-span-2">
            <ShareWithEventSelector
              userId={user.uid}
              isVisible={true}
              onSelect={setSelectedEvents}
              includePast={false}
            />
          </div>
          <div className="md:col-span-2 flex mt-2">
            <Button type="submit" loading={loading} variant="primary">
              Save
            </Button>
          </div>
        </form>
        {locationError && (
          <div className="text-red-500 mt-2 text-center text-sm font-medium">
            Enable location services
          </div>
        )}
      </div>
    </div>
  );
};

export default TestSummaryPage;