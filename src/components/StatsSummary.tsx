import React from 'react';
import { Partita } from '../types';
import { Shield, Home, Bus, Calendar } from 'lucide-react';

interface StatsSummaryProps {
  partite: Partita[];
  totalAvailable: number;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ partite, totalAvailable }) => {
  const homeCount = partite.filter(p => p.isCynthiaCasa).length;
  const awayCount = partite.filter(p => p.isCynthiaOspite).length;
  const categoriesCount = new Set(partite.map(p => p.campionato)).size;

  return (
    <section
      id="stats-summary"
      aria-label="Riepilogo numerico gare"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 my-4 overflow-hidden"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
        <div className="p-4 sm:px-5 flex items-center justify-between gap-3 border-r lg:border-r-0 border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Gare in programma</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums mt-0.5">
              {partite.length}
              {totalAvailable !== partite.length && (
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 ml-1.5">
                  su {totalAvailable}
                </span>
              )}
            </p>
          </div>
          <Shield className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 opacity-85" />
        </div>

        <div className="p-4 sm:px-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">In casa</p>
            <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 tracking-tight tabular-nums mt-0.5">
              {homeCount}
            </p>
          </div>
          <Home className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 opacity-85" />
        </div>

        <div className="p-4 sm:px-5 flex items-center justify-between gap-3 border-r lg:border-r-0 border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">In trasferta</p>
            <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 tracking-tight tabular-nums mt-0.5">
              {awayCount}
            </p>
          </div>
          <Bus className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 opacity-85" />
        </div>

        <div className="p-4 sm:px-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Categorie attive</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums mt-0.5">
              {categoriesCount}
            </p>
          </div>
          <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 opacity-85" />
        </div>
      </div>
    </section>
  );
};
