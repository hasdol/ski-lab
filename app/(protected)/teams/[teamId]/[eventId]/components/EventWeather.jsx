'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation }               from 'react-i18next';
import { RiSunLine, RiCloudLine, RiRainyLine, RiSnowyLine } from 'react-icons/ri';
import Button from '@/components/common/Button';

/* ————— endpoint selection ————— */
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ski-lab-dev';
const REGION     = 'europe-north1';
const CF_URL     = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/weatherForecast`;
const RUN_URL    = process.env.NEXT_PUBLIC_WEATHER_PROXY_URL; // optional Cloud‑Run URL
const WEATHER_ENDPOINT = RUN_URL || CF_URL;

export default function EventWeather({ eventData }) {
  const [forecast, setForecast]     = useState(null);
  const [loading,  setLoading]      = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const { t } = useTranslation();

  // ───────────── fetch & parse ─────────────
  useEffect(() => {
    if (!eventData?.location) return;

    (async () => {
      try {
        const url = `${WEATHER_ENDPOINT}?lat=${eventData.location.lat}&lon=${eventData.location.lon}`;
        const raw = await (await fetch(url)).json();
        setForecast(processForecastData(raw));
      } catch (err) {
        console.error('Weather fetch failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventData]);

  const processForecastData = (data) => {
    const daily = {};
    data.properties.timeseries.forEach((entry) => {
      const date   = new Date(entry.time).toDateString();
      const time   = new Date(entry.time).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
      const det    = entry.data.instant.details;
      const next   = entry.data.next_1_hours?.details || {};
      const symbol = entry.data.next_1_hours?.summary?.symbol_code || 'clearsky';

      const hour = { time, temp: det.air_temperature, wind: det.wind_speed, humidity: det.relative_humidity, precip: next.precipitation_amount || 0, symbol };
      if (!daily[date]) {
        daily[date] = { date, minTemp: det.air_temperature, maxTemp: det.air_temperature, totalPrecip: hour.precip, maxWind: det.wind_speed, maxHumidity: det.relative_humidity, symbol, hourly: [hour] };
      } else {
        const d = daily[date];
        d.minTemp = Math.min(d.minTemp, det.air_temperature);
        d.maxTemp = Math.max(d.maxTemp, det.air_temperature);
        d.totalPrecip += hour.precip;
        d.maxWind = Math.max(d.maxWind, det.wind_speed);
        d.maxHumidity = Math.max(d.maxHumidity, det.relative_humidity);
        d.hourly.push(hour);
      }
    });
    return Object.values(daily).slice(0, 7);
  };

  const icons = { clearsky: <RiSunLine />, cloudy: <RiCloudLine />, rain: <RiRainyLine />, snow: <RiSnowyLine /> };
  const iconFor = (sym) => icons[sym.split('_')[0]] || <RiCloudLine />;

  if (!eventData?.location) return null;

  /* ──────────────────────  RENDER  ────────────────────── */
  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-4">
        {eventData.location.address} (yr.no)
      </h2>

      {loading && <p className="text-gray-400">{t('loading')} …</p>}

      {forecast?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {forecast.map((day, index) => (
            <Button
              key={index}
              variant="secondary"
              onClick={() => setSelectedDay(index)}
            >
              <div className="grid grid-cols-5 md:grid-cols-1 items-center">
                <div>
                  {t(
                    new Date(day.date).toLocaleDateString('en', {
                      weekday: 'short',
                    })
                  )}
                </div>

                <div className="text-2xl my-2 flex justify-self-center">
                  {getWeatherIcon(day.symbol)}
                </div>

                <div className="flex justify-center">
                  <span className="text-blue-500">
                    {day.minTemp?.toFixed(0)}
                  </span>
                  <span className="mx-1">-</span>
                  <span className="text-delete">
                    {day.maxTemp?.toFixed(0)}°C
                  </span>
                </div>

                <div className="text-sm">{day.totalPrecip.toFixed(1)} mm</div>
                <div className="text-sm">{day.maxHumidity.toFixed(0)} %</div>
              </div>
            </Button>
          ))}
        </div>
      ) : (
        !loading && <p className="text-gray-400">Weather data unavailable</p>
      )}

      {/* ───────────── Hourly modal ───────────── */}
      {selectedDay !== null && (
        <div className="fixed inset-0 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-4 mx-2 shadow-md w-full max-w-2xl relative">
            <h3 className="flex space-x-1 text-lg font-semibold mb-4">
              <span>{t(forecast[selectedDay].date.slice(0, 3))}</span>
              <span>-</span>
              <span>{forecast[selectedDay].date.slice(4)}</span>
            </h3>

            <div className="max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-6 font-semibold text-gray-600 text-xs border-b pb-2 mb-2">
                <div>{t('time')}</div>
                <div></div>
                <div>Temp</div>
                <div>{t('precip')}</div>
                <div>{t('wind')}</div>
                <div>{t('humidity')}</div>
              </div>

              {forecast[selectedDay].hourly.map((h, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-6 text-sm py-2 border-b border-gray-300 hover:bg-gray-50 transition-all ${
                    i % 2 === 0 ? 'bg-gray-50/50' : ''
                  }`}
                >
                  <div>{h.time}</div>
                  <div>{getWeatherIcon(h.symbol)}</div>
                  <div>{h.temp.toFixed(1)}°C</div>
                  <div>{h.precip.toFixed(1)} mm</div>
                  <div>{h.wind.toFixed(1)} m/s</div>
                  <div>{h.humidity.toFixed(0)} %</div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setSelectedDay(null)}
              variant="secondary"
              className="mt-4 text-xs"
            >
              {t('close')}
            </Button>
          </div>
        </div>
      )}

      <p className="mt-1 text-xs text-gray-500">
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
