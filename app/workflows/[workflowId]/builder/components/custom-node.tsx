'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Zap, 
  Sparkles, 
  HelpCircle, 
  Clock, 
  Mail, 
  BookOpen, 
  MessageSquare, 
  Globe,
  Check,
  AlertCircle
} from 'lucide-react';
import { NodeData } from '@/hooks/use-workflow-engine';

const ICON_MAP: Record<NodeData['type'], React.ComponentType<any>> = {
  trigger: Zap,
  ai_analysis: Sparkles,
  condition: HelpCircle,
  delay: Clock,
  send_email: Mail,
  create_task: BookOpen,
  notification: MessageSquare,
  webhook: Globe
};

const BORDER_COLORS: Record<NodeData['type'], string> = {
  trigger: 'border-amber-500/30 group-hover:border-amber-500/50',
  ai_analysis: 'border-orange-500/30 group-hover:border-orange-500/50',
  condition: 'border-sky-500/30 group-hover:border-sky-500/50',
  delay: 'border-purple-500/30 group-hover:border-purple-500/50',
  send_email: 'border-rose-500/30 group-hover:border-rose-500/50',
  create_task: 'border-neutral-500/30 group-hover:border-neutral-500/50',
  notification: 'border-emerald-500/30 group-hover:border-emerald-500/50',
  webhook: 'border-teal-500/30 group-hover:border-teal-500/50'
};

const ICON_BG: Record<NodeData['type'], string> = {
  trigger: 'bg-amber-500/10 text-amber-400',
  ai_analysis: 'bg-orange-500/10 text-orange-400',
  condition: 'bg-sky-500/10 text-sky-400',
  delay: 'bg-purple-500/10 text-purple-400',
  send_email: 'bg-rose-500/10 text-rose-400',
  create_task: 'bg-neutral-500/10 text-neutral-400',
  notification: 'bg-emerald-500/10 text-emerald-400',
  webhook: 'bg-teal-500/10 text-teal-400'
};

export function CustomNode({ id, data, selected }: { id: string; data: NodeData; selected?: boolean }) {
  const Icon = ICON_MAP[data.type] || Zap;
  const isCondition = data.type === 'condition';

  return (
    <div className={`group react-flow__node-custom w-[240px] glass-panel rounded-xl border p-4 text-left transition-all duration-200 select-none ${
      selected 
        ? 'border-white/40 ring-1 ring-white/10 shadow-lg shadow-black/60' 
        : BORDER_COLORS[data.type] || 'border-white/5'
    } bg-neutral-900/90 relative`}>
      
      {/* Node Input Connector */}
      {data.type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-2.5 h-2.5"
          style={{ left: '-6px' }}
        />
      )}

      {/* Main Node Context */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg ${ICON_BG[data.type]} flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-white tracking-wide truncate max-w-[150px]">{data.label}</h4>
            <span className="text-[8px] text-white/30 font-semibold uppercase tracking-wider block mt-0.5">{data.type.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Dynamic preview summaries */}
        <div className="bg-black/25 rounded-md p-2 border border-white/5 text-[9px] text-white/50 leading-relaxed font-medium">
          {data.type === 'trigger' && (
            <p className="truncate">Path: <span className="font-mono text-white/60">{data.config.webhookPath ? 'POST /ingest' : 'API'}</span></p>
          )}
          {data.type === 'ai_analysis' && (
            <p className="line-clamp-2">Prompt: <span className="text-white/60 font-mono">"{data.config.prompt}"</span></p>
          )}
          {data.type === 'condition' && (
            <p className="truncate">If: <span className="text-sky-400 font-mono">{data.config.value1}</span> {data.config.operator.replace('_', ' ')} <span className="text-orange-400 font-mono">{data.config.value2}</span></p>
          )}
          {data.type === 'delay' && (
            <p className="truncate">Wait: <span className="text-purple-400 font-mono">{data.config.delayMs / 1000}s</span> before next step</p>
          )}
          {data.type === 'send_email' && (
            <p className="truncate">Email to: <span className="text-rose-400 font-mono">{data.config.to}</span></p>
          )}
          {data.type === 'create_task' && (
            <p className="truncate">Task: <span className="text-white/70">"{data.config.title}"</span></p>
          )}
          {data.type === 'notification' && (
            <p className="truncate">Slack: <span className="text-emerald-400 font-mono">{data.config.channel}</span></p>
          )}
          {data.type === 'webhook' && (
            <p className="truncate">Url: <span className="text-teal-400 font-mono">{data.config.url}</span></p>
          )}
        </div>
      </div>

      {/* Node Output Connector */}
      {!isCondition ? (
        <Handle
          type="source"
          position={Position.Right}
          className="w-2.5 h-2.5"
          style={{ right: '-6px' }}
        />
      ) : (
        /* Multi handle logic for branch conditionals */
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="w-2.5 h-2.5"
            style={{ top: '35%', right: '-6px', backgroundColor: '#10b981' }}
            title="True branch"
          />
          <div className="absolute right-1 top-[22%] text-[8px] font-bold text-emerald-400 select-none">T</div>

          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="w-2.5 h-2.5"
            style={{ top: '65%', right: '-6px', backgroundColor: '#f43f5e' }}
            title="False branch"
          />
          <div className="absolute right-1 top-[52%] text-[8px] font-bold text-rose-400 select-none">F</div>
        </>
      )}
    </div>
  );
}
