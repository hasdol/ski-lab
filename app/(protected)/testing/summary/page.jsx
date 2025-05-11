'use client';

import React, { useContext, useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mapRankingsToTournamentData } from '@/helpers/helpers';
import ResultList from './components/ResultList';
import Spinner from '@/components/common/Spinner/Spinner';
import { useTranslation } from 'react-i18next';
import { TournamentContext } from '@/context/TournamentContext';
import { RiDeleteBinLine } from 'react-icons/ri';
import { addTestResult } from '@/lib/firebase/firestoreFunctions';
import { shareTestResult } from '@/lib/firebase/teamFunctions';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import ShareWithEventSelector from '@/app/(protected)/testing/summary/components/ShareWithEvents';
import { WEATHER_ENDPOINT } from '@/lib/firebase/weatherEndpoint';

const TestSummaryPage = () => {
  const { t } = useTranslation();
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
    if (window.confirm(t('reset_test_prompt'))) resetTournament();
  };

  const styleOptions = [
    { label: t('classic'), value: 'classic' },
    { label: t('skate'), value: 'skate' },
    { label: 'DP', value: 'dp' },
  ];

  const snowSourceOptions = [
    { label: t('natural'), value: 'natural' },
    { label: t('artificial'), value: 'artificial' },
    { label: t('mix'), value: 'mix' },
  ];

  const snowGrainOptions = [
    { label: t('fresh'), value: 'fresh' },
    { label: t('fine_grained'), value: 'fine_grained' },
    { label: t('coarse_grained'), value: 'coarse_grained' },
    { label: t('wet'), value: 'wet' },
    { label: t('icy_conditions'), value: 'icy_conditions' },
    { label: t('sugary_snow'), value: 'sugary_snow' },
  ];

  /* ───────────── render ───────────── */
  return (
    <div className="">
      <Head>
        <title>Ski-Lab: Results</title>
        <meta name="description" content="Displaying your test results" />
      </Head>

      <div className="space-y-5">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-5 mb-5">
          {t('summary')}
        </h1>
        {/* results list */}
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner />
            </div>
          ) : (
            <ResultList rankings={rankings} />
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
            placeholder={t('location')}
            onChange={handleInputChange}
            value={additionalData.location}
            required
          />

          <Input
            type="select"
            name="style"
            placeholder={t('style')}
            onChange={handleInputChange}
            value={additionalData.style}
            options={styleOptions}
            required
          />

          <Input
            type="number"
            name="temperature"
            placeholder={t('temperature')}
            value={additionalData.temperature}
            onChange={handleInputChange}
            required
          />

          <Input
            type="radio"
            name="source"
            placeholder={t('snow_source')}
            value={additionalData.snowCondition.source}
            onChange={handleInputChange}
            options={snowSourceOptions}
            required
          />

          <Input
            type="select"
            name="grainType"
            placeholder={t('snow_type')}
            value={additionalData.snowCondition.grainType}
            onChange={handleInputChange}
            options={snowGrainOptions}
            required
          />

          <Input
            type="number"
            name="snowTemperature"
            placeholder={t('snow_temperature')}
            value={additionalData.snowTemperature}
            onChange={handleInputChange}
          />

          <Input
            type="number"
            name="humidity"
            placeholder={t('humidity')}
            value={additionalData.humidity}
            onChange={handleInputChange}
          />

          <Input
            type="text"
            name="comment"
            placeholder={t('comment')}
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
                {t('save')}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/testing')}
              >
                {t('back')}
              </Button>

              <Button
                type="button"
                variant="danger"
                className="justify-self-end"
                onClick={handleResetTest}
              >
                {t('delete')}
              </Button>
            </div>
          </div>
        </form>

        {locationError && (
          <div className="text-red-500">{t('enable_location_services')}</div>
        )}
      </div>
    </div>
  );
};

export default TestSummaryPage;
