import React, { useState, useEffect, useRef } from 'react';
import { Partita } from '../types';
import {
  TabellinoData,
  TabellinoEvento,
  MatchPeriod,
  EventoType,
  loadTabellino,
  saveTabellino,
  resetTabellino,
  buildWhatsAppTabellino,
  formatStatoGara,
} from '../services/tabellinoService';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Clock,
  Award,
  FileText,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

interface TabellinoModalProps {
  isOpen: boolean;
  onClose: () => void;
  partite: Partita[];
  initialPartita?: Partita | null;
}

export const TabellinoModal: React.FC<TabellinoModalProps> = ({
  isOpen,
  onClose,
  partite,
  initialPartita,
}) => {
  const [selectedPartitaId, setSelectedPartitaId] = useState<string>('');
  const [tabellino, setTabellino] = useState<TabellinoData | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'scoreboard' | 'events' | 'preview'>('scoreboard');

  // Stato per l'inserimento rapido di un nuovo evento
  const [newEventoType, setNewEventoType] = useState<EventoType>('gol');
  const [newEventoSquadra, setNewEventoSquadra] = useState<'casa' | 'ospite'>('casa');
  const [newEventoMinuto, setNewEventoMinuto] = useState<number>(1);
  const [newEventoGiocatore, setNewEventoGiocatore] = useState<string>('');
  const [newEventoDettaglio, setNewEventoDettaglio] = useState<string>('');

  // Timer interval ref
  const timerRef = useRef<number | null>(null);

  // Inizializzazione partita
  useEffect(() => {
    if (!isOpen) return;

    if (initialPartita) {
      setSelectedPartitaId(initialPartita.id);
      setTabellino(loadTabellino(initialPartita));
    } else if (partite.length > 0 && !selectedPartitaId) {
      setSelectedPartitaId(partite[0].id);
      setTabellino(loadTabellino(partite[0]));
    }
  }, [isOpen, initialPartita, partite]);

  // Cambio partita dal selettore
  const handleSelectPartita = (pId: string) => {
    const target = partite.find(p => p.id === pId);
    if (target) {
      setSelectedPartitaId(pId);
      setTabellino(loadTabellino(target));
    }
  };

  // Timer in esecuzione per la diretta
  useEffect(() => {
    if (tabellino && tabellino.timerAttivo) {
      timerRef.current = window.setInterval(() => {
        setTabellino(prev => {
          if (!prev || !prev.timerAttivo) return prev;
          const updated = {
            ...prev,
            minutoCorrente: prev.minutoCorrente + 1,
          };
          saveTabellino(updated);
          return updated;
        });
      }, 60000); // Incrementa ogni 60 secondi
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [tabellino?.timerAttivo]);

  if (!isOpen || !tabellino) return null;

  const currentPartita = partite.find(p => p.id === selectedPartitaId) || partite[0];

  // Modifica Gol Casa
  const updateGolCasa = (delta: number) => {
    setTabellino(prev => {
      if (!prev) return prev;
      const nextGol = Math.max(0, prev.golCasa + delta);
      const updated = { ...prev, golCasa: nextGol };
      saveTabellino(updated);
      return updated;
    });
  };

  // Modifica Gol Ospite
  const updateGolOspite = (delta: number) => {
    setTabellino(prev => {
      if (!prev) return prev;
      const nextGol = Math.max(0, prev.golOspite + delta);
      const updated = { ...prev, golOspite: nextGol };
      saveTabellino(updated);
      return updated;
    });
  };

  // Modifica Stato Partita
  const setStato = (stato: MatchPeriod) => {
    setTabellino(prev => {
      if (!prev) return prev;
      let timerAttivo = prev.timerAttivo;
      let min = prev.minutoCorrente;

      if (stato === 'primo_tempo' && min === 0) {
        min = 1;
        timerAttivo = true;
      } else if (stato === 'intervallo') {
        min = 45;
        timerAttivo = false;
      } else if (stato === 'secondo_tempo' && min < 46) {
        min = 46;
        timerAttivo = true;
      } else if (stato === 'terminata') {
        timerAttivo = false;
      }

      const updated = { ...prev, stato, timerAttivo, minutoCorrente: min };
      saveTabellino(updated);
      return updated;
    });
  };

  // Toggle Timer
  const toggleTimer = () => {
    setTabellino(prev => {
      if (!prev) return prev;
      const updated = { ...prev, timerAttivo: !prev.timerAttivo };
      saveTabellino(updated);
      return updated;
    });
  };

  // Imposta minuto manualmente
  const setMinuto = (newMin: number) => {
    setTabellino(prev => {
      if (!prev) return prev;
      const val = Math.max(0, Math.min(130, newMin));
      const updated = { ...prev, minutoCorrente: val };
      saveTabellino(updated);
      return updated;
    });
  };

  // Aggiungi Evento (Gol, Ammonizione, Espulsione, Cambio)
  const handleAddEvento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventoGiocatore.trim()) return;

    const periodo: TabellinoEvento['periodo'] =
      newEventoMinuto <= 45 ? '1T' : newEventoMinuto <= 90 ? '2T' : 'SUPP';

    const newEv: TabellinoEvento = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      minuto: newEventoMinuto,
      periodo,
      tipo: newEventoType,
      squadra: newEventoSquadra,
      giocatore: newEventoGiocatore.trim(),
      dettaglio: newEventoDettaglio.trim() || undefined,
      timestamp: Date.now(),
    };

    setTabellino(prev => {
      if (!prev) return prev;
      let golCasa = prev.golCasa;
      let golOspite = prev.golOspite;

      // Se l'evento è un gol, incrementa automaticamente il punteggio
      if (newEventoType === 'gol') {
        if (newEventoSquadra === 'casa') {
          golCasa += 1;
        } else {
          golOspite += 1;
        }
      }

      const updated: TabellinoData = {
        ...prev,
        golCasa,
        golOspite,
        eventi: [...prev.eventi, newEv].sort((a, b) => a.minuto - b.minuto),
      };
      saveTabellino(updated);
      return updated;
    });

    // Reset input giocatore e dettaglio, mantieni minuto aggiornato
    setNewEventoGiocatore('');
    setNewEventoDettaglio('');
  };

  // Rimuovi evento
  const handleRemoveEvento = (id: string) => {
    setTabellino(prev => {
      if (!prev) return prev;
      const evToRemove = prev.eventi.find(e => e.id === id);
      let golCasa = prev.golCasa;
      let golOspite = prev.golOspite;

      if (evToRemove && evToRemove.tipo === 'gol') {
        if (evToRemove.squadra === 'casa') {
          golCasa = Math.max(0, golCasa - 1);
        } else {
          golOspite = Math.max(0, golOspite - 1);
        }
      }

      const updated = {
        ...prev,
        golCasa,
        golOspite,
        eventi: prev.eventi.filter(e => e.id !== id),
      };
      saveTabellino(updated);
      return updated;
    });
  };

  // Reset tabellino
  const handleReset = () => {
    if (window.confirm('Sei sicuro di voler azzerare il punteggio e gli eventi registrati per questa partita?')) {
      const reset = resetTabellino(currentPartita);
      setTabellino(reset);
    }
  };

  // Testo WhatsApp
  const whatsAppText = buildWhatsAppTabellino(tabellino);

  const handleCopyText = () => {
    navigator.clipboard.writeText(whatsAppText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleOpenWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-cyan-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-sky-800/60">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-white/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Tabellino Gara & Diretta Live
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Live Match
                </span>
              </div>
              <p className="text-xs text-sky-200/80">
                Punteggio in tempo reale, cronometro, marcatori e invio WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selettore Partita & Navigazione Tab */}
        <div className="bg-slate-50 dark:bg-slate-850 px-5 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Partita:
            </span>
            <div className="relative flex-1">
              <select
                value={selectedPartitaId}
                onChange={e => handleSelectPartita(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 pr-8 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none truncate"
              >
                {partite.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.campionato} • {p.squadraCasa} vs {p.squadraOspite} ({p.data} ore {p.ora})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('scoreboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'scoreboard'
                  ? 'bg-white dark:bg-slate-700 text-sky-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ⚽ Quadro Gara
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'events'
                  ? 'bg-white dark:bg-slate-700 text-sky-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Marcatori & Eventi</span>
              {tabellino.eventi.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {tabellino.eventi.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-700 text-sky-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              💬 Anteprima WhatsApp
            </button>
          </div>
        </div>

        {/* Contenuto Scrollabile */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          {activeTab === 'scoreboard' && (
            <>
              {/* Quadro Punteggio Principale (Tabellone Elettronico) */}
              <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-sky-900/60 relative overflow-hidden">
                <div className="text-center pb-3 border-b border-white/10 mb-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
                    {tabellino.campionato} {tabellino.girone && tabellino.girone !== '#' ? `• Girone ${tabellino.girone}` : ''}
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    📍 {tabellino.campo} ({tabellino.comune})
                  </span>
                </div>

                {/* Squadre e Gol */}
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                  {/* Squadra Casa */}
                  <div className="md:col-span-3 text-center md:text-left flex flex-col items-center md:items-start">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-1">
                      {tabellino.isCynthiaCasa ? '🔵⚪ CYNTHIA 1920 (CASA)' : 'CASA'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate max-w-full">
                      {tabellino.squadraCasa}
                    </h3>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => updateGolCasa(-1)}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center font-bold text-lg"
                        title="Riduci gol"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => updateGolCasa(1)}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white flex items-center gap-1.5 font-bold text-xs shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Gol Casa
                      </button>
                    </div>
                  </div>

                  {/* Display Punteggio Centrale */}
                  <div className="md:col-span-1 text-center py-2">
                    <div className="inline-flex items-center justify-center gap-2 sm:gap-3 bg-black/40 px-5 py-2.5 rounded-2xl border border-white/10 shadow-inner">
                      <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-amber-400">
                        {tabellino.golCasa}
                      </span>
                      <span className="text-2xl font-black text-slate-500">-</span>
                      <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-amber-400">
                        {tabellino.golOspite}
                      </span>
                    </div>
                    <div className="mt-2 font-mono text-xs font-bold text-sky-300 flex items-center justify-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{formatStatoGara(tabellino.stato, tabellino.minutoCorrente)}</span>
                    </div>
                  </div>

                  {/* Squadra Ospite */}
                  <div className="md:col-span-3 text-center md:text-right flex flex-col items-center md:items-end">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-1">
                      {tabellino.isCynthiaOspite ? '🔵⚪ CYNTHIA 1920 (OSPITE)' : 'OSPITE'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate max-w-full">
                      {tabellino.squadraOspite}
                    </h3>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => updateGolOspite(1)}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white flex items-center gap-1.5 font-bold text-xs shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Gol Ospite
                      </button>
                      <button
                        type="button"
                        onClick={() => updateGolOspite(-1)}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center font-bold text-lg"
                        title="Riduci gol"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controllo Cronometro e Tempi di Gioco */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selettore Periodo Partita */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    Periodo di Gioco
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setStato('non_iniziata')}
                      className={`py-2 px-2 rounded-lg border transition ${
                        tabellino.stato === 'non_iniziata'
                          ? 'bg-slate-800 text-white border-slate-800 dark:bg-sky-600 dark:border-sky-600'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Pre-Gara
                    </button>
                    <button
                      type="button"
                      onClick={() => setStato('primo_tempo')}
                      className={`py-2 px-2 rounded-lg border transition ${
                        tabellino.stato === 'primo_tempo'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      1° Tempo
                    </button>
                    <button
                      type="button"
                      onClick={() => setStato('intervallo')}
                      className={`py-2 px-2 rounded-lg border transition ${
                        tabellino.stato === 'intervallo'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Intervallo
                    </button>
                    <button
                      type="button"
                      onClick={() => setStato('secondo_tempo')}
                      className={`py-2 px-2 rounded-lg border transition ${
                        tabellino.stato === 'secondo_tempo'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      2° Tempo
                    </button>
                    <button
                      type="button"
                      onClick={() => setStato('supplementari')}
                      className={`py-2 px-2 rounded-lg border transition ${
                        tabellino.stato === 'supplementari'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Suppl.
                    </button>
                    <button
                      type="button"
                      onClick={() => setStato('terminata')}
                      className={`py-2 px-2 rounded-lg border transition ${
                        tabellino.stato === 'terminata'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Finale 🏁
                    </button>
                  </div>
                </div>

                {/* Cronometro Interattivo */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Minuto di Gara
                    </h4>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {tabellino.timerAttivo ? '⏱️ Cronometro in marcia' : '⏸️ In pausa'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleTimer}
                      className={`p-3 rounded-xl font-bold flex items-center justify-center transition shadow-xs ${
                        tabellino.timerAttivo
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      title={tabellino.timerAttivo ? 'Metti in pausa' : 'Avvia cronometro'}
                    >
                      {tabellino.timerAttivo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>

                    <div className="flex items-center gap-2 flex-1">
                      <button
                        type="button"
                        onClick={() => setMinuto(tabellino.minutoCorrente - 5)}
                        className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="-5 minuti"
                      >
                        -5'
                      </button>
                      <button
                        type="button"
                        onClick={() => setMinuto(tabellino.minutoCorrente - 1)}
                        className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="-1 minuto"
                      >
                        -1'
                      </button>
                      <div className="flex-1 text-center font-mono font-black text-2xl text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        {tabellino.minutoCorrente}'
                      </div>
                      <button
                        type="button"
                        onClick={() => setMinuto(tabellino.minutoCorrente + 1)}
                        className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="+1 minuto"
                      >
                        +1'
                      </button>
                      <button
                        type="button"
                        onClick={() => setMinuto(tabellino.minutoCorrente + 5)}
                        className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="+5 minuti"
                      >
                        +5'
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note Staff & Migliore in campo */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      Migliore in Campo (opzionale):
                    </label>
                    <input
                      type="text"
                      value={tabellino.miglioreInCampo || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setTabellino(prev => {
                          if (!prev) return prev;
                          const up = { ...prev, miglioreInCampo: val };
                          saveTabellino(up);
                          return up;
                        });
                      }}
                      placeholder="Es. Marco Rossi (parate decisive)"
                      className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-sky-500" />
                      Note Gara / Commento Staff:
                    </label>
                    <input
                      type="text"
                      value={tabellino.noteStaff || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setTabellino(prev => {
                          if (!prev) return prev;
                          const up = { ...prev, noteStaff: val };
                          saveTabellino(up);
                          return up;
                        });
                      }}
                      placeholder="Es. Ottima prestazione corale nel secondo tempo"
                      className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tab 2: Marcatori & Eventi */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* Form Aggiunta Rapida Evento */}
              <form
                onSubmit={handleAddEvento}
                className="bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl p-4 sm:p-5 border border-sky-200 dark:border-sky-800/80 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-sky-950 dark:text-sky-100 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-sky-600" />
                    Registra Nuovo Evento di Gara
                  </h4>
                  <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
                    Minuto attuale: {tabellino.minutoCorrente}'
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewEventoType('gol');
                      setNewEventoMinuto(tabellino.minutoCorrente || 1);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      newEventoType === 'gol'
                        ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>⚽ Gol</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewEventoType('ammonizione');
                      setNewEventoMinuto(tabellino.minutoCorrente || 1);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      newEventoType === 'ammonizione'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>🟨 Ammonizione</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewEventoType('espulsione');
                      setNewEventoMinuto(tabellino.minutoCorrente || 1);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      newEventoType === 'espulsione'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>🟥 Espulsione</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewEventoType('sostituzione');
                      setNewEventoMinuto(tabellino.minutoCorrente || 1);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      newEventoType === 'sostituzione'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>🔄 Sostituzione</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* Squadra */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Squadra
                    </label>
                    <select
                      value={newEventoSquadra}
                      onChange={e => setNewEventoSquadra(e.target.value as 'casa' | 'ospite')}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    >
                      <option value="casa">Casa ({tabellino.squadraCasa})</option>
                      <option value="ospite">Ospite ({tabellino.squadraOspite})</option>
                    </select>
                  </div>

                  {/* Minuto */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Minuto
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={130}
                      value={newEventoMinuto}
                      onChange={e => setNewEventoMinuto(parseInt(e.target.value, 10) || 1)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  {/* Nome Calciatore */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Calciatore
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nome e Cognome calciatore"
                      value={newEventoGiocatore}
                      onChange={e => setNewEventoGiocatore(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                {/* Dettagli Opzionali */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      placeholder={
                        newEventoType === 'gol'
                          ? 'Dettaglio opzionale (es. Rigore, Di testa, Punizione)'
                          : newEventoType === 'sostituzione'
                          ? 'Dettaglio cambio (es. Esce Bianchi, entra Rossi)'
                          : 'Dettagli o motivo cartellino'
                      }
                      value={newEventoDettaglio}
                      onChange={e => setNewEventoDettaglio(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-700 hover:bg-sky-800 active:scale-95 text-white transition shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Aggiungi a Tabellino
                  </button>
                </div>
              </form>

              {/* Elenco Eventi Registrati */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>Timeline Eventi ({tabellino.eventi.length})</span>
                  {tabellino.eventi.length > 0 && (
                    <span className="text-xs font-normal text-slate-500">
                      I gol registrati aggiornano automaticamente il punteggio
                    </span>
                  )}
                </h4>

                {tabellino.eventi.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500">
                    Nessun evento ancora registrato. Usa il modulo sopra per inserire gol, cartellini e cambi.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
                    {tabellino.eventi.map(ev => {
                      const sqName = ev.squadra === 'casa' ? tabellino.squadraCasa : tabellino.squadraOspite;
                      return (
                        <div
                          key={ev.id}
                          className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-10 text-center font-mono font-black text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex-shrink-0">
                              {ev.minuto}'
                            </span>

                            <span className="text-lg flex-shrink-0">
                              {ev.tipo === 'gol' && '⚽'}
                              {ev.tipo === 'ammonizione' && '🟨'}
                              {ev.tipo === 'espulsione' && '🟥'}
                              {ev.tipo === 'sostituzione' && '🔄'}
                              {ev.tipo === 'nota' && '📝'}
                            </span>

                            <div className="min-w-0">
                              <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                                {ev.giocatore}{' '}
                                {ev.dettaglio && (
                                  <span className="text-xs font-normal text-slate-500">
                                    ({ev.dettaglio})
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {sqName} • {ev.periodo}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveEvento(ev.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex-shrink-0"
                            title="Elimina evento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Anteprima WhatsApp */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-center gap-2 mb-2 text-emerald-900 dark:text-emerald-200 font-extrabold text-sm">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Messaggio Generato per WhatsApp
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  Pronto per essere condiviso nella chat del gruppo squadra, ai genitori o sui social.
                </p>
              </div>

              <div className="bg-slate-900 text-emerald-300 p-4 sm:p-5 rounded-2xl font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800 select-all max-h-[360px] overflow-y-auto">
                {whatsAppText}
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal con Azioni Primarie */}
        <div className="bg-slate-50 dark:bg-slate-850 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-1.5"
              title="Azzera tabellino partita"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Azzera Dati</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Copia Testo */}
            <button
              type="button"
              onClick={handleCopyText}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition flex items-center gap-1.5 shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copiato!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copia Testo</span>
                </>
              )}
            </button>

            {/* Invia su WhatsApp */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition shadow-sm flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Invia su WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
