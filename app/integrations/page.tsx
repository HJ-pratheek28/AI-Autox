'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plug, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Mail, 
  MessageSquare, 
  BookOpen, 
  Grid,
  RefreshCw,
  XCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { storage, Integration } from '@/lib/storage-engine';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  gmail: Mail,
  slack: MessageSquare,
  notion: BookOpen,
  google_sheets: Grid
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIntegrations(storage.getIntegrations());
    setIsLoading(false);
  }, []);

  const triggerConnect = (id: string) => {
    setActiveId(id);
    setModalOpen(true);
  };

  const handleDisconnect = (id: string) => {
    const list = storage.getIntegrations();
    const updated = list.map(item => {
      if (item.id === id) {
        return { ...item, connected: false, account: undefined };
      }
      return item;
    });
    storage.saveIntegrations(updated);
    setIntegrations(updated);
  };

  const startConnectFlow = () => {
    setIsConnecting(true);
    setTimeout(() => {
      const list = storage.getIntegrations();
      const updated = list.map(item => {
        if (item.id === activeId) {
          return { 
            ...item, 
            connected: true, 
            account: activeId === 'notion' ? 'Zapier Central Workspace' : 'pratheek@sheets-sync.org' 
          };
        }
        return item;
      });
      storage.saveIntegrations(updated);
      setIntegrations(updated);
      
      setIsConnecting(false);
      setModalOpen(false);
      setActiveId(null);
    }, 1500);
  };

  const activeApp = integrations.find(i => i.id === activeId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 flex-1 w-full relative animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Integration Hub</h2>
          <p className="text-sm text-white/40 mt-1">Connect your active tools to authorize secure, context-aware operational pipelines.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-400/5 border border-emerald-400/10 px-3 py-1.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Authentication Gateway Online</span>
        </div>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 p-20 text-center text-white/20 space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-orange-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider">Accessing Integrations...</p>
          </div>
        ) : (
          integrations.map((app) => {
            const Icon = ICON_MAP[app.id] || Plug;
            return (
              <div 
                key={app.id} 
                className={`glass-panel p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between h-[280px] bg-gradient-to-br ${app.color}`}
              >
                <div>
                  {/* Brand Logo Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-none">{app.name}</h3>
                        <span className="text-[10px] text-white/40 mt-1 block">{app.rateLimit}</span>
                      </div>
                    </div>
                    
                    {/* Status Indicator */}
                    {app.connected ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Connected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-white/40 border border-white/10 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" /> Disconnected
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-white/60 font-medium leading-relaxed mt-4 h-12 line-clamp-2">
                    Connect your {app.name} workspace context, automate triggers, retrieve attachments, and append data directly from operational flows.
                  </p>

                  {/* Scopes Area */}
                  <div className="mt-4 flex flex-wrap gap-1.5 items-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-white/30 mr-1" />
                    {app.scopes.map((s) => (
                      <span key={s} className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-black/35 text-white/40 border border-white/5">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Operations row */}
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                  {app.connected ? (
                    <>
                      <span className="text-[10px] font-semibold text-white/40 max-w-[200px] truncate" title={app.account}>
                        Account: <span className="text-white/60 font-mono font-medium">{app.account}</span>
                      </span>
                      <button 
                        onClick={() => handleDisconnect(app.id)}
                        className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-colors px-3 py-1.5 rounded bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-semibold text-white/30">OAuth setup required</span>
                      <button 
                        onClick={() => triggerConnect(app.id)}
                        className="flex items-center gap-1 text-[10px] font-bold text-white hover:text-orange-400 transition-all px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 cursor-pointer"
                      >
                        <span>Connect App</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Premium OAuth Simulation Modal */}
      {modalOpen && activeApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-6 relative animate-in fade-in-50 zoom-in-95 duration-200">
            
            {/* Top Close Button */}
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>

            {/* Header branding */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-orange-400 shadow-md">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-white">OAuth Authorization Request</h3>
              <p className="text-xs text-white/40">Authorize **Zapier Central** to communicate securely with your **{activeApp.name}** account.</p>
            </div>

            {/* Details panel */}
            <div className="bg-black/35 rounded-xl border border-white/5 p-4 space-y-3">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Requested API scopes:</span>
              <div className="space-y-2">
                {activeApp.scopes.map((scope) => (
                  <div key={scope} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-white/70 font-mono font-medium">{scope}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/5 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                disabled={isConnecting}
              >
                Cancel
              </button>
              <button 
                onClick={startConnectFlow}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/40 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/10 cursor-pointer"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <span>Authorize App</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
