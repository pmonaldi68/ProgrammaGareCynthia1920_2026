import React, { useState, useEffect, useMemo } from 'react';
import { FilterState, ViewMode, LocationFilter, TimeWindowFilter, Partita } from '../types';
import { PredictiveSearchBar } from './PredictiveSearchBar';
import { detectPartitaClub } from '../utils/donBoscoUtils';
import { formatMatchDateAndDay } from '../utils/dateFormatter';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  LayoutGrid,
  Table,
  X,
  CalendarDays,
  ArrowRight,
  FileDown,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RotateCcw,
  Shield,
  GanttChart,
  Clock,
  Building2,
  Printer,
} from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onChangeFilters: (filters: FilterState) => void;
  availableCampionati: string[];
  availableDate: string[];
  availableSocieta?: string[];
  allPartite?: Partita[];
  partite?: Partita[];
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onOpenPdfExport: () => void;
}

const WEEKDAY_ORDER = [
  'SABATO',
  'DOMENICA',
  'LUNEDÌ',
  'MARTEDÌ',
  'MERCOLEDÌ',
  'GIOVEDÌ',
  'VENERDÌ',
];

const formatDayLabel = (dayUpper: string): string => {
  if (!dayUpper) return '';
  return dayUpper.charAt(0) + dayUpper.slice(1).toLowerCase();
};

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChangeFilters,
  availableCampionati,
  availableDate,
  availableSocieta,
  allPartite,
  partite = [],
  viewMode,
  onChangeViewMode,
  onOpenPdfExport,
}) => {
  const [showDatePicker, setShowDatePicker] = useState<boolean>(
    Boolean(filters.startDate || filters.endDate)
  );

  const sourcePartite = allPartite && allPartite.length > 0 ? allPartite : partite;

  const societaList = useMemo(() => {
    if (availableSocieta && availableSocieta.length > 0) return availableSocieta;
    const set = new Set<string>();
    sourcePartite.forEach(p => {
      const s = p.societa || detectPartitaClub(p);
      if (s) set.add(s);
    });
    if (set.size === 0) {
      set.add('CYNTHIA 1920');
      set.add('ACADEMY CYNTHIA GENZANO');
      set.add('ALBACYNTHIA');
    }
    return Array.from(set).sort();
  }, [availableSocieta, sourcePartite]);

  // Giorni della settimana disponibili (Sabato e Domenica sempre presenti + eventuali infrasettimanali dal dataset)
  const availableDaysOfWeek = useMemo(() => {
    const found = new Set<string>(['SABATO', 'DOMENICA']);
    sourcePartite.forEach(p => {
      const { dayOfWeek } = formatMatchDateAndDay(p.data, p.ora);
      if (dayOfWeek) found.add(dayOfWeek.toUpperCase());
    });
    return Array.from(found).sort((a, b) => {
      const idxA = WEEKDAY_ORDER.indexOf(a);
      const idxB = WEEKDAY_ORDER.indexOf(b);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  }, [sourcePartite]);

  const activeDayOfWeek = filters.dayOfWeek || 'ALL';
  const activeTimeWindow: TimeWindowFilter = filters.timeWindow || 'all';

  let drawerFilterCount = 0;
  if (filters.societa && filters.societa !== 'ALL') drawerFilterCount++;
  if (filters.data !== 'ALL') drawerFilterCount++;
  if (filters.startDate || filters.endDate) drawerFilterCount++;
  if (filters.search.trim() !== '') drawerFilterCount++;

  let quickFilterCount = 0;
  if (filters.campionato !== 'ALL') quickFilterCount++;
  if (filters.location !== 'all') quickFilterCount++;
  if (activeDayOfWeek !== 'ALL') quickFilterCount++;
  if (activeTimeWindow !== 'all') quickFilterCount++;

  const activeFilterCount = drawerFilterCount + quickFilterCount;
  const hasDrawerFilters = drawerFilterCount > 0;
  const hasActiveFilters = activeFilterCount > 0;

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('cynthia_filters_expanded');
    if (saved !== null) {
      return saved === 'true' || hasDrawerFilters;
    }
    return hasDrawerFilters;
  });

  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const next = !prev;
      localStorage.setItem('cynthia_filters_expanded', next.toString());
      return next;
    });
  };

  useEffect(() => {
    if (hasDrawerFilters && !isExpanded) {
      setIsExpanded(true);
    }
  }, [hasDrawerFilters, isExpanded]);

  const handleReset = () => {
    onChangeFilters({
      campionato: 'ALL',
      societa: 'ALL',
      data: 'ALL',
      dayOfWeek: 'ALL',
      startDate: '',
      endDate: '',
      location: 'all',
      timeWindow: 'all',
      search: '',
    });
    setShowDatePicker(false);
  };

  const handleTimeWindowChange = (nextWindow: TimeWindowFilter) => {
    const resolved = activeTimeWindow === nextWindow && nextWindow !== 'all' ? 'all' : nextWindow;
    onChangeFilters({
      ...filters,
      timeWindow: resolved,
    });
  };

  const handleSelectPredefinedDate = (dateVal: string) => {
    onChangeFilters({
      ...filters,
      data: dateVal,
      startDate: '',
      endDate: '',
    });
  };

  const handleStartDateChange = (val: string) => {
    onChangeFilters({
      ...filters,
      startDate: val,
      data: 'ALL',
    });
  };

  const handleEndDateChange = (val: string) => {
    onChangeFilters({
      ...filters,
      endDate: val,
      data: 'ALL',
    });
  };

  return (
    <div
      id="filter-bar"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 mb-6 transition-colors relative z-30 shadow-2xs"
    >
      {/* Top Toolbar: View Switcher (Vista Elenco / Impegno Campi / Tabella / Timeline / Calendario / Mappa) + Stampa/PDF + Filtri avanzati */}
      <div className="p-3 sm:px-4 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented View Switcher: Primo Piano su Vista Elenco e Impegno Campi */}
          <div
            role="tablist"
            aria-label="Modalità di visualizzazione programma"
            className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto max-w-full no-scrollbar"
          >
            <button
              id="btn-view-cards"
              type="button"
              role="tab"
              aria-selected={viewMode === 'cards'}
              onClick={() => onChangeViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'cards'
                  ? 'bg-sky-700 text-white shadow-2xs border border-amber-400/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Vista Elenco predefinita a schede"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Vista Elenco</span>
            </button>

            <button
              id="btn-view-fields"
              type="button"
              role="tab"
              aria-selected={viewMode === 'fields'}
              onClick={() => onChangeViewMode('fields')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'fields'
                  ? 'bg-sky-700 text-white shadow-2xs border border-amber-400/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Vista Impegno Campi per Segreteria e Custodi (solo gare in casa per impianto)"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Impegno Campi</span>
            </button>

            <button
              id="btn-view-table"
              type="button"
              role="tab"
              aria-selected={viewMode === 'table'}
              onClick={() => onChangeViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Visualizza come tabella dettagliata"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tabella</span>
            </button>

            <button
              id="btn-view-timeline"
              type="button"
              role="tab"
              aria-selected={viewMode === 'timeline'}
              onClick={() => onChangeViewMode('timeline')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Visualizza timeline orizzontale della settimana"
            >
              <GanttChart className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Timeline</span>
            </button>

            <button
              id="btn-view-calendar"
              type="button"
              role="tab"
              aria-selected={viewMode === 'calendar'}
              onClick={() => onChangeViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Visualizza graficamente sul calendario"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Calendario</span>
            </button>

            <button
              id="btn-view-map"
              type="button"
              role="tab"
              aria-selected={viewMode === 'map'}
              onClick={() => onChangeViewMode('map')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Visualizza campi su mappa interattiva"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Mappa</span>
            </button>
          </div>
        </div>

        {/* Destra: Stampa A4 diretta, Report PDF, Ricerca / Filtri avanzati */}
        <div className="flex items-center gap-2 ml-auto flex-wrap sm:flex-nowrap">
          <button
            id="btn-filterbar-print-a4"
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:border-sky-300 text-slate-700 dark:text-slate-200 transition cursor-pointer min-h-[40px] whitespace-nowrap shrink-0"
            title="Stampa rapida o salva pagina in PDF formato A4"
          >
            <Printer className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400 shrink-0" />
            <span className="hidden sm:inline">Stampa / PDF</span>
            <span className="sm:hidden">Stampa</span>
          </button>

          <button
            id="btn-filterbar-export-pdf"
            type="button"
            onClick={onOpenPdfExport}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition duration-150 cursor-pointer min-h-[40px] whitespace-nowrap shrink-0 ${
              hasActiveFilters
                ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white'
                : 'bg-sky-700 hover:bg-sky-600 active:scale-[0.98] text-white'
            }`}
            title={
              hasActiveFilters
                ? `Esporta in PDF il programma gare filtrato (${partite.length} partite)`
                : 'Genera e scarica il report PDF societario'
            }
          >
            <FileDown className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline tabular-nums">
              {hasActiveFilters ? `Report PDF (${partite.length})` : 'Report PDF'}
            </span>
            <span className="sm:hidden tabular-nums">
              {hasActiveFilters ? `PDF (${partite.length})` : 'PDF'}
            </span>
          </button>

          <button
            id="btn-toggle-filters-expand"
            type="button"
            onClick={toggleExpanded}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition duration-150 select-none cursor-pointer border min-h-[40px] whitespace-nowrap shrink-0 ${
              isExpanded
                ? 'bg-slate-900 dark:bg-sky-600 text-white border-slate-900 dark:border-sky-500'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700'
            }`}
            aria-expanded={isExpanded}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Cerca & Avanzati</span>
            <span className="sm:hidden">Cerca</span>
            {hasActiveFilters && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${
                  isExpanded ? 'bg-white/20 text-white' : 'bg-sky-600 text-white'
                }`}
              >
                {activeFilterCount}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 opacity-75" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 opacity-75" />
            )}
          </button>
        </div>
      </div>

      {/* BARRA FILTRI RAPIDI SCROLLABILE ORIZZONTALMENTE SU MOBILE (Luogo, Giorno, Prossime 24h/48h, Categoria) */}
      <div className="px-3 sm:px-4 pb-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
        {/* Riga 1: Luogo + Giorno + Finestra 24h/48h + Azzera */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-0.5">
          {/* Pillole Luogo */}
          <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Filtra per luogo">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
              Luogo:
            </span>
            {(
              [
                { val: 'all', label: 'Tutte' },
                { val: 'casa', label: 'Casa' },
                { val: 'trasferta', label: 'Trasferta' },
              ] as Array<{ val: LocationFilter; label: string }>
            ).map(opt => {
              const active = filters.location === opt.val;
              return (
                <button
                  key={opt.val}
                  id={`pill-location-${opt.val}`}
                  type="button"
                  onClick={() =>
                    onChangeFilters({
                      ...filters,
                      location: active && opt.val !== 'all' ? 'all' : opt.val,
                    })
                  }
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                    active
                      ? opt.val === 'casa'
                        ? 'bg-sky-700 text-white border-amber-400 shadow-2xs'
                        : 'bg-slate-900 dark:bg-sky-600 text-white border-slate-900 dark:border-sky-500 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" aria-hidden="true" />

          {/* Pillole Giorno (Tutti | Sabato | Domenica + eventuali infrasettimanali) */}
          <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Filtra per giorno">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
              Giorno:
            </span>
            <button
              id="pill-day-all"
              type="button"
              onClick={() => onChangeFilters({ ...filters, dayOfWeek: 'ALL' })}
              aria-pressed={activeDayOfWeek === 'ALL'}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                activeDayOfWeek === 'ALL'
                  ? 'bg-slate-900 dark:bg-sky-600 text-white border-slate-900 dark:border-sky-500 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700'
              }`}
            >
              Tutti
            </button>
            {availableDaysOfWeek.map(dayUpper => {
              const isSelected = activeDayOfWeek === dayUpper;
              return (
                <button
                  key={dayUpper}
                  id={`pill-day-${dayUpper.toLowerCase()}`}
                  type="button"
                  onClick={() =>
                    onChangeFilters({
                      ...filters,
                      dayOfWeek: isSelected ? 'ALL' : dayUpper,
                    })
                  }
                  aria-pressed={isSelected}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                    isSelected
                      ? 'bg-sky-700 text-white border-amber-400 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {formatDayLabel(dayUpper)}
                </button>
              );
            })}
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" aria-hidden="true" />

          {/* Filtro Rapido Prossime 24h / 48h */}
          <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Filtro prossime ore">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
              <Clock className="w-3 h-3 text-sky-600 dark:text-sky-400" />
              <span>Ore:</span>
            </span>
            <button
              id="btn-quick-filter-24h"
              type="button"
              onClick={() => handleTimeWindowChange('24h')}
              aria-pressed={activeTimeWindow === '24h'}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap border tabular-nums ${
                activeTimeWindow === '24h'
                  ? 'bg-sky-700 text-white border-amber-400 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700'
              }`}
              title="Solo gare nelle prossime 24 ore"
            >
              24h
            </button>
            <button
              id="btn-quick-filter-48h"
              type="button"
              onClick={() => handleTimeWindowChange('48h')}
              aria-pressed={activeTimeWindow === '48h'}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap border tabular-nums ${
                activeTimeWindow === '48h'
                  ? 'bg-sky-700 text-white border-amber-400 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700'
              }`}
              title="Solo gare nelle prossime 48 ore"
            >
              48h
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Ripristina tutti i filtri"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Azzera</span>
            </button>
          )}
        </div>

        {/* Riga 2: Selettore rapido dinamico Categoria (Scrollabile orizzontalmente su mobile) */}
        {availableCampionati.length > 0 && (
          <div
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
            role="group"
            aria-label="Selettore rapido categoria"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 shrink-0">
              Categoria:
            </span>
            <button
              id="pill-category-all"
              type="button"
              onClick={() => onChangeFilters({ ...filters, campionato: 'ALL' })}
              aria-pressed={filters.campionato === 'ALL'}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 border ${
                filters.campionato === 'ALL'
                  ? 'bg-sky-700 text-white border-amber-400 shadow-2xs'
                  : 'bg-sky-50/70 dark:bg-slate-800 text-sky-900 dark:text-slate-200 border-sky-200/80 dark:border-slate-700 hover:bg-sky-100 dark:hover:bg-slate-700'
              }`}
            >
              Tutte
            </button>
            {availableCampionati.map(camp => {
              const isSelected = filters.campionato === camp;
              return (
                <button
                  key={camp}
                  type="button"
                  onClick={() =>
                    onChangeFilters({
                      ...filters,
                      campionato: isSelected ? 'ALL' : camp,
                    })
                  }
                  aria-pressed={isSelected}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 border ${
                    isSelected
                      ? 'bg-sky-700 text-white border-amber-400 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {camp}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Expandable Filter Panel (Società, Date singole/intervallo, Ricerca predittiva) */}
      {isExpanded && (
        <div className="modern-popover-enter p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Club */}
            <div>
              <label
                htmlFor="filter-societa-select"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Società / Club</span>
              </label>
              <select
                id="filter-societa-select"
                value={filters.societa || 'ALL'}
                onChange={e => onChangeFilters({ ...filters, societa: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 transition-colors"
              >
                <option value="ALL">Tutte le società ({societaList.length})</option>
                {societaList.map(soc => (
                  <option key={soc} value={soc}>
                    {soc}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Select */}
            <div>
              <label
                htmlFor="filter-campionato-select"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5"
              >
                <Filter className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Campionato / Categoria</span>
              </label>
              <select
                id="filter-campionato-select"
                value={filters.campionato}
                onChange={e => onChangeFilters({ ...filters, campionato: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 transition-colors"
              >
                <option value="ALL">Tutte le categorie ({availableCampionati.length})</option>
                {availableCampionati.map(camp => (
                  <option key={camp} value={camp}>
                    {camp}
                  </option>
                ))}
              </select>
            </div>

            {/* Date / Date Range */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="filter-data-select"
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Data / Periodo</span>
                </label>
                <button
                  type="button"
                  id="btn-toggle-custom-date-picker"
                  onClick={() => {
                    const next = !showDatePicker;
                    setShowDatePicker(next);
                    if (!next) {
                      onChangeFilters({ ...filters, startDate: '', endDate: '' });
                    }
                  }}
                  className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CalendarDays className="w-3 h-3" />
                  <span>{showDatePicker ? 'Data singola' : 'Intervallo'}</span>
                </button>
              </div>

              {!showDatePicker ? (
                <select
                  id="filter-data-select"
                  value={filters.data}
                  onChange={e => handleSelectPredefinedDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 transition-colors"
                >
                  <option value="ALL">Tutte le date</option>
                  {availableDate.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-sky-500/70 rounded-xl p-1.5 min-h-[42px]">
                  <input
                    id="filter-start-date"
                    type="date"
                    value={filters.startDate || ''}
                    onChange={e => handleStartDateChange(e.target.value)}
                    title="Data inizio intervallo"
                    className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-slate-100 outline-none cursor-pointer tabular-nums"
                  />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    id="filter-end-date"
                    type="date"
                    value={filters.endDate || ''}
                    onChange={e => handleEndDateChange(e.target.value)}
                    title="Data fine intervallo"
                    className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-slate-100 outline-none cursor-pointer tabular-nums"
                  />
                  {(filters.startDate || filters.endDate) && (
                    <button
                      type="button"
                      onClick={() => onChangeFilters({ ...filters, startDate: '', endDate: '' })}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Azzera date"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Predictive Search */}
            <div className="relative">
              <label
                htmlFor="filter-search-input"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5"
              >
                <Search className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Cerca squadra o impianto</span>
              </label>
              <PredictiveSearchBar
                filters={filters}
                onChangeFilters={onChangeFilters}
                partite={partite}
                availableCampionati={availableCampionati}
                placeholder="Es. Under 17, Abbatini, Cynthia..."
              />
            </div>
          </div>

          {/* Active Filters Summary & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              {hasActiveFilters && (
                <>
                  <button
                    id="btn-export-filtered-pdf-quick"
                    type="button"
                    onClick={onOpenPdfExport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer tabular-nums"
                    title="Scarica o stampa direttamente il PDF con solo le gare attualmente filtrate"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                    <span>Esporta PDF Filtrato ({partite.length})</span>
                  </button>
                  <button
                    id="btn-reset-filters"
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Azzera filtri</span>
                  </button>
                </>
              )}
              {filters.search && (
                <button
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, search: '' })}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium cursor-pointer"
                  title="Rimuovi ricerca"
                >
                  <span>Cerca: "{filters.search}"</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {filters.societa && filters.societa !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, societa: 'ALL' })}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium cursor-pointer"
                >
                  <span>Club: {filters.societa}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {filters.campionato !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, campionato: 'ALL' })}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium cursor-pointer"
                >
                  <span>Categoria: {filters.campionato}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {activeDayOfWeek !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, dayOfWeek: 'ALL' })}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium cursor-pointer"
                >
                  <span>Giorno: {formatDayLabel(activeDayOfWeek)}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {filters.data !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, data: 'ALL' })}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium cursor-pointer"
                >
                  <span>Data: {filters.data}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {(filters.startDate || filters.endDate) && (
                <button
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, startDate: '', endDate: '' })}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium cursor-pointer"
                >
                  <span>Periodo: {filters.startDate || 'inizio'} → {filters.endDate || 'fine'}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {filters.location !== 'all' && (
                <button
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, location: 'all' })}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium cursor-pointer"
                >
                  <span>Luogo: {filters.location === 'casa' ? 'In casa' : 'Trasferta'}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {activeTimeWindow !== 'all' && (
                <button
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, timeWindow: 'all' })}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 hover:bg-sky-200 dark:hover:bg-sky-800 font-semibold cursor-pointer tabular-nums"
                >
                  <span>Finestra: Prossime {activeTimeWindow === '24h' ? '24 ore' : '48 ore'}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={toggleExpanded}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 ml-auto cursor-pointer"
            >
              <span>Comprimi</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
