'use client';
import { useState, useEffect, useRef } from 'react';
import Input from '../ui/Input';
const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;

export default function GeocodeInput({ label, initialValue = '', onLocationSelect }) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (initialValue) setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${GEOAPIFY_KEY}`
        );
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (e) {
        console.error('Geocoding error:', e);
      }
    };

    if (focused && query.length > 2) {
      const timer = setTimeout(fetchSuggestions, 500);
      return () => clearTimeout(timer);
    }
    return;
  }, [query, focused]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="mb-4 relative">
      <Input
        type="text"
        label={label}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder={label}
      />
      {focused && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-2xl shadow-lg mt-1 max-h-60 overflow-auto">
          {suggestions.map((place, i) => (
            <div
              key={i}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                const [lon, lat] = place.geometry.coordinates;
                onLocationSelect(lat, lon, place.properties.formatted);
                setQuery(place.properties.formatted);
                setSuggestions([]);
                setFocused(false);
              }}
            >
              {place.properties.formatted}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
