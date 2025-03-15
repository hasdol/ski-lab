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

const Weather = () => {
  const [weather, setWeather] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const { user } = useAuth();

  const getPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation is not supported"));
      }
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  const fetchWeather = async (latitude, longitude) => {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY; // Bruk NEXT_PUBLIC_ prefix i Next.js
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const currentTime = Date.now() / 1000;
      const { sunrise, sunset } = data.sys;
      const isDayTime = currentTime > sunrise && currentTime < sunset;
      setWeather({
        ...data,
        isDayTime,
      });
    } catch (error) {
      console.error("Could not fetch weather data", error);
    }
  };

  const requestLocation = () => {
    setLocationError(false);
    getPosition()
      .then((position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(latitude, longitude);
      })
      .catch((err) => {
        console.error("Could not get the user's position", err);
        setLocationError(true);
      });
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const getWeatherIcon = (weatherCondition, isDayTime) => {
    if (isDayTime) {
      switch (weatherCondition) {
        case 'Clouds':
          return <RiCloudLine size={15} />;
        case 'Rain':
          return <RiShowersLine size={15} />;
        case 'Snow':
          return <RiSnowyLine size={15} />;
        case 'Clear':
          return <RiSunLine size={15} />;
        default:
          return null;
      }
    } else {
      return <RiMoonLine size={15} />;
    }
  };

  if (!user) return null;

  return weather ? (
    <div className="flex flex-1 md:justify-end text-xs space-x-2">
      <div className="flex space-x-1">
        <RiMapPin2Line size={15} />
        <h2>{weather.name}</h2>
      </div>
      <div className="flex space-x-1">
        <RiTempColdLine size={15} />
        <h2>{weather.main.temp.toFixed(1)}°C</h2>
      </div>
      <div>
        {getWeatherIcon(weather.weather[0].main, weather.isDayTime)}
      </div>
    </div>
  ) : locationError ? (
    <div className="flex-1 text-end hidden md:block shrink-0 text-xs space-x-2">
      <p>Share location in browser</p>
    </div>
  ) : null;
};

export default Weather;
