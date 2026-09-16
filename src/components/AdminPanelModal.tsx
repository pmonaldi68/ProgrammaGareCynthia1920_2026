import React, { useState } from 'react';
import { Lock, Unlock, Shield, RefreshCw, Sheet, Github, X, Eye, EyeOff, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenSheetConfig: () => void;
  onOpenGitHubGuide: () => void;
  sheetUrl: string;
}

const ADMIN_PASSWORD = 'Admin1234';
const AUTH_STORAGE_KEY = 'cynthia_admin_authenticated';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  onRefresh,
  onOpenSheetConfig,
  onOpenGitHubGuide,
  sheetUrl,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError(null);
      setInputPassword('');
      try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
      } catch {
        // Ignora
      }
    } else {
      setAuthError('Password errata. Riprova.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setInputPassword('');
    setAuthError(null);
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignora
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-sky-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20">
              <Shield className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Area Amministrazione</h3>
              <p className="text-xs text-sky-200/80">Gestione e configurazione Cynthia 1920</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Modale */}
        <div className="p-6">
          {!isAuthenticated ? (
            /* Schermata Login Password */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mx-auto mb-3 border border-sky-100 shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-800 text-base">Accesso Riservato</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Inserisci la password amministratore per gestire i collegamenti a Google Sheets e GitHub Actions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password Amministratore
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={inputPassword}
                    onChange={(e) => {
                      setInputPassword(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Inserisci password..."
                    autoFocus
                    className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title={showPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authError && (
                  <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {authError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 active:scale-[0.99] transition shadow-md shadow-sky-700/20 flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Sblocca Area Admin</span>
              </button>
            </form>
          ) : (
            /* Pannello Controlli Riservati */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Autenticato come Admin
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition"
                  title="Disconnetti"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Esci</span>
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Qui puoi forzare l'aggiornamento immediato del calendario, modificare il link al foglio Google o consultare le azioni GitHub:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Pulsante Aggiorna */}
                <button
                  id="admin-btn-refresh"
                  onClick={() => {
                    onRefresh();
                  }}
                  disabled={isLoading}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100/70 text-left transition group disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-700 text-white shadow-sm">
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-sky-900">
                        {isLoading ? 'Aggiornamento in corso...' : 'Aggiorna Dati Adesso'}
                      </div>
                      <div className="text-xs text-slate-500">
                        Scarica l'ultima versione delle partite dal foglio senza attendere
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-sky-700 bg-white px-2.5 py-1 rounded-lg border border-sky-200 shadow-2xs">
                    Esegui
                  </span>
                </button>

                {/* 2. Pulsante Configura Google Sheets */}
                <button
                  id="admin-btn-sheets"
                  onClick={() => {
                    onClose();
                    onOpenSheetConfig();
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-left transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-700 text-white shadow-sm">
                      <Sheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-emerald-900">
                        Configura Google Sheets
                      </div>
                      <div className="text-xs text-slate-500">
                        Visualizza o modifica l'URL e la scheda del foglio collegato
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                    Gestisci
                  </span>
                </button>

                {/* 3. Pulsante GitHub Actions */}
                <button
                  id="admin-btn-github"
                  onClick={() => {
                    onClose();
                    onOpenGitHubGuide();
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-white shadow-sm">
                      <Github className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">
                        GitHub & Automazioni
                      </div>
                      <div className="text-xs text-slate-500">
                        Dettagli repository, sync automatico e deployment Pages
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    Info
                  </span>
                </button>
              </div>

              {sheetUrl && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 truncate">
                  <span className="font-semibold text-slate-700">Foglio attivo:</span>{' '}
                  <span className="font-mono text-slate-600">{sheetUrl}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
