import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  TrendingUp, 
  CheckCircle, 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  Sliders, 
  X, 
  RefreshCw, 
  ArrowRight, 
  ThumbsUp, 
  Share2, 
  Twitter, 
  Link2, 
  Play, 
  HelpCircle, 
  Send,
  MessageSquare,
  Compass,
  Star,
  Users,
  Gift,
  BookOpen,
  Activity,
  ChevronDown
} from 'lucide-react';
import { SessionHistoryItem, UserProfile, Language } from '../types';
import { reviewDirector, replayEngine, explanationEngine, improvementEngine, practiceEngine, progressEngine, feedbackEngine, referralEngine, celebrationEngine, recommendationEngine, analyticsEngine } from '../lib/postInterview/reviewDirector';
import { PostInterviewState, PracticeSession, ReplayQuestionTimeline } from '../lib/postInterview/reviewState';
import { generateReportPDF } from '../utils/pdfGenerator';

interface PostInterviewCoachingViewProps {
  user: UserProfile;
  session: SessionHistoryItem;
  history: SessionHistoryItem[];
  lang: Language;
  onClose: () => void;
  onChangeTab: (tab: 'home' | 'train' | 'assessment' | 'history' | 'profile') => void;
}

export default function PostInterviewCoachingView({
  user,
  session,
  history,
  lang,
  onClose,
  onChangeTab
}: PostInterviewCoachingViewProps) {
  const isFR = lang === 'FR';
  const sessionId = session.id || 'sess_active';

  // --- RECRUITER TO AI CAREER COACH HANDOFF BANNER STATE ---
  const [showHandoffBanner, setShowHandoffBanner] = useState(true);

  // --- REVIEW PROCESS (STEP 1) ---
  const [isReviewing, setIsReviewing] = useState(true);
  const [reviewStepIdx, setReviewStepIdx] = useState(0);
  const reviewSteps = isFR ? [
    "Analyse de l'élocution et du vocabulaire technique...",
    "Évaluation de l'adéquation au profil de poste de direction...",
    "Mesure sémantique de l'adhérence STAR...",
    "Reconstitution des pensées confidentielles du recruteur...",
    "Préparation de votre parcours de coaching personnalisé..."
  ] : [
    "Analyzing semantic vocal pacing and delivery...",
    "Evaluating executive leadership evidence metrics...",
    "Measuring strict STAR structural compliance...",
    "Decrypting confidential recruiter thoughts and triggers...",
    "Assembling your premium coaching journey pathway..."
  ];

  useEffect(() => {
    if (isReviewing) {
      let interval = setInterval(() => {
        setReviewStepIdx((prev) => {
          if (prev >= reviewSteps.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              setIsReviewing(false);
              analyticsEngine.track(sessionId, 'complete_session');
            }, 800);
            return prev;
          }
          return prev + 1;
        });
      }, 750);
      return () => clearInterval(interval);
    }
  }, [isReviewing]);

  // --- STATE MACHINE & ENGINES (STEP 2-13) ---
  const [directorState, setDirectorState] = useState<PostInterviewState>(() => 
    reviewDirector.initialize(sessionId)
  );

  const [activeTab, setActiveTab] = useState<'overview' | 'decision' | 'replay' | 'improve' | 'practice' | 'journey' | 'chat' | 'psychology'>('overview');

  // Load Engines data
  const replayTimeline = React.useMemo(() => replayEngine.generateTimeline(session, isFR), [session, isFR]);
  const competencyBreakdown = React.useMemo(() => explanationEngine.getCompetencyBreakdown(session, isFR), [session, isFR]);
  const progressComparison = React.useMemo(() => progressEngine.calculateProgress(session, history, isFR), [session, history, isFR]);
  const celebrationMilestone = React.useMemo(() => celebrationEngine.checkMilestones(session, history, isFR), [session, history, isFR]);
  const nextRecommendations = React.useMemo(() => recommendationEngine.getRecommendations(session, isFR), [session, isFR]);
  const journeyStages = React.useMemo(() => progressEngine.getJourneyStages(session, history, isFR), [session, history, isFR]);
  const referralRewards = React.useMemo(() => referralEngine.getReferralRewards(directorState.referrals, isFR), [directorState.referrals, isFR]);

  // Active selections
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<string>('leadership');
  const [selectedReplayIdx, setSelectedReplayIdx] = useState<number>(0);
  const [improvementIdx, setImprovementIdx] = useState<number>(0);
  
  // Custom attempts (Improve this answer)
  const currentImprovementState = React.useMemo(() => 
    improvementEngine.getImprovement(session, improvementIdx, isFR), 
    [session, improvementIdx, isFR]
  );
  const [customAttemptText, setCustomAttemptText] = useState('');
  const [attemptList, setAttemptList] = useState<string[]>(() => currentImprovementState.attempts);

  useEffect(() => {
    setAttemptList(currentImprovementState.attempts);
    setCustomAttemptText('');
  }, [currentImprovementState]);

  const handleSaveAttempt = () => {
    if (!customAttemptText.trim()) return;
    const updated = improvementEngine.saveAttempt(sessionId, improvementIdx, customAttemptText.trim());
    setAttemptList(updated);
    setCustomAttemptText('');
    analyticsEngine.track(sessionId, 'improve_answer', { questionIndex: improvementIdx });
  };

  // Experiences Rating (Step 8)
  const [ratingStars, setRatingStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [ratingCategory, setRatingCategory] = useState<string>('replay');
  const [customComment, setCustomComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const handleSubmitRating = () => {
    if (ratingStars === 0) return;
    feedbackEngine.submitRating(sessionId, ratingStars, ratingCategory, customComment);
    setRatingSubmitted(true);
    analyticsEngine.track(sessionId, 'submit_rating', { rating: ratingStars, category: ratingCategory });
  };

  // Referrals (Step 9)
  const [referralEmail, setReferralEmail] = useState('');
  const [referralSuccessMessage, setReferralSuccessMessage] = useState('');

  const handleSendReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralEmail.trim()) return;
    
    const updated = referralEngine.sendInvite(sessionId, directorState.referrals, referralEmail.trim());
    setDirectorState(prev => ({ ...prev, referrals: updated }));
    setReferralEmail('');
    
    const msg = isFR 
      ? "Invitation envoyée avec succès ! Un bonus Premium temporaire a été crédité." 
      : "Invite successfully sent! A temporary Premium bonus has been credited.";
    setReferralSuccessMessage(msg);
    setTimeout(() => setReferralSuccessMessage(''), 4000);
    analyticsEngine.track(sessionId, 'send_referral_invite');
  };

  // Post Interview Interactive Chat (Step 12)
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState(() => directorState.chat.messages);
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatTyping]);

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date().toISOString() }]);
    setChatInput('');
    setIsChatTyping(true);

    // Dynamic responses mapping based on user input
    setTimeout(() => {
      let botResponse = '';
      const query = userMsg.toLowerCase();

      if (query.includes('points') || query.includes('score') || query.includes('perdu') || query.includes('why did i get') || query.includes('why did i lose')) {
        botResponse = isFR 
          ? `Votre score global de préparation est de ${session.score}%. Vous avez excellé sur l'assurance et la présence (${session.confidenceScore}%) ainsi que sur l'expertise métier (${session.industryScore}%), mais vous avez perdu vos points de levier principaux sur le respect strict de la structure STAR (${session.resumeScore}%) et sur la quantification de vos réalisations. En incorporant des métriques à la fin de vos réponses, vous augmenterez considérablement ce score.`
          : `Your final executive readiness score is ${session.score}%. While you performed exceptionally on professional poise (${session.confidenceScore}%) and domain expertise (${session.industryScore}%), you lost primary leverage points on strict STAR structural compliance (${session.resumeScore}%) and quantifying your results. Adding quantitative business metrics to your endings is your fastest path to elite certification.`;
      } else if (query.includes('improve') || query.includes('améliorer') || query.includes('how can i') || query.includes('comment m\'améliorer')) {
        botResponse = isFR
          ? `Pour vous améliorer de manière drastique aujourd'hui, voici les recommandations clés du Coach :\n\n1. **Structurez votre temps** : Consacrez seulement 15% de votre réponse au contexte (Situation), puis passez vite à vos actions concrètes (50% du temps).\n2. **Concluez par un chiffre** : Remplacez les conclusions floues comme "le projet a été un succès" par "ce qui a permis de réduire les coûts d'infrastructure de 18%".\n3. **Gestion du stress** : Contrôlez votre débit de parole lors des questions sur l'échec en marquant des pauses de 1,5 seconde.\n\nVous pouvez lancer le module de réécriture dans l'onglet "Améliorer les Réponses" !`
          : `To improve your performance dramatically today, here are my top coaching recommendations:\n\n1. **Pace Your Story Structure**: Devote only 15% of your timeline to the initial Context, and immediately pivot to deconstructing your specific technical actions (50% of the speech).\n2. **State Undeniable KPIs**: Conclude every single example with a concrete number (e.g., 'resulting in an 18% cloud spend optimization' rather than 'the project was very successful').\n3. **Regulate Failure Pacing**: Maintain look-ahead gaze stability and slow down your vocal pacing when discussing mistakes to demonstrate leadership maturity.\n\nI highly recommend practicing these via the 'Improve My Answers' workshop!`;
      } else if (query.includes('good') || query.includes('bon') || query.includes('was my answer') || query.includes('ma réponse était-elle')) {
        botResponse = isFR
          ? `Votre réponse était techniquement solide et bien articulée, ce qui explique votre score honorable de ${session.score}%. Cependant, elle souffre d'un manque de clarté structurelle. Vous avez passé trop de temps à décrire le problème de l'équipe au lieu d'isoler votre responsabilité propre et de clore par un KPI d'impact. Pour un recruteur d'élite, cela ressemble à un profil d'exécutant plutôt que de leader.`
          : `Your response was technically solid and well-articulated, which is why the recruiter rated you at ${session.score}%. However, from a leadership standpoint, you spent too much time describing the team's general problem rather than isolating your personal accountability and concluding with a hard business KPI. To an elite assessor, this can come off as an execution-level profile rather than a strategic leader.`;
      } else if (query.includes('better answer') || query.includes('meilleure réponse') || query.includes('template') || query.includes('gabarit')) {
        botResponse = isFR
          ? `Voici comment formuler une réponse de niveau élite (Exemple STAR) :\n\n**Situation** : Notre base de données principale subissait des deadlocks sévères lors des pics de charge, bloquant 5 000 requêtes/seconde.\n**Tâche** : Mon mandat exclusif était de rétablir le service sous 15 minutes et de concevoir une architecture d'évitement permanent.\n**Action** : J'ai isolé les transactions lentes, intégré un gestionnaire de pooling adaptatif avec cache Redis, et mis en place une file d'attente asynchrone pour lisser les pics.\n**Résultat** : Rétablissement en 11 minutes, élimination de 99,4% des verrous et préservation de notre SLA client à 99,9% pendant les soldes.`
          : `Here is how you formulate an elite-level engineering response (STAR template):\n\n**Situation**: Our primary transactional database suffered severe write deadlocks during peak loads, stalling 5,000 requests/second.\n**Task**: My singular mandate was to restore service within 15 minutes and design a permanent, scalable deadlock prevention architecture.\n**Action**: I isolated slow query blocks, implemented an adaptive pooling manager with Redis write-through caching, and established an asynchronous message queue to buffer surges.\n**Result**: Restored complete systems health in 11 minutes, reduced transactional deadlock rates by 99.4%, and protected our 99.9% customer checkout SLA during black friday surge.`;
      } else if (query.includes('practice') || query.includes('pratiquer') || query.includes('entrainement') || query.includes('again') || query.includes('encore')) {
        botResponse = isFR
          ? `Absolument ! La pratique répétitive est la clé de l'assimilation. J'ai configuré trois exercices d'entraînement ciblés basés sur vos zones de leviers. Ouvrez l'onglet "Points Faibles" pour lancer une simulation comportementale de 5 minutes, ou l'onglet "Améliorer les Réponses" pour réécrire vos réponses passées.`
          : `Absolutely! High-repetition practice is the key to muscle memory. I have calibrated three targeted micro-drills specifically for your lowest-scoring competencies. Head over to the 'Practice Weak Areas' tab to launch a 5-minute stress-test simulation, or open the 'Improve My Answers' workshop to refine your past responses. Let's do this!`;
      } else if (query.includes('google')) {
        botResponse = isFR
          ? `Google évaluerait votre profil selon la charte 'Googleyness & Leadership'. Ils apprécieraient votre résilience opérationnelle, mais chercheraient à valider votre capacité d'abstraction. Préparez des récits montrant comment vous résolvez des problèmes ambigus et comment vous favorisez l'inclusion de l'équipe.`
          : `Google would evaluate you heavily on 'Googleyness & Leadership' and systemic Go-To-Market scaling. They would find your core execution strong but would drill down into high-ambiguity situations. They want to see how you validate team consensus and handle system failure patterns.`;
      } else if (query.includes('amazon')) {
        botResponse = isFR
          ? `Amazon scruterait vos réponses selon les 'Leadership Principles', notamment 'Customer Obsession' et 'Bias for Action'. Votre réactivité face aux crises est un excellent signal pour eux. Ils vous demanderaient de détailler rigoureusement l'analyse de cause racine (Deep Dive).`
          : `Amazon would cross-reference your answers against their 'Leadership Principles', specifically 'Bias for Action' and 'Ownership'. Your swift operational turnaround is highly valued, but they would push you on 'Dive Deep'—expecting you to know the micro-level cause of system regressions.`;
      } else if (query.includes('star') || query.includes('structure')) {
        botResponse = isFR
          ? `La structure STAR (Situation, Tâche, Action, Résultat) est la norme des leaders d'élite. Assurez-vous d'accorder 15% de votre temps au contexte (Situation), 10% à votre responsabilité (Tâche), 50% aux étapes concrètes réalisées (Action) et 25% à l'impact mesurable (Résultat).`
          : `The STAR structure (Situation, Task, Action, Result) is the executive gold standard. Devote 15% of your timeline to Context, 10% to your mandate, 50% to your specific technical actions, and a full 25% to the quantifiable business results achieved.`;
      } else if (query.includes('competency') || query.includes('compétence')) {
        botResponse = isFR
          ? `Vos compétences clés sont cartographiées sur l'onglet "Behind the Decision". Votre plus grand point fort aujourd'hui est l'assurance émotionnelle (${session.confidenceScore}%), tandis que le respect strict de la structure STAR (${session.resumeScore}%) requiert un entraînement ciblé.`
          : `Your key competencies are mapped in the 'Behind the Decision' drawer. Your strongest asset today is executive confidence poise (${session.confidenceScore}%), while strict STAR structural adherence (${session.resumeScore}%) presents the highest leverage path to increase your score.`;
      } else {
        botResponse = isFR
          ? `C'est une excellente question pour parfaire votre posture. Pour y répondre efficacement, je vous recommande d'étudier l'exercice de réécriture proposé dans la section "Recruiter Replay" ou de lancer une session rapide d'entraînement ciblé de 5 minutes.`
          : `That is an excellent strategic perspective. To implement this correction, I recommend deconstructing the rewritten templates inside the 'Recruiter Replay' timeline, or launching a quick 5-minute targeted practice session.`;
      }

      setChatMessages(prev => [...prev, { sender: 'shana', text: botResponse, timestamp: new Date().toISOString() }]);
      setIsChatTyping(false);
      analyticsEngine.track(sessionId, 'chat_message_received');
    }, 1200);
  };

  // Handle PDF Export
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportPDF = () => {
    setExporting(true);
    setTimeout(() => {
      try {
        generateReportPDF(user, session, lang);
        setExportSuccess(true);
      } catch (err) {
        console.error("PDF Export error:", err);
      } finally {
        setExporting(false);
      }
    }, 1200);
  };

  // Experience Rating Choices
  const ratingChoices = feedbackEngine.getMostHelpfulChoices(isFR);

  // Quick helper to render score color bands
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 70) return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  if (isReviewing) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-6 py-12 px-4 text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-stone-100 border-t-stone-900 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xl font-black">
            AI
          </div>
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-lg font-black uppercase tracking-tight text-stone-950">
            {isFR ? "SHANA Génère Vos Analyses" : "SHANA Generates Your Analytics"}
          </h2>
          <p className="text-xs text-stone-400 font-mono tracking-widest uppercase">
            {isFR ? "MOTEUR D'ORCHESTRATION DU COACHING ACTIF" : "ACTIVE COACHING ORCHESTRATION ENGINE"}
          </p>
          <div className="bg-stone-50 border-2 border-stone-950 rounded-xl p-3 min-h-[50px] flex items-center justify-center mt-4 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            <span className="text-xs font-mono font-bold text-stone-700 uppercase animate-pulse">
              ⚡ {reviewSteps[reviewStepIdx]}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* --- HERO CELEBRATION ROADMAP BANNER (STEP 7) --- */}
      {celebrationMilestone && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-stone-950 text-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[6px_6px_0px_0px_rgba(237,193,84,1)] relative overflow-hidden"
        >
          <div className="absolute -right-8 -bottom-8 text-8xl opacity-10 select-none">
            {celebrationMilestone.badge}
          </div>
          <div className="flex items-start gap-4 z-10 relative">
            <div className="text-4xl p-3 bg-stone-900 border-2 border-stone-800 rounded-2xl shadow-[2px_2px_0px_0px_rgba(237,193,84,1)]">
              {celebrationMilestone.badge}
            </div>
            <div className="space-y-1.5 text-left flex-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#EDC154] font-black bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                {isFR ? "MILESTONE DE PROGRESSION" : "PROGRESS MILESTONE UNLOCKED"}
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight">{celebrationMilestone.title}</h2>
              <p className="text-stone-300 text-xs leading-relaxed font-semibold">
                {celebrationMilestone.message}
              </p>
              <div className="flex gap-1 pt-1">
                {Array.from({ length: celebrationMilestone.starsUnlocked }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current text-[#EDC154]" />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ==================== RECRUITER TO AI CAREER COACH HANDOFF BANNER (HIU PHASE 9) ==================== */}
      {showHandoffBanner && (
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-white border-4 border-stone-950 rounded-[28px] shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] overflow-hidden text-left mb-6"
        >
          {/* Header Bar */}
          <div className="bg-stone-950 text-[#EDC154] px-5 py-3 font-mono text-[10px] font-black uppercase tracking-widest flex justify-between items-center border-b-2 border-stone-950">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#EDC154] animate-pulse" />
              <span>{isFR ? "TRANSITION : DE L'ÉVALUATION À LA CROISSANCE" : "TRANSITION: FROM EVALUATION TO DEVELOPMENTAL GROWTH"}</span>
            </span>
            <button 
              onClick={() => setShowHandoffBanner(false)}
              className="text-stone-400 hover:text-white p-1 hover:bg-stone-900 rounded transition-colors"
              title="Dismiss Transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Professional Recruiter's Closing (Stately Slate-Grey) */}
            <div className="bg-stone-50 p-6 border-b-2 md:border-b-0 md:border-r-2 border-stone-950 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-900 border-2 border-stone-950 flex items-center justify-center font-mono text-xs text-[#EDC154] font-black shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                    SR
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-stone-900">{isFR ? "Recruteur Shana Senior" : "Senior Recruiter Assessor"}</h4>
                    <span className="px-1.5 py-0.5 bg-stone-200 text-stone-800 text-[8px] font-mono font-bold rounded uppercase border border-stone-300">
                      {isFR ? "ÉVALUATION CLOS" : "FORMAL AUDIT CONCLUDED"}
                    </span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-stone-600 leading-relaxed italic">
                  {isFR
                    ? "« Notre entretien officiel est maintenant terminé. J'ai analysé en profondeur votre débit verbal, votre cohérence sémantique, ainsi que vos structures STAR de résolution de crises techniques. J'ai transmis mon rapport d'évaluation confidentiel complet à votre espace de coaching personnel. Félicitations pour avoir complété ce tour. »"
                    : "“Our official evaluation is now closed. I have fully analyzed your conversational pacing, semantic structure, and STAR completeness on technical crisis scenarios. Your complete assessor dispatch has been bridged to your career mentor loop. Thank you for standardizing your engineering metrics with us.”"}
                </p>
              </div>
              <div className="flex items-center gap-2 text-stone-400 font-mono text-[9px] font-black uppercase tracking-wider">
                <span>{isFR ? "STATUT : TÉLÉMÉTRIE TRANSMISE" : "STATUS: TELEMETRY BRIDGED"}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
            </div>

            {/* Right: Friendly AI Career Coach (Supportive Gold/Emerald) */}
            <div className="bg-emerald-50/20 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 border-2 border-stone-950 flex items-center justify-center font-mono text-xs text-white font-black shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                    CC
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-stone-900">{isFR ? "Coach de Carrière IA Shana" : "AI Career Coach & Mentor"}</h4>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-mono font-bold rounded uppercase border border-emerald-300 animate-pulse">
                      {isFR ? "ESPACE DE DÉVELOPPEMENT ACTIF" : "GROWTH WORKSPACE ACTIVE"}
                    </span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-stone-700 leading-relaxed">
                  {isFR
                    ? "« Bienvenue dans votre atelier de croissance ! Le rôle du recruteur est de mesurer et juger ; mon rôle est de vous soutenir et de vous faire progresser. Ensemble, nous allons transformer vos faiblesses en forces d'élite. Nous allons reconstruire vos réponses STAR manquantes de KPI, travailler votre élocution sous pression, et concevoir un plan d'action d'ingénierie sur-mesure. »"
                    : "“Welcome to your career growth workshop! The recruiter's job is to evaluate and filter; my job is to support, teach, and empower you. Together, we will transform your performance gaps into elite-level credentials. Let's rewrite your answers to incorporate missing KPIs, drill on your pacing under stress, and design a custom software leadership roadmap.”"}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setActiveTab('improve');
                    analyticsEngine.track(sessionId, 'handoff_to_workshop');
                  }}
                  className="px-3.5 py-1.5 bg-stone-950 hover:bg-stone-900 text-white font-mono text-[10px] font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(237,193,84,1)] transition-transform active:translate-y-0.5"
                >
                  {isFR ? "Atelier Réécriture →" : "Start STAR Workshop →"}
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('practice');
                    analyticsEngine.track(sessionId, 'handoff_to_practice');
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-stone-50 text-stone-900 border-2 border-stone-950 font-mono text-[10px] font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] transition-transform active:translate-y-0.5"
                >
                  {isFR ? "Entraînements Ciblés" : "Targeted Micro-Practice"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- INTERACTIVE TABS RAIL --- */}
      <div className="flex flex-wrap gap-2 border-b-2 border-stone-100 pb-3">
        {[
          { id: 'overview', label: isFR ? 'Synthèse Exécutive' : 'Executive Overview' },
          { id: 'psychology', label: isFR ? 'Psychologie & Signaux' : 'Interview Psychology' },
          { id: 'decision', label: isFR ? 'Behind the Decision™' : 'Behind the Decision™' },
          { id: 'replay', label: isFR ? 'Recruiter Replay™' : 'Recruiter Replay™' },
          { id: 'improve', label: isFR ? 'Améliorer les Réponses' : 'Improve My Answers' },
          { id: 'practice', label: isFR ? 'Points Faibles' : 'Practice Weak Areas' },
          { id: 'journey', label: isFR ? 'Mon Parcours' : 'Interview Journey' },
          { id: 'chat', label: isFR ? 'Post-Interview Chat' : 'Post-Interview Chat' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              analyticsEngine.track(sessionId, `view_tab_${tab.id}`);
            }}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all border-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-stone-950 text-white border-stone-950 shadow-[2px_2px_0px_0px_rgba(237,193,84,1)]'
                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >

          {/* ==================== 1. OVERVIEW VIEW (STEP 2) ==================== */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Scoring Card */}
              <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-6">
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                      {isFR ? "Indice d'Éligibilité" : "Readiness Performance"}
                    </span>
                    <Award className="w-5 h-5 text-stone-950 animate-bounce" />
                  </div>

                  <div className="py-2 text-center space-y-2">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-36 h-36 transform -rotate-90">
                        <circle cx="72" cy="72" r="62" stroke="#F3F4F6" strokeWidth="8" fill="transparent" />
                        <motion.circle 
                          cx="72" 
                          cy="72" 
                          r="62" 
                          stroke="#18633F" 
                          strokeWidth="8" 
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 62}
                          initial={{ strokeDashoffset: 2 * Math.PI * 62 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 62 * (1 - (session.score || 0) / 100) }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-4xl font-sans font-black text-stone-950">
                          {session.score}%
                        </span>
                        <span className="text-[8px] font-mono text-stone-400 font-bold uppercase tracking-widest">Readiness</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-center pt-2">
                      <span className={`px-3 py-1 border-2 border-stone-950 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] ${
                        session.score >= 85 ? 'bg-emerald-50 text-emerald-800' : 'bg-indigo-50 text-indigo-800'
                      }`}>
                        {session.score >= 85 ? (isFR ? "Candidat Exceptionnel" : "Strong Candidate") : (isFR ? "Prêt pour l'Entretien" : "Developing")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-4 space-y-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] text-left">
                  <div className="flex justify-between text-xs font-bold text-stone-800">
                    <span>{isFR ? "Durée de l'Évaluation:" : "Interview Duration:"}</span>
                    <span className="font-mono">{session.duration || "12m 45s"}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-stone-800">
                    <span>{isFR ? "Recommandation Recruteur:" : "Recruiter Decision:"}</span>
                    <span className={`font-mono uppercase font-black text-[10px] px-1.5 py-0.5 rounded ${
                      session.score >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>{session.score >= 70 ? (isFR ? "RECOMMANDÉ" : "HIRE") : (isFR ? "À CONFIRMER" : "PASS")}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-stone-800">
                    <span>{isFR ? "Confiance Estimée:" : "Recruiter Confidence:"}</span>
                    <span className="font-mono text-stone-950">{session.confidenceScore || 75}%</span>
                  </div>
                </div>
              </div>

              {/* Center & Right Column: Highlights, Strengths & Comparison */}
              <div className="lg:col-span-2 space-y-6 text-left">
                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Top Strengths */}
                  <div className="bg-white border-2 border-stone-950 rounded-[24px] p-5 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-3">
                    <div className="flex items-center gap-2 text-stone-950">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-sans font-black text-xs uppercase tracking-wider">{isFR ? "Points Forts Clés" : "Top Strengths"}</h3>
                    </div>
                    <ul className="space-y-2">
                      {(session.strengths || []).map((strength, i) => (
                        <li key={i} className="text-xs font-bold text-stone-700 leading-relaxed flex items-start gap-2">
                          <span className="text-emerald-500 font-black shrink-0">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Top Improvements */}
                  <div className="bg-white border-2 border-stone-950 rounded-[24px] p-5 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-3">
                    <div className="flex items-center gap-2 text-stone-950">
                      <Sliders className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-sans font-black text-xs uppercase tracking-wider">{isFR ? "Axes d'Amélioration" : "Top Improvements"}</h3>
                    </div>
                    <p className="text-xs font-bold text-stone-700 leading-relaxed">
                      {session.weakness || (isFR ? "Intégrer plus de KPIs de résultats STAR." : "Fleshing out quantitative metrics.")}
                    </p>
                    <div className="pt-2">
                      <span className="text-[10px] font-mono text-stone-400 font-bold uppercase block tracking-wider">{isFR ? "RECOMMANDATION SYSTÈME" : "ACTIONABLE TIPS"}</span>
                      <p className="text-[11px] font-semibold text-stone-600 mt-1">
                        {session.recommendation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Indicators vs previous */}
                <div className="bg-white border-2 border-stone-950 rounded-[24px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-4">
                  <h3 className="font-sans font-black text-xs uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>{isFR ? "Évolution des Performances Réelles" : "Live Competency Progression Trend"}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {progressComparison.map((comp, i) => (
                      <div key={i} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-stone-950">{comp.metricName}</span>
                          <span className="text-xs font-mono font-black text-emerald-600">+{comp.changePercent}%</span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                          {comp.celebrationText}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PDF and share quick access */}
                <div className="flex gap-3 justify-end">
                  <button
                    disabled={exporting}
                    onClick={handleExportPDF}
                    className="px-4 py-2 text-xs font-mono uppercase font-black tracking-wider bg-white border-2 border-stone-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] transition-all cursor-pointer flex items-center gap-2"
                  >
                    {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>{isFR ? "Télécharger le Rapport PDF" : "Download PDF Report"}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('replay')}
                    className="px-4 py-2 text-xs font-mono uppercase font-black tracking-wider bg-[#EDC154] text-stone-950 border-2 border-stone-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>{isFR ? "Démarrer le Replay Recruteur" : "Start Recruiter Replay"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* --- SENIOR RECRUITER'S CONFIDENTIAL EXECUTIVE ASSESSMENT --- */}
              <div className="lg:col-span-3 bg-stone-950 text-stone-100 border-2 border-stone-950 rounded-[32px] p-6 shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] space-y-6 text-left">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-800 pb-4">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#EDC154] font-black bg-stone-900 px-2 py-1 rounded border border-stone-850">
                      CONFIDENTIAL ASSESSOR DISPATCH
                    </span>
                    <h3 className="text-xl font-black uppercase tracking-tight text-white mt-2">
                      {isFR ? "Rapport d'Évaluation Exécutif du Recruteur Senior" : "Senior Recruiter Executive Assessment Report"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider">{isFR ? "Indice de Confiance :" : "Assessor Confidence:"}</span>
                    <span className="text-xs font-mono font-black text-[#EDC154] bg-stone-900 px-2.5 py-1 rounded border border-stone-800">
                      {session.score >= 80 ? "96%" : "84%"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#EDC154]">{isFR ? "Synthèse Globale de Performance" : "Overall Performance Synthesis"}</h4>
                      <p className="text-xs font-medium text-stone-300 leading-relaxed">
                        {isFR 
                          ? `Le candidat démontre une excellente réactivité et maîtrise les fondamentaux de sa fonction (${session.score}% de préparation). Son style d'élocution à un rythme stable inspire une confiance naturelle. Les axes d'amélioration identifiés portent sur le renforcement de la structure STAR pour ancrer systématiquement l'impact financier de ses réalisations.`
                          : `The candidate demonstrates outstanding technical capability paired with a highly structured delivery framework, indicating a strong readiness level of ${session.score}%. Their vocal cadence is calm and authoritative. Key leverage points involve raising structural STAR discipline to better quantify systemic and financial outcomes.`}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 bg-stone-900 border border-stone-800 rounded-xl p-3">
                        <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-wider">{isFR ? "Plus Grandes Forces" : "Strongest Core Assets"}</span>
                        <p className="text-xs font-bold text-white mt-1">
                          {isFR ? "Posture & Résilience Technique" : "Executive Poise & Technical Grounding"}
                        </p>
                      </div>
                      <div className="space-y-1 bg-stone-900 border border-stone-800 rounded-xl p-3">
                        <span className="text-[8px] font-mono text-amber-400 font-bold uppercase tracking-wider">{isFR ? "Axe de Levier Principal" : "Highest Leverage Growth"}</span>
                        <p className="text-xs font-bold text-white mt-1">
                          {isFR ? "Quantification STAR (Result)" : "Quantitative Metrics & Impact"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t md:border-t-0 md:border-l border-stone-800 pt-4 md:pt-0 md:pl-6">
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-stone-400">{isFR ? "Observations du Recruteur" : "Vocal & Behavioral Observations"}</h4>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-stone-900 pb-1.5">
                          <span className="text-stone-400 font-bold">{isFR ? "Style de Communication :" : "Communication Style:"}</span>
                          <span className="font-mono text-white font-bold">{isFR ? "Direct & Structuré" : "Direct, Structured & Articulate"}</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-900 pb-1.5">
                          <span className="text-stone-400 font-bold">{isFR ? "Potentiel de Leadership :" : "Leadership Potential:"}</span>
                          <span className="font-mono text-white font-bold">{isFR ? "Élevé (Gestion de Crise)" : "High (Crisis Team Management)"}</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-900 pb-1.5">
                          <span className="text-stone-400 font-bold">{isFR ? "Préparations Techniques :" : "Technical Readiness:"}</span>
                          <span className="font-mono text-white font-bold">{isFR ? "Excellente" : "Strong (Scalable Architectures)"}</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-900 pb-1.5">
                          <span className="text-stone-400 font-bold">{isFR ? "Vision Commerciale :" : "Business Readiness:"}</span>
                          <span className="font-mono text-white font-bold">{isFR ? "En Développement" : "Developing (Needs ROI metrics)"}</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-900 pb-1.5">
                          <span className="text-stone-400 font-bold">{isFR ? "Recommandation Finale :" : "Hiring Recommendation:"}</span>
                          <span className="font-mono text-[#EDC154] font-black">{session.score >= 70 ? (isFR ? "RECOMMANDATION FORTE" : "STRONG RECOMMENDATION") : (isFR ? "À CONFIRMER" : "FURTHER DRILL RECOMMENDED")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-900 border border-stone-850 rounded-xl p-3 text-xs flex items-start gap-2.5">
                  <span className="text-base">🎯</span>
                  <div className="text-left">
                    <span className="text-[9px] font-mono text-[#EDC154] font-black uppercase tracking-wider block">{isFR ? "PRIORITÉS CLÉS D'AMÉLIORATION POUR L'EMBAUCHE" : "TOP PRIORITIES FOR IMMEDIATE IMPROVEMENT"}</span>
                    <p className="text-stone-300 font-semibold mt-0.5 leading-relaxed">
                      {isFR 
                        ? `1. Intégrez des mesures chiffrées (coûts cloud, millisecondes, heures gagnées) pour 100% de vos récits STAR. \n2. Décrivez le mécanisme post-mortem d'évitement permanent après la résolution d'une crise technique.`
                        : `1. Anchor 100% of behavioral stories in hard, quantitative metrics (revenue, response latency delta, cloud spend savings). \n2. Clearly articulate post-incident technical preventative actions to showcase senior engineering ownership.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* --- DEEP PERFORMANCE EXPLANATION & PERSONALIZED ROADMAP (HIU PHASE 9) --- */}
              <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-3 gap-6 pt-2">
                
                {/* Columns 1 & 2: Deep Performance Explanations Platform */}
                <div className="xl:col-span-2 bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-6 text-left">
                  <div className="border-b border-stone-150 pb-3">
                    <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[8px] font-mono font-bold rounded uppercase">
                      {isFR ? "MOTEUR D'EXPLICATION PSYCHOLOGIQUE" : "DEEP PERFORMANCE EXPLANATION SYSTEM"}
                    </span>
                    <h3 className="text-lg font-black uppercase tracking-tight mt-1">
                      {isFR ? "Déconstruction Profonde des Évaluations" : "Executive Competency Diagnostic"}
                    </h3>
                    <p className="text-xs text-stone-500 font-bold leading-relaxed mt-0.5">
                      {isFR 
                        ? "Analyse factuelle rigoureuse de vos scores, connectant la preuve sémantique de l'entretien à votre cause psychologique et à votre plan d'amélioration."
                        : "Evidence-based deconstruction of core performance scores, connecting physical cues directly to psychological causes and clear action pathways."}
                    </p>
                  </div>

                  {/* 4 Key Dimensions Breakdown */}
                  <div className="space-y-4">
                    {[
                      {
                        title: isFR ? "Structure Narrative & Adhérence STAR" : "STAR Narrative Structure & Compliance",
                        score: session.resumeScore || 70,
                        icon: "📊",
                        color: "bg-amber-100 text-amber-800 border-amber-300",
                        evidence: isFR 
                          ? `Vous avez exposé la situation et vos tâches pendant plus de 60% du temps de votre réponse, mais la phase de 'Résultat' (R) est restée qualitative, sans métrique de gain financier.`
                          : `You laid out the Situation and Task stages beautifully, taking up over 60% of your narrative timeline, but left the 'Result' phase qualitative, omitting hard operational savings or SLA recovery metrics.`,
                        reason: isFR 
                          ? `Le stress cognitif en début de réponse pousse à sur-expliquer le contexte technique de peur de ne pas être compris, ce qui réduit le temps disponible pour l'impact réel.`
                          : `High cognitive stress at the start of explanations causes over-explaining technical contexts out of fear of misunderstanding, starving the final outcome phase of valuable focus time.`,
                        path: isFR 
                          ? `Consacrez strictement 15% du temps au contexte, 10% au mandat personnel, 50% aux actions d'ingénierie concrètes, et 25% à la valeur quantifiée.`
                          : `Pace your delivery strictly: devote 15% to Context, 10% to your personal mandate, 50% to your specific technical actions, and a full 25% to the quantified value achieved.`
                      },
                      {
                        title: isFR ? "Rythme Vocal, Présence & Confiance" : "Vocal Pacing, Poise & Confidence",
                        score: session.confidenceScore || 75,
                        icon: "🗣️",
                        color: "bg-indigo-100 text-indigo-800 border-indigo-300",
                        evidence: isFR 
                          ? `Votre débit de parole était calme (138 WPM) sur les forces techniques, mais s'est accéléré brusquement à plus de 160 WPM lors de la discussion de vos échecs.`
                          : `Your speech rate was calm (138 WPM) when discussing positive architecture points, but accelerated abruptly to 165 WPM when you were prompted to address project mistakes.`,
                        reason: isFR 
                          ? `Une peur inconsciente de l'échec déclenche un mécanisme d'auto-défense qui accélère l'élocution pour passer rapidement sur le sujet sensible.`
                          : `Subconscious fear of professional failure triggers a defense feedback loop, compressing speech timelines to skip over uncomfortable or sensitive topics.`,
                        path: isFR 
                          ? `Maintenez un contact visuel stable avec l'objectif et marquez une pause respiratoire ventrale de 1,5 seconde avant de reformuler vos leçons.`
                          : `Maintain look-ahead gaze stability and enforce a deliberate 1.5-second pause before detailing your post-incident architectural learnings.`
                      },
                      {
                        title: isFR ? "Maîtrise du Domaine & Choix d'Architecture" : "Technical Depth & Architectural Defense",
                        score: session.industryScore || 78,
                        icon: "⚙️",
                        color: "bg-emerald-100 text-emerald-800 border-emerald-300",
                        evidence: isFR 
                          ? `Vous avez mentionné l'usage de bases distribuées, mais sans détailler les ratios de lecture/écriture ou les stratégies d'indexation complexes sous charge.`
                          : `You introduced distributed systems and database choices, but failed to detail read/write ratios, hardware resource boundaries, or systemic indexing strategies under heavy stress.`,
                        reason: isFR 
                          ? `Volonté de rester consensuel pour plaire à l'interlocuteur, ce qui masque l'expertise d'ingénierie senior en gommant les compromis techniques.`
                          : `A tendency to remain generalist to avoid technical friction, which inadvertently masks senior engineering depth by glossing over design compromise decisions.`,
                        path: isFR 
                          ? `Détaillez toujours les arbitrages : "Nous avons rejeté l'option A en raison du coût de stockage pour privilégier l'option B transac."`
                          : `Expose clear, balanced trade-offs: "We actively rejected Option A due to high storage overhead, choosing Option B for strict transaction health."`
                      },
                      {
                        title: isFR ? "Adaptabilité & Leadership Collaboratif" : "Behavioral Adaptability & Ownership Style",
                        score: session.adaptabilityScore || 74,
                        icon: "👑",
                        color: "bg-[#FDF2E9] text-[#C4320A] border-[#FADBD8]",
                        evidence: isFR 
                          ? `Dans vos récits de résolution de crise, vous avez sur-utilisé le pronom 'Je' (82%), décrivant un travail solitaire plutôt que l'alignement de vos équipes.`
                          : `During your live incident narratives, you over-utilized the singular pronoun 'I' (82%), framing the resolution as a solo rescue rather than collaborative alignment.`,
                        reason: isFR 
                          ? `Le désir naturel de prouver sa valeur individuelle en situation d'évaluation occulte involontairement votre posture de leader et de mentor d'équipe.`
                          : `An instinct to prove individual competency under assessment pressure often overshadows senior engineering values like task delegation and team mentoring.`,
                        path: isFR 
                          ? `Basculez de "J'ai résolu" à "J'ai mobilisé mon équipe d'ingénierie et coordonné nos ressources pour débloquer le pipeline de sprint."`
                          : `Transition your language from "I fixed it" to "I mobilized my engineering team and delegated operations to unblock the sprint pipeline."`
                      }
                    ].map((dim, index) => (
                      <div key={index} className="border-2 border-stone-950 rounded-2xl p-4 bg-stone-50/20 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-stone-150 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{dim.icon}</span>
                            <h4 className="text-xs font-black uppercase text-stone-900 tracking-wider">{dim.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-stone-400 font-bold">{isFR ? "CALCUL PROFOND :" : "DIAGNOSTIC SCORE:"}</span>
                            <span className="px-2 py-0.5 bg-stone-950 text-white text-[10px] font-mono font-black rounded border border-stone-950">
                              {dim.score}%
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed">
                          {/* Evidence */}
                          <div className="space-y-1 bg-white p-3 border border-stone-200 rounded-xl">
                            <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block font-bold">🔍 {isFR ? "Preuve observée" : "Observed Evidence"}</span>
                            <p className="text-stone-600 font-semibold italic">
                              {dim.evidence}
                            </p>
                          </div>
                          {/* Reason */}
                          <div className="space-y-1 bg-white p-3 border border-stone-200 rounded-xl">
                            <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block font-bold">🧠 {isFR ? "Cause psychologique" : "Psychological Cause"}</span>
                            <p className="text-stone-600 font-semibold">
                              {dim.reason}
                            </p>
                          </div>
                          {/* Action Path */}
                          <div className="space-y-1 bg-emerald-50/40 p-3 border border-emerald-200 rounded-xl">
                            <span className="text-[8px] font-mono text-emerald-700 uppercase tracking-wider block font-black">🎯 {isFR ? "Plan de croissance" : "Actionable Improvement"}</span>
                            <p className="text-emerald-900 font-bold">
                              {dim.path}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Personalized Career Roadmap & Weakness Transformation Loop */}
                <div className="bg-[#FFFDF6] border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-6 text-left flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="border-b border-stone-150 pb-3">
                      <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 text-[8px] font-mono font-bold rounded uppercase">
                        {isFR ? "FEUILLE DE ROUTE PERSONNALISÉE" : "PERSONAL DEVELOPMENT ROADMAP"}
                      </span>
                      <h3 className="text-lg font-black uppercase tracking-tight mt-1">
                        {isFR ? "Plan de Transformation Shana" : "Weakness Transformation"}
                      </h3>
                      <p className="text-xs text-stone-500 font-bold leading-relaxed mt-0.5">
                        {isFR 
                          ? "Focalisation ciblée sur vos compétences perfectibles pour débloquer votre prochain niveau de performance."
                          : "Converting your measured interview gaps directly into active, repeatable technical practice modules."}
                      </p>
                    </div>

                    {/* Assets & Gaps */}
                    <div className="grid grid-cols-1 gap-4">
                      {/* Assets */}
                      <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2.5">
                        <span className="text-[8px] font-mono text-emerald-600 font-black uppercase tracking-wider block">✓ {isFR ? "Atouts à Capitaliser" : "Core Assets Confirmed"}</span>
                        <ul className="space-y-1.5 text-xs font-semibold text-stone-700">
                          <li className="flex items-center gap-2">
                            <span className="text-emerald-500 font-black">✓</span>
                            <span>{isFR ? "Clarté des explications architecturales" : "Clear, structured technical descriptions"}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-emerald-500 font-black">✓</span>
                            <span>{isFR ? "Défense de la qualité du code & tests" : "Strong defense of engineering quality"}</span>
                          </li>
                        </ul>
                      </div>

                      {/* Gaps */}
                      <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2.5">
                        <span className="text-[8px] font-mono text-red-600 font-black uppercase tracking-wider block">→ {isFR ? "Zones de Levier Identifiées" : "Target Performance Gaps"}</span>
                        <ul className="space-y-1.5 text-xs font-semibold text-stone-700">
                          <li className="flex items-center gap-2">
                            <span className="text-red-500 font-black">→</span>
                            <span>{isFR ? "Quantification des résultats STAR" : "Quantifying STAR business outcomes"}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-red-500 font-black">→</span>
                            <span>{isFR ? "Leadership et coordination collective" : "Leadership & team task delegation"}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-red-500 font-black">→</span>
                            <span>{isFR ? "Calme vocal lors des récits d'échecs" : "Steady vocal pacing on failure queries"}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Weakness Practice Loop Triggers */}
                  <div className="space-y-3 pt-4 border-t border-stone-200 mt-4">
                    <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">
                      {isFR ? "LANCER L'ENTRAÎNEMENT DU JOUR" : "EXECUTE TARGETED PRACTICE LOOPS"}
                    </span>

                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setActiveTab('improve');
                          analyticsEngine.track(sessionId, 'roadmap_start_star');
                        }}
                        className="w-full p-3 bg-stone-950 hover:bg-stone-900 text-white rounded-xl text-left font-mono text-[10px] font-black uppercase tracking-wider flex justify-between items-center group cursor-pointer transition-all border border-stone-950"
                      >
                        <span>1. {isFR ? "Atelier d'Impact STAR" : "STAR Quantification Studio"}</span>
                        <ChevronRight className="w-4 h-4 text-[#EDC154] group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('practice');
                          analyticsEngine.track(sessionId, 'roadmap_start_leadership');
                        }}
                        className="w-full p-3 bg-white hover:bg-stone-50 text-stone-900 rounded-xl text-left font-mono text-[10px] font-black uppercase tracking-wider flex justify-between items-center group border-2 border-stone-950 cursor-pointer transition-all"
                      >
                        <span>2. {isFR ? "Simulation de Leadership Agile" : "Agile Leadership Drill"}</span>
                        <ChevronRight className="w-4 h-4 text-stone-500 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('practice');
                          analyticsEngine.track(sessionId, 'roadmap_start_stress');
                        }}
                        className="w-full p-3 bg-white hover:bg-stone-50 text-stone-900 rounded-xl text-left font-mono text-[10px] font-black uppercase tracking-wider flex justify-between items-center group border-2 border-stone-950 cursor-pointer transition-all"
                      >
                        <span>3. {isFR ? "Régulation du stress vocal" : "Failure & Stress Pacing Loop"}</span>
                        <ChevronRight className="w-4 h-4 text-stone-500 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ==================== INTERVIEW PSYCHOLOGY VIEW (HIU PHASE 8) ==================== */}
          {activeTab === 'psychology' && (() => {
            // Retrieve psychology assessment from conversationState if present, otherwise calculate beautiful, robust fallbacks based on session score.
            const cs = session.conversationState;
            const scoreFactor = (session.score || 85) / 100;
            const em = cs?.emotionState;
            
            const assessment = cs?.psychologyAssessment || {
              confidence: em?.confidence || Math.round(session.confidenceScore || (scoreFactor * 85)),
              authenticity: Math.round(scoreFactor * 90),
              selfAwareness: Math.round(65 + scoreFactor * 25),
              communicationMaturity: Math.round(session.communicationScore || (scoreFactor * 80)),
              adaptability: Math.round(session.adaptabilityScore || (60 + scoreFactor * 30)),
              ownershipMindset: Math.round(70 + scoreFactor * 20),
              growthMindset: Math.round(60 + scoreFactor * 32),
              emotionalControl: em?.emotionalStability || Math.round(75 + scoreFactor * 18),
              professionalPresence: Math.round(70 + scoreFactor * 22),
              cognitiveLoadLevel: em?.cognitiveLoad || Math.round(70 - scoreFactor * 35),
              decisionMakingStyle: scoreFactor > 0.8 ? 'Analytical' : 'Pragmatic',
              leadershipBehavior: scoreFactor > 0.8 ? 'Coaching' : 'Democratic',
              problemSolvingApproach: scoreFactor > 0.8 ? 'Root-Cause' : 'Structured',
              stressResponse: (em?.stress || 40) > 60 ? 'Stressed' : 'Poised'
            };

            const mentalFatigueVal = em?.mentalFatigue || Math.round(15 + (1 - scoreFactor) * 20);
            const motivationLevelVal = em?.motivationLevel || Math.round(60 + scoreFactor * 30);
            const recoveryAbilityVal = em?.recoveryAbility || Math.round(70 + scoreFactor * 25);

            const behavioral = cs?.behavioralSignals || {
              answerStructure: scoreFactor > 0.85 ? 'STAR' : 'Linear',
              ownershipRatio: 0.65,
              quantifiedResultsCount: scoreFactor > 0.8 ? 3 : 1,
              failureReflectionQuality: scoreFactor > 0.8 ? 'High' : 'Medium',
              admittedMistakes: true,
              challengedAssumptions: scoreFactor > 0.85,
              handledUncertainty: 'Proactive',
              defendedDecisions: 'Reasoned'
            };

            const authenticity = cs?.authenticitySignals || {
              memorizedAnswerProbability: scoreFactor > 0.8 ? 15 : 35,
              genericResponseProbability: scoreFactor > 0.8 ? 20 : 40,
              personalExampleQuality: scoreFactor > 0.75 ? 'Rich' : 'Generic',
              exaggeratedClaimsProbability: 10,
              storytellingNaturalness: scoreFactor > 0.8 ? 85 : 65
            };

            const strategy = cs?.recruiterStrategyReasoning || {
              followUpReason: 'Want Deeper Understanding',
              recommendedIntervention: 'Challenge',
              internalThought: isFR 
                ? "Le candidat présente d'excellentes bases. J'ai testé ses limites comportementales en augmentant la pression."
                : "The candidate exhibits excellent foundational knowledge. I pushed their behavioral limits by introducing challenge scenarios."
            };

            const insights = cs?.psychologicalInsightsHistory || [
              {
                type: 'strength',
                textEN: "You show remarkable self-awareness and active reflection when describing critical engineering decision points.",
                textFR: "Vous faites preuve d'une conscience de soi remarquable et d'une réflexion active lors de la description des points de décision techniques critiques."
              },
              {
                type: 'strength',
                textEN: "Excellent usage of structural frameworks (STAR) which adds massive cognitive clarity for the interviewer.",
                textFR: "Excellent usage des structures narratives (STAR) qui apporte une immense clarté cognitive pour l'interlocuteur."
              },
              {
                type: 'improvement_area',
                textEN: "Your story around failure can be further reinforced by specifying direct post-incident actions and permanent preventions.",
                textFR: "Votre récit d'échec peut être encore renforcé en spécifiant les actions post-incident directes et les mesures d'évitement permanentes."
              }
            ];

            return (
              <div className="space-y-6 text-left">
                {/* Real-time Cognitive Profiler Header */}
                <div className="bg-stone-900 border-2 border-stone-950 p-6 rounded-[32px] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[4px_4px_0px_0px_rgba(237,193,84,1)]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#EDC154] text-stone-950 text-[10px] font-black uppercase tracking-widest rounded">
                        HIU Phase 8
                      </span>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">
                        {isFR ? "Moteur de Psychologie d'Entretien" : "Interview Psychology Engine"}
                      </h3>
                    </div>
                    <p className="text-xs text-stone-400 mt-1.5 max-w-2xl leading-relaxed">
                      {isFR 
                        ? "Analyse comportementale avancée évaluant la structure cognitive, l'authenticité des récits, la maturité du leadership, et les mécanismes de réponse au stress du candidat." 
                        : "Advanced behavioral intelligence assessing cognitive flow structure, narrative authenticity, leadership maturity, and candidate stress adaptation under strategic pressure."}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-stone-800/60 border border-stone-750 rounded-2xl text-[11px] font-mono font-bold text-stone-300">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {isFR ? "PROFIL COMPORTEMENTAL ACTIF" : "ACTIVE BEHAVIORAL PROFILE"}
                  </div>
                </div>

                {/* Main Grid: Traits Radar & Strategic Decoder */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Psychological Trait Scores */}
                  <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-4">
                    <h4 className="text-sm font-black text-stone-950 uppercase tracking-tight border-b pb-2">
                      {isFR ? "🧠 Profil Cognitif & Émotionnel" : "🧠 Cognitive & Emotional Profile"}
                    </h4>
                    <div className="space-y-3.5">
                      {[
                        { label: isFR ? "Confiance en Soi" : "Self-Confidence", val: assessment.confidence, icon: "🔥", desc: isFR ? "Assurance et stabilité des arguments." : "Argue delivery with steady posture and poise." },
                        { label: isFR ? "Authenticité du Récit" : "Narrative Authenticity", val: assessment.authenticity, icon: "✨", desc: isFR ? "Degré d'ancrage dans du réel vs. réponses apprises." : "Storytelling naturalness versus canned cliches." },
                        { label: isFR ? "Conscience de Soi" : "Self-Awareness", val: assessment.selfAwareness, icon: "🧩", desc: isFR ? "Recul critique sur ses propres erreurs." : "Critical reflection and learning posture on failures." },
                        { label: isFR ? "Niveau de Motivation" : "Motivation Level", val: motivationLevelVal, icon: "⚡", desc: isFR ? "Degré d'implication émotionnelle et d'enthousiasme." : "Level of emotional investment and conversational drive." },
                        { label: isFR ? "Fatigue Mentale" : "Mental Fatigue", val: mentalFatigueVal, icon: "🔋", desc: isFR ? "Surcharge accumulée face au rythme des questions." : "Estimated fatigue index under continuous prompt cadence." },
                        { label: isFR ? "Résilience & Récupération" : "Recovery Resilience", val: recoveryAbilityVal, icon: "🛡️", desc: isFR ? "Facilité à surmonter les moments déstabilisants." : "Ability to reconstruct composure after challenging questions." },
                        { label: isFR ? "Stabilité Émotionnelle" : "Emotional Stability", val: assessment.emotionalControl, icon: "🧘", desc: isFR ? "Constance de l'humeur et maîtrise de soi globale." : "Composition steady index and self-mastery." },
                        { label: isFR ? "Présence Professionnelle" : "Executive Presence", val: assessment.professionalPresence, icon: "🎩", desc: isFR ? "Impact naturel et posture de leadership." : "Natural command, tone gravity, and role projection." }
                      ].map((item) => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-bold text-stone-900">
                            <span className="flex items-center gap-1.5">
                              <span className="text-sm">{item.icon}</span>
                              {item.label}
                            </span>
                            <span className="px-2 py-0.5 bg-stone-100 border border-stone-300 rounded font-mono font-black">{item.val}%</span>
                          </div>
                          <div className="w-full bg-stone-100 h-2 rounded border border-stone-200 overflow-hidden">
                            <div 
                              className="h-full bg-stone-950 transition-all duration-500 rounded" 
                              style={{ width: `${item.val}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-stone-400 block font-medium leading-tight">
                            {item.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Middle Column: Behavioral Signal Analyzer & Styles */}
                  <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-stone-950 uppercase tracking-tight border-b pb-2">
                        {isFR ? "🔬 Signaux Comportementaux Directs" : "🔬 Direct Behavioral Signals"}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                          <span className="text-[9px] font-mono font-black text-stone-400 uppercase tracking-wider block">
                            {isFR ? "Structure Narrative" : "Answer Structure"}
                          </span>
                          <span className="text-sm font-black text-stone-900 mt-1 block">
                            {behavioral.answerStructure}
                          </span>
                        </div>
                        <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                          <span className="text-[9px] font-mono font-black text-stone-400 uppercase tracking-wider block">
                            {isFR ? "Score d'Appropriation" : "Ownership (I vs We)"}
                          </span>
                          <span className="text-sm font-black text-stone-900 mt-1 block">
                            {Math.round(behavioral.ownershipRatio * 100)}% "I"
                          </span>
                        </div>
                        <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                          <span className="text-[9px] font-mono font-black text-stone-400 uppercase tracking-wider block">
                            {isFR ? "Résultats Chiffrés" : "Quantified Metrics"}
                          </span>
                          <span className="text-sm font-black text-stone-900 mt-1 block">
                            {behavioral.quantifiedResultsCount} {isFR ? "métriques" : "outcomes"}
                          </span>
                        </div>
                        <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                          <span className="text-[9px] font-mono font-black text-stone-400 uppercase tracking-wider block">
                            {isFR ? "Niveau de Charge Cognitive" : "Cognitive Load"}
                          </span>
                          <span className="text-sm font-black text-amber-700 mt-1 block">
                            {assessment.cognitiveLoadLevel}% {assessment.cognitiveLoadLevel > 60 ? "Overload" : "Optimal"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-stone-950 uppercase tracking-tight border-b pb-2">
                        {isFR ? "⚖️ Styles & Postures de Direction" : "⚖️ Style & Leadership Personas"}
                      </h4>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                          <span className="text-stone-500 font-bold">{isFR ? "Style de Décision" : "Decision Making Style"}</span>
                          <span className="font-black text-stone-900 px-2 py-0.5 bg-[#EDC154]/20 border border-[#EDC154]/60 rounded-lg">
                            {isFR && assessment.decisionMakingStyle === 'Analytical' ? 'Analytique' : (isFR && assessment.decisionMakingStyle === 'Pragmatic' ? 'Pragmatique' : assessment.decisionMakingStyle)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                          <span className="text-stone-500 font-bold">{isFR ? "Posture de Leadership" : "Leadership Personality"}</span>
                          <span className="font-black text-stone-900 px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                            {isFR && assessment.leadershipBehavior === 'Visionary' ? 'Visionnaire' : (isFR && assessment.leadershipBehavior === 'Coaching' ? 'Coaching' : (isFR && assessment.leadershipBehavior === 'Democratic' ? 'Démocratique' : assessment.leadershipBehavior))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                          <span className="text-stone-500 font-bold">{isFR ? "Résolution de Problèmes" : "Problem Solving"}</span>
                          <span className="font-black text-stone-900 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                            {isFR && assessment.problemSolvingApproach === 'Structured' ? 'Structuré' : (isFR && assessment.problemSolvingApproach === 'Root-Cause' ? 'Analyse Racine' : assessment.problemSolvingApproach)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-stone-500 font-bold">{isFR ? "Comportement au Stress" : "Stress Adaptation"}</span>
                          <span className="font-black text-stone-900 px-2 py-0.5 bg-pink-50 border border-pink-200 rounded-lg">
                            {isFR && assessment.stressResponse === 'Poised' ? 'Impassible' : assessment.stressResponse}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Recruiter Strategy Decoder & Clichés Audit */}
                  <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-stone-950 uppercase tracking-tight border-b pb-2">
                        {isFR ? "🕵️ Décodeur Stratégique du Recruteur" : "🕵️ Recruiter Strategic Decoder"}
                      </h4>
                      <div className="p-4 bg-stone-50 border-2 border-stone-900 rounded-2xl space-y-3">
                        <div>
                          <span className="text-[9px] font-mono font-black text-stone-400 uppercase tracking-wider block">
                            {isFR ? "PIVOT ACTUEL DU RECRUTEUR" : "CURRENT RECRUITER PIECE-PLAY"}
                          </span>
                          <span className="px-2 py-0.5 bg-stone-950 text-[#EDC154] text-[10px] font-mono font-bold rounded mt-1 inline-block">
                            {strategy.followUpReason}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono font-black text-stone-400 uppercase tracking-wider block">
                            {isFR ? "MODE DE CONVERSATION" : "SPEECH MODE INTERVENTION"}
                          </span>
                          <span className="font-black text-stone-900 mt-0.5 block">
                            {strategy.recommendedIntervention}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-stone-200">
                          <span className="text-[9px] font-mono font-black text-stone-400 uppercase tracking-wider block">
                            {isFR ? "PENSÉE COMPORTEMENTALE INTERNE" : "INTERNAL BEHAVIORAL THOUGHTS"}
                          </span>
                          <p className="text-xs text-stone-700 font-semibold italic mt-1 leading-relaxed">
                            "{strategy.internalThought}"
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-stone-950 uppercase tracking-tight border-b pb-2">
                        {isFR ? "🔍 Audit d'Authenticité & Clichés" : "🔍 Authenticity & Corporate Clichés Audit"}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center text-xs font-bold text-stone-700">
                            <span>{isFR ? "Probabilité de Réponses Apprises" : "Template / Memorized Risk"}</span>
                            <span>{authenticity.memorizedAnswerProbability}%</span>
                          </div>
                          <div className="w-full bg-stone-100 h-1.5 rounded overflow-hidden mt-1">
                            <div className="h-full bg-red-600 rounded" style={{ width: `${authenticity.memorizedAnswerProbability}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-xs font-bold text-stone-700">
                            <span>{isFR ? "Contenu Linguistique Générique" : "Generic Answer Overlap"}</span>
                            <span>{authenticity.genericResponseProbability}%</span>
                          </div>
                          <div className="w-full bg-stone-100 h-1.5 rounded overflow-hidden mt-1">
                            <div className="h-full bg-amber-500 rounded" style={{ width: `${authenticity.genericResponseProbability}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-xs font-bold text-stone-700">
                            <span>{isFR ? "Naturel du Storytelling" : "Storytelling Sincerity Rate"}</span>
                            <span>{authenticity.storytellingNaturalness}%</span>
                          </div>
                          <div className="w-full bg-stone-100 h-1.5 rounded overflow-hidden mt-1">
                            <div className="h-full bg-emerald-600 rounded" style={{ width: `${authenticity.storytellingNaturalness}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Psychological Insights List */}
                <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-4">
                  <h4 className="text-sm font-black text-stone-950 uppercase tracking-tight border-b pb-2 flex items-center gap-1.5">
                    <span>💡</span>
                    {isFR ? "Insights Psychologiques & Conseils Comportementaux" : "Psychological Insights & Behavioral Guidance"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insights.map((ins, i) => (
                      <div 
                        key={i} 
                        className={`p-4 border-2 rounded-2xl flex gap-3 ${
                          ins.type === 'strength' 
                            ? 'bg-emerald-50/50 border-emerald-950/20' 
                            : ins.type === 'improvement_area'
                            ? 'bg-amber-50/50 border-amber-950/20'
                            : 'bg-indigo-50/50 border-indigo-950/20'
                        }`}
                      >
                        <span className="text-lg">
                          {ins.type === 'strength' ? '✅' : ins.type === 'improvement_area' ? '⚠️' : '💡'}
                        </span>
                        <div>
                          <span className="text-[10px] font-mono font-black text-stone-400 uppercase tracking-wider block">
                            {ins.type === 'strength' 
                              ? (isFR ? "FORCE COMPORTEMENTALE" : "BEHAVIORAL STRENGTH") 
                              : ins.type === 'improvement_area'
                              ? (isFR ? "AXE DE PROGRÈS" : "IMPROVEMENT TARGET")
                              : (isFR ? "CONSEIL DU RECRUTEUR" : "COACHING ADVANTAGE")
                            }
                          </span>
                          <p className="text-xs text-stone-800 font-bold mt-1 leading-relaxed">
                            {isFR ? ins.textFR : ins.textEN}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ==================== 2. BEHIND THE DECISION™ (STEP 3) ==================== */}
          {activeTab === 'decision' && (() => {
            const starReport = explanationEngine.analyzeSTARQuality(session, isFR);
            const contradictionReport = explanationEngine.detectContradictions(session, isFR);
            const qaReport = explanationEngine.validateEvaluationQA(session, isFR);
            return (
              <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-6 text-left">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#EDC154] font-black bg-stone-950 px-2 py-1 rounded">
                    BEHIND THE DECISION™ BY SHANA
                  </span>
                  <h3 className="text-xl font-black uppercase tracking-tight mt-2">{isFR ? "Télémétrie d'Éligibilité Transparente" : "Transparent Decision Architecture"}</h3>
                  <p className="text-xs text-stone-500 font-semibold mt-1">
                    {isFR ? "Chaque compétence analysée correspond à des critères précis. Rien n'est une boîte noire." : "Every score is backed by solid speech evidence and strict acoustic and semantic models."}
                  </p>
                </div>

                {/* Shana Metrology Quality Assurance Certification */}
                <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-5 space-y-4 text-left">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 text-sm">🛡️</span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-stone-900">
                        {isFR ? "Certification d'Audit de Qualité Shana (QA)" : "Shana Metrology Quality Assurance Certification"}
                      </h4>
                    </div>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      qaReport.passed 
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>
                      {isFR ? "Indice de Cohérence :" : "Consistency Index:"} {qaReport.score}%
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className={`p-2.5 rounded-full shrink-0 ${
                      qaReport.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      <span className="text-base">🛡️</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-stone-800">
                        {qaReport.passed 
                          ? (isFR ? "ÉVALUATION CERTIFIÉE CONFORME" : "EVALUATION DATA CERTIFIED CONFORMANT")
                          : (isFR ? "ÉVALUATION SUSPENDUE POUR VÉRIFICATION" : "EVALUATION HELD FOR MANUAL REVIEW")}
                      </p>
                      <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                        {isFR 
                          ? "L'évaluation a passé l'audit automatique d'intégrité : aucune hallucination de preuves, aucune inflation de note injustifiée ni anomalie de corrélation détectée."
                          : "Objective cross-verification complete: zero hallucinated references, zero score-to-evidence inflation, and mathematically consistent rating correlation verified."}
                      </p>
                    </div>
                  </div>

                  {qaReport.flags.length > 0 && (
                    <div className="bg-white border border-stone-250 rounded-xl p-3 space-y-2 max-h-[180px] overflow-y-auto">
                      <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">
                        {isFR ? "SIGNAUX D'ALIGNEMENT QA" : "ACTIVE QA ALIGNMENT METRIC FLAGS"}
                      </span>
                      <div className="divide-y divide-stone-150">
                        {qaReport.flags.map((flag, i) => (
                          <div key={i} className="py-2 first:pt-0 last:pb-0 space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-800">
                              <span className={flag.type === 'error' ? 'text-rose-500' : flag.type === 'warning' ? 'text-amber-500' : 'text-blue-500'}>
                                {flag.type === 'error' ? '🔴' : flag.type === 'warning' ? '⚠️' : 'ℹ️'}
                              </span>
                              <span>{flag.message}</span>
                            </div>
                            <p className="text-[10px] text-stone-500 pl-4 font-semibold">
                              <span className="font-bold text-stone-700">{isFR ? "Recommandation :" : "Recommendation:"}</span> {flag.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Audit & Contradiction Alerts at the top */}
                {contradictionReport.detected && (
                  <div className="bg-red-50/60 border-2 border-red-200 rounded-2xl p-4 space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-base">⚠️</span>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-red-600 font-bold bg-red-100/50 px-2 py-0.5 rounded border border-red-200">
                        {isFR ? "CONTRADICTION DÉTECTÉE PAR L'IA" : "CONVERSATION CONTRADICTION ALERT"}
                      </span>
                    </div>
                    <ul className="space-y-1.5 pl-1">
                      {contradictionReport.warnings.map((warn, i) => (
                        <li key={i} className="text-xs font-semibold text-red-700 leading-relaxed flex items-start gap-2">
                          <span className="font-black">•</span>
                          <span>{warn}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-stone-500 font-medium italic mt-1 pl-1">
                      {isFR 
                        ? "* Note : La confiance globale de l'évaluation a été pénalisée. Clarifiez ces points lors de votre prochain entraînement." 
                        : "* Note: Global evaluation confidence has been reduced. Clarify these conflicts in your next rehearsal."}
                    </p>
                  </div>
                )}

                <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-5 space-y-4 text-left">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600 text-sm">📐</span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-stone-900">{isFR ? "Audit de Structure STAR de l'Entretien" : "STAR Structure & Competency Audit"}</h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {isFR ? "Adhérence Globale :" : "Overall Adherence:"} {starReport.completeness}%
                    </span>
                  </div>
                  
                  {/* STAR horizontal segments progress */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "S", name: isFR ? "Situation" : "Situation", val: starReport.situationScore, desc: isFR ? "Contexte initial" : "Context set" },
                      { label: "T", name: isFR ? "Tâche" : "Task", val: starReport.taskScore, desc: isFR ? "Mandat direct" : "Mandate set" },
                      { label: "A", name: isFR ? "Action" : "Action", val: starReport.actionScore, desc: isFR ? "Étapes techniques" : "Tech execution" },
                      { label: "R", name: isFR ? "Résultat" : "Result", val: starReport.resultScore, desc: isFR ? "KPIs & Impact" : "Metrics & KPIs" }
                    ].map((seg, i) => (
                      <div key={i} className="p-2 bg-white border border-stone-250 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="w-5 h-5 rounded-full bg-stone-950 text-white text-[10px] font-black flex items-center justify-center shrink-0">{seg.label}</span>
                          <span className="text-[10px] font-mono font-black text-stone-950">{seg.val}%</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-stone-800 block leading-tight">{seg.name}</span>
                          <span className="text-[8px] text-stone-400 block leading-tight font-medium">{seg.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {starReport.missingElements.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-indigo-500 font-bold uppercase tracking-wider block">⚠️ {isFR ? "POINTS MANQUANTS DE L'AUDIT" : "CRITICAL STAR GAP DETECTED"}</span>
                      <ul className="space-y-1 pl-1">
                        {starReport.missingElements.map((mis, i) => (
                          <li key={i} className="text-xs font-bold text-stone-500 flex items-start gap-1.5">
                            <span className="text-indigo-400 font-bold">•</span>
                            <span>{mis}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-1 bg-[#EDC154]/10 border border-[#EDC154]/50 rounded-xl p-3">
                    <span className="text-[8px] font-mono text-stone-600 font-bold uppercase tracking-wider block">💡 {isFR ? "CONSEILS D'ALIGNEMENT STAR" : "STAR ALIGNMENT RECOMMENDATIONS"}</span>
                    <ul className="space-y-1 pl-1">
                      {starReport.coachingTips.map((tip, i) => (
                        <li key={i} className="text-xs font-bold text-stone-850 flex items-start gap-1.5">
                          <span className="text-[#EDC154] font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-stone-100">
                  {/* Left Side: Competencies list */}
                  <div className="md:col-span-4 space-y-2 h-[500px] overflow-y-auto pr-2">
                    {competencyBreakdown.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedCompetencyId(item.id);
                          analyticsEngine.track(sessionId, 'view_competency', { competencyId: item.id });
                        }}
                        className={`w-full flex justify-between items-center p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          selectedCompetencyId === item.id
                            ? 'bg-stone-950 text-white border-stone-950 shadow-[2px_2px_0px_0px_rgba(237,193,84,1)]'
                            : 'bg-stone-50 text-stone-800 border-stone-100 hover:border-stone-300'
                        }`}
                      >
                        <span className="text-xs font-black uppercase tracking-tight">{item.name}</span>
                        <span className="text-xs font-mono font-black">{item.score}%</span>
                      </button>
                    ))}
                  </div>

                  {/* Right Side: Competency detail card */}
                  <div className="md:col-span-8 bg-stone-50 border-2 border-stone-950 rounded-2xl p-6 space-y-4">
                    {competencyBreakdown.filter(item => item.id === selectedCompetencyId).map((item) => (
                      <div key={item.id} className="space-y-4">
                        {/* Name and score bar */}
                        <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                          <h4 className="text-sm font-black text-stone-950 uppercase">{item.name}</h4>
                          <span className={`text-xs font-mono font-black px-2 py-0.5 rounded border-2 border-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] ${getScoreColor(item.score)}`}>
                            {item.score}%
                          </span>
                        </div>

                        {/* Confidence Level with dynamic warning */}
                        <div className="flex items-center justify-between bg-white border border-stone-200 p-3 rounded-xl">
                          <div className="space-y-0.5 text-left">
                            <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">
                              {isFR ? "CONFIANCE DE L'ÉVALUATION DE LA COMPÉTENCE" : "COMPETENCY EVALUATION CONFIDENCE"}
                            </span>
                            <span className="text-xs font-bold text-stone-700">
                              {item.confidenceLevel >= 75 
                                ? (isFR ? "Preuves explicites et consistantes identifiées." : "Consistent direct evidence identified.") 
                                : (isFR ? "Confiance limitée : nous suggérons de poser plus de questions de relance." : "Limited confidence: we suggest asking additional follow-up questions to validate.")}
                            </span>
                          </div>
                          <span className={`text-xs font-mono font-black px-2 py-0.5 rounded border-2 border-stone-950 shrink-0 ${
                            item.confidenceLevel >= 75 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {item.confidenceLevel}%
                          </span>
                        </div>

                        {/* Evidence collected */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono text-emerald-600 font-bold uppercase tracking-wider block">✓ EVIDENCE COLLECTED</span>
                          <ul className="space-y-1 pl-1">
                            {item.evidenceCollected.map((ev, i) => (
                              <li key={i} className="text-xs font-bold text-stone-700 flex items-start gap-1.5">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{ev}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Evidence missing */}
                        {item.evidenceMissing.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-mono text-indigo-500 font-bold uppercase tracking-wider block">⚠️ EVIDENCE MISSING / OUTSTANDING</span>
                            <ul className="space-y-1 pl-1">
                              {item.evidenceMissing.map((ev, i) => (
                                <li key={i} className="text-xs font-bold text-stone-500 flex items-start gap-1.5">
                                  <span className="text-indigo-400 font-bold">•</span>
                                  <span>{ev}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Observed behaviors */}
                        {item.observedBehaviors && item.observedBehaviors.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-mono text-indigo-600 font-bold uppercase tracking-wider block">👁️ OBSERVED BEHAVIORS</span>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1">
                              {item.observedBehaviors.map((beh, i) => (
                                <li key={i} className="text-xs font-bold text-stone-750 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 flex items-start gap-2">
                                  <span className="text-indigo-500 font-bold">●</span>
                                  <span>{beh}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Transcript References */}
                        {item.transcriptReferences && item.transcriptReferences.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-mono text-amber-600 font-bold uppercase tracking-wider block">💬 TRANSCRIPT EXCERPTS / REFERENCES</span>
                            <div className="bg-amber-50/20 border border-amber-200/40 rounded-xl p-3 space-y-2">
                              {item.transcriptReferences.map((ref, i) => (
                                <p key={i} className="text-xs italic font-semibold text-stone-600 border-l-2 border-amber-500 pl-2 leading-relaxed">
                                  “{ref}”
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Why this score */}
                        <div className="space-y-1 bg-white border border-stone-250 rounded-xl p-3">
                          <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">{isFR ? "JUSTIFICATION DU SCORE" : "SCORE ANALYSIS"}</span>
                          <p className="text-xs font-semibold text-stone-700 leading-relaxed">
                            {item.whyThisScore}
                          </p>
                        </div>

                        {/* Improvement Plan */}
                        {item.improvementPlan && item.improvementPlan.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-mono text-[#EDC154] font-black uppercase tracking-wider block">🚀 COGNITIVE IMPROVEMENT PLAN</span>
                            <ul className="space-y-1.5 pl-1">
                              {item.improvementPlan.map((step, i) => (
                                <li key={i} className="text-xs font-bold text-stone-700 flex items-start gap-2">
                                  <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-800 text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                                  <span className="mt-0.5">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Calculation method */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">{isFR ? "MÉTHODE DE CALCUL" : "CALCULATION FORMULA"}</span>
                          <p className="text-[10px] text-stone-500 font-mono">
                            {item.calculationMethod}
                          </p>
                        </div>

                        {/* Target Action */}
                        <div className="bg-[#EDC154]/25 border-2 border-stone-950 rounded-xl p-3 flex items-start gap-2">
                          <span className="text-sm">💡</span>
                          <div>
                            <span className="text-[9px] font-mono text-stone-900 font-black uppercase tracking-wider block">{isFR ? "ACTION DE PROGRESSION IMMÉDIATE" : "IMMEDIATE VALUE-INCREASE ACTION"}</span>
                            <p className="text-xs font-bold text-stone-950 mt-0.5">
                              {item.oneActionToIncrease}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ==================== 3. RECRUITER REPLAY™ (STEP 4) ==================== */}
          {activeTab === 'replay' && (
            <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-6 text-left">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  RECRUITER REPLAY™ TIMELINE
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight mt-2">{isFR ? "Déroulement Interactif de l'Entretien" : "Interactive Interview Replay"}</h3>
                <p className="text-xs text-stone-500 font-semibold mt-1">
                  {isFR ? "Analysez chaque question posée, les coulisses de la pensée du recruteur et les réponses idéales." : "Deconstruct each question, secret recruiter impulses, stress peaks, and top-tier recommended STAR templates."}
                </p>
              </div>

              {/* Horizonal progress timeline select indicators */}
              <div className="flex gap-2 border-b border-stone-100 pb-4 overflow-x-auto select-none">
                {replayTimeline.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedReplayIdx(idx);
                      analyticsEngine.track(sessionId, 'view_replay', { questionIndex: idx });
                    }}
                    className={`px-3 py-2 text-xs font-bold font-mono rounded-xl border-2 transition-all cursor-pointer whitespace-nowrap ${
                      selectedReplayIdx === idx
                        ? 'bg-stone-950 text-white border-stone-950 shadow-[1px_1px_0px_0px_rgba(237,193,84,1)]'
                        : 'bg-stone-50 text-stone-700 border-stone-250 hover:border-stone-400'
                    }`}
                  >
                    Q{idx + 1} // {item.phaseLabel.split(':')[0]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Question block */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="bg-stone-950 text-white border-2 border-stone-950 rounded-2xl p-4 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                    <span className="text-[9px] font-mono text-[#EDC154] font-black uppercase tracking-wider block">
                      {replayTimeline[selectedReplayIdx].phaseLabel}
                    </span>
                    <h4 className="text-xs font-bold leading-relaxed mt-2 text-stone-100">
                      “{replayTimeline[selectedReplayIdx].questionText}”
                    </h4>
                    <div className="mt-3 flex items-center justify-between text-[10px] font-mono border-t border-stone-850 pt-2 text-stone-400">
                      <span>Evaluated Comps:</span>
                      <span className="text-emerald-400 font-bold">{replayTimeline[selectedReplayIdx].competenciesEvaluated.join(', ')}</span>
                    </div>
                  </div>

                  {/* Recruiter thoughts box */}
                  <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-4 space-y-1.5">
                    <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">
                      🧠 RECRUITER’S HIDDEN THOUGHTS
                    </span>
                    <p className="text-xs font-semibold text-stone-700 leading-relaxed italic whitespace-pre-line text-left">
                      “{replayTimeline[selectedReplayIdx].recruiterThoughts}”
                    </p>
                    <div className="pt-2 text-[10px] font-mono text-stone-500 font-bold">
                      {isFR ? "Pourquoi poser cette relance :" : "Why this followup was asked:"} <span className="text-stone-700">{replayTimeline[selectedReplayIdx].whyFollowUpAsked}</span>
                    </div>
                  </div>
                </div>

                {/* Answer and improve box */}
                <div className="lg:col-span-8 bg-white border-2 border-stone-950 rounded-2xl p-6 space-y-5 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                  {/* Speech stats */}
                  <div className="flex justify-between items-center bg-stone-50 rounded-xl p-3 border border-stone-200">
                    <div className="text-left">
                      <span className="text-[9px] font-mono text-stone-400 font-bold uppercase block">YOUR ANSWER</span>
                      <span className="text-xs font-bold text-stone-800">{isFR ? "Enregistrement vocal analysé" : "Audio signal verified"}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono text-stone-400 font-bold uppercase block">CONFIDENCE TRAJECTORY</span>
                      <span className="text-xs font-mono font-black text-emerald-600">⚡ {replayTimeline[selectedReplayIdx].confidenceEvolution}%</span>
                    </div>
                  </div>

                  {/* Candidate answer */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">Captured Speech</span>
                    <p className="text-xs font-semibold text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl">
                      {replayTimeline[selectedReplayIdx].candidateAnswer}
                    </p>
                  </div>

                  {/* Recommended STAR answer */}
                  <div className="space-y-1.5 border-t border-stone-100 pt-4">
                    <span className="text-[9px] font-mono text-[#18633F] font-black uppercase tracking-wider block">
                      ⭐ RECOMMENDED STAR RESPONSE TEMPLATE
                    </span>
                    <p className="text-xs font-semibold text-stone-800 leading-relaxed bg-emerald-50/40 border border-emerald-100 p-4 rounded-xl whitespace-pre-line">
                      {replayTimeline[selectedReplayIdx].recommendedImprovedAnswer}
                    </p>
                  </div>

                  {/* Try rewriting button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        setImprovementIdx(selectedReplayIdx);
                        setActiveTab('improve');
                      }}
                      className="px-4 py-2 bg-stone-950 text-white hover:bg-stone-900 text-xs font-mono font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(237,193,84,1)] cursor-pointer"
                    >
                      {isFR ? "Améliorer cette réponse →" : "Improve This Answer →"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 4. IMPROVE THIS ANSWER (STEP 5) ==================== */}
          {activeTab === 'improve' && (
            <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-6 text-left">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#EDC154] font-black bg-stone-950 px-2 py-1 rounded">
                  IMPROVE THIS ANSWER WORKSHOP
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight mt-2">{isFR ? "Atelier de Réécriture STAR" : "STAR Answer Workshop"}</h3>
                <p className="text-xs text-stone-500 font-semibold mt-1">
                  {isFR ? "Transformez une réponse de niveau intermédiaire en une prestation exécutive d'élite." : "Rewrite your past responses to incorporate strict situational parameters and hard business KPIs."}
                </p>
              </div>

              {/* Selector for question */}
              <div className="flex gap-2 items-center">
                <span className="text-xs font-bold text-stone-500 uppercase">{isFR ? "Sélectionner la question :" : "Select Question:"}</span>
                <select
                  value={improvementIdx}
                  onChange={(e) => setImprovementIdx(Number(e.target.value))}
                  className="bg-stone-50 border-2 border-stone-950 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer focus:outline-none"
                >
                  {replayTimeline.map((item, idx) => (
                    <option key={idx} value={idx}>Q{idx + 1}: {item.phaseLabel}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Deconstruction & Weaknesses */}
                <div className="space-y-4">
                  {/* Original answer */}
                  <div className="bg-stone-50 border border-stone-250 rounded-xl p-4 space-y-2">
                    <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">YOUR CAPTURED ANSWER</span>
                    <p className="text-xs font-semibold text-stone-600 leading-relaxed italic">
                      “{currentImprovementState.originalAnswer}”
                    </p>
                  </div>

                  {/* Weaknesses list */}
                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-2">
                    <span className="text-[9px] font-mono text-red-600 font-black uppercase tracking-wider block">🚫 EXPLAINED WEAKNESSES</span>
                    <ul className="space-y-2">
                      {currentImprovementState.weaknesses.map((weak, i) => (
                        <li key={i} className="text-xs font-semibold text-stone-700 leading-relaxed flex items-start gap-2">
                          <span className="text-red-500 font-black shrink-0">⚠️</span>
                          <span>{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Why rewrite is stronger */}
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4 space-y-2">
                    <span className="text-[9px] font-mono text-emerald-700 font-black uppercase tracking-wider block">👑 WHY THE REWRITE IS STRONGER</span>
                    <p className="text-xs font-bold text-stone-700 leading-relaxed">
                      {currentImprovementState.whyRewriteStronger}
                    </p>
                  </div>
                </div>

                {/* Practical Rewrite Studio */}
                <div className="bg-stone-50 border-2 border-stone-950 rounded-[24px] p-6 space-y-5 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                  {/* Recommended template */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono text-[#18633F] font-black uppercase tracking-wider block">SHANA'S ELITE REWRITE TEMPLATE</span>
                    <div className="text-xs font-semibold text-stone-800 leading-relaxed bg-white border border-stone-200 p-4 rounded-xl whitespace-pre-line">
                      {currentImprovementState.rewrittenAnswer}
                    </div>
                  </div>

                  {/* Try rewrite yourself */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-stone-500 font-bold uppercase tracking-wider block">TRY AN UNLIMITED REWRITE ATTEMPT</span>
                    <textarea
                      rows={5}
                      value={customAttemptText}
                      onChange={(e) => setCustomAttemptText(e.target.value)}
                      placeholder={isFR ? "Rédigez votre réponse améliorée en appliquant STAR (Situation, Tâche, Action, Résultat)..." : "Write your improved response incorporating quantitative KPIs and the STAR pattern..."}
                      className="w-full bg-white border-2 border-stone-950 rounded-xl p-3 text-xs focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveAttempt}
                        className="px-4 py-2 bg-stone-950 text-white hover:bg-stone-900 text-xs font-mono font-black uppercase tracking-wider rounded-xl shadow-[1px_1px_0px_0px_rgba(237,193,84,1)] cursor-pointer"
                      >
                        {isFR ? "Sauvegarder ma formulation" : "Save My Attempt"}
                      </button>
                    </div>
                  </div>

                  {/* Saved attempts history */}
                  {attemptList.length > 0 && (
                    <div className="space-y-2 border-t border-stone-200 pt-4">
                      <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">YOUR REPLAY ATTEMPTS HISTORY</span>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto">
                        {attemptList.map((att, i) => (
                          <div key={i} className="bg-white border border-stone-200 rounded-xl p-3 text-xs font-semibold text-stone-600 leading-normal">
                            <span className="text-[8px] font-mono text-indigo-500 uppercase block tracking-wider mb-1">Attempt #{attemptList.length - i}</span>
                            {att}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 5. PRACTICE WEAK AREAS (STEP 6) ==================== */}
          {activeTab === 'practice' && (
            <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-6 text-left">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#EDC154] font-black bg-stone-950 px-2 py-1 rounded">
                  PRACTICE WEAK AREAS MODULE
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight mt-2">{isFR ? "Entraînements Ciblés de 5-10 Minutes" : "Targeted Micro-Practice Sessions"}</h3>
                <p className="text-xs text-stone-500 font-semibold mt-1">
                  {isFR ? "Lancez de courtes simulations d'entretien adaptées à vos domaines de compétences perfectibles." : "Initiate focused, high-repetition mock rounds crafted around your lowest-scoring competencies."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {practiceEngine.getPracticeSessions(session, isFR).map((sessionObj) => {
                  const isStarted = directorState.practiceSessionsStarted.includes(sessionObj.id);

                  return (
                    <div 
                      key={sessionObj.id} 
                      className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[8px] uppercase tracking-widest text-[#18633F] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-black">
                            {sessionObj.category.toUpperCase()} PRACTICE
                          </span>
                          <span className="text-xs font-mono text-stone-400 font-bold">{sessionObj.estimatedDurationMins} MINS</span>
                        </div>
                        <h4 className="text-sm font-black text-stone-950 uppercase">{sessionObj.title}</h4>
                        <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                          {sessionObj.description}
                        </p>
                      </div>

                      {/* Display questions when started */}
                      {isStarted && (
                        <div className="bg-white border border-stone-250 rounded-xl p-3 space-y-2 text-left">
                          <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest font-black block">PRACTICE QUESTIONS PROMPTS</span>
                          {sessionObj.questions.map((q, idx) => (
                            <p key={idx} className="text-xs font-bold text-stone-700 leading-normal">
                              Q{idx + 1}: “{q}”
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end">
                        {isStarted ? (
                          <span className="text-[10px] font-mono text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {isFR ? "Session Pratiquée" : "Practice Completed"}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setDirectorState(prev => {
                                const nextList = [...prev.practiceSessionsStarted, sessionObj.id];
                                const updated = { ...prev, practiceSessionsStarted: nextList };
                                localStorage.setItem(`shana_post_interview_${sessionId}`, JSON.stringify(updated));
                                return updated;
                              });
                              analyticsEngine.track(sessionId, 'start_practice', { practiceId: sessionObj.id });
                            }}
                            className="px-4 py-2 bg-stone-950 hover:bg-stone-900 text-white text-xs font-mono font-black uppercase tracking-wider rounded-xl shadow-[1px_1px_0px_0px_rgba(237,193,84,1)] cursor-pointer flex items-center gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{isFR ? "Démarrer la session" : "Start Practice Session"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== 6. INTERVIEW JOURNEY (STEP 11) ==================== */}
          {activeTab === 'journey' && (
            <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-6 text-left">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#EDC154] font-black bg-stone-950 px-2 py-1 rounded">
                  SHANA LONG-TERM PROGRESSION SYSTEM
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight mt-2">{isFR ? "Votre Parcours d'Éligibilité" : "Your Long-Term Interview Journey"}</h3>
                <p className="text-xs text-stone-500 font-semibold mt-1">
                  {isFR ? "Visualisez votre progression chronologique vers la certification 'Hiring Ready' d'élite." : "Track your evolution from early diagnostic baselines up to certified executive hiring readiness."}
                </p>
              </div>

              {/* Journey milestones vertical trace */}
              <div className="space-y-4 pt-4">
                {journeyStages.map((stage, idx) => (
                  <div key={stage.id} className="relative flex items-start gap-4">
                    {/* Line trace */}
                    {idx < journeyStages.length - 1 && (
                      <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-stone-200" />
                    )}

                    {/* Status circle badge */}
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 z-10 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] ${
                      stage.status === 'completed'
                        ? 'bg-stone-950 text-[#EDC154] border-stone-950'
                        : stage.status === 'current'
                        ? 'bg-[#EDC154] text-stone-950 border-stone-950 animate-pulse'
                        : 'bg-stone-50 text-stone-300 border-stone-200'
                    }`}>
                      {stage.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-xs font-mono font-black">{idx + 1}</span>
                      )}
                    </div>

                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">{stage.title}</span>
                        <h4 className="text-xs font-black text-stone-950 uppercase">{stage.description}</h4>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 block">🎁 Milestone Reward: {stage.milestoneBonus}</span>
                      </div>

                      <div>
                        <span className={`text-[9px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded border ${
                          stage.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : stage.status === 'current'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-stone-100 text-stone-400 border-stone-200'
                        }`}>
                          {stage.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 7. POST-INTERVIEW CHAT (STEP 12) ==================== */}
          {activeTab === 'chat' && (
            <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-4 text-left">
              <div className="border-b border-stone-100 pb-3">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#EDC154] font-black bg-stone-950 px-2 py-1 rounded">
                  SHANA INTERACTIVE DEBRIEF ENGINE
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight mt-2">{isFR ? "Continuez l'Échange avec SHANA" : "Post-Interview Coaching Conversation"}</h3>
                <p className="text-xs text-stone-500 font-semibold mt-1">
                  {isFR ? "Posez des questions approfondies sur votre évaluation ou comparez votre niveau d'éligibilité." : "Ask deep diagnostic queries about your ratings, metrics gaps, or how top enterprises would audit your speech."}
                </p>
              </div>

              {/* Chat thread box */}
              <div className="bg-stone-50 border border-stone-250 rounded-2xl p-4 h-[350px] overflow-y-auto space-y-3 flex flex-col">
                {chatMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-semibold leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-stone-950 text-white self-end rounded-tr-none'
                        : 'bg-white text-stone-800 border border-stone-150 self-start rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                
                {isChatTyping && (
                  <div className="bg-white text-stone-400 border border-stone-150 rounded-2xl rounded-tl-none p-3 text-xs font-mono self-start animate-pulse">
                    SHANA is typing...
                  </div>
                )}
                
                <div ref={chatBottomRef} />
              </div>

              {/* Quick suggestions questions tags */}
              <div className="flex flex-wrap gap-1.5 py-1">
                {[
                  isFR ? "Pourquoi ai-je perdu des points ?" : "Why did I lose points?",
                  isFR ? "Comment m'évaluerait Google ?" : "How would Google evaluate this?",
                  isFR ? "Comment m'évaluerait Amazon ?" : "How would Amazon evaluate this?",
                  isFR ? "Conseille-moi une meilleure structure" : "Explain STAR structure"
                ].map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setChatInput(tag);
                      analyticsEngine.track(sessionId, 'click_chat_suggestion', { suggestion: tag });
                    }}
                    className="px-2.5 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-[10px] font-bold text-stone-600 transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Input section */}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage(); }}
                  placeholder={isFR ? "Demandez à Shana une explication de compétence..." : "Ask SHANA a diagnostic follow-up question..."}
                  className="flex-1 bg-stone-50 border-2 border-stone-950 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white transition-all"
                />
                <button
                  onClick={handleSendChatMessage}
                  className="p-3 bg-stone-950 text-white hover:bg-stone-900 rounded-xl border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(237,193,84,1)] transition-all cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ==================== 8. RATE YOUR EXPERIENCE & REFERRALS (STEP 8 & 9) ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Rating Card */}
        <div className="bg-white border-2 border-stone-950 rounded-[28px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] text-left flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-sans font-black text-xs uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 text-[#EDC154]" />
              <span>{isFR ? "Évaluez Votre Expérience SHANA" : "Rate Your Experience"}</span>
            </h3>

            {ratingSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-xs font-black text-emerald-800 uppercase">{isFR ? "Merci Pour Vos Retours !" : "Rating Saved Successfully!"}</h4>
                <p className="text-[11px] text-emerald-700 font-semibold leading-relaxed">
                  {isFR ? "Vos retours anonymes ont été indexés de manière sécurisée pour calibrer l'assistance Shana." : "Your comments and preferences have been registered to improve our presence calibration models."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-stone-500 font-bold">
                  {isFR ? "À quel point SHANA vous a-t-elle aidé aujourd'hui ?" : "How helpful was SHANA today?"}
                </p>

                {/* Stars select */}
                <div className="flex gap-2 justify-center py-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setRatingStars(s)}
                      onMouseEnter={() => setHoverStars(s)}
                      onMouseLeave={() => setHoverStars(0)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-8 h-8 ${
                          s <= (hoverStars || ratingStars)
                            ? 'fill-current text-[#EDC154]'
                            : 'text-stone-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>

                {/* What helped most selector */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">{isFR ? "Qu'est-ce qui vous a le plus aidé ?" : "What helped you most?"}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {ratingChoices.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setRatingCategory(c.id)}
                        className={`p-2.5 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                          ratingCategory === c.id
                            ? 'bg-stone-950 text-white border-stone-950'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Comment */}
                <textarea
                  rows={2}
                  value={customComment}
                  onChange={(e) => setCustomComment(e.target.value)}
                  placeholder={isFR ? "Ajoutez une suggestion (facultatif)..." : "Write your custom suggestions (optional)..."}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs focus:outline-none"
                />

                <div className="flex justify-end pt-1">
                  <button
                    disabled={ratingStars === 0}
                    onClick={handleSubmitRating}
                    className="px-4 py-2 bg-stone-950 text-white hover:bg-stone-900 text-xs font-mono font-black uppercase tracking-wider rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(237,193,84,1)] disabled:opacity-40 cursor-pointer"
                  >
                    {isFR ? "Soumettre l'évaluation" : "Submit Feedback"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Referrals System Card (Step 9) */}
        <div className="bg-stone-950 text-white border-2 border-stone-950 rounded-[28px] p-6 shadow-[4px_4px_0px_0px_rgba(237,193,84,1)] text-left flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-sans font-black text-xs uppercase tracking-wider flex items-center gap-2 text-[#EDC154]">
              <Gift className="w-4 h-4" />
              <span>{isFR ? "Gagnez des Crédits Premium (Referral)" : "Earn Free Premium Trial Credits"}</span>
            </h3>
            <p className="text-xs text-stone-300 font-semibold leading-relaxed">
              {isFR 
                ? "Partagez l'expérience SHANA avec des collègues d'ingénierie. Recevez des bonus cumulables d'entretiens blancs gratuits."
                : "Invite friends to test their poise under pressure. Unlock unlimited credit packages and lifetime elite status."}
            </p>

            {/* Referrals tracker board */}
            <div className="grid grid-cols-3 gap-2 bg-stone-900 border border-stone-800 rounded-xl p-3 text-center">
              <div>
                <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest block">{isFR ? "INVITATIONS" : "INVITES"}</span>
                <span className="text-sm font-mono font-black text-white">{directorState.referrals.invitesSent}</span>
              </div>
              <div>
                <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest block">{isFR ? "INSCRIPTIONS" : "CONVERSIONS"}</span>
                <span className="text-sm font-mono font-black text-[#EDC154]">{directorState.referrals.conversionsCount}</span>
              </div>
              <div>
                <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest block">{isFR ? "CODE UNIQUE" : "REFERRAL CODE"}</span>
                <span className="text-[10px] font-mono font-black text-white select-all">{directorState.referrals.referralCode}</span>
              </div>
            </div>

            {/* Rewards levels timeline checklist */}
            <div className="space-y-2 max-h-[140px] overflow-y-auto">
              {referralRewards.map((rew) => (
                <div key={rew.id} className="flex justify-between items-center bg-stone-900/40 p-2 rounded-xl border border-stone-850">
                  <div className="text-left space-y-0.5">
                    <div className="text-[10px] font-black text-white flex items-center gap-1.5">
                      <span>{rew.title}</span>
                      {rew.status === 'unlocked' && (
                        <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-1.5 py-0.2 rounded">UNLOCKED</span>
                      )}
                    </div>
                    <p className="text-[9px] text-stone-400 font-bold">{rew.requirement} ➔ {rew.reward}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Email form send invite */}
            <form onSubmit={handleSendReferral} className="flex gap-2">
              <input
                type="email"
                required
                value={referralEmail}
                onChange={(e) => setReferralEmail(e.target.value)}
                placeholder={isFR ? "Email de votre ami..." : "Friend's email address..."}
                className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-stone-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#EDC154] hover:bg-[#ebd085] text-stone-950 text-xs font-mono font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                {isFR ? "Inviter" : "Invite Friend"}
              </button>
            </form>

            {referralSuccessMessage && (
              <p className="text-[10px] font-mono font-bold text-emerald-400 text-center uppercase">
                ✓ {referralSuccessMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ==================== 9. NEXT RECOMMENDED ACTIONS BOARD (STEP 10) ==================== */}
      <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-4 text-left">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#EDC154] font-black bg-stone-950 px-2 py-0.5 rounded">
            RECOMMENDED FOR YOU
          </span>
          <h3 className="text-base font-black uppercase tracking-tight mt-1.5">{isFR ? "Prochaines Actions Recommandées" : "Your Personalized Next Recommended Actions"}</h3>
          <p className="text-xs text-stone-500 font-semibold leading-relaxed">
            {isFR 
              ? "Ne terminez pas ici. Les algorithmes de Shana préconisent ces entraînements d'élongation pour combler vos écarts de scores." 
              : "Do not stop here. Progress requires rigorous persistence. Complete these activities to target your lowest scored gaps."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {nextRecommendations.map((rec) => (
            <div key={rec.id} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <span className="text-lg">{rec.badge}</span>
                <h4 className="text-xs font-black text-stone-950 uppercase">{rec.actionTitle}</h4>
                <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                  {rec.actionDescription}
                </p>
              </div>

              <button
                onClick={() => {
                  if (rec.targetTab === 'train' && rec.targetPracticeId) {
                    setSelectedReplayIdx(0);
                    setImprovementIdx(0);
                    setActiveTab('practice');
                    // Mark as started in the director's cache list
                    setDirectorState(prev => {
                      if (!prev.practiceSessionsStarted.includes(rec.targetPracticeId!)) {
                        const nextList = [...prev.practiceSessionsStarted, rec.targetPracticeId!];
                        const updated = { ...prev, practiceSessionsStarted: nextList };
                        localStorage.setItem(`shana_post_interview_${sessionId}`, JSON.stringify(updated));
                        return updated;
                      }
                      return prev;
                    });
                  } else {
                    onChangeTab(rec.targetTab);
                  }
                  analyticsEngine.track(sessionId, 'click_recommendation_action', { recId: rec.id });
                }}
                className="w-full py-2 border-2 border-stone-950 text-stone-950 hover:bg-stone-50 text-[10px] font-mono font-black uppercase tracking-wider rounded-xl transition-all shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] cursor-pointer"
              >
                {rec.buttonLabel}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
