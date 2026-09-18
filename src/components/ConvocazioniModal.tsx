import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Copy,
  Check,
  Share2,
  Users,
  Calendar,
  Clock,
  MapPin,
  FileSpreadsheet,
  RefreshCw,
  Info,
  UserPlus,
  Trash2,
  Shield,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  Sparkles,
  Clipboard,
  RotateCcw,
  Edit3,
} from 'lucide-react';
import { Partita, GiocatoreConvocato, ConvocazioneConfig } from '../types';
import { APP_CONFIG } from '../appConfig';
import {
  DEFAULT_SAMPLE_PLAYERS,
  DEFAULT_STAFF_BY_CATEGORY,
  DEFAULT_CONVOCAZIONI_SHEET_ID,
  DEFAULT_CONVOCAZIONI_SHEET_URL,
  loadConvocazioniConfig,
  saveConvocazioniConfig,
  loadCachedGiocatori,
  saveCachedGiocatori,
  loadCachedStaff,
  saveCachedStaff,
  fetchGiocatoriFromSheet,
  findMatchingCategory,
  isCategoryMatch,
  buildWhatsAppConvocazioniMessage,
  calculateRitrovoFromOraGara,
} from '../services/convocazioniService';

interface ConvocazioniModalProps {
  isOpen: boolean;
  onClose: () => void;
  partite: Partita[];
}

export const ConvocazioniModal: React.FC<ConvocazioniModalProps> = ({
  isOpen,
  onClose,
  partite,
}) => {
  // Configurazione Foglio Google Convocati
  const [config, setConfig] = useState<ConvocazioneConfig>(loadConvocazioniConfig);
  const [isFetchingSheet, setIsFetchingSheet] = useState<boolean>(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [sheetSuccess, setSheetSuccess] = useState<string | null>(null);
  const [showSheetGuide, setShowSheetGuide] = useState<boolean>(false);

  // Giocatori e Staff per categoria
  const [giocatori, setGiocatori] = useState<GiocatoreConvocato[]>(() => {
    return loadCachedGiocatori() || DEFAULT_SAMPLE_PLAYERS;
  });
  const [staffMap, setStaffMap] = useState<Record<string, string>>(() => {
    return loadCachedStaff();
  });

  // Partita selezionata
  const [selectedPartitaId, setSelectedPartitaId] = useState<string>(() => {
    return partite.length > 0 ? partite[0].id : '';
  });

  // Campi personalizzabili della convocazione
  const [categoriaCustom, setCategoriaCustom] = useState<string>('');
  const [squadraCasaCustom, setSquadraCasaCustom] = useState<string>('');
  const [squadraOspiteCustom, setSquadraOspiteCustom] = useState<string>('');
  const [dataGaraCustom, setDataGaraCustom] = useState<string>('');
  const [oraGaraCustom, setOraGaraCustom] = useState<string>('');
  const [oraRitrovo, setOraRitrovo] = useState<string>('14:30 allo Stadio Abbatini');
  const [campoCustom, setCampoCustom] = useState<string>('');
  const [indirizzoCustom, setIndirizzoCustom] = useState<string>('');
  const [linkMapsCustom, setLinkMapsCustom] = useState<string>('');
  const [noteMister, setNoteMister] = useState<string>(
    'Portare documento di riconoscimento in corso di validità, divisa di rappresentanza e parastinchi. Massima puntualità!'
  );
  const [misterName, setMisterName] = useState<string>('Mister Simone Corradini');

  // Filtri elenco giocatori
  const [searchPlayer, setSearchPlayer] = useState<string>('');
  const [filterRuolo, setFilterRuolo] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('AUTO');
  const [isAddingPlayer, setIsAddingPlayer] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerRuolo, setNewPlayerRuolo] = useState<string>('');
  const [newPlayerNumero, setNewPlayerNumero] = useState<string>('');
  const [newPlayerCategoria, setNewPlayerCategoria] = useState<string>('');

  // Stato copia
  const [copied, setCopied] = useState<boolean>(false);

  // Stato anteprima testo WhatsApp modificabile manualmente
  const [editedWhatsAppText, setEditedWhatsAppText] = useState<string | null>(null);

  // Categorie disponibili tra tutti i giocatori registrati
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    giocatori.forEach((g) => {
      if (g.categoria && g.categoria.trim()) {
        set.add(g.categoria.trim());
      }
    });
    return Array.from(set);
  }, [giocatori]);

  // Partita corrente
  const currentPartita = useMemo(() => {
    return partite.find((m) => m.id === selectedPartitaId) || null;
  }, [partite, selectedPartitaId]);

  // Categoria rilevata per la gara corrente
  const matchedCategory = useMemo(() => {
    const campionato = currentPartita?.campionato || categoriaCustom;
    return findMatchingCategory(campionato, availableCategories);
  }, [currentPartita, categoriaCustom, availableCategories]);

  // Sincronizza campi gara quando cambia la partita selezionata
  useEffect(() => {
    if (!selectedPartitaId) return;
    const p = partite.find((m) => m.id === selectedPartitaId);
    if (p) {
      setCategoriaCustom(p.campionato || '');
      setSquadraCasaCustom(p.squadraCasa || '');
      setSquadraOspiteCustom(p.squadraOspite || '');
      setDataGaraCustom(p.data || '');
      setOraGaraCustom(p.ora || '');
      setCampoCustom(`${p.campo}${p.tipo ? ` (${p.tipo})` : ''}`);
      setIndirizzoCustom(`${p.indirizzo}, ${p.comune}`);
      setLinkMapsCustom(p.lnkMaps !== '#' ? p.lnkMaps : '');

      // Calcola orario ritrovo stimato (90 minuti prima della gara)
      if (p.ora) {
        const calc = calculateRitrovoFromOraGara(p.ora);
        if (calc) {
          setOraRitrovo(calc);
        }
      }

      // Reset modifiche manuali al cambio partita per rigenerare il testo fresco
      setEditedWhatsAppText(null);

      // Rilevamento automatico squadra corrispondente
      const matchCat = findMatchingCategory(p.campionato, availableCategories);
      if (matchCat) {
        // Imposta il Mister per quella squadra se registrato
        if (staffMap[matchCat]) {
          setMisterName(staffMap[matchCat]);
        }

        // Seleziona automaticamente i giocatori di quella squadra e deseleziona le altre
        setGiocatori((prev) => {
          const updated = prev.map((g) => ({
            ...g,
            selezionato: isCategoryMatch(g.categoria || '', matchCat),
          }));
          saveCachedGiocatori(updated);
          return updated;
        });

        // Imposta la vista attiva sulla squadra della partita
        setSelectedCategoryFilter(matchCat);
      }
    }
  }, [selectedPartitaId, partite, availableCategories, staffMap]);

  // Aggiorna staff quando l'utente modifica a mano il nome del Mister
  const handleMisterChange = (name: string) => {
    setMisterName(name);
    if (matchedCategory) {
      const updated = { ...staffMap, [matchedCategory]: name };
      setStaffMap(updated);
      saveCachedStaff(updated);
    }
  };

  // Caricamento da Google Sheet
  const handleFetchSheet = async (overrideUrl?: string, overrideTab?: string) => {
    const rawUrl = overrideUrl !== undefined ? overrideUrl : (config.sheetUrl || DEFAULT_CONVOCAZIONI_SHEET_URL);
    const urlToUse = rawUrl.trim();
    const tabToUse = overrideTab !== undefined ? overrideTab : config.tabName;

    if (!urlToUse) {
      setSheetError('Inserisci l\'URL o l\'ID del foglio Google dei giocatori.');
      return;
    }

    setIsFetchingSheet(true);
    setSheetError(null);
    setSheetSuccess(null);

    try {
      const parsed = await fetchGiocatoriFromSheet(urlToUse, tabToUse);
      if (parsed.giocatori.length === 0) {
        throw new Error('Nessun giocatore trovato nel foglio. Verifica che contenga righe con nomi.');
      }

      setGiocatori(parsed.giocatori);
      saveCachedGiocatori(parsed.giocatori);

      if (Object.keys(parsed.staffByCategoria).length > 0) {
        const mergedStaff = { ...staffMap, ...parsed.staffByCategoria };
        setStaffMap(mergedStaff);
        saveCachedStaff(mergedStaff);

        // Se la gara attuale trova riscontro nel nuovo staff, aggiorna il mister
        const curCat = currentPartita?.campionato || categoriaCustom;
        const matched = findMatchingCategory(curCat, parsed.availableCategories);
        if (matched && mergedStaff[matched]) {
          setMisterName(mergedStaff[matched]);
        }
      }

      const updatedConfig: ConvocazioneConfig = {
        sheetUrl: urlToUse.trim(),
        tabName: tabToUse.trim(),
        lastUpdated: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        staffByCategoria: parsed.staffByCategoria,
      };
      setConfig(updatedConfig);
      saveConvocazioniConfig(updatedConfig);

      setSheetSuccess(
        `Caricati ${parsed.giocatori.length} atleti e ${parsed.availableCategories.length} squadre/rose dal foglio Google!`
      );
    } catch (err: unknown) {
      console.error('Errore importazione convocati:', err);
      const msg = err instanceof Error ? err.message : 'Impossibile scaricare il foglio Google.';
      setSheetError(msg);
    } finally {
      setIsFetchingSheet(false);
    }
  };

  // Carica automaticamente la rosa dal Foglio Google all'apertura se disponibile
  useEffect(() => {
    if (!isOpen) return;
    const targetUrl = config.sheetUrl || DEFAULT_CONVOCAZIONI_SHEET_URL;
    if (targetUrl) {
      handleFetchSheet(targetUrl, config.tabName);
    }
  }, [isOpen]);

  // Toggle selezione singolo atleta
  const togglePlayer = (id: string) => {
    setGiocatori((prev) => {
      const updated = prev.map((g) => (g.id === id ? { ...g, selezionato: !g.selezionato } : g));
      saveCachedGiocatori(updated);
      return updated;
    });
  };

  // Seleziona / Deseleziona solo la categoria visibile o tutti
  const selectAllVisible = (status: boolean) => {
    setGiocatori((prev) => {
      const visibleIds = new Set(filteredGiocatori.map((g) => g.id));
      const updated = prev.map((g) => (visibleIds.has(g.id) ? { ...g, selezionato: status } : g));
      saveCachedGiocatori(updated);
      return updated;
    });
  };

  // Aggiungi giocatore manuale
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const cat = newPlayerCategoria.trim() || matchedCategory || 'Prima Squadra';

    const newG: GiocatoreConvocato = {
      id: `manual_${Date.now()}`,
      nome: newPlayerName.trim(),
      ruolo: newPlayerRuolo.trim().toUpperCase() || undefined,
      numero: newPlayerNumero.trim() || undefined,
      categoria: cat,
      selezionato: true,
    };

    setGiocatori((prev) => {
      const updated = [newG, ...prev];
      saveCachedGiocatori(updated);
      return updated;
    });

    setNewPlayerName('');
    setNewPlayerRuolo('');
    setNewPlayerNumero('');
    setIsAddingPlayer(false);
  };

  // Rimuovi giocatore
  const handleRemovePlayer = (id: string) => {
    setGiocatori((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      saveCachedGiocatori(updated);
      return updated;
    });
  };

  // Generazione del messaggio WhatsApp in tempo reale
  const generatedWhatsAppText = useMemo(() => {
    return buildWhatsAppConvocazioniMessage({
      partita: currentPartita,
      categoriaCustom,
      squadraCasaCustom,
      squadraOspiteCustom,
      dataGaraCustom,
      oraGaraCustom,
      oraRitrovo,
      campoCustom,
      indirizzoCustom,
      linkMapsCustom,
      noteMister,
      misterName,
      giocatori,
      targetCategoria: matchedCategory || categoriaCustom,
    });
  }, [
    currentPartita,
    categoriaCustom,
    squadraCasaCustom,
    squadraOspiteCustom,
    dataGaraCustom,
    oraGaraCustom,
    oraRitrovo,
    campoCustom,
    indirizzoCustom,
    linkMapsCustom,
    noteMister,
    misterName,
    giocatori,
    matchedCategory,
  ]);

  // Testo effettivo: permette modifiche libere nell'anteprima
  const activeWhatsAppText = editedWhatsAppText !== null ? editedWhatsAppText : generatedWhatsAppText;

  // Copia negli appunti
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeWhatsAppText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Clipboard write error', e);
    }
  };

  // Condivisione nativa Web Share API
  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convocazioni ${categoriaCustom || 'ASD Cynthia 1920'}`,
          text: activeWhatsAppText,
        });
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  // Apri WhatsApp
  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(activeWhatsAppText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Conteggio convocati totali e aggregati da altre squadre
  const convocatiCount = useMemo(() => {
    return giocatori.filter((g) => g.selezionato).length;
  }, [giocatori]);

  const convocatiAggregati = useMemo(() => {
    if (!matchedCategory) return [];
    return giocatori.filter(
      (g) => g.selezionato && g.categoria && !isCategoryMatch(g.categoria, matchedCategory)
    );
  }, [giocatori, matchedCategory]);

  // Giocatori filtrati nella lista UI in base a categoria, ruolo e ricerca
  const filteredGiocatori = useMemo(() => {
    return giocatori.filter((g) => {
      // 1. Filtro Categoria
      if (selectedCategoryFilter !== 'ALL') {
        const cat = g.categoria || '';
        if (selectedCategoryFilter === 'AUTO') {
          if (matchedCategory && !isCategoryMatch(cat, matchedCategory)) return false;
        } else if (!isCategoryMatch(cat, selectedCategoryFilter)) {
          return false;
        }
      }

      // 2. Filtro Ricerca
      const matchSearch =
        !searchPlayer.trim() ||
        g.nome.toLowerCase().includes(searchPlayer.toLowerCase()) ||
        (g.ruolo && g.ruolo.toLowerCase().includes(searchPlayer.toLowerCase())) ||
        (g.numero && g.numero.includes(searchPlayer)) ||
        (g.categoria && g.categoria.toLowerCase().includes(searchPlayer.toLowerCase()));

      // 3. Filtro Ruolo
      const matchRuolo =
        filterRuolo === 'ALL' ||
        (g.ruolo && g.ruolo.toUpperCase() === filterRuolo.toUpperCase());

      return matchSearch && matchRuolo;
    });
  }, [giocatori, selectedCategoryFilter, matchedCategory, searchPlayer, filterRuolo]);

  if (!isOpen) return null;

  return (
    <div
      id="convocazioni-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="convocazioni-modal-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 my-auto"
      >
        {/* Header Modal */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-900 via-sky-800 to-cyan-800 dark:from-slate-950 dark:via-sky-950 dark:to-slate-900 text-white flex items-center justify-between border-b border-sky-700/50 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xs">
              <Users className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Convocazioni Gara & Rose Squadre</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Multi-Squadra
                </span>
              </h2>
              <p className="text-xs text-sky-200 dark:text-slate-400">
                Carica la rosa giusta in base alla gara e seleziona atleti aggregati da altre squadre
              </p>
            </div>
          </div>
          <button
            id="btn-close-convocazioni-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body a due colonne */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLONNA SINISTRA: Gara, Foglio Google e Selezione Giocatori (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. SELEZIONE GARA */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  1. Scegli la Gara del Calendario
                </span>
                {matchedCategory && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Rosa: {matchedCategory}
                  </span>
                )}
              </div>

              {partite.length > 0 && (
                <div className="mb-3">
                  <select
                    id="select-convocazioni-partita"
                    value={selectedPartitaId}
                    onChange={(e) => setSelectedPartitaId(e.target.value)}
                    className="w-full text-xs sm:text-sm font-semibold p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    {partite.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.campionato}] {p.squadraCasa} vs {p.squadraOspite} ({p.data} ore {p.ora})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dettagli Ritrovo e Mister */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    Ritrovo (90 min prima della gara):
                  </label>
                  <input
                    type="text"
                    value={oraRitrovo}
                    onChange={(e) => setOraRitrovo(e.target.value)}
                    placeholder="es. 13:30 PRESSO IL CAMPO DI GIUOCO"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-sky-500" />
                    Mister ({matchedCategory || 'Squadra'}):
                  </label>
                  <input
                    type="text"
                    value={misterName}
                    onChange={(e) => handleMisterChange(e.target.value)}
                    placeholder="es. Ruotolo Giuseppe"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Note del Mister */}
              <div className="mt-2.5">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Indicazioni & Note per la squadra:
                </label>
                <textarea
                  value={noteMister}
                  onChange={(e) => setNoteMister(e.target.value)}
                  rows={2}
                  placeholder="es. Documento di identità obbligatorio, parastinchi e divisa di rappresentanza..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 2. SORGENTE GOOGLE SHEETS GIOCATORI & ROSE */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  2. Foglio Google con Rose & Mister
                </span>
                <button
                  type="button"
                  onClick={() => setShowSheetGuide(!showSheetGuide)}
                  className="text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:underline flex items-center gap-1 bg-sky-100 dark:bg-sky-900/50 px-2 py-0.5 rounded-md"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {showSheetGuide ? 'Nascondi Struttura' : 'Struttura Foglio Consigliata'}
                </button>
              </div>

              {/* Guida visiva e struttura colonne */}
              {showSheetGuide && (
                <div className="mb-3 p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-[11px] text-slate-700 dark:text-slate-300 space-y-2.5 animate-in fade-in">
                  <div className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-sky-600" />
                    <span>Foglio Google Semplificato (bastano 3 colonne):</span>
                  </div>

                  <p>
                    Basta inserire solo <strong>Squadra</strong>, <strong>Cognome e Nome</strong> e il nome del <strong>Mister</strong> alla Riga 1:
                  </p>

                  {/* Tabella Esempio 3 Colonne */}
                  <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-300 dark:border-slate-700">
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Colonna A: Squadra</th>
                          <th className="p-2 border-r border-slate-200 dark:border-slate-700">Colonna B: Cognome e Nome</th>
                          <th className="p-2">Colonna C: Mister</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        <tr>
                          <td className="p-1.5 font-bold text-emerald-600">Under 19</td>
                          <td className="p-1.5">Rossi Christian</td>
                          <td className="p-1.5 text-sky-600">Simone Corradini</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 font-bold text-emerald-600">Under 19</td>
                          <td className="p-1.5">D'Amico Tommaso</td>
                          <td className="p-1.5 text-sky-600">Simone Corradini</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 font-bold text-amber-600">Under 17</td>
                          <td className="p-1.5">Colasanti Valerio</td>
                          <td className="p-1.5 text-sky-600">Alessandro Conti</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 font-bold text-amber-600">Under 17</td>
                          <td className="p-1.5">Mancini Alessio</td>
                          <td className="p-1.5 text-sky-600">Alessandro Conti</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 font-bold text-blue-600">Prima Squadra</td>
                          <td className="p-1.5">De Angelis Gabriele</td>
                          <td className="p-1.5 text-sky-600">David Centioni</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 font-bold text-blue-600">Prima Squadra</td>
                          <td className="p-1.5">Morelli Simone</td>
                          <td className="p-1.5 text-sky-600">David Centioni</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                    <li>
                      <strong>Colonna Squadra</strong>: inserisci la categoria (es. <code>Prima Squadra</code>, <code>Under 19</code>, <code>Under 17</code>, <code>Under 15</code>).
                    </li>
                    <li>
                      <strong>Colonna Cognome e Nome</strong>: puoi scrivere insieme cognome e nome, oppure usare due colonne separate (<code>Cognome</code> e <code>Nome</code>).
                    </li>
                    <li>
                      <strong>Colonna Mister</strong>: inserisci il nome dell'allenatore della squadra (basta anche solo sulla prima riga di quella squadra o ripetuto).
                    </li>
                    <li>
                      <em>Ruolo, numero di maglia e note non sono necessari!</em>
                    </li>
                  </ul>
                </div>
              )}

              {/* Input URL o ID foglio */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex gap-1.5">
                  <input
                    id="input-convocazioni-sheet-url"
                    type="text"
                    value={config.sheetUrl}
                    onChange={(e) => setConfig({ ...config, sheetUrl: e.target.value })}
                    placeholder="Incolla l'URL o ID del Foglio Google (es. 1Jl7i6oD8ip5eHVBMbsC1Qknx2gI-6zogCFNWK-WSUtM)"
                    className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <button
                    id="btn-paste-convocazioni-sheet"
                    type="button"
                    onClick={async () => {
                      try {
                        const clipText = await navigator.clipboard.readText();
                        if (clipText && clipText.trim()) {
                          const val = clipText.trim();
                          setConfig((prev) => ({ ...prev, sheetUrl: val }));
                          handleFetchSheet(val);
                        }
                      } catch (err) {
                        console.warn('Lettura appunti non disponibile o non autorizzata', err);
                        // Fallback con prompt nel caso di restrizioni del browser
                        const manualVal = window.prompt('Incolla qui l\'URL o l\'ID del Foglio Google:', config.sheetUrl || DEFAULT_CONVOCAZIONI_SHEET_ID);
                        if (manualVal && manualVal.trim()) {
                          const val = manualVal.trim();
                          setConfig((prev) => ({ ...prev, sheetUrl: val }));
                          handleFetchSheet(val);
                        }
                      }
                    }}
                    title="Incolla dagli appunti"
                    className="px-2.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 shrink-0 active:scale-95 transition"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                    <span className="hidden sm:inline">Incolla</span>
                  </button>
                </div>
                <div className="w-full sm:w-36">
                  <input
                    id="input-convocazioni-sheet-tab"
                    type="text"
                    value={config.tabName}
                    onChange={(e) => setConfig({ ...config, tabName: e.target.value })}
                    placeholder="Scheda (opzionale)"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <button
                  id="btn-fetch-convocati-sheet"
                  type="button"
                  onClick={() => handleFetchSheet()}
                  disabled={isFetchingSheet}
                  className="px-3.5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50"
                  title="Scarica i dati aggiornati dal foglio Google"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSheet ? 'animate-spin' : ''}`} />
                  <span>{isFetchingSheet ? 'Caricamento...' : 'Carica Rose'}</span>
                </button>
              </div>

              {/* Indicatore Foglio Ufficiale e Ripristino Rapido */}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-medium">ID Ufficiale Cynthia:</span>
                  <code className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
                    {DEFAULT_CONVOCAZIONI_SHEET_ID}
                  </code>
                </div>
                <button
                  id="btn-use-official-cynthia-sheet"
                  type="button"
                  onClick={() => {
                    setConfig((prev) => ({
                      ...prev,
                      sheetUrl: DEFAULT_CONVOCAZIONI_SHEET_URL,
                      tabName: '',
                    }));
                    handleFetchSheet(DEFAULT_CONVOCAZIONI_SHEET_URL, '');
                  }}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline font-bold text-xs flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ripristina Foglio Ufficiale Cynthia</span>
                </button>
              </div>

              {/* Messaggi stato caricamento */}
              {sheetError && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{sheetError}</span>
                </div>
              )}
              {sheetSuccess && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{sheetSuccess}</span>
                </div>
              )}
            </div>

            {/* 3. ELENCO GIOCATORI, FILTRI SQUADRE & SELEZIONE CONVOCATI */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    3. Rosa & Convocati
                  </span>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-600 text-white shadow-2xs">
                    {convocatiCount} convocati
                  </span>
                  {convocatiAggregati.length > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-400/40">
                      +{convocatiAggregati.length} da altre rose
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => selectAllVisible(true)}
                    className="font-semibold text-sky-700 dark:text-sky-300 hover:underline"
                  >
                    Seleziona Visibili
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => selectAllVisible(false)}
                    className="font-semibold text-slate-500 dark:text-slate-400 hover:underline"
                  >
                    Deseleziona
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingPlayer(!isAddingPlayer)}
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    <UserPlus className="w-3 h-3" />
                    Aggiungi Atleta
                  </button>
                </div>
              </div>

              {/* Barra Categorie Squadre (permette di pescare giocatori da qualsiasi squadra) */}
              <div className="mb-3">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Filter className="w-3 h-3 text-sky-500" />
                    Filtra Rosa / Pesca da altre squadre:
                  </span>
                  {matchedCategory && (
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                      Gara: {matchedCategory}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchedCategory && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter(matchedCategory)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                        selectedCategoryFilter === matchedCategory
                          ? 'bg-sky-600 text-white shadow-2xs ring-2 ring-sky-400'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Solo {matchedCategory}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('ALL')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                      selectedCategoryFilter === 'ALL'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    Tutte le Rose ({giocatori.length})
                  </button>

                  {availableCategories
                    .filter((c) => c !== matchedCategory)
                    .map((cat) => {
                      const countInCat = giocatori.filter((g) => g.categoria === cat).length;
                      const isSelected = selectedCategoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategoryFilter(cat)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                          }`}
                        >
                          {cat} ({countInCat})
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Form aggiunta atleta al volo */}
              {isAddingPlayer && (
                <form
                  onSubmit={handleAddPlayer}
                  className="mb-3 p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 flex flex-wrap gap-2 animate-in fade-in"
                >
                  <input
                    type="text"
                    required
                    placeholder="Cognome e Nome atleta"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="flex-1 min-w-[140px] text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                  <input
                    type="text"
                    placeholder="Squadra (es. Under 19)"
                    value={newPlayerCategoria}
                    onChange={(e) => setNewPlayerCategoria(e.target.value)}
                    className="w-32 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                  <input
                    type="text"
                    placeholder="Ruolo"
                    value={newPlayerRuolo}
                    onChange={(e) => setNewPlayerRuolo(e.target.value)}
                    className="w-20 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                  <input
                    type="text"
                    placeholder="N°"
                    value={newPlayerNumero}
                    onChange={(e) => setNewPlayerNumero(e.target.value)}
                    className="w-14 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                  >
                    Inserisci
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingPlayer(false)}
                    className="px-2 py-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs"
                  >
                    Annulla
                  </button>
                </form>
              )}

              {/* Filtri rapidi ricerca e ruolo */}
              <div className="flex gap-2 mb-2.5">
                <input
                  type="text"
                  placeholder="Cerca giocatore o squadra..."
                  value={searchPlayer}
                  onChange={(e) => setSearchPlayer(e.target.value)}
                  className="flex-1 text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
                <select
                  value={filterRuolo}
                  onChange={(e) => setFilterRuolo(e.target.value)}
                  className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="ALL">Tutti i Ruoli</option>
                  <option value="P">Portieri (P)</option>
                  <option value="D">Difensori (D)</option>
                  <option value="C">Centrocampisti (C)</option>
                  <option value="A">Attaccanti (A)</option>
                </select>
              </div>

              {/* Lista Scrollabile Atleti */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
                {filteredGiocatori.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Nessun giocatore corrisponde ai filtri selezionati.
                  </div>
                ) : (
                  filteredGiocatori.map((g) => {
                    const isFromOtherTeam =
                      matchedCategory &&
                      g.categoria &&
                      !isCategoryMatch(g.categoria, matchedCategory);

                    return (
                      <div
                        key={g.id}
                        onClick={() => togglePlayer(g.id)}
                        className={`flex items-center justify-between p-2.5 cursor-pointer transition select-none ${
                          g.selezionato
                            ? 'bg-sky-50/80 dark:bg-sky-950/40 text-slate-900 dark:text-slate-100 font-semibold'
                            : 'bg-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="checkbox"
                            checked={g.selezionato}
                            onChange={() => {}} // gestito da onClick contenitore
                            className="w-4 h-4 rounded-sm text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                          {g.numero && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold min-w-[20px] text-center">
                              {g.numero}
                            </span>
                          )}
                          <span className="text-xs">{g.nome}</span>
                          {g.ruolo && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 font-bold">
                              {g.ruolo}
                            </span>
                          )}

                          {/* Badge se appartiene ad un'altra squadra (aggregato) */}
                          {isFromOtherTeam && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                              da {g.categoria}
                            </span>
                          )}

                          {g.note && (
                            <span className="text-[10px] italic text-rose-600 dark:text-rose-400">
                              ({g.note})
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePlayer(g.id);
                          }}
                          className="p-1 rounded-sm text-slate-300 hover:text-rose-500 transition"
                          title="Rimuovi giocatore dalla lista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* COLONNA DESTRA: Anteprima WhatsApp in tempo reale & Azioni (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-2xs flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Anteprima Messaggio WhatsApp
                </span>
                {editedWhatsAppText !== null ? (
                  <button
                    id="btn-reset-whatsapp-text"
                    type="button"
                    onClick={() => setEditedWhatsAppText(null)}
                    className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800 transition active:scale-95"
                    title="Ripristina il messaggio automatico sincronizzato con i dati e i giocatori selezionati"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Ripristina Automatico
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    Modificabile
                  </span>
                )}
              </div>

              {/* Simulatore bubble WhatsApp con textarea modificabile */}
              <div className="flex-1 bg-[#efeae2] dark:bg-[#0b141a] rounded-xl p-2.5 border border-emerald-300/40 dark:border-emerald-950 shadow-inner flex flex-col">
                <div className="flex items-center justify-between pb-1.5 px-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Puoi modificare direttamente il messaggio prima di inviarlo:
                  </span>
                  {editedWhatsAppText !== null && (
                    <span className="font-semibold text-amber-600 dark:text-amber-400 text-[10px]">
                      (Modificato a mano)
                    </span>
                  )}
                </div>
                <textarea
                  id="textarea-whatsapp-preview"
                  value={activeWhatsAppText}
                  onChange={(e) => setEditedWhatsAppText(e.target.value)}
                  rows={16}
                  placeholder="Il messaggio WhatsApp apparirà qui..."
                  aria-label="Modifica testo messaggio WhatsApp"
                  className="w-full flex-1 min-h-[400px] bg-white dark:bg-[#1f2c34] text-slate-900 dark:text-[#e9edef] rounded-lg p-3 shadow-xs text-xs font-sans whitespace-pre-wrap leading-relaxed border border-slate-200/50 dark:border-slate-700/30 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-y"
                />
              </div>
            </div>

            {/* Pulsanti Azione WhatsApp & Condivisione */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5">
              {/* 1. Pulsante Principale Invia su WhatsApp */}
              <button
                id="btn-whatsapp-send-direct"
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Invia Direttamente su WhatsApp</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* 2. Pulsante Copia Testo */}
                <button
                  id="btn-whatsapp-copy-text"
                  type="button"
                  onClick={handleCopy}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold text-xs shadow-2xs transition flex items-center justify-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">Copiato!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                      <span>Copia Testo</span>
                    </>
                  )}
                </button>

                {/* 3. Pulsante Condivisione Mobile Web Share */}
                <button
                  id="btn-whatsapp-share-native"
                  type="button"
                  onClick={handleWebShare}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold text-xs shadow-2xs transition flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Condividi App</span>
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 pt-1">
                Gli atleti convocati appartenenti ad altre categorie confluiranno automaticamente con l'indicazione del prestito/aggregazione.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-600" />
            <span>I convocati e l'elenco delle rose rimangono salvati per le prossime partite.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
