'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  SkipForward, 
  RefreshCw, 
  CornerDownRight,
  Sparkles,
  HelpCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { storage, RunLog } from '@/lib/storage-engine';

export default function LogsPage() {
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // AI Self-Healing Troubleshooter States
  const [healingRunId, setHealingRunId] = useState<string | null>(null);
  const [healingStep, setHealingStep] = useState<number>(0);
  const [healingLogs, setHealingLogs] = useState<string[]>([]);
  const [isHealingComplete, setIsHealingComplete] = useState<boolean>(false);

  useEffect(() => {
    setLogs(storage.getRuns());
    setIsLoading(false);
  }, []);

  const startAIHealing = (runId: string) => {
    setHealingRunId(runId);
    setHealingStep(0);
    setHealingLogs([]);
    setIsHealingComplete(false);
  };

  useEffect(() => {
    if (!healingRunId || isHealingComplete) return;

    const simulationSteps = [
      {
        message: "🔍 Initiating deep stack trace analysis for execution " + healingRunId + "...",
        delay: 800
      },
      {
        message: "⚠️ Error Segment Identified:\n   - Step: 'Auto Gmail Response'\n   - Type: send_email\n   - Code: OAUTH_TOKEN_EXPIRED\n   - Message: Gmail OAuth token expired.",
        delay: 1000
      },
      {
        message: "🧠 AI Reasoning Core:\n   - Cause: Expired session lease for account pratheek@startup.co.\n   - Recommendation: Execute automated secure OAuth token heal protocol.",
        delay: 900
      },
      {
        message: "🛡️ Accessing credential isolation safe vault...",
        delay: 700
      },
      {
        message: "🔑 Refreshing OAuth credentials via Zapier Central background gateway...",
        delay: 1100
      },
      {
        message: "⚡ Credentials healed! Refreshed session token acquired for Gmail. Re-dispatching workflow queue...",
        delay: 800
      },
      {
        message: "📤 Dispatching email payload to destination Server:\n   - To: donald@storybrand.com\n   - Subject: Welcome to Startup Co!\n   - Status: HTTP 200 OK (Gmail Send Success)",
        delay: 1000
      },
      {
        message: "✅ Self-Healing Complete! Workflow run status upgraded to COMPLETED.",
        delay: 500
      }
    ];

    let currentStep = 0;
    let timerId: any = null;

    const executeNextStep = () => {
      if (currentStep < simulationSteps.length) {
        const step = simulationSteps[currentStep];
        setHealingLogs(prev => [...prev, step.message]);
        setHealingStep(currentStep + 1);
        currentStep++;
        
        if (currentStep === simulationSteps.length) {
          // Heal state in localStorage
          const list = storage.getRuns();
          const updated = list.map(run => {
            if (run.id === healingRunId) {
              const updatedNodes = run.nodes.map(node => {
                if (node.status === 'failed') {
                  return { 
                    ...node, 
                    status: 'success' as const, 
                    error: undefined, 
                    output: { 
                      retried_via: 'AI Self-Healing Engine', 
                      refreshed_token: true,
                      messageId: 'msg_healed_7f90e2b' 
                    } 
                  };
                }
                return node;
              });
              return { 
                ...run, 
                status: 'completed' as const, 
                nodes: updatedNodes, 
                completedAt: new Date().toISOString() 
              };
            }
            return run;
          });
          storage.saveRuns(updated);
          setLogs(updated);
          setIsHealingComplete(true);
        } else {
          timerId = setTimeout(executeNextStep, step.delay);
        }
      }
    };

    timerId = setTimeout(executeNextStep, 400);
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [healingRunId]);

  const toggleExpand = (runId: string) => {
    setExpandedRunId(prev => (prev === runId ? null : runId));
  };

  const handleApprove = (runId: string) => {
    const list = storage.getRuns();
    const updated = list.map(run => {
      if (run.id === runId) {
        // Resolve running node to success
        const updatedNodes = run.nodes.map(node => {
          if (node.status === 'running') {
            return { ...node, status: 'success' as const, duration: '120ms', output: { approved: true, timestamp: new Date().toISOString() } };
          }
          return node;
        });
        return { ...run, status: 'completed' as const, nodes: updatedNodes };
      }
      return run;
    });
    storage.saveRuns(updated);
    setLogs(updated);
  };

  const handleRetry = (runId: string) => {
    const list = storage.getRuns();
    const updated = list.map(run => {
      if (run.id === runId) {
        // Mock retry workflow node back to running -> success
        const updatedNodes = run.nodes.map(node => {
          if (node.status === 'failed') {
            return { ...node, status: 'success' as const, error: undefined, output: { retried: true, messageId: 'msg_retry_10928' } };
          }
          return node;
        });
        return { ...run, status: 'completed' as const, nodes: updatedNodes, completedAt: new Date().toISOString() };
      }
      return run;
    });
    storage.saveRuns(updated);
    setLogs(updated);
  };

  const handleResetLogs = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zc_runs');
    }
    setLogs(storage.getRuns());
  };

  const filteredLogs = logs.filter(run => {
    const matchesSearch = run.id.toLowerCase().includes(search.toLowerCase()) || 
                          run.workflowName.toLowerCase().includes(search.toLowerCase()) ||
                          run.triggerType.toLowerCase().includes(search.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    return matchesSearch && run.status === activeFilter;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 flex-1 w-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Execution Logs</h2>
          <p className="text-sm text-white/40 mt-1">Audit execution traces, optimize operational paths, and authorize paused human-in-the-loop approvals.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleResetLogs}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white bg-white/5 border border-white/5 px-3.5 py-2 rounded-lg cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Logs</span>
          </button>
        </div>
      </div>

      {/* Filter and search controllers */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.02] p-4 rounded-xl border border-white/5">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search run IDs, workflows, triggers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {['all', 'completed', 'paused_approval', 'failed', 'running'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeFilter === f
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-white/40 hover:text-white/80 border border-transparent'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Expansible Runs Panel */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5">
          
          {isLoading ? (
            <div className="p-20 text-center text-white/20 space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-orange-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Accessing Logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-16 text-center text-white/20 space-y-2">
              <FileText className="w-8 h-8 mx-auto stroke-[1.5]" />
              <p className="text-xs font-semibold">No execution matching filters found.</p>
            </div>
          ) : (
            filteredLogs.map((run) => {
              const isExpanded = expandedRunId === run.id;
              
              return (
                <div key={run.id} className="transition-all duration-200">
                  {/* Summary Row */}
                  <div 
                    onClick={() => toggleExpand(run.id)}
                    className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-4">
                      {run.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {run.status === 'failed' && <XCircle className="w-4 h-4 text-rose-400" />}
                      {run.status === 'paused_approval' && <Clock className="w-4 h-4 text-amber-400 animate-pulse" />}
                      {run.status === 'running' && <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" />}
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{run.workflowName}</span>
                          <span className="text-[10px] font-mono text-orange-400">{run.id}</span>
                        </div>
                        <div className="text-[10px] text-white/40 mt-1 flex items-center gap-3">
                          <span>Trigger: **{run.triggerType}**</span>
                          <span>•</span>
                          <span>Started: **{run.startedAt}**</span>
                          {run.completedAt && (
                            <>
                              <span>•</span>
                              <span>Completed: **{run.completedAt}**</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {run.status === 'paused_approval' && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/20">
                          HITL Approval Pending
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="bg-black/35 border-t border-white/5 p-6 space-y-6 animate-in fade-in-20 duration-150">
                      
                      {/* Human-in-the-Loop Header Banner */}
                      {run.status === 'paused_approval' && (
                        <div className="glass-panel p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-bold text-white">Human-in-the-Loop Approval Required</h4>
                              <p className="text-[10px] text-white/60 leading-relaxed mt-0.5">
                                AI has generated a customized outbound pitch. Please verify the response below before authorizing dispatch.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => toggleExpand(run.id)}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white/60 hover:text-white border border-white/5 bg-white/5 cursor-pointer transition-colors"
                            >
                              Reject & Pause
                            </button>
                            <button 
                              onClick={() => handleApprove(run.id)}
                              className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold text-black bg-amber-400 hover:bg-amber-300 shadow-md shadow-amber-400/10 cursor-pointer transition-colors"
                            >
                              Approve & Send
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Failed banner */}
                      {run.status === 'failed' && (
                        <div className="glass-panel p-4 rounded-xl border border-rose-500/25 bg-rose-500/5 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-bold text-white">Execution Interrupted</h4>
                              <p className="text-[10px] text-white/60 leading-relaxed mt-0.5">
                                Step `Auto Gmail Response` failed due to credentials error. Reconnect integration or retry step.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => startAIHealing(run.id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-lg shadow-orange-500/20 cursor-pointer transition-all border border-orange-400/20 hover:scale-[1.02] active:scale-95 duration-150"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                              <span>✨ AI Auto-Heal & Retry</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Internal Nodes Audit Cards */}
                      <div className="space-y-4 relative pl-4 before:absolute before:inset-y-2 before:left-[11px] before:w-[1px] before:bg-white/10">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Step Traces:</span>
                        {run.nodes.map((node) => (
                          <div key={node.nodeId} className="relative group">
                            
                            {/* Branch Icon offset indicator */}
                            <div className="absolute -left-6 top-2.5 w-2 h-2 rounded-full border border-white/25 bg-neutral-950 flex items-center justify-center">
                              <div className={`w-1 h-1 rounded-full ${
                                node.status === 'success' ? 'bg-emerald-400' :
                                node.status === 'failed' ? 'bg-rose-400' :
                                node.status === 'running' ? 'bg-orange-400 animate-pulse' : 'bg-white/20'
                              }`} />
                            </div>

                            {/* Node box */}
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">{node.label}</span>
                                  <span className="text-[9px] font-mono text-white/30">{node.nodeId}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-white/40 font-medium">
                                  <span>{node.duration}</span>
                                  {node.status === 'success' && <span className="text-emerald-400">Success</span>}
                                  {node.status === 'failed' && <span className="text-rose-400">Failed</span>}
                                  {node.status === 'running' && <span className="text-orange-400 animate-pulse">Executing...</span>}
                                  {node.status === 'waiting' && <span className="text-white/20">Waiting</span>}
                                </div>
                              </div>

                              {/* Input and output detail toggles */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] pt-2 border-t border-white/5 font-mono">
                                <div className="space-y-1 bg-black/20 p-2.5 rounded-lg border border-white/5">
                                  <span className="text-white/30 font-bold block mb-1">Inputs:</span>
                                  <pre className="text-white/60 whitespace-pre-wrap leading-normal font-medium">{JSON.stringify(node.input, null, 2)}</pre>
                                </div>
                                <div className="space-y-1 bg-black/20 p-2.5 rounded-lg border border-white/5">
                                  <span className="text-white/30 font-bold block mb-1">Outputs:</span>
                                  {node.error ? (
                                    <pre className="text-rose-400 whitespace-pre-wrap leading-normal font-medium">{node.error}</pre>
                                  ) : (
                                    <pre className="text-emerald-400/80 whitespace-pre-wrap leading-normal font-medium">{JSON.stringify(node.output, null, 2)}</pre>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}

        </div>
      </div>

      {/* Autonomous AI troubleshooter overlay modal */}
      {healingRunId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative p-[1px] bg-gradient-to-br from-orange-500/40 via-amber-500/10 to-transparent rounded-2xl w-full max-w-xl mx-4 overflow-hidden shadow-2xl shadow-orange-500/10">
            <div className="bg-neutral-950 p-6 rounded-2xl space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange-500/20 blur-md rounded-full animate-pulse" />
                    <Sparkles className="w-5 h-5 text-orange-400 relative animate-spin [animation-duration:10s]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Autonomous AI Troubleshooter
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/25 animate-pulse">
                        Active
                      </span>
                    </h3>
                    <p className="text-[10px] font-mono text-white/40 mt-0.5">Diagnosing Run ID: {healingRunId}</p>
                  </div>
                </div>
                {!isHealingComplete && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                    <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">Self-Healing</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-mono text-white/30">
                  <span>Diagnostics Progress</span>
                  <span>{Math.round((healingStep / 8) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${(healingStep / 8) * 100}%` }}
                  />
                </div>
              </div>

              {/* Live Diagnostic Logs Terminal */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">AI Core Audit Traces:</span>
                <div className="bg-black/60 border border-white/5 font-mono p-4 rounded-xl text-[10px] leading-relaxed max-h-64 overflow-y-auto space-y-2.5 h-64 flex flex-col justify-start">
                  {healingLogs.map((log, index) => {
                    const isError = log.includes('⚠️');
                    const isSuccess = log.includes('✅') || log.includes('[SUCCESS]');
                    const isWarning = log.includes('🧠') || log.includes('🛡️');
                    
                    let textColor = 'text-white/60';
                    if (isError) textColor = 'text-rose-400 font-semibold';
                    else if (isSuccess) textColor = 'text-emerald-400 font-bold';
                    else if (isWarning) textColor = 'text-amber-300';

                    return (
                      <div key={index} className={`whitespace-pre-wrap ${textColor} border-l-2 pl-2.5 transition-all ${
                        isError ? 'border-rose-500/40 bg-rose-500/5 py-1 rounded' :
                        isSuccess ? 'border-emerald-500/40 bg-emerald-500/5 py-1 rounded' :
                        isWarning ? 'border-amber-500/40 bg-amber-500/5 py-1 rounded' : 'border-white/10'
                      }`}>
                        {log}
                      </div>
                    );
                  })}
                  {!isHealingComplete && (
                    <div className="flex items-center gap-2 text-white/30 animate-pulse mt-1 pl-3">
                      <RefreshCw className="w-3 h-3 animate-spin text-orange-400" />
                      <span>Computing self-healing telemetry...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
                {!isHealingComplete ? (
                  <button
                    onClick={() => setHealingRunId(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white/60 hover:text-white bg-white/5 border border-white/5 transition-all cursor-pointer"
                  >
                    Abort Diagnostics
                  </button>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5 animate-bounce">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Trace successfully repaired! Gmail node recovered.
                    </span>
                    <button
                      onClick={() => {
                        setHealingRunId(null);
                        setExpandedRunId('run_c9e2b');
                      }}
                      className="px-4.5 py-2 rounded-lg text-xs font-bold text-black bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 shadow-md shadow-orange-500/10 cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      Close & See Healed Trace
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
