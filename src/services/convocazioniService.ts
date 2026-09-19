import { GiocatoreConvocato, ConvocazioneConfig, Partita } from '../types';
import { buildCsvUrl, parseCSV } from './sheetService';
import { APP_CONFIG } from '../appConfig';

const CONVOCAZIONI_CONFIG_KEY = 'cynthia_convocazioni_config_v1';
const CONVOCAZIONI_PLAYERS_CACHE_KEY = 'cynthia_convocazioni_players_cache_v1';
const CONVOCAZIONI_STAFF_CACHE_KEY = 'cynthia_convocazioni_staff_cache_v1';

export const DEFAULT_CONVOCAZIONI_SHEET_ID = '1Jl7i6oD8ip5eHVBMbsC1Qknx2gI-6zogCFNWK-WSUtM';
export const DEFAULT_CONVOCAZIONI_SHEET_URL =
  APP_CONFIG.defaultConvocazioniSheetUrl ||
  'https://docs.google.com/spreadsheets/d/1Jl7i6oD8ip5eHVBMbsC1Qknx2gI-6zogCFNWK-WSUtM/edit';

export const DEFAULT_STAFF_BY_CATEGORY: Record<string, string> = {
  'PROMOZIONE': 'Mister Ruotolo Giuseppe',
  'Promozione': 'Mister Ruotolo Giuseppe',
  'Prima Squadra': 'Mister Ruotolo Giuseppe',
  'Under 19': 'Mister Simone Corradini',
  'Under 17': 'Mister Alessandro Conti',
  'Under 15': 'Mister Roberto Vichi',
  'Under 14': 'Mister Marco Ferri',
  'Esordienti': 'Istruttore Andrea Galli',
};

export const DEFAULT_SAMPLE_PLAYERS: GiocatoreConvocato[] = [
  // --- PROMOZIONE / PRIMA SQUADRA (Mister Ruotolo Giuseppe - da Foglio Google Ufficiale) ---
  { id: 'prom_1', nome: 'Amore Bonapasta Flavio', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_2', nome: 'Barone Thomas', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_3', nome: 'Battisti Lorenzo', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_4', nome: 'Bianchi Simone', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_5', nome: 'Borelli Simone', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_6', nome: 'Campoli Diego', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_7', nome: 'Ciavaldini Tiziano', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_8', nome: 'Colagrossi Matteo', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_9', nome: 'De Angelis Tiago (gk)🧤', ruolo: 'P', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_10', nome: 'De Bonis Matteo', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_11', nome: 'Di Felice Alessandro', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_12', nome: 'Drogheo Filippo', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_13', nome: 'Evangelisti Andrea', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_14', nome: 'Fabbri Valerio', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_15', nome: 'Friscioni Leonardo', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_16', nome: 'Laudati Francesco', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_17', nome: 'Leo Alessandro', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_18', nome: 'Lucidi Federico', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_19', nome: 'Mancini Gabriele', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_20', nome: 'Melaranci Roberto (gk)🧤', ruolo: 'P', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_21', nome: 'Mirimich Alessandro', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_22', nome: 'Palumbo Christian', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_23', nome: 'Persia Nicolo', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_24', nome: 'Ruotolo Luigi', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_25', nome: 'Sambucini Lorenzo', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_26', nome: 'Sirignano Ciro Oreste', categoria: 'PROMOZIONE', selezionato: false },
  { id: 'prom_27', nome: 'Di Costanzo Antonio', categoria: 'PROMOZIONE', selezionato: false },

  // --- UNDER 19 (Mister Simone Corradini) ---
  { id: 'u19_1', nome: 'Testa Mattia', ruolo: 'P', numero: '1', categoria: 'Under 19', selezionato: false },
  { id: 'u19_2', nome: 'Rossi Christian', ruolo: 'D', numero: '2', categoria: 'Under 19', selezionato: false },
  { id: 'u19_3', nome: 'D\'Amico Tommaso', ruolo: 'D', numero: '3', categoria: 'Under 19', selezionato: false },
  { id: 'u19_4', nome: 'Bernardi Luca', ruolo: 'C', numero: '4', categoria: 'Under 19', selezionato: false },
  { id: 'u19_5', nome: 'Costantini Matteo', ruolo: 'C', numero: '8', categoria: 'Under 19', selezionato: false },
  { id: 'u19_6', nome: 'Carbone Samuele', ruolo: 'A', numero: '9', categoria: 'Under 19', selezionato: false },
  { id: 'u19_7', nome: 'Santoro Jacopo', ruolo: 'A', numero: '11', categoria: 'Under 19', selezionato: false },
  { id: 'u19_8', nome: 'Marchetti Leonardo', ruolo: 'D', numero: '13', categoria: 'Under 19', selezionato: false },
  { id: 'u19_9', nome: 'Rinaldi Mattia', ruolo: 'C', numero: '14', categoria: 'Under 19', selezionato: false },
  { id: 'u19_10', nome: 'Fiorini Andrea', ruolo: 'A', numero: '18', categoria: 'Under 19', selezionato: false, note: 'Diffidato' },

  // --- UNDER 17 (Mister Alessandro Conti) ---
  { id: 'u17_1', nome: 'Colasanti Valerio', ruolo: 'P', numero: '1', categoria: 'Under 17', selezionato: false },
  { id: 'u17_2', nome: 'Giacomini Filippo', ruolo: 'D', numero: '3', categoria: 'Under 17', selezionato: false },
  { id: 'u17_3', nome: 'Capanna Lorenzo', ruolo: 'D', numero: '5', categoria: 'Under 17', selezionato: false },
  { id: 'u17_4', nome: 'Mancini Alessio', ruolo: 'C', numero: '7', categoria: 'Under 17', selezionato: false },
  { id: 'u17_5', nome: 'Spaziani Federico', ruolo: 'C', numero: '10', categoria: 'Under 17', selezionato: false },
  { id: 'u17_6', nome: 'Nardi Thomas', ruolo: 'A', numero: '9', categoria: 'Under 17', selezionato: false },
  { id: 'u17_7', nome: 'Tedeschi Samuele', ruolo: 'A', numero: '11', categoria: 'Under 17', selezionato: false },

  // --- UNDER 15 (Mister Roberto Vichi) ---
  { id: 'u15_1', nome: 'Ferretti Diego', ruolo: 'P', numero: '1', categoria: 'Under 15', selezionato: false },
  { id: 'u15_2', nome: 'Bianchi Cristian', ruolo: 'D', numero: '4', categoria: 'Under 15', selezionato: false },
  { id: 'u15_3', nome: 'Ricci Tommaso', ruolo: 'C', numero: '8', categoria: 'Under 15', selezionato: false },
  { id: 'u15_4', nome: 'Cipriani Gabriele', ruolo: 'A', numero: '9', categoria: 'Under 15', selezionato: false },
];

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

export function loadCachedGiocatori(): GiocatoreConvocato[] | null {
  try {
    const raw = localStorage.getItem(CONVOCAZIONI_PLAYERS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Impossibile caricare cache giocatori', e);
  }
  return null;
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
        return { ...DEFAULT_STAFF_BY_CATEGORY, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Impossibile caricare cache staff', e);
  }
  return { ...DEFAULT_STAFF_BY_CATEGORY };
}

export function saveCachedStaff(staff: Record<string, string>): void {
  try {
    localStorage.setItem(CONVOCAZIONI_STAFF_CACHE_KEY, JSON.stringify(staff));
  } catch (e) {
    console.warn('Impossibile salvare cache staff', e);
  }
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Confronta in modo flessibile due categorie (es. "Under 19" e "JUNIORES U19")
 */
export function isCategoryMatch(catA: string, catB: string): boolean {
  if (!catA || !catB) return false;
  const a = catA.trim().toUpperCase();
  const b = catB.trim().toUpperCase();
  if (a === b) return true;

  const cleanA = a.replace(/[^A-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanB = b.replace(/[^A-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;

  // Numeri (19, 18, 17, 16, 15, 14, 13, 2012, ecc.)
  const numsA = cleanA.match(/\b(19|18|17|16|15|14|13|12|11|10|201[0-9]|202[0-9])\b/g);
  const numsB = cleanB.match(/\b(19|18|17|16|15|14|13|12|11|10|201[0-9]|202[0-9])\b/g);
  if (numsA && numsB) {
    return numsA.some(num => numsB.includes(num));
  }

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

  if (normMatch.includes('JUNIORES') || normMatch.includes('U19') || normMatch.includes('UNDER 19')) {
    const found = availableCategories.find(c => {
      const up = c.toUpperCase();
      return up.includes('19') || up.includes('JUNIORES');
    });
    if (found) return found;
  }

  if (normMatch.includes('ALLIEVI') || normMatch.includes('U17') || normMatch.includes('UNDER 17')) {
    const found = availableCategories.find(c => {
      const up = c.toUpperCase();
      return up.includes('17') || up.includes('ALLIEVI');
    });
    if (found) return found;
  }

  if (normMatch.includes('U16') || normMatch.includes('UNDER 16')) {
    const found = availableCategories.find(c => c.toUpperCase().includes('16'));
    if (found) return found;
  }

  if (normMatch.includes('GIOVANISSIMI') || normMatch.includes('U15') || normMatch.includes('UNDER 15')) {
    const found = availableCategories.find(c => {
      const up = c.toUpperCase();
      return up.includes('15') || up.includes('GIOVANISSIMI');
    });
    if (found) return found;
  }

  if (normMatch.includes('U14') || normMatch.includes('UNDER 14')) {
    const found = availableCategories.find(c => c.toUpperCase().includes('14'));
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

/**
 * Scarica e analizza l'elenco dei giocatori e dello staff da un foglio Google o CSV
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
    throw new Error('Il foglio Google è vuoto.');
  }

  return parseCsvConvocazioni(rows);
}

/**
 * Mappa flessibile delle righe CSV nell'elenco GiocatoreConvocato e Staff per Categoria
 */
export function parseCsvConvocazioni(rows: string[][]): ParsedSheetConvocazioni {
  if (rows.length === 0) {
    return { giocatori: [], staffByCategoria: {}, availableCategories: [] };
  }

  const firstRow = rows[0];
  const normalizedFirst = firstRow.map(c => normalizeHeader(c));

  const hasHeaderKeywords = normalizedFirst.some(h =>
    [
      'giocatore', 'nominativo', 'nome', 'cognome', 'atleta', 'calciatore',
      'ruolo', 'numero', 'maglia', 'categoria', 'squadra', 'convocato', 'mister', 'allenatore'
    ].some(k => h.includes(k))
  );

  let dataRows: string[][] = [];
  let idxNome = -1;
  let idxCognome = -1;
  let idxRuolo = -1;
  let idxNumero = -1;
  let idxCategoria = -1;
  let idxConvocato = -1;
  let idxNote = -1;
  let idxMister = -1;

  if (hasHeaderKeywords) {
    dataRows = rows.slice(1);

    // Rileva colonna Squadra / Categoria
    idxCategoria = normalizedFirst.findIndex(h =>
      ['squadra', 'categoria', 'leva', 'annata', 'gruppo', 'team'].some(k => h === k || h.includes(k))
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

    // Colonne opzionali (non obbligatorie)
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
  const staffByCategoria: Record<string, string> = { ...DEFAULT_STAFF_BY_CATEGORY };
  const categoriesSet = new Set<string>();

  dataRows.forEach((row, index) => {
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

    if (!fullName) return;

    let ruolo = idxRuolo !== -1 ? (row[idxRuolo] || '').trim() : '';
    if (!ruolo) {
      const lowerName = fullName.toLowerCase();
      if (lowerName.includes('(gk)') || lowerName.includes('🧤') || lowerName.includes('(p)')) {
        ruolo = 'P';
      }
    }
    const numero = idxNumero !== -1 ? (row[idxNumero] || '').trim() : '';
    const rawCategoria = idxCategoria !== -1 ? (row[idxCategoria] || '').trim() : '';
    const categoria = rawCategoria || 'Prima Squadra';
    const stato = idxConvocato !== -1 ? (row[idxConvocato] || '').trim().toLowerCase() : '';
    const note = idxNote !== -1 ? (row[idxNote] || '').trim() : '';
    const misterCell = idxMister !== -1 ? (row[idxMister] || '').trim() : '';

    if (categoria) {
      categoriesSet.add(categoria);
    }

    // Se c'è una colonna Mister esplicita e valorizzata
    if (misterCell && categoria) {
      staffByCategoria[categoria] = misterCell;
    }

    // Se la riga rappresenta direttamente un allenatore/mister (Ruolo = Mister / Allenatore)
    const normRuolo = ruolo.toLowerCase();
    if (normRuolo.includes('mister') || normRuolo.includes('allenatore') || normRuolo.includes('tecnico')) {
      staffByCategoria[categoria] = fullName;
      return; // Non inserire come calciatore con maglia
    }

    // Determinazione stato convocazione di default (lasciati deselezionati per default)
    let selezionato = false;
    if (stato) {
      if (['si', 'sì', 'yes', 'convocato', 'true', '1', 'titolare', 'panchina'].includes(stato)) {
        selezionato = true;
      }
    }

    giocatori.push({
      id: `player_${index + 1}_${fullName.replace(/\s+/g, '_')}`,
      nome: fullName,
      ruolo: ruolo || undefined,
      numero: numero || undefined,
      categoria: categoria,
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

export function calculateRitrovoFromOraGara(oraGara: string): string {
  if (!oraGara || !oraGara.includes(':')) return '';
  const [hStr, mStr] = oraGara.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (isNaN(h) || isNaN(m)) return '';
  let ritrovoMinutes = h * 60 + m - 90; // 90 minuti prima della gara
  if (ritrovoMinutes < 0) ritrovoMinutes += 24 * 60;
  const rh = Math.floor(ritrovoMinutes / 60);
  const rm = ritrovoMinutes % 60;
  const ritrovoFormatted = `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`;
  return `${ritrovoFormatted} PRESSO IL CAMPO DI GIUOCO`;
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
  const gara = partita?.gara ? partita.gara.trim().toUpperCase() : '';
  const casa = (squadraCasaCustom || partita?.squadraCasa || 'ASD CYNTHIA 1920').trim().toUpperCase();
  const ospite = (squadraOspiteCustom || partita?.squadraOspite || 'AVVERSARIO').trim().toUpperCase();
  const dataGara = (dataGaraCustom || partita?.data || '').trim().toUpperCase();
  const oraGara = (oraGaraCustom || partita?.ora || '').trim().toUpperCase();
  const campo = (campoCustom || (partita ? `${partita.campo}${partita.tipo ? ` (${partita.tipo})` : ''}` : '')).trim().toUpperCase();
  const indirizzo = (indirizzoCustom || (partita ? `${partita.indirizzo}, ${partita.comune}` : '')).trim().toUpperCase();
  const lnkMaps = linkMapsCustom || partita?.lnkMaps || '';

  const convocati = giocatori.filter(g => g.selezionato);

  // 1. Prima riga: solo CONVOCAZIONE UFFICIALE
  let msg = `📋 *CONVOCAZIONE UFFICIALE*\n\n`;

  // 2. Seconda riga: CAMPIONATO al posto di GARA
  msg += `🏆 *CAMPIONATO*: ${categoria}${gara ? ` - ${gara}` : ''}\n`;
  msg += `⚔️ *PARTITA*: ${casa} VS ${ospite}\n`;

  if (dataGara || oraGara) {
    msg += `📅 *DATA*: ${dataGara}${oraGara ? ` - ORE ${oraGara}` : ''}\n`;
  }

  // 3. Riga Ritrovo: orario + PRESSO IL CAMPO DI GIUOCO (senza il nome del campo)
  if (oraRitrovo && oraRitrovo.trim()) {
    const rawRitrovo = oraRitrovo.trim().toUpperCase();
    const timeMatch = rawRitrovo.match(/(\d{1,2}[:.]\d{2})/);
    let ritrovoFormatted = '';

    if (timeMatch) {
      const timeVal = timeMatch[1].replace('.', ':');
      ritrovoFormatted = `ORE ${timeVal} PRESSO IL CAMPO DI GIUOCO`;
    } else {
      let clean = rawRitrovo.replace(/PRESSO\s+.*$/i, '').trim();
      clean = clean ? `${clean} PRESSO IL CAMPO DI GIUOCO` : 'PRESSO IL CAMPO DI GIUOCO';
      if (!clean.startsWith('ORE ') && !clean.startsWith('ORE:')) {
        clean = `ORE ${clean}`;
      }
      ritrovoFormatted = clean;
    }
    msg += `⏰ *RITROVO*: ${ritrovoFormatted}\n`;
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
