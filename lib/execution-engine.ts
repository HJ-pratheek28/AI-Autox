import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Setup Supabase Client (uses service role key in production to bypass RLS for execution worker)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Topologically resolves, logs, and executes a workflow run.
 */
export async function executeWorkflowRun(runId: string) {
  try {
    // 1. Fetch run and associated workflow configurations
    const { data: run, error: runError } = await supabase
      .from('workflow_runs')
      .select('*, workflows(*)')
      .eq('id', runId)
      .single();

    if (runError || !run) {
      console.error(`[Execution Engine] Error fetching run ${runId}:`, runError);
      return;
    }

    const workflow = run.workflows;
    if (!workflow || workflow.status !== 'active') {
      await updateRunStatus(runId, 'failed', `Workflow is inactive or not found.`);
      return;
    }

    await updateRunStatus(runId, 'running');

    const nodes = workflow.nodes || [];
    const edges = workflow.edges || [];
    let context = run.execution_context || {};

    // 2. Identify trigger node
    let currentNodeId = run.current_node_id || findStartNode(nodes, edges);

    while (currentNodeId) {
      // Refresh run state to check if human-in-the-loop paused it
      const { data: freshRun } = await supabase
        .from('workflow_runs')
        .select('status')
        .eq('id', runId)
        .single();

      if (freshRun?.status === 'paused_approval') {
        console.log(`[Execution Engine] Run ${runId} paused for Human-in-the-loop approval.`);
        return;
      }

      const node = nodes.find((n: any) => n.id === currentNodeId);
      if (!node) break;

      // 3. Insert running log into node_executions audit
      const resolvedConfig = resolveVariables(node.config || {}, context);
      const { data: nodeLog, error: nodeLogErr } = await supabase
        .from('node_executions')
        .insert({
          workflow_run_id: runId,
          node_id: node.id,
          node_type: node.type,
          status: 'running',
          input_data: resolvedConfig,
        })
        .select()
        .single();

      if (nodeLogErr) {
        console.error(`[Execution Engine] Error inserting node log for node ${node.id}:`, nodeLogErr);
      }

      try {
        // 4. Execute standard or AI Action
        const output = await executeAction(node.type, resolvedConfig, context);

        // Update local memory and global execution context
        context[node.id] = { output };

        // 5. Update Audit trace as successful
        if (nodeLog) {
          await supabase
            .from('node_executions')
            .update({
              status: 'success',
              output_data: output,
              completed_at: new Date().toISOString()
            })
            .eq('id', nodeLog.id);
        }

        // 6. Find next transition path
        const outgoingEdges = edges.filter((e: any) => e.source === node.id);

        if (outgoingEdges.length === 0) {
          currentNodeId = null; // Graph complete
        } else if (node.type === 'condition') {
          const branchResult = output.branch ? 'true' : 'false';
          const matchEdge = outgoingEdges.find((e: any) => e.sourceHandle === branchResult || e.sourceHandle === output.branch);
          currentNodeId = matchEdge ? matchEdge.target : null;
        } else {
          currentNodeId = outgoingEdges[0].target;
        }

        // Checkpoint state inside Supabase
        await supabase
          .from('workflow_runs')
          .update({
            current_node_id: currentNodeId,
            execution_context: context
          })
          .eq('id', runId);

      } catch (err: any) {
        console.error(`[Execution Engine] Node ${node.id} failed:`, err);
        
        if (nodeLog) {
          await supabase
            .from('node_executions')
            .update({
              status: 'failed',
              error: err.message || 'Unknown node error',
              completed_at: new Date().toISOString()
            })
            .eq('id', nodeLog.id);
        }

        await updateRunStatus(runId, 'failed', err.message);
        return;
      }
    }

    // 7. Graph finished successfully
    await supabase
      .from('workflow_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', runId);

    console.log(`[Execution Engine] Run ${runId} completed successfully.`);

  } catch (globalErr: any) {
    console.error(`[Execution Engine] Fatal crash during execution run ${runId}:`, globalErr);
    await updateRunStatus(runId, 'failed', globalErr.message);
  }
}

/**
 * Resolves properties like {{node_1.output.body}} using dynamic dot notation paths.
 */
export function resolveVariables(config: any, context: any): any {
  if (!config) return config;
  const str = JSON.stringify(config);
  const resolved = str.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const keys = path.trim().split('.');
    let value = context;
    for (const key of keys) {
      value = value?.[key];
    }
    if (value !== undefined) return String(value);
    
    // Fallback: try resolving from triggerPayload directly if path starts with a node id
    // e.g. {{n_trig.output.email}} → look for 'email' in triggerPayload
    if (keys.length >= 3 && keys[1] === 'output') {
      const fieldName = keys[2];
      const triggerOutput = context?.triggerPayload || context?.trigger?.output || {};
      if (triggerOutput[fieldName] !== undefined) return String(triggerOutput[fieldName]);
    }
    
    return `{{${path}}}`;
  });
  return JSON.parse(resolved);
}

/**
 * Identifies the trigger node of a workflow graph.
 */
function findStartNode(nodes: any[], edges: any[]): string | null {
  const targetIds = new Set(edges.map((e) => e.target));
  const startNode = nodes.find((n) => !targetIds.has(n.id) || n.type === 'trigger');
  return startNode ? startNode.id : null;
}

/**
 * Helper to update run core status parameters.
 */
async function updateRunStatus(runId: string, status: string, errorMessage?: string) {
  const payload: Record<string, any> = { status };
  if (errorMessage) {
    payload.error_message = errorMessage;
  }
  if (status === 'completed' || status === 'failed') {
    payload.completed_at = new Date().toISOString();
  }
  await supabase.from('workflow_runs').update(payload).eq('id', runId);
}

/**
 * Mock actions for MVP Integrations & AI Engine logic.
 */
export async function executeAction(type: string, config: any, context: any): Promise<Record<string, any>> {
  console.log(`[Execution Engine] Executing Node [${type}] with config:`, config);
  
  switch (type) {
    case 'trigger':
      // Return the trigger config/payload so downstream nodes can access
      // fields via {{n_trig.output.email}} etc.
      return { triggerReceived: true, timestamp: new Date().toISOString(), ...config };

    case 'send_email':
      {
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = Number(process.env.SMTP_PORT) || 587;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASSWORD;
        // Use logged-in user's email as sender identity; fall back to SMTP_USER
        const userEmail = context?.userEmail || smtpUser || '';

        // Resolve recipient — if variable template wasn't resolved, fall back to
        // the trigger payload 'email' field directly
        let recipient = config.to || '';
        if (!recipient || recipient.startsWith('{{')) {
          const triggerOut = context?.trigger?.output || context?.triggerPayload || {};
          recipient = triggerOut.email || triggerOut.to || triggerOut.recipient || triggerOut.Email || '';
          console.log(`[Execution Engine] Variable unresolved, falling back to trigger payload email: "${recipient}"`);
        }

        // From header: show the logged-in user's email as sender name so recipients
        // see the correct identity. SMTP auth always uses SMTP_USER credentials.
        const displayName = userEmail ? userEmail.split('@')[0] : 'Zapier Central';
        const dynamicFrom = `"${displayName}" <${smtpUser || userEmail}>`;

        if (smtpHost && smtpUser && smtpPass) {
          console.log(`[Execution Engine] Live SMTP connection active. Dispatching real email to ${recipient}...`);
          try {
            const transporter = nodemailer.createTransport({
              host: smtpHost,
              port: smtpPort,
              secure: smtpPort === 465,
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            });

            const info = await transporter.sendMail({
              from: dynamicFrom,
              replyTo: userEmail || smtpUser || undefined,
              to: recipient,
              subject: config.subject || 'Automated Update from Zapier Central',
              text: config.body || 'No email content was provided.',
              html: (config.body || 'No email content was provided.').replace(/\n/g, '<br>'),
            });

            console.log(`[Execution Engine] Email sent successfully! Message ID: ${info.messageId}`);
            return {
              sent: true,
              realWorldDispatch: true,
              messageId: info.messageId,
              to: config.to,
              subject: config.subject,
              sender: userEmail || smtpUser
            };
          } catch (smtpErr: any) {
            console.error(`[Execution Engine] SMTP dispatch failed:`, smtpErr);
            throw new Error(`Real-World SMTP sending failed: ${smtpErr.message}`);
          }
        } else {
          // Fallback to beautiful high-fidelity simulated logs to ensure MVP functionality works out of the box
          console.log(`[Execution Engine] SMTP credentials not detected. Simulating email dispatch to ${config.to || 'recipient@domain.com'}...`);
          return {
            sent: true,
            realWorldDispatch: false,
            sender: userEmail || 'no-reply@zapiercentral.ai',
            to: config.to || 'recipient@domain.com',
            subject: config.subject || 'Automated Update',
            body: config.body || 'No content provided.',
            messageId: `msg_sim_${Math.random().toString(36).substring(7)}`,
            notice: 'Configure SMTP environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD) inside .env.local to dispatch real emails to the internet!'
          };
        }
      }

    case 'notification':
      // Slack Notification Simulation
      return {
        notified: true,
        channel: config.channel || '#general',
        message: config.message || 'Notification fired.',
        ts: Date.now().toString()
      };

    case 'create_task':
      // Notion create task simulation
      return {
        created: true,
        databaseId: config.databaseId || 'notion_database_ref',
        title: config.title || 'Untitled automation task',
        pageId: `notion_page_${Math.random().toString(36).substring(7)}`
      };

    case 'ai_analysis':
      // AI reasoning step simulation (Lead parsing, tone parsing, etc.)
      const score = Math.floor(Math.random() * 40) + 60; // 60-100
      return {
        analyzed: true,
        summary: `Highly qualified lead interested in scaling. Priority tier set based on sentiment.`,
        leadScore: score,
        isHighValue: score >= 80,
        suggestedResponse: `Hi! Thanks for reaching out. We would love to discuss helping you scale.`
      };

    case 'condition':
      // Logic branching. Evaluates input comparison expressions
      const val1 = config.value1;
      const val2 = config.value2;
      const operator = config.operator || 'equals';
      
      let isTrue = false;
      if (operator === 'equals') isTrue = String(val1) === String(val2);
      else if (operator === 'greater_than') isTrue = Number(val1) > Number(val2);
      else if (operator === 'contains') isTrue = String(val1).includes(String(val2));

      return { branch: isTrue ? 'true' : 'false', evaluated: true };

    case 'delay':
      const delayMs = Number(config.delayMs) || 1000;
      await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 5000))); // Max 5 seconds in development
      return { delayed: true, durationMs: delayMs };

    case 'webhook':
      // Outbound Webhook Simulation
      return {
        posted: true,
        url: config.url || 'https://api.thirdparty.com',
        responseStatus: 200,
        payload: { success: true }
      };

    default:
      throw new Error(`Unsupported node execution block: ${type}`);
  }
}
