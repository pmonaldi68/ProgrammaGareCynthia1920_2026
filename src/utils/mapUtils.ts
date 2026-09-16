/**
 * Utility per estrarre o generare URL di embed di Google Maps
 * da un oggetto Partita, supportando iframe sicuri ed efficienti.
 */
import { Partita } from '../types';

export function getGoogleMapsEmbedUrl(partita: Partita): string {
  // Costruiamo una query ricca basata su Campo, Indirizzo e Comune
  const queryParts = [partita.campo, partita.indirizzo, partita.comune].filter(Boolean);
  const query = queryParts.length > 0 ? queryParts.join(', ') : 'Genzano di Roma';

  // Usiamo l'URL di embed standard di Google Maps basato su query
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}
