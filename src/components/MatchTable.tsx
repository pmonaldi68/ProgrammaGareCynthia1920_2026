import React, { useState } from 'react';
import { Partita } from '../types';
import {
  Navigation,
  CalendarPlus,
  Share2,
  Download,
  ExternalLink,
  Check,
  Clock,
} from 'lucide-react';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils';
import { formatMatchDateAndDay } from '../utils/dateFormatter';
import { buildMatchSharePayload, triggerNativeMatchShare } from '../utils/shareUtils';
import { WeatherBadge } from './WeatherBadge';
import { Countdown } from './Countdown';
import { MatchDetailModal } from './MatchDetailModal';

interface MatchTableProps {
  partite: Partita[];
}

export const MatchTable: React.FC<MatchTableProps> = ({ partite }) => {
  const [activeCalendarPartitaId, setActiveCalendarPartitaId] = useState<string | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [selectedPartita, setSelectedPartita] = useState<Partita | null>(null);

  const handleShare = async (e: React.MouseEvent, p: Partita) => {
    e.stopPropagation();
    const result = await triggerNativeMatchShare(p);
    if (result.status === 'shared') {
      setSharedId(p.id);
      setTimeout(() => setSharedId(null), 2000);
      return;
    }
    if (result.status === 'aborted') {
      return;
    }
    try {
      const payload = buildMatchSharePayload(p);
      await navigator.clipboard.writeText(payload.text);
      setSharedId(p.id);
      setTimeout(() => setSharedId(null), 2000);
    } catch {
      // Clipboard API non disponibile
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800">
        <table className="w-full table-fixed text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/90 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-[11px] font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
              <th scope="col" className="w-[18%] sm:w-[14%] py-3 px-2 sm:px-3 rounded-tl-2xl">
                Data · Ora
              </th>
              <th scope="col" className="hidden md:table-cell md:w-[15%] py-3 px-2.5">
                Categoria · Gir. · Gara
              </th>
              <th scope="col" className="w-[26%] sm:w-[22%] md:w-[17%] py-3 px-2 sm:px-2.5">
                Casa
              </th>
              <th scope="col" className="w-[26%] sm:w-[22%] md:w-[17%] py-3 px-2 sm:px-2.5">
                Ospite
              </th>
              <th scope="col" className="hidden sm:table-cell sm:w-[23%] md:w-[20%] py-3 px-2.5">
                Impianto · Comune · Fondo
              </th>
              <th scope="col" className="hidden lg:table-cell lg:w-[8%] py-3 px-2">
                Meteo
              </th>
              <th scope="col" className="w-[30%] sm:w-[19%] md:w-[17%] lg:w-[9%] py-3 px-2 sm:px-3 text-right rounded-tr-2xl">
                Azioni
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {partite.map((p, idx) => {
              const dInfo = formatMatchDateAndDay(p.data, p.ora);
              const shortDay =
                dInfo.dayOfWeek.charAt(0) + dInfo.dayOfWeek.slice(1, 3).toLowerCase();
              const shortTime = dInfo.oraFormatted.replace(/^ORE\s+/i, '');
              const hasMaps = Boolean(
                p.lnkMaps && p.lnkMaps !== '#' && p.lnkMaps.startsWith('http')
              );
              const categoryDetails = [
                p.campionato,
                p.girone && p.girone !== '#' ? `Gir. ${p.girone}` : '',
                p.gara || '',
              ]
                .filter(Boolean)
                .join(' · ');
              const venueDetails = [p.campo, p.comune, p.tipo || 'Sintetico']
                .filter(Boolean)
                .join(' · ');

              return (
                <tr
                  key={p.id || idx}
                  onClick={() => setSelectedPartita(p)}
                  className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors duration-150 cursor-pointer"
                  title="Clicca per aprire i dettagli completi della gara"
                >
                  {/* 1. Data & Ora su una singola riga */}
                  <td className="py-2.5 px-2 sm:px-3 whitespace-nowrap overflow-hidden">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums truncate"
                        title={dInfo.formattedDisplay}
                      >
                        {shortDay} {dInfo.dayNumber}/{dInfo.monthNumber}
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-mono font-bold text-[11px] bg-slate-900 dark:bg-sky-500/15 text-white dark:text-sky-200 border border-transparent dark:border-sky-500/30 tabular-nums shrink-0">
                        <Clock className="w-2.5 h-2.5 text-amber-400 dark:text-sky-300 hidden xl:inline" />
                        {shortTime}
                      </span>
                    </div>
                  </td>

                  {/* 2. Categoria, Girone e Gara su una singola riga */}
                  <td
                    className="hidden md:table-cell py-2.5 px-2.5 whitespace-nowrap overflow-hidden"
                    title={categoryDetails}
                  >
                    <div className="truncate font-bold text-slate-900 dark:text-white">
                      {p.campionato}
                      {p.girone && p.girone !== '#' && (
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          {' '}
                          · {p.girone}
                        </span>
                      )}
                      {p.gara && (
                        <span className="font-medium text-slate-400 dark:text-slate-500">
                          {' '}
                          · {p.gara}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 3. Squadra Casa */}
                  <td className="py-2.5 px-2 sm:px-2.5 whitespace-nowrap overflow-hidden">
                    <span
                      title={p.squadraCasa}
                      className={`block truncate rounded-md ${
                        p.isCynthiaCasa
                          ? 'font-bold text-sky-900 dark:text-sky-100 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 ring-1 ring-inset ring-sky-200/80 dark:ring-sky-800/70'
                          : 'font-medium text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p.squadraCasa}
                    </span>
                  </td>

                  {/* 4. Squadra Ospite */}
                  <td className="py-2.5 px-2 sm:px-2.5 whitespace-nowrap overflow-hidden">
                    <span
                      title={p.squadraOspite}
                      className={`block truncate rounded-md ${
                        p.isCynthiaOspite
                          ? 'font-bold text-sky-900 dark:text-sky-100 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 ring-1 ring-inset ring-sky-200/80 dark:ring-sky-800/70'
                          : 'font-medium text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p.squadraOspite}
                    </span>
                  </td>

                  {/* 5. Impianto, Comune e Fondo su una singola riga */}
                  <td
                    className="hidden sm:table-cell py-2.5 px-2.5 whitespace-nowrap overflow-hidden"
                    title={venueDetails}
                  >
                    <div className="flex items-center gap-1 min-w-0 truncate text-slate-600 dark:text-slate-300">
                      {hasMaps ? (
                        <a
                          href={p.lnkMaps}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sky-700 dark:text-sky-400 hover:underline font-semibold truncate"
                          title={`Apri ${p.campo} su Google Maps`}
                        >
                          {p.campo}
                        </a>
                      ) : (
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {p.campo}
                        </span>
                      )}
                      {p.comune && (
                        <span className="text-slate-500 dark:text-slate-400 truncate shrink-0">
                          · {p.comune}
                        </span>
                      )}
                      <span className="hidden xl:inline text-slate-400 dark:text-slate-500 shrink-0">
                        · {p.tipo || 'Sintetico'}
                      </span>
                    </div>
                  </td>

                  {/* 6. Meteo / Countdown compatto su una riga */}
                  <td
                    className="hidden lg:table-cell py-2.5 px-2 whitespace-nowrap overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <WeatherBadge partita={p} compact />
                      <Countdown data={p.data} ora={p.ora} compact />
                    </div>
                  </td>

                  {/* 7. Azioni rapide su una singola riga */}
                  <td
                    className="py-2.5 px-2 sm:px-3 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-1 justify-end relative">
                      {hasMaps && (
                        <a
                          href={p.lnkMaps}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Indicazioni per ${p.campo}`}
                          aria-label={`Apri mappa per ${p.campo}`}
                          className="p-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveCalendarPartitaId(
                              activeCalendarPartitaId === p.id ? null : p.id
                            )
                          }
                          title="Esporta nel calendario (Google / .ics)"
                          aria-label="Esporta nel calendario"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                        </button>

                        {activeCalendarPartitaId === p.id && (
                          <div className="modern-popover-enter absolute right-0 bottom-full mb-1.5 w-44 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-40 text-left">
                            <a
                              href={generateGoogleCalendarUrl(p)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setActiveCalendarPartitaId(null)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700/80"
                            >
                              <ExternalLink className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                              Google Calendar
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                downloadIcsFile(p);
                                setActiveCalendarPartitaId(null);
                              }}
                              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700/80 text-left cursor-pointer"
                            >
                              <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Scarica file .ics
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleShare(e, p)}
                        title="Condividi dettagli gara"
                        aria-label="Condividi dettagli gara"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        {sharedId === p.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modale dettagli completi al click sulla riga */}
      <MatchDetailModal
        partita={selectedPartita}
        isOpen={Boolean(selectedPartita)}
        onClose={() => setSelectedPartita(null)}
      />
    </>
  );
};
