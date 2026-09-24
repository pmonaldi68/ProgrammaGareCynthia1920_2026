import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  RefreshCw,
  Sheet,
  Github,
  X,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Laptop,
  BellRing,
  FileDown,
  Palette,
  Check,
  Users,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useTheme, COLOR_THEME_OPTIONS, PrimaryColor } from '../context/ThemeContext';
import { sendWebNotification, requestNotificationPermission } from '../services/notificationService';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenSheetConfig: () => void;
  onOpenGitHubGuide: () => void;
  onOpenPdfExport?: () => void;
  onOpenConvocazioni?: () => void;
  onOpenLocandina?: () => void;
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
  onOpenPdfExport,
  onOpenConvocazioni,
  onOpenLocandina,
  sheetUrl,
}) => {
  const { theme, setTheme, resolvedTheme, primaryColor, setPrimaryColor } = useTheme();

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
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-sky-700 dark:from-slate-950 dark:via-sky-950 dark:to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-white/10 dark:border-slate-800">
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
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center mx-auto mb-3 border border-sky-100 dark:border-sky-900 shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-base">Accesso Riservato</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Inserisci la password amministratore per gestire tema, collegamenti a Google Sheets e GitHub.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
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
                    className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    title={showPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1.5 flex items-center gap-1">
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
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Autenticato come Admin
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                  title="Disconnetti"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Esci</span>
                </button>
              </div>

              {/* SEZIONE TEMA: DARK MODE / LIGHT / SISTEMA */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    {resolvedTheme === 'dark' ? (
                      <Moon className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500" />
                    )}
                    Tema Visivo (Dark Mode)
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Attuale: <strong className="text-slate-800 dark:text-slate-200">{resolvedTheme === 'dark' ? 'Scuro 🌙' : 'Chiaro ☀️'}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border ${
                      theme === 'light'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Chiaro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border ${
                      theme === 'dark'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Scuro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border ${
                      theme === 'system'
                        ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                    title="Segue automaticamente le impostazioni del sistema operativo / smartphone"
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Auto Sistema</span>
                  </button>
                </div>
                
                {/* Selettore Tonalità Principale */}
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-sky-500" />
                      Tonalità Principale (Colore Primario)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {COLOR_THEME_OPTIONS.find((c) => c.id === primaryColor)?.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {COLOR_THEME_OPTIONS.map((opt) => {
                      const isSel = primaryColor === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPrimaryColor(opt.id as PrimaryColor)}
                          className={`p-1.5 rounded-lg border text-left flex items-center gap-2 transition ${
                            isSel
                              ? 'border-sky-500 bg-sky-100/50 dark:bg-sky-950/50 shadow-2xs ring-1 ring-sky-500/30 font-bold'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: opt.hex }}
                          >
                            {isSel && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                          </span>
                          <span className="text-[11px] truncate">{opt.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5">
                  "Auto Sistema" rileva automaticamente la modalità scura/chiara dello smartphone o del computer dell'utente.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {/* 1. Pulsante Aggiorna */}
                <button
                  id="admin-btn-refresh"
                  onClick={() => {
                    onRefresh();
                  }}
                  disabled={isLoading}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/30 hover:bg-sky-100/70 dark:hover:bg-sky-900/40 text-left transition group disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-700 text-white shadow-sm">
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-sky-900 dark:group-hover:text-sky-200">
                        {isLoading ? 'Aggiornamento in corso...' : 'Aggiorna Dati Adesso'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Scarica l'ultima versione delle partite dal foglio senza attendere
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-700 shadow-2xs">
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
                  className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 text-left transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-700 text-white shadow-sm">
                      <Sheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-900 dark:group-hover:text-emerald-200">
                        Configura Google Sheets
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Visualizza o modifica l'URL e la scheda del foglio collegato
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-2xs">
                    Gestisci
                  </span>
                </button>

                {/* 3. Convocazioni & WhatsApp da Foglio Google */}
                {onOpenConvocazioni && (
                  <button
                    id="admin-btn-convocazioni"
                    onClick={() => {
                      onClose();
                      onOpenConvocazioni();
                    }}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/50 dark:hover:to-teal-900/40 text-left transition group shadow-2xs ring-1 ring-emerald-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-950 dark:group-hover:text-emerald-200 flex items-center gap-1.5">
                          <span>Convocazioni Gara & WhatsApp</span>
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-600 text-white">
                            Novità
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Importa giocatori da un altro foglio Google e genera messaggio WhatsApp
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                      Apri 💬
                    </span>
                  </button>
                )}

                {/* 4. Locandina Gare Ufficiale A4 */}
                {onOpenLocandina && (
                  <button
                    id="admin-btn-locandina"
                    onClick={() => {
                      onClose();
                      onOpenLocandina();
                    }}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-sky-300 dark:border-sky-700/80 bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-950/40 dark:to-cyan-950/30 hover:from-sky-100 hover:to-cyan-100 dark:hover:from-sky-900/50 dark:hover:to-cyan-900/40 text-left transition group shadow-2xs ring-1 ring-sky-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sky-700 text-white shadow-sm">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-950 dark:group-hover:text-sky-200 flex items-center gap-1.5">
                          <span>Crea Locandina Gare A4</span>
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-500 text-white">
                            A4
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Genera il poster ufficiale A4 con logo al centro in alto per bacheca e social
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-sky-300 dark:border-sky-700 shadow-2xs">
                      Crea 📄
                    </span>
                  </button>
                )}

                {/* 4. Pulsante GitHub Actions */}
                <button
                  id="admin-btn-github"
                  onClick={() => {
                    onClose();
                    onOpenGitHubGuide();
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-left transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 dark:bg-slate-700 text-white shadow-sm">
                      <Github className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white">
                        GitHub & Automazioni
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Dettagli repository, sync automatico e deployment Pages
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                    Info
                  </span>
                </button>

                {/* 4. Test Notifica Push */}
                <button
                  id="admin-btn-test-notification"
                  type="button"
                  onClick={async () => {
                    const perm = await requestNotificationPermission();
                    if (perm === 'granted') {
                      await sendWebNotification(
                        '⚽ ASD Cynthia 1920 • Test Notifica',
                        'Notifiche Web Push attive! Riceverai avvisi in tempo reale per cambi orario e campo delle categorie seguite.'
                      );
                    } else {
                      alert('Per ricevere il test, consenti le notifiche nel tuo browser.');
                    }
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 text-left transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500 text-white shadow-sm">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white">
                        Invia Notifica Push di Prova
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Verifica ricezione alert Web Push sul tuo dispositivo
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 shadow-2xs">
                    Test
                  </span>
                </button>

                {/* 5. Genera Report PDF Settimanale */}
                {onOpenPdfExport && (
                  <button
                    id="admin-btn-export-pdf"
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPdfExport();
                    }}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/60 dark:bg-sky-950/20 hover:bg-sky-100/60 dark:hover:bg-sky-900/30 text-left transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sky-700 text-white shadow-sm">
                        <FileDown className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white">
                          Genera e Scarica Report PDF Settimanale
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Formatta per stampa A4 o condivisione rapida su gruppi WhatsApp
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-sky-300 dark:border-sky-700 shadow-2xs">
                      PDF
                    </span>
                  </button>
                )}
              </div>

              {sheetUrl && (
                <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Foglio attivo:</span>{' '}
                  <span className="font-mono text-slate-600 dark:text-slate-400">{sheetUrl}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
