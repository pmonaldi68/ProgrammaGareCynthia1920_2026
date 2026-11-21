import React, { useState, useEffect } from 'react';
import {
  Shield,
  Sun,
  Moon,
  Bell,
  FileDown,
  Palette,
  RefreshCw,
  CheckCircle2,
  WifiOff,
} from 'lucide-react';
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
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="relative bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800/80 transition-colors overflow-hidden">
      {/* Subtle Modern Atmospheric Club Tint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(900px circle at 12% -20%, color-mix(in oklab, var(--color-sky-600) 42%, transparent), transparent 65%), radial-gradient(650px circle at 92% 110%, color-mix(in oklab, var(--color-amber-500) 14%, transparent), transparent 70%)',
        }}
      />

      {/* Dynamic Real-Time Sync Progress Bar */}
      {isSyncing && (
        <div
          id="header-sync-progressbar"
          className="absolute top-0 left-0 right-0 h-1 z-30 bg-slate-950/60 overflow-hidden"
          role="progressbar"
          aria-label="Sincronizzazione dati calendario da Google Sheets in corso"
        >
          <div className="h-full bg-gradient-to-r from-amber-400 via-sky-300 to-sky-500 animate-sync-bar" />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Brand & Schedule Context */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <img
              id="header-cynthia-logo"
              src="./assets/cynthia_logo.png"
              alt="Stemma ASD Cynthia 1920"
              className="h-14 sm:h-16 w-auto object-contain shrink-0 drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)] transition-transform duration-200 hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold tracking-tight text-white leading-none">
                  ASD Cynthia 1920
                </h1>
                <span className="text-xs font-bold text-amber-300 whitespace-nowrap">
                  Biancoazzurri
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs sm:text-[13px] text-slate-300 font-medium">
                <span>Programma Gare</span>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span className="tabular-nums">Stagione 2026/2027</span>
                <span aria-hidden="true" className="text-slate-500 hidden sm:inline">·</span>
                <span className="hidden sm:inline text-slate-400">Genzano di Roma</span>
              </div>

              {/* Compact Last Updated Indicator + Manual Refresh Icon + Offline State */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] sm:text-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.07] border border-white/10 text-slate-200 tabular-nums">
                  <span className="text-slate-400">Ultimo aggiornamento:</span>
                  <strong className="text-white font-bold">
                    {lastUpdated || '--/-- --:--'}
                  </strong>

                  {onRefresh && (
                    <button
                      id="btn-header-refresh"
                      type="button"
                      onClick={onRefresh}
                      disabled={isSyncing}
                      title="Ricarica manualmente i dati aggiornati dalla rete"
                      aria-label="Ricarica manualmente i dati"
                      className="ml-0.5 p-1 rounded-md text-sky-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-300' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {isSyncing && (
                  <span
                    id="badge-sync-loading"
                    className="inline-flex items-center gap-1 text-amber-300 font-semibold"
                  >
                    <span>Aggiornamento...</span>
                  </span>
                )}

                {!isSyncing && justSynced && (
                  <span
                    id="badge-sync-success"
                    className="inline-flex items-center gap-1 text-emerald-300 font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Dati aggiornati</span>
                  </span>
                )}

                {!isOnline && (
                  <span
                    id="badge-offline-mode"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-200 font-semibold"
                    title="Connessione assente: visualizzazione dalla cache locale"
                  >
                    <WifiOff className="w-3 h-3 shrink-0" />
                    <span>Offline</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action & Utility Toolbar */}
          <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-xs">
              {onOpenPdfExport && (
                <button
                  id="btn-header-pdf"
                  type="button"
                  onClick={onOpenPdfExport}
                  title="Esporta programma gare in PDF o stampa A4"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-100 hover:bg-white/10 hover:text-white transition-colors duration-150 min-h-[40px] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-sky-300 shrink-0" />
                  <span className="hidden sm:inline">Report PDF</span>
                </button>
              )}

              <button
                id="btn-header-notifications"
                type="button"
                onClick={onOpenNotifications}
                title="Avvisi variazioni gare (orario o campo)"
                className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-100 hover:bg-white/10 hover:text-white transition-colors duration-150 min-h-[40px] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Bell className={`w-4 h-4 shrink-0 ${hasFollowedCategories ? 'text-amber-300' : 'text-sky-300'}`} />
                <span className="hidden sm:inline">Avvisi</span>
              </button>

              {onOpenSettings && (
                <button
                  id="btn-header-settings"
                  type="button"
                  onClick={onOpenSettings}
                  title="Personalizza tonalità principale e aspetto"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-100 hover:bg-white/10 hover:text-white transition-colors duration-150 min-h-[40px] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Palette className="w-4 h-4 text-sky-300 shrink-0" />
                  <span className="hidden md:inline">Aspetto</span>
                </button>
              )}

              <button
                id="btn-header-theme"
                type="button"
                onClick={toggleTheme}
                title={`Passa a tema ${resolvedTheme === 'dark' ? 'Chiaro' : 'Scuro'}`}
                aria-label={`Passa a tema ${resolvedTheme === 'dark' ? 'Chiaro' : 'Scuro'}`}
                className="p-2 rounded-lg text-slate-100 hover:bg-white/10 hover:text-white transition-colors duration-150 min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0 cursor-pointer"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-sky-200" />
                )}
              </button>
            </div>

            <button
              id="btn-header-admin"
              type="button"
              onClick={onOpenAdmin}
              title="Area Amministrazione protetta"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white border border-amber-400/40 shadow-xs transition duration-150 min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Area Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
