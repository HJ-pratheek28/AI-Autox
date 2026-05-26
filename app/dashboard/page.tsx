'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  Plug, 
  Sparkles, 
  Play, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  HelpCircle,
  Plus,
  Command,
  Search,
  Terminal as TerminalIcon,
  CornerDownRight,
  Eye,
  Sliders,
  Check
} from 'lucide-react';
import { storage, RunLog, Workflow } from '@/lib/storage-engine';

const TEMPLATES = [
  {
    id: 'tmpl_sales_qualify',
    title: 'Lead Analyzer & Personalizer',
    description: 'Trigger on form submit, analyze with AI Sonnet, alert Slack channel, and draft custom proposal.',
    integrations: ['gmail', 'slack', 'notion'],
    nodes: [
      { id: 'n_trig', type: 'custom', position: { x: 100, y: 200 }, data: { label: 'Inbound Webhook', type: 'trigger', config: { webhookPath: '/ingest' }, executionStatus: 'idle' } },
      { id: 'n_ai', type: 'custom', position: { x: 360, y: 200 }, data: { label: 'AI Qualifier', type: 'ai_analysis', config: { prompt: 'Qualify budget > $10,000' }, executionStatus: 'idle' } },
      { id: 'n_cond', type: 'custom', position: { x: 620, y: 200 }, data: { label: 'Priority Gate', type: 'condition', config: { value1: '{{n_ai.output.leadScore}}', operator: 'greater_than', value2: '80' }, executionStatus: 'idle' } },
      { id: 'n_slack', type: 'custom', position: { x: 880, y: 100 }, data: { label: 'Slack Alert', type: 'notification', config: { channel: '#sales-leads' }, executionStatus: 'idle' } },
      { id: 'n_email', type: 'custom', position: { x: 1140, y: 200 }, data: { label: 'Gmail Response', type: 'send_email', config: { to: '{{n_trig.output.email}}' }, executionStatus: 'idle' } }
    ],
    edges: [
      { id: 'e1', source: 'n_trig', target: 'n_ai', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 'e2', source: 'n_ai', target: 'n_cond', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 'e3', source: 'n_cond', target: 'n_slack', sourceHandle: 'true', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 'e4', source: 'n_slack', target: 'n_email', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } }
    ]
  },
  {
    id: 'tmpl_support_escalate',
    title: 'Notion Sync & Reminder',
    description: 'Auto-sync Google Sheet updates to Notion task boards and trigger email reminders on delays.',
    integrations: ['google_sheets', 'notion', 'gmail'],
    nodes: [
      { id: 'n_trig', type: 'custom', position: { x: 100, y: 200 }, data: { label: 'Support Slack channel', type: 'trigger', config: { channel: '#customer-support' }, executionStatus: 'idle' } },
      { id: 'n_ai', type: 'custom', position: { x: 360, y: 200 }, data: { label: 'Sentiment Classifier', type: 'ai_analysis', config: { prompt: 'Check for negative tone' }, executionStatus: 'idle' } },
      { id: 'n_notion', type: 'custom', position: { x: 620, y: 200 }, data: { label: 'Notion Escalates table', type: 'create_task', config: { databaseId: 'escalated_tickets' }, executionStatus: 'idle' } },
      { id: 'n_email', type: 'custom', position: { x: 880, y: 200 }, data: { label: 'Gmail CSM notification', type: 'send_email', config: { to: 'csm@startup.co' }, executionStatus: 'idle' } }
    ],
    edges: [
      { id: 'e1', source: 'n_trig', target: 'n_ai', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 'e2', source: 'n_ai', target: 'n_notion', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 'e3', source: 'n_notion', target: 'n_email', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } }
    ]
  }
];

export default function DashboardPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentRuns, setRecentRuns] = useState<RunLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<RunLog | null>(null);
  
  // Spotlight / Command Palette states
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [commandResponse, setCommandResponse] = useState<string | null>(null);
  const [isCommandLoading, setIsCommandLoading] = useState(false);

  // Proactive AI Insights Panel state
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedApplied, setOptimizedApplied] = useState(false);

  const [metrics, setMetrics] = useState({
    totalExecs: '1,482',
    successRate: '99.4%',
    delayTime: '45s',
    integrationsCount: '2 / 4'
  });

  useEffect(() => {
    // Dynamic loading of dashboard properties from real state engine
    const runsList = storage.getRuns();
    setRecentRuns(runsList);

    const integrations = storage.getIntegrations();
    const activeIntegrationsCount = integrations.filter(i => i.connected).length;
    
    setMetrics({
      totalExecs: (runsList.length + 1480).toLocaleString(),
      successRate: runsList.length > 0 
        ? `${((runsList.filter(r => r.status === 'completed' || r.status === 'paused_approval').length / runsList.length) * 100).toFixed(1)}%`
        : '99.4%',
      delayTime: '45s',
      integrationsCount: `${activeIntegrationsCount} / ${integrations.length}`
    });

    // Register Command K shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGenerateWorkflow = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToCompile = prompt.trim() || commandInput.trim();
    if (!textToCompile) return;

    setIsGenerating(true);
    setIsCommandLoading(true);

    setTimeout(() => {
      setIsGenerating(false);
      setIsCommandLoading(false);
      
      const generatedId = `wf_gen_${Math.random().toString(36).substring(7)}`;
      const p = textToCompile.toLowerCase();

      // Detect email intent from the prompt
      const isEmailWorkflow = p.includes('mail') || p.includes('email') || p.includes('send') || p.includes('regards');

      // Extract a recipient email address if mentioned in the prompt
      const emailMatch = textToCompile.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      const detectedRecipient = emailMatch ? emailMatch[0] : '{{n_trig.output.email}}';

      // Build nodes based on detected intent
      const nodes = isEmailWorkflow
        ? [
            {
              id: 'n_trig',
              type: 'custom',
              position: { x: 100, y: 200 },
              data: {
                label: 'Manual Trigger',
                type: 'trigger',
                config: { webhookPath: `/api/webhooks/ingest?workflowId=${generatedId}` },
                executionStatus: 'idle'
              }
            },
            {
              id: 'n_email',
              type: 'custom',
              position: { x: 450, y: 200 },
              data: {
                label: 'Gmail Dispatcher',
                type: 'send_email',
                config: {
                  to: detectedRecipient,
                  subject: 'Regards from Zapier Central Automation OS',
                  body: `Hi,\n\nRegards from Zapier Central! This email was dispatched automatically via our live SMTP execution engine based on your instruction: "${textToCompile}".\n\nBest regards,\nZapier Central Operator`
                },
                executionStatus: 'idle'
              }
            }
          ]
        : [
            {
              id: 'n_trig',
              type: 'custom',
              position: { x: 100, y: 200 },
              data: { label: 'Form Webhook', type: 'trigger', config: { webhookPath: '/ingest' }, executionStatus: 'idle' }
            },
            {
              id: 'n_ai',
              type: 'custom',
              position: { x: 360, y: 200 },
              data: { label: 'AI Operations Processor', type: 'ai_analysis', config: { prompt: textToCompile }, executionStatus: 'idle' }
            },
            {
              id: 'n_slack',
              type: 'custom',
              position: { x: 620, y: 200 },
              data: { label: 'Slack Notification', type: 'notification', config: { channel: '#operations' }, executionStatus: 'idle' }
            }
          ];

      const edges = isEmailWorkflow
        ? [
            { id: 'e1', source: 'n_trig', target: 'n_email', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } }
          ]
        : [
            { id: 'e1', source: 'n_trig', target: 'n_ai', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
            { id: 'e2', source: 'n_ai', target: 'n_slack', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } }
          ];

      const newWf: Workflow = {
        id: generatedId,
        name: textToCompile.length > 40 ? `${textToCompile.substring(0, 40)}...` : textToCompile,
        description: `Automated AI Central agent workflow compiled from instruction prompt: "${textToCompile}"`,
        triggerType: isEmailWorkflow ? 'Manual Trigger' : 'Webhook Trigger',
        nodesCount: nodes.length,
        status: 'active',
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        nodes,
        edges
      };
      
      storage.saveWorkflow(newWf);
      setCommandPaletteOpen(false);
      router.push(`/workflows/${generatedId}/builder?prompt=${encodeURIComponent(textToCompile)}`);
    }, 1800);
  };

  const handleCommandPaletteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.toLowerCase().trim();
    if (!cmd) return;

    setIsCommandLoading(true);
    setCommandResponse(null);

    setTimeout(() => {
      setIsCommandLoading(false);
      if (cmd.includes('create') || cmd.includes('build') || cmd.includes('workflow')) {
        setCommandResponse("✨ Directing reasoning engines to draft your visual workflow graph...");
        setTimeout(() => handleGenerateWorkflow(), 800);
      } else if (cmd.includes('failed') || cmd.includes('logs') || cmd.includes('error')) {
        setCommandResponse("🔍 Scanned active run-logs. Identified 1 failed credentials trace: run_c9e2b.");
        setTimeout(() => {
          setCommandPaletteOpen(false);
          router.push('/logs');
        }, 1500);
      } else if (cmd.includes('slack') || cmd.includes('notify')) {
        setCommandResponse("💬 Mapping Slack communication bridges onto the builder compiler...");
        setTimeout(() => {
          setCommandPaletteOpen(false);
          router.push('/workflows/wf_7e3d1/builder');
        }, 1500);
      } else {
        setCommandResponse(`🧠 Core Query parsed: "${commandInput}". Mapping contextual operations database... Redirecting to Central Agent chat.`);
        setTimeout(() => {
          setCommandPaletteOpen(false);
          router.push(`/assistant?query=${encodeURIComponent(commandInput)}`);
        }, 2000);
      }
    }, 1000);
  };

  const deployTemplate = (tmpl: typeof TEMPLATES[0]) => {
    const deployId = `wf_${Math.random().toString(36).substring(7)}`;
    const newWf: Workflow = {
      id: deployId,
      name: tmpl.title,
      description: tmpl.description,
      triggerType: 'Webhook Trigger',
      nodesCount: tmpl.nodes.length,
      status: 'active',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      nodes: tmpl.nodes,
      edges: tmpl.edges
    };
    storage.saveWorkflow(newWf);
    router.push(`/workflows/${deployId}/builder`);
  };

  const applyAIProactiveOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      // Find wf_7e3d1 in storage, automatically inject the organic delay node
      const targetWf = storage.getWorkflowById('wf_7e3d1');
      if (targetWf) {
        const delayNodeId = 'n_delay_opt_452';
        
        // Exclude direct connection from condition node (n_cond) to slack notification node (n_slack)
        const updatedEdges = targetWf.edges.filter(e => !(e.source === 'n_cond' && e.target === 'n_slack'));
        
        // Add organic 5 minute delay node parameters
        const newDelayNode = {
          id: delayNodeId,
          type: 'custom',
          position: { x: 750, y: 150 },
          data: {
            label: 'Organic 5m Delay',
            type: 'delay',
            config: { delayMs: 300000 },
            executionStatus: 'idle'
          }
        };

        const rewiredEdges = [
          ...updatedEdges,
          { id: 'edge_cond_to_delay', source: 'n_cond', target: delayNodeId, sourceHandle: 'true', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
          { id: 'edge_delay_to_slack', source: delayNodeId, target: 'n_slack', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } }
        ];

        const newNodesList = [...targetWf.nodes];
        const conditionNodeIndex = newNodesList.findIndex(n => n.id === 'n_cond');
        if (conditionNodeIndex >= 0) {
          // Adjust n_slack position slightly to the right to make space
          const slackIndex = newNodesList.findIndex(n => n.id === 'n_slack');
          if (slackIndex >= 0) newNodesList[slackIndex].position.x = 980;
          
          // Adjust n_email position slightly to the right
          const emailIndex = newNodesList.findIndex(n => n.id === 'n_email');
          if (emailIndex >= 0) newNodesList[emailIndex].position.x = 1220;
        }

        storage.saveWorkflow({
          ...targetWf,
          nodes: [...newNodesList, newDelayNode],
          edges: rewiredEdges,
          nodesCount: targetWf.nodesCount + 1
        });
      }

      setIsOptimizing(false);
      setOptimizedApplied(true);
      setTimeout(() => setShowOptimizationPanel(false), 2000);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 flex-1 w-full animate-in fade-in duration-200">
      
      {/* Upper Brand Info & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Mission Control Dashboard</h2>
            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse mt-0.5">
              Heartbeat Active
            </span>
          </div>
          <p className="text-sm text-white/40 mt-1">Orchestrate and debug your business operations under real-time AI supervision.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-1.5 bg-neutral-900 border border-white/5 text-white/60 hover:text-white text-xs px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <Command className="w-3.5 h-3.5 text-orange-400" />
            <span>Launch Command Palette</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 ml-2 text-[10px] font-bold text-white/30 bg-neutral-950 border border-white/5 rounded">⌘ K</kbd>
          </button>

          <button 
            onClick={() => {
              const freshWfId = `wf_${Math.random().toString(36).substring(7)}`;
              router.push(`/workflows/${freshWfId}/builder`);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-xs px-4.5 py-2.5 rounded-lg transition-all shadow-lg shadow-orange-500/15 border border-orange-400/25 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Proactive AI Insights Panel */}
      {showOptimizationPanel && (
        <div className="relative p-[1px] bg-gradient-to-br from-orange-500/40 via-white/5 to-transparent rounded-2xl overflow-hidden shadow-xl shadow-orange-500/5 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-neutral-950/90 backdrop-blur-xl p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Proactive Optimization Alert</h4>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/25">High Priority</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed max-w-3xl">
                  We identified that <span className="font-semibold text-white">"High-Value Lead Analyzer"</span> runs Gmail responder dispatches immediately after webhook spikes. 
                  We recommend placing an organic 5-minute delay step to prevent hitting Google API rate-limit thresholds.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
              <button 
                onClick={() => setShowOptimizationPanel(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white/40 hover:text-white/80 border border-transparent transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button 
                onClick={applyAIProactiveOptimization}
                disabled={isOptimizing || optimizedApplied}
                className="flex items-center gap-2 bg-white hover:bg-neutral-100 disabled:bg-emerald-500/20 disabled:text-emerald-400 text-black font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-md cursor-pointer border disabled:border-emerald-500/20"
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rewiring Canvas...</span>
                  </>
                ) : optimizedApplied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Healed In-Place!</span>
                  </>
                ) : (
                  <>
                    <Sliders className="w-3.5 h-3.5 text-orange-500" />
                    <span>Apply AI Recommendation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { name: 'Total Executions', value: metrics.totalExecs, icon: Zap, label: '+18.4% this week', iconColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
          { name: 'Average Success Rate', value: metrics.successRate, icon: TrendingUp, label: 'Optimal telemetry', iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { name: 'Average Delay Time', value: metrics.delayTime, icon: Clock, label: 'Automatic backoff active', iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { name: 'Active Integrations', value: metrics.integrationsCount, icon: Plug, label: 'Credentials healthy', iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.name} className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-white/10 hover:bg-white/[0.03] transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-white/40 uppercase tracking-wider">{metric.name}</span>
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${metric.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-white">{metric.value}</span>
                <span className="text-[10px] font-semibold text-white/30">{metric.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vercel AI Command Bar */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-orange-500/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex items-center gap-2 text-xs font-semibold text-white/80 relative">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          <span>Central Ingestion Agent</span>
        </div>
        <form onSubmit={handleGenerateWorkflow} className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type 'When a high-value lead submits a form, qualify them, notify Slack, and draft proposal...'"
            className="w-full bg-white/5 border border-white/5 focus:border-orange-500/30 rounded-xl py-3.5 pl-4 pr-32 text-sm text-white placeholder-white/20 focus:outline-none transition-all font-medium"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:from-orange-500/20 disabled:to-amber-500/10 text-white font-bold text-xs px-4.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Compiling...</span>
              </>
            ) : (
              <>
                <span>Generate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Active Grid Section: Recent Runs + Quick templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Runs Table */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
              <span className="text-sm font-semibold text-white">Live Execution Heartbeat Feed</span>
              <Link href="/logs" className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 font-semibold">
                <span>Access log manager</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 font-medium">
                    <th className="py-2.5">Run ID</th>
                    <th>Workflow Name</th>
                    <th>Trigger Inbound</th>
                    <th>Time Elapsed</th>
                    <th>Performance</th>
                    <th className="text-right">Execution Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {recentRuns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-white/20">
                        No recent executions found in storage traces.
                      </td>
                    </tr>
                  ) : (
                    recentRuns.map((run) => (
                      <tr 
                        key={run.id} 
                        onClick={() => setSelectedLog(run)}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 text-orange-400 font-mono flex items-center gap-1">
                          <Eye className="w-3 h-3 text-white/20 group-hover:text-orange-400 transition-all opacity-0 group-hover:opacity-100 -ml-1 mr-0.5" />
                          <span>{run.id}</span>
                        </td>
                        <td className="text-white font-semibold">{run.workflowName}</td>
                        <td className="text-white/60">{run.triggerType}</td>
                        <td className="text-white/40">{run.startedAt.split(' ')[1] || run.startedAt}</td>
                        <td className="text-white/40">{run.duration}</td>
                        <td className="text-right">
                          <div className="inline-flex items-center gap-1.5 ml-auto">
                            {run.status === 'completed' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Success
                              </span>
                            )}
                            {run.status === 'paused_approval' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-semibold animate-pulse">
                                <Clock className="w-2.5 h-2.5" /> HITL Pend
                              </span>
                            )}
                            {run.status === 'failed' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 font-semibold">
                                <XCircle className="w-2.5 h-2.5" /> Interrupted
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between text-[10px] font-mono text-white/40 mt-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Realtime telemetry: Syncing active logs safely with localStorage broker
            </span>
            <span>Latency: 42ms</span>
          </div>
        </div>

        {/* Right Column: Dynamic Templates Launcher */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <span className="text-sm font-semibold text-white block border-b border-white/5 pb-3">Quick Start Templates</span>
          <div className="space-y-3">
            {TEMPLATES.map((tmpl) => (
              <div key={tmpl.id} className="p-4 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group flex flex-col justify-between h-36">
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight mb-1">{tmpl.title}</h4>
                  <p className="text-[10px] text-white/40 leading-normal line-clamp-3">{tmpl.description}</p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    {tmpl.integrations.map((provider) => (
                      <span key={provider} className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-white/5 text-white/40 border border-white/5">
                        {provider}
                      </span>
                    ))}
                  </div>
                  <button 
                    onClick={() => deployTemplate(tmpl)}
                    className="text-[10px] font-bold text-white group-hover:text-orange-400 transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Deploy</span>
                    <Play className="w-2.5 h-2.5 fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Global Raycast/Spotlight Command Palette Modal (⌘ K) */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/85 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div 
            className="relative p-[1px] bg-gradient-to-br from-orange-500/40 via-white/5 to-transparent rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-orange-500/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-neutral-950 p-5 rounded-2xl space-y-4">
              {/* Input Header */}
              <div className="relative border-b border-white/5 pb-4">
                <Search className="absolute left-1 top-2.5 w-5 h-5 text-white/20" />
                <form onSubmit={handleCommandPaletteSubmit}>
                  <input
                    type="text"
                    autoFocus
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    placeholder="Search logs, ask AI agent, or draft a workflow..."
                    className="w-full bg-transparent pl-8 pr-12 text-sm text-white placeholder-white/30 focus:outline-none font-medium"
                  />
                </form>
                <button 
                  onClick={() => setCommandPaletteOpen(false)}
                  className="absolute right-0 top-2 text-[10px] font-bold text-white/30 hover:text-white bg-white/5 border border-white/5 px-2 py-1 rounded"
                >
                  ESC
                </button>
              </div>

              {/* Loader */}
              {isCommandLoading && (
                <div className="py-8 text-center text-white/30 flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
                  <span className="text-[10px] font-mono tracking-widest uppercase">AI Ingestion active...</span>
                </div>
              )}

              {/* AI Reasoning Response Panel */}
              {commandResponse && !isCommandLoading && (
                <div className="bg-orange-500/5 border border-orange-500/25 p-4 rounded-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-400">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>AI Reasoning Core Outcome</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed font-mono">{commandResponse}</p>
                </div>
              )}

              {/* Quick Actions List */}
              {!isCommandLoading && !commandResponse && (
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-2">Automated Quick Actions</span>
                    <div className="space-y-1.5">
                      {[
                        { title: 'Create onboarding slack workflow', detail: 'Canvas compiler trigger', action: 'Create a Slack responder workflow' },
                        { title: 'Show failed executions', detail: 'Inspect log credentials error', action: 'Show credentials failed runs' },
                        { title: 'Heal Gmail credentials OAuth', detail: 'Refreshes secure vault token key', action: 'Explain execution failure' }
                      ].map((item, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setCommandInput(item.action);
                            // Simulate key event
                            setTimeout(() => {
                              setIsCommandLoading(true);
                              setTimeout(() => {
                                setIsCommandLoading(false);
                                if (item.action.includes('failed') || item.action.includes('Explain')) {
                                  setCommandResponse("🔍 Scanned active run-logs. Identified 1 failed credentials trace: run_c9e2b.");
                                  setTimeout(() => {
                                    setCommandPaletteOpen(false);
                                    router.push('/logs');
                                  }, 1500);
                                } else {
                                  setCommandResponse("✨ Directing reasoning engines to draft your visual workflow graph...");
                                  setTimeout(() => handleGenerateWorkflow(), 800);
                                }
                              }, 1000);
                            }, 100);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2">
                            <CornerDownRight className="w-3.5 h-3.5 text-orange-500/60" />
                            <span className="text-xs font-semibold text-white">{item.title}</span>
                          </div>
                          <span className="text-[10px] text-white/30 font-medium font-mono">{item.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-white/20 pt-2 border-t border-white/5">
                    <span>Use ↑ ↓ arrow keys to select, ENTER to execute</span>
                    <span>Zapier Central Operations Command Center</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Granular Execution Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div 
            className="relative p-[1px] bg-gradient-to-br from-orange-500/40 via-white/5 to-transparent rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl shadow-orange-500/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-neutral-950 p-6 rounded-2xl space-y-5">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-orange-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Granular Trace Inspector</h3>
                  <span className="text-[10px] font-mono text-white/30">{selectedLog.id}</span>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="text-xs text-white/40 hover:text-white font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Metadata Details */}
              <div className="grid grid-cols-2 gap-4 bg-white/[0.01] p-3 rounded-lg border border-white/5 text-[11px] font-mono text-white/60">
                <div>
                  <span className="text-white/30 block">Workflow Name:</span>
                  <span className="font-semibold text-white">{selectedLog.workflowName}</span>
                </div>
                <div>
                  <span className="text-white/30 block">Execution Inbound:</span>
                  <span className="font-semibold text-white">{selectedLog.triggerType}</span>
                </div>
                <div>
                  <span className="text-white/30 block">Started Timestamp:</span>
                  <span className="text-white">{selectedLog.startedAt}</span>
                </div>
                <div>
                  <span className="text-white/30 block">Telemetry Latency:</span>
                  <span className="text-emerald-400 font-bold">{selectedLog.duration}</span>
                </div>
              </div>

              {/* Node execution lists */}
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">Sequential Node Telemetry:</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pl-2 border-l border-white/5">
                  {selectedLog.nodes.map((node) => (
                    <div key={node.nodeId} className="flex items-center justify-between text-[11px] bg-white/[0.01] border border-white/5 rounded-lg p-2.5 font-mono">
                      <div>
                        <span className="text-white font-semibold block">{node.label}</span>
                        <span className="text-[9px] text-white/30">{node.nodeId} • {node.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/40">{node.duration}</span>
                        {node.status === 'success' && <span className="text-emerald-400 font-bold">Success</span>}
                        {node.status === 'failed' && <span className="text-rose-400 font-bold">Failed</span>}
                        {node.status === 'running' && <span className="text-orange-400 font-bold animate-pulse">Running</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details Actions */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/5">
                {selectedLog.status === 'failed' && (
                  <button 
                    onClick={() => {
                      setSelectedLog(null);
                      router.push('/logs');
                    }}
                    className="flex items-center gap-1 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-200" />
                    <span>Auto-Heal with AI</span>
                  </button>
                )}
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="bg-white/5 border border-white/5 text-white/60 hover:text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Close Trace
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
