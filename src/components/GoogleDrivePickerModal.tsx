import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  RefreshCw,
  Search,
  ExternalLink,
  Check,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import {
  listDriveSpreadsheets,
  fetchSpreadsheetMetadata,
  DriveSpreadsheetItem,
} from '../services/googleSheetsService';
import { GoogleSignInButton } from './GoogleSignInButton';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSheet: (selection: { sheetId: string; sheetName: string; tabName: string }) => void;
  title?: string;
  description?: string;
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSheet,
  title = 'Scegli un Foglio Google dal tuo Drive',
  description = 'Seleziona il foglio di calcolo con il programma gare o con le rose e i mister',
}) => {
  const { user, accessToken, isAuthenticated, login } = useGoogleAuth();
  const [spreadsheets, setSpreadsheets] = useState<DriveSpreadsheetItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scheda/Foglio selezionato per estrarre i tab disponibili
  const [selectedItem, setSelectedItem] = useState<DriveSpreadsheetItem | null>(null);
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [isLoadingTabs, setIsLoadingTabs] = useState(false);

  useEffect(() => {
    if (isOpen && accessToken) {
      loadFiles(accessToken);
    }
  }, [isOpen, accessToken]);

  const loadFiles = async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const files = await listDriveSpreadsheets(token);
      setSpreadsheets(files);
    } catch (err: any) {
      setError(err?.message || 'Impossibile leggere i file da Google Drive');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickSpreadsheet = async (item: DriveSpreadsheetItem) => {
    setSelectedItem(item);
    if (!accessToken) return;

    setIsLoadingTabs(true);
    try {
      const meta = await fetchSpreadsheetMetadata(item.id, accessToken);
      const tabNames = meta.sheets.map((s) => s.title);
      setAvailableTabs(tabNames);
      setSelectedTab(tabNames.length > 0 ? tabNames[0] : '');
    } catch {
      // Fallback
      setAvailableTabs([]);
      setSelectedTab('');
    } finally {
      setIsLoadingTabs(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedItem) return;
    onSelectSheet({
      sheetId: selectedItem.id,
      sheetName: selectedItem.name,
      tabName: selectedTab,
    });
    onClose();
  };

  if (!isOpen) return null;

  const filteredFiles = spreadsheets.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 dark:from-slate-950 dark:to-emerald-950 text-white px-5 py-4 flex items-center justify-between border-b border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">{title}</h3>
              <p className="text-xs text-emerald-100 dark:text-emerald-300">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {!isAuthenticated ? (
            <div className="text-center py-8 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto border border-emerald-300">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Collega il tuo account Google Workspace
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Accedi con Google per visualizzare direttamente i fogli di calcolo del tuo Google Drive senza dover copiare manualmente i link.
              </p>
              <div className="pt-2 flex justify-center">
                <GoogleSignInButton
                  onSuccess={(token) => loadFiles(token)}
                  variant="full"
                />
              </div>
            </div>
          ) : (
            <>
              {/* Barra di ricerca e pulsante ricarica */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca foglio per nome..."
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => accessToken && loadFiles(accessToken)}
                  disabled={isLoading}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                  title="Aggiorna elenco da Google Drive"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Aggiorna</span>
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Elenco file */}
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span>Caricamento Fogli da Google Drive in corso...</span>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  Nessun foglio di calcolo trovato su Google Drive corrispondente alla ricerca.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
                  {filteredFiles.map((file) => {
                    const isSelected = selectedItem?.id === file.id;
                    const dateFormatted = file.modifiedTime
                      ? new Date(file.modifiedTime).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '';
                    return (
                      <div
                        key={file.id}
                        onClick={() => handlePickSpreadsheet(file)}
                        className={`p-3 flex items-center justify-between gap-2.5 cursor-pointer transition text-xs ${
                          isSelected
                            ? 'bg-emerald-100/70 dark:bg-emerald-950/60 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileSpreadsheet
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="text-slate-900 dark:text-white truncate font-medium">
                              {file.name}
                            </div>
                            {dateFormatted && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                <span>Modificato il {dateFormatted}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Apri in Google Sheets"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Seleziona scheda/tab all'interno del foglio selezionato */}
              {selectedItem && (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/80 space-y-2 animate-in fade-in">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                    <span>Foglio selezionato: {selectedItem.name}</span>
                    {isLoadingTabs && <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />}
                  </div>

                  {availableTabs.length > 0 ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Scegli la scheda/pagina (tab):
                      </label>
                      <select
                        value={selectedTab}
                        onChange={(e) => setSelectedTab(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        {availableTabs.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      Verrà caricata la prima scheda predefinita del foglio.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {selectedItem ? `Selezionato: ${selectedItem.name}` : 'Nessun foglio selezionato'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
            >
              Annulla
            </button>
            <button
              type="button"
              disabled={!selectedItem}
              onClick={handleConfirm}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Usa questo Foglio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
