import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  Wifi,
  BellRing,
  Globe,
  Trash2,
  X,
  Smartphone,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { SheetConfig, Partita } from '../types';
import { buildCsvUrl, parseCSV, mapCsvToPartite } from '../services/sheetService';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SheetConfig;
  partite: Partita[];
  onRefreshData: () => void;
}

interface DiagnosticResult {
  category: string;
  name: string;
  status: 'ok' | 'warning' | 'error' | 'loading';
  message: string;
  details?: string;
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({
  isOpen,
  onClose,
  config,
  partite,
  onRefreshData,
}) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastRunTimestamp, setLastRunTimestamp] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // 1. Diagnosi Sorgente Dati Google Sheet / CSV
    try {
      const sheetUrl = config.sheetUrl;
      if (!sheetUrl) {
        results.push({
          category: 'Sorgente Dati',
          name: 'URL Google Sheet',
          status: 'warning',
          message: 'Nessun URL configurato espressamente.',
          details: 'L\'app sta utilizzando i dati predefiniti o la cache locale.',
        });
      } else {
        const targetCsvUrl = buildCsvUrl(sheetUrl, config.tabName);
        results.push({
          category: 'Sorgente Dati',
          name: 'URL Google Sheet',
          status: 'ok',
          message: 'URL Google Sheet configurato correttamente',
          details: `URL CSV generato: ${targetCsvUrl}`,
        });

        // Test Chiamata HTTP Fetch
        try {
          const startTime = performance.now();
          const response = await fetch(targetCsvUrl, { cache: 'no-store' });
          const latency = Math.round(performance.now() - startTime);

          if (response.ok) {
            const text = await response.text();
            if (
              text.includes('<!DOCTYPE html') ||
              text.includes('<html') ||
              text.includes('Sign in to your Google Account')
            ) {
              results.push({
                category: 'Sorgente Dati',
                name: 'Accessibilità Foglio',
                status: 'error',
                message: 'Il foglio Google è privato o richiede autenticazione.',
                details: 'Imposta la condivisione su "Chiunque abbia il link" -> Visualizzatore.',
              });
            } else {
              const rows = parseCSV(text);
              const testPartite = mapCsvToPartite(rows);

              results.push({
                category: 'Sorgente Dati',
                name: 'Connessione e Risposta HTTP',
                status: 'ok',
                message: `Risposta OK (${response.status}) in ${latency}ms`,
                details: `Scaricati ${rows.length} righe CSV e convertite ${testPartite.length} partite.`,
              });
            }
          } else {
            results.push({
              category: 'Sorgente Dati',
              name: 'Connessione e Risposta HTTP',
              status: 'error',
              message: `Errore HTTP ${response.status}: ${response.statusText}`,
              details: 'Verificare che il foglio sia pubblicato o che l\'URL sia corretto.',
            });
          }
        } catch (err: any) {
          results.push({
            category: 'Sorgente Dati',
            name: 'Connessione e Risposta HTTP',
            status: 'warning',
            message: 'Fetch remota fallita o bloccata da CORS/Rete',
            details: err?.message || 'Errore di rete durante la sincronizzazione.',
          });
        }
      }
    } catch (e: any) {
      results.push({
        category: 'Sorgente Dati',
        name: 'Elaborazione Sorgente',
        status: 'error',
        message: 'Errore nell\'analisi della configurazione del foglio',
        details: e?.message,
      });
    }

    // 2. Diagnosi Integrità dei Dati
    if (partite && partite.length > 0) {
      const partiteSenzaCampo = partite.filter(p => !p.campo || p.campo === 'Campo Comunale');
      const partiteSenzaOrario = partite.filter(p => !p.ora || p.ora === '-');
      const partiteCynthia = partite.filter(p => p.isCynthiaCasa || p.isCynthiaOspite);

      if (partiteSenzaCampo.length > 0) {
        results.push({
          category: 'Integrità Dati',
          name: 'Campi da Gioco',
          status: 'warning',
          message: `${partiteSenzaCampo.length} partite hanno un campo generico o non specificato.`,
        });
      } else {
        results.push({
          category: 'Integrità Dati',
          name: 'Campi da Gioco',
          status: 'ok',
          message: 'Tutti i campi da gioco sono validi e specificati.',
        });
      }

      if (partiteSenzaOrario.length > 0) {
        results.push({
          category: 'Integrità Dati',
          name: 'Orari Gare',
          status: 'warning',
          message: `${partiteSenzaOrario.length} gare non hanno un orario definito.`,
        });
      } else {
        results.push({
          category: 'Integrità Dati',
          name: 'Orari Gare',
          status: 'ok',
          message: 'Tutti gli orari delle gare sono definiti.',
        });
      }

      results.push({
        category: 'Integrità Dati',
        name: 'Rilevamento Squadra Cynthia 1920',
        status: partiteCynthia.length > 0 ? 'ok' : 'warning',
        message: `${partiteCynthia.length} partite identificate per ASD Cynthia 1920 su un totale di ${partite.length} gare caricati.`,
      });
    } else {
      results.push({
        category: 'Integrità Dati',
        name: 'Elenco Partite',
        status: 'error',
        message: 'Nessuna partita presente in memoria o nella lista corrente.',
      });
    }

    // 3. Diagnosi Cache e Memoria Locale (localStorage)
    try {
      const configKey = 'cynthia_sheet_config_v1';
      const cacheKey = 'cynthia_partite_cache_v1';
      const hasConfig = Boolean(localStorage.getItem(configKey));
      const hasCache = Boolean(localStorage.getItem(cacheKey));

      results.push({
        category: 'Cache & Archiviazione',
        name: 'localStorage Browser',
        status: 'ok',
        message: 'Archiviazione locale disponibile',
        details: `Configurazione salvata: ${hasConfig ? 'Sì' : 'No'}, Cache partite: ${hasCache ? 'Sì' : 'No'}`,
      });
    } catch (e: any) {
      results.push({
        category: 'Cache & Archiviazione',
        name: 'localStorage Browser',
        status: 'warning',
        message: 'Impossibile accedere a localStorage (es. modalità incognito ristretta)',
        details: e?.message,
      });
    }

    // 4. Diagnosi PWA & Notifiche Push
    const swSupported = 'serviceWorker' in navigator;
    const notifSupported = 'Notification' in window;
    const notifPermission = notifSupported ? Notification.permission : 'not_supported';

    results.push({
      category: 'Funzionalità PWA & Push',
      name: 'Service Worker',
      status: swSupported ? 'ok' : 'warning',
      message: swSupported ? 'Service Worker supportato nel browser' : 'Service Worker non supportato',
    });

    results.push({
      category: 'Funzionalità PWA & Push',
      name: 'Notifiche Web Push',
      status: notifPermission === 'granted' ? 'ok' : notifPermission === 'denied' ? 'error' : 'warning',
      message: `Stato autorizzazione Notifiche: ${notifPermission}`,
      details:
        notifPermission === 'granted'
          ? 'Il browser può ricevere avvisi in tempo reale per cambi gara.'
          : notifPermission === 'denied'
          ? 'Notifiche bloccate dalle impostazioni del browser.'
          : 'Notifiche non ancora abilitate dall\'utente.',
    });

    // 5. Diagnosi Connettività Online
    const isOnline = navigator.onLine;
    results.push({
      category: 'Connettività Rete',
      name: 'Stato Rete',
      status: isOnline ? 'ok' : 'error',
      message: isOnline ? 'Connessione Internet attiva' : 'Dispositivo Offline (nessuna connessione)',
    });

    setDiagnostics(results);
    setIsRunning(false);
    setLastRunTimestamp(new Date().toLocaleTimeString('it-IT'));
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const countOk = diagnostics.filter(d => d.status === 'ok').length;
  const countWarning = diagnostics.filter(d => d.status === 'warning').length;
  const countError = diagnostics.filter(d => d.status === 'error').length;

  const handleClearCache = () => {
    try {
      localStorage.removeItem('cynthia_partite_cache_v1');
      alert('Cache locale delle partite svuotata con successo. Verranno riscaricati i dati freschi.');
      onRefreshData();
      runDiagnostics();
    } catch {
      alert('Errore nello svuotare la cache.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale */}
        <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-sky-900 text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20">
              <Activity className="w-5 h-5 text-sky-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Diagnosi Sistema & Dati</h3>
              <p className="text-xs text-sky-200/80">Verifica automatica dello stato dell'applicazione e della sincronizzazione</p>
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

        {/* Sommario Diagnosi */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs font-semibold shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> {countOk} OK
            </span>
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-3.5 h-3.5" /> {countWarning} Avvisi
            </span>
            <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
              <XCircle className="w-3.5 h-3.5" /> {countError} Criticità
            </span>
          </div>

          <div className="flex items-center gap-2">
            {lastRunTimestamp && (
              <span className="text-[11px] text-slate-400 font-normal">
                Ultima esecuzione: {lastRunTimestamp}
              </span>
            )}
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>Riesegui Test</span>
            </button>
          </div>
        </div>

        {/* Lista Risultati Diagnosi */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {isRunning && diagnostics.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-sky-500" />
              <p className="text-xs font-semibold">Esecuzione test diagnostici in corso...</p>
            </div>
          ) : (
            diagnostics.map((diag, index) => (
              <div
                key={index}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition ${
                  diag.status === 'ok'
                    ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    : diag.status === 'warning'
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/80'
                    : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/80'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {diag.status === 'ok' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                  {diag.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />}
                  {diag.status === 'error' && <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {diag.category} • {diag.name}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                    {diag.message}
                  </p>
                  {diag.details && (
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 break-all bg-white/50 dark:bg-slate-950/40 p-1.5 rounded-md border border-slate-200/50 dark:border-slate-800/50">
                      {diag.details}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con Azioni di Ripristino */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <button
            onClick={handleClearCache}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Svuota Cache Dati</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition shadow-xs ml-auto"
          >
            Chiudi Diagnosi
          </button>
        </div>
      </div>
    </div>
  );
};
