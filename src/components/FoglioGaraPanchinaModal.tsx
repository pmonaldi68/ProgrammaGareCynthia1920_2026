import React, { useState, useEffect, useMemo } from 'react';
import { Partita } from '../types';
import {
  FoglioGaraData,
  GolItem,
  buildDefaultFoglioGaraData,
  downloadFoglioGaraPdf,
  shareFoglioGaraPdf,
} from '../utils/foglioGaraPdfGenerator';
import {
  loadCachedGiocatori,
  loadSavedConvocatiForMatch,
  loadSavedMisterForMatch,
  resolveMisterForMatch,
  isCategoryMatch,
} from '../services/convocazioniService';
import { CYNTHIA_LOGO_BASE64 } from '../assets/logoBase64';
import { LND_LAZIO_SVG_DATA_URI } from '../assets/lndLogoBase64';
import {
  X,
  Printer,
  FileDown,
  Share2,
  Users,
  Eraser,
  RotateCcw,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface FoglioGaraPanchinaModalProps {
  isOpen: boolean;
  onClose: () => void;
  partite: Partita[];
  initialPartitaId?: string;
}

export const FoglioGaraPanchinaModal: React.FC<FoglioGaraPanchinaModalProps> = ({
  isOpen,
  onClose,
  partite,
  initialPartitaId,
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [foglioData, setFoglioData] = useState<FoglioGaraData | null>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Inizializza partita selezionata all'apertura
  useEffect(() => {
    if (!isOpen) return;
    if (partite.length === 0) return;

    let targetId = initialPartitaId;
    if (!targetId || !partite.some(p => p.id === targetId)) {
      const cynthiaMatch = partite.find(p => p.isCynthiaCasa || p.isCynthiaOspite);
      targetId = cynthiaMatch ? cynthiaMatch.id : partite[0].id;
    }

    setSelectedMatchId(targetId);
  }, [isOpen, initialPartitaId, partite]);

  // Aggiorna foglioData quando cambia la partita selezionata
  useEffect(() => {
    if (!selectedMatchId) return;

    const currentMatch = partite.find(p => p.id === selectedMatchId);
    if (!currentMatch) return;

    // 1. Tenta di recuperare i convocati salvati per questa gara
    const savedConvocatiIds = loadSavedConvocatiForMatch(currentMatch.id);
    const allGiocatori = loadCachedGiocatori();

    let nomiConvocati: string[] = [];

    if (savedConvocatiIds && savedConvocatiIds.length > 0) {
      const idSet = new Set(savedConvocatiIds);
      nomiConvocati = allGiocatori
        .filter(g => idSet.has(g.id))
        .map(g => (g.nome || '').trim());
    } else {
      const catGiocatori = allGiocatori
        .filter(g => g.categoria && isCategoryMatch(g.categoria, currentMatch.campionato))
        .slice(0, 20)
        .map(g => (g.nome || '').trim());

      if (catGiocatori.length > 0) {
        nomiConvocati = catGiocatori;
      }
    }

    // 2. Risolvi il Mister
    let mister = loadSavedMisterForMatch(currentMatch.id);
    if (!mister) {
      mister = resolveMisterForMatch(currentMatch, currentMatch.campionato);
    }

    const initialData = buildDefaultFoglioGaraData(currentMatch, nomiConvocati, mister);
    setFoglioData(initialData);
  }, [selectedMatchId, partite]);

  const currentPartita = useMemo(() => {
    return partite.find(p => p.id === selectedMatchId) || null;
  }, [partite, selectedMatchId]);

  if (!isOpen || !foglioData) return null;

  // Carica i convocati della squadra Cynthia
  const handleLoadConvocatiCynthia = () => {
    if (!currentPartita) return;
    const allGiocatori = loadCachedGiocatori();
    const savedConvocatiIds = loadSavedConvocatiForMatch(currentPartita.id);

    let nomi: string[] = [];
    if (savedConvocatiIds && savedConvocatiIds.length > 0) {
      const idSet = new Set(savedConvocatiIds);
      nomi = allGiocatori
        .filter(g => idSet.has(g.id))
        .map(g => (g.nome || '').trim());
    } else {
      nomi = allGiocatori
        .filter(g => g.categoria && isCategoryMatch(g.categoria, currentPartita.campionato))
        .map(g => (g.nome || '').trim());
    }

    setFoglioData(prev => {
      if (!prev) return prev;
      const isCasa = prev.isCynthiaCasa;

      const updatedCasa = prev.giocatoriCasa.map((g, idx) => ({
        ...g,
        nome: isCasa ? (nomi[idx] || '') : g.nome,
      }));

      const updatedOspiti = prev.giocatoriOspite.map((g, idx) => ({
        ...g,
        nome: !isCasa ? (nomi[idx] || '') : g.nome,
      }));

      return {
        ...prev,
        giocatoriCasa: updatedCasa,
        giocatoriOspite: updatedOspiti,
      };
    });

    setStatusMessage('Convocati Cynthia caricati nel foglio!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Svuota tutti i giocatori per stampare il foglio completamente vuoto da compilare a penna
  const handleClearPlayers = () => {
    setFoglioData(prev => {
      if (!prev) return prev;
      const emptyGol = (): GolItem[] => [
        { minuto: '', numero: '' },
        { minuto: '', numero: '' },
        { minuto: '', numero: '' },
      ];
      return {
        ...prev,
        giocatoriCasa: prev.giocatoriCasa.map(g => ({ ...g, nome: '', esce: '', entra: '', esp: '', amm: '' })),
        giocatoriOspite: prev.giocatoriOspite.map(g => ({ ...g, nome: '', esce: '', entra: '', esp: '', amm: '' })),
        calcioInizio1T: '',
        calcioInizio2T: '',
        recupero1T: '',
        recupero2T: '',
        retiCasa: '',
        retiOspite: '',
        golCasa1T: emptyGol(),
        golCasa2T: emptyGol(),
        golOspiti1T: emptyGol(),
        golOspiti2T: emptyGol(),
        note: '',
      };
    });
    setStatusMessage('Foglio svuotato: pronto per la compilazione manuale a penna!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Reimposta i dati originali
  const handleResetMatchData = () => {
    if (!currentPartita) return;
    const initialData = buildDefaultFoglioGaraData(currentPartita);
    setFoglioData(initialData);
    setStatusMessage('Dati gara ripristinati!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Stampa diretta A4 fedele e ink-friendly
  const handlePrint = () => {
    setIsPrinting(true);
    setStatusMessage('Preparazione stampa A4...');
    document.body.classList.add('print-foglio-panchina');

    const cleanup = () => {
      document.body.classList.remove('print-foglio-panchina');
      setIsPrinting(false);
      setStatusMessage(null);
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 2000);
    }, 150);
  };

  // Download PDF A4
  const handleDownload = async () => {
    if (!foglioData) return;
    setStatusMessage('Generazione PDF in corso...');
    try {
      await downloadFoglioGaraPdf(foglioData);
      setStatusMessage('PDF A4 scaricato con successo!');
    } catch (err) {
      console.warn('Errore download PDF:', err);
      setStatusMessage('Errore generazione PDF');
    } finally {
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  // Condividi
  const handleShare = async () => {
    if (!foglioData) return;
    setStatusMessage('Condivisione in corso...');
    try {
      await shareFoglioGaraPdf(foglioData);
    } catch (err) {
      console.warn('Errore condivisione:', err);
    } finally {
      setStatusMessage(null);
    }
  };

  // Helper aggiornamento giocatore
  const updatePlayer = (
    team: 'casa' | 'ospiti',
    index: number,
    field: 'nome' | 'esce' | 'entra' | 'esp' | 'amm',
    value: string
  ) => {
    setFoglioData(prev => {
      if (!prev) return prev;
      if (team === 'casa') {
        const next = [...prev.giocatoriCasa];
        next[index] = { ...next[index], [field]: value };
        return { ...prev, giocatoriCasa: next };
      } else {
        const next = [...prev.giocatoriOspite];
        next[index] = { ...next[index], [field]: value };
        return { ...prev, giocatoriOspite: next };
      }
    });
  };

  // Helper aggiornamento gol
  const updateGol = (
    team: 'casa' | 'ospiti',
    tempo: '1T' | '2T',
    index: number,
    field: 'minuto' | 'numero',
    value: string
  ) => {
    setFoglioData(prev => {
      if (!prev) return prev;
      const targetKey =
        team === 'casa'
          ? tempo === '1T'
            ? 'golCasa1T'
            : 'golCasa2T'
          : tempo === '1T'
          ? 'golOspiti1T'
          : 'golOspiti2T';

      const nextList = [...prev[targetKey]];
      nextList[index] = { ...nextList[index], [field]: value };
      return { ...prev, [targetKey]: nextList };
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Intestazione Modale (No-print) */}
        <div className="no-print-foglio bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 px-4 sm:px-6 py-3.5 text-white flex items-center justify-between shadow-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                <span>Foglio Gara Panchina (Referto Ufficiale A4)</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-400 text-slate-900">
                  Fedele 1:1
                </span>
              </h3>
              <p className="text-xs text-sky-100 font-medium">
                Compilazione automatica dai dati gara: formazioni, cambi, cartellini, marcatori e note per la panchina
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-sky-200 hover:text-white hover:bg-white/15 transition cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Controlli (No-print) */}
        <div className="no-print-foglio bg-slate-50 dark:bg-slate-800/90 px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0">
          {/* Selettore Partita */}
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
              Partita:
            </span>
            <div className="relative flex-1">
              <select
                value={selectedMatchId}
                onChange={e => setSelectedMatchId(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 pr-8 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none truncate cursor-pointer shadow-2xs"
              >
                {partite.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.campionato} • {p.squadraCasa} vs {p.squadraOspite} ({p.data} ore {p.ora})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Azioni Rapide Foglio */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLoadConvocatiCynthia}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-600 shadow-2xs transition cursor-pointer"
              title="Carica automaticamente i giocatori convocati per Cynthia"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Carica Convocati Cynthia</span>
            </button>

            <button
              type="button"
              onClick={handleClearPlayers}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-2xs transition cursor-pointer"
              title="Svuota tutti i nomi per stampare un foglio pulito da compilare a mano con penna"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Foglio Vuoto (A Penna)</span>
            </button>

            <button
              type="button"
              onClick={handleResetMatchData}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Ripristina dati iniziali partita"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Pulsante Stampa A4 */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-2xs transition cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa A4</span>
            </button>

            {/* Pulsante Scarica PDF */}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition cursor-pointer active:scale-95"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Scarica PDF</span>
            </button>

            {/* Pulsante Condividi */}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white shadow-2xs transition cursor-pointer"
              title="Condividi tramite WhatsApp o altre app"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notifica Rapida (No-print) */}
        {statusMessage && (
          <div className="no-print-foglio bg-sky-50 dark:bg-sky-950/80 border-b border-sky-200 dark:border-sky-800 px-4 py-1.5 text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              {statusMessage}
            </span>
          </div>
        )}

        {/* Area Foglio A4 (Riproduzione Fedele 1:1) */}
        <div
          id="foglio-panchina-a4-wrapper"
          className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/80 dark:bg-slate-950/80 flex justify-center"
        >
          {/* Foglio Formato A4 Stile Carta Reale Fedele */}
          <div
            id="foglio-panchina-a4"
            className="w-full max-w-[820px] bg-white text-slate-950 shadow-2xl border border-slate-400 p-5 rounded-sm select-text text-[11px] font-sans"
            style={{ minHeight: '1080px' }}
          >
            {/* 1. Header con Loghi e Titolo Istituzionale */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b-2 border-slate-950">
              {/* Logo Cynthia Sinistra */}
              <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                {CYNTHIA_LOGO_BASE64 ? (
                  <img
                    src={CYNTHIA_LOGO_BASE64}
                    alt="Cynthia 1920"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="w-14 h-14 bg-sky-600 rounded-full flex items-center justify-center text-white font-black text-xs">
                    CYNTHIA
                  </div>
                )}
              </div>

              {/* Titolo Centrale */}
              <div className="text-center flex-1 px-2">
                <h1 className="text-2xl sm:text-3xl font-black text-sky-600 tracking-tight leading-none uppercase">
                  CYNTHIA 1920
                </h1>
                <p className="text-[11px] sm:text-xs font-bold text-sky-800 tracking-wider mt-1 uppercase">
                  F.I.G.C. - L.N.D. - COMITATO REGIONALE LAZIO
                </p>
                <p className="text-[9.5px] text-slate-600 font-bold mt-0.5 uppercase tracking-wide">
                  STAGIONE SPORTIVA 2026/2027 • {foglioData.campionato}{' '}
                  {foglioData.girone && foglioData.girone !== '#' ? `• Girone ${foglioData.girone}` : ''}{' '}
                  {foglioData.gara ? `• ${foglioData.gara}` : ''}
                </p>
              </div>

              {/* Logo LND Lazio Destra */}
              <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                <img
                  src={LND_LAZIO_SVG_DATA_URI}
                  alt="LND Lazio"
                  className="w-14 h-14 object-contain rounded-full shadow-2xs"
                />
              </div>
            </div>

            {/* 2. Barra Boxata Dati Gara (DATA, ORA INIZIO 1° TEMPO, ORA INIZIO 2° TEMPO, CAMPO) */}
            <div className="border border-slate-950 grid grid-cols-12 text-center text-xs font-bold divide-x divide-slate-950 bg-white">
              <div className="col-span-1 bg-slate-100 py-1 flex items-center justify-center text-[10px] font-black uppercase">
                DATA
              </div>
              <div className="col-span-2 py-1 flex items-center justify-center font-black text-xs text-slate-950">
                <input
                  type="text"
                  value={foglioData.data}
                  onChange={e => setFoglioData({ ...foglioData, data: e.target.value })}
                  className="w-full text-center font-bold text-xs bg-transparent focus:outline-none"
                />
              </div>
              <div className="col-span-2 bg-slate-100 py-1 flex items-center justify-center text-[9px] font-black leading-tight uppercase px-1">
                ORA INIZIO 1° TEMPO
              </div>
              <div className="col-span-1 py-1 flex items-center justify-center font-black text-xs text-slate-950">
                <input
                  type="text"
                  value={foglioData.ora1T}
                  onChange={e => setFoglioData({ ...foglioData, ora1T: e.target.value })}
                  className="w-full text-center font-bold text-xs bg-transparent focus:outline-none"
                />
              </div>
              <div className="col-span-2 bg-slate-100 py-1 flex items-center justify-center text-[9px] font-black leading-tight uppercase px-1">
                ORA INIZIO 2° TEMPO
              </div>
              <div className="col-span-1 py-1 flex items-center justify-center font-black text-xs text-slate-950">
                <input
                  type="text"
                  value={foglioData.ora2T || ''}
                  onChange={e => setFoglioData({ ...foglioData, ora2T: e.target.value })}
                  placeholder=""
                  className="w-full text-center font-bold text-xs bg-transparent focus:outline-none"
                />
              </div>
              <div className="col-span-1 bg-slate-100 py-1 flex items-center justify-center text-[10px] font-black uppercase">
                CAMPO
              </div>
              <div className="col-span-2 py-1 flex items-center justify-center font-bold text-[10px] text-slate-950 px-1">
                <input
                  type="text"
                  value={`${foglioData.campo}${foglioData.comune ? ` (${foglioData.comune})` : ''}`}
                  onChange={e => setFoglioData({ ...foglioData, campo: e.target.value })}
                  className="w-full text-center font-bold text-[10px] uppercase bg-transparent focus:outline-none truncate"
                />
              </div>
            </div>

            {/* 3. Riga Reti, Calcio Inizio, Recupero & VS Centrale */}
            <div className="border-x border-b border-slate-950 grid grid-cols-12 text-xs divide-x divide-slate-950 bg-white">
              {/* Sinistra (Squadra Casa) */}
              <div className="col-span-5 p-1.5 flex flex-col justify-between space-y-1">
                {/* Reti Casa */}
                <div className="flex items-center justify-end gap-1.5">
                  <span className="font-black text-[10.5px]">RETI</span>
                  <input
                    type="text"
                    value={foglioData.retiCasa || ''}
                    onChange={e => setFoglioData({ ...foglioData, retiCasa: e.target.value })}
                    placeholder=""
                    className="w-11 h-5.5 border border-slate-950 text-center font-black text-sm bg-white focus:outline-none"
                  />
                </div>

                {/* Calcio Inizio 1° Tempo */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold">CALCIO INIZIO 1° TEMPO</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFoglioData({
                          ...foglioData,
                          calcioInizio1T: foglioData.calcioInizio1T === 'casa' ? '' : 'casa',
                        })
                      }
                      className="flex items-center gap-1 cursor-pointer font-bold select-none text-[9.5px]"
                    >
                      <span className="w-3.5 h-3.5 border border-slate-950 flex items-center justify-center font-black text-[10px] leading-none bg-white">
                        {foglioData.calcioInizio1T === 'casa' ? 'X' : ''}
                      </span>
                      <span>CASA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFoglioData({
                          ...foglioData,
                          calcioInizio1T: foglioData.calcioInizio1T === 'ospiti' ? '' : 'ospiti',
                        })
                      }
                      className="flex items-center gap-1 cursor-pointer font-bold select-none text-[9.5px]"
                    >
                      <span className="w-3.5 h-3.5 border border-slate-950 flex items-center justify-center font-black text-[10px] leading-none bg-white">
                        {foglioData.calcioInizio1T === 'ospiti' ? 'X' : ''}
                      </span>
                      <span>OSPITI</span>
                    </button>
                  </div>
                </div>

                {/* Recupero 1° Tempo */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold">RECUPERO 1° TEMPO</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={foglioData.recupero1T || ''}
                      onChange={e => setFoglioData({ ...foglioData, recupero1T: e.target.value })}
                      placeholder="0"
                      className="w-12 h-4.5 border border-slate-950 text-center text-[10px] font-bold bg-white focus:outline-none"
                    />
                    <span className="text-[9px] font-semibold text-slate-500">min</span>
                  </div>
                </div>
              </div>

              {/* Centro: Badge VS Nero Solido */}
              <div className="col-span-2 bg-slate-950 text-white flex items-center justify-center font-black text-xl italic tracking-wider">
                VS
              </div>

              {/* Destra (Squadra Ospiti) */}
              <div className="col-span-5 p-1.5 flex flex-col justify-between space-y-1">
                {/* Reti Ospiti */}
                <div className="flex items-center justify-start gap-1.5">
                  <input
                    type="text"
                    value={foglioData.retiOspite || ''}
                    onChange={e => setFoglioData({ ...foglioData, retiOspite: e.target.value })}
                    placeholder=""
                    className="w-11 h-5.5 border border-slate-950 text-center font-black text-sm bg-white focus:outline-none"
                  />
                  <span className="font-black text-[10.5px]">RETI</span>
                </div>

                {/* Calcio Inizio 2° Tempo */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold">CALCIO INIZIO 2° TEMPO</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFoglioData({
                          ...foglioData,
                          calcioInizio2T: foglioData.calcioInizio2T === 'casa' ? '' : 'casa',
                        })
                      }
                      className="flex items-center gap-1 cursor-pointer font-bold select-none text-[9.5px]"
                    >
                      <span className="w-3.5 h-3.5 border border-slate-950 flex items-center justify-center font-black text-[10px] leading-none bg-white">
                        {foglioData.calcioInizio2T === 'casa' ? 'X' : ''}
                      </span>
                      <span>CASA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFoglioData({
                          ...foglioData,
                          calcioInizio2T: foglioData.calcioInizio2T === 'ospiti' ? '' : 'ospiti',
                        })
                      }
                      className="flex items-center gap-1 cursor-pointer font-bold select-none text-[9.5px]"
                    >
                      <span className="w-3.5 h-3.5 border border-slate-950 flex items-center justify-center font-black text-[10px] leading-none bg-white">
                        {foglioData.calcioInizio2T === 'ospiti' ? 'X' : ''}
                      </span>
                      <span>OSPITI</span>
                    </button>
                  </div>
                </div>

                {/* Recupero 2° Tempo */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold">RECUPERO 2° TEMPO</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={foglioData.recupero2T || ''}
                      onChange={e => setFoglioData({ ...foglioData, recupero2T: e.target.value })}
                      placeholder="0"
                      className="w-12 h-4.5 border border-slate-950 text-center text-[10px] font-bold bg-white focus:outline-none"
                    />
                    <span className="text-[9px] font-semibold text-slate-500">min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Tabella Formazioni Principale (1-20 + MISTER) */}
            <div className="border-x border-b border-slate-950 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="text-center font-black text-[9.5px] uppercase border-b border-slate-950">
                    <th className="bg-sky-600 text-white w-9 py-1 border-r border-slate-950">ESCE</th>
                    <th className="bg-emerald-600 text-white w-9 py-1 border-r border-slate-950">ENTRA</th>
                    <th className="bg-red-600 text-white w-9 py-1 border-r border-slate-950">ESP.</th>
                    <th className="bg-yellow-400 text-slate-950 w-9 py-1 border-r border-slate-950">AMM.</th>
                    <th className="bg-white text-slate-950 py-1 px-2 border-r border-slate-950 text-left font-bold">
                      FORMAZIONE CASA: <span className="text-sky-800 font-black">{foglioData.squadraCasa}</span>
                    </th>
                    <th className="bg-slate-200 text-slate-950 w-11 py-1 border-r border-slate-950 text-center font-black">
                      N°
                    </th>
                    <th className="bg-white text-slate-950 py-1 px-2 border-r border-slate-950 text-left font-bold">
                      FORMAZIONE OSPITI: <span className="text-slate-800 font-black">{foglioData.squadraOspite}</span>
                    </th>
                    <th className="bg-yellow-400 text-slate-950 w-9 py-1 border-r border-slate-950">AMM.</th>
                    <th className="bg-red-600 text-white w-9 py-1 border-r border-slate-950">ESP.</th>
                    <th className="bg-emerald-600 text-white w-9 py-1 border-r border-slate-950">ENTRA</th>
                    <th className="bg-sky-600 text-white w-9 py-1">ESCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {Array.from({ length: 20 }).map((_, idx) => {
                    const nr = idx + 1;
                    const gCasa = foglioData.giocatoriCasa[idx] || { nr, nome: '' };
                    const gOspite = foglioData.giocatoriOspite[idx] || { nr, nome: '' };
                    const isBenchDivider = nr === 11;

                    return (
                      <tr
                        key={nr}
                        className={`h-6 text-[11px] ${
                          isBenchDivider ? 'border-b-2 border-sky-600' : ''
                        }`}
                      >
                        {/* Eventi Casa */}
                        <td className="border-r border-slate-950 text-center p-0">
                          <input
                            type="text"
                            value={gCasa.esce || ''}
                            onChange={e => updatePlayer('casa', idx, 'esce', e.target.value)}
                            className="w-full text-center text-[10px] bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="border-r border-slate-950 text-center p-0">
                          <input
                            type="text"
                            value={gCasa.entra || ''}
                            onChange={e => updatePlayer('casa', idx, 'entra', e.target.value)}
                            className="w-full text-center text-[10px] bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="border-r border-slate-950 text-center p-0">
                          <input
                            type="text"
                            value={gCasa.esp || ''}
                            onChange={e => updatePlayer('casa', idx, 'esp', e.target.value)}
                            className="w-full text-center text-[10px] font-bold text-red-600 bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="border-r border-slate-950 text-center p-0">
                          <input
                            type="text"
                            value={gCasa.amm || ''}
                            onChange={e => updatePlayer('casa', idx, 'amm', e.target.value)}
                            className="w-full text-center text-[10px] font-bold text-amber-700 bg-transparent focus:outline-none"
                          />
                        </td>

                        {/* Nome Giocatore Casa */}
                        <td className="border-r border-slate-950 px-1 py-0">
                          <input
                            type="text"
                            value={gCasa.nome}
                            onChange={e => updatePlayer('casa', idx, 'nome', e.target.value)}
                            placeholder={nr <= 11 ? `Titolare ${nr}` : `Riserva ${nr}`}
                            className="w-full font-bold text-slate-950 uppercase text-[11px] bg-transparent focus:outline-none px-1 py-0.5"
                          />
                        </td>

                        {/* Numero Maglia N° */}
                        <td className="border-r border-slate-950 bg-slate-100 font-black text-center text-slate-950 text-xs py-0.5">
                          {nr}
                        </td>

                        {/* Nome Giocatore Ospiti */}
                        <td className="border-r border-slate-950 px-1 py-0">
                          <input
                            type="text"
                            value={gOspite.nome}
                            onChange={e => updatePlayer('ospiti', idx, 'nome', e.target.value)}
                            placeholder={nr <= 11 ? `Titolare ${nr}` : `Riserva ${nr}`}
                            className="w-full font-bold text-slate-950 uppercase text-[11px] bg-transparent focus:outline-none px-1 py-0.5"
                          />
                        </td>

                        {/* Eventi Ospiti */}
                        <td className="border-r border-slate-950 text-center p-0">
                          <input
                            type="text"
                            value={gOspite.amm || ''}
                            onChange={e => updatePlayer('ospiti', idx, 'amm', e.target.value)}
                            className="w-full text-center text-[10px] font-bold text-amber-700 bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="border-r border-slate-950 text-center p-0">
                          <input
                            type="text"
                            value={gOspite.esp || ''}
                            onChange={e => updatePlayer('ospiti', idx, 'esp', e.target.value)}
                            className="w-full text-center text-[10px] font-bold text-red-600 bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="border-r border-slate-950 text-center p-0">
                          <input
                            type="text"
                            value={gOspite.entra || ''}
                            onChange={e => updatePlayer('ospiti', idx, 'entra', e.target.value)}
                            className="w-full text-center text-[10px] bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="text-center p-0">
                          <input
                            type="text"
                            value={gOspite.esce || ''}
                            onChange={e => updatePlayer('ospiti', idx, 'esce', e.target.value)}
                            className="w-full text-center text-[10px] bg-transparent focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {/* Riga 21: MISTER */}
                  <tr className="h-7 bg-slate-50 font-bold border-t-2 border-slate-950">
                    <td colSpan={4} className="border-r border-slate-950 bg-slate-100"></td>
                    <td className="border-r border-slate-950 px-1 py-0.5">
                      <input
                        type="text"
                        value={foglioData.misterCasa}
                        onChange={e => setFoglioData({ ...foglioData, misterCasa: e.target.value })}
                        placeholder="Nome Allenatore Casa"
                        className="w-full font-black text-slate-950 uppercase text-[11px] bg-transparent focus:outline-none px-1"
                      />
                    </td>
                    <td className="border-r border-slate-950 bg-slate-200 text-center font-black text-[9.5px] text-slate-950 py-1">
                      MISTER
                    </td>
                    <td className="border-r border-slate-950 px-1 py-0.5">
                      <input
                        type="text"
                        value={foglioData.misterOspite}
                        onChange={e => setFoglioData({ ...foglioData, misterOspite: e.target.value })}
                        placeholder="Nome Allenatore Ospiti"
                        className="w-full font-black text-slate-950 uppercase text-[11px] bg-transparent focus:outline-none px-1"
                      />
                    </td>
                    <td colSpan={4} className="bg-slate-100"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Sezione Tracciamento Marcatori G O L */}
            <div className="border-x border-b border-slate-950 grid grid-cols-12 text-center text-xs divide-x divide-slate-950 mt-1.5 bg-white">
              {/* Gol Casa (Sinistra) */}
              <div className="col-span-5 flex flex-col">
                <div className="grid grid-cols-2 border-b border-slate-950 font-black bg-slate-100 py-0.5 text-[9.5px]">
                  <div className="border-r border-slate-950">1° TEMPO</div>
                  <div>2° TEMPO</div>
                </div>
                <div className="grid grid-cols-4 border-b border-slate-950 text-[8px] font-black py-0.5 divide-x divide-slate-950">
                  <div>MINUTO</div>
                  <div>NUMERO</div>
                  <div>MINUTO</div>
                  <div>NUMERO</div>
                </div>
                {/* 3 righe per i marcatori */}
                {[0, 1, 2].map(r => (
                  <div
                    key={r}
                    className="grid grid-cols-4 h-5.5 border-b border-slate-800 last:border-b-0 divide-x divide-slate-950"
                  >
                    <div className="flex items-center justify-center p-0">
                      <input
                        type="text"
                        value={foglioData.golCasa1T[r]?.minuto || ''}
                        onChange={e => updateGol('casa', '1T', r, 'minuto', e.target.value)}
                        className="w-full text-center text-[10px] font-bold bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-center p-0">
                      <input
                        type="text"
                        value={foglioData.golCasa1T[r]?.numero || ''}
                        onChange={e => updateGol('casa', '1T', r, 'numero', e.target.value)}
                        className="w-full text-center text-[10px] font-bold bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-center p-0">
                      <input
                        type="text"
                        value={foglioData.golCasa2T[r]?.minuto || ''}
                        onChange={e => updateGol('casa', '2T', r, 'minuto', e.target.value)}
                        className="w-full text-center text-[10px] font-bold bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-center p-0">
                      <input
                        type="text"
                        value={foglioData.golCasa2T[r]?.numero || ''}
                        onChange={e => updateGol('casa', '2T', r, 'numero', e.target.value)}
                        className="w-full text-center text-[10px] font-bold bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Banner Verticale Centrale G O L */}
              <div className="col-span-2 bg-slate-950 text-white flex flex-col items-center justify-center font-black text-base py-1 leading-tight tracking-widest">
                <span>G</span>
                <span>O</span>
                <span>L</span>
              </div>

              {/* Gol Ospiti (Destra) */}
              <div className="col-span-5 flex flex-col">
                <div className="grid grid-cols-2 border-b border-slate-950 font-black bg-slate-100 py-0.5 text-[9.5px]">
                  <div className="border-r border-slate-950">1° TEMPO</div>
                  <div>2° TEMPO</div>
                </div>
                <div className="grid grid-cols-4 border-b border-slate-950 text-[8px] font-black py-0.5 divide-x divide-slate-950">
                  <div>MINUTO</div>
                  <div>NUMERO</div>
                  <div>MINUTO</div>
                  <div>NUMERO</div>
                </div>
                {[0, 1, 2].map(r => (
                  <div
                    key={r}
                    className="grid grid-cols-4 h-5.5 border-b border-slate-800 last:border-b-0 divide-x divide-slate-950"
                  >
                    <div className="flex items-center justify-center p-0">
                      <input
                        type="text"
                        value={foglioData.golOspiti1T[r]?.minuto || ''}
                        onChange={e => updateGol('ospiti', '1T', r, 'minuto', e.target.value)}
                        className="w-full text-center text-[10px] font-bold bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-center p-0">
                      <input
                        type="text"
                        value={foglioData.golOspiti1T[r]?.numero || ''}
                        onChange={e => updateGol('ospiti', '1T', r, 'numero', e.target.value)}
                        className="w-full text-center text-[10px] font-bold bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-center p-0">
                      <input
                        type="text"
                        value={foglioData.golOspiti2T[r]?.minuto || ''}
                        onChange={e => updateGol('ospiti', '2T', r, 'minuto', e.target.value)}
                        className="w-full text-center text-[10px] font-bold bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-center p-0">
                      <input
                        type="text"
                        value={foglioData.golOspiti2T[r]?.numero || ''}
                        onChange={e => updateGol('ospiti', '2T', r, 'numero', e.target.value)}
                        className="w-full text-center text-[10px] font-bold bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Sezione NOTE */}
            <div className="mt-2 pt-0.5">
              <div className="flex items-start gap-2">
                <span className="font-black text-[11px] text-slate-950">NOTE:</span>
                <input
                  type="text"
                  value={foglioData.note || ''}
                  onChange={e => setFoglioData({ ...foglioData, note: e.target.value })}
                  placeholder="Note arbitro, dirigenti, cartellini supplementari, infortuni..."
                  className="flex-1 border-b border-slate-950 font-medium text-xs pb-0.5 bg-transparent focus:outline-none"
                />
              </div>
              <div className="border-b border-slate-950 h-5 mt-0.5"></div>
              <div className="border-b border-slate-950 h-5 mt-0.5"></div>
            </div>

            {/* Footer A4 */}
            <div className="mt-2.5 pt-1.5 text-[8.5px] text-slate-500 flex items-center justify-between border-t border-slate-200">
              <span>A.S.D. CYNTHIA 1920 • STAGIONE SPORTIVA 2026/2027 • FOGLIO GARA E NOTE PANCHINA UFFICIALE</span>
              <span>Generato da Programma Gare Cynthia 1920</span>
            </div>
          </div>
        </div>

        {/* Footer Modale Azioni (No-print) */}
        <div className="no-print-foglio bg-slate-50 dark:bg-slate-800 px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            💡 Puoi modificare o completare qualsiasi casella direttamente nel foglio prima di stampare o scaricare il PDF.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
            >
              Chiudi
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa Foglio A4</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
