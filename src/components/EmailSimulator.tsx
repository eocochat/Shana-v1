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
  inline?: boolean;
}

export default function EmailSimulator({ onNotify, userEmail = 'marie.dubois@corporation.com', userName = 'Marie', inline = false }: EmailSimulatorProps) {
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(inline || false);
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
    type: string,
    recipient: string = testEmailInput,
    extraData: any = {}
  ) => {
    const name = extraData.firstName || testNameInput || 'User';
    const emailToUse = recipient || 'marie.dubois@corporation.com';

    // Construct high-fidelity extraData for each action type to match server template requirements
    let finalExtraData = { firstName: name, ...extraData };
    if (type === 'cv-analyzed') {
      finalExtraData = {
        firstName: name,
        targetRole: extraData.targetRole || 'Principal Product Manager',
        industry: extraData.industry || 'Technology & AI Automation',
        score: extraData.score || 88,
        strengths: extraData.strengths || ['Structural communications', 'Advanced system engineering expertise', 'Deep product strategy mapping'],
        ...extraData
      };
    } else if (type === 'training-completed') {
      finalExtraData = {
        firstName: name,
        score: extraData.score || 84,
        tips: extraData.tips || 'Keep practicing STAR methodologies. Your pacing was optimal at 135 words per minute.',
        ...extraData
      };
    } else if (type === 'assessment-completed') {
      finalExtraData = {
        firstName: name,
        score: extraData.score || 91,
        adaptability: extraData.adaptability || 88,
        communication: extraData.communication || 92,
        industry: extraData.industry || 85,
        behavioral: extraData.behavioral || 90,
        ...extraData
      };
    } else if (type === 'payment-success') {
      finalExtraData = {
        firstName: name,
        amount: extraData.amount || '29.00',
        transactionId: extraData.transactionId || 'TX_STRIPE_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        ...extraData
      };
    } else if (type === 'scheduled-session') {
      finalExtraData = {
        firstName: name,
        date: extraData.date || new Date(Date.now() + 48*60*60*1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        time: extraData.time || '10:30 AM EST',
        mentor: extraData.mentor || 'Shana Senior Recruiter Coach',
        meetUrl: extraData.meetUrl || 'https://meet.google.com/sha-na-co',
        ...extraData
      };
    }

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
          extraData: finalExtraData
        }),
      });

      const result = await response.json();

      if (result.success) {
        const newEmail: SimulatedEmail = {
          id: `mail_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          sender: result.provider ? `SHANA Server (${result.provider})` : 'security@shana-platform.com',
          recipient: emailToUse,
          subject: result.subject || getSubjectForType(type, name, emailToUse, finalExtraData),
          bodyHtml: getHtmlForType(type, name, emailToUse, finalExtraData),
          bodyText: getTextForType(type, name, emailToUse, finalExtraData),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Real SMTP Dispatch)',
          actionType: type as any,
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
        subject: getSubjectForType(type, name, emailToUse, finalExtraData),
        bodyHtml: getHtmlForType(type, name, emailToUse, finalExtraData),
        bodyText: getTextForType(type, name, emailToUse, finalExtraData),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Simulated)',
        actionType: type as any,
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

  const panelContent = (
    <div 
      id="email-simulator-panel"
      className={inline 
        ? "w-full bg-stone-900 border border-stone-800 rounded-[28px] shadow-sm overflow-hidden text-stone-300 flex flex-col h-[650px]"
        : "absolute bottom-16 right-0 w-[360px] sm:w-[480px] bg-stone-900 border border-stone-800 rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden text-stone-300 animate-fade-in flex flex-col h-[520px]"
      }
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
        {!inline && (
          <button 
            onClick={() => setIsOpen(false)}
            className="text-stone-400 hover:text-white text-xs font-bold uppercase py-1 px-2.5 bg-stone-900 rounded-full border border-stone-800 transition-all"
          >
            Close
          </button>
        )}
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

            <div className="grid grid-cols-4 gap-1.5 mt-1">
              <button
                onClick={() => triggerEmail('signup')}
                title="Trigger Welcome Sign Up Email"
                className="py-1 px-0.5 bg-stone-800 hover:bg-stone-750 hover:text-white rounded-lg text-[8px] font-bold text-center border border-stone-700/60 uppercase transition-all"
              >
                📥 Sign Up
              </button>
              <button
                onClick={() => triggerEmail('login')}
                title="Trigger Security Login Alert Email"
                className="py-1 px-0.5 bg-stone-800 hover:bg-stone-750 hover:text-white rounded-lg text-[8px] font-bold text-center border border-stone-700/60 uppercase transition-all"
              >
                🔐 Login
              </button>
              <button
                onClick={() => triggerEmail('reset-password')}
                title="Trigger Password Reset Email"
                className="py-1 px-0.5 bg-stone-800 hover:bg-stone-750 hover:text-white rounded-lg text-[8px] font-bold text-center border border-stone-700/60 uppercase transition-all"
              >
                🔑 Reset
              </button>
              <button
                onClick={() => triggerEmail('cv-analyzed')}
                title="Trigger CV Analyzed Email"
                className="py-1 px-0.5 bg-stone-800 hover:bg-stone-750 hover:text-white rounded-lg text-[8px] font-bold text-center border border-stone-700/60 uppercase transition-all"
              >
                🎯 CV Match
              </button>
              <button
                onClick={() => triggerEmail('training-completed')}
                title="Trigger Practice Session Report Email"
                className="py-1 px-0.5 bg-stone-800 hover:bg-stone-750 hover:text-white rounded-lg text-[8px] font-bold text-center border border-stone-700/60 uppercase transition-all"
              >
                📈 Practice
              </button>
              <button
                onClick={() => triggerEmail('assessment-completed')}
                title="Trigger Certified Audit Report Email"
                className="py-1 px-0.5 bg-stone-800 hover:bg-stone-750 hover:text-white rounded-lg text-[8px] font-bold text-center border border-stone-700/60 uppercase transition-all"
              >
                🏆 Audit
              </button>
              <button
                onClick={() => triggerEmail('payment-success')}
                title="Trigger Invoice Secured Email"
                className="py-1 px-0.5 bg-stone-800 hover:bg-stone-750 hover:text-white rounded-lg text-[8px] font-bold text-center border border-stone-700/60 uppercase transition-all"
              >
                💳 Invoice
              </button>
              <button
                onClick={() => triggerEmail('scheduled-session')}
                title="Trigger Session Booked Confirmation Email"
                className="py-1 px-0.5 bg-stone-800 hover:bg-stone-750 hover:text-white rounded-lg text-[8px] font-bold text-center border border-stone-700/60 uppercase transition-all"
              >
                📅 Mock Book
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
  );

  if (inline) {
    return panelContent;
  }

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
      {isOpen && panelContent}
    </div>
  );
}

/* HIGH FIDELITY EMAIL GENERATION SUB ENGINE */

function getSubjectForType(type: string, firstName: string, email: string, extraData?: any): string {
  const isFr = extraData?.language === 'French' || extraData?.lang === 'FR';
  switch (type) {
    case 'signup':
      return isFr 
        ? `Bienvenue sur SHANA, ${firstName} ! 🚀 Votre parcours de préparation commence`
        : `Welcome to SHANA, ${firstName}! 🚀 Your Interview Readiness Journey Begins Now`;
    case 'login':
      return isFr 
        ? `Sécurité SHANA : Nouvelle connexion vérifiée pour ${email}`
        : `SHANA Security: New login verified for ${email}`;
    case 'reset-password':
      return isFr 
        ? `🔑 Réinitialisation de mot de passe SHANA : Restructuration de vos accès`
        : `🔑 Shana Cryptographic Key Reset Link: Account Password Restructure`;
    case 'cv-analyzed':
      return isFr 
        ? `🎯 SHANA Intelligence : Votre CV a été analysé pour le poste de ${extraData?.targetRole || 'Candidat'}`
        : `🎯 SHANA Intelligence: CV Profile Matched & Scored for ${extraData?.targetRole || 'Candidate'}`;
    case 'training-completed':
      return isFr 
        ? `📈 Rapport d'entraînement : Score de ${extraData?.score || 80}% obtenu !`
        : `📈 Practice Session Feedback: You scored ${extraData?.score || 80}% in training!`;
    case 'assessment-completed':
      return isFr 
        ? `🏆 Rapport d'Évaluation Officiel : Score certifié de ${extraData?.score || 80}%`
        : `🏆 Official Assessment Report: ${extraData?.score || 80}% Score Certified`;
    case 'payment-success':
      return isFr 
        ? `💳 Confirmation de paiement : Votre licence SHANA Premium est activée !`
        : `💳 Invoice Secured: SHANA Premium License Activated!`;
    case 'scheduled-session':
      return isFr 
        ? `📅 Confirmé : Votre session d'entraînement SHANA est planifiée`
        : `📅 Confirmed: Your SHANA Mock Session has been scheduled`;
    default:
      return 'SHANA Notification Core Alert';
  }
}

function getTextForType(type: string, firstName: string, email: string, extraData?: any): string {
  const isFr = extraData?.language === 'French' || extraData?.lang === 'FR';
  switch (type) {
    case 'signup':
      return isFr
        ? `Bienvenue, ${firstName} ! Votre compte associé à ${email} est actif. Connectez-vous pour commencer.`
        : `Welcome, ${firstName}! Your account associated with ${email} is active. Perform onboarding profile synchronization to initiate.`;
    case 'login':
      return isFr
        ? `Alerte de sécurité pour ${email}. Une session a été ouverte. Si ce n'est pas vous, réinitialisez vos accès.`
        : `Security alert for ${email}. Access was authorized from Chrome 124.0. If you did not trigger this session, reset your keys.`;
    case 'reset-password':
      return isFr
        ? `Demande de réinitialisation pour ${email}. Utilisez le code SHANA-992-SEC sous 15 minutes.`
        : `Password reset issued for ${email}. Apply code SHANA-992-SEC to confirm credentials restructuring. link active for 15m.`;
    case 'cv-analyzed':
      return isFr
        ? `Analyse de CV terminée pour le rôle de ${extraData?.targetRole || 'Candidat'} dans le secteur ${extraData?.industry || 'Général'}.`
        : `CV Analysis complete for ${extraData?.targetRole || 'Candidate'} in the ${extraData?.industry || 'General'} sector.`;
    case 'training-completed':
      return isFr
        ? `Entraînement terminé ! Score global : ${extraData?.score || 80}%. Continuez à vous entraîner.`
        : `Training session complete! Overall Score: ${extraData?.score || 80}%. Keep practicing to hone your skills.`;
    case 'assessment-completed':
      return isFr
        ? `Votre rapport d'évaluation officiel est disponible. Score certifié : ${extraData?.score || 80}%.`
        : `Your certified assessment report is ready. Certified Score: ${extraData?.score || 80}%.`;
    case 'payment-success':
      return isFr
        ? `Merci pour votre achat ! Votre accès Premium a été déverrouillé.`
        : `Thank you for your purchase! Your Premium license has been successfully unlocked.`;
    case 'scheduled-session':
      return isFr
        ? `Votre session est confirmée pour le ${extraData?.date || 'prochainement'} à ${extraData?.time || 'l\'heure convenue'}.`
        : `Your session is confirmed for ${extraData?.date || 'soon'} at ${extraData?.time || 'scheduled time'}.`;
    default:
      return 'Operational metrics notification dispatched.';
  }
}

function getHtmlForType(type: string, firstName: string, email: string, extraData?: any): string {
  const darkStone = '#1C1917';
  const isFr = extraData?.language === 'French' || extraData?.lang === 'FR';

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
            ${isFr ? `Bonjour ${firstName}, bienvenue sur la console Shana !` : `Bonjour ${firstName}, welcome to Shana Console!`}
          </h2>
          <p style="font-size: 13px; line-height: 1.6; color: #444444; margin-bottom: 18px;">
            ${isFr 
              ? `Votre profil professionnel sécurisé associé à <strong>${email}</strong> a été créé avec succès. Notre simulateur d'entretien repose sur des algorithmes d'analyse vocale et comportementale de pointe.`
              : `Your professional secure profile associated with <strong>${email}</strong> has been successfully instantiated. Our career capability assessment simulation runs on actual professional parameters.`}
          </p>

          <div style="background-color: #FECE4F; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #E0B438;">
            <p style="margin: 0; font-weight: 900; font-size: 13px; color: #1C1917; letter-spacing: -0.2px;">
              ⚡ ${isFr ? 'ACTION IMMÉDIATE RECOMMANDÉE :' : 'IMMEDIATE STEP MANDATED:'}
            </p>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #2B281B; line-height: 1.4;">
              ${isFr
                ? 'Accédez à votre tableau de bord, personnalisez votre poste cible, puis importez votre CV afin d\'analyser votre profil.'
                : 'Access your Shana console dashboard, personalize your target industry metrics, and complete the CV master profile evaluation.'}
            </p>
          </div>

          <div style="background: linear-gradient(135deg, #FFF9EB 0%, #FFF5D6 100%); padding: 16px; border-radius: 12px; border: 1px solid #FFE8A3; margin-bottom: 24px;">
            <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #6D4C0E; text-transform: uppercase; font-family: monospace;">${isFr ? 'Vos Jalons Actifs :' : 'Your Active Milestones:'}</h4>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #604515; line-height: 1.6;">
              <li>${isFr ? 'Alignement du profil de carrière' : 'Perform career profile alignment'}</li>
              <li>${isFr ? 'Importation de votre CV & cartographie des compétences' : 'Upload master resume / resume points mapping'}</li>
              <li>${isFr ? 'Entraînement vocal et simulation conversationnelle contextuelle' : 'Simulate situational voice and conversational training'}</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 28px 0 10px 0;">
            <a href="#" style="background-color: ${darkStone}; color: #FAF7F2; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              ${isFr ? 'Lancer le Tableau de Bord &' : 'Launch Active Onboarding Screen &rarr;'}
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
          <h1 style="color: #EF4444; font-size: 18px; font-weight: 900; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">${isFr ? 'ALERTE DE SÉCURITÉ' : 'SECURITY ALERT'}</h1>
          <p style="color: #A8A29E; font-size: 10px; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 0.5px;">${isFr ? 'NOUVEL ÉVÉNEMENT DE CONNEXION DÉTECTÉ' : 'NEW AUTHENTICATION EVENT DETECTED'}</p>
        </div>

        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #ECEAE5;">
          <h2 style="font-size: 15px; font-weight: 800; color: #111111; margin-top: 0; margin-bottom: 12px;">
            ${isFr ? 'Connexion Sécurisée Validée' : 'Secure Login Verified'}
          </h2>
          <p style="font-size: 12.5px; line-height: 1.5; color: #444444; margin-bottom: 20px;">
            ${isFr 
              ? `Une session utilisateur a été initiée pour le compte <strong>${email}</strong>.`
              : `An authorized user session was successfully instantiated for the account <strong>${email}</strong>.`}
          </p>

          <!-- Device specifications -->
          <div style="background-color: #F8F6F2; border-radius: 10px; padding: 14px; border: 1px solid #EAE6DF; margin-bottom: 24px; font-family: monospace; font-size: 11px; line-height: 1.6; color: #555555;">
            <p style="margin: 0; font-weight: bold; color: #1C1917; font-size: 11.5px; font-family: sans-serif; margin-bottom: 6px;">TELEMETRY PARAMETERS:</p>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">Device:</strong> <span>Chrome 125.4 (MacBook Pro)</span></div>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">IP Address:</strong> <span>82.112.45.221 (Secure TLS Tunnel)</span></div>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">Location:</strong> <span>Paris, Île-de-France, France</span></div>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">Access Date:</strong> <span>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span></div>
          </div>

          <div style="border-left: 3px solid #FECE4F; background-color: #FFFDF5; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 11.5px; color: #7A5310; font-weight: 600; line-height: 1.4;">
              <strong>${isFr ? 'Ce n\'est pas vous ?' : 'Not recognize this session?'}</strong> ${isFr ? 'Si vous n\'avez pas initié cette connexion, réinitialisez immédiatement votre mot de passe pour sécuriser votre compte.' : 'If you did not log in from this location, click below to lock down your master tokens instantly and format a new password reset.'}
            </p>
          </div>

          <div style="text-align: center; margin: 24px 0 10px 0;">
            <a href="#" style="background-color: #EF4444; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; display: inline-block;">
              ${isFr ? 'Déconnecter & Révoquer la Session' : 'De-Authorize & Terminate Token Session'}
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
          <h1 style="color: #FAF7F2; font-size: 18px; font-weight: 900; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">${isFr ? 'MOT DE PASSE' : 'PASSWORD RESTRUCTURE'}</h1>
          <p style="color: #A8A29E; font-size: 10px; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 0.5px;">AUTHORIZED RECOVERY TOKEN DISPATCH</p>
        </div>

        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #ECEAE5;">
          <p style="font-size: 13px; line-height: 1.6; color: #444444; margin-top: 0; margin-bottom: 18px;">
            ${isFr 
              ? `Alerte de sécurité. Un jeton de réinitialisation temporaire a été configuré pour le compte lié à <strong>${email}</strong>.`
              : `Security alert. A temporary resynchronization link has been configured for the credentials associated with <strong>${email}</strong>.`}
          </p>

          <div style="background: #FAF7F2; border-radius: 10px; padding: 18px; margin: 20px 0; border: 1px solid #EAE6DF; border-left: 4px solid #1C1917;">
            <p style="margin: 0 0 6px 0; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #78716C; font-family: monospace;">${isFr ? 'Code de Sécurité' : 'Cryptographic Reset Code'}</p>
            <p style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 4px; color: #1C1917; font-family: monospace;">SHANA-992-SEC</p>
          </div>

          <p style="font-size: 12px; line-height: 1.5; color: #666666; margin-bottom: 24px;">
            ${isFr
              ? `Ce jeton est à usage unique et reste valide pendant exactement <strong>15 minutes</strong>. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.`
              : `This single-use security token remains valid for exactly <strong>15 minutes</strong>. If you did not ask for this credential resynchronization, you can safely ignore this document; your security integrity is uncompromised.`}
          </p>

          <div style="text-align: center; margin: 24px 0 10px 0;">
            <a href="#" style="background-color: #FECE4F; color: #1C1917; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; display: inline-block; border: 1px solid #E0B438;">
              ${isFr ? 'Réinitialiser le Mot de passe' : 'Perform Secure Password Reset'}
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-family: monospace; font-size: 9px; color: #A8A29E;">
          <p style="margin: 0;">IP REGISTERED ON REQUEST: 195.154.122.4 (AUTHORIZED REQUEST)</p>
        </div>
      </div>
    `;
  }

  if (type === 'cv-analyzed') {
    const targetRole = extraData?.targetRole || (isFr ? 'Candidat' : 'Candidate');
    const industry = extraData?.industry || (isFr ? 'Général' : 'General');
    const strengths = extraData?.strengths || (isFr 
      ? ['Communication structurelle', 'Sens technique aiguisé', 'Adaptabilité stratégique'] 
      : ['Structural communication', 'Sharp technical delivery', 'Strategic adaptability']);
    
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; padding: 24px; border-radius: 16px; color: #1C1917; max-width: 600px; margin: 0 auto; border: 1px solid #EAE6DF;">
        <!-- CV Header -->
        <div style="background-color: ${darkStone}; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 40px; height: 40px; background-color: #FECE4F; color: ${darkStone}; border-radius: 8px; font-weight: 900; font-size: 20px; line-height: 40px; text-align: center; margin-bottom: 8px;">🎯</div>
          <h1 style="color: #FAF7F2; font-size: 18px; font-weight: 900; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">SHANA INTELLIGENCE</h1>
          <p style="color: #A8A29E; font-size: 10px; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 0.5px;">${isFr ? 'EVALUATION ET CARTOGRAPHIE DE CV TERMINEE' : 'CV PROFILE COMPATIBILITY MAP COMPLETE'}</p>
        </div>

        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #ECEAE5;">
          <h2 style="font-size: 16px; font-weight: 850; color: #111111; margin-top: 0; margin-bottom: 12px;">
            ${isFr ? `Félicitations ${firstName} ! Votre CV est analysé.` : `Congratulations ${firstName}! Your CV mapping is complete.`}
          </h2>
          <p style="font-size: 13px; line-height: 1.6; color: #444444; margin-bottom: 20px;">
            ${isFr
              ? `Notre moteur d'IA Shana a scanné vos compétences par rapport au marché. Votre profil a été configuré avec succès pour le poste ciblé : <strong>${targetRole}</strong> dans le secteur <strong>${industry}</strong>.`
              : `Our Shana AI Engine has benchmarked your professional achievements against target market vectors. Your master profile is successfully aligned for the position: <strong>${targetRole}</strong> within the <strong>${industry}</strong> sector.`}
          </p>

          <!-- Core Score Box -->
          <div style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border: 1px solid #A7F3D0; padding: 18px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #065F46; font-family: monospace; letter-spacing: 1px;">
              ${isFr ? 'COHÉRENCE DU PROFIL GLOBALE' : 'GLOBAL PROFILE COHERENCE'}
            </p>
            <p style="margin: 0; font-size: 32px; font-weight: 900; color: #047857; font-family: sans-serif;">
              ${extraData?.score || 88}%
            </p>
          </div>

          <div style="margin-bottom: 24px;">
            <h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; color: #1C1917; text-transform: uppercase; letter-spacing: 0.5px;">
              🛡️ ${isFr ? 'Forces Clés Détectées :' : 'Key Identified Strengths:'}
            </h4>
            <div style="background-color: #F8F6F2; padding: 14px; border-radius: 10px; border: 1px solid #EAE6DF;">
              <ul style="margin: 0; padding-left: 18px; font-size: 12.5px; color: #444444; line-height: 1.7;">
                ${strengths.map((s: string) => `<li>${s}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div style="text-align: center; margin: 24px 0 10px 0;">
            <a href="#" style="background-color: ${darkStone}; color: #FAF7F2; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; display: inline-block;">
              ${isFr ? 'Lancer un Entraînement Vocal &' : 'Enter Practice Lounge &rarr;'}
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-family: monospace; font-size: 9px; color: #A8A29E;">
          <p style="margin: 0;">SHANA INTEL SYSTEMS // CLOUD ANALYSIS REPORT V1.0</p>
        </div>
      </div>
    `;
  }

  if (type === 'training-completed') {
    const score = extraData?.score || 82;
    const tips = extraData?.tips || (isFr 
      ? "Utilisez des mots-clés STAR pour structurer votre narration et gardez un rythme de parole régulier."
      : "Structure your narrative using clear STAR coordinates and keep a consistent articulation pacing.");

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; padding: 24px; border-radius: 16px; color: #1C1917; max-width: 600px; margin: 0 auto; border: 1px solid #EAE6DF;">
        <!-- Practice Header -->
        <div style="background-color: ${darkStone}; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 40px; height: 40px; background-color: #3B82F6; color: #FAF7F2; border-radius: 8px; font-weight: 900; font-size: 20px; line-height: 40px; text-align: center; margin-bottom: 8px;">📈</div>
          <h1 style="color: #FAF7F2; font-size: 18px; font-weight: 900; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">SHANA PRACTICE</h1>
          <p style="color: #A8A29E; font-size: 10px; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 0.5px;">${isFr ? 'FEED-BACK DE SESSION D\'ENTRAÎNEMENT' : 'PRACTICE FEEDBACK DISPATCHED'}</p>
        </div>

        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #ECEAE5;">
          <h2 style="font-size: 16px; font-weight: 850; color: #111111; margin-top: 0; margin-bottom: 12px;">
            ${isFr ? `Entraînement Terminé, ${firstName} !` : `Practice Session Complete, ${firstName}!`}
          </h2>
          <p style="font-size: 13px; line-height: 1.6; color: #444444; margin-bottom: 20px;">
            ${isFr
              ? `Félicitations pour avoir complété cet exercice ! Nos modèles de traitement ont évalué votre réponse vocale et conversationnelle.`
              : `Excellent work honing your verbal delivery. Our analysis core has fully processed your audio and contextual feedback metrics.`}
          </p>

          <!-- Metric Card -->
          <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border: 1px solid #BFDBFE; padding: 18px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #1E40AF; font-family: monospace; letter-spacing: 1px;">
              ${isFr ? 'SCORE D\'ÉMISSION VOCALE' : 'VERBAL PRACTICE SCORE'}
            </p>
            <p style="margin: 0; font-size: 32px; font-weight: 900; color: #1D4ED8; font-family: sans-serif;">
              ${score}%
            </p>
          </div>

          <div style="margin-bottom: 24px;">
            <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #1E3A8A; font-family: monospace; text-transform: uppercase;">
              💡 ${isFr ? 'CONSEIL ACTIONNABLE IMMÉDIAT :' : 'IMMEDIATE TACTICAL ADVICE:'}
            </h4>
            <p style="font-size: 12.5px; line-height: 1.5; color: #374151; background-color: #F0FDF4; border: 1px solid #BBF7D0; padding: 12px; border-radius: 8px; margin: 0;">
              ${tips}
            </p>
          </div>

          <div style="text-align: center; margin: 24px 0 10px 0;">
            <a href="#" style="background-color: ${darkStone}; color: #FAF7F2; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; display: inline-block;">
              ${isFr ? 'Accéder à vos Statistiques &' : 'Access Performance Metrics &rarr;'}
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-family: monospace; font-size: 9px; color: #A8A29E;">
          <p style="margin: 0;">PRACTICE SUITE VERBAL-LOG // ID: ${Math.random().toString(36).substring(2, 6).toUpperCase()}</p>
        </div>
      </div>
    `;
  }

  if (type === 'assessment-completed') {
    const score = extraData?.score || 85;
    const adaptability = extraData?.adaptability || 80;
    const communication = extraData?.communication || 85;
    const industry = extraData?.industry || 82;
    const behavioral = extraData?.behavioral || 90;

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; padding: 24px; border-radius: 16px; color: #1C1917; max-width: 600px; margin: 0 auto; border: 1px solid #EAE6DF;">
        <!-- Assessment Header -->
        <div style="background-color: #111111; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 44px; height: 44px; background-color: #FECE4F; border-radius: 50%; text-align: center; line-height: 44px; font-size: 20px; margin-bottom: 8px; color: #1C1917;">🏆</div>
          <h1 style="color: #FAF7F2; font-size: 18px; font-weight: 900; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">SHANA AUDIT</h1>
          <p style="color: #A8A29E; font-size: 10px; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 0.5px;">${isFr ? 'RAPPORT DE CERTIFICATION OFFICIEL' : 'OFFICIAL ASSESSMENT EVALUATION MATRIX'}</p>
        </div>

        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #ECEAE5;">
          <h2 style="font-size: 16px; font-weight: 850; color: #111111; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #F3F1ED; padding-bottom: 12px;">
            ${isFr ? `Rapport d'Évaluation Certifié : ${firstName}` : `Certified Performance Report: ${firstName}`}
          </h2>
          <p style="font-size: 13px; line-height: 1.6; color: #444444; margin-bottom: 18px;">
            ${isFr
              ? 'Votre entretien de mise en situation formel de type protocole Shana a été validé. Vos scores d\'évaluation multi-axes ont été compilés avec succès :'
              : 'Your formal mock assessment under official Shana testing protocols has been processed. Multi-axis rating outcomes are now verified:'}
          </p>

          <!-- Core Score Box -->
          <div style="background: linear-gradient(135deg, #FAF7F2 0%, #FFF5D6 100%); border: 1px solid #FECE4F; padding: 18px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #854D0E; font-family: monospace; letter-spacing: 1px;">
              ${isFr ? 'SCORE GLOBAL CRITIQUE' : 'GLOBAL SCORE AVERAGE'}
            </p>
            <p style="margin: 0; font-size: 34px; font-weight: 900; color: #1C1917; font-family: sans-serif;">
              ${score}%
            </p>
          </div>

          <!-- Multi-axis Progress Grid -->
          <div style="margin-bottom: 24px; font-size: 12px; line-height: 1.5;">
            <h4 style="margin: 0 0 12px 0; font-size: 11px; font-weight: 800; color: #78716C; text-transform: uppercase; font-family: monospace; letter-spacing: 0.5px;">
              ${isFr ? 'Analyse Détaillée par Compétence :' : 'Competency Vector Analysis:'}
            </h4>
            
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-weight: bold;">
                <span>${isFr ? 'Adaptabilité et Réflexion' : 'Adaptability & On-Feet Thinking'}</span>
                <span>${adaptability}%</span>
              </div>
              <div style="background-color: #F3F1ED; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background-color: #FECE4F; width: ${adaptability}%; height: 100%; border-radius: 4px;"></div>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-weight: bold;">
                <span>${isFr ? 'Clarté de Communication' : 'Communication & Clarity'}</span>
                <span>${communication}%</span>
              </div>
              <div style="background-color: #F3F1ED; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background-color: #1C1917; width: ${communication}%; height: 100%; border-radius: 4px;"></div>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-weight: bold;">
                <span>${isFr ? 'Expertise du Secteur' : 'Sector-Specific Expertise'}</span>
                <span>${industry}%</span>
              </div>
              <div style="background-color: #F3F1ED; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background-color: #047857; width: ${industry}%; height: 100%; border-radius: 4px;"></div>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-weight: bold;">
                <span>${isFr ? 'Alignement Comportemental' : 'Behavioral STAR Structure'}</span>
                <span>${behavioral}%</span>
              </div>
              <div style="background-color: #F3F1ED; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background-color: #3B82F6; width: ${behavioral}%; height: 100%; border-radius: 4px;"></div>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 28px 0 10px 0;">
            <a href="#" style="background-color: #111111; color: #FAF7F2; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; display: inline-block;">
              ${isFr ? 'Consulter le Rapport d\'Évaluation &' : 'Review Annotated Feedback &rarr;'}
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-family: monospace; font-size: 9px; color: #A8A29E;">
          <p style="margin: 0;">SHANA CERTIFIED PORTAL // VERIFIED RESULTS DISPATCH</p>
        </div>
      </div>
    `;
  }

  if (type === 'payment-success') {
    const amount = extraData?.amount || '29.00';
    const txId = extraData?.transactionId || 'TX_' + Math.random().toString(36).substring(2, 10).toUpperCase();

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; padding: 24px; border-radius: 16px; color: #1C1917; max-width: 600px; margin: 0 auto; border: 1px solid #EAE6DF;">
        <!-- Billing Header -->
        <div style="background-color: #065F46; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 40px; height: 40px; background-color: #FAF7F2; color: #065F46; border-radius: 50%; text-align: center; line-height: 40px; font-size: 18px; margin-bottom: 8px; font-weight: bold;">💳</div>
          <h1 style="color: #FAF7F2; font-size: 18px; font-weight: 900; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">SHANA BILLING</h1>
          <p style="color: #A7F3D0; font-size: 10px; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 0.5px;">${isFr ? 'CONFIRMATION D\'ACHAT ET FACTURATION' : 'PURCHASE CONFIRMED & ACCESS DEPLOYED'}</p>
        </div>

        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #ECEAE5;">
          <h2 style="font-size: 16px; font-weight: 850; color: #111111; margin-top: 0; margin-bottom: 12px;">
            ${isFr ? 'Votre Licence Shana Premium est active !' : 'Your Shana Premium Status is Active!'}
          </h2>
          <p style="font-size: 13px; line-height: 1.6; color: #444444; margin-bottom: 20px;">
            ${isFr
              ? `Merci pour votre confiance ${firstName} ! Votre paiement de <strong>${amount} €</strong> a été traité avec succès.`
              : `Thank you for choosing Shana, ${firstName}! We are pleased to confirm your premium charge of <strong>$${amount}</strong> was successfully verified.`}
          </p>

          <!-- Invoice summary panel -->
          <div style="background-color: #F8F6F2; border-radius: 10px; padding: 14px; border: 1px solid #EAE6DF; margin-bottom: 24px; font-family: monospace; font-size: 11px; line-height: 1.6; color: #555555;">
            <p style="margin: 0; font-weight: bold; color: #1C1917; font-size: 11.5px; font-family: sans-serif; margin-bottom: 6px;">${isFr ? 'DÉTAILS DE LA FACTURATION :' : 'SECURE INVOICE MATRIX:'}</p>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">${isFr ? 'ID Transaction :' : 'Transaction ID:'}</strong> <span>${txId}</span></div>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">${isFr ? 'Licence :' : 'Licence level:'}</strong> <span>SHANA Premium (All-Access Pass)</span></div>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">${isFr ? 'Montant payé :' : 'Total Secured:'}</strong> <span>${amount} ${isFr ? 'EUR' : 'USD'}</span></div>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">${isFr ? 'Statut du paiement :' : 'Stripe Status:'}</strong> <span style="color:#047857; font-weight: bold;">PAID</span></div>
          </div>

          <!-- Feature check list -->
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 800; color: #065F46; text-transform: uppercase; font-family: monospace;">
              ✨ ${isFr ? 'Fonctionnalités déverrouillées :' : 'Premium Privileges Unlocked:'}
            </h4>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #047857; line-height: 1.6;">
              <li>${isFr ? 'Évaluations formelles par IA en illimité' : 'Unlimited formal AI evaluations & simulations'}</li>
              <li>${isFr ? 'Analyses vocales et physiologiques avancées' : 'Advanced vocal pacing & tone structural metrics'}</li>
              <li>${isFr ? 'Simulateur d\'industries et pièges de recruteurs complets' : 'Comprehensive recruiter traps & specialized paths'}</li>
              <li>${isFr ? 'Rapports de performance exportables en PDF' : 'Fully compiled PDF candidate report export'}</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 10px 0 5px 0;">
            <a href="#" style="background-color: #047857; color: #FFFFFF; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; display: inline-block;">
              ${isFr ? 'Accéder au Compte Premium' : 'Explore Premium Console &rarr;'}
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-family: monospace; font-size: 9px; color: #A8A29E;">
          <p style="margin: 0;">SHANA MERCHANT CORE // SECURE STRIPE GATEWAY PORTAL</p>
        </div>
      </div>
    `;
  }

  if (type === 'scheduled-session') {
    const date = extraData?.date || 'July 15, 2026';
    const time = extraData?.time || '10:00 AM';
    const mentor = extraData?.mentor || 'Shana Expert Coach';
    const meetUrl = extraData?.meetUrl || 'https://meet.google.com/sha-na-co';

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; padding: 24px; border-radius: 16px; color: #1C1917; max-width: 600px; margin: 0 auto; border: 1px solid #EAE6DF;">
        <!-- Calendar Header -->
        <div style="background-color: #1C1917; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 40px; height: 40px; background-color: #FECE4F; color: #1C1917; border-radius: 8px; font-weight: 900; font-size: 20px; line-height: 40px; text-align: center; margin-bottom: 8px;">📅</div>
          <h1 style="color: #FAF7F2; font-size: 18px; font-weight: 900; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">SHANA PLANNER</h1>
          <p style="color: #A8A29E; font-size: 10px; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 0.5px;">${isFr ? 'SESSION DE SIMULATION ET DE COACHING PLANIFIÉE' : 'MENTOR ENGAGEMENT RESERVATION CONFIRMED'}</p>
        </div>

        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #ECEAE5;">
          <h2 style="font-size: 16px; font-weight: 850; color: #111111; margin-top: 0; margin-bottom: 12px;">
            ${isFr ? 'Votre Créneau d\'Entraînement est Réservé !' : 'Your Coaching Session is Confirmed!'}
          </h2>
          <p style="font-size: 13px; line-height: 1.6; color: #444444; margin-bottom: 20px;">
            ${isFr
              ? `Bonjour ${firstName}, votre session en tête-à-tête a bien été ajoutée au planning de notre coach expert Shana.`
              : `Hello ${firstName}, your personalized one-on-one session has been locked into our dynamic coach schedules.`}
          </p>

          <!-- Appointment Summary Card -->
          <div style="background-color: #FFFDF5; border-radius: 12px; padding: 18px; border: 1px solid #FECE4F; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #7A5310; font-family: monospace;">
              ${isFr ? 'RÉCAPITULATIF DU RENDEZ-VOUS :' : 'APPOINTMENT SPECTRA:'}
            </p>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
              <strong style="color: #1C1917;">${isFr ? 'Date :' : 'Date:'}</strong>
              <span style="color: #555555;">${date}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
              <strong style="color: #1C1917;">${isFr ? 'Heure :' : 'Time:'}</strong>
              <span style="color: #555555;">${time}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
              <strong style="color: #1C1917;">${isFr ? 'Format :' : 'Expert Coach:'}</strong>
              <span style="color: #555555;">${mentor}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <strong style="color: #1C1917;">${isFr ? 'Plateforme :' : 'Video Bridge:'}</strong>
              <span style="color: #3B82F6; text-decoration: underline;">Google Meet (Secured)</span>
            </div>
          </div>

          <div style="border-left: 3px solid #3B82F6; background-color: #EFF6FF; padding: 12px; border-radius: 4px; margin-bottom: 24px; font-size: 12px; color: #1E40AF;">
            <p style="margin: 0; line-height: 1.4;">
              <strong>${isFr ? 'Préparation requise :' : 'Pre-flight check:'}</strong> ${isFr ? 'Pour profiter au mieux de votre coaching, veuillez revoir votre CV analysé et brancher vos écouteurs pour l\'analyse audio en temps réel.' : 'To optimize your feedback, please have your analyzed CV details on-screen and use headphones to prevent audio loopbacks.'}
            </p>
          </div>

          <div style="text-align: center; margin: 10px 0 5px 0;">
            <a href="${meetUrl}" target="_blank" style="background-color: #1C1917; color: #FAF7F2; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; display: inline-block;">
              ${isFr ? 'Rejoindre la visio (Google Meet) &' : 'Join Google Meet Session &rarr;'}
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-family: monospace; font-size: 9px; color: #A8A29E;">
          <p style="margin: 0;">SHANA SCHEDULER PROTOCOL // API-SYNC OK</p>
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
    actionType: 'reset-password' as any,
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
    actionType: 'login' as any,
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
    actionType: 'signup' as any,
    isUnread: false
  });

  return defaults;
}
