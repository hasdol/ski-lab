'use client';

import React, { useEffect, useState } from 'react';
import {
  RiTempColdLine,
  RiCloudLine,
  RiMapPin2Line,
  RiMoonLine,
  RiSunLine,
  RiShowersLine,
  RiSnowyLine,
} from 'react-icons/ri';

import { WEATHER_ENDPOINT } from '@/lib/firebase/weatherEndpoint';
import { useAuth } from '@/context/AuthContext';

/* ─────────── small in‑memory cache ─────────── */
const CACHE_TTL = 15 * 60 * 1000; // 15 min
const cache = new Map();          // url ▶︎ { data, expires }

async function cachedFetch(url) {
  const now = Date.now();
  const hit = cache.get(url);
  if (hit && hit.expires > now) return hit.data;

  const res = await fetch(url);
  if (!res.ok) throw new Error('weather fetch failed');

  const data = await res.json();
  cache.set(url, { data, expires: now + CACHE_TTL });
  return data;
}

/* ─────────── icon helper ─────────── */
function iconFor(symbolCode, daylight) {
  const base = symbolCode.split('_')[0]; // "clearsky_day" → "clearsky"
  const icons = {
    rain:  <RiShowersLine size={15} />,
    snow:  <RiSnowyLine  size={15} />,
    cloud: <RiCloudLine  size={15} />,
    clear: daylight ? <RiSunLine size={15} /> : <RiMoonLine size={15} />,
  };
  return icons[base] || <RiCloudLine size={15} />;
}

export default function Weather() {
  const { user } = useAuth();

  const [wx,  setWx]  = useState(null);  // { temp, symbol, isDay, location }
  const [err, setErr] = useState(false);

  /* ───────────────────────── fetch once on mount ───────────────────────── */
  useEffect(() => {
    if (!user) return;                   // hide for signed‑out users

    const getPosition = () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('no geo'));
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: false, maximumAge: 600000 } // allow a 10 min cached fix
        );
      });

    getPosition()
      .then(async pos => {
        const { latitude: lat, longitude: lon } = pos.coords;

        /* ---------- 1) MET Norway forecast (via your proxy) ---------- */
        const url   = `${WEATHER_ENDPOINT}?lat=${lat}&lon=${lon}`;
        const data  = await cachedFetch(url);
        const ts0   = data.properties.timeseries[0];          // first entry = “now”
        const det   = ts0.data.instant.details;
        const code  = ts0.data.next_1_hours?.summary.symbol_code || 'clearsky';
        const hour  = new Date().getHours();
        const isDay = hour > 6 && hour < 20;

        /* ---------- 2) (optional) reverse‑geocode for a friendlier name ---------- */
        let place = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        try {
          const rev = await cachedFetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );
          place =
            rev.address?.quarter ||
            rev.address?.city    ||
            rev.address?.town    ||
            place;
        } catch (_) {/* ignore – place falls back to coords */}
        
        setWx({
          temp     : det.air_temperature,
          symbol   : code,
          isDay,
          location : place,
        });
      })
      .catch(() => setErr(true));
  }, [user]);

  /* ───────────────────────── render ───────────────────────── */
  if (!user)           return null;
  if (err && !wx)      return (
    <div className="text-xs text-right">
      Enable location for weather
    </div>
  );
  if (!wx)             return null;

  return (
    <div className="flex text-xs space-x-2">
      <div className="flex space-x-1">
        <RiMapPin2Line size={15} />
        <span>{wx.location}</span>
      </div>
      <div className="flex space-x-1">
        <RiTempColdLine size={15} />
        <span>{wx.temp.toFixed(1)}°C</span>
      </div>
      {iconFor(wx.symbol, wx.isDay)}
    </div>
  );
}
