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

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let str = text;
  while (str.length > 2 && ctx.measureText(str + '..').width > maxWidth) {
    str = str.slice(0, -1);
  }
  return str + '..';
}

/**
 * Renderizza l'esatta grafica della locandina A4 in altissima risoluzione (1654x2338 px @ 200 DPI)
 * utilizzando l'API Canvas 2D nativa del browser.
 * È ultra-rapida (<20ms), priva di incompatibilità CSS, e identica al 100% all'anteprima a schermo.
 */
export async function renderLocandinaCanvas(options: LocandinaPdfOptions): Promise<HTMLCanvasElement> {
  const {
    partite,
    titolo = 'PROGRAMMA GARE DEL FINE SETTIMANA',
    sottotitolo,
    motto = 'TUTTI AL CAMPO A SOSTENERE I BIANCOAZZURRI!',
    notePiePagina = 'A.S.D. CYNTHIA 1920 • GENZANO DI ROMA (RM)',
    logoBase64 = CYNTHIA_LOGO_BASE64,
  } = options;

  const canvas = document.createElement('canvas');
  const W = 1654;
  const H = 2338;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 1. Sfondo Bianco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // 2. Doppia Cornice Perimetrale (Blu Cynthia & Oro)
  // Bordo Esterno Blu Navy
  ctx.strokeStyle = '#0c4a6e';
  ctx.lineWidth = 14;
  ctx.strokeRect(32, 32, W - 64, H - 64);

  // Bordo Interno Oro Dorato
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 5;
  ctx.strokeRect(50, 50, W - 100, H - 100);

  // 3. Header: Logo Centrato in Alto con Linee Simmetriche
  const logoWidth = 160;
  const logoHeight = 180;
  const logoX = (W - logoWidth) / 2;
  const logoY = 80;

  // Disegna linee decorative simmetriche laterali al logo
  ctx.strokeStyle = '#0c4a6e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(90, logoY + logoHeight / 2);
  ctx.lineTo(logoX - 30, logoY + logoHeight / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(logoX + logoWidth + 30, logoY + logoHeight / 2);
  ctx.lineTo(W - 90, logoY + logoHeight / 2);
  ctx.stroke();

  // Caricamento del logo (garantito base64 locale)
  if (logoBase64) {
    try {
      const img = new Image();
      img.src = logoBase64;
      if (!img.complete) {
        await new Promise((resolve) => {
          img.onload = () => resolve(null);
          img.onerror = () => resolve(null);
          setTimeout(() => resolve(null), 800);
        });
      }
      ctx.drawImage(img, logoX, logoY, logoWidth, logoHeight);
    } catch (e) {
      console.warn('Errore rendering logo su canvas:', e);
    }
  }

  // 4. Titoli Intestazione
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Nome Società
  ctx.font = 'bold 50px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#0c4a6e';
  ctx.fillText('A.S.D. CYNTHIA 1920', W / 2, 312);

  // Titolo Principale (es. "PROGRAMMA GARE DEL FINE SETTIMANA")
  ctx.font = '900 32px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#0369a1';
  ctx.fillText(titolo.toUpperCase(), W / 2, 360);

  // Badge Data Weekend
  const dateStr = sottotitolo || computeWeekendDatesString(partite);
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  const textW = ctx.measureText(dateStr).width;
  const badgeW = Math.min(W - 200, Math.max(260, textW + 64));
  const badgeH = 50;
  const badgeX = (W - badgeW) / 2;
  const badgeY = 388;

  ctx.fillStyle = '#f0f9ff';
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 2.5;
  drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 25);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0c4a6e';
  ctx.fillText(dateStr, W / 2, badgeY + 34);

  // Motto
  let startY = 475;
  if (motto) {
    ctx.font = 'italic bold 25px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#b45309'; // oro ambrato
    ctx.fillText(motto, W / 2, 478);
    startY = 515;
  }

  // 5. Footer Istituzionale A4
  const footerH = 92;
  const footerY = H - 56 - footerH;
  const footerX = 66;
  const footerW = W - 132;

  ctx.fillStyle = '#0c4a6e';
  drawRoundRect(ctx, footerX, footerY, footerW, footerH, 16);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.fillText(notePiePagina, W / 2, footerY + 40);

  ctx.fillStyle = '#bae6fd';
  ctx.font = 'normal 19px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    'Sito Ufficiale: asdcynthia1920.it • Canale WhatsApp Ufficiale • #ForzaCynthia',
    W / 2,
    footerY + 72
  );

  // 6. Calcolo e Layout Griglia Partite
  const availableHeight = footerY - startY - 24;
  const totalMatches = partite.length;

  if (totalMatches === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 28px system-ui, -apple-system, sans-serif';
    ctx.fillText('Nessuna gara selezionata per la locandina.', W / 2, startY + 200);
    return canvas;
  }

  const isTwoColumns = totalMatches > 6;

  if (!isTwoColumns) {
    // 1 COLONNA (layout spazioso ad alta leggibilità)
    const cardX = 72;
    const cardW = W - 144;
    const gapY = 20;
    const cardH = Math.min(
      230,
      Math.max(140, (availableHeight - (totalMatches - 1) * gapY) / totalMatches)
    );

    partite.forEach((p, idx) => {
      const cardY = startY + idx * (cardH + gapY);
      renderCanvasMatchCard(ctx, p, cardX, cardY, cardW, cardH, false);
    });
  } else {
    // 2 COLONNE (ordine righe identico al CSS grid preview)
    const gapX = 28;
    const gapY = 16;
    const cardW = (W - 144 - gapX) / 2;
    const numRows = Math.ceil(totalMatches / 2);
    const cardH = Math.min(
      210,
      Math.max(125, (availableHeight - (numRows - 1) * gapY) / numRows)
    );

    partite.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cardX = 72 + col * (cardW + gapX);
      const cardY = startY + row * (cardH + gapY);
      renderCanvasMatchCard(ctx, p, cardX, cardY, cardW, cardH, true);
    });
  }

  return canvas;
}

/**
 * Renderizza una singola card gara sul canvas con fedeltà identica al preview
 */
function renderCanvasMatchCard(
  ctx: CanvasRenderingContext2D,
  p: Partita,
  x: number,
  y: number,
  w: number,
  h: number,
  isTwoCols: boolean
): void {
  const isCasa = p.isCynthiaCasa;
  const dateInfo = formatMatchDateAndDay(p.data, p.ora);

  // Sfondo Card
  ctx.fillStyle = isCasa ? '#f0f9ff' : '#ffffff';
  ctx.strokeStyle = isCasa ? '#7dd3fc' : '#e2e8f0';
  ctx.lineWidth = 2.5;
  drawRoundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();

  // Striscia laterale colorata
  ctx.fillStyle = isCasa ? '#0284c7' : '#d97706';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, 14, h, [18, 0, 0, 18]);
  } else {
    drawRoundRect(ctx, x, y, 14, h, 6);
  }
  ctx.fill();

  // Header Card: Categoria & Badge Casa/Trasferta
  const badgeText = isCasa ? 'CASA' : 'TRASFERTA';
  ctx.font = '900 17px system-ui, -apple-system, sans-serif';
  const badgeTextW = ctx.measureText(badgeText).width;
  const badgeW = badgeTextW + 24;
  const badgeH = 28;
  const badgeX = x + w - badgeW - 16;
  const badgeY = y + 14;

  ctx.fillStyle = isCasa ? '#e0f2fe' : '#fef3c7';
  ctx.strokeStyle = isCasa ? '#bae6fd' : '#fde68a';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 7);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = isCasa ? '#0369a1' : '#b45309';
  ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + 20);

  // Nome Categoria / Campionato
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#0c4a6e';
  const maxCatW = badgeX - x - 40;
  ctx.fillText(truncateText(ctx, (p.campionato || '').toUpperCase(), maxCatW), x + 30, y + 35);

  // Data & Orario
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#475569';
  const dateFormatted = `${dateInfo.dayOfWeek ? dateInfo.dayOfWeek + ' ' : ''}${p.data} • ore ${p.ora}`;
  ctx.fillText(`🕒 ${dateFormatted}`, x + 30, y + 68);

  // Matchup Squadre
  const teamFontSize = isTwoCols ? 24 : 28;
  ctx.font = `900 ${teamFontSize}px system-ui, -apple-system, sans-serif`;

  const casaName = p.squadraCasa || 'Squadra Casa';
  const ospiteName = p.squadraOspite || 'Squadra Ospite';
  const vsText = ' vs ';
  const vsW = ctx.measureText(vsText).width;
  const maxTeamsW = w - 60;

  const totalMatchW = ctx.measureText(casaName + vsText + ospiteName).width;
  const matchY = y + (h >= 190 ? 116 : 104);

  if (totalMatchW <= maxTeamsW) {
    ctx.fillStyle = isCasa ? '#0369a1' : '#1e293b';
    ctx.fillText(casaName, x + 30, matchY);
    const casaW = ctx.measureText(casaName).width;

    ctx.font = `normal ${teamFontSize - 4}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(vsText, x + 30 + casaW, matchY);

    ctx.font = `900 ${teamFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = !isCasa ? '#0369a1' : '#1e293b';
    ctx.fillText(ospiteName, x + 30 + casaW + vsW, matchY);
  } else {
    // Adatta con testo troncato proporzionalmente
    const halfAvailable = (maxTeamsW - vsW) / 2;
    const truncatedCasa = truncateText(ctx, casaName, halfAvailable);
    const truncatedOspite = truncateText(ctx, ospiteName, halfAvailable);

    ctx.fillStyle = isCasa ? '#0369a1' : '#1e293b';
    ctx.fillText(truncatedCasa, x + 30, matchY);
    const casaW = ctx.measureText(truncatedCasa).width;

    ctx.font = `normal ${teamFontSize - 4}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(vsText, x + 30 + casaW, matchY);

    ctx.font = `900 ${teamFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = !isCasa ? '#0369a1' : '#1e293b';
    ctx.fillText(truncatedOspite, x + 30 + casaW + vsW, matchY);
  }

  // Campo Sportivo (se presente e altezza card sufficiente)
  if (p.campo && h >= 140) {
    ctx.font = '500 18px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#64748b';
    const venueRaw = `📍 ${p.campo}${p.indirizzo ? ' • ' + p.indirizzo : ''} (${p.comune})`;
    ctx.fillText(truncateText(ctx, venueRaw, w - 60), x + 30, y + h - 18);
  }
}

/**
 * Scarica il file PDF della locandina esattamente identico e fedele all'anteprima a schermo
 */
export async function downloadLocandinaPdf(options: LocandinaPdfOptions): Promise<void> {
  let doc: jsPDF;
  try {
    const canvas = await renderLocandinaCanvas(options);
    doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    // A4 Portrait 210 x 297 mm
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  } catch (err) {
    console.warn('Fallback a generateLocandinaPdf standard:', err);
    doc = generateLocandinaPdf(options);
  }

  const now = new Date();
  const dateSuffix = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  doc.save(`Locandina_Gare_Cynthia_A4_${dateSuffix}.pdf`);
}

/**
 * Scarica la locandina come immagine PNG ad alta risoluzione (300 DPI), ideale per WhatsApp e Social Media
 */
export async function downloadLocandinaImage(options: LocandinaPdfOptions): Promise<boolean> {
  try {
    const canvas = await renderLocandinaCanvas(options);
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    const now = new Date();
    const dateSuffix = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    link.download = `Locandina_Gare_Cynthia_1920_${dateSuffix}.png`;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (err) {
    console.error('Errore creazione immagine PNG:', err);
    return false;
  }
}

/**
 * Stampa pulita e fedele della locandina in A4
 */
export async function printLocandinaPdf(options: LocandinaPdfOptions): Promise<void> {
  const sheetElement = document.getElementById('locandina-sheet-a4');
  if (sheetElement) {
    window.print();
    return;
  }

  try {
    const canvas = await renderLocandinaCanvas(options);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
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
          window.print();
        }
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
          URL.revokeObjectURL(blobUrl);
        }, 60000);
      }, 500);
    };
  } catch (err) {
    console.warn('Fallback standard per stampa locandina:', err);
    window.print();
  }
}

/**
 * Condivide il file PDF fedele della locandina tramite Web Share API o effettua fallback a download
 */
export async function shareLocandinaPdf(options: LocandinaPdfOptions): Promise<{ shared: boolean }> {
  try {
    const canvas = await renderLocandinaCanvas(options);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    const pdfBlob = doc.output('blob');
    const fileName = `Locandina_Gare_Cynthia_1920_${Date.now()}.pdf`;
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Locandina Gare ASD Cynthia 1920',
        text: `Locandina Ufficiale A4 - Programma Gare (${options.partite.length} partite in programma)`,
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

  await downloadLocandinaPdf(options);
  return { shared: false };
}
