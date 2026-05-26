'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  GitFork, 
  Plug, 
  Activity, 
  Sparkles, 
  Layers,
  Settings,
  HelpCircle,
  Zap
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
  badgeType?: 'default' | 'pulse';
}

const NAVIGATION: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workflows', href: '/workflows', icon: GitFork, badge: 'Active' },
  { name: 'Templates', href: '/templates', icon: Layers },
  { name: 'Integrations', href: '/integrations', icon: Plug, badgeType: 'pulse' },
  { name: 'Activity Logs', href: '/logs', icon: Activity },
  { name: 'AI Assistant', href: '/assistant', icon: Sparkles, badge: 'New' },
];

export function GlobalNavigation() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 glass-panel border-r border-white/5 flex flex-col justify-between z-30">
      {/* Top Brand Logo */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-white/5 gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
            <Zap className="w-4 h-4 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">Zapier Central</h1>
            <span className="text-[10px] text-white/40 font-medium tracking-wider uppercase">Central Agent OS</span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-4 space-y-1.5">
          {NAVIGATION.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-sm border border-white/5' 
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase bg-white/15 text-white/90">
                    {item.badge}
                  </span>
                )}
                {item.badgeType === 'pulse' && (
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile and Settings */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors border border-transparent"
        >
          <Settings className="w-4 h-4 text-white/40" />
          <span>System Settings</span>
        </Link>
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/5 rounded-xl border border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-xs text-white">
              P
            </div>
            <div>
              <p className="text-xs font-semibold text-white leading-none">Pratheek H.J.</p>
              <span className="text-[10px] text-white/40">Owner</span>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider bg-white/10 text-white/60 border border-white/5 uppercase">
            PRO
          </span>
        </div>
      </div>
    </aside>
  );
}
