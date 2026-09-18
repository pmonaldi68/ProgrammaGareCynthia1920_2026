import React, { useState, useEffect, useMemo } from 'react';
import { Partita, SheetConfig, FilterState, ViewMode, MatchVariation } from './types';
import {
  fetchPartiteFromSource,
  loadStoredConfig,
  saveStoredConfig,
  loadCachedPartite,
  saveCachedPartite,
} from './services/sheetService';
import {
  registerServiceWorker,
  getFollowedCategories,
  checkPartiteVariations,
} from './services/notificationService';
import { getMatchIsoDate } from './utils/calendarUtils';
import { Header } from './components/Header';
import { StatsSummary } from './components/StatsSummary';
import { FilterBar } from './components/FilterBar';
import { MatchCard } from './components/MatchCard';
import { MatchTable } from './components/MatchTable';
import { MatchMapView } from './components/MatchMapView';
import { MatchSkeleton } from './components/MatchSkeleton';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { SheetConfigModal } from './components/SheetConfigModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { GitHubGuideModal } from './components/GitHubGuideModal';
import { NotificationModal } from './components/NotificationModal';
import { PdfExportModal } from './components/PdfExportModal';
import { SettingsModal } from './components/SettingsModal';
import { DEFAULT_PARTITE } from './data/defaultPartite';
import { AlertCircle, ExternalLink, FileCode, BellRing, X, Palette } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<SheetConfig>(loadStoredConfig);
  const [partite, setPartite] = useState<Partita[]>(() => {
    return loadCachedPartite() || DEFAULT_PARTITE;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    const cfg = loadStoredConfig();
    return cfg.lastUpdated || new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  });

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [recentVariations, setRecentVariations] = useState<MatchVariation[]>([]);
  const [bannerVariation, setBannerVariation] = useState<MatchVariation | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    campionato: 'ALL',
    data: 'ALL',
    startDate: '',
    endDate: '',
    location: 'all',
    search: '',
  });

  // Registrazione iniziale del Service Worker per Web Push
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Funzione per caricare i dati e verificare variazioni per le categorie seguite
  const refreshData = async (customSheetUrl?: string, customTab?: string, silent: boolean = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const urlToUse = customSheetUrl !== undefined ? customSheetUrl : config.sheetUrl;
      const tabToUse = customTab !== undefined ? customTab : config.tabName;

      const loaded = await fetchPartiteFromSource(urlToUse, tabToUse);

      // Controllo variazioni di orario o di campo rispetto ai dati precedenti salvati
      const followed = getFollowedCategories();
      const detectedVariations = checkPartiteVariations(loaded, followed);
      if (detectedVariations.length > 0) {
        setRecentVariations(prev => [...detectedVariations, ...prev]);
        setBannerVariation(detectedVariations[0]);
      }

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
            'Impossibile scaricare i dati remoti. Vengono mostrati i dati di riserva salvati localmente.'
        );
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  // Caricamento iniziale e polling automatico ogni 5 minuti
  useEffect(() => {
    refreshData(undefined, undefined, true);

    const intervalId = setInterval(() => {
      refreshData(undefined, undefined, true);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Categorie / Campionati unici per il filtro
  const availableCampionati = useMemo(() => {
    const list = Array.from(new Set(partite.map(p => p.campionato))).filter(Boolean);
    return list.sort();
  }, [partite]);

  // Date uniche per il filtro
  const availableDate = useMemo(() => {
    const list = Array.from(new Set(partite.map(p => p.data))).filter(Boolean);
    return list.sort();
  }, [partite]);

  // Partite filtrate (supporta Categoria, Data predefinita, Intervallo Date Picker Da/A, Casa/Fuori, Ricerca)
  const filteredPartite = useMemo(() => {
    return partite.filter(p => {
      // Filtro Campionato
      if (filters.campionato !== 'ALL' && p.campionato !== filters.campionato) {
        return false;
      }

      // Filtro Data predefinita (selezionata dal menu a tendina classico)
      if (filters.data !== 'ALL' && p.data !== filters.data) {
        return false;
      }

      // Filtro Intervallo Date (Date Picker personalizzato Da / A)
      if (filters.startDate || filters.endDate) {
        const matchIso = getMatchIsoDate(p.data);
        if (matchIso) {
          if (filters.startDate && matchIso < filters.startDate) {
            return false;
          }
          if (filters.endDate && matchIso > filters.endDate) {
            return false;
          }
        }
      }

      // Filtro Casa / Trasferta
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
    const followed = getFollowedCategories();
    const detectedVariations = checkPartiteVariations(newPartite, followed);
    if (detectedVariations.length > 0) {
      setRecentVariations(prev => [...detectedVariations, ...prev]);
      setBannerVariation(detectedVariations[0]);
    }
    setPartite(newPartite);
    const nowStr = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    setLastUpdated(nowStr);
  };

  const hasFollowed = getFollowedCategories().length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Header Principale */}
      <Header
        lastUpdated={lastUpdated}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenPdfExport={() => setIsPdfModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        hasFollowedCategories={hasFollowed}
      />

      {/* Contenuto Pagina */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Banner Variazione Rilevata in Tempo Reale */}
        {bannerVariation && (
          <div id="banner-variation" className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/50 border border-amber-300 dark:border-amber-700/80 shadow-xs flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white flex-shrink-0 mt-0.5">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-amber-950 dark:text-amber-100 text-sm">
                    ⚠️ Variazione Programma Rilevata: {bannerVariation.campionato}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    Live
                  </span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200 font-semibold mt-0.5">
                  {bannerVariation.squadre} ({bannerVariation.data})
                </p>
                <ul className="list-disc pl-4 mt-1 text-xs text-amber-800 dark:text-amber-300">
                  {bannerVariation.changes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              onClick={() => setBannerVariation(null)}
              className="p-1 rounded-lg text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 flex-shrink-0"
              title="Chiudi avviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Notifica di errore / avviso se presente */}
        {error && (
          <div id="banner-error" className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950 dark:text-amber-100">Avviso sincronizzazione</p>
                <p className="text-amber-800 dark:text-amber-300 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 underline flex-shrink-0"
            >
              Chiudi
            </button>
          </div>
        )}

        {/* Barra Statistiche Riepilogative */}
        <StatsSummary partite={filteredPartite} totalAvailable={partite.length} />

        {/* Barra Filtri (Campionato, Data, Date Picker Intervallo, Casa/Fuori, Cerca, Switch Vista) */}
        <FilterBar
          filters={filters}
          onChangeFilters={setFilters}
          availableCampionati={availableCampionati}
          availableDate={availableDate}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          onOpenPdfExport={() => setIsPdfModalOpen(true)}
        />

        {/* Visualizzazione Partite: Skeleton Screen durante il fetch, altrimenti Schede o Tabella */}
        {isLoading ? (
          <MatchSkeleton viewMode={viewMode} count={6} />
        ) : filteredPartite.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-12 text-center shadow-xs my-6">
            <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
              ⚽
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Nessuna gara corrispondente ai filtri</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Non ci sono partite con i criteri di filtro o ricerca selezionati. Prova ad azzerare i filtri per vedere tutte le gare del weekend.
            </p>
            <button
              type="button"
              onClick={() =>
                setFilters({
                  campionato: 'ALL',
                  data: 'ALL',
                  startDate: '',
                  endDate: '',
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
        ) : viewMode === 'table' ? (
          <div className="animate-in fade-in duration-200">
            <MatchTable partite={filteredPartite} />
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
            <MatchMapView partite={filteredPartite} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-6 text-xs text-slate-500 dark:text-slate-400 mt-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-700 text-white font-bold flex items-center justify-center text-xs">
              C
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              ASD Cynthia 1920
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 transition flex items-center gap-1 font-semibold"
            >
              <FileCode className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              Report PDF Settimanale
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => setIsNotificationModalOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 transition flex items-center gap-1 font-semibold"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-500" />
              Avvisi Variazioni Web Push
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 transition flex items-center gap-1 font-semibold"
            >
              <Palette className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              Impostazioni & Tema
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a
              href="https://github.com/pmonaldi68/ProgrammaGareCynthia1920_2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 transition flex items-center gap-1"
            >
              Repository GitHub <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a
              href="./standalone.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 transition flex items-center gap-1"
            >
              Versione HTML Puro <FileCode className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modale Esportazione e Stampa Report PDF Settimanale */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        allPartite={partite}
        filteredPartite={filteredPartite}
        hasActiveFilters={
          filters.campionato !== 'ALL' ||
          filters.data !== 'ALL' ||
          Boolean(filters.startDate) ||
          Boolean(filters.endDate) ||
          filters.location !== 'all' ||
          Boolean(filters.search)
        }
      />

      {/* Modale Impostazioni & Aspetto (Tonalità Colore Primario & Tema) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Modale Gestione Notifiche Variazioni Web Push */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        availableCampionati={availableCampionati}
        recentVariations={recentVariations}
      />

      {/* Modale Area Amministrazione Protetta */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isLoading={isLoading}
        onRefresh={() => refreshData()}
        onOpenSheetConfig={() => setIsSheetModalOpen(true)}
        onOpenGitHubGuide={() => setIsGitHubModalOpen(true)}
        onOpenPdfExport={() => setIsPdfModalOpen(true)}
        sheetUrl={config.sheetUrl}
      />

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

      {/* Banner di Installazione PWA per Dispositivi Mobili */}
      <PwaInstallPrompt />
    </div>
  );
}
