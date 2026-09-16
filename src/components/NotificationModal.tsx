import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Check, Shield, AlertTriangle, Clock, MapPin, X, Info } from 'lucide-react';
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getFollowedCategories,
  saveFollowedCategories,
  getVariationsHistory,
  normalizeCategoryName,
} from '../services/notificationService';
import { MatchVariation } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCampionati: string[];
  recentVariations: MatchVariation[];
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  availableCampionati,
  recentVariations,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [followedCategories, setFollowedCategories] = useState<string[]>([]);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
      setFollowedCategories(getFollowedCategories());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const supported = isPushNotificationSupported();

  const handleToggleCategory = (campionato: string) => {
    const norm = normalizeCategoryName(campionato);
    const exists = followedCategories.some(c => normalizeCategoryName(c) === norm);
    let updated: string[];
    if (exists) {
      updated = followedCategories.filter(c => normalizeCategoryName(c) !== norm);
    } else {
      updated = [...followedCategories, campionato];
    }
    setFollowedCategories(updated);
    saveFollowedCategories(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSelectAllCategories = () => {
    setFollowedCategories(availableCampionati);
    saveFollowedCategories(availableCampionati);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleClearCategories = () => {
    setFollowedCategories([]);
    saveFollowedCategories([]);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);
    } finally {
      setIsRequesting(false);
    }
  };

  const history = getVariationsHistory();
  const allVariations = [...recentVariations, ...history].filter(
    (v, i, arr) => arr.findIndex(item => item.timestamp === v.timestamp && item.partitaId === v.partitaId) === i
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-cyan-900 dark:from-slate-950 dark:to-sky-950 text-white px-6 py-4 flex items-center justify-between border-b border-white/10 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <BellRing className="w-5 h-5 text-amber-300" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">Notifiche Variazioni Gare</h2>
              <p className="text-[11px] text-sky-200/80">
                Avviso push per cambi orario e campo su Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenuto scrollabile */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm text-slate-800 dark:text-slate-200">
          {/* Box Stato Permessi Notifiche Web Push */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Permesso Notifiche Browser
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  permission === 'granted'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : permission === 'denied'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                }`}
              >
                {permission === 'granted'
                  ? 'Abilitate ✅'
                  : permission === 'denied'
                  ? 'Bloccate 🚫'
                  : 'Da attivare ⚠️'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Ricevi notifiche push istantanee sul tuo smartphone o PC quando il programma gare viene modificato su Google Sheets per le squadre che segui.
            </p>

            {permission !== 'granted' && (
              <button
                type="button"
                id="btn-request-notification-permission"
                onClick={handleRequestPermission}
                disabled={isRequesting || !supported}
                className="w-full mt-2 py-2 px-4 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 min-h-[40px]"
              >
                <BellRing className="w-4 h-4" />
                <span>{isRequesting ? 'Richiesta in corso...' : 'Attiva Notifiche Web Push'}</span>
              </button>
            )}

            {!supported && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                Il browser corrente non supporta la Web Push API.
              </p>
            )}
          </div>

          {/* Selezione Categorie da Seguire */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Categorie Seguite
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Scegli per quali categorie ricevere avvisi di variazione
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllCategories}
                  className="text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:underline"
                >
                  Tutte
                </button>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleClearCategories}
                  className="text-[11px] font-bold text-slate-500 hover:underline"
                >
                  Nessuna
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableCampionati.map(camp => {
                const norm = normalizeCategoryName(camp);
                const isSelected = followedCategories.some(c => normalizeCategoryName(c) === norm);

                return (
                  <button
                    key={camp}
                    type="button"
                    onClick={() => handleToggleCategory(camp)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between gap-1.5 min-h-[44px] ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-600 text-sky-950 dark:text-sky-100 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{camp}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {savedSuccess && (
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                Preferenze salvate automaticamente!
              </p>
            )}
          </div>

          {/* Registro Ultime Variazioni Rilevate */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Ultime Variazioni Rilevate
            </h4>

            {allVariations.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                Nessuna variazione recente di orario o campo registrata. Il sistema controlla automaticamente ogni sincronizzazione.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {allVariations.slice(0, 5).map((v, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-xs text-amber-950 dark:text-amber-200 space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{v.campionato} • {v.squadre}</span>
                      <span className="text-[10px] text-amber-800 dark:text-amber-400">{v.data}</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-900 dark:text-amber-300">
                      {v.changes.map((c, cIdx) => (
                        <li key={cIdx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white transition shadow-sm"
          >
            Fatto
          </button>
        </div>
      </div>
    </div>
  );
};
