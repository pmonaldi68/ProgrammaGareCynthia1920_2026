import React, { useState, useEffect, useMemo } from 'react';
import { FilterState, ViewMode, LocationFilter, Partita } from '../types';
import { PredictiveSearchBar } from './PredictiveSearchBar';
import { detectPartitaClub } from '../utils/donBoscoUtils';
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
} from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onChangeFilters: (filters: FilterState) => void;
  availableCampionati: string[];
  availableDate: string[];
  availableSocieta?: string[];
  partite?: Partita[];
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onOpenPdfExport: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChangeFilters,
  availableCampionati,
  availableDate,
  availableSocieta,
  partite = [],
  viewMode,
  onChangeViewMode,
  onOpenPdfExport,
}) => {
  const [showDatePicker, setShowDatePicker] = useState<boolean>(
    Boolean(filters.startDate || filters.endDate)
  );

  const societaList = useMemo(() => {
    if (availableSocieta && availableSocieta.length > 0) return availableSocieta;
    const set = new Set<string>();
    partite.forEach(p => {
      const s = p.societa || detectPartitaClub(p);
      if (s) set.add(s);
    });
    if (set.size === 0) {
      set.add('CYNTHIA 1920');
      set.add('ACADEMY CYNTHIA GENZANO');
      set.add('ALBACYNTHIA');
    }
    return Array.from(set).sort();
  }, [availableSocieta, partite]);

  let activeFilterCount = 0;
  if (filters.campionato !== 'ALL') activeFilterCount++;
  if (filters.societa && filters.societa !== 'ALL') activeFilterCount++;
  if (filters.data !== 'ALL') activeFilterCount++;
  if (filters.startDate || filters.endDate) activeFilterCount++;
  if (filters.location !== 'all') activeFilterCount++;
  if (filters.search.trim() !== '') activeFilterCount++;

  const hasActiveFilters = activeFilterCount > 0;

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('cynthia_filters_expanded');
    if (saved !== null) {
      return saved === 'true' || hasActiveFilters;
    }
    return hasActiveFilters;
  });

  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const next = !prev;
      localStorage.setItem('cynthia_filters_expanded', next.toString());
      return next;
    });
  };

  useEffect(() => {
    if (hasActiveFilters && !isExpanded) {
      setIsExpanded(true);
    }
  }, [hasActiveFilters]);

  const handleReset = () => {
    onChangeFilters({
      campionato: 'ALL',
      societa: 'ALL',
      data: 'ALL',
      startDate: '',
      endDate: '',
      location: 'all',
      search: '',
    });
    setShowDatePicker(false);
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
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 mb-6 transition-colors relative z-30"
    >
      {/* Top Toolbar: Expandable Filter Toggle, Filtered PDF Export, Segmented View Mode */}
      <div className="p-3 sm:px-4 sm:py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-toggle-filters-expand"
            type="button"
            onClick={toggleExpanded}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition duration-150 select-none cursor-pointer border min-h-[40px] whitespace-nowrap shrink-0 ${
              isExpanded
                ? 'bg-slate-900 dark:bg-sky-600 text-white border-slate-900 dark:border-sky-500'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700'
            }`}
            aria-expanded={isExpanded}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span>Filtri e ricerca</span>
            {hasActiveFilters && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums ${
                  isExpanded
                    ? 'bg-white/20 text-white'
                    : 'bg-sky-600 text-white'
                }`}
              >
                {activeFilterCount}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 opacity-75" />
            ) : (
              <ChevronDown className="w-4 h-4 opacity-75" />
            )}
          </button>

          {!isExpanded && hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Azzera filtri</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap sm:flex-nowrap">
          <button
            id="btn-filterbar-export-pdf"
            type="button"
            onClick={onOpenPdfExport}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition duration-150 cursor-pointer min-h-[40px] whitespace-nowrap shrink-0 ${
              hasActiveFilters
                ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white'
                : 'bg-sky-700 hover:bg-sky-600 active:scale-[0.98] text-white'
            }`}
            title={
              hasActiveFilters
                ? `Esporta in PDF il programma gare filtrato (${partite.length} partite)`
                : 'Genera e scarica il report PDF per stampa A4 o condivisione'
            }
          >
            <FileDown className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline tabular-nums">
              {hasActiveFilters ? `Esporta PDF (${partite.length})` : 'Report PDF'}
            </span>
            <span className="sm:hidden tabular-nums">
              {hasActiveFilters ? `PDF (${partite.length})` : 'PDF'}
            </span>
          </button>

          {/* Segmented View Switcher */}
          <div
            role="tablist"
            aria-label="Modalità di visualizzazione programma"
            className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80"
          >
            <button
              id="btn-view-cards"
              type="button"
              role="tab"
              aria-selected={viewMode === 'cards'}
              onClick={() => onChangeViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition duration-150 cursor-pointer whitespace-nowrap ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Visualizza come schede"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Schede</span>
            </button>
            <button
              id="btn-view-table"
              type="button"
              role="tab"
              aria-selected={viewMode === 'table'}
              onClick={() => onChangeViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition duration-150 cursor-pointer whitespace-nowrap ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Visualizza come tabella dettagliata"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabella</span>
            </button>
            <button
              id="btn-view-calendar"
              type="button"
              role="tab"
              aria-selected={viewMode === 'calendar'}
              onClick={() => onChangeViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition duration-150 cursor-pointer whitespace-nowrap ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Visualizza graficamente sul calendario"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendario</span>
            </button>
            <button
              id="btn-view-map"
              type="button"
              role="tab"
              aria-selected={viewMode === 'map'}
              onClick={() => onChangeViewMode('map')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition duration-150 cursor-pointer whitespace-nowrap ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Visualizza campi su mappa interattiva"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mappa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {isExpanded && (
        <div className="modern-popover-enter p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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

            {/* Category */}
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

            {/* Home / Away */}
            <div>
              <label
                htmlFor="filter-location-select"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Campo / Luogo</span>
              </label>
              <select
                id="filter-location-select"
                value={filters.location}
                onChange={e => onChangeFilters({ ...filters, location: e.target.value as LocationFilter })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 transition-colors"
              >
                <option value="all">Tutte le partite</option>
                <option value="casa">Solo in casa</option>
                <option value="trasferta">Solo in trasferta</option>
              </select>
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
                placeholder="Es. Under 17, Ostia, Cynthia..."
              />
            </div>
          </div>

          {/* Interactive Category Filter Buttons */}
          {availableCampionati.length > 0 && (
            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
                Categorie rapide:
              </span>
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, campionato: 'ALL' })}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border cursor-pointer whitespace-nowrap ${
                  filters.campionato === 'ALL'
                    ? 'bg-slate-900 dark:bg-sky-600 text-white border-slate-900 dark:border-sky-500'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                Tutte ({availableCampionati.length})
              </button>
              {availableCampionati.slice(0, 6).map(camp => {
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-sky-600 text-white border-slate-900 dark:border-sky-500'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    {camp}
                  </button>
                );
              })}
            </div>
          )}

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
                  title="Rimuovi filtro club"
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
