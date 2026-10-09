import React, { useState, useEffect } from 'react';
import { Partita } from '../types';
import { fetchMatchWeather, MatchWeatherData } from '../services/weatherService';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Snowflake,
  Wind,
  Droplets,
  CloudFog,
} from 'lucide-react';

interface WeatherBadgeProps {
  partita: Partita;
  compact?: boolean;
}

export const WeatherBadge: React.FC<WeatherBadgeProps> = ({ partita, compact = false }) => {
  const [weather, setWeather] = useState<MatchWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchMatchWeather(partita).then(data => {
      if (isMounted) {
        setWeather(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [partita.id, partita.data, partita.ora, partita.campo, partita.comune]);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 text-slate-400 text-xs animate-pulse">
        <Sun className="w-3.5 h-3.5 opacity-40" />
        <span className="text-[11px] font-medium">Meteo...</span>
      </div>
    );
  }

  if (!weather) {
    // Nessuna previsione disponibile (es. gara oltre i 14 giorni o coordinate assenti)
    return null;
  }

  const renderWeatherIcon = (iconType: MatchWeatherData['iconType'], className = 'w-4 h-4') => {
    switch (iconType) {
      case 'sun':
        return <Sun className={`${className} text-amber-500`} />;
      case 'cloud-sun':
        return <CloudSun className={`${className} text-amber-500`} />;
      case 'cloud':
        return <Cloud className={`${className} text-slate-400`} />;
      case 'rain':
        return <CloudRain className={`${className} text-blue-500`} />;
      case 'drizzle':
        return <CloudDrizzle className={`${className} text-sky-400`} />;
      case 'lightning':
        return <CloudLightning className={`${className} text-purple-500`} />;
      case 'snow':
        return <Snowflake className={`${className} text-sky-300`} />;
      case 'fog':
        return <CloudFog className={`${className} text-slate-400`} />;
      default:
        return <CloudSun className={`${className} text-amber-500`} />;
    }
  };

  if (compact) {
    return (
      <span
        title={`Meteo Open-Meteo: ${weather.conditionText}, ${weather.temperature}°C, Pioggia ${weather.precipitationProbability}%, Vento ${weather.windSpeed} km/h`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80 text-sky-900 dark:text-sky-200 shadow-2xs"
      >
        {renderWeatherIcon(weather.iconType, 'w-3 h-3')}
        <span>{weather.temperature}°C</span>
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        title="Clicca per visualizzare le previsioni meteo sul campo di gara (Open-Meteo)"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition shadow-2xs group"
      >
        <span className="group-hover:scale-110 transition-transform">
          {renderWeatherIcon(weather.iconType, 'w-3.5 h-3.5')}
        </span>
        <span className="font-extrabold text-slate-900 dark:text-slate-100">{weather.temperature}°C</span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden xs:inline">
          {weather.conditionText}
        </span>
        {weather.precipitationProbability > 20 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
            <Droplets className="w-2.5 h-2.5" />
            {weather.precipitationProbability}%
          </span>
        )}
      </button>

      {/* Popover Dettagli Meteo */}
      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/80">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {renderWeatherIcon(weather.iconType, 'w-4 h-4')}
                Meteo sul Campo
              </span>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950 px-1.5 py-0.5 rounded">
                Open-Meteo
              </span>
            </div>

            <div className="mt-2 space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>Luogo:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                  {weather.locationName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Condizione:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{weather.conditionText}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Temperatura:</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">{weather.temperature}°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-blue-500" />
                  Probabilità Pioggia:
                </span>
                <span className={`font-bold ${weather.precipitationProbability > 40 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {weather.precipitationProbability}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3 text-slate-400" />
                  Vento:
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{weather.windSpeed} km/h</span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/80 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>{weather.precipitationProbability > 50 ? '⚠️ Campo bagnato probabile' : '✅ Condizioni ottimali'}</span>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="text-sky-600 dark:text-sky-400 hover:underline font-bold"
              >
                Chiudi
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
