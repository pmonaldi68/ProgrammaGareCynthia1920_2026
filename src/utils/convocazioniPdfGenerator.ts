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
    const ruoloTag = g.ruolo ? ` (${g.ruolo.toUpperCase()})` : '';
    const squadUpper = (g.squadra || '').toUpperCase();
    const clubTag = squadUpper.includes('ALBA')
      ? ' [ALBACYNTHIA]'
      : squadUpper.includes('ACADEMY')
      ? ' [ACADEMY]'
      : '';
    const fullNominativo = `${nominativo}${ruoloTag}${clubTag}`;
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

  // Posizione inizio tabella compatta
  const startTableY = boxY + boxHeight + 2.5;

  const headerColumnTitle = modalita === 'solo_convocati'
    ? 'CALCIATORE (COGNOME E NOME) - CONVOCATI UFFICIALI (MAX 25)'
    : 'CALCIATORE (COGNOME E NOME) - ROSA COMPLETA SPUNTA A PENNA';

  // Altezza riga calibrata: per fino a 25 atleti è 5.1mm (singola pagina perfetta),
  // se la rosa è più numerosa riduce proporzionalmente per mantenere l'impaginazione ottimale
  const dynamicCellHeight = Math.max(3.9, Math.min(5.1, 130 / Math.max(tableData.length, 1)));

  autoTable(doc, {
    startY: startTableY,
    margin: { left: marginX, right: marginX, bottom: 10 },
    theme: 'grid',
    head: [['SPUNTA', 'N°', headerColumnTitle, 'NOTE MISTER']],
    body: tableData,
    pageBreak: modalita === 'solo_convocati' ? 'avoid' : 'auto',
    rowPageBreak: 'avoid',
    headStyles: {
      fillColor: [12, 74, 110], // Cynthia Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.8,
      halign: 'center',
      cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center', fontStyle: 'bold', fontSize: 8 }, // SPUNTA
      1: { cellWidth: 11, halign: 'center', fontSize: 7.8 }, // N°
      2: { cellWidth: 92, halign: 'left', fontStyle: 'bold', fontSize: 8.2 }, // NOMINATIVO
      3: { cellWidth: 70, halign: 'left', fontSize: 7.5 }, // NOTE MISTER
    },
    styles: {
      fillColor: false, // Trasparente per filigrana
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      cellPadding: { top: 1.2, bottom: 1.2, left: 1.8, right: 1.8 },
      minCellHeight: dynamicCellHeight,
      overflow: 'linebreak',
    },
    willDrawPage: () => {
      // Filigrana diagonale tenue 'CYNTHIA 1920' posizionata dietro al contenuto della distinta
      doc.saveGraphicsState();
      if (typeof (doc as any).GState === 'function') {
        doc.setGState(new (doc as any).GState({ opacity: 0.07 }));
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
      // Disegna una casella di spunta quadrata proporzionata all'altezza riga ridotta
      if (data.section === 'body' && data.column.index === 0) {
        const cell = data.cell;
        const squareSize = 3.6;
        const squareX = cell.x + (cell.width - squareSize) / 2;
        const squareY = cell.y + (cell.height - squareSize) / 2;

        doc.setDrawColor(2, 132, 199);
        doc.setLineWidth(0.35);

        const rowVal = String(cell.raw || '');
        if (rowVal.includes('X')) {
          doc.setFillColor(224, 242, 254); // sky-100
          doc.rect(squareX, squareY, squareSize, squareSize, 'FD');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(2, 132, 199);
          doc.text('X', squareX + 0.9, squareY + 2.8);
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(squareX, squareY, squareSize, squareSize, 'FD');
        }
      }
    },
  });

  // In modalità 'solo_convocati' (max 25): garantisce singola pagina
  if (modalita === 'solo_convocati') {
    while (doc.getNumberOfPages() > 1) {
      doc.deletePage(2);
    }
  }

  // Footer su tutte le pagine generate
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const footerLeft = modalita === 'solo_convocati'
      ? `ASD CYNTHIA 1920 • Distinta Convocati Ufficiale (Limite max 25: ${targetGiocatori.length} convocati)`
      : `ASD CYNTHIA 1920 • Foglio di Spunta Rosa Completa (${targetGiocatori.length} atleti per spunta a penna)`;
    doc.text(footerLeft, marginX, pageHeight - 5);
    const footerRight = totalPages > 1
      ? `Pagina ${p} di ${totalPages} • Forza Cynthia 1920!`
      : 'Pagina 1 di 1 • Forza Cynthia 1920!';
    doc.text(footerRight, pageWidth - marginX, pageHeight - 5, { align: 'right' });
  }

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
 * Apre la finestra di stampa per il documento PDF convocazioni
 */
export function printConvocazioniPdf(options: ConvocazioniPdfOptions): void {
  const doc = generateConvocazioniPdf(options);
  const pdfBlobUrl = doc.output('bloburl');
  const printWindow = window.open(pdfBlobUrl, '_blank');
  if (printWindow) {
    printWindow.focus();
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
