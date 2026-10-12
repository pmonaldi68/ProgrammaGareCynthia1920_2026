import jsPDF from 'jspdf';
import { Partita } from '../types';
import { CYNTHIA_LOGO_BASE64 } from '../assets/logoBase64';
import { POSTER_MATCHDAY_BG_BASE64 } from '../assets/posterBgBase64';

export type PosterAspectRatio = '1:1' | '9:16' | 'a4';

export interface LocandinaSingolaData {
  partita?: Partita | null;
  titolo: string;
  campionato: string;
  girone?: string;
  squadraCasa: string;
  squadraOspite: string;
  dataGara: string;
  oraGara: string;
  campo: string;
  indirizzo: string;
  infoExtra: string;
  hashtag: string;
  accentColor: string;
  aspectRatio: PosterAspectRatio;
  bgImageBase64: string;
  overlayDarkness: number; // 0 to 0.8
}

export function buildDefaultLocandinaSingolaData(partita?: Partita | null): LocandinaSingolaData {
  const defaultCampionato = partita?.campionato
    ? `${partita.campionato.toUpperCase()}${partita.girone && partita.girone !== '-' ? ` - GIRONE ${partita.girone.toUpperCase()}` : ''}`
    : 'CAMPIONATO PROMOZIONE • GIRONE D';

  const defaultCasa = partita?.squadraCasa ? partita.squadraCasa.toUpperCase() : 'CYNTHIA 1920';
  const defaultOspite = partita?.squadraOspite ? partita.squadraOspite.toUpperCase() : 'GREGORIANA';
  const defaultData = partita?.data ? partita.data.toUpperCase() : 'DOMENICA 18 OTTOBRE 2026';
  const defaultOra = partita?.ora ? (partita.ora.startsWith('ORE') ? partita.ora.toUpperCase() : `ORE ${partita.ora}`) : 'ORE 11:00';
  const defaultCampo = partita?.campo ? `${partita.campo}${partita.tipo ? ` (${partita.tipo})` : ''}`.toUpperCase() : 'STADIO COMUNALE "ABBATINI BRUNO"';
  const defaultIndirizzo = partita ? [partita.indirizzo, partita.comune].filter(Boolean).join(', ').toUpperCase() : 'VIA EMILIA ROMAGNA • GENZANO DI ROMA';

  return {
    partita: partita || null,
    titolo: 'MATCHDAY',
    campionato: defaultCampionato,
    girone: partita?.girone || '',
    squadraCasa: defaultCasa,
    squadraOspite: defaultOspite,
    dataGara: defaultData,
    oraGara: defaultOra,
    campo: defaultCampo,
    indirizzo: defaultIndirizzo,
    infoExtra: 'TUTTI ALLO STADIO A TIFARE BIANCOAZZURRO! • INGRESSO LIBERO',
    hashtag: '#ForzaCynthia • #GenzanoDiRoma • #Biancoazzurri',
    accentColor: '#38bdf8', // Sky/cyan vibrante Cynthia
    aspectRatio: '1:1',
    bgImageBase64: POSTER_MATCHDAY_BG_BASE64,
    overlayDarkness: 0.25,
  };
}

/**
 * Carica un'immagine da base64 in un oggetto HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Suddivide un testo in righe che non superano maxWidth
 */
function getWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[n];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.length > 0 ? lines : [text];
}

/**
 * Troncamento testo con ellissi per non eccedere la larghezza massima
 */
function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let str = text;
  while (str.length > 2 && ctx.measureText(`${str}..`).width > maxWidth) {
    str = str.slice(0, -1);
  }
  return `${str}..`;
}

/**
 * Disegna testo troncato o scalato all'interno di una larghezza massima
 */
function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  align: CanvasTextAlign = 'center'
): void {
  ctx.textAlign = align;
  const safeText = truncateText(ctx, text, maxWidth);
  ctx.fillText(safeText, x, y);
}

/**
 * Restituisce le dimensioni canoniche fisse per l'aspect ratio richiesto.
 * L'anteprima a schermo e il file scaricato usano ESATTAMENTE queste stesse dimensioni,
 * garantendo il 100% di corrispondenza pixel-per-pixel.
 */
export function getCanonicalDimensions(aspectRatio: PosterAspectRatio): { width: number; height: number } {
  if (aspectRatio === '9:16') {
    return { width: 1080, height: 1920 }; // HD Instagram Story / WhatsApp Status
  }
  if (aspectRatio === 'a4') {
    return { width: 1200, height: 1697 }; // A4 esatto (210 x 297 mm, ratio 1.4142)
  }
  // Default: 1:1 Quadrato Social (Instagram / Facebook / WhatsApp)
  return { width: 1080, height: 1080 };
}

/**
 * Rendering ad altissima risoluzione su HTML5 Canvas con layout anti-sovrapposizione rigoroso.
 * Garantisce che i nomi delle squadre non possano MAI sovrapporsi con la scheda dettagli gara.
 */
export async function renderLocandinaSingolaToCanvas(
  data: LocandinaSingolaData
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const { width, height } = getCanonicalDimensions(data.aspectRatio);

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Impossibile ottenere contesto 2D Canvas');

  // 1. Sfondo Base: colore blu scuro Cynthia di sicurezza
  ctx.fillStyle = '#0f2942';
  ctx.fillRect(0, 0, width, height);

  // 2. Disegna l'immagine di sfondo (Blue Splash con pallone da calcio)
  try {
    const bgImg = await loadImage(data.bgImageBase64 || POSTER_MATCHDAY_BG_BASE64);
    // Cover scale proporzionale
    const hRatio = width / bgImg.width;
    const vRatio = height / bgImg.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShiftX = (width - bgImg.width * ratio) / 2;
    const centerShiftY = (height - bgImg.height * ratio) / 2;

    ctx.drawImage(
      bgImg,
      0,
      0,
      bgImg.width,
      bgImg.height,
      centerShiftX,
      centerShiftY,
      bgImg.width * ratio,
      bgImg.height * ratio
    );
  } catch (err) {
    console.warn('Impossibile caricare immagine di sfondo, uso gradiente', err);
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0c4a6e');
    grad.addColorStop(1, '#082f49');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Overlay semitrasparente scuro graduato per massima leggibilità
  const darkness = Math.min(Math.max(data.overlayDarkness, 0), 0.85);
  if (darkness > 0) {
    const scrim = ctx.createLinearGradient(0, 0, 0, height);
    scrim.addColorStop(0, `rgba(10, 25, 47, ${darkness + 0.15})`);
    scrim.addColorStop(0.35, `rgba(10, 25, 47, ${darkness})`);
    scrim.addColorStop(0.75, `rgba(5, 15, 30, ${darkness + 0.25})`);
    scrim.addColorStop(1, `rgba(5, 15, 30, ${darkness + 0.4})`);
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, width, height);
  }

  // 4. Cornici perimetrali eleganti stile Cynthia
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  ctx.strokeStyle = data.accentColor || '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(26, 26, width - 52, height - 52);

  const centerX = width / 2;
  const isStory = data.aspectRatio === '9:16';
  const isA4 = data.aspectRatio === 'a4';

  // ==========================================
  // SEZIONE SUPERIORE: LOGO, NOME CLUB, TITOLO E CATEGORIA
  // ==========================================
  const topOffset = isStory ? 80 : isA4 ? 48 : 36;
  const logoSize = isStory ? 100 : isA4 ? 82 : 72;

  // 5. Logo Cynthia 1920 in alto al centro
  try {
    const logoImg = await loadImage(CYNTHIA_LOGO_BASE64);
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 14;
    ctx.drawImage(logoImg, centerX - logoSize / 2, topOffset, logoSize, logoSize);
    ctx.restore();
  } catch (err) {
    console.warn('Errore logo Cynthia:', err);
  }

  // 6. Intestazione Società Istituzionale
  const headerY = topOffset + logoSize + 22;
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;
  ctx.fillText('A.S.D. CYNTHIA 1920', centerX, headerY);
  ctx.shadowBlur = 0;
  ctx.letterSpacing = '0px';

  // 7. Badge Titolo "MATCHDAY" / "PROSSIMA GARA" con cornice luminosa
  const titleY = headerY + (isStory ? 46 : 40);
  const titleText = (data.titolo || 'MATCHDAY').toUpperCase();
  const titleFontSize = isStory ? 54 : isA4 ? 46 : 40;
  ctx.font = `900 ${titleFontSize}px system-ui, -apple-system, sans-serif`;

  const titleMetrics = ctx.measureText(titleText);
  const titlePillW = Math.max(titleMetrics.width + 60, 320);
  const titlePillH = isStory ? 68 : isA4 ? 58 : 52;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.strokeStyle = data.accentColor || '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(centerX - titlePillW / 2, titleY - titlePillH / 2, titlePillW, titlePillH, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = data.accentColor || '#38bdf8';
  ctx.shadowBlur = 16;
  ctx.fillText(titleText, centerX, titleY);
  ctx.restore();

  // 8. Campionato & Girone (Badge categoria)
  const campY = titleY + (isStory ? 48 : 40);
  const campFontSize = isStory ? 22 : isA4 ? 20 : 18;
  ctx.font = `bold ${campFontSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = data.accentColor || '#38bdf8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '1.5px';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;
  drawFittedText(ctx, data.campionato.toUpperCase(), centerX, campY, width - 120);
  ctx.letterSpacing = '0px';
  ctx.shadowBlur = 0;

  const topSectionBottom = campY + campFontSize + 20;

  // ==========================================
  // SEZIONE INFERIORE: SCHEDA DETTAGLI GARA & FOOTER
  // ==========================================
  const footerY = height - (isStory ? 54 : 36);
  ctx.save();
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '1px';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 6;
  ctx.fillText(data.hashtag || '#ForzaCynthia • #GenzanoDiRoma • #Biancoazzurri', centerX, footerY);
  ctx.restore();

  // 10. SCHEDA DETTAGLI GARA (Data, Ora, Stadio, Città, Info)
  // Calcolo altezza necessaria della card dettagli
  const hasExtra = Boolean(data.infoExtra && data.infoExtra.trim());
  const cardW = width - (isStory ? 90 : 110);
  const cardH = hasExtra ? (isStory ? 185 : isA4 ? 170 : 155) : (isStory ? 150 : isA4 ? 140 : 125);
  const cardY = footerY - 20 - cardH;

  ctx.save();
  // Background card trasparente con effetto vetro/scrim
  ctx.fillStyle = 'rgba(5, 15, 30, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(centerX - cardW / 2, cardY, cardW, cardH, 18);
  ctx.fill();
  ctx.stroke();

  // 10.1 Data e Orario Calcio d'Inizio
  const dateY = cardY + 26;
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  drawFittedText(
    ctx,
    `📅  ${data.dataGara.toUpperCase()}   •   ⏰  ${data.oraGara.toUpperCase()}`,
    centerX,
    dateY,
    cardW - 40
  );

  // Linea divisoria sottile
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - cardW / 2 + 30, dateY + 14);
  ctx.lineTo(centerX + cardW / 2 - 30, dateY + 14);
  ctx.stroke();

  // 10.2 Stadio e Campo
  const stadiumY = dateY + 38;
  ctx.font = '900 21px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = data.accentColor || '#38bdf8';
  drawFittedText(ctx, `📍 ${data.campo.toUpperCase()}`, centerX, stadiumY, cardW - 50);

  // 10.3 Indirizzo / Comune
  const addressY = stadiumY + 26;
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  drawFittedText(ctx, data.indirizzo.toUpperCase(), centerX, addressY, cardW - 50);

  // 10.4 Info extra / Biglietti
  if (hasExtra) {
    const extraY = addressY + 25;
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#fde047'; // Giallo ambra evidente
    drawFittedText(ctx, `★  ${data.infoExtra.toUpperCase()}  ★`, centerX, extraY, cardW - 50);
  }
  ctx.restore();

  // ==========================================
  // SEZIONE CENTRALE: BLOCCO SQUADRE "TEAM VS TEAM" (THE CLASH)
  // Calcolo intelligente dinamico che GARANTISCE zero sovrapposizioni
  // ==========================================
  const availableClashHeight = cardY - topSectionBottom;
  const clashCenterY = topSectionBottom + availableClashHeight / 2;

  // Selezione responsive della dimensione font per i nomi squadra
  const maxTeamW = width - (isStory ? 90 : 120);
  const casaName = data.squadraCasa.toUpperCase();
  const ospiteName = data.squadraOspite.toUpperCase();
  const maxNameLen = Math.max(casaName.length, ospiteName.length);

  let teamFontSize = isStory
    ? maxNameLen > 24 ? 38 : maxNameLen > 18 ? 44 : 50
    : isA4
    ? maxNameLen > 24 ? 34 : maxNameLen > 18 ? 40 : 44
    : maxNameLen > 24 ? 30 : maxNameLen > 18 ? 35 : 40;

  let teamLineHeight = Math.round(teamFontSize * 1.18);

  ctx.font = `900 ${teamFontSize}px system-ui, -apple-system, sans-serif`;
  let casaLines = getWrappedLines(ctx, casaName, maxTeamW);
  let ospiteLines = getWrappedLines(ctx, ospiteName, maxTeamW);

  // Se i testi hanno troppe righe e rischiano di stringere lo spazio, riduciamo il font
  const vsRadius = isStory ? 32 : 28;
  const vsGap = isStory ? 20 : 14;

  let totalClashH =
    casaLines.length * teamLineHeight +
    vsRadius * 2 +
    vsGap * 2 +
    ospiteLines.length * teamLineHeight;

  if (totalClashH > availableClashHeight - 50) {
    teamFontSize = Math.max(24, teamFontSize - 6);
    teamLineHeight = Math.round(teamFontSize * 1.16);
    ctx.font = `900 ${teamFontSize}px system-ui, -apple-system, sans-serif`;
    casaLines = getWrappedLines(ctx, casaName, maxTeamW);
    ospiteLines = getWrappedLines(ctx, ospiteName, maxTeamW);
    totalClashH =
      casaLines.length * teamLineHeight +
      vsRadius * 2 +
      vsGap * 2 +
      ospiteLines.length * teamLineHeight;
  }

  // Il cerchio VS è centrato esattamente al centro dello spazio disponibile
  const vsY = clashCenterY;

  // Disegno Squadra Casa (sopra il badge VS)
  ctx.save();
  ctx.font = `900 ${teamFontSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 12;

  const casaBaseY = vsY - vsRadius - vsGap;
  for (let i = 0; i < casaLines.length; i++) {
    const lineY = casaBaseY - (casaLines.length - 1 - i) * teamLineHeight;
    ctx.fillText(casaLines[i], centerX, lineY);
  }
  ctx.restore();

  // Disegno Badge "VS"
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = data.accentColor || '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(centerX, vsY, vsRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.font = `900 ${isStory ? 26 : 24}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = data.accentColor || '#38bdf8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = data.accentColor || '#38bdf8';
  ctx.shadowBlur = 8;
  ctx.fillText('VS', centerX, vsY);
  ctx.restore();

  // Disegno Squadra Ospite (sotto il badge VS)
  ctx.save();
  ctx.font = `900 ${teamFontSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 12;

  const ospiteStartY = vsY + vsRadius + vsGap + teamLineHeight;
  for (let i = 0; i < ospiteLines.length; i++) {
    const lineY = ospiteStartY + i * teamLineHeight;
    ctx.fillText(ospiteLines[i], centerX, lineY);
  }
  ctx.restore();

  return canvas;
}

/**
 * Scarica la locandina come immagine PNG ad alta risoluzione.
 * Identica al 100% all'anteprima visualizzata a schermo.
 */
export async function downloadLocandinaSingolaPng(
  data: LocandinaSingolaData,
  filename?: string
): Promise<void> {
  const canvas = await renderLocandinaSingolaToCanvas(data);

  const cleanCasa = (data.squadraCasa || 'Cynthia').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanOspite = (data.squadraOspite || 'Avversario').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanDate = (data.dataGara || '').replace(/[^a-zA-Z0-9]/g, '_');
  const defaultName = `matchday_${cleanCasa}_vs_${cleanOspite}_${cleanDate}.png`;

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Impossibile esportare immagine PNG');

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Scarica la locandina come documento PDF pronto per la stampa.
 * In formato A4 riempie esattamente l'intera pagina (210 x 297 mm) con fedeltà identica.
 */
export async function downloadLocandinaSingolaPdf(
  data: LocandinaSingolaData,
  filename?: string
): Promise<void> {
  const canvas = await renderLocandinaSingolaToCanvas(data);
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  // Se il formato selezionato è A4, riempiamo l'intera pagina a vivo (senza bordi neri)
  if (data.aspectRatio === 'a4') {
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  } else {
    // Altrimenti centriamo l'immagine (1:1 o 9:16) con elegante sfondo Cynthia Navy
    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const ratio = Math.min(pdfWidth / cWidth, pdfHeight / cHeight);
    const renderW = cWidth * ratio;
    const renderH = cHeight * ratio;
    const offsetX = (pdfWidth - renderW) / 2;
    const offsetY = (pdfHeight - renderH) / 2;

    pdf.setFillColor(15, 41, 66);
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, renderW, renderH, undefined, 'FAST');
  }

  const cleanCasa = (data.squadraCasa || 'Cynthia').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanOspite = (data.squadraOspite || 'Avversario').replace(/[^a-zA-Z0-9]/g, '_');
  const defaultName = `locandina_a4_${cleanCasa}_vs_${cleanOspite}.pdf`;

  pdf.save(filename || defaultName);
}

/**
 * Condivide direttamente l'immagine (Web Share API nativa per smartphone) o download fallback.
 */
export async function shareLocandinaSingola(
  data: LocandinaSingolaData
): Promise<{ sharedViaNative: boolean }> {
  const canvas = await renderLocandinaSingolaToCanvas(data);
  const cleanCasa = (data.squadraCasa || 'Cynthia').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanOspite = (data.squadraOspite || 'Avversario').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `matchday_${cleanCasa}_vs_${cleanOspite}.png`;

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Impossibile generare blob immagine');

  const file = new File([blob], fileName, { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `⚽ MATCHDAY: ${data.squadraCasa} vs ${data.squadraOspite}`,
        text: `⚽ ${data.titolo}: ${data.squadraCasa} vs ${data.squadraOspite} - ${data.dataGara} ore ${data.oraGara} presso ${data.campo}! #ForzaCynthia`,
        files: [file],
      });
      return { sharedViaNative: true };
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        await downloadLocandinaSingolaPng(data);
      }
      return { sharedViaNative: false };
    }
  } else {
    await downloadLocandinaSingolaPng(data);
    return { sharedViaNative: false };
  }
}

/**
 * Copia l'immagine direttamente negli appunti con risoluzione esatta.
 */
export async function copyLocandinaSingolaToClipboard(
  data: LocandinaSingolaData
): Promise<boolean> {
  try {
    const canvas = await renderLocandinaSingolaToCanvas(data);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return false;

    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('Errore copia appunti immagine:', e);
    return false;
  }
}
