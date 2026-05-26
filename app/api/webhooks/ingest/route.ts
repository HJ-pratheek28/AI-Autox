import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { executeWorkflowRun, executeAction, resolveVariables } from '@/lib/execution-engine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

// Static Fallback Workflows for Server-side Local Execution (decoupled from client-side localStorage)
const FALLBACK_WORKFLOWS = [
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

// Detect mock Supabase configuration
const isMockSupabase = supabaseUrl.includes('placeholder.supabase.co') || supabaseServiceKey === 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// High-fidelity Local/Sandbox sequential execution engine fallback
async function runLocalWorkflow(workflow: any, triggerPayload: any, userEmail?: string) {
  console.log(`[Local Execution Router] Executing sandbox workflow: "${workflow.name}" (${workflow.id})`);
  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];
  
  // Find starting node
  const targetIds = new Set(edges.map((e: any) => e.target));
  const startNode = nodes.find((n: any) => !targetIds.has(n.id) || n.type === 'trigger' || n.data?.type === 'trigger');
  
  let currentNodeId = startNode ? startNode.id : null;
  const context: Record<string, any> = {
    trigger: {
      output: triggerPayload
    },
    // Also expose triggerPayload directly for fallback resolution in execution-engine
    triggerPayload
  };

  // Pre-seed the trigger node's own context entry with the payload so that
  // downstream nodes can resolve {{n_trig.output.email}} etc. correctly
  // BEFORE the trigger node has been formally executed in the loop.
  if (startNode) {
    context[startNode.id] = { output: triggerPayload };
  }

  console.log(`[Local Execution Router] Trigger payload received:`, JSON.stringify(triggerPayload));
  console.log(`[Local Execution Router] Context pre-seed for node "${startNode?.id}":`, JSON.stringify(context[startNode?.id ?? '']));
  
  const executedNodes = [];
  
  while (currentNodeId) {
    const node = nodes.find((n: any) => n.id === currentNodeId);
    if (!node) break;
    
    const nodeConfig = node.data?.config || node.config || {};
    const resolvedConfig = resolveVariables(nodeConfig, context);
    const nodeType = node.data?.type || node.type || 'unknown';
    
    try {
      console.log(`[Local Execution Router] Running Node ID: ${node.id}, Type: ${nodeType}`);
      console.log(`[Local Execution Router] Resolved config:`, JSON.stringify(resolvedConfig));
      const output = await executeAction(nodeType, resolvedConfig, { ...context, userEmail });
      
      context[node.id] = { output };
      
      executedNodes.push({
        nodeId: node.id,
        label: node.data?.label || node.label || nodeType,
        type: nodeType,
        status: 'success' as const,
        duration: '220ms',
        input: resolvedConfig,
        output
      });
      
      // Find next node transitions
      const outgoingEdges = edges.filter((e: any) => e.source === node.id);
      if (outgoingEdges.length === 0) {
        currentNodeId = null;
      } else if (nodeType === 'condition') {
        const branchResult = output.branch ? 'true' : 'false';
        const matchEdge = outgoingEdges.find((e: any) => e.sourceHandle === branchResult || e.sourceHandle === output.branch);
        currentNodeId = matchEdge ? matchEdge.target : null;
      } else {
        currentNodeId = outgoingEdges[0].target;
      }
    } catch (err: any) {
      console.error(`[Local Execution Router] Node ${node.id} failed:`, err);
      executedNodes.push({
        nodeId: node.id,
        label: node.data?.label || node.label || nodeType,
        type: nodeType,
        status: 'failed' as const,
        duration: '100ms',
        input: resolvedConfig,
        output: {},
        error: err.message || 'Unknown node execution error'
      });
      
      return {
        success: false,
        nodes: executedNodes,
        error: err.message
      };
    }
  }
  
  return {
    success: true,
    nodes: executedNodes
  };
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get('workflowId');
    const userEmail = req.headers.get('x-user-email') || '';

    if (!workflowId) {
      return NextResponse.json({ error: 'Missing workflowId query parameter' }, { status: 400 });
    }

    // Parse the payload body — builder may embed __workflowDef for dynamic workflows
    let triggerPayload: Record<string, any> = {};
    let inlineWorkflowDef: any = null;
    try {
      const rawBody = await req.json();
      // Extract optional inline workflow definition (used for AI-generated/dynamic workflows)
      if (rawBody.__workflowDef) {
        inlineWorkflowDef = rawBody.__workflowDef;
        const { __workflowDef: _, ...rest } = rawBody;
        triggerPayload = rest;
      } else {
        triggerPayload = rawBody;
      }
    } catch {
      triggerPayload = { textPayload: 'empty' };
    }

    // 1. If Supabase is placeholder, run in Local Execution Sandbox mode
    if (isMockSupabase) {
      // Prefer inline workflow definition (for dynamic AI-generated workflows)
      // then fall back to static FALLBACK_WORKFLOWS list
      const workflow = inlineWorkflowDef || FALLBACK_WORKFLOWS.find(w => w.id === workflowId);

      if (!workflow) {
        return NextResponse.json({ error: `Workflow with ID ${workflowId} not found in sandbox storage` }, { status: 404 });
      }

      console.log(`[Webhook Ingest] Supabase not connected. Running local Sandbox execution for workflow: ${workflowId}`);
      const executionResult = await runLocalWorkflow(workflow, triggerPayload, userEmail);

      return NextResponse.json({
        message: 'Workflow successfully executed in local Sandbox mode.',
        runId: `run_sb_${Math.random().toString(36).substring(7)}`,
        status: executionResult.success ? 'completed' : 'failed',
        localExecution: executionResult
      }, { status: 200 });
    }

    // 2. Fetch workflow metadata from Supabase in production
    const { data: workflow, error: workflowErr } = await supabase
      .from('workflows')
      .select('id, organization_id, status, trigger_type')
      .eq('id', workflowId)
      .single();

    if (workflowErr || !workflow) {
      // Gracefully fall back to inline or local workflows even if Supabase connection fails
      const localWf = inlineWorkflowDef || FALLBACK_WORKFLOWS.find(w => w.id === workflowId);
      if (localWf) {
        console.log(`[Webhook Ingest] Supabase connection failed. Falling back to sandbox execution for workflow: ${workflowId}`);
        const executionResult = await runLocalWorkflow(localWf, triggerPayload, userEmail);
        return NextResponse.json({
          message: 'Workflow successfully executed in local fallback mode.',
          runId: `run_fb_${Math.random().toString(36).substring(7)}`,
          status: executionResult.success ? 'completed' : 'failed',
          localExecution: executionResult
        }, { status: 200 });
      }

      return NextResponse.json({ error: `Workflow with ID ${workflowId} not found` }, { status: 404 });
    }

    if (workflow.status !== 'active') {
      return NextResponse.json({ error: `Workflow with ID ${workflowId} is in a ${workflow.status} state` }, { status: 400 });
    }

    // 3. Insert new workflow run entry set to pending in Supabase
    const { data: run, error: runErr } = await supabase
      .from('workflow_runs')
      .insert({
        workflow_id: workflow.id,
        organization_id: workflow.organization_id,
        status: 'pending',
        trigger_payload: triggerPayload,
        execution_context: {
          trigger: {
            output: triggerPayload
          }
        }
      })
      .select()
      .single();

    if (runErr || !run) {
      console.error('[Webhook Ingest] Error creating workflow run:', runErr);
      return NextResponse.json({ error: 'Failed to initialize workflow run execution' }, { status: 500 });
    }

    // 4. Asynchronously trigger the execution loop without blocking the API response
    executeWorkflowRun(run.id).catch((err) => {
      console.error(`[Background Execution Error] Run ${run.id} failed:`, err);
    });

    // 5. Return 202 Accepted instantly
    return NextResponse.json({
      message: 'Workflow run successfully queued.',
      runId: run.id,
      status: 'pending'
    }, { status: 202 });

  } catch (err: any) {
    console.error('[Webhook Ingest] Fatal router crash:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
