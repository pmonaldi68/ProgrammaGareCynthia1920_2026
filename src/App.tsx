import React, { useState, useEffect, useMemo } from 'react';
import { Partita, FilterState, ViewMode, SheetConfig } from './types';
import {
  loadStoredConfig,
  saveStoredConfig,
  loadCachedPartite,
  saveCachedPartite,
  fetchPartiteFromSource,
} from './services/sheetService';
import { DEFAULT_PARTITE } from './data/defaultPartite';
import { Header } from './components/Header';
import { StatsSummary } from './components/StatsSummary';
import { FilterBar } from './components/FilterBar';
import { MatchCard } from './components/MatchCard';
import { MatchTable } from './components/MatchTable';
import { SheetConfigModal } from './components/SheetConfigModal';
import { GitHubGuideModal } from './components/GitHubGuideModal';
import { AlertCircle, FileCode, RefreshCw, Calendar, MapPin, ExternalLink } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<SheetConfig>(() => loadStoredConfig());
  const [partite, setPartite] = useState<Partita[]>(() => {
    const cached = loadCachedPartite();
    return cached && cached.length > 0 ? cached : DEFAULT_PARTITE;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    const cfg = loadStoredConfig();
    return cfg.lastUpdated || new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  });

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isSheetModalOpen, setIsSheetModalOpen] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);

  const [filters, setFilters] = useState<FilterState>({
    campionato: 'ALL',
    data: 'ALL',
    location: 'all',
    search: '',
  });

  // Funzione per caricare i dati
  const refreshData = async (customSheetUrl?: string, customTab?: string, silent: boolean = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const urlToUse = customSheetUrl !== undefined ? customSheetUrl : config.sheetUrl;
      const tabToUse = customTab !== undefined ? customTab : config.tabName;

      const loaded = await fetchPartiteFromSource(urlToUse, tabToUse);
      setPartite(loaded);
      saveCachedPartite(loaded);

      if ((loaded as any).fallbackWarning) {
        setError((loaded as any).fallbackWarning);
      } else {
        setError(null);
      }

      const nowStr = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastUpdated(nowStr);

      const updatedConfig = { ...config, lastUpdated: nowStr };
      setConfig(updatedConfig);
      saveStoredConfig(updatedConfig);
    } catch (err: any) {
      console.warn('Errore durante il recupero dei dati dal foglio:', err);
      if (!silent) {
        setError(
          err?.message ||
            'Impossibile scaricare i dati dal foglio Google. Sono mostrati i dati memorizzati in locale.'
        );
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  // Caricamento iniziale all'avvio e sincronizzazione in tempo reale
  useEffect(() => {
    // Controllo se è stato passato un link tramite parametro nell'URL (es. ?sheet=...)
    let initialUrl = config.sheetUrl;
    let initialTab = config.tabName;

    try {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('sheet') || params.get('csv') || params.get('url');
      const tabParam = params.get('tab');
      if (urlParam) {
        initialUrl = urlParam;
        initialTab = tabParam || config.tabName;
        const newCfg = { ...config, sheetUrl: initialUrl, tabName: initialTab };
        setConfig(newCfg);
        saveStoredConfig(newCfg);
      }
    } catch (e) {
      // Ignora se non accessibile
    }

    // Primo caricamento visibile
    refreshData(initialUrl, initialTab);

    // Sincronizzazione in tempo reale:
    // 1. Polling automatico frequente (ogni 20 secondi) per rilevare modifiche sul foglio
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshData(undefined, undefined, true);
      }
    }, 20000);

    // 2. Ricarica istantanea non appena l'utente torna sulla pagina (es. dopo aver modificato il foglio in un'altra scheda)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData(undefined, undefined, true);
      }
    };

    const handleFocus = () => {
      refreshData(undefined, undefined, true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [config.sheetUrl, config.tabName]);

  // Lista di tutti i campionati unici disponibili
  const availableCampionati = useMemo(() => {
    const unique = Array.from<string>(new Set(partite.map(p => p.campionato.trim()).filter(Boolean)));
    return unique.sort((a, b) => a.localeCompare(b, 'it'));
  }, [partite]);

  // Lista di tutte le date uniche disponibili
  const availableDate = useMemo(() => {
    const unique = Array.from<string>(new Set(partite.map(p => p.data.trim()).filter(Boolean)));
    return unique;
  }, [partite]);

  // Partite filtrate
  const filteredPartite = useMemo(() => {
    return partite.filter(p => {
      // Filtro per Campionato/Categoria
      if (filters.campionato !== 'ALL' && p.campionato !== filters.campionato) {
        return false;
      }

      // Filtro per Data
      if (filters.data !== 'ALL' && p.data !== filters.data) {
        return false;
      }

      // Filtro per Luogo (Casa o Trasferta)
      if (filters.location === 'casa' && !p.isCynthiaCasa) {
        return false;
      }
      if (filters.location === 'trasferta' && !p.isCynthiaOspite) {
        return false;
      }

      // Filtro di ricerca testuale
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchString = `${p.campionato} ${p.girone} ${p.gara} ${p.squadraCasa} ${p.squadraOspite} ${p.campo} ${p.comune} ${p.indirizzo}`.toLowerCase();
        if (!matchString.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [partite, filters]);

  const handleSaveConfig = (newConfig: SheetConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);
  };

  const handleApplyPartite = (newPartite: Partita[]) => {
    setPartite(newPartite);
    const nowStr = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    setLastUpdated(nowStr);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header Principale */}
      <Header
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        onRefresh={() => refreshData()}
        onOpenSheetConfig={() => setIsSheetModalOpen(true)}
        onOpenGitHubGuide={() => setIsGitHubModalOpen(true)}
      />

      {/* Contenuto Pagina */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Notifica di errore / avviso se presente */}
        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Avviso sincronizzazione</p>
                <p className="text-amber-800 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline flex-shrink-0"
            >
              Chiudi
            </button>
          </div>
        )}

        {/* Barra Statistiche Riepilogative */}
        <StatsSummary partite={filteredPartite} totalAvailable={partite.length} />

        {/* Barra Filtri (Campionato, Data, Casa/Fuori, Cerca, Switch Vista) */}
        <FilterBar
          filters={filters}
          onChangeFilters={setFilters}
          availableCampionati={availableCampionati}
          availableDate={availableDate}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
        />

        {/* Visualizzazione Partite: Schede o Tabella */}
        {filteredPartite.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs my-6">
            <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
              ⚽
            </div>
            <h3 className="text-lg font-bold text-slate-800">Nessuna gara corrispondente ai filtri</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Non ci sono partite con i criteri di filtro o ricerca selezionati. Prova ad azzerare i filtri per vedere tutte le gare del weekend.
            </p>
            <button
              type="button"
              onClick={() =>
                setFilters({
                  campionato: 'ALL',
                  data: 'ALL',
                  location: 'all',
                  search: '',
                })
              }
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white transition shadow-xs"
            >
              Mostra Tutte le Gare
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 animate-in fade-in duration-200">
            {filteredPartite.map(partita => (
              <MatchCard key={partita.id} partita={partita} />
            ))}
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
            <MatchTable partite={filteredPartite} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-xs text-slate-500 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-700 text-white font-bold flex items-center justify-center text-xs">
              C
            </div>
            <p className="font-semibold text-slate-700">
              ASD Cynthia 1920 • Stadio Comunale Bruno Abbatini (Genzano di Roma)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <a
              href="https://github.com/pmonaldi68/ProgrammaGareCynthia1920_2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-sky-700 transition flex items-center gap-1"
            >
              Repository GitHub <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="./standalone.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-sky-700 transition flex items-center gap-1"
            >
              Versione HTML Puro <FileCode className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modale Configurazione Google Sheets */}
      <SheetConfigModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        config={config}
        currentPartite={partite}
        onSaveConfig={handleSaveConfig}
        onApplyPartite={handleApplyPartite}
      />

      {/* Modale Guida GitHub & GitHub Actions */}
      <GitHubGuideModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />
    </div>
  );
}
