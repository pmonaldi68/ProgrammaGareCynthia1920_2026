import React, { useEffect, useState } from 'react';
import { Partita } from '../types';
import { formatMatchDateAndDay } from '../utils/dateFormatter';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils';
import { Countdown } from './Countdown';
import { WeatherBadge } from './WeatherBadge';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  ExternalLink,
  Share2,
  CalendarPlus,
  Download,
  Copy,
  Check,
  Shield,
  MessageCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface MatchDetailModalProps {
  partita: Partita | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  partita,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Chiusura con tasto Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !partita) return null;

  const dateInfo = formatMatchDateAndDay(partita.data, partita.ora);

  const matchSummaryText =
    `🏆 ${partita.campionato}${partita.girone && partita.girone !== '#' ? ` (Girone ${partita.girone})` : ''} - ${partita.gara || 'Gara Ufficiale'}\n` +
    `⚔️ ${partita.squadraCasa} vs ${partita.squadraOspite}\n` +
    `📅 ${dateInfo.compactDisplay} ore ${dateInfo.oraFormatted}\n` +
    `📍 Campo: ${partita.campo} (${partita.tipo || 'Sintetico'})\n` +
    `🏠 Indirizzo: ${partita.indirizzo ? `${partita.indirizzo}, ` : ''}${partita.comune}\n` +
    (partita.lnkMaps ? `🗺️ Indicazioni Mappa: ${partita.lnkMaps}\n` : '') +
    `🔵⚪ ASD Cynthia 1920 • Stagione 2026/2027`;

  const handleCopy = () => {
    navigator.clipboard.writeText(matchSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Gara: ${partita.squadraCasa} vs ${partita.squadraOspite}`,
          text: matchSummaryText,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }
    // Fallback: apri WhatsApp Web / App
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(matchSummaryText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const googleCalendarUrl = generateGoogleCalendarUrl(partita);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(matchSummaryText)}`;

  const isDonBosco =
    partita.squadraCasa.toUpperCase().includes('DON BOSCO') ||
    partita.squadraOspite.toUpperCase().includes('DON BOSCO') ||
    (partita.societa && partita.societa.toUpperCase().includes('DON BOSCO'));

  return (
    <div
      id="match-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-detail-title"
    >
      <div
        id="match-detail-modal-container"
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale: Colori sociali Cynthia / Don Bosco */}
        <div
          className={`px-5 py-4 text-white flex items-start justify-between border-b border-white/10 shrink-0 ${
            isDonBosco
              ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 dark:from-amber-950 dark:via-blue-950 dark:to-slate-900'
              : 'bg-gradient-to-r from-sky-900 via-sky-800 to-cyan-800 dark:from-slate-950 dark:via-sky-950 dark:to-slate-900'
          }`}
        >
          <div className="space-y-1.5 min-w-0 pr-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-black text-[11px] uppercase tracking-wider backdrop-blur-xs">
                {partita.campionato}
              </span>
              {partita.girone && partita.girone !== '#' && (
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-white/90 font-bold text-[10px] uppercase">
                  Girone {partita.girone}
                </span>
              )}
              {partita.gara && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-100 border border-amber-300/40 font-bold text-[10px]">
                  {partita.gara}
                </span>
              )}
              {partita.societa && (
                <span className="px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-100 border border-sky-300/30 font-semibold text-[10px]">
                  {partita.societa}
                </span>
              )}
            </div>
            <h2 id="match-detail-title" className="text-lg sm:text-xl font-extrabold tracking-tight truncate leading-tight">
              Scheda Dettagli Partita
            </h2>
            <p className="text-xs text-white/75 truncate">
              Stagione Sportiva 2026/2027 • ASD Cynthia 1920
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
            title="Chiudi dettagli (Esc)"
            aria-label="Chiudi finestra dettagli"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Scrollabile dei Dettagli */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          {/* 1. Box Squadre a Confronto (Casa vs Ospite) */}
          <div className="bg-gradient-to-br from-slate-50 to-sky-50/50 dark:from-slate-800/80 dark:to-sky-950/20 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-3 text-center">
              {/* Squadra Casa */}
              <div
                className={`p-3.5 rounded-xl border transition ${
                  partita.isCynthiaCasa
                    ? 'bg-sky-600 text-white border-sky-700 shadow-xs font-black'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 font-bold'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider block opacity-80 mb-0.5">
                  Casa {partita.isCynthiaCasa ? '• Biancoazzurri' : ''}
                </span>
                <span className="text-sm sm:text-base leading-tight block">
                  {partita.squadraCasa}
                </span>
              </div>

              {/* Separatore VS */}
              <div className="flex flex-col items-center justify-center">
                <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs flex items-center justify-center shadow-inner">
                  VS
                </span>
              </div>

              {/* Squadra Ospite */}
              <div
                className={`p-3.5 rounded-xl border transition ${
                  partita.isCynthiaOspite
                    ? 'bg-sky-600 text-white border-sky-700 shadow-xs font-black'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 font-bold'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider block opacity-80 mb-0.5">
                  Trasferta {partita.isCynthiaOspite ? '• Biancoazzurri' : ''}
                </span>
                <span className="text-sm sm:text-base leading-tight block">
                  {partita.squadraOspite}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Data, Orario, Conto alla rovescia & Meteo */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Giorno e Data
                  </span>
                  <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white capitalize">
                    {dateInfo.dayOfWeek} {dateInfo.dayNumber} {dateInfo.monthName} {dateInfo.year}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <WeatherBadge partita={partita} />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-black text-sm shadow-xs">
                  <Clock className="w-4 h-4 text-amber-100" />
                  <span>{dateInfo.oraFormatted}</span>
                </div>
              </div>
            </div>

            {/* Countdown Incontro */}
            <Countdown data={partita.data} ora={partita.ora} />
          </div>

          {/* 3. Campo di Gioco & Posizione con Link Mappa Evidente */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Campo di Gioco & Impianto
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                    {partita.campo}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {partita.indirizzo ? `${partita.indirizzo}, ` : ''}
                    <strong className="text-slate-800 dark:text-slate-100">{partita.comune}</strong>
                  </p>
                </div>
              </div>

              {partita.tipo && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shrink-0">
                  {partita.tipo}
                </span>
              )}
            </div>

            {/* Bottone Evidente con Link alla Mappa Google Maps */}
            {partita.lnkMaps && (
              <a
                href={partita.lnkMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 active:scale-[0.99] text-white shadow-md shadow-sky-600/20 transition group cursor-pointer"
                title="Apri le indicazioni stradali su Google Maps"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-white/20 text-white shrink-0">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-xs sm:text-sm font-bold flex items-center gap-1">
                      <span>Apri su Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </div>
                    <div className="text-[11px] text-white/80 truncate">
                      Navigatore GPS pronto verso {partita.campo} ({partita.comune})
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold bg-white text-sky-800 px-3 py-1.5 rounded-lg shadow-2xs shrink-0 flex items-center gap-1 group-hover:bg-sky-50 transition">
                  Mappa 🗺️
                </span>
              </a>
            )}
          </div>
        </div>

        {/* Footer Azioni Rapide */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Condivisione WhatsApp */}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs cursor-pointer active:scale-95"
              title="Condividi dettagli della gara su WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{shareSuccess ? 'Condiviso!' : 'WhatsApp'}</span>
            </button>

            {/* Aggiungi a Google Calendar */}
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 transition shadow-xs cursor-pointer active:scale-95"
              title="Aggiungi promemoria a Google Calendar"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="hidden sm:inline">Google Calendar</span>
              <span className="sm:hidden">Calendar</span>
            </a>

            {/* File .ics */}
            <button
              type="button"
              onClick={() => downloadIcsFile(partita)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 transition shadow-xs cursor-pointer active:scale-95"
              title="Scarica file .ics compatibile con Apple Calendar e Outlook"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>iCal .ics</span>
            </button>

            {/* Copia Testo */}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-600 transition cursor-pointer"
              title="Copia negli appunti"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">{copied ? 'Copiato' : 'Copia'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
