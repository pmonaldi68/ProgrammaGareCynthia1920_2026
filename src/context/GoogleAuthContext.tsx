import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout as authLogout, getAccessToken } from '../services/googleAuthService';

interface GoogleAuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<string | null>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType>({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => null,
  logout: async () => {},
  getToken: async () => null,
});

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setIsLoading(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        return res.accessToken;
      }
      return null;
    } catch (err: any) {
      const errMsg = err?.message || 'Accesso non riuscito';
      setError(errMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authLogout();
      setUser(null);
      setAccessToken(null);
    } catch (err) {
      console.warn('Errore durante il logout Google', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (accessToken) return accessToken;
    const fresh = await getAccessToken();
    if (fresh) setAccessToken(fresh);
    return fresh;
  }, [accessToken]);

  return (
    <GoogleAuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        error,
        login,
        logout,
        getToken,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuth = () => useContext(GoogleAuthContext);
