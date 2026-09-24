import jsPDF from 'jspdf';
import { Partita } from '../types';
import { CYNTHIA_LOGO_BASE64 } from '../assets/logoBase64';
import { formatMatchDateAndDay } from './dateFormatter';

export interface LocandinaPdfOptions {
  partite: Partita[];
  titolo?: string;
  sottotitolo?: string;
  motto?: string;
  notePiePagina?: string;
  logoBase64?: string;
  filtroCasaTrasferta?: 'tutte' | 'casa' | 'trasferta';
}

/**
 * Calcola l'intervallo di date del weekend (es. "SABATO 28 & DOMENICA 29 SETTEMBRE 2026")
 */
export function computeWeekendDatesString(partite: Partita[]): string {
  if (!partite || partite.length === 0) {
    const now = new Date();
    return `WEEKEND ${now.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}`;
  }

  const dateSet = new Set<string>();
  const giorniSet = new Set<string>();
  let mese = '';
  let anno = '';

  partite.forEach((p) => {
    if (p.data) {
      const f = formatMatchDateAndDay(p.data, p.ora);
      if (f.dayOfWeek) giorniSet.add(f.dayOfWeek);
      if (f.dayNumber) dateSet.add(f.dayNumber);
      if (f.monthName) mese = f.monthName;
      if (f.year) anno = f.year;
    }
  });

  const giorniArr = Array.from(giorniSet);
  const dateArr = Array.from(dateSet).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  if (giorniArr.length > 0 && dateArr.length > 0) {
    const dateFormatted = dateArr.join(' & ');
    const giorniFormatted = giorniArr.join(' & ');
    return `${giorniFormatted} ${dateFormatted} ${mese} ${anno}`.trim();
  }

  return 'PROGRAMMA UFFICIALE GARE';
}

/**
 * Genera il documento PDF della Locandina Ufficiale Gare in formato A4 Verticale (Portrait 210 x 297 mm).
 * Presenta il logo ASD Cynthia 1920 centrato in alto, grafica accattivante da affissione bacheca / social,
 * e impaginazione intelligente ad 1 o 2 colonne in base al numero di incontri.
 */
export function generateLocandinaPdf(options: LocandinaPdfOptions): jsPDF {
  const {
    partite,
    titolo = 'PROGRAMMA GARE DEL FINE SETTIMANA',
    sottotitolo,
    motto = 'TUTTI AL CAMPO A SOSTENERE I BIANCOAZZURRI!',
    notePiePagina,
    logoBase64 = CYNTHIA_LOGO_BASE64,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginX = 8;
  const marginY = 8;
  const contentWidth = pageWidth - marginX * 2; // 194 mm
  const contentHeight = pageHeight - marginY * 2; // 281 mm

  // 1. Cornice perimetrale decorativa in stile societario Cynthia (Navy & Oro)
  // Bordo esterno blu scuro
  doc.setDrawColor(12, 74, 110); // sky-900 / Cynthia Navy
  doc.setLineWidth(0.8);
  doc.rect(marginX, marginY, contentWidth, contentHeight, 'S');

  // Bordo interno dorato
  doc.setDrawColor(217, 119, 6); // amber-600 / Oro
  doc.setLineWidth(0.35);
  doc.rect(marginX + 1.5, marginY + 1.5, contentWidth - 3, contentHeight - 3, 'S');

  // Angoli decorativi
  const cornerSize = 4;
  doc.setFillColor(12, 74, 110);
  doc.rect(marginX, marginY, cornerSize, 1.2, 'F');
  doc.rect(marginX, marginY, 1.2, cornerSize, 'F');
  doc.rect(marginX + contentWidth - cornerSize, marginY, cornerSize, 1.2, 'F');
  doc.rect(marginX + contentWidth - 1.2, marginY, 1.2, cornerSize, 'F');
  doc.rect(marginX, marginY + contentHeight - 1.2, cornerSize, 1.2, 'F');
  doc.rect(marginX, marginY + contentHeight - cornerSize, 1.2, cornerSize, 'F');
  doc.rect(marginX + contentWidth - cornerSize, marginY + contentHeight - 1.2, cornerSize, 1.2, 'F');
  doc.rect(marginX + contentWidth - 1.2, marginY + contentHeight - cornerSize, 1.2, cornerSize, 'F');

  // 2. Logo Caricato Centrato in Alto
  const logoWidth = 26;
  const logoHeight = 29.7; // proporzione 210x240
  const logoX = (pageWidth - logoWidth) / 2; // 92 mm
  const logoY = 12;

  // Linee simmetriche eleganti ai lati del logo
  doc.setDrawColor(12, 74, 110);
  doc.setLineWidth(0.6);
  doc.line(marginX + 6, logoY + logoHeight / 2, logoX - 4, logoY + logoHeight / 2);
  doc.line(logoX + logoWidth + 4, logoY + logoHeight / 2, pageWidth - marginX - 6, logoY + logoHeight / 2);

  // Linee sottili oro
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.25);
  doc.line(marginX + 10, logoY + logoHeight / 2 + 1.2, logoX - 8, logoY + logoHeight / 2 + 1.2);
  doc.line(logoX + logoWidth + 8, logoY + logoHeight / 2 + 1.2, pageWidth - marginX - 10, logoY + logoHeight / 2 + 1.2);

  // Inserimento Logo
  try {
    doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (err) {
    console.warn('Impossibile inserire logo nella locandina:', err);
  }

  // 3. Titoli Intestazione Locandina
  // Nome Società
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17.5);
  doc.setTextColor(12, 74, 110); // Cynthia Navy
  doc.text('A.S.D. CYNTHIA 1920', pageWidth / 2, 46, { align: 'center' });

  // Titolo Principale Locandina (es. "PROGRAMMA GARE DEL FINE SETTIMANA")
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(3, 105, 161); // sky-700
  doc.text(titolo.toUpperCase(), pageWidth / 2, 51.5, { align: 'center' });

  // Badge Date del Weekend
  const dateStr = sottotitolo || computeWeekendDatesString(partite);
  const badgeWidth = Math.min(140, Math.max(80, dateStr.length * 2.8 + 14));
  const badgeHeight = 6.2;
  const badgeX = (pageWidth - badgeWidth) / 2;
  const badgeY = 54.5;

  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(186, 230, 253); // sky-200
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.8, 1.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(12, 74, 110);
  doc.text(dateStr, pageWidth / 2, badgeY + 4.3, { align: 'center' });

  // Motto / Invito ai tifosi
  if (motto) {
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9); // amber-700 / oro
    doc.text(motto, pageWidth / 2, 64.5, { align: 'center' });
  }

  // 4. Calcolo e Layout Griglia Partite
  const startY = 67.5;
  const footerHeight = 11;
  const footerY = pageHeight - marginY - footerHeight;
  const availableHeight = footerY - startY - 2; // ~208 mm

  const totalMatches = partite.length;

  if (totalMatches === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text('Nessuna gara in programma per questo turno.', pageWidth / 2, startY + 40, { align: 'center' });
  } else {
    // Determina se 1 colonna (fino a 6 partite) o 2 colonne (da 7 a 16 partite)
    const isTwoColumns = totalMatches > 6;

    if (!isTwoColumns) {
      // ===== LAYOUT A 1 COLONNA (Spazioso, orizzontale) =====
      const colWidth = contentWidth - 8; // 186 mm
      const colX = marginX + 4;
      const gapY = 3.5;
      const cardHeight = Math.min(32, Math.max(22, (availableHeight - (totalMatches - 1) * gapY) / totalMatches));

      let currentY = startY;

      partite.forEach((p, index) => {
        renderMatchCardSingleColumn(doc, p, colX, currentY, colWidth, cardHeight, index);
        currentY += cardHeight + gapY;
      });
    } else {
      // ===== LAYOUT A 2 COLONNE (Griglia compatta ed elegante) =====
      const colWidth = (contentWidth - 12) / 2; // ~91 mm ciascuna
      const col1X = marginX + 4;
      const col2X = col1X + colWidth + 4;
      const gapY = 3;

      const half = Math.ceil(totalMatches / 2);
      const cardHeight = Math.min(26.5, Math.max(18, (availableHeight - (half - 1) * gapY) / half));

      partite.forEach((p, index) => {
        const isCol2 = index >= half;
        const colIndex = isCol2 ? index - half : index;
        const x = isCol2 ? col2X : col1X;
        const y = startY + colIndex * (cardHeight + gapY);

        renderMatchCardTwoColumns(doc, p, x, y, colWidth, cardHeight, index);
      });
    }
  }

  // 5. Footer Istituzionale A4
  doc.setFillColor(12, 74, 110); // Cynthia Navy
  doc.rect(marginX + 1.5, footerY, contentWidth - 3, footerHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  const footerLine1 = notePiePagina || 'A.S.D. CYNTHIA 1920 • GENZANO DI ROMA (RM)';
  doc.text(footerLine1, pageWidth / 2, footerY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(186, 230, 253); // sky-200
  doc.text('Sito Ufficiale: asdcynthia1920.it • Canale WhatsApp Ufficiale • #ForzaCynthia1920', pageWidth / 2, footerY + 8.2, { align: 'center' });

  return doc;
}

/**
 * Renderizza una card partita nel layout a 1 colonna (larga 186 mm)
 */
function renderMatchCardSingleColumn(
  doc: jsPDF,
  p: Partita,
  x: number,
  y: number,
  w: number,
  h: number,
  _index: number
): void {
  const isCasa = p.isCynthiaCasa;

  // Sfondo Card
  if (isCasa) {
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(2, 132, 199); // sky-600
  } else {
    doc.setFillColor(255, 255, 255); // bianco
    doc.setDrawColor(203, 213, 225); // slate-300
  }
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  // Striscia colorata laterale sinistra
  if (isCasa) {
    doc.setFillColor(2, 132, 199); // sky-600 (Blu Cynthia Casa)
  } else {
    doc.setFillColor(217, 119, 6); // amber-600 (Oro Trasferta)
  }
  doc.roundedRect(x, y, 2.5, h, 1, 1, 'F');

  // Riga 1: Categoria a sinistra + Data & Orario a destra
  const dateInfo = formatMatchDateAndDay(p.data, p.ora);
  const catText = p.campionato.toUpperCase();
  const dateBadgeText = `${dateInfo.dayOfWeek ? dateInfo.dayOfWeek + ' ' : ''}${p.data} • ORE ${p.ora}`.toUpperCase();

  // Categoria
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(12, 74, 110);
  doc.text(catText, x + 6, y + 6);

  // Badge Casa / Trasferta
  const casaBadgeText = isCasa ? 'CASA' : 'TRASFERTA';
  const casaBadgeW = isCasa ? 13 : 21;
  const casaBadgeX = x + w - casaBadgeW - 4;
  if (isCasa) {
    doc.setFillColor(224, 242, 254); // sky-100
    doc.setDrawColor(56, 189, 248); // sky-400
    doc.setTextColor(3, 105, 161); // sky-700
  } else {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(251, 191, 36); // amber-400
    doc.setTextColor(180, 83, 9); // amber-700
  }
  doc.setLineWidth(0.2);
  doc.roundedRect(casaBadgeX, y + 2.5, casaBadgeW, 4.5, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text(casaBadgeText, casaBadgeX + casaBadgeW / 2, y + 5.7, { align: 'center' });

  // Data & Orario
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(dateBadgeText, casaBadgeX - 4, y + 6, { align: 'right' });

  // Riga 2: Matchup Squadre
  const teamCasa = (p.squadraCasa || '').toUpperCase();
  const teamOspite = (p.squadraOspite || '').toUpperCase();
  const matchY = y + 13.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);

  if (isCasa) {
    doc.setTextColor(2, 132, 199); // Cynthia in risalto
    doc.text(teamCasa, x + 6, matchY);
    const casaW = doc.getTextWidth(teamCasa);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(' vs ', x + 6 + casaW, matchY);
    const vsW = doc.getTextWidth(' vs ');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(teamOspite, x + 6 + casaW + vsW, matchY);
  } else {
    doc.setTextColor(30, 41, 59);
    doc.text(teamCasa, x + 6, matchY);
    const casaW = doc.getTextWidth(teamCasa);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(' vs ', x + 6 + casaW, matchY);
    const vsW = doc.getTextWidth(' vs ');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(2, 132, 199); // Cynthia in risalto
    doc.text(teamOspite, x + 6 + casaW + vsW, matchY);
  }

  // Riga 3: Impianto di gioco e Indirizzo
  const campoStr = p.campo ? `Campo: ${p.campo}` : '';
  const indirizzoStr = p.indirizzo ? ` (${p.indirizzo})` : '';
  const locationFull = `${campoStr}${indirizzoStr}`.trim();

  if (locationFull && h >= 22) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    const locY = y + h - 3.5;
    doc.text(locationFull.length > 95 ? locationFull.substring(0, 92) + '...' : locationFull, x + 6, locY);
  }
}

/**
 * Renderizza una card partita nel layout a 2 colonne (compatta, larga ~91 mm)
 */
function renderMatchCardTwoColumns(
  doc: jsPDF,
  p: Partita,
  x: number,
  y: number,
  w: number,
  h: number,
  _index: number
): void {
  const isCasa = p.isCynthiaCasa;

  // Sfondo Card
  if (isCasa) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(2, 132, 199);
  } else {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
  }
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 1.8, 1.8, 'FD');

  // Striscia laterale colorata
  if (isCasa) {
    doc.setFillColor(2, 132, 199);
  } else {
    doc.setFillColor(217, 119, 6);
  }
  doc.roundedRect(x, y, 2, h, 0.8, 0.8, 'F');

  // Header Card: Categoria & Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(12, 74, 110);
  const catShort = p.campionato.length > 25 ? p.campionato.substring(0, 24) + '..' : p.campionato;
  doc.text(catShort.toUpperCase(), x + 4.5, y + 4.8);

  // Badge Casa / Trasferta
  const badgeW = isCasa ? 10 : 16;
  const badgeX = x + w - badgeW - 2.5;
  if (isCasa) {
    doc.setFillColor(224, 242, 254);
    doc.setTextColor(3, 105, 161);
  } else {
    doc.setFillColor(254, 243, 199);
    doc.setTextColor(180, 83, 9);
  }
  doc.roundedRect(badgeX, y + 1.8, badgeW, 3.8, 0.8, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text(isCasa ? 'CASA' : 'TRASFERTA', badgeX + badgeW / 2, y + 4.5, { align: 'center' });

  // Data & Orario
  const dateInfo = formatMatchDateAndDay(p.data, p.ora);
  const shortDate = `${dateInfo.dayOfWeek ? dateInfo.dayOfWeek.substring(0, 3) + ' ' : ''}${p.data} • ${p.ora}`.toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(shortDate, x + 4.5, y + 9.5);

  // Matchup Squadre
  const teamCasa = (p.squadraCasa || '').toUpperCase();
  const teamOspite = (p.squadraOspite || '').toUpperCase();
  const matchY = y + 14.8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  const matchText = `${teamCasa} vs ${teamOspite}`;
  if (matchText.length > 36) {
    // Stampa su due righe se lungo
    doc.setTextColor(isCasa ? 2 : 30, isCasa ? 132 : 41, isCasa ? 199 : 59);
    doc.text(teamCasa.length > 30 ? teamCasa.substring(0, 28) + '..' : teamCasa, x + 4.5, matchY);
    doc.setTextColor(isCasa ? 30 : 2, isCasa ? 41 : 132, isCasa ? 59 : 199);
    doc.text(`vs ${teamOspite.length > 27 ? teamOspite.substring(0, 25) + '..' : teamOspite}`, x + 4.5, matchY + 3.8);
  } else {
    // Riga singola
    doc.setTextColor(15, 23, 42);
    doc.text(matchText, x + 4.5, matchY);
  }

  // Campo Sportivo
  if (p.campo && h >= 22) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    const campoShort = p.campo.length > 36 ? p.campo.substring(0, 34) + '..' : p.campo;
    doc.text(campoShort, x + 4.5, y + h - 2.5);
  }
}

/**
 * Scarica il file PDF della locandina sul dispositivo
 */
export function downloadLocandinaPdf(options: LocandinaPdfOptions): void {
  const doc = generateLocandinaPdf(options);
  const now = new Date();
  const dateSuffix = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  doc.save(`Locandina_Gare_Cynthia_A4_${dateSuffix}.pdf`);
}

/**
 * Stampa pulita della locandina in A4
 */
export function printLocandinaPdf(options: LocandinaPdfOptions): void {
  const sheetElement = document.getElementById('locandina-sheet-a4');
  if (sheetElement) {
    window.print();
    return;
  }

  try {
    const doc = generateLocandinaPdf(options);
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl, '_blank');
    if (!printWindow) {
      downloadLocandinaPdf(options);
    }
  } catch (err) {
    console.warn('Fallback download per stampa locandina:', err);
    downloadLocandinaPdf(options);
  }
}

/**
 * Condivide il file PDF della locandina tramite Web Share API o effettua fallback a download
 */
export async function shareLocandinaPdf(options: LocandinaPdfOptions): Promise<{ shared: boolean }> {
  try {
    const doc = generateLocandinaPdf(options);
    const pdfBlob = doc.output('blob');
    const fileName = `Locandina_Gare_Cynthia_1920_${Date.now()}.pdf`;
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Locandina Gare ASD Cynthia 1920',
        text: `Locandina Ufficiale A4 - Programma Gare del Weekend (${options.partite.length} partite in programma)`,
        files: [file],
      });
      return { shared: true };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { shared: true };
    }
    console.warn('Web Share file non supportato, fallback download:', err);
  }

  downloadLocandinaPdf(options);
  return { shared: false };
}
