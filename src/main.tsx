import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleAuthProvider } from './context/GoogleAuthContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleAuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </GoogleAuthProvider>
  </StrictMode>,
);
