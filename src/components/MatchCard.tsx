import React, { useState, useRef, useEffect } from 'react';
import { Partita } from '../types';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils';
import { formatMatchDateAndDay } from '../utils/dateFormatter';
import { LazyMapPreview } from './LazyMapPreview';
import {
  MapPin,
  Navigation,
  Clock,
  Calendar,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  CalendarPlus,
  Share2,
  Download,
  ExternalLink,
  MessageCircle,
  Send,
  Mail,
} from 'lucide-react';

interface MatchCardProps {
  partita: Partita;
}

export const MatchCard: React.FC<MatchCardProps> = ({ partita }) => {
  const [copied, setCopied] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const calendarMenuRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const dateInfo = formatMatchDateAndDay(partita.data, partita.ora);

  // Chiudi i menu aperti se si clicca all'esterno
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (calendarMenuRef.current && !calendarMenuRef.current.contains(target)) {
        setShowCalendarMenu(false);
      }
      if (shareMenuRef.current && !shareMenuRef.current.contains(target)) {
        setShowShareMenu(false);
      }
    }
    if (showCalendarMenu || showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendarMenu, showShareMenu]);

  const matchSummaryText =
    `🏆 ${partita.campionato}${partita.girone && partita.girone !== '#' ? ` (Girone ${partita.girone})` : ''} - ${partita.gara || 'Gara Ufficiale'}\n` +
    `⚔️ ${partita.squadraCasa} vs ${partita.squadraOspite}\n` +
    `📅 ${dateInfo.compactDisplay} ore ${dateInfo.oraFormatted}\n` +
    `📍 Campo: ${partita.campo} (${partita.tipo || 'Sintetico'})\n` +
    `🏠 Indirizzo: ${partita.indirizzo ? `${partita.indirizzo}, ` : ''}${partita.comune}\n` +
    (partita.lnkMaps ? `🗺️ Indicazioni Mappa: ${partita.lnkMaps}\n` : '') +
    `🔵⚪ Forza Cynthia!`;

  const handleShareMatch = async () => {
    // 1. Prova prima con la Web Share API nativa del browser/smartphone
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Gara Cynthia: ${partita.squadraCasa} vs ${partita.squadraOspite}`,
          text: matchSummaryText,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2200);
        return;
      } catch (err) {
        // Se l'utente chiude la finestra di share nativa (AbortError), non forzare il menu
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        // Se la Web Share API fallisce (permessi iframe o restrizioni), apri il menu di fallback
        setShowShareMenu(true);
        return;
      }
    }

    // 2. Se navigator.share non è supportato dal browser corrente, apri il menu di condivisione diretta
    setShowShareMenu(prev => !prev);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(matchSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleCalendarUrl = generateGoogleCalendarUrl(partita);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(matchSummaryText)}`;
  const telegramUrl = `https://t.me/share/url?text=${encodeURIComponent(matchSummaryText)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`Gara ASD Cynthia 1920: ${partita.squadraCasa} vs ${partita.squadraOspite}`)}&body=${encodeURIComponent(matchSummaryText)}`;

  return (
    <div
      id={`match-card-${partita.id}`}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition duration-200 overflow-hidden flex flex-col justify-between group relative"
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
        {/* Data e Ora: Massima Leggibilità con Giorno in MAIUSCOLO ed Orario in evidenza */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 pb-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 -mx-4 sm:-mx-5 px-4 sm:px-5 -mt-4 sm:-mt-5 pt-3.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-sky-700 text-white font-black text-xs sm:text-xs tracking-wider uppercase shadow-2xs">
                {dateInfo.dayOfWeek}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base tracking-tight">
                {dateInfo.dayNumber} {dateInfo.monthName} {dateInfo.year}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-sm sm:text-base shadow-xs shadow-amber-500/25 ring-2 ring-amber-400/20">
            <Clock className="w-4 h-4 text-amber-100 flex-shrink-0" />
            <span className="tracking-wider">{dateInfo.oraFormatted}</span>
          </div>
        </div>

        {/* Box Squadre: Casa vs Ospite con nome centrato e senza etichette/scudi ridondanti */}
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

          {/* Separatore VS */}
          <div className="relative flex items-center justify-center my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
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

        {/* Lazy Loading Iframe Google Maps con Skeleton State */}
        <LazyMapPreview partita={partita} isOpen={showMapPreview} />

        {/* Bottoni Azioni Scheda */}
        <div className="flex items-center gap-2 pt-1 relative">
          {/* Bottone Condividi Principale con Web Share API (WhatsApp, Telegram, Email) */}
          <div className="relative flex-1" ref={shareMenuRef}>
            <button
              id={`btn-share-match-${partita.id}`}
              type="button"
              onClick={handleShareMatch}
              title="Condividi dettagli gara su WhatsApp, Telegram o Email"
              className={`w-full inline-flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition shadow-xs min-h-[44px] ${
                shareSuccess
                  ? 'bg-emerald-600 text-white'
                  : showShareMenu
                  ? 'bg-sky-800 text-white ring-2 ring-sky-300'
                  : 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white'
              }`}
            >
              {shareSuccess ? (
                <>
                  <Check className="w-4 h-4 flex-shrink-0 text-white" />
                  <span>Condiviso!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 flex-shrink-0" />
                  <span>Condividi</span>
                </>
              )}
            </button>

            {/* Menu Popover Fallback o Scelta Rapida (WhatsApp, Telegram, Email, Copia) */}
            {showShareMenu && (
              <div className="absolute left-0 bottom-full mb-2 w-64 bg-white dark:bg-slate-850 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Invia Dettagli Gara</span>
                  <button
                    type="button"
                    onClick={() => setShowShareMenu(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
                    title="Chiudi"
                  >
                    ✕
                  </button>
                </div>

                {/* WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold">WhatsApp</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Chat o gruppo squadra</span>
                  </div>
                </a>

                {/* Telegram */}
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-700 dark:hover:text-sky-300 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold">Telegram</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Canale o messaggio</span>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={emailUrl}
                  onClick={() => setShowShareMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold">Email</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Client di posta predefinito</span>
                  </div>
                </a>

                {/* Copia Testo */}
                <button
                  type="button"
                  onClick={() => {
                    handleCopy();
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left border-t border-slate-100 dark:border-slate-700/60 mt-1"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0">
                    <Copy className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold">Copia dettagli testo</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Per incollare ovunque</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Bottone Toggle Anteprima Rapida Mappa */}
          <button
            id={`btn-map-preview-${partita.id}`}
            type="button"
            onClick={() => setShowMapPreview(!showMapPreview)}
            title="Visualizza mappa del campo"
            className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl border transition shadow-xs min-h-[44px] ${
              showMapPreview
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 text-sky-800 dark:text-sky-200 font-bold'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Navigation className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
            <span className="hidden sm:inline">{showMapPreview ? 'Chiudi' : 'Mappa'}</span>
            {showMapPreview ? (
              <ChevronUp className="w-3.5 h-3.5 opacity-80" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            )}
          </button>

          {/* Menu Aggiungi al Calendario (Google Calendar o .ics) */}
          <div className="relative" ref={calendarMenuRef}>
            <button
              id={`btn-calendar-${partita.id}`}
              type="button"
              onClick={() => setShowCalendarMenu(!showCalendarMenu)}
              title="Aggiungi al tuo calendario personale (Google Calendar o .ics)"
              className={`p-2.5 rounded-xl border transition min-h-[44px] min-w-[44px] flex items-center justify-center ${
                showCalendarMenu
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-800 dark:text-amber-200'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <CalendarPlus className="w-5 h-5" />
            </button>

            {showCalendarMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-56 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Salva in Calendario
                </div>

                {/* Google Calendar */}
                <a
                  href={googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowCalendarMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700/80 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Google Calendar</span>
                </a>

                {/* File .ics (Apple Calendar, Outlook, Android) */}
                <button
                  type="button"
                  onClick={() => {
                    downloadIcsFile(partita);
                    setShowCalendarMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700/80 transition text-left"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Scarica File .ics (Apple/Outlook)</span>
                </button>
              </div>
            )}
          </div>

          {/* Copia Testo Veloce */}
          <button
            id={`btn-copy-${partita.id}`}
            type="button"
            onClick={handleCopy}
            title="Copia negli appunti i dettagli completi della gara"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 text-slate-600 dark:text-slate-300 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
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
