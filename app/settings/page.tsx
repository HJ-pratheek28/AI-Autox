'use client';

import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  ShieldCheck, 
  CreditCard, 
  Users, 
  Lock, 
  FileText, 
  Zap, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

type TabType = 'profile' | 'notifications' | 'security' | 'billing' | 'members' | 'adv_security' | 'audit_log';

interface NavItem {
  id: TabType;
  name: string;
  icon: React.ComponentType<any>;
  locked?: boolean;
}

const SIDEBAR_ITEMS: NavItem[] = [
  { id: 'profile', name: 'My profile', icon: User },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'security', name: 'Security and data', icon: ShieldCheck },
  { id: 'billing', name: 'Billing & usage', icon: CreditCard },
  { id: 'members', name: 'Members', icon: Users, locked: true },
  { id: 'adv_security', name: 'Advanced security', icon: ShieldCheck, locked: true },
  { id: 'audit_log', name: 'Audit log', icon: FileText, locked: true },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Settings saved successfully!');

  // Profile Form States
  const [email, setEmail] = useState('28hjpratheek@gmail.com');
  const [firstName, setFirstName] = useState('H J');
  const [lastName, setLastName] = useState('Pratheek');
  const [company, setCompany] = useState('Startup Co');
  const [role, setRole] = useState('Engineering');
  const [timezone, setTimezone] = useState('UTC+05:30 (India Standard Time)');

  // Notifications States
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  const [notifyOnFail, setNotifyOnFail] = useState(true);
  const [notifyOnApproval, setNotifyOnApproval] = useState(true);
  const [notifyOnQuota, setNotifyOnQuota] = useState(true);

  const [subWeeklySummary, setSubWeeklySummary] = useState(true);
  const [subUpdates, setSubUpdates] = useState(false);
  const [subTips, setSubTips] = useState(true);

  // Security & Data States
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sslEnabled, setSslEnabled] = useState(true);
  const [activeSecAccordion, setActiveSecAccordion] = useState<string | null>(null);

  // Export / Delete Simulations
  const [compilingLabel, setCompilingLabel] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToastMessage('Settings saved successfully!');
    setTimeout(() => {
      setIsSaving(false);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    }, 1000);
  };

  const triggerAutoSave = (msg = 'System preferences saved!') => {
    setIsSaving(true);
    setToastMessage(msg);
    setTimeout(() => {
      setIsSaving(false);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    }, 500);
  };

  const simulateExport = (type: string) => {
    setIsSaving(true);
    setCompilingLabel(`Compiling ${type}...`);
    setTimeout(() => {
      setIsSaving(false);
      setCompilingLabel('');
      setToastMessage(`Export completed! Check your email at ${email}`);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 4000);
    }, 1500);
  };

  const handleDeleteData = () => {
    if (deleteConfirmation !== 'DELETE') return;
    setIsSaving(true);
    setDeleteModalOpen(false);
    setDeleteConfirmation('');
    setTimeout(() => {
      setIsSaving(false);
      setToastMessage('All operational data runs and workflows have been completely deleted.');
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 4000);
    }, 1200);
  };

  const toggleSecAccordion = (id: string) => {
    setActiveSecAccordion(prev => (prev === id ? null : id));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 flex-1 w-full relative">
      
      {/* Toast Notification */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 glass-panel px-4 py-3 rounded-xl border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-200 z-50">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Saving Overlay Spinner (Exports/Compiles) */}
      {compilingLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center gap-4 text-center">
            <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{compilingLabel}</h4>
              <p className="text-[10px] text-white/40 mt-1">Generating high-contrast secure package backups...</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-rose-500/20 p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setDeleteModalOpen(false)}
              className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-sm font-bold text-white">Delete All Operational Data?</h3>
              <p className="text-[10px] text-white/40 leading-relaxed">
                This will permanently delete your workflow definitions, execution run logs, and pgvector HNSW memory traces. This action **cannot be undone**.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Type DELETE to confirm:</label>
              <input 
                type="text" 
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-white/5 border border-rose-500/20 focus:border-rose-500 rounded-lg py-2.5 px-3 text-xs text-white placeholder-white/10 focus:outline-none font-bold text-center uppercase"
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/5 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteData}
                disabled={deleteConfirmation !== 'DELETE'}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/20 text-white rounded-xl text-xs font-semibold shadow-lg cursor-pointer"
              >
                Wipe My Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Platform Settings</h2>
          <p className="text-sm text-white/40 mt-1">Configure profile details, manage security, and coordinate organization credentials.</p>
        </div>
      </div>

      {/* Main Settings Split Frame */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side Tab Navigation */}
        <aside className="w-full lg:w-64 glass-panel p-3 rounded-2xl border border-white/5 space-y-1 shrink-0">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-white/10 text-white border border-white/5' 
                    : 'text-white/60 hover:text-white hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'}`} />
                  <span>{item.name}</span>
                </div>
                {item.locked && (
                  <Lock className="w-3.5 h-3.5 text-white/20 group-hover:text-orange-400/80 transition-colors" />
                )}
              </button>
            );
          })}
        </aside>

        {/* Right Side Content Panel */}
        <div className="flex-1 w-full min-h-[500px]">
          
          {/* TAB 1: My Profile */}
          {activeTab === 'profile' && (
            <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-sm font-bold text-white">Profile Details</span>
                <span className="text-[10px] text-orange-400 font-bold hover:underline cursor-pointer flex items-center gap-1">
                  Edit Gravatar <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                
                {/* Email (Required) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Email (required)</label>
                  <div className="flex gap-3">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1 bg-white/5 border border-white/5 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-white/10 font-semibold"
                    />
                    <button 
                      type="button"
                      className="px-4 py-2.5 rounded-lg border border-white/5 text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                    >
                      Change Email
                    </button>
                  </div>
                </div>

                {/* Password (Required) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Password (required)</label>
                  <div className="flex gap-3">
                    <input 
                      type="password" 
                      value="••••••••••••"
                      readOnly
                      className="flex-1 bg-black/30 border border-white/5 rounded-lg py-2.5 px-3.5 text-xs text-white/40 focus:outline-none cursor-not-allowed font-mono"
                    />
                    <button 
                      type="button"
                      className="px-4 py-2.5 rounded-lg border border-white/5 text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                    >
                      Change Password
                    </button>
                  </div>
                </div>

                {/* First and Last Names */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">First name (required)</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-white/10 font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Last name</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-white/10 font-semibold"
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Company</label>
                  <input 
                    type="text" 
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-white/10 font-semibold"
                  />
                </div>

                {/* Role (Dropdown) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Role</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-white/10 font-semibold"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product Management</option>
                    <option value="Operations">Operations</option>
                    <option value="Sales">Sales & Marketing</option>
                    <option value="Founder">Founder / Executive</option>
                  </select>
                </div>

                {/* Timezone (Dropdown) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Timezone</label>
                  <select 
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-white/10 font-semibold"
                  >
                    <option value="UTC+05:30 (India Standard Time)">UTC+05:30 (India Standard Time)</option>
                    <option value="UTC+00:00 (Greenwich Mean Time)">UTC+00:00 (Greenwich Mean Time)</option>
                    <option value="UTC-08:00 (Pacific Standard Time)">UTC-08:00 (Pacific Standard Time)</option>
                    <option value="UTC-05:00 (Eastern Standard Time)">UTC-05:00 (Eastern Standard Time)</option>
                  </select>
                  <span className="text-[9px] text-white/20 block font-semibold">Used when we handle time with no explicit timezone.</span>
                </div>

                {/* Actions row */}
                <div className="flex justify-end pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 bg-white text-black font-semibold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-neutral-200 transition-colors shadow-lg cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save changes</span>
                    )}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* TAB 2: Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-3">
                <h2 className="text-xl font-bold tracking-tight text-white">Notifications</h2>
              </div>

              <div className="space-y-4">
                
                {/* 1. My notification settings Card */}
                <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
                  <div 
                    onClick={() => setIsNotifyOpen(!isNotifyOpen)}
                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-colors select-none"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">My notification settings</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
                          New
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 leading-relaxed font-semibold">
                        Manage your default and custom notification settings for issues affecting Zaps and folders you own and can access.
                      </p>
                    </div>
                    {isNotifyOpen ? (
                      <ChevronUp className="w-4 h-4 text-white/40 shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/40 shrink-0 ml-4" />
                    )}
                  </div>

                  {/* Expanded block */}
                  {isNotifyOpen && (
                    <div className="p-6 border-t border-white/5 bg-black/15 space-y-4 animate-in fade-in-20 duration-150">
                      {[
                        { 
                          title: 'Notify on workflow execution crashes', 
                          checked: notifyOnFail, 
                          onChange: () => { setNotifyOnFail(!notifyOnFail); triggerAutoSave(); } 
                        },
                        { 
                          title: 'Notify on pending Human-in-the-loop approvals', 
                          checked: notifyOnApproval, 
                          onChange: () => { setNotifyOnApproval(!notifyOnApproval); triggerAutoSave(); } 
                        },
                        { 
                          title: 'Notify on monthly execution quota thresholds', 
                          checked: notifyOnQuota, 
                          onChange: () => { setNotifyOnQuota(!notifyOnQuota); triggerAutoSave(); } 
                        }
                      ].map((pref, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.01]">
                          <span className="text-[10px] font-semibold text-white/80">{pref.title}</span>
                          <input 
                            type="checkbox" 
                            checked={pref.checked}
                            onChange={pref.onChange}
                            disabled={isSaving}
                            className="w-4.5 h-4.5 accent-orange-500 cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Email subscriptions Card */}
                <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
                  <div 
                    onClick={() => setIsEmailOpen(!isEmailOpen)}
                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-colors select-none"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white">Email subscriptions</span>
                      <p className="text-[10px] text-white/40 leading-relaxed font-semibold">
                        Manage your email subscription preferences for activity summaries, Zapier manager, and general communications.
                      </p>
                    </div>
                    {isEmailOpen ? (
                      <ChevronUp className="w-4 h-4 text-white/40 shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/40 shrink-0 ml-4" />
                    )}
                  </div>

                  {/* Expanded block */}
                  {isEmailOpen && (
                    <div className="p-6 border-t border-white/5 bg-black/15 space-y-4 animate-in fade-in-20 duration-150">
                      {[
                        { 
                          title: 'Weekly operational performance audits', 
                          checked: subWeeklySummary, 
                          onChange: () => { setSubWeeklySummary(!subWeeklySummary); triggerAutoSave(); } 
                        },
                        { 
                          title: 'Product updates and system announcements', 
                          checked: subUpdates, 
                          onChange: () => { setSubUpdates(!subUpdates); triggerAutoSave(); } 
                        },
                        { 
                          title: 'Workflow optimization guidelines and tips', 
                          checked: subTips, 
                          onChange: () => { setSubTips(!subTips); triggerAutoSave(); } 
                        }
                      ].map((pref, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.01]">
                          <span className="text-[10px] font-semibold text-white/80">{pref.title}</span>
                          <input 
                            type="checkbox" 
                            checked={pref.checked}
                            onChange={pref.onChange}
                            disabled={isSaving}
                            className="w-4.5 h-4.5 accent-orange-500 cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: Security and Data */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              
              {/* Header title */}
              <div className="border-b border-white/5 pb-3">
                <h2 className="text-xl font-bold tracking-tight text-white">Security and data</h2>
                <p className="text-[10px] text-white/40 mt-1 font-medium">Enable security features, manage third-party account access, and manage your data.</p>
              </div>

              {/* GROUP 1: Security */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Security</span>
                <p className="text-[10px] text-white/30 font-semibold -mt-1 block">Keep your account secure with extra identity checks.</p>
                
                <div className="grid grid-cols-1 gap-2">
                  
                  {/* Row 1: Two-factor authentication (2FA) */}
                  <div className="glass-panel rounded-xl border border-white/5 overflow-hidden transition-all">
                    <div 
                      onClick={() => toggleSecAccordion('2fa')}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-colors select-none"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Two-factor authentication (2FA)</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {twoFactorEnabled ? 'On' : 'Off'}
                          </span>
                          {!twoFactorEnabled && (
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 uppercase tracking-wider">
                              ⚠️ Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-white/40 font-medium">Add additional security to confirm your identity.</p>
                      </div>
                      {activeSecAccordion === '2fa' ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>

                    {activeSecAccordion === '2fa' && (
                      <div className="p-4 border-t border-white/5 bg-black/15 flex items-center justify-between animate-in fade-in duration-100">
                        <span className="text-[10px] text-white/60 font-medium">Authorize SMS/Authenticator tokens on sign in</span>
                        <input 
                          type="checkbox" 
                          checked={twoFactorEnabled} 
                          onChange={() => { setTwoFactorEnabled(!twoFactorEnabled); triggerAutoSave(twoFactorEnabled ? '2FA disabled.' : '2FA activated successfully!'); }}
                          disabled={isSaving}
                          className="w-4.5 h-4.5 accent-orange-500 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Row 2: Third-party apps */}
                  <div className="glass-panel rounded-xl border border-white/5 overflow-hidden transition-all">
                    <div 
                      onClick={() => toggleSecAccordion('apps')}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-colors select-none"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Third-party apps</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-white/5 text-white/40 border border-white/10">0</span>
                        </div>
                        <p className="text-[9px] text-white/40 font-medium">Manage apps that use your Zapier Central credentials to log in to other applications.</p>
                      </div>
                      {activeSecAccordion === 'apps' ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>

                    {activeSecAccordion === 'apps' && (
                      <div className="p-4 border-t border-white/5 bg-black/15 text-[9px] text-white/30 font-medium animate-in fade-in duration-100">
                        No active external applications are currently linked to your credentials.
                      </div>
                    )}
                  </div>

                  {/* Row 3: SSL certificate checks */}
                  <div className="glass-panel rounded-xl border border-white/5 overflow-hidden transition-all">
                    <div 
                      onClick={() => toggleSecAccordion('ssl')}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-colors select-none"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">SSL certificate checks</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            sslEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {sslEnabled ? 'On' : 'Off'}
                          </span>
                        </div>
                        <p className="text-[9px] text-white/40 font-medium">Checks to verify a website's SSL certificate is valid and authenticated.</p>
                      </div>
                      {activeSecAccordion === 'ssl' ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>

                    {activeSecAccordion === 'ssl' && (
                      <div className="p-4 border-t border-white/5 bg-black/15 flex items-center justify-between animate-in fade-in duration-100">
                        <span className="text-[10px] text-white/60 font-medium">Enforce strict SSL handshakes for dynamic outbounds webhook blocks</span>
                        <input 
                          type="checkbox" 
                          checked={sslEnabled} 
                          onChange={() => { setSslEnabled(!sslEnabled); triggerAutoSave(sslEnabled ? 'SSL checks bypassed.' : 'SSL verification active.'); }}
                          disabled={isSaving}
                          className="w-4.5 h-4.5 accent-orange-500 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Row 4: Sign in with another provider */}
                  <div className="glass-panel rounded-xl border border-white/5 overflow-hidden transition-all">
                    <div 
                      onClick={() => toggleSecAccordion('provider')}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-colors select-none"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Sign in with another provider</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-orange-500/15 text-orange-400 border border-orange-500/20">1</span>
                        </div>
                        <p className="text-[9px] text-white/40 font-medium">Use credentials for another provider to log into Zapier Central.</p>
                      </div>
                      {activeSecAccordion === 'provider' ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>

                    {activeSecAccordion === 'provider' && (
                      <div className="p-4 border-t border-white/5 bg-black/15 flex items-center justify-between text-[9px] text-white/60 animate-in fade-in duration-100">
                        <span>Connected Provider: **Google Account Auth**</span>
                        <span className="text-emerald-400 font-bold font-mono">Active Connection</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* GROUP 2: Data Management */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Data management</span>
                <p className="text-[10px] text-white/30 font-semibold -mt-1 block">
                  Upload and download your workflows and data. <span className="text-orange-400 hover:underline cursor-pointer">How we protect your data and privacy</span>
                </p>

                <div className="grid grid-cols-1 gap-2 text-left">
                  
                  {/* Row 1: Download account data */}
                  <div 
                    onClick={() => !isSaving && simulateExport('account ZIP package')}
                    className="glass-panel p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/[0.01] transition-all flex items-center justify-between cursor-pointer select-none group"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white leading-none">Download my account data</h4>
                      <p className="text-[9px] text-white/40 mt-1 font-medium">Receive an email of your account data in a ZIP file.</p>
                    </div>
                    <Download className="w-4.5 h-4.5 text-white/30 group-hover:text-white transition-colors shrink-0" />
                  </div>

                  {/* Row 2: Download private Zaps */}
                  <div 
                    onClick={() => !isSaving && simulateExport('workflow graphs JSON package')}
                    className="glass-panel p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/[0.01] transition-all flex items-center justify-between cursor-pointer select-none group"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white leading-none">Download all private and shared workflows</h4>
                      <p className="text-[9px] text-white/40 mt-1 font-medium">Download the private and shared workflow graphs from all members. A JSON file will be emailed to <span className="font-mono text-orange-400">{email}</span></p>
                    </div>
                    <Download className="w-4.5 h-4.5 text-white/30 group-hover:text-white transition-colors shrink-0" />
                  </div>

                  {/* Row 3: Download app connections */}
                  <div 
                    onClick={() => !isSaving && simulateExport('app connections CSV')}
                    className="glass-panel p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/[0.01] transition-all flex items-center justify-between cursor-pointer select-none group"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white leading-none">Download all app connections</h4>
                      <p className="text-[9px] text-white/40 mt-1 font-medium">Download all active app connections as a CSV file. The file will be emailed to <span className="font-mono text-orange-400">{email}</span></p>
                    </div>
                    <Download className="w-4.5 h-4.5 text-white/30 group-hover:text-white transition-colors shrink-0" />
                  </div>

                  {/* Row 4: Delete my data */}
                  <div 
                    onClick={() => !isSaving && setDeleteModalOpen(true)}
                    className="glass-panel p-4 rounded-xl border border-white/5 hover:border-rose-500/20 hover:bg-rose-500/[0.01] transition-all flex items-center justify-between cursor-pointer select-none group"
                  >
                    <div className="pr-4">
                      <h4 className="text-xs font-bold text-white leading-none group-hover:text-rose-400 transition-colors">Delete my data</h4>
                      <p className="text-[9px] text-white/40 mt-1.5 leading-relaxed font-medium">
                        We'll delete your workflow graphs content, execution run logs, and pgvector traces, and email you when the process is complete. Deleting your data will not delete your account. To delete your account, go to the Delete Account settings gate.
                      </p>
                    </div>
                    <Trash2 className="w-4.5 h-4.5 text-white/30 group-hover:text-rose-400 transition-colors shrink-0" />
                  </div>

                  {/* Row 5: Delete my account */}
                  <div className="glass-panel p-4 rounded-xl border border-white/5 hover:border-rose-500/30 hover:bg-rose-500/[0.02] transition-all flex items-center justify-between cursor-pointer select-none group">
                    <div>
                      <h4 className="text-xs font-bold text-white leading-none group-hover:text-rose-400 transition-colors">Delete my account</h4>
                      <p className="text-[9px] text-white/40 mt-1 font-medium">Delete your user account and all matching multi-tenant data logs.</p>
                    </div>
                    <ArrowRight className="w-4.5 h-4.5 text-white/30 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 4: Billing & Usage */}
          {activeTab === 'billing' && (
            <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6">
              <span className="text-sm font-bold text-white block border-b border-white/5 pb-4">Monthly Execution Quota</span>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-white/60">Execution Runs (Monthly Plan)</span>
                  <span className="text-white font-mono">1,482 / 5,000 runs</span>
                </div>
                
                <div className="w-full bg-white/5 border border-white/5 rounded-full h-2 relative overflow-hidden">
                  <div className="bg-orange-500 h-full w-[29.6%] rounded-full" />
                </div>

                <div className="flex justify-between items-center text-[10px] text-white/40 pt-1">
                  <span>Billing cycle resets in 8 days</span>
                  <span className="text-orange-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5">
                    Upgrade Plan <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5-7: Locked Enterprise Gates */}
          {(activeTab === 'members' || activeTab === 'adv_security' || activeTab === 'audit_log') && (
            <div className="glass-panel p-8 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px] animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                <Lock className="w-5 h-5 animate-pulse" />
              </div>
              <div className="max-w-sm space-y-1.5">
                <h3 className="text-sm font-bold text-white tracking-wide">Upgrade to Teams or Enterprise</h3>
                <p className="text-xs text-white/40 leading-relaxed font-medium">
                  Features like multi-user team workspaces, role-based access control (RBAC), and immutable audit histories are reserved for Teams and Enterprise plans.
                </p>
              </div>
              <button className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-orange-500/10 cursor-pointer">
                Talk to Sales
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
