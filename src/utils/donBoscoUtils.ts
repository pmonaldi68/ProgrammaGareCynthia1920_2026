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

/**
 * Riconosce la Società / Club associato a una partita (colonna SOCIETA' o dedotta da squadre e campionato).
 * Restituisce uno dei club ufficiali:
 * - 'CYNTHIA 1920'
 * - 'ACADEMY CYNTHIA GENZANO'
 * - 'ALBACYNTHIA'
 * - 'P.G.S. DON BOSCO GENZANO'
 * o il nome esatto specificato nella colonna SOCIETA'.
 */
export function detectPartitaClub(
  partita?: Partial<Pick<Partita, 'societa' | 'squadraCasa' | 'squadraOspite' | 'campionato' | 'gara'>> | null
): string {
  if (!partita) return 'CYNTHIA 1920';

  // 1. Se è esplicitamente indicata la società (dalla colonna SOCIETA' del dataset)
  if (partita.societa && partita.societa.trim()) {
    const raw = partita.societa.trim();
    const upper = raw.toUpperCase();
    if (upper === 'CYNTHIA' || upper === 'CYNTHIA 1920' || upper === 'ASD CYNTHIA 1920') {
      return 'CYNTHIA 1920';
    }
    if (upper === 'ACADEMY' || upper.includes('ACADEMY CYNTHIA') || upper === 'ACADEMY CYNTHIA GENZANO') {
      return 'ACADEMY CYNTHIA GENZANO';
    }
    if (upper === 'ALBA' || upper === 'ALBACYNTHIA' || upper.includes('ALBACYNTHIA')) {
      return 'ALBACYNTHIA';
    }
    if (upper.includes('DON BOSCO') || upper.includes('PGS')) {
      return 'P.G.S. DON BOSCO GENZANO';
    }
    return raw;
  }

  // 2. Se è identificata come Don Bosco Genzano
  if (isDonBoscoGenzanoMatch(partita)) {
    return 'P.G.S. DON BOSCO GENZANO';
  }

  // 3. Deduzione da squadraCasa, squadraOspite o campionato
  const casa = (partita.squadraCasa || '').toUpperCase();
  const ospite = (partita.squadraOspite || '').toUpperCase();
  const camp = (partita.campionato || '').toUpperCase();

  if (casa.includes('ALBACYNTHIA') || ospite.includes('ALBACYNTHIA') || camp.includes('ALBACYNTHIA')) {
    return 'ALBACYNTHIA';
  }
  if (casa.includes('ACADEMY') || ospite.includes('ACADEMY') || camp.includes('ACADEMY')) {
    return 'ACADEMY CYNTHIA GENZANO';
  }
  if (casa.includes('CYNTHIA') || ospite.includes('CYNTHIA')) {
    return 'CYNTHIA 1920';
  }

  return 'CYNTHIA 1920';
}
