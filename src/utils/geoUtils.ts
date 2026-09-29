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
  // Genzano di Roma (Impianti Cynthia 1920 - Stadio Abbatini, Campo Città dell'Infiorata & Cynthia Training Center)
  "abbatini": [41.700778, 12.694471],
  "bruno abbatini": [41.700778, 12.694471],
  "abbatini bruno": [41.700778, 12.694471],
  "stadio comunale bruno abbatini": [41.700778, 12.694471],
  "stadio abbatini": [41.700778, 12.694471],
  "via emilia romagna": [41.700778, 12.694471],
  "citta dell'infiorata": [41.700778, 12.694471],
  "citta dell infiorata": [41.700778, 12.694471],
  "campo infiorata": [41.700778, 12.694471],
  "via sardegna": [41.700778, 12.694471],
  "cynthia training center": [41.6956705, 12.6816252],
  "montegiove": [41.6956705, 12.6816252],
  "via montegiove": [41.6956705, 12.6816252],
  "genzano di roma": [41.700778, 12.694471],
  "genzano": [41.700778, 12.694471],
  
  // Valmontone
  "stadio dei gelsi": [41.7754834, 12.9267102],
  "gelsi": [41.7754834, 12.9267102],
  "via casilina": [41.7754834, 12.9267102],
  "valmontone": [41.7754834, 12.9267102],

  // Aprilia
  "cima nuovo primavera": [41.6061061, 12.6329061],
  "primavera campus": [41.6061061, 12.6329061],
  "via delle valli": [41.6061061, 12.6329061],
  "aprilia": [41.6061061, 12.6329061],

  // Latina e Hellas Bainsizza
  "bruno parisotto": [41.4833441, 12.7903999],
  "parisotto": [41.4833441, 12.7903999],
  "strada del bosco": [41.4833441, 12.7903999],
  "bainsizza": [41.4833441, 12.7903999],
  "hellas bainsizza": [41.4833441, 12.7903999],

  // Ardea e Marina di Ardea
  "delio chimenti": [41.538753, 12.56332],
  "viale delle palme": [41.538753, 12.56332],
  "marina da ardea": [41.538753, 12.56332],
  "marina di ardea": [41.538753, 12.56332],
  "pineta dei liberti": [41.5487853, 12.5452808],
  "via delle pinete": [41.5487853, 12.5452808],
  "ardea": [41.5487853, 12.5452808],

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
  "nettuno": [41.4580, 12.6620],
  "luigi goretti": [41.4580, 12.6620],
  "anzio": [41.4510, 12.6280],
  "latina": [41.4676, 12.9037],
  "roma": [41.9028, 12.4964],
};

// Mappatura hash/ID link brevi Google Maps ai campi esatti (estratti dagli URL reali verificati)
export const KNOWN_URL_HASH_COORDS: Record<string, [number, number]> = {
  '1zobikpadjlkvwte7': [41.700778, 12.694471], // Stadio Bruno Abbatini (Via Emilia Romagna, Genzano)
  'k42yrqtfcqk8kgwba': [41.700778, 12.694471], // Campo Sintetico / Stadio B Città dell'Infiorata (Genzano)
  'vry5icq5xmxd2nlaa': [41.6956705, 12.6816252], // Cynthia Training Center (Via Montegiove 77, Genzano)
  'a3djkk6b93hkaaeu8': [41.7754834, 12.9267102], // Stadio dei Gelsi (Valmontone)
  '7kbhbjkgq5u8pu189': [41.6061061, 12.6329061], // Primavera Campus / Cima Nuovo Primavera (Aprilia)
  'qeeyngvgavqhpc3g9': [41.4833441, 12.7903999], // Bruno Parisotto / Atletico Bainsizza (Latina)
  'h7bqcfbrpiw5keuk7': [41.538753, 12.56332],  // Stadio Delio Chimenti (Marina di Ardea)
  'ksdpygk4ffypfckd6': [41.5487853, 12.5452808], // Impianti La Pineta dei Liberti (Ardea)
};

const GEO_CACHE_KEY = 'cynthia_geo_cache_v2';

// Pulizia cache obsoleta v1
try {
  localStorage.removeItem('cynthia_geo_cache_v1');
} catch {
  // ignore
}

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

  // Pattern 0: Shortlink ID noto (es. maps.app.goo.gl/1ZobikPADJLkVwte7)
  const lowerUrl = url.toLowerCase();
  for (const [id, coords] of Object.entries(KNOWN_URL_HASH_COORDS)) {
    if (lowerUrl.includes(id)) {
      return coords;
    }
  }

  // Pattern 1: @41.7052,12.6947
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidCoords(lat, lng)) return [lat, lng];
  }

  // Pattern 2: q=41.7052,12.6947 o ll=41.7052,12.6947 o destination=...
  const qMatch = url.match(/[?&](?:q|ll|query|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (isValidCoords(lat, lng)) return [lat, lng];
  }

  // Pattern 3: /search/41.700778,+12.694471 o /search/41.700778,12.694471
  const searchMatch = url.match(/search\/(-?\d+\.\d+),\+?(-?\d+\.\d+)/);
  if (searchMatch) {
    const lat = parseFloat(searchMatch[1]);
    const lng = parseFloat(searchMatch[2]);
    if (isValidCoords(lat, lng)) return [lat, lng];
  }

  // Pattern 4: !3d41.700368!4d12.6969293 (Google Maps internal string)
  const dataMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dataMatch) {
    const lat = parseFloat(dataMatch[1]);
    const lng = parseFloat(dataMatch[2]);
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

  // 3. Dizionario noto per campo o indirizzo (massima accuratezza prioritaria)
  const campoKey = normalizeKey(partita.campo);
  const indKey = normalizeKey(partita.indirizzo);
  const comuneKey = normalizeKey(partita.comune);
  const fullKey = normalizeKey(`${partita.campo} ${partita.indirizzo} ${partita.comune}`);

  for (const [key, coords] of Object.entries(KNOWN_VENUES)) {
    const nKey = normalizeKey(key);
    if (
      campoKey.includes(nKey) ||
      nKey.includes(campoKey) ||
      indKey.includes(nKey) ||
      fullKey.includes(nKey)
    ) {
      return coords;
    }
  }

  // 4. Cache locale
  const cache = getLocalGeoCache();
  if (cache[fullKey]) return cache[fullKey];

  // 5. Fallback sul comune noto
  for (const [key, coords] of Object.entries(KNOWN_VENUES)) {
    const nKey = normalizeKey(key);
    if (comuneKey.includes(nKey) || nKey.includes(comuneKey)) {
      return coords;
    }
  }

  // 6. Fallback baricentro Genzano di Roma (Stadio Cynthia 1920)
  return [41.700778, 12.694471];
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
      // Aggiorna lnkMaps se quello esistente non è valido o è generico e quello attuale è valido
      if (
        (!existing.lnkMaps || existing.lnkMaps === '#' || !existing.lnkMaps.startsWith('http')) &&
        p.lnkMaps &&
        p.lnkMaps.startsWith('http')
      ) {
        existing.lnkMaps = p.lnkMaps;
      }
      // Se la nuova partita ha coordinate esplicite più accurate
      if (p.lat && p.lng && isValidCoords(p.lat, p.lng)) {
        existing.lat = p.lat;
        existing.lng = p.lng;
      }
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

/**
 * Risolve un link Google Maps (anche se link breve maps.app.goo.gl)
 * ricavandone le coordinate esatte geografiche.
 */
export async function resolveMapLinkAsync(url: string): Promise<[number, number] | null> {
  if (!url || !url.startsWith('http')) return null;

  // 1. Prova estrazione sincrona immediata (hash noto o coordinate esplicite nell'URL)
  const syncCoords = extractCoordsFromUrl(url);
  if (syncCoords) return syncCoords;

  // 2. Prova cache locale
  const cacheKey = `map_res_${url.toLowerCase()}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}

  // 3. Risoluzione tramite proxy server Vite
  try {
    const res = await fetch(`/api/resolve-maps?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.coords && Array.isArray(data.coords) && data.coords.length === 2) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data.coords));
        } catch {}
        return data.coords as [number, number];
      }
    }
  } catch {}

  return null;
}
