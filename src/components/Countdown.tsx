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

  // Partita in corso
  if (state.isInProgress) {
    if (compact) {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-black text-[10px] uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-700 shadow-2xs animate-pulse ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>In Corso</span>
        </span>
      );
    }

    return (
      <div
        className={`flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-400/60 dark:border-emerald-600/60 text-emerald-900 dark:text-emerald-200 shadow-xs ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-black uppercase tracking-wider">
            Partita Iniziata • Live in Corso ⚽
          </span>
        </div>
        <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-current animate-pulse" />
      </div>
    );
  }

  // Partita nelle prossime 24 ore
  const isUrgent = state.hours < 2;

  if (compact) {
    return (
      <span
        title={`Kick-off tra ${state.formatted}`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
          isUrgent
            ? 'bg-rose-500/15 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
            : 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
        } ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
        <span>-{state.formatted}</span>
      </span>
    );
  }

  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
        isUrgent
          ? 'bg-gradient-to-r from-rose-500/15 via-orange-500/15 to-amber-500/15 dark:from-rose-950/40 dark:via-orange-950/30 dark:to-amber-950/40 border-rose-300/80 dark:border-rose-700/80 shadow-xs ring-1 ring-rose-400/20'
          : 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/15 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/30 border-amber-300/80 dark:border-amber-700/80 shadow-xs'
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`p-1.5 rounded-lg ${
            isUrgent ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-white'
          }`}
        >
          {isUrgent ? <Flame className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-black uppercase tracking-wider ${
                isUrgent ? 'text-rose-700 dark:text-rose-300' : 'text-amber-800 dark:text-amber-300'
              }`}
            >
              {isUrgent ? 'Kick-Off Imminente' : 'Incontro Nelle 24 Ore'}
            </span>
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isUrgent ? 'bg-rose-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isUrgent ? 'bg-rose-500' : 'bg-amber-500'
                }`}
              />
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">
            Tempo mancante all&apos;inizio
          </div>
        </div>
      </div>

      <div
        className={`font-mono font-black text-xs sm:text-sm px-2.5 py-1 rounded-lg border shadow-2xs ${
          isUrgent
            ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-amber-300 dark:border-amber-700'
        }`}
      >
        {state.formatted}
      </div>
    </div>
  );
};
