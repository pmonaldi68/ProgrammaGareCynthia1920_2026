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
}

export type ViewMode = 'cards' | 'table' | 'map';
export type LocationFilter = 'all' | 'casa' | 'trasferta';

export interface FilterState {
  campionato: string;
  data: string;
  startDate: string; // formato YYYY-MM-DD per intervallo
  endDate: string;   // formato YYYY-MM-DD per intervallo
  location: LocationFilter;
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
  squadra?: string; // 'CYNTHIA 1920' | 'ACADEMY CYNTHIA GENZANO' | 'ALBACYNTHIA'
  selezionato: boolean;
  note?: string;
}

export interface ConvocazioneConfig {
  sheetUrl: string;
  tabName: string;
  lastUpdated?: string;
  staffByCategoria?: StaffByCategoria;
}
