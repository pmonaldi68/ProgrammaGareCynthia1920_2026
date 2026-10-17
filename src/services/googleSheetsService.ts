/**
 * Servizio per l'integrazione con le API di Google Sheets v4 e Google Drive v3
 */

export interface GoogleSpreadsheetInfo {
  id: string;
  title: string;
  sheets: { sheetId: number; title: string }[];
  spreadsheetUrl?: string;
}

export interface DriveSpreadsheetItem {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink?: string;
}

/**
 * Estrae l'ID univoco del foglio da un URL di Google Sheets o lo restituisce pulito se già ID
 */
export function extractSpreadsheetId(inputUrlOrId: string): string {
  if (!inputUrlOrId) return '';
  const trimmed = inputUrlOrId.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  return trimmed;
}

/**
 * Recupera i metadati del foglio di calcolo (titolo ed elenco schede/fogli)
 */
export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken?: string | null
): Promise<GoogleSpreadsheetInfo> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) throw new Error('ID Foglio Google non valido');

  const headers: HeadersInit = {
    'Accept': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=properties.title,spreadsheetUrl,sheets.properties(sheetId,title)`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Accesso non autorizzato. Effettua l\'accesso con il tuo account Google per visualizzare questo foglio privato.');
    }
    if (res.status === 404) {
      throw new Error('Foglio Google non trovato. Verifica l\'ID o il link inserito.');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Errore lettura metadati Google Sheets (HTTP ${res.status})`);
  }

  const data = await res.json();
  const title = data.properties?.title || 'Foglio Google';
  const sheets = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId,
    title: s.properties?.title || 'Foglio',
  }));

  return {
    id: cleanId,
    title,
    sheets,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${cleanId}`,
  };
}

/**
 * Legge i valori di una scheda da Google Sheets API v4
 */
export async function fetchSpreadsheetValues(
  spreadsheetId: string,
  rangeOrTab: string,
  accessToken?: string | null
): Promise<string[][]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) throw new Error('ID Foglio Google non valido');

  const headers: HeadersInit = {
    'Accept': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const rangeToFetch = rangeOrTab && rangeOrTab.trim() ? encodeURIComponent(rangeOrTab.trim()) : 'A1:Z500';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${rangeToFetch}`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Permessi insufficienti. Accedi con il tuo account Google Workspace autorizzato.');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Impossibile leggere i dati da Google Sheets (HTTP ${res.status})`);
  }

  const data = await res.json();
  return (data.values || []) as string[][];
}

/**
 * Cerca e restituisce l'elenco dei Fogli Google dell'utente da Google Drive
 */
export async function listDriveSpreadsheets(
  accessToken: string
): Promise<DriveSpreadsheetItem[]> {
  if (!accessToken) {
    throw new Error('Access token mancante per la lettura da Google Drive');
  }

  const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime%20desc&pageSize=30&fields=${fields}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Errore lettura file da Google Drive (HTTP ${res.status})`);
  }

  const data = await res.json();
  return (data.files || []) as DriveSpreadsheetItem[];
}

/**
 * Crea un nuovo foglio di calcolo su Google Drive e popola i dati (es. convocazioni o programma gare).
 * NOTA: richiede conferma esplicita dell'utente prima della chiamata in accordo alle linee guida.
 */
export async function createGoogleSpreadsheet(
  title: string,
  rows: (string | number)[][],
  accessToken: string
): Promise<{ id: string; spreadsheetUrl: string }> {
  if (!accessToken) {
    throw new Error('Accesso non autorizzato. Effettua il login con Google per creare un foglio.');
  }

  // 1. Crea il foglio vuoto
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || 'Nuovo Foglio Convocazioni Cynthia',
      },
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Errore creazione Google Sheet (HTTP ${createRes.status})`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2. Se ci sono righe di dati, popola il foglio
  if (rows && rows.length > 0) {
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`;
    await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    });
  }

  return {
    id: spreadsheetId,
    spreadsheetUrl,
  };
}
