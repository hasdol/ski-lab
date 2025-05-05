'use client'

import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'
import { formatDateForInputWithTime } from '@/helpers/helpers'
import { Timestamp } from 'firebase/firestore'
import { useSingleResult } from '@/hooks/useSingleResult'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import ShareWithEventSelector from '@/app/(protected)/testing/summary/components/ShareWithEvents'
import {
  updateTestResultBothPlaces,
  shareTestResult,
  // we'll add this util in teamFunctions
  unshareTestResult,
} from '@/lib/firebase/teamFunctions'

const EditResultPage = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const { result, loading, error } = useSingleResult(id)
  const [resultData, setResultData] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState([])

  // Initialize form and event selections
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
      })
      // Pre-select shared events
      setSelectedEvents(Array.isArray(result.sharedIn) ? [...result.sharedIn] : [])
    }
  }, [result])

  // Handle input changes (scores, metadata)
  const handleInputChange = (e) => {
    if (!resultData) return
    const { name, value } = e.target
    if (name === 'source' || name === 'grainType') {
      setResultData(prev => ({ ...prev, snowCondition: { ...prev.snowCondition, [name]: value } }))
    } else if (name.startsWith('score-')) {
      const idx = parseInt(name.split('-')[1], 10)
      setResultData(prev => {
        const updated = [...prev.rankings]
        updated[idx] = { ...updated[idx], score: Number(value) }
        return { ...prev, rankings: updated }
      })
    } else if (name === 'date') {
      const dt = new Date(value)
      if (!isNaN(dt.getTime())) setResultData(prev => ({ ...prev, timestamp: dt }))
    } else {
      setResultData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Submit updated result and sync sharing toggles
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user || !resultData) return
    setIsSubmitting(true)
    try {
      // Normalize timestamp
      let ts = resultData.timestamp
      if (!(ts instanceof Date)) ts = new Date(ts)
      if (isNaN(ts.getTime())) throw new Error('Invalid timestamp')

      // Prepare Firestore timestamps in rankings
      const rankingsWithTimestamps = resultData.rankings.map(r => {
        let dateAdded
        if (r.dateAdded instanceof Date) {
          dateAdded = Timestamp.fromDate(r.dateAdded)
        } else if (r.dateAdded?.seconds) {
          dateAdded = new Timestamp(r.dateAdded.seconds, r.dateAdded.nanoseconds)
        } else if (typeof r.dateAdded === 'string') {
          dateAdded = Timestamp.fromDate(new Date(r.dateAdded))
        } else {
          dateAdded = Timestamp.now()
        }
        return { ...r, dateAdded }
      })

      const payload = { ...resultData, timestamp: Timestamp.fromDate(ts), rankings: rankingsWithTimestamps }

      // Determine added and removed events
      const original = Array.isArray(result.sharedIn) ? result.sharedIn : []
      const added = selectedEvents.filter(
        sel => !original.some(o => o.teamId === sel.teamId && o.eventId === sel.eventId)
      )
      const removed = original.filter(
        o => !selectedEvents.some(sel => sel.teamId === o.teamId && sel.eventId === o.eventId)
      )

      // Update base data and remaining shared events
      await updateTestResultBothPlaces(user.uid, id, payload, selectedEvents)

      // Share newly added events
      if (added.length) {
        await Promise.all(
          added.map(({ teamId, eventId }) => shareTestResult(teamId, eventId, user.uid, id, payload))
        )
      }
      // Unshare removed events (delete from event and remove from user.sharedIn)
      if (removed.length) {
        await Promise.all(
          removed.map(({ teamId, eventId }) => unshareTestResult(teamId, eventId, user.uid, id))
        )
      }

      router.back()
    } catch (err) {
      console.error('Error updating result:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div>{t('loading')}...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!resultData) return <div>{t('no_result_data_found')}</div>

  return (
    <>
      <Head>
        <title>SkiLab: {t('edit_result')}</title>
        <meta name="description" content="Edit result" />
      </Head>
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-up animate-duration-300">
        <form onSubmit={handleSubmit} className="bg-white rounded-md p-6 md:p-8 space-y-8">
          {/* Scores */}
          {resultData.rankings.map((r, i) => (
            <div key={i} className="flex flex-col my-4">
              <label className="font-semibold mb-1">
                {`${r.serialNumber || t('deleted')} - ${r.grind || ''}`}
              </label>
              <Input type="number" name={`score-${i}`} value={r.score} onChange={handleInputChange} />
            </div>
          ))}

          <h3 className="mt-5 mb-2 text-2xl font-semibold text-dominant">{t('test_details')}</h3>
          <div className="space-y-4">
            {/* Metadata fields… */}
            <Input type="text" name="location" placeholder={t('location')} value={resultData.location} onChange={handleInputChange} required />
            <Input type="select" name="style" placeholder={t('style')} value={resultData.style} onChange={handleInputChange} required options={[{ label: t('classic'), value: 'classic' }, { label: t('skate'), value: 'skate' }]} />
            <Input type="number" name="temperature" placeholder={t('temperature')} value={resultData.temperature} onChange={handleInputChange} />
            <Input type="radio" name="source" placeholder={t('snow_source')} value={resultData.snowCondition.source} onChange={handleInputChange} required options={[{ label: t('natural'), value: 'natural' }, { label: t('artificial'), value: 'artificial' }, { label: t('mix'), value: 'mix' }]} />
            <Input type="select" name="grainType" placeholder={t('snow_type')} value={resultData.snowCondition.grainType} onChange={handleInputChange} required options={[{ label: t('fresh'), value: 'fresh' }, { label: t('fine_grained'), value: 'fine_grained' }, { label: t('coarse_grained'), value: 'coarse_grained' }, { label: t('wet'), value: 'wet' }, { label: t('icy_conditions'), value: 'icy_conditions' }, { label: t('sugary_snow'), value: 'sugary_snow' }]} />
            <Input type="number" name="snowTemperature" placeholder={t('snow_temperature')} value={resultData.snowTemperature} onChange={handleInputChange} />
            <Input type="number" name="humidity" placeholder={t('humidity')} value={resultData.humidity} onChange={handleInputChange} />
            <Input type="text" name="comment" placeholder={t('comment')} value={resultData.comment} onChange={handleInputChange} />
            <Input type="datetime-local" name="date" placeholder={t('date')} value={formatDateForInputWithTime(resultData.timestamp)} onChange={handleInputChange} required />

            {/* Shared events selector, pre-check from result.sharedIn */}
            <ShareWithEventSelector
              userId={user.uid}
              isVisible={true}
              includePast={true}
              initialSelectedEvents={result.sharedIn}
              onSelect={setSelectedEvents}
            />
          </div>

          <div className="flex space-x-4 my-5">
            <Button type="submit" variant="primary" loading={isSubmitting}>{t('save')}</Button>
            <Button variant="secondary" onClick={() => router.back()}>{t('back')}</Button>
          </div>
        </form>
      </div>
    </>
  )
}

export default EditResultPage
