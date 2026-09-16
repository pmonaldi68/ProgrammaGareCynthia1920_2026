import React from 'react';
import { Shield, Share2, Printer, Calendar, Lock } from 'lucide-react';

interface HeaderProps {
  lastUpdated: string | null;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  onOpenAdmin,
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
          <div className="flex items-center justify-center gap-2 mt-1 sm:mt-0">
            <button
              id="btn-header-admin"
              onClick={onOpenAdmin}
              title="Area Amministrazione protetta"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/15 hover:bg-white/25 active:scale-[0.98] text-white border border-white/25 shadow-sm transition min-h-[44px]"
            >
              <Shield className="w-4 h-4 text-amber-300" />
              <span>Area Admin</span>
              <Lock className="w-3.5 h-3.5 text-sky-200 ml-0.5 opacity-80" />
            </button>

            <div className="flex items-center gap-1.5 pl-1 border-l border-sky-600/50">
              <button
                id="btn-header-print"
                onClick={handlePrint}
                title="Stampa programma gare"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/15 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                id="btn-header-share"
                onClick={handleShare}
                title="Condividi o copia link"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/15 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
