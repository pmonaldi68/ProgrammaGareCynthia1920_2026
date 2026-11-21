import React, { useMemo } from 'react';
import { Partita } from '../types';
import { parseMatchDateTime } from '../utils/calendarUtils';
import { formatMatchDateAndDay } from '../utils/dateFormatter';
import { buildMapsUrl } from '../utils/shareUtils';
import {
  Building2,
  Clock,
  Calendar,
  MapPin,
  Printer,
  Navigation,
  AlertTriangle,
  Users,
  ShieldCheck,
} from 'lucide-react';

interface ImpegnoCampiViewProps {
  partite: Partita[];
}

interface GroupedVenue {
  campo: string;
  indirizzo: string;
  comune: string;
  tipo: string;
  mapsUrl: string;
  matches: Partita[];
}

const formatSlotHour = (date: Date): string =>
  `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

/**
 * Vista "Impegno Campi" dedicata a Segreteria e Custodi:
 * mostra esclusivamente le gare in CASA raggruppate per impianto sportivo
 * e ordinate cronologicamente per giorno e fascia oraria (inclusi intervalli cambio spogliatoi).
 */
export const ImpegnoCampiView: React.FC<ImpegnoCampiViewProps> = ({ partite }) => {
  const homeMatches = useMemo(() => {
    return partite
      .filter(p => p.isCynthiaCasa)
      .sort((a, b) => {
        const startA = parseMatchDateTime(a.data, a.ora).start.getTime();
        const startB = parseMatchDateTime(b.data, b.ora).start.getTime();
        return startA - startB;
      });
  }, [partite]);

  const groupedVenues = useMemo<GroupedVenue[]>(() => {
    const map = new Map<string, GroupedVenue>();

    homeMatches.forEach(partita => {
      const rawVenue = (partita.campo || 'Impianto da definire').trim();
      const key = rawVenue.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.matches.push(partita);
        if (!existing.indirizzo && partita.indirizzo) existing.indirizzo = partita.indirizzo;
        if (!existing.comune && partita.comune) existing.comune = partita.comune;
        if (!existing.tipo && partita.tipo) existing.tipo = partita.tipo;
      } else {
        map.set(key, {
          campo: rawVenue,
          indirizzo: partita.indirizzo || '',
          comune: partita.comune || '',
          tipo: partita.tipo || '',
          mapsUrl: buildMapsUrl(partita),
          matches: [partita],
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.matches.length - a.matches.length);
  }, [homeMatches]);

  const handlePrintPage = () => {
    window.print();
  };

  if (homeMatches.length === 0) {
    return (
      <div
        id="impegno-campi-view"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-10 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center justify-center mx-auto mb-3">
          <Building2 className="w-7 h-7" />
        </div>
        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
          Nessuna gara in casa nei filtri selezionati
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          La vista <strong>Impegno Campi</strong> mostra solo le partite interne per gestire la sequenza di campi e spogliatoi. Prova ad azzerare il filtro "Trasferta" o cambia data.
        </p>
      </div>
    );
  }

  return (
    <section id="impegno-campi-view" className="space-y-5">
      {/* Header Operativo Segreteria / Custodi */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-200/90 dark:border-sky-900/70 border-l-4 border-l-sky-700 dark:border-l-sky-400 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 border border-amber-400/60">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              Segreteria & Custodi
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Impegno Campi — Gare Interne
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 tabular-nums">
            <strong>{homeMatches.length}</strong> gare in casa su{' '}
            <strong>{groupedVenues.length}</strong> {groupedVenues.length === 1 ? 'impianto' : 'impianti'}, ordinate cronologicamente per fascia oraria e rotazione spogliatoi.
          </p>
        </div>

        <button
          id="btn-print-impegno-campi"
          type="button"
          onClick={handlePrintPage}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-sky-700 hover:bg-sky-600 active:scale-[0.98] text-white transition cursor-pointer shrink-0 min-h-[44px]"
          title="Stampa foglio impegno campi in formato A4"
        >
          <Printer className="w-4 h-4 shrink-0" />
          <span>Stampa / PDF A4</span>
        </button>
      </div>

      {/* Griglia / Lista per Singolo Impianto */}
      <div className="space-y-5">
        {groupedVenues.map(venue => {
          // Raggruppa cronologicamente le gare dello stesso impianto per giornata
          const matchesByDay = venue.matches.reduce<Array<{ dateKey: string; dayLabel: string; items: Partita[] }>>(
            (acc, m) => {
              const info = formatMatchDateAndDay(m.data, m.ora);
              const dateKey = `${info.dayNumber}/${info.monthNumber}/${info.year}`;
              const dayLabel = `${info.dayOfWeek} ${dateInfoDayMonth(info)}`;
              const existingDay = acc.find(g => g.dateKey === dateKey);
              if (existingDay) {
                existingDay.items.push(m);
              } else {
                acc.push({ dateKey, dayLabel, items: [m] });
              }
              return acc;
            },
            []
          );

          return (
            <article
              key={venue.campo}
              className="impegno-venue-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-sky-600 dark:border-l-sky-400 overflow-hidden shadow-2xs"
            >
              {/* Intestazione Impianto Sportivo */}
              <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-sky-50/90 via-white to-amber-50/40 dark:from-sky-950/50 dark:via-slate-900 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Building2 className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0" />
                    <a
                      href={venue.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white hover:text-sky-700 dark:hover:text-sky-300 hover:underline transition-colors truncate"
                      title={`Apri ${venue.campo} su Google Maps`}
                    >
                      {venue.campo}
                    </a>
                    {venue.tipo && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {venue.tipo}
                      </span>
                    )}
                  </div>
                  {(venue.indirizzo || venue.comune) && (
                    <a
                      href={venue.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-300 hover:underline mt-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>
                        {[venue.indirizzo, venue.comune].filter(Boolean).join(' · ')}
                      </span>
                      <Navigation className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0 no-print-inline" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-sky-700 text-white border border-amber-400/50 tabular-nums">
                    <Users className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>
                      {venue.matches.length} {venue.matches.length === 1 ? 'partita' : 'partite'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Tabella Cronologica Sequenza Gare & Spogliatoi */}
              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {matchesByDay.map(dayGroup => (
                  <div key={dayGroup.dateKey} className="p-3 sm:p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 pb-1">
                      <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                        <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{dayGroup.dayLabel}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                        {dayGroup.items.length} {dayGroup.items.length === 1 ? 'turno' : 'turni'} in campo
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <th className="py-2 pr-3 whitespace-nowrap">Fascia Oraria</th>
                            <th className="py-2 px-3 whitespace-nowrap">Categoria</th>
                            <th className="py-2 px-3">Incontro (Casa vs Ospite)</th>
                            <th className="py-2 px-3 whitespace-nowrap">Girone / Gara</th>
                            <th className="py-2 pl-3 text-right whitespace-nowrap">Rotazione / Spogliatoi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-[13px]">
                          {dayGroup.items.map((match, idx) => {
                            const { start, end } = parseMatchDateTime(match.data, match.ora);
                            const prevMatch = idx > 0 ? dayGroup.items[idx - 1] : null;
                            const prevEnd = prevMatch
                              ? parseMatchDateTime(prevMatch.data, prevMatch.ora).end
                              : null;
                            const gapMinutes = prevEnd
                              ? Math.round((start.getTime() - prevEnd.getTime()) / 60000)
                              : null;

                            const isTightTurnaround = gapMinutes !== null && gapMinutes < 30;
                            const isOverlap = gapMinutes !== null && gapMinutes < 0;

                            return (
                              <tr
                                key={match.id}
                                className="hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-colors"
                              >
                                <td className="py-2.5 pr-3 whitespace-nowrap align-middle">
                                  <div className="inline-flex items-center gap-1.5 font-mono font-extrabold text-slate-900 dark:text-white bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2.5 py-1 rounded-lg tabular-nums">
                                    <Clock className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400 shrink-0" />
                                    <span>{formatSlotHour(start)}</span>
                                    <span className="text-slate-400 font-normal">–</span>
                                    <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs">
                                      {formatSlotHour(end)}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                                  <span className="font-extrabold text-sky-900 dark:text-sky-200">
                                    {match.campionato}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 align-middle">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-extrabold text-sky-950 dark:text-white">
                                      {match.squadraCasa}
                                    </span>
                                    <span className="text-[11px] font-bold uppercase text-slate-400">
                                      vs
                                    </span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      {match.squadraOspite}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 whitespace-nowrap align-middle text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                  {[
                                    match.girone && match.girone !== '#' ? `Gir. ${match.girone}` : '',
                                    match.gara || '',
                                  ]
                                    .filter(Boolean)
                                    .join(' · ') || '—'}
                                </td>

                                <td className="py-2.5 pl-3 text-right whitespace-nowrap align-middle">
                                  {gapMinutes === null ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                      1° turno
                                    </span>
                                  ) : isOverlap ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 tabular-nums">
                                      <AlertTriangle className="w-3 h-3 shrink-0" />
                                      <span>Sovrapp. {Math.abs(gapMinutes)}m</span>
                                    </span>
                                  ) : isTightTurnaround ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 tabular-nums">
                                      <AlertTriangle className="w-3 h-3 shrink-0" />
                                      <span>Cambio +{gapMinutes}m</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 tabular-nums">
                                      Pausa +{gapMinutes}m
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

function dateInfoDayMonth(info: ReturnType<typeof formatMatchDateAndDay>): string {
  return `${info.dayNumber} ${info.monthName.charAt(0) + info.monthName.slice(1).toLowerCase()} ${info.year}`;
}
