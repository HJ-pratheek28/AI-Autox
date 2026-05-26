import { create } from 'zustand';
import { 
  Connection, 
  Edge, 
  Node, 
  addEdge, 
  OnNodesChange, 
  OnEdgesChange, 
  applyNodeChanges, 
  applyEdgeChanges 
} from 'reactflow';

export interface NodeData {
  label: string;
  type: 'trigger' | 'ai_analysis' | 'condition' | 'delay' | 'send_email' | 'create_task' | 'notification' | 'webhook';
  config: Record<string, any>;
  errors?: string[];
  executionStatus?: 'idle' | 'success' | 'failed' | 'running';
}

interface WorkflowStore {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: Node<NodeData>[] | ((prev: Node<NodeData>[]) => Node<NodeData>[])) => void;
  setEdges: (edges: Edge[]) => void;
  selectNode: (nodeId: string | null) => void;
  addCustomNode: (type: NodeData['type'], position: { x: number; y: number }) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, any>) => void;
  deleteNode: (nodeId: string) => void;
}

const DEFAULT_CONFIGS: Record<NodeData['type'], Record<string, any>> = {
  trigger: { webhookPath: '/api/webhooks/ingest?workflowId=' },
  ai_analysis: { prompt: 'Analyze this lead for priority and sentiment score', runSentiment: true },
  condition: { value1: '{{trigger.output.amount}}', operator: 'greater_than', value2: '1000' },
  delay: { delayMs: 60000 }, // 1 minute
  send_email: { to: '{{trigger.output.email}}', subject: 'Thanks for reaching out!', body: 'Hi {{trigger.output.name}}, thank you for contacting us.' },
  create_task: { databaseId: 'notion_tasks', title: 'Follow up with {{trigger.output.name}}' },
  notification: { channel: '#operations', message: 'New high-value lead processed: {{trigger.output.name}}' },
  webhook: { url: 'https://api.crm.com/v1/leads', method: 'POST' }
};

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as Node<NodeData>[],
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge({ 
        ...connection, 
        type: 'smoothstep', 
        animated: true,
        style: { stroke: '#f97316', strokeWidth: 2 } 
      }, get().edges),
    });
  },

  setNodes: (nodes) => set((state) => ({ 
    nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes 
  })),
  setEdges: (edges) => set({ edges }),
  
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  addCustomNode: (type, position) => {
    const id = `${type}_${Math.random().toString(36).substring(7)}`;
    const label = type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    const newNode: Node<NodeData> = {
      id,
      type: 'custom',
      position,
      data: {
        label,
        type,
        config: DEFAULT_CONFIGS[type] || {},
        executionStatus: 'idle'
      }
    };

    set({
      nodes: [...get().nodes, newNode]
    });
  },

  updateNodeConfig: (nodeId, config) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config: { ...node.data.config, ...config },
            },
          };
        }
        return node;
      }),
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter(node => node.id !== nodeId),
      edges: get().edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId
    });
  }
}));
