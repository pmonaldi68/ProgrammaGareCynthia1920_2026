import React, { useState } from 'react';
import { Partita } from '../types';
import { MapPin, Navigation, Clock, Calendar, Shield, Copy, Check } from 'lucide-react';

interface MatchCardProps {
  partita: Partita;
}

export const MatchCard: React.FC<MatchCardProps> = ({ partita }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `⚽ ${partita.campionato} (${partita.girone || ''})\n` +
      `📅 ${partita.data} ore ${partita.ora}\n` +
      `⚔️ ${partita.squadraCasa} vs ${partita.squadraOspite}\n` +
      `📍 ${partita.campo} (${partita.tipo})\n` +
      `🏠 ${partita.indirizzo}, ${partita.comune}\n` +
      `🗺️ Mappa: ${partita.lnkMaps}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id={`match-card-${partita.id}`}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition duration-200 overflow-hidden flex flex-col justify-between group"
    >
      {/* Header Scheda: Categoria e Girone */}
      <div className="bg-gradient-to-r from-sky-100/90 via-sky-50 to-cyan-50 px-4 sm:px-5 py-3.5 border-b border-sky-200/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-3.5 h-3.5 rounded-full bg-sky-600 flex-shrink-0 ring-4 ring-sky-100"></span>
          <span className="text-xl sm:text-2xl font-black text-sky-950 uppercase tracking-tight">
            {partita.campionato}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm font-bold text-sky-800 bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200/80 inline-block shadow-2xs">
            {partita.girone} {partita.gara ? `• ${partita.gara}` : ''}
          </span>
        </div>
      </div>

      {/* Corpo Scheda */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        {/* Data e Ora: Ben evidenziate e più grandi */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-black text-slate-900 text-sm sm:text-base capitalize">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 flex-shrink-0" />
            <span className="tracking-tight">{partita.data}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-black text-sm sm:text-base shadow-xs shadow-amber-500/20">
            <Clock className="w-4 h-4 text-white" />
            <span className="tracking-wider">ORE {partita.ora}</span>
          </div>
        </div>

        {/* Squadre */}
        <div className="space-y-2 mb-4">
          {/* Squadra Casa */}
          <div
            className={`p-3 rounded-xl flex items-center justify-between gap-2 border transition ${
              partita.isCynthiaCasa
                ? 'bg-sky-50/95 border-sky-300 text-sky-950 font-bold shadow-xs'
                : 'bg-slate-50/90 border-slate-200/90 text-slate-800 font-semibold'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Shield
                className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                  partita.isCynthiaCasa ? 'text-sky-700 fill-sky-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate text-sm sm:text-base font-bold">{partita.squadraCasa}</span>
            </div>
            {partita.isCynthiaCasa ? (
              <span className="flex-shrink-0 text-[11px] uppercase tracking-wider bg-sky-700 text-white font-black px-2 py-0.5 rounded-md">
                CASA
              </span>
            ) : (
              <span className="flex-shrink-0 text-[11px] text-slate-400 font-semibold">Casa</span>
            )}
          </div>

          <div className="flex items-center justify-center -my-1 relative z-10">
            <span className="text-[11px] font-black tracking-widest text-slate-400 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
              VS
            </span>
          </div>

          {/* Squadra Ospite */}
          <div
            className={`p-3 rounded-xl flex items-center justify-between gap-2 border transition ${
              partita.isCynthiaOspite
                ? 'bg-sky-50/95 border-sky-300 text-sky-950 font-bold shadow-xs'
                : 'bg-slate-50/90 border-slate-200/90 text-slate-800 font-semibold'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Shield
                className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                  partita.isCynthiaOspite ? 'text-sky-700 fill-sky-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate text-sm sm:text-base font-bold">{partita.squadraOspite}</span>
            </div>
            {partita.isCynthiaOspite ? (
              <span className="flex-shrink-0 text-[11px] uppercase tracking-wider bg-sky-700 text-white font-black px-2 py-0.5 rounded-md">
                TRASFERTA
              </span>
            ) : (
              <span className="flex-shrink-0 text-[11px] text-slate-400 font-semibold">Fuori</span>
            )}
          </div>
        </div>

        {/* Informazioni Impianto e Campo */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs sm:text-sm space-y-2 mb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span className="truncate">{partita.campo}</span>
            </div>
            {partita.tipo && (
              <span className="flex-shrink-0 text-xs font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">
                {partita.tipo}
              </span>
            )}
          </div>
          <p className="text-slate-600 pl-6 leading-relaxed text-xs sm:text-sm">
            {partita.indirizzo ? `${partita.indirizzo} • ` : ''}
            <span className="font-bold text-slate-800">{partita.comune}</span>
          </p>
        </div>

        {/* Bottoni Azioni Scheda */}
        <div className="flex items-center gap-2 pt-1">
          <a
            id={`btn-map-${partita.id}`}
            href={partita.lnkMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-sm font-bold rounded-xl transition shadow-xs min-h-[44px]"
          >
            <Navigation className="w-4 h-4" />
            <span>Mappa & Indicazioni</span>
          </a>

          <button
            id={`btn-copy-${partita.id}`}
            type="button"
            onClick={handleCopy}
            title="Copia dati partita da incollare su WhatsApp"
            className="p-3 rounded-xl border border-slate-200 hover:bg-slate-100 active:bg-slate-200 text-slate-600 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {copied ? (
              <Check className="w-5 h-5 text-emerald-600" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
