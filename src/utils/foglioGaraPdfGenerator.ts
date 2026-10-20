import jsPDF from 'jspdf';
import { Partita } from '../types';
import { CYNTHIA_LOGO_BASE64 } from '../assets/logoBase64';

export interface GiocatoreFoglioGara {
  nr: number;
  nome: string;
  ruolo?: string;
  esce?: string;
  entra?: string;
  esp?: string;
  amm?: string;
}

export interface GolItem {
  minuto: string;
  numero: string;
}

export interface FoglioGaraData {
  partitaId?: string;
  campionato: string;
  girone?: string;
  gara?: string;
  data: string; // es. 04/10/2026
  ora1T: string; // es. 15:00
  ora2T?: string;
  campo: string; // es. ABBATINI BRUNO
  comune?: string;
  squadraCasa: string;
  squadraOspite: string;
  isCynthiaCasa: boolean;
  misterCasa: string;
  misterOspite: string;
  giocatoriCasa: GiocatoreFoglioGara[];
  giocatoriOspite: GiocatoreFoglioGara[];
  calcioInizio1T?: 'casa' | 'ospiti' | '';
  calcioInizio2T?: 'casa' | 'ospiti' | '';
  recupero1T?: string;
  recupero2T?: string;
  retiCasa?: string;
  retiOspite?: string;
  golCasa1T: GolItem[]; // 3 righe per 1° Tempo
  golCasa2T: GolItem[]; // 3 righe per 2° Tempo
  golOspiti1T: GolItem[]; // 3 righe per 1° Tempo
  golOspiti2T: GolItem[]; // 3 righe per 2° Tempo
  note?: string;
}

/**
 * Crea i dati predefiniti partendo da una Partita
 */
export function buildDefaultFoglioGaraData(
  partita: Partita,
  convocatiNomi: string[] = [],
  misterName: string = ''
): FoglioGaraData {
  const giocatoriCasa: GiocatoreFoglioGara[] = [];
  const giocatoriOspite: GiocatoreFoglioGara[] = [];

  const isCasa = partita.isCynthiaCasa;

  for (let i = 1; i <= 20; i++) {
    const nomePrecompilato = isCasa ? convocatiNomi[i - 1] || '' : '';
    giocatoriCasa.push({
      nr: i,
      nome: nomePrecompilato,
      esce: '',
      entra: '',
      esp: '',
      amm: '',
    });

    const nomeOspite = !isCasa ? convocatiNomi[i - 1] || '' : '';
    giocatoriOspite.push({
      nr: i,
      nome: nomeOspite,
      esce: '',
      entra: '',
      esp: '',
      amm: '',
    });
  }

  const emptyGolList = (): GolItem[] => [
    { minuto: '', numero: '' },
    { minuto: '', numero: '' },
    { minuto: '', numero: '' },
  ];

  return {
    partitaId: partita.id,
    campionato: partita.campionato,
    girone: partita.girone,
    gara: partita.gara,
    data: partita.data,
    ora1T: partita.ora,
    ora2T: '',
    campo: partita.campo,
    comune: partita.comune,
    squadraCasa: partita.squadraCasa,
    squadraOspite: partita.squadraOspite,
    isCynthiaCasa: partita.isCynthiaCasa,
    misterCasa: isCasa ? misterName : '',
    misterOspite: !isCasa ? misterName : '',
    giocatoriCasa,
    giocatoriOspite,
    calcioInizio1T: '',
    calcioInizio2T: '',
    recupero1T: '',
    recupero2T: '',
    retiCasa: '',
    retiOspite: '',
    golCasa1T: emptyGolList(),
    golCasa2T: emptyGolList(),
    golOspiti1T: emptyGolList(),
    golOspiti2T: emptyGolList(),
    note: '',
  };
}

/**
 * Genera l'istanza jsPDF ufficiale in formato A4 Portrait fedele al modello del foglio gara
 */
export function generateFoglioGaraPdf(data: FoglioGaraData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const startX = 8;
  const printableWidth = 194; // da x=8 a x=202

  // ==========================================
  // 1. INTESTAZIONE CON LOGHI E TITOLO
  // ==========================================

  // Logo Cynthia 1920 (Sinistra)
  try {
    if (CYNTHIA_LOGO_BASE64) {
      doc.addImage(CYNTHIA_LOGO_BASE64, 'PNG', startX + 1, 6, 17, 18, undefined, 'FAST');
    }
  } catch (err) {
    console.warn('Errore rendering logo Cynthia:', err);
  }

  // Logo LND Lazio Vettoriale (Destra)
  const lndX = startX + printableWidth - 18;
  const lndY = 6;
  const lndR = 8.5;
  // Sfondo blu
  doc.setFillColor(0, 43, 102);
  doc.circle(lndX + lndR, lndY + lndR, lndR, 'F');
  // Bordo oro
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(0.6);
  doc.circle(lndX + lndR, lndY + lndR, lndR - 0.4, 'S');
  // Cerchio interno bianco
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.circle(lndX + lndR, lndY + lndR, lndR - 1.2, 'S');
  // Testo LND
  doc.setTextColor(251, 191, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('LND', lndX + lndR, lndY + 7.2, { align: 'center' });
  // Bandiera Tricolore
  const triW = 2.8;
  const triH = 1.3;
  const triY = lndY + 8.5;
  const triStartX = lndX + lndR - 4.2;
  doc.setFillColor(0, 146, 70); // Verde
  doc.rect(triStartX, triY, triW, triH, 'F');
  doc.setFillColor(255, 255, 255); // Bianco
  doc.rect(triStartX + triW, triY, triW, triH, 'F');
  doc.setFillColor(206, 43, 55); // Rosso
  doc.rect(triStartX + triW * 2, triY, triW, triH, 'F');
  // Testo LAZIO
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.8);
  doc.text('LAZIO', lndX + lndR, lndY + 13.5, { align: 'center' });

  // Titoli Centrali
  doc.setTextColor(2, 132, 199); // Blu Cynthia
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('CYNTHIA 1920', pageWidth / 2, 14.5, { align: 'center' });

  doc.setTextColor(3, 105, 161);
  doc.setFontSize(8.5);
  doc.text('F.I.G.C. - L.N.D. - COMITATO REGIONALE LAZIO', pageWidth / 2, 19.5, { align: 'center' });

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('STAGIONE SPORTIVA 2026/2027', pageWidth / 2, 23.8, { align: 'center' });

  // ==========================================
  // 2. RIGA DATI GARA (DATA, ORE, CAMPO)
  // ==========================================
  let currentY = 26;
  const metaHeight = 7.5;
  doc.setDrawColor(15, 23, 42); // Nero / slate-900
  doc.setLineWidth(0.35);

  // Colonne: DATA (14), val (26), ORA INIZIO 1° TEMPO (26), val (18), ORA INIZIO 2° TEMPO (26), val (18), CAMPO (16), val (50) = 194 mm
  const wDataLabel = 14;
  const wDataVal = 26;
  const wOra1Label = 26;
  const wOra1Val = 18;
  const wOra2Label = 26;
  const wOra2Val = 18;
  const wCampoLabel = 16;
  const wCampoVal = 50;

  let cellX = startX;

  // DATA Label
  doc.setFillColor(241, 245, 249);
  doc.rect(cellX, currentY, wDataLabel, metaHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DATA', cellX + wDataLabel / 2, currentY + 5, { align: 'center' });
  cellX += wDataLabel;

  // DATA Value
  doc.setFillColor(255, 255, 255);
  doc.rect(cellX, currentY, wDataVal, metaHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(data.data || '', cellX + wDataVal / 2, currentY + 5.2, { align: 'center' });
  cellX += wDataVal;

  // ORA INIZIO 1° TEMPO Label
  doc.setFillColor(241, 245, 249);
  doc.rect(cellX, currentY, wOra1Label, metaHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('ORA INIZIO 1° TEMPO', cellX + wOra1Label / 2, currentY + 5, { align: 'center' });
  cellX += wOra1Label;

  // ORA INIZIO 1° TEMPO Value
  doc.setFillColor(255, 255, 255);
  doc.rect(cellX, currentY, wOra1Val, metaHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(data.ora1T || '', cellX + wOra1Val / 2, currentY + 5.2, { align: 'center' });
  cellX += wOra1Val;

  // ORA INIZIO 2° TEMPO Label
  doc.setFillColor(241, 245, 249);
  doc.rect(cellX, currentY, wOra2Label, metaHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('ORA INIZIO 2° TEMPO', cellX + wOra2Label / 2, currentY + 5, { align: 'center' });
  cellX += wOra2Label;

  // ORA INIZIO 2° TEMPO Value
  doc.setFillColor(255, 255, 255);
  doc.rect(cellX, currentY, wOra2Val, metaHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(data.ora2T || '', cellX + wOra2Val / 2, currentY + 5.2, { align: 'center' });
  cellX += wOra2Val;

  // CAMPO Label
  doc.setFillColor(241, 245, 249);
  doc.rect(cellX, currentY, wCampoLabel, metaHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('CAMPO', cellX + wCampoLabel / 2, currentY + 5, { align: 'center' });
  cellX += wCampoLabel;

  // CAMPO Value
  doc.setFillColor(255, 255, 255);
  doc.rect(cellX, currentY, wCampoVal, metaHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const campoFull = `${data.campo || ''}${data.comune ? ` (${data.comune})` : ''}`;
  doc.text(campoFull.toUpperCase(), cellX + wCampoVal / 2, currentY + 5, { align: 'center', maxWidth: wCampoVal - 2 });

  currentY += metaHeight;

  // ==========================================
  // 3. RIGA RETI, CALCIO D'INIZIO, RECUPERO & BADGE 'VS'
  // ==========================================
  const scoreRowHeight = 13.5;
  const leftBlockW = 89;
  const vsW = 16;
  const rightBlockW = 89;

  // Blocco Sinistra (Casa)
  doc.rect(startX, currentY, leftBlockW, scoreRowHeight, 'S');

  // Reti Casa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('RETI', startX + 66, currentY + 4.5);
  doc.rect(startX + 74, currentY + 1.2, 13, 5, 'S');
  if (data.retiCasa) {
    doc.setFontSize(9);
    doc.text(data.retiCasa, startX + 80.5, currentY + 4.8, { align: 'center' });
  }

  // Calcio Inizio 1° Tempo & Opzioni Casa / Ospiti
  doc.setFontSize(6.8);
  doc.text('CALCIO INIZIO 1° TEMPO', startX + 2, currentY + 8);
  // Box CASA
  doc.rect(startX + 41, currentY + 5.6, 3.5, 3.5, 'S');
  doc.text('CASA', startX + 46, currentY + 8.2);
  if (data.calcioInizio1T === 'casa') {
    doc.text('X', startX + 42.7, currentY + 8.2, { align: 'center' });
  }
  // Box OSPITI
  doc.rect(startX + 60, currentY + 5.6, 3.5, 3.5, 'S');
  doc.text('OSPITI', startX + 65, currentY + 8.2);
  if (data.calcioInizio1T === 'ospiti') {
    doc.text('X', startX + 61.7, currentY + 8.2, { align: 'center' });
  }

  // Recupero 1° Tempo
  doc.text('RECUPERO 1° TEMPO', startX + 2, currentY + 11.8);
  doc.rect(startX + 41, currentY + 9.8, 22, 3, 'S');
  if (data.recupero1T) {
    doc.setFontSize(7);
    doc.text(`${data.recupero1T} min`, startX + 52, currentY + 12.1, { align: 'center' });
  }

  // Badge Centrale 'VS' Nero
  const vsX = startX + leftBlockW;
  doc.setFillColor(15, 23, 42); // Nero
  doc.rect(vsX, currentY, vsW, scoreRowHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('VS', vsX + vsW / 2, currentY + 8.8, { align: 'center' });

  // Blocco Destra (Ospiti)
  const rightX = vsX + vsW;
  doc.setTextColor(15, 23, 42);
  doc.rect(rightX, currentY, rightBlockW, scoreRowHeight, 'S');

  // Reti Ospiti
  doc.rect(rightX + 2, currentY + 1.2, 13, 5, 'S');
  if (data.retiOspite) {
    doc.setFontSize(9);
    doc.text(data.retiOspite, rightX + 8.5, currentY + 4.8, { align: 'center' });
  }
  doc.setFontSize(7.5);
  doc.text('RETI', rightX + 17, currentY + 4.5);

  // Calcio Inizio 2° Tempo & Opzioni Casa / Ospiti
  doc.setFontSize(6.8);
  doc.text('CALCIO INIZIO 2° TEMPO', rightX + 2, currentY + 8);
  // Box CASA
  doc.rect(rightX + 41, currentY + 5.6, 3.5, 3.5, 'S');
  doc.text('CASA', rightX + 46, currentY + 8.2);
  if (data.calcioInizio2T === 'casa') {
    doc.text('X', rightX + 42.7, currentY + 8.2, { align: 'center' });
  }
  // Box OSPITI
  doc.rect(rightX + 60, currentY + 5.6, 3.5, 3.5, 'S');
  doc.text('OSPITI', rightX + 65, currentY + 8.2);
  if (data.calcioInizio2T === 'ospiti') {
    doc.text('X', rightX + 61.7, currentY + 8.2, { align: 'center' });
  }

  // Recupero 2° Tempo
  doc.text('RECUPERO 2° TEMPO', rightX + 2, currentY + 11.8);
  doc.rect(rightX + 41, currentY + 9.8, 22, 3, 'S');
  if (data.recupero2T) {
    doc.setFontSize(7);
    doc.text(`${data.recupero2T} min`, rightX + 52, currentY + 12.1, { align: 'center' });
  }

  currentY += scoreRowHeight;

  // ==========================================
  // 4. TABELLA FORMAZIONI (1-20 + MISTER)
  // ==========================================
  // Colonne:
  // ESCE (11), ENTRA (11), ESP (11), AMM (11), FORMAZIONE CASA (45)
  // NR (16)
  // FORMAZIONE OSPITI (45), AMM (11), ESP (11), ENTRA (11), ESCE (11) = 194 mm
  const colWEvent = 11;
  const colWTeam = 45;
  const colWNr = 16;
  const headerH = 6;
  const rowH = 6.6;

  // Intestazioni Colorate Tabella
  let colX = startX;

  // 1. ESCE (Blu)
  doc.setFillColor(2, 132, 199);
  doc.rect(colX, currentY, colWEvent, headerH, 'FD');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('ESCE', colX + colWEvent / 2, currentY + 4.2, { align: 'center' });
  colX += colWEvent;

  // 2. ENTRA (Verde)
  doc.setFillColor(22, 163, 74);
  doc.rect(colX, currentY, colWEvent, headerH, 'FD');
  doc.text('ENTRA', colX + colWEvent / 2, currentY + 4.2, { align: 'center' });
  colX += colWEvent;

  // 3. ESP (Rosso)
  doc.setFillColor(220, 38, 38);
  doc.rect(colX, currentY, colWEvent, headerH, 'FD');
  doc.text('ESP.', colX + colWEvent / 2, currentY + 4.2, { align: 'center' });
  colX += colWEvent;

  // 4. AMM (Giallo)
  doc.setFillColor(234, 179, 8);
  doc.rect(colX, currentY, colWEvent, headerH, 'FD');
  doc.setTextColor(15, 23, 42);
  doc.text('AMM.', colX + colWEvent / 2, currentY + 4.2, { align: 'center' });
  colX += colWEvent;

  // 5. FORMAZIONE CASA (Bianco)
  doc.setFillColor(255, 255, 255);
  doc.rect(colX, currentY, colWTeam, headerH, 'FD');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7);
  const titleCasa = data.squadraCasa ? `FORMAZIONE CASA: ${data.squadraCasa.toUpperCase()}` : 'FORMAZIONE CASA';
  doc.text(titleCasa, colX + colWTeam / 2, currentY + 4.2, { align: 'center', maxWidth: colWTeam - 2 });
  colX += colWTeam;

  // 6. NR (Centro Grigio Chiaro)
  doc.setFillColor(226, 232, 240);
  doc.rect(colX, currentY, colWNr, headerH, 'FD');
  doc.setFontSize(8);
  doc.text('N°', colX + colWNr / 2, currentY + 4.2, { align: 'center' });
  colX += colWNr;

  // 7. FORMAZIONE OSPITI (Bianco)
  doc.setFillColor(255, 255, 255);
  doc.rect(colX, currentY, colWTeam, headerH, 'FD');
  doc.setFontSize(7);
  const titleOspiti = data.squadraOspite ? `FORMAZIONE OSPITI: ${data.squadraOspite.toUpperCase()}` : 'FORMAZIONE OSPITI';
  doc.text(titleOspiti, colX + colWTeam / 2, currentY + 4.2, { align: 'center', maxWidth: colWTeam - 2 });
  colX += colWTeam;

  // 8. AMM (Giallo)
  doc.setFillColor(234, 179, 8);
  doc.rect(colX, currentY, colWEvent, headerH, 'FD');
  doc.setFontSize(6.5);
  doc.text('AMM.', colX + colWEvent / 2, currentY + 4.2, { align: 'center' });
  colX += colWEvent;

  // 9. ESP (Rosso)
  doc.setFillColor(220, 38, 38);
  doc.rect(colX, currentY, colWEvent, headerH, 'FD');
  doc.setTextColor(255, 255, 255);
  doc.text('ESP.', colX + colWEvent / 2, currentY + 4.2, { align: 'center' });
  colX += colWEvent;

  // 10. ENTRA (Verde)
  doc.setFillColor(22, 163, 74);
  doc.rect(colX, currentY, colWEvent, headerH, 'FD');
  doc.text('ENTRA', colX + colWEvent / 2, currentY + 4.2, { align: 'center' });
  colX += colWEvent;

  // 11. ESCE (Blu)
  doc.setFillColor(2, 132, 199);
  doc.rect(colX, currentY, colWEvent, headerH, 'FD');
  doc.text('ESCE', colX + colWEvent / 2, currentY + 4.2, { align: 'center' });

  currentY += headerH;

  // Righe Giocatori da 1 a 20
  for (let i = 1; i <= 20; i++) {
    const rY = currentY + (i - 1) * rowH;
    let rX = startX;

    const gCasa = data.giocatoriCasa[i - 1] || { nr: i, nome: '' };
    const gOspite = data.giocatoriOspite[i - 1] || { nr: i, nome: '' };

    doc.setLineWidth(0.25);
    doc.setDrawColor(30, 41, 59);

    // 1. ESCE Casa
    doc.rect(rX, rY, colWEvent, rowH, 'S');
    if (gCasa.esce) {
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(gCasa.esce, rX + colWEvent / 2, rY + 4.5, { align: 'center' });
    }
    rX += colWEvent;

    // 2. ENTRA Casa
    doc.rect(rX, rY, colWEvent, rowH, 'S');
    if (gCasa.entra) {
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(gCasa.entra, rX + colWEvent / 2, rY + 4.5, { align: 'center' });
    }
    rX += colWEvent;

    // 3. ESP Casa
    doc.rect(rX, rY, colWEvent, rowH, 'S');
    if (gCasa.esp) {
      doc.setFontSize(7);
      doc.setTextColor(220, 38, 38);
      doc.text(gCasa.esp, rX + colWEvent / 2, rY + 4.5, { align: 'center' });
    }
    rX += colWEvent;

    // 4. AMM Casa
    doc.rect(rX, rY, colWEvent, rowH, 'S');
    if (gCasa.amm) {
      doc.setFontSize(7);
      doc.setTextColor(180, 83, 9);
      doc.text(gCasa.amm, rX + colWEvent / 2, rY + 4.5, { align: 'center' });
    }
    rX += colWEvent;

    // 5. NOME GIOCATORE CASA
    doc.rect(rX, rY, colWTeam, rowH, 'S');
    if (gCasa.nome) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(gCasa.nome.toUpperCase(), rX + 2, rY + 4.5, { maxWidth: colWTeam - 3 });
    }
    rX += colWTeam;

    // 6. NUMERO DI MAGLIA (N°)
    doc.setFillColor(241, 245, 249);
    doc.rect(rX, rY, colWNr, rowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(i), rX + colWNr / 2, rY + 4.6, { align: 'center' });
    rX += colWNr;

    // 7. NOME GIOCATORE OSPITI
    doc.rect(rX, rY, colWTeam, rowH, 'S');
    if (gOspite.nome) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(gOspite.nome.toUpperCase(), rX + 2, rY + 4.5, { maxWidth: colWTeam - 3 });
    }
    rX += colWTeam;

    // 8. AMM Ospiti
    doc.rect(rX, rY, colWEvent, rowH, 'S');
    if (gOspite.amm) {
      doc.setFontSize(7);
      doc.setTextColor(180, 83, 9);
      doc.text(gOspite.amm, rX + colWEvent / 2, rY + 4.5, { align: 'center' });
    }
    rX += colWEvent;

    // 9. ESP Ospiti
    doc.rect(rX, rY, colWEvent, rowH, 'S');
    if (gOspite.esp) {
      doc.setFontSize(7);
      doc.setTextColor(220, 38, 38);
      doc.text(gOspite.esp, rX + colWEvent / 2, rY + 4.5, { align: 'center' });
    }
    rX += colWEvent;

    // 10. ENTRA Ospiti
    doc.rect(rX, rY, colWEvent, rowH, 'S');
    if (gOspite.entra) {
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(gOspite.entra, rX + colWEvent / 2, rY + 4.5, { align: 'center' });
    }
    rX += colWEvent;

    // 11. ESCE Ospiti
    doc.rect(rX, rY, colWEvent, rowH, 'S');
    if (gOspite.esce) {
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(gOspite.esce, rX + colWEvent / 2, rY + 4.5, { align: 'center' });
    }

    // Linea di demarcazione forte tra Titolari (1-11) e Riserve (12-20)
    if (i === 11) {
      doc.setDrawColor(2, 132, 199);
      doc.setLineWidth(0.7);
      doc.line(startX, rY + rowH, startX + printableWidth, rY + rowH);
    }
  }

  currentY += 20 * rowH;

  // Riga MISTER
  const misterH = 6.6;
  let mX = startX;

  // Spazio sinistra vuoto (4 colonne eventi = 44 mm)
  doc.setFillColor(241, 245, 249);
  doc.rect(mX, currentY, colWEvent * 4, misterH, 'FD');
  mX += colWEvent * 4;

  // Nome Mister Casa (45 mm)
  doc.setFillColor(255, 255, 255);
  doc.rect(mX, currentY, colWTeam, misterH, 'FD');
  if (data.misterCasa) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(data.misterCasa.toUpperCase(), mX + 2, currentY + 4.5, { maxWidth: colWTeam - 3 });
  }
  mX += colWTeam;

  // Casella MISTER al centro
  doc.setFillColor(226, 232, 240);
  doc.rect(mX, currentY, colWNr, misterH, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('MISTER', mX + colWNr / 2, currentY + 4.5, { align: 'center' });
  mX += colWNr;

  // Nome Mister Ospiti (45 mm)
  doc.setFillColor(255, 255, 255);
  doc.rect(mX, currentY, colWTeam, misterH, 'FD');
  if (data.misterOspite) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(data.misterOspite.toUpperCase(), mX + 2, currentY + 4.5, { maxWidth: colWTeam - 3 });
  }
  mX += colWTeam;

  // Spazio destra vuoto (4 colonne eventi = 44 mm)
  doc.setFillColor(241, 245, 249);
  doc.rect(mX, currentY, colWEvent * 4, misterH, 'FD');

  currentY += misterH + 1.5;

  // ==========================================
  // 5. SEZIONE MARCATORI G O L
  // ==========================================
  const golSideW = 91.5; // (194 - 11) / 2 = 91.5
  const golCenterW = 11; // Banner G-O-L
  const golSubColW = golSideW / 2; // 45.75 mm per 1° Tempo e 2° Tempo
  const golRowH = 4.8;
  const golTotalH = 4 + 3.5 + 3 * golRowH; // 21.9 mm

  // --- LATO SINISTRO (GOL CASA) ---
  const gCasaX = startX;

  // Intestazione 1° TEMPO & 2° TEMPO
  doc.setFillColor(241, 245, 249);
  doc.rect(gCasaX, currentY, golSubColW, 4, 'FD');
  doc.rect(gCasaX + golSubColW, currentY, golSubColW, 4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('1° TEMPO', gCasaX + golSubColW / 2, currentY + 2.9, { align: 'center' });
  doc.text('2° TEMPO', gCasaX + golSubColW + golSubColW / 2, currentY + 2.9, { align: 'center' });

  // Sotto-intestazioni MINUTO e NUMERO per 1°T e 2°T
  const wMin = 26;
  const wNum = 19.75;

  // 1°T Header
  doc.rect(gCasaX, currentY + 4, wMin, 3.5, 'S');
  doc.rect(gCasaX + wMin, currentY + 4, wNum, 3.5, 'S');
  // 2°T Header
  doc.rect(gCasaX + golSubColW, currentY + 4, wMin, 3.5, 'S');
  doc.rect(gCasaX + golSubColW + wMin, currentY + 4, wNum, 3.5, 'S');

  doc.setFontSize(5.5);
  doc.text('MINUTO', gCasaX + wMin / 2, currentY + 6.5, { align: 'center' });
  doc.text('NUMERO', gCasaX + wMin + wNum / 2, currentY + 6.5, { align: 'center' });
  doc.text('MINUTO', gCasaX + golSubColW + wMin / 2, currentY + 6.5, { align: 'center' });
  doc.text('NUMERO', gCasaX + golSubColW + wMin + wNum / 2, currentY + 6.5, { align: 'center' });

  // 3 Righe Marcatori Casa
  for (let r = 0; r < 3; r++) {
    const grY = currentY + 7.5 + r * golRowH;
    // 1°T
    doc.rect(gCasaX, grY, wMin, golRowH, 'S');
    doc.rect(gCasaX + wMin, grY, wNum, golRowH, 'S');
    const item1 = data.golCasa1T[r];
    if (item1) {
      doc.setFontSize(7);
      if (item1.minuto) doc.text(item1.minuto, gCasaX + wMin / 2, grY + 3.4, { align: 'center' });
      if (item1.numero) doc.text(item1.numero, gCasaX + wMin + wNum / 2, grY + 3.4, { align: 'center' });
    }

    // 2°T
    doc.rect(gCasaX + golSubColW, grY, wMin, golRowH, 'S');
    doc.rect(gCasaX + golSubColW + wMin, grY, wNum, golRowH, 'S');
    const item2 = data.golCasa2T[r];
    if (item2) {
      doc.setFontSize(7);
      if (item2.minuto) doc.text(item2.minuto, gCasaX + golSubColW + wMin / 2, grY + 3.4, { align: 'center' });
      if (item2.numero) doc.text(item2.numero, gCasaX + golSubColW + wMin + wNum / 2, grY + 3.4, { align: 'center' });
    }
  }

  // --- BANNER CENTRALE NERO 'G O L' ---
  const golMidX = gCasaX + golSideW;
  doc.setFillColor(15, 23, 42);
  doc.rect(golMidX, currentY, golCenterW, golTotalH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('G', golMidX + golCenterW / 2, currentY + 6.2, { align: 'center' });
  doc.text('O', golMidX + golCenterW / 2, currentY + 12.6, { align: 'center' });
  doc.text('L', golMidX + golCenterW / 2, currentY + 19, { align: 'center' });

  // --- LATO DESTRO (GOL OSPITI) ---
  const gOspX = golMidX + golCenterW;

  // Intestazione 1° TEMPO & 2° TEMPO
  doc.setFillColor(241, 245, 249);
  doc.rect(gOspX, currentY, golSubColW, 4, 'FD');
  doc.rect(gOspX + golSubColW, currentY, golSubColW, 4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('1° TEMPO', gOspX + golSubColW / 2, currentY + 2.9, { align: 'center' });
  doc.text('2° TEMPO', gOspX + golSubColW + golSubColW / 2, currentY + 2.9, { align: 'center' });

  // Sotto-intestazioni MINUTO e NUMERO per 1°T e 2°T
  doc.rect(gOspX, currentY + 4, wMin, 3.5, 'S');
  doc.rect(gOspX + wMin, currentY + 4, wNum, 3.5, 'S');
  doc.rect(gOspX + golSubColW, currentY + 4, wMin, 3.5, 'S');
  doc.rect(gOspX + golSubColW + wMin, currentY + 4, wNum, 3.5, 'S');

  doc.setFontSize(5.5);
  doc.text('MINUTO', gOspX + wMin / 2, currentY + 6.5, { align: 'center' });
  doc.text('NUMERO', gOspX + wMin + wNum / 2, currentY + 6.5, { align: 'center' });
  doc.text('MINUTO', gOspX + golSubColW + wMin / 2, currentY + 6.5, { align: 'center' });
  doc.text('NUMERO', gOspX + golSubColW + wMin + wNum / 2, currentY + 6.5, { align: 'center' });

  // 3 Righe Marcatori Ospiti
  for (let r = 0; r < 3; r++) {
    const grY = currentY + 7.5 + r * golRowH;
    // 1°T
    doc.rect(gOspX, grY, wMin, golRowH, 'S');
    doc.rect(gOspX + wMin, grY, wNum, golRowH, 'S');
    const item1 = data.golOspiti1T[r];
    if (item1) {
      doc.setFontSize(7);
      if (item1.minuto) doc.text(item1.minuto, gOspX + wMin / 2, grY + 3.4, { align: 'center' });
      if (item1.numero) doc.text(item1.numero, gOspX + wMin + wNum / 2, grY + 3.4, { align: 'center' });
    }

    // 2°T
    doc.rect(gOspX + golSubColW, grY, wMin, golRowH, 'S');
    doc.rect(gOspX + golSubColW + wMin, grY, wNum, golRowH, 'S');
    const item2 = data.golOspiti2T[r];
    if (item2) {
      doc.setFontSize(7);
      if (item2.minuto) doc.text(item2.minuto, gOspX + golSubColW + wMin / 2, grY + 3.4, { align: 'center' });
      if (item2.numero) doc.text(item2.numero, gOspX + golSubColW + wMin + wNum / 2, grY + 3.4, { align: 'center' });
    }
  }

  currentY += golTotalH + 1.5;

  // ==========================================
  // 6. SEZIONE NOTE
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('NOTE:', startX, currentY + 4);

  // Linee di annotazione a mano
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.25);
  doc.line(startX + 13, currentY + 4.5, startX + printableWidth, currentY + 4.5);
  doc.line(startX, currentY + 10, startX + printableWidth, currentY + 10);
  doc.line(startX, currentY + 15.5, startX + printableWidth, currentY + 15.5);

  if (data.note) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(data.note, startX + 14, currentY + 3.8, { maxWidth: printableWidth - 16 });
  }

  // Footer Ufficiale
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `A.S.D. CYNTHIA 1920 • STAGIONE SPORTIVA 2026/2027 • FOGLIO GARA E NOTE PANCHINA UFFICIALE • ${data.campionato || ''} ${data.gara || ''}`,
    pageWidth / 2,
    290,
    { align: 'center' }
  );

  return doc;
}

/**
 * Scarica il file PDF A4 direttamente nel browser
 */
export async function downloadFoglioGaraPdf(data: FoglioGaraData): Promise<void> {
  const doc = generateFoglioGaraPdf(data);
  const cleanCasa = (data.squadraCasa || 'Casa').replace(/\s+/g, '_');
  const cleanOspite = (data.squadraOspite || 'Ospiti').replace(/\s+/g, '_');
  const cleanData = (data.data || '').replace(/\//g, '-');
  const fileName = `Foglio_Panchina_2026_2027_${cleanCasa}_vs_${cleanOspite}_${cleanData}.pdf`;
  doc.save(fileName);
}

/**
 * Condivisione tramite Web Share API (WhatsApp, Telegram, etc.)
 */
export async function shareFoglioGaraPdf(data: FoglioGaraData): Promise<{ shared: boolean }> {
  try {
    const doc = generateFoglioGaraPdf(data);
    const pdfBlob = doc.output('blob');
    const fileName = `Foglio_Panchina_Cynthia1920_${Date.now()}.pdf`;
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Foglio Gara Panchina: ${data.squadraCasa} vs ${data.squadraOspite}`,
        text: `Referto Note Gara Panchina A4 - ${data.data} ore ${data.ora1T}`,
        files: [file],
      });
      return { shared: true };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { shared: true };
    }
  }

  await downloadFoglioGaraPdf(data);
  return { shared: false };
}
