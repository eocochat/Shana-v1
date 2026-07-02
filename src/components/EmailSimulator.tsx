import React, { useState, useEffect } from 'react';
import { Mail, Check, Shield, AlertTriangle, KeyRound, ExternalLink, RefreshCw, Send, ArrowLeft, Trash2, Bell, Clock, Compass } from 'lucide-react';

export interface SimulatedEmail {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  timestamp: string;
  actionType: 'signup' | 'login' | 'reset-password' | 'test';
  isUnread: boolean;
  etherealUrl?: string | null;
  realStatus?: string;
}

interface EmailSimulatorProps {
  onNotify?: (message: string) => void;
  userEmail?: string;
  userName?: string;
}

export default function EmailSimulator({ onNotify, userEmail = 'marie.dubois@corporation.com', userName = 'Marie' }: EmailSimulatorProps) {
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState(userEmail);
  const [testNameInput, setTestNameInput] = useState(userName);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync inputs with parent props
  useEffect(() => {
    if (userEmail) setTestEmailInput(userEmail);
    if (userName) setTestNameInput(userName);
  }, [userEmail, userName]);

  // Load from LocalStorage or populate with high-fidelity defaults
  useEffect(() => {
    try {
      const saved = localStorage.getItem('shana_simulated_emails');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setEmails(parsed);
          const unreads = parsed.filter((e: SimulatedEmail) => e.isUnread).length;
          setUnreadCount(unreads);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not parse saved simulated emails:", e);
    }

    // Default high-fidelity emails so the user can see them immediately!
    const defaultEmails = generateDefaultEmails(userName, userEmail);
    setEmails(defaultEmails);
    localStorage.setItem('shana_simulated_emails', JSON.stringify(defaultEmails));
    setUnreadCount(defaultEmails.filter(e => e.isUnread).length);
  }, []);

  // Helper listener for simulation trigger events
  useEffect(() => {
    const handleTriggerEmail = (e: CustomEvent) => {
      const { type, recipient, extraData } = e.detail;
      triggerEmail(type, recipient, extraData);
    };

    window.addEventListener('shana-trigger-email', handleTriggerEmail as EventListener);
    return () => {
      window.removeEventListener('shana-trigger-email', handleTriggerEmail as EventListener);
    };
  }, [emails, testNameInput]);

  const saveEmails = (updatedList: SimulatedEmail[]) => {
    setEmails(updatedList);
    localStorage.setItem('shana_simulated_emails', JSON.stringify(updatedList));
    setUnreadCount(updatedList.filter(e => e.isUnread).length);
  };

  const triggerEmail = async (
    type: 'signup' | 'login' | 'reset-password',
    recipient: string = testEmailInput,
    extraData: any = {}
  ) => {
    const name = extraData.firstName || testNameInput || 'User';
    const emailToUse = recipient || 'marie.dubois@corporation.com';

    if (onNotify) {
      onNotify(`✉️ Contacting SMTP dispatch core for ${emailToUse}...`);
    }

    try {
      const response = await fetch('/api/email/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          recipient: emailToUse.trim(),
          extraData: { firstName: name }
        }),
      });

      const result = await response.json();

      if (result.success) {
        const newEmail: SimulatedEmail = {
          id: `mail_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          sender: result.provider ? `SHANA Server (${result.provider})` : 'security@shana-platform.com',
          recipient: emailToUse,
          subject: result.subject || getSubjectForType(type, name, emailToUse),
          bodyHtml: getHtmlForType(type, name, emailToUse),
          bodyText: getTextForType(type, name, emailToUse),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Real SMTP Dispatch)',
          actionType: type,
          isUnread: true,
          etherealUrl: result.etherealUrl,
          realStatus: `Verified: ${result.provider} (ID: ${result.messageId})`
        };

        const updated = [newEmail, ...emails];
        saveEmails(updated);
        setSelectedId(newEmail.id);
        setIsOpen(true);

        if (onNotify) {
          onNotify(`📬 Real email sent successfully! ${result.etherealUrl ? 'View online mail receipt in sandbox logs.' : 'Arrived at your custom inbox!'}`);
        }
      } else {
        throw new Error(result.error || 'Server mailer failed');
      }
    } catch (err: any) {
      console.warn("Outbound dispatcher error, fallback simulation:", err);
      // Fallback graceful simulation if server setup is not complete or in network boundary
      const newEmail: SimulatedEmail = {
        id: `mail_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        sender: 'security@shana-platform.com (Simulated)',
        recipient: emailToUse,
        subject: getSubjectForType(type, name, emailToUse),
        bodyHtml: getHtmlForType(type, name, emailToUse),
        bodyText: getTextForType(type, name, emailToUse),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Simulated)',
        actionType: type,
        isUnread: true,
        realStatus: "Simulated courier delivery fallback."
      };

      const updated = [newEmail, ...emails];
      saveEmails(updated);
      setSelectedId(newEmail.id);
      setIsOpen(true);

      if (onNotify) {
        onNotify(`📬 Simulated email registered to sandbox!`);
      }
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

  const markAllRead = () => {
    const updated = emails.map(em => ({ ...em, isUnread: false }));
    saveEmails(updated);
  };

  const handleSelectEmail = (id: string) => {
    setSelectedId(id);
    const updated = emails.map(em => em.id === id ? { ...em, isUnread: false } : em);
    saveEmails(updated);
  };

  const selectedEmail = emails.find(em => em.id === selectedId);

  return (
    <div id="email-simulator-wrapper" className="fixed bottom-4 right-4 z-50 font-sans">
      
      {/* TRIGGER BADGE */}
      <button
        id="btn-toggle-email-simulator"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-[#1C1917] text-[#FAF7F2] hover:bg-stone-800 rounded-full shadow-lg transition-all border border-stone-700/50 cursor-pointer group"
      >
        <div className="relative">
          <Mail className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-all" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="text-left leading-tight hidden lg:block">
          <p className="text-[10px] uppercase tracking-widest font-extrabold text-stone-400">SMTP Simulation Channel</p>
          <p className="text-xs font-bold text-stone-100">Click to View Action Emails</p>
        </div>
      </button>

      {/* EMAIL CLIENT CONTAINER */}
      {isOpen && (
        <div 
          id="email-simulator-panel"
          className="absolute bottom-16 right-0 w-[360px] sm:w-[480px] bg-stone-900 border border-stone-800 rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden text-stone-300 animate-fade-in flex flex-col h-[520px]"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-stone-950 border-b border-stone-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-400 flex items-center justify-center">
                <Mail className="w-3.5 h-3.5 text-stone-950 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-widest leading-none">SHANA SECURE MAILBOX</h4>
                <span className="text-[9px] font-mono text-amber-400 tracking-wider">REAL-TIME SMTP DISPATCH BOARD</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-white text-xs font-bold uppercase py-1 px-2.5 bg-stone-900 rounded-full border border-stone-800 transition-all"
            >
              Close
            </button>
          </div>

          {/* Quick Controller / Dispatcher Center */}
          <div className="bg-stone-950/40 p-4 border-b border-stone-800/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-widest">REAL OUTBOUND SMTP COURIER CONTROL</span>
              {emails.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={markAllRead} className="text-[9px] text-stone-400 hover:text-amber-400 font-bold uppercase transition-all">
                    Mark All Read
                  </button>
                  <span className="text-stone-700">|</span>
                  <button onClick={clearAll} className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase transition-all flex items-center gap-1">
                    <Trash2 className="w-2.5 h-2.5" /> Clear Logs
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5 mt-1">
              <button
                onClick={() => triggerEmail('signup')}
                className="py-1.5 px-1 bg-stone-800 hover:bg-stone-750 hover:text-white rounded-lg text-[9px] font-bold text-center border border-stone-700/60 uppercase transition-all"
              >
                📥 Trigger Sign Up
              </button>
              <button
                onClick={() => triggerEmail('login')}
                className="py-1.5 px-1 bg-stone-800 hover:bg-stone-750 hover:text-white rounded-lg text-[9px] font-bold text-center border border-stone-700/60 uppercase transition-all"
              >
                🔐 Trigger Login
              </button>
              <button
                onClick={() => triggerEmail('reset-password')}
                className="py-1.5 px-1 bg-stone-800 hover:bg-stone-750 hover:text-white rounded-lg text-[9px] font-bold text-center border border-stone-700/60 uppercase transition-all"
              >
                🔑 Trigger Reset
              </button>
            </div>
          </div>

          {/* MAIN CONTAINER: INBOX OR VIEWER */}
          <div className="flex-1 overflow-y-auto scroller bg-stone-900/90 text-stone-100 flex flex-col">
            
            {selectedEmail ? (
              /* VIEW INDIVIDUAL EMAIL */
              <div className="flex-grow flex flex-col h-full bg-stone-950">
                {/* Header info */}
                <div className="p-4 border-b border-stone-800/80 bg-stone-950 text-stone-300">
                  <button 
                    onClick={() => setSelectedId(null)}
                    className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Inbox
                  </button>
                  <h3 className="text-sm font-bold text-white text-left leading-tight mb-2.5">
                    {selectedEmail.subject}
                  </h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-mono">From:</span>
                      <span className="text-amber-200 font-mono text-[11px]">{selectedEmail.sender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-mono">To:</span>
                      <span className="text-stone-300 font-mono text-[11px]">{selectedEmail.recipient}</span>
                    </div>
                    <div className="flex justify-between border-t border-stone-900 pt-1 mt-1">
                      <span className="text-stone-500 font-mono">Dispatched:</span>
                      <span className="text-stone-400 text-[10px]">{selectedEmail.timestamp}</span>
                    </div>
                    {selectedEmail.realStatus && (
                      <div className="flex flex-col gap-1 border-t border-stone-900 pt-2 mt-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-stone-500 font-mono">SMTP Status:</span>
                          <span className="text-green-400 font-mono bg-green-950/40 px-2 py-0.5 rounded border border-green-900/60 font-bold">{selectedEmail.realStatus}</span>
                        </div>
                        {selectedEmail.etherealUrl && (
                          <a 
                            href={selectedEmail.etherealUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="mt-2 text-center text-[10px] bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all w-full cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open Real Mail in Sandbox Receipt ({selectedEmail.recipient})
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* HTML Render body */}
                <div className="p-4 overflow-y-auto scroller flex-1 bg-white text-stone-900">
                  <div 
                    className="email-rendered-envelope font-sans select-text select-all"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                  />
                </div>
              </div>
            ) : (
              /* EMAIL LIST INBOX */
              <div className="p-4 flex-1 flex flex-col justify-between">
                {emails.length === 0 ? (
                  <div className="text-center py-16 px-4 flex flex-col items-center justify-center my-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700/80">
                      <Mail className="w-5 h-5 text-stone-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-100">Mailbox Simulator Empty</p>
                      <p className="text-[10px] text-stone-500 mt-1 max-w-[280px]">
                        Trigger simulated events using the controls above to render live, interactive emails formatted with pristine layouts.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-850">
                      <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Active SMTP Outbound Delivery Logs ({emails.length})
                      </span>
                    </div>

                    <div className="space-y-2.5 mt-2">
                      {emails.map((e) => (
                        <div
                          key={e.id}
                          onClick={() => handleSelectEmail(e.id)}
                          className={`group relative p-3.5 rounded-2xl cursor-pointer border transition-all text-left ${
                            e.isUnread 
                              ? 'bg-stone-850/90 border-amber-500/30 hover:border-amber-400/55' 
                              : 'bg-stone-900/40 border-stone-800 hover:bg-stone-850/40'
                          }`}
                        >
                          {e.isUnread && (
                            <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          )}
                          
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                              e.actionType === 'signup' 
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900' 
                                : e.actionType === 'login'
                                ? 'bg-blue-950/45 text-blue-400 border-blue-900'
                                : 'bg-amber-950/45 text-amber-400 border-amber-900'
                            }`}>
                              {e.actionType}
                            </span>
                            <span className="text-[10px] font-mono text-stone-500">{e.timestamp}</span>
                          </div>

                          <span className="block text-xs font-black text-white group-hover:text-amber-300 transition-all leading-tight">
                            {e.subject}
                          </span>

                          <p className="text-[10.5px] italic text-stone-400 truncate mt-1 leading-snug">
                            {e.bodyText}
                          </p>

                          <div className="mt-2.5 pt-2 border-t border-stone-850/60 flex items-center justify-between text-[9px] font-mono text-stone-500">
                            <span>To: {e.recipient}</span>
                            <button
                              onClick={(evt) => deleteEmail(e.id, evt)}
                              className="text-stone-600 hover:text-red-400 p-0.5 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Diagnostics inputs footer */}
                <div className="pt-4 border-t border-stone-850/80 bg-stone-950/20 p-2.5 rounded-xl mt-4 space-y-2">
                  <span className="text-[8px] font-mono text-stone-500 uppercase tracking-widest font-bold">Simulator Address Configuration</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input 
                        type="text" 
                        value={testNameInput} 
                        onChange={(e) => setTestNameInput(e.target.value)}
                        placeholder="Recipient Name"
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1 px-2 text-[10px] text-white focus:border-amber-400 outline-none"
                      />
                    </div>
                    <div>
                      <input 
                        type="email" 
                        value={testEmailInput} 
                        onChange={(e) => setTestEmailInput(e.target.value)}
                        placeholder="Recipient Email"
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1 px-2 text-[10px] text-white focus:border-amber-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* HIGH FIDELITY EMAIL GENERATION SUB ENGINE */

function getSubjectForType(type: 'signup' | 'login' | 'reset-password' | 'test', firstName: string, email: string): string {
  switch (type) {
    case 'signup':
      return `Welcome to SHANA, ${firstName}! 🚀 Your Interview Readiness Journey Begins Now`;
    case 'login':
      return `SHANA Security: New login verified for ${email}`;
    case 'reset-password':
      return `🔑 Shana Cryptographic Key Reset Link: Account Password Restructure`;
    default:
      return 'SHANA Notification Core Alert';
  }
}

function getTextForType(type: 'signup' | 'login' | 'reset-password' | 'test', firstName: string, email: string): string {
  switch (type) {
    case 'signup':
      return `Welcome, ${firstName}! Your account associated with ${email} is active. Perform onboarding profile synchronization to initiate.`;
    case 'login':
      return `Security alert for ${email}. Access was authorized from Chrome 124.0. If you did not trigger this session, reset your keys.`;
    case 'reset-password':
      return `Password reset issued for ${email}. Apply code SHANA_KEY_992 to confirm credentials restructuring. link active for 15m.`;
    default:
      return 'Operational metrics notification dispatched.';
  }
}

function getHtmlForType(type: 'signup' | 'login' | 'reset-password' | 'test', firstName: string, email: string): string {
  const accentGold = '#FFF9EB';
  const borderYellow = '#FECE4F';
  const darkStone = '#1C1917';

  if (type === 'signup') {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; padding: 24px; border-radius: 16px; color: #1C1917; max-width: 600px; margin: 0 auto; border: 1px solid #EAE6DF;">
        <!-- Header Banner -->
        <div style="background-color: ${darkStone}; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 40px; height: 40px; background-color: #FAF7F2; color: ${darkStone}; border-radius: 8px; font-weight: 900; font-size: 20px; line-height: 40px; text-align: center; margin-bottom: 8px;">S</div>
          <h1 style="color: #FAF7F2; font-size: 20px; font-weight: 900; margin: 0; letter-spacing: 2px; text-transform: uppercase;">SHANA CONSOLE</h1>
          <p style="color: #A8A29E; font-size: 11px; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 1px;">SYSTEM VERIFICATION CORE ONBOARDING</p>
        </div>

        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #ECEAE5; box-shadow: 0 4px 12px rgba(0,0,0,0.01);">
          <h2 style="font-size: 18px; font-weight: 850; color: #111111; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #F3F1ED; padding-bottom: 12px;">
            Bonjour ${firstName}, welcome to Shana Console!
          </h2>
          <p style="font-size: 13px; line-height: 1.6; color: #444444; margin-bottom: 18px;">
            Your professional secure profile associated with <strong>${email}</strong> has been successfully instantiated. Our career capability assessment simulation runs on actual professional parameters.
          </p>

          <div style="background-color: #FECE4F; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #E0B438;">
            <p style="margin: 0; font-weight: 900; font-size: 13px; color: #1C1917; letter-spacing: -0.2px;">
              ⚡ IMMEDIATE STEP MANDATED:
            </p>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #2B281B; line-height: 1.4;">
              Access your Shana console dashboard, personalize your target industry metrics, and complete the CV master profile evaluation.
            </p>
          </div>

          <div style="background: linear-gradient(135deg, #FFF9EB 0%, #FFF5D6 100%); padding: 16px; border-radius: 12px; border: 1px solid #FFE8A3; margin-bottom: 24px;">
            <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #6D4C0E; text-transform: uppercase; font-family: monospace;">Your Active Milestones:</h4>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #604515; line-height: 1.6;">
              <li>Perform career profile alignment</li>
              <li>Upload master resume / resume points mapping</li>
              <li>Simulate situational voice and conversational training</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 28px 0 10px 0;">
            <a href="#" style="background-color: ${darkStone}; color: #FAF7F2; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              Launch Active Onboarding Screen &rarr;
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-family: monospace; font-size: 10px; color: #A8A29E;">
          <p style="margin: 0;">SECURE ENVELOPE SHA-256 SIGNED BY SHANA AUTH ENGINE</p>
          <p style="margin: 4px 0 0 0;">Do not reply to this systemic notice email.</p>
        </div>
      </div>
    `;
  }

  if (type === 'login') {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; padding: 24px; border-radius: 16px; color: #1C1917; max-width: 600px; margin: 0 auto; border: 1px solid #EAE6DF;">
        <!-- Security Header -->
        <div style="background-color: #111111; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #EF4444; font-size: 18px; font-weight: 900; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">SECURITY ALERT</h1>
          <p style="color: #A8A29E; font-size: 10px; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 0.5px;">NEW AUTHENTICATION EVENT DETECTED</p>
        </div>

        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #ECEAE5;">
          <h2 style="font-size: 15px; font-weight: 800; color: #111111; margin-top: 0; margin-bottom: 12px;">
            Secure Login Verified
          </h2>
          <p style="font-size: 12.5px; line-height: 1.5; color: #444444; margin-bottom: 20px;">
            An authorized user session was successfully instantiated for the account <strong>${email}</strong>.
          </p>

          <!-- Device specifications -->
          <div style="background-color: #F8F6F2; border-radius: 10px; padding: 14px; border: 1px solid #EAE6DF; margin-bottom: 24px; font-family: monospace; font-size: 11px; line-height: 1.6; color: #555555;">
            <p style="margin: 0; font-weight: bold; color: #1C1917; font-size: 11.5px; font-family: sans-serif; margin-bottom: 6px;">TELEMETRY PARAMETERS:</p>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">Device:</strong> <span>Chrome 125.4 (MacBook Pro)</span></div>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">IP Address:</strong> <span>82.112.45.221 (Secure TLS Tunnel)</span></div>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">Location:</strong> <span>Paris, Île-de-France, France (EST)</span></div>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">Access Date:</strong> <span>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span></div>
          </div>

          <div style="border-left: 3px solid #FECE4F; background-color: #FFFDF5; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 11.5px; color: #7A5310; font-weight: 600; line-height: 1.4;">
              <strong>Not recognize this session?</strong> If you did not log in from this location, click below to lock down your master tokens instantly and format a new password reset.
            </p>
          </div>

          <div style="text-align: center; margin: 24px 0 10px 0;">
            <a href="#" style="background-color: #EF4444; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; display: inline-block;">
              De-Authorize & Terminate Token Session &rarr;
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-family: monospace; font-size: 9px; color: #A8A29E;">
          <p style="margin: 0;">SECURED HTTPS PROTOCOL LAYER // SHANA-SECUR-GUARD</p>
        </div>
      </div>
    `;
  }

  if (type === 'reset-password') {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; padding: 24px; border-radius: 16px; color: #1C1917; max-width: 600px; margin: 0 auto; border: 1px solid #EAE6DF;">
        <!-- Reset Header -->
        <div style="background-color: ${darkStone}; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 36px; height: 36px; background-color: #FECE4F; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #1C1917;">🔑</div>
          <h1 style="color: #FAF7F2; font-size: 18px; font-weight: 900; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">PASSWORD RESTRUCTURE</h1>
          <p style="color: #A8A29E; font-size: 10px; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 0.5px;">AUTHORIZED RECOVERY TOKEN DISPATCH</p>
        </div>

        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #ECEAE5;">
          <p style="font-size: 13px; line-height: 1.6; color: #444444; margin-top: 0; margin-bottom: 18px;">
            Security alert. A temporary resynchronization link has been configured for the credentials associated with <strong>${email}</strong>.
          </p>

          <div style="background: #FAF7F2; border-radius: 10px; padding: 18px; margin: 20px 0; border: 1px solid #EAE6DF; border-left: 4px solid #1C1917;">
            <p style="margin: 0 0 6px 0; font-size: 10px; uppercase font-weight: bold; color: #78716C; font-family: monospace;">Cryptographic Reset Code</p>
            <p style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 4px; color: #1C1917; font-family: monospace;">SHANA-992-SEC</p>
          </div>

          <p style="font-size: 12px; line-height: 1.5; color: #666666; margin-bottom: 24px;">
            This single-use security token remains valid for exactly <strong>15 minutes</strong>. If you did not ask for this credential resynchronization, you can safely ignore this document; your security integrity is uncompromised.
          </p>

          <div style="text-align: center; margin: 24px 0 10px 0;">
            <a href="#" style="background-color: #FECE4F; color: #1C1917; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; display: inline-block; border: 1px solid #E0B438;">
              Perform Secure Password Reset
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-family: monospace; font-size: 9px; color: #A8A29E;">
          <p style="margin: 0;">IP REGISTERED ON REQUEST: 195.154.122.4 (AUTHORIZED REQUEST)</p>
        </div>
      </div>
    `;
  }

  return 'No preview content available.';
}

function generateDefaultEmails(userName: string, userEmail: string): SimulatedEmail[] {
  const defaults: SimulatedEmail[] = [];
  const name = userName || 'Marie';
  const email = userEmail || 'marie.dubois@corporation.com';

  // 1. Password Reset
  defaults.push({
    id: 'mail_init_3',
    sender: 'security@shana-platform.com',
    recipient: email,
    subject: getSubjectForType('reset-password', name, email),
    bodyHtml: getHtmlForType('reset-password', name, email),
    bodyText: getTextForType('reset-password', name, email),
    timestamp: '2 hours ago',
    actionType: 'reset-password',
    isUnread: true
  });

  // 2. Login verification
  defaults.push({
    id: 'mail_init_2',
    sender: 'security@shana-platform.com',
    recipient: email,
    subject: getSubjectForType('login', name, email),
    bodyHtml: getHtmlForType('login', name, email),
    bodyText: getTextForType('login', name, email),
    timestamp: '1 day ago',
    actionType: 'login',
    isUnread: false
  });

  // 3. Welcome Welcome
  defaults.push({
    id: 'mail_init_1',
    sender: 'security@shana-platform.com',
    recipient: email,
    subject: getSubjectForType('signup', name, email),
    bodyHtml: getHtmlForType('signup', name, email),
    bodyText: getTextForType('signup', name, email),
    timestamp: '3 days ago',
    actionType: 'signup',
    isUnread: false
  });

  return defaults;
}
