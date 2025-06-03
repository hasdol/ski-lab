'use client';

import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

const TestSummaryPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedSkis, calculateRankings, resetTournament } =
    useContext(TournamentContext);

  const [loading, setLoading] = useState(false);
  const [locationError, setLocationErr] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]); // { teamId, eventId }

  /* ───────────── redirect if no skis ───────────── */
  useEffect(() => {
    if (!hasSubmitted && (!selectedSkis || selectedSkis.length === 0)) {
      router.push('/skis');
    }
  }, [selectedSkis, router, hasSubmitted]);

  const rankings = calculateRankings();

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
    if (!user) return;

    try {
      setLoading(true);

      const tournamentData = {
        ...mapRankingsToTournamentData(rankings, selectedSkis),
        skiIds: selectedSkis.map((s) => s.id),
      };

      const extendedData =
        selectedEvents.length > 0
          ? { ...additionalData, sharedIn: selectedEvents }
          : additionalData;

      const testId = await addTestResult(user.uid, tournamentData, extendedData);

      if (selectedEvents.length > 0) {
        const sharedData = { ...tournamentData, ...additionalData };
        await Promise.all(
          selectedEvents.map(({ teamId, eventId }) =>
            shareTestResult(teamId, eventId, user.uid, testId, sharedData)
          )
        );
      }

      resetTournament();
    } catch (error) {
      console.error('Error saving test:', error);
    } finally {
      setLoading(false);
      setHasSubmitted(true);
      router.push('/results');
    }
  };

  /* ───────────── misc helpers ───────────── */
  const handleResetTest = () => {
    if (window.confirm('Do you want to delete the test')) resetTournament();
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

  /* ───────────── render ───────────── */
  return (
    <div>
      <div className='p-3 md:w-2/3 mx-auto space-y-6'>
        <h1 className="text-3xl font-bold text-gray-900 my-6">
          Summary
        </h1>

        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/testing')}
        >
          Back
        </Button>
        {/* results list */}
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner />
            </div>
          ) : (
            <SummaryResultList rankings={rankings} />
          )}
        </div>

        {/* form */}
        <form
          className="rounded flex flex-col text-black my-2 space-y-3"
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

          <ShareWithEventSelector
            userId={user.uid}
            isVisible={true}
            onSelect={setSelectedEvents}
            includePast={false}
          />

          {/* buttons */}
          <div className="flex sm:space-x-4 space-y-4 sm:space-y-0 my-4 justify-between">
            <div className="flex space-x-2">
              <Button type="submit" loading={loading} variant="primary">
                Save
              </Button>

              <Button
                type="button"
                variant="danger"
                className="justify-self-end"
                onClick={handleResetTest}
              >
                Delete
              </Button>
            </div>
          </div>
        </form>

        {locationError && (
          <div className="text-red-500">Enable location services</div>
        )}
      </div>
    </div>
  );
};

export default TestSummaryPage;
