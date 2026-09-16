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
}

export type ViewMode = 'cards' | 'table';
export type LocationFilter = 'all' | 'casa' | 'trasferta';

export interface FilterState {
  campionato: string;
  data: string;
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
