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
    `\u26BD *CYNTHIA 1920 \u2014 ${partita.campionato}*`,
    roundMeta ? `\u{1F3C6} ${roundMeta}` : '',
    `\u{1F4C5} ${dayFormatted} ${dateInfo.dayNumber}/${dateInfo.monthNumber}/${dateInfo.year} \u2014 Ore ${cleanHour}`,
    `\u{1F19A} ${partita.squadraCasa} vs ${partita.squadraOspite}`,
    `\u{1F4CD} ${venueFormatted}`,
    `\u{1F5FA}\uFE0F ${mapsUrl}`,
  ].filter(Boolean);

  const shareUrl =
    typeof window !== 'undefined' &&
    window.location.href.startsWith('http')
      ? window.location.href
      : undefined;

  return {
    title: `Cynthia 1920 \u00B7 ${partita.campionato}: ${partita.squadraCasa} vs ${partita.squadraOspite}`,
    text: lines.join('\n'),
    ...(shareUrl ? { url: shareUrl } : {}),
  };
}

/**
 * Costruisce il link diretto api.whatsapp.com/send preservando correttamente
 * tutte le emoji UTF-8 (a differenza del redirect wa.me che puo alterare i caratteri multibyte).
 */
export function getWhatsAppShareUrl(partita: Partita): string {
  const { text } = buildMatchSharePayload(partita);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
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
