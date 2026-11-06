import React, { useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  X,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Globe,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseUnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

export const FirebaseUnauthorizedDomainModal: React.FC<FirebaseUnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  onRetry,
}) => {
  const [copiedType, setCopiedType] = useState<'wildcard' | 'exact' | null>(null);

  if (!isOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const projectId = firebaseConfig.projectId || 'gen-lang-client-0525513341';
  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  const handleCopy = (text: string, type: 'wildcard' | 'exact') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div
      id="unauthorized-domain-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unauthorized-domain-title"
    >
      <div
        id="unauthorized-domain-modal-container"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-300 dark:border-amber-700/80 overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white px-5 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-white/20 text-white border border-white/25 shadow-inner shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 id="unauthorized-domain-title" className="font-extrabold text-sm sm:text-base leading-tight truncate">
                  Autorizzazione Dominio Firebase
                </h3>
              </div>
              <p className="text-[11px] text-amber-100/90 truncate">
                Errore auth/unauthorized-domain • Progetto {projectId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-amber-100 hover:text-white hover:bg-white/15 transition cursor-pointer"
            title="Chiudi"
            aria-label="Chiudi finestra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Informativo e Istruzioni Guidate */}
        <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-slate-700 dark:text-slate-200 leading-relaxed text-xs">
              Per motivi di sicurezza, Firebase Authentication accetta accessi Google solo da domini preventivamente registrati nella console. Il dominio di questa istanza deve essere aggiunto all&apos;elenco dei <strong>Domini autorizzati</strong>.
            </div>
          </div>

          {/* Domini da Aggiungere */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              1. Dominio da copiare (consigliato &quot;run.app&quot;)
            </span>

            {/* Opzione 1: run.app (copre tutte le preview) */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                  <Globe className="w-3.5 h-3.5 text-sky-500" />
                  <span className="font-mono text-xs">run.app</span>
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Consigliato
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Autorizza automaticamente tutti gli ambienti di sviluppo e anteprima
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('run.app', 'wildcard')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
              >
                {copiedType === 'wildcard' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedType === 'wildcard' ? 'Copiato!' : 'Copia'}</span>
              </button>
            </div>

            {/* Opzione 2: Hostname specifico */}
            {currentHostname && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                    <span className="font-mono text-[11px] truncate">{currentHostname}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Dominio specifico di questa sessione
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(currentHostname, 'exact')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
                >
                  {copiedType === 'exact' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedType === 'exact' ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>
            )}
          </div>

          {/* 3 Passaggi Rapidi */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              2. Come configurarlo in 30 secondi
            </span>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300 pl-1 leading-relaxed">
              <li>Clicca sul pulsante arancione in basso <strong>&quot;Apri Impostazioni Firebase Console&quot;</strong>;</li>
              <li>Nella pagina che si apre, scorri fino alla sezione <strong>&quot;Domini autorizzati&quot; (Authorized domains)</strong>;</li>
              <li>Clicca su <strong>&quot;Aggiungi dominio&quot;</strong>, incolla <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 font-mono">run.app</code> e clicca <strong>Salva</strong>.</li>
            </ol>
          </div>

          {/* Pulsante Apertura Diretta Firebase Console */}
          <a
            href={firebaseConsoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 active:scale-[0.98] transition shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Apri Impostazioni Firebase Console</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Dopo aver salvato, riprova l&apos;accesso
          </span>
          <div className="flex items-center gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRetry();
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Riprova Accesso</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold text-xs transition cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
