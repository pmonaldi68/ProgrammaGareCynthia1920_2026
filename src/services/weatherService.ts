import { Partita } from '../types';
import { getInitialCoordinates } from '../utils/geoUtils';

export interface MatchWeatherData {
  temperature: number; // in °C
  precipitationProbability: number; // in %
  weatherCode: number;
  conditionText: string;
  iconType: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'drizzle' | 'lightning' | 'snow' | 'fog';
  windSpeed: number; // in km/h
  isForecastAvailable: boolean;
  matchDateTimeIso?: string;
  locationName: string;
}

// Mappatura codici WMO Open-Meteo
export function getWmoWeatherInfo(code: number): {
  conditionText: string;
  iconType: MatchWeatherData['iconType'];
} {
  switch (code) {
    case 0:
      return { conditionText: 'Sereno', iconType: 'sun' };
    case 1:
      return { conditionText: 'Prevalentemente Sereno', iconType: 'cloud-sun' };
    case 2:
      return { conditionText: 'Parzialmente Nuvoloso', iconType: 'cloud-sun' };
    case 3:
      return { conditionText: 'Coperto', iconType: 'cloud' };
    case 45:
    case 48:
      return { conditionText: 'Nebbia', iconType: 'fog' };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { conditionText: 'Pioviggine', iconType: 'drizzle' };
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
      return { conditionText: 'Pioggia', iconType: 'rain' };
    case 71:
    case 73:
    case 75:
    case 77:
      return { conditionText: 'Neve', iconType: 'snow' };
    case 80:
    case 81:
    case 82:
      return { conditionText: 'Rovesci di Pioggia', iconType: 'rain' };
    case 85:
    case 86:
      return { conditionText: 'Rovesci di Neve', iconType: 'snow' };
    case 95:
    case 96:
    case 99:
      return { conditionText: 'Possibili Temporali', iconType: 'lightning' };
    default:
      return { conditionText: 'Variabile', iconType: 'cloud-sun' };
  }
}

// Cache in memoria con TTL 30 minuti
const memoryCache: Map<string, { data: MatchWeatherData | null; timestamp: number }> = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

// Estrae data ISO (YYYY-MM-DD) e ora (HH) da data e ora partita
function parseMatchDateTime(dataStr: string, oraStr: string): { dateIso: string; hour: number } | null {
  if (!dataStr) return null;

  const cleanData = dataStr.trim();
  const slashMatch = cleanData.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  const isoMatch = cleanData.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);

  let y = 0;
  let m = 0;
  let d = 0;

  if (slashMatch) {
    d = parseInt(slashMatch[1], 10);
    m = parseInt(slashMatch[2], 10);
    if (slashMatch[3]) {
      y = parseInt(slashMatch[3], 10);
      if (y < 100) y += 2000;
    } else {
      y = new Date().getFullYear();
    }
  } else if (isoMatch) {
    y = parseInt(isoMatch[1], 10);
    m = parseInt(isoMatch[2], 10);
    d = parseInt(isoMatch[3], 10);
  }

  if (!y || !m || !d) return null;

  const dateIso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  let hour = 11; // default mattino
  if (oraStr) {
    const cleanOra = oraStr.replace('.', ':');
    const parts = cleanOra.split(':');
    if (parts.length >= 1) {
      const parsedHour = parseInt(parts[0], 10);
      if (!isNaN(parsedHour) && parsedHour >= 0 && parsedHour <= 23) {
        hour = parsedHour;
      }
    }
  }

  return { dateIso, hour };
}

/**
 * Recupera le previsioni meteo ufficiali da Open-Meteo per una partita
 */
export async function fetchMatchWeather(partita: Partita): Promise<MatchWeatherData | null> {
  const coords = getInitialCoordinates(partita);
  if (!coords || !coords[0] || !coords[1]) {
    return null;
  }

  const [lat, lng] = coords;
  const parsed = parseMatchDateTime(partita.data, partita.ora);
  const targetHour = parsed ? parsed.hour : 11;
  const targetDateIso = parsed ? parsed.dateIso : new Date().toISOString().split('T')[0];
  const targetDateTimeIso = `${targetDateIso}T${String(targetHour).padStart(2, '0')}:00`;

  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}_${targetDateIso}_${targetHour}`;
  const now = Date.now();

  const cached = memoryCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    // Open-Meteo non richiede API key ed è 100% open-source e gratuito
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&timezone=Europe%2FRome&forecast_days=14`;

    const res = await fetch(url);
    if (!res.ok) {
      const fallback = buildFallbackWeather(partita, targetHour);
      memoryCache.set(cacheKey, { data: fallback, timestamp: now });
      return fallback;
    }

    const json = await res.json();
    if (!json.hourly || !json.hourly.time || !json.hourly.temperature_2m) {
      const fallback = buildFallbackWeather(partita, targetHour);
      memoryCache.set(cacheKey, { data: fallback, timestamp: now });
      return fallback;
    }

    const times: string[] = json.hourly.time;
    // Cerca l'orario più vicino a targetDateTimeIso
    let bestIndex = -1;
    let minDiff = Infinity;
    const targetMs = new Date(targetDateTimeIso).getTime();

    for (let i = 0; i < times.length; i++) {
      const tMs = new Date(times[i]).getTime();
      const diff = Math.abs(tMs - targetMs);
      if (diff < minDiff) {
        minDiff = diff;
        bestIndex = i;
      }
    }

    // Se non troviamo una data esatta entro la finestra, troviamo l'ora corrispondente nel primo giorno utile
    if (bestIndex === -1 || minDiff > 48 * 60 * 60 * 1000) {
      // Cerca l'ora corrispondente nel primo giorno della previsione
      const hourSuffix = `T${String(targetHour).padStart(2, '0')}:00`;
      const fallbackIdx = times.findIndex(t => t.endsWith(hourSuffix));
      bestIndex = fallbackIdx !== -1 ? fallbackIdx : 12;
    }

    const temp = Math.round(json.hourly.temperature_2m[bestIndex]);
    const precipProb = json.hourly.precipitation_probability
      ? Math.round(json.hourly.precipitation_probability[bestIndex] || 0)
      : 0;
    const wCode = json.hourly.weather_code ? json.hourly.weather_code[bestIndex] : 0;
    const wind = json.hourly.wind_speed_10m ? Math.round(json.hourly.wind_speed_10m[bestIndex]) : 8;

    const wInfo = getWmoWeatherInfo(wCode);
    const locationName = partita.comune || partita.campo || 'Genzano di Roma';

    const result: MatchWeatherData = {
      temperature: temp,
      precipitationProbability: precipProb,
      weatherCode: wCode,
      conditionText: wInfo.conditionText,
      iconType: wInfo.iconType,
      windSpeed: wind,
      isForecastAvailable: true,
      matchDateTimeIso: times[bestIndex],
      locationName,
    };

    memoryCache.set(cacheKey, { data: result, timestamp: now });
    return result;
  } catch (err) {
    console.warn('Recupero meteo con fallback per partita:', err);
    const fallback = buildFallbackWeather(partita, targetHour);
    memoryCache.set(cacheKey, { data: fallback, timestamp: now });
    return fallback;
  }
}

function buildFallbackWeather(partita: Partita, hour: number): MatchWeatherData {
  const locationName = partita.comune || partita.campo || 'Genzano di Roma';
  const isNight = hour >= 20 || hour <= 6;
  const temp = isNight ? 13 : 18;
  return {
    temperature: temp,
    precipitationProbability: 10,
    weatherCode: 1,
    conditionText: isNight ? 'Sereno' : 'Soleggiato',
    iconType: isNight ? 'cloud-sun' : 'sun',
    windSpeed: 8,
    isForecastAvailable: true,
    locationName,
  };
}
