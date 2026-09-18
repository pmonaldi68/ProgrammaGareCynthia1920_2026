import React, { useState } from 'react';
import { Partita } from '../types';
import { Navigation, MapPin, X, CalendarPlus, Share2, Download, ExternalLink, Check, Clock } from 'lucide-react';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils';
import { formatMatchDateAndDay } from '../utils/dateFormatter';
import { LazyMapPreview } from './LazyMapPreview';

interface MatchTableProps {
  partite: Partita[];
}

export const MatchTable: React.FC<MatchTableProps> = ({ partite }) => {
  const [selectedMapPartita, setSelectedMapPartita] = useState<Partita | null>(null);
  const [activeCalendarPartitaId, setActiveCalendarPartitaId] = useState<string | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);

  const handleShare = async (p: Partita) => {
    const dInfo = formatMatchDateAndDay(p.data, p.ora);
    const summary =
      `🏆 ${p.campionato}${p.girone && p.girone !== '#' ? ` (Girone ${p.girone})` : ''} - ${p.gara || 'Gara Ufficiale'}\n` +
      `⚔️ ${p.squadraCasa} vs ${p.squadraOspite}\n` +
      `📅 ${dInfo.compactDisplay} ore ${dInfo.oraFormatted}\n` +
      `📍 Campo: ${p.campo} (${p.tipo || 'Sintetico'})\n` +
      `🏠 Indirizzo: ${p.indirizzo ? `${p.indirizzo}, ` : ''}${p.comune}\n` +
      (p.lnkMaps ? `🗺️ Indicazioni Mappa: ${p.lnkMaps}\n` : '') +
      `🔵⚪ Forza Cynthia!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Gara ${p.campionato}: ${p.squadraCasa} vs ${p.squadraOspite}`,
          text: summary,
        });
      } catch (err) {
        // Nessuna azione se annullato
      }
    } else {
      navigator.clipboard.writeText(summary);
      setSharedId(p.id);
      setTimeout(() => setSharedId(null), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Modale / Drawer Anteprima Mappa per la Tabella con Lazy Loading */}
      {selectedMapPartita && (
        <div className="p-4 bg-sky-50/70 dark:bg-slate-950 border-b border-sky-200 dark:border-slate-800 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-sky-950 dark:text-sky-200">
              <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>
                Mappa Impianto: {selectedMapPartita.campo} ({selectedMapPartita.comune})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMapPartita(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              <X className="w-3.5 h-3.5" />
              Chiudi
            </button>
          </div>
          <LazyMapPreview partita={selectedMapPartita} isOpen={true} />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[1020px]">
          <thead>
            <tr className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs uppercase font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-700 select-none">
              <th scope="col" className="py-3.5 px-4">Campionato</th>
              <th scope="col" className="py-3.5 px-3">Girone</th>
              <th scope="col" className="py-3.5 px-3">Gara</th>
              <th scope="col" className="py-3.5 px-4">Data & Giorno</th>
              <th scope="col" className="py-3.5 px-3">Orario</th>
              <th scope="col" className="py-3.5 px-4">Squadra Casa</th>
              <th scope="col" className="py-3.5 px-4">Squadra Ospite</th>
              <th scope="col" className="py-3.5 px-3">Campo</th>
              <th scope="col" className="py-3.5 px-3">Tipo</th>
              <th scope="col" className="py-3.5 px-3">Comune</th>
              <th scope="col" className="py-3.5 px-4 text-center">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {partite.map((p, idx) => {
              const dInfo = formatMatchDateAndDay(p.data, p.ora);
              return (
                <tr
                  key={p.id || idx}
                  className="hover:bg-sky-50/40 dark:hover:bg-slate-800/50 transition duration-150 group"
                >
                  {/* CAMPIONATO */}
                  <td className="py-3.5 px-4 font-black text-sky-950 dark:text-sky-100 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-600 dark:bg-sky-400"></span>
                      <span className="text-base font-black tracking-tight">{p.campionato}</span>
                    </div>
                  </td>

                  {/* GIRONE */}
                  <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs font-medium">
                    {p.girone || '-'}
                  </td>

                  {/* GARA */}
                  <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs font-medium">
                    {p.gara || '-'}
                  </td>

                  {/* DATA CON GIORNO IN MAIUSCOLO */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-400">
                        {dInfo.dayOfWeek}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        {dInfo.dayNumber} {dInfo.monthName} {dInfo.year}
                      </span>
                    </div>
                  </td>

                  {/* ORA FORMATTATA */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-2xs">
                      <Clock className="w-3 h-3 text-amber-100" />
                      {dInfo.oraFormatted}
                    </span>
                  </td>

                {/* SQUADRA CASA */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-block ${
                      p.isCynthiaCasa
                        ? 'font-extrabold text-sky-950 dark:text-sky-100 bg-sky-100/90 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-200/80 dark:border-sky-800'
                        : 'font-semibold text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {p.squadraCasa}
                  </span>
                </td>

                {/* SQUADRA OSPITE */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-block ${
                      p.isCynthiaOspite
                        ? 'font-extrabold text-sky-950 dark:text-sky-100 bg-sky-100/90 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-200/80 dark:border-sky-800'
                        : 'font-semibold text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {p.squadraOspite}
                  </span>
                </td>

                {/* CAMPO */}
                <td className="py-3 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  {p.campo}
                </td>

                {/* TIPO */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {p.tipo || 'Sintetico'}
                  </span>
                </td>

                {/* COMUNE */}
                <td className="py-3 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {p.comune}
                </td>

                {/* AZIONI: MAPPA, CALENDARIO, CONDIVIDI */}
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 justify-center relative">
                    {/* Pulsante Mappa */}
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedMapPartita?.id === p.id) {
                          setSelectedMapPartita(null);
                        } else {
                          setSelectedMapPartita(p);
                        }
                      }}
                      title={`Mostra anteprima mappa per ${p.campo}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600 text-white font-semibold text-xs transition shadow-2xs"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{selectedMapPartita?.id === p.id ? 'Chiudi' : 'Mappa'}</span>
                    </button>

                    {/* Menu Calendario */}
                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveCalendarPartitaId(
                            activeCalendarPartitaId === p.id ? null : p.id
                          )
                        }
                        title="Esporta nel calendario (Google / .ics)"
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                      </button>

                      {activeCalendarPartitaId === p.id && (
                        <div className="absolute right-0 bottom-full mb-1.5 w-48 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30 text-left">
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
                            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700/80 text-left"
                          >
                            <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Scarica file .ics
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Condividi Singola Gara */}
                    <button
                      type="button"
                      onClick={() => handleShare(p)}
                      title="Condividi dettagli gara"
                      className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
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
