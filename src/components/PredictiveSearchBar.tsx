import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Partita, FilterState } from '../types';
import {
  Search,
  X,
  Trophy,
  Shield,
  MapPin,
  Calendar,
  History,
  Sparkles,
  ArrowRight,
  Check,
  CornerDownLeft,
} from 'lucide-react';

interface PredictiveSearchBarProps {
  filters: FilterState;
  onChangeFilters: (filters: FilterState) => void;
  partite: Partita[];
  availableCampionati: string[];
  placeholder?: string;
  className?: string;
}

interface SuggestionItem {
  id: string;
  type: 'campionato' | 'squadra' | 'campo' | 'partita' | 'recent';
  title: string;
  subtitle?: string;
  badge?: string;
  matchCount?: number;
  highlightText?: string;
  data?: any;
}

const RECENT_SEARCHES_KEY = 'cynthia_recent_searches_v1';
const MAX_RECENT_SEARCHES = 5;

// Funzione ausiliaria per normalizzare stringhe per confronto (rimuove accenti e spazi multipli)
function normalizeStr(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Funzione ausiliaria per evidenziare la porzione di testo cercata
function renderHighlightedText(text: string, query: string) {
  if (!query || !query.trim()) {
    return <span>{text}</span>;
  }

  const normText = normalizeStr(text);
  const normQuery = normalizeStr(query);

  const idx = normText.indexOf(normQuery);
  if (idx === -1) {
    // Prova senza spazi (es. "under 17" vs "under17")
    const compactText = normText.replace(/\s+/g, '');
    const compactQuery = normQuery.replace(/\s+/g, '');
    if (compactText.includes(compactQuery)) {
      return (
        <span className="font-extrabold text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950/80 px-1 rounded">
          {text}
        </span>
      );
    }
    return <span>{text}</span>;
  }

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);

  return (
    <span>
      {before}
      <span className="font-extrabold text-sky-700 dark:text-sky-300 bg-sky-100/90 dark:bg-sky-950/80 px-0.5 rounded underline decoration-sky-400">
        {match}
      </span>
      {after}
    </span>
  );
}

export const PredictiveSearchBar: React.FC<PredictiveSearchBarProps> = ({
  filters,
  onChangeFilters,
  partite = [],
  availableCampionati = [],
  placeholder = 'Cerca squadra, categoria, campo...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carica le ricerche recenti da localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch {
      // Ignora errori di parsing
    }
  }, []);

  const saveRecentSearch = (query: string) => {
    const clean = query.trim();
    if (!clean || clean.length < 2) return;
    try {
      setRecentSearches(prev => {
        const filtered = prev.filter(item => item.toLowerCase() !== clean.toLowerCase());
        const updated = [clean, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Ignore storage errors
    }
  };

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch {
      // Ignore
    }
  };

  // Chiudi cliccando all'esterno
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Costruisci le liste univoche con conteggi da `partite`
  const { allSquadreWithCount, allCampionatiWithCount, allCampiWithCount } = useMemo(() => {
    const squadreMap: Record<string, { count: number; isCynthia: boolean }> = {};
    const campionatiMap: Record<string, number> = {};
    const campiMap: Record<string, { count: number; comune: string }> = {};

    partite.forEach(p => {
      // Campionato
      if (p.campionato && p.campionato.trim() !== '') {
        const camp = p.campionato.trim();
        campionatiMap[camp] = (campionatiMap[camp] || 0) + 1;
      }

      // Squadra Casa
      if (p.squadraCasa && p.squadraCasa.trim() !== '') {
        const sq = p.squadraCasa.trim();
        if (!squadreMap[sq]) {
          squadreMap[sq] = { count: 0, isCynthia: p.isCynthiaCasa };
        }
        squadreMap[sq].count += 1;
      }

      // Squadra Ospite
      if (p.squadraOspite && p.squadraOspite.trim() !== '') {
        const sq = p.squadraOspite.trim();
        if (!squadreMap[sq]) {
          squadreMap[sq] = { count: 0, isCynthia: p.isCynthiaOspite };
        }
        squadreMap[sq].count += 1;
      }

      // Campo
      if (p.campo && p.campo.trim() !== '') {
        const campoName = p.campo.trim();
        if (!campiMap[campoName]) {
          campiMap[campoName] = { count: 0, comune: p.comune || '' };
        }
        campiMap[campoName].count += 1;
      }
    });

    // Includi anche tutti gli availableCampionati passati se non presenti
    availableCampionati.forEach(c => {
      if (c && !campionatiMap[c]) {
        campionatiMap[c] = 0;
      }
    });

    return {
      allSquadreWithCount: Object.entries(squadreMap).map(([name, data]) => ({
        name,
        count: data.count,
        isCynthia: data.isCynthia,
      })),
      allCampionatiWithCount: Object.entries(campionatiMap).map(([name, count]) => ({
        name,
        count,
      })),
      allCampiWithCount: Object.entries(campiMap).map(([name, data]) => ({
        name,
        count: data.count,
        comune: data.comune,
      })),
    };
  }, [partite, availableCampionati]);

  // Calcola le raccomandazioni predittive in base alla query attuale
  const suggestions: SuggestionItem[] = useMemo(() => {
    const rawQuery = filters.search || '';
    const normQuery = normalizeStr(rawQuery);
    const compactQuery = normQuery.replace(/\s+/g, '');

    // Se il campo è vuoto, mostra suggerimenti intelligenti (Ricerche Recenti e Categorie Principali)
    if (!normQuery) {
      const items: SuggestionItem[] = [];

      // Ricerche recenti
      recentSearches.forEach(recent => {
        items.push({
          id: `recent-${recent}`,
          type: 'recent',
          title: recent,
          subtitle: 'Ricerca recente',
        });
      });

      // Categorie più frequenti (prime 4 con più partite)
      const topCategories = [...allCampionatiWithCount]
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      topCategories.forEach(cat => {
        items.push({
          id: `top-cat-${cat.name}`,
          type: 'campionato',
          title: cat.name,
          subtitle: `${cat.count} ${cat.count === 1 ? 'partita in programma' : 'partite in programma'}`,
          matchCount: cat.count,
          badge: 'Categoria',
        });
      });

      // Squadre principali
      const topSquadre = [...allSquadreWithCount]
        .filter(s => s.isCynthia || s.count > 1)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      topSquadre.forEach(sq => {
        items.push({
          id: `top-sq-${sq.name}`,
          type: 'squadra',
          title: sq.name,
          subtitle: `${sq.count} ${sq.count === 1 ? 'partita' : 'partite'}`,
          matchCount: sq.count,
          badge: sq.isCynthia ? 'Cynthia' : 'Avversario',
        });
      });

      return items;
    }

    // Quando l'utente sta digitando: calcolo predittivo avanzato
    const matchedCategories: SuggestionItem[] = [];
    const matchedSquadre: SuggestionItem[] = [];
    const matchedCampi: SuggestionItem[] = [];
    const matchedPartite: SuggestionItem[] = [];

    // 1. Categorie
    allCampionatiWithCount.forEach(cat => {
      const normCat = normalizeStr(cat.name);
      const compactCat = normCat.replace(/\s+/g, '');
      if (normCat.includes(normQuery) || compactCat.includes(compactQuery)) {
        matchedCategories.push({
          id: `cat-${cat.name}`,
          type: 'campionato',
          title: cat.name,
          subtitle: `${cat.count} ${cat.count === 1 ? 'gara' : 'gare'} in calendario`,
          matchCount: cat.count,
          badge: 'Categoria',
        });
      }
    });

    // Ordina le categorie: priorità a match iniziale, poi per conteggio
    matchedCategories.sort((a, b) => {
      const aStarts = normalizeStr(a.title).startsWith(normQuery);
      const bStarts = normalizeStr(b.title).startsWith(normQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return (b.matchCount || 0) - (a.matchCount || 0);
    });

    // 2. Squadre
    allSquadreWithCount.forEach(sq => {
      const normSq = normalizeStr(sq.name);
      const compactSq = normSq.replace(/\s+/g, '');
      if (normSq.includes(normQuery) || compactSq.includes(compactQuery)) {
        matchedSquadre.push({
          id: `sq-${sq.name}`,
          type: 'squadra',
          title: sq.name,
          subtitle: `${sq.count} ${sq.count === 1 ? 'gara in calendario' : 'gare in calendario'}`,
          matchCount: sq.count,
          badge: sq.isCynthia ? 'Cynthia' : 'Avversario',
        });
      }
    });

    // Ordina squadre: prima Cynthia, poi per count
    matchedSquadre.sort((a, b) => {
      const aStarts = normalizeStr(a.title).startsWith(normQuery);
      const bStarts = normalizeStr(b.title).startsWith(normQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return (b.matchCount || 0) - (a.matchCount || 0);
    });

    // 3. Campi / Impianti
    allCampiWithCount.forEach(campo => {
      const normCampo = normalizeStr(campo.name);
      const normComune = normalizeStr(campo.comune);
      if (normCampo.includes(normQuery) || normComune.includes(normQuery)) {
        matchedCampi.push({
          id: `campo-${campo.name}`,
          type: 'campo',
          title: campo.name,
          subtitle: campo.comune ? `${campo.comune} • ${campo.count} gare` : `${campo.count} gare`,
          matchCount: campo.count,
          badge: 'Impianto',
        });
      }
    });

    // 4. Gare specifiche (top 2 se query ha almeno 3 caratteri)
    if (normQuery.length >= 3) {
      partite.forEach(p => {
        const fullString = `${p.campionato} ${p.squadraCasa} ${p.squadraOspite} ${p.campo} ${p.gara}`.toLowerCase();
        if (fullString.includes(normQuery)) {
          matchedPartite.push({
            id: `partita-${p.id}`,
            type: 'partita',
            title: `${p.squadraCasa} vs ${p.squadraOspite}`,
            subtitle: `${p.campionato} • ${p.data} ${p.ora}`,
            badge: p.campionato,
            data: p,
          });
        }
      });
    }

    // Combina con limiti per una UI ultra-pulita e veloce da scorrere
    return [
      ...matchedCategories.slice(0, 4),
      ...matchedSquadre.slice(0, 5),
      ...matchedCampi.slice(0, 2),
      ...matchedPartite.slice(0, 2),
    ];
  }, [filters.search, allCampionatiWithCount, allSquadreWithCount, allCampiWithCount, partite, recentSearches]);

  // Gestione selezione elemento suggerito
  const handleSelectSuggestion = (item: SuggestionItem) => {
    saveRecentSearch(item.title);

    if (item.type === 'campionato') {
      // Se seleziona una Categoria, impostiamo direttamente il filtro Campionato e svuotiamo la ricerca testuale
      // oppure impostiamo il filtro categoria in modo preciso
      onChangeFilters({
        ...filters,
        campionato: item.title,
        search: '', // Svuota la ricerca testuale per mostrare tutte le gare della categoria selezionata
      });
    } else if (item.type === 'squadra') {
      // Se seleziona una Squadra, impostiamo il testo di ricerca sulla squadra
      onChangeFilters({
        ...filters,
        search: item.title,
      });
    } else if (item.type === 'campo') {
      // Se seleziona un Campo, cerchiamo per nome campo
      onChangeFilters({
        ...filters,
        search: item.title,
      });
    } else if (item.type === 'partita') {
      // Se seleziona una Partita specifica, cerchiamo per la gara
      onChangeFilters({
        ...filters,
        search: item.title,
      });
    } else if (item.type === 'recent') {
      onChangeFilters({
        ...filters,
        search: item.title,
      });
    }

    setIsOpen(false);
    setActiveIndex(-1);
  };

  // Navigazione da tastiera
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[activeIndex]);
      } else if (filters.search.trim()) {
        saveRecentSearch(filters.search.trim());
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleClear = () => {
    onChangeFilters({ ...filters, search: '' });
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // Calcola il conteggio totale di partite che corrispondono attualmente alla ricerca
  const matchingMatchesCount = useMemo(() => {
    if (!filters.search.trim()) return null;
    const q = normalizeStr(filters.search);
    const compactQ = q.replace(/\s+/g, '');
    return partite.filter(p => {
      const matchString = normalizeStr(
        `${p.campionato} ${p.girone} ${p.gara} ${p.squadraCasa} ${p.squadraOspite} ${p.campo} ${p.comune}`
      );
      const compactString = matchString.replace(/\s+/g, '');
      return matchString.includes(q) || compactString.includes(compactQ);
    }).length;
  }, [filters.search, partite]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input di Ricerca Principale con icone e stato interattivo */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="w-4 h-4 text-sky-600 dark:text-sky-400 transition-colors" />
        </div>

        <input
          ref={inputRef}
          id="filter-search-input"
          type="text"
          value={filters.search}
          onChange={e => {
            onChangeFilters({ ...filters, search: e.target.value });
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck="false"
          className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 rounded-xl pl-9.5 pr-20 py-2.5 sm:py-2 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all outline-none"
        />

        {/* Badge conteggio partite trovate & Pulsante Reset */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {matchingMatchesCount !== null && (
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold tracking-tight ${
                matchingMatchesCount > 0
                  ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300/60 dark:border-sky-800'
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
              }`}
              title={`${matchingMatchesCount} gare corrispondenti alla ricerca`}
            >
              {matchingMatchesCount} {matchingMatchesCount === 1 ? 'gara' : 'gare'}
            </span>
          )}

          {filters.search && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition"
              title="Azzera testo di ricerca (Esc)"
              aria-label="Azzera ricerca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Pannello Predittivo a Comparsa (Dropdown Intelligente) */}
      {isOpen && (
        <div
          id="predictive-search-dropdown"
          className="absolute z-50 left-0 right-0 sm:left-auto sm:right-0 sm:w-[420px] max-w-[95vw] mt-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 backdrop-blur-md"
        >
          {/* Intestazione rapida del dropdown */}
          <div className="px-3.5 py-2.5 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              {filters.search.trim() ? 'Risultati Predittivi' : 'Suggerimenti e Ricerche Recenti'}
            </span>
            {recentSearches.length > 0 && !filters.search.trim() && (
              <button
                type="button"
                onClick={clearRecentSearches}
                className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
              >
                Cancella cronologia
              </button>
            )}
          </div>

          {/* Elenco dei Suggerimenti */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1.5 scrollbar-thin">
            {suggestions.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nessun suggerimento per "{filters.search}"
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Premi Invio per cercare comunque come testo libero nelle gare.
                </p>
              </div>
            ) : (
              suggestions.map((item, index) => {
                const isSelected = activeIndex === index;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-950 dark:text-sky-100 ring-1 ring-sky-300 dark:ring-sky-700'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Icona Tipo Suggerimento */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          item.type === 'campionato'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400'
                            : item.type === 'squadra'
                            ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-400'
                            : item.type === 'campo'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                            : item.type === 'partita'
                            ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.type === 'campionato' && <Trophy className="w-4 h-4" />}
                        {item.type === 'squadra' && <Shield className="w-4 h-4" />}
                        {item.type === 'campo' && <MapPin className="w-4 h-4" />}
                        {item.type === 'partita' && <Calendar className="w-4 h-4" />}
                        {item.type === 'recent' && <History className="w-4 h-4" />}
                      </div>

                      {/* Testo e Sottotitolo */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold truncate">
                            {renderHighlightedText(item.title, filters.search)}
                          </p>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                                item.type === 'campionato'
                                  ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                                  : item.badge === 'Cynthia'
                                  ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>

                        {item.subtitle && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Azione Rapida / Freccia */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-400 dark:text-slate-500">
                      {item.type === 'campionato' && (
                        <span className="hidden sm:inline text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
                          Filtra Categoria
                        </span>
                      )}
                      {item.type === 'squadra' && (
                        <span className="hidden sm:inline text-[11px] font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-900">
                          Cerca Squadra
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer del dropdown con scorciatoie */}
          <div className="px-3.5 py-2 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3 text-sky-600 dark:text-sky-400" />
              <span>Invio per selezionare</span>
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Usa ↑ ↓ per navigare, Esc per uscire
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
