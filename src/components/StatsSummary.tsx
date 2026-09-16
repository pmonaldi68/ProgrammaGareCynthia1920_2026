import React from 'react';
import { Partita } from '../types';
import { Shield, Home, Bus, Calendar, MapPin } from 'lucide-react';

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
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Partite</p>
          <p className="text-lg font-bold text-slate-800">
            {partite.length}
            {totalAvailable !== partite.length && (
              <span className="text-xs font-normal text-slate-400 ml-1">su {totalAvailable}</span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
          <Home className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Casa</p>
          <p className="text-lg font-bold text-emerald-800">{homeCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
          <Bus className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trasferta</p>
          <p className="text-lg font-bold text-amber-800">{awayCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categorie</p>
          <p className="text-lg font-bold text-indigo-900">{categoriesCount}</p>
        </div>
      </div>
    </div>
  );
};
