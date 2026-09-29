/**
 * Utility per estrarre o generare URL di embed di Google Maps
 * da un oggetto Partita, supportando iframe sicuri ed efficienti.
 */
import { Partita } from '../types';
import { getInitialCoordinates } from './geoUtils';

export function getGoogleMapsEmbedUrl(partita: Partita): string {
  // 1. Se abbiamo coordinate precise estratte dal link Maps, lat/lng o dizionario stadi
  const coords = getInitialCoordinates(partita);
  if (coords && coords[0] && coords[1]) {
    const label = encodeURIComponent(partita.campo || 'Campo');
    return `https://maps.google.com/maps?q=${coords[0]},${coords[1]}+(${label})&hl=it&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  // 2. Query fallback testuale su Campo, Indirizzo e Comune
  const queryParts = [partita.campo, partita.indirizzo, partita.comune].filter(Boolean);
  const query = queryParts.length > 0 ? queryParts.join(', ') : 'Genzano di Roma';

  // Usiamo l'URL di embed standard di Google Maps basato su query
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=it&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}
