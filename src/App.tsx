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
import { getMatchIsoDate, parseMatchDateTime } from './utils/calendarUtils';
import { formatMatchDateAndDay } from './utils/dateFormatter';
import { Header } from './components/Header';
import { StatsSummary } from './components/StatsSummary';
import { FilterBar } from './components/FilterBar';
import { MatchCard } from './components/MatchCard';
import { MatchTable } from './components/MatchTable';
import { ImpegnoCampiModal } from './components/ImpegnoCampiModal';
import { MatchMapView } from './components/MatchMapView';
import { MatchCalendarView } from './components/MatchCalendarView';
import { TuttocampoWidgets } from './components/TuttocampoWidgets';
import { WeeklyTimeline, WeeklySummaryStrip } from './components/WeeklyTimeline';
import { MatchSkeleton } from './components/MatchSkeleton';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { SheetConfigModal } from './components/SheetConfigModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { GitHubGuideModal } from './components/GitHubGuideModal';
import { NotificationModal } from './components/NotificationModal';
import { PdfExportModal } from './components/PdfExportModal';
import { SettingsModal } from './components/SettingsModal';
import { ConvocazioniModal } from './components/ConvocazioniModal';
import { PecManagerModal } from './components/PecManagerModal';
import { DEFAULT_PARTITE } from './data/defaultPartite';
import { getPublicPartite, getDonBoscoPartite, detectPartitaClub } from './utils/donBoscoUtils';
import { runWithViewTransition } from './utils/viewTransition';
import { AlertCircle, FileCode, BellRing, X, Palette, GanttChart, Trophy } from 'lucide-react';

const SAVED_FILTERS_KEY = 'cynthia_saved_filters_v1';

const DEFAULT_FILTERS: FilterState = {
  campionato: 'ALL',
  societa: 'ALL',
  data: 'ALL',
  dayOfWeek: 'ALL',
  startDate: '',
  endDate: '',
  location: 'all',
  timeWindow: 'all',
  search: '',
};

function loadInitialFilters(): FilterState {
  try {
    const raw = localStorage.getItem(SAVED_FILTERS_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_FILTERS,
      ...parsed,
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

function formatLastUpdatedTimestamp(date: Date = new Date()): string {
  const gg = date.getDate().toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${gg}/${mm} ${hh}:${min}`;
}

export default function App() {
  const [config, setConfig] = useState<SheetConfig>(loadStoredConfig);

  const cachedAtBoot = useMemo(() => loadCachedPartite(), []);
  const [partite, setPartite] = useState<Partita[]>(() => cachedAtBoot || []);
  const [isLoading, setIsLoading] = useState<boolean>(() => !cachedAtBoot);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    const cfg = loadStoredConfig();
    if (cfg.lastUpdated && /^\d{2}\/\d{2}\s+\d{2}:\d{2}/.test(cfg.lastUpdated)) {
      return cfg.lastUpdated;
    }
    return formatLastUpdatedTimestamp();
  });

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [previousViewMode, setPreviousViewMode] = useState<ViewMode>('cards');
  const [showWeeklySummary, setShowWeeklySummary] = useState<boolean>(() => {
    const saved = localStorage.getItem('cynthia_show_weekly_summary');
    return saved !== 'false';
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isConvocazioniModalOpen, setIsConvocazioniModalOpen] = useState<boolean>(false);
  const [isPecModalOpen, setIsPecModalOpen] = useState<boolean>(false);
  const [isImpegnoCampiModalOpen, setIsImpegnoCampiModalOpen] = useState<boolean>(false);
  const [recentVariations, setRecentVariations] = useState<MatchVariation[]>([]);
  const [bannerVariation, setBannerVariation] = useState<MatchVariation | null>(null);

  const [filters, setFilters] = useState<FilterState>(loadInitialFilters);

  // Salvataggio automatico preferenze filtro su localStorage (genitore/mister ritrova subito la propria squadra)
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters));
    } catch {
      // Storage non disponibile
    }
  }, [filters]);

  // Registrazione iniziale del Service Worker PWA (Network-First + Web Push)
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Funzione per caricare i dati Network-First e verificare variazioni per le categorie seguite
  const refreshData = async (customSheetUrl?: string, customTab?: string, silent: boolean = false) => {
    setIsSyncing(true);
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

      const nowStr = formatLastUpdatedTimestamp();
      setLastUpdated(nowStr);

      const updatedConfig = { ...config, lastUpdated: nowStr };
      setConfig(updatedConfig);
      saveStoredConfig(updatedConfig);

      // Notifica visiva di avvenuto aggiornamento per feedback immediato
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3500);
    } catch (err: any) {
      console.warn('Errore durante il recupero dei dati dal foglio:', err);
      setPartite(prev => (prev.length > 0 ? prev : DEFAULT_PARTITE));
      if (!silent) {
        setError(
          err?.message ||
            'Impossibile scaricare i dati remoti. Vengono mostrati i dati di riserva salvati localmente.'
        );
      }
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  // Caricamento iniziale (mostra skeleton se non presente cache) e polling automatico ogni 5 minuti
  useEffect(() => {
    refreshData(undefined, undefined, Boolean(cachedAtBoot));

    const intervalId = setInterval(() => {
      refreshData(undefined, undefined, true);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Partite destinate all'area pubblica (esclude rigorosamente le gare della P.G.S. DON BOSCO GENZANO)
  const publicPartite = useMemo(() => {
    return getPublicPartite(partite);
  }, [partite]);

  // Gare riservate alla P.G.S. DON BOSCO GENZANO (gestibili solo nell'Area Amministrazione)
  const donBoscoPartite = useMemo(() => {
    return getDonBoscoPartite(partite);
  }, [partite]);

  // Categorie / Campionati unici per il filtro dell'area pubblica
  const availableCampionati = useMemo(() => {
    const list = Array.from(new Set(publicPartite.map(p => p.campionato))).filter(Boolean);
    return list.sort();
  }, [publicPartite]);

  // Date uniche per il filtro dell'area pubblica
  const availableDate = useMemo(() => {
    const list = Array.from(new Set(publicPartite.map(p => p.data))).filter(Boolean);
    return list.sort();
  }, [publicPartite]);

  // Società / Club unici per il filtro dell'area pubblica
  const availableSocieta = useMemo(() => {
    const list = Array.from(
      new Set(publicPartite.map(p => p.societa || detectPartitaClub(p)))
    ).filter(Boolean);
    return list.sort();
  }, [publicPartite]);

  // Partite filtrate per l'area pubblica
  const filteredPartite = useMemo(() => {
    const nowMs = Date.now();
    const maxWindowMs =
      filters.timeWindow === '24h'
        ? 24 * 60 * 60 * 1000
        : filters.timeWindow === '48h'
        ? 48 * 60 * 60 * 1000
        : null;

    return publicPartite.filter(p => {
      // Filtro Campionato / Categoria
      if (filters.campionato !== 'ALL' && p.campionato !== filters.campionato) {
        return false;
      }

      // Filtro Società / Club
      if (filters.societa && filters.societa !== 'ALL') {
        const pClub = p.societa || detectPartitaClub(p);
        if (pClub !== filters.societa) {
          return false;
        }
      }

      // Filtro Giorno rapido (Sabato, Domenica o infrasettimanale)
      if (filters.dayOfWeek && filters.dayOfWeek !== 'ALL') {
        const { dayOfWeek } = formatMatchDateAndDay(p.data, p.ora);
        if (dayOfWeek.toUpperCase() !== filters.dayOfWeek.toUpperCase()) {
          return false;
        }
      }

      // Filtro Data predefinita
      if (filters.data !== 'ALL' && p.data !== filters.data) {
        return false;
      }

      // Filtro Intervallo Date
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

      // Filtro Rapido Prossime 24h / 48h rispetto al momento attuale
      if (maxWindowMs !== null) {
        const { start } = parseMatchDateTime(p.data, p.ora);
        const startMs = start.getTime();
        if (isNaN(startMs)) {
          return false;
        }
        const diffMs = startMs - nowMs;
        if (diffMs < 0 || diffMs > maxWindowMs) {
          return false;
        }
      }

      // Filtro Casa / Trasferta
      if (filters.location === 'casa' && !p.isCynthiaCasa) {
        return false;
      }
      if (filters.location === 'trasferta' && !p.isCynthiaOspite) {
        return false;
      }

      // Ricerca testuale predittiva
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const compactQuery = query.replace(/\s+/g, '');
        const matchString = `${p.campionato} ${p.girone} ${p.gara} ${p.squadraCasa} ${p.squadraOspite} ${p.campo} ${p.comune} ${p.indirizzo}`.toLowerCase();
        const compactMatch = matchString.replace(/\s+/g, '');

        if (!matchString.includes(query) && !compactMatch.includes(compactQuery)) {
          const tokens = query.split(/\s+/).filter(Boolean);
          const allTokensMatch = tokens.length > 0 && tokens.every(
            tok => matchString.includes(tok) || compactMatch.includes(tok)
          );
          if (!allTokensMatch) {
            return false;
          }
        }
      }

      return true;
    });
  }, [publicPartite, filters]);

  const handleSaveConfig = (newConfig: SheetConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);
  };

  const handleApplyPartite = (newPartite: Partita[]) => {
    const followed = getFollowedCategories();
    const publicNewPartite = getPublicPartite(newPartite);
    const detectedVariations = checkPartiteVariations(publicNewPartite, followed);
    if (detectedVariations.length > 0) {
      setRecentVariations(prev => [...detectedVariations, ...prev]);
      setBannerVariation(detectedVariations[0]);
    }
    setPartite(newPartite);
    const nowStr = formatLastUpdatedTimestamp();
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
        isSyncing={isSyncing}
        justSynced={justSynced}
        onRefresh={() => refreshData()}
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
        {viewMode !== 'tuttocampo' && (
          <StatsSummary partite={filteredPartite} totalAvailable={publicPartite.length} />
        )}

        {/* Barra Filtri (Selettore Vista Elenco/Impegno Campi, Pillole Rapide Scrollabili Luogo/Giorno/Categoria, Ricerca Predittiva) */}
        <FilterBar
          filters={filters}
          onChangeFilters={setFilters}
          availableCampionati={availableCampionati}
          availableDate={availableDate}
          availableSocieta={availableSocieta}
          allPartite={publicPartite}
          partite={filteredPartite}
          viewMode={viewMode}
          onChangeViewMode={(nextMode) => {
            if (nextMode !== 'timeline') {
              setPreviousViewMode(nextMode);
            }
            runWithViewTransition(() => setViewMode(nextMode));
          }}
          onOpenPdfExport={() => setIsPdfModalOpen(true)}
        />

        {/* Visualizzazione Partite o Widget Classifiche Ufficiali */}
        {viewMode === 'tuttocampo' ? (
          <div className="view-transition-schedule">
            <TuttocampoWidgets />
          </div>
        ) : isLoading ? (
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
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white transition shadow-xs cursor-pointer"
            >
              Mostra Tutte le Gare
            </button>
          </div>
        ) : (
          <div className="view-transition-schedule">
            {viewMode !== 'timeline' && (
              showWeeklySummary ? (
                <div className="no-print">
                  <WeeklySummaryStrip
                    partite={filteredPartite}
                    onOpenTimeline={() => {
                      setPreviousViewMode(viewMode);
                      runWithViewTransition(() => setViewMode('timeline'));
                    }}
                    onClose={() => {
                      setShowWeeklySummary(false);
                      localStorage.setItem('cynthia_show_weekly_summary', 'false');
                    }}
                  />
                </div>
              ) : (
                <div className="flex justify-end mb-3 no-print">
                  <button
                    id="btn-reopen-weekly-summary"
                    type="button"
                    onClick={() => {
                      setShowWeeklySummary(true);
                      localStorage.setItem('cynthia_show_weekly_summary', 'true');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors cursor-pointer"
                  >
                    <GanttChart className="w-3.5 h-3.5" />
                    <span>Mostra timeline settimana</span>
                  </button>
                </div>
              )
            )}

            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPartite.map(partita => (
                  <MatchCard
                    key={partita.id}
                    partita={partita}
                  />
                ))}
              </div>
            ) : viewMode === 'table' ? (
              <MatchTable partite={filteredPartite} />
            ) : viewMode === 'timeline' ? (
              <WeeklyTimeline
                partite={filteredPartite}
                onClose={() =>
                  runWithViewTransition(() =>
                    setViewMode(previousViewMode === 'timeline' ? 'cards' : previousViewMode)
                  )
                }
              />
            ) : viewMode === 'calendar' ? (
              <MatchCalendarView partite={filteredPartite} />
            ) : (
              <MatchMapView partite={filteredPartite} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-6 text-xs text-slate-500 dark:text-slate-400 mt-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="./assets/cynthia_logo.png"
              alt="ASD Cynthia 1920"
              className="h-6 w-auto object-contain opacity-90"
              referrerPolicy="no-referrer"
            />
            <p className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              ASD Cynthia 1920 · Stagione Sportiva 2026/2027
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                runWithViewTransition(() => setViewMode('tuttocampo'));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline transition-colors flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Risultati & Classifiche</span>
            </button>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline transition-colors flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Report PDF</span>
            </button>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <button
              type="button"
              onClick={() => setIsNotificationModalOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline transition-colors flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-500" />
              <span>Avvisi Variazioni</span>
            </button>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline transition-colors flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Aspetto & Tema</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modale Esportazione e Stampa Report PDF Settimanale (Area Pubblica) */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        allPartite={publicPartite}
        filteredPartite={filteredPartite}
        filters={filters}
        hasActiveFilters={
          filters.campionato !== 'ALL' ||
          (Boolean(filters.societa) && filters.societa !== 'ALL') ||
          filters.data !== 'ALL' ||
          (Boolean(filters.dayOfWeek) && filters.dayOfWeek !== 'ALL') ||
          Boolean(filters.startDate) ||
          Boolean(filters.endDate) ||
          filters.location !== 'all' ||
          (Boolean(filters.timeWindow) && filters.timeWindow !== 'all') ||
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
        onOpenConvocazioni={() => setIsConvocazioniModalOpen(true)}
        onOpenPecManager={() => setIsPecModalOpen(true)}
        onOpenImpegnoCampi={() => setIsImpegnoCampiModalOpen(true)}
        sheetUrl={config.sheetUrl}
        totalPartiteCount={partite.length}
        publicPartiteCount={publicPartite.length}
        homeMatchesCount={publicPartite.filter(p => p.isCynthiaCasa).length}
        donBoscoCount={donBoscoPartite.length}
      />

      {/* Modale Impegno Campi — Gare Interne (Segreteria & Custodi, A4 Orizzontale) */}
      <ImpegnoCampiModal
        isOpen={isImpegnoCampiModalOpen}
        onClose={() => setIsImpegnoCampiModalOpen(false)}
        partite={publicPartite}
      />

      {/* Modale Gestione PEC Societaria (Posta Elettronica Certificata) */}
      <PecManagerModal
        isOpen={isPecModalOpen}
        onClose={() => setIsPecModalOpen(false)}
      />

      {/* Modale Convocazioni Gara & Messaggio WhatsApp */}
      <ConvocazioniModal
        isOpen={isConvocazioniModalOpen}
        onClose={() => setIsConvocazioniModalOpen(false)}
        partite={partite}
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
