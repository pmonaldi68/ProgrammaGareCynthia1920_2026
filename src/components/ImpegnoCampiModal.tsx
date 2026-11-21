import React, { useMemo, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Partita } from '../types';
import { parseMatchDateTime } from '../utils/calendarUtils';
import { formatMatchDateAndDay } from '../utils/dateFormatter';
import { CYNTHIA_LOGO_BASE64 } from '../assets/logoBase64';
import {
  X,
  Printer,
  Download,
  Building2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

interface ImpegnoCampiModalProps {
  isOpen: boolean;
  onClose: () => void;
  partite: Partita[];
}

interface LockerAssignment {
  casa: string;
  ospite: string;
}

type LockerAssignmentsMap = Record<string, LockerAssignment>;

const LOCKERS_STORAGE_KEY = 'cynthia_spogliatoi_campi_v1';

function loadLockerAssignments(): LockerAssignmentsMap {
  try {
    const raw = localStorage.getItem(LOCKERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const ImpegnoCampiModal: React.FC<ImpegnoCampiModalProps> = ({
  isOpen,
  onClose,
  partite,
}) => {
  const [selectedCampo, setSelectedCampo] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [lockers, setLockers] = useState<LockerAssignmentsMap>(loadLockerAssignments);

  useEffect(() => {
    try {
      localStorage.setItem(LOCKERS_STORAGE_KEY, JSON.stringify(lockers));
    } catch {
      // Storage non disponibile
    }
  }, [lockers]);

  // Pulizia automatica classe stampa in chiusura o unmount
  useEffect(() => {
    const cleanup = () => {
      document.body.classList.remove('print-impegno-campi');
    };
    window.addEventListener('afterprint', cleanup);
    return () => {
      window.removeEventListener('afterprint', cleanup);
      cleanup();
    };
  }, []);

  // Solo gare interne ordinate cronologicamente
  const allHomeMatches = useMemo(() => {
    return (partite || [])
      .filter((p) => p.isCynthiaCasa)
      .sort((a, b) => {
        const startA = parseMatchDateTime(a.data, a.ora).start.getTime();
        const startB = parseMatchDateTime(b.data, b.ora).start.getTime();
        return startA - startB;
      });
  }, [partite]);

  const availableCampi = useMemo(() => {
    const set = new Set<string>();
    allHomeMatches.forEach((p) => {
      const c = (p.campo || 'Impianto da definire').trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [allHomeMatches]);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    allHomeMatches.forEach((p) => {
      if (p.data) set.add(p.data);
    });
    return Array.from(set);
  }, [allHomeMatches]);

  const filteredHomeMatches = useMemo(() => {
    return allHomeMatches.filter((p) => {
      const campoName = (p.campo || 'Impianto da definire').trim();
      if (selectedCampo !== 'ALL' && campoName !== selectedCampo) return false;
      if (selectedDate !== 'ALL' && p.data !== selectedDate) return false;
      return true;
    });
  }, [allHomeMatches, selectedCampo, selectedDate]);

  // Raggruppamento per singolo impianto sportivo
  const groupedByVenue = useMemo(() => {
    const map = new Map<string, Partita[]>();
    filteredHomeMatches.forEach((p) => {
      const key = (p.campo || 'Impianto da definire').trim();
      const arr = map.get(key) || [];
      arr.push(p);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([campo, matches]) => ({
      campo,
      matches,
    }));
  }, [filteredHomeMatches]);

  if (!isOpen) return null;

  const updateLocker = (matchId: string, side: 'casa' | 'ospite', value: string) => {
    setLockers((prev) => ({
      ...prev,
      [matchId]: {
        casa: side === 'casa' ? value : prev[matchId]?.casa || '',
        ospite: side === 'ospite' ? value : prev[matchId]?.ospite || '',
      },
    }));
  };

  const handleClearLockers = () => {
    setLockers({});
  };

  const handlePrintA4Landscape = () => {
    document.body.classList.add('print-impegno-campi');
    setTimeout(() => {
      window.print();
    }, 60);
  };

  const handleDownloadPdfA4Landscape = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
    const marginX = 12;

    // Intestazione A4 Orizzontale
    doc.setFillColor(12, 74, 110); // Azzurro istituzionale
    doc.rect(marginX, 7, pageWidth - marginX * 2, 1.4, 'F');

    try {
      doc.addImage(CYNTHIA_LOGO_BASE64, 'PNG', marginX, 10, 12, 13.7);
    } catch {
      // Ignora se logo non disponibile
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('ASD CYNTHIA 1920 — IMPEGNO CAMPI (GARE INTERNE)', marginX + 15, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const subParts = [
      'Foglio Segreteria & Custodi — Assegnazione Spogliatoi',
      selectedCampo !== 'ALL' ? `Impianto: ${selectedCampo}` : 'Tutti gli impianti',
      selectedDate !== 'ALL' ? `Data: ${selectedDate}` : '',
    ]
      .filter(Boolean)
      .join('  •  ');
    doc.text(subParts, marginX + 15, 21.5);

    const nowStr = new Date().toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    doc.setFontSize(8);
    doc.text(`Stagione 2026/2027 • Stampato il ${nowStr}`, pageWidth - marginX, 16, {
      align: 'right',
    });
    doc.text(`${filteredHomeMatches.length} gare interne`, pageWidth - marginX, 21.5, {
      align: 'right',
    });

    let startY = 27;

    groupedByVenue.forEach((group, groupIndex) => {
      if (groupIndex > 0) {
        startY = ((doc as any).lastAutoTable?.finalY || startY) + 7;
        if (startY > pageHeight - 30) {
          doc.addPage();
          startY = 14;
        }
      }

      // Titolo impianto
      doc.setFillColor(240, 249, 255);
      doc.rect(marginX, startY, pageWidth - marginX * 2, 6.5, 'F');
      doc.setDrawColor(14, 165, 233);
      doc.setLineWidth(0.3);
      doc.rect(marginX, startY, pageWidth - marginX * 2, 6.5, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(12, 74, 110);
      doc.text(
        `IMPIANTO: ${group.campo.toUpperCase()} (${group.matches.length} ${group.matches.length === 1 ? 'gara' : 'gare'})`,
        marginX + 3,
        startY + 4.5
      );

      const rows = group.matches.map((m) => {
        const dInfo = formatMatchDateAndDay(m.data, m.ora);
        const dayShort = (dInfo.dayOfWeek || '').slice(0, 3);
        const cleanHour = dInfo.oraFormatted.replace(/^ORE\s+/i, '').trim();
        const assigned = lockers[m.id] || { casa: '', ospite: '' };

        return [
          `${dayShort} ${dInfo.dayNumber}/${dInfo.monthNumber}`,
          cleanHour,
          m.campionato,
          m.squadraCasa,
          m.squadraOspite,
          assigned.casa.trim(),
          assigned.ospite.trim(),
        ];
      });

      // Larghezze calibrate per A4 Landscape (297 - 24 = 273 mm)
      autoTable(doc, {
        head: [['DATA', 'ORA', 'CATEGORIA', 'SQUADRA CASA', 'SQUADRA OSPITE', 'SPOGL. CASA', 'SPOGL. OSPITE']],
        body: rows,
        startY: startY + 7.5,
        margin: { left: marginX, right: marginX, bottom: 12 },
        showHead: 'everyPage',
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: { top: 2.8, bottom: 2.8, left: 2.5, right: 2.5 },
          lineColor: [148, 163, 184],
          lineWidth: 0.25,
          textColor: [15, 23, 42],
          valign: 'middle',
        },
        headStyles: {
          fillColor: [12, 74, 110],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left',
        },
        columnStyles: {
          0: { cellWidth: 26, fontStyle: 'bold' }, // Data
          1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }, // Ora
          2: { cellWidth: 42, fontStyle: 'bold' }, // Categoria
          3: { cellWidth: 66, fontStyle: 'bold', textColor: [12, 74, 110] }, // Squadra Casa
          4: { cellWidth: 66 }, // Squadra Ospite
          5: { cellWidth: 27.5, halign: 'center', fontStyle: 'bold' }, // Spogl. Casa
          6: { cellWidth: 27.5, halign: 'center', fontStyle: 'bold' }, // Spogl. Ospite
        },
        didParseCell: (data) => {
          if (data.section === 'head' && (data.column.index === 5 || data.column.index === 6)) {
            data.cell.styles.halign = 'center';
          }
          if (data.section === 'body' && (data.column.index === 5 || data.column.index === 6)) {
            // Rende le celle spogliatoio pronte anche per compilazione a mano
            data.cell.styles.fillColor = [255, 255, 255];
            data.cell.styles.lineColor = [100, 116, 139];
            data.cell.styles.lineWidth = 0.35;
          }
        },
      });
    });

    const totalPages = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('ASD Cynthia 1920 • Impegno Campi e Spogliatoi (A4 Orizzontale)', marginX, pageHeight - 5.5);
      doc.text(`Pagina ${i} di ${totalPages}`, pageWidth - marginX, pageHeight - 5.5, { align: 'right' });
    }

    doc.save(`Impegno_Campi_Cynthia_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div
      id="modal-impegno-campi-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="modal-impegno-campi-container"
        className="w-full max-w-[1160px] max-h-[94vh] bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar Superiore Non Stampabile */}
        <div
          id="impegno-campi-toolbar"
          className="bg-gradient-to-r from-sky-900 via-sky-800 to-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 shrink-0"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white/10 border border-amber-400/40 shrink-0">
              <Building2 className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                  Impegno Campi — Gare Interne
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-400 text-slate-950">
                  <ShieldCheck className="w-3 h-3" />
                  A4 Orizzontale
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-sky-200/90 truncate">
                Segreteria & Custodi • Compila gli spogliatoi per le due squadre o stampa in bianco da compilare a mano
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {Object.keys(lockers).length > 0 && (
              <button
                type="button"
                onClick={handleClearLockers}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-sky-100 transition cursor-pointer"
                title="Svuota tutte le caselle spogliatoi"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Svuota spogliatoi</span>
              </button>
            )}

            <button
              id="btn-impegno-campi-pdf"
              type="button"
              onClick={handleDownloadPdfA4Landscape}
              disabled={filteredHomeMatches.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition cursor-pointer"
              title="Scarica PDF in formato A4 Orizzontale"
            >
              <Download className="w-4 h-4" />
              <span>PDF A4 Orizz.</span>
            </button>

            <button
              id="btn-impegno-campi-print"
              type="button"
              onClick={handlePrintA4Landscape}
              disabled={filteredHomeMatches.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 transition cursor-pointer"
              title="Stampa diretta su foglio A4 Orizzontale"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa A4</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Chiudi"
              aria-label="Chiudi Impegno Campi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra Filtri Rapidi Impianto / Data (Non Stampabile) */}
        <div
          id="impegno-campi-filters"
          className="px-4 sm:px-6 py-2.5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3 shrink-0"
        >
          <div className="flex items-center gap-2">
            <label htmlFor="select-impegno-campo" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Impianto:
            </label>
            <select
              id="select-impegno-campo"
              value={selectedCampo}
              onChange={(e) => setSelectedCampo(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
            >
              <option value="ALL">Tutti gli impianti ({availableCampi.length})</option>
              {availableCampi.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="select-impegno-data" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Giornata:
            </label>
            <select
              id="select-impegno-data"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
            >
              <option value="ALL">Tutte le date ({availableDates.length})</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <span className="ml-auto text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            {filteredHomeMatches.length} {filteredHomeMatches.length === 1 ? 'gara interna' : 'gare interne'}
          </span>
        </div>

        {/* Area Scrollabile Foglio A4 Orizzontale */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 bg-slate-200/80 dark:bg-slate-950">
          {filteredHomeMatches.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center max-w-lg mx-auto my-8">
              <Building2 className="w-10 h-10 text-sky-600 mx-auto mb-3" />
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Nessuna gara interna trovata
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Seleziona un altro impianto o un&apos;altra data per visualizzare il foglio impegno campi.
              </p>
            </div>
          ) : (
            /* Foglio A4 Orizzontale Reale (297mm proportion) */
            <div
              id="impegno-campi-sheet-a4"
              className="mx-auto w-full max-w-[1060px] bg-white text-slate-900 rounded-xl shadow-md border border-slate-300 p-4 sm:p-7 space-y-5"
            >
              {/* Intestazione Foglio Stampabile A4 Orizzontale */}
              <div className="border-b-2 border-sky-900 pb-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src="./assets/cynthia_logo.png"
                    alt="ASD Cynthia 1920"
                    className="h-11 w-auto object-contain shrink-0"
                  />
                  <div>
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 leading-tight">
                      ASD Cynthia 1920 — Impegno Campi (Gare Interne)
                    </h2>
                    <p className="text-xs font-semibold text-sky-900">
                      Foglio Segreteria e Custodi · Assegnazione Spogliatoi alle Squadre
                      {selectedCampo !== 'ALL' ? ` · ${selectedCampo}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-600 shrink-0 tabular-nums">
                  <div className="font-bold text-slate-900">Stagione 2026/2027</div>
                  <div>
                    {filteredHomeMatches.length} {filteredHomeMatches.length === 1 ? 'gara interna' : 'gare interne'}
                  </div>
                </div>
              </div>

              {/* Tabelle Semplificate per Impianto (Solo Gare Interne + Casella Spogliatoi Casa / Ospite) */}
              <div className="space-y-5">
                {groupedByVenue.map((group) => (
                  <section key={group.campo} className="space-y-2 break-inside-avoid">
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 border-l-4 border-l-sky-800">
                      <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm text-sky-950 uppercase tracking-wide">
                        <Building2 className="w-4 h-4 text-sky-800 shrink-0" />
                        <span>{group.campo}</span>
                      </div>
                      <span className="text-xs font-bold text-sky-900 tabular-nums">
                        {group.matches.length} {group.matches.length === 1 ? 'gara' : 'gare'}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs sm:text-[13px]">
                        <thead>
                          <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                            <th className="py-2 px-2.5 border border-slate-700 whitespace-nowrap w-[105px]">
                              Data
                            </th>
                            <th className="py-2 px-2 border border-slate-700 text-center whitespace-nowrap w-[65px]">
                              Ora
                            </th>
                            <th className="py-2 px-2.5 border border-slate-700 whitespace-nowrap w-[145px]">
                              Categoria
                            </th>
                            <th className="py-2 px-2.5 border border-slate-700">
                              Squadra Casa
                            </th>
                            <th className="py-2 px-2.5 border border-slate-700">
                              Squadra Ospite
                            </th>
                            <th
                              colSpan={2}
                              className="py-1.5 px-2 border border-slate-700 text-center whitespace-nowrap w-[160px] bg-sky-900"
                            >
                              Spogliatoi (Casa / Ospite)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.matches.map((match, idx) => {
                            const dInfo = formatMatchDateAndDay(match.data, match.ora);
                            const dayShort = (dInfo.dayOfWeek || '').slice(0, 3);
                            const cleanHour = dInfo.oraFormatted.replace(/^ORE\s+/i, '').trim();
                            const assigned = lockers[match.id] || { casa: '', ospite: '' };

                            return (
                              <tr
                                key={match.id}
                                className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                              >
                                <td className="py-2 px-2.5 border border-slate-300 font-semibold whitespace-nowrap tabular-nums">
                                  <span className="uppercase text-sky-900">{dayShort}</span>{' '}
                                  {dInfo.dayNumber}/{dInfo.monthNumber}
                                </td>
                                <td className="py-2 px-2 border border-slate-300 text-center font-mono font-black text-slate-950 whitespace-nowrap tabular-nums">
                                  {cleanHour}
                                </td>
                                <td className="py-2 px-2.5 border border-slate-300 font-bold text-slate-900 whitespace-nowrap">
                                  {match.campionato}
                                </td>
                                <td className="py-2 px-2.5 border border-slate-300 font-extrabold text-sky-950">
                                  {match.squadraCasa}
                                </td>
                                <td className="py-2 px-2.5 border border-slate-300 font-semibold text-slate-800">
                                  {match.squadraOspite}
                                </td>
                                <td className="p-1.5 border border-slate-300 text-center w-[80px] bg-sky-50/40">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-sky-900 leading-none">
                                      Casa
                                    </span>
                                    <input
                                      type="text"
                                      maxLength={10}
                                      value={assigned.casa}
                                      onChange={(e) => updateLocker(match.id, 'casa', e.target.value)}
                                      placeholder="Sp."
                                      aria-label={`Spogliatoio Casa ${match.squadraCasa}`}
                                      className="w-14 h-7 text-center text-xs font-extrabold text-slate-950 bg-white border border-slate-400 rounded px-1 focus:border-sky-600 focus:outline-none"
                                    />
                                  </div>
                                </td>
                                <td className="p-1.5 border border-slate-300 text-center w-[80px] bg-slate-50/60">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 leading-none">
                                      Ospite
                                    </span>
                                    <input
                                      type="text"
                                      maxLength={10}
                                      value={assigned.ospite}
                                      onChange={(e) => updateLocker(match.id, 'ospite', e.target.value)}
                                      placeholder="Sp."
                                      aria-label={`Spogliatoio Ospite ${match.squadraOspite}`}
                                      className="w-14 h-7 text-center text-xs font-extrabold text-slate-950 bg-white border border-slate-400 rounded px-1 focus:border-sky-600 focus:outline-none"
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
