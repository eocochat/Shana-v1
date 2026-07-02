import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  MessageSquare, 
  X, 
  Flame, 
  Calendar, 
  Play, 
  Clock, 
  ChevronRight, 
  Send, 
  User, 
  Compass, 
  Mic, 
  Video, 
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { ActiveTab, Language, UserProfile } from '../types';

interface AICompanionProps {
  user: UserProfile;
  lang: Language;
  onTabChange: (tab: ActiveTab) => void;
}

interface ChatMessage {
  id: string;
  sender: 'shana' | 'candidate';
  text: string;
  timestamp: Date;
}

export default function AICompanion({ user, lang, onTabChange }: AICompanionProps) {
  const isFrench = lang === 'FR';
  const userId = user.id || 'usr_candidate';

  // Toggle state of the main companion popup
  const [isOpen, setIsOpen] = useState(false);
  const [quickActionsActive, setQuickActionsActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [supportsHover, setSupportsHover] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupportsHover(window.matchMedia('(hover: hover)').matches);
    }
  }, []);

  const closeAll = () => {
    setIsOpen(false);
    setQuickActionsActive(false);
  };

  const handleTriggerClick = () => {
    if (isOpen) {
      // Second click: close main window and open easy button
      setIsOpen(false);
      setQuickActionsActive(true);
    } else if (quickActionsActive) {
      // Third click: close everything
      closeAll();
      setIsHovered(false);
    } else {
      // First click: open main window
      setIsOpen(true);
      setQuickActionsActive(false);
    }
  };

  const [hasUnfinishedSession, setHasUnfinishedSession] = useState(false);
  const [unfinishedDetails, setUnfinishedDetails] = useState<any | null>(null);
  
  // Scheduled session state
  const [upcomingSession, setUpcomingSession] = useState<any | null>(null);

  // Chat message state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested pre-set questions
  const presetQuestions = isFrench ? [
    {
      q: "Comment gérer le stress de l'entretien ?",
      a: "Pour dompter le stress, appliquez la méthode du 'Centrage Miroir' : prenez 3 respirations diaphragmatiques lentes avant de parler. Shana valorise le silence de transition plutôt que les mots de remplissage ('euh', 'du coup'). Prenez votre temps !"
    },
    {
      q: "Comment structurer une réponse complexe ?",
      a: "Utilisez la formule STAR : Situation, Tâche, Action, Résultat. Consacrez 15% au contexte, 65% à vos actions personnelles concrètes, et 20% aux résultats mesurables obtenus."
    },
    {
      q: "Comment Shana évalue-t-elle ma clarté ?",
      a: "J'analyse le rythme verbal (viser 110 à 140 mots par minute) et le spectre de confiance de votre voix. Une bonne articulation combinée à une posture bienveillante optimise votre score d'éligibilité !"
    },
    {
      q: "Quel entraînement faire aujourd'hui ?",
      a: "Je vous recommande de faire notre 'Simulation d'entraînement vocal' (onglet Vocal) pour délier votre voix, ou une 'Mise en situation d'évaluation' complète sous contrainte de temps !"
    }
  ] : [
    {
      q: "How do I handle interview stress?",
      a: "To master stress, use our 'Mirror Centering' technique: take 3 deep diaphragmatic breaths before answering. Shana values a purposeful pause over filler words ('um', 'like'). Take your time!"
    },
    {
      q: "How should I structure complex answers?",
      a: "Use the STAR framework: Situation, Task, Action, Result. Allocate 15% to context, 65% to your concrete personal actions, and 20% to measurable results."
    },
    {
      q: "How does Shana evaluate my clarity?",
      a: "I measure your speech tempo (aiming for 110-140 words per minute) and vocal confidence. Strong articulation combined with a composed cadence maximizes your competency score!"
    },
    {
      q: "What practice should I do today?",
      a: "I recommend doing a 'Voice Simulator' drill to warm up your tone, or going for a full 'Mock Assessment' to test your performance under pressure!"
    }
  ];

  // Initialize welcome message
  useEffect(() => {
    const welcomeText = isFrench 
      ? `Bonjour ${user.name || 'Candidat'} ! Je suis Shana, votre mentor IA. Comment puis-je optimiser votre préparation d'entretien aujourd'hui ?`
      : `Hello ${user.name || 'Candidate'}! I am Shana, your AI mentor. How can I help optimize your interview performance today?`;
    
    setChatMessages([
      {
        id: 'welcome',
        sender: 'shana',
        text: welcomeText,
        timestamp: new Date()
      }
    ]);
  }, [lang, user.name]);

  // Load resumeable training sessions & upcoming schedules
  useEffect(() => {
    const loadState = () => {
      // 1. Check for active training session
      try {
        const activeKey = `shana_active_training_${userId}`;
        const activeSaved = localStorage.getItem(activeKey);
        if (activeSaved) {
          const parsed = JSON.parse(activeSaved);
          if (parsed && parsed.chatHistory && parsed.chatHistory.length > 0 && parsed.step === 'active') {
            setHasUnfinishedSession(true);
            setUnfinishedDetails(parsed);
          } else {
            setHasUnfinishedSession(false);
          }
        } else {
          setHasUnfinishedSession(false);
        }
      } catch (e) {
        setHasUnfinishedSession(false);
      }

      // 2. Check for scheduled sessions
      try {
        const schedKey = `shana_scheduled_v2_${userId}`;
        const schedSaved = localStorage.getItem(schedKey);
        if (schedSaved) {
          const parsed: any[] = JSON.parse(schedSaved);
          if (parsed && parsed.length > 0) {
            const now = new Date();
            // Find closest upcoming scheduled session in future
            const futureSessions = parsed
              .map(s => ({ ...s, dateObj: new Date(s.dateTime) }))
              .filter(s => s.dateObj > now)
              .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
            
            if (futureSessions.length > 0) {
              setUpcomingSession(futureSessions[0]);
            } else {
              setUpcomingSession(null);
            }
          } else {
            setUpcomingSession(null);
          }
        } else {
          setUpcomingSession(null);
        }
      } catch (e) {
        setUpcomingSession(null);
      }
    };

    loadState();
    
    // Poll for changes every 5 seconds to stay updated
    const interval = setInterval(loadState, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'candidate',
      text: text,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMsg]);
    setUserInput('');
    setIsTyping(true);

    // Simulate smart coaching response
    setTimeout(() => {
      const lowerText = text.toLowerCase();
      let reply = '';

      // Find matching pre-set or generic response
      const matchedPreset = presetQuestions.find(item => 
        lowerText.includes(item.q.toLowerCase()) || 
        item.q.toLowerCase().includes(lowerText)
      );

      if (matchedPreset) {
        reply = matchedPreset.a;
      } else if (lowerText.includes('resume') || lowerText.includes('reprendre') || lowerText.includes('fini') || lowerText.includes('finish')) {
        if (hasUnfinishedSession) {
          reply = isFrench
            ? "Absolument ! Vous avez un entraînement vocal interrompu en cours. Cliquez sur le bouton 'Reprendre l'entraînement' ci-dessus pour retourner directement dans la cabine !"
            : "Absolutely! You have an interrupted voice training session. Click the 'Resume' call-out in this panel to jump straight back into practice!";
        } else {
          reply = isFrench
            ? "Vous n'avez pas de session interrompue actuellement. Commençons un nouvel entraînement dans l'onglet Vocal !"
            : "You don't have any interrupted sessions active right now. Let's launch a fresh training session in the Vocal tab!";
        }
      } else if (lowerText.includes('schedule') || lowerText.includes('calendrier') || lowerText.includes('programmer') || lowerText.includes('upcoming')) {
        if (upcomingSession) {
          const dtStr = new Date(upcomingSession.dateTime).toLocaleString(isFrench ? 'fr-FR' : 'en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });
          reply = isFrench
            ? `Votre prochain entraînement est programmé pour le ${dtStr} (${upcomingSession.type}). Conservez votre élan !`
            : `Your next programmed session is scheduled for ${dtStr} (${upcomingSession.type}). Keep up the momentum!`;
        } else {
          reply = isFrench
            ? "Aucun créneau d'entraînement n'est planifié pour le moment. Planifions-en un ensemble pour vous forger une routine infaillible !"
            : "No practice slot is planned at the moment. Let's schedule one together to build an unbreakable preparation streak!";
        }
      } else if (lowerText.includes('tarifs') || lowerText.includes('prix') || lowerText.includes('pricing') || lowerText.includes('premium') || lowerText.includes('abonner')) {
        reply = isFrench
          ? "Shana propose des formules premium flexibles pour débloquer des simulations d'évaluation illimitées et des rapports de diagnostic détaillés. Rendez-vous dans l'onglet Abonnement pour en savoir plus !"
          : "Shana offers flexible premium tiers to unlock unlimited mock simulations and deep diagnostic reports. Check out our Premium Upgrade tab for full details!";
      } else {
        // Dynamic fallback response using role information
        reply = isFrench
          ? `En tant que futur candidat pour un poste dans le domaine de la ${user.industry || 'Technologie'} (${user.targetRole || 'Manager'}), l'essentiel est de parler de manière posée et de structurer vos réussites avec des indicateurs chiffrés. N'hésitez pas à lancer un entraînement pour tester votre impact !`
          : `As an aspiring candidate in the ${user.industry || 'Technology'} field looking to lock in a ${user.targetRole || 'Manager'} role, the key is structured delivery with metrics. Try running a focused drill now to perfect your conversational flow!`;
      }

      setChatMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'shana',
        text: reply,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1200);
  };

  const formatCountdown = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    if (diff <= 0) return isFrench ? "Maintenant" : "Now";
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (days > 0) return `${days}d ${hrs % 24}h`;
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  const quickActionsList = [
    {
      id: 'resume',
      label: isFrench ? "Reprendre l'entraînement" : "Resume Practice",
      icon: Play,
      color: 'bg-[#FF7E5F] text-white',
      visible: hasUnfinishedSession,
      action: () => {
        onTabChange('train');
        closeAll();
      }
    },
    {
      id: 'calendar',
      label: isFrench ? "Calendrier" : "Practice Calendar",
      icon: Calendar,
      color: 'bg-emerald-500 text-white',
      visible: true,
      action: () => {
        onTabChange('home');
        closeAll();
        setTimeout(() => {
          const btn = document.getElementById('history-scheduler-trigger-btn');
          if (btn) btn.click();
        }, 400);
      }
    },
    {
      id: 'mock',
      label: isFrench ? "Nouvel Entretien" : "Mock Interview",
      icon: GraduationCap,
      color: 'bg-[#EDC154] text-stone-950',
      visible: true,
      action: () => {
        onTabChange('assessment');
        closeAll();
      }
    }
  ].filter(act => act.visible);

  return (
    <div 
      id="shana-floating-companion" 
      className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 select-none font-sans flex flex-col items-end gap-2.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* 1. COMPANION POPUP PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="absolute bottom-16 right-0 w-[360px] max-w-[calc(100vw-2rem)] bg-white border-[2.5px] border-stone-950 rounded-[28px] shadow-[6px_6px_0px_0px_#111111] flex flex-col overflow-hidden text-left"
          >
            
            {/* Header branding */}
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between border-b-2 border-stone-950">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 border border-white flex items-center justify-center font-black text-stone-900 text-xs">
                    S
                  </div>
                  {/* Active pulsing notification */}
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-wider uppercase font-mono">SHANA COMPANION</h4>
                  <span className="text-[9px] text-stone-300 font-mono font-bold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-[#EDC154]" />
                    {isFrench ? "Votre Coach IA Actif" : "Your Active AI Coach"}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={closeAll}
                className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Suggestion Center */}
            <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto bg-stone-50 border-b-2 border-stone-150">
              
              {/* Unfinished Session Suggestion Alert */}
              {hasUnfinishedSession && (
                <div className="bg-[#FFEDD5] border-2 border-[#F97316] rounded-2xl p-3 shadow.sm space-y-2.5 animate-pulse-slow">
                  <div className="flex gap-2 items-start">
                    <Flame className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] font-mono font-black text-[#9A3412] uppercase tracking-wide">
                        {isFrench ? "SESSION NON TERMINEE" : "UNFINISHED SESSION"}
                      </h5>
                      <p className="text-[11px] font-bold text-[#7C2D12] leading-tight">
                        {isFrench 
                          ? `Vous étiez au milieu d'un entraînement de dialogue vocal.`
                          : `You left off mid-dialogue in an active voice simulator session.`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onTabChange('train');
                      closeAll();
                    }}
                    className="w-full py-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-mono font-black text-[9px] uppercase tracking-wider rounded-lg transition-all border border-stone-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isFrench ? "Reprendre maintenant" : "Resume now"}</span>
                  </button>
                </div>
              )}

              {/* Scheduled Programmed Session Indicator */}
              {upcomingSession ? (
                <div className="bg-emerald-50 border-2 border-emerald-600 rounded-2xl p-3 space-y-2.5">
                  <div className="flex gap-2 items-start">
                    <Calendar className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] font-mono font-black text-emerald-800 uppercase tracking-wide">
                        {isFrench ? "PROCHAIN SLUSH PROGRAMMÉ" : "PROGRAMMED SESSION"}
                      </h5>
                      <p className="text-[11px] font-semibold text-emerald-950 leading-tight">
                        {isFrench 
                          ? `${upcomingSession.labelFr || upcomingSession.label || 'Entraînement'} programmé.`
                          : `Programmed drill: ${upcomingSession.label || 'Practice Session'}.`}
                      </p>
                      <span className="text-[9px] text-stone-500 font-mono font-bold mt-1 block flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        {isFrench ? "Dans" : "In"} {formatCountdown(upcomingSession.dateTime)} ({new Date(upcomingSession.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onTabChange('train');
                      closeAll();
                    }}
                    className="w-full py-1.5 bg-[#A7F3D0] hover:bg-[#86efac] text-stone-950 font-mono font-black text-[9px] uppercase tracking-wider rounded-lg transition-all border border-stone-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>{isFrench ? "Lancer l'entraînement" : "Launch practice session"}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="bg-stone-100 border-2 border-stone-300 rounded-2xl p-3 space-y-2">
                  <div className="flex gap-2 items-start">
                    <Calendar className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wide">
                        {isFrench ? "AUCUNE SESSION PROGRAMMÉE" : "NO SCHEDULED DRILLS"}
                      </h5>
                      <p className="text-[10px] font-semibold text-stone-600 leading-tight">
                        {isFrench 
                          ? "Prenez de l'avance en planifiant vos séances hebdomadaires d'entretien !"
                          : "Stay disciplined by scheduling your next mock interview practice slots."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onTabChange('home'); // Schedule resides on home dashboard
                      setIsOpen(false);
                      setTimeout(() => {
                        const schedBtn = document.getElementById('history-scheduler-trigger-btn');
                        if (schedBtn) schedBtn.click();
                      }, 400);
                    }}
                    className="w-full py-1 bg-white hover:bg-stone-50 text-stone-900 font-mono font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all border border-stone-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>{isFrench ? "Programmer un créneau" : "Schedule practice now"}</span>
                  </button>
                </div>
              )}

              {/* Coaching Q&A Title */}
              <div className="flex items-center gap-1.5 pt-1">
                <HelpCircle className="w-4 h-4 text-stone-700" />
                <span className="font-mono text-[9px] font-black text-stone-500 uppercase tracking-wider">
                  {isFrench ? "GUIDE D'UTILISATION GÉNÉRAL" : "GENERAL COACHING CONSOLE"}
                </span>
              </div>

              {/* Coaching Smart Chat box area */}
              <div className="bg-white border-2 border-stone-950 rounded-2xl p-3 space-y-3 h-[180px] overflow-y-auto flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="space-y-2 overflow-y-auto flex-1 pr-1 scrollbar-thin">
                  {chatMessages.map(msg => (
                    <div 
                      key={msg.id}
                      className={`flex gap-1.5 items-start ${msg.sender === 'candidate' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border border-stone-950 text-[9px] font-bold ${
                        msg.sender === 'shana' ? 'bg-emerald-500 text-white' : 'bg-[#EDC154] text-stone-950'
                      }`}>
                        {msg.sender === 'shana' ? 'S' : 'U'}
                      </div>
                      <div className={`p-2 rounded-xl text-[10px] leading-relaxed font-semibold max-w-[85%] ${
                        msg.sender === 'shana' 
                          ? 'bg-stone-100 text-stone-900 rounded-tl-none' 
                          : 'bg-[#A7F3D0] text-stone-950 rounded-tr-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-1.5 items-start">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 border border-stone-950 text-white flex items-center justify-center text-[9px] font-bold">
                        S
                      </div>
                      <div className="p-2 bg-stone-100 text-stone-500 rounded-xl rounded-tl-none text-[9px] font-mono italic animate-pulse">
                        {isFrench ? "Shana réfléchit..." : "Shana is analyzing..."}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Instant Tap Pre-set Questions */}
                <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none">
                  {presetQuestions.map((pq, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(pq.q)}
                      className="px-2 py-1 bg-stone-50 border border-stone-300 text-stone-800 text-[8.5px] rounded-lg whitespace-nowrap hover:bg-stone-100 hover:text-stone-950 transition-colors cursor-pointer font-bold shrink-0"
                    >
                      {pq.q}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Question Input Bar */}
            <div className="p-2.5 bg-white flex items-center gap-1.5 border-t-2 border-stone-950">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(userInput)}
                placeholder={isFrench ? "Poser une question à Shana..." : "Ask Shana a question..."}
                className="flex-grow bg-stone-50 border-2 border-stone-950 rounded-xl px-3 py-1.5 text-xs text-stone-900 font-mono font-semibold focus:outline-none placeholder:text-stone-400"
              />
              <button
                onClick={() => handleSendMessage(userInput)}
                className="p-2 bg-[#EDC154] border-2 border-stone-950 hover:bg-[#f3d482] text-stone-950 rounded-xl transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Navigation Quick Links */}
            <div className="bg-stone-100 px-3 py-2 flex items-center justify-around border-t border-stone-200">
              <button 
                onClick={() => { onTabChange('train'); closeAll(); }}
                className="text-[9px] font-mono font-black text-stone-500 hover:text-stone-950 flex items-center gap-1 cursor-pointer"
              >
                <Mic className="w-3 h-3 text-[#EDC154]" />
                <span>{isFrench ? "Vocal" : "Voice"}</span>
              </button>
              <span className="text-stone-300">|</span>
              <button 
                onClick={() => { onTabChange('assessment'); closeAll(); }}
                className="text-[9px] font-mono font-black text-stone-500 hover:text-stone-950 flex items-center gap-1 cursor-pointer"
              >
                <Video className="w-3 h-3 text-[#FF7E5F]" />
                <span>{isFrench ? "Évaluation" : "Assess"}</span>
              </button>
              <span className="text-stone-300">|</span>
              <button 
                onClick={() => { onTabChange('history'); closeAll(); }}
                className="text-[9px] font-mono font-black text-stone-500 hover:text-stone-950 flex items-center gap-1 cursor-pointer"
              >
                <Clock className="w-3 h-3 text-indigo-500" />
                <span>{isFrench ? "Historique" : "History"}</span>
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Action Buttons on Hover/Click when closed */}
      <AnimatePresence>
        {(quickActionsActive || (supportsHover && isHovered && !isOpen)) && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="flex flex-col items-end gap-2.5 mb-1"
          >
            {quickActionsList.map((act, index) => {
              const IconComp = act.icon;
              return (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 group/btn cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    act.action();
                  }}
                >
                  {/* Label */}
                  <span className="bg-stone-900 text-white text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_#111111] whitespace-nowrap pointer-events-none transition-all group-hover/btn:translate-x-[-1px] group-hover/btn:shadow-[2px_2px_0px_0px_#111111]">
                    {act.label}
                  </span>
                  {/* Circular Button */}
                  <div
                    className={`w-9 h-9 ${act.color} rounded-full border-2 border-stone-950 flex items-center justify-center shadow-[2px_2px_0px_0px_#111111] transition-all group-hover/btn:translate-x-[-1px] group-hover/btn:translate-y-[-1px] group-hover/btn:shadow-[3px_3px_0px_0px_#111111] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_#111111]`}
                  >
                    <IconComp className="w-4 h-4 shrink-0" />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. FLOATING TRIGGER BUTTON (FAB) */}
      <button
        id="shana-companion-trigger"
        onClick={handleTriggerClick}
        className={`w-14 h-14 bg-stone-900 text-white rounded-full border-[2.5px] border-stone-950 flex items-center justify-center shadow-[4px_4px_0px_0px_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#111111] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#111111] transition-all cursor-pointer relative ${
          isOpen ? 'bg-stone-800' : ''
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white stroke-[2.5]" />
        ) : (
          <div className="relative">
            <span className="font-sans font-black text-lg text-emerald-400">S</span>
            {/* Visual alert dot if there is an action suggestion */}
            {(hasUnfinishedSession || upcomingSession) && (
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-stone-950 text-[7px] font-black text-white flex items-center justify-center">
                  !
                </span>
              </span>
            )}
          </div>
        )}
      </button>

    </div>
  );
}
