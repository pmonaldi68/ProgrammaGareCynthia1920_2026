import { Partita } from '../types';

export type MatchPeriod = 'non_iniziata' | 'primo_tempo' | 'intervallo' | 'secondo_tempo' | 'supplementari' | 'terminata';

export type EventoType = 'gol' | 'ammonizione' | 'espulsione' | 'sostituzione' | 'nota';

export interface TabellinoEvento {
  id: string;
  minuto: number;
  periodo: '1T' | '2T' | 'SUPP';
  tipo: EventoType;
  squadra: 'casa' | 'ospite';
  giocatore: string;
  dettaglio?: string; // Es. "Rigore", "Autogol", "Esce Bianchi - Entra Rossi"
  timestamp: number;
}

export interface TabellinoData {
  partitaId: string;
  campionato: string;
  girone: string;
  gara: string;
  data: string;
  ora: string;
  campo: string;
  indirizzo: string;
  comune: string;
  squadraCasa: string;
  squadraOspite: string;
  isCynthiaCasa: boolean;
  isCynthiaOspite: boolean;
  golCasa: number;
  golOspite: number;
  stato: MatchPeriod;
  minutoCorrente: number;
  timerAttivo: boolean;
  eventi: TabellinoEvento[];
  noteStaff: string;
  miglioreInCampo?: string;
  ultimoAggiornamento: number;
}

const STORAGE_PREFIX = 'cynthia_tabellino_v1_';

export function getInitialTabellino(partita: Partita): TabellinoData {
  return {
    partitaId: partita.id,
    campionato: partita.campionato,
    girone: partita.girone,
    gara: partita.gara,
    data: partita.data,
    ora: partita.ora,
    campo: partita.campo,
    indirizzo: partita.indirizzo,
    comune: partita.comune,
    squadraCasa: partita.squadraCasa,
    squadraOspite: partita.squadraOspite,
    isCynthiaCasa: partita.isCynthiaCasa,
    isCynthiaOspite: partita.isCynthiaOspite,
    golCasa: 0,
    golOspite: 0,
    stato: 'non_iniziata',
    minutoCorrente: 0,
    timerAttivo: false,
    eventi: [],
    noteStaff: '',
    miglioreInCampo: '',
    ultimoAggiornamento: Date.now(),
  };
}

export function loadTabellino(partita: Partita): TabellinoData {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${partita.id}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Mantieni aggiornati i dettagli della partita in caso di cambi nel foglio
      return {
        ...getInitialTabellino(partita),
        ...parsed,
        partitaId: partita.id,
        squadraCasa: partita.squadraCasa,
        squadraOspite: partita.squadraOspite,
        campionato: partita.campionato,
        campo: partita.campo,
      };
    }
  } catch (err) {
    console.warn('Errore lettura tabellino da localStorage:', err);
  }
  return getInitialTabellino(partita);
}

export function saveTabellino(data: TabellinoData): void {
  try {
    const toSave = {
      ...data,
      ultimoAggiornamento: Date.now(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}${data.partitaId}`, JSON.stringify(toSave));
  } catch (err) {
    console.warn('Errore salvataggio tabellino in localStorage:', err);
  }
}

export function resetTabellino(partita: Partita): TabellinoData {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${partita.id}`);
  } catch (err) {
    console.warn('Errore reset tabellino:', err);
  }
  return getInitialTabellino(partita);
}

export function formatStatoGara(stato: MatchPeriod, minuto: number): string {
  switch (stato) {
    case 'non_iniziata':
      return '⏱️ Inizio Programmato';
    case 'primo_tempo':
      return `🔴 LIVE - 1° Tempo (${minuto}')`;
    case 'intervallo':
      return '⏸️ Fine 1° Tempo (Intervallo)';
    case 'secondo_tempo':
      return `🔴 LIVE - 2° Tempo (${minuto}')`;
    case 'supplementari':
      return `🔴 Supplementari (${minuto}')`;
    case 'terminata':
      return '🏁 RISULTATO FINALE';
    default:
      return 'Gara in Corso';
  }
}

/**
 * Genera il messaggio WhatsApp formattato con tutti i dettagli e marcatori
 */
export function buildWhatsAppTabellino(tabellino: TabellinoData): string {
  const isFinale = tabellino.stato === 'terminata';
  const statoHeader = isFinale
    ? `🏁 RISULTATO FINALE: ${tabellino.squadraCasa} ${tabellino.golCasa} - ${tabellino.golOspite} ${tabellino.squadraOspite}`
    : `🔴 AGGIORNAMENTO LIVE: ${tabellino.squadraCasa} ${tabellino.golCasa} - ${tabellino.golOspite} ${tabellino.squadraOspite}`;

  let lines: string[] = [];
  lines.push(statoHeader);
  lines.push(`🏆 ${tabellino.campionato}${tabellino.girone && tabellino.girone !== '#' ? ` (Girone ${tabellino.girone})` : ''}`);
  lines.push(`📍 Campo: ${tabellino.campo} (${tabellino.comune})`);
  lines.push(`⏱️ Stato: ${formatStatoGara(tabellino.stato, tabellino.minutoCorrente)}`);
  lines.push('');

  // 1. Marcatori / Gol
  const golEventi = tabellino.eventi.filter(e => e.tipo === 'gol');
  if (golEventi.length > 0) {
    lines.push('⚽ MARCATORI:');
    golEventi.forEach(e => {
      const sq = e.squadra === 'casa' ? tabellino.squadraCasa : tabellino.squadraOspite;
      const extra = e.dettaglio ? ` (${e.dettaglio})` : '';
      lines.push(`• ${e.minuto}' ${e.giocatore} [${sq}]${extra}`);
    });
    lines.push('');
  }

  // 2. Ammonizioni & Espulsioni
  const cartellini = tabellino.eventi.filter(e => e.tipo === 'ammonizione' || e.tipo === 'espulsione');
  if (cartellini.length > 0) {
    lines.push('📋 PROVVEDIMENTI DISCIPLINARI:');
    cartellini.forEach(e => {
      const icon = e.tipo === 'espulsione' ? '🟥' : '🟨';
      const label = e.tipo === 'espulsione' ? 'Espulso' : 'Ammonito';
      const sq = e.squadra === 'casa' ? tabellino.squadraCasa : tabellino.squadraOspite;
      lines.push(`${icon} ${e.minuto}' ${label}: ${e.giocatore} (${sq})`);
    });
    lines.push('');
  }

  // 3. Sostituzioni
  const sostituzioni = tabellino.eventi.filter(e => e.tipo === 'sostituzione');
  if (sostituzioni.length > 0) {
    lines.push('🔄 CAMBI:');
    sostituzioni.forEach(e => {
      const sq = e.squadra === 'casa' ? tabellino.squadraCasa : tabellino.squadraOspite;
      lines.push(`• ${e.minuto}' ${e.giocatore} ${e.dettaglio ? `(${e.dettaglio})` : ''} [${sq}]`);
    });
    lines.push('');
  }

  // 4. Migliore in campo o note
  if (tabellino.miglioreInCampo && tabellino.miglioreInCampo.trim()) {
    lines.push(`⭐ Migliore in campo: ${tabellino.miglioreInCampo.trim()}`);
  }

  if (tabellino.noteStaff && tabellino.noteStaff.trim()) {
    lines.push(`📝 Note: ${tabellino.noteStaff.trim()}`);
  }

  lines.push('');
  lines.push('🔵⚪ Forza ASD Cynthia 1920!');

  return lines.join('\n');
}
