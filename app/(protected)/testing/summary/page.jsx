'use client';

import React, { useContext, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSkis } from '@/hooks/useSkis';
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
import { MdDelete, MdArrowBack } from 'react-icons/md';
import Card from '@/components/ui/Card'; // NEW

const SectionCard = ({ title, subtitle, children, right }) => (
  <Card as="section" padded={false} className="p-4 md:p-5">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h2 className="text-base md:text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle ? <p className="text-sm text-gray-600 mt-1">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex-shrink-0">{right}</div> : null}
    </div>
    {children}
  </Card>
);

const TestSummaryPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams(); // replaced window-based parsing
  const isManualMode = searchParams?.get('manual') === '1';

  const { user } = useAuth();
  const { selectedSkis, calculateRankings, resetTournament, restoreRoundFromHistory } =
    useContext(TournamentContext);

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

  const handleScoreChange = (skiId, newScore) => {
    setRankings((prev) =>
      prev.map((item) => (item.skiId === skiId ? { ...item, cumulativeScore: newScore } : item))
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
    testQuality: 5,
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
    const getPos = () =>
      new Promise((ok, err) => {
        if (!navigator.geolocation) return err(new Error('no geo'));
        navigator.geolocation.getCurrentPosition(ok, err);
      });

    const fetchWeather = async (lat, lon) => {
      try {
        const res = await fetch(`${WEATHER_ENDPOINT}?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        const instant = data.properties.timeseries[0].data.instant.details;

        let place = '';
        try {
          const rev = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          ).then((r) => r.json());

          place = rev.address?.quarter || rev.address?.city || rev.address?.town || '';
        } catch (_) {}

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

  const ownerUid =
    !isManualMode && selectedSkis?.[0]?.ownerUid ? selectedSkis[0].ownerUid : user?.uid;

  const isWriterTestingOtherUser = !!ownerUid && !!user?.uid && ownerUid !== user.uid;
  const canShareToEvents = !isWriterTestingOtherUser;

  /* ───────────── save results ───────────── */
  const handleSaveResults = async (e) => {
    e.preventDefault();

    const resultRankings = rankings;

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

    const skiSource = isManualMode ? inventorySkis : selectedSkis;
    const { rankings: payloadRankings } = mapRankingsToTournamentData(resultRankings, skiSource);

    try {
      setLoading(true);

      const newId = await addTestResult(ownerUid, { rankings: payloadRankings }, additionalData);

      if (canShareToEvents && selectedEvents.length) {
        const baseTestData = { ...additionalData, rankings: payloadRankings };
        try {
          await Promise.all(
            selectedEvents.map(({ teamId, eventId }) =>
              shareTestResult(teamId, eventId, ownerUid, newId, baseTestData)
            )
          );
        } catch (shareErr) {
          console.error('Sharing to events failed:', shareErr);
          alert('Result saved, but sharing to one or more events failed.');
        }
      }

      resetTournament();
      setHasSubmitted(true);
      setSelectedEvents([]);
      if (typeof window !== 'undefined') localStorage.removeItem('tournamentState');

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

  const handleManualAddRanking = () => {
    const first = inventorySkis && inventorySkis.length > 0 ? inventorySkis[0] : null;
    setRankings((prev) => [
      ...prev,
      {
        skiId: first ? first.id : '',
        serialNumber: first ? first.serialNumber : '',
        grind: first ? first.grind : '',
        cumulativeScore: 0,
      },
    ]);
  };

  const handleManualRankingChange = (idx, field, value) => {
    setRankings((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
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
          const num = value === '' || value == null ? 0 : Number(value);
          return { ...r, cumulativeScore: Number.isNaN(num) ? 0 : num };
        }
        return { ...r, [field]: value };
      })
    );
  };

  return (
    <div className="p-4 max-w-4xl w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center md:flex-row gap-4">
        <div className="bg-blue-100 p-3 rounded-xl">
          <SiTestrail className="text-blue-600 text-2xl" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Test Summary</h1>
          <p className="text-sm text-gray-600 mt-1">Review, adjust, then save.</p>
        </div>
        <div className="md:ml-auto flex gap-2">
          <Button type="button" variant="secondary" className="flex items-center" onClick={handleBackToTesting} size="sm">
            <MdArrowBack className="mr-1" /> Back
          </Button>
          <Button type="button" variant="danger" className="flex items-center" onClick={handleResetTest} size="sm">
            <MdDelete className="mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Section 1: Results */}
      <SectionCard
        title="Results"
        subtitle={isManualMode ? 'Add skis and enter differences to winner.' : 'Adjust differences if needed.'}
      >
        {loading ? (
          <div className="flex justify-center items-center h-28">
            <Spinner />
          </div>
        ) : isManualMode ? (
          <div className="space-y-3">
            {rankings.map((r, idx) => (
              <div
                key={idx}
                className="flex flex-col md:flex-row md:items-end gap-3 rounded-2xl p-4 border border-gray-200 bg-gray-50/30"
              >
                <div className="w-full md:flex-1">
                  <Input
                    type="select"
                    name={`ski-${idx}`}
                    value={r.skiId}
                    onChange={(e) => handleManualRankingChange(idx, 'skiId', e.target.value)}
                    options={inventorySkis.map((s) => ({
                      label: `${s.serialNumber}${s.brand ? ' • ' + s.brand : ''}`,
                      value: s.id,
                    }))}
                    placeholder="Select ski"
                    className="bg-white"
                    required
                  />
                </div>

                <div className="w-full md:w-56">
                  <Input
                    type="number"
                    name={`score-${idx}`}
                    value={r.cumulativeScore}
                    onChange={(e) => handleManualRankingChange(idx, 'cumulativeScore', e.target.value)}
                    placeholder="Difference to winner (cm)"
                    required
                    min={0}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>

                <div className="w-full md:w-auto flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    className="ml-auto flex items-center text-sm"
                    onClick={() => setRankings((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <MdDelete className="mr-1" /> Remove
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-2">
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
              const skiId = typeof idxOrId === 'string' ? idxOrId : rankings[idxOrId]?.skiId;
              if (skiId) handleScoreChange(skiId, newScore);
            }}
          />
        )}
      </SectionCard>

      {/* Sections 2 + 3 live inside the same form */}
      <form onSubmit={handleSaveResults} className="space-y-6">
        {/* Section 2: Details */}
        <SectionCard title="Details" subtitle="Basic conditions and notes for this test.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              name="location"
              placeholder="Location"
              onChange={handleInputChange}
              value={additionalData.location}
              required
            />

            <Input
              type="select"
              name="style"
              placeholder="Style"
              onChange={handleInputChange}
              value={additionalData.style}
              options={styleOptions}
              required
            />

            <Input
              type="number"
              name="temperature"
              placeholder="Temperature (°C)"
              value={additionalData.temperature}
              onChange={handleInputChange}
              required
            />

            <Input
              type="radio"
              name="source"
              placeholder="Snow source"
              value={additionalData.snowCondition.source}
              onChange={handleInputChange}
              options={snowSourceOptions}
              required
            />

            <Input
              type="select"
              name="grainType"
              placeholder="Snow type"
              value={additionalData.snowCondition.grainType}
              onChange={handleInputChange}
              options={snowGrainOptions}
              required
            />

            <Input
              type="number"
              name="snowTemperature"
              placeholder="Snow temperature (°C)"
              value={additionalData.snowTemperature}
              onChange={handleInputChange}
            />

            <Input
              type="number"
              name="humidity"
              placeholder="Humidity (%)"
              value={additionalData.humidity}
              onChange={handleInputChange}
            />

            <Input
              type="text"
              name="comment"
              placeholder="Comment"
              value={additionalData.comment}
              onChange={handleInputChange}
            />

            {/* Test execution satisfaction */}
            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50/40 p-4">
              <label htmlFor="testQuality" className="text-sm font-medium text-gray-700 flex justify-between">
                Test execution satisfaction
                <span className="text-blue-600 font-semibold">{additionalData.testQuality}</span>
              </label>
              <input
                id="testQuality"
                name="testQuality"
                type="range"
                min={1}
                max={10}
                step={1}
                value={additionalData.testQuality}
                onChange={handleInputChange}
                className="w-full mt-2 accent-blue-600"
              />
              <div className="text-xs text-gray-500 mt-1">1 = very poor, 10 = excellent execution</div>
            </div>
          </div>

          {locationError && (
            <div className="text-red-600 mt-4 text-sm">
              Enable location services to auto-fill weather.
            </div>
          )}
        </SectionCard>

        {/* Section 3: Sharing */}
        <SectionCard
          title="Sharing"
          subtitle={
            canShareToEvents
              ? 'Optionally share this test into team events.'
              : 'Sharing is disabled when testing on behalf of another user.'
          }
        >
          {canShareToEvents ? (
            <ShareWithEventSelector
              userId={ownerUid}
              isVisible={true}
              onSelect={setSelectedEvents}
              includePast={false}
              variant="embedded"
            />
          ) : (
            <div className="text-sm text-gray-600">
              Save the result normally. If you need sharing, run the test as the owner of the skis.
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button type="submit" loading={loading} variant="primary">
              Save
            </Button>
          </div>
        </SectionCard>
      </form>
    </div>
  );
};

export default TestSummaryPage;