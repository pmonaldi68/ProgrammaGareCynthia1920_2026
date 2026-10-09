import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  MapPin,
  Calendar,
  Clock,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Thermometer,
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

  // Gestione chiusura modale con tasto Escape
  useEffect(() => {
    if (!showDetails) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDetails(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDetails]);

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

  const getHeaderGradient = (iconType: MatchWeatherData['iconType']) => {
    switch (iconType) {
      case 'rain':
      case 'drizzle':
      case 'lightning':
        return 'from-blue-700 via-indigo-800 to-slate-900';
      case 'snow':
        return 'from-cyan-700 via-sky-800 to-slate-900';
      case 'sun':
      case 'cloud-sun':
        return 'from-sky-600 via-blue-600 to-indigo-700';
      default:
        return 'from-slate-700 via-slate-800 to-slate-900';
    }
  };

  return (
    <>
      {/* BADGE DIRETTO (COMPATTO O STANDARD) */}
      {compact ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(true);
          }}
          title={`Meteo Open-Meteo: ${weather.conditionText}, ${weather.temperature}°C, Pioggia ${weather.precipitationProbability}%, Vento ${weather.windSpeed} km/h (Clicca per dettagli)`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/80 border border-sky-200/80 dark:border-sky-800/80 text-sky-900 dark:text-sky-200 shadow-2xs transition cursor-pointer"
        >
          {renderWeatherIcon(weather.iconType, 'w-3 h-3')}
          <span>{weather.temperature}°C</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(true);
          }}
          title="Clicca per visualizzare le previsioni meteo dettagliate sul campo di gara (Open-Meteo)"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition shadow-2xs group cursor-pointer"
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
      )}

      {/* FINESTRA MODALE DETTAGLI METEO (MONTATA SU DOCUMENT.BODY TRAMITE PORTAL) */}
      {/* Risolve il problema del taglio causato da overflow-hidden dei contenitori padri */}
      {showDetails && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col my-auto max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Finestra con Tema Meteo Dinamico */}
            <div className={`bg-gradient-to-r ${getHeaderGradient(weather.iconType)} text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-white/10`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20">
                  {renderWeatherIcon(weather.iconType, 'w-6 h-6 text-white')}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg leading-tight flex items-center gap-2 text-white">
                    Meteo sul Campo di Gara
                  </h3>
                  <p className="text-xs text-sky-100 font-medium flex items-center gap-1.5 mt-0.5">
                    <span>Previsione oraria ufficiale Open-Meteo</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
                title="Chiudi Finestra"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenuto Scrollabile con Massima Leggibilità */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Box Riferimento Partita */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs text-sky-800 dark:text-sky-300 font-bold mb-1">
                  <span>{partita.campionato} {partita.girone && partita.girone !== '#' ? `(Girone ${partita.girone})` : ''}</span>
                  {partita.gara && <span className="text-slate-500 dark:text-slate-400 font-medium">{partita.gara}</span>}
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {partita.squadraCasa} <span className="text-slate-400 font-normal">vs</span> {partita.squadraOspite}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300 mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span className="font-semibold">{partita.data}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-bold">ore {partita.ora}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="font-semibold truncate">{partita.campo} ({partita.comune})</span>
                  </div>
                </div>
                {partita.lnkMaps && partita.lnkMaps !== '#' && partita.lnkMaps.startsWith('http') && (
                  <div className="mt-2 text-right">
                    <a
                      href={partita.lnkMaps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Apri navigatore sul campo
                    </a>
                  </div>
                )}
              </div>

              {/* Box Principale: Condizione e Temperatura ad Alto Contrasto */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky-50/90 via-blue-50/50 to-indigo-50/30 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-slate-800/50 border border-sky-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-700/70">
                    {renderWeatherIcon(weather.iconType, 'w-12 h-12 sm:w-14 sm:h-14')}
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {weather.temperature}°C
                    </div>
                    <div className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-sky-100/90 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 font-extrabold text-xs sm:text-sm">
                      {weather.conditionText}
                    </div>
                  </div>
                </div>

                <div className="text-center sm:text-right text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <div>Previsione oraria al fischio d'inizio</div>
                  <div className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    Orario di gara: ore {partita.ora}
                  </div>
                </div>
              </div>

              {/* Griglia Dati Specifici (4 Metric Cards Chiare e Leggibili) */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* 1. Temperatura */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                    <Thermometer className="w-4 h-4 text-amber-500" />
                    <span>Temperatura</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                      {weather.temperature}°C
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {weather.temperature >= 22 ? 'Clima caldo' : weather.temperature >= 14 ? 'Clima temperato' : 'Clima fresco'}
                    </span>
                  </div>
                </div>

                {/* 2. Probabilità Pioggia */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span>Pioggia / Precipitazioni</span>
                  </div>
                  <div className="mt-2">
                    <span className={`text-lg sm:text-xl font-extrabold ${weather.precipitationProbability > 40 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {weather.precipitationProbability}%
                    </span>
                    <span className="block text-[11px] font-semibold mt-0.5">
                      {weather.precipitationProbability > 50 ? (
                        <span className="text-blue-600 dark:text-blue-400">Rischio elevato</span>
                      ) : weather.precipitationProbability > 20 ? (
                        <span className="text-amber-600 dark:text-amber-400">Rischio moderato</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">Rischio minimo</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* 3. Vento */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                    <Wind className="w-4 h-4 text-slate-400" />
                    <span>Vento al Suolo</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                      {weather.windSpeed} km/h
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {weather.windSpeed > 30 ? 'Vento forte' : weather.windSpeed > 15 ? 'Brezza moderata' : 'Vento debole'}
                    </span>
                  </div>
                </div>

                {/* 4. Località Monitorata */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>Località Coordinate</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate block">
                      {weather.locationName}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      GPS Impianto di Gioco
                    </span>
                  </div>
                </div>
              </div>

              {/* Box Condizioni del Terreno & Consigli per la Gara */}
              <div className={`p-3.5 rounded-xl border text-xs ${
                weather.precipitationProbability > 50
                  ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200'
                  : weather.precipitationProbability > 20
                  ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                  : weather.temperature >= 28
                  ? 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800 text-orange-950 dark:text-orange-200'
                  : weather.temperature <= 8
                  ? 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-950 dark:text-sky-200'
                  : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
              }`}>
                <div className="flex items-start gap-2.5">
                  {weather.precipitationProbability > 50 ? (
                    <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  ) : weather.precipitationProbability > 20 ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-extrabold text-sm mb-1">
                      {weather.precipitationProbability > 50
                        ? 'Attenzione: Probabile Terreno Bagnato'
                        : weather.precipitationProbability > 20
                        ? 'Variabile: Possibili Precipitazioni Sparse'
                        : weather.temperature >= 28
                        ? 'Clima Caldo e Soleggiato'
                        : weather.temperature <= 8
                        ? 'Clima Rigido / Freddo'
                        : 'Condizioni Meteo Ottimali'}
                    </h4>
                    <p className="leading-relaxed opacity-90 text-[11px] sm:text-xs">
                      {weather.precipitationProbability > 50
                        ? `Elevata probabilità di precipitazioni (${weather.precipitationProbability}%). Il fondo campo (${partita.tipo || 'Sintetico'}) potrebbe presentare scarsa aderenza. Si consigliano tacchetti adatti al bagnato per i calciatori e ombrelli/capi impermeabili per il pubblico.`
                        : weather.precipitationProbability > 20
                        ? `Possibilità di piogge deboli o intermittenti (${weather.precipitationProbability}%). Si consiglia di monitorare le condizioni durante la fase di riscaldamento pre-gara.`
                        : weather.temperature >= 28
                        ? `Temperature elevate (${weather.temperature}°C). Si raccomanda adeguata idratazione per atleti e arbitro durante i tempi di gioco.`
                        : weather.temperature <= 8
                        ? `Temperature rigide (${weather.temperature}°C). Si consiglia un riscaldamento muscolare approfondito e sottomaglia termica.`
                        : 'Condizioni ideali per giocare a calcio: visibilità ottimale, assenza di piogge significative e temperatura favorevole per atleti e spettatori.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informazione Fonte Dati */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center pt-1 border-t border-slate-100 dark:border-slate-800">
                Previsioni calcolate per le coordinate GPS dell'impianto di gioco ({weather.locationName}) via <strong>Open-Meteo API</strong>.
              </div>
            </div>

            {/* Footer con Pulsante di Chiusura Ampio e Comodo */}
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition cursor-pointer text-center"
              >
                Chiudi Finestra Meteo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
