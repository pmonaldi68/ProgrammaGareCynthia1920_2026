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
 * Formats complete match details (teams, date, time, location, maps link)
 * for native Web Share API and messaging fallbacks.
 */
export function buildMatchSharePayload(partita: Partita): MatchSharePayload {
  const dateInfo = formatMatchDateAndDay(partita.data, partita.ora);
  const hasValidMapsUrl =
    Boolean(partita.lnkMaps) &&
    partita.lnkMaps !== '#' &&
    partita.lnkMaps.startsWith('http');

  const roundPart = [
    partita.campionato,
    partita.girone && partita.girone !== '#' ? `Girone ${partita.girone}` : '',
    partita.gara || '',
  ]
    .filter(Boolean)
    .join(' · ');

  const locationLine = [
    partita.campo,
    partita.tipo ? `(${partita.tipo})` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const addressLine = [partita.indirizzo, partita.comune].filter(Boolean).join(', ');

  const lines = [
    `🏆 ${roundPart || 'Gara Ufficiale'}`,
    `⚽ ${partita.squadraCasa} vs ${partita.squadraOspite}`,
    `📅 ${dateInfo.compactDisplay} · ore ${dateInfo.oraFormatted}`,
    `📍 ${locationLine}`,
    addressLine ? `🗺️ ${addressLine}` : '',
    hasValidMapsUrl ? `Navigatore: ${partita.lnkMaps}` : '',
    '🔵⚪ ASD Cynthia 1920',
  ].filter(Boolean);

  const shareUrl =
    typeof window !== 'undefined' &&
    window.location.href.startsWith('http')
      ? window.location.href
      : undefined;

  return {
    title: `${partita.campionato}: ${partita.squadraCasa} vs ${partita.squadraOspite}`,
    text: lines.join('\n'),
    ...(shareUrl ? { url: shareUrl } : {}),
  };
}

/**
 * Invokes the browser's native Web Share API when supported and allowed.
 * Gracefully distinguishes user cancellation (AbortError) from unsupported/blocked contexts.
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
      // Try sharing without URL if strict canShare rejects URL in sandboxed context
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
