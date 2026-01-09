'use client';

import React, { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Spinner from '@/components/common/Spinner/Spinner';
import useTeamTestSkis from '@/hooks/useTeamTestSkis';
import useTeamProducts from '@/hooks/useTeamProducts';
import {
  addTeamTestSki,
  updateTeamTestSki,
  deleteTeamTestSki,
  addTeamProduct,
  updateTeamProduct,
  deleteTeamProduct,
} from '@/lib/firebase/teamFunctions';

function Section({ title, subtitle, children, right }) {
  return (
    <Card as="section" className="p-4 md:p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-base font-semibold text-gray-900">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-gray-600">{subtitle}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      {children}
    </Card>
  );
}

export default function TeamTestInventory({ teamId }) {
  const { testSkis, loading: loadingSkis, error: errorSkis } = useTeamTestSkis(teamId);
  const { products, loading: loadingProducts, error: errorProducts } = useTeamProducts(teamId);

  const [newSki, setNewSki] = useState({ serialNumber: '', grind: '' });
  const [newProduct, setNewProduct] = useState({ brand: '', name: '' });
  const [showInventory, setShowInventory] = useState(false);

  const [saving, setSaving] = useState(false);
  const [editingSkiId, setEditingSkiId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);

  const [editSki, setEditSki] = useState({ serialNumber: '', grind: '' });
  const [editProduct, setEditProduct] = useState({ brand: '', name: '' });

  const busy = saving || loadingSkis || loadingProducts;

  const skisById = useMemo(() => {
    const map = new Map();
    (testSkis || []).forEach((s) => map.set(s.id, s));
    return map;
  }, [testSkis]);

  const productsById = useMemo(() => {
    const map = new Map();
    (products || []).forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const startEditSki = (id) => {
    const s = skisById.get(id);
    if (!s) return;
    setEditingSkiId(id);
    setEditSki({ serialNumber: s.serialNumber || '', grind: s.grind || '' });
  };

  const startEditProduct = (id) => {
    const p = productsById.get(id);
    if (!p) return;
    setEditingProductId(id);
    setEditProduct({ brand: p.brand || '', name: p.name || '' });
  };

  const handleAddSki = async (e) => {
    e.preventDefault();
    if (!newSki.serialNumber.trim()) return alert('Serial number is required');
    setSaving(true);
    try {
      await addTeamTestSki(teamId, newSki);
      setNewSki({ serialNumber: '', grind: '' });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to add team test ski');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSki = async () => {
    if (!editingSkiId) return;
    if (!editSki.serialNumber.trim()) return alert('Serial number is required');
    setSaving(true);
    try {
      await updateTeamTestSki(teamId, editingSkiId, editSki);
      setEditingSkiId(null);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update team test ski');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSki = async (id) => {
    if (!confirm('Remove this team test ski?')) return;
    setSaving(true);
    try {
      await deleteTeamTestSki(teamId, id);
      if (editingSkiId === id) setEditingSkiId(null);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete team test ski');
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.brand.trim() || !newProduct.name.trim()) return alert('Brand + name are required');
    setSaving(true);
    try {
      await addTeamProduct(teamId, newProduct);
      setNewProduct({ brand: '', name: '' });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to add product');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProductId) return;
    if (!editProduct.brand.trim() || !editProduct.name.trim()) return alert('Brand + name are required');
    setSaving(true);
    try {
      await updateTeamProduct(teamId, editingProductId, editProduct);
      setEditingProductId(null);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Remove this product?')) return;
    setSaving(true);
    try {
      await deleteTeamProduct(teamId, id);
      if (editingProductId === id) setEditingProductId(null);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-base font-semibold text-gray-900">Team test inventory</div>
          <div className="mt-1 text-sm text-gray-600">Hide or show team test skis and products.</div>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <span className="text-sm text-gray-600">{showInventory ? 'Hide' : 'Show'}</span>
          <Toggle enabled={showInventory} setEnabled={setShowInventory} label="Toggle inventory visibility" />
        </div>
      </div>

      {showInventory ? (
        <div className="space-y-6">
          <Section
            title="Team test skis"
            subtitle="These are the skis your team can use for product tests (serial number required; grind optional)."
          >
            {(loadingSkis || loadingProducts) && (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            )}
            {errorSkis ? (
              <div className="text-sm text-red-600">Failed to load team test skis</div>
            ) : null}

            <form onSubmit={handleAddSki} className="grid gap-2 md:grid-cols-3 md:items-end">
                <Input
                  type="text"
                  name="serialNumber"
                  placeholder="Serial number"
                  value={newSki.serialNumber}
                  onChange={(e) => setNewSki((p) => ({ ...p, serialNumber: e.target.value }))}
                  required
                  disabled={saving}
                />
                <Input
                  type="text"
                  name="grind"
                  placeholder="Grind (optional)"
                  value={newSki.grind}
                  onChange={(e) => setNewSki((p) => ({ ...p, grind: e.target.value }))}
                  disabled={saving}
                />
                <Button type="submit" variant="primary" disabled={saving}>
                  Add ski
                </Button>
              </form>
            

            <div className="mt-4 space-y-2">
              {(testSkis || []).length === 0 ? (
                <div className="text-sm text-gray-600">No team test skis yet.</div>
              ) : (
                (testSkis || []).map((s) => (
                  <div key={s.id} className="flex flex-col md:flex-row md:items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3">
                    {editingSkiId === s.id ? (
                      <>
                        <div className="flex-1 grid gap-2 md:grid-cols-2">
                          <Input
                            type="text"
                            name="editSerial"
                            placeholder="Serial number"
                            value={editSki.serialNumber}
                            onChange={(e) => setEditSki((p) => ({ ...p, serialNumber: e.target.value }))}
                            required
                            disabled={saving}
                          />
                          <Input
                            type="text"
                            name="editGrind"
                            placeholder="Grind (optional)"
                            value={editSki.grind}
                            onChange={(e) => setEditSki((p) => ({ ...p, grind: e.target.value }))}
                            disabled={saving}
                          />
                        </div>
                        <div className="flex gap-2 md:justify-end">
                          <Button type="button" variant="secondary" onClick={() => setEditingSkiId(null)} disabled={saving}>
                            Cancel
                          </Button>
                          <Button type="button" variant="primary" onClick={handleSaveSki} disabled={saving}>
                            Save
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">{s.serialNumber || '—'}</div>
                          <div className="text-xs text-gray-600">{s.grind ? `Grind: ${s.grind}` : 'Grind: —'}</div>
                        </div>
                        <div className="flex gap-2 md:justify-end">
                          <Button type="button" variant="secondary" onClick={() => startEditSki(s.id)} disabled={busy}>
                            Edit
                          </Button>
                          <Button type="button" variant="danger" onClick={() => handleDeleteSki(s.id)} disabled={busy}>
                            Remove
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </Section>

          <Section
            title="Products"
            subtitle="Products are tested on the team test skis and stored at the event (not in user accounts)."
          >
            {errorProducts ? (
              <div className="text-sm text-red-600">Failed to load products</div>
            ) : null}

            <form onSubmit={handleAddProduct} className="grid gap-2 md:grid-cols-3 md:items-end">
                <Input
                  type="text"
                  name="brand"
                  placeholder="Brand"
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct((p) => ({ ...p, brand: e.target.value }))}
                  required
                  disabled={saving}
                />
                <Input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                  required
                  disabled={saving}
                />
                <Button type="submit" variant="primary" disabled={saving}>
                  Add product
                </Button>
              </form>
            

            <div className="mt-4 space-y-2">
              {(products || []).length === 0 ? (
                <div className="text-sm text-gray-600">No products yet.</div>
              ) : (
                (products || []).map((p) => (
                  <div key={p.id} className="flex flex-col md:flex-row md:items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3">
                    {editingProductId === p.id ? (
                      <>
                        <div className="flex-1 grid gap-2 md:grid-cols-2">
                          <Input
                            type="text"
                            name="editBrand"
                            placeholder="Brand"
                            value={editProduct.brand}
                            onChange={(e) => setEditProduct((x) => ({ ...x, brand: e.target.value }))}
                            required
                            disabled={saving}
                          />
                          <Input
                            type="text"
                            name="editName"
                            placeholder="Name"
                            value={editProduct.name}
                            onChange={(e) => setEditProduct((x) => ({ ...x, name: e.target.value }))}
                            required
                            disabled={saving}
                          />
                        </div>
                        <div className="flex gap-2 md:justify-end">
                          <Button type="button" variant="secondary" onClick={() => setEditingProductId(null)} disabled={saving}>
                            Cancel
                          </Button>
                          <Button type="button" variant="primary" onClick={handleSaveProduct} disabled={saving}>
                            Save
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">{p.brand || '—'} • {p.name || '—'}</div>
                        </div>
                        <div className="flex gap-2 md:justify-end">
                          <Button type="button" variant="secondary" onClick={() => startEditProduct(p.id)} disabled={busy}>
                            Edit
                          </Button>
                          <Button type="button" variant="danger" onClick={() => handleDeleteProduct(p.id)} disabled={busy}>
                            Remove
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </Section>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">Inventory is hidden. Toggle to show skis and products.</div>
      )}
    </div>
  );
}
