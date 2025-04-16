// components/common/GeocodeInput.jsx
'use client';
import { useState, useEffect } from 'react';
import Input from '../common/Input';
const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;

export default function GeocodeInput({ label, initialValue = '', onLocationSelect }) {
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
  
    useEffect(() => {
      if (initialValue) {
        setQuery(initialValue);
      }
    }, [initialValue]);
  
    const handleSearch = async (searchText) => {
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(searchText)}&apiKey=${GEOAPIFY_KEY}`
        );
        const data = await response.json();
        setSuggestions(data.features || []);
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    };
  
    useEffect(() => {
      if (query.length > 2) {
        const debounceTimer = setTimeout(() => handleSearch(query), 500);
        return () => clearTimeout(debounceTimer);
      }
    }, [query]);
  
    return (
      <div className="mb-4 relative">
        <Input
          type="text"
          label={label}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for location..."
        />
        
        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full bg-white border rounded shadow-lg mt-1 max-h-60 overflow-auto">
            {suggestions.map((place, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  const [lon, lat] = place.geometry.coordinates;
                  onLocationSelect(lat, lon, place.properties.formatted);
                  setQuery(place.properties.formatted);
                  setSuggestions([]);
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
  