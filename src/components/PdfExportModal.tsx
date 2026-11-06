import React, { useState } from 'react';
import { Partita, FilterState } from '../types';
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
  ExternalLink,
  MapPin,
  Shield,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import {
  downloadWeeklyPdf,
  printWeeklySchedulePdf,
  shareWeeklyPdfOrWhatsApp,
  generateWhatsAppWeeklySummary,
  buildFilterSummaryString,
  WeeklySchedulePdfOptions,
} from '../utils/pdfGenerator';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { createProgrammaGareGoogleDoc } from '../services/googleDocsService';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPartite: Partita[];
  filteredPartite: Partita[];
  hasActiveFilters: boolean;
  filters?: FilterState;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  allPartite,
  filteredPartite,
  hasActiveFilters,
  filters,
}) => {
  const { user: googleUser, accessToken, isAuthenticated: isGoogleAuthenticated, login: googleLogin } = useGoogleAuth();
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>(
    hasActiveFilters ? 'filtered' : 'all'
  );
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Stati Google Docs
  const [isExportingGoogleDoc, setIsExportingGoogleDoc] = useState<boolean>(false);
  const [googleDocCreatedUrl, setGoogleDocCreatedUrl] = useState<string | null>(null);
  const [googleDocNotice, setGoogleDocNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showGoogleDocConfirmModal, setShowGoogleDocConfirmModal] = useState<boolean>(false);

  if (!isOpen) return null;

  const targetPartite = exportScope === 'filtered' ? filteredPartite : allPartite;
  const isCurrentlyFiltered = exportScope === 'filtered';
  const filterSummary = isCurrentlyFiltered ? buildFilterSummaryString(filters) : '';

  const getPdfOptions = (): WeeklySchedulePdfOptions => ({
    isFiltered: isCurrentlyFiltered,
    filterSummary,
    filters: isCurrentlyFiltered ? filters : undefined,
    titleSuffix: isCurrentlyFiltered ? 'Gare Filtrate' : '',
  });

  const handleDownload = () => {
    setIsGenerating(true);
    setStatusMessage('Generazione PDF in corso...');
    setTimeout(() => {
      try {
        downloadWeeklyPdf(
          targetPartite,
          isCurrentlyFiltered
            ? 'Programma_Gare_Cynthia_Filtrate'
            : 'Programma_Gare_Cynthia_Settimanale',
          getPdfOptions()
        );
        setStatusMessage('PDF A4 scaricato con successo!');
        setTimeout(() => setStatusMessage(null), 3500);
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
    setStatusMessage('Apertura finestra di stampa...');
    setTimeout(() => {
      try {
        printWeeklySchedulePdf(targetPartite, getPdfOptions());
        setStatusMessage('Stampa avviata con successo!');
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err) {
        console.error('Errore stampa:', err);
        downloadWeeklyPdf(targetPartite, 'Programma_Gare_Cynthia_Stampa', getPdfOptions());
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
        isCurrentlyFiltered
          ? 'Programma Gare Filtrate ASD Cynthia 1920'
          : 'Programma Gare ASD Cynthia 1920',
        getPdfOptions()
      );
      if (result.sharedViaNative) {
        setStatusMessage('Condiviso tramite app!');
      } else {
        setStatusMessage('PDF scaricato sul dispositivo!');
      }
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Errore condivisione PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenWhatsAppText = () => {
    const text = generateWhatsAppWeeklySummary(targetPartite, filterSummary);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyWhatsAppText = () => {
    const text = generateWhatsAppWeeklySummary(targetPartite, filterSummary);
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleStartGoogleDoc = async () => {
    if (!isGoogleAuthenticated || !accessToken) {
      try {
        const token = await googleLogin();
        if (!token) return;
      } catch (err: any) {
        setGoogleDocNotice({
          message: `Accesso Google necessario: ${err?.message || 'Accesso non riuscito'}`,
          type: 'error',
        });
        return;
      }
    }
    setShowGoogleDocConfirmModal(true);
  };

  const handleConfirmGoogleDoc = async () => {
    if (!accessToken) {
      setGoogleDocNotice({
        message: 'Sessione Google scaduta. Accedi nuovamente con il tuo account Google.',
        type: 'error',
      });
      setShowGoogleDocConfirmModal(false);
      return;
    }

    setIsExportingGoogleDoc(true);
    setGoogleDocNotice(null);
    setShowGoogleDocConfirmModal(false);

    try {
      const res = await createProgrammaGareGoogleDoc(targetPartite, null, accessToken);
      setGoogleDocCreatedUrl(res.documentUrl);
      setGoogleDocNotice({
        message: `Documento Google Docs creato con successo sul tuo Google Drive (${targetPartite.length} gare)!`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Errore creazione documento Google Docs:', err);
      setGoogleDocNotice({
        message: `Errore creazione Google Doc: ${err?.message || 'Impossibile creare il documento'}`,
        type: 'error',
      });
    } finally {
      setIsExportingGoogleDoc(false);
    }
  };

  // Statistiche rapide
  const total = targetPartite.length;
  const inCasa = targetPartite.filter((p) => p.isCynthiaCasa).length;
  const inTrasferta = targetPartite.filter((p) => p.isCynthiaOspite).length;
  const categories = Array.from(new Set(targetPartite.map((p) => p.campionato)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modale */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-cyan-900 dark:from-slate-950 dark:to-sky-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-white/10 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-amber-300 border border-white/20 shadow-inner">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold leading-tight">
                  Esportazione PDF Programma Gare
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  A4 Stampa
                </span>
              </div>
              <p className="text-[11px] text-sky-200/80">
                ASD Cynthia 1920 • Logo ufficiale, date, campi, indirizzi e layout ottimizzato per la stampa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            title="Chiudi finestra (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Contenuto Scrollabile */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm text-slate-800 dark:text-slate-200">
          {/* Selezione Ambito Gare: Filtrate vs Tutte */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Seleziona Gare da Includere nel Documento
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Opzione 1: Gare Filtrate (raccomandata se ci sono filtri) */}
              <button
                type="button"
                onClick={() => setExportScope('filtered')}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start justify-between gap-2.5 cursor-pointer ${
                  exportScope === 'filtered'
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 dark:border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Solo Gare Filtrate</span>
                    {hasActiveFilters && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-sky-600 text-white font-black">
                        Attivo
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Include solo le <strong>{filteredPartite.length}</strong> gare corrispondenti ai filtri
                  </div>
                </div>
                {exportScope === 'filtered' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 dark:bg-sky-400 mt-1 shrink-0" />
                )}
              </button>

              {/* Opzione 2: Tutte le Gare del Calendario */}
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start justify-between gap-2.5 cursor-pointer ${
                  exportScope === 'all'
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 dark:border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>Tutte le Gare</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Intero calendario del fine settimana (<strong>{allPartite.length}</strong> gare)
                  </div>
                </div>
                {exportScope === 'all' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 dark:bg-sky-400 mt-1 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Dettaglio Filtri Applicati nel Documento */}
          {isCurrentlyFiltered && filterSummary && (
            <div className="p-3 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2.5 animate-in fade-in">
              <SlidersHorizontal className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-sky-700 dark:text-sky-300">
                  Filtri Inclusi nella Stampa:
                </span>
                <p className="text-xs font-semibold mt-0.5 leading-relaxed">
                  {filterSummary}
                </p>
              </div>
            </div>
          )}

          {/* Card Caratteristiche Layout per la Stampa */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
            <div className="flex items-center justify-between font-extrabold text-slate-800 dark:text-slate-100">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Riepilogo Dati del Documento</span>
              </span>
              <span className="text-sky-700 dark:text-sky-300 text-sm font-black">
                {total} {total === 1 ? 'Partita' : 'Partite'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-xs flex-wrap font-medium">
              <span>🏠 Casa: <strong>{inCasa}</strong></span>
              <span>•</span>
              <span>🚌 Trasferta: <strong>{inTrasferta}</strong></span>
              <span>•</span>
              <span>⚽ Categorie: <strong>{categories.length}</strong></span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-600" />
                <span><strong>Stemma Ufficiale:</strong> Logo ASD Cynthia 1920 centrato in alta definizione.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span><strong>Campi e Impianti:</strong> Nome struttura, fondo e indirizzo stradale completo.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-amber-500" />
                <span><strong>Layout Stampa A4:</strong> Orientamento orizzontale, intestazioni ripetute e numerazione pagine.</span>
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Azioni Principali: Scarica PDF & Stampa Immediata */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              Azioni di Esportazione e Stampa
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Scarica PDF */}
              <button
                id="btn-modal-download-pdf"
                type="button"
                onClick={handleDownload}
                disabled={isGenerating || total === 0}
                className="p-3.5 rounded-xl bg-sky-700 hover:bg-sky-800 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-sky-700/20 disabled:opacity-50 min-h-[46px] cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Scarica File PDF (A4)</span>
              </button>

              {/* Stampa Diretta (Auto-Print) */}
              <button
                id="btn-modal-print-pdf"
                type="button"
                onClick={handlePrint}
                disabled={isGenerating || total === 0}
                className="p-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-amber-600/20 disabled:opacity-50 min-h-[46px] cursor-pointer"
                title="Apre direttamente la finestra di stampa del browser"
              >
                <Printer className="w-4 h-4" />
                <span>Stampa Diretta (A4)</span>
              </button>
            </div>
          </div>

          {/* Condivisione WhatsApp & Gruppi */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Condivisione WhatsApp & Dispositivi</span>
            </span>

            <div className="space-y-2">
              {/* Condividi PDF Nativo */}
              <button
                type="button"
                id="btn-modal-share-native-pdf"
                onClick={handleNativeShare}
                disabled={isGenerating || total === 0}
                className="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50 min-h-[44px] cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Condividi File PDF con WhatsApp / Altre App</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                {/* Invia Messaggio Testo WhatsApp */}
                <button
                  type="button"
                  id="btn-modal-whatsapp-msg"
                  onClick={handleOpenWhatsAppText}
                  disabled={total === 0}
                  className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Invia Chat WhatsApp</span>
                </button>

                {/* Copia Testo WhatsApp */}
                <button
                  type="button"
                  id="btn-modal-copy-whatsapp"
                  onClick={handleCopyWhatsAppText}
                  disabled={total === 0}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">Copiato!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copia Testo per Chat</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sezione Google Workspace & Google Docs */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Google Workspace (Google Docs)</span>
            </span>

            <button
              type="button"
              id="btn-modal-export-google-docs"
              onClick={handleStartGoogleDoc}
              disabled={isExportingGoogleDoc || total === 0}
              className="w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50 min-h-[44px] cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-200" />
              <span>{isExportingGoogleDoc ? 'Creazione documento in corso...' : 'Crea Documento Google Docs su Google Drive'}</span>
            </button>

            {googleDocNotice && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in ${
                  googleDocNotice.type === 'success'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <span>{googleDocNotice.message}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {googleDocCreatedUrl && (
                    <a
                      href={googleDocCreatedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] transition"
                    >
                      <span>Apri Google Doc</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setGoogleDocNotice(null)}
                    className="font-bold underline text-slate-600 dark:text-slate-300"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>

      {/* Modal di Conferma Esplicita Creazione Documento Google Docs */}
      {showGoogleDocConfirmModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Crea Documento Google Docs</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Programma Gare del Fine Settimana</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-2 border border-slate-200 dark:border-slate-700">
              <p>
                Vuoi creare un nuovo documento Google Docs sul tuo Google Drive (<strong>{googleUser?.email || 'Google Workspace'}</strong>)?
              </p>
              <div className="space-y-1 font-mono text-[11px] pt-1 text-slate-600 dark:text-slate-400">
                <p>• <strong>Partite incluse:</strong> {targetPartite.length} gare</p>
                <p>• <strong>Ambito:</strong> {isCurrentlyFiltered ? 'Gare filtrate correnti' : 'Tutte le gare del weekend'}</p>
                {filterSummary && <p>• <strong>Filtri:</strong> {filterSummary}</p>}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGoogleDocConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmGoogleDoc}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm active:scale-95 cursor-pointer"
              >
                Conferma e Crea Documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
