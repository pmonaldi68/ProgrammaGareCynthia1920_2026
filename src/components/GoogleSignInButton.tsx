import React, { useState } from 'react';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { LogOut, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

interface GoogleSignInButtonProps {
  onSuccess?: (token: string) => void;
  className?: string;
  variant?: 'compact' | 'full' | 'banner';
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  className = '',
  variant = 'compact',
}) => {
  const { user, isAuthenticated, isLoading, login, logout } = useGoogleAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const token = await login();
      if (token && onSuccess) {
        onSuccess(token);
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err?.message || 'Errore di connessione a Google');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Se l'utente è autenticato con token valido
  if (isAuthenticated && user) {
    if (variant === 'compact') {
      return (
        <div className={`flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs shadow-2xs ${className}`}>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Google User'}
              className="w-6 h-6 rounded-full border border-emerald-400"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
              {user.displayName?.charAt(0) || user.email?.charAt(0) || 'G'}
            </div>
          )}
          <div className="flex flex-col min-w-0 pr-1">
            <span className="font-bold text-slate-800 dark:text-slate-100 truncate text-[11px]">
              {user.displayName || user.email}
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Google Workspace attivo</span>
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Disconnetti account Google"
            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-800 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div className={`p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/80 text-xs flex items-center justify-between gap-3 shadow-2xs ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Google User'}
              className="w-8 h-8 rounded-full border border-emerald-400 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user.displayName?.charAt(0) || user.email?.charAt(0) || 'G'}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-bold text-slate-900 dark:text-white truncate">
              {user.displayName || user.email}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Connesso a Fogli Google & Drive</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-700 transition flex items-center gap-1 shrink-0 font-medium active:scale-95 cursor-pointer"
        >
          <LogOut className="w-3 h-3" />
          <span>Disconnetti</span>
        </button>
      </div>
    );
  }

  // Pulsante Ufficiale Google Sign-In conforme alle specifiche GSI Workspace
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isLoggingIn || isLoading}
        className="gsi-material-button relative inline-flex items-center justify-center bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-sans font-medium text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 shadow-2xs hover:shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer min-h-[40px]"
        title="Accedi con Google per usare Fogli Google e Google Drive"
      >
        <div className="flex items-center gap-2.5">
          {isLoggingIn ? (
            <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
          ) : (
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
          )}
          <span className="font-semibold text-xs sm:text-sm">
            {isLoggingIn ? 'Connessione a Google...' : 'Accedi con Google'}
          </span>
        </div>
      </button>

      {errorMsg && (
        <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
          {errorMsg}
        </span>
      )}
    </div>
  );
};
