import { Partita } from '../types';
import { formatMatchDateAndDay } from './dateFormatter';

export interface MatchSharePayload {
  title: string;
  text: string;
  url?: string;
}

export type NativeShareResult =
  | { status: 'shared' }
  | { status: 'aborted' }
  | { status: 'unsupported' };

/**
 * Restituisce il link Google Maps diretto dal foglio dati se valido,
 * oppure costruisce automaticamente una ricerca Google Maps per impianto + indirizzo + comune.
 */
export function buildMapsUrl(partita: Partita): string {
  if (
    partita.lnkMaps &&
    partita.lnkMaps.trim() !== '#' &&
    partita.lnkMaps.trim().startsWith('http')
  ) {
    return partita.lnkMaps.trim();
  }

  const queryParts = [partita.campo, partita.indirizzo, partita.comune]
    .map(v => (v || '').trim())
    .filter(Boolean);

  if (queryParts.length === 0) {
    return 'https://www.google.com/maps/search/?api=1&query=Genzano+di+Roma';
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    queryParts.join(', ')
  )}`;
}

/**
 * Formatta i dettagli gara secondo il template ufficiale Cynthia 1920
 * pronto per WhatsApp, Telegram, Email e Web Share API.
 */
export function buildMatchSharePayload(partita: Partita): MatchSharePayload {
  const dateInfo = formatMatchDateAndDay(partita.data, partita.ora);
  const mapsUrl = buildMapsUrl(partita);

  const dayFormatted = dateInfo.dayOfWeek
    ? dateInfo.dayOfWeek.charAt(0) + dateInfo.dayOfWeek.slice(1).toLowerCase()
    : '';
  const cleanHour = dateInfo.oraFormatted.replace(/^ORE\s+/i, '').trim();
  const addressPart = [partita.indirizzo, partita.comune].filter(Boolean).join(', ');
  const venueFormatted = addressPart
    ? `${partita.campo} (${addressPart})`
    : partita.campo;

  const roundMeta = [
    partita.girone && partita.girone !== '#' ? `Girone ${partita.girone}` : '',
    partita.gara || '',
  ]
    .filter(Boolean)
    .join(' · ');

  const lines = [
    `⚽ *CYNTHIA 1920 — ${partita.campionato}*`,
    roundMeta ? `🏆 ${roundMeta}` : '',
    `📅 ${dayFormatted} ${dateInfo.dayNumber}/${dateInfo.monthNumber}/${dateInfo.year} — Ore ${cleanHour}`,
    `🆚 ${partita.squadraCasa} vs ${partita.squadraOspite}`,
    `📍 ${venueFormatted}`,
    `🗺️ ${mapsUrl}`,
  ].filter(Boolean);

  const shareUrl =
    typeof window !== 'undefined' &&
    window.location.href.startsWith('http')
      ? window.location.href
      : undefined;

  return {
    title: `Cynthia 1920 · ${partita.campionato}: ${partita.squadraCasa} vs ${partita.squadraOspite}`,
    text: lines.join('\n'),
    ...(shareUrl ? { url: shareUrl } : {}),
  };
}

/**
 * Costruisce il link diretto wa.me per aprire WhatsApp con il testo gara precompilato.
 */
export function getWhatsAppShareUrl(partita: Partita): string {
  const { text } = buildMatchSharePayload(partita);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Invoca la Web Share API nativa se supportata e autorizzata.
 */
export async function triggerNativeMatchShare(
  partita: Partita
): Promise<NativeShareResult> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return { status: 'unsupported' };
  }

  const payload = buildMatchSharePayload(partita);
  const shareData: ShareData = {
    title: payload.title,
    text: payload.text,
  };

  if (payload.url) {
    shareData.url = payload.url;
  }

  try {
    if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
      const textOnlyData: ShareData = { title: payload.title, text: payload.text };
      if (!navigator.canShare(textOnlyData)) {
        return { status: 'unsupported' };
      }
      await navigator.share(textOnlyData);
      return { status: 'shared' };
    }

    await navigator.share(shareData);
    return { status: 'shared' };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { status: 'aborted' };
    }
    return { status: 'unsupported' };
  }
}
