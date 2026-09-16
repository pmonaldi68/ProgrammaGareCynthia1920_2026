/**
 * Configurazione principale dell'applicazione ASD Cynthia 1920
 * Inserendo qui il link del tuo foglio Google Sheets, il sito caricherà
 * automaticamente i dati per TUTTI gli utenti senza dover digitare nulla.
 */
export const APP_CONFIG = {
  // Incolla qui il link di Google Sheets (es. https://docs.google.com/spreadsheets/d/.../edit o il link CSV pubblicato)
  // Puoi anche impostarlo tramite la variabile d'ambiente VITE_SHEET_URL
  defaultSheetUrl: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SHEET_URL) || '',

  // Nome eventuale della scheda/foglio (lascia vuoto per il primo foglio)
  defaultTabName: '',

  // Intervallo di aggiornamento automatico (in minuti, 0 = disattivato)
  autoRefreshInterval: 5,
};
