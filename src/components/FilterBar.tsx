import React, { useState, useEffect } from 'react';
import { FilterState, ViewMode, LocationFilter } from '../types';
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
} from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onChangeFilters: (filters: FilterState) => void;
  availableCampionati: string[];
  availableDate: string[];
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onOpenPdfExport: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChangeFilters,
  availableCampionati,
  availableDate,
  viewMode,
  onChangeViewMode,
  onOpenPdfExport,
}) => {
  const [showDatePicker, setShowDatePicker] = useState<boolean>(
    Boolean(filters.startDate || filters.endDate)
  );

  // Calcola il numero di filtri attivi
  let activeFilterCount = 0;
  if (filters.campionato !== 'ALL') activeFilterCount++;
  if (filters.data !== 'ALL') activeFilterCount++;
  if (filters.startDate || filters.endDate) activeFilterCount++;
  if (filters.location !== 'all') activeFilterCount++;
  if (filters.search.trim() !== '') activeFilterCount++;

  const hasActiveFilters = activeFilterCount > 0;

  // Stato espansione filtri: apri di default se ci sono filtri attivi (es. da url o preferenza salvata)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('cynthia_filters_expanded');
    if (saved !== null) {
      return saved === 'true' || hasActiveFilters;
    }
    return hasActiveFilters; // di base collassato a meno che non ci siano già filtri
  });

  // Salva preferenza utente
  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const next = !prev;
      localStorage.setItem('cynthia_filters_expanded', next.toString());
      return next;
    });
  };

  // Se i filtri diventano attivi dall'esterno (es. scorciatoia PWA), espandi automaticamente
  useEffect(() => {
    if (hasActiveFilters && !isExpanded) {
      setIsExpanded(true);
    }
  }, [hasActiveFilters]);

  const handleReset = () => {
    onChangeFilters({
      campionato: 'ALL',
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs mb-5 overflow-hidden transition-all duration-200">
      {/* Barra Superiore: Toggle Espansione Filtri + Azioni Rapide (PDF, Schede/Tabella) */}
      <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800">
        {/* Bottone Toggle Espandi/Comprimi Filtri */}
        <button
          id="btn-toggle-filters-expand"
          type="button"
          onClick={toggleExpanded}
          className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-bold transition select-none cursor-pointer border ${
            isExpanded
              ? 'bg-sky-700 text-white border-sky-800 shadow-xs ring-2 ring-sky-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-sky-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
          }`}
          aria-expanded={isExpanded}
          title={isExpanded ? 'Clicca per comprimere la sezione filtri' : 'Clicca per espandere i filtri di ricerca'}
        >
          <SlidersHorizontal className={`w-4 h-4 ${isExpanded ? 'text-white' : 'text-sky-600 dark:text-sky-400'}`} />
          <span className="tracking-tight">Filtri e Ricerca</span>

          {/* Badge conteggio filtri attivi */}
          {hasActiveFilters && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-black tracking-wider ${
                isExpanded
                  ? 'bg-white text-sky-800'
                  : 'bg-sky-600 text-white dark:bg-sky-500'
              }`}
            >
              {activeFilterCount}
            </span>
          )}

          {isExpanded ? (
            <ChevronUp className="w-4 h-4 opacity-80" />
          ) : (
            <ChevronDown className="w-4 h-4 opacity-80" />
          )}
        </button>

        {/* Indicazione stato rapido quando collassato con filtri attivi */}
        {!isExpanded && hasActiveFilters && (
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Filtri applicati:</span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Azzera</span>
            </button>
          </div>
        )}

        {/* Azioni Rapide Sempre Visibili: Report PDF & Switch Vista */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Pulsante Esporta / Report PDF */}
          <button
            id="btn-filterbar-export-pdf"
            type="button"
            onClick={onOpenPdfExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-sky-700 hover:bg-sky-800 active:scale-[0.98] text-white shadow-2xs transition"
            title="Genera e scarica il report PDF settimanale per stampa o WhatsApp"
          >
            <FileDown className="w-3.5 h-3.5 text-sky-200" />
            <span className="hidden sm:inline">Report PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>

          {/* Switch Vista Schede / Tabella */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              id="btn-view-cards"
              type="button"
              onClick={() => onChangeViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-200 shadow-xs border border-slate-200/60 dark:border-slate-600 font-bold'
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
              onClick={() => onChangeViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-200 shadow-xs border border-slate-200/60 dark:border-slate-600 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Visualizza come tabella dettagliata"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabella</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sezione Filtri Espandibile */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 animate-in fade-in duration-200 bg-white dark:bg-slate-900">
          {/* Griglia Selettori Filtri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Filtro Campionato / Categoria */}
            <div>
              <label
                htmlFor="filter-campionato-select"
                className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Campionato / Categoria
              </label>
              <select
                id="filter-campionato-select"
                value={filters.campionato}
                onChange={e => onChangeFilters({ ...filters, campionato: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm font-semibold text-slate-900 dark:text-slate-100 transition outline-none"
              >
                <option value="ALL">Tutte le Categorie ({availableCampionati.length})</option>
                {availableCampionati.map(camp => (
                  <option key={camp} value={camp}>
                    {camp}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Data (Scelta rapida o Range Personalizzato) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="filter-data-select"
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Data / Periodo
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
                  className="text-[11px] font-bold text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <CalendarDays className="w-3 h-3" />
                  <span>{showDatePicker ? 'Scelta Rapida' : 'Intervallo Date'}</span>
                </button>
              </div>

              {!showDatePicker ? (
                <select
                  id="filter-data-select"
                  value={filters.data}
                  onChange={e => handleSelectPredefinedDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm font-semibold text-slate-900 dark:text-slate-100 transition outline-none"
                >
                  <option value="ALL">Tutte le date</option>
                  {availableDate.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                /* Selettore Intervallo di Date */
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-sky-400 dark:border-sky-600 rounded-xl p-1.5 shadow-2xs">
                  <input
                    id="filter-start-date"
                    type="date"
                    value={filters.startDate || ''}
                    onChange={e => handleStartDateChange(e.target.value)}
                    title="Data inizio intervallo"
                    className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
                  />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <input
                    id="filter-end-date"
                    type="date"
                    value={filters.endDate || ''}
                    onChange={e => handleEndDateChange(e.target.value)}
                    title="Data fine intervallo"
                    className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
                  />
                  {(filters.startDate || filters.endDate) && (
                    <button
                      type="button"
                      onClick={() => onChangeFilters({ ...filters, startDate: '', endDate: '' })}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Azzera date"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Filtro Casa / Trasferta */}
            <div>
              <label
                htmlFor="filter-location-select"
                className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Campo / Luogo
              </label>
              <select
                id="filter-location-select"
                value={filters.location}
                onChange={e => onChangeFilters({ ...filters, location: e.target.value as LocationFilter })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm font-semibold text-slate-900 dark:text-slate-100 transition outline-none"
              >
                <option value="all">Tutte le partite</option>
                <option value="casa">Solo in Casa 🏠</option>
                <option value="trasferta">Solo in Trasferta 🚌</option>
              </select>
            </div>

            {/* Ricerca Testuale */}
            <div>
              <label
                htmlFor="filter-search-input"
                className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Cerca Partita o Campo
              </label>
              <div className="relative">
                <input
                  id="filter-search-input"
                  type="text"
                  value={filters.search}
                  onChange={e => onChangeFilters({ ...filters, search: e.target.value })}
                  placeholder="Es. Under 16, Ostia, Genzano..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl pl-9 pr-8 py-3 sm:py-2.5 text-base sm:text-sm font-medium text-slate-900 dark:text-slate-100 transition outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3" />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => onChangeFilters({ ...filters, search: '' })}
                    className="absolute right-2.5 top-3 sm:top-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Riepilogo Filtri Attivi & Reset all'interno del pannello */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              {hasActiveFilters && (
                <button
                  id="btn-reset-filters"
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Azzera Tutti i Filtri
                </button>
              )}
              {filters.campionato !== 'ALL' && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border border-sky-200/60 dark:border-sky-800 font-medium">
                  Cat: {filters.campionato}
                  <button type="button" onClick={() => onChangeFilters({ ...filters, campionato: 'ALL' })} className="hover:text-rose-600 ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.data !== 'ALL' && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border border-sky-200/60 dark:border-sky-800 font-medium">
                  Data: {filters.data}
                  <button type="button" onClick={() => onChangeFilters({ ...filters, data: 'ALL' })} className="hover:text-rose-600 ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(filters.startDate || filters.endDate) && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border border-sky-200/60 dark:border-sky-800 font-medium">
                  Periodo: {filters.startDate || 'inizio'} ➔ {filters.endDate || 'fine'}
                  <button type="button" onClick={() => onChangeFilters({ ...filters, startDate: '', endDate: '' })} className="hover:text-rose-600 ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.location !== 'all' && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border border-sky-200/60 dark:border-sky-800 font-medium">
                  Luogo: {filters.location === 'casa' ? 'Solo in Casa' : 'Solo in Trasferta'}
                  <button type="button" onClick={() => onChangeFilters({ ...filters, location: 'all' })} className="hover:text-rose-600 ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={toggleExpanded}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 ml-auto"
            >
              <span>Comprimi filtri</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
