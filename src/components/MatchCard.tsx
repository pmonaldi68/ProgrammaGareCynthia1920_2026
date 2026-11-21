import React, { useState, useRef, useEffect } from 'react';
import { Partita } from '../types';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils';
import { formatMatchDateAndDay } from '../utils/dateFormatter';
import { buildMatchSharePayload, triggerNativeMatchShare } from '../utils/shareUtils';
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

  const googleCalendarUrl = generateGoogleCalendarUrl(partita);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(matchSummaryText)}`;
  const telegramUrl = `https://t.me/share/url?text=${encodeURIComponent(matchSummaryText)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(sharePayload.title)}&body=${encodeURIComponent(matchSummaryText)}`;

  const roundMeta = [
    partita.girone && partita.girone !== '#' ? `Girone ${partita.girone}` : '',
    partita.gara || '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      id={`match-card-${partita.id}`}
      className="@container bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-sky-300/80 dark:hover:border-sky-700/70 transition-[border-color,box-shadow] duration-200 hover:shadow-md overflow-hidden flex flex-col justify-between relative"
    >
      {/* Card Header: Clean Typographic Category & Unboxed Round Metadata */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800/90 flex items-baseline justify-between gap-3">
        <h3 className="text-base @sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug truncate">
          {partita.campionato}
        </h3>
        {roundMeta && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums shrink-0 whitespace-nowrap">
            {roundMeta}
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        {/* Date, Weather & Kick-off Time */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 min-w-0">
            <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <div className="text-sm font-semibold tabular-nums truncate">
              <span className="capitalize font-bold text-sky-700 dark:text-sky-300">
                {dateInfo.dayOfWeek.toLowerCase()}
              </span>{' '}
              <span>
                {dateInfo.dayNumber} {dateInfo.monthName} {dateInfo.year}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <WeatherBadge partita={partita} />
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-sky-500/15 text-white dark:text-sky-200 border border-transparent dark:border-sky-500/30 font-mono font-bold text-sm tabular-nums">
              <Clock className="w-3.5 h-3.5 text-amber-400 dark:text-sky-300 shrink-0" />
              <span>{dateInfo.oraFormatted}</span>
            </div>
          </div>
        </div>

        {/* Countdown (Active only within 24h or live) */}
        <Countdown data={partita.data} ora={partita.ora} />

        {/* Matchup Scoreboard: Clean Contrast Without Nested Box Overload */}
        <div className="space-y-1.5 py-1">
          <div
            className={`px-3.5 py-2.5 rounded-xl grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 transition-colors ${
              partita.isCynthiaCasa
                ? 'bg-sky-50/90 dark:bg-sky-950/45 text-sky-950 dark:text-sky-50 font-extrabold ring-1 ring-inset ring-sky-200/80 dark:ring-sky-800/70'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-bold'
            }`}
          >
            <span aria-hidden="true" />
            <span className="text-[15px] @sm:text-base tracking-tight leading-snug text-center">
              {partita.squadraCasa}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-right">
              Casa
            </span>
          </div>

          <div className="flex items-center gap-3 px-2" aria-hidden="true">
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            <span className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              vs
            </span>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          </div>

          <div
            className={`px-3.5 py-2.5 rounded-xl grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 transition-colors ${
              partita.isCynthiaOspite
                ? 'bg-sky-50/90 dark:bg-sky-950/45 text-sky-950 dark:text-sky-50 font-extrabold ring-1 ring-inset ring-sky-200/80 dark:ring-sky-800/70'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-bold'
            }`}
          >
            <span aria-hidden="true" />
            <span className="text-[15px] @sm:text-base tracking-tight leading-snug text-center">
              {partita.squadraOspite}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-right">
              Ospite
            </span>
          </div>
        </div>

        {/* Venue & Match Notes (Whitespace + Hairline Divider) */}
        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs @sm:text-[13px]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 min-w-0">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="truncate">{partita.campo}</span>
            </div>
            {partita.tipo && (
              <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                {partita.tipo}
              </span>
            )}
          </div>

          <p className="text-slate-600 dark:text-slate-300 pl-6 leading-relaxed">
            {partita.indirizzo ? `${partita.indirizzo} · ` : ''}
            <span className="font-semibold text-slate-800 dark:text-slate-100">{partita.comune}</span>
          </p>

          {partita.lnkMaps && partita.lnkMaps !== '#' && partita.lnkMaps.startsWith('http') && (
            <div className="pl-6 pt-0.5">
              <a
                href={partita.lnkMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline transition-colors"
                title="Apri link Maps inserito nel file Google Sheet"
              >
                <Navigation className="w-3.5 h-3.5 shrink-0" />
                <span>Indicazioni Google Maps</span>
                <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
              </a>
            </div>
          )}

          {partita.arbitro && partita.arbitro.trim() && (
            <div className="pt-1.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 pl-6">
              <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">Arbitro:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{partita.arbitro}</span>
            </div>
          )}

          {partita.note && partita.note.trim() && (
            <div className="pt-1 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 pl-6">
              <FileText className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
              <p className="min-w-0 leading-relaxed">
                <span className="text-slate-500 dark:text-slate-400 mr-1">Note:</span>
                <span>{partita.note}</span>
              </p>
            </div>
          )}
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 relative">
          <div className="relative flex-1" ref={shareMenuRef}>
            <button
              id={`btn-share-match-${partita.id}`}
              type="button"
              onClick={handleShareMatch}
              aria-expanded={showShareMenu}
              aria-haspopup="menu"
              aria-label={`Condividi gara ${partita.squadraCasa} vs ${partita.squadraOspite}`}
              title="Condividi dettagli gara tramite app native (WhatsApp, Telegram, Social, Email)"
              className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl transition duration-150 min-h-[44px] whitespace-nowrap cursor-pointer ${
                shareSuccess
                  ? 'bg-emerald-600 text-white'
                  : showShareMenu
                  ? 'bg-sky-800 text-white ring-2 ring-sky-400/40'
                  : 'bg-sky-700 hover:bg-sky-600 active:scale-[0.98] text-white'
              }`}
            >
              {shareSuccess ? (
                <>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Condiviso</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span>Condividi</span>
                </>
              )}
            </button>

            {showShareMenu && (
              <div
                role="menu"
                aria-label="Opzioni di condivisione gara"
                className="modern-popover-enter absolute left-0 bottom-full mb-2 w-64 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30"
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
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold">WhatsApp</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Chat o gruppo squadra</span>
                  </div>
                </a>

                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold">Telegram</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Canale o messaggio</span>
                  </div>
                </a>

                <a
                  href={emailUrl}
                  onClick={() => setShowShareMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold">Email</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Client di posta predefinito</span>
                  </div>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    handleCopy();
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left border-t border-slate-100 dark:border-slate-700/60 mt-1 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                    <Copy className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold">Copia testo</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Negli appunti</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {partita.lnkMaps && partita.lnkMaps !== '#' && partita.lnkMaps.startsWith('http') && (
            <a
              id={`link-maps-${partita.id}`}
              href={partita.lnkMaps}
              target="_blank"
              rel="noopener noreferrer"
              title={`Apri posizione di ${partita.campo} su Google Maps`}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-sky-300 hover:text-sky-700 dark:hover:border-sky-600 dark:hover:text-sky-300 transition-colors min-h-[44px] whitespace-nowrap shrink-0"
            >
              <Navigation className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Mappa</span>
            </a>
          )}

          <div className="relative" ref={calendarMenuRef}>
            <button
              id={`btn-calendar-${partita.id}`}
              type="button"
              onClick={() => setShowCalendarMenu(!showCalendarMenu)}
              title="Aggiungi al tuo calendario personale"
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
                  Salva in calendario
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
                  <span>Scarica file .ics</span>
                </button>
              </div>
            )}
          </div>

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
