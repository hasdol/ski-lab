'use client'
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import BackBtn from '@/components/common/BackBtn/BackBtn';
import { formatDateForInputWithTime } from '@/helpers/helpers';
import { Timestamp } from 'firebase/firestore';
import { useSingleResult } from '@/hooks/useSingleResult';
import { updateTournamentResult } from '@/lib/firebase/firestoreFunctions';
import SaveTestInput from '../../testing/summary/components/SaveTestInput';

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
      await updateTournamentResult(user.uid, resultId, {
        ...resultData,
        timestamp: Timestamp.fromDate(timestampToUse),
        rankings: rankingsWithTimestamps,
      });

      router.push('/results');
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
      <div className="py-4 px-2">
        <form onSubmit={handleSubmit}>
          {resultData.rankings.map((ranking, index) => (
            <div key={index} className="flex flex-col mb-2">
              <label className="font-semibold">
                {`${ranking.serialNumber || t('deleted')} - ${ranking.grind || ''}`}
              </label>
              <SaveTestInput
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
          <div className="space-y-2">
            <SaveTestInput
              type="text"
              name="location"
              placeholder={t('location')}
              onChange={handleInputChange}
              value={resultData.location}
              required
            />
            <SaveTestInput
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
            <SaveTestInput
              type="number"
              name="temperature"
              placeholder={t('temperature')}
              onChange={handleInputChange}
              value={resultData.temperature}
            />
            <SaveTestInput
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
            <SaveTestInput
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
            <SaveTestInput
              type="number"
              name="snowTemperature"
              placeholder={t('snow_temperature')}
              onChange={handleInputChange}
              value={resultData.snowTemperature}
            />
            <SaveTestInput
              type="number"
              name="humidity"
              placeholder={t('humidity')}
              onChange={handleInputChange}
              value={resultData.humidity}
            />
            <div className="col-span-2">
              <SaveTestInput
                type="text"
                name="comment"
                placeholder={t('comment')}
                onChange={handleInputChange}
                value={resultData.comment}
              />
            </div>
            <SaveTestInput
              type="datetime-local"
              name="date"
              placeholder={t('date')}
              onChange={handleInputChange}
              value={formatDateForInputWithTime(resultData.timestamp)}
              required
            />
          </div>
          <div className="flex space-x-4 my-5">
            <button
              type="submit"
              className="bg-btn px-5 py-3 rounded w-fit text-btntxt hover:opacity-90"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('loading') : t('save')}
            </button>
            <BackBtn />
          </div>
        </form>
      </div>
    </>
  );
};

export default EditResultPage;
