import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Partita } from '../types';
import { formatMatchDateAndDay } from './dateFormatter';
import { CYNTHIA_LOGO_BASE64 } from '../assets/logoBase64';

/**
 * Genera il documento jsPDF con impaginazione A4 orientamento orizzontale (Landscape).
 * Design pulito, minimale, con logo societario al centro in alto ed eccellente resa tipografica.
 */
export function generateWeeklySchedulePdf(partite: Partita[], titleSuffix: string = ''): jsPDF {
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
  const logoY = 6; // In alto

  // 1. Header Minimalista ed Elegante con Logo al Centro in Alto
  // Linee accento superiori blu societario (sky-900 #0c4a6e) divise simmetricamente ai lati dello stemma
  doc.setFillColor(12, 74, 110);
  const leftLineEnd = logoX - 4;
  const rightLineStart = logoX + logoWidth + 4;
  doc.rect(marginX, 9, leftLineEnd - marginX, 1.2, 'F');
  doc.rect(rightLineStart, 9, (pageWidth - marginX) - rightLineStart, 1.2, 'F');

  // Inserimento Logo Cynthia al centro in alto
  try {
    doc.addImage(CYNTHIA_LOGO_BASE64, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (err) {
    console.warn('Impossibile renderizzare il logo nel PDF:', err);
  }

  // Titolo Società a sinistra
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('ASD CYNTHIA 1920', marginX, 17);

  // Sottotitolo a sinistra
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  const subTitle = titleSuffix
    ? `PROGRAMMA GARE - ${titleSuffix.toUpperCase()}`
    : 'PROGRAMMA GARE DEL FINE SETTIMANA';
  doc.text(subTitle, marginX, 22.5);

  // Informazioni Documento sulla destra
  const now = new Date();
  const formattedDate = now.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('Stagione Sportiva 2025/2026', pageWidth - marginX, 17, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Documento aggiornato al: ${formattedDate} (ore ${formattedTime})`, pageWidth - marginX, 22.5, { align: 'right' });

  // 2. Barra Statistiche Pulita e Minimale (Nessun emoji o carattere non standard)
  const total = partite.length;
  const inCasa = partite.filter(p => p.isCynthiaCasa).length;
  const inTrasferta = partite.filter(p => p.isCynthiaOspite).length;
  const categorieCount = new Set(partite.map(p => p.campionato)).size;

  const barY = 26.5;
  const barHeight = 7;
  const barWidth = pageWidth - (marginX * 2);

  // Sfondo barra neutro chiaro con sottile bordo
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(marginX, barY, barWidth, barHeight, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.2);
  doc.rect(marginX, barY, barWidth, barHeight, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85); // slate-700
  const statsSummary = `RIEPILOGO GARE:  ${total} Partite in programma   |   ${inCasa} in Casa   |   ${inTrasferta} in Trasferta   |   ${categorieCount} Categorie`;
  doc.text(statsSummary, marginX + 3.5, barY + 4.6);

  // 3. Intestazioni Tabella
  const tableHeaders = [
    'CATEGORIA',
    'GIR.',
    'GARA',
    'DATA',
    'ORA',
    'SQUADRA CASA',
    'SQUADRA OSPITE',
    'CAMPO DI GIOCO',
    'FONDO',
    'COMUNE',
  ];

  // Preparazione Righe: testo pulito senza simboli grafici problematici
  const tableRows = partite.map(p => {
    const dInfo = formatMatchDateAndDay(p.data, p.ora);

    // Giorno sicuro senza caratteri accentati complessi
    const safeDay = (dInfo.dayOfWeek || '')
      .replace(/Ì/g, 'I')
      .replace(/È/g, 'E')
      .replace(/É/g, 'E')
      .replace(/À/g, 'A')
      .replace(/Ò/g, 'O')
      .replace(/Ù/g, 'U');

    // Orario compatto (es. "10:30") senza prefissi
    const cleanOra = (p.ora || '').replace(/^(ore\s*|h\s*)/i, '').trim() || '-';

    return [
      p.campionato,
      p.girone || '-',
      p.gara || '-',
      `${safeDay}\n${dInfo.dayNumber}/${dInfo.monthNumber}`,
      cleanOra,
      p.squadraCasa, // Nessun simbolo o prefisso spurio
      p.squadraOspite, // Nessun simbolo o prefisso spurio
      p.campo,
      p.tipo || 'Sintetico',
      p.comune,
    ];
  });

  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: 36,
    margin: { left: marginX, right: marginX, bottom: 14 },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 },
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.15,
      textColor: [30, 41, 59], // slate-800
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900 (minimale ad alto contrasto)
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250], // Sfumatura alternata ultra-discreta
    },
    // Larghezze calibrate al millimetro: somma esatta = 273mm
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 36, textColor: [15, 23, 42] }, // Categoria
      1: { halign: 'center', cellWidth: 11 },                            // Girone
      2: { halign: 'center', cellWidth: 13 },                            // Gara
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 25 },         // Data
      4: { halign: 'center', fontStyle: 'bold', textColor: [180, 83, 9], cellWidth: 14 }, // Ora
      5: { cellWidth: 44 },                                              // Squadra Casa
      6: { cellWidth: 44 },                                              // Squadra Ospite
      7: { cellWidth: 45 },                                              // Campo
      8: { halign: 'center', cellWidth: 17 },                            // Fondo
      9: { cellWidth: 24 },                                              // Comune
    },
    didParseCell: function (data) {
      // Evidenziazione pulita e sobria delle squadre Cynthia tramite stile tipografico, senza simboli
      if (data.section === 'body') {
        const rowData = partite[data.row.index];
        if (rowData) {
          if (data.column.index === 5 && rowData.isCynthiaCasa) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [12, 74, 110]; // sky-900
            data.cell.styles.fillColor = [240, 249, 255]; // sky-50 morbido
          }
          if (data.column.index === 6 && rowData.isCynthiaOspite) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [12, 74, 110]; // sky-900
            data.cell.styles.fillColor = [240, 249, 255]; // sky-50 morbido
          }
        }
      }
    },
    didDrawPage: function (data) {
      // Footer minimale ed elegante su ciascuna pagina
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400

      const footerLeft = 'ASD CYNTHIA 1920 - Documento ufficiale ad uso societario e informativo';
      doc.text(footerLeft, marginX, pageHeight - 6);

      const pageNumberStr = `Pagina ${data.pageNumber}`;
      doc.text(pageNumberStr, pageWidth - marginX, pageHeight - 6, { align: 'right' });
    },
  });

  return doc;
}

/**
 * Scarica il file PDF direttamente sul dispositivo
 */
export function downloadWeeklyPdf(partite: Partita[], filenamePrefix: string = 'Programma_Gare_Cynthia_1920'): void {
  const doc = generateWeeklySchedulePdf(partite);
  const now = new Date();
  const dateSuffix = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  doc.save(`${filenamePrefix}_${dateSuffix}.pdf`);
}

/**
 * Condivide il PDF tramite Web Share API (se supportata con file)
 * oppure permette la condivisione diretta su WhatsApp
 */
export async function shareWeeklyPdfOrWhatsApp(
  partite: Partita[],
  title: string = 'Programma Gare Cynthia 1920'
): Promise<{ sharedViaNative: boolean; success: boolean }> {
  try {
    const doc = generateWeeklySchedulePdf(partite);
    const pdfBlob = doc.output('blob');
    const fileName = `Programma_Gare_Cynthia_1920_${Date.now()}.pdf`;
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    // Controlla se il browser supporta navigator.canShare con file (es. Chrome Android, Safari iOS)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text: `Programma Gare del Fine Settimana - ASD Cynthia 1920 (${partite.length} partite in programma)`,
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

  // Fallback: scarica il file PDF
  downloadWeeklyPdf(partite);
  return { sharedViaNative: false, success: true };
}

/**
 * Genera il testo pulito formattato per condivisione istantanea via WhatsApp
 */
export function generateWhatsAppWeeklySummary(partite: Partita[]): string {
  const total = partite.length;
  const inCasa = partite.filter(p => p.isCynthiaCasa).length;
  const inTrasferta = partite.filter(p => p.isCynthiaOspite).length;

  let msg = `*ASD CYNTHIA 1920 - PROGRAMMA GARE*\n`;
  msg += `Weekend Gare • ${total} Partite Totali (${inCasa} Casa | ${inTrasferta} Trasferta)\n`;
  msg += `────────────────────────────\n\n`;

  // Raggruppa per data
  const byDate: { [data: string]: Partita[] } = {};
  partite.forEach(p => {
    if (!byDate[p.data]) byDate[p.data] = [];
    byDate[p.data].push(p);
  });

  Object.entries(byDate).forEach(([data, matches]) => {
    msg += `*${data.toUpperCase()}*\n`;
    matches.forEach(p => {
      msg += `*${p.ora}* - *${p.campionato}*\n`;
      msg += `${p.squadraCasa} vs ${p.squadraOspite}\n`;
      msg += `${p.campo} (${p.comune})\n`;
      if (p.lnkMaps) {
        msg += `${p.lnkMaps}\n`;
      }
      msg += `\n`;
    });
    msg += `────────────────────────────\n`;
  });

  msg += `Forza Cynthia 1920!`;
  return msg;
}
