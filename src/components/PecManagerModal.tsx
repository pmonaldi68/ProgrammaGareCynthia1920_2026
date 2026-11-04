import React, { useState } from 'react';
import {
  X,
  Mail,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
  FileText,
  Send,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface PecManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PEC_APP_URL = 'https://ai.studio/apps/c21f37da-c792-4730-b67a-b80cc22c9d43';

export const PecManagerModal: React.FC<PecManagerModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(PEC_APP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenApp = () => {
    window.open(PEC_APP_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="pec-manager-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pec-manager-title"
    >
      <div
        id="pec-manager-modal-container"
        className="relative w-full max-w-xl flex flex-col bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale Gestione PEC */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0 shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="pec-manager-title" className="font-extrabold text-sm sm:text-base leading-tight truncate">
                  Gestione PEC Societaria
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Posta Certificata
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 truncate">
                ASD Cynthia 1920 • Stagione Sportiva 2026/2027
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Chiudi finestra (Esc)"
            aria-label="Chiudi finestra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Informativo e di Accesso */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Card Principale con Pulsante di Avvio Diretto */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50/60 dark:from-blue-950/40 dark:via-sky-950/30 dark:to-slate-900 border border-blue-200 dark:border-blue-800 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-600/30">
              <Mail className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Applicazione PEC ASD Cynthia 1920
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                Piattaforma dedicata alla gestione della posta elettronica certificata societaria, comunicazioni ufficiali FIGC/LND, tesseramenti e protocollo.
              </p>
            </div>

            {/* Pulsante Primario: Apertura diretta senza blocchi di iframe */}
            <a
              href={PEC_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenApp}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Accedi all&apos;App PEC</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Lock className="w-3.5 h-3.5 text-blue-500" />
              <span>Apertura protetta in una scheda indipendente per la massima sicurezza dei dati</span>
            </div>
          </div>

          {/* Funzionalità Gestite nell'App PEC */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Funzionalità Incluse
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 block">Comunicazioni Federali</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Ricezione comunicati LND e Comitato Regionale</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <Send className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 block">Invio con Valore Legale</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Ricevute di accettazione e consegna certificate</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 block">Tesseramenti & Protocollo</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Fascicoli atleti, svincoli e pratiche di segreteria</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 block">Ricerca & Archivio</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Filtro rapido messaggi e storico documentale</span>
                </div>
              </div>
            </div>
          </div>

          {/* Indirizzo Web & Pulsante Copia Link */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Indirizzo Applicazione PEC
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate">
                {PEC_APP_URL}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 text-xs font-semibold transition cursor-pointer shrink-0 shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiato!' : 'Copia'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Modale */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>ASD Cynthia 1920 • Segreteria & Dirigenza</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold transition cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
