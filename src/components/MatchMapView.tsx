import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Partita } from '../types';
import { groupPartiteByVenue, VenueLocation, geocodeVenueAsync } from '../utils/geoUtils';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Shield,
  Calendar,
  Clock,
  Layers,
  Maximize2,
  Compass,
  Building2,
  CheckCircle2,
} from 'lucide-react';

interface MatchMapViewProps {
  partite: Partita[];
}

export const MatchMapView: React.FC<MatchMapViewProps> = ({ partite }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [venues, setVenues] = useState<VenueLocation[]>([]);

  // Calcola i campi raggruppati all'aggiornamento dell'elenco partite
  useEffect(() => {
    const grouped = groupPartiteByVenue(partite);
    setVenues(grouped);

    // Geocodifica asincrona in background per eventuali campi senza coordinate note
    grouped.forEach(v => {
      geocodeVenueAsync(v).then(newCoords => {
        if (newCoords && (newCoords[0] !== v.lat || newCoords[1] !== v.lng)) {
          setVenues(prev =>
            prev.map(item =>
              item.id === v.id ? { ...item, lat: newCoords[0], lng: newCoords[1] } : item
            )
          );
        }
      });
    });
  }, [partite]);

  // Inizializzazione e aggiornamento della mappa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Se la mappa non esiste ancora, inizializzala
    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = [41.7052, 12.6947]; // Genzano di Roma
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Layer OpenStreetMap con stile chiaro ad alta leggibilità
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Rimuovi i marker precedenti
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    if (venues.length === 0) return;

    const bounds = L.latLngBounds([]);

    venues.forEach(venue => {
      const isHome = venue.hasCynthiaCasa;
      const isAway = venue.hasCynthiaOspite && !venue.hasCynthiaCasa;
      const matchCount = venue.partite.length;

      // Colore tema marker
      const pinColor = isHome
        ? '#0284c7' // sky-600 Cynthia
        : isAway
        ? '#d97706' // amber-600 Trasferta
        : '#4f46e5'; // indigo-600

      // Icona HTML personalizzata ad alta risoluzione con badge conteggio
      const customIcon = L.divIcon({
        className: 'custom-cynthia-map-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              width: 38px;
              height: 38px;
              background-color: ${pinColor};
              border: 3px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 800;
              font-size: 13px;
              transition: transform 0.2s;
            ">
              ${
                isHome
                  ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
                  : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
              }
            </div>
            ${
              matchCount > 1
                ? `<div style="
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    background: #dc2626;
                    color: white;
                    border: 2px solid white;
                    border-radius: 10px;
                    padding: 1px 6px;
                    font-size: 10px;
                    font-weight: 900;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.25);
                  ">${matchCount}</div>`
                : ''
            }
            <div style="
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 8px solid ${pinColor};
              margin-top: -2px;
            "></div>
          </div>
        `,
        iconSize: [38, 46],
        iconAnchor: [19, 46],
        popupAnchor: [0, -42],
      });

      const marker = L.marker([venue.lat, venue.lng], { icon: customIcon }).addTo(map);

      // Costruzione del contenuto HTML del Popup
      const navUrl =
        venue.lnkMaps ||
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          `${venue.campo}, ${venue.indirizzo}, ${venue.comune}`
        )}`;

      const matchesHtml = venue.partite
        .map(
          p => `
          <div style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <span style="font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                ${escapeHtml(p.campionato)}
              </span>
              <span style="color: #64748b; font-weight: 600; font-size: 10px;">
                ${escapeHtml(p.data)} ore ${escapeHtml(p.ora)}
              </span>
            </div>
            <div style="font-weight: 700; color: #0f172a; margin-top: 3px;">
              ${
                p.isCynthiaCasa
                  ? `<span style="color: #0369a1;">${escapeHtml(p.squadraCasa)}</span>`
                  : escapeHtml(p.squadraCasa)
              }
              <span style="color: #94a3b8; font-weight: 400;"> vs </span>
              ${
                p.isCynthiaOspite
                  ? `<span style="color: #0369a1;">${escapeHtml(p.squadraOspite)}</span>`
                  : escapeHtml(p.squadraOspite)
              }
            </div>
          </div>
        `
        )
        .join('');

      const popupContent = `
        <div style="font-family: inherit; min-width: 240px; max-width: 300px;">
          <div style="background: #0c4a6e; color: white; padding: 8px 12px; margin: -14px -20px 8px -20px; border-radius: 6px 6px 0 0;">
            <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85;">
              ${escapeHtml(venue.tipo || 'Campo da Calcio')}
            </div>
            <div style="font-size: 13px; font-weight: 800; line-height: 1.2;">
              ${escapeHtml(venue.campo)}
            </div>
            <div style="font-size: 10px; opacity: 0.9; margin-top: 2px;">
              ${escapeHtml(venue.indirizzo ? `${venue.indirizzo} - ` : '')}${escapeHtml(venue.comune)}
            </div>
          </div>

          <div style="max-height: 160px; overflow-y: auto; margin-bottom: 8px;">
            ${matchesHtml}
          </div>

          <a href="${navUrl}" target="_blank" rel="noopener noreferrer" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 100%;
            background: #0284c7;
            color: white;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            text-decoration: none;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          ">
            <span>Apri Indicazioni Maps</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        maxWidth: 320,
      });

      marker.on('click', () => {
        setSelectedVenueId(venue.id);
      });

      markersRef.current.set(venue.id, marker);
      bounds.extend([venue.lat, venue.lng]);
    });

    // Adatta lo zoom per mostrare tutti i campi trovati
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    // Forza ricalcolo dimensioni dopo il montaggio
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [venues]);

  // Seleziona e focalizza un campo sulla mappa
  const handleFocusVenue = (venue: VenueLocation) => {
    setSelectedVenueId(venue.id);
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo([venue.lat, venue.lng], 14, { duration: 0.8 });

    const marker = markersRef.current.get(venue.id);
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 500);
    }

    // Scroll verso la mappa se ci si trova in basso su schermi mobili
    mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map || venues.length === 0) return;

    const bounds = L.latLngBounds([]);
    venues.forEach(v => bounds.extend([v.lat, v.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  const handleCenterGenzano = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([41.7052, 12.6947], 13, { duration: 0.8 });
  };

  const totalMatches = partite.length;
  const homeVenues = venues.filter(v => v.hasCynthiaCasa);
  const awayVenues = venues.filter(v => v.hasCynthiaOspite && !v.hasCynthiaCasa);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Barra Informativa Mappa */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Mappa Interattiva Gare del Weekend</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200">
                {venues.length} {venues.length === 1 ? 'Campo' : 'Campi'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalMatches} partite localizzate • Clicca sui segnaposto o sulle schede per visualizzare i dettagli
            </p>
          </div>
        </div>

        {/* Legenda rapida & Controlli Rapidi */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 mr-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-600 border border-white shadow-2xs"></span>
              <span>Casa ({homeVenues.length})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-600 border border-white shadow-2xs"></span>
              <span>Trasferta ({awayVenues.length})</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleFitAll}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Mostra tutti i campi sportivi"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vista Completa</span>
          </button>

          <button
            type="button"
            onClick={handleCenterGenzano}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Centra su Genzano di Roma"
          >
            <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline">Genzano</span>
          </button>
        </div>
      </div>

      {/* Contenitore della Mappa Leaflet */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-950">
        <div
          ref={mapContainerRef}
          id="interactive-weekend-map"
          className="w-full h-[450px] sm:h-[520px] z-10"
        />

        {/* Overlay legenda mobile bottom-left */}
        <div className="absolute bottom-3 left-3 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 shadow-xs flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
            <span>Casa</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
            <span>Trasferta</span>
          </span>
          <span className="text-slate-400 dark:text-slate-500">|</span>
          <span>{venues.length} Impianti</span>
        </div>
      </div>

      {/* Sezione Schede Impianti e Campi con Gare Associate */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Elenco Impianti & Partite Associate ({venues.length})</span>
          </h4>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Clicca su un impianto per individuarlo sulla mappa
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {venues.map(venue => {
            const isSelected = selectedVenueId === venue.id;
            const isHome = venue.hasCynthiaCasa;
            const navUrl =
              venue.lnkMaps ||
              `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                `${venue.campo}, ${venue.indirizzo}, ${venue.comune}`
              )}`;

            return (
              <div
                key={venue.id}
                id={`venue-card-${venue.id}`}
                onClick={() => handleFocusVenue(venue)}
                className={`p-4 rounded-2xl border transition cursor-pointer text-left flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600 shadow-md ring-2 ring-sky-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                <div>
                  {/* Intestazione Impianto */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isHome ? 'bg-sky-600' : 'bg-amber-600'
                          }`}
                        />
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {venue.tipo || 'Campo Calcio'}
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                        {venue.campo}
                      </h5>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex-shrink-0">
                      {venue.partite.length} {venue.partite.length === 1 ? 'gara' : 'gare'}
                    </span>
                  </div>

                  {/* Indirizzo e Comune */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                    <span className="truncate">
                      {venue.indirizzo ? `${venue.indirizzo}, ` : ''}
                      {venue.comune}
                    </span>
                  </div>

                  {/* Gare in programma in questo campo */}
                  <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mb-3">
                    {venue.partite.map(p => (
                      <div
                        key={p.id}
                        className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-0.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-sky-700 dark:text-sky-400">
                            {p.campionato}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {p.data} • {p.ora}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                          {p.squadraCasa} vs {p.squadraOspite}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Azioni del Campo */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleFocusVenue(venue);
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-[11px] flex items-center justify-center gap-1 transition"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Vedi in Mappa</span>
                  </button>

                  <a
                    href={navUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition"
                    title="Apri navigatore satellitare"
                  >
                    <Navigation className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                    <span>Navigatore</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
