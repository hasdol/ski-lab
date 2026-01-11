'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { RiCloseLine } from 'react-icons/ri';
import useTeamTestSkis from '@/hooks/useTeamTestSkis';
import useTeamProducts from '@/hooks/useTeamProducts';

function clampInt(n, { min, max }) {
  const x = Math.floor(Number(n) || 0);
  return Math.min(max, Math.max(min, x));
}

export default function ProductTestSetupModal({ isOpen, onClose, teamId, onStart }) {
  const { testSkis, loading: loadingSkis } = useTeamTestSkis(teamId);
  const { products, loading: loadingProducts } = useTeamProducts(teamId);

  const [testsCount, setTestsCount] = useState(1);
  const [distanceBetweenTests, setDistanceBetweenTests] = useState('');
  const [distanceBeforeTest, setDistanceBeforeTest] = useState('0');
  const [runsPerTest, setRunsPerTest] = useState(1);
  const [glidesPerRun, setGlidesPerRun] = useState(2);

  const [selectedSkiIds, setSelectedSkiIds] = useState([]);
  const [productBySkiId, setProductBySkiId] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setTestsCount(1);
    setDistanceBetweenTests('');
    setDistanceBeforeTest('0');
    setRunsPerTest(1);
    setGlidesPerRun(2);
    setSelectedSkiIds([]);
    setProductBySkiId({});
  }, [isOpen]);

  const productOptions = useMemo(
    () =>
      (products || []).map((p) => ({
        label: `${p.brand || ''} • ${p.name || ''}`.trim(),
        value: p.id,
      })),
    [products]
  );

  const skiOptions = useMemo(
    () =>
      (testSkis || []).map((s) => ({
        label: s.serialNumber || s.id,
        value: s.id,
      })),
    [testSkis]
  );

  const canStart = useMemo(() => {
    if (selectedSkiIds.length < 2) return false;
    for (const id of selectedSkiIds) {
      if (!productBySkiId[id]) return false;
    }
    const t = clampInt(testsCount, { min: 1, max: 20 });
    if (t > 1 && !(Number(distanceBetweenTests) > 0)) return false;
    if (!(Number(distanceBeforeTest) >= 0)) return false;
    return true;
  }, [selectedSkiIds, productBySkiId, testsCount, distanceBetweenTests, distanceBeforeTest]);

  const handleToggleSki = (skiId) => {
    setSelectedSkiIds((prev) =>
      prev.includes(skiId) ? prev.filter((id) => id !== skiId) : [...prev, skiId]
    );
  };

  const handleStart = () => {
    const t = clampInt(testsCount, { min: 1, max: 20 });
    const runs = clampInt(runsPerTest, { min: 1, max: 50 });
    const glides = clampInt(glidesPerRun, { min: 1, max: 10 });
    const dist = t > 1 ? Number(distanceBetweenTests) : null;
    const distBefore = Number(distanceBeforeTest);

    const selected = (testSkis || []).filter((s) => selectedSkiIds.includes(s.id));
    const productMap = new Map((products || []).map((p) => [p.id, p]));

    const assignments = selected.map((s) => {
      const productId = productBySkiId[s.id];
      const p = productMap.get(productId);
      return {
        teamSkiId: s.id,
        serialNumber: s.serialNumber || '',
        grind: s.grind || '',
        productId,
        productBrand: p?.brand || '',
        productName: p?.name || '',
      };
    });

    onStart({
      testsCount: t,
      distanceBetweenTests: dist,
      distanceBeforeTest: Number.isFinite(distBefore) ? distBefore : 0,
      runsPerTest: runs,
      glidesPerRun: glides,
      assignments,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-md overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-3 md:p-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Start product test</h2>
                <div className="text-sm text-gray-600">Set up the test before you begin.</div>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
                <RiCloseLine size={24} />
              </button>
            </div>

            <div className="p-3 md:p-4 space-y-5 overflow-y-auto">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  type="number"
                  name="testsCount"
                  placeholder="How many tests"
                  value={testsCount}
                  onChange={(e) => setTestsCount(e.target.value)}
                  min={1}
                />

                <Input
                  type="number"
                  name="distanceBetweenTests"
                  placeholder="Distance between tests (m)"
                  value={distanceBetweenTests}
                  onChange={(e) => setDistanceBetweenTests(e.target.value)}
                  disabled={Number(testsCount) <= 1}
                  min={1}
                />

                <Input
                  type="number"
                  name="distanceBeforeTest"
                  placeholder="Distance before test (m)"
                  value={distanceBeforeTest}
                  onChange={(e) => setDistanceBeforeTest(e.target.value)}
                  min={0}
                />

                <Input
                  type="number"
                  name="runsPerTest"
                  placeholder="Runs per test"
                  value={runsPerTest}
                  onChange={(e) => setRunsPerTest(e.target.value)}
                  min={1}
                />

                <Input
                  type="number"
                  name="glidesPerRun"
                  placeholder="Glides per run"
                  value={glidesPerRun}
                  onChange={(e) => setGlidesPerRun(e.target.value)}
                  min={1}
                />

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                  <div className="font-semibold text-gray-800">How to interpret “glides”</div>
                  <div className="mt-1">
                    Example: 2 glides = glide once, swap skis/products, glide again.
                  </div>
                  <div className="mt-2">
                    <span className="font-semibold text-gray-800">Distance before test</span>: meters skied before the first test. Useful if skis/products have already worn in.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-3">
                <div className="text-sm font-semibold text-gray-900">Pick team test skis</div>
                <div className="text-xs text-gray-600">Select at least 2 skis, then assign a product to each.</div>

                {(loadingSkis || loadingProducts) && (
                  <div className="py-3 text-sm text-gray-600">Loading…</div>
                )}

                {(!testSkis || testSkis.length === 0) && (
                  <div className="py-3 text-sm text-gray-600">No team test skis yet. Add them in Team Inventory.</div>
                )}
                {(!products || products.length === 0) && (
                  <div className="py-3 text-sm text-gray-600">No products yet. Add them in Team Inventory.</div>
                )}

                <div className="mt-3 space-y-2">
                  {(testSkis || []).map((s) => {
                    const checked = selectedSkiIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={checked}
                        onClick={() => handleToggleSki(s.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggleSki(s.id);
                          }
                        }}
                        className={`rounded-2xl border p-3 cursor-pointer ${checked ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-white'}`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleSki(s.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                            aria-label={`Select ${s.serialNumber || 'ski'}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900">{s.serialNumber || '—'}</div>
                            <div className="text-xs text-gray-600">{s.grind ? `Grind: ${s.grind}` : 'Grind: —'}</div>
                          </div>
                        </div>

                        {checked && (
                          <div className="mt-3">
                            <Input
                              type="select"
                              name={`product-${s.id}`}
                              value={productBySkiId[s.id] || ''}
                              onChange={(e) =>
                                setProductBySkiId((prev) => ({ ...prev, [s.id]: e.target.value }))
                              }
                              onClick={(e) => e.stopPropagation()}
                              options={productOptions}
                              placeholder="Assign product"
                              required
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleStart} disabled={!canStart}>
                  Start
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
