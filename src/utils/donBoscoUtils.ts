import { Partita } from '../types';

/**
 * Normalizza e verifica se una stringa si riferisce alla P.G.S. DON BOSCO GENZANO.
 * Supporta tutte le varianti di digitazione:
 * - P.G.S. DON BOSCO GENZANO / PGS DON BOSCO GENZANO
 * - DON BOSCO GENZANO / DON BOSCO
 * - P.G.S. DON BOSCO / PGS DON BOSCO
 * - POL. GIOVANILE SALESIANA DON BOSCO GENZANO
 */
export function isDonBoscoGenzanoName(name?: string | null): boolean {
  if (!name) return false;

  const s = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  if (!s) return false;

  // Corrispondenze esplicite
  if (
    s.includes('donboscogenzano') ||
    s.includes('pgsdonbosco') ||
    s.includes('pgsdonboscogenzano') ||
    s.includes('pgsboscogenzano')
  ) {
    return true;
  }

  // Presenza di Don Bosco o PGS Bosco
  if (s.includes('donbosco') || (s.includes('pgs') && s.includes('bosco'))) {
    // Esclude Don Bosco di altre città se chiaramente specificato e non Genzano
    if (
      (s.includes('gaeta') || s.includes('mandrione') || s.includes('cinecitta') || s.includes('tivoli')) &&
      !s.includes('genzano')
    ) {
      return false;
    }
    return true;
  }

  // Se contiene Don + Bosco + Genzano separati
  if (s.includes('don') && s.includes('bosco') && s.includes('genzano')) {
    return true;
  }

  return false;
}

/**
 * Determina se una partita appartiene alla P.G.S. DON BOSCO GENZANO
 * (sia che giochi in casa o fuori, o sia specificata nella categoria/gara).
 */
export function isDonBoscoGenzanoMatch(
  partita: Partial<Pick<Partita, 'squadraCasa' | 'squadraOspite' | 'campionato' | 'gara'>>
): boolean {
  if (!partita) return false;

  return (
    isDonBoscoGenzanoName(partita.squadraCasa) ||
    isDonBoscoGenzanoName(partita.squadraOspite) ||
    isDonBoscoGenzanoName(partita.campionato) ||
    isDonBoscoGenzanoName(partita.gara)
  );
}

/**
 * Filtra le sole partite destinate all'area pubblica
 * (esclude rigorosamente le gare della P.G.S. DON BOSCO GENZANO).
 */
export function getPublicPartite<T extends Partial<Pick<Partita, 'squadraCasa' | 'squadraOspite' | 'campionato' | 'gara'>>>(
  partite: T[]
): T[] {
  return (partite || []).filter((p) => !isDonBoscoGenzanoMatch(p));
}

/**
 * Estrae le sole gare riservate della P.G.S. DON BOSCO GENZANO
 * per l'amministrazione, convocazioni e utility.
 */
export function getDonBoscoPartite<T extends Partial<Pick<Partita, 'squadraCasa' | 'squadraOspite' | 'campionato' | 'gara'>>>(
  partite: T[]
): T[] {
  return (partite || []).filter((p) => isDonBoscoGenzanoMatch(p));
}
