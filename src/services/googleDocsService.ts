import { GiocatoreConvocato, Partita } from '../types';

export interface ConvocazioniDocParams {
  partitaTitle: string;
  categoria: string;
  dataGara: string;
  oraGara: string;
  squadraCasa: string;
  squadraOspite: string;
  campo: string;
  indirizzo: string;
  ritrovo: string;
  mister: string;
  note: string;
  convocati: GiocatoreConvocato[];
}

/**
 * Crea un nuovo documento Google Docs tramite Google Docs API v1 e popola il testo iniziale.
 * NOTA: richiede autorizzazione Google Workspace con scopi https://www.googleapis.com/auth/documents
 */
export async function createGoogleDoc(
  title: string,
  contentText: string,
  accessToken: string
): Promise<{ id: string; documentUrl: string }> {
  if (!accessToken) {
    throw new Error('Accesso non autorizzato. Effettua il login con Google per creare un documento.');
  }

  // 1. Crea il documento Google Docs vuoto
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      title: title || 'Nuovo Documento Cynthia 1920',
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Errore creazione Google Doc (HTTP ${createRes.status})`);
  }

  const createdData = await createRes.json();
  const documentId = createdData.documentId;
  const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  // 2. Inserisce il contenuto nel documento se presente
  if (contentText && contentText.trim()) {
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: contentText,
            },
          },
        ],
      }),
    });

    if (!updateRes.ok) {
      console.warn('Avviso: Documento creato ma errore nell\'inserimento del testo iniziale');
    }
  }

  return {
    id: documentId,
    documentUrl,
  };
}

/**
 * Genera e crea un documento ufficiale Google Docs con la Distinta Convocati
 */
export async function createConvocazioniGoogleDoc(
  params: ConvocazioniDocParams,
  accessToken: string
): Promise<{ id: string; documentUrl: string }> {
  const dataCreazione = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const divider = '━'.repeat(58);

  const docLines: string[] = [
    'ASD CYNTHIA 1920 - COMUNICAZIONE UFFICIALE',
    'STAGIONE SPORTIVA 2026/2027',
    'DISTINTA CONVOCAZIONI GARA',
    `Data Emissione: ${dataCreazione}`,
    divider,
    '',
    `STAGIONE SPORTIVA: 2026/2027`,
    `GARA: ${params.squadraCasa || 'Cynthia 1920'} vs ${params.squadraOspite || 'Avversario'}`,
    `CATEGORIA / CAMPIONATO: ${params.categoria || 'Non specificata'}`,
    `DATA E ORA INCONTRO: ${params.dataGara || 'Da definire'} - Ore ${params.oraGara || '--:--'}`,
    `IMPIANTO DI GIOCO: ${params.campo || 'Da definire'}`,
    `INDIRIZZO: ${params.indirizzo || 'Vedi programma ufficiale'}`,
    `ORARIO E LUOGO RITROVO: ${params.ritrovo || 'Come da accordi'}`,
    `STAFF TECNICO / MISTER: ${params.mister || 'Non specificato'}`,
    '',
    divider,
    `ELENCO ATLETI CONVOCATI (Totale: ${params.convocati.length})`,
    divider,
    '',
  ];

  if (params.convocati.length === 0) {
    docLines.push('Nessun atleta inserito nella distinta convocati.');
  } else {
    // Formatta elenco atleti
    params.convocati.forEach((g, idx) => {
      const numStr = String(idx + 1).padStart(2, '0');
      const ruoloStr = g.ruolo ? `[${g.ruolo}]` : '';
      const annoStr = g.annoNascita ? `(${g.annoNascita})` : '';
      const prestitoStr = g.squadra && !g.squadra.toUpperCase().includes('CYNTHIA') ? ` - ${g.squadra}` : '';
      docLines.push(`${numStr}. ${g.nome.padEnd(28, ' ')} ${ruoloStr.padEnd(6, ' ')} ${annoStr.padEnd(8, ' ')}${prestitoStr}`);
    });
  }

  if (params.note && params.note.trim()) {
    docLines.push('');
    docLines.push(divider);
    docLines.push('NOTE E INDICAZIONI DEL MISTER / SOCIETÀ:');
    docLines.push(params.note.trim());
  }

  docLines.push('');
  docLines.push(divider);
  docLines.push('Firma Dirigente Accompagnatore: _______________________');
  docLines.push('Firma Allenatore Responsabile: _______________________');
  docLines.push('');
  docLines.push('Documento generato dall\'Applicazione ASD Cynthia 1920 con Google Workspace Docs');

  const contentText = docLines.join('\n');
  const title = `Distinta Convocazioni 2026/2027 - ${params.squadraCasa || 'Cynthia'} vs ${params.squadraOspite || 'Avversario'} (${params.dataGara || 'Gara'})`;

  return createGoogleDoc(title, contentText, accessToken);
}

/**
 * Genera e crea un documento ufficiale Google Docs con il Programma Gare del fine settimana
 */
export async function createProgrammaGareGoogleDoc(
  partite: Partita[],
  lastUpdated: string | null,
  accessToken: string
): Promise<{ id: string; documentUrl: string }> {
  const dataCreazione = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const divider = '━'.repeat(58);

  const docLines: string[] = [
    'ASD CYNTHIA 1920 - GENZANO DI ROMA',
    'STAGIONE SPORTIVA 2026/2027',
    'PROGRAMMA GARE DEL FINE SETTIMANA',
    `Data aggiornamento: ${lastUpdated || dataCreazione}`,
    divider,
    '',
  ];

  if (partite.length === 0) {
    docLines.push('Nessuna partita in programma.');
  } else {
    partite.forEach((p, idx) => {
      docLines.push(`[${idx + 1}] ${p.squadraCasa} vs ${p.squadraOspite}`);
      docLines.push(`    Campionato: ${p.campionato}${p.girone ? ` (${p.girone})` : ''}`);
      docLines.push(`    Data e Ora: ${p.data} alle ore ${p.ora}`);
      docLines.push(`    Campo: ${p.campo} - ${p.indirizzo || ''}`);
      if (p.comune) docLines.push(`    Comune: ${p.comune}`);
      if (p.tipo) docLines.push(`    Turno: ${p.tipo}`);
      docLines.push('');
    });
  }

  docLines.push(divider);
  docLines.push(`Totale incontri in calendario: ${partite.length}`);
  docLines.push('Documento ufficiale generato dall\'Applicazione ASD Cynthia 1920 • Stagione Sportiva 2026/2027');

  const contentText = docLines.join('\n');
  const title = `Programma Gare Weekend - ASD Cynthia 1920 Stagione 2026-2027 (${dataCreazione})`;

  return createGoogleDoc(title, contentText, accessToken);
}
