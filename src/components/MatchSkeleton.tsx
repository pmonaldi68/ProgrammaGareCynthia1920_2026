import React from 'react';
import { ViewMode } from '../types';

interface MatchSkeletonProps {
  viewMode?: ViewMode;
  count?: number;
}

export const MatchSkeleton: React.FC<MatchSkeletonProps> = ({ viewMode = 'cards', count = 6 }) => {
  const items = Array.from({ length: count });

  if (viewMode === 'table') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-sky-100 dark:border-slate-800 bg-sky-50/50 dark:bg-sky-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-sky-900 dark:text-sky-200">
              Caricamento programma gare da Google Sheets...
            </span>
          </div>
          <div className="h-4 w-24 bg-sky-100 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-sky-50/70 dark:bg-slate-800/70 border-b border-sky-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4"><div className="h-3.5 w-20 bg-sky-200/70 dark:bg-slate-700 rounded animate-pulse" /></th>
                <th className="py-3.5 px-4"><div className="h-3.5 w-28 bg-sky-200/70 dark:bg-slate-700 rounded animate-pulse" /></th>
                <th className="py-3.5 px-4"><div className="h-3.5 w-32 bg-sky-200/70 dark:bg-slate-700 rounded animate-pulse" /></th>
                <th className="py-3.5 px-4"><div className="h-3.5 w-32 bg-sky-200/70 dark:bg-slate-700 rounded animate-pulse" /></th>
                <th className="py-3.5 px-4"><div className="h-3.5 w-36 bg-sky-200/70 dark:bg-slate-700 rounded animate-pulse" /></th>
                <th className="py-3.5 px-4"><div className="h-3.5 w-20 bg-sky-200/70 dark:bg-slate-700 rounded animate-pulse ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-5 w-24 bg-sky-100/80 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-24 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-36 bg-sky-100/70 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-32 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-28 bg-sky-50 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-7 w-20 bg-sky-100/80 dark:bg-slate-800 rounded-lg ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (viewMode === 'fields') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-200/80 dark:border-slate-800 border-l-4 border-l-sky-600 p-4 animate-pulse flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-sky-100 dark:bg-slate-800 rounded" />
            <div className="h-3.5 w-64 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
          <div className="h-10 w-32 bg-sky-100 dark:bg-slate-800 rounded-xl" />
        </div>
        {Array.from({ length: 2 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-200/70 dark:border-slate-800 border-l-4 border-l-sky-500/60 p-4 space-y-3 animate-pulse"
          >
            <div className="h-6 w-56 bg-sky-100/90 dark:bg-slate-800 rounded" />
            <div className="h-12 w-full bg-sky-50/70 dark:bg-slate-800/70 rounded-xl" />
            <div className="h-12 w-full bg-slate-50 dark:bg-slate-800/70 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (viewMode === 'timeline') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-200/80 dark:border-slate-800 p-4 sm:p-5 animate-pulse space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="h-6 w-48 bg-sky-100 dark:bg-slate-800 rounded-lg" />
            <div className="h-8 w-52 bg-sky-50 dark:bg-slate-800 rounded-xl" />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-14 bg-sky-50/80 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-200/80 dark:border-slate-800 p-4 space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-sky-50/70 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="match-skeleton-loader" className="space-y-4" aria-busy="true" aria-label="Caricamento programma gare">
      <div className="bg-gradient-to-r from-white via-sky-50/80 to-white dark:from-slate-900 dark:via-sky-950/30 dark:to-slate-900 border border-sky-200/90 dark:border-sky-900/60 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-sky-900 dark:text-sky-200">
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-sky-600 border-t-amber-400 animate-spin" />
          <span>Aggiornamento programma gare Cynthia 1920 in corso...</span>
        </div>
        <span className="text-sky-600 dark:text-sky-400 font-mono text-[11px] tabular-nums">Sync</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-slate-800 border-l-4 border-l-sky-400/70 overflow-hidden animate-pulse flex flex-col justify-between shadow-2xs"
          >
            <div className="px-5 pt-4 pb-3 bg-sky-50/40 dark:bg-sky-950/20 border-b border-sky-100/80 dark:border-slate-800 flex items-center justify-between gap-2.5">
              <div className="h-5 w-36 bg-sky-100 dark:bg-slate-800 rounded-md" />
              <div className="h-5 w-16 bg-amber-100/80 dark:bg-slate-800 rounded-md" />
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between gap-2">
                <div className="h-4 w-36 bg-sky-100/80 dark:bg-slate-800 rounded" />
                <div className="h-7 w-16 bg-sky-200/70 dark:bg-slate-800 rounded-lg" />
              </div>

              <div className="space-y-2 py-1">
                <div className="h-11 w-full bg-sky-50/90 dark:bg-slate-800 rounded-xl" />
                <div className="h-px w-full bg-sky-100/60 dark:bg-slate-800" />
                <div className="h-11 w-full bg-slate-100/80 dark:bg-slate-800 rounded-xl" />
              </div>

              <div className="pt-3 border-t border-sky-100/70 dark:border-slate-800 space-y-2">
                <div className="h-4 w-3/4 bg-sky-100/70 dark:bg-slate-800 rounded" />
                <div className="h-3.5 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-sky-100/70 dark:border-slate-800">
                <div className="flex-1 h-11 bg-emerald-100/70 dark:bg-slate-800 rounded-xl" />
                <div className="h-11 w-11 bg-sky-100/80 dark:bg-slate-800 rounded-xl" />
                <div className="h-11 w-11 bg-sky-50 dark:bg-slate-800 rounded-xl" />
                <div className="h-11 w-11 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
