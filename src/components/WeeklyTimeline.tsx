import React, { useMemo, useState, useEffect } from 'react';
import {
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  format,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { Partita } from '../types';
import { parseMatchDateTime } from '../utils/calendarUtils';
import { MatchDetailModal } from './MatchDetailModal';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Home,
  Bus,
  Calendar,
  GanttChart,
  Eye,
  EyeOff,
} from 'lucide-react';

interface TimelineMatch {
  partita: Partita;
  start: Date;
  end: Date;
  startMinutes: number;
  endMinutes: number;
  dayIndex: number; // 0 = Lunedì ... 6 = Domenica
  lane: number;
}

interface WeekOption {
  weekStart: Date;
  key: string;
  label: string;
  count: number;
  homeCount: number;
  awayCount: number;
}

interface WeeklyTimelineProps {
  partite: Partita[];
}

interface WeeklySummaryStripProps {
  partite: Partita[];
  onOpenTimeline: () => void;
}

const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const DAY_NAMES_FULL = [
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
  'Domenica',
];

function getWeekKey(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

function formatWeekRangeLabel(weekStart: Date): string {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  if (sameMonth) {
    return `${format(weekStart, 'd', { locale: it })} – ${format(weekEnd, 'd MMMM yyyy', { locale: it })}`;
  }
  return `${format(weekStart, 'd MMM', { locale: it })} – ${format(weekEnd, 'd MMM yyyy', { locale: it })}`;
}

function getMondayDayIndex(date: Date): number {
  const jsDay = date.getDay(); // 0 Sun, 1 Mon ... 6 Sat
  return jsDay === 0 ? 6 : jsDay - 1;
}

function formatHourLabel(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function formatTimeHHMM(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function buildWeekOptions(partite: Partita[]): WeekOption[] {
  const map = new Map<string, WeekOption>();

  partite.forEach(p => {
    if (!p.data) return;
    const { start } = parseMatchDateTime(p.data, p.ora);
    if (isNaN(start.getTime())) return;

    const weekStart = startOfWeek(start, { weekStartsOn: 1 });
    const key = getWeekKey(weekStart);

    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      if (p.isCynthiaCasa) existing.homeCount += 1;
      if (p.isCynthiaOspite) existing.awayCount += 1;
    } else {
      map.set(key, {
        weekStart,
        key,
        label: formatWeekRangeLabel(weekStart),
        count: 1,
        homeCount: p.isCynthiaCasa ? 1 : 0,
        awayCount: p.isCynthiaOspite ? 1 : 0,
      });
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => a.weekStart.getTime() - b.weekStart.getTime()
  );
}

function pickInitialWeekStart(weekOptions: WeekOption[]): Date {
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  if (weekOptions.length === 0) return currentWeekStart;

  const currentKey = getWeekKey(currentWeekStart);
  const exactMatch = weekOptions.find(w => w.key === currentKey);
  if (exactMatch) return exactMatch.weekStart;

  const upcoming = weekOptions.find(w => w.weekStart.getTime() >= currentWeekStart.getTime());
  if (upcoming) return upcoming.weekStart;

  return weekOptions[weekOptions.length - 1].weekStart;
}

/**
 * Striscia compatta "Colpo d'occhio Settimanale" visualizzabile sopra l'elenco gare
 * nelle viste Schede/Tabella per offrire un riepilogo grafico immediato della settimana.
 */
export const WeeklySummaryStrip: React.FC<WeeklySummaryStripProps> = ({
  partite,
  onOpenTimeline,
}) => {
  const weekOptions = useMemo(() => buildWeekOptions(partite), [partite]);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() =>
    pickInitialWeekStart(weekOptions)
  );

  useEffect(() => {
    const key = getWeekKey(selectedWeekStart);
    if (weekOptions.length > 0 && !weekOptions.some(w => w.key === key)) {
      setSelectedWeekStart(pickInitialWeekStart(weekOptions));
    }
  }, [weekOptions]);

  const currentKey = getWeekKey(selectedWeekStart);

  const dayStats = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(selectedWeekStart, i);
      return {
        index: i,
        shortName: DAY_NAMES_SHORT[i],
        date,
        dateNum: format(date, 'dd/MM'),
        home: 0,
        away: 0,
        other: 0,
        total: 0,
      };
    });

    partite.forEach(p => {
      if (!p.data) return;
      const { start } = parseMatchDateTime(p.data, p.ora);
      if (isNaN(start.getTime())) return;
      if (getWeekKey(start) !== currentKey) return;

      const idx = getMondayDayIndex(start);
      days[idx].total += 1;
      if (p.isCynthiaCasa) days[idx].home += 1;
      else if (p.isCynthiaOspite) days[idx].away += 1;
      else days[idx].other += 1;
    });

    return days;
  }, [partite, selectedWeekStart, currentKey]);

  if (partite.length === 0) return null;

  const weekTotal = dayStats.reduce((sum, d) => sum + d.total, 0);
  const maxPerDay = Math.max(1, ...dayStats.map(d => d.total));
  const today = new Date();

  const handleStepWeek = (dir: -1 | 1) => {
    const currentIdx = weekOptions.findIndex(w => w.key === currentKey);
    if (currentIdx !== -1 && weekOptions[currentIdx + dir]) {
      setSelectedWeekStart(weekOptions[currentIdx + dir].weekStart);
    } else {
      setSelectedWeekStart(prev => (dir > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1)));
    }
  };

  return (
    <section
      id="weekly-graphical-summary"
      aria-label="Riepilogo grafico settimanale"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:px-5 sm:py-4 mb-5 transition-colors"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Info settimana + controlli prev/next */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <GanttChart className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                Distribuzione settimanale
              </h2>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                · {weekTotal} {weekTotal === 1 ? 'gara' : 'gare'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5 tabular-nums">
              {formatWeekRangeLabel(selectedWeekStart)}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleStepWeek(-1)}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Settimana precedente"
              aria-label="Settimana precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleStepWeek(1)}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Settimana successiva"
              aria-label="Settimana successiva"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mini grafico a 7 giorni (Lun - Dom) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 flex-1 max-w-2xl">
          {dayStats.map(day => {
            const isToday = isSameDay(day.date, today);
            const homePct = day.total > 0 ? (day.home / maxPerDay) * 100 : 0;
            const awayPct = day.total > 0 ? ((day.away + day.other) / maxPerDay) * 100 : 0;

            return (
              <button
                key={day.index}
                type="button"
                onClick={onOpenTimeline}
                title={`${DAY_NAMES_FULL[day.index]} ${day.dateNum}: ${day.total} gare (${day.home} in casa, ${day.away} trasferta) — Apri timeline`}
                className={`group flex flex-col items-center p-1.5 rounded-xl border transition-colors cursor-pointer ${
                  day.total > 0
                    ? 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-sky-400 dark:hover:border-sky-500'
                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-65'
                } ${isToday ? 'ring-1 ring-sky-500/70' : ''}`}
              >
                <div className="w-full h-7 flex flex-col justify-end items-center mb-1 px-1">
                  {day.total > 0 ? (
                    <div className="w-full max-w-[26px] flex flex-col-reverse gap-0.5 h-full justify-start">
                      {day.home > 0 && (
                        <div
                          className="w-full rounded-t-[3px] rounded-b-[2px] bg-sky-600 dark:bg-sky-500 transition-all"
                          style={{ height: `${Math.max(20, homePct)}%` }}
                        />
                      )}
                      {day.away + day.other > 0 && (
                        <div
                          className="w-full rounded-t-[3px] rounded-b-[2px] bg-amber-500 dark:bg-amber-400 transition-all"
                          style={{ height: `${Math.max(20, awayPct)}%` }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-4 h-0.5 rounded-full bg-slate-200 dark:bg-slate-700 mb-1" />
                  )}
                </div>

                <span
                  className={`text-[11px] font-bold leading-none ${
                    day.total > 0
                      ? 'text-slate-800 dark:text-slate-100'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {day.shortName}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
                  {day.total > 0 ? `${day.total}g` : day.dateNum}
                </span>
              </button>
            );
          })}
        </div>

        {/* CTA rapida per vista Timeline orizzontale completa */}
        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 dark:bg-sky-500 shrink-0" />
              Casa
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 dark:bg-amber-400 shrink-0" />
              Trasferta
            </span>
          </div>

          <button
            id="btn-open-full-timeline"
            type="button"
            onClick={onOpenTimeline}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <GanttChart className="w-3.5 h-3.5" />
            <span>Apri Timeline</span>
          </button>
        </div>
      </div>
    </section>
  );
};

/**
 * Vista Timeline Orizzontale Completa della Settimana:
 * - Swimlanes per ogni giorno (Lunedì–Domenica) con asse orario orizzontale.
 * - Impacchettamento automatico su corsie senza sovrapposizioni per gare simultanee.
 * - Riepilogo grafico dei carichi settimanali e click su ogni gara per modale dettagli.
 */
export const WeeklyTimeline: React.FC<WeeklyTimelineProps> = ({ partite }) => {
  const weekOptions = useMemo(() => buildWeekOptions(partite), [partite]);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() =>
    pickInitialWeekStart(weekOptions)
  );
  const [hideEmptyDays, setHideEmptyDays] = useState<boolean>(false);
  const [highlightedDayIdx, setHighlightedDayIdx] = useState<number | null>(null);
  const [selectedPartita, setSelectedPartita] = useState<Partita | null>(null);

  useEffect(() => {
    const key = getWeekKey(selectedWeekStart);
    if (weekOptions.length > 0 && !weekOptions.some(w => w.key === key)) {
      setSelectedWeekStart(pickInitialWeekStart(weekOptions));
    }
  }, [weekOptions]);

  const currentWeekKey = getWeekKey(selectedWeekStart);

  // Filtra le partite appartenenti alla settimana selezionata
  const weekMatches = useMemo(() => {
    const list: { partita: Partita; start: Date; end: Date; dayIndex: number }[] = [];
    partite.forEach(p => {
      if (!p.data) return;
      const { start, end } = parseMatchDateTime(p.data, p.ora);
      if (isNaN(start.getTime())) return;
      if (getWeekKey(start) !== currentWeekKey) return;

      list.push({
        partita: p,
        start,
        end,
        dayIndex: getMondayDayIndex(start),
      });
    });

    return list.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [partite, currentWeekKey]);

  // Calcola l'intervallo orario dinamico dell'asse X orizzontale
  const { minHour, maxHour, totalMinutes } = useMemo(() => {
    if (weekMatches.length === 0) {
      return { minHour: 9, maxHour: 21, totalMinutes: 12 * 60 };
    }

    let earliestHour = 23;
    let latestHour = 8;

    weekMatches.forEach(m => {
      const sHour = m.start.getHours();
      const eHour = m.end.getHours() + (m.end.getMinutes() > 0 ? 1 : 0);
      if (sHour < earliestHour) earliestHour = sHour;
      if (eHour > latestHour) latestHour = eHour;
    });

    const paddedMin = Math.max(7, Math.min(earliestHour - 1, 9));
    let paddedMax = Math.min(24, Math.max(latestHour + 1, paddedMin + 9));
    if (paddedMax <= paddedMin + 6) {
      paddedMax = Math.min(24, paddedMin + 8);
    }

    return {
      minHour: paddedMin,
      maxHour: paddedMax,
      totalMinutes: (paddedMax - paddedMin) * 60,
    };
  }, [weekMatches]);

  // Costruisce le 7 righe (Lunedì–Domenica) con assegnazione corsie anti-sovrapposizione
  const dayRows = useMemo(() => {
    const rangeStartMins = minHour * 60;
    // Larghezza minima logica per collisione testuale (circa 130 minuti visivi)
    const minVisualDurationMins = Math.max(115, Math.round(totalMinutes * 0.16));

    return Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDays(selectedWeekStart, dayIndex);
      const dayItems = weekMatches
        .filter(m => m.dayIndex === dayIndex)
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      const laneVisualEnds: number[] = [];
      const placed: TimelineMatch[] = dayItems.map(item => {
        const rawStartMins = item.start.getHours() * 60 + item.start.getMinutes();
        const rawEndMins = item.end.getHours() * 60 + item.end.getMinutes();
        const clampedStart = Math.max(rangeStartMins, rawStartMins);
        const clampedEnd = Math.min(maxHour * 60, Math.max(clampedStart + 90, rawEndMins));
        const visualEnd = Math.max(clampedEnd, clampedStart + minVisualDurationMins);

        let assignedLane = laneVisualEnds.findIndex(endVal => endVal <= clampedStart - 6);
        if (assignedLane === -1) {
          assignedLane = laneVisualEnds.length;
          laneVisualEnds.push(visualEnd);
        } else {
          laneVisualEnds[assignedLane] = visualEnd;
        }

        return {
          partita: item.partita,
          start: item.start,
          end: item.end,
          startMinutes: clampedStart,
          endMinutes: clampedEnd,
          dayIndex,
          lane: assignedLane,
        };
      });

      const homeCount = placed.filter(m => m.partita.isCynthiaCasa).length;
      const awayCount = placed.filter(m => m.partita.isCynthiaOspite).length;

      return {
        dayIndex,
        date,
        dayName: DAY_NAMES_FULL[dayIndex],
        dayShort: DAY_NAMES_SHORT[dayIndex],
        dateStr: format(date, 'dd/MM'),
        matches: placed,
        lanesCount: Math.max(1, laneVisualEnds.length),
        homeCount,
        awayCount,
      };
    });
  }, [selectedWeekStart, weekMatches, minHour, maxHour, totalMinutes]);

  const hoursTicks = useMemo(() => {
    const arr: number[] = [];
    for (let h = minHour; h <= maxHour; h += 1) {
      arr.push(h);
    }
    return arr;
  }, [minHour, maxHour]);

  const visibleRows = hideEmptyDays
    ? dayRows.filter(r => r.matches.length > 0)
    : dayRows;

  const weekHomeTotal = weekMatches.filter(m => m.partita.isCynthiaCasa).length;
  const weekAwayTotal = weekMatches.filter(m => m.partita.isCynthiaOspite).length;
  const maxMatchesInAnyDay = Math.max(1, ...dayRows.map(d => d.matches.length));
  const today = new Date();

  const currentNowLeftPct = useMemo(() => {
    const now = new Date();
    if (getWeekKey(now) !== currentWeekKey) return null;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const startMins = minHour * 60;
    const endMins = maxHour * 60;
    if (nowMins < startMins || nowMins > endMins) return null;
    return ((nowMins - startMins) / totalMinutes) * 100;
  }, [currentWeekKey, minHour, maxHour, totalMinutes]);

  const handleStepCalendarWeek = (dir: -1 | 1) => {
    setHighlightedDayIdx(null);
    setSelectedWeekStart(prev => (dir > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1)));
  };

  const handleJumpWeek = (weekStart: Date) => {
    setHighlightedDayIdx(null);
    setSelectedWeekStart(weekStart);
  };

  return (
    <div id="weekly-timeline-view" className="space-y-4">
      {/* 1. Header Navigazione Settimana & Riepilogo Grafico */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Titolo & Range Settimana */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/70 shrink-0">
              <GanttChart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Timeline Settimanale
                </h2>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                  {weekMatches.length} {weekMatches.length === 1 ? 'gara' : 'gare'} in settimana
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-sky-700 dark:text-sky-400 capitalize tabular-nums mt-0.5">
                {formatWeekRangeLabel(selectedWeekStart)}
              </p>
            </div>
          </div>

          {/* Controlli Navigazione & Filtri Vista */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1">
              <button
                id="btn-timeline-prev-week"
                type="button"
                onClick={() => handleStepCalendarWeek(-1)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                title="Settimana precedente"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prec.</span>
              </button>
              <button
                id="btn-timeline-current-week"
                type="button"
                onClick={() => handleJumpWeek(pickInitialWeekStart(weekOptions))}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                title="Vai alla settimana attiva"
              >
                Settimana attiva
              </button>
              <button
                id="btn-timeline-next-week"
                type="button"
                onClick={() => handleStepCalendarWeek(1)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                title="Settimana successiva"
              >
                <span className="hidden sm:inline">Succ.</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              id="btn-timeline-toggle-empty-days"
              type="button"
              onClick={() => setHideEmptyDays(prev => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                hideEmptyDays
                  ? 'bg-slate-900 dark:bg-sky-600 text-white border-slate-900 dark:border-sky-500'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
              title="Alterna la visualizzazione dei giorni feriali senza partite"
            >
              {hideEmptyDays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{hideEmptyDays ? 'Mostra tutti i 7 giorni' : 'Solo giorni con gare'}</span>
            </button>
          </div>
        </div>

        {/* Barra Riepilogo Grafico 7 Giorni (Click per evidenziare giorno) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {dayRows.map(day => {
              const isSelected = highlightedDayIdx === day.dayIndex;
              const isToday = isSameDay(day.date, today);
              const total = day.matches.length;
              const homeWidth = total > 0 ? Math.round((day.homeCount / maxMatchesInAnyDay) * 100) : 0;
              const awayWidth =
                total > 0
                  ? Math.round(((total - day.homeCount) / maxMatchesInAnyDay) * 100)
                  : 0;

              return (
                <button
                  key={day.dayIndex}
                  type="button"
                  onClick={() =>
                    setHighlightedDayIdx(prev => (prev === day.dayIndex ? null : day.dayIndex))
                  }
                  className={`text-left p-2 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-500'
                      : total > 0
                      ? 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                      : 'bg-slate-50/40 dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[11px] font-bold ${
                        isToday
                          ? 'text-sky-700 dark:text-sky-400'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {day.dayShort}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      {total}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-slate-500 mt-0.5">
                    {day.dateStr}
                  </div>
                  {/* Barra proporzionale orizzontale Casa / Trasferta */}
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-700/70 overflow-hidden flex gap-px">
                    {day.homeCount > 0 && (
                      <div
                        className="h-full bg-sky-600 dark:bg-sky-500 rounded-l-full"
                        style={{ width: `${Math.max(12, homeWidth)}%` }}
                      />
                    )}
                    {total - day.homeCount > 0 && (
                      <div
                        className="h-full bg-amber-500 dark:bg-amber-400 rounded-r-full"
                        style={{ width: `${Math.max(12, awayWidth)}%` }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legenda esplicita + Riepilogo Casa/Trasferta */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-4">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 dark:bg-sky-500 shrink-0" />
              <span>In casa ({weekHomeTotal})</span>
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 dark:bg-amber-400 shrink-0" />
              <span>Trasferta ({weekAwayTotal})</span>
            </span>
          </div>
        </div>

        {/* Selettore rapido settimane che contengono gare */}
        {weekOptions.length > 1 && (
          <div className="pt-2 flex items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1">
              Settimane con gare:
            </span>
            {weekOptions.map(opt => {
              const isCurrent = opt.key === currentWeekKey;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleJumpWeek(opt.weekStart)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                    isCurrent
                      ? 'bg-slate-900 dark:bg-sky-600 text-white border-slate-900 dark:border-sky-500'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  {opt.label} ({opt.count})
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Griglia Timeline Orizzontale (Asse X = Orario, Righe = Giorni) */}
      {weekMatches.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Nessuna partita programmata in questa settimana
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Seleziona una delle settimane con gare qui sopra oppure usa le frecce per scorrere il calendario.
            </p>
          </div>
          {weekOptions.length > 0 && (
            <button
              type="button"
              onClick={() => handleJumpWeek(pickInitialWeekStart(weekOptions))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-700 hover:bg-sky-600 text-white transition-colors cursor-pointer"
            >
              Vai alla settimana con gare
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto overscroll-x-contain">
            <div className="min-w-[860px]">
              {/* Intestazione Asse Orario Orizzontale */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/70">
                <div className="w-36 sm:w-44 shrink-0 sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/95 border-r border-slate-200 dark:border-slate-700 px-3.5 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Giorno
                  </span>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="relative flex-1 h-9">
                  {hoursTicks.slice(0, -1).map(hour => {
                    const leftPct = (((hour - minHour) * 60) / totalMinutes) * 100;
                    return (
                      <div
                        key={hour}
                        className="absolute top-0 bottom-0 border-l border-slate-200/80 dark:border-slate-700/70 pl-1.5 flex items-center"
                        style={{ left: `${leftPct}%` }}
                      >
                        <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums select-none">
                          {formatHourLabel(hour)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Corsie Giorno per Giorno */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleRows.map(row => {
                  const isToday = isSameDay(row.date, today);
                  const isHighlighted = highlightedDayIdx === row.dayIndex;
                  const hasMatches = row.matches.length > 0;
                  const rowHeightPx = hasMatches ? row.lanesCount * 82 + 16 : 44;

                  return (
                    <div
                      key={row.dayIndex}
                      className={`flex transition-colors ${
                        isHighlighted
                          ? 'bg-sky-50/50 dark:bg-sky-950/20'
                          : isToday
                          ? 'bg-slate-50/70 dark:bg-slate-800/20'
                          : ''
                      }`}
                    >
                      {/* Colonna Fissa Sinistra: Giorno della Settimana */}
                      <div
                        className={`w-36 sm:w-44 shrink-0 sticky left-0 z-20 border-r border-slate-200 dark:border-slate-800 px-3.5 py-2.5 flex flex-col justify-center ${
                          isHighlighted
                            ? 'bg-sky-50 dark:bg-sky-950'
                            : 'bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className={`text-xs sm:text-sm font-extrabold tracking-tight ${
                              hasMatches
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {row.dayName}
                          </span>
                          {hasMatches && (
                            <span className="text-[11px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                              {row.matches.length}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            {row.dateStr}
                          </span>
                          {isToday && (
                            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400">
                              · Oggi
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Traccia Orizzontale delle Partite */}
                      <div
                        className="relative flex-1"
                        style={{ height: `${rowHeightPx}px` }}
                      >
                        {/* Linee verticali di scansione oraria */}
                        {hoursTicks.slice(1, -1).map(hour => {
                          const leftPct = (((hour - minHour) * 60) / totalMinutes) * 100;
                          return (
                            <div
                              key={hour}
                              className="absolute top-0 bottom-0 border-l border-dashed border-slate-100 dark:border-slate-800/80 pointer-events-none"
                              style={{ left: `${leftPct}%` }}
                            />
                          );
                        })}

                        {/* Indicatore "Adesso" se oggi è nella settimana */}
                        {currentNowLeftPct !== null && isToday && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-rose-500/80 z-10 pointer-events-none"
                            style={{ left: `${currentNowLeftPct}%` }}
                            title="Ora attuale"
                          />
                        )}

                        {!hasMatches ? (
                          <div className="h-full flex items-center px-4">
                            <span className="text-xs text-slate-400 dark:text-slate-600">
                              Nessuna gara programmata
                            </span>
                          </div>
                        ) : (
                          row.matches.map(item => {
                            const rangeStartMins = minHour * 60;
                            const rawLeftPct =
                              ((item.startMinutes - rangeStartMins) / totalMinutes) * 100;
                            const rawWidthPct =
                              ((item.endMinutes - item.startMinutes) / totalMinutes) * 100;

                            // Garantisce leggibilità minima del blocco evitando overflow oltre il bordo destro
                            const widthPct = Math.min(
                              100 - Math.max(0, rawLeftPct),
                              Math.max(15, rawWidthPct)
                            );
                            const leftPct = Math.min(rawLeftPct, 100 - widthPct);
                            const topPx = item.lane * 82 + 8;

                            const isHome = item.partita.isCynthiaCasa;
                            const isAway = item.partita.isCynthiaOspite;

                            return (
                              <button
                                key={item.partita.id}
                                type="button"
                                onClick={() => setSelectedPartita(item.partita)}
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  top: `${topPx}px`,
                                  height: '72px',
                                }}
                                title={`${formatTimeHHMM(item.start)} · ${item.partita.campionato} · ${item.partita.squadraCasa} vs ${item.partita.squadraOspite} (${item.partita.campo})`}
                                className={`group absolute z-10 rounded-xl px-2.5 py-1.5 text-left border transition-all cursor-pointer flex flex-col justify-between overflow-hidden focus-visible:outline-2 focus-visible:outline-sky-500 ${
                                  isHome
                                    ? 'bg-sky-50/95 dark:bg-sky-950/70 border-sky-200 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-100/80 dark:hover:bg-sky-900/70'
                                    : isAway
                                    ? 'bg-amber-50/95 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-100/80 dark:hover:bg-amber-900/60'
                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                                }`}
                              >
                                {/* Riga 1: Orario + Categoria + Tag Casa/Trasferta */}
                                <div className="flex items-center justify-between gap-1.5 min-w-0">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span
                                      className={`text-[11px] font-mono font-extrabold tabular-nums shrink-0 ${
                                        isHome
                                          ? 'text-sky-800 dark:text-sky-300'
                                          : isAway
                                          ? 'text-amber-800 dark:text-amber-300'
                                          : 'text-slate-700 dark:text-slate-200'
                                      }`}
                                    >
                                      {formatTimeHHMM(item.start)}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                      {item.partita.campionato}
                                    </span>
                                  </div>

                                  <span
                                    className={`inline-flex items-center gap-0.5 text-[10px] font-bold shrink-0 ${
                                      isHome
                                        ? 'text-sky-700 dark:text-sky-300'
                                        : isAway
                                        ? 'text-amber-700 dark:text-amber-300'
                                        : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                  >
                                    {isHome ? (
                                      <>
                                        <Home className="w-3 h-3" />
                                        <span className="hidden sm:inline">Casa</span>
                                      </>
                                    ) : isAway ? (
                                      <>
                                        <Bus className="w-3 h-3" />
                                        <span className="hidden sm:inline">Trasf.</span>
                                      </>
                                    ) : null}
                                  </span>
                                </div>

                                {/* Riga 2: Confronto Squadre */}
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                                  {item.partita.squadraCasa} – {item.partita.squadraOspite}
                                </div>

                                {/* Riga 3: Campo */}
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 min-w-0">
                                  <MapPin className="w-3 h-3 shrink-0 opacity-75" />
                                  <span className="truncate">{item.partita.campo}</span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Clicca su qualsiasi gara nella timeline per aprire i dettagli completi, mappa GPS e meteo.
            </span>
            <span className="font-mono tabular-nums">
              Finestra oraria {formatHourLabel(minHour)} – {formatHourLabel(maxHour)}
            </span>
          </div>
        </div>
      )}

      {/* Modale Dettaglio Partita */}
      <MatchDetailModal
        partita={selectedPartita}
        isOpen={Boolean(selectedPartita)}
        onClose={() => setSelectedPartita(null)}
      />
    </div>
  );
};
