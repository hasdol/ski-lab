'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { formatDateForInputWithTime, formatDate } from '@/helpers/helpers'
import { Timestamp } from 'firebase/firestore'
import { useSingleResult } from '@/hooks/useSingleResult'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ShareWithEventSelector from '@/components/ShareWithEvents/ShareWithEvents'
import {
  shareTestResult,
  unshareTestResult,
  shareCrossUserTestResult,
  unshareCrossUserTestResult,
} from '@/lib/firebase/teamFunctions'
import Spinner from '@/components/common/Spinner/Spinner'
import { updateTestResultBothPlaces } from '@/lib/firebase/firestoreFunctions'
import { RiBarChart2Line } from 'react-icons/ri'
import Card from '@/components/ui/Card'
import SummaryResultList from '@/app/(protected)/testing/summary/components/SummaryResultList'


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
)


const EditResultPage = () => {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const { result, loading, error } = useSingleResult(id)
  const [resultData, setResultData] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState([])

  const ownersInvolved = Array.isArray(result?.ownersInvolved) ? result.ownersInvolved : []
  const isCrossTest = !!result?.isCrossTest

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
        testQuality: (
          result.testQuality ??
          result.additionalData?.testQuality ??
          result.meta?.testQuality ??
          5
        ), // NEW
        snowCondition: {
          source: result.snowCondition?.source || '',
          grainType: result.snowCondition?.grainType || '',
        },
        timestamp: result.timestamp?.toDate ? result.timestamp.toDate() : new Date(),
        rankings: result.rankings ? [...result.rankings] : [],
        ownerDisplayNameByUid: result.ownerDisplayNameByUid || {},
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
    } else if (name === 'testQuality') {
      const v = Math.max(1, Math.min(10, Number(value) || 1))
      setResultData(prev => ({ ...prev, testQuality: v })) // NEW: coerce to 1–10
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

      // IMPORTANT: Only sync event copies that already exist.
      // New selections may not have an event doc yet; trying to setDoc() them here can be treated
      // as a CREATE and fail rules (missing userId / insufficient permissions).
      const stillShared = selectedEvents.filter(
        sel => original.some(o => o.teamId === sel.teamId && o.eventId === sel.eventId)
      )

      // Update base data + existing shared event copies
      await updateTestResultBothPlaces(user.uid, id, payload, stillShared)

      // Share newly added events
      if (added.length) {
        await Promise.all(
          added.map(({ teamId, eventId }) => {
            if (isCrossTest && ownersInvolved.length > 0) {
              return shareCrossUserTestResult(teamId, eventId, ownersInvolved, id, payload, user.uid)
            }
            return shareTestResult(teamId, eventId, user.uid, id, payload)
          })
        )
      }
      // Unshare removed events (delete from event and remove from user.sharedIn)
      if (removed.length) {
        await Promise.all(
          removed.map(({ teamId, eventId }) => {
            if (isCrossTest && ownersInvolved.length > 0) {
              return unshareCrossUserTestResult(teamId, eventId, ownersInvolved, id)
            }
            return unshareTestResult(teamId, eventId, user.uid, id)
          })
        )
      }

      // Now that new event docs (if any) have been created, sync all selected event copies.
      if (selectedEvents.length) {
        await updateTestResultBothPlaces(user.uid, id, payload, selectedEvents)
      }

      router.back()
    } catch (err) {
      console.error('Error updating result:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 max-w-4xl w-full mx-auto space-y-6">
      {/* Header (match Test Summary styling) */}
      <div className="flex flex-col items-center md:flex-row gap-4">
        <div className="bg-blue-100 p-3 rounded-xl">
          <RiBarChart2Line className="text-blue-600 text-2xl" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Edit Test Result</h1>
          <p className="text-sm text-gray-600 mt-1">Review, adjust, then save.</p>
        </div>
        <div className="md:ml-auto flex gap-2">
          <Button type="button" variant="secondary" onClick={() => router.back()} size="sm">
            Back
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-28">
          <Spinner />
        </div>
      ) : error ? (
        <div>Error: {error.message}</div>
      ) : !resultData ? (
        <div>No result data found</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <SectionCard title="Results" subtitle="Adjust differences if needed.">
            <SummaryResultList
              rankings={(resultData.rankings || []).map((r) => ({
                skiId: r.skiId,
                serialNumber: r.serialNumber || 'Deleted',
                cumulativeScore: Number(r.score) || 0,
              }))}
              onScoreChange={(skiId, newScore) => {
                const idx = (resultData.rankings || []).findIndex((r) => r.skiId === skiId)
                if (idx >= 0) {
                  handleInputChange({ target: { name: `score-${idx}`, value: newScore } })
                }
              }}
            />
          </SectionCard>

          <SectionCard title="Details" subtitle="Basic conditions and notes for this test.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              name="location"
              placeholder="Location"
              value={resultData.location}
              onChange={handleInputChange}
              required
            />
            <Input
              type="select"
              name="style"
              placeholder="Style"
              value={resultData.style}
              onChange={handleInputChange}
              required
              options={[
                { label: 'Classic', value: 'classic' },
                { label: 'Skate', value: 'skate' },
              ]}
            />
            <Input
              type="number"
              name="temperature"
              placeholder="Temperature (°C)"
              value={resultData.temperature}
              onChange={handleInputChange}
            />
            <Input
              type="radio"
              name="source"
              placeholder="Snow source"
              value={resultData.snowCondition.source}
              onChange={handleInputChange}
              required
              options={[
                { label: 'Natural', value: 'natural' },
                { label: 'Artificial', value: 'artificial' },
                { label: 'Mix', value: 'mix' },
              ]}
            />
            <Input
              type="select"
              name="grainType"
              placeholder="Snow type"
              value={resultData.snowCondition.grainType}
              onChange={handleInputChange}
              required
              options={[
                { label: 'Fresh', value: 'fresh' },
                { label: 'Fine grained', value: 'fine_grained' },
                { label: 'Coarse grained', value: 'coarse_grained' },
                { label: 'Wet', value: 'wet' },
                { label: 'Icy', value: 'icy' },
                { label: 'Sugary', value: 'sugary' },
              ]}
            />
            <Input
              type="number"
              name="snowTemperature"
              placeholder="Snow temperature (°C)"
              value={resultData.snowTemperature}
              onChange={handleInputChange}
            />
            <Input
              type="number"
              name="humidity"
              placeholder="Humidity (%)"
              value={resultData.humidity}
              onChange={handleInputChange}
            />
            <Input
              type="text"
              name="comment"
              placeholder="Comment"
              value={resultData.comment}
              onChange={handleInputChange}
            />

            {/* Test execution satisfaction slider */}
            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50/40 p-4">
              <label htmlFor="testQuality" className="text-sm font-medium text-gray-700 flex justify-between">
                Test execution satisfaction
                <span className="text-blue-600 font-semibold">{resultData.testQuality}</span>
              </label>
              <input
                id="testQuality"
                name="testQuality"
                type="range"
                min={1}
                max={10}
                step={1}
                value={resultData.testQuality}
                onChange={handleInputChange}
                className="w-full mt-2 accent-blue-600"
              />
              <div className="text-xs text-gray-500 mt-1">
                1 = very poor, 10 = excellent execution
              </div>
            </div>

            <div>
              <Input
                type="datetime-local"
                name="date"
                placeholder="Date"
                value={formatDateForInputWithTime(resultData.timestamp)}
                onChange={handleInputChange}
                required
              />
            </div>

          </div>
          </SectionCard>

          <SectionCard title="Sharing" subtitle="Optionally share this test into team events.">
            <ShareWithEventSelector
              userId={user.uid}
              isVisible={true}
              includePast={true}
              initialSelectedEvents={result.sharedIn}
              onSelect={setSelectedEvents}
              requiredMemberUids={isCrossTest ? ownersInvolved : []}
              variant="embedded"
            />

            <div className="mt-4 flex justify-end gap-2">
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Save
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </SectionCard>
        </form>
      )}
    </div>
  )
}

export default EditResultPage
