'use client';

import React from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  BackgroundVariant 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '@/hooks/use-workflow-engine';
import { CustomNode } from './custom-node';

// Set Custom Node type mappings
const NODE_TYPES = {
  custom: CustomNode
};

export function BuilderCanvas() {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    selectNode 
  } = useWorkflowStore();

  return (
    <div className="w-full h-full relative bg-neutral-950/40 rounded-2xl border border-white/5 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        fitView
        className="w-full h-full"
      >
        {/* Sleek Vercel dot patterns */}
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={16} 
          size={1} 
          color="rgba(255,255,255,0.06)" 
        />
        
        {/* Dynamic Canvas Zooming widgets */}
        <Controls 
          className="bg-neutral-900 border border-white/5 text-white/40 rounded-lg p-1 flex gap-1 [&>button]:bg-white/5 [&>button]:border [&>button]:border-white/5 [&>button]:text-white/60 [&>button]:rounded [&>button]:w-6 [&>button]:h-6 hover:[&>button]:bg-white/10 hover:[&>button]:text-white [&>button_svg]:w-3.5 [&>button_svg]:h-3.5 [&>button_svg]:mx-auto" 
          showInteractive={false} 
        />
      </ReactFlow>
    </div>
  );
}
