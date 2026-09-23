import { GiocatoreConvocato, ConvocazioneConfig, Partita } from '../types';
import { buildCsvUrl, parseCSV } from './sheetService';
import { APP_CONFIG } from '../appConfig';

const CONVOCAZIONI_CONFIG_KEY = 'cynthia_convocazioni_config_v1';
const CONVOCAZIONI_PLAYERS_CACHE_KEY = 'cynthia_convocazioni_players_cache_v1';
const CONVOCAZIONI_STAFF_CACHE_KEY = 'cynthia_convocazioni_staff_cache_v1';
const CONVOCAZIONI_BY_MATCH_KEY = 'cynthia_convocazioni_by_match_v2';

export const DEFAULT_CONVOCAZIONI_SHEET_ID = '1Jl7i6oD8ip5eHVBMbsC1Qknx2gI-6zogCFNWK-WSUtM';
export const DEFAULT_CONVOCAZIONI_SHEET_URL =
  APP_CONFIG.defaultConvocazioniSheetUrl ||
  'https://docs.google.com/spreadsheets/d/1Jl7i6oD8ip5eHVBMbsC1Qknx2gI-6zogCFNWK-WSUtM/edit';

export const CYNTHIA_SOCIETA = [
  'CYNTHIA 1920',
  'ACADEMY CYNTHIA GENZANO',
  'ALBACYNTHIA',
] as const;

export type CynthiaSocieta = typeof CYNTHIA_SOCIETA[number];

const CONVOCAZIONI_MISTER_BY_MATCH_KEY = 'cynthia_mister_by_match_v1';

export interface CynthiaCoach {
  id: string;
  nome: string;
  titolo: string; // 'Mister' | 'Istruttore'
  societa: CynthiaSocieta;
  ruoloDescrizione: string;
  displayName: string;
}

/**
 * Riconosce i vecchi nomi fittizi per impedire che vengano usati o ripristinati dalla cache
 */
export function isInventedMisterName(name: string | null | undefined): boolean {
  if (!name) return false;
  const upper = name.toUpperCase().trim();
  if (
    upper === 'MISTER SIMONE CORRADINI' ||
    upper === 'SIMONE CORRADINI' ||
    upper === 'DA DEFINIRE' ||
    upper === 'DA ASSEGNARE'
  ) {
    return true;
  }
  return false;
}

/**
 * Elenco dei soli Mister ufficiali presenti nei dati effettivi caricati.
 * Mantenuto per retrocompatibilità di tipo; non include nomi inventati.
 */
export const OFFICIAL_CYNTHIA_COACHES: CynthiaCoach[] = [
  {
    id: 'c1920_ruotolo',
    nome: 'Ruotolo Giuseppe',
    titolo: 'Mister',
    societa: 'CYNTHIA 1920',
    ruoloDescrizione: 'Promozione',
    displayName: 'Mister Ruotolo Giuseppe',
  },
  {
    id: 'acad_carioti',
    nome: 'Carioti Marco',
    titolo: 'Mister',
    societa: 'ACADEMY CYNTHIA GENZANO',
    ruoloDescrizione: 'Under 14 Regionali',
    displayName: 'Mister Carioti Marco',
  },
];

/** Limite massimo ufficiale di calciatori convocabili per gara */
export const MAX_CONVOCATI_LIMIT = 25;

/**
 * Identifica quale delle tre società Cynthia (CYNTHIA 1920, ACADEMY CYNTHIA GENZANO, ALBACYNTHIA)
 * è coinvolta nella partita, indipendentemente dal fatto che giochi in casa o fuori casa.
 */
export function detectCynthiaClub(partita?: Partita | null): CynthiaSocieta {
  if (!partita) return 'CYNTHIA 1920';
  const casa = (partita.squadraCasa || '').toUpperCase();
  const ospite = (partita.squadraOspite || '').toUpperCase();
  const camp = (partita.campionato || '').toUpperCase();

  if (casa.includes('ALBACYNTHIA') || ospite.includes('ALBACYNTHIA') || camp.includes('ALBACYNTHIA')) {
    return 'ALBACYNTHIA';
  }
  if (casa.includes('ACADEMY') || ospite.includes('ACADEMY') || camp.includes('ACADEMY')) {
    return 'ACADEMY CYNTHIA GENZANO';
  }
  if (casa.includes('CYNTHIA') || ospite.includes('CYNTHIA')) {
    return 'CYNTHIA 1920';
  }
  return 'CYNTHIA 1920';
}

/**
 * Carica il mister salvato specificamente per una gara da localStorage.
 * Elimina automaticamente eventuali vecchi nomi fittizi.
 */
export function loadSavedMisterForMatch(matchId: string): string | null {
  try {
    const raw = localStorage.getItem(CONVOCAZIONI_MISTER_BY_MATCH_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      if (map && typeof map === 'object' && map[matchId]) {
        const val = String(map[matchId]).trim();
        if (isInventedMisterName(val)) {
          delete map[matchId];
          localStorage.setItem(CONVOCAZIONI_MISTER_BY_MATCH_KEY, JSON.stringify(map));
          return null;
        }
        return val;
      }
    }
  } catch (e) {
    console.warn('Errore lettura mister salvato per gara', e);
  }
  return null;
}

/**
 * Salva la personalizzazione manuale del mister per una specifica gara
 */
export function saveMisterForMatch(matchId: string, misterName: string): void {
  try {
    const raw = localStorage.getItem(CONVOCAZIONI_MISTER_BY_MATCH_KEY);
    const map = raw ? JSON.parse(raw) : {};
    if (misterName && misterName.trim()) {
      map[matchId] = misterName.trim();
    } else {
      delete map[matchId];
    }
    localStorage.setItem(CONVOCAZIONI_MISTER_BY_MATCH_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Errore salvataggio mister per gara', e);
  }
}

/**
 * Determina il mister per la gara selezionata.
 * Rispetta RIGOROSAMENTE il principio: carica SOLO i mister presenti nel file delle rose.
 * Nessun nome inventato viene restituito se la squadra non è presente nel file.
 */
export function resolveMisterForMatch(
  partita: Partita | null | undefined,
  campionatoCustom?: string,
  staffMap?: Record<string, string>
): string {
  const staff = staffMap || loadCachedStaff();
  const camp = (partita?.campionato || campionatoCustom || '').trim();
  const club = partita ? detectCynthiaClub(partita) : '';

  // 1. Prima cerca nel file delle rose (staffMap / cached staff)
  if (staff && Object.keys(staff).length > 0) {
    const staffKeys = Object.keys(staff);

    // A. Ricerca per corrispondenza diretta esatta (case insensitive)
    for (const key of staffKeys) {
      const mister = staff[key]?.trim();
      if (!mister || isInventedMisterName(mister)) continue;
      if (key.trim().toLowerCase() === camp.toLowerCase()) {
        return mister;
      }
    }

    // B. Se c'è una combinazione con la società (es. "Academy Cynthia Under 14" o "Cynthia Promozione")
    if (club) {
      for (const key of staffKeys) {
        const mister = staff[key]?.trim();
        if (!mister || isInventedMisterName(mister)) continue;
        const keyUp = key.toUpperCase();
        if (
          isCategoryMatch(key, camp) &&
          (keyUp.includes(club) || club.includes(keyUp) ||
           (club === 'CYNTHIA 1920' && !keyUp.includes('ACADEMY') && !keyUp.includes('ALBA')))
        ) {
          return mister;
        }
      }
    }

    // C. Ricerca flessibile tramite findMatchingCategory
    const matchedCat = findMatchingCategory(camp, staffKeys);
    if (matchedCat && staff[matchedCat]) {
      const mister = staff[matchedCat].trim();
      if (mister && !isInventedMisterName(mister)) {
        return mister;
      }
    }

    // D. Ricerca per isCategoryMatch
    for (const key of staffKeys) {
      const mister = staff[key]?.trim();
      if (!mister || isInventedMisterName(mister)) continue;
      if (isCategoryMatch(camp, key)) {
        return mister;
      }
    }
  }

  // 2. Se l'utente ha salvato un mister personalizzato non fittizio per questa specifica gara in precedenza
  if (partita && partita.id) {
    const saved = loadSavedMisterForMatch(partita.id);
    if (saved && saved.trim() && !isInventedMisterName(saved)) {
      return saved.trim();
    }
  }

  // 3. Se non c'è corrispondenza nel file delle rose, non inventare nessun mister!
  return '';
}

/** Staff di default: vuoto per rispettare rigorosamente il file delle rose */
export const DEFAULT_STAFF_BY_CATEGORY: Record<string, string> = {};

/** Giocatori di esempio di default: vuoto per non caricare squadre/giocatori assenti nel file */
export const DEFAULT_SAMPLE_PLAYERS: GiocatoreConvocato[] = [];

/**
 * Rimuove atleti duplicati e righe di intestazione involontarie preservando l'ordine
 */
export function deduplicateGiocatori(players: GiocatoreConvocato[]): GiocatoreConvocato[] {
  if (!players || !Array.isArray(players)) return [];
  const seen = new Set<string>();
  const result: GiocatoreConvocato[] = [];

  for (const p of players) {
    if (!p || !p.nome) continue;
    const cleanName = p.nome.trim().toUpperCase().replace(/\s+/g, ' ');
    if (!cleanName || cleanName.length < 2) continue;

    // Ignora intestazioni ripetute
    if (
      [
        'COGNOME E NOME', 'NOME E COGNOME', 'COGNOME NOME', 'NOME COGNOME',
        'NOMINATIVO', 'GIOCATORE', 'CALCIATORE', 'ATLETA', 'MISTER', 'ALLENATORE', 'SQUADRA', 'CATEGORIA'
      ].includes(cleanName)
    ) {
      continue;
    }

    const cleanCat = (p.categoria || '').trim().toUpperCase();
    const cleanSq = (p.squadra || '').trim().toUpperCase();
    const key = `${cleanName}__${cleanCat}__${cleanSq}`;

    if (!seen.has(key)) {
      seen.add(key);
      result.push(p);
    }
  }

  return result;
}

/**
 * Assicura che la lista atleti non contenga duplicati o intestazioni spurie.
 * Rispetta rigorosamente il file delle rose: nessuna iniezione di squadre o atleti non presenti nel file.
 */
export function ensureFullCynthiaRosters(players: GiocatoreConvocato[]): GiocatoreConvocato[] {
  if (!players || !Array.isArray(players) || players.length === 0) {
    return [];
  }
  return deduplicateGiocatori(players);
}

export function loadConvocazioniConfig(): ConvocazioneConfig {
  try {
    const raw = localStorage.getItem(CONVOCAZIONI_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.sheetUrl && parsed.sheetUrl.trim()) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Impossibile caricare configurazione convocazioni', e);
  }
  return {
    sheetUrl: DEFAULT_CONVOCAZIONI_SHEET_URL,
    tabName: APP_CONFIG.defaultConvocazioniTabName || '',
  };
}

export function saveConvocazioniConfig(config: ConvocazioneConfig): void {
  try {
    localStorage.setItem(CONVOCAZIONI_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Impossibile salvare configurazione convocazioni', e);
  }
}

export function loadCachedGiocatori(): GiocatoreConvocato[] {
  try {
    const raw = localStorage.getItem(CONVOCAZIONI_PLAYERS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Rimuove eventuali atleti fantoccio mock iniettati dalle vecchie versioni
        const realPlayers = parsed.filter(
          (p) => p && p.id && !p.id.startsWith('c1920_') && !p.id.startsWith('acad_') && !p.id.startsWith('alba_')
        );
        const toDedupe = realPlayers.length > 0 ? realPlayers : parsed.filter(p => p && p.id && !p.id.startsWith('c1920_') && !p.id.startsWith('alba_'));
        return deduplicateGiocatori(toDedupe);
      }
    }
  } catch (e) {
    console.warn('Impossibile caricare cache giocatori', e);
  }
  return [];
}

export function saveCachedGiocatori(players: GiocatoreConvocato[]): void {
  try {
    localStorage.setItem(CONVOCAZIONI_PLAYERS_CACHE_KEY, JSON.stringify(players));
  } catch (e) {
    console.warn('Impossibile salvare cache giocatori', e);
  }
}

export function loadCachedStaff(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CONVOCAZIONI_STAFF_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const clean: Record<string, string> = {};
        for (const [cat, mister] of Object.entries(parsed)) {
          if (mister && typeof mister === 'string' && !isInventedMisterName(mister)) {
            clean[cat] = mister.trim();
          }
        }
        return clean;
      }
    }
  } catch (e) {
    console.warn('Impossibile caricare cache staff', e);
  }
  return {};
}

export function saveCachedStaff(staff: Record<string, string>): void {
  try {
    const clean: Record<string, string> = {};
    for (const [cat, mister] of Object.entries(staff || {})) {
      if (mister && typeof mister === 'string' && !isInventedMisterName(mister)) {
        clean[cat] = mister.trim();
      }
    }
    localStorage.setItem(CONVOCAZIONI_STAFF_CACHE_KEY, JSON.stringify(clean));
  } catch (e) {
    console.warn('Impossibile salvare cache staff', e);
  }
}

/**
 * Carica la mappa di tutti i giocatori convocati memorizzati per gara da localStorage
 */
export function loadAllSavedConvocatiByMatch(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(CONVOCAZIONI_BY_MATCH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Impossibile caricare mappa convocati per gara', e);
  }
  return {};
}

/**
 * Carica gli ID dei giocatori spuntati per una specifica gara (ritorna null se la gara non è mai stata salvata)
 */
export function loadSavedConvocatiForMatch(matchId: string): string[] | null {
  if (!matchId) return null;
  const all = loadAllSavedConvocatiByMatch();
  if (Array.isArray(all[matchId])) {
    return all[matchId];
  }
  return null;
}

/**
 * Salva automaticamente in localStorage la lista degli ID dei giocatori spuntati per una specifica gara
 */
export function saveConvocatiForMatch(matchId: string, selectedPlayerIds: string[]): void {
  if (!matchId) return;
  try {
    const all = loadAllSavedConvocatiByMatch();
    all[matchId] = selectedPlayerIds;
    localStorage.setItem(CONVOCAZIONI_BY_MATCH_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn('Impossibile salvare convocati per gara', e);
  }
}

/**
 * Rimuove i dati di convocazione salvati per una specifica gara
 */
export function clearConvocatiForMatch(matchId: string): void {
  if (!matchId) return;
  try {
    const all = loadAllSavedConvocatiByMatch();
    delete all[matchId];
    localStorage.setItem(CONVOCAZIONI_BY_MATCH_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn('Impossibile eliminare convocati salvati per gara', e);
  }
}

/**
 * Calcola quante convocazioni precedenti ha ciascun giocatore nello storico salvato in localStorage.
 * excludeCurrentMatchId permette di escludere la partita attualmente aperta,
 * in modo da contare quante volte il giocatore è stato convocato in altre gare salvate.
 */
export function getConvocazioniHistoryStats(excludeCurrentMatchId?: string): Record<string, number> {
  const all = loadAllSavedConvocatiByMatch();
  const counts: Record<string, number> = {};
  for (const [matchId, playerIds] of Object.entries(all)) {
    if (excludeCurrentMatchId && matchId === excludeCurrentMatchId) continue;
    if (Array.isArray(playerIds)) {
      for (const pId of playerIds) {
        counts[pId] = (counts[pId] || 0) + 1;
      }
    }
  }
  return counts;
}

export interface PlayerHistoryInfo {
  count: number;
  hasPreviousConvocazione: boolean;
}

/**
 * Restituisce le statistiche di presenza storica per un giocatore
 */
export function getPlayerHistoricalConvocazioni(
  playerId: string,
  excludeCurrentMatchId?: string
): PlayerHistoryInfo {
  const stats = getConvocazioniHistoryStats(excludeCurrentMatchId);
  const count = stats[playerId] || 0;
  return {
    count,
    hasPreviousConvocazione: count > 0,
  };
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Confronta in modo flessibile due categorie (es. "Under 19" e "JUNIORES U19", "UNDER14PROV" e "Under 14")
 */
export function isCategoryMatch(catA: string, catB: string): boolean {
  if (!catA || !catB) return false;
  const a = catA.trim().toUpperCase();
  const b = catB.trim().toUpperCase();
  if (a === b) return true;

  const cleanA = a.replace(/[^A-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanB = b.replace(/[^A-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;

  // Estrae numeri di categoria (19, 18, 17, 16, 15, 14, 13, 12, 11, 10, ecc.)
  // anche se attaccati a stringhe composte come UNDER14PROV, U15ELITE, UNDER16
  const extractCatNumbers = (str: string): string[] => {
    const matches = str.match(/(?:19|18|17|16|15|14|13|12|11|10|201[0-9]|202[0-9])/g);
    return matches ? Array.from(new Set(matches)) : [];
  };

  const numsA = extractCatNumbers(cleanA);
  const numsB = extractCatNumbers(cleanB);
  if (numsA.length > 0 && numsB.length > 0) {
    if (numsA.some((num) => numsB.includes(num))) {
      return true;
    }
  }

  // Promozione / Prima squadra
  const isPromoA = cleanA.includes('PROMOZIONE') || cleanA.includes('PRIMA') || cleanA.includes('SERIE D') || cleanA.includes('ECCELLENZA');
  const isPromoB = cleanB.includes('PROMOZIONE') || cleanB.includes('PRIMA') || cleanB.includes('SERIE D') || cleanB.includes('ECCELLENZA');
  if (isPromoA && isPromoB) return true;

  return false;
}

/**
 * Trova quale categoria della rosa corrisponde al campionato della gara
 */
export function findMatchingCategory(
  matchCampionato: string,
  availableCategories: string[]
): string | null {
  if (!matchCampionato || !availableCategories || availableCategories.length === 0) return null;

  // 1. Corrispondenza diretta / numerica
  for (const cat of availableCategories) {
    if (isCategoryMatch(matchCampionato, cat)) {
      return cat;
    }
  }

  // 2. Corrispondenza per parole chiave note nel calcio dilettantistico
  const normMatch = matchCampionato.toUpperCase();

  if (
    normMatch.includes('PROMOZIONE') ||
    normMatch.includes('SERIE D') ||
    normMatch.includes('PRIMA') ||
    normMatch.includes('ECCELLENZA')
  ) {
    const found = availableCategories.find(c => {
      const up = c.toUpperCase();
      return (
        up.includes('PROMOZIONE') ||
        up.includes('PRIMA') ||
        up.includes('SERIE D') ||
        up.includes('ECCELLENZA')
      );
    });
    if (found) return found;
  }

  if (normMatch.includes('19') || normMatch.includes('JUNIORES')) {
    const found = availableCategories.find(c => c.toUpperCase().includes('19') || c.toUpperCase().includes('JUNIORES'));
    if (found) return found;
  }

  if (normMatch.includes('18')) {
    const found = availableCategories.find(c => c.toUpperCase().includes('18'));
    if (found) return found;
  }

  if (normMatch.includes('17') || normMatch.includes('ALLIEVI')) {
    const found = availableCategories.find(c => c.toUpperCase().includes('17') || c.toUpperCase().includes('ALLIEVI'));
    if (found) return found;
  }

  if (normMatch.includes('16')) {
    const found = availableCategories.find(c => c.toUpperCase().includes('16'));
    if (found) return found;
  }

  if (normMatch.includes('15') || normMatch.includes('GIOVANISSIMI')) {
    const found = availableCategories.find(c => c.toUpperCase().includes('15') || c.toUpperCase().includes('GIOVANISSIMI'));
    if (found) return found;
  }

  if (normMatch.includes('14')) {
    const found = availableCategories.find(c => c.toUpperCase().includes('14'));
    if (found) return found;
  }

  if (normMatch.includes('13')) {
    const found = availableCategories.find(c => c.toUpperCase().includes('13'));
    if (found) return found;
  }

  if (normMatch.includes('ESORDIENTI')) {
    const found = availableCategories.find(c => c.toUpperCase().includes('ESORDIENTI'));
    if (found) return found;
  }

  if (normMatch.includes('PULCINI')) {
    const found = availableCategories.find(c => c.toUpperCase().includes('PULCINI'));
    if (found) return found;
  }

  return null;
}

export interface ParsedSheetConvocazioni {
  giocatori: GiocatoreConvocato[];
  staffByCategoria: Record<string, string>;
  availableCategories: string[];
}

export function formatMisterDisplayName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^(mister|all\.|allenatore|istruttore|tecnico)\s+/i.test(trimmed)) {
    return trimmed;
  }
  const titleCase = trimmed
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return `Mister ${titleCase}`;
}

/**
 * Scarica e analizza l'elenco dei giocatori e dello staff da un foglio Google o CSV.
 * Se non ci sono squadre o giocatori nel file delle rose, non carica nulla.
 */
export async function fetchGiocatoriFromSheet(
  sheetUrlOrId: string,
  tabName?: string
): Promise<ParsedSheetConvocazioni> {
  const target = (sheetUrlOrId || '').trim();
  if (!target) {
    throw new Error('Specificare l\'URL o l\'ID del foglio Google.');
  }

  const rawCsvUrl = buildCsvUrl(target, tabName);
  const cacheBuster = `_cb=${Date.now()}`;
  const csvUrl = rawCsvUrl.includes('?') ? `${rawCsvUrl}&${cacheBuster}` : `${rawCsvUrl}?${cacheBuster}`;

  const response = await fetch(csvUrl, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'text/csv, text/plain, */*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`Errore HTTP ${response.status}: Impossibile scaricare il foglio.`);
  }

  const csvText = await response.text();

  if (
    csvText.includes('<!DOCTYPE html') ||
    csvText.includes('<html') ||
    csvText.includes('Sign in to your Google Account') ||
    csvText.includes('accounts.google.com')
  ) {
    throw new Error(
      'Il foglio Google richiede l\'accesso con account. Assicurati che sia condiviso come "Chiunque abbia il link può visualizzare" oppure "Pubblica sul web" in formato CSV.'
    );
  }

  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return { giocatori: [], staffByCategoria: {}, availableCategories: [] };
  }

  return parseCsvConvocazioni(rows);
}

/**
 * Mappa flessibile delle righe CSV nell'elenco GiocatoreConvocato e Staff per Categoria.
 * Rispetta rigorosamente i contenuti del file: non inietta squadre o atleti non presenti.
 */
export function parseCsvConvocazioni(rows: string[][]): ParsedSheetConvocazioni {
  if (!rows || rows.length === 0) {
    return { giocatori: [], staffByCategoria: {}, availableCategories: [] };
  }

  const firstRow = rows[0];
  const normalizedFirst = firstRow.map(c => normalizeHeader(c));

  const hasHeaderKeywords = normalizedFirst.some(h =>
    [
      'giocatore', 'nominativo', 'nome', 'cognome', 'atleta', 'calciatore',
      'ruolo', 'numero', 'maglia', 'categoria', 'squadra', 'convocato', 'mister', 'allenatore',
      'anno', 'nascita', 'leva', 'nato', 'annata'
    ].some(k => h.includes(k))
  );

  let dataRows: string[][] = [];
  let idxNome = -1;
  let idxCognome = -1;
  let idxRuolo = -1;
  let idxNumero = -1;
  let idxCategoria = -1;
  let idxAnnoNascita = -1;
  let idxConvocato = -1;
  let idxNote = -1;
  let idxMister = -1;
  let idxSquadra = -1;

  if (hasHeaderKeywords) {
    dataRows = rows.slice(1);

    // Rileva colonna Squadra / Categoria
    idxCategoria = normalizedFirst.findIndex(h =>
      ['squadra', 'categoria', 'cat', 'gruppo', 'team'].some(k => h === k || h.includes(k))
    );

    // Rileva colonna distinta per Società / Club (se diversa da Squadra/Categoria)
    const distinctSocietaIdx = normalizedFirst.findIndex((h, idx) =>
      idx !== idxCategoria &&
      ['societa', 'club', 'entita', 'polisportiva'].some(k => h === k || h.includes(k))
    );
    if (distinctSocietaIdx !== -1) {
      idxSquadra = distinctSocietaIdx;
    }

    // Rileva colonna Anno di Nascita / Annata / Leva / Data di nascita
    idxAnnoNascita = normalizedFirst.findIndex((h, idx) =>
      idx !== idxCategoria &&
      [
        'annodinascita', 'annonascita', 'datanascita', 'datadinascita',
        'nascita', 'annata', 'anno', 'leva', 'nato', 'dob', 'birthyear'
      ].some(k => h === k || h.includes(k))
    );

    // Rileva colonna Mister / Allenatore
    idxMister = normalizedFirst.findIndex(h =>
      ['mister', 'allenatore', 'tecnico', 'coach', 'staff'].some(k => h === k || h.includes(k))
    );

    // Rileva se c'è una colonna esplicita con "Cognome e Nome" o "Nominativo"
    const idxFullNameExplicit = normalizedFirst.findIndex(h =>
      ['cognome e nome', 'nome e cognome', 'cognome nome', 'nome cognome', 'nominativo', 'giocatore', 'atleta', 'calciatore'].some(k => h === k || h.includes(k))
    );

    // Rileva colonne separate Cognome e Nome
    const idxCognomeOnly = normalizedFirst.findIndex((h, idx) =>
      idx !== idxFullNameExplicit && (h === 'cognome' || h.startsWith('cognome'))
    );
    const idxNomeOnly = normalizedFirst.findIndex((h, idx) =>
      idx !== idxFullNameExplicit && (h === 'nome' || h.startsWith('nome'))
    );

    if (idxCognomeOnly !== -1 && idxNomeOnly !== -1) {
      idxCognome = idxCognomeOnly;
      idxNome = idxNomeOnly;
    } else if (idxFullNameExplicit !== -1) {
      idxNome = idxFullNameExplicit;
      idxCognome = -1;
    } else {
      // Fallback
      idxNome = normalizedFirst.findIndex(h => h.includes('nome') || h.includes('giocatore'));
      idxCognome = normalizedFirst.findIndex(h => h.includes('cognome') && h !== normalizedFirst[idxNome]);
    }

    // Colonne opzionali
    idxRuolo = normalizedFirst.findIndex(h =>
      ['ruolo', 'pos', 'posizione', 'role'].some(k => h.includes(k)) || h === 'r'
    );
    idxNumero = normalizedFirst.findIndex(h =>
      ['numero', 'maglia', 'dorsale'].some(k => h.includes(k)) || ['num', 'n', 'nr', 'no'].includes(h)
    );
    idxConvocato = normalizedFirst.findIndex(h =>
      ['convocato', 'convocati', 'presenza', 'stato', 'status'].some(k => h.includes(k))
    );
    idxNote = normalizedFirst.findIndex(h =>
      ['note', 'annotazioni', 'dettagli'].some(k => h.includes(k))
    );
  } else {
    dataRows = rows;
    idxNome = 0;
    if (firstRow.length > 1) {
      if (firstRow[1].length <= 3 && !isNaN(Number(firstRow[1]))) {
        idxNumero = 1;
      } else if (firstRow[1].length <= 3) {
        idxRuolo = 1;
      }
    }
  }

  const giocatori: GiocatoreConvocato[] = [];
  const staffByCategoria: Record<string, string> = {};
  const categoriesSet = new Set<string>();
  const seenPlayerKeys = new Set<string>();

  dataRows.forEach((row) => {
    if (!row || row.length === 0) return;

    let fullName = '';
    if (idxCognome !== -1 && idxNome !== -1 && idxCognome !== idxNome) {
      const cog = (row[idxCognome] || '').trim();
      const nom = (row[idxNome] || '').trim();
      fullName = `${cog} ${nom}`.trim();
    } else if (idxNome !== -1) {
      fullName = (row[idxNome] || '').trim();
    } else {
      fullName = (row[0] || '').trim();
    }

    if (!fullName || fullName.length < 2) return;

    const upperName = fullName.toUpperCase();
    // Salta righe di intestazione ripetute all'interno dei dati
    if (
      [
        'COGNOME E NOME', 'NOME E COGNOME', 'COGNOME NOME', 'NOME COGNOME',
        'NOMINATIVO', 'GIOCATORE', 'CALCIATORE', 'ATLETA', 'MISTER', 'ALLENATORE', 'SQUADRA', 'CATEGORIA'
      ].includes(upperName)
    ) {
      return;
    }

    // Estrazione ruolo ed eventuale indicazione portiere presente nel nome (es. "(P)", "(gk)", "🧤")
    let ruolo = idxRuolo !== -1 ? (row[idxRuolo] || '').trim() : '';
    if (!ruolo) {
      if (/\((?:P|p|GK|gk|portiere)\)/i.test(fullName) || /[🧤🥅]/.test(fullName)) {
        ruolo = 'P';
      }
    }
    // Pulisce il nome dell'atleta rimuovendo suffissi di ruolo come "(P)" o emoji per una visualizzazione pulita
    const cleanFullName = fullName
      .replace(/\s*\((?:P|p|GK|gk|portiere)\)\s*/gi, ' ')
      .replace(/[🧤🥅]/g, '')
      .trim();

    const numero = idxNumero !== -1 ? (row[idxNumero] || '').trim() : '';
    const rawCategoria = idxCategoria !== -1 ? (row[idxCategoria] || '').trim() : '';
    const categoria = rawCategoria || 'Prima Squadra';

    // Estrazione Anno di Nascita (es. "2008", "2010", "08", "15/04/2008")
    let annoNascita = idxAnnoNascita !== -1 ? (row[idxAnnoNascita] || '').trim() : '';
    if (annoNascita) {
      // Se è una data completa GG/MM/AAAA estrae l'anno, altrimenti pulisce il valore numerico
      const matchYear = annoNascita.match(/\b(19\d{2}|20\d{2})\b/);
      if (matchYear) {
        annoNascita = matchYear[1];
      } else {
        // Se è es. '08 o 08 o 2008
        const cleanDigits = annoNascita.replace(/[^0-9]/g, '');
        if (cleanDigits.length === 2) {
          const num = parseInt(cleanDigits, 10);
          annoNascita = num > 50 ? `19${cleanDigits}` : `20${cleanDigits}`;
        } else if (cleanDigits.length === 4) {
          annoNascita = cleanDigits;
        }
      }
    }

    const stato = idxConvocato !== -1 ? (row[idxConvocato] || '').trim().toLowerCase() : '';
    const note = idxNote !== -1 ? (row[idxNote] || '').trim() : '';
    const misterCell = idxMister !== -1 ? (row[idxMister] || '').trim() : '';

    let squadra = idxSquadra !== -1 ? (row[idxSquadra] || '').trim() : '';
    if (!squadra) {
      const combined = `${categoria} ${cleanFullName}`.toUpperCase();
      if (combined.includes('ALBA')) {
        squadra = 'ALBACYNTHIA';
      } else if (combined.includes('ACADEMY')) {
        squadra = 'ACADEMY CYNTHIA GENZANO';
      } else if (
        combined.includes('PROMOZIONE') ||
        combined.includes('PRIMA SQUADRA') ||
        combined.includes('JUNIORES') ||
        combined.includes('19') ||
        combined.includes('18')
      ) {
        squadra = 'CYNTHIA 1920';
      } else if (
        combined.includes('17') ||
        combined.includes('16') ||
        combined.includes('15') ||
        combined.includes('14') ||
        combined.includes('13') ||
        combined.includes('ESORDIENTI') ||
        combined.includes('PULCINI')
      ) {
        squadra = 'ACADEMY CYNTHIA GENZANO';
      } else {
        squadra = 'CYNTHIA 1920';
      }
    }

    if (categoria) {
      categoriesSet.add(categoria);
    }

    // Se c'è una colonna Mister esplicita e valorizzata per la categoria
    if (misterCell && categoria) {
      staffByCategoria[categoria] = formatMisterDisplayName(misterCell);
    }

    // Se la riga rappresenta direttamente un allenatore/mister (Ruolo = Mister / Allenatore)
    const normRuolo = (ruolo || '').toLowerCase();
    if (normRuolo.includes('mister') || normRuolo.includes('allenatore') || normRuolo.includes('tecnico')) {
      staffByCategoria[categoria] = formatMisterDisplayName(cleanFullName);
      return; // Non inserire come calciatore
    }

    // Deduplicazione: evita atleti duplicati con lo stesso nome nella stessa categoria
    const dedupeKey = `${cleanFullName.toUpperCase()}__${categoria.toUpperCase()}__${squadra.toUpperCase()}`;
    if (seenPlayerKeys.has(dedupeKey)) {
      return;
    }
    seenPlayerKeys.add(dedupeKey);

    // ID univoco deterministico
    const normName = cleanFullName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const normCat = categoria.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const playerId = `p_${normCat}_${normName}`;

    // Determinazione stato convocazione di default (deselezionati per default)
    let selezionato = false;
    if (stato) {
      if (['si', 'sì', 'yes', 'convocato', 'true', '1', 'titolare', 'panchina'].includes(stato)) {
        selezionato = true;
      }
    }

    giocatori.push({
      id: playerId,
      nome: cleanFullName,
      ruolo: ruolo || undefined,
      numero: numero || undefined,
      categoria: categoria,
      squadra: squadra || undefined,
      annoNascita: annoNascita || undefined,
      selezionato,
      note: note || (stato && !selezionato ? stato.toUpperCase() : undefined),
    });
  });

  return {
    giocatori,
    staffByCategoria,
    availableCategories: Array.from(categoriesSet),
  };
}

// Retrocompatibilità
export function mapCsvToGiocatori(rows: string[][]): GiocatoreConvocato[] {
  return parseCsvConvocazioni(rows).giocatori;
}

export interface WhatsAppMessageParams {
  partita?: Partita | null;
  categoriaCustom?: string;
  squadraCasaCustom?: string;
  squadraOspiteCustom?: string;
  dataGaraCustom?: string;
  oraGaraCustom?: string;
  oraRitrovo?: string;
  campoCustom?: string;
  indirizzoCustom?: string;
  linkMapsCustom?: string;
  noteMister?: string;
  misterName?: string;
  giocatori: GiocatoreConvocato[];
  targetCategoria?: string; // Squadra di riferimento della gara
}

export function calculateRitrovoTimeOnly(oraGara: string, minutesBefore: number = 90): string {
  if (!oraGara) return '14:00';
  const clean = oraGara.trim().toLowerCase().replace('ore', '').trim();
  const match = clean.match(/(\d{1,2})[:.](\d{2})/);
  let h = NaN;
  let m = 0;
  if (match) {
    h = parseInt(match[1], 10);
    m = parseInt(match[2], 10);
  } else {
    const singleHour = clean.match(/^(\d{1,2})$/);
    if (singleHour) {
      h = parseInt(singleHour[1], 10);
      m = 0;
    }
  }
  if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
    return '14:00';
  }
  let ritrovoMinutes = h * 60 + m - minutesBefore;
  if (ritrovoMinutes < 0) ritrovoMinutes += 24 * 60;
  const rh = Math.floor(ritrovoMinutes / 60);
  const rm = ritrovoMinutes % 60;
  return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`;
}

export function extractTimeFromRitrovo(ritrovo: string): string {
  if (!ritrovo) return '14:00';
  const match = ritrovo.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '14:00';
}

export function calculateRitrovoFromOraGara(oraGara: string, minutesBefore: number = 90): string {
  const timeOnly = calculateRitrovoTimeOnly(oraGara, minutesBefore);
  return `${timeOnly} PRESSO IL CAMPO DI GIUOCO`;
}

export function buildWhatsAppConvocazioniMessage(params: WhatsAppMessageParams): string {
  const {
    partita,
    categoriaCustom,
    squadraCasaCustom,
    squadraOspiteCustom,
    dataGaraCustom,
    oraGaraCustom,
    oraRitrovo,
    campoCustom,
    indirizzoCustom,
    linkMapsCustom,
    noteMister,
    misterName,
    giocatori,
    targetCategoria,
  } = params;

  const categoria = (categoriaCustom || partita?.campionato || 'GARA UFFICIALE').trim().toUpperCase();
  const girone = partita?.girone && partita.girone !== '-' ? `(GIRONE ${partita.girone.trim().toUpperCase()})` : '';
  const gara = partita?.gara ? partita.gara.trim().toUpperCase() : '';
  const casa = (squadraCasaCustom || partita?.squadraCasa || 'ASD CYNTHIA 1920').trim().toUpperCase();
  const ospite = (squadraOspiteCustom || partita?.squadraOspite || 'AVVERSARIO').trim().toUpperCase();
  const dataGara = (dataGaraCustom || partita?.data || '').trim().toUpperCase();
  const oraGara = (oraGaraCustom || partita?.ora || '').trim().toUpperCase();
  const campo = (campoCustom || (partita ? `${partita.campo || ''}${partita.tipo ? ` (${partita.tipo})` : ''}` : '')).trim().toUpperCase();
  const indirizzo = (indirizzoCustom || (partita ? [partita.indirizzo, partita.comune].filter(Boolean).join(', ') : '')).trim().toUpperCase();
  const lnkMaps = linkMapsCustom || (partita?.lnkMaps && partita.lnkMaps !== '#' ? partita.lnkMaps : '');

  const convocati = giocatori.filter(g => g.selezionato);

  // 1. Intestazione ufficiale
  let msg = `📋 *CONVOCAZIONE UFFICIALE*\n\n`;

  // 2. Campionato e Partita
  const campTitle = [categoria, girone].filter(Boolean).join(' ');
  msg += `🏆 *CAMPIONATO*: ${campTitle}${gara ? ` [Gara: ${gara}]` : ''}\n`;
  msg += `⚔️ *PARTITA*: ${casa} vs ${ospite}\n`;

  if (dataGara || oraGara) {
    msg += `📅 *DATA E ORA*: ${dataGara}${oraGara ? ` • ORE ${oraGara}` : ''}\n`;
  }

  // 3. Riga Ritrovo: orario calcolato (90 min prima) e luogo
  if (oraRitrovo && oraRitrovo.trim()) {
    let cleanRitrovo = oraRitrovo.trim().toUpperCase();
    if (!cleanRitrovo.startsWith('ORE ') && !cleanRitrovo.startsWith('ORE:')) {
      cleanRitrovo = `ORE ${cleanRitrovo}`;
    }
    msg += `⏰ *RITROVO*: ${cleanRitrovo}\n`;
  }

  if (campo) {
    msg += `📍 *CAMPO*: ${campo}\n`;
  }
  if (indirizzo) {
    msg += `🏠 *INDIRIZZO*: ${indirizzo}\n`;
  }
  if (lnkMaps && lnkMaps.trim() && lnkMaps !== '#') {
    msg += `🗺️ *MAPPA*: ${lnkMaps.trim()}\n`;
  }

  // 4. Giocatori convocati: togliere il conteggio e mettere solo punto elenco, tutto maiuscolo
  msg += `\n👥 *GIOCATORI CONVOCATI*:\n`;

  if (convocati.length === 0) {
    msg += `_NESSUN ATLETA SELEZIONATO_\n`;
  } else {
    convocati.forEach((g) => {
      const nomeUpper = g.nome.trim().toUpperCase();
      let line = `• *${nomeUpper}*`;
      const extras: string[] = [];

      // Se il giocatore proviene da un'altra categoria rispetto a quella della gara
      const isAggregato =
        targetCategoria &&
        g.categoria &&
        !isCategoryMatch(g.categoria, targetCategoria);

      if (isAggregato) {
        extras.push(`PRESTITO ${g.categoria.trim().toUpperCase()}`);
      }

      if (extras.length > 0) {
        line += ` (${extras.join(' - ')})`;
      }
      if (g.note && g.note.trim()) {
        line += ` [${g.note.trim().toUpperCase()}]`;
      }
      msg += `${line}\n`;
    });
  }

  if (noteMister && noteMister.trim()) {
    msg += `\n📌 *INDICAZIONI & NOTE*:\n${noteMister.trim().toUpperCase()}\n`;
  }

  // 5. Lascia solo la parola MISTER e togli Staff
  if (misterName && misterName.trim()) {
    let cleanMister = misterName.trim().toUpperCase();
    if (cleanMister.startsWith('MISTER ')) {
      cleanMister = cleanMister.substring(7).trim();
    } else if (cleanMister.startsWith('MISTER:')) {
      cleanMister = cleanMister.substring(7).trim();
    }
    msg += `\n👤 *MISTER*: ${cleanMister}\n`;
  }

  msg += `\n🔵⚪ *FORZA CYNTHIA!*`;

  return msg;
}

/**
 * Apre WhatsApp o l'interfaccia di condivisione nativa
 */
export function shareOnWhatsApp(text: string): void {
  const encoded = encodeURIComponent(text);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(whatsappUrl, '_blank');
}
