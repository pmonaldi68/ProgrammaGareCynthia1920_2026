import React from 'react';

interface MatchSkeletonProps {
  viewMode?: 'cards' | 'table';
  count?: number;
}

export const MatchSkeleton: React.FC<MatchSkeletonProps> = ({ viewMode = 'cards', count = 6 }) => {
  const items = Array.from({ length: count });

  if (viewMode === 'table') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 bg-sky-50/50 dark:bg-sky-950/20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-sky-600 border-t-transparent animate-spin"></div>
            <span className="text-xs font-bold text-sky-800 dark:text-sky-300">
              Caricamento programma gare da Google Sheets in corso...
            </span>
          </div>
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></th>
                <th className="py-3 px-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></th>
                <th className="py-3 px-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></th>
                <th className="py-3 px-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></th>
                <th className="py-3 px-4"><div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></th>
                <th className="py-3 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-6 w-24 bg-sky-100 dark:bg-sky-950 rounded-lg"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1.5">
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-3 w-16 bg-amber-200/60 dark:bg-amber-900/40 rounded"></div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/50 rounded-xl p-3 flex items-center justify-between text-xs font-semibold text-sky-900 dark:text-sky-200">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-sky-600 border-t-transparent animate-spin"></div>
          <span>Sincronizzazione partite in corso da Google Sheets...</span>
        </div>
        <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">Caricamento...</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {items.map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden animate-pulse flex flex-col justify-between"
          >
            {/* Header Scheda Skeleton */}
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 sm:px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sky-300 dark:bg-sky-700"></div>
                <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
              </div>
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            </div>

            {/* Corpo Scheda Skeleton */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
              {/* Data & Ora */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-20 bg-sky-200 dark:bg-sky-900 rounded"></div>
                  <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="h-7 w-20 bg-amber-300 dark:bg-amber-800 rounded-xl"></div>
              </div>

              {/* Squadre */}
              <div className="space-y-2">
                <div className="h-11 w-full bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700"></div>
                <div className="flex justify-center">
                  <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                </div>
                <div className="h-11 w-full bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700"></div>
              </div>

              {/* Campo & Indirizzo */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>

              {/* Bottoni Azioni */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-10 bg-sky-200 dark:bg-sky-800 rounded-xl"></div>
                <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
