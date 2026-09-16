import { Partita, MatchVariation } from '../types';

const FOLLOWED_CATEGORIES_KEY = 'cynthia_followed_categories_v1';
const PREVIOUS_PARTITE_KEY = 'cynthia_last_known_partite_v1';
const VARIATION_LOG_KEY = 'cynthia_variations_history_v1';

/**
 * Registra il Service Worker per abilitare le Web Push Notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      return reg;
    } catch (err) {
      console.warn('Registrazione Service Worker non riuscita:', err);
    }
  }
  return null;
}

/**
 * Verifica se il browser supporta le Notifiche Web
 */
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Stato attuale del permesso notifiche
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission;
  }
  return 'denied';
}

/**
 * Richiede il permesso all'utente per inviare notifiche Web Push
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
    }
    return permission;
  } catch (err) {
    console.error('Errore durante la richiesta di permesso notifiche:', err);
    return 'denied';
  }
}

/**
 * Categorie attualmente seguite dall'utente
 */
export function getFollowedCategories(): string[] {
  try {
    const raw = localStorage.getItem(FOLLOWED_CATEGORIES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Errore lettura categorie seguite', err);
  }
  // Di default se vuoto, nessuna categoria o predefinite se l'utente sceglie
  return [];
}

/**
 * Salva l'elenco delle categorie seguite
 */
export function saveFollowedCategories(categories: string[]): void {
  try {
    localStorage.setItem(FOLLOWED_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (err) {
    console.warn('Errore salvataggio categorie seguite', err);
  }
}

/**
 * Normalizza il nome categoria per confronto insensibile a spazi o maiuscole/minuscole
 * Es. "UNDER 17" -> "UNDER17"
 */
export function normalizeCategoryName(name: string): string {
  return (name || '').toUpperCase().replace(/[\s_-]+/g, '');
}

/**
 * Controlla se una categoria di una partita è seguita
 */
export function isCategoryFollowed(campionato: string, followedList: string[]): boolean {
  const norm = normalizeCategoryName(campionato);
  return followedList.some(cat => normalizeCategoryName(cat) === norm);
}

/**
 * Mostra una notifica web locale o via Service Worker
 */
export async function sendWebNotification(title: string, body: string, data?: any): Promise<void> {
  if (!isPushNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        reg.showNotification(title, {
          body,
          icon: '/assets/cynthia_logo.png',
          badge: '/assets/cynthia_logo.png',
          tag: `cynthia-update-${Date.now()}`,
          data,
        });
        return;
      }
    }

    // Fallback con Notification API standard
    new Notification(title, {
      body,
      icon: '/assets/cynthia_logo.png',
    });
  } catch (err) {
    console.warn('Impossibile inviare notifica:', err);
  }
}

/**
 * Confronta il nuovo elenco di partite scaricato da Google Sheets con l'elenco precedente salvato.
 * Rileva variazioni di orario o di campo su partite di categorie seguite e invia la notifica Web Push.
 */
export function checkPartiteVariations(
  newPartite: Partita[],
  followedCategories: string[]
): MatchVariation[] {
  if (!newPartite || newPartite.length === 0) return [];

  let oldPartite: Partita[] = [];
  try {
    const raw = localStorage.getItem(PREVIOUS_PARTITE_KEY);
    if (raw) {
      oldPartite = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Errore lettura partite precedenti', e);
  }

  // Se non c'è una cronologia precedente, salviamo e usciamo (prima inizializzazione)
  if (oldPartite.length === 0) {
    try {
      localStorage.setItem(PREVIOUS_PARTITE_KEY, JSON.stringify(newPartite));
    } catch (e) {}
    return [];
  }

  const variations: MatchVariation[] = [];

  // Mappatura partite precedenti tramite chiave univoca (campionato + data + squadre)
  const oldMap = new Map<string, Partita>();
  oldPartite.forEach(p => {
    const key = `${normalizeCategoryName(p.campionato)}_${p.data}_${p.squadraCasa}_${p.squadraOspite}`.toLowerCase();
    oldMap.set(key, p);
    if (p.id) oldMap.set(p.id, p);
  });

  newPartite.forEach(pNew => {
    const isFollowed = isCategoryFollowed(pNew.campionato, followedCategories);
    if (!isFollowed) return;

    const key = `${normalizeCategoryName(pNew.campionato)}_${pNew.data}_${pNew.squadraCasa}_${pNew.squadraOspite}`.toLowerCase();
    const pOld = oldMap.get(key) || (pNew.id ? oldMap.get(pNew.id) : undefined);

    if (pOld) {
      const changes: string[] = [];

      // Variazione di Orario
      const oldOra = (pOld.ora || '').trim();
      const newOra = (pNew.ora || '').trim();
      if (oldOra && newOra && oldOra !== newOra) {
        changes.push(`Orario variato da ${oldOra} a ${newOra}`);
      }

      // Variazione di Campo o Comune
      const oldCampo = (pOld.campo || '').trim();
      const newCampo = (pNew.campo || '').trim();
      if (oldCampo && newCampo && oldCampo !== newCampo) {
        changes.push(`Campo variato da "${oldCampo}" a "${newCampo}"`);
      }

      // Variazione di Data
      const oldData = (pOld.data || '').trim();
      const newData = (pNew.data || '').trim();
      if (oldData && newData && oldData !== newData) {
        changes.push(`Data variata da "${oldData}" a "${newData}"`);
      }

      if (changes.length > 0) {
        const item: MatchVariation = {
          partitaId: pNew.id,
          campionato: pNew.campionato,
          squadre: `${pNew.squadraCasa} vs ${pNew.squadraOspite}`,
          data: pNew.data,
          changes,
          timestamp: Date.now(),
        };
        variations.push(item);

        // Invia notifica Web Push se i permessi sono attivi
        const title = `⚠️ Variazione Gara: ${pNew.campionato}`;
        const body = `${item.squadre} (${pNew.data}): ${changes.join(' • ')}`;
        sendWebNotification(title, body);
      }
    }
  });

  // Aggiorna la memoria con il nuovo stato
  try {
    localStorage.setItem(PREVIOUS_PARTITE_KEY, JSON.stringify(newPartite));

    // Salva le variazioni recenti nel registro
    if (variations.length > 0) {
      const existingHistory: MatchVariation[] = getVariationsHistory();
      const updated = [...variations, ...existingHistory].slice(0, 30);
      localStorage.setItem(VARIATION_LOG_KEY, JSON.stringify(updated));
    }
  } catch (e) {}

  return variations;
}

/**
 * Recupera lo storico delle ultime variazioni rilevate
 */
export function getVariationsHistory(): MatchVariation[] {
  try {
    const raw = localStorage.getItem(VARIATION_LOG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}
