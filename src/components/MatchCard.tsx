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
      <div className="bg-gradient-to-r from-sky-50 to-cyan-50/60 px-4 py-3 border-b border-sky-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
          <span className="text-xs font-extrabold text-sky-950 uppercase tracking-wide">
            {partita.campionato}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-md">
            {partita.girone} {partita.gara ? `• ${partita.gara}` : ''}
          </span>
        </div>
      </div>

      {/* Corpo Scheda */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        {/* Data e Ora */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span>{partita.data}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/60 font-black">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{partita.ora}</span>
          </div>
        </div>

        {/* Squadre */}
        <div className="space-y-2 mb-4">
          {/* Squadra Casa */}
          <div
            className={`p-2.5 rounded-xl flex items-center justify-between gap-2 border transition ${
              partita.isCynthiaCasa
                ? 'bg-sky-50/90 border-sky-300/80 text-sky-950 font-bold shadow-xs'
                : 'bg-slate-50/80 border-slate-200/80 text-slate-800 font-semibold'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Shield
                className={`w-4 h-4 flex-shrink-0 ${
                  partita.isCynthiaCasa ? 'text-sky-700 fill-sky-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate text-sm">{partita.squadraCasa}</span>
            </div>
            {partita.isCynthiaCasa ? (
              <span className="flex-shrink-0 text-[10px] uppercase tracking-wider bg-sky-700 text-white font-extrabold px-2 py-0.5 rounded-md">
                CASA
              </span>
            ) : (
              <span className="flex-shrink-0 text-[10px] text-slate-400 font-medium">Casa</span>
            )}
          </div>

          <div className="flex items-center justify-center -my-1 relative z-10">
            <span className="text-[10px] font-black tracking-widest text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
              VS
            </span>
          </div>

          {/* Squadra Ospite */}
          <div
            className={`p-2.5 rounded-xl flex items-center justify-between gap-2 border transition ${
              partita.isCynthiaOspite
                ? 'bg-sky-50/90 border-sky-300/80 text-sky-950 font-bold shadow-xs'
                : 'bg-slate-50/80 border-slate-200/80 text-slate-800 font-semibold'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Shield
                className={`w-4 h-4 flex-shrink-0 ${
                  partita.isCynthiaOspite ? 'text-sky-700 fill-sky-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate text-sm">{partita.squadraOspite}</span>
            </div>
            {partita.isCynthiaOspite ? (
              <span className="flex-shrink-0 text-[10px] uppercase tracking-wider bg-sky-700 text-white font-extrabold px-2 py-0.5 rounded-md">
                TRASFERTA
              </span>
            ) : (
              <span className="flex-shrink-0 text-[10px] text-slate-400 font-medium">Fuori</span>
            )}
          </div>
        </div>

        {/* Informazioni Impianto e Campo */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 text-xs space-y-1.5 mb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span className="truncate">{partita.campo}</span>
            </div>
            {partita.tipo && (
              <span className="flex-shrink-0 text-[10px] font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded">
                {partita.tipo}
              </span>
            )}
          </div>
          <p className="text-slate-600 pl-5 leading-snug">
            {partita.indirizzo ? `${partita.indirizzo} • ` : ''}
            <span className="font-semibold text-slate-700">{partita.comune}</span>
          </p>
        </div>

        {/* Bottoni Azioni Scheda */}
        <div className="flex items-center gap-2 pt-1">
          <a
            id={`btn-map-${partita.id}`}
            href={partita.lnkMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Mappa & Indicazioni</span>
          </a>

          <button
            id={`btn-copy-${partita.id}`}
            type="button"
            onClick={handleCopy}
            title="Copia dati partita da incollare su WhatsApp"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 active:bg-slate-200 text-slate-600 transition"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
