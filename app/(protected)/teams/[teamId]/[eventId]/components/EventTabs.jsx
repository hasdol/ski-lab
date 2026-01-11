'use client';
import React, { useEffect, useMemo, useRef } from 'react';

export default function EventTabs({ activeTab, setActiveTab, canSeeDashboard, onTabChange }) {
  const scrollRef = useRef(null);
  const tabRefs = useRef({});

  const tabs = useMemo(() => {
    const list = [
      { key: 'Info', label: 'Info' },
      { key: 'Tests', label: 'Tests' },
      { key: 'Weather', label: 'Weather' },
    ];
    if (canSeeDashboard) list.push({ key: 'Analytics', label: 'Analytics' });
    return list;
  }, [canSeeDashboard]);

  const go = (tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  useEffect(() => {
    const el = tabRefs.current?.[activeTab];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeTab, canSeeDashboard]);

  return (
    <div className="border-b border-gray-200 mb-6">
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-hide"
        role="tablist"
        aria-label="Event sections"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            ref={(el) => {
              if (el) tabRefs.current[t.key] = el;
            }}
            role="tab"
            aria-selected={activeTab === t.key}
            className={`shrink-0 px-4 py-2 font-medium text-sm whitespace-nowrap focus-visible:outline-none ${activeTab === t.key
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => go(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
