import React from 'react';
import { Partita } from '../types';
import { Navigation, ExternalLink, Shield } from 'lucide-react';

interface MatchTableProps {
  partite: Partita[];
}

export const MatchTable: React.FC<MatchTableProps> = ({ partite }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[980px]">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 text-xs uppercase font-extrabold tracking-wider border-b border-slate-200 select-none">
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
              <th scope="col" className="py-3.5 px-3 text-center">Lnk Maps</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {partite.map((p, idx) => (
              <tr
                key={p.id || idx}
                className="hover:bg-sky-50/40 transition duration-150 group"
              >
                {/* CAMPIONATO */}
                <td className="py-3 px-4 font-bold text-sky-950 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                    <span>{p.campionato}</span>
                  </div>
                </td>

                {/* GIRONE */}
                <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-xs">
                  {p.girone || '-'}
                </td>

                {/* GARA */}
                <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-xs">
                  {p.gara || '-'}
                </td>

                {/* DATA */}
                <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-900">
                  {p.data}
                </td>

                {/* ORA */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 rounded-md font-bold text-xs bg-amber-50 text-amber-900 border border-amber-200">
                    {p.ora}
                  </span>
                </td>

                {/* SQUADRA CASA */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Shield
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        p.isCynthiaCasa ? 'text-sky-700 fill-sky-600' : 'text-slate-300'
                      }`}
                    />
                    <span
                      className={`${
                        p.isCynthiaCasa
                          ? 'font-extrabold text-sky-900 bg-sky-100/70 px-2 py-0.5 rounded'
                          : 'font-medium text-slate-800'
                      }`}
                    >
                      {p.squadraCasa}
                    </span>
                  </div>
                </td>

                {/* SQUADRA OSPITE */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Shield
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        p.isCynthiaOspite ? 'text-sky-700 fill-sky-600' : 'text-slate-300'
                      }`}
                    />
                    <span
                      className={`${
                        p.isCynthiaOspite
                          ? 'font-extrabold text-sky-900 bg-sky-100/70 px-2 py-0.5 rounded'
                          : 'font-medium text-slate-800'
                      }`}
                    >
                      {p.squadraOspite}
                    </span>
                  </div>
                </td>

                {/* CAMPO */}
                <td className="py-3 px-3 text-xs font-semibold text-slate-800 whitespace-nowrap">
                  {p.campo}
                </td>

                {/* TIPO */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {p.tipo || 'Sintetico'}
                  </span>
                </td>

                {/* INDIRIZZO */}
                <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">
                  {p.indirizzo || '-'}
                </td>

                {/* COMUNE */}
                <td className="py-3 px-3 text-xs font-medium text-slate-700 whitespace-nowrap">
                  {p.comune}
                </td>

                {/* LNK MAPS */}
                <td className="py-3 px-3 text-center whitespace-nowrap">
                  <a
                    href={p.lnkMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Apri ${p.campo} su Google Maps`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition shadow-2xs"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Mappa</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
