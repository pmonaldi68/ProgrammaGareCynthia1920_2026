/**
 * Utility per la formattazione ultra-leggibile delle date e orari delle partite.
 * Garantisce giorno della settimana rigorosamente in MAIUSCOLO (es. "SABATO", "DOMENICA")
 * e alta leggibilità di data e orario sia su mobile che desktop.
 */

const GIORNI_SETTIMANA_UPPER = [
  'DOMENICA',
  'LUNEDÌ',
  'MARTEDÌ',
  'MERCOLEDÌ',
  'GIOVEDÌ',
  'VENERDÌ',
  'SABATO',
];

const MESI_ITALIANI_UPPER = [
  'GENNAIO',
  'FEBBRAIO',
  'MARZO',
  'APRILE',
  'MAGGIO',
  'GIUGNO',
  'LUGLIO',
  'AGOSTO',
  'SETTEMBRE',
  'OTTOBRE',
  'NOVEMBRE',
  'DICEMBRE',
];

export interface FormattedDateInfo {
  dayOfWeek: string; // Es. "SABATO", "DOMENICA" (rigorosamente in MAIUSCOLO)
  dayNumber: string; // Es. "19"
  monthName: string; // Es. "SETTEMBRE"
  monthNumber: string; // Es. "09"
  year: string; // Es. "2026"
  formattedDisplay: string; // Es. "SABATO 19 SETTEMBRE 2026"
  compactDisplay: string; // Es. "SABATO 19/09/2026"
  oraFormatted: string; // Es. "ORE 15:30"
}

export function formatMatchDateAndDay(dataStr: string, oraStr?: string): FormattedDateInfo {
  const cleanData = (dataStr || '').trim();
  const now = new Date();
  let day = now.getDate();
  let month = now.getMonth(); // 0-indexed
  let year = now.getFullYear();
  let explicitDayOfWeek = '';

  // Controlla se nella stringa è già presente il nome del giorno (es. "sabato 19/09/2026")
  const lower = cleanData.toLowerCase();
  for (let i = 0; i < GIORNI_SETTIMANA_UPPER.length; i++) {
    const nomeBase = GIORNI_SETTIMANA_UPPER[i].toLowerCase().replace('ì', 'i');
    const nomeAccento = GIORNI_SETTIMANA_UPPER[i].toLowerCase();
    if (lower.includes(nomeBase) || lower.includes(nomeAccento)) {
      explicitDayOfWeek = GIORNI_SETTIMANA_UPPER[i];
      break;
    }
  }

  // Estrai giorno, mese e anno con regex (es. 19/09/2026 o 19/09 o 2026-09-19)
  const slashMatch = cleanData.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  const isoMatch = cleanData.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (slashMatch) {
    day = parseInt(slashMatch[1], 10);
    month = parseInt(slashMatch[2], 10) - 1;
    if (slashMatch[3]) {
      let y = parseInt(slashMatch[3], 10);
      if (y < 100) y += 2000;
      year = y;
    }
  } else if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10) - 1;
    day = parseInt(isoMatch[3], 10);
  }

  // Se non era esplicitato nella stringa, calcola il giorno della settimana matematicamente
  const parsedDate = new Date(year, month, day);
  const computedDayOfWeek = isNaN(parsedDate.getTime())
    ? 'SABATO'
    : GIORNI_SETTIMANA_UPPER[parsedDate.getDay()];

  const dayOfWeek = explicitDayOfWeek || computedDayOfWeek;
  const dayNumber = day.toString().padStart(2, '0');
  const monthNumber = (month + 1).toString().padStart(2, '0');
  const monthName = MESI_ITALIANI_UPPER[month] || 'SETTEMBRE';

  // Formattazione ora
  const cleanOra = (oraStr || '').trim();
  const timeMatch = cleanOra.match(/(\d{1,2})[:\.](\d{2})/);
  let oraFormatted = 'ORE 10:00';
  if (timeMatch) {
    const hh = timeMatch[1].padStart(2, '0');
    const mm = timeMatch[2];
    oraFormatted = `ORE ${hh}:${mm}`;
  } else if (cleanOra) {
    oraFormatted = cleanOra.toUpperCase().startsWith('ORE') ? cleanOra.toUpperCase() : `ORE ${cleanOra}`;
  }

  return {
    dayOfWeek,
    dayNumber,
    monthName,
    monthNumber,
    year: year.toString(),
    formattedDisplay: `${dayOfWeek} ${dayNumber} ${monthName} ${year}`,
    compactDisplay: `${dayOfWeek} ${dayNumber}/${monthNumber}/${year}`,
    oraFormatted,
  };
}
