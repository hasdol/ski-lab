import React, { useMemo, useState, useEffect } from 'react';
import { RiUser3Line, RiCheckLine, RiCloseLine, RiSearchLine } from 'react-icons/ri';
import { AnimatePresence, motion } from 'framer-motion';

export default function UserPicker({
  isOpen,
  onClose,
  self,              // { id, displayName }
  owners = [],       // [{ id, displayName }]
  currentId,         // null => self
  onSelect,          // (idOrNull) => void
}) {
  const [q, setQ] = useState('');
  useEffect(() => { if (isOpen) setQ(''); }, [isOpen]);

  const filteredOwners = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return owners;
    // match only on displayName
    return owners.filter(o =>
      (o.displayName || '').toLowerCase().includes(term)
    );
  }, [q, owners]);

  if (!isOpen) return null;

  const select = (val) => {
    onSelect(val);
    onClose();
  };

  const isSelected = (idOrNull) => (idOrNull ?? '') === (currentId ?? '');

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay fade */}
            <motion.div
              className="fixed inset-0 bg-black/30 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Panel pop/slide */}
            <motion.div
              className="fixed z-50 top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg"
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiUser3Line className="text-blue-600" />
                  <span className="font-semibold">Select user</span>
                </div>
                <button
                  className="p-2 rounded hover:bg-gray-100"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <RiCloseLine size={20} />
                </button>
              </div>

              {/* Search */}
              <div className="px-4 pb-2">
                <div className="relative">
                  <RiSearchLine className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search users"
                  />
                </div>
              </div>

              {/* List */}
              <div className="max-h-[60vh] overflow-y-auto pb-4">
                <div className="px-4 py-2 text-xs uppercase text-gray-500">Me</div>
                <button
                  className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 ${isSelected(null) ? 'bg-blue-50' : ''}`}
                  onClick={() => select(null)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                      {(self?.displayName || 'Me').slice(0,1).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{self?.displayName || 'Me'}</div>
                      {/* removed raw UID */}
                    </div>
                  </div>
                  {isSelected(null) && <RiCheckLine className="text-blue-600" />}
                </button>

                <div className="px-4 pt-4 pb-2 text-xs uppercase text-gray-500">People you can read</div>
                {filteredOwners.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">No users</div>
                ) : filteredOwners.map(o => (
                  <button
                    key={o.id}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 ${isSelected(o.id) ? 'bg-blue-50' : ''}`}
                    onClick={() => select(o.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-semibold">
                        {(o.displayName || 'U').slice(0,1).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium">{o.displayName || 'User'}</div>
                        {/* removed raw UID */}
                      </div>
                    </div>
                    {isSelected(o.id) && <RiCheckLine className="text-blue-600" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}