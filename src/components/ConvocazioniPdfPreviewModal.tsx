import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  Clock,
  User,
  FileText,
  Layout,
} from 'lucide-react';
import {
  ConvocazioniPdfOptions,
  downloadConvocazioniPdf,
  generateConvocazioniPdf,
} from '../utils/convocazioniPdfGenerator';
import { CYNTHIA_LOGO_BASE64 } from '../assets/logoBase64';
import { extractTimeFromRitrovo } from '../services/convocazioniService';

interface ConvocazioniPdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ConvocazioniPdfOptions;
  onDownloadPdf: (modalita?: 'tutta_la_rosa' | 'solo_convocati') => void;
  onPrintPdf: (modalita?: 'tutta_la_rosa' | 'solo_convocati') => void;
  onTogglePlayer?: (id: string) => void;
  onUpdateRitrovoTime?: (newTime: string) => void;
  onUpdateMisterName?: (newName: string) => void;
}

export const ConvocazioniPdfPreviewModal: React.FC<ConvocazioniPdfPreviewModalProps> = ({
  isOpen,
  onClose,
  options,
  onDownloadPdf,
  onPrintPdf,
  onTogglePlayer,
  onUpdateRitrovoTime,
  onUpdateMisterName,
}) => {
  const [modalita, setModalita] = useState<'tutta_la_rosa' | 'solo_convocati'>(
    options.modalita || 'tutta_la_rosa'
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const {
    campionato,
    squadraCasa,
    squadraOspite,
    dataGara,
    oraGara,
    oraRitrovo,
    campo,
    indirizzo,
    misterName,
    noteMister,
    giocatori,
    partita,
  } = options;

  // Filtra i giocatori per il foglio in base alla modalità selezionata
  const displayedPlayers = useMemo(() => {
    if (modalita === 'solo_convocati') {
      return giocatori.filter((g) => g.selezionato).slice(0, 25);
    }
    // In modalità 'tutta_la_rosa', tutti i giocatori della rosa con caselle per la spunta a penna
    return giocatori.map((g) => ({ ...g, selezionato: false }));
  }, [giocatori, modalita]);

  const convocatiCount = useMemo(() => {
    return giocatori.filter((g) => g.selezionato).length;
  }, [giocatori]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 140));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 60));
  const handleResetZoom = () => setZoomLevel(100);

  // Stampa diretta garantita: usa window.print() sul foglio A4 o scarica il PDF
  const handleDirectPrint = () => {
    if (onPrintPdf) {
      onPrintPdf(modalita);
    } else {
      window.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-convocazioni-pdf-preview"
      className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-pdf-preview-container"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-5xl h-[94vh] flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar Superiore */}
        <div className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-sky-950 via-sky-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-2 border-b border-sky-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-300/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Scheda Convocazioni & Stampa A4
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  Singola Pagina A4
                </span>
              </div>
              <p className="text-[11px] text-sky-200/80 hidden sm:block">
                Righe aumentate per massima leggibilità e perfetta corrispondenza con la stampa
              </p>
            </div>
          </div>

          {/* Azioni Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Selettore Modalità: Foglio di Lavoro vs Solo Convocati */}
            <div className="bg-sky-950/90 p-0.5 rounded-xl border border-sky-800/80 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setModalita('tutta_la_rosa')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  modalita === 'tutta_la_rosa'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-sky-200 hover:text-white'
                }`}
                title="Visualizza tutti gli atleti con caselle per la spunta a penna del mister"
              >
                Foglio di Lavoro [  ]
              </button>
              <button
                type="button"
                onClick={() => setModalita('solo_convocati')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  modalita === 'solo_convocati'
                    ? 'bg-sky-500 text-white font-bold shadow-xs'
                    : 'text-sky-200 hover:text-white'
                }`}
                title="Visualizza solo i calciatori convocati (spuntati)"
              >
                Solo Convocati ({convocatiCount})
              </button>
            </div>

            {/* Controlli Zoom */}
            <div className="hidden lg:flex items-center bg-sky-950/80 p-0.5 rounded-xl border border-sky-800/80">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 text-sky-200 hover:text-white transition"
                title="Riduci zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 text-[11px] font-semibold text-sky-200 hover:text-white"
                title="Ripristina zoom 100%"
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 text-sky-200 hover:text-white transition"
                title="Aumenta zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Input Orario Ritrovo Rapido */}
            {onUpdateRitrovoTime && (
              <div
                id="preview-toolbar-ritrovo-box"
                className="flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/40 px-2 py-1 rounded-xl text-xs"
              >
                <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="text-amber-200 text-[11px] font-bold hidden sm:inline">
                  Ritrovo:
                </span>
                <input
                  id="preview-time-input-toolbar"
                  type="time"
                  value={extractTimeFromRitrovo(oraRitrovo || '14:00')}
                  onChange={(e) => onUpdateRitrovoTime(e.target.value)}
                  className="bg-slate-950 text-amber-300 font-black border border-amber-400/60 rounded-lg px-1.5 py-0.5 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-hidden cursor-pointer"
                  title="Modifica l'orario di ritrovo per questa gara"
                />
              </div>
            )}

            {/* Pulsante Download PDF */}
            <button
              id="btn-preview-modal-download"
              type="button"
              onClick={() => onDownloadPdf(modalita)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              title="Scarica il file PDF generato"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scarica PDF</span>
            </button>

            {/* Pulsante Stampa */}
            <button
              id="btn-preview-modal-print"
              type="button"
              onClick={handleDirectPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black transition shadow-xs cursor-pointer"
              title="Stampa subito il foglio A4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stampa</span>
            </button>

            {/* Chiudi */}
            <button
              id="btn-preview-modal-close"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Chiudi anteprima"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENUTO CORPO ANTEPRIMA (Foglio Singola Pagina A4 Nativo, 100% Compatibile Chrome) */}
        <div className="flex-1 w-full overflow-auto p-3 sm:p-6 flex justify-center items-start bg-slate-950">
          <div
            id="pdf-sheet-a4"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              width: '210mm',
              minHeight: '297mm',
              boxSizing: 'border-box',
            }}
            className="bg-white text-slate-900 shadow-2xl p-7 sm:p-8 flex flex-col justify-between border border-slate-300 transition-transform duration-150 select-text"
          >
            <div>
              {/* INTESTAZIONE SCHEDA A4 */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-sky-900">
                <div className="flex items-center gap-3.5">
                  {CYNTHIA_LOGO_BASE64 ? (
                    <img
                      src={CYNTHIA_LOGO_BASE64}
                      alt="ASD Cynthia 1920"
                      className="w-14 h-14 object-contain"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-sky-900 text-amber-300 flex items-center justify-center font-black text-xl">
                      C1920
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-sky-950 tracking-tight leading-none uppercase">
                      ASD CYNTHIA 1920
                    </h1>
                    <p className="text-xs sm:text-sm font-bold text-sky-800 tracking-wider uppercase mt-1">
                      {modalita === 'solo_convocati'
                        ? 'DISTINTA UFFICIALE CONVOCATI GARA (MAX 25 GIOCATORI)'
                        : 'SCHEDA CONVOCAZIONI & FOGLIO DI SPUNTA MISTER'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded bg-sky-100 text-sky-900 text-[10px] font-black uppercase tracking-wider border border-sky-300">
                    PAGINA SINGOLA A4
                  </span>
                </div>
              </div>

              {/* BOX QUADRO DETTAGLI GARA (3 Colonne) */}
              <div className="mt-3.5 p-3 rounded-lg bg-slate-50 border border-sky-200 grid grid-cols-12 gap-3 text-xs">
                {/* Colonna 1: Partita e Campionato */}
                <div className="col-span-4 border-r border-slate-200 pr-2">
                  <div className="text-[9px] font-bold text-sky-700 uppercase tracking-wider">
                    CAMPIONATO / CATEGORIA:
                  </div>
                  <div className="font-extrabold text-slate-900 text-[11px] uppercase leading-tight truncate">
                    {(campionato || 'CAMPIONATO REGIONALE').toUpperCase()}
                    {partita?.girone && partita.girone !== '-' ? ` (Gir. ${partita.girone})` : ''}
                  </div>

                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-2.5">
                    PARTITA UFFICIALE:
                  </div>
                  <div className="font-black text-sky-950 text-xs uppercase leading-tight">
                    {(squadraCasa || 'CYNTHIA 1920').toUpperCase()} <br />
                    <span className="text-slate-500 font-bold">VS</span>{' '}
                    {(squadraOspite || 'AVVERSARIO').toUpperCase()}
                  </div>
                </div>

                {/* Colonna 2: Data, Ora, Campo e Indirizzo */}
                <div className="col-span-4 border-r border-slate-200 pr-2">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    DATA & ORA DEL MATCH:
                  </div>
                  <div className="font-bold text-slate-900 text-[11px]">
                    {dataGara ? `${dataGara}` : 'DATA DA DEFINIRE'}
                    {oraGara ? ` • ORE ${oraGara}` : ''}
                  </div>

                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-2.5">
                    CAMPO DI GIUOCO & INDIRIZZO:
                  </div>
                  <div className="font-medium text-slate-800 text-[10px] leading-tight line-clamp-2">
                    {campo ? `${campo}${indirizzo ? ` • ${indirizzo}` : ''}` : 'PRESSO IL CAMPO DI GIUOCO'}
                  </div>
                </div>

                {/* Colonna 3: Due Box Sovrapposti (Orario Ritrovo & Mister) */}
                <div className="col-span-4 flex flex-col gap-2">
                  {/* Box Orario Ritrovo */}
                  <div className="bg-amber-100 border border-amber-400 rounded-md p-1.5 flex flex-col justify-center">
                    <div className="text-[8.5px] font-black text-amber-800 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>ORARIO DI RITROVO:</span>
                      </span>
                    </div>
                    <div className="font-black text-amber-950 text-xs uppercase tracking-tight leading-snug mt-0.5">
                      {onUpdateRitrovoTime ? (
                        <div className="flex items-center gap-1">
                          <input
                            id="input-preview-ora-ritrovo-sheet"
                            type="time"
                            value={extractTimeFromRitrovo(oraRitrovo || '14:00')}
                            onChange={(e) => onUpdateRitrovoTime(e.target.value)}
                            className="bg-white text-amber-950 border border-amber-500 rounded px-1 py-0.2 text-xs font-black focus:ring-1 focus:ring-amber-600 focus:outline-hidden cursor-pointer"
                            title="Modifica l'orario di ritrovo per questa gara"
                          />
                          <span className="text-amber-900 text-[9.5px] font-bold uppercase truncate">
                            PRESSO IL CAMPO
                          </span>
                        </div>
                      ) : (
                        (oraRitrovo || '90 MINUTI PRIMA').toUpperCase()
                      )}
                    </div>
                  </div>

                  {/* Box Mister Responsabile */}
                  <div className="bg-sky-50 border border-sky-200 rounded-md p-1.5 flex flex-col justify-center">
                    <div className="text-[8.5px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3 text-sky-600" />
                      <span>MISTER RESPONSABILE:</span>
                    </div>
                    <div className="font-black text-sky-950 text-xs uppercase tracking-tight mt-0.5 truncate">
                      {onUpdateMisterName ? (
                        <input
                          id="input-preview-mister-name-sheet"
                          type="text"
                          value={misterName || ''}
                          onChange={(e) => onUpdateMisterName(e.target.value)}
                          placeholder="Nome del Mister"
                          className="font-extrabold text-sky-950 bg-white border border-sky-300 rounded px-1.5 py-0.5 text-[10px] uppercase focus:ring-1 focus:ring-sky-500 w-full"
                          title="Modifica il nome del Mister per questa gara"
                        />
                      ) : (
                        (misterName || 'DA ASSEGNARE').toUpperCase()
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* TABELLA CALCIATORI CON RIGHE AUMENTATE E FILIGRANA CYNTHIA 1920 */}
              <div className="mt-3.5 border border-slate-300 rounded-md overflow-hidden relative">
                {/* Filigrana Diagonale Tenue "CYNTHIA 1920" */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
                  aria-hidden="true"
                >
                  <span className="font-black tracking-[0.22em] text-sky-950/[0.06] text-5xl sm:text-7xl uppercase transform -rotate-[30deg] whitespace-nowrap">
                    CYNTHIA 1920
                  </span>
                </div>

                <table className="w-full text-left border-collapse relative z-10">
                  <thead>
                    <tr className="bg-[#0c4a6e] text-white text-[10.5px] font-bold tracking-wide uppercase">
                      <th className="py-2.5 px-2 text-center w-14 border-r border-sky-800">
                        SPUNTA
                      </th>
                      <th className="py-2.5 px-2 text-center w-12 border-r border-sky-800">
                        N°
                      </th>
                      <th className="py-2.5 px-3 border-r border-sky-800">
                        {modalita === 'solo_convocati'
                          ? 'CALCIATORE (COGNOME E NOME) - CONVOCATI UFFICIALI (MAX 25)'
                          : 'CALCIATORE (COGNOME E NOME) - ROSA COMPLETA SPUNTA A PENNA'}
                      </th>
                      <th className="py-2.5 px-3 w-56">NOTE MISTER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {displayedPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400 italic">
                          Nessun calciatore presente con i filtri attuali.
                        </td>
                      </tr>
                    ) : (
                      displayedPlayers.map((g, idx) => {
                        const isEven = idx % 2 === 0;
                        return (
                          <tr
                            key={g.id || idx}
                            className={`${
                              isEven ? 'bg-transparent' : 'bg-slate-50/40'
                            } hover:bg-sky-50/50 transition-colors`}
                          >
                            {/* Casella Spunta Aumentata (4.8mm equivalente) */}
                            <td className="py-2.5 px-2 text-center border-r border-slate-200">
                              <button
                                type="button"
                                onClick={() => onTogglePlayer && onTogglePlayer(g.id)}
                                className="inline-flex items-center justify-center cursor-pointer"
                                title={
                                  onTogglePlayer
                                    ? 'Clicca per modificare la spunta del calciatore'
                                    : undefined
                                }
                              >
                                {g.selezionato ? (
                                  <div className="w-5 h-5 border-2 border-sky-700 bg-sky-100 rounded-xs flex items-center justify-center text-sky-800 font-black text-xs">
                                    X
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 border-2 border-slate-400 bg-white rounded-xs hover:border-sky-500 transition" />
                                )}
                              </button>
                            </td>

                            {/* Numero Maglia */}
                            <td className="py-2.5 px-2 text-center font-bold text-slate-700 border-r border-slate-200 text-xs">
                              {g.numero || idx + 1}
                            </td>

                            {/* Nominativo Calciatore con Anno Nascita, Ruolo e Squadra */}
                            <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200 uppercase text-xs tracking-wide">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{g.nome}</span>
                                {g.annoNascita && (
                                  <span className="text-[10px] px-1 py-0.2 rounded bg-amber-100 text-amber-900 font-extrabold border border-amber-300">
                                    {g.annoNascita}
                                  </span>
                                )}
                                {g.ruolo && (
                                  <span className="text-[10px] px-1 py-0.2 rounded bg-sky-100 text-sky-800 font-bold">
                                    {g.ruolo}
                                  </span>
                                )}
                                {g.squadra && (
                                  <span
                                    className={`text-[9.5px] px-1 py-0.2 rounded font-bold ${
                                      g.squadra.toUpperCase().includes('ALBA')
                                        ? 'bg-purple-100 text-purple-800'
                                        : g.squadra.toUpperCase().includes('ACADEMY')
                                        ? 'bg-cyan-100 text-cyan-800'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {g.squadra.toUpperCase().includes('ALBA')
                                      ? 'ALBACYNTHIA'
                                      : g.squadra.toUpperCase().includes('ACADEMY')
                                      ? 'ACADEMY'
                                      : 'CYNTHIA'}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Note Mister */}
                            <td className="py-2.5 px-3 text-slate-600 text-[10.5px]">
                              {g.note ? g.note.toUpperCase() : ''}
                            </td>
                          </tr>
                        );
                      })
                    )}

                    {/* Righe Aggiuntive Vuote per la compilazione a mano (fino a max 25) */}
                    {modalita === 'tutta_la_rosa' && displayedPlayers.length < 22 && (
                      <>
                        {Array.from({
                          length: Math.min(3, 25 - displayedPlayers.length),
                        }).map((_, emptyIdx) => {
                          const emptyRowIdx = emptyIdx + 1;
                          return (
                            <tr
                              key={`empty-${emptyRowIdx}`}
                              className="bg-transparent border-t border-slate-200"
                            >
                              <td className="py-2.5 px-2 text-center border-r border-slate-200">
                                <div className="w-5 h-5 border-2 border-slate-300 bg-white rounded-xs mx-auto" />
                              </td>
                              <td className="py-2.5 px-2 text-center text-slate-400 font-bold border-r border-slate-200 text-xs">
                                {displayedPlayers.length + emptyRowIdx}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-slate-300 italic text-xs">
                                ................................................................................
                              </td>
                              <td className="py-2.5 px-3 text-slate-300 italic text-[10.5px]">
                                ................................................
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* BOX NOTE E FIRMA MISTER */}
              <div className="mt-3.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-12 gap-3 text-xs">
                <div className="col-span-8 border-r border-slate-200 pr-2">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    DISPOSIZIONI TECNICHE & NOTE GARA:
                  </div>
                  <div className="text-[11px] text-slate-700 italic mt-1">
                    {noteMister ||
                      'Presentarsi in tenuta societaria ufficiale con documento di riconoscimento in corso di validità.'}
                  </div>
                </div>
                <div className="col-span-4 pl-1 flex flex-col justify-between">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    FIRMA MISTER / DIRIGENTE:
                  </div>
                  <div className="border-b border-slate-400 w-full mt-4" />
                </div>
              </div>
            </div>

            {/* PIÈ DI PAGINA FOGLIO A4 */}
            <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between mt-4">
              <div>
                <strong>ASD CYNTHIA 1920</strong> • Distinta Convocati Ufficiale • Pagina 1 di 1
              </div>
              <div className="font-bold text-sky-800">Forza Cynthia 1920!</div>
            </div>
          </div>
        </div>

        {/* Footer Modale */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span>
              Modalità:{' '}
              <strong className="text-white">
                {modalita === 'tutta_la_rosa' ? 'Foglio di Lavoro [  ]' : 'Solo Convocati'}
              </strong>
            </span>
            <span>•</span>
            <span>
              Atleti:{' '}
              <strong className="text-white">{displayedPlayers.length}</strong>
            </span>
            <span>•</span>
            <span>
              Spuntati:{' '}
              <strong className="text-amber-400 font-bold">{convocatiCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownloadPdf(modalita)}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Scarica File PDF</span>
            </button>
            <button
              type="button"
              onClick={handleDirectPrint}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa Scheda</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
