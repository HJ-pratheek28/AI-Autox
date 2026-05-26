'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import { 
  Zap, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  CheckSquare, 
  Square, 
  X, 
  LogIn, 
  Lock, 
  Eye, 
  EyeOff, 
  Smartphone, 
  KeyRound, 
  ChevronDown, 
  ChevronLeft, 
  Mail 
} from 'lucide-react';

interface GoogleAccount {
  name: string;
  email: string;
  avatar: string;
  avatarColor: string;
  signedIn?: boolean;
}

const GOOGLE_ACCOUNTS: GoogleAccount[] = [
  {
    name: 'H J Pratheek',
    email: '28hjpratheek@gmail.com',
    avatar: 'HP',
    avatarColor: 'from-orange-500 to-amber-500',
    signedIn: true
  },
  {
    name: 'Pratheek H.J.',
    email: 'pratheek@startup.co',
    avatar: 'P',
    avatarColor: 'from-emerald-500 to-teal-500'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  
  // Google sign in prompt workflow states
  const [selectorStep, setSelectorStep] = useState<'SELECT' | 'EMAIL' | 'PASSWORD' | 'MFA' | 'LOADING'>('SELECT');
  const [selectedAccount, setSelectedAccount] = useState<GoogleAccount | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [mfaTimer, setMfaTimer] = useState(3);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) return;
    
    // Real Supabase OAuth flow: bypass mock chooser and go straight to Google
    if (isSupabaseConfigured && supabase) {
      setIsSubmitting(true);
      setLoadingStep('Redirecting to Google Sign-In...');
      setShowSelector(true);
      setSelectorStep('LOADING');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('[Login] Supabase OAuth error:', error.message);
        setIsSubmitting(false);
        alert(`Sign-in failed: ${error.message}`);
        setShowSelector(false);
      }
      return;
    }
    
    // Reset all modal values to initial clean slate (mock mode fallback)
    setSelectorStep('SELECT');
    setSelectedAccount(null);
    setCustomEmail('');
    setPassword('');
    setShowPassword(false);
    setEmailError('');
    setPasswordError('');
    setMfaTimer(3);
    setShowSelector(true);
  };

  const selectAccount = (account: GoogleAccount) => {
    setSelectedAccount(account);
    setSelectorStep('PASSWORD');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) {
      setEmailError('Enter an email or phone number');
      return;
    }
    
    // Simple robust email validation matching Google Sign-In expectations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customEmail)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setEmailError('');

    // Create a dynamic Google account preset for the entered email
    const account: GoogleAccount = {
      name: customEmail.split('@')[0],
      email: customEmail,
      avatar: customEmail.substring(0, 2).toUpperCase(),
      avatarColor: 'from-neutral-600 to-neutral-800'
    };
    setSelectedAccount(account);
    setSelectorStep('PASSWORD');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setPasswordError('Enter your password');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setPasswordError('');
    setSelectorStep('MFA');
    setMfaTimer(3);

    // Initialize an interactive 3-second countdown timer for auto MFA verification
    let currentCount = 3;
    const mfaInterval = setInterval(() => {
      currentCount -= 1;
      setMfaTimer(currentCount);
      if (currentCount <= 0) {
        clearInterval(mfaInterval);
        startBackendVerification();
      }
    }, 1000);
  };

  const startBackendVerification = async () => {
    setSelectorStep('LOADING');
    setIsSubmitting(true);
    setLoadingStep('Contacting Google Auth Services...');

    // ── Real Supabase OAuth ──────────────────────────────────────────────────
    if (isSupabaseConfigured && supabase) {
      setLoadingStep('Redirecting to Google Sign-In...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // Pre-fill the selected account's email hint in the Google picker
            login_hint: selectedAccount?.email || '',
          },
        },
      });
      if (error) {
        console.error('[Login] Supabase OAuth error:', error.message);
        setIsSubmitting(false);
        setLoadingStep(`Sign-in failed: ${error.message}`);
        setSelectorStep('SELECT');
      }
      // On success Google redirects to /auth/callback — no further action needed
      return;
    }

    // ── Mock / Fallback flow (Supabase not yet configured) ───────────────────
    // Store selected account email dynamically to localStorage
    if (selectedAccount && typeof window !== 'undefined') {
      localStorage.setItem('zc_user_email', selectedAccount.email);
      localStorage.setItem('google_auth_email', selectedAccount.email);
    }

    // Progressively verify dynamic OAuth lifecycle
    setTimeout(() => {
      setLoadingStep('Verifying data orchestration consent...');
      setTimeout(() => {
        setLoadingStep('Initializing secure tenant workspace...');
        setTimeout(() => {
          setIsSubmitting(false);
          setShowSelector(false);
          router.push('/dashboard');
        }, 800);
      }, 800);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 overflow-hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.1),rgba(255,255,255,0))] font-sans">
      
      {/* Background dot grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md p-8 glass-panel rounded-2xl border border-white/5 bg-neutral-900/60 shadow-2xl relative z-10 space-y-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand branding header */}
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20">
            <Zap className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">Zapier Central</h1>
            <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider block mt-1">Autonomous AI Agent Console</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xs font-semibold text-white/80">Welcome to your Zapier Central</h2>
            <p className="text-[10px] text-white/40">Connect your Google workspace to begin delegating workflows to your AI assistant.</p>
          </div>

          <form onSubmit={handleContinue} className="space-y-5">
            
            {/* Compliance Checklist and Consent Checkbox */}
            <div 
              onClick={() => !isSubmitting && setAcceptedTerms(!acceptedTerms)}
              className="p-4 rounded-xl border border-white/5 bg-black/25 flex items-start gap-3 cursor-pointer hover:bg-black/35 hover:border-white/10 transition-all select-none"
            >
              <div className="shrink-0 mt-0.5 text-orange-400">
                {acceptedTerms ? (
                  <CheckSquare className="w-4.5 h-4.5 text-orange-400 animate-in fade-in zoom-in-75 duration-100" />
                ) : (
                  <Square className="w-4.5 h-4.5 text-white/20" />
                )}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-white leading-none block">Data Orchestration Consent</span>
                <p className="text-[9px] text-white/40 leading-relaxed font-medium">
                  I accept the <span className="text-orange-400 font-bold hover:underline">Terms of Service</span> and authorize Zapier Central to securely access, sync, and orchestrate my data across connected integrations (Gmail, Slack, Notion, and Google Sheets).
                </p>
              </div>
            </div>

            {/* Google OAuth Trigger Button */}
            <button
              type="submit"
              disabled={!acceptedTerms}
              className="w-full py-3 bg-white hover:bg-neutral-200 disabled:bg-white/10 text-black disabled:text-white/25 rounded-xl text-xs font-bold flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed border border-white/10"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform" />
            </button>

          </form>
        </div>

        {/* Security indicators */}
        <div className="flex items-center justify-center gap-1.5 text-[9px] text-white/25 border-t border-white/5 pt-4 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
          <span>SOC-2 Certified • Symmetric OAuth Decryption</span>
        </div>

      </div>

      {/* Dynamic Google "Choose an Account" OAuth Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl border border-white/10 p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200 bg-neutral-950/90 shadow-2xl">
            
            {/* Close trigger */}
            <button 
              onClick={() => !isSubmitting && setShowSelector(false)}
              className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors cursor-pointer"
              disabled={isSubmitting}
            >
              <X className="w-4 h-4" />
            </button>

            {/* STEP 1: SELECT ACCOUNT */}
            {selectorStep === 'SELECT' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header branding */}
                <div className="text-center space-y-2.5">
                  <div className="w-6 h-6 mx-auto flex items-center justify-center">
                    <GoogleIcon />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Choose an account</h3>
                  <p className="text-[10px] text-white/40">to continue to <span className="text-orange-400 font-bold">Zapier Central</span></p>
                </div>

                {/* Accounts List */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {GOOGLE_ACCOUNTS.map((account) => (
                    <div
                      key={account.email}
                      onClick={() => selectAccount(account)}
                      className="p-3.5 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 flex items-center justify-between gap-3 cursor-pointer transition-all select-none group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${account.avatarColor} flex items-center justify-center font-bold text-xs text-white`}>
                          {account.avatar}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white leading-tight group-hover:text-orange-400 transition-colors">{account.name}</h4>
                          <span className="text-[9px] text-white/40 font-mono font-medium block mt-0.5">{account.email}</span>
                        </div>
                      </div>
                      {account.signedIn && (
                        <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-white/10 text-white/60">
                          Signed in
                        </span>
                      )}
                    </div>
                  ))}

                  {/* Use another account */}
                  <div 
                    className="p-3.5 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 flex items-center gap-3 cursor-pointer transition-all select-none group"
                    onClick={() => {
                      setSelectorStep('EMAIL');
                      setEmailError('');
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                      <LogIn className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">Use another account</span>
                  </div>
                </div>

                {/* Standard Disclaimer Footer */}
                <div className="text-[9px] text-white/20 leading-relaxed font-medium pt-2 border-t border-white/5">
                  To continue, Google will share your name, email address, language preference, and profile picture with Zapier Central. Before using this app, you can review its <span className="text-orange-400 hover:underline cursor-pointer">privacy policy</span> and <span className="text-orange-400 hover:underline cursor-pointer">terms of service</span>.
                </div>
              </div>
            )}

            {/* STEP 2: EMAIL INPUT */}
            {selectorStep === 'EMAIL' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Header branding */}
                <div className="text-center space-y-2.5">
                  <div className="w-6 h-6 mx-auto flex items-center justify-center">
                    <GoogleIcon />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Sign in with Google</h3>
                  <p className="text-[10px] text-white/40">to continue to <span className="text-orange-400 font-bold">Zapier Central</span></p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">Email or phone</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={customEmail}
                        onChange={(e) => {
                          setCustomEmail(e.target.value);
                          if (emailError) setEmailError('');
                        }}
                        placeholder="email@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
                        autoFocus
                      />
                      <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-white/20" />
                    </div>
                    {emailError && (
                      <p className="text-[9px] text-rose-500 font-bold tracking-wide animate-in fade-in slide-in-from-left-2 duration-200">
                        ⚠ {emailError}
                      </p>
                    )}
                  </div>

                  <div className="text-left">
                    <span className="text-[10px] text-orange-400 font-bold hover:underline cursor-pointer">Forgot email?</span>
                  </div>

                  <p className="text-[9px] text-white/30 leading-relaxed">
                    Not your computer? Use a private browsing window to sign in. <span className="text-orange-400 font-bold hover:underline cursor-pointer">Learn more</span>
                  </p>

                  {/* Footer navigation buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectorStep('SELECT')}
                      className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-lg shadow-white/5 cursor-pointer"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: PASSWORD INPUT */}
            {selectorStep === 'PASSWORD' && selectedAccount && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Header branding */}
                <div className="text-center space-y-2.5">
                  <div className="w-6 h-6 mx-auto flex items-center justify-center">
                    <GoogleIcon />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Welcome</h3>
                  
                  {/* Selected Account Pill Card */}
                  <div className="inline-flex items-center gap-2 p-1.5 pr-3.5 rounded-full bg-white/[0.03] border border-white/5">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-tr ${selectedAccount.avatarColor} flex items-center justify-center font-bold text-[9px] text-white`}>
                      {selectedAccount.avatar}
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] text-white font-bold leading-none block">{selectedAccount.name}</span>
                      <span className="text-[8px] text-white/40 font-mono font-medium block mt-0.5 truncate max-w-[130px]">{selectedAccount.email}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectorStep('SELECT')}
                      className="text-white/40 hover:text-white ml-1 transition-colors cursor-pointer"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">Enter your password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError('');
                        }}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-white/20 hover:text-white transition-colors cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-[9px] text-rose-500 font-bold tracking-wide animate-in fade-in slide-in-from-left-2 duration-200">
                        ⚠ {passwordError}
                      </p>
                    )}
                  </div>

                  <div className="text-left flex items-center justify-between">
                    <span className="text-[10px] text-orange-400 font-bold hover:underline cursor-pointer">Forgot password?</span>
                  </div>

                  {/* Footer navigation buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        // Go to SELECT if this is one of our presets, otherwise go to EMAIL
                        if (GOOGLE_ACCOUNTS.some(acc => acc.email === selectedAccount.email)) {
                          setSelectorStep('SELECT');
                        } else {
                          setSelectorStep('EMAIL');
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-lg shadow-white/5 cursor-pointer"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 4: 2-STEP VERIFICATION (MFA) */}
            {selectorStep === 'MFA' && selectedAccount && (
              <div className="space-y-6 text-center animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Header branding */}
                <div className="space-y-2.5">
                  <div className="w-6 h-6 mx-auto flex items-center justify-center">
                    <GoogleIcon />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide">2-Step Verification</h3>
                  <p className="text-[10px] text-white/40">Confirm it's you on your smartphone</p>
                </div>

                {/* Pulsing smart device interactive grid */}
                <div className="p-6 rounded-2xl bg-black/45 border border-white/5 relative overflow-hidden flex flex-col items-center justify-center gap-4">
                  {/* Outer glowing ripple ring */}
                  <div className="absolute w-28 h-28 rounded-full border border-orange-500/20 bg-orange-500/5 animate-ping opacity-60 pointer-events-none" />
                  
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400 shadow-inner relative z-10">
                    <Smartphone className="w-6 h-6 animate-pulse" />
                  </div>

                  <div className="space-y-1 relative z-10">
                    <h4 className="text-xs font-bold text-white">Google Smart Lock Notification</h4>
                    <p className="text-[9px] text-white/40 max-w-[210px] leading-relaxed mx-auto">
                      Google sent a request. Tap <span className="text-white font-bold">Yes</span> on your phone, then verify using this matching badge number:
                    </p>
                  </div>

                  {/* Pulsing badge number */}
                  <div className="px-6 py-3 bg-orange-600/20 border border-orange-500/40 rounded-2xl shadow-xl shadow-orange-950/30 text-center relative z-10 scale-105">
                    <span className="text-2xl font-black text-orange-300 font-mono tracking-widest animate-pulse">73</span>
                  </div>

                  <div className="text-[8px] text-orange-400 font-mono mt-1">
                    Auto-verifying in {mfaTimer}s...
                  </div>
                </div>

                {/* Instant approval click target for fast UX */}
                <div className="space-y-3">
                  <button
                    onClick={startBackendVerification}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/5 hover:border-white/10 text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-orange-400" />
                    <span>Approve Sign In (Simulated)</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setSelectorStep('PASSWORD')}
                    className="text-[10px] text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel sign-in request
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: TOKEN COMPILE LOADER */}
            {selectorStep === 'LOADING' && (
              <div className="p-10 text-center space-y-4 flex flex-col items-center justify-center bg-black/25 rounded-xl border border-white/5 animate-in fade-in zoom-in-95 duration-200">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
                <div>
                  <h4 className="text-[10px] font-bold text-white tracking-wider uppercase">{loadingStep}</h4>
                  {selectedAccount && (
                    <p className="text-[8px] text-orange-400 font-mono mt-1 truncate max-w-[200px]">{selectedAccount.email}</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

// Google SVG G logo Icon React Component
function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 5.04c1.78 0 3.39.61 4.65 1.81l3.47-3.47C18.01 1.42 15.24.5 12 .5 7.3.5 3.3 3.19 1.22 7.12l4.08 3.16C6.27 7.07 8.91 5.04 12 5.04z"
      />
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.4-4.92 3.4-8.6z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 13.88c-.26-.78-.41-1.61-.41-2.48s.15-1.7.41-2.48L1.22 5.76C.44 7.32 0 9.07 0 10.9s.44 3.58 1.22 5.14l4.08-3.16z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-3.96 1.1-3.09 0-5.73-2.03-6.66-4.92L1.54 17c2.08 3.93 6.13 6.5 10.46 6.5z"
      />
    </svg>
  );
}
