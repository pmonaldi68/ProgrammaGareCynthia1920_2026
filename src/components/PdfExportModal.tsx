import React, { useState } from 'react';
import { Partita } from '../types';
import {
  FileDown,
  Printer,
  Share2,
  Copy,
  Check,
  X,
  FileText,
  Calendar,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import {
  downloadWeeklyPdf,
  shareWeeklyPdfOrWhatsApp,
  generateWhatsAppWeeklySummary,
  generateWeeklySchedulePdf,
} from '../utils/pdfGenerator';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPartite: Partita[];
  filteredPartite: Partita[];
  hasActiveFilters: boolean;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  allPartite,
  filteredPartite,
  hasActiveFilters,
}) => {
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>(
    hasActiveFilters ? 'filtered' : 'all'
  );
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetPartite = exportScope === 'filtered' ? filteredPartite : allPartite;

  const handleDownload = () => {
    setIsGenerating(true);
    setStatusMessage('Generazione PDF in corso...');
    setTimeout(() => {
      try {
        downloadWeeklyPdf(
          targetPartite,
          exportScope === 'filtered'
            ? 'Programma_Gare_Cynthia_Filtrate'
            : 'Programma_Gare_Cynthia_Settimanale'
        );
        setStatusMessage('PDF scaricato con successo!');
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err) {
        console.error('Errore download PDF:', err);
        setStatusMessage('Errore durante la creazione del PDF.');
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  };

  const handlePrint = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const doc = generateWeeklySchedulePdf(targetPartite);
        const blobUrl = doc.output('bloburl');
        const printWindow = window.open(blobUrl as unknown as string, '_blank');
        if (printWindow) {
          printWindow.focus();
        } else {
          // Fallback se il popup è bloccato
          downloadWeeklyPdf(targetPartite);
        }
      } catch (err) {
        console.error('Errore stampa:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  };

  const handleNativeShare = async () => {
    setIsGenerating(true);
    setStatusMessage('Preparazione file per la condivisione...');
    try {
      const result = await shareWeeklyPdfOrWhatsApp(
        targetPartite,
        'Programma Gare ASD Cynthia 1920'
      );
      if (result.sharedViaNative) {
        setStatusMessage('Condiviso tramite app!');
      } else {
        setStatusMessage('PDF scaricato sul dispositivo!');
      }
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Errore condivisione PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenWhatsAppText = () => {
    const text = generateWhatsAppWeeklySummary(targetPartite);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyWhatsAppText = () => {
    const text = generateWhatsAppWeeklySummary(targetPartite);
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Statistiche rapide
  const total = targetPartite.length;
  const inCasa = targetPartite.filter(p => p.isCynthiaCasa).length;
  const inTrasferta = targetPartite.filter(p => p.isCynthiaOspite).length;
  const categories = Array.from(new Set(targetPartite.map(p => p.campionato)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modale */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-cyan-900 dark:from-slate-950 dark:to-sky-950 text-white px-6 py-4 flex items-center justify-between border-b border-white/10 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-amber-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Report PDF Programma Gare</h2>
              <p className="text-[11px] text-sky-200/80">
                Formattato per stampa A4 orizzontale o condivisione WhatsApp
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

        {/* Corpo Contenuto */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm text-slate-800 dark:text-slate-200">
          {/* Selezione Ambito Gare da esportare */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Seleziona Gare da Includere nel Report
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-2 ${
                  exportScope === 'all'
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Tutte le Gare
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Intero calendario ({allPartite.length} partite)
                  </div>
                </div>
                {exportScope === 'all' && (
                  <span className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400 mt-1" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setExportScope('filtered')}
                className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-2 ${
                  exportScope === 'filtered'
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Solo Gare Filtrate
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Criteri attivi a schermo ({filteredPartite.length} partite)
                  </div>
                </div>
                {exportScope === 'filtered' && (
                  <span className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400 mt-1" />
                )}
              </button>
            </div>
          </div>

          {/* Scheda Riepilogo Dati Inclusi */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Dati nel Documento PDF
              </span>
              <span className="text-sky-700 dark:text-sky-300">
                {total} {total === 1 ? 'Partita' : 'Partite'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-[11px] flex-wrap">
              <span>🏠 Casa: <strong>{inCasa}</strong></span>
              <span>•</span>
              <span>🚌 Trasferta: <strong>{inTrasferta}</strong></span>
              <span>•</span>
              <span>⚽ Categorie: <strong>{categories.length}</strong></span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Squadre: {categories.join(', ')}
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Azioni Principali di Esportazione PDF */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Azioni PDF & Stampa
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Scarica PDF */}
              <button
                id="btn-modal-download-pdf"
                type="button"
                onClick={handleDownload}
                disabled={isGenerating || total === 0}
                className="p-3.5 rounded-xl bg-sky-700 hover:bg-sky-800 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50 min-h-[46px]"
              >
                <FileDown className="w-4 h-4" />
                <span>Scarica File PDF</span>
              </button>

              {/* Anteprima di Stampa */}
              <button
                id="btn-modal-print-pdf"
                type="button"
                onClick={handlePrint}
                disabled={isGenerating || total === 0}
                className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 transition min-h-[46px]"
              >
                <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>Anteprima / Stampa</span>
              </button>
            </div>
          </div>

          {/* Sezione Condivisione WhatsApp & Mobile */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              Condivisione WhatsApp & Gruppi
            </h3>

            <div className="space-y-2">
              {/* Condivisione Nativa (Invia PDF diretto su WhatsApp/Telegram) */}
              <button
                type="button"
                id="btn-modal-share-native-pdf"
                onClick={handleNativeShare}
                disabled={isGenerating || total === 0}
                className="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50 min-h-[44px]"
              >
                <Share2 className="w-4 h-4" />
                <span>Condividi PDF con WhatsApp o altre App</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* Invia Messaggio WhatsApp Formattato */}
                <button
                  type="button"
                  id="btn-modal-whatsapp-msg"
                  onClick={handleOpenWhatsAppText}
                  disabled={total === 0}
                  className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Invia Riepilogo Chat WhatsApp</span>
                </button>

                {/* Copia Testo WhatsApp */}
                <button
                  type="button"
                  id="btn-modal-copy-whatsapp"
                  onClick={handleCopyWhatsAppText}
                  disabled={total === 0}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">Copiato!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copia Testo per WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
