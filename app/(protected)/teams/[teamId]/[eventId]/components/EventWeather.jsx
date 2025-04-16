// Updated EventWeather.jsx
'use client';
import Button from '@/components/common/Button';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RiSunLine, RiCloudLine, RiRainyLine, RiSnowyLine } from "react-icons/ri";

export default function EventWeather({ eventData }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const { t } = useTranslation();


  useEffect(() => {
    if (!eventData?.location) return;

    const fetchForecast = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error('User not authenticated');
    
        const response = await fetch(
          `https://ski-lab.com/weatherProxy?` + 
          new URLSearchParams({
            lat: eventData.location.lat,
            lon: eventData.location.lon
          }),
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );
    
        if (!response.ok) throw new Error('Failed to fetch weather');
        const data = await response.json();
        const dailyData = processForecastData(data);
        setForecast(dailyData);
      } catch (error) {
        console.error('Weather fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [eventData]);

  const processForecastData = (data) => {
    const dailyForecasts = {};

    data.properties.timeseries.forEach((entry) => {
      const date = new Date(entry.time).toDateString();
      const time = new Date(entry.time).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
      const instant = entry.data.instant.details;
      const next1h = entry.data.next_1_hours?.details || {};
      const symbol = entry.data.next_1_hours?.summary?.symbol_code || 'clearsky';

      const hourlyEntry = {
        time,
        temp: instant.air_temperature,
        wind: instant.wind_speed,
        humidity: instant.relative_humidity,
        precip: next1h.precipitation_amount || 0,
        symbol,
      };

      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date,
          minTemp: instant.air_temperature,
          maxTemp: instant.air_temperature,
          totalPrecip: next1h.precipitation_amount || 0,
          maxWind: instant.wind_speed,
          maxHumidity: instant.relative_humidity,
          symbol,
          hourly: [hourlyEntry],
        };
      } else {
        dailyForecasts[date].minTemp = Math.min(dailyForecasts[date].minTemp, instant.air_temperature);
        dailyForecasts[date].maxTemp = Math.max(dailyForecasts[date].maxTemp, instant.air_temperature);
        dailyForecasts[date].totalPrecip += next1h.precipitation_amount || 0;
        dailyForecasts[date].maxWind = Math.max(dailyForecasts[date].maxWind, instant.wind_speed);
        dailyForecasts[date].maxHumidity = Math.max(dailyForecasts[date].maxHumidity, instant.relative_humidity);
        dailyForecasts[date].hourly.push(hourlyEntry);
      }
    });

    return Object.values(dailyForecasts).slice(0, 7);
  };



  const getWeatherIcon = (symbol) => {
    const baseSymbol = symbol.split('_')[0];
    const icons = {
      clearsky: <RiSunLine />,
      cloudy: <RiCloudLine />,
      rain: <RiRainyLine />,
      snow: <RiSnowyLine />,
    };
    return icons[baseSymbol] || <RiCloudLine />;
  };

  if (!eventData?.location) return null;

  return (
    <div className=" mt-4">
      <h2 className="text-xl font-semibold mb-4">{eventData.location.address} (YR.no) </h2>
      {forecast?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {forecast.map((day, index) => (
            <Button
              key={index}
              variant='secondary'
              onClick={() => setSelectedDay(index)}
            >
              <div className='grid grid-cols-5 md:grid-cols-1 items-center '>
                <div>
                  {t(new Date(day.date).toLocaleDateString('en', { weekday: 'short' }))}
                </div>
                <div className="text-2xl my-2 flex justify-self-center">
                  {getWeatherIcon(day.symbol)}
                </div>
                  <div className='flex justify-center'>
                    <div className='text-blue-500'>{day.minTemp?.toFixed(0)}</div>
                    <span className='mx-1'>-</span>
                    <div className='text-delete'>{day.maxTemp?.toFixed(0)}°C</div>

                  </div>
                  <div className='text-sm'>{day.totalPrecip.toFixed(1)} mm</div>
                  <div className='text-sm'>{day.maxHumidity.toFixed(0)}%</div>
              </div>


            </Button>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">Weather data unavailable</p>
      )}
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
              {forecast[selectedDay].hourly.map((hour, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-6 text-sm py-2 border-b border-gray-300 hover:bg-gray-50 transition-all ${i % 2 === 0 ? 'bg-gray-50/50' : ''
                    }`}
                >
                  <div>{hour.time}</div>
                  <div>{getWeatherIcon(hour.symbol)}</div>
                  <div>{hour.temp.toFixed(1)}°C</div>
                  <div>{hour.precip.toFixed(1)} mm</div>
                  <div>{hour.wind.toFixed(1)} m/s</div>
                  <div>{hour.humidity.toFixed(0)}%</div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setSelectedDay(null)}
              variant="secondary"
              className='mt-4 text-xs'
            >
              {t('close')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};