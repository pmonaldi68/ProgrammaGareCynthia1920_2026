/**
 * Configurazione principale dell'applicazione ASD Cynthia 1920
 * Inserendo qui il link del tuo foglio Google Sheets, il sito caricherà
 * automaticamente i dati per TUTTI gli utenti senza dover digitare nulla.
 */
export const APP_CONFIG = {
  // Foglio Calendario Partite
  defaultSheetUrl:
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SHEET_URL) ||
    'https://docs.google.com/spreadsheets/d/1OVkRnBZyGrFioz2_LBAWqZSOFH9PXP9dCFThs8T4ABA/edit',

  // Nome eventuale della scheda/foglio (lascia vuoto per il primo foglio)
  defaultTabName: '',

  // Foglio Rose Giocatori & Convocazioni Ufficiale ASD Cynthia 1920
  defaultConvocazioniSheetId: '1Jl7i6oD8ip5eHVBMbsC1Qknx2gI-6zogCFNWK-WSUtM',
  defaultConvocazioniSheetUrl:
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CONVOCAZIONI_SHEET_URL) ||
    'https://docs.google.com/spreadsheets/d/1Jl7i6oD8ip5eHVBMbsC1Qknx2gI-6zogCFNWK-WSUtM/edit',
  defaultConvocazioniTabName: '',

  // Intervallo di aggiornamento automatico (in minuti, 0 = disattivato)
  autoRefreshInterval: 5,
};
