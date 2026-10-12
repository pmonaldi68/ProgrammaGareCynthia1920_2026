import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Partita } from '../types';
import {
  X,
  FileDown,
  Printer,
  Share2,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Layers,
  Upload,
  RotateCcw,
  Sliders,
  Palette,
  Image as ImageIcon,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import {
  LocandinaSingolaData,
  PosterAspectRatio,
  buildDefaultLocandinaSingolaData,
  renderLocandinaSingolaToCanvas,
  downloadLocandinaSingolaPng,
  downloadLocandinaSingolaPdf,
  shareLocandinaSingola,
  copyLocandinaSingolaToClipboard,
} from '../utils/locandinaSingolaGenerator';
import { POSTER_MATCHDAY_BG_BASE64 } from '../assets/posterBgBase64';

interface LocandinaSingolaModalProps {
  isOpen: boolean;
  onClose: () => void;
  partite: Partita[];
  initialPartita?: Partita | null;
}

const PRESET_TITOLI = ['MATCHDAY', 'PROSSIMA GARA', 'DERBY', 'BIG MATCH', 'CAMPIONATO', 'FINALE'];

const ACCENT_COLORS = [
  { name: 'Sky Cyan', hex: '#38bdf8' },
  { name: 'Oro / Gold', hex: '#f59e0b' },
  { name: 'Bianco Puro', hex: '#ffffff' },
  { name: 'Smeraldo', hex: '#10b981' },
  { name: 'Rosso Fiamma', hex: '#ef4444' },
];

export const LocandinaSingolaModal: React.FC<LocandinaSingolaModalProps> = ({
  isOpen,
  onClose,
  partite,
  initialPartita,
}) => {
  // Partita selezionata
  const [selectedMatchId, setSelectedMatchId] = useState<string>(() => {
    if (initialPartita) return initialPartita.id;
    return partite.length > 0 ? partite[0].id : '';
  });

  const currentMatch = useMemo(() => {
    return partite.find((p) => p.id === selectedMatchId) || initialPartita || (partite.length > 0 ? partite[0] : null);
  }, [partite, selectedMatchId, initialPartita]);

  // Stato dati locandina
  const [posterData, setPosterData] = useState<LocandinaSingolaData>(() =>
    buildDefaultLocandinaSingolaData(currentMatch)
  );

  // Sincronizza quando cambia partita o apertura
  useEffect(() => {
    if (currentMatch) {
      setPosterData(buildDefaultLocandinaSingolaData(currentMatch));
    }
  }, [selectedMatchId, isOpen]);

  // Anteprima Canvas in tempo reale
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRenderingPreview, setIsRenderingPreview] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Aggiorna l'anteprima Canvas quando cambiano i dati
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    const updatePreview = async () => {
      setIsRenderingPreview(true);
      try {
        const offscreen = await renderLocandinaSingolaToCanvas(posterData);
        if (isCancelled || !previewCanvasRef.current) return;

        const targetCanvas = previewCanvasRef.current;
        targetCanvas.width = offscreen.width;
        targetCanvas.height = offscreen.height;
        const ctx = targetCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(offscreen, 0, 0);
        }
      } catch (err) {
        console.error('Errore aggiornamento anteprima locandina:', err);
      } finally {
        if (!isCancelled) setIsRenderingPreview(false);
      }
    };

    updatePreview();

    return () => {
      isCancelled = true;
    };
  }, [posterData, isOpen]);

  if (!isOpen) return null;

  // Gestione download PNG
  const handleDownloadPng = async () => {
    setStatusMessage('Generazione PNG HD in corso...');
    try {
      await downloadLocandinaSingolaPng(posterData);
      setStatusMessage('Immagine PNG scaricata con successo!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Errore download PNG:', err);
      setStatusMessage('Errore durante il download dell\'immagine.');
    }
  };

  // Gestione download PDF
  const handleDownloadPdf = async () => {
    setStatusMessage('Generazione PDF A4 in corso...');
    try {
      await downloadLocandinaSingolaPdf(posterData);
      setStatusMessage('PDF A4 scaricato con successo!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Errore download PDF:', err);
      setStatusMessage('Errore durante il download del PDF.');
    }
  };

  // Gestione condivisione nativa Web Share
  const handleShare = async () => {
    setStatusMessage('Preparazione condivisione...');
    try {
      const res = await shareLocandinaSingola(posterData);
      if (res.sharedViaNative) {
        setStatusMessage('Locandina condivisa con successo!');
      } else {
        setStatusMessage('Locandina scaricata per la condivisione!');
      }
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Errore condivisione:', err);
      setStatusMessage('Errore durante la condivisione.');
    }
  };

  // Copia negli appunti
  const handleCopyClipboard = async () => {
    const ok = await copyLocandinaSingolaToClipboard(posterData);
    if (ok) {
      setCopiedSuccess(true);
      setStatusMessage('Immagine copiata negli appunti!');
      setTimeout(() => {
        setCopiedSuccess(false);
        setStatusMessage(null);
      }, 3000);
    } else {
      setStatusMessage('Impossibile copiare direttamente: usa "Scarica PNG".');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Stampa diretta (iframe invisibile senza window.open nel rispetto delle sandbox)
  const handlePrint = () => {
    if (!previewCanvasRef.current) return;
    try {
      const dataUrl = previewCanvasRef.current.toDataURL('image/jpeg', 0.95);
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const doc = printIframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Locandina Matchday - ASD Cynthia 1920</title>
              <style>
                @page { margin: 0; }
                body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" onload="window.print();" />
            </body>
          </html>
        `);
        doc.close();
      }

      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      }, 3000);
    } catch {
      // Fallback rapido al download PDF A4
      handleDownloadPdf();
    }
  };

  // Carica immagine di sfondo personalizzata
  const handleUploadCustomBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      if (b64) {
        setPosterData((prev) => ({ ...prev, bgImageBase64: b64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Ripristina sfondo originale palla splash blu
  const handleResetDefaultBg = () => {
    setPosterData((prev) => ({ ...prev, bgImageBase64: POSTER_MATCHDAY_BG_BASE64 }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODALE */}
        <div className="bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-900 text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 shrink-0">
              <Sparkles className="w-5 h-5 text-sky-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base leading-tight truncate">
                  Locandina Singola Partita (Matchday)
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs">
                  Sfondo Splash
                </span>
              </div>
              <p className="text-[11px] text-sky-200/80 truncate">
                Grafica ufficiale per Instagram, Facebook, WhatsApp e Stampa A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              title="Scarica immagine PNG ad alta risoluzione"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Scarica PNG</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICA STATO RAPIDA */}
        {statusMessage && (
          <div className="bg-sky-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shrink-0 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{statusMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-white/80 hover:text-white text-xs underline cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        )}

        {/* CORPO MODALE A DUE COLONNE (Controlli a sinistra, Anteprima live a destra) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* COLONNA SINISTRA: SELEZIONE GARA & PERSONALIZZAZIONE (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* 1. SELEZIONA LA PARTITA */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="select-matchday-partita"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>1. Scegli la Gara dal Calendario</span>
                </label>
                {currentMatch && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200">
                    {currentMatch.campionato}
                  </span>
                )}
              </div>

              {partite.length > 0 ? (
                <select
                  id="select-matchday-partita"
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden cursor-pointer"
                >
                  {partite.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.campionato}] {p.squadraCasa} vs {p.squadraOspite} ({p.data} ore {p.ora})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-slate-500 italic">Nessuna partita nel calendario.</div>
              )}
            </div>

            {/* 2. FORMATO & ASPECT RATIO */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>2. Formato Grafica</span>
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPosterData((prev) => ({ ...prev, aspectRatio: '1:1' }))}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                    posterData.aspectRatio === '1:1'
                      ? 'bg-sky-600 text-white border-sky-700 shadow-xs ring-2 ring-sky-400/30'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <span className="w-4 h-4 border-2 border-current rounded-xs" />
                  <span>Post 1:1</span>
                  <span className="text-[9px] font-normal opacity-80">Social / WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPosterData((prev) => ({ ...prev, aspectRatio: '9:16' }))}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                    posterData.aspectRatio === '9:16'
                      ? 'bg-sky-600 text-white border-sky-700 shadow-xs ring-2 ring-sky-400/30'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <span className="w-3 h-5 border-2 border-current rounded-xs" />
                  <span>Story 9:16</span>
                  <span className="text-[9px] font-normal opacity-80">Stati / Reels</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPosterData((prev) => ({ ...prev, aspectRatio: 'a4' }))}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                    posterData.aspectRatio === 'a4'
                      ? 'bg-sky-600 text-white border-sky-700 shadow-xs ring-2 ring-sky-400/30'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <span className="w-3.5 h-4.5 border-2 border-current rounded-xs" />
                  <span>Locandina A4</span>
                  <span className="text-[9px] font-normal opacity-80">Stampa / Bacheca</span>
                </button>
              </div>
            </div>

            {/* 3. STILE VISIVO & COLORI */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>3. Stile & Titolo Rapido</span>
              </span>

              {/* Preset Titoli */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Intestazione Badge:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TITOLI.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPosterData((prev) => ({ ...prev, titolo: t }))}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold transition border cursor-pointer ${
                        posterData.titolo === t
                          ? 'bg-sky-600 text-white border-sky-700 shadow-2xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colore Accento */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Colore Accento Grafica:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ACCENT_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setPosterData((prev) => ({ ...prev, accentColor: col.hex }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                        posterData.accentColor === col.hex
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 shadow-xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-black/20"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider Contrasto Sfondo */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  <span>Intensità Contrasto / Ombra Sfondo:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {Math.round(posterData.overlayDarkness * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.75"
                  step="0.05"
                  value={posterData.overlayDarkness}
                  onChange={(e) =>
                    setPosterData((prev) => ({ ...prev, overlayDarkness: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

              {/* Gestione Sfondo Splash o Custom */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaultBg}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ripristina Sfondo Ufficiale (Splash Ball)</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleUploadCustomBg}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Carica Altro Sfondo</span>
                </button>
              </div>
            </div>

            {/* 4. MODIFICA CAMPI TESTO */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>4. Personalizza Dettagli Gara</span>
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                    Squadra Casa:
                  </label>
                  <input
                    type="text"
                    value={posterData.squadraCasa}
                    onChange={(e) => setPosterData((prev) => ({ ...prev, squadraCasa: e.target.value }))}
                    className="w-full text-xs font-bold p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                    Squadra Ospite:
                  </label>
                  <input
                    type="text"
                    value={posterData.squadraOspite}
                    onChange={(e) => setPosterData((prev) => ({ ...prev, squadraOspite: e.target.value }))}
                    className="w-full text-xs font-bold p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Campionato / Categoria:
                </label>
                <input
                  type="text"
                  value={posterData.campionato}
                  onChange={(e) => setPosterData((prev) => ({ ...prev, campionato: e.target.value }))}
                  className="w-full text-xs font-bold p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                    Data Gara:
                  </label>
                  <input
                    type="text"
                    value={posterData.dataGara}
                    onChange={(e) => setPosterData((prev) => ({ ...prev, dataGara: e.target.value }))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                    Orario:
                  </label>
                  <input
                    type="text"
                    value={posterData.oraGara}
                    onChange={(e) => setPosterData((prev) => ({ ...prev, oraGara: e.target.value }))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                    Stadio / Campo:
                  </label>
                  <input
                    type="text"
                    value={posterData.campo}
                    onChange={(e) => setPosterData((prev) => ({ ...prev, campo: e.target.value }))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                    Indirizzo & Città:
                  </label>
                  <input
                    type="text"
                    value={posterData.indirizzo}
                    onChange={(e) => setPosterData((prev) => ({ ...prev, indirizzo: e.target.value }))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Avviso Biglietti / Ingresso:
                </label>
                <input
                  type="text"
                  value={posterData.infoExtra}
                  onChange={(e) => setPosterData((prev) => ({ ...prev, infoExtra: e.target.value }))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Hashtag & Piè di Pagina:
                </label>
                <input
                  type="text"
                  value={posterData.hashtag}
                  onChange={(e) => setPosterData((prev) => ({ ...prev, hashtag: e.target.value }))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* COLONNA DESTRA: ANTEPRIMA LIVE HD & AZIONI DI ESPORTAZIONE (6 cols) */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Anteprima Grafica Live (Sfondo Splash)</span>
                </span>
                {isRenderingPreview && (
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold animate-pulse">
                    Rendering...
                  </span>
                )}
              </div>

              {/* Contenitore Canvas Centrato con Ombra e Bordo Realistico */}
              <div className="flex-1 min-h-[380px] bg-slate-950/20 dark:bg-black/40 rounded-xl p-2.5 flex items-center justify-center overflow-hidden border border-slate-300/50 dark:border-slate-700/50">
                <div className="max-w-full max-h-[500px] flex items-center justify-center">
                  <canvas
                    ref={previewCanvasRef}
                    className="max-w-full max-h-[480px] object-contain rounded-lg shadow-2xl border border-white/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* BARRA AZIONI RAPIDE ESPORTAZIONE */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {/* 1. SCARICA PNG HD */}
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="py-2.5 px-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Scarica immagine PNG ad altissima risoluzione per WhatsApp, Instagram, Facebook"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Scarica PNG</span>
                </button>

                {/* 2. SCARICA PDF A4 */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="py-2.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Scarica file PDF vettoriale pronto per la stampa A4"
                >
                  <Printer className="w-4 h-4" />
                  <span>PDF A4</span>
                </button>

                {/* 3. CONDIVIDI SMARTPHONE */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Condividi direttamente su WhatsApp, Telegram, Instagram tramite smartphone"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Condividi</span>
                </button>

                {/* 4. COPIA APPUNTI */}
                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="py-2.5 px-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-[0.98] text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Copia l'immagine negli appunti per incollarla subito in WhatsApp Web o su Facebook"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Copiato!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copia</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 text-center">
                Ottimizzata per schermi Retina e formati social standard (1080x1080, 1080x1920 Story e A4 stampa).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
