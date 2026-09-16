import { Partita } from '../types';

/**
 * Converte data (es. "sabato 19/09/2026" o "19/09/2026") e ora ("10:30")
 * in oggetti Date di inizio e fine evento (durata predefinita gara: 2 ore).
 */
export function parseMatchDateTime(dataStr: string, oraStr: string): { start: Date; end: Date } {
  const now = new Date();
  let day = now.getDate();
  let month = now.getMonth(); // 0-indexed
  let year = now.getFullYear();

  // Cerca pattern gg/mm/aaaa o gg/mm
  const dateMatch = (dataStr || '').match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (dateMatch) {
    day = parseInt(dateMatch[1], 10);
    month = parseInt(dateMatch[2], 10) - 1;
    if (dateMatch[3]) {
      let y = parseInt(dateMatch[3], 10);
      if (y < 100) y += 2000;
      year = y;
    }
  }

  let hours = 10;
  let minutes = 0;
  const timeMatch = (oraStr || '').match(/(\d{1,2})[:\.](\d{2})/);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
  }

  const start = new Date(year, month, day, hours, minutes, 0);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 ore di durata stimata

  return { start, end };
}

/**
 * Converte una stringa data della partita (es. "sabato 19/09/2026" o "19/09/2026")
 * in un formato standard comparabile "YYYY-MM-DD"
 */
export function getMatchIsoDate(dataStr: string): string | null {
  if (!dataStr) return null;
  const dateMatch = dataStr.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (!dateMatch) return null;

  const now = new Date();
  const day = parseInt(dateMatch[1], 10).toString().padStart(2, '0');
  const month = parseInt(dateMatch[2], 10).toString().padStart(2, '0');
  let year = now.getFullYear();
  if (dateMatch[3]) {
    let y = parseInt(dateMatch[3], 10);
    if (y < 100) y += 2000;
    year = y;
  }

  return `${year}-${month}-${day}`;
}

function formatDateToIsoUtc(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d+/g, '');
}

/**
 * Genera il link per aggiungere l'evento a Google Calendar direttamente nel browser
 */
export function generateGoogleCalendarUrl(partita: Partita): string {
  const { start, end } = parseMatchDateTime(partita.data, partita.ora);
  const startStr = formatDateToIsoUtc(start);
  const endStr = formatDateToIsoUtc(end);

  const title = `⚽ ${partita.squadraCasa} vs ${partita.squadraOspite} (${partita.campionato})`;
  const location = [partita.campo, partita.indirizzo, partita.comune].filter(Boolean).join(', ');
  const details = [
    `Campionato: ${partita.campionato} ${partita.girone ? `(${partita.girone})` : ''}`,
    partita.gara ? `Tipo Gara: ${partita.gara}` : '',
    `Fondo: ${partita.tipo || 'Sintetico'}`,
    `Campo: ${partita.campo}`,
    `Indirizzo: ${partita.indirizzo} - ${partita.comune}`,
    partita.lnkMaps ? `Mappa & Indicazioni: ${partita.lnkMaps}` : '',
    `\nPartita Cynthia 1920 Calcio`,
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Genera e scarica un file .ics standard compatibile con Apple Calendar, Outlook, Android e iOS
 */
export function downloadIcsFile(partita: Partita): void {
  const { start, end } = parseMatchDateTime(partita.data, partita.ora);
  const startStr = formatDateToIsoUtc(start);
  const endStr = formatDateToIsoUtc(end);
  const nowStr = formatDateToIsoUtc(new Date());

  const title = `⚽ ${partita.squadraCasa} vs ${partita.squadraOspite} (${partita.campionato})`;
  const location = [partita.campo, partita.indirizzo, partita.comune].filter(Boolean).join(', ');
  const description = [
    `Campionato: ${partita.campionato} ${partita.girone ? `(${partita.girone})` : ''}`,
    partita.gara ? `Gara: ${partita.gara}` : '',
    `Fondo: ${partita.tipo || 'Sintetico'}`,
    `Campo: ${partita.campo}`,
    `Indirizzo: ${partita.indirizzo}, ${partita.comune}`,
    partita.lnkMaps ? `Mappa: ${partita.lnkMaps}` : '',
  ]
    .filter(Boolean)
    .join('\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ASD Cynthia 1920//Programma Gare//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:cynthia-match-${partita.id || Date.now()}@cynthia1920.it`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanFilename = `${partita.campionato}_${partita.squadraCasa}_vs_${partita.squadraOspite}`
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();
  link.setAttribute('download', `${cleanFilename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
