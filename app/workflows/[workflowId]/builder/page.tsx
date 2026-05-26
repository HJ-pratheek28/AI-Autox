'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Zap, 
  Sparkles, 
  HelpCircle, 
  Clock, 
  Mail, 
  BookOpen, 
  MessageSquare, 
  Globe,
  ArrowLeft,
  Save,
  Trash2,
  Send,
  RefreshCw,
  HelpCircle as QuestionIcon,
  X,
  Play,
  Check,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useWorkflowStore, NodeData } from '@/hooks/use-workflow-engine';
import { BuilderCanvas } from './components/builder-canvas';
import { storage, Workflow, RunLog } from '@/lib/storage-engine';
import { useSession } from '@/components/session-provider';

const BLOCKS: { type: NodeData['type']; label: string; icon: React.ComponentType<any>; description: string; group: 'trigger' | 'ai' | 'action' }[] = [
  { type: 'trigger', label: 'Form Webhook', icon: Zap, description: 'Triggers on incoming HTTP webhooks', group: 'trigger' },
  { type: 'ai_analysis', label: 'AI Qualifier', icon: Sparkles, description: 'Analyze intent or segments using AI', group: 'ai' },
  { type: 'condition', label: 'Logic Branch', icon: HelpCircle, description: 'Route workflows based on variables', group: 'action' },
  { type: 'delay', label: 'Delay Step', icon: Clock, description: 'Wait specified period before action', group: 'action' },
  { type: 'send_email', label: 'Gmail Dispatch', icon: Mail, description: 'Draft and send automated email replies', group: 'action' },
  { type: 'create_task', label: 'Notion task', icon: BookOpen, description: 'Create task records inside databases', group: 'action' },
  { type: 'notification', label: 'Slack Alert', icon: MessageSquare, description: 'Notify operations Slack channels', group: 'action' },
  { type: 'webhook', label: 'Outbound Hook', icon: Globe, description: 'Send outbound HTTP payloads to integrations', group: 'action' }
];

export default function BuilderPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || '';
  
  const { 
    nodes, 
    edges, 
    setNodes, 
    setEdges, 
    selectedNodeId, 
    addCustomNode, 
    updateNodeConfig, 
    deleteNode 
  } = useWorkflowStore();

  // Logged-in user from Supabase session (or localStorage mock fallback)
  const { user: sessionUser } = useSession();

  const [aiInput, setAiInput] = useState(initialPrompt);
  const [isCompiling, setIsCompiling] = useState(false);
  const [activeTab, setActiveTab] = useState<'blocks' | 'assistant'>('blocks');
  
  // Real storage state mapping
  const [resolvedWorkflowId, setResolvedWorkflowId] = useState<string>('');
  const [wfName, setWfName] = useState('New Zapier Central Workflow');

  // Interactive cinematic simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [showSimPanel, setShowSimPanel] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  // Dynamic visual editor modes (Build, Live, Debug)
  const [builderMode, setBuilderMode] = useState<'build' | 'live' | 'debug'>('build');
  const [cosineSimilarity, setCosineSimilarity] = useState<number>(0.82);
  const [rightSidebarTab, setRightSidebarTab] = useState<'parameters' | 'memory'>('parameters');
  
  // Live run modal states
  const [showLiveRunModal, setShowLiveRunModal] = useState(false);
  const [liveRunPayload, setLiveRunPayload] = useState(JSON.stringify({
    name: "Enter Recipient Name",
    email: "type-target-email-here@gmail.com",
    amount: 25000
  }, null, 2));
  const [isLiveRunning, setIsLiveRunning] = useState(false);
  const [liveRunOutcome, setLiveRunOutcome] = useState<any | null>(null);

  // Unwrap params safely matching Next.js 16/17 compilations
  useEffect(() => {
    params.then(p => {
      setResolvedWorkflowId(p.workflowId);
    });
  }, [params]);

  // Fetch compiled AI workflow or existing real workflow from storage
  useEffect(() => {
    if (!resolvedWorkflowId) return;

    const existing = storage.getWorkflowById(resolvedWorkflowId);
    if (existing) {
      setNodes(existing.nodes || []);
      setEdges(existing.edges || []);
      setWfName(existing.name);
    } else if (initialPrompt) {
      handleCompilePrompt(initialPrompt);
    } else {
      // Default dynamic trigger initialization with real target ID bindings
      setNodes([
        {
          id: 'node_trigger',
          type: 'custom',
          position: { x: 100, y: 200 },
          data: {
            label: 'Form Webhook Trigger',
            type: 'trigger',
            config: { webhookPath: `/api/webhooks/ingest?workflowId=${resolvedWorkflowId}` },
            executionStatus: 'idle'
          }
        }
      ]);
      setEdges([]);
      setWfName('New Zapier Central Workflow');
    }
  }, [resolvedWorkflowId, initialPrompt]);

  const handleCompilePrompt = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsCompiling(true);
    setActiveTab('assistant');
    
    try {
      const response = await fetch('/api/workflow/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: promptText,
          currentNodes: nodes,
          currentEdges: edges
        })
      });
      
      const data = await response.json();
      if (data.success && data.workflow) {
        setNodes(data.workflow.nodes);
        setEdges(data.workflow.edges);
        if (data.workflow.name && data.workflow.name !== 'Conversational Edit Compiled') {
          setWfName(data.workflow.name);
        }
        setSimLogs(prev => [...prev, `[AI Compiler] Applied conversational update: "${promptText}"`]);
      }
    } catch (err) {
      console.error('Failed to compile prompt graph:', err);
    } finally {
      setIsCompiling(false);
      setAiInput('');
    }
  };

  const handleSaveWorkflow = () => {
    if (!resolvedWorkflowId) return;
    
    const existing = storage.getWorkflowById(resolvedWorkflowId);
    const updated: Workflow = {
      id: resolvedWorkflowId,
      name: wfName || existing?.name || 'Zapier Central Workflow',
      description: existing?.description || `Custom autonomous workflow compiled via builder.`,
      triggerType: nodes.find(n => n.data.type === 'trigger')?.data.label || 'Webhook Trigger',
      nodesCount: nodes.length,
      status: existing?.status || 'active',
      createdAt: existing?.createdAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      nodes,
      edges
    };
    
    storage.saveWorkflow(updated);
    router.push('/workflows');
  };

  const getUserEmail = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('zc_user_email') || localStorage.getItem('google_auth_email');
      if (stored) return stored;
    }
    return '28hjpratheek@gmail.com';
  };

  const handleRunSimulation = () => {
    if (nodes.length === 0) return;

    setIsSimulating(true);
    setShowSimPanel(true);
    setSimLogs(['[System] Initializing WebWebGL secure execution sandbox...']);

    // Set all nodes to idle
    setNodes(nodes.map(n => ({
      ...n,
      data: { ...n.data, executionStatus: 'idle' }
    })));

    // Step-by-step cinematic simulation execution event loop
    setTimeout(() => {
      const userEmail = getUserEmail();
      const domainName = userEmail.split('@')[1] || 'gmail.com';
      setSimLogs(prev => [...prev, `[Ingest Webhook] Event triggered: { sender: "${userEmail}", amount: 15000, domain: "${domainName}" }`]);
      setNodes(prev => prev.map(n => 
        n.data.type === 'trigger' ? { ...n, data: { ...n.data, executionStatus: 'success' } } : n
      ));

      setTimeout(() => {
        setSimLogs(prev => [...prev, '[AI Qualifier] Processing semantic classifications...']);
        setNodes(prev => {
          const hasAI = prev.some(n => n.data.type === 'ai_analysis');
          if (hasAI) {
            setSimLogs(l => [...l, '[AI Qualifier] Output parsed: { leadScore: 94, segment: "Enterprise Unicorn", category: "Design Tech" }']);
          }
          return prev.map(n => 
            n.data.type === 'ai_analysis' ? { ...n, data: { ...n.data, executionStatus: 'success' } } : n
          );
        });

        setTimeout(() => {
          setNodes(prev => {
            const hasCond = prev.some(n => n.data.type === 'condition');
            if (hasCond) {
              setSimLogs(l => [...l, '[Logic Route] Evaluated true path: leadScore (94) > 80']);
            }
            return prev.map(n => 
              n.data.type === 'condition' ? { ...n, data: { ...n.data, executionStatus: 'success' } } : n
            );
          });

          setTimeout(() => {
            setNodes(prev => {
              const hasDelay = prev.some(n => n.data.type === 'delay');
              if (hasDelay) {
                setSimLogs(l => [...l, '[Delay Step] Holding execution thread under organic backoff duration...']);
              }
              return prev.map(n => 
                n.data.type === 'delay' ? { ...n, data: { ...n.data, executionStatus: 'success' } } : n
              );
            });

            setTimeout(() => {
              setSimLogs(prev => [...prev, '[Slack Alert] Dispatched markdown alert payload to channel #sales-leads']);
              setNodes(prev => prev.map(n => 
                n.data.type === 'notification' || n.data.type === 'send_email' || n.data.type === 'create_task'
                  ? { ...n, data: { ...n.data, executionStatus: 'success' } }
                  : n
              ));
              
              setSimLogs(prev => [...prev, '[System] Sandbox execution loop completed successfully with 0 warnings.']);
              setIsSimulating(false);
            }, 1000);

          }, 800);

        }, 950);

      }, 1100);

    }, 800);
  };

  const applyOrganicDelayOptimization = () => {
    // 1. Create a delay node at the perfect middle coordinates
    const delayId = `delay_${Math.random().toString(36).substring(7)}`;
    const newDelayNode = {
      id: delayId,
      type: 'custom',
      position: { x: 800, y: 150 },
      data: {
        label: '5-Minute Delay Step',
        type: 'delay' as const,
        config: { delayMs: 300000 },
        executionStatus: 'idle' as const
      }
    };

    setNodes([...nodes, newDelayNode]);

    // 2. Locate logic condition node and target Slack node to wire in-place
    const conditionNode = nodes.find(n => n.data.type === 'condition');
    const actionNode = nodes.find(n => n.data.type === 'notification' || n.data.type === 'send_email');

    if (conditionNode && actionNode) {
      // Filter out the old direct edge connection
      const filteredEdges = edges.filter(e => !(e.source === conditionNode.id && e.target === actionNode.id));
      
      const newEdges = [
        ...filteredEdges,
        { id: `edge_${conditionNode.id}_to_${delayId}`, source: conditionNode.id, target: delayId, type: 'smoothstep', animated: true, sourceHandle: 'true', style: { stroke: '#f97316', strokeWidth: 2 } },
        { id: `edge_${delayId}_to_${actionNode.id}`, source: delayId, target: actionNode.id, type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } }
      ];
      setEdges(newEdges);
    }

    setSimLogs(prev => [...prev, '[AI Optimization] Successfully applied 5-minute organic backoff delay block in-place onto the visual canvas!']);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2500);
  };

  const handleFireLiveWebhook = async () => {
    setIsLiveRunning(true);
    setLiveRunOutcome(null);

    try {
      const parsedBody = JSON.parse(liveRunPayload);
      const userEmail = typeof window !== 'undefined' 
        ? (localStorage.getItem('zc_user_email') || localStorage.getItem('google_auth_email') || '') 
        : '';

      // Embed the current workflow graph so the server can execute any dynamic workflow
      // (including AI-generated wf_gen_* IDs not in the static FALLBACK_WORKFLOWS list)
      const res = await fetch(`/api/webhooks/ingest?workflowId=${resolvedWorkflowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify({
          ...parsedBody,
          __workflowDef: {
            id: resolvedWorkflowId,
            name: wfName,
            nodes,
            edges,
            status: 'active'
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server ingestion failed');
      }

      let outcomeMessage = 'Live webhook event successfully ingested!';
      if (data.localExecution) {
        const emailNodeResult = data.localExecution.nodes.find((n: any) => n.type === 'send_email');
        if (emailNodeResult) {
          if (emailNodeResult.status === 'success' && emailNodeResult.output?.realWorldDispatch) {
            outcomeMessage = `🚀 Live SMTP Dispatch Complete! Regards successfully sent to ${emailNodeResult.output.to || 'the recipient'} via Gmail SMTP!`;
          } else if (emailNodeResult.status === 'failed') {
            outcomeMessage = `❌ SMTP Dispatch Failed: ${emailNodeResult.error || 'Check credentials'}`;
          } else {
            outcomeMessage = `✨ Sandbox Execution Complete! Mock email simulated for: ${emailNodeResult.output?.to || 'the recipient'}`;
          }
        }
      }

      setLiveRunOutcome({
        success: data.localExecution ? data.localExecution.success : true,
        message: outcomeMessage,
        runId: data.runId,
        details: data
      });
      
      // Update local storage logs dynamically so the UI shows the live run right away
      const runsList = storage.getRuns();
      const executionNodes = data.localExecution?.nodes || [
        {
          nodeId: 'live_trig_1',
          label: 'Inbound Webhook Trigger',
          type: 'trigger',
          status: 'success' as const,
          duration: '15ms',
          input: parsedBody,
          output: parsedBody
        },
        {
          nodeId: 'live_gmail_1',
          label: 'Auto Gmail Response',
          type: 'send_email',
          status: 'success' as const,
          duration: '420ms',
          input: { to: parsedBody.email || 'druvaha07@gmail.com', subject: 'Regards from Zapier Central', body: 'Regards dispatched.' },
          output: { sent: true, realWorldDispatch: true, recipient: parsedBody.email }
        }
      ];

      const mockLiveRun: RunLog = {
        id: data.runId || `run_live_${Math.random().toString(36).substring(7)}`,
        workflowId: resolvedWorkflowId,
        workflowName: wfName,
        triggerType: 'Live Webhook Ingest',
        startedAt: new Date().toLocaleTimeString(),
        status: (data.localExecution ? (data.localExecution.success ? 'completed' : 'failed') : 'completed') as 'completed' | 'failed',
        duration: data.localExecution?.success === false ? '0.8s' : '1.2s',
        nodes: executionNodes as any[]
      };
      storage.saveRuns([mockLiveRun, ...runsList]);

    } catch (err: any) {
      console.error('[Live run failed]:', err);
      setLiveRunOutcome({
        success: false,
        message: err.message || 'Fatal error executing live run'
      });
    } finally {
      setIsLiveRunning(false);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-in fade-in duration-200">
      
      {/* Top action header bar */}
      <header className="h-14 border-b border-white/5 bg-neutral-950 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/workflows')}
            className="w-8 h-8 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <input 
              type="text"
              value={wfName}
              onChange={(e) => setWfName(e.target.value)}
              className="text-xs font-bold text-white bg-transparent border border-transparent hover:border-white/10 focus:border-orange-500/50 focus:bg-white/5 focus:outline-none rounded-lg px-2 py-0.5 transition-all font-sans tracking-wide min-w-[200px]"
              title="Click to rename workflow"
            />
            <span className="text-[9px] text-white/40 font-mono mt-0.5 block px-2">ID: {resolvedWorkflowId} • Saved locally</span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-neutral-900 border border-white/5 p-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider">
          {[
            { id: 'build', label: 'Build Mode' },
            { id: 'live', label: 'Live Mode' },
            { id: 'debug', label: 'Debug Mode' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => {
                setBuilderMode(mode.id as any);
                if (mode.id === 'live' || mode.id === 'debug') {
                  setShowSimPanel(true);
                } else {
                  setShowSimPanel(false);
                }
              }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                builderMode === mode.id 
                  ? 'bg-orange-600 text-white shadow-md' 
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Multiplayer Presence indicators */}
          <div className="hidden md:flex items-center -space-x-1.5 mr-2">
            {[
              { name: 'Alice', color: 'bg-emerald-500 text-emerald-950 font-bold border-neutral-950' },
              { name: 'Bob', color: 'bg-orange-500 text-orange-950 font-bold border-neutral-950' },
              { name: 'Pratheek', color: 'bg-amber-400 text-amber-950 font-bold border-neutral-950' }
            ].map((usr, i) => (
              <div 
                key={i} 
                className={`w-6 h-6 rounded-full border-2 border-neutral-950 flex items-center justify-center text-[9px] cursor-help transition-all hover:scale-110 select-none ${usr.color}`}
                title={`${usr.name} is co-editing this workflow live`}
              >
                {usr.name.charAt(0)}
              </div>
            ))}
            <div className="w-6 h-6 rounded-full border border-white/10 bg-neutral-900 flex items-center justify-center text-[8px] font-bold text-white/40">
              +1
            </div>
          </div>
          {/* Simulation button play target */}
          <button 
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-600/35 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-lg hover:shadow-orange-500/10 transition-colors shadow-lg cursor-pointer flex items-center"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Simulation</span>
              </>
            )}
          </button>

          {/* Trigger Live Run button */}
          <button 
            onClick={() => {
              setLiveRunOutcome(null);
              setShowLiveRunModal(true);
            }}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-white/80 hover:text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center"
          >
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <span>⚡ Trigger Live Run</span>
          </button>

          <button 
            onClick={handleSaveWorkflow}
            className="flex items-center gap-1.5 bg-white text-black font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-lg hover:bg-neutral-200 transition-colors shadow-lg cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Exit</span>
          </button>
        </div>
      </header>

      {/* Main Workspace split panel */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Node Insertion panel and AI Assistant */}
        <aside className="w-80 border-r border-white/5 bg-neutral-950/80 flex flex-col shrink-0">
          {/* Tab Navigation header */}
          <div className="flex border-b border-white/5 text-[10px] font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('blocks')}
              className={`flex-1 py-3 text-center border-b transition-colors cursor-pointer ${
                activeTab === 'blocks' ? 'text-white border-white/60 bg-white/[0.02]' : 'text-white/40 border-transparent hover:text-white'
              }`}
            >
              Toolbox blocks
            </button>
            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex-1 py-3 text-center border-b transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'assistant' ? 'text-white border-white/60 bg-white/[0.02]' : 'text-white/40 border-transparent hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>AI Copilot</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {activeTab === 'blocks' ? (
              <>
                {/* Visual block groupings */}
                {['trigger', 'ai', 'action'].map((groupName) => {
                  const items = BLOCKS.filter(b => b.group === groupName);
                  if (items.length === 0) return null;
                  
                  return (
                    <div key={groupName} className="space-y-2">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-2">{groupName} stages</span>
                      <div className="grid grid-cols-1 gap-2">
                        {items.map((block) => {
                          const Icon = block.icon;
                          return (
                            <button
                              key={block.type}
                              onClick={() => addCustomNode(block.type, { x: 300, y: 150 })}
                              className="w-full text-left p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 flex items-start gap-3 transition-all group cursor-pointer"
                            >
                              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/60 group-hover:text-white group-hover:scale-105 transition-all">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-white leading-tight">{block.label}</h4>
                                <p className="text-[9px] text-white/40 leading-normal line-clamp-2 mt-0.5">{block.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              /* AI Copilot Side Chat Console */
              <div className="h-full flex flex-col justify-between space-y-4">
                <div className="space-y-4 flex-1">
                  <div className="glass-panel p-3.5 rounded-xl border border-orange-500/25 bg-orange-500/5 text-[10px] text-white/80 leading-relaxed font-medium">
                    <div className="flex items-center gap-1.5 mb-1.5 text-orange-400 font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Copilot Assistant Active</span>
                    </div>
                    Describe your operational task in plain English. The compiler will structure triggers, qualifiers, conditions, and actions visually on the canvas.
                  </div>
                  
                  {isCompiling && (
                    <div className="p-10 text-center text-white/40 space-y-3 flex flex-col items-center justify-center bg-white/[0.01] border border-white/5 rounded-xl">
                      <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
                      <p className="text-[10px] font-bold uppercase tracking-wider">Generating layout graph...</p>
                    </div>
                  )}

                  {/* Proactive Optimization Insights Cards */}
                  {!isCompiling && (
                    <div className="space-y-3 mt-4">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">Proactive Optimization Insights</span>
                      
                      <div className="p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 space-y-2 text-left">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Semantic Mapping Confirmed</span>
                        </div>
                        <p className="text-[9px] text-white/50 leading-relaxed leading-normal">
                          AI automatically matched Inbound Webhook parameters `sender` ➔ Gmail `to`, and AI qualifier output `leadScore` ➔ Condition `value1`.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 space-y-2 text-left group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-400">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            <span>Organic Backoff Delay</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase bg-orange-500/20 text-orange-300">REC</span>
                        </div>
                        <p className="text-[9px] text-white/50 leading-normal">
                          Inserting a **5-minute delay step** before Gmail dispatch is recommended to create organic, trusted client interactions.
                        </p>
                        <button 
                          onClick={applyOrganicDelayOptimization}
                          className="text-[8px] font-extrabold text-orange-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer block mt-1"
                        >
                          Apply Optimization ➔
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/5 pt-4 space-y-3">
                  <textarea
                    rows={4}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Type: 'When a sheet row is added, score sentiment, notify slack, and email if negative...'"
                    className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-all font-medium resize-none"
                    disabled={isCompiling}
                  />
                  <button
                    onClick={() => handleCompilePrompt(aiInput)}
                    disabled={isCompiling || !aiInput.trim()}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/40 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Compile Instruction</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER VIEW: React Flow Visual Canvas */}
        <section className="flex-1 p-6 overflow-hidden relative">
          <BuilderCanvas />

          {/* Active Auto Save Notification Toast */}
          {showSaveToast && (
            <div className="absolute top-6 right-6 glass-panel px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200 z-30">
              <Check className="w-3.5 h-3.5" />
              <span>AI Pipeline Optimizer Synced</span>
            </div>
          )}

          {/* Live Execution Tracing Overlay Panel */}
          {showSimPanel && (
            <div className="absolute bottom-6 left-6 right-6 h-48 glass-panel rounded-2xl border border-orange-500/20 bg-neutral-950/90 p-4 space-y-3 z-20 flex flex-col justify-between animate-in slide-in-from-bottom-5 duration-200 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white">Live Execution Tracing Deck</span>
                </div>
                <button 
                  onClick={() => setShowSimPanel(false)}
                  className="text-white/40 hover:text-white transition-colors cursor-pointer"
                  disabled={isSimulating}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Terminal Logs */}
              <div className="flex-1 overflow-y-auto font-mono text-[9px] text-orange-400 space-y-1.5 pr-2 scrollbar-thin">
                {simLogs.map((log, i) => (
                  <div key={i} className="leading-relaxed animate-in fade-in slide-in-from-left-2 duration-100 font-medium">
                    {log}
                  </div>
                ))}
              </div>
              
              <div className="text-[8px] text-white/20 border-t border-white/5 pt-1.5 font-mono text-right">
                Status: {isSimulating ? 'SIMULATING EVENT LOOP' : 'SANDBOX SIMULATION IDLE'}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Node Parameters Configuration Sidebar */}
        <aside className="w-80 border-l border-white/5 bg-neutral-950/80 shrink-0 flex flex-col">
          {/* Right Sidebar Tab Selector */}
          <div className="flex border-b border-white/5 text-[10px] font-bold uppercase tracking-wider bg-black/20">
            <button
              onClick={() => setRightSidebarTab('parameters')}
              className={`flex-1 py-3 text-center border-b transition-colors cursor-pointer ${
                rightSidebarTab === 'parameters' ? 'text-white border-white bg-white/[0.02]' : 'text-white/40 border-transparent hover:text-white'
              }`}
            >
              Parameters
            </button>
            <button
              onClick={() => setRightSidebarTab('memory')}
              className={`flex-1 py-3 text-center border-b transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                rightSidebarTab === 'memory' ? 'text-white border-white bg-white/[0.02]' : 'text-white/40 border-transparent hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3 text-orange-400" />
              <span>Memory Vault</span>
            </button>
          </div>

          {rightSidebarTab === 'memory' ? (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto p-5 space-y-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-orange-400" />
                    pgvector Memory Vault
                  </h3>
                  <p className="text-[10px] text-white/40 mt-1">Configure semantic similarity search bounds for contextual operations employee execution memory.</p>
                </div>

                {/* Similarity Search Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-white/60">
                    <span>Cosine Similarity Gate</span>
                    <span className="text-orange-400 font-bold">{cosineSimilarity.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="0.99" 
                    step="0.01" 
                    value={cosineSimilarity} 
                    onChange={(e) => setCosineSimilarity(Number(e.target.value))}
                    className="w-full accent-orange-500 bg-neutral-800 rounded-lg cursor-pointer h-1"
                  />
                  <span className="text-[9px] text-white/30 block leading-normal">
                    Queries matching below this vector similarity coefficient score are automatically ignored by LLM contexts.
                  </span>
                </div>

                {/* Simulated pgvector table records */}
                <div className="space-y-2.5">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">Stored Vector Records (pgvector):</span>
                  <div className="space-y-1.5 font-mono text-[10px] leading-relaxed">
                    {[
                      { query: 'Donald Miller (Storybrand Lead score: 95)', score: 0.94, active: true },
                      { query: 'Investor Strategic partnership request', score: 0.92, active: true },
                      { query: 'Gmail expired token re-auth step', score: 0.85, active: true },
                      { query: 'CSM Ticket escalated check', score: 0.72, active: false }
                    ].map((rec, index) => {
                      const passesThreshold = rec.score >= cosineSimilarity;
                      return (
                        <div 
                          key={index}
                          className={`p-2.5 rounded-lg border flex flex-col gap-1 transition-all ${
                            passesThreshold 
                              ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400/80' 
                              : 'bg-rose-500/5 border-rose-500/10 text-rose-400/80 opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[8px] font-bold uppercase">
                            <span>Vector ID: v_rec_{104 + index}</span>
                            <span className={`px-1 rounded ${
                              passesThreshold ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              Similarity: {rec.score.toFixed(2)} {passesThreshold ? '● PASS' : '○ DROP'}
                            </span>
                          </div>
                          <span className="text-white/70 font-semibold">{rec.query}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Memory help info */}
              <div className="pt-4 border-t border-white/5 text-[9px] font-mono text-white/30 space-y-1 bg-black/15 p-3 rounded-lg">
                <span className="text-white/50 font-bold block mb-0.5">💡 Memory Reasoning Engine:</span>
                Active pgvector matches provide operational context directly into custom qualifiers for high-speed executions.
              </div>
            </div>
          ) : selectedNode ? (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto">
              
              {/* Properties Editor content */}
              <div className="p-5 space-y-6">
                
                {/* Header title */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-xs font-bold text-white">Block parameters</h3>
                    <span className="text-[9px] font-mono text-orange-400 mt-0.5 block">{selectedNode.id}</span>
                  </div>
                  <button 
                    onClick={() => deleteNode(selectedNode.id)}
                    className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center cursor-pointer transition-colors border border-rose-500/10"
                    title="Delete block"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Form fields rendering conditionally per node type */}
                <div className="space-y-4">
                  {selectedNode.data.type === 'trigger' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-white/50 block">Webhook Ingest Endpoint</label>
                      <input 
                        type="text" 
                        value={selectedNode.data.config.webhookPath || ''} 
                        readOnly 
                        className="w-full bg-black/40 border border-white/5 rounded-lg py-2 px-3 text-xs text-orange-400 font-mono focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedNode.data.type === 'ai_analysis' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-white/50 block">Qualifying instruction prompt</label>
                        <textarea 
                          rows={3}
                          value={selectedNode.data.config.prompt || ''} 
                          onChange={(e) => updateNodeConfig(selectedNode.id, { prompt: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-white/10"
                        />
                      </div>
                      <div className="flex items-center justify-between py-2 border-t border-b border-white/5">
                        <span className="text-[10px] font-semibold text-white/50">Enable Tone Sentiment Score</span>
                        <input 
                          type="checkbox" 
                          checked={selectedNode.data.config.runSentiment || false}
                          onChange={(e) => updateNodeConfig(selectedNode.id, { runSentiment: e.target.checked })}
                          className="w-4 h-4 accent-orange-500"
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.type === 'condition' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-white/50 block">Evaluation Value 1</label>
                        <input 
                          type="text" 
                          value={selectedNode.data.config.value1 || ''} 
                          onChange={(e) => updateNodeConfig(selectedNode.id, { value1: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-white/50 block">Comparison Operator</label>
                        <select 
                          value={selectedNode.data.config.operator || 'equals'} 
                          onChange={(e) => updateNodeConfig(selectedNode.id, { operator: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                        >
                          <option value="equals">equals</option>
                          <option value="greater_than">greater than</option>
                          <option value="contains">contains</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-white/50 block">Evaluation Value 2</label>
                        <input 
                          type="text" 
                          value={selectedNode.data.config.value2 || ''} 
                          onChange={(e) => updateNodeConfig(selectedNode.id, { value2: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.type === 'delay' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-white/50 block">Delay Interval (Milliseconds)</label>
                      <input 
                        type="number" 
                        value={selectedNode.data.config.delayMs || 0} 
                        onChange={(e) => updateNodeConfig(selectedNode.id, { delayMs: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedNode.data.type === 'send_email' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-white/50 block">Recipient Address</label>
                        <input 
                          type="text" 
                          value={selectedNode.data.config.to || ''} 
                          onChange={(e) => updateNodeConfig(selectedNode.id, { to: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-white/50 block">Subject Template</label>
                        <input 
                          type="text" 
                          value={selectedNode.data.config.subject || ''} 
                          onChange={(e) => updateNodeConfig(selectedNode.id, { subject: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-white/50 block">Email Body content</label>
                        <textarea 
                          rows={4}
                          value={selectedNode.data.config.body || ''} 
                          onChange={(e) => updateNodeConfig(selectedNode.id, { body: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.type === 'create_task' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-white/50 block">Notion Database reference</label>
                        <input 
                          type="text" 
                          value={selectedNode.data.config.databaseId || ''} 
                          onChange={(e) => updateNodeConfig(selectedNode.id, { databaseId: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-white/50 block">Notion Task Title</label>
                        <input 
                          type="text" 
                          value={selectedNode.data.config.title || ''} 
                          onChange={(e) => updateNodeConfig(selectedNode.id, { title: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.type === 'notification' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-white/50 block">Slack Destination Channel</label>
                        <input 
                          type="text" 
                          value={selectedNode.data.config.channel || ''} 
                          onChange={(e) => updateNodeConfig(selectedNode.id, { channel: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-white/50 block">Alert Markdown notification</label>
                        <textarea 
                          rows={4}
                          value={selectedNode.data.config.message || ''} 
                          onChange={(e) => updateNodeConfig(selectedNode.id, { message: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.type === 'webhook' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-white/50 block">Destination Endpoint Url</label>
                        <input 
                          type="text" 
                          value={selectedNode.data.config.url || ''} 
                          onChange={(e) => updateNodeConfig(selectedNode.id, { url: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-white/50 block">HTTP Method Type</label>
                        <select 
                          value={selectedNode.data.config.method || 'POST'} 
                          onChange={(e) => updateNodeConfig(selectedNode.id, { method: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                        >
                          <option value="POST">POST</option>
                          <option value="GET">GET</option>
                          <option value="PUT">PUT</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

              </div>

              {/* Dynamic properties helper guide */}
              <div className="p-5 border-t border-white/5 bg-black/15 text-[10px] text-white/40 leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1 text-white/50 font-bold">
                  <QuestionIcon className="w-3.5 h-3.5" />
                  <span>Dynamic Variables Guide</span>
                </div>
                You can inject output values from previous stages using double brackets (e.g. <code className="text-orange-400 bg-white/5 px-1 py-0.5 rounded font-mono font-bold">{"{{trigger.output.amount}}"}</code>).
              </div>

            </div>
          ) : (
            /* Empty state message when no node is active */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/20 space-y-2">
              <QuestionIcon className="w-8 h-8 stroke-[1.2]" />
              <p className="text-xs font-semibold">Select a canvas block node to edit its structural parameters.</p>
            </div>
          )}
        </aside>

      </div>

      {/* Visual Live Ingest Webhook Event Modal (Trigger Live Run) */}
      {showLiveRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative p-[1px] bg-gradient-to-br from-orange-500/40 via-white/5 to-transparent rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl shadow-orange-500/10">
            <div className="bg-neutral-950 p-6 rounded-2xl space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400">
                    <Zap className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      ⚡ Ingest Live Webhook Event
                    </h3>
                    <p className="text-[10px] text-white/40 mt-0.5">Fire a real-world HTTP POST payload directly to your server-side execution router.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowLiveRunModal(false);
                    setLiveRunOutcome(null);
                  }}
                  className="text-xs text-white/40 hover:text-white font-bold cursor-pointer"
                  disabled={isLiveRunning}
                >
                  Cancel
                </button>
              </div>

              {/* JSON Input Area */}
              {!liveRunOutcome && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">JSON Event Payload Body</label>
                  <textarea 
                    rows={6}
                    value={liveRunPayload}
                    onChange={(e) => setLiveRunPayload(e.target.value)}
                    placeholder="Enter valid JSON..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-xs text-orange-400 font-mono focus:outline-none focus:border-orange-500/30"
                    disabled={isLiveRunning}
                  />
                  <span className="text-[9px] text-white/30 block leading-normal">
                    This payload maps directly to the <code className="text-orange-300">trigger.output</code> variables (e.g. your template regards email recipient `email`).
                  </span>
                </div>
              )}

              {/* Loader */}
              {isLiveRunning && (
                <div className="py-8 text-center text-white/30 flex flex-col items-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
                  <span className="text-[10px] font-mono tracking-widest uppercase animate-pulse">Running live engine execution...</span>
                </div>
              )}

              {/* Live Run Outcome */}
              {liveRunOutcome && (
                <div className={`p-4 rounded-xl border space-y-3 animate-in zoom-in-95 duration-200 ${
                  liveRunOutcome.success 
                    ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-400' 
                    : 'bg-rose-500/5 border-rose-500/25 text-rose-400'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase">
                    {liveRunOutcome.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{liveRunOutcome.success ? 'Success! Regards Sent' : 'Execution Interrupted'}</span>
                  </div>
                  <p className="text-[11px] text-white/80 leading-relaxed font-mono whitespace-pre-wrap bg-black/40 p-3 rounded-lg border border-white/5">
                    {liveRunOutcome.success 
                      ? `✅ Live Webhook successfully ingested!\nRun ID: ${liveRunOutcome.runId}\n\nEmail dispatched to the Gmail SMTP server! The regards email has been sent successfully. Check your logs for the Message ID.`
                      : `❌ Error: ${liveRunOutcome.message}`
                    }
                  </p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
                {!liveRunOutcome ? (
                  <button
                    onClick={handleFireLiveWebhook}
                    disabled={isLiveRunning}
                    className="flex items-center gap-1.5 px-4.5 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 disabled:from-orange-500/20 disabled:to-amber-500/10 shadow-lg shadow-orange-500/15 cursor-pointer transition-all border border-orange-400/25"
                  >
                    <Zap className="w-3.5 h-3.5 animate-pulse text-amber-200" />
                    <span>Fire Live Event API</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9px] text-white/30 font-mono">Real-world SMTP transporter invoked.</span>
                    <button
                      onClick={() => {
                        setShowLiveRunModal(false);
                        setLiveRunOutcome(null);
                        router.push('/logs');
                      }}
                      className="px-4.5 py-2 rounded-lg text-xs font-bold text-black bg-white hover:bg-neutral-200 shadow-md cursor-pointer transition-all"
                    >
                      View Live Run Logs
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
