export interface Partita {
  id: string;
  campionato: string;
  girone: string;
  gara: string;
  data: string;
  ora: string;
  squadraCasa: string;
  squadraOspite: string;
  campo: string;
  tipo: string;
  indirizzo: string;
  comune: string;
  lnkMaps: string;
  isCynthiaCasa: boolean;
  isCynthiaOspite: boolean;
  lat?: number;
  lng?: number;
  societa?: string;
  arbitro?: string;
  note?: string;
}

export type ViewMode = 'cards' | 'table' | 'fields' | 'timeline' | 'map' | 'calendar';
export type LocationFilter = 'all' | 'casa' | 'trasferta';
export type TimeWindowFilter = 'all' | '24h' | '48h';

export interface FilterState {
  campionato: string;
  societa?: string;
  data: string;
  dayOfWeek?: string; // 'ALL' oppure 'SABATO', 'DOMENICA', ecc.
  startDate: string; // formato YYYY-MM-DD per intervallo
  endDate: string;   // formato YYYY-MM-DD per intervallo
  location: LocationFilter;
  timeWindow?: TimeWindowFilter;
  search: string;
}

export interface SheetConfig {
  sheetUrl: string;
  sheetId: string;
  tabName: string;
  autoRefreshInterval: number; // in minutes, 0 = disabled
  lastUpdated: string | null;
}

export interface MatchVariation {
  partitaId: string;
  campionato: string;
  squadre: string;
  data: string;
  changes: string[]; // Es. ["Orario variato: 10:30 ➔ 11:00", "Campo variato: Comunale ➔ Ciriaci"]
  timestamp: number;
}

export interface StaffByCategoria {
  [categoria: string]: string;
}

export interface GiocatoreConvocato {
  id: string;
  nome: string;
  ruolo?: string;
  numero?: string;
  categoria?: string;
  squadra?: string; // 'CYNTHIA 1920' | 'ACADEMY CYNTHIA GENZANO' | 'ALBACYNTHIA' o altra società
  societa?: string; // Società di appartenenza indicata nella colonna SOCIETA' del file delle rose
  annoNascita?: string; // Anno di nascita (es. 2008, 2010, '08, 14/05/2009)
  selezionato: boolean;
  note?: string;
}

export interface ConvocazioneConfig {
  sheetUrl: string;
  tabName: string;
  lastUpdated?: string;
  staffByCategoria?: StaffByCategoria;
}
