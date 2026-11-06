import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Partita, FilterState } from '../types';
import { formatMatchDateAndDay } from './dateFormatter';
import { CYNTHIA_LOGO_BASE64 } from '../assets/logoBase64';

export interface WeeklySchedulePdfOptions {
  titleSuffix?: string;
  filterSummary?: string;
  filters?: FilterState;
  isFiltered?: boolean;
}

/**
 * Costruisce una stringa leggibile che riassume i filtri correntemente attivi
 */
export function buildFilterSummaryString(filters?: FilterState): string {
  if (!filters) return '';
  const parts: string[] = [];

  if (filters.campionato && filters.campionato !== 'ALL') {
    parts.push(`Categoria: ${filters.campionato}`);
  }
  if (filters.societa && filters.societa !== 'ALL') {
    parts.push(`Società: ${filters.societa}`);
  }
  if (filters.data && filters.data !== 'ALL') {
    parts.push(`Data: ${filters.data}`);
  }
  if (filters.startDate || filters.endDate) {
    if (filters.startDate && filters.endDate) {
      parts.push(`Periodo: dal ${filters.startDate} al ${filters.endDate}`);
    } else if (filters.startDate) {
      parts.push(`A partire dal: ${filters.startDate}`);
    } else if (filters.endDate) {
      parts.push(`Fino al: ${filters.endDate}`);
    }
  }
  if (filters.location === 'casa') {
    parts.push('Gare: In Casa');
  } else if (filters.location === 'trasferta') {
    parts.push('Gare: Fuori Casa');
  }
  if (filters.search && filters.search.trim()) {
    parts.push(`Ricerca: "${filters.search.trim()}"`);
  }

  return parts.join('  •  ');
}

/**
 * Genera il documento jsPDF con impaginazione A4 orientamento orizzontale (Landscape).
 * Include:
 * - Logo societario ASD Cynthia 1920 al centro in alto;
 * - Titoli e sottotitoli con supporto ai filtri applicati;
 * - Date, orari, squadre, impianti sportivi e indirizzi completi;
 * - Tabella calibrata al millimetro per la stampa A4 (297x210mm);
 * - Numerazione pagine dinamica "Pagina X di Y" e intestazioni ripetute su ogni foglio.
 */
export function generateWeeklySchedulePdf(
  partite: Partita[],
  titleSuffixOrOptions?: string | WeeklySchedulePdfOptions
): jsPDF {
  const options: WeeklySchedulePdfOptions =
    typeof titleSuffixOrOptions === 'string'
      ? { titleSuffix: titleSuffixOrOptions }
      : titleSuffixOrOptions || {};

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
  const marginX = 12; // Margine laterale 12mm -> larghezza utile 273mm

  // Coordinate e proporzioni Logo Cynthia (210 x 240 px)
  const logoWidth = 16;
  const logoHeight = 18.28; // 16 * (240 / 210)
  const logoX = (pageWidth - logoWidth) / 2; // 140.5 mm: perfettamente al centro in orizzontale
  const logoY = 5.5; // In alto

  // 1. Linee accento superiori blu societario (sky-900 #0c4a6e) divise simmetricamente ai lati dello stemma
  doc.setFillColor(12, 74, 110);
  const leftLineEnd = logoX - 4;
  const rightLineStart = logoX + logoWidth + 4;
  doc.rect(marginX, 8.5, leftLineEnd - marginX, 1.2, 'F');
  doc.rect(rightLineStart, 8.5, (pageWidth - marginX) - rightLineStart, 1.2, 'F');

  // Inserimento Logo Cynthia al centro in alto
  try {
    doc.addImage(CYNTHIA_LOGO_BASE64, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (err) {
    console.warn('Impossibile renderizzare il logo nel PDF:', err);
  }

  // Intestazione a Sinistra: Nome Società
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('ASD CYNTHIA 1920', marginX, 16.5);

  // Sottotitolo a Sinistra: Tipologia Report
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(12, 74, 110); // sky-900
  const isFiltered = options.isFiltered || Boolean(options.filterSummary) || Boolean(options.titleSuffix);
  const mainSubTitle = isFiltered
    ? `PROGRAMMA GARE UFFICIALE - GARE FILTRATE`
    : 'PROGRAMMA GARE UFFICIALE DEL FINE SETTIMANA';
  doc.text(mainSubTitle, marginX, 21.5);

  // Informazioni Documento sulla Destra: Stagione e Data
  const now = new Date();
  const formattedDate = now.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text('Stagione Sportiva 2026/2027', pageWidth - marginX, 16.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Aggiornato al: ${formattedDate} (ore ${formattedTime})`, pageWidth - marginX, 21.5, { align: 'right' });

  // 2. Barra Opzionale dei Filtri Applicati (se presenti)
  let currentY = 25.5;
  const activeFiltersText =
    options.filterSummary || (options.filters ? buildFilterSummaryString(options.filters) : '');

  if (activeFiltersText) {
    const filterBarHeight = 5.5;
    const filterBarWidth = pageWidth - marginX * 2;
    doc.setFillColor(240, 249, 255); // sky-50
    doc.rect(marginX, currentY, filterBarWidth, filterBarHeight, 'F');
    doc.setDrawColor(186, 230, 253); // sky-200
    doc.setLineWidth(0.2);
    doc.rect(marginX, currentY, filterBarWidth, filterBarHeight, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(3, 105, 161); // sky-700
    doc.text(`FILTRI ATTIVI:  ${activeFiltersText}`, marginX + 3, currentY + 3.8);

    currentY += 6.5;
  }

  // 3. Barra Statistiche Pulita e Minimale
  const total = partite.length;
  const inCasa = partite.filter((p) => p.isCynthiaCasa).length;
  const inTrasferta = partite.filter((p) => p.isCynthiaOspite).length;
  const categorieCount = new Set(partite.map((p) => p.campionato)).size;

  const statsBarHeight = 6.2;
  const statsBarWidth = pageWidth - marginX * 2;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(marginX, currentY, statsBarWidth, statsBarHeight, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.2);
  doc.rect(marginX, currentY, statsBarWidth, statsBarHeight, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85); // slate-700
  const statsSummary = `RIEPILOGO GARE IN STAMPA:  ${total} Partite in programma   |   ${inCasa} in Casa   |   ${inTrasferta} in Trasferta   |   ${categorieCount} Categorie Sportive`;
  doc.text(statsSummary, marginX + 3.5, currentY + 4.3);

  currentY += 8.5;

  // 4. Intestazioni Tabella Calibrate al Millimetro
  const tableHeaders = [
    'CATEGORIA',
    'GIR.',
    'GARA',
    'DATA & ORA',
    'SQUADRA CASA',
    'SQUADRA OSPITE',
    'CAMPO DI GIOCO & INDIRIZZO',
    'FONDO',
    'COMUNE',
  ];

  // Preparazione Righe: testo pulito, formattato e leggibile per la stampa
  const tableRows = partite.map((p) => {
    const dInfo = formatMatchDateAndDay(p.data, p.ora);

    // Giorno della settimana formattato pulito
    const safeDay = (dInfo.dayOfWeek || '')
      .replace(/Ì/g, 'I')
      .replace(/È/g, 'E')
      .replace(/É/g, 'E')
      .replace(/À/g, 'A')
      .replace(/Ò/g, 'O')
      .replace(/Ù/g, 'U');

    // Orario compatto
    const cleanOra = (p.ora || '').replace(/^(ore\s*|h\s*)/i, '').trim() || '-';
    const dataOraString = `${safeDay} ${dInfo.dayNumber}/${dInfo.monthNumber}\nOre ${cleanOra}`;

    // Campo + Indirizzo se presente per massima precisione per stampa
    const campoCompleto = p.indirizzo && p.indirizzo.trim()
      ? `${p.campo}\n${p.indirizzo.trim()}`
      : p.campo;

    return [
      p.campionato,
      p.girone || '-',
      p.gara || '-',
      dataOraString,
      p.squadraCasa,
      p.squadraOspite,
      campoCompleto,
      p.tipo || 'Sintetico',
      p.comune,
    ];
  });

  // Somma esatta larghezze = 35 + 10 + 12 + 26 + 47 + 47 + 54 + 16 + 26 = 273mm (perfetto per A4 297mm)
  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: currentY,
    margin: { left: marginX, right: marginX, bottom: 12 },
    showHead: 'everyPage', // Ripete l'intestazione su ogni foglio di stampa
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 },
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.15,
      textColor: [30, 41, 59], // slate-800
      valign: 'middle',
      overflow: 'linebreak',
      fillColor: false, // Trasparente per filigrana
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900 (alto contrasto per stampa nitida)
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: { top: 2.6, bottom: 2.6, left: 2, right: 2 },
    },
    willDrawPage: function () {
      // Filigrana tenue 'CYNTHIA 1920' dietro alla tabella
      doc.saveGraphicsState();
      if (typeof (doc as any).GState === 'function') {
        doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(52);
        doc.setTextColor(12, 74, 110);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(52);
        doc.setTextColor(238, 242, 246);
      }
      doc.text('CYNTHIA 1920', pageWidth / 2, pageHeight / 2 + 10, {
        align: 'center',
        angle: 30,
      });
      doc.restoreGraphicsState();
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, textColor: [15, 23, 42] }, // Categoria
      1: { halign: 'center', cellWidth: 10 },                            // Girone
      2: { halign: 'center', cellWidth: 12 },                            // Gara
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },         // Data & Ora
      4: { cellWidth: 47 },                                              // Squadra Casa
      5: { cellWidth: 47 },                                              // Squadra Ospite
      6: { cellWidth: 54 },                                              // Campo & Indirizzo
      7: { halign: 'center', cellWidth: 16 },                            // Fondo
      8: { cellWidth: 26 },                                              // Comune
    },
    didParseCell: function (data) {
      if (data.section === 'body') {
        const rowData = partite[data.row.index];
        if (rowData) {
          // Evidenziazione colore Cynthia Casa
          if (data.column.index === 4 && rowData.isCynthiaCasa) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [12, 74, 110]; // sky-900
            data.cell.styles.fillColor = [240, 249, 255]; // sky-50 morbido
          }
          // Evidenziazione colore Cynthia Trasferta
          if (data.column.index === 5 && rowData.isCynthiaOspite) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [12, 74, 110]; // sky-900
            data.cell.styles.fillColor = [240, 249, 255]; // sky-50 morbido
          }
        }
      }
    },
  });

  // 5. Numerazione Pagine "Pagina X di Y" e Footer Ufficiale su Tutte le Pagine
  const totalPages = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400

    const footerLeft =
      'ASD CYNTHIA 1920 • Stagione Sportiva 2026/2027 - Documento ufficiale societario ottimizzato per stampa A4';
    doc.text(footerLeft, marginX, pageHeight - 5.5);

    const pageNumberStr = `Pagina ${i} di ${totalPages}`;
    doc.text(pageNumberStr, pageWidth - marginX, pageHeight - 5.5, { align: 'right' });
  }

  return doc;
}

/**
 * Scarica il file PDF direttamente sul dispositivo dell'utente
 */
export function downloadWeeklyPdf(
  partite: Partita[],
  filenamePrefix: string = 'Programma_Gare_Cynthia_2026_2027',
  options?: WeeklySchedulePdfOptions
): void {
  const doc = generateWeeklySchedulePdf(partite, options);
  const now = new Date();
  const dateSuffix = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  doc.save(`${filenamePrefix}_${dateSuffix}.pdf`);
}

/**
 * Avvia direttamente la finestra nativa di stampa del browser (Auto-Print)
 */
export function printWeeklySchedulePdf(
  partite: Partita[],
  options?: WeeklySchedulePdfOptions
): void {
  try {
    const doc = generateWeeklySchedulePdf(partite, options);
    doc.autoPrint();
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.src = blobUrl;
    document.body.appendChild(printFrame);

    printFrame.onload = () => {
      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch {
          downloadWeeklyPdf(partite, 'Programma_Gare_Cynthia_Stampa', options);
        }
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
            URL.revokeObjectURL(blobUrl);
          }
        }, 3000);
      }, 300);
    };
  } catch (err) {
    console.warn('Errore durante la stampa immediata del PDF, eseguo download:', err);
    downloadWeeklyPdf(partite, 'Programma_Gare_Cynthia_Stampa', options);
  }
}

/**
 * Condivide il PDF tramite Web Share API (se supportata con file)
 * oppure permette il download diretto
 */
export async function shareWeeklyPdfOrWhatsApp(
  partite: Partita[],
  title: string = 'Programma Gare Cynthia 1920 - Stagione 2026/2027',
  options?: WeeklySchedulePdfOptions
): Promise<{ sharedViaNative: boolean; success: boolean }> {
  try {
    const doc = generateWeeklySchedulePdf(partite, options);
    const pdfBlob = doc.output('blob');
    const fileName = `Programma_Gare_Cynthia_2026_2027_${Date.now()}.pdf`;
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text: `Programma Gare • Stagione Sportiva 2026/2027 - ASD Cynthia 1920 (${partite.length} partite)`,
        files: [file],
      });
      return { sharedViaNative: true, success: true };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { sharedViaNative: true, success: false };
    }
    console.warn('Condivisione nativa file PDF non disponibile, fallback su download:', err);
  }

  downloadWeeklyPdf(partite, 'Programma_Gare_Cynthia_Condiviso', options);
  return { sharedViaNative: false, success: true };
}

/**
 * Genera il testo pulito formattato per condivisione istantanea via WhatsApp
 */
export function generateWhatsAppWeeklySummary(partite: Partita[], filterSummary?: string): string {
  const total = partite.length;
  const inCasa = partite.filter((p) => p.isCynthiaCasa).length;
  const inTrasferta = partite.filter((p) => p.isCynthiaOspite).length;

  let msg = `*ASD CYNTHIA 1920 - PROGRAMMA GARE*\n`;
  msg += `*Stagione Sportiva 2026/2027*\n`;
  if (filterSummary) {
    msg += `Filtro: ${filterSummary}\n`;
  }
  msg += `Partite: ${total} Totali (${inCasa} Casa | ${inTrasferta} Trasferta)\n`;
  msg += `────────────────────────────\n\n`;

  // Raggruppa per data
  const byDate: { [data: string]: Partita[] } = {};
  partite.forEach((p) => {
    if (!byDate[p.data]) byDate[p.data] = [];
    byDate[p.data].push(p);
  });

  Object.entries(byDate).forEach(([data, matches]) => {
    msg += `*${data.toUpperCase()}*\n`;
    matches.forEach((p) => {
      msg += `*${p.ora}* - *${p.campionato}*\n`;
      msg += `${p.squadraCasa} vs ${p.squadraOspite}\n`;
      msg += `Campo: ${p.campo}${p.indirizzo ? ` (${p.indirizzo})` : ''} - ${p.comune}\n`;
      if (p.lnkMaps) {
        msg += `Mappa: ${p.lnkMaps}\n`;
      }
      msg += `\n`;
    });
    msg += `────────────────────────────\n`;
  });

  msg += `Forza Cynthia 1920! 🔵⚪`;
  return msg;
}

// Esporta anche le funzioni e i tipi per la generazione della scheda convocazioni per il mister
export {
  generateConvocazioniPdf,
  downloadConvocazioniPdf,
  printConvocazioniPdf,
  shareConvocazioniPdf,
  type ConvocazioniPdfOptions,
} from './convocazioniPdfGenerator';
