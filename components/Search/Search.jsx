'use client';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiSearchLine } from 'react-icons/ri';
import { useDebounce } from 'use-debounce';
import Button from '@/components/common/Button';

const MIN_CHARS = 3;

const ResultsSearch = ({ onSearch }) => {
  const { t } = useTranslation();
  const [local, setLocal] = useState('');
  const [debounced] = useDebounce(local, 300);

  useEffect(() => {
    if (debounced.length >= MIN_CHARS || debounced === '') {
      onSearch(debounced.trim().toLowerCase());
    }
  }, [debounced, onSearch]);

  return (
    <div className="flex flex-col relative w-full mr-5">
      <div className="bg-white flex items-center rounded-md md:w-fit border border-gray-300 overflow-hidden focus-within:outline outline-gray-500">
        <input
          id="search-input"
          type="text"
          placeholder={t('search')}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          className="w-full bg-white px-4 py-3 outline-none"
        />
        <div className="text-text p-2 px-4 border-gray-300 border-l">
          <RiSearchLine />
        </div>
      </div>
      {local.length > 0 && local.length < MIN_CHARS && (
        <p className={`absolute -bottom-5 text-xs text-gray-500 mt-1`}>
          {t('type_min_chars', { count: MIN_CHARS })}
        </p>
      )}
    </div>
  );
};

export default ResultsSearch;