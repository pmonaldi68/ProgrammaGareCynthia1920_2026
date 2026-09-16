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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Partite</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {partite.length}
            {totalAvailable !== partite.length && (
              <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">su {totalAvailable}</span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
          <Home className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">In Casa</p>
          <p className="text-lg font-bold text-emerald-800 dark:text-emerald-400">{homeCount}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
          <Bus className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trasferta</p>
          <p className="text-lg font-bold text-amber-800 dark:text-amber-400">{awayCount}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categorie</p>
          <p className="text-lg font-bold text-indigo-900 dark:text-indigo-300">{categoriesCount}</p>
        </div>
      </div>
    </div>
  );
};
