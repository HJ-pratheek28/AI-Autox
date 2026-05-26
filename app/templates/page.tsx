'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Search, 
  ArrowRight, 
  Play, 
  TrendingUp, 
  Clock, 
  Layers, 
  Grid,
  Mail,
  MessageSquare,
  BookOpen,
  Zap,
  Tag
} from 'lucide-react';
import { useWorkflowStore, NodeData } from '@/hooks/use-workflow-engine';

interface Template {
  id: string;
  title: string;
  description: string;
  category: 'sales' | 'support' | 'ops' | 'creators';
  integrations: string[];
  nodeCount: number;
  complexity: 'Simple' | 'AI Agent' | 'Advanced';
  successRate: string;
  nodes: any[];
  edges: any[];
}

const TEMPLATES: Template[] = [
  {
    id: 'tmpl_sales_qualify',
    title: 'High-Value Lead Qualifier & Auto-Response',
    description: 'Trigger on incoming contact webhooks, analyze prospect priority with AI, notify Slack channels, and send personalized Gmail drafts.',
    category: 'sales',
    integrations: ['gmail', 'slack', 'webhook'],
    nodeCount: 5,
    complexity: 'AI Agent',
    successRate: '99.4%',
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
    title: 'Customer Feedback Sentiment Monitor',
    description: 'Monitor Slack customer channels, analyze feedback tone, automatically log negative reviews into Notion databases, and email customer success executives.',
    category: 'support',
    integrations: ['slack', 'notion', 'gmail'],
    nodeCount: 4,
    complexity: 'AI Agent',
    successRate: '98.8%',
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
  },
  {
    id: 'tmpl_ops_sync',
    title: 'Sheets-to-Notion Database Synchronizer',
    description: 'Trigger on daily intervals, pull appended lead data from Google Sheets logs, and create formatted task boards inside Notion databases automatically.',
    category: 'ops',
    integrations: ['google_sheets', 'notion'],
    nodeCount: 3,
    complexity: 'Simple',
    successRate: '100%',
    nodes: [
      { id: 'n_trig', type: 'custom', position: { x: 100, y: 200 }, data: { label: 'Google Sheets updates', type: 'trigger', config: { spreadsheetId: 'leads_sheet' }, executionStatus: 'idle' } },
      { id: 'n_delay', type: 'custom', position: { x: 360, y: 200 }, data: { label: 'Wait 1 Minute', type: 'delay', config: { delayMs: 60000 }, executionStatus: 'idle' } },
      { id: 'n_notion', type: 'custom', position: { x: 620, y: 200 }, data: { label: 'Append Notion task', type: 'create_task', config: { databaseId: 'notion_tasks' }, executionStatus: 'idle' } }
    ],
    edges: [
      { id: 'e1', source: 'n_trig', target: 'n_delay', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 'e2', source: 'n_delay', target: 'n_notion', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } }
    ]
  }
];

export default function TemplatesPage() {
  const router = useRouter();
  const { setNodes, setEdges } = useWorkflowStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const deployTemplate = (template: Template) => {
    // Inject node-graph directly into Visual Canvas Zustand store
    setNodes(template.nodes);
    setEdges(template.edges);
    // Redirect straight to visual builder
    router.push(`/workflows/${template.id}/builder`);
  };

  const filteredTemplates = TEMPLATES.filter(tmpl => {
    const matchesSearch = tmpl.title.toLowerCase().includes(search.toLowerCase()) || 
                          tmpl.description.toLowerCase().includes(search.toLowerCase());
    
    if (activeCategory === 'all') return matchesSearch;
    return matchesSearch && tmpl.category === activeCategory;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 flex-1 w-full">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Workflow Templates</h2>
            <p className="text-sm text-white/40 mt-1">Spin up production-grade operations pipelines immediately with 1-click deployments.</p>
          </div>
        </div>
      </div>

      {/* Categories & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.02] p-4 rounded-xl border border-white/5">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search templates by integrations, features..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {['all', 'sales', 'support', 'ops'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-white/40 hover:text-white/80 border border-transparent'
              }`}
            >
              {cat === 'ops' ? 'Operations' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tmpl) => (
          <div 
            key={tmpl.id}
            className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-orange-500/20 bg-gradient-to-tr from-neutral-900 to-black/20 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-[340px] group relative overflow-hidden"
          >
            <div>
              {/* Category indicator & stats */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-white/5 text-white/40 border border-white/5">
                  {tmpl.category}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {tmpl.successRate} Success
                </span>
              </div>

              {/* Title & info */}
              <h3 className="text-sm font-bold text-white tracking-wide mt-4 group-hover:text-orange-400 transition-colors leading-snug">
                {tmpl.title}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed mt-2.5 h-20 line-clamp-4 font-medium">
                {tmpl.description}
              </p>

              {/* Scope details */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tmpl.integrations.map((p) => (
                  <span key={p} className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-black/40 text-white/40 border border-white/5">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
              <span className="text-[10px] font-semibold text-white/30">
                {tmpl.nodeCount} blocks • {tmpl.complexity}
              </span>
              
              <button
                onClick={() => deployTemplate(tmpl)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-black bg-white hover:bg-neutral-200 transition-all px-4 py-2 rounded-lg cursor-pointer shadow-lg shadow-white/5"
              >
                <span>Deploy Template</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
