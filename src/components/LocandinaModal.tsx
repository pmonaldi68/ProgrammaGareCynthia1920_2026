import React, { useState, useMemo, useRef } from 'react';
import { Partita } from '../types';
import {
  X,
  FileDown,
  Printer,
  Share2,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  RotateCcw,
  Upload,
  Check,
  Building2,
  Clock,
  Shield,
  MapPin,
} from 'lucide-react';
import {
  generateLocandinaPdf,
  downloadLocandinaPdf,
  downloadLocandinaImage,
  printLocandinaPdf,
  shareLocandinaPdf,
  computeWeekendDatesString,
  LocandinaPdfOptions,
} from '../utils/locandinaPdfGenerator';
import { CYNTHIA_LOGO_BASE64 } from '../assets/logoBase64';
import { formatMatchDateAndDay } from '../utils/dateFormatter';

interface LocandinaModalProps {
  isOpen: boolean;
  onClose: () => void;
  partite: Partita[];
}

export const LocandinaModal: React.FC<LocandinaModalProps> = ({
  isOpen,
  onClose,
  partite,
}) => {
  // Testi personalizzabili
  const [titolo, setTitolo] = useState<string>('PROGRAMMA GARE DEL FINE SETTIMANA');
  const [sottotitolo, setSottotitolo] = useState<string>(() => computeWeekendDatesString(partite));
  const [motto, setMotto] = useState<string>('TUTTI AL CAMPO A SOSTENERE I BIANCOAZZURRI!');
  const [notePiePagina, setNotePiePagina] = useState<string>(
    'A.S.D. CYNTHIA 1920 • GENZANO DI ROMA (RM)'
  );

  // Logo caricato: default al logo ufficiale Cynthia 1920 (con scudo dorato e arciere)
  const [logoBase64, setLogoBase64] = useState<string>(CYNTHIA_LOGO_BASE64);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selezione delle partite da includere nella locandina
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(() => {
    return new Set(partite.map((p) => p.id));
  });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sincronizza se cambiano le partite
  React.useEffect(() => {
    setSelectedMatchIds(new Set(partite.map((p) => p.id)));
    setSottotitolo(computeWeekendDatesString(partite));
  }, [partite]);

  // Lista effettiva delle partite selezionate (ordinate per data e ora)
  const selectedPartite = useMemo(() => {
    return partite
      .filter((p) => selectedMatchIds.has(p.id))
      .sort((a, b) => {
        // Ordinamento per data poi per ora
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        return a.ora.localeCompare(b.ora);
      });
  }, [partite, selectedMatchIds]);

  if (!isOpen) return null;

  // Toggle singola partita
  const toggleMatch = (id: string) => {
    const next = new Set(selectedMatchIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedMatchIds(next);
  };

  // Seleziona tutte / deseleziona tutte
  const selectAll = () => setSelectedMatchIds(new Set(partite.map((p) => p.id)));
  const deselectAll = () => setSelectedMatchIds(new Set());

  // Filtri rapidi
  const selectOnlyCasa = () => {
    setSelectedMatchIds(new Set(partite.filter((p) => p.isCynthiaCasa).map((p) => p.id)));
  };
  const selectOnlyTrasferta = () => {
    setSelectedMatchIds(new Set(partite.filter((p) => p.isCynthiaOspite).map((p) => p.id)));
  };

  // Opzioni PDF correnti
  const getPdfOptions = (): LocandinaPdfOptions => ({
    partite: selectedPartite,
    titolo,
    sottotitolo,
    motto,
    notePiePagina,
    logoBase64,
  });

  // Download PDF fedele al 100% all'anteprima
  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    setStatusMessage('Generazione PDF A4 fedele...');
    try {
      await downloadLocandinaPdf(getPdfOptions());
      setStatusMessage('Locandina PDF scaricata con successo!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Errore creazione PDF locandina:', err);
      setStatusMessage('Errore durante il download del PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Immagine PNG ad alta risoluzione (300 DPI) per Social e WhatsApp
  const handleDownloadImage = async () => {
    setIsGenerating(true);
    setStatusMessage('Generazione immagine HD...');
    try {
      const ok = await downloadLocandinaImage(getPdfOptions());
      if (ok) {
        setStatusMessage('Immagine PNG salvata con successo!');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Errore creazione immagine locandina:', err);
      setStatusMessage('Errore durante il salvataggio.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Stampa diretta fedele
  const handlePrint = async () => {
    setIsGenerating(true);
    setStatusMessage('Preparazione stampa A4...');
    try {
      await printLocandinaPdf(getPdfOptions());
      setTimeout(() => setStatusMessage(null), 2000);
    } catch (err) {
      console.error('Errore stampa locandina:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Condividi
  const handleShare = async () => {
    setIsGenerating(true);
    setStatusMessage('Preparazione condivisione...');
    try {
      const res = await shareLocandinaPdf(getPdfOptions());
      if (res.shared) {
        setStatusMessage('Condiviso con successo!');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Errore condivisione locandina:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Caricamento logo personalizzato da file
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoBase64(event.target.result as string);
          setStatusMessage('Logo aggiornato nella locandina!');
          setTimeout(() => setStatusMessage(null), 2500);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isTwoColumns = selectedPartite.length > 6;

  return (
    <div
      id="modal-locandina-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        id="modal-locandina-container"
        className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-7xl max-h-[94vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-cyan-800 dark:from-slate-950 dark:via-sky-950 dark:to-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-sky-700/50 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                  Locandina Gare Ufficiale A4
                </h3>
                <span className="bg-amber-400/20 text-amber-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-300/30">
                  Stampa & Social
                </span>
              </div>
              <p className="text-xs text-sky-200/90 mt-0.5">
                Genera il poster delle gare in formato A4 verticale con il logo caricato al centro in alto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-sky-200 hover:text-white hover:bg-white/10 transition"
              title="Chiudi finestra"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifica di stato temporanea */}
        {statusMessage && (
          <div className="bg-emerald-600 text-white text-xs font-semibold py-2 px-4 text-center animate-in fade-in">
            {statusMessage}
          </div>
        )}

        {/* Corpo: 2 Colonne (Sinistra: Controlli e Selezione | Destra: Anteprima Fedele A4) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/50">
          
          {/* COLONNA SINISTRA: CONTROLLI & PERSONALIZZAZIONE (5 cols su desktop) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Box 1: Azioni Rapide Stampa & Download */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileDown className="w-3.5 h-3.5 text-sky-500" />
                Azioni Esportazione
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  id="btn-locandina-download"
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGenerating || selectedPartite.length === 0}
                  className="py-2.5 px-3 rounded-xl bg-sky-700 hover:bg-sky-800 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                  title="Scarica il file PDF A4 esattamente identico all'anteprima a schermo"
                >
                  <FileDown className="w-4 h-4 text-sky-200" />
                  <span>Scarica PDF A4</span>
                </button>

                <button
                  id="btn-locandina-image"
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={isGenerating || selectedPartite.length === 0}
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                  title="Salva immagine PNG ad alta risoluzione (300 DPI) per Social e WhatsApp"
                >
                  <ImageIcon className="w-4 h-4 text-indigo-200" />
                  <span>Salva PNG HD</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  id="btn-locandina-print"
                  type="button"
                  onClick={handlePrint}
                  disabled={isGenerating || selectedPartite.length === 0}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                  title="Stampa diretta su stampante in formato A4"
                >
                  <Printer className="w-4 h-4 text-emerald-200" />
                  <span>Stampa A4</span>
                </button>

                <button
                  id="btn-locandina-share"
                  type="button"
                  onClick={handleShare}
                  disabled={isGenerating || selectedPartite.length === 0}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 active:scale-[0.98] text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  title="Condividi locandina via WhatsApp o Social"
                >
                  <Share2 className="w-3.5 h-3.5 text-sky-500" />
                  <span className="truncate">Condividi</span>
                </button>
              </div>
            </div>

            {/* Box 2: Logo Caricato Centrato in Alto */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                  Logo Ufficiale al Centro in Alto
                </span>
                {logoBase64 !== CYNTHIA_LOGO_BASE64 && (
                  <button
                    type="button"
                    onClick={() => setLogoBase64(CYNTHIA_LOGO_BASE64)}
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Ripristina
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-14 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-center flex-shrink-0">
                  <img
                    src={logoBase64}
                    alt="Logo Cynthia Caricato"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    Logo ASD Cynthia 1920
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Posizionato in alto al centro della locandina A4
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Carica un logo alternativo"
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cambia</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Box 3: Testi Personalizzabili della Locandina */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-500" />
                Testi & Intestazione Locandina
              </span>

              {/* Titolo Principale */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Titolo Principale
                </label>
                <input
                  type="text"
                  value={titolo}
                  onChange={(e) => setTitolo(e.target.value)}
                  placeholder="PROGRAMMA GARE DEL FINE SETTIMANA"
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[
                    'PROGRAMMA GARE DEL FINE SETTIMANA',
                    'IL WEEKEND BIANCOAZZURRO',
                    'PROSSIMO TURNO DI CAMPIONATO',
                  ].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTitolo(p)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-sky-50 hover:text-sky-700"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sottotitolo / Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Date / Turno Weekend
                </label>
                <input
                  type="text"
                  value={sottotitolo}
                  onChange={(e) => setSottotitolo(e.target.value)}
                  placeholder="SABATO 28 & DOMENICA 29 SETTEMBRE 2026"
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Motto / Invito ai tifosi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Motto / Slogan Iniziale
                </label>
                <input
                  type="text"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder="TUTTI AL CAMPO A SOSTENERE I BIANCOAZZURRI!"
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Note Piè di Pagina */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Testo Piè di Pagina
                </label>
                <input
                  type="text"
                  value={notePiePagina}
                  onChange={(e) => setNotePiePagina(e.target.value)}
                  placeholder="A.S.D. CYNTHIA 1920 • GENZANO DI ROMA (RM)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Box 4: Selezione Gare da Includere */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  Gare Incluse ({selectedPartite.length} di {partite.length})
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
                  Layout {isTwoColumns ? '2 Colonne' : '1 Colonna'}
                </span>
              </div>

              {/* Bottoni filtri rapidi */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 hover:bg-sky-200"
                >
                  Tutte ({partite.length})
                </button>
                <button
                  type="button"
                  onClick={selectOnlyCasa}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200"
                >
                  Solo Casa
                </button>
                <button
                  type="button"
                  onClick={selectOnlyTrasferta}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 hover:bg-amber-200"
                >
                  Solo Trasferta
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg text-slate-500 hover:text-rose-600"
                >
                  Deseleziona
                </button>
              </div>

              {/* Elenco Partite Selezionabili */}
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 pr-1">
                {partite.map((p) => {
                  const isChecked = selectedMatchIds.has(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-start gap-2.5 py-2 px-2 rounded-lg cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-sky-50/50 dark:bg-sky-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMatch(p.id)}
                        className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {p.campionato}
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                              p.isCynthiaCasa
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                            }`}
                          >
                            {p.isCynthiaCasa ? 'CASA' : 'TRASFERTA'}
                          </span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 text-[11px] truncate">
                          {p.squadraCasa} vs {p.squadraOspite}
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          {p.data} • ore {p.ora}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>

          {/* COLONNA DESTRA: ANTEPRIMA LIVE A4 SULLO SCHERMO (7 cols su desktop) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Anteprima Live Scheda A4 ({selectedPartite.length} gare)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Formato A4 Portrait (210 × 297 mm)
              </span>
            </div>

            {/* FOGLIO A4 RENDERING LIVE */}
            <div className="w-full flex justify-center overflow-x-auto pb-4">
              <div
                id="locandina-sheet-a4"
                className="bg-white text-slate-900 shadow-xl rounded-md relative flex flex-col justify-between"
                style={{
                  width: '100%',
                  maxWidth: '540px',
                  minHeight: '760px',
                  padding: '16px',
                  border: '3.5px solid #0c4a6e',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                }}
              >
                {/* Cornice decorativa interna dorata */}
                <div
                  className="absolute pointer-events-none rounded-[3px]"
                  style={{
                    top: '5px',
                    bottom: '5px',
                    left: '5px',
                    right: '5px',
                    border: '1.5px solid #d97706',
                  }}
                />

                {/* Header Locandina con Logo Centrato in Alto */}
                <div className="text-center pt-2 relative z-10">
                  
                  {/* Logo Centrato in Alto con Linee Simmetriche */}
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="h-[2px] flex-1 bg-[#0c4a6e]" />
                    <div className="relative">
                      <img
                        id="locandina-logo-preview"
                        src={logoBase64}
                        alt="Logo Cynthia 1920 Centrato"
                        className="h-20 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105"
                        crossOrigin="anonymous"
                      />
                    </div>
                    <div className="h-[2px] flex-1 bg-[#0c4a6e]" />
                  </div>

                  {/* Nome Società */}
                  <h1 className="text-xl font-extrabold tracking-tight text-[#0c4a6e] leading-tight">
                    A.S.D. CYNTHIA 1920
                  </h1>

                  {/* Titolo Principale */}
                  <h2 className="text-sm font-black tracking-wide text-sky-700 uppercase mt-0.5">
                    {titolo}
                  </h2>

                  {/* Badge Data Weekend */}
                  <div className="inline-block mt-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0c4a6e] text-xs font-black shadow-2xs">
                    {sottotitolo}
                  </div>

                  {/* Motto */}
                  {motto && (
                    <p className="text-[11px] font-extrabold italic text-amber-700 mt-1.5">
                      {motto}
                    </p>
                  )}
                </div>

                {/* Elenco Gare */}
                <div className="my-3 flex-1 relative z-10">
                  {selectedPartite.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs italic">
                      Seleziona almeno una gara dalla colonna a sinistra
                    </div>
                  ) : (
                    <div
                      className={`grid gap-2 ${
                        isTwoColumns ? 'grid-cols-2' : 'grid-cols-1'
                      }`}
                    >
                      {selectedPartite.map((p) => {
                        const isCasa = p.isCynthiaCasa;
                        const dateInfo = formatMatchDateAndDay(p.data, p.ora);

                        return (
                          <div
                            key={p.id}
                            className={`p-2.5 rounded-xl border text-left flex flex-col justify-between relative overflow-hidden transition-all ${
                              isCasa
                                ? 'bg-sky-50/50 border-sky-300'
                                : 'bg-white border-slate-200 shadow-2xs'
                            }`}
                            style={{
                              backgroundColor: isCasa ? '#f0f9ff' : '#ffffff',
                              borderColor: isCasa ? '#7dd3fc' : '#e2e8f0',
                            }}
                          >
                            {/* Striscia laterale colore */}
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1.5"
                              style={{
                                backgroundColor: isCasa ? '#0284c7' : '#d97706',
                              }}
                            />

                            {/* Header Card: Categoria + Badge Casa/Trasferta */}
                            <div className="flex items-center justify-between gap-1 pl-1.5">
                              <span className="font-extrabold text-[10px] text-[#0c4a6e] uppercase truncate">
                                {p.campionato}
                              </span>
                              <span
                                className="text-[8px] font-black px-1.5 py-0.5 rounded-md"
                                style={{
                                  backgroundColor: isCasa ? '#e0f2fe' : '#fef3c7',
                                  color: isCasa ? '#0369a1' : '#b45309',
                                  border: `1px solid ${isCasa ? '#bae6fd' : '#fde68a'}`,
                                }}
                              >
                                {isCasa ? 'CASA' : 'TRASFERTA'}
                              </span>
                            </div>

                            {/* Data e Orario */}
                            <div className="text-[10px] font-bold text-slate-600 pl-1.5 mt-0.5 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                              <span>
                                {dateInfo.dayOfWeek ? dateInfo.dayOfWeek + ' ' : ''}
                                {p.data} • ore {p.ora}
                              </span>
                            </div>

                            {/* Squadre */}
                            <div className="text-xs font-black text-slate-800 pl-1.5 my-1 leading-snug">
                              <span style={{ color: isCasa ? '#0369a1' : '#1e293b' }}>
                                {p.squadraCasa}
                              </span>
                              <span className="text-slate-400 font-normal mx-1">vs</span>
                              <span style={{ color: !isCasa ? '#0369a1' : '#1e293b' }}>
                                {p.squadraOspite}
                              </span>
                            </div>

                            {/* Campo Sportivo */}
                            {p.campo && (
                              <div className="text-[9px] text-slate-500 pl-1.5 truncate flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{p.campo}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Istituzionale A4 */}
                <div
                  className="text-white p-2.5 rounded-lg text-center mt-2 relative z-10"
                  style={{
                    backgroundColor: '#0c4a6e',
                  }}
                >
                  <p className="text-[10px] font-bold leading-tight uppercase tracking-wider text-white">
                    {notePiePagina}
                  </p>
                  <p className="text-[8.5px] mt-0.5" style={{ color: '#bae6fd' }}>
                    Sito Ufficiale: asdcynthia1920.it • Canale WhatsApp Ufficiale • #ForzaCynthia
                  </p>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
