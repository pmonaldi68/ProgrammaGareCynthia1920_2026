import React, { useState } from 'react';
import { Partita } from '../types';
import { getGoogleMapsEmbedUrl } from '../utils/mapUtils';
import { MapPin, Navigation, Clock, Calendar, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface MatchCardProps {
  partita: Partita;
}

export const MatchCard: React.FC<MatchCardProps> = ({ partita }) => {
  const [copied, setCopied] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);

  const handleCopy = () => {
    const text =
      `⚽ ${partita.campionato} (${partita.girone || ''})\n` +
      `📅 ${partita.data} ore ${partita.ora}\n` +
      `⚔️ ${partita.squadraCasa} vs ${partita.squadraOspite}\n` +
      `📍 ${partita.campo} (${partita.tipo})\n` +
      `🏠 ${partita.indirizzo}, ${partita.comune}\n` +
      `🗺️ Mappa: ${partita.lnkMaps}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const embedMapUrl = getGoogleMapsEmbedUrl(partita);

  return (
    <div
      id={`match-card-${partita.id}`}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition duration-200 overflow-hidden flex flex-col justify-between group"
    >
      {/* Header Scheda: Categoria e Girone */}
      <div className="bg-gradient-to-r from-sky-100/90 via-sky-50 to-cyan-50 dark:from-sky-950/70 dark:via-slate-900 dark:to-cyan-950/50 px-4 sm:px-5 py-3.5 border-b border-sky-200/80 dark:border-sky-900/50 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-3.5 h-3.5 rounded-full bg-sky-600 dark:bg-sky-400 flex-shrink-0 ring-4 ring-sky-100 dark:ring-sky-950"></span>
          <span className="text-xl sm:text-2xl font-black text-sky-950 dark:text-sky-100 uppercase tracking-tight">
            {partita.campionato}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm font-bold text-sky-800 dark:text-sky-200 bg-sky-100 dark:bg-sky-900/60 px-2.5 py-1 rounded-lg border border-sky-200/80 dark:border-sky-700/60 inline-block shadow-2xs">
            {partita.girone} {partita.gara ? `• ${partita.gara}` : ''}
          </span>
        </div>
      </div>

      {/* Corpo Scheda */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        {/* Data e Ora: Ben evidenziate e più grandi */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base capitalize">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
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
            className={`p-3 rounded-xl flex items-center justify-center text-center border transition ${
              partita.isCynthiaCasa
                ? 'bg-sky-50/95 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100 font-extrabold shadow-xs'
                : 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold'
            }`}
          >
            <span className="text-base sm:text-lg tracking-tight">
              {partita.squadraCasa}
            </span>
          </div>

          <div className="flex items-center justify-center -my-1 relative z-10">
            <span className="text-[11px] font-black tracking-widest text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
              VS
            </span>
          </div>

          {/* Squadra Ospite */}
          <div
            className={`p-3 rounded-xl flex items-center justify-center text-center border transition ${
              partita.isCynthiaOspite
                ? 'bg-sky-50/95 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100 font-extrabold shadow-xs'
                : 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold'
            }`}
          >
            <span className="text-base sm:text-lg tracking-tight">
              {partita.squadraOspite}
            </span>
          </div>
        </div>

        {/* Informazioni Impianto e Campo */}
        <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm space-y-2 mb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
              <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span className="truncate">{partita.campo}</span>
            </div>
            {partita.tipo && (
              <span className="flex-shrink-0 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded">
                {partita.tipo}
              </span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-300 pl-6 leading-relaxed text-xs sm:text-sm">
            {partita.indirizzo ? `${partita.indirizzo} • ` : ''}
            <span className="font-bold text-slate-800 dark:text-white">{partita.comune}</span>
          </p>
        </div>

        {/* Anteprima Rapida Mappa (Iframe Google Maps) */}
        {showMapPreview && (
          <div className="mb-4 rounded-xl overflow-hidden border border-sky-300 dark:border-sky-700/80 bg-slate-100 dark:bg-slate-950 shadow-inner animate-in fade-in duration-200">
            <div className="px-3 py-2 bg-sky-50 dark:bg-slate-800 text-xs font-semibold text-sky-950 dark:text-sky-200 flex items-center justify-between border-b border-sky-200/80 dark:border-slate-700">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Mappa: {partita.campo}
              </span>
              <a
                href={partita.lnkMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:underline flex items-center gap-0.5"
              >
                Apri Google Maps ↗
              </a>
            </div>
            <iframe
              title={`Mappa per ${partita.campo}`}
              src={embedMapUrl}
              width="100%"
              height="210"
              loading="lazy"
              className="w-full border-0 block"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        {/* Bottoni Azioni Scheda */}
        <div className="flex items-center gap-2 pt-1">
          {/* Bottone Toggle Anteprima Rapida Mappa */}
          <button
            id={`btn-map-preview-${partita.id}`}
            type="button"
            onClick={() => setShowMapPreview(!showMapPreview)}
            className={`flex-1 inline-flex items-center justify-center gap-2 py-3 px-3 sm:px-4 text-sm font-bold rounded-xl transition shadow-xs min-h-[44px] ${
              showMapPreview
                ? 'bg-sky-700 dark:bg-sky-600 text-white'
                : 'bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600 text-white'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>{showMapPreview ? 'Chiudi Mappa' : 'Vedi Mappa'}</span>
            {showMapPreview ? (
              <ChevronUp className="w-4 h-4 ml-0.5 opacity-80" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-0.5 opacity-80" />
            )}
          </button>

          {/* Copia Dati Partita per WhatsApp */}
          <button
            id={`btn-copy-${partita.id}`}
            type="button"
            onClick={handleCopy}
            title="Copia dati partita da incollare su WhatsApp"
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 text-slate-600 dark:text-slate-300 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {copied ? (
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
