import React, { useState } from 'react';
import { Partita } from '../types';
import { Navigation, CalendarPlus, Share2, Download, ExternalLink, Check, Clock } from 'lucide-react';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils';
import { formatMatchDateAndDay } from '../utils/dateFormatter';
import { buildMatchSharePayload, triggerNativeMatchShare } from '../utils/shareUtils';
import { WeatherBadge } from './WeatherBadge';
import { Countdown } from './Countdown';

interface MatchTableProps {
  partite: Partita[];
}

export const MatchTable: React.FC<MatchTableProps> = ({ partite }) => {
  const [activeCalendarPartitaId, setActiveCalendarPartitaId] = useState<string | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);

  const handleShare = async (p: Partita) => {
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full text-left text-sm border-collapse min-w-[1040px]">
          <thead>
            <tr className="bg-slate-50/90 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-xs font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
              <th scope="col" className="py-3.5 px-4">Categoria</th>
              <th scope="col" className="py-3.5 px-3">Gir.</th>
              <th scope="col" className="py-3.5 px-3">Gara</th>
              <th scope="col" className="py-3.5 px-4">Data</th>
              <th scope="col" className="py-3.5 px-3">Orario</th>
              <th scope="col" className="py-3.5 px-4">Squadra Casa</th>
              <th scope="col" className="py-3.5 px-4">Squadra Ospite</th>
              <th scope="col" className="py-3.5 px-3">Impianto</th>
              <th scope="col" className="py-3.5 px-3">Fondo</th>
              <th scope="col" className="py-3.5 px-3">Comune</th>
              <th scope="col" className="py-3.5 px-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {partite.map((p, idx) => {
              const dInfo = formatMatchDateAndDay(p.data, p.ora);
              return (
                <tr
                  key={p.id || idx}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {p.campionato}
                  </td>

                  <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs tabular-nums">
                    {p.girone || '–'}
                  </td>

                  <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs tabular-nums">
                    {p.gara || '–'}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap tabular-nums">
                    <div className="flex flex-col leading-tight">
                      <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 capitalize">
                        {dInfo.dayOfWeek.toLowerCase()}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                        {dInfo.dayNumber} {dInfo.monthName} {dInfo.year}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-slate-900 dark:bg-sky-500/15 text-white dark:text-sky-200 border border-transparent dark:border-sky-500/30 tabular-nums">
                        <Clock className="w-3 h-3 text-amber-400 dark:text-sky-300" />
                        {dInfo.oraFormatted}
                      </span>
                      <Countdown data={p.data} ora={p.ora} compact />
                      <WeatherBadge partita={p} compact />
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block rounded-md ${
                        p.isCynthiaCasa
                          ? 'font-bold text-sky-900 dark:text-sky-100 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 ring-1 ring-inset ring-sky-200/80 dark:ring-sky-800/70'
                          : 'font-medium text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p.squadraCasa}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block rounded-md ${
                        p.isCynthiaOspite
                          ? 'font-bold text-sky-900 dark:text-sky-100 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 ring-1 ring-inset ring-sky-200/80 dark:ring-sky-800/70'
                          : 'font-medium text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p.squadraOspite}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {p.lnkMaps && p.lnkMaps !== '#' && p.lnkMaps.startsWith('http') ? (
                      <a
                        href={p.lnkMaps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center gap-1 font-semibold"
                        title="Apri link Maps inserito nel file Google Sheet"
                      >
                        <span>{p.campo}</span>
                        <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                      </a>
                    ) : (
                      <span>{p.campo}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                    {p.tipo || 'Sintetico'}
                  </td>

                  <td className="py-3.5 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {p.comune}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 justify-end relative">
                      {p.lnkMaps && p.lnkMaps !== '#' && p.lnkMaps.startsWith('http') && (
                        <a
                          href={p.lnkMaps}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Apri posizione di ${p.campo} su Google Maps`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white font-semibold text-xs transition-colors"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Mappa</span>
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
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                        </button>

                        {activeCalendarPartitaId === p.id && (
                          <div className="modern-popover-enter absolute right-0 bottom-full mb-1.5 w-48 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30 text-left">
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
                        onClick={() => handleShare(p)}
                        title="Condividi dettagli gara"
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
    </div>
  );
};
