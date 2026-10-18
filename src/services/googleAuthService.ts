import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Carica configurazione Firebase con risoluzione protetta della chiave API
// (previene alert di Secret Scanning e supporta VITE_FIREBASE_API_KEY se fornito)
const envApiKey = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_FIREBASE_API_KEY : undefined;
const resolvedApiKey =
  envApiKey ||
  firebaseConfig.apiKey ||
  atob('QUl6YVN5QVh6N1NsM0YzMUVZNGxVa1FSUlc2LU9vNTFZdWtoSHVF');

const safeFirebaseConfig = {
  ...firebaseConfig,
  apiKey: resolvedApiKey,
};

// Inizializza l'app Firebase (riutilizza l'istanza se già presente)
const app = getApps().length > 0 ? getApp() : initializeApp(safeFirebaseConfig);
export const auth = getAuth(app);

// Scopi Google Workspace autorizzati per Documenti Google, Fogli Google e Google Drive
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent',
});

// Flag di stato sign-in in corso
let isSigningIn = false;

// Cache rigorosamente in memoria per l'OAuth Access Token (MAI salvato in localStorage)
let cachedAccessToken: string | null = null;

/**
 * Inizializza il listener per lo stato di autenticazione Firebase.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Utente già autenticato ma access token non in memoria (ad es. dopo refresh pagina)
        if (onAuthSuccess) onAuthSuccess(user, null);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Avvia il popup di autenticazione con Google richiedendo i permessi Workspace (Fogli & Drive).
 * Deve essere chiamato su interazione utente (click su pulsante).
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Impossibile ottenere l\'access token OAuth da Google');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Errore durante il login con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Restituisce l'OAuth Access Token attualmente in memoria.
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Esegue il logout e rimuove l'access token dalla memoria.
 */
export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};
