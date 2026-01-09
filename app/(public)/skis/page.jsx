'use client';

/* -------------------------------------------------------------------------- */
/*  Skis list page – prefix-searchable, paginated (32 per page), sortable.     */
/*  Now preserves selected skis in the view even if they don't match filters.  */
/*  Displays matching items first, then selected extras sorted by the same field. */
/* -------------------------------------------------------------------------- */

import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { AnimatePresence, motion } from 'framer-motion';
import { RiInformationLine } from 'react-icons/ri';

import usePaginatedSkis from '@/hooks/usePaginatedSkis';
import { useSkis } from '@/hooks/useSkis';
import SkiItem from './components/SkiItem';
import SkiTable from './components/SkiTable';
import SkiFilter from './components/SkiFilter';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import { TournamentContext } from '@/context/TournamentContext';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/common/Spinner/Spinner';
import Button from '@/components/ui/Button';
import {
  RiFilter2Line,
  RiFilter2Fill,
  RiAddLine,
  RiLockLine,
  RiCloseLine,
} from 'react-icons/ri';
import { TiFlowParallel } from "react-icons/ti";
import { VscDebugContinue } from "react-icons/vsc";
import Search from '../../../components/Search/Search';
import { PLAN_LIMITS } from '@/lib/constants/planLimits';
import useIsStandalone from '@/hooks/useIsStandalone';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import SignInRequiredCard from '@/components/common/SignInRequiredCard';
import EmptyStateCard from '@/components/common/EmptyStateCard';
import { listAccessibleUsers, subscribeSharesAsReader } from '@/lib/firebase/shareFunctions';
import UserPicker from '@/components/UserPicker/UserPicker';
import { RiUser3Line } from 'react-icons/ri';

const VIEW_USER_STORAGE_KEY = 'viewUserId';

const makeSkiKey = (ownerUid, skiId) => `${ownerUid}:${skiId}`;

const Skis = () => {
  const isStandalone = useIsStandalone();
  const router = useRouter();
  const { gloveMode } = useContext(UserPreferencesContext);
  const { user, userData } = useAuth();

  // FIX: pull state from TournamentContext (used in selection bar and start test)
  const {
    selectedSkis: tournamentSelectedSkis,
    currentRound,
    roundNumber,
    setSelectedSkis,
    resetTournament,
  } = useContext(TournamentContext);
  // NEW: user filter
  const [accessibleUsers, setAccessibleUsers] = useState({ self: null, owners: [] });
  const [viewUserId, setViewUserId] = useState(null); // null => self
  const [isPickerOpen, setIsPickerOpen] = useState(false); // NEW

  const handleUserSelect = (idOrNull) => {        // <── ADD THIS
    const val = idOrNull || null;
    setViewUserId(val);
    if (typeof window !== 'undefined') {
      if (val) localStorage.setItem(VIEW_USER_STORAGE_KEY, val);
      else localStorage.removeItem(VIEW_USER_STORAGE_KEY);
    }
  };
  // Clear ONLY expanded details when switching user (keep multi-user selection)
  useEffect(() => {
    setExpandedSkiId(null);
  }, [viewUserId]);

  // --- local search
  const [searchRaw, setSearchRaw] = useState('');
  const [debouncedTerm] = useDebounce(searchRaw.toLowerCase(), 300);

  // --- filters & sort
  const [styleFilter, setStyleFilter] = useState('all');
  const [skiTypeFilter, setSkiTypeFilter] = useState('all');
  const [archivedFilter, setArchivedFilter] = useState('notArchived');
  const [sortField, setSortField] = useState('serialNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState('card');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStyleFilter(localStorage.getItem('styleFilter') || 'all');
      setSkiTypeFilter(localStorage.getItem('skiTypeFilter') || 'all');
      setArchivedFilter(localStorage.getItem('archivedFilter') || 'notArchived');
      setSortField(localStorage.getItem('sortField') || 'serialNumber');
      setSortDirection(localStorage.getItem('sortDirection') || 'asc');
      setViewMode(localStorage.getItem('viewMode') || 'card');
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const acc = await listAccessibleUsers();
        setAccessibleUsers(acc);
      } catch {}
    })();
  }, [user]);

  // Hydrate viewUserId from localStorage when accessible users are known
  useEffect(() => {                                  // <── ADD THIS EFFECT
    if (!user) {
      setViewUserId(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(VIEW_USER_STORAGE_KEY);
      }
      return;
    }
    if (typeof window === 'undefined') return;

    // Wait until listAccessibleUsers has populated something
    if (!accessibleUsers.self && (!accessibleUsers.owners || accessibleUsers.owners.length === 0)) {
      return;
    }

    const stored = localStorage.getItem(VIEW_USER_STORAGE_KEY);
    if (!stored) {
      setViewUserId(null);
      return;
    }

    const allowedIds = (accessibleUsers.owners || []).map(o => o.id);
    if (allowedIds.includes(stored)) {
      setViewUserId(stored);
    } else {
      setViewUserId(null);
      localStorage.removeItem(VIEW_USER_STORAGE_KEY);
    }
  }, [user, accessibleUsers]);

  useEffect(() => {
    if (!user) { setViewUserId(null); return; }
    const unsub = subscribeSharesAsReader(user.uid, () => {
      // Keep accessible user list in sync when shares change.
      (async () => {
        try {
          const acc = await listAccessibleUsers();
          setAccessibleUsers(acc);
        } catch {}
      })();
    });
    return () => unsub();
  }, [user]);

  // --- data fetching
  const {
    docs: skis,
    loading,
    error,
    exhausted,
    refresh,
    loadMore,
  } = usePaginatedSkis({
    term: debouncedTerm,
    style: styleFilter,
    skiType: skiTypeFilter,
    archived: archivedFilter,
    sortField,
    sortDirection,
    ownerUserId: viewUserId || undefined, // FILTER APPLIED HERE
  });

  // --- mutations
  const { deleteSki, updateSki, lockedSkisCount } = useSkis();

  const isRemoteView = !!viewUserId;
  const ownerUidForView = viewUserId || user?.uid || null;

  const remoteAccessLevel = useMemo(() => {
    if (!viewUserId) return 'write'; // self
    return accessibleUsers.owners.find(o => o.id === viewUserId)?.accessLevel || 'read';
  }, [accessibleUsers.owners, viewUserId]);

  const canSelectForTest = !isRemoteView || remoteAccessLevel === 'write';

  const tournamentInProgress =
    (tournamentSelectedSkis?.length ?? 0) > 0 || (currentRound?.length ?? 0) > 0;

  // Attach owner + stable composite key to every ski in the currently viewed list
  const skisForView = useMemo(() => {
    if (!ownerUidForView) return skis;
    return (skis || []).map(s => ({
      ...s,
      ownerUid: s.ownerUid || ownerUidForView,
      _key: s._key || makeSkiKey(ownerUidForView, s.id),
    }));
  }, [skis, ownerUidForView]);

  // --- selection + persistence
  const [selectedMap, setSelectedMap] = useState({});
  const [selectedSkisDataMap, setSelectedSkisDataMap] = useState(() => new Map());

  const toggleSelect = (selectionKey) => {
    // Allow selecting own skis; allow selecting others only with write access
    if (isRemoteView && !canSelectForTest) return;

    setSelectedMap(prev => {
      const nowSelected = !prev[selectionKey];
      const newMap = { ...prev, [selectionKey]: nowSelected };

      setSelectedSkisDataMap(prevMap => {
        const m = new Map(prevMap);

        if (nowSelected) {
          const skiObj = skisForView.find(s => (s._key ?? s.id) === selectionKey);
          if (skiObj) {
            // Persist ownerUid so later saving can write into correct user collections
            m.set(selectionKey, {
              ...skiObj,
              ownerUid: skiObj.ownerUid || ownerUidForView,
              _key: skiObj._key || selectionKey,
            });
          }
        } else {
          m.delete(selectionKey);
        }
        return m;
      });

      return newMap;
    });
  };

  const getSelectedList = () =>
    Array.from(selectedSkisDataMap.values()).filter(s => s && s.locked !== true);

  // --- detail toggle
  const [expandedSkiId, setExpandedSkiId] = useState(null);
  // selectionKey-aware now (supports multi-owner displayed extras)
  const toggleDetails = (selectionKey) => {
    setExpandedSkiId(prev => (prev === selectionKey ? null : selectionKey));
  };

  // --- build displayedSkis: matching items first, then selected extras
  const displayedSkis = useMemo(() => {
    const matched = skisForView || [];
    const matchedKeys = new Set(matched.map(s => s._key ?? makeSkiKey(ownerUidForView, s.id)));

    const extras = Array.from(selectedSkisDataMap.values())
      .filter(s => s && !matchedKeys.has(s._key) && s.locked !== true);

    if (extras.length) {
      const compare = (a, b) => {
        const aVal = a[sortField] ?? '';
        const bVal = b[sortField] ?? '';
        const cmp =
          typeof aVal === 'number' && typeof bVal === 'number'
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDirection === 'asc' ? cmp : -cmp;
      };
      extras.sort(compare);
    }
    return [...matched, ...extras];
  }, [skisForView, selectedSkisDataMap, sortField, sortDirection, ownerUidForView]);

  // ensure we know how many skis are selected so we can add bottom padding
  const selectionCount = getSelectedList().length;

  // --- persist filter/view into localStorage
  useEffect(() => { localStorage.setItem('viewMode', viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem('styleFilter', styleFilter); }, [styleFilter]);
  useEffect(() => { localStorage.setItem('skiTypeFilter', skiTypeFilter); }, [skiTypeFilter]);
  useEffect(() => { localStorage.setItem('archivedFilter', archivedFilter); }, [archivedFilter]);

  // --- delete/archive
  const mutate = async (fn) => { await fn(); await refresh(); };
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this ski?') && confirm('Are you really sure? You can not undo this')) {
      await mutate(() => deleteSki(id));
      // Clear selection for both plain ids and composite keys like "ownerUid:skiId".
      setSelectedMap(prev => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (k === id || k.endsWith(`:${id}`)) delete next[k];
        });
        return next;
      });
      setSelectedSkisDataMap(prev => {
        const next = new Map(prev);
        Array.from(next.keys()).forEach((k) => {
          if (k === id || String(k).endsWith(`:${id}`)) next.delete(k);
        });
        return next;
      });
    }
  };
  const handleArchive = async (id) => {
    if (confirm('This will filter the ski from you active list. You can get them back using the filter')) await mutate(() => updateSki(id, { archived: true }));
  };
  const handleUnarchive = (id) => mutate(() => updateSki(id, { archived: false }));

  // --- plan limits
  const skiCount = userData?.skiCount || 0;
  const plan = userData?.plan || 'free';
  const skiLimit = PLAN_LIMITS[plan] ?? PLAN_LIMITS['free'];
  const hasReachedLimit = skiCount >= skiLimit;
  const hasLockedSkis = lockedSkisCount > 0;

  // --- handlers
  const toggleFilterDrawer = () => setIsFilterOpen(o => !o);
  const resetFilter = () => {
    setStyleFilter('all');
    setSkiTypeFilter('all');
    setArchivedFilter('notArchived');
  };
  const handleAddSki = () => {
    if (hasReachedLimit) {
      return alert(plan === 'company'
        ? 'Max skis reached for your plan.'
        : 'Upgrade your account to add more skis'
      );
    }
    router.push('/skis/create');
  };
  const handleStartTournament = () => {
    const list = getSelectedList();
    if (list.length < 2) return alert('Select at least two skis');
    if (tournamentInProgress && !confirm('Start a new test and overwrite the existing one?')) return;
    resetTournament();
    setSelectedSkis(list);
    router.push('/testing');
  };
  const handleContinueTest = () => router.push('/testing');
  const handleResetTest = () => {
    if (!tournamentInProgress) return;
    if (!confirm('Reset the ongoing test? This will clear current test progress.')) return;
    resetTournament();
  };

  const handleClearSelection = () => {
    setSelectedMap({});
    setSelectedSkisDataMap(new Map());
    setExpandedSkiId(null);
  };

  // --- header actions
  const headerActions = (
    <div className="flex flex-col md:flex-row gap-5 items-center">

      {!!user && (
        <>
          <button
            className=" inline-flex items-center gap-2 bg-blue-50 text-blue-500 border rounded-xl px-2 py-1 text-sm "
            onClick={() => setIsPickerOpen(true)}
            aria-label="Pick user"
            title="Pick user"
          >
            <RiUser3Line />
            <span className="max-w-35 truncate">
              {viewUserId
                ? (accessibleUsers.owners.find(o => o.id === viewUserId)?.displayName || 'User')
                : (accessibleUsers.self?.displayName || 'Me')}
            </span>
          </button>
        </>
      )}

      {/* existing actions */}
    <div className="flex gap-3 items-center">

      {!hasReachedLimit && (
        <Button
          onClick={handleAddSki}
          variant='primary'
          disabled={hasReachedLimit || !!viewUserId} // disable adding when viewing others
          className="flex items-center gap-2"
        >
          <RiAddLine />
          <span>Add Ski</span>
        </Button>
      )}
      <Button
        onClick={() => setShowInfo(prev => !prev)}
        variant="secondary"
        className="flex items-center gap-2"
        aria-label={showInfo ? 'Hide information' : 'Show information'}
        aria-expanded={showInfo}
      >
        <RiInformationLine size={18} />
        {showInfo ? 'Hide Info' : 'Show Info'}
      </Button>
      </div>
    </div>
  );

  // Compute displayed list
  // const baseSkis = activeUserId && user && activeUserId !== user.uid ? remoteSkis : skis; // REMOVE
  // const baseLoading = activeUserId && user && activeUserId !== user.uid ? remoteLoading : loading; // REMOVE

  if (error) return <div className="m-2">Error: {error.message}</div>;

  return (
    <div className={`p-4 max-w-4xl w-full self-center ${selectionCount > 0 ? 'pb-10 md:pb-20' : ''}`}>

      {/* Header */}
      <PageHeader
        icon={<TiFlowParallel className="text-blue-600 text-2xl" />}
        title="Skis"
        subtitle={
          <>
            <span>
              <span className="font-semibold text-gray-700">{skiCount}</span> / {skiLimit} skis
              <span className="ml-2">({plan.charAt(0).toUpperCase() + plan.slice(1)} plan)</span>
            </span>
          </>
        }
        actions={headerActions}
      />

      {!!user && tournamentInProgress && (
        <Card padded={false} className="p-3 mb-4">
          <div className="flex flex-row items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-700 mb-1">Ongoing test</div>
              <div className="text-xs text-gray-600">
                {tournamentSelectedSkis?.length ? (
                  <>
                    {tournamentSelectedSkis.length} ski{tournamentSelectedSkis.length > 1 ? 's' : ''} • Round {roundNumber || 1}
                  </>
                ) : (
                  <>Test in progress</>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button onClick={handleContinueTest} variant="secondary" className='text-sm'>Continue</Button>
              <Button onClick={handleResetTest} variant="danger" className='text-sm'>Reset</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Info Box */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <RiInformationLine className="text-blue-500 mt-0.5 shrink-0" />
                <div className="text-blue-800">
                  <h3 className="block font-semibold mb-4">How the Skis page works:</h3>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Search, filter, and sort your skis by style, type, or status.</li>
                    <li>Selected skis stay visible even if they don’t match current filters.</li>
                    <li>Start a new test by selecting at least two skis and clicking "New Test".</li>
                    <li>Use the filter for advanced sorting and viewing options.</li>
                    <li>Upgrade your plan to add more skis or unlock locked skis.</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="mb-4">
        <Search onSearch={setSearchRaw} />
      </div>

      {/* Style tabs + Filter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          {['all', 'classic', 'skate', 'dp'].map((style) => {
            const tabColors = {
              all: 'bg-gray-100 text-gray-700  border-gray-300',
              classic: 'bg-emerald-50 text-emerald-700 border-emerald-300',
              skate: 'bg-blue-50 text-blue-700 border-blue-300',
              dp: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-300'
            };
            const active = styleFilter === style;
            return (
              <button
                key={style}
                onClick={() => setStyleFilter(style)}
                className={`px-4 py-2 font-medium text-sm capitalize rounded-2xl border transition
                  ${active ? `${tabColors[style]} ` : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}
                `}
              >
                {style}
              </button>
            );
          })}
        </div>
        <Button
          onClick={toggleFilterDrawer}
          variant="secondary"
          className={`ml-2 ${styleFilter !== 'all' || skiTypeFilter !== 'all' || archivedFilter !== 'notArchived' ? 'text-gray-800' : ''}`}
        >
          {styleFilter !== 'all' || skiTypeFilter !== 'all' || archivedFilter !== 'notArchived'
            ? <RiFilter2Fill />
            : <RiFilter2Line />}
        </Button>
      </div>

      {/* Active filter chips */}
      {(skiTypeFilter !== 'all' || archivedFilter !== 'notArchived') && (
        <div className="flex space-x-2 text-sm mb-4">
          {skiTypeFilter !== 'all' && (
            <Button variant="tab" onClick={() => setSkiTypeFilter('all')}><span className="flex">{skiTypeFilter} <RiCloseLine /></span></Button>
          )}
          {archivedFilter !== 'notArchived' && (
            <Button variant="tab" onClick={() => setArchivedFilter('notArchived')}><span className="flex">{archivedFilter} <RiCloseLine /></span></Button>
          )}
        </div>
      )}

      {/* Selection controls — previously only for own skis */}
      {canSelectForTest && getSelectedList().length > 0 && (
        <div className={`fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg z-50 flex items-center justify-between px-4 py-3 ${isStandalone ? 'pb-8' : ''}`}>
          <div className="text-sm font-semibold">
            {getSelectedList().length} ski{getSelectedList().length > 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <Button onClick={handleClearSelection} variant="secondary">Clear</Button>
            <Button
              onClick={handleStartTournament}
              variant="primary"
              disabled={getSelectedList().length < 2}
            >
              New Test
            </Button>
          </div>
        </div>
      )}

      {/* Locked skis or plan upgrade prompt */}
      {hasLockedSkis ? (
        <div className="flex my-4 space-x-4">
          <Card
            padded={false}
            className="w-full flex space-x-5 border border-dashed border-gray-300 p-4 rounded-lg items-center justify-center bg-white ring-0 shadow-none backdrop-blur-0"
          >
            <div className="space-y-1">
              <h3 className="text-sm flex items-center"><RiLockLine /> {lockedSkisCount} locked ski(s)</h3>
              <Button onClick={() => router.push('/skis/locked')} variant="secondary">View skis</Button>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm">Upgrade to unlock</h3>
              <Button variant="primary" onClick={() => router.push('/pricing')}>Upgrade</Button>
            </div>
          </Card>
        </div>
      ) : hasReachedLimit && plan !== 'company' ? (
        <div className="flex my-4">
          <Card
            padded={false}
            className="w-full flex space-x-5 border border-dashed border-gray-300 p-4 rounded-lg items-center justify-center bg-white ring-0 shadow-none backdrop-blur-0"
          >
            <h3 className="text-sm">You’ve reached your limit. Upgrade to add more skis.</h3>
            <Button variant="primary" onClick={() => router.push('/pricing')}>Upgrade</Button>
          </Card>
        </div>
      ) : null}


      {/* Filter drawer */}
      <SkiFilter
        open={isFilterOpen}
        onClose={toggleFilterDrawer}
        styleFilter={styleFilter}
        setStyleFilter={setStyleFilter}
        skiTypeFilter={skiTypeFilter}
        setSkiTypeFilter={setSkiTypeFilter}
        archivedFilter={archivedFilter}
        setArchivedFilter={setArchivedFilter}
        resetFilter={resetFilter}
        sortField={sortField}
        setSortField={setSortField}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Ski list (cards or table) */}
      <div className="mb-5">
        {loading && !skisForView.length ? (
          <div className="flex justify-center items-center mt-10"><Spinner /></div>
        ) : viewMode === 'card' ? (
          <AnimatePresence>
            <div className={gloveMode ? 'flex flex-col space-y-3' : 'flex flex-col space-y-2'}>
              {Object.entries(groupSkisByStyle(displayedSkis)).map(([style, skis]) =>
                skis.length > 0 && (
                  <React.Fragment key={style}>
                    <div className={`my-2 flex items-center gap-2 px-2 py-1 rounded font-semibold 
                      ${style === 'classic' ? 'text-emerald-700' : ''}
                      ${style === 'skate' ? 'text-blue-700' : ''}
                      ${style === 'dp' ? 'text-fuchsia-700' : ''}
                    `}>
                      <span className="capitalize">{style}</span>
                      <span className="text-xs text-gray-400 font-normal">{skis.length} ski{skis.length > 1 ? 's' : ''}</span>
                    </div>
                    {skis.map(ski => (
                      <motion.div key={ski._key ?? ski.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <SkiItem
                          ski={ski}
                          search={debouncedTerm}
                          handleCheckboxChange={toggleSelect}   // now expects selectionKey
                          selectedSkis={selectedMap}            // keyed by selectionKey
                          expandedSkiId={expandedSkiId}
                          toggleDetails={toggleDetails}
                          handleArchive={handleArchive}
                          handleUnarchive={handleUnarchive}
                          handleDelete={handleDelete}
                          handleEdit={() => router.push(`/skis/${ski.id}/edit`)}
                          ownerUserId={ownerUidForView}
                          readOnly={!!viewUserId}          // never show edit/archive/delete on others
                          selectable={canSelectForTest}    // allow checkboxes only for writers (and self)
                        />
                      </motion.div>
                    ))}
                  </React.Fragment>
                )
              )}
            </div>
          </AnimatePresence>
        ) : (
          <SkiTable
            skis={displayedSkis}
            selectedSkis={selectedMap}
            onToggleSelect={toggleSelect}
            expandedSkiId={expandedSkiId}
            onToggleDetails={toggleDetails}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={(field) => {
              if (field === sortField) {
                setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
              } else {
                setSortField(field);
                setSortDirection('asc');
              }
            }}
            onEdit={ski => router.push(`/skis/${ski.id}/edit`)}
            onDelete={handleDelete}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            ownerUserId={ownerUidForView}
            readOnly={!!viewUserId}
            selectable={canSelectForTest}
          />
        )}

        {/* Load more button */}
        {!exhausted && !loading && user && (
          <div className="flex justify-center my-4">
            <Button onClick={loadMore}>Load more</Button>
          </div>
        )}
        {skis.length === 0 && !loading && user && (
          <EmptyStateCard
            icon={<TiFlowParallel className="text-gray-500 text-2xl" />}
            title="Welcome to Ski Lab!"
            description="Get started by adding your first skis."
            
            primaryAction={{ label: 'Add Ski', onClick: handleAddSki }}
            secondaryAction={{ label: 'Learn More', onClick: () => router.push('/about') }}
          >
          </EmptyStateCard>
        )}

        {!user && (
          <SignInRequiredCard
            icon={<TiFlowParallel className="text-gray-500 text-2xl" />}
            resourceLabel="skis"
            onSignIn={() => router.push('/login')}
          />
        )}
      </div>

      {/* User Picker */}
      <UserPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        self={accessibleUsers.self || { id: user?.uid, displayName: user?.displayName || 'Me' }}
        owners={accessibleUsers.owners}
        currentId={viewUserId}
        onSelect={handleUserSelect}   // <── CHANGED (was: idOrNull => setViewUserId(idOrNull || null))
      />
    </div>
  );
};

function groupSkisByStyle(skis) {
  const groups = { classic: [], skate: [], dp: [] };
  skis.forEach(ski => {
    if (groups[ski.style]) groups[ski.style].push(ski);
  });
  return groups;
}

export default Skis;