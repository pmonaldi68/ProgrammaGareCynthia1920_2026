import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Eye,
  CheckSquare,
  Square,
  UserCheck,
  History,
  FileDown,
  Upload,
} from 'lucide-react';
import { Partita, GiocatoreConvocato, ConvocazioneConfig } from '../types';
import { APP_CONFIG } from '../appConfig';
import { parseCSV } from '../services/sheetService';
import { ConvocazioniPdfPreviewModal } from './ConvocazioniPdfPreviewModal';
import {
  generateConvocazioniPdf,
  downloadConvocazioniPdf,
  printConvocazioniPdf,
  shareConvocazioniPdf,
  ConvocazioniPdfOptions,
} from '../utils/pdfGenerator';
import {
  DEFAULT_STAFF_BY_CATEGORY,
  DEFAULT_CONVOCAZIONI_SHEET_ID,
  DEFAULT_CONVOCAZIONI_SHEET_URL,
  loadConvocazioniConfig,
  saveConvocazioniConfig,
  loadCachedGiocatori,
  saveCachedGiocatori,
  loadCachedStaff,
  saveCachedStaff,
  loadSavedConvocatiForMatch,
  saveConvocatiForMatch,
  clearConvocatiForMatch,
  getConvocazioniHistoryStats,
  fetchGiocatoriFromSheet,
  parseCsvConvocazioni,
  deduplicateGiocatori,
  findMatchingCategory,
  isCategoryMatch,
  buildWhatsAppConvocazioniMessage,
  calculateRitrovoFromOraGara,
  calculateRitrovoTimeOnly,
  extractTimeFromRitrovo,
  ensureFullCynthiaRosters,
  detectCynthiaClub,
  resolveMisterForMatch,
  saveMisterForMatch,
  loadSavedMisterForMatch,
  isInventedMisterName,
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
  // Limite massimo ufficiale di convocati consentiti a referto/distinta
  const MAX_CONVOCATI_LIMIT = 25;

  // Configurazione Foglio Google Convocati
  const [config, setConfig] = useState<ConvocazioneConfig>(loadConvocazioniConfig);
  const [isFetchingSheet, setIsFetchingSheet] = useState<boolean>(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [sheetSuccess, setSheetSuccess] = useState<string | null>(null);
  const [showSheetGuide, setShowSheetGuide] = useState<boolean>(false);

  // Partita selezionata
  const [selectedPartitaId, setSelectedPartitaId] = useState<string>(() => {
    return partite.length > 0 ? partite[0].id : '';
  });

  // Giocatori e Staff per categoria: se non ci sono squadre e giocatori nel file delle rose, non carica nulla
  const [giocatori, setGiocatori] = useState<GiocatoreConvocato[]>(() => {
    const cached = loadCachedGiocatori();
    if (!cached || cached.length === 0) {
      return [];
    }
    const cleanList = deduplicateGiocatori(cached);
    const initialMatchId = partite.length > 0 ? partite[0].id : '';
    const savedIds = initialMatchId ? loadSavedConvocatiForMatch(initialMatchId) : null;
    if (savedIds !== null) {
      const idSet = new Set(savedIds);
      return cleanList.map((g) => ({ ...g, selezionato: idSet.has(g.id) }));
    }
    return cleanList.map((g) => ({ ...g, selezionato: false }));
  });
  const [staffMap, setStaffMap] = useState<Record<string, string>>(() => {
    return loadCachedStaff();
  });

  // Campi personalizzabili della convocazione
  const [categoriaCustom, setCategoriaCustom] = useState<string>('');
  const [squadraCasaCustom, setSquadraCasaCustom] = useState<string>('');
  const [squadraOspiteCustom, setSquadraOspiteCustom] = useState<string>('');
  const [dataGaraCustom, setDataGaraCustom] = useState<string>('');
  const [oraGaraCustom, setOraGaraCustom] = useState<string>('');
  const [oraRitrovo, setOraRitrovo] = useState<string>('14:00 PRESSO IL CAMPO DI GIUOCO');
  // Orario di ritrovo specifico per singola partita (chiave: ID partita, valore: string "HH:MM")
  const [ritrovoTimeByPartita, setRitrovoTimeByPartita] = useState<Record<string, string>>({});
  const [ritrovoLuogo, setRitrovoLuogo] = useState<string>('PRESSO IL CAMPO DI GIUOCO');
  const [campoCustom, setCampoCustom] = useState<string>('');
  const [indirizzoCustom, setIndirizzoCustom] = useState<string>('');
  const [linkMapsCustom, setLinkMapsCustom] = useState<string>('');
  const [noteMister, setNoteMister] = useState<string>(
    'Portare documento di riconoscimento in corso di validità, divisa di rappresentanza e parastinchi. Massima puntualità!'
  );
  const [misterName, setMisterName] = useState<string>('');

  // Filtri elenco giocatori
  const [searchPlayer, setSearchPlayer] = useState<string>('');
  const [filterRuolo, setFilterRuolo] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('AUTO');
  // Filtro Società: CYNTHIA 1920, ACADEMY CYNTHIA GENZANO, ALBACYNTHIA
  const [selectedClubFilter, setSelectedClubFilter] = useState<'ALL' | 'CYNTHIA 1920' | 'ACADEMY CYNTHIA GENZANO' | 'ALBACYNTHIA'>('ALL');
  const [filterOnlyWithHistory, setFilterOnlyWithHistory] = useState<boolean>(false);
  const [convocatiLimitWarning, setConvocatiLimitWarning] = useState<string | null>(null);

  const [isAddingPlayer, setIsAddingPlayer] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerAnnoNascita, setNewPlayerAnnoNascita] = useState<string>('');
  const [newPlayerRuolo, setNewPlayerRuolo] = useState<string>('');
  const [newPlayerNumero, setNewPlayerNumero] = useState<string>('');
  const [newPlayerCategoria, setNewPlayerCategoria] = useState<string>('');
  const [newPlayerSquadra, setNewPlayerSquadra] = useState<string>('CYNTHIA 1920');

  // Messaggio successo esportazione JSON
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Stato copia
  const [copied, setCopied] = useState<boolean>(false);

  // Stato anteprima testo WhatsApp modificabile manualmente
  const [editedWhatsAppText, setEditedWhatsAppText] = useState<string | null>(null);

  // Stato generazione PDF per il Mister (spunta manuale a penna o distinta ufficiale)
  const [pdfModalita, setPdfModalita] = useState<'tutta_la_rosa' | 'solo_convocati'>('tutta_la_rosa');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState<string | null>(null);

  // Stato Anteprima Live PDF
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState<boolean>(false);

  // Categorie uniche stabili tra tutti i giocatori registrati (chiave deterministica)
  const categoriesKey = useMemo(() => {
    const set = new Set<string>();
    giocatori.forEach((g) => {
      if (g.categoria && g.categoria.trim()) {
        set.add(g.categoria.trim());
      }
    });
    return Array.from(set).sort().join(':::');
  }, [giocatori]);

  const availableCategories = useMemo(() => {
    return categoriesKey ? categoriesKey.split(':::') : [];
  }, [categoriesKey]);

  // Partita corrente
  const currentPartita = useMemo(() => {
    return partite.find((m) => m.id === selectedPartitaId) || null;
  }, [partite, selectedPartitaId]);

  // Categoria rilevata per la gara corrente
  const matchedCategory = useMemo(() => {
    const campionato = currentPartita?.campionato || categoriaCustom;
    return findMatchingCategory(campionato, availableCategories);
  }, [currentPartita, categoriaCustom, availableCategories]);

  // Traccia ultima partita sincronizzata e mappa staff per prevenire re-render ciclici
  const syncedPartitaIdRef = useRef<string | null>(null);
  const staffMapRef = useRef(staffMap);
  staffMapRef.current = staffMap;

  // Assicura che una partita valida sia sempre selezionata non appena partite diventa disponibile
  useEffect(() => {
    if (partite.length > 0) {
      if (!selectedPartitaId || !partite.some((m) => m.id === selectedPartitaId)) {
        setSelectedPartitaId(partite[0].id);
      }
    }
  }, [partite, selectedPartitaId]);

  // Sincronizza i dati della gara e il Mister dal file delle rose quando cambia la partita o lo staff
  useEffect(() => {
    if (!isOpen || !selectedPartitaId) {
      return;
    }

    const p = partite.find((m) => m.id === selectedPartitaId);
    if (!p) return;

    setCategoriaCustom(p.campionato || '');
    setSquadraCasaCustom(p.squadraCasa || '');
    setSquadraOspiteCustom(p.squadraOspite || '');
    setDataGaraCustom(p.data || '');
    setOraGaraCustom(p.ora || '');
    setCampoCustom(`${p.campo || ''}${p.tipo ? ` (${p.tipo})` : ''}`.trim());
    const fullIndirizzo = [p.indirizzo, p.comune].filter(Boolean).join(', ');
    setIndirizzoCustom(fullIndirizzo);
    setLinkMapsCustom(p.lnkMaps !== '#' ? (p.lnkMaps || '') : '');

    // Calcola orario ritrovo per questa gara: RIGOROSAMENTE 90 minuti prima della gara
    const savedTime = ritrovoTimeByPartita[p.id];
    const targetTime = savedTime || (p.ora ? calculateRitrovoTimeOnly(p.ora, 90) : '14:00');
    setOraRitrovo(`${targetTime} ${ritrovoLuogo.trim()}`);

    // Determina il mister per questa gara: carica SOLO i mister presenti nel file delle rose
    const currentStaff = (staffMap && Object.keys(staffMap).length > 0) ? staffMap : loadCachedStaff();
    const correctMister = resolveMisterForMatch(p, p.campionato, currentStaff);
    if (correctMister) {
      setMisterName(correctMister);
    }

    // Reset modifiche manuali WhatsApp per rigenerare il messaggio fresco
    setEditedWhatsAppText(null);
  }, [selectedPartitaId, isOpen, partite, staffMap]);

  // Sincronizza atleti e selezione salvata SOLO al cambio effettivo di partita selezionata
  useEffect(() => {
    if (!isOpen || !selectedPartitaId) {
      syncedPartitaIdRef.current = null;
      return;
    }

    if (syncedPartitaIdRef.current === selectedPartitaId) {
      return;
    }
    syncedPartitaIdRef.current = selectedPartitaId;

    const p = partite.find((m) => m.id === selectedPartitaId);
    if (!p) return;

    // Carica la lista dei convocati salvati in localStorage per questa specifica gara
    const savedSelectedIds = loadSavedConvocatiForMatch(p.id);
    const savedIdSet = savedSelectedIds !== null ? new Set(savedSelectedIds) : null;

    setGiocatori((prev) => {
      const cleanList = deduplicateGiocatori(prev);
      const availableCats = Array.from(
        new Set(cleanList.map((g) => g.categoria).filter(Boolean))
      ) as string[];
      const matchCat = findMatchingCategory(p.campionato, availableCats);

      if (matchCat) {
        setSelectedCategoryFilter(matchCat);
      } else if (availableCats.length > 0) {
        setSelectedCategoryFilter('ALL');
      }

      // Se esistono convocati salvati in precedenza per questa specifica gara, ripristinali!
      // Altrimenti, per una gara non ancora compilata, lascia tutti deselezionati
      const updated = cleanList.map((g) => ({
        ...g,
        selezionato: savedIdSet ? savedIdSet.has(g.id) : false,
      }));
      saveCachedGiocatori(updated);
      return updated;
    });
  }, [selectedPartitaId, isOpen, partite]);

  // Aggiorna staff quando l'utente modifica a mano il nome del Mister
  const handleMisterChange = (name: string) => {
    setMisterName(name);
    if (selectedPartitaId) {
      saveMisterForMatch(selectedPartitaId, name);
    }
    if (matchedCategory) {
      const updated = { ...staffMap, [matchedCategory]: name };
      setStaffMap(updated);
      saveCachedStaff(updated);
    }
    setEditedWhatsAppText(null);
  };

  // Reimposta il mister ufficiale calcolato in base a squadra e categoria
  const handleResetOfficialMister = () => {
    if (!currentPartita) return;
    try {
      const raw = localStorage.getItem('cynthia_mister_by_match_v1');
      if (raw) {
        const map = JSON.parse(raw);
        delete map[currentPartita.id];
        localStorage.setItem('cynthia_mister_by_match_v1', JSON.stringify(map));
      }
    } catch (e) {
      console.warn('Errore reset mister per gara', e);
    }
    const defaultMister = resolveMisterForMatch({ ...currentPartita, id: '' }, currentPartita.campionato);
    setMisterName(defaultMister);
    if (matchedCategory) {
      const updated = { ...staffMap, [matchedCategory]: defaultMister };
      setStaffMap(updated);
      saveCachedStaff(updated);
    }
    setEditedWhatsAppText(null);
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
      if (!parsed.giocatori || parsed.giocatori.length === 0) {
        // Se non ci sono squadre e giocatori nel file delle rose, non caricare nulla
        setGiocatori([]);
        saveCachedGiocatori([]);
        setSheetSuccess('Nessun giocatore o squadra presente nel file delle rose. Nessun dato caricato.');
        setSheetError(null);
        return;
      }

      const matchIdToUse = selectedPartitaId || 'custom_match';
      const savedMatchIds = loadSavedConvocatiForMatch(matchIdToUse);
      const savedSet = savedMatchIds !== null ? new Set(savedMatchIds) : null;
      const cleanList = deduplicateGiocatori(parsed.giocatori);
      const playersWithPreserved = cleanList.map((g) => ({
        ...g,
        selezionato: savedSet ? savedSet.has(g.id) : false,
      }));

      setGiocatori(playersWithPreserved);
      saveCachedGiocatori(playersWithPreserved);

      if (Object.keys(parsed.staffByCategoria).length > 0) {
        // Pulisce lo staff per assicurare che contenga solo i mister reali del file senza vecchi fittizi
        const cleanStaff: Record<string, string> = {};
        for (const [cat, mister] of Object.entries(parsed.staffByCategoria)) {
          if (mister && !isInventedMisterName(mister)) {
            cleanStaff[cat] = mister.trim();
          }
        }
        setStaffMap(cleanStaff);
        saveCachedStaff(cleanStaff);

        // Se la gara attuale trova riscontro nel nuovo staff, aggiorna il mister
        const newMister = resolveMisterForMatch(
          currentPartita,
          currentPartita?.campionato || categoriaCustom,
          cleanStaff
        );
        setMisterName(newMister);
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
        `Caricati ${cleanList.length} atleti e ${parsed.availableCategories.length} squadre/rose dal foglio!`
      );
    } catch (err: unknown) {
      console.error('Errore importazione convocati:', err);
      const msg = err instanceof Error ? err.message : 'Impossibile scaricare il foglio Google.';
      setSheetError(msg);
    } finally {
      setIsFetchingSheet(false);
    }
  };

  // Caricamento da file CSV locale
  const handleUploadLocalCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || !text.trim()) {
          setGiocatori([]);
          saveCachedGiocatori([]);
          setSheetSuccess('Il file selezionato è vuoto. Nessun atleta o squadra caricata.');
          setSheetError(null);
          return;
        }

        const rows = parseCSV(text);
        if (rows.length === 0) {
          setGiocatori([]);
          saveCachedGiocatori([]);
          setSheetSuccess('Nessun dato trovato nel file. Nessun atleta caricato.');
          setSheetError(null);
          return;
        }

        const parsed = parseCsvConvocazioni(rows);
        if (!parsed.giocatori || parsed.giocatori.length === 0) {
          setGiocatori([]);
          saveCachedGiocatori([]);
          setSheetSuccess('Nessun giocatore o squadra trovato nel file CSV.');
          setSheetError(null);
          return;
        }

        const cleanList = deduplicateGiocatori(parsed.giocatori);
        const matchIdToUse = selectedPartitaId || 'custom_match';
        const savedMatchIds = loadSavedConvocatiForMatch(matchIdToUse);
        const savedSet = savedMatchIds !== null ? new Set(savedMatchIds) : null;
        const playersWithPreserved = cleanList.map((g) => ({
          ...g,
          selezionato: savedSet ? savedSet.has(g.id) : false,
        }));

        setGiocatori(playersWithPreserved);
        saveCachedGiocatori(playersWithPreserved);

        if (Object.keys(parsed.staffByCategoria).length > 0) {
          // Pulisce lo staff per assicurare che contenga solo i mister reali del file senza vecchi fittizi
          const cleanStaff: Record<string, string> = {};
          for (const [cat, mister] of Object.entries(parsed.staffByCategoria)) {
            if (mister && !isInventedMisterName(mister)) {
              cleanStaff[cat] = mister.trim();
            }
          }
          setStaffMap(cleanStaff);
          saveCachedStaff(cleanStaff);

          // Se la gara attuale trova riscontro nel nuovo staff, aggiorna il mister
          const newMister = resolveMisterForMatch(
            currentPartita,
            currentPartita?.campionato || categoriaCustom,
            cleanStaff
          );
          setMisterName(newMister);
        }

        setSheetSuccess(`Caricati con successo ${cleanList.length} atleti dal file "${file.name}"!`);
        setSheetError(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Errore durante la lettura del file CSV.';
        setSheetError(msg);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const hasAutoFetchedRef = useRef(false);

  // Carica automaticamente la rosa dal Foglio Google all'apertura se disponibile (una sola volta per apertura)
  useEffect(() => {
    if (isOpen && !hasAutoFetchedRef.current) {
      hasAutoFetchedRef.current = true;
      const targetUrl = config.sheetUrl || DEFAULT_CONVOCAZIONI_SHEET_URL;
      if (targetUrl) {
        handleFetchSheet(targetUrl, config.tabName);
      }
    } else if (!isOpen) {
      hasAutoFetchedRef.current = false;
    }
  }, [isOpen]);

  // Helper per salvare la lista convocati per la gara attiva in localStorage
  const persistCurrentMatchConvocati = (players: GiocatoreConvocato[]) => {
    const matchIdToSave = selectedPartitaId || 'custom_match';
    const selectedIds = players.filter((g) => g.selezionato).map((g) => g.id);
    saveConvocatiForMatch(matchIdToSave, selectedIds);
  };

  // Toggle selezione singolo atleta con limite a 25 e salvataggio automatico per la gara
  const togglePlayer = (id: string) => {
    setGiocatori((prev) => {
      const target = prev.find((g) => g.id === id);
      if (!target) return prev;

      // Se si sta provando a selezionare e si è già raggiunto il limite di 25
      if (!target.selezionato) {
        const currentlySelectedCount = prev.filter((g) => g.selezionato).length;
        if (currentlySelectedCount >= MAX_CONVOCATI_LIMIT) {
          setConvocatiLimitWarning(`Limite massimo di ${MAX_CONVOCATI_LIMIT} convocati raggiunto per la distinta di gara.`);
          setTimeout(() => setConvocatiLimitWarning(null), 4500);
          return prev;
        }
      }

      setConvocatiLimitWarning(null);
      const updated = prev.map((g) => (g.id === id ? { ...g, selezionato: !g.selezionato } : g));
      saveCachedGiocatori(updated);
      persistCurrentMatchConvocati(updated);
      return updated;
    });
  };

  // Seleziona tutti i giocatori visibili nell'elenco (fino al limite massimo di 25 convocati)
  const handleSelectAll = () => {
    setGiocatori((prev) => {
      const visible = filteredGiocatori;
      const alreadySelectedNonVisible = prev.filter((g) => g.selezionato && !visible.some((v) => v.id === g.id));
      const availableSlots = Math.max(0, MAX_CONVOCATI_LIMIT - alreadySelectedNonVisible.length);

      const toSelectIds = new Set(visible.slice(0, availableSlots).map((g) => g.id));

      if (visible.length > availableSlots) {
        setConvocatiLimitWarning(`Selezionati ${toSelectIds.size} atleti: raggiunto il limite massimo ufficiale di ${MAX_CONVOCATI_LIMIT} convocati.`);
        setTimeout(() => setConvocatiLimitWarning(null), 5000);
      } else {
        setConvocatiLimitWarning(null);
      }

      const updated = prev.map((g) => {
        if (toSelectIds.has(g.id)) return { ...g, selezionato: true };
        if (visible.some((v) => v.id === g.id)) return { ...g, selezionato: false };
        return g;
      });

      saveCachedGiocatori(updated);
      persistCurrentMatchConvocati(updated);
      return updated;
    });
  };

  // Deseleziona tutti i giocatori (con salvataggio automatico)
  const handleDeselectAll = () => {
    setConvocatiLimitWarning(null);
    setGiocatori((prev) => {
      const visibleIds = new Set(filteredGiocatori.map((g) => g.id));
      const isFiltered = filteredGiocatori.length < prev.length;
      const updated = prev.map((g) => {
        if (isFiltered) {
          return visibleIds.has(g.id) ? { ...g, selezionato: false } : g;
        }
        return { ...g, selezionato: false };
      });
      saveCachedGiocatori(updated);
      persistCurrentMatchConvocati(updated);
      return updated;
    });
  };

  // Azzera tutti i convocati in assoluto
  const handleResetAllSelections = () => {
    setConvocatiLimitWarning(null);
    setGiocatori((prev) => {
      const updated = prev.map((g) => ({ ...g, selezionato: false }));
      saveCachedGiocatori(updated);
      persistCurrentMatchConvocati(updated);
      return updated;
    });
  };

  // Compatibilità per selezione per stato
  const selectAllVisible = (status: boolean) => {
    if (status) {
      handleSelectAll();
    } else {
      handleDeselectAll();
    }
  };

  // Aggiungi giocatore manuale
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const cat = newPlayerCategoria.trim() || matchedCategory || 'Prima Squadra';
    const currentCount = giocatori.filter((g) => g.selezionato).length;
    const canSelect = currentCount < MAX_CONVOCATI_LIMIT;

    if (!canSelect) {
      setConvocatiLimitWarning(`Atleta aggiunto alla rosa ma non selezionato: raggiunto il limite di ${MAX_CONVOCATI_LIMIT} convocati.`);
      setTimeout(() => setConvocatiLimitWarning(null), 4500);
    }

    const newG: GiocatoreConvocato = {
      id: `manual_${Date.now()}`,
      nome: newPlayerName.trim(),
      ruolo: newPlayerRuolo.trim().toUpperCase() || undefined,
      numero: newPlayerNumero.trim() || undefined,
      annoNascita: newPlayerAnnoNascita.trim() || undefined,
      categoria: cat,
      squadra: newPlayerSquadra || 'CYNTHIA 1920',
      selezionato: canSelect,
    };

    setGiocatori((prev) => {
      const updated = [newG, ...prev];
      saveCachedGiocatori(updated);
      persistCurrentMatchConvocati(updated);
      return updated;
    });

    setNewPlayerName('');
    setNewPlayerAnnoNascita('');
    setNewPlayerRuolo('');
    setNewPlayerNumero('');
    setIsAddingPlayer(false);
  };

  // Rimuovi giocatore
  const handleRemovePlayer = (id: string) => {
    setGiocatori((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      saveCachedGiocatori(updated);
      persistCurrentMatchConvocati(updated);
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

  // Calcolo dinamico dell'orario di ritrovo (formato "HH:MM") per la partita attiva (90 minuti prima della gara)
  const currentRitrovoTime = useMemo(() => {
    // 1. Se l'utente ha modificato manualmente l'orario per questa specifica partita
    if (selectedPartitaId && ritrovoTimeByPartita[selectedPartitaId]) {
      return ritrovoTimeByPartita[selectedPartitaId];
    }
    // 2. Se c'è un orario gara valido per la partita selezionata, calcola esattamente 90 minuti prima
    const matchOra = currentPartita?.ora || oraGaraCustom;
    if (matchOra) {
      return calculateRitrovoTimeOnly(matchOra, 90);
    }
    // 3. Fallback da stringa ritrovo
    if (oraRitrovo) {
      const extracted = extractTimeFromRitrovo(oraRitrovo);
      if (extracted) return extracted;
    }
    return '14:00';
  }, [ritrovoTimeByPartita, selectedPartitaId, currentPartita, oraGaraCustom, oraRitrovo]);

  // Gestione modifica orario di ritrovo specifico per la partita corrente
  const handleRitrovoTimeChange = (newTime: string) => {
    if (!newTime) return;
    if (selectedPartitaId) {
      setRitrovoTimeByPartita((prev) => ({
        ...prev,
        [selectedPartitaId]: newTime,
      }));
    }
    const updatedFull = `${newTime} ${ritrovoLuogo.trim()}`;
    setOraRitrovo(updatedFull);
    // Reset modifiche manuali WhatsApp per sincronizzare subito il nuovo orario
    setEditedWhatsAppText(null);
  };

  // Gestione modifica luogo / dettaglio ritrovo
  const handleRitrovoLuogoChange = (newLuogo: string) => {
    setRitrovoLuogo(newLuogo);
    const updatedFull = `${currentRitrovoTime} ${newLuogo.trim()}`;
    setOraRitrovo(updatedFull);
    setEditedWhatsAppText(null);
  };

  // Preset rapidi minuti prima del fischio d'inizio (es. -90m, -75m, -60m)
  const handleApplyPresetMinutesBefore = (minutes: number) => {
    const oraGaraToUse = currentPartita?.ora || oraGaraCustom;
    if (!oraGaraToUse) return;
    const formatted = calculateRitrovoTimeOnly(oraGaraToUse, minutes);
    handleRitrovoTimeChange(formatted);
  };

  // Calcola la rosa dei calciatori appartenenti alla squadra/categoria della gara selezionata
  const getMatchRosterPlayers = useCallback((): GiocatoreConvocato[] => {
    const campionatoGara = currentPartita?.campionato || categoriaCustom || '';
    const clubGara = detectCynthiaClub(currentPartita);
    const catGara = matchedCategory || findMatchingCategory(campionatoGara, availableCategories);

    // 1. Filtra i giocatori che appartengono specificamente alla squadra/categoria della gara selezionata
    let rosterOfTeam = giocatori.filter((g) => {
      // Verifica categoria
      const catMatches = catGara
        ? isCategoryMatch(g.categoria || '', catGara)
        : campionatoGara
        ? isCategoryMatch(g.categoria || '', campionatoGara)
        : false;

      if (!catMatches) return false;

      // Verifica società se specificata sul giocatore
      if (g.squadra && clubGara) {
        const sqUpper = g.squadra.toUpperCase();
        if (clubGara === 'CYNTHIA 1920') {
          if (sqUpper.includes('ACADEMY') || sqUpper.includes('ALBA')) return false;
        } else if (clubGara === 'ACADEMY CYNTHIA GENZANO') {
          if (!sqUpper.includes('ACADEMY')) return false;
        } else if (clubGara === 'ALBACYNTHIA') {
          if (!sqUpper.includes('ALBA')) return false;
        }
      }
      return true;
    });

    // Se il filtro non ha trovato atleti, prova a matchare per categoria senza restrizione stretta di società
    if (rosterOfTeam.length === 0 && (catGara || campionatoGara)) {
      rosterOfTeam = giocatori.filter((g) => {
        if (catGara && isCategoryMatch(g.categoria || '', catGara)) return true;
        if (campionatoGara && isCategoryMatch(g.categoria || '', campionatoGara)) return true;
        return false;
      });
    }

    // Se l'utente ha impostato un filtro attivo nella UI diverso da ALL/AUTO
    if (rosterOfTeam.length === 0 && selectedCategoryFilter !== 'ALL' && selectedCategoryFilter !== 'AUTO') {
      rosterOfTeam = giocatori.filter((g) => g.categoria === selectedCategoryFilter);
    }

    // Se ancora nessun atleta e ci sono giocatori nel database, restituisce tutti i giocatori caricati
    // per non lasciare MAI il foglio convocazioni senza atleti!
    if (rosterOfTeam.length === 0 && giocatori.length > 0) {
      rosterOfTeam = giocatori;
    }

    // 2. Aggiunge eventuali giocatori convocati (selezionati) per questa gara anche se provenienti da altra categoria/squadra
    const extraSelectedPlayers = giocatori.filter(
      (g) => g.selezionato && !rosterOfTeam.some((r) => r.id === g.id)
    );

    const combined = [...rosterOfTeam, ...extraSelectedPlayers];
    return deduplicateGiocatori(combined);
  }, [currentPartita, categoriaCustom, matchedCategory, availableCategories, giocatori, selectedCategoryFilter]);

  // Prepara le opzioni per generare il PDF o mostrare l'anteprima live per il mister
  const getPdfOptions = (modalitaOverride?: 'tutta_la_rosa' | 'solo_convocati'): ConvocazioniPdfOptions => {
    const currentModalita = modalitaOverride || pdfModalita;
    const matchRoster = getMatchRosterPlayers();

    // Regola utente:
    // Nell'anteprima live e nel foglio convocazioni vengono riportati SOLO i giocatori della squadra selezionata!
    // - In modalità 'solo_convocati': solo i giocatori selezionati tra quelli della squadra, fino al limite massimo di 25
    // - In modalità 'tutta_la_rosa': tutta la rosa della squadra selezionata, deselezionati [ ] per la spunta a penna
    let targetPlayers: GiocatoreConvocato[];
    if (currentModalita === 'solo_convocati') {
      targetPlayers = matchRoster.filter((g) => g.selezionato).slice(0, MAX_CONVOCATI_LIMIT);
    } else {
      targetPlayers = matchRoster.map((g) => ({ ...g, selezionato: false }));
    }

    const calcTime = currentRitrovoTime || (currentPartita?.ora ? calculateRitrovoTimeOnly(currentPartita.ora, 90) : '14:00');
    const fullRitrovoToUse = `${calcTime} ${ritrovoLuogo.trim()}`;

    const campToUse = currentPartita?.campionato || categoriaCustom || 'Campionato Regionale';

    const campoToUse = currentPartita?.campo
      ? `${currentPartita.campo}${currentPartita.tipo ? ` (${currentPartita.tipo})` : ''}`
      : campoCustom || '';

    const indirizzoToUse = currentPartita?.indirizzo
      ? [currentPartita.indirizzo, currentPartita.comune].filter(Boolean).join(', ')
      : indirizzoCustom || '';

    return {
      partita: currentPartita,
      campionato: campToUse,
      squadraCasa: currentPartita?.squadraCasa || squadraCasaCustom || 'Cynthia 1920',
      squadraOspite: currentPartita?.squadraOspite || squadraOspiteCustom || 'Avversario',
      dataGara: currentPartita?.data || dataGaraCustom || '',
      oraGara: currentPartita?.ora || oraGaraCustom || '',
      oraRitrovo: fullRitrovoToUse,
      campo: campoToUse,
      indirizzo: indirizzoToUse,
      misterName: misterName,
      noteMister: noteMister,
      giocatori: targetPlayers,
      modalita: currentModalita,
      categoriaTarget: matchedCategory || undefined,
    };
  };

  // Apre l'anteprima live del PDF
  const handleOpenPdfPreview = (modalita?: 'tutta_la_rosa' | 'solo_convocati') => {
    if (modalita) {
      setPdfModalita(modalita);
    }
    setShowPdfPreviewModal(true);
  };

  // Scarica PDF Scheda Convocazioni
  const handleDownloadPdf = (modalita?: 'tutta_la_rosa' | 'solo_convocati') => {
    setIsGeneratingPdf(true);
    try {
      const options = getPdfOptions(modalita);
      downloadConvocazioniPdf(options);
      setPdfStatusMessage('PDF scaricato con successo!');
      setTimeout(() => setPdfStatusMessage(null), 3500);
    } catch (err) {
      console.error('Errore download PDF convocazioni:', err);
      setPdfStatusMessage('Errore nella generazione del PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Stampa diretta Scheda Convocazioni
  const handlePrintPdf = (modalita?: 'tutta_la_rosa' | 'solo_convocati') => {
    setIsGeneratingPdf(true);
    try {
      const options = getPdfOptions(modalita);
      printConvocazioniPdf(options);
      setPdfStatusMessage('Finestra di stampa aperta!');
      setTimeout(() => setPdfStatusMessage(null), 3500);
    } catch (err) {
      console.error('Errore stampa PDF convocazioni:', err);
      setPdfStatusMessage('Errore durante la stampa');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Condividi PDF con il mister (WhatsApp, Telegram, Email tramite Web Share o download)
  const handleSharePdf = async (modalita?: 'tutta_la_rosa' | 'solo_convocati') => {
    setIsGeneratingPdf(true);
    try {
      const options = getPdfOptions(modalita);
      const res = await shareConvocazioniPdf(options);
      if (res.sharedViaFile) {
        setPdfStatusMessage('Scheda PDF condivisa con successo!');
      } else {
        setPdfStatusMessage('PDF scaricato per l\'invio al mister!');
      }
      setTimeout(() => setPdfStatusMessage(null), 3500);
    } catch (err) {
      console.error('Errore condivisione PDF convocazioni:', err);
      setPdfStatusMessage('Errore nella condivisione');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Storico presenze/convocazioni precedenti salvate in localStorage per ciascun giocatore (escludendo la gara corrente)
  const historicalConvocazioniStats = useMemo(() => {
    return getConvocazioniHistoryStats(selectedPartitaId);
  }, [selectedPartitaId, giocatori, isOpen]);

  // Giocatori convocati spuntati
  const convocati = useMemo(() => {
    return giocatori.filter((g) => g.selezionato);
  }, [giocatori]);

  // Conteggio convocati totali e aggregati da altre squadre
  const convocatiCount = convocati.length;

  const convocatiAggregati = useMemo(() => {
    if (!matchedCategory) return [];
    return convocati.filter(
      (g) => g.categoria && !isCategoryMatch(g.categoria, matchedCategory)
    );
  }, [convocati, matchedCategory]);

  // Società del Cynthia identificata per la gara corrente (casa o trasferta)
  const detectedClub = useMemo(() => {
    return detectCynthiaClub(currentPartita);
  }, [currentPartita]);

  // Giocatori filtrati nella lista UI in base a categoria, società, ruolo, ricerca e storico
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

      // 2. Filtro Società (CYNTHIA 1920, ACADEMY CYNTHIA GENZANO, ALBACYNTHIA)
      if (selectedClubFilter !== 'ALL') {
        const club = (g.squadra || '').toUpperCase();
        if (selectedClubFilter === 'CYNTHIA 1920') {
          if (!club.includes('CYNTHIA') || club.includes('ACADEMY') || club.includes('ALBA')) return false;
        } else if (selectedClubFilter === 'ACADEMY CYNTHIA GENZANO') {
          if (!club.includes('ACADEMY')) return false;
        } else if (selectedClubFilter === 'ALBACYNTHIA') {
          if (!club.includes('ALBA')) return false;
        }
      }

      // 3. Filtro Ricerca
      const matchSearch =
        !searchPlayer.trim() ||
        g.nome.toLowerCase().includes(searchPlayer.toLowerCase()) ||
        (g.ruolo && g.ruolo.toLowerCase().includes(searchPlayer.toLowerCase())) ||
        (g.numero && g.numero.includes(searchPlayer)) ||
        (g.categoria && g.categoria.toLowerCase().includes(searchPlayer.toLowerCase())) ||
        (g.squadra && g.squadra.toLowerCase().includes(searchPlayer.toLowerCase()));

      // 4. Filtro Ruolo
      const matchRuolo =
        filterRuolo === 'ALL' ||
        (g.ruolo && g.ruolo.toUpperCase() === filterRuolo.toUpperCase());

      // 5. Filtro solo con storico precedente
      const matchHistory =
        !filterOnlyWithHistory || (historicalConvocazioniStats[g.id] || 0) > 0;

      return matchSearch && matchRuolo && matchHistory;
    });
  }, [giocatori, selectedCategoryFilter, selectedClubFilter, matchedCategory, searchPlayer, filterRuolo, filterOnlyWithHistory, historicalConvocazioniStats]);

  // Numero di atleti nella lista filtrata che hanno già convocazioni registrate nello storico
  const playersWithHistoryCount = useMemo(() => {
    return filteredGiocatori.filter((g) => (historicalConvocazioniStats[g.id] || 0) > 0).length;
  }, [filteredGiocatori, historicalConvocazioniStats]);

  // Esporta i dati dei convocati e le note della gara in formato JSON
  const handleExportConvocatiJson = () => {
    const dataPartitaEffettiva = currentPartita?.data || dataGaraCustom || '';
    const oraGaraEffettiva = currentPartita?.ora || oraGaraCustom || '';
    const categoriaEffettiva = currentPartita?.campionato || matchedCategory || categoriaCustom || 'ASD Cynthia 1920';
    const squadraCasaEffettiva = currentPartita?.squadraCasa || squadraCasaCustom || 'Cynthia 1920';
    const squadraTrasfertaEffettiva = currentPartita?.squadraOspite || squadraOspiteCustom || 'Avversario';
    const avversarioEffettivo = currentPartita?.avversario || squadraTrasfertaEffettiva;

    const exportData = {
      applicazione: 'ASD Cynthia 1920 - Gestione Convocazioni',
      versione: '1.0',
      dataEsportazione: new Date().toISOString(),
      societaRiferimentoGara: detectedClub || 'CYNTHIA 1920',
      partita: {
        id: currentPartita?.id || selectedPartitaId || 'gara_personalizzata',
        categoria: categoriaEffettiva,
        campionato: currentPartita?.campionato || categoriaEffettiva,
        squadraCasa: squadraCasaEffettiva,
        squadraTrasferta: squadraTrasfertaEffettiva,
        avversario: avversarioEffettivo,
        tipo: currentPartita?.tipo || 'Campionato',
        data: dataPartitaEffettiva,
        oraGara: oraGaraEffettiva,
        ritrovo: {
          orario: currentRitrovoTime,
          luogo: ritrovoLuogo,
          indicazioneCompleta: oraRitrovo || `${currentRitrovoTime} ${ritrovoLuogo.trim()}`,
        },
        campo: currentPartita?.campo || campoCustom || '',
        indirizzo: currentPartita?.indirizzo || indirizzoCustom || '',
        linkMaps: currentPartita?.linkMaps || linkMapsCustom || '',
      },
      staff: {
        mister: misterName,
      },
      noteGara: noteMister,
      totaleConvocati: convocati.length,
      limiteMassimoConvocati: MAX_CONVOCATI_LIMIT,
      totaleRosaCategoria: filteredGiocatori.length,
      giocatoriConvocati: convocati.map((g, idx) => ({
        ordine: idx + 1,
        id: g.id,
        numero: g.numero || '',
        nome: g.nome,
        cognome: g.cognome || '',
        ruolo: g.ruolo || '',
        categoria: g.categoria || categoriaEffettiva,
        squadra: g.squadra || 'CYNTHIA 1920',
        aggregatoDa:
          g.categoria && matchedCategory && !isCategoryMatch(g.categoria, matchedCategory)
            ? g.categoria
            : undefined,
        note: g.note || '',
        convocazioniPrecedentiSalvate: historicalConvocazioniStats[g.id] || 0,
      })),
      anteprimaMessaggioWhatsApp: activeWhatsAppText,
    };

    try {
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const cleanDate = (dataPartitaEffettiva || new Date().toISOString().slice(0, 10)).replace(/[^0-9a-zA-Z]/g, '-');
      const cleanOpponent = avversarioEffettivo.replace(/[^0-9a-zA-Z]/g, '_').toLowerCase();
      const cleanCat = categoriaEffettiva.replace(/[^0-9a-zA-Z]/g, '_').toLowerCase();

      link.href = url;
      link.download = `convocazioni_${cleanCat}_vs_${cleanOpponent}_${cleanDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccessMessage(`File JSON scaricato con successo (${convocati.length} convocati e note di gara)!`);
      setTimeout(() => setExportSuccessMessage(null), 4500);
    } catch (err) {
      console.error("Errore durante l'esportazione JSON", err);
    }
  };

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
          <div className="flex items-center gap-2">
            <button
              id="btn-header-preview-pdf-mister"
              type="button"
              disabled={isGeneratingPdf}
              onClick={() => handleOpenPdfPreview()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-bold transition shadow-xs disabled:opacity-50"
              title="Visualizza l'anteprima live del PDF prima di generarlo"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Anteprima Live PDF</span>
            </button>
            <button
              id="btn-header-download-pdf-mister"
              type="button"
              onClick={() => handleDownloadPdf()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold border border-white/20 transition shadow-xs"
              title="Scarica la scheda PDF per il mister con caselle di spunta manuale"
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>Scheda PDF Mister</span>
            </button>
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

                  {/* Informazione Rose Multi-Club Convocabili */}
                  <div className="mt-2 p-2 rounded-lg bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 text-[11px] text-sky-900 dark:text-sky-200 flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span>Rose sempre disponibili:</span>
                      <span className="font-bold text-slate-900 dark:text-white">CYNTHIA 1920</span> •{' '}
                      <span className="font-bold text-slate-900 dark:text-white">ACADEMY CYNTHIA GENZANO</span> •{' '}
                      <span className="font-bold text-slate-900 dark:text-white">ALBACYNTHIA</span>
                    </div>
                    {detectedClub && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700 text-[10px]">
                        Società gara: {detectedClub} ({currentPartita?.isCynthiaCasa ? 'Casa' : 'Trasferta'})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Dettagli Ritrovo e Mister */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="bg-amber-50/70 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="input-convocazioni-ora-ritrovo-main"
                      className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Orario Ritrovo Partita:</span>
                    </label>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-200/70 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                      Gara ore {currentPartita?.ora || oraGaraCustom || '--:--'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="input-convocazioni-ora-ritrovo-main"
                      type="time"
                      value={currentRitrovoTime}
                      onChange={(e) => handleRitrovoTimeChange(e.target.value)}
                      className="text-xs sm:text-sm font-black p-1.5 rounded-lg border-2 border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-700 text-amber-950 dark:text-amber-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden w-28 text-center cursor-pointer shadow-2xs"
                      title="Imposta l'orario di ritrovo per questa gara"
                    />
                    <input
                      type="text"
                      value={ritrovoLuogo}
                      onChange={(e) => handleRitrovoLuogoChange(e.target.value)}
                      placeholder="PRESSO IL CAMPO DI GIUOCO"
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      title="Luogo o indicazione di ritrovo"
                    />
                  </div>

                  {/* Preset orari rapidi */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Preset:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetMinutesBefore(90)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition active:scale-95"
                      title="Imposta ritrovo a 90 minuti prima del fischio d'inizio"
                    >
                      -90 min (Std)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetMinutesBefore(75)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition active:scale-95"
                      title="Imposta ritrovo a 75 minuti prima"
                    >
                      -75 min
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetMinutesBefore(60)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition active:scale-95"
                      title="Imposta ritrovo a 60 minuti prima"
                    >
                      -60 min
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="input-convocazioni-mister-name"
                        className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                      >
                        <Shield className="w-3.5 h-3.5 text-sky-500" />
                        <span>Mister ({detectedClub}):</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleResetOfficialMister}
                        className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="Reimposta il mister predefinito per questa gara"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Predefinito</span>
                      </button>
                    </div>

                    {/* Campo Modifica Libera Nome del Mister */}
                    <input
                      id="input-convocazioni-mister-name"
                      type="text"
                      value={misterName}
                      onChange={(e) => handleMisterChange(e.target.value)}
                      placeholder="es. Mister Ruotolo Giuseppe"
                      className="w-full text-xs p-2 rounded-lg border-2 border-sky-400/60 dark:border-sky-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-bold mb-1.5 shadow-2xs"
                      title="Puoi modificare liberamente il nome del mister che apparirà nel PDF e su WhatsApp"
                    />

                    {/* Selezione Rapida tra i Mister presenti nel file delle rose */}
                    {Object.keys(staffMap).length > 0 ? (
                      <div className="mt-1">
                        <label
                          htmlFor="select-roster-coach"
                          className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5"
                        >
                          Oppure seleziona tra i mister presenti nel file delle rose:
                        </label>
                        <select
                          id="select-roster-coach"
                          value={misterName}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleMisterChange(e.target.value);
                            }
                          }}
                          className="w-full text-[11px] p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-medium cursor-pointer"
                        >
                          <option value="">-- Seleziona Mister dal file delle rose --</option>
                          {Object.entries(staffMap)
                            .filter(([_, m]) => Boolean(m) && !isInventedMisterName(String(m)))
                            .map(([cat, coachName]) => (
                              <option key={`${cat}_${coachName}`} value={String(coachName)}>
                                {String(coachName)} ({cat})
                              </option>
                            ))}
                        </select>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic">
                        Carica il file delle rose per rilevare automaticamente i mister ufficiali delle squadre.
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                    Il nome del mister è modificabile e viene memorizzato per questa gara sul PDF e sul messaggio WhatsApp.
                  </div>
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
                      <strong>Colonna Anno di Nascita (opzionale)</strong>: puoi inserire una colonna <code>Anno di Nascita</code> (es. <code>2008</code>, <code>2010</code>). Il valore apparirà accanto al nome del calciatore sul foglio di stampa/distinta per il mister, ma non nel messaggio WhatsApp.
                    </li>
                    <li>
                      <em>Ruolo, numero di maglia e note sono anch'essi opzionali!</em>
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

                <label
                  htmlFor="input-local-roster-file"
                  className="px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition"
                  title="Carica un file CSV delle rose direttamente dal tuo dispositivo"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>Carica CSV</span>
                  <input
                    id="input-local-roster-file"
                    type="file"
                    accept=".csv,.txt"
                    className="sr-only"
                    onChange={handleUploadLocalCsv}
                  />
                </label>
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
                  <span
                    id="badge-convocati-header"
                    className="text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-600 text-white shadow-2xs flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span>Convocati: {convocatiCount}/{filteredGiocatori.length}</span>
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
                    onClick={handleSelectAll}
                    className="font-semibold text-sky-700 dark:text-sky-300 hover:underline flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Seleziona tutti
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="font-semibold text-slate-500 dark:text-slate-400 hover:underline flex items-center gap-1"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Deseleziona tutti
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

              {/* Selettore Società Convocabili: CYNTHIA 1920, ACADEMY CYNTHIA GENZANO, ALBACYNTHIA */}
              <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-sky-50 via-slate-50 to-indigo-50 dark:from-sky-950/40 dark:via-slate-850 dark:to-indigo-950/40 border border-sky-200/80 dark:border-sky-800/60 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center justify-between flex-wrap gap-1">
                  <span className="flex items-center gap-1.5 text-sky-800 dark:text-sky-300">
                    <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    Rose Convocabili per la Categoria:
                  </span>
                  {detectedClub && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 border border-amber-400/60 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      Gara: {detectedClub} ({currentPartita?.isCynthiaCasa ? 'In Casa' : currentPartita?.isCynthiaOspite ? 'In Trasferta' : 'Calendario'})
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    id="filter-club-all"
                    type="button"
                    onClick={() => setSelectedClubFilter('ALL')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      selectedClubFilter === 'ALL'
                        ? 'bg-sky-700 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <span>Tutte e 3 le Società</span>
                    <span className="text-[10px] opacity-80 font-normal">
                      (Cynthia, Academy, Albacynthia)
                    </span>
                  </button>
                  <button
                    id="filter-club-cynthia"
                    type="button"
                    onClick={() => setSelectedClubFilter('CYNTHIA 1920')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                      selectedClubFilter === 'CYNTHIA 1920'
                        ? 'bg-slate-900 text-white shadow-2xs font-bold ring-1 ring-sky-400'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                    CYNTHIA 1920
                  </button>
                  <button
                    id="filter-club-academy"
                    type="button"
                    onClick={() => setSelectedClubFilter('ACADEMY CYNTHIA GENZANO')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                      selectedClubFilter === 'ACADEMY CYNTHIA GENZANO'
                        ? 'bg-sky-600 text-white shadow-2xs font-bold ring-1 ring-cyan-300'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                    ACADEMY CYNTHIA
                  </button>
                  <button
                    id="filter-club-albacynthia"
                    type="button"
                    onClick={() => setSelectedClubFilter('ALBACYNTHIA')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                      selectedClubFilter === 'ALBACYNTHIA'
                        ? 'bg-indigo-700 text-white shadow-2xs font-bold ring-1 ring-purple-300'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                    ALBACYNTHIA
                  </button>
                </div>
              </div>

              {/* Barra Categorie Squadre (permette di pescare giocatori da qualsiasi squadra) */}
              <div className="mb-3">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Filter className="w-3 h-3 text-sky-500" />
                    Filtra Categoria / Aggregati da altre leve:
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
                    Tutte le Categorie ({giocatori.length})
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
                  <select
                    value={newPlayerSquadra}
                    onChange={(e) => setNewPlayerSquadra(e.target.value)}
                    className="text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-semibold"
                  >
                    <option value="CYNTHIA 1920">CYNTHIA 1920</option>
                    <option value="ACADEMY CYNTHIA GENZANO">ACADEMY CYNTHIA</option>
                    <option value="ALBACYNTHIA">ALBACYNTHIA</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Categoria (es. Under 14)"
                    value={newPlayerCategoria}
                    onChange={(e) => setNewPlayerCategoria(e.target.value)}
                    className="w-32 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                  <input
                    type="text"
                    placeholder="Ruolo (P, D, C, A)"
                    value={newPlayerRuolo}
                    onChange={(e) => setNewPlayerRuolo(e.target.value)}
                    className="w-20 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                  <input
                    type="text"
                    placeholder="Anno (es. 2008)"
                    value={newPlayerAnnoNascita}
                    onChange={(e) => setNewPlayerAnnoNascita(e.target.value)}
                    className="w-24 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
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

              {/* Barra Azioni & Indicatore Visuale Convocati: X/Y sopra la lista */}
              <div
                id="convocati-actions-bar-above-list"
                className="flex flex-wrap items-center justify-between gap-2 p-2 mb-2 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs"
              >
                {/* Tasti Seleziona tutti, Deseleziona tutti, Esporta Dati Convocati e Filtro Storico */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    id="btn-convocazioni-select-all"
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
                    title="Seleziona tutti i giocatori mostrati nell'elenco"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Seleziona tutti</span>
                  </button>

                  <button
                    id="btn-convocazioni-deselect-all"
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
                    title="Deseleziona tutti i giocatori"
                  >
                    <Square className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Deseleziona tutti</span>
                  </button>

                  <button
                    id="btn-export-convocati-json"
                    type="button"
                    onClick={handleExportConvocatiJson}
                    className="px-2.5 py-1.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/70 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
                    title="Scarica un file JSON con l'elenco dei giocatori selezionati e le note della gara per archiviarli su altri dispositivi"
                  >
                    <FileDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Esporta Dati Convocati</span>
                  </button>

                  <button
                    id="btn-filter-history"
                    type="button"
                    onClick={() => setFilterOnlyWithHistory(!filterOnlyWithHistory)}
                    className={`px-2 py-1.5 rounded-md text-[11px] font-semibold transition flex items-center gap-1 border active:scale-95 ${
                      filterOnlyWithHistory
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                    }`}
                    title="Filtra e mostra solo i giocatori con convocazioni registrate nello storico delle altre gare"
                  >
                    <History className="w-3 h-3" />
                    <span>Solo già convocati ({playersWithHistoryCount})</span>
                  </button>
                </div>

                {/* Indicatore Visuale 'Convocati: X/25 max' che si aggiorna in tempo reale con limite fissato a 25 */}
                <div className="flex items-center gap-2">
                  <div
                    id="indicatore-visuale-convocati-counter"
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black transition-all ${
                      convocatiCount === MAX_CONVOCATI_LIMIT
                        ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                        : convocatiCount >= 18 && convocatiCount < MAX_CONVOCATI_LIMIT
                        ? 'bg-emerald-600 text-white ring-1 ring-emerald-400/40'
                        : convocatiCount > 0
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                    title={`Numero atleti convocati per la gara (limite ufficiale PDF: ${MAX_CONVOCATI_LIMIT})`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>
                      Convocati: {convocatiCount}/{MAX_CONVOCATI_LIMIT} max
                    </span>
                  </div>
                  {convocatiCount === MAX_CONVOCATI_LIMIT && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                      Limite 25 raggiunto
                    </span>
                  )}
                </div>
              </div>

              {/* Banner notifica limite massimo 25 convocati */}
              {convocatiLimitWarning && (
                <div
                  id="alert-convocati-limit-warning"
                  className="p-2.5 mb-2 rounded-lg bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs animate-in fade-in"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{convocatiLimitWarning}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConvocatiLimitWarning(null)}
                    className="text-amber-800 dark:text-amber-300 hover:text-amber-950 text-xs font-bold underline cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              )}

              {/* Banner notifica successo esportazione JSON */}
              {exportSuccessMessage && (
                <div
                  id="alert-export-convocati-success"
                  className="p-2 mb-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{exportSuccessMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExportSuccessMessage(null)}
                    className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 text-xs underline font-normal"
                  >
                    Chiudi
                  </button>
                </div>
              )}

              {/* Lista Scrollabile Atleti */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
                {giocatori.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Nessuna rosa caricata</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                      Nel file delle rose non sono presenti giocatori o squadre. Inserisci il link al foglio o carica un file CSV per popolare la rosa.
                    </p>
                  </div>
                ) : filteredGiocatori.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Nessun giocatore corrisponde ai filtri selezionati.
                  </div>
                ) : (
                  filteredGiocatori.map((g) => {
                    const isFromOtherTeam =
                      matchedCategory &&
                      g.categoria &&
                      !isCategoryMatch(g.categoria, matchedCategory);

                    const prevConvocazioniCount = historicalConvocazioniStats[g.id] || 0;
                    const hasPreviousConvocazione = prevConvocazioniCount > 0;

                    const squad = (g.squadra || 'CYNTHIA 1920').toUpperCase();
                    const isAlba = squad.includes('ALBA');
                    const isAcademy = squad.includes('ACADEMY');

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
                            className={`w-4 h-4 rounded-sm cursor-pointer transition ${
                              hasPreviousConvocazione
                                ? 'accent-emerald-600 text-emerald-600 focus:ring-emerald-500 ring-1 ring-emerald-500/40'
                                : 'accent-sky-600 text-sky-600 focus:ring-sky-500'
                            }`}
                            title={
                              hasPreviousConvocazione
                                ? `Giocatore già convocato in precedenza (${prevConvocazioniCount} gare nello storico)`
                                : 'Nessuna convocazione registrata nelle gare precedenti'
                            }
                          />
                          {g.numero && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold min-w-[20px] text-center">
                              {g.numero}
                            </span>
                          )}
                          <span className="text-xs font-medium text-slate-900 dark:text-slate-100">{g.nome}</span>
                          {g.annoNascita && (
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 font-bold"
                              title={`Anno di nascita: ${g.annoNascita}`}
                            >
                              {g.annoNascita}
                            </span>
                          )}
                          {g.ruolo && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 font-bold">
                              {g.ruolo}
                            </span>
                          )}

                          {/* Badge Società (CYNTHIA 1920, ACADEMY CYNTHIA, ALBACYNTHIA) */}
                          <span
                            className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-md ${
                              isAlba
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60'
                                : isAcademy
                                ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700/60'
                                : 'bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
                            }`}
                            title={`Società di appartenenza: ${g.squadra || 'CYNTHIA 1920'}`}
                          >
                            {isAlba
                              ? 'ALBACYNTHIA'
                              : isAcademy
                              ? 'ACADEMY CYNTHIA'
                              : 'CYNTHIA 1920'}
                          </span>

                          {/* Indicatore visivo storico convocazioni precedenti richiamato da localStorage */}
                          {hasPreviousConvocazione ? (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60 flex items-center gap-1 shadow-2xs"
                              title={`Giocatore già convocato in ${prevConvocazioniCount} ${prevConvocazioniCount === 1 ? 'altra gara' : 'altre gare'} salvate`}
                            >
                              <History className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Storico: {prevConvocazioniCount} {prevConvocazioniCount === 1 ? 'gara' : 'gare'}</span>
                            </span>
                          ) : (
                            <span
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/70 flex items-center gap-0.5"
                              title="Nessuna convocazione registrata nelle altre gare archiviate"
                            >
                              <span>1ª conv.</span>
                            </span>
                          )}

                          {/* Badge se appartiene ad un'altra categoria (aggregato) */}
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

            {/* SEZIONE SPECIALE: SCHEDA PDF PER IL MISTER (SPUNTA MANUALE & STAMPA) */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50/70 dark:from-sky-950/40 dark:to-slate-800/80 border border-sky-200 dark:border-sky-800/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 dark:bg-sky-500 text-white flex items-center justify-center shadow-xs">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      Scheda PDF per il Mister
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-200">
                        Stampa & Spunta
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      File con caselle di spunta [ ] per spuntare a penna o distinta ufficiale
                    </p>
                  </div>
                </div>
              </div>

              {/* Selettore Modalità PDF */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  id="btn-pdf-mode-all"
                  type="button"
                  onClick={() => setPdfModalita('tutta_la_rosa')}
                  className={`py-1.5 px-2 rounded-md font-semibold text-[11px] transition flex items-center justify-center gap-1.5 ${
                    pdfModalita === 'tutta_la_rosa'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title="Foglio di spunta per il mister con tutti i giocatori della rosa deselezionati per la spunta a penna"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Foglio di Spunta Rosa [ ]</span>
                </button>
                <button
                  id="btn-pdf-mode-selected"
                  type="button"
                  onClick={() => setPdfModalita('solo_convocati')}
                  className={`py-1.5 px-2 rounded-md font-semibold text-[11px] transition flex items-center justify-center gap-1.5 ${
                    pdfModalita === 'solo_convocati'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title="Distinta ufficiale definitiva con i soli giocatori selezionati (max 25)"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Distinta Convocati ({convocatiCount}/25)</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-sky-100/50 dark:bg-sky-900/30 p-2 rounded-lg border border-sky-200/60 dark:border-sky-800/40">
                {pdfModalita === 'tutta_la_rosa' ? (
                  <span>
                    📋 <strong>Foglio di Spunta Mister:</strong> include <strong>tutti i giocatori in rosa</strong> con caselle vuote <code>[ ]</code> deselezionate per la spunta manuale a penna.
                  </span>
                ) : (
                  <span>
                    ✓ <strong>Distinta Convocati Definitiva:</strong> include solo i <strong>{convocatiCount}</strong> calciatori attualmente selezionati (limite massimo di 25 atleti a referto).
                  </span>
                )}
              </div>

              {/* Orario Ritrovo specifico nel PDF */}
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span>Ritrovo PDF</span>
                      <span className="text-[9px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.2 rounded">
                        Gara {currentPartita?.ora || oraGaraCustom || '--:--'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {ritrovoLuogo}
                    </div>
                  </div>
                </div>
                <input
                  id="input-sidebar-ora-ritrovo"
                  type="time"
                  value={currentRitrovoTime}
                  onChange={(e) => handleRitrovoTimeChange(e.target.value)}
                  className="font-black text-xs p-1.5 rounded-lg border-2 border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-800 text-amber-950 dark:text-amber-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer shadow-2xs w-24 text-center shrink-0"
                  title="Modifica l'orario di ritrovo per questa gara"
                />
              </div>

              {/* Pulsante Anteprima Live PDF */}
              <button
                id="btn-preview-pdf-mister-main"
                type="button"
                disabled={isGeneratingPdf}
                onClick={() => handleOpenPdfPreview()}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.99] text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                title="Apri l'anteprima live a schermo intero del PDF prima di generarlo"
              >
                <Eye className="w-4 h-4 text-slate-950" />
                <span>Anteprima Live PDF</span>
              </button>

              {/* Pulsanti Azione PDF */}
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                {/* 1. Scarica PDF */}
                <button
                  id="btn-download-pdf-mister"
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={() => handleDownloadPdf()}
                  className="py-2.5 px-2 rounded-xl bg-sky-700 hover:bg-sky-800 active:scale-95 text-white font-bold text-xs shadow-xs transition flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                  title="Scarica il file PDF per il mister"
                >
                  <Download className="w-4 h-4" />
                  <span>Scarica PDF</span>
                </button>

                {/* 2. Stampa Diretta */}
                <button
                  id="btn-print-pdf-mister"
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={() => handlePrintPdf()}
                  className="py-2.5 px-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 active:scale-95 text-slate-800 dark:text-slate-100 font-semibold text-xs shadow-2xs transition flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                  title="Stampa subito il foglio convocazioni da spuntare a penna"
                >
                  <Printer className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                  <span>Stampa Foglio</span>
                </button>

                {/* 3. Invia al Mister */}
                <button
                  id="btn-share-pdf-mister"
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={() => handleSharePdf()}
                  className="py-2.5 px-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 active:scale-95 text-slate-800 dark:text-slate-100 font-semibold text-xs shadow-2xs transition flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                  title="Invia il file PDF al mister tramite WhatsApp o condivisione nativa"
                >
                  <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Invia al Mister</span>
                </button>
              </div>

              {pdfStatusMessage && (
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 p-2 rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{pdfStatusMessage}</span>
                </div>
              )}
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
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              id="btn-footer-export-convocati-json"
              type="button"
              onClick={handleExportConvocatiJson}
              className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-semibold text-xs transition flex items-center gap-1.5 active:scale-95"
              title="Scarica un file JSON con l'elenco dei convocati e le note della gara per archiviarli su altri dispositivi"
            >
              <FileDown className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Esporta Dati Convocati</span>
            </button>
            <button
              id="btn-footer-preview-mister-pdf"
              type="button"
              disabled={isGeneratingPdf}
              onClick={() => handleOpenPdfPreview()}
              className="px-3 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700 font-semibold text-xs transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Visualizza l'anteprima live del PDF prima di stamparlo o scaricarlo"
            >
              <Eye className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
              <span>Anteprima Live PDF</span>
            </button>
            <button
              id="btn-footer-print-mister-pdf"
              type="button"
              onClick={() => handlePrintPdf()}
              className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-semibold text-xs transition flex items-center gap-1.5 active:scale-95"
              title="Stampa subito il foglio convocazioni per il mister"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              <span>Stampa Scheda Mister</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-900 dark:text-slate-100 font-bold text-xs transition"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>

      {/* Modal Finestra di Anteprima Live del PDF */}
      <ConvocazioniPdfPreviewModal
        isOpen={showPdfPreviewModal}
        onClose={() => setShowPdfPreviewModal(false)}
        options={getPdfOptions(pdfModalita)}
        onDownloadPdf={(m) => handleDownloadPdf(m)}
        onPrintPdf={(m) => handlePrintPdf(m)}
        onTogglePlayer={(id) => togglePlayer(id)}
        onUpdateRitrovoTime={(newTime) => handleRitrovoTimeChange(newTime)}
        onUpdateMisterName={(newMister) => handleMisterChange(newMister)}
      />
    </div>
  );
};
