import React, { useState } from 'react';
import {
  X,
  FolderOpen,
  Calendar,
  Clock,
  Users,
  Trash2,
  Download,
  Upload,
  ArrowRight,
  Shield,
  Search,
  CheckCircle2,
  FileText,
  BookmarkCheck,
} from 'lucide-react';
import { SavedConvocazioneRecord } from '../services/convocazioniService';

interface ArchivioConvocazioniModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedRecords: SavedConvocazioneRecord[];
  onLoadRecord: (record: SavedConvocazioneRecord) => void;
  onDeleteRecord: (id: string) => void;
  onImportRecords?: (records: SavedConvocazioneRecord[]) => void;
}

export const ArchivioConvocazioniModal: React.FC<ArchivioConvocazioniModalProps> = ({
  isOpen,
  onClose,
  savedRecords,
  onLoadRecord,
  onDeleteRecord,
  onImportRecords,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredRecords = savedRecords.filter((rec) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (rec.partitaTitle && rec.partitaTitle.toLowerCase().includes(q)) ||
      (rec.categoria && rec.categoria.toLowerCase().includes(q)) ||
      (rec.mister && rec.mister.toLowerCase().includes(q)) ||
      (rec.dataGara && rec.dataGara.toLowerCase().includes(q))
    );
  });

  const handleExportJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedRecords, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `cynthia_convocazioni_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.warn('Errore esportazione archivio', e);
    }
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && onImportRecords) {
          onImportRecords(parsed);
        }
      } catch (err) {
        alert('File JSON non valido per il ripristino delle convocazioni.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-900 text-white px-5 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 border border-white/20 shrink-0">
              <FolderOpen className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight">
                  Archivio Convocazioni Salvate
                </h3>
                <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {savedRecords.length} {savedRecords.length === 1 ? 'salvata' : 'salvate'}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Riapri con 1 click le convocazioni create per modificarle, ristamparle o rinviarle
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Ricerca */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per squadra, categoria o mister..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              disabled={savedRecords.length === 0}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
              title="Esporta backup JSON di tutte le convocazioni"
            >
              <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="hidden sm:inline">Esporta Backup</span>
            </button>

            {onImportRecords && (
              <label
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Importa backup JSON delle convocazioni"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Importa</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJsonFile}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Lista Convocazioni Salvate */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedRecords.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-xs">
                <BookmarkCheck className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                Nessuna Convocazione Salvata
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                Quando compili una convocazione, clicca sul pulsante <strong>&quot;Salva Convocazione&quot;</strong> in alto per conservarla in questo archivio e riaprirla in qualsiasi momento con 1 click.
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
              Nessuna convocazione trovata per &quot;{searchTerm}&quot;
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const isDonBosco = rec.societa === 'P.G.S. DON BOSCO GENZANO' || (rec.partitaTitle && rec.partitaTitle.includes('DON BOSCO'));

              return (
                <div
                  key={rec.id}
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-400/80 dark:hover:border-emerald-500/80 transition-all shadow-xs group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Dettagli Gara */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                          {rec.categoria}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            isDonBosco
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                              : 'bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 border-sky-300 dark:border-sky-700'
                          }`}
                        >
                          <span>{isDonBosco ? '🟡🔵' : '🔵⚪'}</span>
                          <span>{isDonBosco ? 'PGS DON BOSCO' : 'CYNTHIA 1920'}</span>
                        </span>

                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{rec.selectedCount} atleti convocati</span>
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {rec.partitaTitle}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        {rec.dataGara && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{rec.dataGara} {rec.oraGara ? `ore ${rec.oraGara}` : ''}</span>
                          </span>
                        )}

                        {rec.oraRitrovo && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Ritrovo: {rec.oraRitrovo}</span>
                          </span>
                        )}

                        {rec.mister && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <span>Mister: {rec.mister}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        Salvata: {rec.displayDate}
                      </div>
                    </div>

                    {/* Azioni Rapide */}
                    <div className="flex items-center gap-2 sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      {deleteConfirmId === rec.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 p-1.5 rounded-lg border border-rose-300 dark:border-rose-700">
                          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 px-1">
                            Eliminare?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteRecord(rec.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition active:scale-95"
                          >
                            Sì
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs transition active:scale-95"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(rec.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition active:scale-95"
                          title="Elimina questa convocazione salvata"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onLoadRecord(rec)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                        title="Riapri e ricarica tutti i dati e i convocati di questa gara"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>Riapri</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>I dati rimangono salvati localmente sul dispositivo</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold transition active:scale-95 cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
