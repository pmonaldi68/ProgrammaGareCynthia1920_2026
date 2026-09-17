import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Partita } from '../types';
import { formatMatchDateAndDay } from './dateFormatter';

/**
 * Genera il documento jsPDF con impaginazione A4 orientamento orizzontale (Landscape)
 * per garantire massima leggibilità di tutte le colonne del programma gare.
 */
export function generateWeeklySchedulePdf(partite: Partita[], titleSuffix: string = ''): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colori sociali Cynthia 1920
  const cynthiaBlue = [12, 74, 110]; // sky-900 #0c4a6e
  const cynthiaGold = [217, 119, 6];  // amber-600 #d97706
  const slateDark = [30, 41, 59];    // slate-800
  const cynthiaLightBlue = [240, 249, 255]; // sky-50

  // 1. Intestazione Header Top Bar
  doc.setFillColor(cynthiaBlue[0], cynthiaBlue[1], cynthiaBlue[2]);
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Accento oro/azzurro chiaro
  doc.setFillColor(cynthiaGold[0], cynthiaGold[1], cynthiaGold[2]);
  doc.rect(0, 25, pageWidth, 1.5, 'F');

  // Titolo Società
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('ASD CYNTHIA 1920', 14, 11);

  // Sottotitolo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(224, 242, 254); // sky-100
  const subTitle = titleSuffix
    ? `PROGRAMMA GARE DEL FINE SETTIMANA • ${titleSuffix.toUpperCase()}`
    : 'PROGRAMMA GARE DEL FINE SETTIMANA • STAGIONE 2025/2026';
  doc.text(subTitle, 14, 18);

  // Data e Ora Generazione sulla destra
  const now = new Date();
  const formattedDate = now.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  doc.setFontSize(8.5);
  doc.setTextColor(240, 249, 255);
  doc.text(`Aggiornato al: ${formattedDate} (ore ${formattedTime})`, pageWidth - 14, 11, { align: 'right' });
  doc.text('Stadio Comunale B. Abbatini • Genzano di Roma', pageWidth - 14, 17, { align: 'right' });

  // 2. Barra Statistiche Sintetiche
  const total = partite.length;
  const inCasa = partite.filter(p => p.isCynthiaCasa).length;
  const inTrasferta = partite.filter(p => p.isCynthiaOspite).length;
  const categorieCount = new Set(partite.map(p => p.campionato)).size;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(14, 30, pageWidth - 28, 10, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.rect(14, 30, pageWidth - 28, 10, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const statsText = `RIEPILOGO GARE:  ${total} Partite Totali  |  🏠 ${inCasa} in Casa  |  🚌 ${inTrasferta} in Trasferta  |  ⚽ ${categorieCount} Categorie Impegnate`;
  doc.text(statsText, 18, 36.5);

  // 3. Tabella Gare
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

  const tableRows = partite.map(p => {
    const dInfo = formatMatchDateAndDay(p.data, p.ora);
    return [
      p.campionato,
      p.girone || '-',
      p.gara || '-',
      `${dInfo.dayOfWeek}\n${dInfo.dayNumber}/${dInfo.monthNumber}`,
      dInfo.oraFormatted,
      p.squadraCasa + (p.isCynthiaCasa ? ' ⭐' : ''),
      p.squadraOspite + (p.isCynthiaOspite ? ' ⭐' : ''),
      p.campo,
      p.tipo || 'Sintetico',
      p.comune,
    ];
  });

  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: 43,
    margin: { left: 14, right: 14, bottom: 18 },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [12, 74, 110], // sky-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32 }, // Categoria
      1: { halign: 'center', cellWidth: 12 },   // Girone
      2: { halign: 'center', cellWidth: 14 },   // Gara
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 26 }, // Data
      4: { halign: 'center', fontStyle: 'bold', textColor: [180, 83, 9], cellWidth: 14 }, // Ora
      5: { fontStyle: 'bold', cellWidth: 42 },  // Casa
      6: { fontStyle: 'bold', cellWidth: 42 },  // Ospite
      7: { cellWidth: 44 },                     // Campo
      8: { halign: 'center', cellWidth: 18 },   // Fondo
      9: { cellWidth: 25 },                     // Comune
    },
    didParseCell: function (data) {
      // Evidenzia le righe o celle delle squadre Cynthia
      if (data.section === 'body') {
        const rowData = partite[data.row.index];
        if (rowData) {
          if (data.column.index === 5 && rowData.isCynthiaCasa) {
            data.cell.styles.fillColor = [224, 242, 254]; // sky-100
            data.cell.styles.textColor = [3, 105, 161];  // sky-700
          }
          if (data.column.index === 6 && rowData.isCynthiaOspite) {
            data.cell.styles.fillColor = [224, 242, 254]; // sky-100
            data.cell.styles.textColor = [3, 105, 161];  // sky-700
          }
        }
      }
    },
    didDrawPage: function (data) {
      // Footer su ogni pagina
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // slate-500

      const footerText = 'ASD CYNTHIA 1920 • Si raccomanda ai tesserati la massima puntualità • Documento ufficiale ad uso societario e informativo';
      doc.text(footerText, 14, pageHeight - 8);

      const pageNumberStr = `Pagina ${data.pageNumber}`;
      doc.text(pageNumberStr, pageWidth - 14, pageHeight - 8, { align: 'right' });
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
        text: `⚽ Programma Gare del Fine Settimana - ASD Cynthia 1920 (${partite.length} partite in programma)`,
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

  // Fallback: scarica il file PDF e apre WhatsApp con il testo riepilogativo
  downloadWeeklyPdf(partite);
  return { sharedViaNative: false, success: true };
}

/**
 * Genera il testo pulito formattato con emoji per condivisione istantanea via WhatsApp
 */
export function generateWhatsAppWeeklySummary(partite: Partita[]): string {
  const total = partite.length;
  const inCasa = partite.filter(p => p.isCynthiaCasa).length;
  const inTrasferta = partite.filter(p => p.isCynthiaOspite).length;

  let msg = `⚽ *ASD CYNTHIA 1920 - PROGRAMMA GARE*\n`;
  msg += `📅 Weekend Gare • ${total} Partite Totali (🏠 ${inCasa} Casa | 🚌 ${inTrasferta} Trasferta)\n`;
  msg += `────────────────────────────\n\n`;

  // Raggruppa per data
  const byDate: { [data: string]: Partita[] } = {};
  partite.forEach(p => {
    if (!byDate[p.data]) byDate[p.data] = [];
    byDate[p.data].push(p);
  });

  Object.entries(byDate).forEach(([data, matches]) => {
    msg += `🗓️ *${data.toUpperCase()}*\n`;
    matches.forEach(p => {
      msg += `⏰ *${p.ora}* - *${p.campionato}*\n`;
      msg += `⚔️ ${p.squadraCasa} vs ${p.squadraOspite}\n`;
      msg += `📍 ${p.campo} (${p.comune})\n`;
      if (p.lnkMaps) {
        msg += `🗺️ ${p.lnkMaps}\n`;
      }
      msg += `\n`;
    });
    msg += `────────────────────────────\n`;
  });

  msg += `💙🤍 Forza Cynthia 1920!`;
  return msg;
}
