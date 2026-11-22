import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, ExternalLink, Maximize2, X } from 'lucide-react';

type WidgetType = 'panoramica' | 'classifica' | 'risultati' | 'marcatori' | 'ultima' | 'prossima';

interface Championship {
  id: string;
  label: string;
  shortLabel: string;
  group: string;
  badge: string;
  category: 'Prime Squadre & C5' | 'Settore Giovanile';
}

const CHAMPIONSHIPS: Championship[] = [
  {
    id: 'e7f9252f-981b-44e6-b421-faab05dc7ce9',
    label: 'Promozione - Girone D',
    shortLabel: 'Promozione',
    group: 'Girone D',
    badge: 'PROM',
    category: 'Prime Squadre & C5',
  },
  {
    id: '90eb0869-4d99-4184-98de-4801593b18b0',
    label: 'Terza Categoria Roma - Girone C',
    shortLabel: 'Terza Categoria Roma',
    group: 'Girone C',
    badge: '3ª CAT',
    category: 'Prime Squadre & C5',
  },
  {
    id: 'fc2c094c-c6ea-41be-b9bf-679453518fbb',
    label: 'Femminile Calcio a 5 Serie D Roma - Girone A',
    shortLabel: 'Femminile C5 Serie D',
    group: 'Roma · Girone A',
    badge: 'C5 FEM',
    category: 'Prime Squadre & C5',
  },
  {
    id: '8375720e-0760-4254-a9d7-e47b0e414a16',
    label: 'Juniores Provinciali U19 Roma - Girone A',
    shortLabel: 'Juniores Prov. U19',
    group: 'Roma · Girone A',
    badge: 'U19',
    category: 'Settore Giovanile',
  },
  {
    id: '31e5943e-e3a5-4323-888f-9f1d8e16ffa8',
    label: 'Under 18 Regionali - Girone C',
    shortLabel: 'Under 18 Regionali',
    group: 'Girone C',
    badge: 'U18 REG',
    category: 'Settore Giovanile',
  },
  {
    id: '088f5607-3965-4277-9015-91306c3887d7',
    label: 'Allievi Provinciali U17 Latina - Girone A',
    shortLabel: 'Allievi Prov. U17',
    group: 'Latina · Girone A',
    badge: 'U17 LT',
    category: 'Settore Giovanile',
  },
  {
    id: '90d6744a-4e51-4b8b-a397-2f6eac24d48b',
    label: 'Allievi Provinciali U16 Latina - Girone A',
    shortLabel: 'Allievi Prov. U16',
    group: 'Latina · Girone A',
    badge: 'U16 LT',
    category: 'Settore Giovanile',
  },
  {
    id: '6ff0fcb9-139f-4bf8-a6d2-556bcba3dcbb',
    label: 'Giovanissimi Provinciali U15 Latina - Girone A',
    shortLabel: 'Giovanissimi Prov. U15',
    group: 'Latina · Girone A',
    badge: 'U15 LT',
    category: 'Settore Giovanile',
  },
  {
    id: '6fdb2517-83c1-410e-b032-d30c050305d8',
    label: 'Giovanissimi Regionali U14 - Girone F',
    shortLabel: 'Giovanissimi Reg. U14',
    group: 'Girone F',
    badge: 'U14 REG',
    category: 'Settore Giovanile',
  },
  {
    id: 'c608a030-1dcd-4e07-8bcf-edb804b5e1e7',
    label: 'Giovanissimi Provinciali U14 Roma - Girone D',
    shortLabel: 'Giovanissimi Prov. U14',
    group: 'Roma · Girone D',
    badge: 'U14 RM',
    category: 'Settore Giovanile',
  },
];

const WIDGET_TABS: { key: WidgetType; label: string }[] = [
  { key: 'panoramica', label: 'Ultima & Prossima' },
  { key: 'classifica', label: 'Classifica' },
  { key: 'risultati', label: 'Risultati' },
  { key: 'marcatori', label: 'Marcatori' },
  { key: 'ultima', label: 'Ultima Partita' },
  { key: 'prossima', label: 'Prossima Partita' },
];

const WIDGET_NATIVE_WIDTH = 500;

interface TuttocampoFrameProps {
  title: string;
  championshipLabel?: string;
  endpoint: 'Risultati' | 'Classifica' | 'Marcatori' | 'Partita' | 'ProssimaPartita';
  championshipId: string;
  height: number;
}

const TuttocampoFrame: React.FC<TuttocampoFrameProps> = ({
  title,
  championshipLabel,
  endpoint,
  championshipId,
  height,
}) => {
  const src = `https://www.tuttocampo.it/WidgetV2/${endpoint}/${championshipId}`;
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const modalViewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [modalSize, setModalSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 700,
  });

  useEffect(() => {
    setLoading(true);
    setModalLoading(true);
  }, [src]);

  // Calcola dinamicamente il fattore di scala rispetto alla larghezza nativa (500px)
  // mantenendo invariati aspect-ratio e altezza definita dell'iframe senza tagli su mobile
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const updateScale = () => {
      const availableWidth = el.clientWidth;
      if (availableWidth > 0 && availableWidth < WIDGET_NATIVE_WIDTH) {
        setScale(availableWidth / WIDGET_NATIVE_WIDTH);
      } else {
        setScale(1);
      }
    };

    updateScale();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateScale);
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [height]);

  // Gestione apertura modale a schermo intero: blocco scroll body, tasto ESC e misura viewport
  useEffect(() => {
    if (!isExpanded) return;

    setModalLoading(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isExpanded]);

  useLayoutEffect(() => {
    if (!isExpanded) return;
    const el = modalViewportRef.current;
    if (!el) return;

    const updateModalSize = () => {
      setModalSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };

    updateModalSize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateModalSize);
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateModalSize);
    return () => window.removeEventListener('resize', updateModalSize);
  }, [isExpanded]);

  const modalAvailableWidth = Math.max(260, modalSize.width - (modalSize.width >= 640 ? 48 : 16));
  const modalScale =
    modalAvailableWidth < WIDGET_NATIVE_WIDTH ? modalAvailableWidth / WIDGET_NATIVE_WIDTH : 1;
  const modalBoxWidth = modalScale < 1 ? modalAvailableWidth : Math.min(820, modalAvailableWidth);
  const modalVisibleHeight = Math.max(height, modalSize.height - (modalSize.width >= 640 ? 48 : 16));
  const modalIframeHeight =
    modalScale < 1 ? Math.max(height, Math.round(modalVisibleHeight / modalScale)) : modalVisibleHeight;

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col w-full max-w-[540px] mx-auto min-w-0 transition-colors">
        <div className="w-full px-3 sm:px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 truncate">
            {title}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[32px] rounded-lg text-[11px] font-bold bg-sky-700 hover:bg-sky-800 text-white border border-amber-400/60 shadow-2xs transition cursor-pointer whitespace-nowrap"
              title={`Apri ${title} a schermo intero`}
              aria-label={`Espandi Widget ${title}`}
            >
              <Maximize2 className="w-3 h-3 shrink-0" />
              <span>Espandi Widget</span>
            </button>

            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 p-1.5 rounded-lg text-[11px] font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-700/60 transition shrink-0"
              title={`Apri ${title} su Tuttocampo in una nuova scheda`}
              aria-label={`Apri ${title} su Tuttocampo`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Contenitore responsive esterno */}
        <div className="w-full p-2 sm:p-4 bg-white">
          {/* Responsive iframe wrapper con aspect-ratio calibrato su 500 x height */}
          <div
            ref={wrapperRef}
            className="relative w-full max-w-[500px] mx-auto overflow-hidden"
            style={{
              aspectRatio: `${WIDGET_NATIVE_WIDTH} / ${height}`,
              maxHeight: `${height}px`,
            }}
          >
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-10 gap-3 px-4 text-center">
                <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-700 rounded-full animate-spin" />
                <span className="text-xs font-medium text-slate-600">
                  Caricamento {title.toLowerCase()}...
                </span>
              </div>
            )}

            <iframe
              key={src}
              src={src}
              title={title}
              width={WIDGET_NATIVE_WIDTH}
              height={height}
              scrolling="auto"
              loading="lazy"
              onLoad={() => setLoading(false)}
              className="absolute top-0 left-0 border-0 block bg-white"
              style={{
                width: `${WIDGET_NATIVE_WIDTH}px`,
                height: `${height}px`,
                transform: scale < 1 ? `scale(${scale})` : undefined,
                transformOrigin: 'top left',
              }}
            />
          </div>
        </div>
      </div>

      {/* Modale a schermo intero sopra l'applicazione */}
      {isExpanded &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} a schermo intero`}
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xs flex flex-col w-screen h-dvh overflow-hidden animate-in fade-in duration-150"
          >
            {/* Header modale full-screen */}
            <div className="bg-gradient-to-r from-sky-800 via-sky-900 to-slate-900 text-white px-3 sm:px-6 py-3 flex items-center justify-between gap-3 border-b border-amber-400/40 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-white/10 border border-amber-400/40 shrink-0">
                  <Trophy className="w-4 h-4 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                    {title}
                  </h3>
                  {championshipLabel && (
                    <p className="text-[11px] sm:text-xs text-sky-200 truncate">
                      {championshipLabel}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-sky-100 border border-white/15 transition whitespace-nowrap"
                >
                  <span>Apri su Tuttocampo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs transition cursor-pointer whitespace-nowrap"
                  aria-label="Chiudi finestra a schermo intero"
                >
                  <X className="w-4 h-4 shrink-0" />
                  <span>Chiudi</span>
                </button>
              </div>
            </div>

            {/* Area contenuto modale: scala edge-to-edge su mobile e a tutta ampiezza su tablet/desktop */}
            <div
              ref={modalViewportRef}
              className="flex-1 w-full bg-white overflow-y-auto overflow-x-hidden flex justify-center p-2 sm:p-6"
            >
              <div
                className="relative overflow-hidden mx-auto"
                style={{
                  width: `${modalBoxWidth}px`,
                  height: `${modalVisibleHeight}px`,
                }}
              >
                {modalLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-10 gap-3 px-4 text-center">
                    <div className="w-9 h-9 border-4 border-sky-200 border-t-sky-700 rounded-full animate-spin" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-600">
                      Caricamento vista espansa {title.toLowerCase()}...
                    </span>
                  </div>
                )}

                <iframe
                  key={`modal-${src}`}
                  src={src}
                  title={`${title} (Schermo Intero)`}
                  width={modalScale < 1 ? WIDGET_NATIVE_WIDTH : modalBoxWidth}
                  height={modalIframeHeight}
                  scrolling="auto"
                  onLoad={() => setModalLoading(false)}
                  className="absolute top-0 left-0 border-0 block bg-white"
                  style={{
                    width: modalScale < 1 ? `${WIDGET_NATIVE_WIDTH}px` : `${modalBoxWidth}px`,
                    height: `${modalIframeHeight}px`,
                    transform: modalScale < 1 ? `scale(${modalScale})` : undefined,
                    transformOrigin: 'top left',
                  }}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export const TuttocampoWidgets: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(CHAMPIONSHIPS[0].id);
  const [activeTab, setActiveTab] = useState<WidgetType>('panoramica');

  const currentChampionship =
    CHAMPIONSHIPS.find((c) => c.id === selectedId) || CHAMPIONSHIPS[0];

  const handleChampionshipChange = (id: string) => {
    setSelectedId(id);
  };

  return (
    <section id="tuttocampo-widgets-section" className="w-full min-w-0 space-y-5">
      {/* Header Istituzionale */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-sky-900 rounded-2xl p-5 sm:p-6 text-white shadow-xs border border-amber-400/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-amber-300">
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span>Risultati & Classifiche Ufficiali</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
              {currentChampionship.label}
            </h2>
            <p className="text-sky-100 text-xs sm:text-sm">
              Seleziona la categoria e consulta risultati, classifica, marcatori e prossimo turno.
            </p>
          </div>
        </div>
      </div>

      {/* Selettore Campionato: Select su Mobile, Schede su Desktop */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors min-w-0">
        <label
          htmlFor="championship-select"
          className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 md:hidden"
        >
          Seleziona Campionato
        </label>
        <select
          id="championship-select"
          value={selectedId}
          onChange={(e) => handleChampionshipChange(e.target.value)}
          className="w-full md:hidden rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-sky-600 focus:outline-none"
        >
          <optgroup label="Prime Squadre & Calcio a 5">
            {CHAMPIONSHIPS.filter((c) => c.category === 'Prime Squadre & C5').map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Settore Giovanile">
            {CHAMPIONSHIPS.filter((c) => c.category === 'Settore Giovanile').map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </optgroup>
        </select>

        {/* Griglia Tab Desktop / Tablet */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {CHAMPIONSHIPS.map((champ) => {
            const isSelected = champ.id === selectedId;
            return (
              <button
                key={champ.id}
                type="button"
                onClick={() => handleChampionshipChange(champ.id)}
                className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-sky-700 border-amber-400 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:border-sky-300 dark:hover:border-sky-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                    }`}
                  >
                    {champ.badge}
                  </span>
                  <span
                    className={`text-[11px] font-medium truncate ${
                      isSelected ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {champ.group}
                  </span>
                </div>
                <span className="text-xs font-bold leading-snug line-clamp-2">
                  {champ.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sotto-schede Tipologia Widget: griglia 2 colonne su smartphone (zero tagli), wrap fluido su tablet/desktop */}
      <div
        role="tablist"
        aria-label="Sezioni widget Tuttocampo"
        className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full min-w-0"
      >
        {WIDGET_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 min-h-[40px] rounded-lg text-xs sm:text-sm font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-sky-700 text-white shadow-2xs border border-amber-400/70'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Area Rendering Condizionale degli Iframe */}
      <div className="pt-1 min-w-0 w-full">
        {activeTab === 'panoramica' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <TuttocampoFrame
              title="Ultima Partita"
              championshipLabel={currentChampionship.label}
              endpoint="Partita"
              championshipId={selectedId}
              height={350}
            />
            <TuttocampoFrame
              title="Prossima Partita"
              championshipLabel={currentChampionship.label}
              endpoint="ProssimaPartita"
              championshipId={selectedId}
              height={350}
            />
          </div>
        )}

        {activeTab === 'classifica' && (
          <TuttocampoFrame
            title="Classifica"
            championshipLabel={currentChampionship.label}
            endpoint="Classifica"
            championshipId={selectedId}
            height={800}
          />
        )}

        {activeTab === 'risultati' && (
          <TuttocampoFrame
            title="Risultati"
            championshipLabel={currentChampionship.label}
            endpoint="Risultati"
            championshipId={selectedId}
            height={600}
          />
        )}

        {activeTab === 'marcatori' && (
          <TuttocampoFrame
            title="Classifica Marcatori"
            championshipLabel={currentChampionship.label}
            endpoint="Marcatori"
            championshipId={selectedId}
            height={700}
          />
        )}

        {activeTab === 'ultima' && (
          <TuttocampoFrame
            title="Ultima Partita"
            championshipLabel={currentChampionship.label}
            endpoint="Partita"
            championshipId={selectedId}
            height={350}
          />
        )}

        {activeTab === 'prossima' && (
          <TuttocampoFrame
            title="Prossima Partita"
            championshipLabel={currentChampionship.label}
            endpoint="ProssimaPartita"
            championshipId={selectedId}
            height={350}
          />
        )}
      </div>
    </section>
  );
};

export default TuttocampoWidgets;
