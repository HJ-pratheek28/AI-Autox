'use client';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  nodesCount: number;
  status: 'active' | 'paused' | 'draft';
  createdAt: string;
  nodes: any[];
  edges: any[];
}

export interface RunNode {
  nodeId: string;
  label: string;
  type: string;
  status: 'success' | 'failed' | 'running' | 'waiting';
  duration: string;
  input: Record<string, any>;
  output: Record<string, any>;
  error?: string;
}

export interface RunLog {
  id: string;
  workflowId: string;
  workflowName: string;
  triggerType: string;
  startedAt: string;
  completedAt?: string;
  status: 'completed' | 'failed' | 'running' | 'paused_approval';
  duration: string;
  nodes: RunNode[];
}

export interface Integration {
  id: string;
  name: string;
  connected: boolean;
  account?: string;
  scopes: string[];
  rateLimit: string;
  color: string;
}

const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: 'wf_7e3d1',
    name: 'High-Value Lead Analyzer',
    description: 'Triggers on lead submissions, qualifies via Claude Sonnet model, notifies Slack operations, and drafts custom proposals.',
    triggerType: 'Webhook Trigger',
    nodesCount: 5,
    status: 'active',
    createdAt: 'May 20, 2026',
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
    id: 'wf_3c8e9',
    name: 'Slack Notion Followup Router',
    description: 'Auto-syncs items created in Notion databases to Slack channels, holding for human authorization step.',
    triggerType: 'App Event Trigger',
    nodesCount: 4,
    status: 'active',
    createdAt: 'May 22, 2026',
    nodes: [
      { id: 'n_trig', type: 'custom', position: { x: 100, y: 200 }, data: { label: 'Notion Database item', type: 'trigger', config: { databaseId: 'notion_tasks' }, executionStatus: 'idle' } },
      { id: 'n_ai', type: 'custom', position: { x: 360, y: 200 }, data: { label: 'AI Pitch Draft', type: 'ai_analysis', config: { prompt: 'Generate pitch outline' }, executionStatus: 'idle' } },
      { id: 'n_slack', type: 'custom', position: { x: 620, y: 200 }, data: { label: 'Slack Alert', type: 'notification', config: { channel: '#operations-alerts' }, executionStatus: 'idle' } }
    ],
    edges: [
      { id: 'e1', source: 'n_trig', target: 'n_ai', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 'e2', source: 'n_ai', target: 'n_slack', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } }
    ]
  },
  {
    id: 'wf_9b0a1',
    name: 'Customer Feedback Sentiment Audit',
    description: 'Scans support logs, processes tone sentiment score, and escalates unhappy users to account relations.',
    triggerType: 'Google Sheets Trigger',
    nodesCount: 3,
    status: 'paused',
    createdAt: 'May 23, 2026',
    nodes: [
      { id: 'n_trig', type: 'custom', position: { x: 100, y: 200 }, data: { label: 'Google Sheets updates', type: 'trigger', config: { spreadsheetId: 'leads_sheet' }, executionStatus: 'idle' } },
      { id: 'n_delay', type: 'custom', position: { x: 360, y: 200 }, data: { label: 'Wait 1 Minute', type: 'delay', config: { delayMs: 60000 }, executionStatus: 'idle' } },
      { id: 'n_notion', type: 'custom', position: { x: 620, y: 200 }, data: { label: 'Append Notion task', type: 'create_task', config: { databaseId: 'notion_tasks' }, executionStatus: 'idle' } }
    ],
    edges: [
      { id: 'e1', source: 'n_trig', target: 'n_delay', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      { id: 'e2', source: 'n_delay', target: 'n_notion', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } }
    ]
  },
  {
    id: 'wf_regards_dispatcher',
    name: 'Automated System Regards Dispatcher',
    description: 'Sends automated greetings and system status confirmation to any email you enter dynamically in your trigger payload or recipient sidebar field.',
    triggerType: 'Manual Trigger',
    nodesCount: 2,
    status: 'active',
    createdAt: 'May 25, 2026',
    nodes: [
      { id: 'n_trig', type: 'custom', position: { x: 100, y: 200 }, data: { label: 'Manual Trigger', type: 'trigger', config: {}, executionStatus: 'idle' } },
      { id: 'n_email', type: 'custom', position: { x: 450, y: 200 }, data: { label: 'Gmail Dispatcher', type: 'send_email', config: { to: '{{n_trig.output.email}}', subject: 'Regards from Zapier Central Automation OS', body: 'Hi,\n\nRegards from Zapier Central! Your next-generation visual operational AI automation platform is successfully up and running, and this email was dispatched automatically via our live SMTP execution engine.\n\nBest regards,\nH J Pratheek\nZapier Central Operator' }, executionStatus: 'idle' } }
    ],
    edges: [
      { id: 'e1', source: 'n_trig', target: 'n_email', type: 'smoothstep', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } }
    ]
  }
];

const DEFAULT_RUNS: RunLog[] = [
  {
    id: 'run_c9e2b',
    workflowId: 'wf_7e3d1',
    workflowName: 'High-Value Lead Analyzer',
    triggerType: 'Google Sheets Event',
    startedAt: '2026-05-24 10:15:30',
    status: 'failed',
    duration: '2.5s',
    nodes: [
      {
        nodeId: 'trigger_3',
        label: 'Inbound Spreadsheet Row',
        type: 'trigger',
        status: 'success',
        duration: '15ms',
        input: { spreadsheetId: 'leads_sheet' },
        output: { name: 'Donald Miller', email: 'donald@storybrand.com', companySize: 120 }
      },
      {
        nodeId: 'ai_analysis_3',
        label: 'AI Sentiment Analyzer',
        type: 'ai_analysis',
        status: 'success',
        duration: '1.8s',
        input: { text: 'Donald Miller from Storybrand', prompt: 'Analyze priority' },
        output: { leadScore: 95, isHighValue: true }
      },
      {
        nodeId: 'gmail_failed_node',
        label: 'Auto Gmail Response',
        type: 'send_email',
        status: 'failed',
        duration: '600ms',
        input: { to: 'donald@storybrand.com', subject: 'Welcome to Startup Co!', template: 'enterprise_pitch' },
        output: {},
        error: 'Error: OAUTH_TOKEN_EXPIRED (Gmail expired credentials). OAuth authentication required for account: pratheek@startup.co. Please re-authenticate integrations or initialize automated token heal sequence.'
      }
    ]
  },
  {
    id: 'run_98f82',
    workflowId: 'wf_7e3d1',
    workflowName: 'High-Value Lead Analyzer',
    triggerType: 'Gmail Webhook',
    startedAt: '2026-05-23 22:43:10',
    completedAt: '2026-05-23 22:43:12',
    status: 'completed',
    duration: '1.4s',
    nodes: [
      {
        nodeId: 'trigger_1',
        label: 'Inbound Webhook Trigger',
        type: 'trigger',
        status: 'success',
        duration: '10ms',
        input: { workflowId: 'wf_7e3d1' },
        output: { sender: 'alice@investorcorp.com', subject: 'Strategic Partnership Inquiry', amount: 50000 }
      },
      {
        nodeId: 'ai_analysis_1',
        label: 'AI Sentiment Analyzer',
        type: 'ai_analysis',
        status: 'success',
        duration: '1.2s',
        input: { text: 'Strategic Partnership Inquiry', prompt: 'Analyze priority' },
        output: { leadScore: 92, isHighValue: true, summary: 'Lead is extremely hot. Executive interested in Enterprise tiers.' }
      },
      {
        nodeId: 'condition_1',
        label: 'Lead Score Threshold Check',
        type: 'condition',
        status: 'success',
        duration: '5ms',
        input: { value1: '92', operator: 'greater_than', value2: '80' },
        output: { branch: 'true' }
      },
      {
        nodeId: 'slack_1',
        label: 'Slack Alerts Notification',
        type: 'notification',
        status: 'success',
        duration: '200ms',
        input: { channel: '#sales-leads', message: 'Hot Lead! Alice from InvestorCorp (Score: 92)' },
        output: { ts: '1716474191', channelId: 'C0612345' }
      }
    ]
  },
  {
    id: 'run_a0b2c',
    workflowId: 'wf_3c8e9',
    workflowName: 'Slack Notion Followup Router',
    triggerType: 'Notion Event',
    startedAt: '2026-05-23 22:30:15',
    status: 'paused_approval',
    duration: '3.1s',
    nodes: [
      {
        nodeId: 'trigger_2',
        label: 'Notion Database Item Created',
        type: 'trigger',
        status: 'success',
        duration: '40ms',
        input: { databaseId: 'notion_tasks' },
        output: { itemTitle: 'Draft pitch deck', creator: 'Bob Smith', urgency: 'High' }
      },
      {
        nodeId: 'ai_analysis_2',
        label: 'AI Draft Pitch Copilot',
        type: 'ai_analysis',
        status: 'success',
        duration: '3.0s',
        input: { context: 'Draft pitch deck for seed round' },
        output: { generatedPitchSummary: 'Proposed pitch outline targeting institutional investors with key operational milestones.' }
      },
      {
        nodeId: 'approval_gate',
        label: 'Human-in-the-Loop Verification',
        type: 'webhook',
        status: 'running',
        duration: 'waiting',
        input: { approvalRequiredBy: 'pratheek@startup.co', pitchSummary: 'Proposed pitch outline targeting institutional investors...' },
        output: {}
      }
    ]
  }
];

const DEFAULT_INTEGRATIONS: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    scopes: ['gmail.readonly', 'gmail.send', 'gmail.compose'],
    connected: true,
    account: 'pratheek@startup.co',
    rateLimit: '250 executions / min',
    color: 'from-rose-500/20 to-red-500/5'
  },
  {
    id: 'slack',
    name: 'Slack',
    scopes: ['chat:write', 'channels:read', 'commands'],
    connected: true,
    account: '#operations-alerts (Startup Co)',
    rateLimit: '500 executions / min',
    color: 'from-emerald-500/20 to-teal-500/5'
  },
  {
    id: 'notion',
    name: 'Notion',
    scopes: ['databases.read', 'pages.write', 'blocks.write'],
    connected: false,
    rateLimit: '100 executions / min',
    color: 'from-neutral-500/20 to-neutral-700/5'
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    scopes: ['spreadsheets.readonly', 'drive.file'],
    connected: false,
    rateLimit: '150 executions / min',
    color: 'from-green-500/20 to-emerald-600/5'
  }
];

const isBrowser = () => typeof window !== 'undefined';

// ─── Named function exports (Turbopack-safe, no object literal pattern) ───────

export function getWorkflows(): Workflow[] {
  if (!isBrowser()) return DEFAULT_WORKFLOWS;
  try {
    const data = localStorage.getItem('zc_workflows');
    if (!data) {
      localStorage.setItem('zc_workflows', JSON.stringify(DEFAULT_WORKFLOWS));
      return DEFAULT_WORKFLOWS;
    }
    const stored = JSON.parse(data) as Workflow[];
    // Always patch built-in default workflow definitions so stale/broken
    // cached entries (e.g. old wf_gen_* with wrong nodes) are corrected.
    const defaultIds = new Set(DEFAULT_WORKFLOWS.map(w => w.id));
    const userCreated = stored.filter(w => !defaultIds.has(w.id));
    const merged = [...DEFAULT_WORKFLOWS, ...userCreated];
    localStorage.setItem('zc_workflows', JSON.stringify(merged));
    return merged;
  } catch {
    return DEFAULT_WORKFLOWS;
  }
}

export function saveWorkflows(workflows: Workflow[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem('zc_workflows', JSON.stringify(workflows));
  } catch { /* ignore quota errors */ }
}

export function getWorkflowById(id: string): Workflow | null {
  const list = getWorkflows();
  return list.find(w => w.id === id) || null;
}

export function saveWorkflow(workflow: Workflow): void {
  const list = getWorkflows();
  const index = list.findIndex(w => w.id === workflow.id);
  if (index >= 0) {
    list[index] = workflow;
  } else {
    list.push(workflow);
  }
  saveWorkflows(list);
}

export function deleteWorkflow(id: string): void {
  const list = getWorkflows();
  const filtered = list.filter(w => w.id !== id);
  saveWorkflows(filtered);
}

export function getRuns(): RunLog[] {
  if (!isBrowser()) return DEFAULT_RUNS;
  try {
    const data = localStorage.getItem('zc_runs');
    if (!data) {
      localStorage.setItem('zc_runs', JSON.stringify(DEFAULT_RUNS));
      return DEFAULT_RUNS;
    }
    return JSON.parse(data) as RunLog[];
  } catch {
    return DEFAULT_RUNS;
  }
}

export function saveRuns(runs: RunLog[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem('zc_runs', JSON.stringify(runs));
  } catch { /* ignore quota errors */ }
}

export function addRun(run: RunLog): void {
  const list = getRuns();
  list.unshift(run);
  saveRuns(list);
}

export function updateRun(run: RunLog): void {
  const list = getRuns();
  const index = list.findIndex(r => r.id === run.id);
  if (index >= 0) {
    list[index] = run;
    saveRuns(list);
  }
}

export function getIntegrations(): Integration[] {
  if (!isBrowser()) return DEFAULT_INTEGRATIONS;
  try {
    const data = localStorage.getItem('zc_integrations');
    if (!data) {
      localStorage.setItem('zc_integrations', JSON.stringify(DEFAULT_INTEGRATIONS));
      return DEFAULT_INTEGRATIONS;
    }
    return JSON.parse(data) as Integration[];
  } catch {
    return DEFAULT_INTEGRATIONS;
  }
}

export function saveIntegrations(integrations: Integration[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem('zc_integrations', JSON.stringify(integrations));
  } catch { /* ignore quota errors */ }
}

// ─── Backward-compat object alias (for any legacy call sites) ─────────────────
export const storage = {
  getWorkflows,
  saveWorkflows,
  getWorkflowById,
  saveWorkflow,
  deleteWorkflow,
  getRuns,
  saveRuns,
  addRun,
  updateRun,
  getIntegrations,
  saveIntegrations,
};
