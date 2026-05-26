'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  GitFork, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Play, 
  Clock, 
  Zap, 
  Sparkles, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw
} from 'lucide-react';
import { storage, Workflow } from '@/lib/storage-engine';

export default function WorkflowsDashboardPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Safely load persistent real-world workflows inside browser context
    setWorkflows(storage.getWorkflows());
    setIsLoading(false);
  }, []);

  const toggleStatus = (id: string) => {
    const list = storage.getWorkflows();
    const updated = list.map(wf => {
      if (wf.id === id) {
        const nextStatus: Workflow['status'] = 
          wf.status === 'active' ? 'paused' : 'active';
        return { ...wf, status: nextStatus };
      }
      return wf;
    });
    storage.saveWorkflows(updated);
    setWorkflows(updated);
  };

  const deleteWorkflow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storage.deleteWorkflow(id);
    setWorkflows(storage.getWorkflows());
  };

  const filteredWorkflows = workflows.filter(wf => 
    wf.name.toLowerCase().includes(search.toLowerCase()) || 
    wf.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 flex-1 w-full animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Active Workflows</h2>
          <p className="text-sm text-white/40 mt-1">Configure triggers, customize logic nodes, and monitor active operational state graphs.</p>
        </div>
        <button 
          onClick={() => {
            // Generate a fresh random UUID-like ID for the new real workflow
            const newId = `wf_${Math.random().toString(36).substring(7)}`;
            router.push(`/workflows/${newId}/builder`);
          }}
          className="flex items-center gap-2 bg-white text-black font-semibold text-xs px-4 py-2.5 rounded-lg hover:bg-neutral-200 transition-colors shadow-lg cursor-pointer flex items-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Workflow</span>
        </button>
      </div>

      {/* Control panel search */}
      <div className="flex items-center bg-white/[0.02] p-4 rounded-xl border border-white/5 relative">
        <Search className="absolute left-7 top-7 w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Search by workflow name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-all"
        />
      </div>

      {/* Workflow Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="p-20 text-center text-white/20 space-y-3 bg-white/[0.01] border border-white/5 rounded-2xl">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-orange-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider">Accessing Storage...</p>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="p-20 text-center text-white/20 space-y-2 bg-white/[0.01] border border-white/5 rounded-2xl">
            <GitFork className="w-10 h-10 mx-auto stroke-[1.2]" />
            <p className="text-xs font-semibold">No workflows found. Tap "New Workflow" to begin.</p>
          </div>
        ) : (
          filteredWorkflows.map((wf) => (
            <div 
              key={wf.id}
              onClick={() => router.push(`/workflows/${wf.id}/builder`)}
              className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer select-none group"
            >
              <div className="flex items-start gap-4 flex-1">
                {/* Visual Icon indicator */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 text-white/50 group-hover:text-orange-400 group-hover:border-orange-500/20 transition-all shrink-0 bg-neutral-900">
                  <GitFork className="w-5 h-5" />
                </div>
                
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-white tracking-wide truncate">{wf.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      wf.status === 'active' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-500/20' :
                      wf.status === 'paused' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' :
                      'bg-white/5 text-white/40 border border-white/10'
                    }`}>
                      {wf.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed font-medium line-clamp-2 pr-4">{wf.description}</p>
                </div>
              </div>

              {/* Operations indicators and controls */}
              <div className="flex items-center justify-end gap-6 shrink-0 w-full md:w-auto border-t md:border-none border-white/5 pt-4 md:pt-0">
                <div className="text-[10px] text-white/40 font-medium space-y-1 text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Clock className="w-3.5 h-3.5 text-white/20" />
                    <span>Trigger: **{wf.triggerType}**</span>
                  </div>
                  <div>**{wf.nodesCount || wf.nodes?.length || 0}** blocks active • Created {wf.createdAt}</div>
                </div>

                {/* Direct Control Triggers */}
                <div className="flex items-center gap-3">
                  {/* Status Toggle Switch */}
                  {wf.status !== 'draft' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleStatus(wf.id); }}
                      className="text-white/60 hover:text-white transition-colors cursor-pointer"
                      title={wf.status === 'active' ? 'Pause Pipeline' : 'Resume Pipeline'}
                    >
                      {wf.status === 'active' ? (
                        <ToggleRight className="w-8 h-8 text-orange-400" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-white/30" />
                      )}
                    </button>
                  )}

                  {/* Edit Button */}
                  <button 
                    onClick={() => router.push(`/workflows/${wf.id}/builder`)}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 flex items-center justify-center cursor-pointer transition-colors"
                    title="Open Visual Builder"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button 
                    onClick={(e) => deleteWorkflow(wf.id, e)}
                    className="w-8 h-8 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border border-rose-500/10 flex items-center justify-center cursor-pointer transition-colors"
                    title="Delete Workflow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
