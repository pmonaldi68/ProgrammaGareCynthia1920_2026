import React from 'react';
import { RefreshCw, Sheet, Github, Share2, Printer, ExternalLink, Calendar } from 'lucide-react';

interface HeaderProps {
  isLoading: boolean;
  lastUpdated: string | null;
  onRefresh: () => void;
  onOpenSheetConfig: () => void;
  onOpenGitHubGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isLoading,
  lastUpdated,
  onRefresh,
  onOpenSheetConfig,
  onOpenGitHubGuide,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Programma Gare ASD Cynthia 1920',
          text: 'Consulta il programma gare del fine settimana per ASD Cynthia 1920',
          url: window.location.href,
        });
      } catch (err) {
        // Ignora se l'utente annulla la condivisione
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiato negli appunti!');
    }
  };

  return (
    <header className="bg-gradient-to-r from-sky-900 via-sky-800 to-cyan-800 text-white shadow-lg border-b border-sky-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Titolo */}
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white text-sky-800 flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md border-2 border-sky-200">
                <span className="tracking-tighter text-sky-700">C</span>
                <span className="text-xs absolute bottom-1 text-sky-600 font-bold tracking-widest">1920</span>
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  ASD CYNTHIA 1920
                </h1>
                <span className="bg-sky-500/30 text-sky-100 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-sky-300/30">
                  Biancoazzurri
                </span>
              </div>
              <p className="text-sky-100/90 text-sm font-medium mt-0.5">
                Programma Gare del Fine Settimana • Genzano di Roma
              </p>
              {lastUpdated && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                  <p className="text-sky-200/75 text-xs flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Ultimo controllo: <span className="font-semibold text-white">{lastUpdated}</span>
                  </p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Sync attivo
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottoni Azioni Rapide */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              id="btn-header-refresh"
              onClick={onRefresh}
              disabled={isLoading}
              title="Aggiorna i dati dal foglio"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-700/80 hover:bg-sky-600 text-white border border-sky-500/40 shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Caricamento...' : 'Aggiorna'}</span>
            </button>

            <button
              id="btn-header-sheet"
              onClick={onOpenSheetConfig}
              title="Configura Google Sheets"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm transition"
            >
              <Sheet className="w-3.5 h-3.5 text-emerald-300" />
              <span>Google Sheets</span>
            </button>

            <button
              id="btn-header-github"
              onClick={onOpenGitHubGuide}
              title="Info GitHub & Actions"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm transition"
            >
              <Github className="w-3.5 h-3.5 text-slate-200" />
              <span className="hidden sm:inline">GitHub Actions</span>
              <span className="sm:hidden">GitHub</span>
            </button>

            <div className="flex items-center gap-1 pl-1 border-l border-sky-600/50">
              <button
                id="btn-header-print"
                onClick={handlePrint}
                title="Stampa programma gare"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/15"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-header-share"
                onClick={handleShare}
                title="Condividi o copia link"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/15"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
