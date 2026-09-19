import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GiocatoreConvocato, Partita } from '../types';
import { CYNTHIA_LOGO_BASE64 } from '../assets/logoBase64';

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
 * Genera il documento PDF della scheda convocazioni in formato A4 verticale.
 * Ottimizzato per la stampa su carta e la spunta manuale con penna da parte del mister.
 */
export function generateConvocazioniPdf(options: ConvocazioniPdfOptions): jsPDF {
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
    modalita = 'tutta_la_rosa',
    categoriaTarget,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginX = 12; // Margine laterale 12mm -> larghezza utile 186mm
  const contentWidth = pageWidth - marginX * 2; // 186 mm

  // Coordinate Logo Cynthia
  const logoWidth = 14;
  const logoHeight = 16;
  const logoX = marginX;
  const logoY = 8;

  // Inserimento Logo Cynthia
  try {
    doc.addImage(CYNTHIA_LOGO_BASE64, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (err) {
    console.warn('Impossibile renderizzare il logo nel PDF convocazioni:', err);
  }

  // 1. Intestazione Societaria (Top Header)
  const headerTextX = logoX + logoWidth + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(12, 74, 110); // sky-900 / Cynthia Blue
  doc.text('ASD CYNTHIA 1920', headerTextX, 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42); // slate-900
  const docTitle =
    modalita === 'solo_convocati'
      ? 'DISTINTA UFFICIALE CONVOCATI GARA'
      : 'SCHEDA CONVOCAZIONI & FOGLIO DI SPUNTA MISTER';
  doc.text(docTitle, headerTextX, 19.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  const docSub =
    modalita === 'solo_convocati'
      ? 'Elenco ufficiale atleti convocati per la gara'
      : 'Modulo per la selezione e spunta manuale dei calciatori da convocare';
  doc.text(docSub, headerTextX, 24);

  // Linea separatrice superiore in blu societario
  doc.setDrawColor(2, 132, 199); // sky-600
  doc.setLineWidth(0.8);
  doc.line(marginX, 27, pageWidth - marginX, 27);

  // 2. Quadro Dettagli Gara (Box Riassuntivo)
  const boxY = 29.5;
  const boxHeight = noteMister && noteMister.trim() ? 32 : 26;

  // Sfondo box dettagli gara
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, boxY, contentWidth, boxHeight, 2, 2, 'FD');

  // Colonna 1: Partita e Campionato
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text('CAMPIONATO / CATEGORIA:', marginX + 3, boxY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text((campionato || 'CAMPIONATO REGIONALE').toUpperCase(), marginX + 3, boxY + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PARTITA:', marginX + 3, boxY + 14.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(12, 74, 110);
  const matchDesc = `${(squadraCasa || 'CYNTHIA 1920').toUpperCase()} vs ${(squadraOspite || 'AVVERSARIO').toUpperCase()}`;
  doc.text(matchDesc, marginX + 3, boxY + 19);

  // Colonna 2: Data, Ora e Ritrovo
  const col2X = marginX + 75;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DATA & ORA GARA:', col2X, boxY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const dataOraStr = `${dataGara || 'DA DEFINIRE'} • ORE ${oraGara || '--:--'}`;
  doc.text(dataOraStr.toUpperCase(), col2X, boxY + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(217, 119, 6); // amber-600
  doc.text('ORARIO RITROVO:', col2X, boxY + 14.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9); // amber-700
  const ritrovoFormatted = (oraRitrovo || 'PRESSO IL CAMPO DI GIUOCO').toUpperCase();
  doc.text(ritrovoFormatted, col2X, boxY + 19);

  // Colonna 3: Impianto & Mister
  const col3X = marginX + 133;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CAMPO DI GIUOCO:', col3X, boxY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const campoFull = campo ? `${campo}${indirizzo ? ` (${indirizzo})` : ''}` : 'PRESSO IL CAMPO DI GIUOCO';
  const campoLines = doc.splitTextToSize(campoFull.toUpperCase(), 50);
  doc.text(campoLines, col3X, boxY + 9.5);

  const misterY = boxY + 19;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(2, 132, 199);
  doc.text('MISTER:', col3X, misterY - 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text((misterName || 'DA ASSEGNARE').toUpperCase(), col3X, misterY);

  // Se presenti, aggiungi le note del mister
  if (noteMister && noteMister.trim()) {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX + 2, boxY + 22, marginX + contentWidth - 2, boxY + 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('NOTE & INDICAZIONI MISTER:', marginX + 3, boxY + 25.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const noteLines = doc.splitTextToSize(noteMister.toUpperCase(), contentWidth - 8);
    doc.text(noteLines, marginX + 3, boxY + 29.5);
  }

  // 3. Tabella Calciatori con Casella di Spunta Manuale
  // Filtra i giocatori in base alla modalità
  let targetGiocatori = [...giocatori];
  if (modalita === 'solo_convocati') {
    targetGiocatori = targetGiocatori.filter((g) => g.selezionato);
  }

  // Prepara i dati della tabella
  const tableData = targetGiocatori.map((g, index) => {
    // Casella spunta: quadratino vuoto [  ] o spuntato [ X ]
    const spuntaText = g.selezionato ? '[ X ]' : '[   ]';
    const numJersey = g.numero ? String(g.numero) : String(index + 1);
    const nominativo = (g.nome || '').trim().toUpperCase() || 'CALCIATORE';
    const ruolo = (g.ruolo || '-').toUpperCase();
    const cat = (g.categoria || categoriaTarget || '').toUpperCase();
    const noteCol = g.note ? g.note.toUpperCase() : '................................................';

    return [spuntaText, numJersey, nominativo, ruolo, cat, noteCol];
  });

  // Aggiungi 3 righe vuote per permettere al mister di scrivere a penna atleti aggiunti dell'ultimo minuto
  if (modalita === 'tutta_la_rosa') {
    for (let i = 1; i <= 3; i++) {
      const prog = targetGiocatori.length + i;
      tableData.push([
        '[   ]',
        String(prog),
        '................................................................',
        '.....',
        '..............................',
        '................................................',
      ]);
    }
  }

  const startTableY = boxY + boxHeight + 4;

  autoTable(doc, {
    startY: startTableY,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    head: [['SPUNTA', 'N°', 'CALCIATORE (COGNOME E NOME)', 'RUOLO', 'SQUADRA / PRESTITO', 'FIRMA / NOTE MISTER']],
    body: tableData,
    headStyles: {
      fillColor: [12, 74, 110], // Cynthia Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'bold', fontSize: 8.5 }, // SPUNTA
      1: { cellWidth: 10, halign: 'center', fontSize: 8 }, // N°
      2: { cellWidth: 58, halign: 'left', fontStyle: 'bold', fontSize: 8 }, // NOMINATIVO
      3: { cellWidth: 18, halign: 'center', fontSize: 7.5 }, // RUOLO
      4: { cellWidth: 36, halign: 'center', fontSize: 7 }, // SQUADRA / PRESTITO
      5: { cellWidth: 50, halign: 'left', fontSize: 7 }, // FIRMA / NOTE
    },
    styles: {
      lineColor: [203, 213, 225],
      lineWidth: 0.25,
      cellPadding: 1.8,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawCell: (data) => {
      // Disegna una vera casella di spunta quadrata nella colonna SPUNTA
      if (data.section === 'body' && data.column.index === 0) {
        const cell = data.cell;
        const squareSize = 4.2;
        const squareX = cell.x + (cell.width - squareSize) / 2;
        const squareY = cell.y + (cell.height - squareSize) / 2;

        doc.setDrawColor(2, 132, 199);
        doc.setLineWidth(0.4);

        // Se era già selezionato nel software, riempiamo con un segno di spunta tenue o sfondo
        const rowVal = String(cell.raw || '');
        if (rowVal.includes('X')) {
          doc.setFillColor(224, 242, 254); // sky-100
          doc.rect(squareX, squareY, squareSize, squareSize, 'FD');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(2, 132, 199);
          doc.text('X', squareX + 1.1, squareY + 3.2);
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(squareX, squareY, squareSize, squareSize, 'FD');
        }
      }
    },
  });

  // 4. Box Firme e Legenda a piè di pagina
  // jsPDF autotable lascia lastAutoTable con la coordinata Y finale
  const finalTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 240;
  const signatureY = Math.min(finalTableY + 4, pageHeight - 32);

  // Legenda simboli per il mister
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'LEGENDA SPUNTA MISTER:  [ ✔ / X ] Convocato Titolare   |   [ P ] In Panchina   |   [ T ] Tribuna / Non convocato   |   [ A ] Assente / Infortunato',
    marginX,
    signatureY
  );

  // Box Firme
  const sigBoxY = signatureY + 3;
  const colWidth = (contentWidth - 6) / 3;

  // Firma Mister
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(marginX, sigBoxY + 12, marginX + colWidth, sigBoxY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('FIRMA DEL MISTER', marginX, sigBoxY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`(${misterName || 'Ruotolo Giuseppe'})`, marginX, sigBoxY + 19);

  // Firma Dirigente Accompagnatore
  const dirX = marginX + colWidth + 3;
  doc.line(dirX, sigBoxY + 12, dirX + colWidth, sigBoxY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DIRIGENTE ACCOMPAGNATORE', dirX, sigBoxY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('(Firma leggibile)', dirX, sigBoxY + 19);

  // Riepilogo Convocati e Data
  const infoX = dirX + colWidth + 3;
  const numConvocati = targetGiocatori.filter((g) => g.selezionato).length;
  const totalAtleti = targetGiocatori.length;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(12, 74, 110);
  doc.text('RIEPILOGO ATLETI:', infoX, sigBoxY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Calciatori in distinta: ${totalAtleti}`, infoX, sigBoxY + 8);
  doc.text(`• Convocati attuali: ${numConvocati}`, infoX, sigBoxY + 11.5);

  const now = new Date();
  const printDateStr = now.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  doc.text(`• Data stampa: ${printDateStr}`, infoX, sigBoxY + 15);

  // Footer pagina
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('ASD CYNTHIA 1920 • Documento tecnico per convocazioni e distinte gara ufficiali', marginX, pageHeight - 5);
  doc.text('Forza Cynthia 1920!', pageWidth - marginX, pageHeight - 5, { align: 'right' });

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
