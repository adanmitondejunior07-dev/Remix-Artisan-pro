import React, { useState } from 'react';
import {
  Code,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Play,
  Download,
  Filter,
  Layers,
  Database,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  source: 'CinetPay_SDK' | 'Webhook' | 'API_Gateway' | 'MobileMoney';
  message: string;
  payload?: any;
}

export const AdminTechniqueCinetPaySection: React.FC = () => {
  const { showToast } = useApp();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'SUCCESS' | 'WARNING' | 'ERROR'>('ALL');
  const [isPinging, setIsPinging] = useState(false);

  // Logs système initiaux
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'log-001',
      timestamp: '2026-09-13 08:32:14',
      type: 'SUCCESS',
      source: 'CinetPay_SDK',
      message: 'Initialisation Seamless SDK terminée avec succès (XOF / Côte d’Ivoire + UEMOA)',
      payload: { site_id: '586327', currency: 'XOF', mode: 'PRODUCTION' },
    },
    {
      id: 'log-002',
      timestamp: '2026-09-13 08:29:45',
      type: 'INFO',
      source: 'Webhook',
      message: 'Notification IPN reçue pour paiement activation 10.000 FCFA',
      payload: { cpm_trans_id: 'CP-ACT-98214', status: 'ACCEPTED', amount: 10000, operator: 'WAVE' },
    },
    {
      id: 'log-003',
      timestamp: '2026-09-13 08:24:10',
      type: 'SUCCESS',
      source: 'MobileMoney',
      message: 'Déblocage automatique badge artisan après confirmation vérification 3.000 FCFA',
      payload: { artisan_id: 'art-07', badge: 'VERIFIE_OFFICIEL' },
    },
    {
      id: 'log-004',
      timestamp: '2026-09-13 08:15:22',
      type: 'WARNING',
      source: 'API_Gateway',
      message: 'Latence réseau temporaire détectée sur passerelle MTN MoMo Bénin (240ms)',
      payload: { operator: 'MTN_BJ', latency: '240ms', retry: 1 },
    },
    {
      id: 'log-005',
      timestamp: '2026-09-13 07:55:01',
      type: 'INFO',
      source: 'CinetPay_SDK',
      message: 'Contrôle intégrité Signature HMAC SHA256 vérifiée valide',
      payload: { hash_algorithm: 'SHA256', verified: true },
    },
  ]);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    showToast({ title: 'Copié dans le presse-papier !', type: 'info' });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSimulatePing = () => {
    setIsPinging(true);
    setTimeout(() => {
      const newLog: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        type: 'SUCCESS',
        source: 'Webhook',
        message: 'Ping de test Webhook CinetPay exécuté : Réponse HTTP 200 OK en 42ms',
        payload: {
          event: 'SIMULATED_HEALTHCHECK',
          status: 'HEALTHY',
          latency: '42ms',
          admin: 'adanmitondejunior07@gmail.com',
        },
      };
      setLogs((prev) => [newLog, ...prev]);
      setIsPinging(false);
      showToast({
        title: 'Ping CinetPay Réussi 🟢',
        desc: 'Passerelle opérationnelle (200 OK)',
        type: 'success',
      });
    }, 600);
  };

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cinetpay_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast({ title: 'Export des logs téléchargé !', type: 'info' });
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'ALL') return true;
    return log.type === filterType;
  });

  return (
    <div id="dashboard-technique-cinetpay" className="space-y-6">
      {/* BANNER TECHNIQUE */}
      <div className="p-6 rounded-3xl bg-neutral-950 text-white border-2 border-cyan-500/40 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-black uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" />
              <span>Dashboard Technique • CinetPay + Logs</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Supervision Technique & Passerelle CinetPay
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Console d'ingénierie réservée à l'<strong>Administrateur Suprême</strong> (adanmitondejunior07@gmail.com). Surveillance des flux monétiques, des webhooks IPN et intégrité des transactions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSimulatePing}
              disabled={isPinging}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Test en cours...' : 'Tester Ping Webhook'}</span>
            </button>

            <a
              href="/artisan-pro-netlify.zip"
              download="artisan-pro-netlify.zip"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pack Netlify Drop (ZIP)</span>
            </a>

            <button
              type="button"
              onClick={handleExportLogs}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs border border-neutral-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter Logs JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 CARTES D'ÉTAT SYSTÈME */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Statut CinetPay */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-white space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
            <span>Passerelle CinetPay</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
              <CheckCircle2 className="w-3 h-3" /> Opérationnel
            </span>
          </div>
          <div className="text-lg font-black text-white">Seamless SDK v2</div>
          <div className="text-[11px] text-neutral-400">Mode : Production Active</div>
        </div>

        {/* 2. Devise & Zone */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-white space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
            <span>Devise & Périmètre</span>
            <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
              XOF / UEMOA
            </span>
          </div>
          <div className="text-lg font-black text-white">FCFA (Franc CFA)</div>
          <div className="text-[11px] text-neutral-400">CI, SN, BJ, TG, ML, BF, NE</div>
        </div>

        {/* 3. Opérateurs Couverts */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-white space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
            <span>Opérateurs Mobiles</span>
            <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800">
              4 Actifs
            </span>
          </div>
          <div className="text-lg font-black text-white">Wave, OM, MTN, Moov</div>
          <div className="text-[11px] text-neutral-400">Auto-routage instantané</div>
        </div>

        {/* 4. Sécurité & Signature */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-white space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
            <span>Sécurité des flux</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
              <ShieldCheck className="w-3 h-3" /> SSL / TLS
            </span>
          </div>
          <div className="text-lg font-black text-white">HMAC SHA256</div>
          <div className="text-[11px] text-neutral-400">Contrôle de signature actif</div>
        </div>
      </div>

      {/* PARAMÈTRES TECHNIQUES DE LA PASSERELLE */}
      <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 text-white space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-neutral-200">
            <Code className="w-4 h-4 text-cyan-400" />
            <span>Paramètres de Configuration CinetPay</span>
          </div>
          <span className="text-[11px] text-neutral-400">Identifiants sécurisés</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">Site ID (Marchand)</span>
              <code className="text-cyan-300 font-mono font-bold">586327</code>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('586327', 'site_id')}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            >
              {copiedKey === 'site_id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">Webhook IPN Notification URL</span>
              <code className="text-neutral-200 font-mono text-[11px]">https://artisanpro.afrique/api/cinetpay-webhook</code>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('https://artisanpro.afrique/api/cinetpay-webhook', 'webhook')}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            >
              {copiedKey === 'webhook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* JOURNAL DES LOGS EN DIRECT */}
      <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">Journal des Logs & Événements CinetPay</h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold">
              {filteredLogs.length} événements
            </span>
          </div>

          {/* Filtres de logs */}
          <div className="flex items-center gap-1.5">
            {(['ALL', 'SUCCESS', 'WARNING', 'ERROR'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                  filterType === type
                    ? 'bg-cyan-500 text-neutral-950'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/90 font-mono text-xs space-y-1.5 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded font-black text-[9px] ${
                      log.type === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : log.type === 'WARNING'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : log.type === 'ERROR'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    }`}
                  >
                    {log.type}
                  </span>
                  <span className="text-neutral-500">{log.source}</span>
                </div>
                <span className="text-neutral-500">{log.timestamp}</span>
              </div>

              <div className="text-neutral-200 text-xs font-sans font-medium">
                {log.message}
              </div>

              {log.payload && (
                <pre className="p-2 rounded-lg bg-neutral-900 text-[10px] text-neutral-400 overflow-x-auto">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
