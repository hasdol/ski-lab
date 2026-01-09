'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ProductTestModal({
  open,
  test,
  rankings,
  isEditing,
  setIsEditing,
  onStartEdit,
  editForm,
  setEditForm,
  saving,
  onSave,
  onDelete,
  onClose,
  safeNumber,
  formatDistance,
  distanceAtTestFromDoc,
  formatDateWithOptions,
}) {
  if (!open || !test) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-md border border-gray-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-500 uppercase">Product test</div>
            <div className="text-lg font-semibold text-gray-900">Test details</div>
            <div className="text-xs text-gray-500 mt-1">
              {(() => {
                const ts = test.timestamp?.toDate ? test.timestamp.toDate() : (test.timestamp?._seconds ? new Date(test.timestamp._seconds * 1000) : null);
                return ts ? formatDateWithOptions(ts, {
                  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
                }) : '--';
              })()}
            </div>
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {/* Quick stats / tags */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${Number(test.testsCount) > 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
              {Number(test.testsCount) > 1 ? `Distance ${test.groupIndex || 1}/${test.testsCount}` : 'Single'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              {formatDistance(distanceAtTestFromDoc(test)) || `${Math.round(distanceAtTestFromDoc(test) || 0)} m`}
            </span>
            {test.temperature !== '' && test.temperature != null && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700">
                {Math.round(Number(test.temperature))}°C
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700">
              Source: {(test.snowCondition?.source || 'unknown')}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700">
              Snow: {(test.snowCondition?.grainType || 'unknown')}
            </span>
            {test.testQuality != null && test.testQuality !== '' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700">
                Quality: {test.testQuality}/10
              </span>
            )}
            {test.runsPerTest != null && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700">
                Runs: {test.runsPerTest}
              </span>
            )}
            {test.glidesPerRun != null && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700">
                Glides/run: {test.glidesPerRun}
              </span>
            )}
          </div>

          {/* Edit form */}
          {isEditing && (
            <div className="rounded-2xl border border-gray-200 bg-white p-3 space-y-3">
              <div className="text-sm font-semibold text-gray-900">Edit metadata</div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  type="number"
                  name="temperature"
                  placeholder="Temperature (°C)"
                  value={editForm.temperature}
                  onChange={(e) => setEditForm((p) => ({ ...p, temperature: e.target.value }))}
                />
                <Input
                  type="number"
                  name="distanceBeforeTest"
                  placeholder="Distance before test (m)"
                  value={editForm.distanceBeforeTest}
                  min={0}
                  onChange={(e) => setEditForm((p) => ({ ...p, distanceBeforeTest: e.target.value }))}
                />
                <Input
                  type="number"
                  name="distanceBetweenTests"
                  placeholder="Distance between tests (m)"
                  value={editForm.distanceBetweenTests}
                  min={1}
                  onChange={(e) => setEditForm((p) => ({ ...p, distanceBetweenTests: e.target.value }))}
                  disabled={Number(test.testsCount) <= 1}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  type="text"
                  name="location"
                  placeholder="Location"
                  value={editForm.location}
                  onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                />
                <Input
                  type="text"
                  name="comment"
                  placeholder="Comment"
                  value={editForm.comment}
                  onChange={(e) => setEditForm((p) => ({ ...p, comment: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  type="select"
                  name="source"
                  value={editForm.source}
                  onChange={(e) => setEditForm((p) => ({ ...p, source: e.target.value }))}
                  options={[
                    { label: '— Source —', value: '' },
                    { label: 'Natural', value: 'natural' },
                    { label: 'Artificial', value: 'artificial' },
                    { label: 'Mix', value: 'mix' },
                    { label: 'Unknown', value: 'unknown' },
                  ]}
                />
                <Input
                  type="select"
                  name="grainType"
                  value={editForm.grainType}
                  onChange={(e) => setEditForm((p) => ({ ...p, grainType: e.target.value }))}
                  options={[
                    { label: '— Snow type —', value: '' },
                    { label: 'Fresh', value: 'fresh' },
                    { label: 'Fine grained', value: 'fine_grained' },
                    { label: 'Coarse grained', value: 'coarse_grained' },
                    { label: 'Wet', value: 'wet' },
                    { label: 'Icy', value: 'icy' },
                    { label: 'Sugary', value: 'sugary' },
                    { label: 'Unknown', value: 'unknown' },
                  ]}
                />
              </div>
              <div className="text-xs text-gray-500">
                Distance before test defaults to {formatDistance(safeNumber(test.distanceBeforeTest, 0)) || `${Math.round(Number(test.distanceBeforeTest) || 0)} m`}.
              </div>
            </div>
          )}

          {/* Rankings */}
          <div className="rounded-2xl border border-gray-200 bg-white p-3">
            <div className="text-sm font-semibold text-gray-900">Rankings</div>
            {!rankings?.length ? (
              <div className="mt-2 text-sm text-gray-500">No rankings saved.</div>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-gray-600 font-medium pb-2 pr-2">#</th>
                      <th className="text-left text-gray-600 font-medium pb-2 pr-2">Product</th>
                      <th className="text-right text-gray-600 font-medium pb-2 pr-2">Rel</th>
                      <th className="text-right text-gray-600 font-medium pb-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((r, idx) => (
                      <tr key={`${r.label}-${idx}`} className="border-b border-gray-100">
                        <td className="text-sm text-gray-700 py-2 pr-2">{r.rank}</td>
                        <td className="text-sm text-gray-900 py-2 pr-2">{r.label}</td>
                        <td className="text-sm text-gray-700 py-2 pr-2 text-right">{r.rel.toFixed(1)} / 10</td>
                        <td className="text-sm text-gray-700 py-2 text-right">{r.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-3">
            <div className="text-sm font-semibold text-gray-900">Conditions</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="text-sm text-gray-700"><span className="text-gray-500">Location:</span> {test.location || '--'}</div>
              <div className="text-sm text-gray-700"><span className="text-gray-500">Comment:</span> {test.comment || '--'}</div>
              <div className="text-sm text-gray-700"><span className="text-gray-500">Humidity:</span> {test.humidity || '--'}</div>
              <div className="text-sm text-gray-700"><span className="text-gray-500">Snow temp:</span> {test.snowTemperature || '--'}</div>
              <div className="text-sm text-gray-700"><span className="text-gray-500">Air temp:</span> {test.temperature !== '' && test.temperature != null ? `${Math.round(Number(test.temperature))}°C` : '--'}</div>
              <div className="text-sm text-gray-700"><span className="text-gray-500">Style:</span> {test.style || '--'}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-3">
            <div className="text-sm font-semibold text-gray-900">Protocol</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="text-sm text-gray-700"><span className="text-gray-500">Distance before test:</span> {formatDistance(test.distanceBeforeTest) || `${Math.round(Number(test.distanceBeforeTest) || 0)} m`}</div>
              <div className="text-sm text-gray-700"><span className="text-gray-500">Distance between tests:</span> {test.distanceBetweenTests ? (formatDistance(test.distanceBetweenTests) || `${Math.round(Number(test.distanceBetweenTests))} m`) : '--'}</div>
              <div className="text-sm text-gray-700"><span className="text-gray-500">Tests count:</span> {test.testsCount || 1}</div>
              <div className="text-sm text-gray-700"><span className="text-gray-500">Group ID:</span> {test.groupId || '--'}</div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  disabled={saving}
                  onClick={onSave}
                >
                  Save changes
                </Button>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                >
                  Cancel edit
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (typeof onStartEdit === 'function') onStartEdit();
                  else setIsEditing(true);
                }}
              >
                Edit
              </Button>
            )}

            <Button
              variant="danger"
              className="w-full sm:w-auto"
              onClick={onDelete}
              disabled={saving}
            >
              Delete
            </Button>

            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={onClose}
              disabled={saving}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
