import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay, isSameMonth } from 'date-fns';
import { it } from 'date-fns/locale/it';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Partita } from '../types';
import { parseMatchDateTime } from '../utils/calendarUtils';
import { MatchCard } from './MatchCard';
import { MatchDetailModal } from './MatchDetailModal';
import {
  CalendarDays,
  Calendar as CalendarIcon,
  X,
  Eye,
  Compass,
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

// Componente personalizzato per rendere le gare nelle caselle del calendario
const CustomCalendarEvent: React.FC<{ event: CalendarMatchEvent }> = ({ event }) => {
  const p = event.partita;
  const locCode = p.isCynthiaCasa ? 'C' : p.isCynthiaOspite ? 'T' : '';

  return (
    <div
      className="flex items-center gap-1 overflow-hidden text-left py-0.5 select-none w-full"
      title={`${p.ora ? `${p.ora} · ` : ''}${p.campionato} (${p.isCynthiaCasa ? 'Casa' : 'Trasferta'}): ${p.squadraCasa} vs ${p.squadraOspite} — ${p.campo}`}
    >
      {p.ora && (
        <span className="font-mono text-[9.5px] bg-black/25 px-1 py-0.5 rounded shrink-0 font-bold tracking-tight tabular-nums">
          {p.ora}
        </span>
      )}
      {locCode && (
        <span
          className={`text-[9px] font-black px-1 py-0.5 rounded shrink-0 leading-none ${
            p.isCynthiaCasa
              ? 'bg-amber-400 text-sky-950'
              : 'bg-white/20 text-white'
          }`}
        >
          {locCode}
        </span>
      )}
      <span className="truncate font-bold text-[11px] leading-tight">
        {p.squadraCasa} vs {p.squadraOspite}
      </span>
    </div>
  );
};

export const MatchCalendarView: React.FC<MatchCalendarViewProps> = ({ partite }) => {
  // Converti tutte le partite in eventi del calendario
  const events: CalendarMatchEvent[] = useMemo(() => {
    return partite.map((p) => {
      const { start, end } = parseMatchDateTime(p.data, p.ora);
      const title = `${p.ora ? `${p.ora} · ` : ''}${p.campionato}: ${p.squadraCasa} vs ${p.squadraOspite}`;
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

  // Calcola la data iniziale: la data della prossima partita o la prima disponibile
  const initialDate = useMemo(() => {
    if (events.length > 0) {
      const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
      const now = new Date();
      const upcoming = sorted.find((e) => e.start.getTime() >= now.getTime() - 24 * 60 * 60 * 1000);
      return upcoming ? upcoming.start : sorted[0].start;
    }
    return new Date();
  }, [events]);

  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedPartita, setSelectedPartita] = useState<Partita | null>(null);

  // Quando cambiano i filtri o arrivano dati dal foglio, posiziona il mese su un periodo con partite se il mese corrente è vuoto
  useEffect(() => {
    if (events.length === 0) return;
    const hasMatchesInCurrentMonth = events.some((e) => isSameMonth(e.start, currentDate));
    if (!hasMatchesInCurrentMonth) {
      setCurrentDate(initialDate);
    }
  }, [events, initialDate]);

  const monthMatchCount = useMemo(() => {
    return events.filter((e) => isSameMonth(e.start, currentDate)).length;
  }, [events, currentDate]);

  // Trova le partite del giorno selezionato
  const dayMatches = useMemo(() => {
    if (!selectedDay) return [];
    return partite.filter((p) => {
      const { start } = parseMatchDateTime(p.data, p.ora);
      return isSameDay(start, selectedDay);
    });
  }, [selectedDay, partite]);

  // Gestione stile eventi colorati per Cynthia Casa (con dettaglio oro), Trasferta e Don Bosco
  const eventPropGetter = (event: CalendarMatchEvent) => {
    const p = event.partita;
    let bg = '#0284c7'; // default sky-600
    let border = '1px solid #0369a1';

    const isDonBosco =
      p.squadraCasa.toUpperCase().includes('DON BOSCO') ||
      p.squadraOspite.toUpperCase().includes('DON BOSCO') ||
      (p.societa && p.societa.toUpperCase().includes('DON BOSCO'));

    if (isDonBosco) {
      bg = '#d97706'; // amber-600
      border = '1px solid #b45309';
    } else if (p.isCynthiaCasa) {
      bg = '#0369a1'; // sky-700 (Cynthia in Casa)
      border = '1px solid #f59e0b'; // dettaglio Oro
    } else if (p.isCynthiaOspite) {
      bg = '#0284c7'; // sky-600 (Cynthia Trasferta)
      border = '1px solid #0ea5e9';
    }

    return {
      style: {
        backgroundColor: bg,
        borderRadius: '6px',
        color: '#ffffff',
        border,
        fontSize: '0.75rem',
        fontWeight: '600',
        padding: '2px 5px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
        cursor: 'pointer',
      },
    };
  };

  // Navigazione calendario
  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setCurrentView(newView);
  };

  // Click su un evento specifico: apri direttamente la modale di dettaglio completo
  const handleSelectEvent = (event: CalendarMatchEvent) => {
    setSelectedPartita(event.partita);
  };

  // Click su una casella/slot del giorno
  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    const matchesOnSlot = partite.filter((p) => {
      const { start } = parseMatchDateTime(p.data, p.ora);
      return isSameDay(start, slotInfo.start);
    });

    if (matchesOnSlot.length === 1) {
      setSelectedPartita(matchesOnSlot[0]);
    } else {
      setSelectedDay(slotInfo.start);
    }
  };

  return (
    <div id="match-calendar-container" className="space-y-4">
      {/* Barra Informativa Calendario Mensile & Controlli Rapidi */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-700 text-white border border-amber-400/60 shadow-2xs shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
              Calendario Mensile Gare
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {monthMatchCount} {monthMatchCount === 1 ? 'gara' : 'gare'} in{' '}
              <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
                {format(currentDate, 'MMMM yyyy', { locale: it })}
              </span>
              {' · '}
              {events.length} totali · Clicca su una partita per mappa, orario e dettagli
            </p>
          </div>
        </div>

        {/* Legenda Colori Pulita + Pulsante Salta al Mese con Gare */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {events.length > 0 && monthMatchCount === 0 && (
            <button
              type="button"
              onClick={() => setCurrentDate(initialDate)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="capitalize">
                Vai a {format(initialDate, 'MMMM yyyy', { locale: it })}
              </span>
            </button>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#0369a1] border border-amber-400 shrink-0" />
            <span>Casa (C)</span>
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#0284c7] shrink-0" />
            <span>Trasferta (T)</span>
          </span>
        </div>
      </div>

      {/* Box Principale Calendario Mensile React-Big-Calendar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 sm:p-5 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto thin-scrollbar">
          <div className="min-w-[660px] md:min-w-0 h-[620px] sm:h-[720px] w-full text-slate-800 dark:text-slate-100">
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
              components={{
                event: CustomCalendarEvent,
              }}
              selectable
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
              popup
            />
          </div>
        </div>
      </div>

      {/* 1. Modale Dettagli Completi Partita (Click Diretto su Partita) */}
      <MatchDetailModal
        partita={selectedPartita}
        isOpen={Boolean(selectedPartita)}
        onClose={() => setSelectedPartita(null)}
      />

      {/* 2. Modale Elenco Gare del Giorno (Click su casella vuota o con più partite) */}
      {selectedDay && !selectedPartita && (
        <div
          id="calendar-day-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedDay(null)}
        >
          <div
            id="calendar-day-modal"
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150"
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
                onClick={() => setSelectedDay(null)}
                className="p-2 rounded-xl text-sky-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Chiudi finestra"
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
                    Non risultano partite da disputare per la giornata selezionata. Clicca sulle caselle del calendario con etichette colorate per visualizzare le partite.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dayMatches.map((partita) => (
                    <div key={partita.id} className="space-y-2">
                      <MatchCard partita={partita} />
                      <button
                        type="button"
                        onClick={() => setSelectedPartita(partita)}
                        className="w-full py-2 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visualizza Scheda Dettagliata & Mappa Campo</span>
                      </button>
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
                onClick={() => setSelectedDay(null)}
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
