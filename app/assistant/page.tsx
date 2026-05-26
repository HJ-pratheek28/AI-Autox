'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Bot, 
  User, 
  Zap, 
  Clock, 
  ArrowRight,
  TrendingUp,
  FolderOpen
} from 'lucide-react';

interface Message {
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actions?: { label: string; onClick: () => void; primary?: boolean }[];
  metaCard?: {
    type: 'workflow' | 'error' | 'metric';
    title: string;
    details: string[];
    status?: 'success' | 'failed' | 'paused';
  };
}

const SUGGESTIONS = [
  { text: 'Check the status of active pipelines', query: 'status' },
  { text: 'Are there any failed execution logs?', query: 'failed' },
  { text: 'Propose optimizations for high-value leads', query: 'optimize' },
  { text: 'Approve the paused Notion followup step', query: 'approve' }
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Hello! I am your Zapier Central AI Agent. I manage active API scopes, retrieve context from your operational memory, audit execution logs, and optimize pipeline paths.\n\nHow can I help coordinate your operations today?',
      timestamp: '22:45'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const userMsg: Message = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // 2. Synthesize AI Employee Response
    setTimeout(() => {
      setIsTyping(false);
      const query = text.toLowerCase();
      let botResponse: Message;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (query.includes('status') || query.includes('pipeline') || query.includes('active')) {
        botResponse = {
          sender: 'bot',
          text: 'I parsed active schemas from Supabase. You currently have **2 active pipelines** running in a healthy state, **1 paused** on approval, and **1 draft** block.',
          timestamp: timeStr,
          metaCard: {
            type: 'workflow',
            title: 'Lead Analyzer Pipeline (wf_7e3d1)',
            details: [
              'Status: Active & Listening',
              'Ingestion rate: 25 webhook hits / hour',
              'AI Score benchmark: 92 avg'
            ],
            status: 'success'
          }
        };
      } else if (query.includes('fail') || query.includes('error') || query.includes('logs')) {
        botResponse = {
          sender: 'bot',
          text: 'I detected **1 failed execution** within the Sheets Synchronizer workflow (`run_c9e2b`). The Gmail sender step crashed because the integration credentials expired.',
          timestamp: timeStr,
          metaCard: {
            type: 'error',
            title: 'Sheets Synchronizer Interrupted',
            details: [
              'Reason: Gmail OAuth token expired',
              'Crashed node: Auto Gmail Response (send_email_3)',
              'Timestamp: May 23, 18:15:01'
            ],
            status: 'failed'
          },
          actions: [
            { label: 'Go to Integrations Hub', onClick: () => window.location.href = '/integrations' }
          ]
        };
      } else if (query.includes('optimize') || query.includes('leads') || query.includes('suggest')) {
        botResponse = {
          sender: 'bot',
          text: 'Based on cosine similarity matching against operational rules, I suggest making the following changes to **High-Value Lead Analyzer**:\n\n1. **Add Outbound Delay**: Add a 5-minute delay block before drafting custom emails. This builds human-trust by making automation look organic.\n2. **Extend AI Sentiment prompts**: Include guidelines to qualify budget fields to prevent enqueuing leads under $10,000.',
          timestamp: timeStr,
          metaCard: {
            type: 'metric',
            title: 'Optimization Forecast',
            details: [
              'Expected email reply rate boost: +12%',
              'Estimated workflow token savings: -18%',
              'Average pipeline latency reduction: 120ms'
            ]
          }
        };
      } else if (query.includes('approve') || query.includes('paused') || query.includes('notion')) {
        botResponse = {
          sender: 'bot',
          text: 'I have successfully **authorized the execution step** `approval_gate` for `run_a0b2c`! The pitch deck outline has been approved and dispatched to #operations-alerts.',
          timestamp: timeStr,
          metaCard: {
            type: 'workflow',
            title: 'Notion Followup Complete',
            details: [
              'Authorized by: Pratheek H.J. (Owner)',
              'Dispatched output: Pitch Deck summary',
              'Next node: Complete'
            ],
            status: 'success'
          }
        };
      } else {
        botResponse = {
          sender: 'bot',
          text: `I performed a vector cosine search over your organization memories. I am retaining historical lead profiles, business constraints, and execution logs. \n\nI can audit failed runs, trigger custom workflow pipelines, or authorize paused steps when you ask me to.`,
          timestamp: timeStr
        };
      }

      setMessages(prev => [...prev, botResponse]);
    }, 1200);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 flex-1 w-full flex flex-col h-[calc(100vh-2rem)] overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Zapier Central AI Agent</h2>
            <p className="text-[10px] text-white/40 mt-0.5">Retraining with vector memory matching • HNSW index 99.4% accurate</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[9px] font-bold text-white/50 tracking-wider uppercase">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Active Session</span>
        </div>
      </div>

      {/* Main chat column */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin">
        {messages.map((msg, index) => (
          <div 
            key={index}
            className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
          >
            {/* Avatar icon */}
            {msg.sender === 'bot' && (
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <Bot className="w-4.5 h-4.5" />
              </div>
            )}

            <div className={`space-y-3 max-w-xl ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              
              {/* Text Bubble */}
              <div className={`p-4 rounded-2xl text-xs leading-relaxed font-medium ${
                msg.sender === 'user'
                  ? 'bg-orange-500 text-white rounded-tr-none'
                  : 'bg-white/[0.02] border border-white/5 text-white/80 rounded-tl-none whitespace-pre-wrap'
              }`}>
                {msg.text}
              </div>

              {/* Dynamic Metadata cards */}
              {msg.metaCard && (
                <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/20 text-left space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-white tracking-wide">{msg.metaCard.title}</span>
                    {msg.metaCard.status && (
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        msg.metaCard.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {msg.metaCard.status}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {msg.metaCard.details.map((d, i) => (
                      <div key={i} className="text-[9px] text-white/50 font-mono font-medium flex items-center gap-1.5">
                        <ArrowRight className="w-2.5 h-2.5 text-white/20 shrink-0" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions panel */}
              {msg.actions && (
                <div className="flex gap-2">
                  {msg.actions.map((act) => (
                    <button
                      key={act.label}
                      onClick={act.onClick}
                      className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 cursor-pointer transition-colors"
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              )}

              <span className="text-[8px] text-white/25 block font-semibold">{msg.timestamp}</span>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-white/60 flex items-center justify-center shrink-0">
                <User className="w-4.5 h-4.5" />
              </div>
            )}
          </div>
        ))}

        {/* Typing bubble loader */}
        {isTyping && (
          <div className="flex gap-4 justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div className="bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input panel & suggestions */}
      <div className="shrink-0 border-t border-white/5 pt-4 bg-neutral-950 space-y-4">
        
        {/* Suggestion tags */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.query}
              onClick={() => handleSend(s.text)}
              className="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-white/40 hover:text-white bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer transition-all shrink-0"
            >
              {s.text}
            </button>
          ))}
        </div>

        {/* Form Input */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your AI employee: 'Suggest optimizations', 'Approve my Notion deck', or 'Check logs'..."
            className="w-full bg-white/5 border border-white/5 rounded-xl py-3.5 pl-4 pr-16 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-2 bottom-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/40 text-white px-3.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
