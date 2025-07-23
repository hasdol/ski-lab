'use client';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import React, { useContext, useEffect, useState } from 'react';
import { RiSearchLine } from 'react-icons/ri';
import { useDebounce } from 'use-debounce';

const MIN_CHARS = 3;

const Search = ({ onSearch }) => {
  const [local, setLocal] = useState('');
  const [debounced] = useDebounce(local, 300);
  const { gloveMode } = useContext(UserPreferencesContext);


  useEffect(() => {
    if (debounced.length >= MIN_CHARS || debounced === '') {
      onSearch(debounced.trim().toLowerCase());
    }
  }, [debounced, onSearch]);

  return (
    <div className="flex flex-col relative w-full">
      <div className={`bg-white flex items-center rounded-lg md:w-fit border border-gray-300 overflow-hidden focus-within:outline outline-gray-500 ${gloveMode && 'p-2'}`}>
        <input
          id="search-input"
          type="text"
          placeholder='Search'
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
          Type minimum 3 characters
        </p>
      )}
    </div>
  );
};

export default Search;