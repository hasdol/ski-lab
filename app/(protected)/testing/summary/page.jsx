'use client'
import React, { useContext, useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mapRankingsToTournamentData } from '@/helpers/helpers';
import ResultList from './components/ResultList';
import Spinner from '@/components/common/Spinner/Spinner';
import { useTranslation } from 'react-i18next';
import SaveTestInput from './components/SaveTestInput';
import { TournamentContext } from '@/context/TournamentContext';
import { RiDeleteBinLine } from "react-icons/ri";
import { addTestResult, updateTestArray } from '@/lib/firebase/firestoreFunctions';
import LoadingButton from '@/components/common/LoadingButton/LoadingButton';

// Helper function to update all test arrays
const updateAllTestArrays = async (userId, rankings, testId) => {
  for (const ranking of rankings) {
    await updateTestArray(userId, ranking.skiId, testId);
  }
};

const TestSummaryPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { selectedSkis, calculateRankings, resetTournament } = useContext(TournamentContext);

  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Redirect if no skis are selected (only if we haven't just submitted)
  useEffect(() => {
    if (!hasSubmitted && (!selectedSkis || selectedSkis.length === 0)) {
      router.push('/skis');
    }
  }, [selectedSkis, router, hasSubmitted]);

  const rankings = calculateRankings();

  // Build initial style from selected skis
  const determineInitialStyle = () => {
    const styles = [...new Set(selectedSkis.map((ski) => ski.style))];
    if (styles.length === 1) {
      return styles[0];
    } else if (styles.length > 1) {
      return 'classic';
    } else {
      return '';
    }
  };

  // additionalData holds extra details to be saved with test results
  const [additionalData, setAdditionalData] = useState({
    location: '',
    style: determineInitialStyle(),
    temperature: '',
    humidity: '',
    snowTemperature: '',
    comment: '',
    // New structure: snowCondition as an object
    snowCondition: {
      source: '',
      grainType: '',
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'source' || name === 'grainType') {
      setAdditionalData((prevData) => ({
        ...prevData,
        snowCondition: { ...prevData.snowCondition, [name]: value },
      }));
    } else {
      setAdditionalData({ ...additionalData, [name]: value });
    }
  };

  const handleSaveResults = async (e) => {
    e.preventDefault();
    if (!user) {
      console.log('User not found');
      return;
    }
    try {
      setLoading(true);
      // Add test result to Firestore using new structure for snowCondition
      const testId = await addTestResult(
        user.uid,
        mapRankingsToTournamentData(rankings, selectedSkis),
        additionalData
      );
      await updateAllTestArrays(user.uid, rankings, testId);
      resetTournament();
    } catch (error) {
      console.error('Error: ', error);
    } finally {
      setLoading(false);
      setHasSubmitted(true);
      router.push('/results');
    }
  };

  const styleOptions = [
    { label: t('classic'), value: 'classic' },
    { label: t('skate'), value: 'skate' },
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

  // Fetch location and weather data
  useEffect(() => {
    const getPosition = () =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

    const fetchWeather = async (latitude, longitude) => {
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY; // Use NEXT_PUBLIC_ prefix in Next.js
      if (!apiKey) return;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAdditionalData((prevData) => ({
          ...prevData,
          location: data.name || '',
          temperature: data.main.temp ? Math.round(data.main.temp).toString() : '',
        }));
      } catch (error) {
        console.error('Could not fetch weather data', error);
      }
    };

    const requestLocation = () => {
      setLocationError(false);
      getPosition()
        .then((position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        })
        .catch((err) => {
          console.error("Could not get the user's position", err);
          setLocationError(true);
        });
    };

    requestLocation();
  }, []);

  const handleResetTest = () => {
    const confirmReset = window.confirm(t('reset_test_prompt'));
    if (confirmReset) {
      resetTournament();
    }
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
        <div>
          <form className="rounded flex flex-col text-black my-2" onSubmit={handleSaveResults}>
            <SaveTestInput
              type="text"
              name="location"
              placeholder={t('location')}
              onChange={handleInputChange}
              value={additionalData.location}
              required
            />
            <SaveTestInput
              type="select"
              name="style"
              placeholder={t('style')}
              onChange={handleInputChange}
              value={additionalData.style}
              required
              options={styleOptions}
            />
            <SaveTestInput
              type="number"
              name="temperature"
              placeholder={t('temperature')}
              value={additionalData.temperature}
              onChange={handleInputChange}
              required
            />
            <SaveTestInput
              type="radio"
              name="source"
              placeholder={t('snow_source')}
              value={additionalData.snowCondition.source}
              onChange={handleInputChange}
              options={snowSourceOptions}
              required
            />
            <SaveTestInput
              type="select"
              name="grainType"
              placeholder={t('snow_type')}
              value={additionalData.snowCondition.grainType}
              onChange={handleInputChange}
              options={snowGrainOptions}
              required
            />
            <SaveTestInput
              type="number"
              name="snowTemperature"
              placeholder={t('snow_temperature')}
              value={additionalData.snowTemperature}
              onChange={handleInputChange}
            />
            <SaveTestInput
              type="number"
              name="humidity"
              placeholder={t('humidity')}
              value={additionalData.humidity}
              onChange={handleInputChange}
            />
            <div className="col-span-2">
              <SaveTestInput
                type="text"
                name="comment"
                placeholder={t('comment')}
                value={additionalData.comment}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex sm:space-x-4 space-y-4 sm:space-y-0 my-4 justify-between">
              <div className="flex space-x-2">
                <LoadingButton
                  type="submit"
                  isLoading={loading}
                  className="px-5 py-3 cursor-pointer bg-btn text-btntxt rounded w-fit hover:opacity-90"
                >
                  {t('save')}
                </LoadingButton>
                <button
                  type="button"
                  className="px-5 py-3 cursor-pointer bg-sbtn text-text rounded w-fit hover:bg-hoverSbtn"
                  onClick={() => router.push('/testing')}
                >
                  {t('back')}
                </button>
              </div>
              <button
                type="button"
                className="p-4 h-fit bg-container cursor-pointer text-delete shadow rounded w-fit hover:bg-sbtn"
                onClick={handleResetTest}
              >
                <RiDeleteBinLine />
              </button>
            </div>
          </form>
          {locationError && (
            <div className="text-red-500">
              {t('enable_location_services')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestSummaryPage;
