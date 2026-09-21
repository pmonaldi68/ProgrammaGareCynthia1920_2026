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
 * Elenco ufficiale dei soli Mister e Istruttori delle 3 società
 * (CYNTHIA 1920, ACADEMY CYNTHIA GENZANO, ALBACYNTHIA)
 */
export const OFFICIAL_CYNTHIA_COACHES: CynthiaCoach[] = [
  // --- CYNTHIA 1920 ---
  {
    id: 'c1920_ruotolo',
    nome: 'Ruotolo Giuseppe',
    titolo: 'Mister',
    societa: 'CYNTHIA 1920',
    ruoloDescrizione: 'Promozione / Prima Squadra',
    displayName: 'Mister Ruotolo Giuseppe (Cynthia 1920)',
  },
  {
    id: 'c1920_corradini',
    nome: 'Simone Corradini',
    titolo: 'Mister',
    societa: 'CYNTHIA 1920',
    ruoloDescrizione: 'Under 19 / Juniores',
    displayName: 'Mister Simone Corradini (Cynthia 1920)',
  },
  {
    id: 'c1920_bianchi',
    nome: 'Marco Bianchi',
    titolo: 'Mister',
    societa: 'CYNTHIA 1920',
    ruoloDescrizione: 'Under 18',
    displayName: 'Mister Marco Bianchi (Cynthia 1920)',
  },

  // --- ACADEMY CYNTHIA GENZANO ---
  {
    id: 'acad_conti',
    nome: 'Alessandro Conti',
    titolo: 'Mister',
    societa: 'ACADEMY CYNTHIA GENZANO',
    ruoloDescrizione: 'Under 17',
    displayName: 'Mister Alessandro Conti (Academy Cynthia Genzano)',
  },
  {
    id: 'acad_desantis',
    nome: 'Luca De Santis',
    titolo: 'Mister',
    societa: 'ACADEMY CYNTHIA GENZANO',
    ruoloDescrizione: 'Under 16',
    displayName: 'Mister Luca De Santis (Academy Cynthia Genzano)',
  },
  {
    id: 'acad_vichi',
    nome: 'Roberto Vichi',
    titolo: 'Mister',
    societa: 'ACADEMY CYNTHIA GENZANO',
    ruoloDescrizione: 'Under 15 / Under 15 Elite',
    displayName: 'Mister Roberto Vichi (Academy Cynthia Genzano)',
  },
  {
    id: 'acad_ferri',
    nome: 'Marco Ferri',
    titolo: 'Mister',
    societa: 'ACADEMY CYNTHIA GENZANO',
    ruoloDescrizione: 'Under 14 / Under 14 Elite',
    displayName: 'Mister Marco Ferri (Academy Cynthia Genzano)',
  },
  {
    id: 'acad_mancini',
    nome: 'Matteo Mancini',
    titolo: 'Mister',
    societa: 'ACADEMY CYNTHIA GENZANO',
    ruoloDescrizione: 'Under 14 Regionali',
    displayName: 'Mister Matteo Mancini (Academy Cynthia Genzano)',
  },
  {
    id: 'acad_carioti',
    nome: 'Marco Carioti',
    titolo: 'Mister',
    societa: 'ACADEMY CYNTHIA GENZANO',
    ruoloDescrizione: 'Under 14 Regionali',
    displayName: 'Mister Marco Carioti (Academy Cynthia Genzano)',
  },
  {
    id: 'acad_galli',
    nome: 'Andrea Galli',
    titolo: 'Istruttore',
    societa: 'ACADEMY CYNTHIA GENZANO',
    ruoloDescrizione: 'Under 13 / Esordienti',
    displayName: 'Istruttore Andrea Galli (Academy Cynthia Genzano)',
  },

  // --- ALBACYNTHIA ---
  {
    id: 'alba_albano',
    nome: 'Fabio Albano',
    titolo: 'Mister',
    societa: 'ALBACYNTHIA',
    ruoloDescrizione: 'Under 14 Provinciali / Under 14',
    displayName: 'Mister Fabio Albano (Albacynthia)',
  },
  {
    id: 'alba_fabi',
    nome: 'Cristian Fabi',
    titolo: 'Istruttore',
    societa: 'ALBACYNTHIA',
    ruoloDescrizione: 'Under 13 / Scuola Calcio',
    displayName: 'Istruttore Cristian Fabi (Albacynthia)',
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
 * Carica il mister salvato specificamente per una gara da localStorage
 */
export function loadSavedMisterForMatch(matchId: string): string | null {
  try {
    const raw = localStorage.getItem(CONVOCAZIONI_MISTER_BY_MATCH_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      if (map && typeof map === 'object' && map[matchId]) {
        return String(map[matchId]);
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
    map[matchId] = misterName;
    localStorage.setItem(CONVOCAZIONI_MISTER_BY_MATCH_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Errore salvataggio mister per gara', e);
  }
}

/**
 * Determina il mister corretto assegnato alla gara assicurando che appartenga
 * esclusivamente a una delle tre società (CYNTHIA 1920, ACADEMY CYNTHIA GENZANO, ALBACYNTHIA).
 */
export function resolveMisterForMatch(
  partita: Partita | null | undefined,
  campionatoCustom?: string
): string {
  // 1. Se l'utente ha salvato un mister personalizzato per questa specifica gara, usalo sempre
  if (partita && partita.id) {
    const saved = loadSavedMisterForMatch(partita.id);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  }

  const club = detectCynthiaClub(partita);
  const camp = (partita?.campionato || campionatoCustom || '').toUpperCase();

  // 2. Club ALBACYNTHIA
  if (club === 'ALBACYNTHIA') {
    if (camp.includes('13') || camp.includes('ESORDIENTI') || camp.includes('PULCINI')) {
      return 'Istruttore Cristian Fabi (Albacynthia)';
    }
    return 'Mister Fabio Albano (Albacynthia)';
  }

  // 3. Club ACADEMY CYNTHIA GENZANO
  if (club === 'ACADEMY CYNTHIA GENZANO') {
    if (camp.includes('17') || camp.includes('ALLIEVI')) {
      return 'Mister Alessandro Conti (Academy Cynthia Genzano)';
    }
    if (camp.includes('16')) {
      return 'Mister Luca De Santis (Academy Cynthia Genzano)';
    }
    if (camp.includes('15') || camp.includes('GIOVANISSIMI')) {
      return 'Mister Roberto Vichi (Academy Cynthia Genzano)';
    }
    if (camp.includes('14 REG') || camp.includes('14 REGIONALI')) {
      return 'Mister Matteo Mancini (Academy Cynthia Genzano)';
    }
    if (camp.includes('14')) {
      return 'Mister Marco Ferri (Academy Cynthia Genzano)';
    }
    if (camp.includes('13') || camp.includes('ESORDIENTI') || camp.includes('PULCINI')) {
      return 'Istruttore Andrea Galli (Academy Cynthia Genzano)';
    }
    return 'Mister Alessandro Conti (Academy Cynthia Genzano)';
  }

  // 4. Club CYNTHIA 1920 (Promozione, Under 19, Under 18)
  if (camp.includes('19') || camp.includes('JUNIORES')) {
    return 'Mister Simone Corradini (Cynthia 1920)';
  }
  if (camp.includes('18')) {
    return 'Mister Marco Bianchi (Cynthia 1920)';
  }
  if (
    camp.includes('PROMOZIONE') ||
    camp.includes('PRIMA') ||
    camp.includes('SERIE D') ||
    camp.includes('ECCELLENZA')
  ) {
    return 'Mister Ruotolo Giuseppe (Cynthia 1920)';
  }

  // Se è una gara giovanile ma etichettata Cynthia:
  if (camp.includes('17') || camp.includes('ALLIEVI')) {
    return 'Mister Alessandro Conti (Academy Cynthia Genzano)';
  }
  if (camp.includes('16')) {
    return 'Mister Luca De Santis (Academy Cynthia Genzano)';
  }
  if (camp.includes('15') || camp.includes('GIOVANISSIMI')) {
    return 'Mister Roberto Vichi (Academy Cynthia Genzano)';
  }
  if (camp.includes('14')) {
    return 'Mister Marco Ferri (Academy Cynthia Genzano)';
  }
  if (camp.includes('13')) {
    return 'Istruttore Andrea Galli (Academy Cynthia Genzano)';
  }

  // Default Cynthia 1920
  return 'Mister Ruotolo Giuseppe (Cynthia 1920)';
}

export const DEFAULT_STAFF_BY_CATEGORY: Record<string, string> = {
  'PROMOZIONE': 'Mister Ruotolo Giuseppe (Cynthia 1920)',
  'Promozione': 'Mister Ruotolo Giuseppe (Cynthia 1920)',
  'Prima Squadra': 'Mister Ruotolo Giuseppe (Cynthia 1920)',
  'UNDER 19': 'Mister Simone Corradini (Cynthia 1920)',
  'Under 19': 'Mister Simone Corradini (Cynthia 1920)',
  'UNDER 18': 'Mister Marco Bianchi (Cynthia 1920)',
  'Under 18': 'Mister Marco Bianchi (Cynthia 1920)',
  'UNDER 17': 'Mister Alessandro Conti (Academy Cynthia Genzano)',
  'Under 17': 'Mister Alessandro Conti (Academy Cynthia Genzano)',
  'UNDER 16': 'Mister Luca De Santis (Academy Cynthia Genzano)',
  'Under 16': 'Mister Luca De Santis (Academy Cynthia Genzano)',
  'UNDER 15': 'Mister Roberto Vichi (Academy Cynthia Genzano)',
  'Under 15': 'Mister Roberto Vichi (Academy Cynthia Genzano)',
  'UNDER 15 ELITE': 'Mister Roberto Vichi (Academy Cynthia Genzano)',
  'UNDER 14 ELITE': 'Mister Marco Ferri (Academy Cynthia Genzano)',
  'UNDER 14 REG': 'Mister Marco Carioti (Academy Cynthia Genzano)',
  'UNDER14 REG': 'Mister Marco Carioti (Academy Cynthia Genzano)',
  'Under 14 Regionali': 'Mister Marco Carioti (Academy Cynthia Genzano)',
  'UNDER 14 PROV': 'Mister Fabio Albano (Albacynthia)',
  'UNDER 14': 'Mister Marco Ferri (Academy Cynthia Genzano)',
  'Under 14': 'Mister Marco Ferri (Academy Cynthia Genzano)',
  'UNDER 13': 'Istruttore Andrea Galli (Academy Cynthia Genzano)',
  'Under 13': 'Istruttore Andrea Galli (Academy Cynthia Genzano)',
  'Esordienti': 'Istruttore Andrea Galli',
  'Pulcini': 'Istruttore Paolo Neri',
};

export const DEFAULT_SAMPLE_PLAYERS: GiocatoreConvocato[] = [
  // =========================================================================
  // 1. CYNTHIA 1920
  // =========================================================================

  // --- CYNTHIA 1920 - PROMOZIONE / PRIMA SQUADRA (Mister Ruotolo Giuseppe) ---
  { id: 'c1920_prom_1', nome: 'Amore Bonapasta Flavio', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_2', nome: 'Barone Thomas', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_3', nome: 'Battisti Lorenzo', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_4', nome: 'Bianchi Simone', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_5', nome: 'Borelli Simone', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_6', nome: 'Campoli Diego', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_7', nome: 'Ciavaldini Tiziano', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_8', nome: 'Colagrossi Matteo', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_9', nome: 'De Angelis Tiago (gk)🧤', ruolo: 'P', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_10', nome: 'De Bonis Matteo', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_11', nome: 'Di Felice Alessandro', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_12', nome: 'Drogheo Filippo', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_13', nome: 'Evangelisti Andrea', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_14', nome: 'Fabbri Valerio', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_15', nome: 'Friscioni Leonardo', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_16', nome: 'Laudati Francesco', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_17', nome: 'Leo Alessandro', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_18', nome: 'Lucidi Federico', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_19', nome: 'Mancini Gabriele', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_20', nome: 'Melaranci Roberto (gk)🧤', ruolo: 'P', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_21', nome: 'Mirimich Alessandro', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_22', nome: 'Palumbo Christian', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_23', nome: 'Persia Nicolo', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_24', nome: 'Ruotolo Luigi', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_25', nome: 'Sambucini Lorenzo', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_26', nome: 'Sirignano Ciro Oreste', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_prom_27', nome: 'Di Costanzo Antonio', categoria: 'PROMOZIONE', squadra: 'CYNTHIA 1920', selezionato: false },

  // --- CYNTHIA 1920 - UNDER 19 (Mister Simone Corradini) ---
  { id: 'c1920_u19_1', nome: 'Testa Mattia', ruolo: 'P', numero: '1', categoria: 'Under 19', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u19_2', nome: 'Rossi Christian', ruolo: 'D', numero: '2', categoria: 'Under 19', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u19_3', nome: 'D\'Amico Tommaso', ruolo: 'D', numero: '3', categoria: 'Under 19', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u19_4', nome: 'Bernardi Luca', ruolo: 'C', numero: '4', categoria: 'Under 19', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u19_5', nome: 'Costantini Matteo', ruolo: 'C', numero: '8', categoria: 'Under 19', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u19_6', nome: 'Carbone Samuele', ruolo: 'A', numero: '9', categoria: 'Under 19', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u19_7', nome: 'Santoro Jacopo', ruolo: 'A', numero: '11', categoria: 'Under 19', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u19_8', nome: 'Marchetti Leonardo', ruolo: 'D', numero: '13', categoria: 'Under 19', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u19_9', nome: 'Rinaldi Mattia', ruolo: 'C', numero: '14', categoria: 'Under 19', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u19_10', nome: 'Fiorini Andrea', ruolo: 'A', numero: '18', categoria: 'Under 19', squadra: 'CYNTHIA 1920', selezionato: false, note: 'Diffidato' },
  { id: 'c1920_u19_11', nome: 'Gentili Valerio', ruolo: 'C', numero: '16', categoria: 'Under 19', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u19_12', nome: 'Lombardi Federico', ruolo: 'D', numero: '5', categoria: 'Under 19', squadra: 'CYNTHIA 1920', selezionato: false },

  // --- CYNTHIA 1920 - UNDER 18 (Mister Marco Bianchi) ---
  { id: 'c1920_u18_1', nome: 'Paglia Alessandro', ruolo: 'P', numero: '1', categoria: 'Under 18', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u18_2', nome: 'Proietti Samuele', ruolo: 'D', numero: '2', categoria: 'Under 18', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u18_3', nome: 'Tofani Lorenzo', ruolo: 'D', numero: '3', categoria: 'Under 18', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u18_4', nome: 'Sabatini Leonardo', ruolo: 'C', numero: '4', categoria: 'Under 18', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u18_5', nome: 'Romani Diego', ruolo: 'C', numero: '6', categoria: 'Under 18', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u18_6', nome: 'Caprara Francesco', ruolo: 'A', numero: '9', categoria: 'Under 18', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u18_7', nome: 'Cianfanelli Jacopo', ruolo: 'A', numero: '10', categoria: 'Under 18', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u18_8', nome: 'Bassi Cristian', ruolo: 'D', numero: '5', categoria: 'Under 18', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u18_9', nome: 'Marino Edoardo', ruolo: 'C', numero: '8', categoria: 'Under 18', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u18_10', nome: 'De Silvestri Gabriele', ruolo: 'A', numero: '11', categoria: 'Under 18', squadra: 'CYNTHIA 1920', selezionato: false },

  // --- CYNTHIA 1920 - UNDER 17 ---
  { id: 'c1920_u17_1', nome: 'Silvestri Daniele', ruolo: 'P', numero: '1', categoria: 'Under 17', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u17_2', nome: 'Corsi Valerio', ruolo: 'D', numero: '3', categoria: 'Under 17', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u17_3', nome: 'Morelli Simone', ruolo: 'C', numero: '8', categoria: 'Under 17', squadra: 'CYNTHIA 1920', selezionato: false },
  { id: 'c1920_u17_4', nome: 'Galli Filippo', ruolo: 'A', numero: '9', categoria: 'Under 17', squadra: 'CYNTHIA 1920', selezionato: false },

  // =========================================================================
  // 2. ACADEMY CYNTHIA GENZANO
  // =========================================================================

  // --- ACADEMY CYNTHIA GENZANO - UNDER 17 (Mister Alessandro Conti) ---
  { id: 'acad_u17_1', nome: 'Colasanti Valerio', ruolo: 'P', numero: '1', categoria: 'Under 17', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u17_2', nome: 'Giacomini Filippo', ruolo: 'D', numero: '2', categoria: 'Under 17', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u17_3', nome: 'Capanna Lorenzo', ruolo: 'D', numero: '3', categoria: 'Under 17', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u17_4', nome: 'Mancini Alessio', ruolo: 'C', numero: '4', categoria: 'Under 17', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u17_5', nome: 'Spaziani Federico', ruolo: 'C', numero: '8', categoria: 'Under 17', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u17_6', nome: 'Nardi Thomas', ruolo: 'A', numero: '9', categoria: 'Under 17', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u17_7', nome: 'Tedeschi Samuele', ruolo: 'A', numero: '10', categoria: 'Under 17', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u17_8', nome: 'Pellegrini Davide', ruolo: 'D', numero: '5', categoria: 'Under 17', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u17_9', nome: 'Fontana Christian', ruolo: 'C', numero: '7', categoria: 'Under 17', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u17_10', nome: 'Santucci Matteo', ruolo: 'A', numero: '11', categoria: 'Under 17', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u17_11', nome: 'Bolognesi Tommaso', ruolo: 'P', numero: '12', categoria: 'Under 17', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },

  // --- ACADEMY CYNTHIA GENZANO - UNDER 16 (Mister Luca De Santis) ---
  { id: 'acad_u16_1', nome: 'Mariani Riccardo', ruolo: 'P', numero: '1', categoria: 'Under 16', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u16_2', nome: 'Castellani Giulio', ruolo: 'D', numero: '2', categoria: 'Under 16', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u16_3', nome: 'Ferrari Tommaso', ruolo: 'D', numero: '3', categoria: 'Under 16', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u16_4', nome: 'Lupi Emanuele', ruolo: 'C', numero: '4', categoria: 'Under 16', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u16_5', nome: 'Rocchi Federico', ruolo: 'C', numero: '8', categoria: 'Under 16', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u16_6', nome: 'Costanzo Leonardo', ruolo: 'A', numero: '9', categoria: 'Under 16', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u16_7', nome: 'Di Palma Lorenzo', ruolo: 'A', numero: '10', categoria: 'Under 16', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u16_8', nome: 'Valenti Samuele', ruolo: 'D', numero: '5', categoria: 'Under 16', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u16_9', nome: 'Gentili Mattia', ruolo: 'C', numero: '7', categoria: 'Under 16', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u16_10', nome: 'Caporali Diego', ruolo: 'A', numero: '11', categoria: 'Under 16', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },

  // --- ACADEMY CYNTHIA GENZANO - UNDER 15 & UNDER 15 ELITE (Mister Roberto Vichi) ---
  { id: 'acad_u15_1', nome: 'Ferretti Diego', ruolo: 'P', numero: '1', categoria: 'Under 15', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u15_2', nome: 'Bianchi Cristian', ruolo: 'D', numero: '2', categoria: 'Under 15', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u15_3', nome: 'Ricci Tommaso', ruolo: 'C', numero: '8', categoria: 'Under 15', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u15_4', nome: 'Cipriani Gabriele', ruolo: 'A', numero: '9', categoria: 'Under 15', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u15_5', nome: 'Palmieri Luca', ruolo: 'D', numero: '3', categoria: 'Under 15', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u15_6', nome: 'Taddei Francesco', ruolo: 'C', numero: '4', categoria: 'Under 15', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u15_7', nome: 'Vagnoni Alessio', ruolo: 'A', numero: '11', categoria: 'Under 15', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u15_8', nome: 'Giammatteo Andrea', ruolo: 'D', numero: '5', categoria: 'Under 15', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u15_9', nome: 'Capuani Edoardo', ruolo: 'C', numero: '7', categoria: 'Under 15', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u15_10', nome: 'Marani Jacopo', ruolo: 'A', numero: '10', categoria: 'Under 15', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },

  // --- ACADEMY CYNTHIA GENZANO - UNDER 14, ELITE & REG (Mister Marco Ferri) ---
  { id: 'acad_u14_1', nome: 'Parisi Giorgio', ruolo: 'P', numero: '1', categoria: 'Under 14', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u14_2', nome: 'Sestili Jacopo', ruolo: 'D', numero: '2', categoria: 'Under 14', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u14_3', nome: 'Del Monaco Samuele', ruolo: 'D', numero: '3', categoria: 'Under 14', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u14_4', nome: 'Testa Christian', ruolo: 'C', numero: '4', categoria: 'Under 14', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u14_5', nome: 'Barbaro Matteo', ruolo: 'C', numero: '8', categoria: 'Under 14', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u14_6', nome: 'Festa Nicolo', ruolo: 'A', numero: '9', categoria: 'Under 14', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u14_7', nome: 'Galli Valerio', ruolo: 'A', numero: '10', categoria: 'Under 14', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u14_8', nome: 'Rosati Filippo', ruolo: 'D', numero: '5', categoria: 'Under 14', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u14_9', nome: 'Di Girolamo Luca', ruolo: 'C', numero: '7', categoria: 'Under 14', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u14_10', nome: 'Ceccarelli Leonardo', ruolo: 'A', numero: '11', categoria: 'Under 14', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },

  // --- ACADEMY CYNTHIA GENZANO - UNDER 13 (Istruttore Andrea Galli) ---
  { id: 'acad_u13_1', nome: 'Mastrogirolamo Filippo', ruolo: 'P', numero: '1', categoria: 'Under 13', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u13_2', nome: 'Carbone Diego', ruolo: 'D', numero: '2', categoria: 'Under 13', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u13_3', nome: 'Scarpetti Cristian', ruolo: 'D', numero: '3', categoria: 'Under 13', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u13_4', nome: 'Lombardo Mattia', ruolo: 'C', numero: '4', categoria: 'Under 13', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u13_5', nome: 'D\'Amato Tommaso', ruolo: 'C', numero: '8', categoria: 'Under 13', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u13_6', nome: 'Zaccagnini Lorenzo', ruolo: 'A', numero: '9', categoria: 'Under 13', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u13_7', nome: 'Ferri Samuele', ruolo: 'A', numero: '10', categoria: 'Under 13', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u13_8', nome: 'Nardini Jacopo', ruolo: 'D', numero: '5', categoria: 'Under 13', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u13_9', nome: 'Boccali Edoardo', ruolo: 'C', numero: '7', categoria: 'Under 13', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },
  { id: 'acad_u13_10', nome: 'Santoro Gabriele', ruolo: 'A', numero: '11', categoria: 'Under 13', squadra: 'ACADEMY CYNTHIA GENZANO', selezionato: false },

  // =========================================================================
  // 3. ALBACYNTHIA
  // =========================================================================

  // --- ALBACYNTHIA - UNDER 14 & UNDER 14 PROV (Mister Fabio Albano) ---
  { id: 'alba_u14_1', nome: 'Bernabei Alessandro', ruolo: 'P', numero: '1', categoria: 'Under 14', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u14_2', nome: 'Capuozzo Riccardo', ruolo: 'D', numero: '2', categoria: 'Under 14', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u14_3', nome: 'De Santis Valerio', ruolo: 'D', numero: '3', categoria: 'Under 14', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u14_4', nome: 'Fiore Francesco', ruolo: 'C', numero: '4', categoria: 'Under 14', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u14_5', nome: 'Gentili Jacopo', ruolo: 'C', numero: '8', categoria: 'Under 14', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u14_6', nome: 'Iacovelli Samuele', ruolo: 'A', numero: '9', categoria: 'Under 14', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u14_7', nome: 'Leoni Edoardo', ruolo: 'A', numero: '10', categoria: 'Under 14', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u14_8', nome: 'Mancinelli Cristian', ruolo: 'D', numero: '5', categoria: 'Under 14', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u14_9', nome: 'Nazzaro Tommaso', ruolo: 'C', numero: '7', categoria: 'Under 14', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u14_10', nome: 'Orlandi Matteo', ruolo: 'A', numero: '11', categoria: 'Under 14', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u14_11', nome: 'Pannozzo Lorenzo', ruolo: 'D', numero: '6', categoria: 'Under 14', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u14_12', nome: 'Quattrini Gabriele', ruolo: 'C', numero: '14', categoria: 'Under 14', squadra: 'ALBACYNTHIA', selezionato: false },

  // --- ALBACYNTHIA - UNDER 15 ---
  { id: 'alba_u15_1', nome: 'Riggi Filippo', ruolo: 'P', numero: '1', categoria: 'Under 15', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u15_2', nome: 'Salustri Leonardo', ruolo: 'D', numero: '2', categoria: 'Under 15', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u15_3', nome: 'Trecca Diego', ruolo: 'D', numero: '3', categoria: 'Under 15', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u15_4', nome: 'Valente Cristian', ruolo: 'C', numero: '8', categoria: 'Under 15', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u15_5', nome: 'Zannoni Mattia', ruolo: 'A', numero: '9', categoria: 'Under 15', squadra: 'ALBACYNTHIA', selezionato: false },

  // --- ALBACYNTHIA - UNDER 16 ---
  { id: 'alba_u16_1', nome: 'Baroncini Alessio', ruolo: 'P', numero: '1', categoria: 'Under 16', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u16_2', nome: 'Castellucci Simone', ruolo: 'D', numero: '2', categoria: 'Under 16', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u16_3', nome: 'Donati Valerio', ruolo: 'C', numero: '4', categoria: 'Under 16', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u16_4', nome: 'Esposito Tommaso', ruolo: 'A', numero: '9', categoria: 'Under 16', squadra: 'ALBACYNTHIA', selezionato: false },

  // --- ALBACYNTHIA - UNDER 13 ---
  { id: 'alba_u13_1', nome: 'Fabi Cristian', ruolo: 'P', numero: '1', categoria: 'Under 13', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u13_2', nome: 'Galli Leonardo', ruolo: 'D', numero: '2', categoria: 'Under 13', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u13_3', nome: 'Latini Federico', ruolo: 'C', numero: '8', categoria: 'Under 13', squadra: 'ALBACYNTHIA', selezionato: false },
  { id: 'alba_u13_4', nome: 'Mazzoni Samuele', ruolo: 'A', numero: '9', categoria: 'Under 13', squadra: 'ALBACYNTHIA', selezionato: false },
];

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
  let idxSquadra = -1;

  if (hasHeaderKeywords) {
    dataRows = rows.slice(1);

    // Rileva colonna Squadra / Categoria
    idxCategoria = normalizedFirst.findIndex(h =>
      ['squadra', 'categoria', 'cat', 'leva', 'annata', 'gruppo', 'team'].some(k => h === k || h.includes(k))
    );

    // Rileva colonna distinta per Società / Club (se diversa da Squadra/Categoria)
    const distinctSocietaIdx = normalizedFirst.findIndex((h, idx) =>
      idx !== idxCategoria &&
      ['societa', 'club', 'entita', 'polisportiva'].some(k => h === k || h.includes(k))
    );
    if (distinctSocietaIdx !== -1) {
      idxSquadra = distinctSocietaIdx;
    }

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

export function calculateRitrovoTimeOnly(oraGara: string): string {
  if (!oraGara || !oraGara.includes(':')) return '14:00';
  const [hStr, mStr] = oraGara.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (isNaN(h) || isNaN(m)) return '14:00';
  let ritrovoMinutes = h * 60 + m - 90; // 90 minuti prima della gara
  if (ritrovoMinutes < 0) ritrovoMinutes += 24 * 60;
  const rh = Math.floor(ritrovoMinutes / 60);
  const rm = ritrovoMinutes % 60;
  return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`;
}

export function extractTimeFromRitrovo(ritrovo: string): string {
  if (!ritrovo) return '14:00';
  const match = ritrovo.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '14:00';
}

export function calculateRitrovoFromOraGara(oraGara: string): string {
  const timeOnly = calculateRitrovoTimeOnly(oraGara);
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
