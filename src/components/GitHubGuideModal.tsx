import React, { useState } from 'react';
import { X, Github, ExternalLink, Copy, Check, Terminal, FileCode, CheckCircle2 } from 'lucide-react';

interface GitHubGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubGuideModal: React.FC<GitHubGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const repoUrl = 'https://github.com/pmonaldi68/ProgrammaGareCynthia1920_2026';
  const pagesUrl = 'https://pmonaldi68.github.io/ProgrammaGareCynthia1920_2026/';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const gitCommands = `# 1. Clona il repository se non lo hai ancora fatto:
git clone ${repoUrl}.git
cd ProgrammaGareCynthia1920_2026

# 2. Se hai scaricato i file del progetto, copiali nella cartella
git add .
git commit -m "Aggiornamento applicazione programma gare Cynthia 1920"
git push origin main`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Github className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold">Guida GitHub & GitHub Actions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenuto scrollabile */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Box Link Principali */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/50 transition group flex items-start gap-3"
            >
              <Github className="w-5 h-5 text-slate-700 group-hover:text-sky-700 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 group-hover:text-sky-900 flex items-center gap-1">
                  Repository GitHub <ExternalLink className="w-3 h-3" />
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">pmonaldi68/ProgrammaGareCynthia1920_2026</p>
              </div>
            </a>

            <a
              href={pagesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/50 transition group flex items-start gap-3"
            >
              <ExternalLink className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                  Sito GitHub Pages <ExternalLink className="w-3 h-3" />
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">pmonaldi68.github.io/ProgrammaGare...</p>
              </div>
            </a>
          </div>

          {/* Step 1: Configurazione GitHub Pages */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              Attivazione GitHub Pages nel repository
            </h3>
            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1">
              <li>Vai su <strong>Settings</strong> &gt; <strong>Pages</strong> del repository GitHub.</li>
              <li>Sotto <strong>Build and deployment &gt; Source</strong>, seleziona <strong>GitHub Actions</strong>.</li>
              <li>Il workflow <code className="text-sky-700 bg-sky-50 px-1 py-0.5 rounded">.github/workflows/deploy.yml</code> già incluso nel progetto pubblicherà automaticamente il sito ad ogni commit su <code>main</code>!</li>
            </ol>
          </div>

          {/* Step 2: GitHub Actions per aggiornamento da Google Sheets */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              Aggiornamento automatico con GitHub Actions
            </h3>
            <p className="text-xs text-slate-600">
              Il file <code className="text-sky-700 bg-sky-50 px-1 py-0.5 rounded">.github/workflows/sync-sheet.yml</code> (incluso nel repository) si avvia automaticamente secondo una pianificazione cron e scarica il file CSV del foglio Google:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              <li>Vai su <strong>Settings &gt; Secrets and variables &gt; Actions</strong></li>
              <li>Crea un nuovo secret chiamato <code>GOOGLE_SHEET_CSV_URL</code></li>
              <li>Incolla l'URL pubblico CSV del tuo Google Sheet</li>
              <li>In questo modo GitHub Actions salverà in automatico il programma gare in <code>public/data/partite.csv</code> ogni volta che ci sono variazioni!</li>
            </ul>
          </div>

          {/* Step 3: Comandi Git veloci */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                Comandi Git per caricare il codice sul repo:
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(gitCommands, 'git')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                {copiedSection === 'git' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiato!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copia comandi
                  </>
                )}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl text-xs font-mono overflow-x-auto">
              {gitCommands}
            </pre>
          </div>

          {/* Versione pura HTML/JS */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <FileCode className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Versione Single-Page HTML/JS puro inclusa:</p>
              <p className="mt-0.5 text-amber-800">
                Oltre all'applicazione moderna, nel progetto è disponibile anche il file <code>/public/standalone.html</code> pronto all'uso con Tailwind CDN e JavaScript puro senza necessità di compilazione.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition shadow-sm"
          >
            Chiudi Guida
          </button>
        </div>
      </div>
    </div>
  );
};
