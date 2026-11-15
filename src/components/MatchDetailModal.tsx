import React, { useEffect, useState } from 'react';
import { Partita } from '../types';
import { formatMatchDateAndDay } from '../utils/dateFormatter';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils';
import { buildMatchSharePayload, triggerNativeMatchShare } from '../utils/shareUtils';
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

  const sharePayload = buildMatchSharePayload(partita);
  const matchSummaryText = sharePayload.text;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(matchSummaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API non disponibile
    }
  };

  const handleShare = async () => {
    const result = await triggerNativeMatchShare(partita);
    if (result.status === 'shared') {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
      return;
    }
    if (result.status === 'aborted') return;
    await handleCopy();
  };

  const googleCalendarUrl = generateGoogleCalendarUrl(partita);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(matchSummaryText)}`;

  const isDonBosco =
    partita.squadraCasa.toUpperCase().includes('DON BOSCO') ||
    partita.squadraOspite.toUpperCase().includes('DON BOSCO') ||
    (partita.societa && partita.societa.toUpperCase().includes('DON BOSCO'));

  const roundMeta = [
    partita.campionato,
    partita.girone && partita.girone !== '#' ? `Girone ${partita.girone}` : '',
    partita.gara || '',
    partita.societa || '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      id="match-detail-modal-backdrop"
      className="modern-backdrop-enter fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-detail-title"
    >
      <div
        id="match-detail-modal-container"
        className="modern-modal-enter relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale: Clean Athletic Header without Pill Clutter */}
        <div
          className={`px-5 py-4 text-white flex items-start justify-between border-b border-white/10 shrink-0 ${
            isDonBosco
              ? 'bg-gradient-to-r from-amber-700 to-amber-800 dark:from-amber-950 dark:to-slate-900'
              : 'bg-slate-900 dark:bg-slate-950'
          }`}
        >
          <div className="space-y-1 min-w-0 pr-3">
            <p className="text-xs font-semibold text-sky-300/90 truncate tabular-nums">
              {roundMeta}
            </p>
            <h2 id="match-detail-title" className="text-lg sm:text-xl font-extrabold tracking-tight truncate leading-tight">
              Dettagli Incontro
            </h2>
            <p className="text-xs text-slate-300/80 truncate">
              ASD Cynthia 1920 · Stagione 2026/2027
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Chiudi dettagli (Esc)"
            aria-label="Chiudi finestra dettagli"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Scrollabile dei Dettagli */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          {/* 1. Box Squadre a Confronto (Casa vs Ospite) */}
          <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-3 text-center">
              <div
                className={`p-3.5 rounded-xl transition ${
                  partita.isCynthiaCasa
                    ? 'bg-sky-700 text-white font-extrabold'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-bold'
                }`}
              >
                <span className="text-[11px] font-medium block opacity-80 mb-0.5">
                  Casa
                </span>
                <span className="text-sm sm:text-base leading-tight block">
                  {partita.squadraCasa}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center">
                <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase px-1">
                  vs
                </span>
              </div>

              <div
                className={`p-3.5 rounded-xl transition ${
                  partita.isCynthiaOspite
                    ? 'bg-sky-700 text-white font-extrabold'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-bold'
                }`}
              >
                <span className="text-[11px] font-medium block opacity-80 mb-0.5">
                  Ospite
                </span>
                <span className="text-sm sm:text-base leading-tight block">
                  {partita.squadraOspite}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Data, Orario, Conto alla rovescia & Meteo */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                    Data incontro
                  </span>
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white capitalize tabular-nums">
                    {dateInfo.dayOfWeek.toLowerCase()} {dateInfo.dayNumber} {dateInfo.monthName} {dateInfo.year}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <WeatherBadge partita={partita} />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-sky-500/15 text-white dark:text-sky-200 border border-transparent dark:border-sky-500/30 font-mono font-bold text-sm tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-amber-400 dark:text-sky-300" />
                  <span>{dateInfo.oraFormatted}</span>
                </div>
              </div>
            </div>

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
            {/* Condivisione Nativa Web Share API */}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-sky-700 hover:bg-sky-600 text-white transition shadow-xs cursor-pointer active:scale-95"
              title="Condividi dettagli gara tramite app native"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{shareSuccess ? 'Condiviso' : 'Condividi'}</span>
            </button>

            {/* Condivisione Diretta WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs cursor-pointer active:scale-95"
              title="Invia dettagli della gara su WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

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
