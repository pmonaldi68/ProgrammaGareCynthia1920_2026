import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckSquare,
  Square,
  Calendar,
  MapPin,
  Clock,
  User,
  Shield,
  FileText,
} from 'lucide-react';
import { ConvocazioniPdfOptions } from '../utils/convocazioniPdfGenerator';
import { CYNTHIA_LOGO_BASE64 } from '../assets/logoBase64';

interface ConvocazioniPdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ConvocazioniPdfOptions;
  onDownloadPdf: (modalita?: 'tutta_la_rosa' | 'solo_convocati') => void;
  onPrintPdf: (modalita?: 'tutta_la_rosa' | 'solo_convocati') => void;
  onTogglePlayer?: (id: string) => void;
}

export const ConvocazioniPdfPreviewModal: React.FC<ConvocazioniPdfPreviewModalProps> = ({
  isOpen,
  onClose,
  options,
  onDownloadPdf,
  onPrintPdf,
  onTogglePlayer,
}) => {
  const [modalita, setModalita] = useState<'tutta_la_rosa' | 'solo_convocati'>(
    options.modalita || 'tutta_la_rosa'
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!isOpen) return null;

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
    giocatori,
  } = options;

  // Filtra i giocatori per l'anteprima in base alla modalità selezionata
  const displayedPlayers =
    modalita === 'solo_convocati'
      ? giocatori.filter((g) => g.selezionato)
      : giocatori;

  const convocatiCount = giocatori.filter((g) => g.selezionato).length;
  const totalCount = giocatori.length;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 140));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 60));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <div
      id="modal-convocazioni-pdf-preview"
      className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-pdf-preview-container"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar */}
        <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-sky-950 via-sky-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-2 border-b border-sky-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-300/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Anteprima Live Scheda Convocazioni
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  Formato A4
                </span>
              </div>
              <p className="text-[11px] text-sky-200/80">
                Visualizzazione fedele del layout PDF pronto per stampa o download
              </p>
            </div>
          </div>

          {/* Azioni Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Selettore Modalità Anteprima */}
            <div className="bg-sky-950/80 p-0.5 rounded-xl border border-sky-800/80 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setModalita('tutta_la_rosa')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  modalita === 'tutta_la_rosa'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-sky-200 hover:text-white'
                }`}
                title="Visualizza tutti gli atleti con casella vuota per spunta a penna"
              >
                Foglio di Lavoro [ ]
              </button>
              <button
                type="button"
                onClick={() => setModalita('solo_convocati')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  modalita === 'solo_convocati'
                    ? 'bg-sky-500 text-white font-bold shadow-xs'
                    : 'text-sky-200 hover:text-white'
                }`}
                title="Visualizza solo i calciatori già spuntati"
              >
                Solo Convocati ({convocatiCount})
              </button>
            </div>

            {/* Controlli Zoom */}
            <div className="hidden md:flex items-center bg-sky-950/80 p-0.5 rounded-xl border border-sky-800/80">
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

            {/* Pulsante Download PDF */}
            <button
              id="btn-preview-modal-download"
              type="button"
              onClick={() => onDownloadPdf(modalita)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold transition shadow-xs"
              title="Scarica il file PDF generato"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scarica PDF</span>
            </button>

            {/* Pulsante Stampa */}
            <button
              id="btn-preview-modal-print"
              type="button"
              onClick={() => onPrintPdf(modalita)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold transition shadow-xs"
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
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
              title="Chiudi anteprima"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Foglio A4 Live Canvas View */}
        <div className="flex-1 w-full overflow-auto bg-slate-950/70 p-3 sm:p-6 flex justify-center items-start">
          <div
            id="pdf-sheet-a4"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              width: '210mm',
              minHeight: '297mm',
              boxSizing: 'border-box',
            }}
            className="bg-white text-slate-900 shadow-2xl p-7 sm:p-9 flex flex-col justify-between border border-slate-300 transition-transform duration-150 select-text"
          >
            {/* INTESTAZIONE SCHEDA A4 */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-sky-900">
                <div className="flex items-center gap-4">
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
                      SCHEDA CONVOCAZIONI GARA • DISTINTA E FOGLIO PRESENZE MISTER
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded bg-sky-100 text-sky-900 text-[10px] font-black uppercase tracking-wider border border-sky-300">
                    FOGLIO UFFICIALE
                  </span>
                </div>
              </div>

              {/* BOX QUADRO DETTAGLI GARA (3 Colonne) */}
              <div className="mt-3.5 p-3 rounded-lg bg-slate-50 border border-slate-300 grid grid-cols-12 gap-3 text-xs">
                {/* Colonna 1: Campionato & Partita */}
                <div className="col-span-4 border-r border-slate-200 pr-2">
                  <div className="text-[9px] font-bold text-sky-700 uppercase tracking-wider">
                    CAMPIONATO:
                  </div>
                  <div className="font-extrabold text-slate-900 text-[11px] uppercase leading-tight truncate">
                    {(campionato || 'CAMPIONATO REGIONALE').toUpperCase()}
                  </div>

                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-2">
                    PARTITA:
                  </div>
                  <div className="font-black text-sky-950 text-xs uppercase leading-tight">
                    {(squadraCasa || 'CYNTHIA 1920').toUpperCase()} <br />
                    <span className="text-slate-500 font-bold">VS</span>{' '}
                    {(squadraOspite || 'AVVERSARIO').toUpperCase()}
                  </div>
                </div>

                {/* Colonna 2: Data, Ora, Campo, Mister */}
                <div className="col-span-4 border-r border-slate-200 pr-2">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    DATA & ORA GARA:
                  </div>
                  <div className="font-bold text-slate-900 text-[11px]">
                    {dataGara ? `${dataGara}` : 'DATA DA DEFINIRE'}
                    {oraGara ? ` • ORE ${oraGara}` : ''}
                  </div>

                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1.5">
                    CAMPO DI GIUOCO:
                  </div>
                  <div className="font-medium text-slate-800 text-[10px] leading-tight line-clamp-2">
                    {campo ? `${campo}${indirizzo ? ` (${indirizzo})` : ''}` : 'PRESSO IL CAMPO DI GIUOCO'}
                  </div>

                  <div className="text-[9px] font-bold text-sky-700 uppercase tracking-wider mt-1.5">
                    MISTER: <span className="font-extrabold text-slate-900">{(misterName || 'DA ASSEGNARE').toUpperCase()}</span>
                  </div>
                </div>

                {/* Colonna 3: ORARIO RITROVO IN EVIDENZA */}
                <div className="col-span-4 bg-amber-100/90 border-2 border-amber-500 rounded-md p-2.5 flex flex-col justify-center">
                  <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>ORARIO RITROVO:</span>
                  </div>
                  <div className="font-black text-amber-950 text-xs sm:text-sm uppercase tracking-tight leading-snug mt-1">
                    {(oraRitrovo || '14:00 PRESSO IL CAMPO DI GIUOCO').toUpperCase()}
                  </div>
                </div>
              </div>

              {/* TABELLA CALCIATORI (4 COLONNE) CON FILIGRANA DIAGONALE TENUE */}
              <div className="mt-4 border border-slate-300 rounded-md overflow-hidden relative">
                {/* Filigrana Diagonale Tenue "CYNTHIA 1920" Dietro alla Tabella */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
                  aria-hidden="true"
                >
                  <span
                    className="font-black tracking-[0.22em] text-sky-950/[0.08] text-5xl sm:text-7xl uppercase transform -rotate-[30deg] whitespace-nowrap"
                  >
                    CYNTHIA 1920
                  </span>
                </div>

                <table className="w-full text-left border-collapse relative z-10">
                  <thead>
                    <tr className="bg-[#0c4a6e] text-white text-[10.5px] font-bold tracking-wide uppercase">
                      <th className="py-2 px-2 text-center w-12 border-r border-sky-800">
                        SPUNTA
                      </th>
                      <th className="py-2 px-2 text-center w-10 border-r border-sky-800">
                        N°
                      </th>
                      <th className="py-2 px-3 border-r border-sky-800">
                        CALCIATORE (COGNOME E NOME)
                      </th>
                      <th className="py-2 px-3 w-48">
                        NOTE MISTER
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {displayedPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-slate-400 italic">
                          Nessun calciatore presente con i filtri attuali.
                        </td>
                      </tr>
                    ) : (
                      displayedPlayers.map((g, idx) => {
                        const isEven = idx % 2 === 0;
                        return (
                          <tr
                            key={g.id || idx}
                            className={`${isEven ? 'bg-transparent' : 'bg-slate-50/40'} hover:bg-sky-50/40 transition-colors`}
                          >
                            {/* Casella Spunta Quadrata */}
                            <td className="py-1.5 px-2 text-center border-r border-slate-200">
                              <button
                                type="button"
                                onClick={() => onTogglePlayer && onTogglePlayer(g.id)}
                                className="inline-flex items-center justify-center"
                                title={onTogglePlayer ? 'Clicca per modificare lo stato spunta' : undefined}
                              >
                                {g.selezionato ? (
                                  <div className="w-5 h-5 border-2 border-sky-700 bg-sky-100 rounded-sm flex items-center justify-center text-sky-800 font-black text-xs">
                                    X
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 border-2 border-slate-400 bg-white rounded-sm" />
                                )}
                              </button>
                            </td>

                            {/* Numero Maglia */}
                            <td className="py-1.5 px-2 text-center font-bold text-slate-700 border-r border-slate-200 text-[11px]">
                              {g.numero || idx + 1}
                            </td>

                            {/* Nominativo */}
                            <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-slate-200 uppercase text-[11px] tracking-wide">
                              {g.nome}
                            </td>

                            {/* Note Mister */}
                            <td className="py-1.5 px-3 text-slate-600 text-[10px]">
                              {g.note ? g.note.toUpperCase() : ''}
                            </td>
                          </tr>
                        );
                      })
                    )}

                    {/* 4 Righe aggiuntive vuote per la compilazione a penna dell'ultimo minuto */}
                    {modalita === 'tutta_la_rosa' && (
                      <>
                        {[1, 2, 3, 4].map((emptyRowIdx) => (
                          <tr key={`empty-${emptyRowIdx}`} className="bg-transparent border-t border-slate-200">
                            <td className="py-2 px-2 text-center border-r border-slate-200">
                              <div className="w-5 h-5 border-2 border-slate-300 bg-white rounded-sm mx-auto" />
                            </td>
                            <td className="py-2 px-2 text-center text-slate-300 font-bold border-r border-slate-200 text-[11px]">
                              {displayedPlayers.length + emptyRowIdx}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-200 text-slate-300 italic text-[11px]">
                              ................................................................................
                            </td>
                            <td className="py-2 px-3 text-slate-300 italic text-[10px]">
                              ................................................
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PIÈ DI PAGINA FOGLIO A4 */}
            <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between mt-6">
              <div>
                <strong>ASD CYNTHIA 1920</strong> • Scheda Convocazioni e Foglio di Spunta Mister
              </div>
              <div className="font-bold text-sky-800">
                Forza Cynthia 1920!
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modale */}
        <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 flex-shrink-0 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span>
              Modalità: <strong className="text-white">{modalita === 'tutta_la_rosa' ? 'Foglio di Lavoro [  ]' : 'Solo Convocati'}</strong>
            </span>
            <span>•</span>
            <span>
              Atleti visualizzati: <strong className="text-white">{displayedPlayers.length}</strong>
            </span>
            <span>•</span>
            <span>
              Convocati spuntati: <strong className="text-amber-400">{convocatiCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownloadPdf(modalita)}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex items-center gap-1.5 active:scale-95 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Scarica File PDF</span>
            </button>
            <button
              type="button"
              onClick={() => onPrintPdf(modalita)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5 active:scale-95 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa Scheda</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
