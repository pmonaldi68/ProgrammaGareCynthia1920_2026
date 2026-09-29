import React, { useState, useEffect } from 'react';
import { Partita } from '../types';
import { getGoogleMapsEmbedUrl } from '../utils/mapUtils';
import { getInitialCoordinates, resolveMapLinkAsync } from '../utils/geoUtils';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';

interface LazyMapPreviewProps {
  partita: Partita;
  isOpen: boolean;
}

export const LazyMapPreview: React.FC<LazyMapPreviewProps> = ({ partita, isOpen }) => {
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [resolvedCoords, setResolvedCoords] = useState<[number, number] | null>(() => getInitialCoordinates(partita));

  useEffect(() => {
    if (!isOpen) return;
    setIsIframeLoading(true);

    const initial = getInitialCoordinates(partita);
    setResolvedCoords(initial);

    // Risoluzione esatta asincrona del link inserito nella colonna Link Maps del foglio Google
    if (partita.lnkMaps && partita.lnkMaps !== '#' && partita.lnkMaps.startsWith('http')) {
      resolveMapLinkAsync(partita.lnkMaps).then(coords => {
        if (coords) {
          setResolvedCoords(coords);
          partita.lat = coords[0];
          partita.lng = coords[1];
        }
      });
    }
  }, [partita, isOpen]);

  if (!isOpen) return null;

  // Calcola l'URL embed usando le coordinate estratte dal link Maps del foglio Google
  const effectivePartita: Partita = resolvedCoords
    ? { ...partita, lat: resolvedCoords[0], lng: resolvedCoords[1] }
    : partita;
  const embedMapUrl = getGoogleMapsEmbedUrl(effectivePartita);

  // Link prioritario esatto preso direttamente dalla colonna LNK MAPS del foglio Google
  const exactNavUrl =
    partita.lnkMaps && partita.lnkMaps !== '#' && partita.lnkMaps.startsWith('http')
      ? partita.lnkMaps
      : resolvedCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${resolvedCoords[0]},${resolvedCoords[1]}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          `${partita.campo}, ${partita.indirizzo}, ${partita.comune}`
        )}`;

  return (
    <div className="mb-4 rounded-xl overflow-hidden border border-sky-300 dark:border-sky-700/80 bg-slate-100 dark:bg-slate-950 shadow-inner animate-in fade-in duration-200">
      {/* Intestazione Mappa */}
      <div className="px-3 py-2 bg-sky-50 dark:bg-slate-800 text-xs font-semibold text-sky-950 dark:text-sky-200 flex items-center justify-between border-b border-sky-200/80 dark:border-slate-700">
        <span className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
          <span className="truncate">{partita.campo}</span>
        </span>
        <a
          href={exactNavUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-white flex items-center gap-1 flex-shrink-0 ml-2 py-0.5 px-2 rounded-md bg-white dark:bg-slate-700 border border-sky-200 dark:border-slate-600 transition shadow-2xs"
          title="Apri navigatore verso il campo esatto"
        >
          <Navigation className="w-3 h-3 text-sky-600 dark:text-sky-400" />
          <span>Navigatore</span>
          <ExternalLink className="w-3 h-3 opacity-70" />
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

      {/* Barra inferiore nel riquadro con link diretto ad alta precisione */}
      <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
          {partita.indirizzo ? `${partita.indirizzo}, ` : ''}{partita.comune}
        </span>
        <a
          href={exactNavUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] transition shadow-2xs flex-shrink-0"
          title="Apri le indicazioni stradali esatte su Google Maps"
        >
          <Navigation className="w-3 h-3" />
          <span>Apri su Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
