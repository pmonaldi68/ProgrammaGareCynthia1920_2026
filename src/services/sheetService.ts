import { Partita, SheetConfig } from '../types';
import { DEFAULT_PARTITE } from '../data/defaultPartite';

const CONFIG_STORAGE_KEY = 'cynthia_sheet_config_v1';
const DATA_STORAGE_KEY = 'cynthia_partite_cache_v1';

export const DEFAULT_CONFIG: SheetConfig = {
  sheetUrl: '',
  sheetId: '',
  tabName: '',
  autoRefreshInterval: 5,
  lastUpdated: null,
};

export function loadStoredConfig(): SheetConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Impossibile caricare configurazione salvata', e);
  }
  return DEFAULT_CONFIG;
}

export function saveStoredConfig(config: SheetConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Impossibile salvare la configurazione', e);
  }
}

export function loadCachedPartite(): Partita[] | null {
  try {
    const raw = localStorage.getItem(DATA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Impossibile caricare cache partite', e);
  }
  return null;
}

export function saveCachedPartite(partite: Partita[]): void {
  try {
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(partite));
  } catch (e) {
    console.warn('Impossibile salvare cache partite', e);
  }
}

/**
 * Estrae lo Sheet ID o costruisce l'URL CSV pubblico di esportazione
 */
export function buildCsvUrl(inputUrlOrId: string, tabName?: string): string {
  const trimmed = inputUrlOrId.trim();

  // Se è già un URL CSV diretto (es. pub?output=csv o gviz/tq?tqx=out:csv o file locale)
  if (trimmed.includes('output=csv') || trimmed.includes('tqx=out:csv') || trimmed.endsWith('.csv')) {
    return trimmed;
  }

  // Estrazione ID da URL Google Sheets standard
  const matchId = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = matchId ? matchId[1] : trimmed;

  // Se sembra un ID valido (circa 20-50 caratteri alfanumerici)
  if (/^[a-zA-Z0-9-_]{20,}$/.test(sheetId)) {
    let url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    if (tabName && tabName.trim()) {
      url += `&sheet=${encodeURIComponent(tabName.trim())}`;
    }
    return url;
  }

  return trimmed;
}

/**
 * Parser CSV robusto conforme RFC 4180 (gestisce virgole e punto e virgola, apici e ritorni a capo)
 */
export function parseCSV(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, '').trim(); // rimuove eventuale BOM UTF-8
  if (!cleanText) return [];

  // Rileva separatore comune (virgola o punto e virgola o tab)
  const firstLine = cleanText.split('\n')[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
  else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some(col => col.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(col => col.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Converte le righe CSV nella lista tipizzata di Partita
 */
export function mapCsvToPartite(rows: string[][]): Partita[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => normalizeHeader(h));

  const findIdx = (keywords: string[]): number => {
    return headers.findIndex(h => keywords.some(k => h === k || h.includes(k)));
  };

  const idxCampionato = findIdx(['campionato', 'categoria', 'cat']);
  const idxGirone = findIdx(['girone', 'gir']);
  const idxGara = findIdx(['gara', 'giornata', 'turno', 'partita']);
  const idxData = findIdx(['data', 'giorno']);
  const idxOra = findIdx(['ora', 'orario']);
  const idxCasa = findIdx(['squadracasa', 'casa', 'sqcasa', 'squadra1']);
  const idxOspite = findIdx(['squadraospite', 'ospite', 'sqospite', 'squadra2', 'trasferta']);
  const idxCampo = findIdx(['campo', 'impianto', 'stadio', 'struttura']);
  const idxTipo = findIdx(['tipo', 'superficie', 'tipocampo']);
  const idxIndirizzo = findIdx(['indirizzo', 'via']);
  const idxComune = findIdx(['comune', 'citta', 'paese']);
  const idxMaps = findIdx(['lnkmaps', 'linkmaps', 'maps', 'link', 'mappa', 'posizione']);

  const getCol = (row: string[], idx: number, fallback = ''): string => {
    if (idx >= 0 && idx < row.length) {
      return (row[idx] || '').trim();
    }
    return fallback;
  };

  const partite: Partita[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    // Salta righe completamente vuote
    if (!row.some(cell => cell.trim().length > 0)) continue;

    const casa = getCol(row, idxCasa, 'ASD CYNTHIA 1920');
    const ospite = getCol(row, idxOspite, 'Avversario');
    const campo = getCol(row, idxCampo, 'Stadio Comunale Bruno Abbatini');
    const indirizzo = getCol(row, idxIndirizzo, 'Via San Carlino');
    const comune = getCol(row, idxComune, 'Genzano di Roma');

    let lnkMaps = getCol(row, idxMaps);
    if (!lnkMaps || !lnkMaps.startsWith('http')) {
      const query = [campo, indirizzo, comune].filter(Boolean).join(', ');
      lnkMaps = `https://maps.google.com/?q=${encodeURIComponent(query || 'Stadio Bruno Abbatini Genzano di Roma')}`;
    }

    const isCynthiaCasa = /cynthia/i.test(casa);
    const isCynthiaOspite = /cynthia/i.test(ospite);

    partite.push({
      id: `match-${r}-${Date.now().toString(36)}`,
      campionato: getCol(row, idxCampionato, 'Campionato'),
      girone: getCol(row, idxGirone, '-'),
      gara: getCol(row, idxGara, `Gara ${r}`),
      data: getCol(row, idxData, 'Weekend'),
      ora: getCol(row, idxOra, '15:00'),
      squadraCasa: casa,
      squadraOspite: ospite,
      campo: campo,
      tipo: getCol(row, idxTipo, 'Sintetico'),
      indirizzo: indirizzo,
      comune: comune,
      lnkMaps: lnkMaps,
      isCynthiaCasa,
      isCynthiaOspite,
    });
  }

  return partite;
}

/**
 * Carica le partite da URL Google Sheets o file locale
 */
export async function fetchPartiteFromSource(sheetUrlOrId?: string, tabName?: string): Promise<Partita[]> {
  const target = (sheetUrlOrId || '').trim();

  // Se l'utente non ha specificato alcun URL, prova a vedere se esiste un file sincronizzato da GitHub Actions
  if (!target) {
    // Prova a caricare ./data/partite.csv o ./partite.csv
    try {
      const localResp = await fetch('./data/partite.csv', { cache: 'no-cache' });
      if (localResp.ok) {
        const text = await localResp.text();
        const rows = parseCSV(text);
        const parsed = mapCsvToPartite(rows);
        if (parsed.length > 0) {
          saveCachedPartite(parsed);
          return parsed;
        }
      }
    } catch (e) {
      // continua con fallback
    }

    // Se c'è cache, usala, altrimenti default
    const cached = loadCachedPartite();
    if (cached && cached.length > 0) {
      return cached;
    }
    return DEFAULT_PARTITE;
  }

  const csvUrl = buildCsvUrl(target, tabName);

  const response = await fetch(csvUrl, {
    method: 'GET',
    headers: {
      Accept: 'text/csv, text/plain, */*',
    },
  });

  if (!response.ok) {
    throw new Error(`Errore HTTP ${response.status}: Impossibile scaricare il foglio.`);
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  if (rows.length < 2) {
    throw new Error('Il foglio scaricato non contiene abbastanza righe o intestazioni valide.');
  }

  const partite = mapCsvToPartite(rows);
  if (partite.length === 0) {
    throw new Error('Nessuna partita valida trovata nel foglio.');
  }

  saveCachedPartite(partite);
  return partite;
}

/**
 * Genera il contenuto CSV dalle partite attuali per esportazione/backup
 */
export function exportPartiteToCSV(partite: Partita[]): string {
  const headers = [
    'CAMPIONATO',
    'GIRONE',
    'GARA',
    'DATA',
    'ORA',
    'SQUADRA CASA',
    'SQUADRA OSPITE',
    'CAMPO',
    'TIPO',
    'INDIRIZZO',
    'COMUNE',
    'LNK MAPS',
  ];

  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = partite.map(p => [
    escape(p.campionato),
    escape(p.girone),
    escape(p.gara),
    escape(p.data),
    escape(p.ora),
    escape(p.squadraCasa),
    escape(p.squadraOspite),
    escape(p.campo),
    escape(p.tipo),
    escape(p.indirizzo),
    escape(p.comune),
    escape(p.lnkMaps),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
