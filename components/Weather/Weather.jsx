'use client'
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  RiTempColdLine, 
  RiCloudLine, 
  RiMapPin2Line, 
  RiMoonLine, 
  RiSunLine, 
  RiShowersLine, 
  RiSnowyLine 
} from "react-icons/ri";

// Cache configuration
const CACHE_CONFIG = {
  WEATHER_TTL: 15 * 60 * 1000, // 15 minutes
  LOCATION_TTL: 60 * 60 * 1000, // 1 hour
  GEOLOCATION_KEY: 'geoPosition',
  WEATHER_KEY: 'weatherData'
};

const Weather = () => {
  const [weather, setWeather] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const { user } = useAuth();

  // Cached fetch with invalidation
  const cachedFetch = async (key, url, options, ttl) => {
    const now = Date.now();
    const cache = JSON.parse(localStorage.getItem(key) || '{}');
    
    // Return cached data if valid
    if (cache.data && cache.expires > now && cache.url === url) {
      return cache.data;
    }

    // Fetch fresh data
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Fetch failed');
      const data = await response.json();
      
      // Store in cache
      localStorage.setItem(key, JSON.stringify({
        data,
        expires: now + ttl,
        url
      }));
      
      return data;
    } catch (error) {
      // Return stale data if available
      if (cache.data) return cache.data;
      throw error;
    }
  };

  // HTTPS-compatible IP geolocation
  const fetchLocationByIP = async () => {
    try {
      const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
      const data = await cachedFetch(
        'ipGeo',
        `https://api.geoapify.com/v1/ipinfo?apiKey=${GEOAPIFY_KEY}`,
        {},
        CACHE_CONFIG.LOCATION_TTL
      );

      if (data.location?.latitude) {
        fetchWeatherYR(
          data.location.latitude,
          data.location.longitude,
          data.city?.name
        );
      }
    } catch (error) {
      console.error("IP location failed", error);
      setLocationError(true);
    }
  };

  // Weather fetch with caching
  const fetchWeatherYR = async (lat, lon, locationName) => {
    const weatherUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
    
    try {
      const weatherData = await cachedFetch(
        `${CACHE_CONFIG.WEATHER_KEY}_${lat}_${lon}`,
        weatherUrl,
        {
          headers: {
            'User-Agent': 'Ski-Lab/1.0 (hasdol98@gmail.com)',
          },
        },
        CACHE_CONFIG.WEATHER_TTL
      );

      const current = weatherData.properties.timeseries[0].data.instant.details;
      const symbol = weatherData.properties.timeseries[0].data.next_1_hours?.summary.symbol_code || 'clear';

      // Store last known location
      localStorage.setItem(CACHE_CONFIG.GEOLOCATION_KEY, JSON.stringify({
        lat,
        lon,
        timestamp: Date.now()
      }));

      setWeather({
        temp: current.air_temperature,
        condition: symbol.split('_')[0],
        location: locationName || await fetchLocationName(lat, lon),
        isDayTime: calculateDayTime(),
        coordinates: { lat, lon }
      });
      
    } catch (error) {
      console.error("YR.no fetch failed", error);
      setLocationError(true);
    }
  };

  // Reverse geocoding with cache
  const fetchLocationName = async (lat, lon) => {
    try {
      const data = await cachedFetch(
        `reverseGeo_${lat}_${lon}`,
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'User-Agent': 'Ski-Lab/1.0' } },
        CACHE_CONFIG.LOCATION_TTL
      );

      return data.address.quarter || data.address.city || "Current Location";
    } catch (error) {
      console.error("Geocoding failed", error);
      return "Current Location";
    }
  };

  // Improved daytime calculation
  const calculateDayTime = () => {
    const hours = new Date().getHours();
    return hours > 6 && hours < 20;
  };

  // Location change detection
  const hasLocationChanged = (newLat, newLon) => {
    const lastGeo = JSON.parse(localStorage.getItem(CACHE_CONFIG.GEOLOCATION_KEY) || '{}');
    if (!lastGeo.lat) return true;
    
    // Consider >1km change as significant
    const distance = Math.sqrt(
      Math.pow(newLat - lastGeo.lat, 2) + 
      Math.pow(newLon - lastGeo.lon, 2)
    );
    return distance > 0.01; // ~1km threshold
  };

  // Location handling with change detection
  const requestLocation = () => {
    setLocationError(false);

    const handlePosition = (position) => {
      const { latitude, longitude } = position.coords;
      if (hasLocationChanged(latitude, longitude)) {
        localStorage.removeItem(CACHE_CONFIG.WEATHER_KEY);
      }
      fetchWeatherYR(latitude, longitude);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        handlePosition,
        fetchLocationByIP
      );
    } else {
      fetchLocationByIP();
    }
  };

  // Weather icon mapping
  const getWeatherIcon = (condition, isDayTime) => {
    const icons = {
      rain: <RiShowersLine size={15} />,
      snow: <RiSnowyLine size={15} />,
      cloud: <RiCloudLine size={15} />,
      clear: isDayTime ? <RiSunLine size={15} /> : <RiMoonLine size={15} />,
    };
    return icons[condition] || <RiCloudLine size={15} />;
  };

  useEffect(() => {
    if (user) requestLocation();
  }, [user]);

  if (!user) return null;

  return weather ? (
    <div className="flex flex-1 md:justify-end text-xs space-x-2">
      <div className="flex space-x-1">
        <RiMapPin2Line size={15} />
        <h2>{weather.location}</h2>
      </div>
      <div className="flex space-x-1">
        <RiTempColdLine size={15} />
        <h2>{weather.temp.toFixed(1)}°C</h2>
      </div>
      <div>
        {getWeatherIcon(weather.condition, weather.isDayTime)}
      </div>
    </div>
  ) : locationError ? (
    <div className="flex-1 text-end hidden md:block shrink-0 text-xs space-x-2">
      <p>Enable location for weather</p>
    </div>
  ) : null;
};

export default Weather;