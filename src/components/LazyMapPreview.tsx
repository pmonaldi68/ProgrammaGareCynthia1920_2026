import React, { useState } from 'react';
import { Partita } from '../types';
import { getGoogleMapsEmbedUrl } from '../utils/mapUtils';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';

interface LazyMapPreviewProps {
  partita: Partita;
  isOpen: boolean;
}

export const LazyMapPreview: React.FC<LazyMapPreviewProps> = ({ partita, isOpen }) => {
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  if (!isOpen) return null;

  const embedMapUrl = getGoogleMapsEmbedUrl(partita);

  return (
    <div className="mb-4 rounded-xl overflow-hidden border border-sky-300 dark:border-sky-700/80 bg-slate-100 dark:bg-slate-950 shadow-inner animate-in fade-in duration-200">
      {/* Intestazione Mappa */}
      <div className="px-3 py-2 bg-sky-50 dark:bg-slate-800 text-xs font-semibold text-sky-950 dark:text-sky-200 flex items-center justify-between border-b border-sky-200/80 dark:border-slate-700">
        <span className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
          <span className="truncate">{partita.campo}</span>
        </span>
        <a
          href={partita.lnkMaps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${partita.campo}, ${partita.comune}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
        >
          <span>Navigatore</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Container Iframe con Skeleton Loader */}
      <div className="relative w-full h-[220px] bg-slate-200 dark:bg-slate-800">
        {isIframeLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 p-4 text-center animate-pulse">
            <div className="w-6 h-6 rounded-full border-2 border-sky-600 border-t-transparent animate-spin mb-2"></div>
            <p className="text-xs font-semibold">Caricamento mappa in corso...</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{partita.comune}</p>
          </div>
        )}

        <iframe
          title={`Mappa per ${partita.campo} - ${partita.comune}`}
          src={embedMapUrl}
          width="100%"
          height="100%"
          loading="lazy"
          onLoad={() => setIsIframeLoading(false)}
          className={`w-full h-full border-0 block transition-opacity duration-300 ${
            isIframeLoading ? 'opacity-0' : 'opacity-100'
          }`}
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};
