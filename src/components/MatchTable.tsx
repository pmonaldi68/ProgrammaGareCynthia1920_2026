import React, { useState } from 'react';
import { Partita } from '../types';
import { Navigation, MapPin, X } from 'lucide-react';
import { getGoogleMapsEmbedUrl } from '../utils/mapUtils';

interface MatchTableProps {
  partite: Partita[];
}

export const MatchTable: React.FC<MatchTableProps> = ({ partite }) => {
  const [selectedMapPartita, setSelectedMapPartita] = useState<Partita | null>(null);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Modale / Drawer Anteprima Mappa per la Tabella */}
      {selectedMapPartita && (
        <div className="p-4 bg-sky-50 dark:bg-slate-950 border-b border-sky-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-sm font-bold text-sky-950 dark:text-sky-200">
            <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>
              Anteprima Mappa: {selectedMapPartita.campo} ({selectedMapPartita.comune})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={selectedMapPartita.lnkMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-sky-700 dark:text-sky-300 hover:underline"
            >
              Apri su Google Maps ↗
            </a>
            <button
              onClick={() => setSelectedMapPartita(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              <X className="w-3.5 h-3.5" />
              Chiudi
            </button>
          </div>

          <div className="w-full mt-2 rounded-xl overflow-hidden border border-sky-300 dark:border-slate-700">
            <iframe
              title={`Mappa per ${selectedMapPartita.campo}`}
              src={getGoogleMapsEmbedUrl(selectedMapPartita)}
              width="100%"
              height="240"
              loading="lazy"
              className="w-full border-0 block"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[980px]">
          <thead>
            <tr className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs uppercase font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-700 select-none">
              <th scope="col" className="py-3.5 px-4">Campionato</th>
              <th scope="col" className="py-3.5 px-3">Girone</th>
              <th scope="col" className="py-3.5 px-3">Gara</th>
              <th scope="col" className="py-3.5 px-3">Data</th>
              <th scope="col" className="py-3.5 px-3">Ora</th>
              <th scope="col" className="py-3.5 px-4">Squadra Casa</th>
              <th scope="col" className="py-3.5 px-4">Squadra Ospite</th>
              <th scope="col" className="py-3.5 px-3">Campo</th>
              <th scope="col" className="py-3.5 px-3">Tipo</th>
              <th scope="col" className="py-3.5 px-3">Indirizzo</th>
              <th scope="col" className="py-3.5 px-3">Comune</th>
              <th scope="col" className="py-3.5 px-3 text-center">Mappa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {partite.map((p, idx) => (
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

                {/* DATA */}
                <td className="py-3.5 px-3 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {p.data}
                </td>

                {/* ORA */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <span className="inline-block px-2.5 py-1 rounded-lg font-black text-sm bg-amber-500 text-white shadow-2xs">
                    {p.ora}
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

                {/* INDIRIZZO */}
                <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {p.indirizzo || '-'}
                </td>

                {/* COMUNE */}
                <td className="py-3 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {p.comune}
                </td>

                {/* LNK MAPS */}
                <td className="py-3 px-3 text-center whitespace-nowrap">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
