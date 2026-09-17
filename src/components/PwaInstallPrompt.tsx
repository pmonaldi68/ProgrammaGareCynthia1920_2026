import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Verifica se l'app è già installata o eseguita in modalità standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // Verifica se l'utente ha già chiuso il prompt di recente
    const dismissed = localStorage.getItem('cynthia_pwa_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 7 * 24 * 60 * 60 * 1000) {
      // Chiuso meno di 7 giorni fa
      return;
    }

    // Rileva iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Su iOS mostra il banner dopo un breve ritardo
    if (isIosDevice) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIosGuide(false);
    localStorage.setItem('cynthia_pwa_dismissed', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Installazione applicazione"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl p-4 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <img
            src="/pwa-192x192.png"
            alt="Logo Cynthia 1920"
            className="w-12 h-12 rounded-xl object-contain shadow-xs border border-sky-200 dark:border-sky-800 flex-shrink-0 bg-sky-900 p-0.5"
            referrerPolicy="no-referrer"
          />
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              Installa l'App Cynthia 1920
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-snug">
              Salva il programma gare sulla tua schermata home per consultare orari, campi e mappe anche offline.
            </p>

            {showIosGuide && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Share className="w-3.5 h-3.5 text-sky-600" /> Come installare su iPhone/iPad:
                </p>
                <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
                  <li>
                    Tocca l'icona <strong>Condividi</strong> in basso su Safari.
                  </li>
                  <li>
                    Scorri e tocca <strong>"Aggiungi alla schermata Home"</strong>.
                  </li>
                  <li>Conferma toccando <strong>"Aggiungi"</strong>.</li>
                </ol>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <button
                id="btn-pwa-install-confirm"
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs shadow-xs transition active:scale-95"
              >
                {isIos ? <Smartphone className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isIos ? 'Come installare' : 'Installa Ora'}</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
              >
                Non ora
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition -mr-1 -mt-1"
          aria-label="Chiudi avviso installazione"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
