'use client'
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { formatDateForInputWithTime } from '@/helpers/helpers';
import { Timestamp } from 'firebase/firestore';
import { useSingleResult } from '@/hooks/useSingleResult';
import Input from '@/components/common/Input'; // Updated: using the new generic Input component
import { updateTestResultBothPlaces } from '@/lib/firebase/teamFunctions';
import Button from '@/components/common/Button';

const EditResultPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  // Fetch result data using our custom hook
  const { result, loading, error } = useSingleResult(id);

  // Local state to hold editable data once the result is fetched
  const [resultData, setResultData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Once result is fetched, initialize form state
  useEffect(() => {
    if (result) {
      setResultData({
        location: result.location || '',
        style: result.style || '',
        temperature: result.temperature || '',
        snowTemperature: result.snowTemperature || '',
        humidity: result.humidity || '',
        comment: result.comment || '',
        snowCondition: {
          source: result.snowCondition?.source || '',
          grainType: result.snowCondition?.grainType || '',
        },
        timestamp: result.timestamp?.toDate ? result.timestamp.toDate() : new Date(),
        rankings: result.rankings ? [...result.rankings] : [],
      });
    }
  }, [result]);

  const handleInputChange = (e) => {
    if (!resultData) return;
    const { name, value } = e.target;

    if (name === 'source' || name === 'grainType') {
      setResultData((prev) => ({
        ...prev,
        snowCondition: { ...prev.snowCondition, [name]: value },
      }));
    } else if (name.startsWith('score-')) {
      const index = parseInt(name.split('-')[1]);
      setResultData((prevData) => {
        const updatedRankings = [...prevData.rankings];
        updatedRankings[index] = { ...updatedRankings[index], score: Number(value) };
        return { ...prevData, rankings: updatedRankings };
      });
    } else if (name === 'date') {
      const newDate = new Date(value);
      if (!isNaN(newDate.getTime())) {
        setResultData((prev) => ({ ...prev, timestamp: newDate }));
      }
    } else {
      setResultData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resultData) return;
    setIsSubmitting(true);

    try {
      // Convert local date to Firestore Timestamp
      let timestampToUse = resultData.timestamp;
      if (!(timestampToUse instanceof Date)) {
        timestampToUse = new Date(timestampToUse);
      }
      if (isNaN(timestampToUse.getTime())) throw new Error('Invalid timestamp');

      // Convert rankings dateAdded
      const rankingsWithTimestamps = resultData.rankings.map((r) => {
        let dateAdded;
        if (r.dateAdded instanceof Date) {
          dateAdded = Timestamp.fromDate(r.dateAdded);
        } else if (r.dateAdded && r.dateAdded.seconds) {
          dateAdded = new Timestamp(r.dateAdded.seconds, r.dateAdded.nanoseconds);
        } else if (typeof r.dateAdded === 'string') {
          dateAdded = Timestamp.fromDate(new Date(r.dateAdded));
        } else {
          dateAdded = Timestamp.now();
        }
        return { ...r, dateAdded };
      });

      // Call your firestore update function
      await updateTestResultBothPlaces(
        user.uid,
        id, // testId
        {
          ...resultData,
          timestamp: Timestamp.fromDate(timestampToUse),
          rankings: rankingsWithTimestamps,
        },
        result.sharedIn // This should be an array: [{ teamId, eventId }, ...]
      );

      router.back();

    } catch (err) {
      console.error('Error updating result:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>{t('loading')}...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!resultData) return <div>{t('no_result_data_found')}</div>;

  return (
    <>
      <Head>
        <title>SkiLab: {t('edit_result')}</title>
        <meta name="description" content="Edit result" />
      </Head>
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-up animate-duration-300">
        <form onSubmit={handleSubmit} className='bg-white rounded-md shadow p-6 md:p-8 space-y-8'>
          {resultData.rankings.map((ranking, index) => (
            <div key={index} className="flex flex-col my-4">
              <label className="font-semibold mb-1">
                {`${ranking.serialNumber || t('deleted')} - ${ranking.grind || ''}`}
              </label>
              <Input
                type="number"
                name={`score-${index}`}
                onChange={handleInputChange}
                value={ranking.score}
              />
            </div>
          ))}
          <h3 className="mt-5 mb-2 text-2xl font-semibold text-dominant">
            {t('test_details')}
          </h3>
          <div className="space-y-4">
            <Input
              type="text"
              name="location"
              placeholder={t('location')}
              onChange={handleInputChange}
              value={resultData.location}
              required
            />
            <Input
              type="select"
              name="style"
              placeholder={t('style')}
              onChange={handleInputChange}
              value={resultData.style}
              required
              options={[
                { label: t('classic'), value: 'classic' },
                { label: t('skate'), value: 'skate' },
              ]}
            />
            <Input
              type="number"
              name="temperature"
              placeholder={t('temperature')}
              onChange={handleInputChange}
              value={resultData.temperature}
            />
            <Input
              type="radio"
              name="source"
              placeholder={t('snow_source')}
              value={resultData.snowCondition.source}
              onChange={handleInputChange}
              options={[
                { label: t('natural'), value: 'natural' },
                { label: t('artificial'), value: 'artificial' },
                { label: t('mix'), value: 'mix' },
              ]}
              required
            />
            <Input
              type="select"
              name="grainType"
              placeholder={t('snow_type')}
              value={resultData.snowCondition.grainType}
              onChange={handleInputChange}
              options={[
                { label: t('fresh'), value: 'fresh' },
                { label: t('fine_grained'), value: 'fine_grained' },
                { label: t('coarse_grained'), value: 'coarse_grained' },
                { label: t('wet'), value: 'wet' },
                { label: t('icy_conditions'), value: 'icy_conditions' },
                { label: t('sugary_snow'), value: 'sugary_snow' },
              ]}
              required
            />
            <Input
              type="number"
              name="snowTemperature"
              placeholder={t('snow_temperature')}
              onChange={handleInputChange}
              value={resultData.snowTemperature}
            />
            <Input
              type="number"
              name="humidity"
              placeholder={t('humidity')}
              onChange={handleInputChange}
              value={resultData.humidity}
            />
            <Input
              type="text"
              name="comment"
              placeholder={t('comment')}
              onChange={handleInputChange}
              value={resultData.comment}
            />
            <Input
              type="datetime-local"
              name="date"
              placeholder={t('date')}
              onChange={handleInputChange}
              value={formatDateForInputWithTime(resultData.timestamp)}
              required
            />
          </div>
          <div className="flex space-x-4 my-5">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
            >
              {t('save')}
            </Button>
            <Button variant='secondary' onClick={() => router.back()}>
              {t('back')}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditResultPage;
