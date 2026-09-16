import React from 'react';
import { FilterState, ViewMode, LocationFilter } from '../types';
import { Search, Filter, Calendar, MapPin, LayoutGrid, Table, X } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onChangeFilters: (filters: FilterState) => void;
  availableCampionati: string[];
  availableDate: string[];
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChangeFilters,
  availableCampionati,
  availableDate,
  viewMode,
  onChangeViewMode,
}) => {
  const hasActiveFilters =
    filters.campionato !== 'ALL' ||
    filters.data !== 'ALL' ||
    filters.location !== 'all' ||
    filters.search.trim() !== '';

  const handleReset = () => {
    onChangeFilters({
      campionato: 'ALL',
      data: 'ALL',
      location: 'all',
      search: '',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 mb-5 space-y-4">
      {/* Prima riga: Selettori Principali */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Filtro Campionato / Categoria */}
        <div>
          <label
            htmlFor="filter-campionato-select"
            className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            Campionato / Categoria
          </label>
          <select
            id="filter-campionato-select"
            value={filters.campionato}
            onChange={e => onChangeFilters({ ...filters, campionato: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm font-semibold text-slate-900 transition outline-none"
          >
            <option value="ALL">Tutte le Categorie ({availableCampionati.length})</option>
            {availableCampionati.map(camp => (
              <option key={camp} value={camp}>
                {camp}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Data */}
        <div>
          <label
            htmlFor="filter-data-select"
            className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            Data Gara
          </label>
          <select
            id="filter-data-select"
            value={filters.data}
            onChange={e => onChangeFilters({ ...filters, data: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm font-semibold text-slate-900 transition outline-none"
          >
            <option value="ALL">Tutte le date</option>
            {availableDate.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Luogo (Casa / Trasferta) */}
        <div>
          <label
            htmlFor="filter-location-select"
            className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            Casa / Trasferta
          </label>
          <select
            id="filter-location-select"
            value={filters.location}
            onChange={e => onChangeFilters({ ...filters, location: e.target.value as LocationFilter })}
            className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm font-semibold text-slate-900 transition outline-none"
          >
            <option value="all">Tutte le partite</option>
            <option value="casa">Solo in Casa 🏠</option>
            <option value="trasferta">Solo in Trasferta 🚌</option>
          </select>
        </div>

        {/* Ricerca Testuale Rapida */}
        <div>
          <label
            htmlFor="filter-search-input"
            className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5 text-sky-600" />
            Cerca Partita o Campo
          </label>
          <div className="relative">
            <input
              id="filter-search-input"
              type="text"
              value={filters.search}
              onChange={e => onChangeFilters({ ...filters, search: e.target.value })}
              placeholder="Es. Under 16, Ostia, Abbatini..."
              className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl pl-9 pr-8 py-3 sm:py-2.5 text-base sm:text-sm font-medium text-slate-900 transition outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3" />
            {filters.search && (
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, search: '' })}
                className="absolute right-2.5 top-3 sm:top-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Seconda riga: Reset filtri e Selezione Vista (Cards vs Tabella) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              id="btn-reset-filters"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition"
            >
              <X className="w-3.5 h-3.5" />
              Azzera Filtri
            </button>
          )}
          {filters.campionato !== 'ALL' && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-200/60 font-medium">
              Cat: {filters.campionato}
            </span>
          )}
          {filters.data !== 'ALL' && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-200/60 font-medium">
              Data: {filters.data}
            </span>
          )}
        </div>

        {/* Switch Vista */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            id="btn-view-cards"
            onClick={() => onChangeViewMode('cards')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'cards'
                ? 'bg-white text-sky-800 shadow-xs border border-slate-200/60 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Schede</span>
          </button>
          <button
            id="btn-view-table"
            onClick={() => onChangeViewMode('table')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'table'
                ? 'bg-white text-sky-800 shadow-xs border border-slate-200/60 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabella</span>
          </button>
        </div>
      </div>
    </div>
  );
};
