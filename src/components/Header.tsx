import React from 'react';
import { Shield, Calendar, Lock, Sun, Moon, Bell, FileDown, Palette, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  lastUpdated: string | null;
  onOpenAdmin: () => void;
  onOpenNotifications: () => void;
  onOpenPdfExport?: () => void;
  onOpenSettings?: () => void;
  hasFollowedCategories?: boolean;
  isSyncing?: boolean;
  justSynced?: boolean;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  onOpenAdmin,
  onOpenNotifications,
  onOpenPdfExport,
  onOpenSettings,
  hasFollowedCategories = false,
  isSyncing = false,
  justSynced = false,
  onRefresh,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="relative bg-gradient-to-r from-sky-900 via-sky-800 to-cyan-800 dark:from-slate-950 dark:via-sky-950 dark:to-slate-900 text-white shadow-lg border-b border-sky-700/50 dark:border-slate-800 transition-colors overflow-hidden">
      {/* Barra di Avanzamento Dinamica Sincronizzazione in Tempo Reale */}
      {isSyncing && (
        <div
          id="header-sync-progressbar"
          className="absolute top-0 left-0 right-0 h-1.5 z-30 bg-sky-950/60 overflow-hidden"
          role="progressbar"
          aria-label="Sincronizzazione dati calendario da Google Sheets in corso"
        >
          <div className="h-full bg-gradient-to-r from-amber-400 via-yellow-200 to-sky-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-sync-bar" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Titolo */}
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="relative flex-shrink-0">
              <img
                id="header-cynthia-logo"
                src="./assets/cynthia_logo.png"
                alt="Stemma ASD Cynthia 1920"
                className="h-16 w-auto sm:h-20 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)] transition-transform hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  ASD CYNTHIA 1920
                </h1>
                <span className="bg-sky-500/30 text-sky-100 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-sky-300/30">
                  Biancoazzurri
                </span>
                <span className="bg-amber-400/25 text-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300/40 shadow-xs">
                  Stagione 2026/2027
                </span>
              </div>
              <p className="text-sky-100/90 dark:text-sky-200/90 text-sm font-medium mt-0.5">
                Programma Gare del Fine Settimana • Stagione Sportiva 2026/2027 • Genzano di Roma
              </p>
              {lastUpdated && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1.5">
                  <p className="text-sky-200/80 text-xs flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ultimo controllo:</span>
                    <span className="font-bold text-white tracking-wide">{lastUpdated}</span>
                  </p>

                  {/* Stato di Sincronizzazione Cloud Evidente & Interattivo */}
                  {isSyncing ? (
                    <span
                      id="badge-sync-loading"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/25 text-amber-200 border border-amber-300/40 shadow-xs animate-pulse"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300 shrink-0" />
                      <span>Aggiornamento dal foglio Google...</span>
                    </span>
                  ) : justSynced ? (
                    <span
                      id="badge-sync-success"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-xs animate-in fade-in"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                      <span>Dati aggiornati in tempo reale!</span>
                    </span>
                  ) : (
                    <span
                      id="badge-sync-active"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Sync attivo • Cloud Google Sheets</span>
                    </span>
                  )}

                  {/* Pulsante Rapido Aggiorna con Icona Rotazione */}
                  {onRefresh && (
                    <button
                      id="btn-header-refresh"
                      type="button"
                      onClick={onRefresh}
                      disabled={isSyncing}
                      title="Aggiorna manualmente i dati dal foglio Google"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 hover:bg-white/20 active:scale-95 text-sky-200 hover:text-white border border-white/20 transition disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-300' : ''}`} />
                      <span className="hidden xs:inline">{isSyncing ? 'Aggiornamento...' : 'Ricarica'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottoni Azioni Rapide */}
          <div className="flex items-center justify-center gap-2 mt-1 sm:mt-0">
            {/* Pulsante Report PDF */}
            {onOpenPdfExport && (
              <button
                id="btn-header-pdf"
                type="button"
                onClick={onOpenPdfExport}
                title="Scarica il programma gare settimanale in PDF o condividi su WhatsApp"
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white transition border border-white/15 min-h-[44px]"
              >
                <FileDown className="w-4 h-4 text-amber-300" />
                <span className="text-xs sm:text-sm font-bold hidden sm:inline">Report PDF</span>
              </button>
            )}

            {/* Pulsante Notifiche Variazioni Web Push */}
            <button
              id="btn-header-notifications"
              type="button"
              onClick={onOpenNotifications}
              title="Configura avvisi notifiche variazioni gare (orario/campo)"
              className="relative inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/15 min-h-[44px]"
            >
              <Bell className="w-4 h-4 text-amber-300" />
              <span className="text-xs sm:text-sm font-bold hidden xs:inline">Avvisi Variazioni</span>
              {hasFollowedCategories && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Notifiche attive per categorie selezionate" />
              )}
            </button>

            {/* Pulsante Impostazioni Tema & Colore Primario */}
            {onOpenSettings && (
              <button
                id="btn-header-settings"
                type="button"
                onClick={onOpenSettings}
                title="Personalizza tonalità principale e impostazioni visive"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white transition border border-white/15 min-h-[44px]"
              >
                <Palette className="w-4 h-4 text-amber-300" />
                <span className="text-xs sm:text-sm font-bold hidden md:inline">Tema & Colore</span>
              </button>
            )}

            {/* Toggle Rapido Tema Dark / Light */}
            <button
              id="btn-header-theme"
              type="button"
              onClick={toggleTheme}
              title={`Passa a tema ${resolvedTheme === 'dark' ? 'Chiaro' : 'Scuro'}`}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/15 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-sky-200" />
              )}
            </button>

            {/* Pulsante Area Admin */}
            <button
              id="btn-header-admin"
              onClick={onOpenAdmin}
              title="Area Amministrazione protetta"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/15 hover:bg-white/25 active:scale-[0.98] text-white border border-white/25 shadow-sm transition min-h-[44px] cursor-pointer"
            >
              <Shield className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Area Admin</span>
              <Lock className="w-3.5 h-3.5 text-sky-200 ml-0.5 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
