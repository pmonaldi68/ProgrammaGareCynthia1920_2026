import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GiocatoreConvocato, Partita } from '../types';
import { CYNTHIA_LOGO_BASE64 } from '../assets/logoBase64';

/** Limite massimo ufficiale di calciatori convocabili per gara */
export const MAX_CONVOCATI_PDF_LIMIT = 25;

export interface ConvocazioniPdfOptions {
  partita?: Partita | null;
  campionato: string;
  squadraCasa: string;
  squadraOspite: string;
  dataGara: string;
  oraGara: string;
  oraRitrovo: string;
  campo: string;
  indirizzo?: string;
  misterName: string;
  noteMister?: string;
  giocatori: GiocatoreConvocato[];
  /** 'tutta_la_rosa' stampa l'elenco completo per spuntare a penna, 'solo_convocati' solo gli atleti selezionati */
  modalita?: 'tutta_la_rosa' | 'solo_convocati';
  categoriaTarget?: string;
}

/**
 * Genera il documento PDF della scheda convocazioni rigorosamente su una SINGOLA PAGINA A4 verticale.
 * Ottimizzato per la stampa su carta e la spunta manuale con penna da parte del mister.
 * - Limite massimo fissato a 25 convocati
 * - Righe compatte e altezze calibrate per garantire pagina singola al 100%
 */
export function generateConvocazioniPdf(options: ConvocazioniPdfOptions): jsPDF {
  const {
    partita,
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
    modalita = 'tutta_la_rosa',
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginX = 11; // Margine laterale compatto 11mm -> larghezza utile 188mm
  const contentWidth = pageWidth - marginX * 2; // 188 mm

  // Coordinate Logo Cynthia compatto per salvare spazio verticale
  const logoWidth = 12;
  const logoHeight = 13.7;
  const logoX = marginX;
  const logoY = 6.5;

  // Inserimento Logo Cynthia
  try {
    doc.addImage(CYNTHIA_LOGO_BASE64, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (err) {
    console.warn('Impossibile renderizzare il logo nel PDF convocazioni:', err);
  }

  // 1. Intestazione Societaria Compatta (Top Header)
  const headerTextX = logoX + logoWidth + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(12, 74, 110); // sky-900 / Cynthia Blue
  doc.text('ASD CYNTHIA 1920', headerTextX, 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42); // slate-900
  const docTitle =
    modalita === 'solo_convocati'
      ? 'DISTINTA UFFICIALE CONVOCATI GARA (MAX 25 GIOCATORI)'
      : 'SCHEDA CONVOCAZIONI & FOGLIO DI SPUNTA MISTER';
  doc.text(docTitle, headerTextX, 16.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  const docSub =
    modalita === 'solo_convocati'
      ? 'Elenco atleti convocati per la gara • Pagina Singola A4'
      : 'Modulo per la selezione e spunta manuale dei calciatori (max 25 convocati)';
  doc.text(docSub, headerTextX, 20.8);

  // Linea separatrice superiore in blu societario
  doc.setDrawColor(2, 132, 199); // sky-600
  doc.setLineWidth(0.6);
  doc.line(marginX, 23.5, pageWidth - marginX, 23.5);

  // 2. Quadro Dettagli Gara (Box Riassuntivo Compatto e Spazioso)
  const boxY = 25.5;
  const boxHeight = 27; // Altezza ottimizzata per accogliere tutti i dettagli senza sovrapposizioni

  // Sfondo box dettagli gara
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(186, 230, 253); // sky-200
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, boxY, contentWidth, boxHeight, 1.8, 1.8, 'FD');

  const col1W = 66;
  const col2W = 66;
  const col3W = contentWidth - col1W - col2W; // ~56mm

  // Linee separatrici verticali interne
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.line(marginX + col1W, boxY + 2, marginX + col1W, boxY + boxHeight - 2);
  doc.line(marginX + col1W + col2W, boxY + 2, marginX + col1W + col2W, boxY + boxHeight - 2);

  // Colonna 1: Partita e Campionato (larghezza 66mm)
  const c1X = marginX + 3.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text('CAMPIONATO / CATEGORIA:', c1X, boxY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42); // slate-900
  const gironeStr = (partita as any)?.girone && (partita as any).girone !== '-' ? ` (Gir. ${(partita as any).girone})` : '';
  const campTitle = `${(campionato || 'CAMPIONATO REGIONALE').toUpperCase()}${gironeStr}`;
  const campLines = doc.splitTextToSize(campTitle, col1W - 6);
  doc.text(campLines.slice(0, 1), c1X, boxY + 8.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PARTITA UFFICIALE:', c1X, boxY + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(12, 74, 110);
  const matchDesc = `${(squadraCasa || 'CYNTHIA 1920').toUpperCase()} vs ${(squadraOspite || 'AVVERSARIO').toUpperCase()}`;
  const matchLines = doc.splitTextToSize(matchDesc, col1W - 6);
  doc.text(matchLines.slice(0, 2), c1X, boxY + 19.5);

  // Colonna 2: Data, Ora Gara, Impianto & Indirizzo (larghezza 66mm)
  const c2X = marginX + col1W + 3.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('DATA & ORA DEL MATCH:', c2X, boxY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const dataOraStr = `${dataGara || 'DA DEFINIRE'} • ORE ${oraGara || '--:--'}`;
  doc.text(dataOraStr.toUpperCase(), c2X, boxY + 8.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('CAMPO DI GIUOCO & INDIRIZZO:', c2X, boxY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(30, 41, 59);
  const campoFull = campo ? `${campo}${indirizzo ? ` • ${indirizzo}` : ''}` : 'PRESSO IL CAMPO DI GIUOCO';
  const campoLines = doc.splitTextToSize(campoFull.toUpperCase(), col2W - 6);
  doc.text(campoLines.slice(0, 2), c2X, boxY + 19.5);

  // Colonna 3: ORARIO RITROVO & MISTER (larghezza ~56mm)
  const c3X = marginX + col1W + col2W + 2;
  const c3W = col3W - 4;

  // Box colorato ambra/oro per evidenziare l'orario di ritrovo
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.setLineWidth(0.4);
  doc.roundedRect(c3X, boxY + 1.8, c3W, 11.2, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('ORARIO DI RITROVO:', c3X + 2.5, boxY + 5.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(120, 53, 15); // amber-950
  const ritrovoFormatted = (oraRitrovo || '90 MINUTI PRIMA').toUpperCase();
  const ritrovoLines = doc.splitTextToSize(ritrovoFormatted, c3W - 5);
  doc.text(ritrovoLines.slice(0, 2), c3X + 2.5, boxY + 9.6);

  // Box colorato azzurro per Mister
  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(186, 230, 253); // sky-200
  doc.setLineWidth(0.4);
  doc.roundedRect(c3X, boxY + 14.2, c3W, 11, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text('MISTER RESPONSABILE:', c3X + 2.5, boxY + 17.6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(12, 74, 110); // sky-900
  const misterFormatted = (misterName || 'DA ASSEGNARE').toUpperCase();
  const misterLines = doc.splitTextToSize(misterFormatted, c3W - 5);
  doc.text(misterLines.slice(0, 1), c3X + 2.5, boxY + 22.2);

  // 3. Tabella Calciatori
  // Modalità 'tutta_la_rosa': foglio di spunta con TUTTI i giocatori in rosa deselezionati [ ] per la spunta a penna
  // Modalità 'solo_convocati': distinta ufficiale limitata a massimo 25 convocati
  let targetGiocatori = [...giocatori];
  if (modalita === 'solo_convocati') {
    targetGiocatori = targetGiocatori.filter((g) => g.selezionato).slice(0, MAX_CONVOCATI_PDF_LIMIT);
  } else {
    // Tutti i giocatori della rosa con casella di spunta deselezionata per la spunta a penna del Mister
    targetGiocatori = targetGiocatori.map((g) => ({ ...g, selezionato: false }));
  }

  // Prepara i dati della tabella
  const tableData: string[][] = targetGiocatori.map((g, index) => {
    const spuntaText = g.selezionato ? '[ X ]' : '[   ]';
    const numJersey = g.numero ? String(g.numero) : String(index + 1);
    const nominativo = (g.nome || '').trim().toUpperCase() || 'CALCIATORE';
    const annoTag = g.annoNascita ? ` (${g.annoNascita})` : '';
    const ruoloTag = g.ruolo ? ` (${g.ruolo.toUpperCase()})` : '';
    const squadUpper = (g.squadra || '').toUpperCase();
    const clubTag = squadUpper.includes('ALBA')
      ? ' [ALBACYNTHIA]'
      : squadUpper.includes('ACADEMY')
      ? ' [ACADEMY]'
      : '';
    const fullNominativo = `${nominativo}${annoTag}${ruoloTag}${clubTag}`;
    const noteCol = g.note ? g.note.toUpperCase() : (clubTag ? squadUpper : '');

    return [spuntaText, numJersey, fullNominativo, noteCol];
  });

  // Se in modalità 'tutta_la_rosa' ci sono meno di 22 atleti, aggiungi righe vuote per appunti a penna fino a max 25
  if (modalita === 'tutta_la_rosa' && tableData.length < 22) {
    const maxEmptyToAdd = Math.min(3, 25 - tableData.length);
    for (let i = 1; i <= maxEmptyToAdd; i++) {
      const prog = tableData.length + 1;
      tableData.push([
        '[   ]',
        String(prog),
        '',
        '',
      ]);
    }
  }

  // Posizione inizio tabella
  const startTableY = boxY + boxHeight + 2.5;

  const headerColumnTitle = modalita === 'solo_convocati'
    ? 'CALCIATORE (COGNOME E NOME) - CONVOCATI UFFICIALI (MAX 25)'
    : 'CALCIATORE (COGNOME E NOME) - ROSA COMPLETA SPUNTA A PENNA';

  // Calcolo dinamico dell'altezza delle righe per il file di stampa:
  // Aumenta sensibilmente la dimensione delle righe per massima leggibilità e comodità di scrittura,
  // garantendo matematicamente che l'intero documento rimanga in una singola pagina A4.
  const rowCount = Math.max(tableData.length, 1);
  // Spazio verticale disponibile per il corpo tabella tra startTableY (55mm) e fine pagina/firma (268mm) = ~203mm
  const availableBodyHeight = 202;
  const dynamicCellHeight = Math.max(5.8, Math.min(8.6, availableBodyHeight / rowCount));
  const dynamicPaddingV = dynamicCellHeight >= 7.8 ? 2.0 : (dynamicCellHeight >= 6.8 ? 1.6 : 1.2);
  const dynamicFontSizeName = dynamicCellHeight >= 7.6 ? 9.2 : 8.5;
  const dynamicFontSizeNum = dynamicCellHeight >= 7.6 ? 9.0 : 8.2;
  const dynamicCheckboxSize = dynamicCellHeight >= 7.6 ? 4.8 : 3.8;

  autoTable(doc, {
    startY: startTableY,
    margin: { left: marginX, right: marginX, bottom: 8 },
    theme: 'grid',
    head: [['SPUNTA', 'N°', headerColumnTitle, 'NOTE MISTER']],
    body: tableData,
    pageBreak: 'avoid',
    rowPageBreak: 'avoid',
    headStyles: {
      fillColor: [12, 74, 110], // Cynthia Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.2,
      halign: 'center',
      valign: 'middle',
      cellPadding: { top: 2.0, bottom: 2.0, left: 2, right: 2 },
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center', fontStyle: 'bold', fontSize: 8 }, // SPUNTA
      1: { cellWidth: 12, halign: 'center', fontSize: dynamicFontSizeNum, fontStyle: 'bold' }, // N°
      2: { cellWidth: 95, halign: 'left', fontStyle: 'bold', fontSize: dynamicFontSizeName }, // NOMINATIVO
      3: { cellWidth: 65, halign: 'left', fontSize: 8.0 }, // NOTE MISTER
    },
    styles: {
      fillColor: false, // Trasparente per filigrana
      lineColor: [203, 213, 225],
      lineWidth: 0.25,
      cellPadding: { top: dynamicPaddingV, bottom: dynamicPaddingV, left: 2.2, right: 2.2 },
      minCellHeight: dynamicCellHeight,
      overflow: 'linebreak',
      valign: 'middle',
    },
    willDrawPage: () => {
      // Filigrana diagonale tenue 'CYNTHIA 1920' posizionata dietro al contenuto della distinta
      doc.saveGraphicsState();
      if (typeof (doc as any).GState === 'function') {
        doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(44);
        doc.setTextColor(12, 74, 110);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(44);
        doc.setTextColor(228, 235, 244);
      }
      doc.text('CYNTHIA 1920', pageWidth / 2, 160, {
        align: 'center',
        angle: 35,
      });
      doc.restoreGraphicsState();
    },
    didDrawCell: (data) => {
      // Disegna una casella di spunta quadrata proporzionata all'altezza riga aumentata
      if (data.section === 'body' && data.column.index === 0) {
        const cell = data.cell;
        const squareSize = dynamicCheckboxSize;
        const squareX = cell.x + (cell.width - squareSize) / 2;
        const squareY = cell.y + (cell.height - squareSize) / 2;

        doc.setDrawColor(2, 132, 199);
        doc.setLineWidth(0.4);

        const rowVal = String(cell.raw || '');
        if (rowVal.includes('X')) {
          doc.setFillColor(224, 242, 254); // sky-100
          doc.roundedRect(squareX, squareY, squareSize, squareSize, 0.6, 0.6, 'FD');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(2, 132, 199);
          doc.text('X', squareX + squareSize / 2, squareY + squareSize / 2 + 1.2, { align: 'center' });
        } else {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(squareX, squareY, squareSize, squareSize, 0.6, 0.6, 'FD');
        }
      }
    },
  });

  // Garantisce categoricamente che il documento sia SEMPRE di una singola pagina
  while (doc.getNumberOfPages() > 1) {
    doc.deletePage(2);
  }

  // Box Note Mister & Firma posizionato dopo la tabella se lo spazio residuo lo consente
  const finalTableY = (doc as any).lastAutoTable?.finalY || 240;
  if (finalTableY < 274) {
    const noteBoxY = finalTableY + 2.5;
    const noteBoxH = Math.min(13, 287 - noteBoxY);
    if (noteBoxH >= 8.5) {
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(marginX, noteBoxY, contentWidth, noteBoxH, 1.2, 1.2, 'FD');

      // Note a sinistra
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text('DISPOSIZIONI TECNICHE & NOTE GARA:', marginX + 3, noteBoxY + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(30, 41, 59);
      if (noteMister) {
        const noteLines = doc.splitTextToSize(noteMister, contentWidth - 62);
        doc.text(noteLines.slice(0, 2), marginX + 3, noteBoxY + 7.5);
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184);
        doc.text('Presentarsi in tenuta societaria ufficiale con documento di riconoscimento in corso di validità.', marginX + 3, noteBoxY + 7.5);
      }

      // Linea separatrice verticale prima della firma
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX + contentWidth - 58, noteBoxY + 2, marginX + contentWidth - 58, noteBoxY + noteBoxH - 2);

      // Firma Mister a destra
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text('FIRMA MISTER / DIRIGENTE:', marginX + contentWidth - 55, noteBoxY + 3.8);
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.line(marginX + contentWidth - 55, noteBoxY + noteBoxH - 3, marginX + contentWidth - 3, noteBoxY + noteBoxH - 3);
    }
  }

  // Footer singola pagina
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  const footerLeft = modalita === 'solo_convocati'
    ? `ASD CYNTHIA 1920 • Distinta Convocati Ufficiale (${targetGiocatori.length} convocati)`
    : `ASD CYNTHIA 1920 • Foglio di Spunta Rosa Completa (${targetGiocatori.length} atleti)`;
  doc.text(footerLeft, marginX, pageHeight - 4.5);
  doc.text('Pagina 1 di 1 • Forza Cynthia 1920!', pageWidth - marginX, pageHeight - 4.5, { align: 'right' });

  return doc;
}

/**
 * Scarica il file PDF della scheda convocazioni sul dispositivo
 */
export function downloadConvocazioniPdf(options: ConvocazioniPdfOptions): void {
  const doc = generateConvocazioniPdf(options);
  const cat = (options.campionato || options.categoriaTarget || 'Cynthia1920')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  const data = (options.dataGara || 'Gara').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Convocazioni_${cat}_${data}.pdf`;
  doc.save(filename);
}

/**
 * Stampa pulita del foglio convocazioni senza iframe blob (che causano blocco pagina in Chrome)
 */
export function printConvocazioniPdf(options: ConvocazioniPdfOptions): void {
  // Se l'elemento DOM del foglio A4 è presente, esegue window.print() tramite overlay di stampa
  const sheetElement = document.getElementById('pdf-sheet-a4');
  if (sheetElement) {
    window.print();
    return;
  }

  // Fallback se il modale di anteprima non è aperto:
  // Usa il metodo standard jsPDF autoPrint in una nuova finestra pulita o scarica direttamente
  try {
    const doc = generateConvocazioniPdf(options);
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl, '_blank');
    if (!printWindow) {
      // Se il popup viene bloccato da Chrome, scarica il PDF direttamente
      downloadConvocazioniPdf(options);
    }
  } catch (err) {
    console.warn('Fallback download PDF per la stampa:', err);
    downloadConvocazioniPdf(options);
  }
}

/**
 * Condivide il PDF con il mister (tramite Web Share API con allegato PDF,
 * oppure fallback su download e apertura WhatsApp)
 */
export async function shareConvocazioniPdf(
  options: ConvocazioniPdfOptions
): Promise<{ sharedViaFile: boolean; success: boolean }> {
  try {
    const doc = generateConvocazioniPdf(options);
    const pdfBlob = doc.output('blob');
    const cat = (options.campionato || 'Cynthia1920').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Convocazioni_${cat}.pdf`;
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Convocazioni ${options.campionato || 'ASD Cynthia 1920'}`,
        text: `Scheda Convocazioni e Foglio di Spunta per Mister ${options.misterName || ''} - Gara ${options.squadraCasa} vs ${options.squadraOspite}`,
        files: [file],
      });
      return { sharedViaFile: true, success: true };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { sharedViaFile: false, success: false };
    }
    console.warn('Web Share PDF non supportato, download fallback:', err);
  }

  // Fallback: scarica il file PDF direttamente
  downloadConvocazioniPdf(options);
  return { sharedViaFile: false, success: true };
}
