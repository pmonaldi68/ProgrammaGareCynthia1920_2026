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
  Activity,
  ClipboardList,
  ChevronRight,
  Layers,
  Sparkles,
  Smartphone,
  ExternalLink,
  Archive,
  Download,
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
  onOpenLocandinaSingola?: () => void;
  onOpenTabellino?: () => void;
  onOpenFoglioGara?: () => void;
  sheetUrl: string;
}

const ADMIN_PASSWORD = 'Admin1234';
const AUTH_STORAGE_KEY = 'cynthia_admin_authenticated';

type AdminTab = 'all' | 'match' | 'data' | 'system';

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
  onOpenLocandinaSingola,
  onOpenTabellino,
  onOpenFoglioGara,
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

  const [activeTab, setActiveTab] = useState<AdminTab>('all');
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [notificationTestStatus, setNotificationTestStatus] = useState<string | null>(null);

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

  const handleTestNotification = async () => {
    setNotificationTestStatus('Richiesta autorizzazione...');
    try {
      const perm = await requestNotificationPermission();
      if (perm === 'granted') {
        setNotificationTestStatus('Notifica inviata con successo!');
        await sendWebNotification(
          '⚽ ASD Cynthia 1920 • Test Notifica',
          'Notifiche Web Push attive! Riceverai avvisi in tempo reale per cambi orario e campo delle gare seguite.'
        );
      } else {
        setNotificationTestStatus('Autorizzazione negata nel browser.');
      }
    } catch (err) {
      setNotificationTestStatus('Errore invio notifica.');
    }
    setTimeout(() => setNotificationTestStatus(null), 4000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale Fisso e Compatto per Smartphone */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-sky-700 dark:from-slate-950 dark:via-sky-950 dark:to-slate-900 text-white px-4 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between border-b border-white/10 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20 shrink-0">
              <Shield className="w-5 h-5 text-sky-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base leading-tight truncate">
                  Area Amministrazione
                </h3>
                {isAuthenticated && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Attivo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-sky-200/80 truncate">
                Cynthia 1920 • Strumenti & Gestione
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Disconnetti sessione amministratore"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Esci</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Chiudi"
              aria-label="Chiudi finestra"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo Modale Scrollabile */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-4">
          {!isAuthenticated ? (
            /* Schermata Login Password */
            <form onSubmit={handleLogin} className="space-y-4 py-2">
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center mx-auto mb-3 border border-sky-100 dark:border-sky-900 shadow-sm">
                  <Lock className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  Accesso Riservato Staff
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Inserisci la password di amministrazione per accedere a convocazioni, referti gara, locandine e configurazioni.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
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
                    autoComplete="current-password"
                    className="w-full px-3.5 py-3 pr-11 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                    title={showPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {authError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {authError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-sky-700 hover:bg-sky-800 active:scale-[0.98] transition shadow-md shadow-sky-700/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Sblocca Strumenti Admin</span>
              </button>
            </form>
          ) : (
            /* Pannello Controlli Amministrazione Riorganizzato & Mobile-Friendly */
            <div className="space-y-4">
              {/* Barra Categorie a Schede Rapide (Touch-friendly per smartphone) */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tutte</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('match')}
                  className={`flex-1 min-w-[90px] py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'match'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400'
                  }`}
                >
                  <span>⚽ Gara (5)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('data')}
                  className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'data'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  <span>📊 Dati (4)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('system')}
                  className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'system'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  <span>⚙️ Sistema</span>
                </button>
              </div>

              {/* GRUPPO 1: ⚽ STRUMENTI GARA & PANCHINA */}
              {(activeTab === 'all' || activeTab === 'match') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                      <span>⚽ Strumenti Gara & Panchina</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 font-bold">
                        Giorno della Gara
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {/* 1.1 FOGLIO GARA PANCHINA (REFERTO A4 FEDELE) */}
                    {onOpenFoglioGara && (
                      <button
                        id="admin-btn-foglio-gara"
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenFoglioGara();
                        }}
                        className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-sky-300 dark:border-sky-700/80 bg-gradient-to-r from-sky-50 via-blue-50/70 to-indigo-50/50 dark:from-sky-950/40 dark:via-blue-950/30 dark:to-indigo-950/20 hover:from-sky-100 hover:to-blue-100 dark:hover:from-sky-900/50 dark:hover:to-blue-900/40 text-left transition group shadow-xs active:scale-[0.99] cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-sky-700 text-white shadow-sm shrink-0">
                            <ClipboardList className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              <span>Foglio Gara Panchina (Referto A4)</span>
                              <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-amber-500 text-white shadow-2xs">
                                Ufficiale A4
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              Formazioni, cambi, gol e note mister pronti da stampare o compilare a penna
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-sky-200 dark:border-sky-700 shadow-2xs shrink-0 flex items-center gap-1 ml-2">
                          <span>Apri</span>
                          <ChevronRight className="w-3.5 h-3.5 text-sky-500" />
                        </span>
                      </button>
                    )}

                    {/* 1.2 CONVOCAZIONI GARA & WHATSAPP */}
                    {onOpenConvocazioni && (
                      <button
                        id="admin-btn-convocazioni"
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenConvocazioni();
                        }}
                        className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/50 dark:hover:to-teal-900/40 text-left transition group shadow-xs active:scale-[0.99] cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                            <Users className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              <span>Convocazioni Gara & WhatsApp</span>
                              <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-emerald-600 text-white shadow-2xs">
                                Rose & Messaggio
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              Carica rosa della categoria, spunta fino a 25 convocati e invia su WhatsApp
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-2xs shrink-0 flex items-center gap-1 ml-2">
                          <span>Apri</span>
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                        </span>
                      </button>
                    )}

                    {/* 1.3 TABELLINO GARA & DIRETTA LIVE */}
                    {onOpenTabellino && (
                      <button
                        id="admin-btn-tabellino"
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenTabellino();
                        }}
                        className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-gradient-to-r from-rose-50/70 to-amber-50/50 dark:from-rose-950/30 dark:to-amber-950/20 hover:from-rose-100 hover:to-amber-100 dark:hover:from-rose-900/40 dark:hover:to-amber-900/30 text-left transition group shadow-xs active:scale-[0.99] cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-sm shrink-0">
                            <Activity className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              <span>Tabellino Gara & Diretta Live</span>
                              <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-rose-600 text-white shadow-2xs flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                Live
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              Punteggio in tempo reale, cronometro, marcatori e aggiornamenti rapidi
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-700 shadow-2xs shrink-0 flex items-center gap-1 ml-2">
                          <span>Live</span>
                          <ChevronRight className="w-3.5 h-3.5 text-rose-500" />
                        </span>
                      </button>
                    )}

                    {/* 1.4 CREA LOCANDINA GARE A4 (PROGRAMMA) */}
                    {onOpenLocandina && (
                      <button
                        id="admin-btn-locandina"
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenLocandina();
                        }}
                        className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-800/80 bg-gradient-to-r from-cyan-50/70 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/20 hover:from-cyan-100 hover:to-sky-100 dark:hover:from-cyan-900/40 dark:hover:to-sky-900/30 text-left transition group shadow-xs active:scale-[0.99] cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-cyan-700 text-white shadow-sm shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              <span>Locandina Programma Gare (A4)</span>
                              <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-cyan-600 text-white shadow-2xs">
                                Poster
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              Genera il manifesto riepilogativo di tutte le partite con logo per la bacheca
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-cyan-200 dark:border-cyan-700 shadow-2xs shrink-0 flex items-center gap-1 ml-2">
                          <span>Crea</span>
                          <ChevronRight className="w-3.5 h-3.5 text-cyan-500" />
                        </span>
                      </button>
                    )}

                    {/* 1.5 LOCANDINA SINGOLA PARTITA (SFONDO SPLASH BALL) */}
                    {onOpenLocandinaSingola && (
                      <button
                        id="admin-btn-locandina-singola"
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenLocandinaSingola();
                        }}
                        className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-gradient-to-r from-amber-50/80 via-sky-50 to-blue-50 dark:from-amber-950/40 dark:via-sky-950/30 dark:to-blue-950/20 hover:from-amber-100 hover:to-sky-100 dark:hover:from-amber-900/50 dark:hover:to-sky-900/40 text-left transition group shadow-xs active:scale-[0.99] ring-1 ring-amber-400/30 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-sky-600 text-white shadow-sm shrink-0">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              <span>Locandina Singola Partita (Matchday)</span>
                              <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-amber-500 text-white shadow-2xs">
                                Sfondo Splash
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              Grafica social ufficiale 1:1, Story e A4 con sfondo palla splash blu e dettagli gara
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-200 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 shadow-2xs shrink-0 flex items-center gap-1 ml-2">
                          <span>Nuovo 🎨</span>
                          <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* GRUPPO 2: 📊 DATI, CALENDARIO & REPORT */}
              {(activeTab === 'all' || activeTab === 'data') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <span>📊 Dati & Sincronizzazione</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {/* 2.1 AGGIORNA DATI ADESSO */}
                    <button
                      id="admin-btn-refresh"
                      type="button"
                      onClick={() => onRefresh()}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/30 hover:bg-sky-100/70 dark:hover:bg-sky-900/40 text-left transition group disabled:opacity-60 active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-sky-700 text-white shadow-sm shrink-0">
                          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {isLoading ? 'Sincronizzazione in corso...' : 'Aggiorna Dati Partite'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            Scarica subito l'ultima versione del calendario dal foglio Google online
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-sky-200 dark:border-sky-700 shadow-2xs shrink-0 flex items-center gap-1 ml-2">
                        <span>Sync</span>
                        <ChevronRight className="w-3.5 h-3.5 text-sky-500" />
                      </span>
                    </button>

                    {/* 2.2 CONFIGURA GOOGLE SHEETS */}
                    <button
                      id="admin-btn-sheets"
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSheetConfig();
                      }}
                      className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 text-left transition group active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-emerald-700 text-white shadow-sm shrink-0">
                          <Sheet className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            Configura Google Sheets
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            Modifica il link al foglio Google del calendario partite e nome scheda
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-2xs shrink-0 flex items-center gap-1 ml-2">
                        <span>Gestisci</span>
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                      </span>
                    </button>

                    {/* 2.3 REPORT PDF SETTIMANALE */}
                    {onOpenPdfExport && (
                      <button
                        id="admin-btn-export-pdf"
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPdfExport();
                        }}
                        className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/20 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/30 text-left transition group active:scale-[0.99] cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-indigo-700 text-white shadow-sm shrink-0">
                            <FileDown className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              Report Gare PDF Settimanale
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              Esporta l'elenco stampabile in A4 di tutte le categorie della settimana
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 shadow-2xs shrink-0 flex items-center gap-1 ml-2">
                          <span>Stampa</span>
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
                        </span>
                      </button>
                    )}

                    {/* 2.4 SCARICA TUTTO IL CODICE PROGETTO (ZIP) */}
                    <a
                      id="admin-btn-download-zip"
                      href="./cynthia1920-app-source.zip"
                      download="cynthia1920-app-source.zip"
                      className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-violet-300 dark:border-violet-700/80 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/30 hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-900/50 dark:hover:to-purple-900/40 text-left transition group active:scale-[0.99] cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-violet-700 text-white shadow-sm shrink-0">
                          <Archive className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            <span>Scarica Tutto il Codice (ZIP)</span>
                            <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-violet-600 text-white shadow-2xs">
                              Sorgente Completo
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            Archivio compresso con tutti i sorgenti React, componenti, configurazioni e icone
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-violet-700 dark:text-violet-300 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-violet-300 dark:border-violet-700 shadow-2xs shrink-0 flex items-center gap-1 ml-2">
                        <Download className="w-3.5 h-3.5 text-violet-600" />
                        <span>ZIP</span>
                      </span>
                    </a>
                  </div>
                </div>
              )}

              {/* GRUPPO 3: ⚙️ ASPETTO, NOTIFICHE & SISTEMA */}
              {(activeTab === 'all' || activeTab === 'system') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span>⚙️ Personalizzazione & Sistema</span>
                    </span>
                  </div>

                  {/* 3.1 CARD TEMA VISIVO (DARK MODE & COLORI) */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        {resolvedTheme === 'dark' ? (
                          <Moon className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Sun className="w-4 h-4 text-amber-500" />
                        )}
                        <span>Modalità Schermo (Dark / Light)</span>
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {resolvedTheme === 'dark' ? 'Scuro 🌙' : 'Chiaro ☀️'}
                      </span>
                    </div>

                    {/* Tasti Chiaro / Scuro / Sistema ottimizzati touch */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                          theme === 'light'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        <span>Chiaro</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        <span>Scuro</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme('system')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                          theme === 'system'
                            ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                        }`}
                        title="Segue automaticamente il tema dello smartphone"
                      >
                        <Laptop className="w-4 h-4" />
                        <span>Auto</span>
                      </button>
                    </div>

                    {/* Selettore Colore Primario Compatto */}
                    <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-sky-500" />
                          <span>Tonalità Colore Principale</span>
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
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
                              className={`p-2 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                                isSel
                                  ? 'border-sky-500 bg-sky-100/60 dark:bg-sky-950/60 ring-1 ring-sky-500/30 font-bold'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <span
                                className="w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center shadow-2xs"
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
                  </div>

                  {/* 3.2 TEST NOTIFICHE PUSH */}
                  <div className="p-3 sm:p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm shrink-0">
                        <BellRing className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          Test Notifiche Push
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {notificationTestStatus || 'Invia alert di prova su questo smartphone'}
                        </div>
                      </div>
                    </div>
                    <button
                      id="admin-btn-test-notification"
                      type="button"
                      onClick={handleTestNotification}
                      className="text-xs font-bold text-amber-800 dark:text-amber-200 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 shadow-2xs shrink-0 hover:bg-amber-100 dark:hover:bg-slate-700 transition active:scale-95 cursor-pointer"
                    >
                      Prova 🔔
                    </button>
                  </div>

                  {/* 3.3 GITHUB & AUTOMAZIONI */}
                  <button
                    id="admin-btn-github"
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenGitHubGuide();
                    }}
                    className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-left transition group active:scale-[0.99] cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 text-white shadow-sm shrink-0">
                        <Github className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          GitHub & Automazioni
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          Repository, sync automatico e deployment online
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 flex items-center gap-1 ml-2">
                      <span>Guida</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </span>
                  </button>

                  {/* 3.4 DETTAGLIO FOGLIO GOOGLE ATTIVO */}
                  {sheetUrl && (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                      <div className="min-w-0 truncate">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Foglio attivo:</span>{' '}
                        <span className="font-mono text-slate-600 dark:text-slate-400 truncate">{sheetUrl}</span>
                      </div>
                      <a
                        href={sheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 dark:text-sky-400 hover:underline shrink-0 p-1 font-semibold flex items-center gap-0.5"
                        title="Apri foglio Google nel browser"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Apri</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
