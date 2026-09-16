import React, { useState } from 'react';
import { SheetConfig } from '../types';
import { fetchPartiteFromSource, buildCsvUrl, exportPartiteToCSV } from '../services/sheetService';
import { Partita } from '../types';
import { X, Sheet, CheckCircle2, AlertCircle, RefreshCw, Download, ExternalLink, HelpCircle } from 'lucide-react';

interface SheetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SheetConfig;
  currentPartite: Partita[];
  onSaveConfig: (newConfig: SheetConfig) => void;
  onApplyPartite: (partite: Partita[]) => void;
}

export const SheetConfigModal: React.FC<SheetConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  currentPartite,
  onSaveConfig,
  onApplyPartite,
}) => {
  const [sheetUrl, setSheetUrl] = useState(config.sheetUrl || '');
  const [tabName, setTabName] = useState(config.tabName || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const partite = await fetchPartiteFromSource(sheetUrl, tabName);
      setTestResult({
        success: true,
        message: `Connessione riuscita! Rilevate ${partite.length} partite valide.`,
        count: partite.length,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Errore durante la connessione al Google Sheet.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    const updated: SheetConfig = {
      ...config,
      sheetUrl: sheetUrl.trim(),
      tabName: tabName.trim(),
      lastUpdated: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    };

    onSaveConfig(updated);

    // Carica subito se è presente un URL
    if (sheetUrl.trim()) {
      try {
        const partite = await fetchPartiteFromSource(sheetUrl.trim(), tabName.trim());
        onApplyPartite(partite);
      } catch (err) {
        console.warn('Errore applicando partite post-salvataggio', err);
      }
    }
    onClose();
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent = exportPartiteToCSV(currentPartite);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cynthia1920_programma_gare.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-sky-900 to-cyan-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sheet className="w-5 h-5 text-emerald-300" />
            <h2 className="text-lg font-bold">Configura Google Sheets</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenuto scrollabile */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Istruzioni Rapide */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-900 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-sky-950 text-sm">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              Come collegare il tuo Google Sheet:
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-700">
              <li>Apri il tuo foglio di calcolo Google con le colonne richieste</li>
              <li>Clicca su <strong>File</strong> &gt; <strong>Condividi</strong> &gt; <strong>Pubblica sul Web</strong></li>
              <li>Scegli <strong>Valori separati da virgola (.csv)</strong> e clicca <strong>Pubblica</strong></li>
              <li>Copia il link generato e incollalo nel campo sottostante (oppure incolla l'URL del foglio)</li>
            </ol>
          </div>

          {/* Form Input URL */}
          <div className="space-y-3">
            <div>
              <label htmlFor="sheet-url-input" className="block font-bold text-slate-700 mb-1">
                Link CSV o URL Google Sheet
              </label>
              <input
                id="sheet-url-input"
                type="text"
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-mono focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Se lasci vuoto, l'app proverà a leggere automaticamente il file sincronizzato da GitHub Actions (<code>./data/partite.csv</code>).
              </p>
            </div>

            <div>
              <label htmlFor="tab-name-input" className="block font-bold text-slate-700 mb-1">
                Nome Foglio / Scheda (Opzionale)
              </label>
              <input
                id="tab-name-input"
                type="text"
                value={tabName}
                onChange={e => setTabName(e.target.value)}
                placeholder="Es. Foglio1 o Weekend"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
              />
            </div>
          </div>

          {/* Test Connessione */}
          <div className="flex items-center gap-3">
            <button
              id="btn-test-sheet-connection"
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Verifica in corso...' : 'Testa Connessione'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsvTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-sky-700 hover:bg-sky-50 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Scarica Modello CSV</span>
            </button>
          </div>

          {/* Risultato del test */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{testResult.success ? 'Connessione Riuscita' : 'Errore'}</p>
                <p>{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Nomi Colonne Obbligatorie */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700 mb-2">Colonne attese nel Google Sheet:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono text-slate-600">
              <span className="bg-slate-100 px-2 py-1 rounded">CAMPIONATO</span>
              <span className="bg-slate-100 px-2 py-1 rounded">GIRONE</span>
              <span className="bg-slate-100 px-2 py-1 rounded">GARA</span>
              <span className="bg-slate-100 px-2 py-1 rounded">DATA</span>
              <span className="bg-slate-100 px-2 py-1 rounded">ORA</span>
              <span className="bg-slate-100 px-2 py-1 rounded">SQUADRA CASA</span>
              <span className="bg-slate-100 px-2 py-1 rounded">SQUADRA OSPITE</span>
              <span className="bg-slate-100 px-2 py-1 rounded">CAMPO</span>
              <span className="bg-slate-100 px-2 py-1 rounded">TIPO</span>
              <span className="bg-slate-100 px-2 py-1 rounded">INDIRIZZO</span>
              <span className="bg-slate-100 px-2 py-1 rounded">COMUNE</span>
              <span className="bg-slate-100 px-2 py-1 rounded">LNK MAPS</span>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            Annulla
          </button>
          <button
            id="btn-save-sheet-config"
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white transition shadow-sm"
          >
            Salva e Applica
          </button>
        </div>
      </div>
    </div>
  );
};
