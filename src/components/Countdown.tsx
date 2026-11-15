import React, { useState, useEffect } from 'react';
import { parseMatchDateTime } from '../utils/calendarUtils';
import { Clock, Flame, Play } from 'lucide-react';

interface CountdownProps {
  data: string;
  ora: string;
  compact?: boolean;
  className?: string;
}

interface CountdownState {
  isWithin24Hours: boolean;
  isInProgress: boolean;
  isFinished: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
}

function calculateCountdown(dataStr: string, oraStr: string): CountdownState {
  const { start, end } = parseMatchDateTime(dataStr, oraStr);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const endDiffMs = end.getTime() - now.getTime();

  // Partita conclusa (passate più di 2 ore dall'inizio)
  if (endDiffMs < 0) {
    return {
      isWithin24Hours: false,
      isInProgress: false,
      isFinished: true,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: 'Conclusa',
    };
  }

  // Partita in corso (tra l'inizio e +2 ore)
  if (diffMs <= 0 && endDiffMs >= 0) {
    return {
      isWithin24Hours: false,
      isInProgress: true,
      isFinished: false,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: 'IN CORSO',
    };
  }

  // Entro le prossime 24 ore (0 < diffMs <= 24 ore)
  const isWithin24Hours = diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;

  if (!isWithin24Hours) {
    return {
      isWithin24Hours: false,
      isInProgress: false,
      isFinished: false,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: '',
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatted = hours > 0
    ? `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
    : `${pad(minutes)}m ${pad(seconds)}s`;

  return {
    isWithin24Hours: true,
    isInProgress: false,
    isFinished: false,
    hours,
    minutes,
    seconds,
    formatted,
  };
}

export const Countdown: React.FC<CountdownProps> = ({
  data,
  ora,
  compact = false,
  className = '',
}) => {
  const [state, setState] = useState<CountdownState>(() => calculateCountdown(data, ora));

  useEffect(() => {
    // Calcola subito
    setState(calculateCountdown(data, ora));

    // Aggiorna ogni secondo
    const interval = setInterval(() => {
      setState(calculateCountdown(data, ora));
    }, 1000);

    return () => clearInterval(interval);
  }, [data, ora]);

  // Se non è nelle prossime 24 ore e non è in corso, non mostrare nulla
  if (!state.isWithin24Hours && !state.isInProgress) {
    return null;
  }

  // Partita in corso (Live match)
  if (state.isInProgress) {
    if (compact) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[11px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/50 dark:border-emerald-700 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>In corso</span>
        </span>
      );
    }

    return (
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold">
            Partita in corso
          </span>
        </div>
        <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-current" />
      </div>
    );
  }

  // Partita nelle prossime 24 ore
  const isUrgent = state.hours < 2;

  if (compact) {
    return (
      <span
        title={`Kick-off tra ${state.formatted}`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-semibold text-[11px] tabular-nums ${
          isUrgent
            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
        } ${className}`}
      >
        <Clock className="w-3 h-3 shrink-0" />
        <span>-{state.formatted}</span>
      </span>
    );
  }

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-colors ${
        isUrgent
          ? 'bg-rose-50/90 dark:bg-rose-950/35 border-rose-200 dark:border-rose-800/80'
          : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/70'
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`p-1.5 rounded-lg ${
            isUrgent ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
          }`}
        >
          {isUrgent ? <Flame className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
        </div>
        <div>
          <div
            className={`text-xs font-bold leading-tight ${
              isUrgent ? 'text-rose-800 dark:text-rose-200' : 'text-amber-900 dark:text-amber-200'
            }`}
          >
            {isUrgent ? 'Fischio d’inizio imminente' : 'Incontro entro 24 ore'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Conto alla rovescia
          </div>
        </div>
      </div>

      <div
        className={`font-mono font-bold text-xs sm:text-sm px-2.5 py-1 rounded-lg border tabular-nums ${
          isUrgent
            ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-amber-200 dark:border-amber-800'
        }`}
      >
        {state.formatted}
      </div>
    </div>
  );
};
