import React, { useState, useRef, useEffect } from 'react';
import { Partita } from '../types';
import {
  generateGoogleCalendarUrl,
  downloadIcsFile,
  parseMatchDateTime,
} from '../utils/calendarUtils';
import { formatMatchDateAndDay } from '../utils/dateFormatter';
import {
  buildMatchSharePayload,
  buildMapsUrl,
  getWhatsAppShareUrl,
  triggerNativeMatchShare,
} from '../utils/shareUtils';
import { WeatherBadge } from './WeatherBadge';
import { Countdown } from './Countdown';
import {
  MapPin,
  Navigation,
  Clock,
  Calendar,
  Copy,
  Check,
  CalendarPlus,
  Share2,
  Download,
  ExternalLink,
  MessageCircle,
  Send,
  Mail,
  UserCheck,
  FileText,
} from 'lucide-react';

interface MatchCardProps {
  partita: Partita;
}

export const MatchCard: React.FC<MatchCardProps> = ({ partita }) => {
  const [copied, setCopied] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const calendarMenuRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const dateInfo = formatMatchDateAndDay(partita.data, partita.ora);
  const { start, end } = parseMatchDateTime(partita.data, partita.ora);

  const now = new Date();
  const isPastMatch = !isNaN(end.getTime()) && end.getTime() < now.getTime();
  const isTodayMatch =
    !isNaN(start.getTime()) &&
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate() &&
    !isPastMatch;

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
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowCalendarMenu(false);
        setShowShareMenu(false);
      }
    }
    if (showCalendarMenu || showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCalendarMenu, showShareMenu]);

  const sharePayload = buildMatchSharePayload(partita);
  const matchSummaryText = sharePayload.text;
  const mapsUrl = buildMapsUrl(partita);
  const whatsappUrl = getWhatsAppShareUrl(partita);
  const googleCalendarUrl = generateGoogleCalendarUrl(partita);
  const telegramUrl = `https://t.me/share/url?text=${encodeURIComponent(matchSummaryText)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(sharePayload.title)}&body=${encodeURIComponent(matchSummaryText)}`;

  const handleShareMatch = async () => {
    const result = await triggerNativeMatchShare(partita);
    if (result.status === 'shared') {
      setShowShareMenu(false);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2200);
      return;
    }
    if (result.status === 'aborted') {
      return;
    }
    setShowShareMenu(prev => !prev);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(matchSummaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API non disponibile
    }
  };

  const cleanHour = dateInfo.oraFormatted.replace(/^ORE\s+/i, '').trim();
  const roundMeta = [
    partita.girone && partita.girone !== '#' ? `Girone ${partita.girone}` : '',
    partita.gara || '',
  ]
    .filter(Boolean)
    .join(' · ');

  const isHome = partita.isCynthiaCasa;

  return (
    <article
      id={`match-card-${partita.id}`}
      className={`@container bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 border-l-4 ${
        isHome
          ? 'border-l-sky-600 dark:border-l-sky-400 hover:border-sky-300 dark:hover:border-sky-700'
          : 'border-l-slate-300 dark:border-l-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      } ${
        isTodayMatch
          ? 'ring-2 ring-amber-400/55 dark:ring-amber-400/40 shadow-sm'
          : 'hover:shadow-md'
      } ${
        isPastMatch ? 'opacity-60 hover:opacity-100' : ''
      } transition-[border-color,box-shadow,opacity] duration-200 overflow-hidden flex flex-col justify-between relative`}
    >
      {/* Card Header: Categoria dominante + Badge CASA (Azzurro/Oro) o TRASFERTA (Neutro) + Stato OGGI/Conclusa */}
      <div
        className={`px-4 @sm:px-5 pt-3.5 pb-3 border-b flex items-center justify-between gap-2.5 ${
          isHome
            ? 'bg-sky-50/60 dark:bg-sky-950/30 border-sky-100 dark:border-sky-900/50'
            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/90'
        }`}
      >
        <div className="min-w-0 flex items-center gap-2">
          <h3 className="text-base @sm:text-[17px] font-black text-slate-900 dark:text-white tracking-tight leading-snug truncate">
            {partita.campionato}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isTodayMatch && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-2xs">
              Oggi
            </span>
          )}
          {isPastMatch && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Conclusa
            </span>
          )}
          {isHome ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-700 text-white border border-amber-400/80 shadow-2xs">
              CASA
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-200/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700">
              TRASFERTA
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 @sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
        {/* Data, Meteo & Orario di inizio ad alta leggibilità */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 min-w-0">
            <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <div className="text-sm font-bold tabular-nums truncate">
              <span className="capitalize text-sky-800 dark:text-sky-300">
                {dateInfo.dayOfWeek.toLowerCase()}
              </span>{' '}
              <span className="text-slate-800 dark:text-slate-100">
                {dateInfo.dayNumber}/{dateInfo.monthNumber}/{dateInfo.year}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <WeatherBadge partita={partita} />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 dark:bg-sky-600 text-white border border-amber-400/40 font-mono font-black text-[15px] tabular-nums shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-amber-400 dark:text-amber-300 shrink-0" />
              <span>{cleanHour}</span>
            </div>
          </div>
        </div>

        {/* Countdown (Attivo entro le 24h o in corso) */}
        <Countdown data={partita.data} ora={partita.ora} />

        {/* Squadre: Massima evidenza tipografica, nomi centrati nei segnaposto */}
        <div className="space-y-1.5 py-0.5">
          <div
            className={`px-3 py-2.5 rounded-xl grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 transition-colors ${
              partita.isCynthiaCasa
                ? 'bg-sky-50/95 dark:bg-sky-950/50 text-sky-950 dark:text-sky-50 font-black ring-1 ring-inset ring-sky-200 dark:ring-sky-800/80'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-bold'
            }`}
          >
            <span aria-hidden="true" />
            <span className="text-[15px] @sm:text-[17px] tracking-tight leading-snug text-center">
              {partita.squadraCasa}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-right">
              Casa
            </span>
          </div>

          <div className="flex items-center gap-3 px-2" aria-hidden="true">
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            <span className="text-[10px] font-black tracking-widest text-amber-600/80 dark:text-amber-400/80 uppercase">
              vs
            </span>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          </div>

          <div
            className={`px-3 py-2.5 rounded-xl grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 transition-colors ${
              partita.isCynthiaOspite
                ? 'bg-sky-50/95 dark:bg-sky-950/50 text-sky-950 dark:text-sky-50 font-black ring-1 ring-inset ring-sky-200 dark:ring-sky-800/80'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-bold'
            }`}
          >
            <span aria-hidden="true" />
            <span className="text-[15px] @sm:text-[17px] tracking-tight leading-snug text-center">
              {partita.squadraOspite}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-right">
              Ospite
            </span>
          </div>
        </div>

        {/* Riga Secondaria Discreta: Impianto Sportivo Cliccabile (Maps), Indirizzo, Fondo, Girone/Gara */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
          <div className="flex items-start justify-between gap-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 hover:text-sky-700 dark:hover:text-sky-300 min-w-0 transition-colors"
              title={`Apri navigatore Google Maps per ${partita.campo}`}
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate group-hover:underline">{partita.campo}</span>
              <ExternalLink className="w-3 h-3 text-sky-600 dark:text-sky-400 opacity-70 group-hover:opacity-100 shrink-0" />
            </a>

            {roundMeta && (
              <span className="shrink-0 text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                {roundMeta}
              </span>
            )}
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block pl-5 text-[11px] @sm:text-xs text-slate-500 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline leading-relaxed transition-colors"
            title="Apri indirizzo su Google Maps"
          >
            {partita.indirizzo ? `${partita.indirizzo} · ` : ''}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{partita.comune}</span>
            {partita.tipo ? ` (${partita.tipo})` : ''}
          </a>

          {partita.arbitro && partita.arbitro.trim() && (
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 pl-5">
              <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">Arbitro:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{partita.arbitro}</span>
            </div>
          )}

          {partita.note && partita.note.trim() && (
            <div className="pt-1 flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 pl-5">
              <FileText className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
              <p className="min-w-0 leading-relaxed">
                <span className="text-slate-500 dark:text-slate-400 mr-1">Note:</span>
                <span>{partita.note}</span>
              </p>
            </div>
          )}
        </div>

        {/* Action Row Rapida: WhatsApp diretto + Condividi (Native) + Navigatore + Calendario (.ics / Google) + Copia */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 relative">
          {/* WhatsApp Diretto */}
          <a
            id={`btn-whatsapp-match-${partita.id}`}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Invia dettagli gara nel gruppo WhatsApp della squadra"
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white transition min-h-[44px] whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>WhatsApp</span>
          </a>

          {/* Web Share API / Altre App */}
          <div className="relative" ref={shareMenuRef}>
            <button
              id={`btn-share-match-${partita.id}`}
              type="button"
              onClick={handleShareMatch}
              aria-expanded={showShareMenu}
              aria-haspopup="menu"
              aria-label={`Condividi gara ${partita.squadraCasa} vs ${partita.squadraOspite}`}
              title="Condividi tramite app del telefono o altre opzioni"
              className={`p-2.5 rounded-xl border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
                shareSuccess
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                  : showShareMenu
                  ? 'bg-sky-700 border-sky-700 text-white'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-sky-300 hover:text-sky-700 dark:hover:text-sky-300 text-slate-700 dark:text-slate-200'
              }`}
            >
              {shareSuccess ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            </button>

            {showShareMenu && (
              <div
                role="menu"
                aria-label="Opzioni di condivisione gara"
                className="modern-popover-enter absolute left-0 bottom-full mb-2 w-60 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30"
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Invia dettagli gara</span>
                  <button
                    type="button"
                    onClick={() => setShowShareMenu(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1 cursor-pointer"
                    title="Chiudi"
                  >
                    ✕
                  </button>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                >
                  <Send className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Telegram</span>
                </a>

                <a
                  href={emailUrl}
                  onClick={() => setShowShareMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Mail className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                  <span>Email</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    handleCopy();
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left border-t border-slate-100 dark:border-slate-700/60 mt-1 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                  <span>Copia negli appunti</span>
                </button>
              </div>
            )}
          </div>

          {/* Link Navigatore Google Maps (sempre attivo) */}
          <a
            id={`link-maps-${partita.id}`}
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Apri navigatore Google Maps per ${partita.campo}`}
            aria-label={`Naviga verso ${partita.campo}`}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-sky-300 hover:text-sky-700 dark:hover:border-sky-600 dark:hover:text-sky-300 transition-colors min-h-[44px] whitespace-nowrap shrink-0"
          >
            <Navigation className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="hidden @xs:inline">Mappa</span>
          </a>

          {/* Aggiungi al Calendario (.ics / Google Calendar) */}
          <div className="relative" ref={calendarMenuRef}>
            <button
              id={`btn-calendar-${partita.id}`}
              type="button"
              onClick={() => setShowCalendarMenu(!showCalendarMenu)}
              title="Aggiungi partita al calendario (.ics o Google Calendar)"
              aria-label="Aggiungi al calendario"
              className={`p-2.5 rounded-xl border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
                showCalendarMenu
                  ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-700 dark:text-sky-300'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <CalendarPlus className="w-4 h-4" />
            </button>

            {showCalendarMenu && (
              <div className="modern-popover-enter absolute right-0 bottom-full mb-2 w-56 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/80 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Salva in calendario (durata 2h)
                </div>

                <a
                  href={googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowCalendarMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700/80 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Google Calendar</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    downloadIcsFile(partita);
                    setShowCalendarMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700/80 transition-colors text-left cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Scarica file .ics (iOS/Outlook)</span>
                </button>
              </div>
            )}
          </div>

          {/* Copia rapida */}
          <button
            id={`btn-copy-${partita.id}`}
            type="button"
            onClick={handleCopy}
            title="Copia dettagli gara negli appunti"
            aria-label="Copia dettagli gara"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
