'use client'
import React, { useContext, useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mapRankingsToTournamentData } from '@/helpers/helpers';
import ResultList from './components/ResultList';
import Spinner from '@/components/common/Spinner/Spinner';
import { useTranslation } from 'react-i18next';
import { TournamentContext } from '@/context/TournamentContext';
import { RiDeleteBinLine } from "react-icons/ri";
import { addTestResult } from '@/lib/firebase/firestoreFunctions';
import { shareTestResult } from '@/lib/firebase/teamFunctions';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import ShareWithEventSelector from '@/components/ShareWithEventSelector/ShareWithEventSelector';

const TestSummaryPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { selectedSkis, calculateRankings, resetTournament } = useContext(TournamentContext);

  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [shareWithEvent, setShareWithEvent] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]); // Each element: { teamId, eventId }

  useEffect(() => {
    if (!hasSubmitted && (!selectedSkis || selectedSkis.length === 0)) {
      router.push('/skis');
    }
  }, [selectedSkis, router, hasSubmitted]);

  const rankings = calculateRankings();

  const determineInitialStyle = () => {
    const styles = [...new Set(selectedSkis.map((ski) => ski.style))];
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
    snowCondition: {
      source: '',
      grainType: '',
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'source' || name === 'grainType') {
      setAdditionalData((prev) => ({
        ...prev,
        snowCondition: { ...prev.snowCondition, [name]: value },
      }));
    } else {
      setAdditionalData({ ...additionalData, [name]: value });
    }
  };

  const handleSaveResults = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      // Map rankings to tournament data and add a new field "skiIds"
      const tournamentData = {
        ...mapRankingsToTournamentData(rankings, selectedSkis),
        skiIds: selectedSkis.map((ski) => ski.id),
      };

      // Include the selected events as sharedIn if sharing is enabled
      const extendedData = {
        ...additionalData,
        ...(shareWithEvent && selectedEvents.length > 0 ? { sharedIn: selectedEvents } : {})
      };

      // Save the test result in the user's private collection.
      const testId = await addTestResult(user.uid, tournamentData, extendedData);

      // If sharing is enabled, share the test result to each event.
      if (shareWithEvent && selectedEvents.length > 0) {
        const sharedData = { ...tournamentData, ...additionalData };
        await Promise.all(
          selectedEvents.map(({ teamId, eventId }) =>
            shareTestResult(teamId, eventId, user.uid, testId, sharedData)
          )
        );
      }

      // No longer updating ski documents individually since test result now holds the skiIds array.
      resetTournament();
    } catch (error) {
      console.error('Error saving test:', error);
    } finally {
      setLoading(false);
      setHasSubmitted(true);
      router.push('/results');
    }
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

  useEffect(() => {
    const getPosition = () =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

    const fetchWeather = async (lat, lon) => {
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      if (!apiKey) return;

      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
        const data = await res.json();
        setAdditionalData((prev) => ({
          ...prev,
          location: data.name || '',
          temperature: data.main?.temp ? Math.round(data.main.temp).toString() : '',
        }));
      } catch (err) {
        console.error('Weather error', err);
      }
    };

    getPosition()
      .then((pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude))
      .catch((err) => {
        console.error('Location error', err);
        setLocationError(true);
      });
  }, []);

  const handleResetTest = () => {
    if (window.confirm(t('reset_test_prompt'))) resetTournament();
  };

  return (
    <div className="py-4 px-2">
      <Head>
        <title>Ski-Lab: Results</title>
        <meta name="description" content="Displaying your test results" />
      </Head>
      <div className="space-y-5">
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner />
            </div>
          ) : (
            <ResultList rankings={rankings} />
          )}
        </div>
        <form className="rounded flex flex-col text-black my-2" onSubmit={handleSaveResults}>
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
            required
            options={styleOptions}
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

          <div className="mb-4">
            <label className="inline-flex items-center space-x-2">
              <input type="checkbox" checked={shareWithEvent} onChange={() => setShareWithEvent(!shareWithEvent)} />
              <span>Share with live events?</span>
            </label>
          </div>

          {shareWithEvent && (
            <ShareWithEventSelector
              userId={user.uid}
              isVisible={true}
              onSelect={(events) => setSelectedEvents(events)}
            />
          )}

          <div className="flex sm:space-x-4 space-y-4 sm:space-y-0 my-4 justify-between">
            <div className="flex space-x-2">
              <Button type="submit" loading={loading} variant="primary">
                {t('save')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push('/testing')}>
                {t('back')}
              </Button>
              <Button type="button" variant="danger" className='justify-self-end' onClick={handleResetTest}>
                <RiDeleteBinLine />
              </Button>
            </div>
          </div>
        </form>
        {locationError && <div className="text-red-500">{t('enable_location_services')}</div>}
      </div>
    </div>
  );
};

export default TestSummaryPage;
