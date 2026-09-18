import { Partita } from '../types';

export interface VenueLocation {
  id: string;
  campo: string;
  indirizzo: string;
  comune: string;
  tipo: string;
  lat: number;
  lng: number;
  lnkMaps: string;
  partite: Partita[];
  hasCynthiaCasa: boolean;
  hasCynthiaOspite: boolean;
}

// Coordinate pre-mappate per i principali campi e comuni (Lazio / Castelli Romani / Roma)
const KNOWN_VENUES: Record<string, [number, number]> = {
  // Genzano di Roma (Campi Cynthia)
  "citta dell'infiorata": [41.7052, 12.6947],
  "citta dell infiorata": [41.7052, 12.6947],
  "via sardegna": [41.7052, 12.6947],
  "genzano di roma": [41.7020, 12.6930],
  "genzano": [41.7020, 12.6930],
  
  // Ardea e Marina di Ardea
  "delio chimenti": [41.6062, 12.5458],
  "viale delle palme": [41.6062, 12.5458],
  "marina da ardea": [41.6062, 12.5458],
  "marina di ardea": [41.6062, 12.5458],
  "pineta dei liberti": [41.5971, 12.5645],
  "via delle pinete": [41.5971, 12.5645],
  "ardea": [41.6190, 12.5720],

  // Altri comuni Castelli Romani e limitrofi
  "ariccia": [41.7208, 12.6685],
  "albano laziale": [41.7285, 12.6590],
  "albano": [41.7285, 12.6590],
  "velletri": [41.6885, 12.7780],
  "giovanni scatena": [41.6885, 12.7780],
  "lanuvio": [41.6740, 12.7000],
  "marino": [41.7710, 12.6640],
  "frascati": [41.8080, 12.6810],
  "ciampino": [41.7990, 12.6020],
  "pomezia": [41.6710, 12.5020],
  "aprilia": [41.5930, 12.6510],
  "nettuno": [41.4580, 12.6620],
  "luigi goretti": [41.4580, 12.6620],
  "anzio": [41.4510, 12.6280],
  "latina": [41.4676, 12.9037],
  "roma": [41.9028, 12.4964],
};

const GEO_CACHE_KEY = 'cynthia_geo_cache_v1';

function getLocalGeoCache(): Record<string, [number, number]> {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function saveToLocalGeoCache(key: string, coords: [number, number]): void {
  try {
    const cache = getLocalGeoCache();
    cache[key.toLowerCase()] = coords;
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

/**
 * Estrae coordinate numeriche da una stringa o URL Google Maps
 */
export function extractCoordsFromUrl(url: string): [number, number] | null {
  if (!url) return null;

  // Pattern 1: @41.7052,12.6947
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidCoords(lat, lng)) return [lat, lng];
  }

  // Pattern 2: q=41.7052,12.6947 o ll=41.7052,12.6947 o query=41.7052,12.6947
  const qMatch = url.match(/[?&](?:q|ll|query|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (isValidCoords(lat, lng)) return [lat, lng];
  }

  return null;
}

function isValidCoords(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function normalizeKey(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcola una coordinata immediata e sincrona per una partita
 */
export function getInitialCoordinates(partita: Partita): [number, number] {
  // 1. Coordinate esplicite se presenti
  if (partita.lat && partita.lng && isValidCoords(partita.lat, partita.lng)) {
    return [partita.lat, partita.lng];
  }

  // 2. Estrazione da link Maps
  if (partita.lnkMaps) {
    const fromUrl = extractCoordsFromUrl(partita.lnkMaps);
    if (fromUrl) return fromUrl;
  }

  // 3. Cache locale
  const fullKey = normalizeKey(`${partita.campo} ${partita.indirizzo} ${partita.comune}`);
  const cache = getLocalGeoCache();
  if (cache[fullKey]) return cache[fullKey];

  // 4. Dizionario noto
  const campoKey = normalizeKey(partita.campo);
  const indKey = normalizeKey(partita.indirizzo);
  const comuneKey = normalizeKey(partita.comune);

  for (const [key, coords] of Object.entries(KNOWN_VENUES)) {
    const nKey = normalizeKey(key);
    if (
      campoKey.includes(nKey) ||
      nKey.includes(campoKey) ||
      indKey.includes(nKey) ||
      comuneKey.includes(nKey) ||
      fullKey.includes(nKey)
    ) {
      return coords;
    }
  }

  // 5. Fallback baricentro Genzano di Roma / Castelli Romani con leggero offset univoco
  const hash = Math.abs(hashString(partita.campo + partita.comune));
  const latOffset = ((hash % 100) - 50) * 0.0004;
  const lngOffset = (((hash >> 4) % 100) - 50) * 0.0004;
  return [41.7052 + latOffset, 12.6947 + lngOffset];
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Raggruppa le partite per campo/impianto sportivo
 */
export function groupPartiteByVenue(partite: Partita[]): VenueLocation[] {
  const venuesMap = new Map<string, VenueLocation>();

  partite.forEach(p => {
    // Chiave univoca per impianto: combinazione di campo e comune normalizzati
    const venueId = normalizeKey(`${p.campo} ${p.comune}`) || `venue-${p.id}`;

    if (!venuesMap.has(venueId)) {
      const coords = getInitialCoordinates(p);
      venuesMap.set(venueId, {
        id: venueId,
        campo: p.campo,
        indirizzo: p.indirizzo,
        comune: p.comune,
        tipo: p.tipo,
        lat: coords[0],
        lng: coords[1],
        lnkMaps: p.lnkMaps,
        partite: [p],
        hasCynthiaCasa: p.isCynthiaCasa,
        hasCynthiaOspite: p.isCynthiaOspite,
      });
    } else {
      const existing = venuesMap.get(venueId)!;
      existing.partite.push(p);
      if (p.isCynthiaCasa) existing.hasCynthiaCasa = true;
      if (p.isCynthiaOspite) existing.hasCynthiaOspite = true;
    }
  });

  return Array.from(venuesMap.values());
}

/**
 * Geocodifica asincrona opzionale tramite OpenStreetMap Nominatim per campi sconosciuti
 */
export async function geocodeVenueAsync(venue: VenueLocation): Promise<[number, number] | null> {
  const query = [venue.campo, venue.indirizzo, venue.comune, 'Italia']
    .filter(Boolean)
    .join(', ');
  const cacheKey = normalizeKey(query);

  const localCache = getLocalGeoCache();
  if (localCache[cacheKey]) {
    return localCache[cacheKey];
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (isValidCoords(lat, lng)) {
        saveToLocalGeoCache(cacheKey, [lat, lng]);
        return [lat, lng];
      }
    }
  } catch {
    // fallthrough silenzioso
  }
  return null;
}
