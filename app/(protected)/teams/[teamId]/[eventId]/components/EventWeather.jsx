// EventWeather.jsx   (client component)
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  RiSunLine,
  RiCloudLine,
  RiRainyLine,
  RiSnowyLine,
} from 'react-icons/ri';
import Button from '@/components/ui/Button';
import { formatDate, formatTimeShort, formatWeekdayShort, getOsloDateKey } from '@/helpers/helpers';

/* ————— endpoint selection ————— */
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ski-lab-dev';
const REGION     = 'europe-north1';
const CF_URL     = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/weatherForecast`;
const RUN_URL    = process.env.NEXT_PUBLIC_WEATHER_PROXY_URL;        // optional
const WEATHER_ENDPOINT = RUN_URL || CF_URL;

export default function EventWeather({ eventData }) {
  const [forecast, setForecast]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ─────────────────────────  FETCH  ───────────────────────── */
  useEffect(() => {
    if (!eventData?.location) return;

    (async () => {
      try {
        const url = `${WEATHER_ENDPOINT}?lat=${eventData.location.lat}&lon=${eventData.location.lon}`;
        const data = await (await fetch(url)).json();
        setForecast(processForecastData(data));
      } catch (err) {
        console.error('Weather fetch failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventData]);

  /* ───────────────────  DATA MASSAGE  ─────────────────── */
  const processForecastData = (data) => {
    const daily = {};

    data.properties.timeseries.forEach((entry) => {
      const dateKey = getOsloDateKey(entry.time) || new Date(entry.time).toISOString().slice(0, 10);
      const time = formatTimeShort(entry.time);

      const instant = entry.data.instant.details;
      const next1h = entry.data.next_1_hours?.details || {};
      const symbol = entry.data.next_1_hours?.summary?.symbol_code || 'clearsky';

      const hourObj = {
        time,
        temp: instant.air_temperature,
        wind: instant.wind_speed,
        humidity: instant.relative_humidity,
        precip: next1h.precipitation_amount || 0,
        symbol,
      };

      if (!daily[dateKey]) {
        daily[dateKey] = {
          date: dateKey,
          minTemp: instant.air_temperature,
          maxTemp: instant.air_temperature,
          totalPrecip: hourObj.precip,
          maxWind: instant.wind_speed,
          maxHumidity: instant.relative_humidity,
          symbol,
          hourly: [hourObj],
        };
      } else {
        daily[dateKey].minTemp = Math.min(daily[dateKey].minTemp, instant.air_temperature);
        daily[dateKey].maxTemp = Math.max(daily[dateKey].maxTemp, instant.air_temperature);
        daily[dateKey].totalPrecip += hourObj.precip;
        daily[dateKey].maxWind = Math.max(daily[dateKey].maxWind, instant.wind_speed);
        daily[dateKey].maxHumidity = Math.max(daily[dateKey].maxHumidity, instant.relative_humidity);
        daily[dateKey].hourly.push(hourObj);
      }
    });

    return Object.values(daily).slice(0, 7);
  };

  /* ─────────────────────  ICON PICKER  ───────────────────── */
  const getWeatherIcon = (symbol) => {
    const base = symbol.split('_')[0];
    const icons = {
      clearsky: <RiSunLine />,
      cloudy: <RiCloudLine />,
      rain: <RiRainyLine />,
      snow: <RiSnowyLine />,
    };
    return icons[base] || <RiCloudLine />;
  };

  if (!eventData?.location) return null;

  /* ──────────────────────  RENDER  ──────────────────────- */
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Weather
        </h2>
        <p className="text-sm text-gray-600">
          {eventData.location.address} (yr.no)
        </p>
      </div>

      {loading && <p className="text-gray-400">Loading …</p>}

      {forecast?.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {forecast.map((day, index) => (
            <Button
              key={index}
              variant="secondary"
              onClick={() => setSelectedDay(index)}
              className="w-full"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="text-sm font-medium text-gray-800">
                  {formatWeekdayShort(day.date)}
                </div>

                <div className="text-2xl flex justify-self-center">
                  {getWeatherIcon(day.symbol)}
                </div>

                <div className="flex items-baseline justify-center text-sm">
                  <span className={`${day.minTemp?.toFixed(0) < 1 ? 'text-blue-500' : 'text-delete'}`}>
                    {day.minTemp?.toFixed(0)}
                  </span>
                  <span className="mx-1 text-gray-500">/</span>
                  <span className={`${day.maxTemp?.toFixed(0) < 1 ? 'text-blue-500' : 'text-delete'}`}>
                    {day.maxTemp?.toFixed(0)}°C
                  </span>
                </div>

                <div className="text-xs text-gray-600">{day.totalPrecip.toFixed(1)} mm</div>
                <div className="text-xs text-gray-600">{day.maxHumidity.toFixed(0)} %</div>
              </div>
            </Button>
          ))}
        </div>
      ) : (
        !loading && <p className="text-gray-400">Weather data unavailable</p>
      )}

      {/* ───────────── Hourly modal ───────────── */}
      {mounted && selectedDay !== null && forecast?.[selectedDay]
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-lg ring-1 ring-black/10">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {formatDate(forecast[selectedDay].date)}
                </h3>

                <div className="max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-6 font-semibold text-gray-600 text-xs border-b pb-2 mb-2">
                    <div>Time</div>
                    <div></div>
                    <div>Temp</div>
                    <div>Precip</div>
                    <div>Wind</div>
                    <div>Humidity</div>
                  </div>

                  {forecast[selectedDay].hourly.map((h, i) => (
                    <div
                      key={i}
                      className={`grid grid-cols-6 text-sm py-2 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        i % 2 === 0 ? 'bg-gray-50/50' : ''
                      }`}
                    >
                      <div>{h.time}</div>
                      <div>{getWeatherIcon(h.symbol)}</div>
                      <div>{h.temp.toFixed(1)}°C</div>
                      <div>{h.precip.toFixed(1)} mm</div>
                      <div>{h.wind.toFixed(1)} m/s</div>
                      <div>{h.humidity.toFixed(0)} %</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-4">
                  <Button onClick={() => setSelectedDay(null)} variant="secondary">
                    Close
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      <p className="text-xs text-gray-500">
        Weather data ©{' '}
        <a
          href="https://www.met.no/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          MET Norway&nbsp;/&nbsp;yr.no
        </a>
      </p>
    </div>
  );
}
