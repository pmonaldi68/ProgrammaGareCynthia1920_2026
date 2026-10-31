import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale/it';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Partita } from '../types';
import { parseMatchDateTime } from '../utils/calendarUtils';
import { formatMatchDateAndDay } from '../utils/dateFormatter';
import { MatchCard } from './MatchCard';
import {
  CalendarDays,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

const locales = {
  it,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface MatchCalendarViewProps {
  partite: Partita[];
}

interface CalendarMatchEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  partita: Partita;
}

const italianMessages = {
  allDay: 'Tutto il giorno',
  previous: 'Prec',
  next: 'Succ',
  today: 'Oggi',
  month: 'Mese',
  week: 'Settimana',
  day: 'Giorno',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Orario',
  event: 'Partita',
  noEventsInRange: 'Nessuna gara in programma in questo periodo.',
  showMore: (total: number) => `+ Altre ${total} gare`,
};

export const MatchCalendarView: React.FC<MatchCalendarViewProps> = ({ partite }) => {
  // Converti tutte le partite in eventi del calendario
  const events: CalendarMatchEvent[] = useMemo(() => {
    return partite.map((p) => {
      const { start, end } = parseMatchDateTime(p.data, p.ora);
      const title = `${p.ora ? `${p.ora} • ` : ''}${p.campionato}: ${p.squadraCasa} vs ${p.squadraOspite}`;
      return {
        id: p.id,
        title,
        start,
        end,
        allDay: false,
        partita: p,
      };
    });
  }, [partite]);

  // Calcola la data iniziale: la data della prima partita se presente, altrimenti la data odierna
  const initialDate = useMemo(() => {
    if (events.length > 0) {
      // Ordina per data per trovare la più vicina
      const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
      const now = new Date();
      // Trova la prima partita >= a oggi o la prima in assoluto
      const upcoming = sorted.find((e) => e.start.getTime() >= now.getTime() - 24 * 60 * 60 * 1000);
      return upcoming ? upcoming.start : sorted[0].start;
    }
    return new Date();
  }, [events]);

  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedPartita, setSelectedPartita] = useState<Partita | null>(null);

  // Trova le partite del giorno selezionato
  const dayMatches = useMemo(() => {
    if (!selectedDay) return [];
    return partite.filter((p) => {
      const { start } = parseMatchDateTime(p.data, p.ora);
      return isSameDay(start, selectedDay);
    });
  }, [selectedDay, partite]);

  // Gestione stile eventi colorati per Cynthia, Don Bosco, ecc.
  const eventPropGetter = (event: CalendarMatchEvent) => {
    const p = event.partita;
    let bg = '#0284c7'; // default sky-600

    const isDonBosco =
      p.squadraCasa.toUpperCase().includes('DON BOSCO') ||
      p.squadraOspite.toUpperCase().includes('DON BOSCO') ||
      (p.societa && p.societa.toUpperCase().includes('DON BOSCO'));

    if (isDonBosco) {
      bg = '#d97706'; // amber-600 (Gialloblù Don Bosco)
    } else if (p.isCynthiaCasa) {
      bg = '#0369a1'; // sky-700 (Cynthia in Casa)
    } else if (p.isCynthiaOspite) {
      bg = '#0284c7'; // sky-600 (Cynthia Trasferta)
    }

    return {
      style: {
        backgroundColor: bg,
        borderRadius: '6px',
        color: '#ffffff',
        border: 'none',
        fontSize: '0.75rem',
        fontWeight: '600',
        padding: '2px 5px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
        cursor: 'pointer',
      },
    };
  };

  // Navigazione
  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setCurrentView(newView);
  };

  // Click su un evento specifico: apri sia il giorno che il dettaglio partita
  const handleSelectEvent = (event: CalendarMatchEvent) => {
    setSelectedDay(event.start);
    setSelectedPartita(event.partita);
  };

  // Click su uno slot di giorno/ora
  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedDay(slotInfo.start);
    setSelectedPartita(null);
  };

  return (
    <div id="match-calendar-container" className="space-y-4">
      {/* Barra Informativa Calendario & Controlli Rapidi */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-xs">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Calendario Gare Interattivo</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                {events.length} {events.length === 1 ? 'Gara' : 'Gare'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clicca su una casella o su una gara per visualizzare formazioni, orari, campo e dettagli completi
            </p>
          </div>
        </div>

        {/* Legenda Colori */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0369a1]" />
            <span>Cynthia (Casa)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
            <span>Cynthia (Trasferta)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
            <span>Don Bosco</span>
          </span>
        </div>
      </div>

      {/* Box Principale Calendario React-Big-Calendar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 sm:p-5 shadow-xs overflow-hidden">
        <div className="h-[620px] sm:h-[720px] w-full text-slate-800 dark:text-slate-100">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            culture="it"
            messages={italianMessages}
            view={currentView}
            onView={handleViewChange}
            date={currentDate}
            onNavigate={handleNavigate}
            eventPropGetter={eventPropGetter}
            selectable
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            popup
          />
        </div>
      </div>

      {/* Modale / Dettaglio Giorno Selezionato */}
      {selectedDay && (
        <div
          id="calendar-day-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            setSelectedDay(null);
            setSelectedPartita(null);
          }}
        >
          <div
            id="calendar-day-modal"
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Finestra Dettaglio Giorno */}
            <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-sky-700 dark:from-slate-950 dark:via-sky-950 dark:to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-white/10 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 border border-white/20">
                  <CalendarIcon className="w-5 h-5 text-sky-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg leading-tight capitalize">
                    {format(selectedDay, 'EEEE d MMMM yyyy', { locale: it })}
                  </h3>
                  <p className="text-xs text-sky-200/80">
                    {dayMatches.length === 0
                      ? 'Nessuna partita programmata'
                      : dayMatches.length === 1
                      ? '1 partita in programma'
                      : `${dayMatches.length} partite in programma`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(null);
                  setSelectedPartita(null);
                }}
                className="p-2 rounded-xl text-sky-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Chiudi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenuto Scrollabile con le Schede Gare del Giorno */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {dayMatches.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                    Nessuna gara in questa data
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Non risultano partite da disputare per la giornata selezionata. Clicca sulle caselle del calendario contrassegnate con le etichette azzurre o dorate.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dayMatches.map((partita) => (
                    <div
                      key={partita.id}
                      className={`transition-all ${
                        selectedPartita?.id === partita.id
                          ? 'ring-2 ring-sky-500 rounded-2xl shadow-md'
                          : ''
                      }`}
                    >
                      <MatchCard partita={partita} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Modale */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
              <span>ASD Cynthia 1920 • Stagione 2026/2027</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(null);
                  setSelectedPartita(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-slate-800 dark:text-white transition cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
