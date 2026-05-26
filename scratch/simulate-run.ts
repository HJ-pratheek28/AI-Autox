import { Zap, Sparkles, HelpCircle, Mail, MessageSquare } from 'lucide-react';

interface CustomNode {
  id: string;
  type: string;
  label: string;
  config: Record<string, any>;
}

interface CustomEdge {
  source: string;
  target: string;
  sourceHandle?: string;
}

// 1. Mock the Lead Qualification Graph defined in our spec
const MOCK_NODES: CustomNode[] = [
  {
    id: 'node_trigger',
    type: 'trigger',
    label: 'Inbound Form Webhook',
    config: { webhookPath: '/api/webhooks/ingest?workflowId=wf_7e3d1' }
  },
  {
    id: 'node_ai_analysis',
    type: 'ai_analysis',
    label: 'AI Sentiment & Qualifier',
    config: { prompt: 'Analyze priority score based on funding scale', runSentiment: true }
  },
  {
    id: 'node_condition',
    type: 'condition',
    label: 'Verify Lead Priority Gate',
    config: { value1: '{{node_ai_analysis.output.leadScore}}', operator: 'greater_than', value2: '80' }
  },
  {
    id: 'node_slack',
    type: 'notification',
    label: 'Slack Alerts Notification',
    config: { channel: '#sales-leads', message: 'Hot Lead alert! Qualified: {{node_trigger.output.name}} (Score: {{node_ai_analysis.output.leadScore}})' }
  },
  {
    id: 'node_gmail',
    type: 'send_email',
    label: 'Send Email Followup',
    config: { to: '{{node_trigger.output.email}}', subject: 'Re: Partnership Proposal', body: 'Hi {{node_trigger.output.name}}, let\'s connect on Monday!' }
  }
];

const MOCK_EDGES: CustomEdge[] = [
  { source: 'node_trigger', target: 'node_ai_analysis' },
  { source: 'node_ai_analysis', target: 'node_condition' },
  { source: 'node_condition', target: 'node_slack', sourceHandle: 'true' },
  { source: 'node_slack', target: 'node_gmail' }
];

// 2. Dynamic variable resolver
function resolveVariables(config: any, context: any): any {
  const str = JSON.stringify(config);
  const resolved = str.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const keys = path.trim().split('.');
    let value = context;
    for (const key of keys) {
      value = value?.[key];
    }
    return value !== undefined ? String(value) : `{{${path}}}`;
  });
  return JSON.parse(resolved);
}

// 3. Execution state machine simulator
async function runSimulation() {
  console.log('\x1b[35m%s\x1b[0m', '=== ANTIGRAVITY AI OPERATIONAL OS RUN SIMULATOR ===');
  console.log('Loading workflow: "High-Value Lead Analyzer"\n');

  // Input mock payload
  const triggerPayload = {
    name: 'Alice Johnson',
    email: 'alice@investorcorp.com',
    message: 'We are looking to scale our operations infrastructure and have a budget of $75,000 for automation tooling.'
  };

  const context: Record<string, any> = {
    trigger: { output: triggerPayload }
  };

  let currentNodeId = 'node_trigger';
  
  while (currentNodeId) {
    const node = MOCK_NODES.find(n => n.id === currentNodeId);
    if (!node) break;

    console.log('\x1b[36m%s\x1b[0m', `[Node Started] ${node.label} (${node.id})`);
    
    // Resolve dynamic inputs
    const resolvedInput = resolveVariables(node.config, context);
    console.log('  Inputs:', JSON.stringify(resolvedInput, null, 2));

    // Simulate node execution
    let output: Record<string, any> = {};
    
    if (node.type === 'trigger') {
      output = { triggerReceived: true, payload: triggerPayload };
    } else if (node.type === 'ai_analysis') {
      console.log('  \x1b[33m%s\x1b[0m', '  -> Querying AI Agent model (Simulated Sonnet analysis)...');
      // Simulate 1s latency
      await new Promise(r => setTimeout(r, 600));
      output = {
        analyzed: true,
        leadScore: 92,
        isHighValue: true,
        summary: 'Hot Lead. High budget threshold met.'
      };
    } else if (node.type === 'condition') {
      const val1 = resolvedInput.value1;
      const val2 = resolvedInput.value2;
      const operator = resolvedInput.operator;
      
      let isTrue = false;
      if (operator === 'greater_than') isTrue = Number(val1) > Number(val2);
      
      output = { branch: isTrue ? 'true' : 'false' };
      console.log(`  Condition Evaluated: ${val1} > ${val2} => \x1b[32m${isTrue}\x1b[0m`);
    } else if (node.type === 'notification') {
      output = { sent: true, provider: 'slack', channel: resolvedInput.channel };
    } else if (node.type === 'send_email') {
      output = { emailDispatched: true, to: resolvedInput.to };
    }

    context[node.id] = { output };
    console.log('  \x1b[32m%s\x1b[0m', `  Outputs:`, JSON.stringify(output, null, 2));

    // Find next node in topological route
    const outgoingEdges = MOCK_EDGES.filter(e => e.source === node.id);
    if (outgoingEdges.length === 0) {
      currentNodeId = '';
    } else if (node.type === 'condition') {
      const branch = output.branch; // 'true' or 'false'
      const edge = outgoingEdges.find(e => e.sourceHandle === branch);
      currentNodeId = edge ? edge.target : '';
    } else {
      currentNodeId = outgoingEdges[0].target;
    }

    console.log('----------------------------------------------------');
  }

  console.log('\x1b[32m%s\x1b[0m', '\n=== WORKFLOW SIMULATION RUN COMPLETED SUCCESSFULLY ===');
  console.log('Final Execution State:\n', JSON.stringify(context, null, 2));
}

// Trigger simulation
runSimulation();
