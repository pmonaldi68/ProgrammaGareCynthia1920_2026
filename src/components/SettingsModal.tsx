import React, { useEffect } from 'react';
import {
  X,
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useTheme, COLOR_THEME_OPTIONS, PrimaryColor } from '../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, resolvedTheme, primaryColor, setPrimaryColor } = useTheme();

  // Chiudi con il tasto Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleResetToDefault = () => {
    setPrimaryColor('sky');
    setTheme('system');
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="settings-modal-content"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-sky-700 dark:from-slate-950 dark:via-sky-950 dark:to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-white/10 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20">
              <Palette className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">Impostazioni & Aspetto</h3>
              <p className="text-xs text-sky-200/80">Personalizza tonalità e modalità visiva</p>
            </div>
          </div>
          <button
            id="btn-close-settings-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Modale */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Sezione 1: Modalità Visiva (Dark / Light / Auto) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                {resolvedTheme === 'dark' ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                Modalità Visiva
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Attuale: <strong className="text-slate-800 dark:text-slate-200">{resolvedTheme === 'dark' ? 'Scuro 🌙' : 'Chiaro ☀️'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                id="btn-theme-mode-light"
                type="button"
                onClick={() => setTheme('light')}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border min-h-[44px] ${
                  theme === 'light'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-100" />
                <span>Chiaro</span>
              </button>

              <button
                id="btn-theme-mode-dark"
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border min-h-[44px] ${
                  theme === 'dark'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-100" />
                <span>Scuro</span>
              </button>

              <button
                id="btn-theme-mode-system"
                type="button"
                onClick={() => setTheme('system')}
                title="Segue automaticamente il tema del tuo smartphone o computer"
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border min-h-[44px] ${
                  theme === 'system'
                    ? 'bg-sky-600 text-white border-sky-700 shadow-xs font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Auto</span>
              </button>
            </div>
          </div>

          {/* Sezione 2: Tonalità Principale (Colore Primario) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-500" />
                Tonalità Principale (Colore Primario)
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                7 Tonalità
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Cambia la sfumatura di accento dell'applicazione per testate, pulsanti, badge e mappe:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COLOR_THEME_OPTIONS.map((opt) => {
                const isSelected = primaryColor === opt.id;
                return (
                  <button
                    key={opt.id}
                    id={`btn-color-theme-${opt.id}`}
                    type="button"
                    onClick={() => setPrimaryColor(opt.id as PrimaryColor)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition relative min-h-[52px] ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 shadow-xs ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {/* Campione Circolare del Colore */}
                    <div
                      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-800"
                      style={{ backgroundColor: opt.hex }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {opt.name}
                        </span>
                        {opt.id === 'sky' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 rounded">
                            Sociale
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {opt.tagline}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nota e Ripristino */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Le preferenze vengono memorizzate automaticamente su questo dispositivo.</span>
            <button
              id="btn-reset-theme-settings"
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ripristina standard</span>
            </button>
          </div>
        </div>

        {/* Footer Modale */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            id="btn-done-settings-modal"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] transition shadow-xs"
          >
            Fatto
          </button>
        </div>
      </div>
    </div>
  );
};
