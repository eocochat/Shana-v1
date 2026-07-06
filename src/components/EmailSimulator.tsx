import React, { useState, useEffect } from 'react';
import { Mail, Check, Shield, AlertTriangle, KeyRound, ExternalLink, RefreshCw, Send, ArrowLeft, Trash2, Clock } from 'lucide-react';

export interface SimulatedEmail {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  timestamp: string;
  actionType: 'signup' | 'login' | 'reset-password' | 'test' | 'cv-analyzed' | 'training-completed' | 'assessment-completed' | 'payment-success' | 'scheduled-session';
  isUnread: boolean;
  etherealUrl?: string | null;
  realStatus?: string;
}

interface EmailStatus {
  hasResend: boolean;
  hasSmtp: boolean;
  smtpFrom: string;
  activeProvider: string;
  resendFromAddress: string | null;
}

interface EmailSimulatorProps {
  onNotify?: (message: string) => void;
  userEmail?: string;
  userName?: string;
  inline?: boolean;
}

export default function EmailSimulator({ onNotify, userEmail = 'marie.dubois@corporation.com', userName = 'Marie', inline = false }: EmailSimulatorProps) {
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [dispatching, setDispatching] = useState(false);

  // Form states for test dispatch
  const [testRecipient, setTestRecipient] = useState(userEmail);
  const [testTemplate, setTestTemplate] = useState<'signup' | 'login' | 'reset-password' | 'test'>('signup');
  const [testFirstName, setTestFirstName] = useState(userName);

  // Load emails and fetch system configuration
  const loadSystemData = async () => {
    setLoadingStatus(true);
    try {
      // 1. Fetch real backend configuration state
      const res = await fetch('/api/email/status');
      if (res.ok) {
        const configData = await res.json();
        setStatus(configData);
      }
    } catch (e) {
      console.error('[Email Manager] Status fetch failed:', e);
    } finally {
      setLoadingStatus(false);
    }

    // 2. Load actual logs from localStorage
    try {
      const saved = localStorage.getItem('shana_simulated_emails');
      if (saved) {
        setEmails(JSON.parse(saved));
      } else {
        setEmails([]);
      }
    } catch (e) {
      console.error('[Email Manager] Load logs failed:', e);
    }
  };

  useEffect(() => {
    loadSystemData();

    // Listen for storage changes (e.g. signup triggered real emails)
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('shana_simulated_emails');
        if (saved) {
          setEmails(JSON.parse(saved));
        }
      } catch (e) {
        // Safe fallback
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const saveEmails = (updatedList: SimulatedEmail[]) => {
    setEmails(updatedList);
    localStorage.setItem('shana_simulated_emails', JSON.stringify(updatedList));
  };

  const triggerRealEmail = async () => {
    if (!testRecipient || !testRecipient.includes('@')) {
      if (onNotify) onNotify('❌ Please enter a valid email address.');
      return;
    }

    setDispatching(true);
    if (onNotify) {
      onNotify(`✉️ Querying server SMTP dispatch node for ${testRecipient}...`);
    }

    try {
      const response = await fetch('/api/email/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: testTemplate,
          recipient: testRecipient.trim(),
          extraData: {
            firstName: testFirstName || 'Valued Partner',
            lastName: 'Test',
            score: 94,
            strengths: ['Analytical communication', 'System reliability management'],
            amount: '29.00',
            date: new Date(Date.now() + 48*60*60*1000).toLocaleDateString('fr-FR'),
            time: '14:00 CET',
            mentor: 'Shana Technical Recruiter'
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        const newEmail: SimulatedEmail = {
          id: `mail_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          sender: result.provider ? `SHANA Server (${result.provider})` : 'security@shana-platform.com',
          recipient: testRecipient.trim(),
          subject: result.subject || `${testTemplate.toUpperCase()} - SHANA System`,
          bodyHtml: result.html || `<p>${testTemplate} dispatched successfully</p>`,
          bodyText: result.text || `${testTemplate} dispatched successfully`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Real SMTP Dispatch)',
          actionType: testTemplate,
          isUnread: false,
          etherealUrl: result.etherealUrl,
          realStatus: `Delivered: ${result.provider} (ID: ${result.messageId || 'n/a'})`
        };

        const updated = [newEmail, ...emails];
        saveEmails(updated);
        setSelectedId(newEmail.id);

        if (onNotify) {
          onNotify(`📬 Real SMTP Dispatch triggered successfully! Provider: ${result.provider}`);
        }
      } else {
        throw new Error(result.error || 'Server mailer failed');
      }
    } catch (err: any) {
      console.error('[Email Manager] Real SMTP dispatch error:', err);
      if (onNotify) {
        onNotify(`❌ Dispatch failed: ${err.message || 'Check server connection & credentials'}`);
      }
    } finally {
      setDispatching(false);
    }
  };

  const deleteEmail = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = emails.filter(em => em.id !== id);
    if (selectedId === id) {
      setSelectedId(null);
    }
    saveEmails(updated);
  };

  const clearAll = () => {
    saveEmails([]);
    setSelectedId(null);
  };

  const selectedEmail = emails.find(em => em.id === selectedId);

  return (
    <div id="email-service-manager" className="w-full bg-stone-900 border border-stone-800 rounded-[28px] shadow-sm overflow-hidden text-stone-300 flex flex-col min-h-[600px] text-left">
      {/* 1. Header Banner */}
      <div className="px-6 py-5 bg-stone-950 border-b border-stone-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FECE4F] flex items-center justify-center">
            <Mail className="w-4 h-4 text-stone-950 stroke-[3]" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase text-white tracking-widest leading-none">SHANA SECURE EMAIL CONSOLE</h4>
            <span className="text-[9px] font-mono text-stone-500 tracking-wider">LIVE TRANSACTIONAL OUTBOX MONITOR</span>
          </div>
        </div>
        <button 
          onClick={loadSystemData}
          className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-all"
          title="Refresh connection state"
        >
          <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2. Live Provider Status Card */}
      <div className="p-6 bg-stone-950/40 border-b border-stone-800/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-widest">Active Dispatch Controller Status</span>
          <span className="text-[9px] text-stone-500 font-mono">Environment check: Live</span>
        </div>

        {loadingStatus ? (
          <div className="bg-stone-900/60 rounded-xl border border-stone-800/80 p-4 animate-pulse flex items-center justify-between">
            <div className="h-4 bg-stone-800 rounded w-1/3" />
            <div className="h-6 bg-stone-800 rounded w-20" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              status?.hasResend 
                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' 
                : 'bg-stone-900 border-stone-800 text-stone-400'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-black tracking-widest">Resend Service</span>
                {status?.hasResend ? (
                  <span className="bg-[#10B981]/20 px-2 py-0.5 rounded text-[8px] font-bold uppercase">Connected</span>
                ) : (
                  <span className="bg-stone-800 text-stone-500 px-2 py-0.5 rounded text-[8px] font-bold uppercase">Disabled</span>
                )}
              </div>
              <div className="mt-3">
                <h5 className="text-white text-xs font-bold">Resend REST API Engine</h5>
                <p className="text-[10px] text-stone-400 mt-1">
                  {status?.hasResend 
                    ? `Configured to route emails instantly using production Resend API. Sender alias: ${status.resendFromAddress}`
                    : 'Add RESEND_API_KEY to your .env configuration to unlock enterprise grade delivery.'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase text-stone-500 font-black tracking-widest">Active Connection Details</span>
                <div className="mt-3 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Service Route:</span>
                    <span className="text-stone-300 font-bold">{status?.activeProvider || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">From Sender:</span>
                    <span className="text-[#FECE4F] font-bold truncate max-w-[200px]">{status?.smtpFrom || 'n/a'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Real SMTP Test Dispatch Terminal */}
      <div className="p-6 border-b border-stone-800/40 bg-stone-900">
        <h4 className="text-xs font-mono text-stone-400 font-bold uppercase tracking-widest mb-4">Instant Production Test Trigger</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">Candidate Name</label>
            <input 
              type="text" 
              value={testFirstName} 
              onChange={e => setTestFirstName(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#FECE4F] font-mono"
              placeholder="e.g. Marie"
            />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">Target Email</label>
            <input 
              type="email" 
              value={testRecipient} 
              onChange={e => setTestRecipient(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#FECE4F] font-mono"
              placeholder="recipient@example.com"
            />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">Template Scenario</label>
            <select 
              value={testTemplate} 
              onChange={e => setTestTemplate(e.target.value as any)}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#FECE4F] font-mono"
            >
              <option value="signup">Sign Up (Welcome welcome)</option>
              <option value="login">Login Security Alert</option>
              <option value="reset-password">Password Reset Restructure</option>
              <option value="test">Generic Health Check ping</option>
            </select>
          </div>
          <button
            onClick={triggerRealEmail}
            disabled={dispatching}
            className="w-full py-1.5 px-4 bg-[#FECE4F] hover:bg-[#ebd239] text-stone-950 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer h-[34px]"
          >
            {dispatching ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {dispatching ? 'Sending...' : 'Dispatch Email'}
          </button>
        </div>
      </div>

      {/* 4. Live Outbound logs */}
      <div className="flex-1 flex flex-col md:flex-row h-[400px]">
        {/* Left Side: Outbound Logs List */}
        <div className="w-full md:w-1/2 border-r border-stone-800/50 flex flex-col overflow-hidden">
          <div className="px-5 py-3 bg-stone-950/80 border-b border-stone-800/60 flex justify-between items-center shrink-0">
            <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-widest">Outbox Transmission Records</span>
            {emails.length > 0 && (
              <button onClick={clearAll} className="text-[9px] text-red-400 hover:text-red-300 font-mono font-bold uppercase flex items-center gap-1 transition-all">
                <Trash2 className="w-3 h-3" /> Clear History
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scroller p-3 space-y-2 bg-stone-950/10">
            {emails.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-10 h-10 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-stone-500" />
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-bold">No Outbound Emails Logged Yet</p>
                  <p className="text-[10px] text-stone-500 mt-1 max-w-xs mx-auto">
                    All outbound transactional email logs sent through the application will appear here in real-time. Try signing up with a new account or trigger a test email above!
                  </p>
                </div>
              </div>
            ) : (
              emails.map((em) => (
                <div 
                  key={em.id}
                  onClick={() => setSelectedId(em.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    selectedId === em.id 
                      ? 'bg-stone-800 border-[#FECE4F] text-white shadow-xs' 
                      : 'bg-stone-900/40 border-stone-800 hover:bg-stone-800/50 hover:border-stone-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="font-mono text-[9px] bg-stone-800 px-2 py-0.5 rounded text-stone-400 font-semibold uppercase tracking-wider truncate">
                      {em.actionType}
                    </span>
                    <span className="text-[9px] text-stone-500 font-mono shrink-0">{em.timestamp}</span>
                  </div>
                  <h5 className="text-xs font-bold truncate text-white">{em.subject}</h5>
                  <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-stone-800/80">
                    <span className="text-[10px] text-stone-400 font-mono truncate">To: {em.recipient}</span>
                    <button 
                      onClick={(e) => deleteEmail(em.id, e)}
                      className="p-1 text-stone-600 hover:text-red-400 rounded-md transition-all"
                      title="Delete log entry"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Active Log Viewer / HTML Payload Render */}
        <div className="flex-1 bg-stone-950 flex flex-col overflow-hidden h-full">
          {selectedEmail ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-stone-800 bg-stone-950 text-stone-300 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono uppercase text-amber-400 tracking-widest font-black">Outbox Payload Inspection</span>
                  {selectedEmail.etherealUrl && (
                    <a 
                      href={selectedEmail.etherealUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-[#FECE4F] bg-stone-900 border border-stone-800 hover:border-amber-400 py-1 px-2.5 rounded-lg transition-all"
                    >
                      <ExternalLink className="w-3 h-3" /> View Sandbox Receipt
                    </a>
                  )}
                </div>
                <h3 className="text-xs font-black text-white leading-tight mb-2 truncate">
                  {selectedEmail.subject}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div>
                    <span className="text-stone-500">Recipient:</span>
                    <span className="text-stone-300 ml-1.5 truncate block">{selectedEmail.recipient}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Delivery Node:</span>
                    <span className="text-stone-300 ml-1.5 truncate block">{selectedEmail.sender}</span>
                  </div>
                </div>
                {selectedEmail.realStatus && (
                  <div className="mt-2 text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-2 py-1 rounded">
                    ✓ Status: {selectedEmail.realStatus}
                  </div>
                )}
              </div>

              {/* HTML Payload Sandbox Render */}
              <div className="flex-1 overflow-hidden bg-stone-900 p-4">
                <div className="w-full h-full rounded-xl overflow-auto border border-stone-800 bg-white p-3">
                  <div 
                    dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }} 
                    className="origin-top max-w-full text-stone-900 font-sans"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-stone-500">
              <Mail className="w-8 h-8 mb-2.5 text-stone-700" />
              <p className="text-xs font-bold text-stone-400">Payload Inspector</p>
              <p className="text-[10px] max-w-xs mt-1">
                Select an outbound log item from the records on the left to inspect its real delivery headers and rendered HTML message block.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
