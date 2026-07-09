import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Award, 
  Flame, 
  Trophy, 
  Sparkles, 
  TrendingUp, 
  Mic, 
  ArrowRight, 
  Zap, 
  Target, 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  Shield, 
  UserCheck, 
  ChevronRight,
  TrendingDown,
  Activity,
  Heart,
  Briefcase,
  GraduationCap,
  Search,
  Building,
  DollarSign,
  MapPin,
  Calendar,
  CheckSquare,
  ListTodo,
  XCircle
} from 'lucide-react';
import { CandidateProfileService } from '../lib/candidate/candidateProfile';
import { CandidateState, DigitalTwinCompetency } from '../lib/candidate/candidateState';
import { CoachingStrategyEngine } from '../lib/candidate/coachingStrategy';
import { motion } from 'motion/react';
import { StorageService } from '../lib/storage';
import EnterpriseCenter from './admin/enterprise/EnterpriseCenter';

interface CandidateBrainViewProps {
  userId: string;
  lang: 'EN' | 'FR';
  onChangeTab: (tab: any) => void;
}

export default function CandidateBrainView({ userId, lang, onChangeTab }: CandidateBrainViewProps) {
  const [profileState, setProfileState] = useState<CandidateState | null>(null);
  const [subTab, setSubTab] = useState<'cognitive' | 'career' | 'recruiter'>('cognitive');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('job_01');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('module_01');
  const [drillProgress, setDrillProgress] = useState<Record<string, 'not_started' | 'completed'>>(() => {
    try {
      const key = `shana_completed_drills_${userId}`;
      const completedList = JSON.parse(localStorage.getItem(key) || '[]');
      const initial: Record<string, 'not_started' | 'completed'> = {};
      completedList.forEach((dId: string) => {
        initial[dId] = 'completed';
      });
      return initial;
    } catch (e) {
      return {};
    }
  });
  const [simulationLoading, setSimulationLoading] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    const p = CandidateProfileService.getCandidateState(userId);
    setProfileState(p);
    if (p) {
      // Pull latest user performance data from Firestore dynamically to ensure feedback is evidence-based
      CoachingStrategyEngine.updateCoachingWithFirestoreData(userId, p)
        .then((updated) => {
          if (updated) {
            setProfileState({ ...p });
            CandidateProfileService.saveCandidateState(userId, p);
          }
        })
        .catch(err => {
          console.warn('[SHANA CandidateBrainView] Async Firestore coaching retrieval bypassed:', err);
        });

      const up = StorageService.getProfile(userId);
      const cvAnalysis = StorageService.getAnalysis(userId);
      const role = up?.targetRole || cvAnalysis?.role || '';
      const industry = up?.industry || cvAnalysis?.industry || '';
      const normInd = industry.toLowerCase();
      const normRole = role.toLowerCase();
      
      let cat = 'generic';
      if (
        normInd.includes("restaur") || normInd.includes("food") || normInd.includes("cater") || normInd.includes("hotel") ||
        normInd.includes("hospitality") || normInd.includes("culinary") || normInd.includes("chef") || normInd.includes("bistrot") ||
        normInd.includes("cafe") || normInd.includes("café") || normInd.includes("nourriture") || normInd.includes("salle") ||
        normRole.includes("restaurant") || normRole.includes("chef") || normRole.includes("cuisine") || normRole.includes("serveur")
      ) {
        cat = 'catering';
      } else if (
        normInd.includes("sale") || normInd.includes("retail") || normInd.includes("vente") || normInd.includes("commerce") ||
        normInd.includes("client") || normInd.includes("customer") || normInd.includes("vendeur") || normInd.includes("boutique") ||
        normInd.includes("magasin") || normInd.includes("commercial") || normInd.includes("nego") ||
        normRole.includes("vendeur") || normRole.includes("sales") || normRole.includes("retail") || normRole.includes("commercial")
      ) {
        cat = 'sales';
      } else if (
        normInd.includes("finan") || normInd.includes("bank") || normInd.includes("compt") || normInd.includes("assur") ||
        normInd.includes("banqu") || normInd.includes("audit") || normInd.includes("invest") || normInd.includes("accounting") ||
        normInd.includes("tax") || normInd.includes("bourse") || normRole.includes("comptable") || normRole.includes("cfo") ||
        normRole.includes("financ") || normRole.includes("auditeur")
      ) {
        cat = 'finance';
      } else if (
        normInd.includes("consult") || normInd.includes("conseil") || normInd.includes("strat") ||
        normRole.includes("consultant") || normRole.includes("advisor") || normRole.includes("conseiller")
      ) {
        cat = 'consulting';
      } else if (
        normInd.includes("health") || normInd.includes("pharma") || normInd.includes("biotech") || normInd.includes("medic") ||
        normInd.includes("sant") || normInd.includes("hopital") || normInd.includes("hospital") || normInd.includes("clin") ||
        normRole.includes("doctor") || normRole.includes("infirmier") || normRole.includes("pharmacien") || normRole.includes("médical")
      ) {
        cat = 'healthcare';
      } else if (
        normInd.includes("manufactur") || normInd.includes("auto") || normInd.includes("aerosp") || normInd.includes("indus") ||
        normInd.includes("production") || normInd.includes("usine") || normInd.includes("factory") || normInd.includes("renault") ||
        normInd.includes("peugeot") || normInd.includes("airbus") || normInd.includes("logis") || normInd.includes("transport") ||
        normInd.includes("supply") || normRole.includes("ingénieur") || normRole.includes("production") || normRole.includes("plant")
      ) {
        cat = 'manufacturing';
      } else if (
        normInd.includes("tech") || normInd.includes("software") || normInd.includes("saas") || normInd.includes("it") ||
        normInd.includes("telecom") || normInd.includes("cloud") || normInd.includes("developer") || normInd.includes("engineer") ||
        normInd.includes("code") || normInd.includes("architect") || normInd.includes("data") || normInd.includes("platform") ||
        normInd.includes("devops") || normInd.includes("cyber") || normRole.includes("developer") || normRole.includes("engineer") ||
        normRole.includes("architect") || normRole.includes("cto") || normRole.includes("product manager")
      ) {
        cat = 'tech';
      }

      let defaultTrack = '';
      if (cat === 'catering') defaultTrack = lang === 'FR' ? 'Manager de Restaurant' : 'Restaurant Manager';
      else if (cat === 'sales') defaultTrack = lang === 'FR' ? 'Responsable de Boutique' : 'Store Manager';
      else if (cat === 'finance') defaultTrack = lang === 'FR' ? 'Contrôleur de Gestion' : 'Financial Controller';
      else if (cat === 'consulting') defaultTrack = lang === 'FR' ? 'Consultant Strategy Senior' : 'Senior Strategy Consultant';
      else if (cat === 'healthcare') defaultTrack = lang === 'FR' ? 'Cadre de Santé / Coordinateur' : 'Nursing Supervisor';
      else if (cat === 'manufacturing') defaultTrack = lang === 'FR' ? 'Superviseur de Production' : 'Production Supervisor';
      else if (cat === 'tech') defaultTrack = lang === 'FR' ? 'Architecte Cloud / SRE' : 'Cloud Architect / SRE';
      else defaultTrack = lang === 'FR' ? 'Chef de Projet Senior' : 'Senior Project Manager';

      setSelectedTrack(p.memory.careerGoals || up?.targetRole || defaultTrack);
    }

    // Synchronize updates
    const handleUpdate = () => {
      const updated = CandidateProfileService.getCandidateState(userId);
      setProfileState(updated);
      try {
        const key = `shana_completed_drills_${userId}`;
        const completedList = JSON.parse(localStorage.getItem(key) || '[]');
        const initial: Record<string, 'not_started' | 'completed'> = {};
        completedList.forEach((dId: string) => {
          initial[dId] = 'completed';
        });
        setDrillProgress(initial);
      } catch (e) {
        console.error("Failed to reload completed drills", e);
      }
    };

    window.addEventListener('shana_candidate_state_update', handleUpdate);
    window.addEventListener('shana_progress_update', handleUpdate);

    return () => {
      window.removeEventListener('shana_candidate_state_update', handleUpdate);
      window.removeEventListener('shana_progress_update', handleUpdate);
    };
  }, [userId]);

  if (!profileState) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-stone-200 rounded-3xl p-8 shadow-xs">
        <Brain className="w-12 h-12 text-stone-300 animate-pulse mb-4" />
        <p className="text-sm text-stone-500 font-medium">
          {lang === 'FR' 
            ? "Génération du dossier apprenant intelligent..." 
            : "Compiling smart learner intelligence profile..."}
        </p>
      </div>
    );
  }

  const isFr = lang === 'FR';
  const {
    digitalTwin: rawDigitalTwin,
    communication: rawCommunication,
    confidence: rawConfidence,
    stress: rawStress,
    learning,
    behavioral: rawBehavioral,
    personality: rawPersonality,
    readiness: rawReadiness,
    coachingStrategy,
    improvementPlanner,
    memory,
    motivation,
    recommendations
  } = profileState;

  // Check if they have actually done any tests (only count real vocal simulations or voice training sessions)
  const baseHistory = StorageService.getHistory(userId) || [];
  let voiceSessions = [];
  try {
    const saved = localStorage.getItem(`shana_voice_sessions_${userId}`);
    if (saved) {
      voiceSessions = JSON.parse(saved);
    }
  } catch (e) {}
  
  const realHistory = baseHistory.filter(h => h && (h.type === 'ASSESS' || h.type === 'INTERVIEW' || h.type === 'TRAIN'));
  const hasCompletedSessions = realHistory.length > 0 || voiceSessions.length > 0;
  const totalCompletedCount = realHistory.length + voiceSessions.length;

  // Compute final variables used in view (keeping the exact same variable names!)
  const digitalTwin = { ...rawDigitalTwin };
  if (!hasCompletedSessions) {
    Object.keys(digitalTwin).forEach(key => {
      digitalTwin[key] = {
        ...digitalTwin[key],
        score: 0,
        confidence: 0,
        history: []
      };
    });
  }

  const communication = !hasCompletedSessions ? {
    ...rawCommunication,
    averageSpeakingSpeed: 0,
    vocabularyRichness: 0,
    sentenceStructure: 0,
    answerClarity: 0,
    conciseness: 0,
    fillerWordFrequency: 0,
    conversationFlow: 0,
    history: []
  } : rawCommunication;

  const confidence = !hasCompletedSessions ? {
    ...rawConfidence,
    beginningConfidence: 0,
    peakConfidence: 0,
    confidenceRecovery: 0,
    confidenceUnderPressure: 0,
    confidenceDuringTechnical: 0,
    trend: []
  } : rawConfidence;

  const stress = !hasCompletedSessions ? {
    ...rawStress,
    hesitations: 0,
    speechInterruptions: 0,
    longPauses: 0,
    rapidSpeechInstances: 0,
    emotionalRecovery: 0,
    pressureTolerance: 0,
    stressResilienceIndex: 0
  } : rawStress;

  const behavioral = !hasCompletedSessions ? {
    ...rawBehavioral,
    leadershipStyle: isFr ? 'Non Évalué' : 'Not Evaluated',
    ownershipIndex: 0,
    conflictManagementStyle: isFr ? 'Non Évalué' : 'Not Evaluated',
    decisionMakingStyle: isFr ? 'Non Évalué' : 'Not Evaluated',
    collaborationIndex: 0,
    initiativeIndex: 0,
    curiosityIndex: 0,
    professionalMaturity: 0
  } : rawBehavioral;

  const personality = !hasCompletedSessions ? {
    reserved: 0,
    analytical: 0,
    confident: 0,
    reflective: 0,
    collaborative: 0,
    assertive: 0,
    adaptive: 0
  } : rawPersonality;

  const readiness = !hasCompletedSessions ? {
    behavioralReadiness: { score: 0, explanation: isFr ? 'Aucune simulation d\'entretien comportemental effectuée pour le moment. / No behavioral interview simulation completed yet.' : 'No behavioral interview simulation completed yet.' },
    technicalReadiness: { score: 0, explanation: isFr ? 'Aucune question technique validée pour le moment. / No technical questions validated yet.' : 'No technical questions validated yet.' },
    leadershipReadiness: { score: 0, explanation: isFr ? 'Aucun indicateur de leadership enregistré pour le moment. / No leadership indicators recorded yet.' : 'No leadership indicators recorded yet.' },
    executiveReadiness: { score: 0, explanation: isFr ? 'Aucune présentation exécutive évaluée pour le moment. / No executive presentation evaluated yet.' : 'No executive presentation evaluated yet.' },
    companyReadiness: { score: 0, explanation: isFr ? 'Alignement entreprise en attente d\'évaluation. / Company alignment pending evaluation.' : 'Company alignment pending evaluation.' },
    overallHiringReadiness: { score: 0, explanation: isFr ? 'Réalisez votre première simulation pour activer et calibrer votre indice d\'embauche global. / Start your first simulation to calibrate your overall readiness index.' : 'Start your first simulation to calibrate your overall readiness index.' }
  } : rawReadiness;

  // Best competency
  const twinArray = Object.values(digitalTwin) as DigitalTwinCompetency[];
  const topCompetency = twinArray.length > 0 
    ? [...twinArray].sort((a, b) => b.score - a.score)[0] 
    : null;

  // Progress to targets
  const averageCompetencyScore = twinArray.length > 0 
    ? Math.round(twinArray.reduce((acc, curr) => acc + curr.score, 0) / twinArray.length) 
    : 0;

  // Unlocked milestones
  const unlockedCount = !hasCompletedSessions ? 0 : motivation.milestones.filter(m => m.unlockedAt).length;
  const streakCount = !hasCompletedSessions ? 0 : motivation.streakCount;

  // Load CV and Profile to generate hyper-personalized suggestions
  const userProfile = StorageService.getProfile(userId);
  const cvAnalysis = StorageService.getAnalysis(userId);

  const role = userProfile?.targetRole || cvAnalysis?.role || (isFr ? "Candidat" : "Candidate");
  const industry = userProfile?.industry || cvAnalysis?.industry || (isFr ? "Technologie" : "Technology");
  const skills = cvAnalysis?.skills || [];
  const risks = cvAnalysis?.risks || [];
  const strengths = cvAnalysis?.strengths || [];

  const normInd = industry.toLowerCase();
  const normRole = role.toLowerCase();

  let category: 'catering' | 'sales' | 'finance' | 'consulting' | 'healthcare' | 'manufacturing' | 'tech' | 'generic' = 'generic';

  if (
    normInd.includes("restaur") || normInd.includes("food") || normInd.includes("cater") || normInd.includes("hotel") ||
    normInd.includes("hospitality") || normInd.includes("culinary") || normInd.includes("chef") || normInd.includes("bistrot") ||
    normInd.includes("cafe") || normInd.includes("café") || normInd.includes("nourriture") || normInd.includes("salle") ||
    normRole.includes("restaurant") || normRole.includes("chef") || normRole.includes("cuisine") || normRole.includes("serveur")
  ) {
    category = 'catering';
  } else if (
    normInd.includes("sale") || normInd.includes("retail") || normInd.includes("vente") || normInd.includes("commerce") ||
    normInd.includes("client") || normInd.includes("customer") || normInd.includes("vendeur") || normInd.includes("boutique") ||
    normInd.includes("magasin") || normInd.includes("commercial") || normInd.includes("nego") ||
    normRole.includes("vendeur") || normRole.includes("sales") || normRole.includes("retail") || normRole.includes("commercial")
  ) {
    category = 'sales';
  } else if (
    normInd.includes("finan") || normInd.includes("bank") || normInd.includes("compt") || normInd.includes("assur") ||
    normInd.includes("banqu") || normInd.includes("audit") || normInd.includes("invest") || normInd.includes("accounting") ||
    normInd.includes("tax") || normInd.includes("bourse") || normRole.includes("comptable") || normRole.includes("cfo") ||
    normRole.includes("financ") || normRole.includes("auditeur")
  ) {
    category = 'finance';
  } else if (
    normInd.includes("consult") || normInd.includes("conseil") || normInd.includes("strat") ||
    normRole.includes("consultant") || normRole.includes("advisor") || normRole.includes("conseiller")
  ) {
    category = 'consulting';
  } else if (
    normInd.includes("health") || normInd.includes("pharma") || normInd.includes("biotech") || normInd.includes("medic") ||
    normInd.includes("sant") || normInd.includes("hopital") || normInd.includes("hospital") || normInd.includes("clin") ||
    normRole.includes("doctor") || normRole.includes("infirmier") || normRole.includes("pharmacien") || normRole.includes("médical")
  ) {
    category = 'healthcare';
  } else if (
    normInd.includes("manufactur") || normInd.includes("auto") || normInd.includes("aerosp") || normInd.includes("indus") ||
    normInd.includes("production") || normInd.includes("usine") || normInd.includes("factory") || normInd.includes("renault") ||
    normInd.includes("peugeot") || normInd.includes("airbus") || normInd.includes("logis") || normInd.includes("transport") ||
    normInd.includes("supply") || normRole.includes("ingénieur") || normRole.includes("production") || normRole.includes("plant")
  ) {
    category = 'manufacturing';
  } else if (
    normInd.includes("tech") || normInd.includes("software") || normInd.includes("saas") || normInd.includes("it") ||
    normInd.includes("telecom") || normInd.includes("cloud") || normInd.includes("developer") || normInd.includes("engineer") ||
    normInd.includes("code") || normInd.includes("architect") || normInd.includes("data") || normInd.includes("platform") ||
    normInd.includes("devops") || normInd.includes("cyber") || normRole.includes("developer") || normRole.includes("engineer") ||
    normRole.includes("architect") || normRole.includes("cto") || normRole.includes("product manager")
  ) {
    category = 'tech';
  }

  const getSkillsForCategory = (cat: typeof category, french: boolean) => {
    switch (cat) {
      case 'catering':
        return {
          s1: french ? "Standards HACCP & Hygiène" : "HACCP & Hygiene Standards",
          v1: digitalTwin.behavioral?.score || 65,
          s2: french ? "Communication & Clarté de Rush" : "Frontline Rush Communication",
          v2: digitalTwin.communication?.score || 60
        };
      case 'sales':
        return {
          s1: french ? "Performance Commerciale" : "Commercial Conversion",
          v1: digitalTwin.behavioral?.score || 65,
          s2: french ? "Gestion de Conflits Clients" : "Client Dispute Resolution",
          v2: digitalTwin.communication?.score || 60
        };
      case 'finance':
        return {
          s1: french ? "Analyses de Coûts & P&L" : "Cost Variance & P&L Analysis",
          v1: digitalTwin.behavioral?.score || 65,
          s2: french ? "Communication Executive (Soutenance)" : "Executive Board Reporting",
          v2: digitalTwin.communication?.score || 60
        };
      case 'consulting':
        return {
          s1: french ? "Cadrage de Mission & Scope" : "Engagement Scope Management",
          v1: digitalTwin.behavioral?.score || 65,
          s2: french ? "Présentation Client (Pitch)" : "Client Advisory Pitching",
          v2: digitalTwin.communication?.score || 60
        };
      case 'healthcare':
        return {
          s1: french ? "Qualité des Soins & Protocoles" : "Clinical Quality & Protocols",
          v1: digitalTwin.behavioral?.score || 65,
          s2: french ? "Médiation d'Équipe & Conflits" : "Staff De-escalation & Handover",
          v2: digitalTwin.communication?.score || 60
        };
      case 'manufacturing':
        return {
          s1: french ? "Sécurité HSE & Conformité" : "HSE Safety Compliance",
          v1: digitalTwin.behavioral?.score || 65,
          s2: french ? "TRS & Résolution d'Incidents" : "OEE Downtime Resolution",
          v2: digitalTwin.communication?.score || 60
        };
      case 'tech':
        return {
          s1: french ? "Leadership & Délégation" : "Leadership & Delegation",
          v1: digitalTwin.leadership?.score || 55,
          s2: french ? "Prise de Décision" : "Decision Making",
          v2: digitalTwin.decision_making?.score || 60
        };
      default:
        return {
          s1: french ? "Planification & Budget" : "Project Execution & Planning",
          v1: digitalTwin.behavioral?.score || 65,
          s2: french ? "Alignement d'Équipe & Reporting" : "Team Alignment & Briefs",
          v2: digitalTwin.communication?.score || 60
        };
    }
  };

  const getTracksForCategory = (cat: typeof category, french: boolean) => {
    switch (cat) {
      case 'catering':
        return [
          french ? 'Manager de Restaurant' : 'Restaurant Manager',
          french ? 'Directeur de Restauration' : 'Food & Beverage Director',
          french ? 'Chef de Cuisine / Gérant' : 'Head Chef / Kitchen Manager'
        ];
      case 'sales':
        return [
          french ? 'Responsable de Boutique' : 'Store Manager',
          french ? 'Directeur de Réseau' : 'Retail Area Manager',
          french ? 'Responsable Comptes Clés' : 'Key Account Manager'
        ];
      case 'finance':
        return [
          french ? 'Contrôleur de Gestion' : 'Financial Controller',
          french ? 'Directeur Financier' : 'Finance Director',
          french ? 'Auditeur Financier Senior' : 'Senior Financial Auditor'
        ];
      case 'consulting':
        return [
          french ? 'Consultant Strategy Senior' : 'Senior Strategy Consultant',
          french ? 'Manager de Cabinet' : 'Consulting Manager',
          french ? 'Consultant Organisation Senior' : 'Senior Advisory Consultant'
        ];
      case 'healthcare':
        return [
          french ? 'Cadre de Santé / Coordinateur' : 'Nursing Supervisor',
          french ? 'Directeur de Clinique Adjoint' : 'Assistant Healthcare Director',
          french ? 'Coordinateur Qualité' : 'Healthcare Risk Coordinator'
        ];
      case 'manufacturing':
        return [
          french ? 'Superviseur de Production' : 'Production Supervisor',
          french ? 'Responsable Amélioration Continue' : 'Continuous Improvement Manager',
          french ? 'Responsable Maintenance d\'Usine' : 'Plant Maintenance Manager'
        ];
      case 'tech':
        return [
          french ? 'Architecte Cloud / SRE' : 'Cloud Architect / SRE',
          french ? 'Développeur Front-End Senior' : 'Senior Front-End Dev',
          french ? 'Directeur Technique / CTO' : 'CTO / Director'
        ];
      default:
        return [
          french ? 'Chef de Projet Senior' : 'Senior Project Manager',
          french ? 'Directeur des Opérations Adjoint' : 'Assistant Operations Director',
          french ? 'Team Lead / Responsable d\'Équipe' : 'Team Lead / Operations Manager'
        ];
    }
  };

  const getCareerStepData = (cat: typeof category, track: string, french: boolean) => {
    const activeTrack = track || (french ? 'Expert' : 'Expert');
    
    switch (cat) {
      case 'catering':
        return {
          step1Title: french ? `Étape 1 : ${activeTrack} (Actuel)` : `Stage 1: ${activeTrack} (Current)`,
          step1Desc: french 
            ? "Maîtriser les standards d'hygiène (HACCP), la fluidité du service en période de rush et la communication directe avec l'équipe."
            : "Master food safety standards (HACCP), floor service fluidity during peak hours, and clear frontline team updates.",
          step2Title: french ? "Étape 2 : Directeur Adjoint / Manager de Restaurant" : "Stage 2: Assistant GM / Restaurant Manager",
          step2Desc: french
            ? "Piloter les ratios financiers (coût matière, masse salariale), optimiser les plannings d'équipes et arbitrer les litiges clients."
            : "Direct operations, manage prime cost ratios (COGS & labor hours), optimize shift rotations, and de-escalate guest complaints.",
          step3Title: french ? "Étape 3 : Directeur Multi-sites / Directeur de Restauration" : "Stage 3: Multi-Unit General Manager / F&B Director",
          step3Desc: french
            ? "Piloter la rentabilité de plusieurs établissements, négocier les contrats de fourniture régionaux et concevoir la stratégie d'innovation culinaire."
            : "Oversee multi-site P&L performances, negotiate enterprise supplier agreements, and design regional brand strategies.",
          drill1Title: french ? "🚨 Simulation de service en sous-effectif extrême" : "🚨 Extreme Understaffed Dinner Service Simulation",
          drill2Title: french ? "💼 Négociation fournisseur & réduction du coût matière" : "💼 Supplier Negotiation & Food Cost Reduction"
        };
      case 'sales':
        return {
          step1Title: french ? `Étape 1 : ${activeTrack} (Actuel)` : `Stage 1: ${activeTrack} (Current)`,
          step1Desc: french
            ? "Maîtriser l'accueil client premium, les indicateurs de vente individuelle (panier moyen, taux de conversion) et l'argumentaire de vente."
            : "Excel in luxury customer greeting, individual sales targets (average basket, conversion rate), and product pitch alignment.",
          step2Title: french ? "Étape 2 : Responsable de Boutique / Store Manager" : "Stage 2: Store Manager / Boutique Lead",
          step2Desc: french
            ? "Gérer le compte d'exploitation (P&L) du magasin, animer et motiver l'équipe de conseillers, orchestrer le visual merchandising."
            : "Manage complete store P&L ratios, motivate retail associates, structure visual merchandising, and monitor conversion metrics.",
          step3Title: french ? "Étape 3 : Directeur Régional / Directeur Commercial" : "Stage 3: Regional Sales Director / Area Manager",
          step3Desc: french
            ? "Superviser un réseau multi-boutiques, définir la politique tarifaire, recruter les responsables de magasins et négocier les baux commerciaux."
            : "Supervise regional store portfolios, set retail pricing policies, recruit managers, and negotiate commercial leases.",
          drill1Title: french ? "🚨 De-escalation d'un conflit client majeur en boutique" : "🚨 High-Tension Store Customer Conflict Resolution",
          drill2Title: french ? "💼 Justification d'écarts de CA devant le Directeur de Zone" : "💼 Defending Monthly Sales Gap to Area Director"
        };
      case 'finance':
        return {
          step1Title: french ? `Étape 1 : ${activeTrack} (Actuel)` : `Stage 1: ${activeTrack} (Current)`,
          step1Desc: french
            ? "Assurer la fiabilité absolue des écritures comptables, produire les rapports mensuels et analyser les écarts d'écritures."
            : "Ensure complete ledger accuracy, prepare monthly financial closes, and conduct first-level expense variance analyses.",
          step2Title: french ? "Étape 2 : Contrôleur de Gestion / CFO Adjoint" : "Stage 2: Financial Controller / Assistant CFO",
          step2Desc: french
            ? "Construire les budgets prévisionnels, auditer les coûts opérationnels complexes et soutenir les arbitrages de coûts devant les directions."
            : "Build financial forecasts, audit operational expenditures, and defend budget arbitrations to business unit leads.",
          step3Title: french ? "Étape 3 : Directeur Financier (CFO)" : "Stage 3: Chief Financial Officer (CFO)",
          step3Desc: french
            ? "Piloter la stratégie globale de financement, présenter les audits fiscaux au conseil d'administration et gérer les relations investisseurs."
            : "Formulate long-term funding strategies, present fiscal compliance reviews to the board, and lead investor relations.",
          drill1Title: french ? "🚨 Soutenance d'audit fiscal sous confrontation directe" : "🚨 Tax Audit Defense & Discrepancy Reconciliation",
          drill2Title: french ? "💼 Arbitrage de réduction budgétaire face aux directeurs" : "💼 Defending Cost-Cutting Budgets to Department Leads"
        };
      case 'consulting':
        return {
          step1Title: french ? `Étape 1 : ${activeTrack} (Actuel)` : `Stage 1: ${activeTrack} (Current)`,
          step1Desc: french
            ? "Réaliser des analyses quantitatives d'impact rigoureuses, produire des livrables sans défaut et mener des interviews clients."
            : "Execute rigorous quantitative analyses, produce polished client deliverables, and conduct user research interviews.",
          step2Title: french ? "Étape 2 : Manager de Mission / Principal" : "Stage 2: Engagement Manager / Principal",
          step2Desc: french
            ? "Cadrer le périmètre d'intervention (scope creep), encadrer les consultants juniors et assurer la rentabilité globale des missions."
            : "Delineate project boundaries (scope creep), mentor associate consultants, and drive engagement profitability ratios.",
          step3Title: french ? "Étape 3 : Associé / Directeur de Practice" : "Stage 3: Partner / Practice Director",
          step3Desc: french
            ? "Développer le portefeuille commercial du cabinet, porter les offres d'innovation clés et définir la vision d'expertise de la practice."
            : "Expand the firm's commercial portfolio, lead high-stakes innovation offerings, and define the strategic practice roadmap.",
          drill1Title: french ? "🚨 Cadrage diplomatique d'un dépassement de périmètre" : "🚨 Reframing Client Scope Creep & Extra Billing",
          drill2Title: french ? "💼 Pitch stratégique de réorientation de projet (3 Mins)" : "💼 3-Minute Strategic Project Realignment Pitch"
        };
      case 'healthcare':
        return {
          step1Title: french ? `Étape 1 : ${activeTrack} (Actuel)` : `Stage 1: ${activeTrack} (Current)`,
          step1Desc: french
            ? "Assurer la qualité des soins aux patients, respecter scrupuleusement les protocoles cliniques et gérer les transmissions médicales."
            : "Ensure top-tier patient care quality and compliance, strictly follow clinical protocols, and manage handover records.",
          step2Title: french ? "Étape 2 : Cadre de Santé / Coordinateur de Service" : "Stage 2: Nursing Supervisor / Health Coordinator",
          step2Desc: french
            ? "Coordonner les équipes soignantes, gérer l'allocation des lits et des effectifs sous tension et arbitrer les conflits familiaux ou soignants."
            : "Schedule care-giving shifts, coordinate complex multidisciplinary care tracks, and resolve staff and family disputes.",
          step3Title: french ? "Étape 3 : Directeur d'Établissement / Directeur de Clinique" : "Stage 3: Healthcare Facility Director / Chief Medical Officer",
          step3Desc: french
            ? "Piloter le budget de l'établissement (P&L), garantir la conformité absolue aux normes d'audit sanitaire HAS et porter la politique de soins."
            : "Manage facility operating budgets, guarantee public health audit compliance, and define clinical hospitality standards.",
          drill1Title: french ? "🚨 Gestion de crise de personnel soignant en garde de nuit" : "🚨 Staff Shortage & Nurse Allocation Under Pressure",
          drill2Title: french ? "💼 Soutenance de conformité lors d'une inspection sanitaire" : "💼 Sanitary Compliance Audit Defense & Correction"
        };
      case 'manufacturing':
        return {
          step1Title: french ? `Étape 1 : ${activeTrack} (Actuel)` : `Stage 1: ${activeTrack} (Current)`,
          step1Desc: french
            ? "Garantir le déroulement de la production en poste, veiller à l'application stricte des consignes HSE et piloter les indicateurs de ligne (TRS)."
            : "Manage shift production flows, monitor health & safety (HSE) compliance, and track line OEE metrics.",
          step2Title: french ? "Étape 2 : Responsable d'Atelier / Chef d'Unité de Production" : "Stage 2: Production Unit Manager / Workshop Leader",
          step2Desc: french
            ? "Mener des chantiers d'amélioration continue Lean (Kaizen, 5S, VSM), piloter les résolutions de pannes et manager les chefs d'équipes."
            : "Lead Lean continuous improvement projects (Kaizen, 5S), manage plant technician teams, and drive emergency line recovery.",
          step3Title: french ? "Étape 3 : Directeur d'Usine / Directeur Industriel" : "Stage 3: Plant Director / Operations Vice-President",
          step3Desc: french
            ? "Superviser la performance globale du site de production, arbitrer les investissements industriels (CAPEX) et gérer les relations sociales."
            : "Oversee overall industrial site performance, negotiate CAPEX budgets, and lead labor-union dialogs.",
          drill1Title: french ? "🚨 Gestion d'incident de sécurité & arrêt de chaîne" : "🚨 HSE Safety Outage & Root-Cause Mitigation",
          drill2Title: french ? "💼 Justification d'arrêt de ligne prolongé au CODIR" : "💼 Explaining Assembly Line Outages and Recovery Plans"
        };
      case 'tech':
        return {
          step1Title: french ? `Étape 1 : Expert Individuel (Actuel)` : `Stage 1: Senior Individual Contributor (Current)`,
          step1Desc: french
            ? "Démontrer une diction parfaite, un format STAR robuste (80%+) et des compétences techniques impeccables."
            : "Focusing on core engineering execution, stable speaking rate (130-150 WPM), and STAR story adherence.",
          step2Title: french ? "Étape 2 : Lead Engineer / Leader d'Équipe" : "Stage 2: Tech Lead / Architect (1-2 Years)",
          step2Desc: french
            ? "Prendre la responsabilité des échecs d'équipe, structurer les post-mortems critiques et déléguer des tâches concrètes."
            : "Developing team communication structures, crisis management, and explicit collaborative ownership frames.",
          step3Title: french ? "Étape 3 : Directeur Technique / CTO" : "Stage 3: Executive CTO / Director (3-5 Years)",
          step3Desc: french
            ? "Négociation face à des parties prenantes hostiles, formulation de visions stratégiques globales, communication de crise devant le conseil."
            : "Strategic organizational vision, board-level negotiation drills, and high-stakes media/crisis drills.",
          drill1Title: french ? "🚨 Simulation post-mortem de panne critique" : "🚨 Incident Post-Mortem & Stakeholder Response",
          drill2Title: french ? "💼 Délégation stratégique face aux retards de projet" : "💼 Strategic Resource Delegation & Escalation"
        };
      default:
        return {
          step1Title: french ? `Étape 1 : ${activeTrack} (Actuel)` : `Stage 1: ${activeTrack} (Current)`,
          step1Desc: french
            ? "Assurer la livraison des jalons de projet opérationnels, structurer les tâches quotidiennes et coordonner les actions d'équipe."
            : "Ensure stable operational milestone deliveries, structure daily workflow tasks, and coordinate team activities.",
          step2Title: french ? "Étape 2 : Responsable d'Équipe / Manager de Projet" : "Stage 2: Program Manager / Team Lead",
          step2Desc: french
            ? "Prendre la pleine responsabilité des résultats de l'équipe, arbitrer les priorités et dénouer les goulots d'étranglement de service."
            : "Take responsibility for team outcomes, balance operational priorities, and resolve workflow bottlenecks.",
          step3Title: french ? "Étape 3 : Directeur des Opérations / Executive" : "Stage 3: VP of Operations / General Manager",
          step3Desc: french
            ? "Définir la vision globale de l'organisation, porter la planification budgétaire pluriannuelle et assurer la gouvernance devant le Conseil."
            : "Establish organizational vision, execute corporate budget strategies, and lead executive-level governance.",
          drill1Title: french ? "🚨 Gestion de crise opérationnelle et retard de livraison" : "🚨 Project Crisis Handling & Critical Delay Mitigation",
          drill2Title: french ? "💼 Arbitrage de conflit d'équipe et médiation managériale" : "💼 Resolving High-Tension Team Disagreements"
        };
    }
  };

  const getDynamicJobs = (cat: typeof category, french: boolean, avgScore: number) => {
    switch (cat) {
      case 'catering':
        return [
          {
            id: 'job_01',
            title: french ? 'Directeur de Restaurant' : 'Restaurant General Manager',
            company: 'Grand Bistro Group',
            comp: french ? '45k€ - 55k€' : '$55k - $68k',
            loc: french ? 'Paris / Hybride' : 'Paris / Hybrid',
            match: Math.min(95, Math.max(45, avgScore + 4)),
            desc: french 
              ? "Piloter un restaurant de 120 places, diriger une équipe de 18 personnes (salle et cuisine) et garantir les standards HACCP et le coût matière." 
              : "Orchestrate high-volume floor operations, manage 18 FTEs, and secure optimal labor hours and guest satisfaction scores.",
            strengths: french 
              ? ["Excellente gestion de rush", "Rationnel financier robuste"] 
              : ["Floor leadership during peak-hour rush", "Clear operational metrics"],
            gaps: french 
              ? ["Alignement de la délégation d'équipe"] 
              : ["Delegation clarity in stressful situations"]
          },
          {
            id: 'job_02',
            title: french ? 'Directeur de la Restauration (F&B)' : 'Food & Beverage Director',
            company: 'Luxury Palace Hotels',
            comp: french ? '65k€ - 85k€' : '$80k - $105k',
            loc: french ? 'Lyon / Présentiel' : 'Lyon / Onsite',
            match: Math.min(95, Math.max(40, avgScore - 5)),
            desc: french 
              ? "Superviser 3 points de vente culinaires, piloter les budgets F&B, concevoir les cartes et superviser les chefs de service." 
              : "Direct culinary operations across 3 premium concepts, negotiate regional supplier agreements, and optimize GP margin targets.",
            strengths: french 
              ? ["Esprit d'analyse stratégique", "Excellente concision de discours"] 
              : ["Analytical strategic vision", "Exceptional speech conciseness"],
            gaps: french 
              ? ["Gestion de la nervosité sous tension socratique"] 
              : ["Pacing stability under executive board grilling"]
          },
          {
            id: 'job_03',
            title: french ? 'Chef de Cuisine / Gérant' : 'Head Chef / Kitchen Manager',
            company: 'Sodexo Prestige',
            comp: french ? '40k€ - 48k€' : '$50k - $60k',
            loc: french ? 'Marseille / Présentiel' : 'Marseille / Onsite',
            match: Math.min(95, Math.max(30, Math.round(avgScore * 0.7 + 10))),
            desc: french 
              ? "Gérer la cuisine de collectivité premium, superviser une brigade de 6 cuisiniers, élaborer les menus hebdomadaires et optimiser le coût portion." 
              : "Oversee premium dining kitchen, manage line cooks brigade, design weekly meal architectures, and control portion cost KPIs.",
            strengths: french 
              ? ["Focalisation résultats & qualité"] 
              : ["Rigorous focus on quality KPIs"],
            gaps: french 
              ? ["Chiffres précis dans les récits STAR", "Trop de mots de remplissage"] 
              : ["Absence of numeric KPIs in STAR answers", "High filler-word frequency"]
          }
        ];
      case 'sales':
        return [
          {
            id: 'job_01',
            title: french ? 'Responsable de Boutique' : 'Store Manager',
            company: 'Maison Luxe & Co',
            comp: french ? '42k€ - 52k€' : '$50k - $65k',
            loc: french ? 'Paris Centre' : 'Paris Downtown',
            match: Math.min(95, Math.max(45, avgScore + 4)),
            desc: french 
              ? "Gérer le magasin phare, animer l'équipe de 8 conseillers, piloter le taux de conversion et le panier moyen." 
              : "Direct the flagship store operations, mentor 8 retail associates, and drive conversion rates and average basket sizes.",
            strengths: french 
              ? ["Sensibilité commerciale aiguë", "Excellent contact client"] 
              : ["Strong commercial sensitivity", "Excellent customer flow management"],
            gaps: french 
              ? ["Justification d'écarts budgétaires"] 
              : ["Presenting store budget gap stories with STAR structure"]
          },
          {
            id: 'job_02',
            title: french ? 'Directeur de Réseau de Vente' : 'Retail Area Manager',
            company: 'Fashion Group International',
            comp: french ? '60k€ - 75k€' : '$75k - $95k',
            loc: french ? 'Régional / Hybride' : 'Regional / Hybrid',
            match: Math.min(95, Math.max(40, avgScore - 5)),
            desc: french 
              ? "Superviser un réseau de 12 boutiques, accompagner les responsables de magasins, piloter les indicateurs de performance commerciale de la zone." 
              : "Supervise a portfolio of 12 retail boutique outlets, support store managers, and align regional turnover goals.",
            strengths: french 
              ? ["Esprit de synthèse managériale", "Exposition claire des objectifs"] 
              : ["Strategic business vision", "Clear goal-setting communication"],
            gaps: french 
              ? ["Tendance à trop vulgariser sans chiffres"] 
              : ["Needs sharper operational KPI injection in performance pitches"]
          },
          {
            id: 'job_03',
            title: french ? 'Responsable Comptes Clés Vente' : 'Key Account Sales Manager',
            company: 'RetailTech Distribution',
            comp: french ? '50k€ - 65k€' : '$60k - $80k',
            loc: french ? 'Lille / Hybride' : 'Lille / Hybrid',
            match: Math.min(95, Math.max(30, Math.round(avgScore * 0.7 + 10))),
            desc: french 
              ? "Négocier avec les grands comptes de la distribution, piloter les cycles de vente complexes et développer les ventes indirectes." 
              : "Negotiate enterprise agreements with main distribution channels, handle complex wholesale cycles, and grow indirect turnover.",
            strengths: french 
              ? ["Persévérance et de-escalation"] 
              : ["Strong de-escalation and negotiation presence"],
            gaps: french 
              ? ["Trop d'hésitations en phase de négociation serrée"] 
              : ["Sustained speaking pace under direct buyer grilling"]
          }
        ];
      case 'finance':
        return [
          {
            id: 'job_01',
            title: french ? 'Contrôleur de Gestion Senior' : 'Senior Financial Controller',
            company: 'FinGroup Global',
            comp: french ? '55k€ - 68k€' : '$68k - $85k',
            loc: french ? 'Paris / Hybride' : 'Paris / Hybrid',
            match: Math.min(95, Math.max(45, avgScore + 4)),
            desc: french 
              ? "Piloter les processus budgétaires, analyser les écarts mensuels de rentabilité et accompagner les directeurs de départements." 
              : "Lead monthly budget processes, audit profitability margins, and partner with department heads to optimize OpEx.",
            strengths: french 
              ? ["Précision chirurgicale des chiffres", "Focalisation sur l'impact de coût"] 
              : ["Surgical precision with metrics", "Cost-saving focus during presentations"],
            gaps: french 
              ? ["Expression de leadership lors des arbitrages"] 
              : ["Assertion of strategic authority during cost negotiations"]
          },
          {
            id: 'job_02',
            title: french ? 'Directeur Financier (CFO)' : 'Chief Financial Officer',
            company: 'ScaleUp Corp',
            comp: french ? '85k€ - 110k€' : '$100k - $130k',
            loc: french ? 'Télétravail France' : 'Remote / France',
            match: Math.min(95, Math.max(40, avgScore - 5)),
            desc: french 
              ? "Piloter la stratégie de trésorerie, structurer les plans de financement à long terme et soutenir les audits devant le Conseil." 
              : "Structure corporate funding rounds, direct treasury actions, and present audit findings directly to the board of directors.",
            strengths: french 
              ? ["Excellente tenue de stress", "Structure argumentative impeccable"] 
              : ["Outstanding emotional recovery under pressure", "Perfect logical argument layouts"],
            gaps: french 
              ? ["Vulgarisation pour les profils non-financiers"] 
              : ["Explaining tax compliance details without over-using technical jargon"]
          },
          {
            id: 'job_03',
            title: french ? 'Auditeur Financier Senior' : 'Senior Financial Auditor',
            company: 'KPMG Partners',
            comp: french ? '50k€ - 60k€' : '$60k - $72k',
            loc: french ? 'Strasbourg / Présentiel' : 'Strasbourg / Onsite',
            match: Math.min(95, Math.max(30, Math.round(avgScore * 0.7 + 10))),
            desc: french 
              ? "Réaliser des missions d'audit financier légal et contractuel pour un portefeuille d'entreprises industrielles de taille moyenne." 
              : "Conduct legal corporate tax and fiscal audits for middle-market industrial clients.",
            strengths: french 
              ? ["Analyse de conformité rigoureuse"] 
              : ["Rigorous compliance checking process"],
            gaps: french 
              ? ["Présentation synthétique (Elevator Pitch)"] 
              : ["Elevator pitch conciseness during client briefings"]
          }
        ];
      case 'consulting':
        return [
          {
            id: 'job_01',
            title: french ? 'Consultant Strategy Senior' : 'Senior Strategy Consultant',
            company: 'McKinsey & Co / BCG',
            comp: french ? '75k€ - 95k€' : '$90k - $115k',
            loc: french ? 'Paris / Hybride' : 'Paris / Hybrid',
            match: Math.min(95, Math.max(45, avgScore + 4)),
            desc: french 
              ? "Conseiller les directions générales sur la restructuration de portefeuille, la transformation digitale et l'optimisation des coûts." 
              : "Advise executive boards on portfolio optimization, digital transformation, and operating margin growths.",
            strengths: french 
              ? ["Méthodologie d'analyse irréprochable", "Diction soignée"] 
              : ["Flawless casing structuring", "Impeccable vocal diction"],
            gaps: french 
              ? ["Soutien d'idées disruptives face à la réticence"] 
              : ["Holding strong positions when challenged on controversial findings"]
          },
          {
            id: 'job_02',
            title: french ? 'Manager de Cabinet (Principal)' : 'Consulting Manager / Principal',
            company: 'Accenture Strategy',
            comp: french ? '90k€ - 120k€' : '$110k - $145k',
            loc: french ? 'Paris / Hybride' : 'Paris / Hybrid',
            match: Math.min(95, Math.max(40, avgScore - 5)),
            desc: french 
              ? "Cadrer des programmes de transformation de grande envergure, encadrer une équipe de 4 consultants et gérer le budget des missions." 
              : "Manage large-scale transformation accounts, guide 4 associate consultants, and drive engagement profitability ratios.",
            strengths: french 
              ? ["Gouvernance de projet robuste", "Faible taux de tics verbaux"] 
              : ["Excellent project governance storytelling", "Very low verbal filler count"],
            gaps: french 
              ? ["Diplomatie face au dépassement de scope non facturé"] 
              : ["Setting borders when managing customer scope creep under pressure"]
          },
          {
            id: 'job_03',
            title: french ? 'Consultant Organisation Senior' : 'Senior Advisory Consultant',
            company: 'Capgemini Invent',
            comp: french ? '60k€ - 72k€' : '$72k - $88k',
            loc: french ? 'Nantes / Hybride' : 'Nantes / Hybrid',
            match: Math.min(95, Math.max(30, Math.round(avgScore * 0.7 + 10))),
            desc: french 
              ? "Piloter l'amélioration des processus opérationnels (Lean Office) et accompagner le changement chez nos clients du secteur public." 
              : "Optimize operational workflows (Lean Office) and guide change management processes for key institutional clients.",
            strengths: french 
              ? ["Empathie et posture d'écoute active"] 
              : ["Great empathy and active listening posture"],
            gaps: french 
              ? ["Synthèse chiffrée de l'impact en fin d'introduction"] 
              : ["Including high-impact numeric outcomes in initial project pitches"]
          }
        ];
      case 'healthcare':
        return [
          {
            id: 'job_01',
            title: french ? 'Cadre de Santé / Coordinateur' : 'Nursing Supervisor',
            company: 'Hôpitaux de Paris',
            comp: french ? '45k€ - 55k€' : '$55k - $68k',
            loc: french ? 'Paris / Présentiel' : 'Paris / Onsite',
            match: Math.min(95, Math.max(45, avgScore + 4)),
            desc: french 
              ? "Coordonner le service des urgences, encadrer une équipe de 14 infirmiers et aides-soignants, optimiser les parcours de soin." 
              : "Coordinate emergency care department, manage 14 clinical FTEs, and optimize bed allocation and shift rotations.",
            strengths: french 
              ? ["Médiation et calme absolu face aux crises", "Empathie d'équipe"] 
              : ["Superb de-escalation under emergency crisis", "Team empathy"],
            gaps: french 
              ? ["Justification d'écarts de budget de garde devant la direction"] 
              : ["Justifying night-shift overtime budgets under regional health audits"]
          },
          {
            id: 'job_02',
            title: french ? 'Directeur de Clinique Adjoint' : 'Assistant Healthcare Director',
            company: 'Korian / Ramsay Santé',
            comp: french ? '55k€ - 70k€' : '$68k - $85k',
            loc: french ? 'Bordeaux / Présentiel' : 'Bordeaux / Onsite',
            match: Math.min(95, Math.max(40, avgScore - 5)),
            desc: french 
              ? "Piloter l'exploitation financière et administrative de l'établissement, garantir la conformité réglementaire et auditer la qualité de soin." 
              : "Direct operating and regulatory administration of the facility, supervise care-quality audits, and balance staff allocations.",
            strengths: french 
              ? ["Esprit d'analyse et sens éthique", "Grande clarté"] 
              : ["Ethics and compliance auditing structure", "Superb clarity of expression"],
            gaps: french 
              ? ["Assurance sous le feu d'inspections inopinées"] 
              : ["Confidence stabilization during hostile public health inspector mock trials"]
          },
          {
            id: 'job_03',
            title: french ? 'Coordinateur Qualité' : 'Healthcare Risk Coordinator',
            company: 'Réseau Santé Pro',
            comp: french ? '42k€ - 50k€' : '$50k - $62k',
            loc: french ? 'Toulouse / Hybride' : 'Toulouse / Hybrid',
            match: Math.min(95, Math.max(30, Math.round(avgScore * 0.7 + 10))),
            desc: french 
              ? "Déployer la politique de gestion des risques cliniques, animer les revues d'erreurs médicales (CREX) et préparer la certification HAS." 
              : "Deploy clinical risk prevention policies, run error audit committees, and coordinate national health certification reviews.",
            strengths: french 
              ? ["Rigueur protocolaire irréprochable"] 
              : ["Impeccable protocol adherence and safety mindset"],
            gaps: french 
              ? ["Tendance aux longues phrases", "Débit verbal rapide"] 
              : ["High speaking speed during emergency briefing updates", "Verbal conciseness"]
          }
        ];
      case 'manufacturing':
        return [
          {
            id: 'job_01',
            title: french ? 'Superviseur de Production' : 'Production Supervisor',
            company: 'Schneider Electric',
            comp: french ? '44k€ - 54k€' : '$54k - $66k',
            loc: french ? 'Grenoble / Présentiel' : 'Grenoble / Onsite',
            match: Math.min(95, Math.max(45, avgScore + 4)),
            desc: french 
              ? "Superviser une équipe de 15 techniciens d'assemblage, veiller à l'application rigoureuse du plan HSE et piloter le TRS de la ligne." 
              : "Manage an assembly line of 15 technicians, enforce health & safety (HSE) policies, and drive line OEE improvements.",
            strengths: french 
              ? ["Directivité et sens de la sécurité", "Format STAR clair sur incidents"] 
              : ["Clear safety-first orientation", "Good STAR storytelling on outage resolution"],
            gaps: french 
              ? ["Prendre le leadership sur la délégation transversale"] 
              : ["Delineating clear collaborative delegation boundaries under stress"]
          },
          {
            id: 'job_02',
            title: french ? 'Responsable Amélioration Continue' : 'Continuous Improvement Manager',
            company: 'Michelin Group',
            comp: french ? '55k€ - 70k€' : '$68k - $85k',
            loc: french ? 'Clermont-Ferrand / Hybride' : 'Clermont-Ferrand / Hybrid',
            match: Math.min(95, Math.max(40, avgScore - 5)),
            desc: french 
              ? "Déployer la méthodologie Lean Manufacturing (Kaizen, VSM, 5S, SMED), auditer les gaspillages et former les équipes d'ateliers." 
              : "Deploy Lean Manufacturing methodologies (Kaizen, VSM, 5S, SMED), audit plant wastes, and coach shopfloor teams.",
            strengths: french 
              ? ["Excellent pitch d'animation d'ateliers", "Mots parasites minimes"] 
              : ["Excellent workshop facilitation pitches", "Miniscule verbal filler frequency"],
            gaps: french 
              ? ["Justification d'écarts de productivité devant le directeur d'usine"] 
              : ["Sustained confidence during aggressive OEE deviation grilling by board"]
          },
          {
            id: 'job_03',
            title: french ? 'Responsable Maintenance d\'Usine' : 'Plant Maintenance Manager',
            company: 'Lafarge Holcim',
            comp: french ? '48k€ - 58k€' : '$58k - $70k',
            loc: french ? 'Lyon / Présentiel' : 'Lyon / Onsite',
            match: Math.min(95, Math.max(30, Math.round(avgScore * 0.7 + 10))),
            desc: french 
              ? "Piloter la maintenance préventive et curative du site, manager 6 techniciens spécialisés et optimiser le budget pièces de rechange." 
              : "Lead preventive and corrective plant maintenance, manage 6 technicians, and optimize spare parts budgets.",
            strengths: french 
              ? ["Diagnostic de panne ultra-méthodique"] 
              : ["Highly structured diagnostic methodology"],
            gaps: french 
              ? ["Présentation synthétique", "Précision de débit vocal"] 
              : ["Elevator pitch conciseness during board meetings", "Pacing under fast challenge"]
          }
        ];
      case 'tech':
        return [
          {
            id: 'job_01',
            title: french ? 'SRE Specialist' : 'SRE Specialist',
            company: 'CloudCorp Inc.',
            comp: french ? '145k€ - 175k€' : '$145k - $175k',
            loc: french ? 'Paris / Hybride' : 'Paris / Hybrid',
            match: Math.min(95, Math.max(45, avgScore + 4)),
            desc: french 
              ? "Diriger une équipe de 6 ingénieurs gérant des grappes Kubernetes multi-régions sur GCP avec une SLA stricte de 99,99%." 
              : "Leading high-concurrency cloud infrastructure migrations, SRE tooling, and incident response structures under high availability constraints.",
            strengths: french 
              ? ["Diction vocale extrêmement stable", "Structure STAR robuste sur les pannes"] 
              : ["Outstanding speech stability (142 WPM)", "Highly structured post-mortem storytelling"],
            gaps: french 
              ? ["Formulation du travail collaboratif / délégation"] 
              : ["Weak delegation metrics (I vs We)"]
          },
          {
            id: 'job_02',
            title: french ? 'Architecte Plateforme Senior' : 'Lead Platform Architect',
            company: 'FinTechScale',
            comp: french ? '155k€ - 185k€' : '$155k - $185k',
            loc: french ? 'Télétravail France' : 'Remote / France',
            match: Math.min(95, Math.max(40, avgScore - 5)),
            desc: french 
              ? "Concevoir des architectures transactionnelles hautement sécurisées sur Cloud Spanner et orchestrer les migrations de données." 
              : "Designing secure ledger processing pipelines and migrating database infrastructures to globally distributed cloud environments.",
            strengths: french 
              ? ["Clarté des réponses conceptuelles", "Très faible taux de mots parasites"] 
              : ["Clear conceptual responses", "Extremely low verbal filler density"],
            gaps: french 
              ? ["Score d'assurance sous provocations surprise"] 
              : ["Needs confidence stabilization under rapid challenges"]
          },
          {
            id: 'job_03',
            title: 'Technical Product Manager',
            company: 'ShanaGroup Logistics',
            comp: french ? '110k€ - 130k€' : '$110k - $130k',
            loc: french ? 'Marseille / Présentiel' : 'Marseille / Onsite',
            match: Math.min(95, Math.max(30, Math.round(avgScore * 0.7 + 10))),
            desc: french 
              ? "Gérer les feuilles de route produits logistiques et arbitrer les priorités avec 4 équipes d'ingénierie." 
              : "Coordinating cross-functional schedules and translating business requests to precise engineering backlogs.",
            strengths: french 
              ? ["Compréhension globale du produit"] 
              : ["Good conceptual product understanding"],
            gaps: french 
              ? ["Manque d'exemples chiffrés", "Trop de mots de remplissage"] 
              : ["Absence of numeric KPIs in STAR answers", "High filler-word frequency"]
          }
        ];
      default:
        return [
          {
            id: 'job_01',
            title: french ? 'Chef de Projet Senior' : 'Senior Project Manager',
            company: 'LogiCorp Operations',
            comp: french ? '50k€ - 62k€' : '$60k - $75k',
            loc: french ? 'Paris / Hybride' : 'Paris / Hybrid',
            match: Math.min(95, Math.max(45, avgScore + 4)),
            desc: french 
              ? "Piloter des projets complexes d'organisation, gérer le planning, allouer les ressources et animer les comités de pilotage." 
              : "Manage multi-stakeholder operational projects, balance timelines, allocate resources, and run steering committees.",
            strengths: french 
              ? ["Récit STAR très structuré", "Faible taux de mots parasites"] 
              : ["Structured STAR responses", "Very low verbal filler density"],
            gaps: french 
              ? ["Résolution de conflits d'équipe sous stress"] 
              : ["Direct team conflict de-escalation under tight deadlines"]
          },
          {
            id: 'job_02',
            title: french ? 'Directeur des Opérations Adjoint' : 'Assistant Operations Director',
            company: 'EcoScale Services',
            comp: french ? '65k€ - 85k€' : '$80k - $105k',
            loc: french ? 'Lyon / Hybride' : 'Lyon / Hybrid',
            match: Math.min(95, Math.max(40, avgScore - 5)),
            desc: french 
              ? "Superviser les opérations courantes, piloter le compte de résultat opérationnel (P&L) et piloter les projets d'excellence opérationnelle." 
              : "Direct daily corporate operations, manage operational P&L ratios, and drive organizational excellence initiatives.",
            strengths: french 
              ? ["Diction calme et affirmée", "Excellente concision"] 
              : ["Assertive and calm vocal presence", "Outstanding speech conciseness"],
            gaps: french 
              ? ["Négociation face à des partenaires exigeants"] 
              : ["Holding firm grounds during hostile budget arbitrations"]
          },
          {
            id: 'job_03',
            title: french ? 'Responsable d\'Équipe' : 'Team Lead / Operations Manager',
            company: 'TransLogix Logistics',
            comp: french ? '45k€ - 52k€' : '$55k - $65k',
            loc: french ? 'Marseille / Présentiel' : 'Marseille / Onsite',
            match: Math.min(95, Math.max(30, Math.round(avgScore * 0.7 + 10))),
            desc: french 
              ? "Manager une équipe opérationnelle de 10 collaborateurs, fixer les objectifs individuels, animer les rituels collectifs." 
              : "Supervise an operational team of 10 FTEs, establish quarterly goals, and lead team briefs.",
            strengths: french 
              ? ["Écoute active et de-escalation"] 
              : ["Active listening and empathy metrics"],
            gaps: french 
              ? ["Trop de tics verbaux", "Diction rapide en phase de stress"] 
              : ["Elevated speaking speed under pressure", "Filler words density"]
          }
        ];
    }
  };

  const isDrillCompleted = (drillId: string) => {
    return drillProgress[drillId] === 'completed';
  };

  const getTailoredRecommendations = () => {
    // Get latest evaluation session (most recent first)
    const sortedHistory = [...realHistory].sort((a, b) => {
      const timeA = a.timestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.timestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });
    const latestEval = sortedHistory[0];

    // 2. Define companies & career paths based on detected category
    let companyList: string[] = [];
    const careerPaths: { text: string; source: string }[] = [];

    if (category === 'catering') {
      companyList = isFr
        ? ["Sodexo", "Elior Group", "Accor Hotels", "McDonald's France", "Starbucks France", "Compass Group", "Groupe Bertrand"]
        : ["Sodexo", "Marriott International", "Hilton", "Starbucks", "McDonald's", "Compass Group", "Chipotle"];

      if (isFr) {
        careerPaths.push({ text: `Assistant Restaurant Manager / Chef d'équipe`, source: "🎯 Étape suivante logique" });
        careerPaths.push({ text: `Restaurant Manager / Directeur de Restaurant`, source: "📈 Progression de carrière (3 ans)" });
        careerPaths.push({ text: `Directeur de Secteur / Area Manager (multi-sites)`, source: "👑 Impact opérationnel (5 ans)" });
      } else {
        careerPaths.push({ text: `Assistant Restaurant Manager / Shift Supervisor`, source: "🎯 Next logical milestone" });
        careerPaths.push({ text: `General Restaurant Manager`, source: "📈 Operational scale (3y)" });
        careerPaths.push({ text: `Area Manager / District Director`, source: "👑 Multi-unit leadership (5y)" });
      }
    } else if (category === 'sales') {
      companyList = isFr
        ? ["Decathlon", "Fnac Darty", "Carrefour", "Sephora", "Zara France", "Galeries Lafayette", "IKEA France"]
        : ["Decathlon", "Target", "Walmart", "Sephora", "Zara (Inditex)", "IKEA", "Nike Retail"];

      if (isFr) {
        careerPaths.push({ text: `Responsable de Rayon / Team Leader Commerce`, source: "🎯 Étape suivante logique" });
        careerPaths.push({ text: `Directeur de Magasin / Store Manager`, source: "📈 Gestion de centre de profit (3 ans)" });
        careerPaths.push({ text: `Directeur Régional des Ventes / Retail Director`, source: "👑 Direction stratégique (5 ans)" });
      } else {
        careerPaths.push({ text: `Department Manager / Retail Lead`, source: "🎯 Next logical milestone" });
        careerPaths.push({ text: `Store Manager / General Manager`, source: "📈 Profit center operations (3y)" });
        careerPaths.push({ text: `District Manager / VP of Retail Sales`, source: "👑 Executive regional impact (5y)" });
      }
    } else if (category === 'finance') {
      companyList = isFr
        ? ["BNP Paribas", "Société Générale", "AXA", "Crédit Agricole", "PwC France", "Deloitte France", "KPMG France"]
        : ["BNP Paribas", "Goldman Sachs", "JPMorgan Chase", "Morgan Stanley", "PwC", "Deloitte", "KPMG"];

      if (isFr) {
        careerPaths.push({ text: `Contrôleur de Gestion Senior / Auditeur Senior`, source: "🎯 Étape suivante logique" });
        careerPaths.push({ text: `Responsable Financier / Directeur Financier (CFO)`, source: "📈 Responsabilité financière (3 ans)" });
        careerPaths.push({ text: `VP Finance / Associé de Cabinet (Partner)`, source: "👑 Direction stratégique (5 ans)" });
      } else {
        careerPaths.push({ text: `Senior Financial Analyst / Senior Auditor`, source: "🎯 Next logical milestone" });
        careerPaths.push({ text: `Finance Director / Controller / Audit Manager`, source: "📈 Financial accountability (3y)" });
        careerPaths.push({ text: `VP of Finance / Chief Financial Officer / Partner`, source: "👑 Board of Directors (5y)" });
      }
    } else if (category === 'consulting') {
      companyList = isFr
        ? ["McKinsey & Company", "Boston Consulting Group (BCG)", "Bain & Company", "Accenture France", "Capgemini", "Wavestone"]
        : ["McKinsey & Company", "Boston Consulting Group (BCG)", "Bain & Company", "Accenture", "Capgemini", "Oliver Wyman"];

      if (isFr) {
        careerPaths.push({ text: `Consultant Senior / Manager de Mission`, source: "🎯 Étape suivante logique" });
        careerPaths.push({ text: `Directeur de Mission / Senior Manager`, source: "📈 Développement commercial (3 ans)" });
        careerPaths.push({ text: `Associé / Principal (Partner)`, source: "👑 Direction de cabinet (5 ans)" });
      } else {
        careerPaths.push({ text: `Senior Consultant / Engagement Manager`, source: "🎯 Next logical milestone" });
        careerPaths.push({ text: `Director / Senior Manager`, source: "📈 Portfolio management (3y)" });
        careerPaths.push({ text: `Partner / Managing Director`, source: "👑 Equity ownership (5y)" });
      }
    } else if (category === 'healthcare') {
      companyList = isFr
        ? ["Sanofi", "Korian (Clariane)", "Ramsay Santé", "Orpea (LNA Santé)", "BioMérieux", "Servier", "Roche France"]
        : ["Sanofi", "Pfizer", "Novartis", "AstraZeneca", "Johnson & Johnson", "Roche", "Medtronic"];

      if (isFr) {
        careerPaths.push({ text: `Chef de Projet Clinique / Responsable Qualité`, source: "🎯 Étape suivante logique" });
        careerPaths.push({ text: `Directeur d'Établissement / Directeur d'Opérations de Santé`, source: "📈 Direction d'activité (3 ans)" });
        careerPaths.push({ text: `VP Operations de Santé / Directeur Général`, source: "👑 Leadership stratégique (5 ans)" });
      } else {
        careerPaths.push({ text: `Clinical Operations Manager / Senior Specialist`, source: "🎯 Next logical milestone" });
        careerPaths.push({ text: `Healthcare Facility Director / Clinical Director`, source: "📈 Operational scale (3y)" });
        careerPaths.push({ text: `VP of Healthcare Operations / COO`, source: "👑 C-Suite leadership (5y)" });
      }
    } else if (category === 'manufacturing') {
      companyList = isFr
        ? ["Airbus", "Safran", "Renault Group", "Stellantis France", "Michelin", "Schneider Electric", "Thales"]
        : ["Airbus", "Boeing", "Tesla", "General Electric", "Renault-Nissan-Mitsubishi", "Safran", "Caterpillar"];

      if (isFr) {
        careerPaths.push({ text: `Superviseur de Production / Chef de Projet Industriel`, source: "🎯 Étape suivante logique" });
        careerPaths.push({ text: `Directeur d'Usine / Plant Manager`, source: "📈 Gestion industrielle globale (3 ans)" });
        careerPaths.push({ text: `Directeur des Opérations / VP Manufacturing`, source: "👑 Horizon de direction (5 ans)" });
      } else {
        careerPaths.push({ text: `Production Lead / Industrial Project Manager`, source: "🎯 Next logical milestone" });
        careerPaths.push({ text: `Plant Manager / Operations Manager`, source: "📈 Manufacturing leadership (3y)" });
        careerPaths.push({ text: `Director of Operations / VP of Manufacturing / COO`, source: "👑 Corporate executive (5y)" });
      }
    } else if (category === 'tech') {
      companyList = isFr
        ? ["Doctolib", "Criteo", "Mirakl", "BlaBlaCar", "OVHcloud", "Dassault Systèmes", "Capgemini"]
        : ["Google", "Stripe", "Microsoft", "Meta", "Amazon Web Services", "Apple", "Salesforce"];

      const isTechnical = normRole.includes("engineer") || normRole.includes("developer") || normRole.includes("tech") ||
                          normRole.includes("architect") || normRole.includes("sre") || normRole.includes("ingénieur") ||
                          normRole.includes("devops") || normRole.includes("platform");

      if (isTechnical) {
        if (isFr) {
          careerPaths.push({ text: `Senior ${role}`, source: "🎯 Étape suivante logique" });
          careerPaths.push({ text: `Tech Lead / Architecte Principal`, source: "📈 Excellence technique (3 ans)" });
          careerPaths.push({ text: `Engineering Manager / CTO`, source: "👑 Vision technologique (5 ans)" });
        } else {
          careerPaths.push({ text: `Senior ${role}`, source: "🎯 Next logical milestone" });
          careerPaths.push({ text: `Tech Lead / Principal Architect`, source: "📈 Technical leadership (3y)" });
          careerPaths.push({ text: `Engineering Manager / Chief Technology Officer`, source: "👑 Technology direction (5y)" });
        }
      } else {
        if (isFr) {
          careerPaths.push({ text: `Senior ${role}`, source: "🎯 Étape suivante logique" });
          careerPaths.push({ text: `Director of Product / Head of Department`, source: "📈 Impact organisationnel (3 ans)" });
          careerPaths.push({ text: `VP of Product / Chief Technology Officer / CPO`, source: "👑 Comité de direction (5 ans)" });
        } else {
          careerPaths.push({ text: `Senior ${role}`, source: "🎯 Next logical milestone" });
          careerPaths.push({ text: `Director of Product / Head of Department`, source: "📈 Departmental impact (3y)" });
          careerPaths.push({ text: `VP of Product / Chief Technology Officer / CPO`, source: "👑 Executive C-Suite (5y)" });
        }
      }
    } else {
      // General fallbacks based on specific keyword mappings for other sectors
      if (normInd.includes("immobilier") || normInd.includes("real estate") || normInd.includes("property")) {
        companyList = isFr ? ["Nexity", "Icade", "Foncia", "Century 21 France", "Kaufman & Broad"] : ["CBRE", "JLL", "Century 21", "RE/MAX", "Nexity"];
      } else if (normInd.includes("construction") || normInd.includes("bâtiment") || normInd.includes("btp")) {
        companyList = isFr ? ["Bouygues Construction", "Vinci", "Eiffage", "Colas", "Saint-Gobain"] : ["Bouygues", "Vinci", "Bechtel", "Skanska", "Turner Construction"];
      } else if (normInd.includes("éducation") || normInd.includes("education") || normInd.includes("enseignement")) {
        companyList = isFr ? ["Académie Publique", "Galileo Global Education", "HEC Paris", "INSEAD", "Simplon.co"] : ["Harvard", "Pearson", "Coursera", "Galileo Education", "Sylvan Learning"];
      } else {
        companyList = isFr
          ? ["Leader National du Secteur", "Acteur Régional de Référence", "Cabinet de Conseil Spécialisé", "Grand Groupe Français"]
          : ["National Sector Leader", "Specialized Advisory", "Regional Operator", "Top Industry Enterprise"];
      }

      if (isFr) {
        careerPaths.push({ text: `Senior ${role}`, source: "🎯 Étape suivante logique" });
        careerPaths.push({ text: `Manager Opérationnel / Chef d'Équipe`, source: "📈 Management d'équipe (3 ans)" });
        careerPaths.push({ text: `Directeur de Département / Partner`, source: "👑 Direction stratégique (5 ans)" });
      } else {
        careerPaths.push({ text: `Senior ${role}`, source: "🎯 Next logical milestone" });
        careerPaths.push({ text: `Team Lead / Operational Manager`, source: "📈 Department management (3y)" });
        careerPaths.push({ text: `Director / Business Partner`, source: "👑 Strategic governance (5y)" });
      }
    }

    // 3. PRACTICE SESSIONS
    const practiceSessions: { text: string; source: string }[] = [];

    // Session 1: Weakness / last interview result
    if (latestEval) {
      if (latestEval.questionsFeedback && latestEval.questionsFeedback.length > 0) {
        const sortedQs = [...latestEval.questionsFeedback].sort((a, b) => (a.score || 0) - (b.score || 0));
        const lowestQ = sortedQs[0];
        if (lowestQ && (lowestQ.score || 0) < 90) {
          const phaseText = lowestQ.phaseLabel?.split(':')[0]?.trim() || (isFr ? "Structure" : "Structure");
          practiceSessions.push({
            text: isFr 
              ? `Maîtriser le débit & la structure (${phaseText} - score : ${lowestQ.score}%)`
              : `Mastering Pacing & Structure (${phaseText} - score: ${lowestQ.score}%)`,
            source: isFr ? "⚠️ Suite à votre dernier entretien" : "⚠️ Based on your last interview"
          });
        }
      }
      
      if (practiceSessions.length === 0 && latestEval.weakness) {
        const isGenericSuccessMsg = latestEval.weakness.toLowerCase().includes("terminée avec succès") || 
                                    latestEval.weakness.toLowerCase().includes("completed successfully") ||
                                    latestEval.weakness.toLowerCase().includes("simulation d'entretien") ||
                                    latestEval.weakness.toLowerCase().includes("completed standard");
        if (!isGenericSuccessMsg && latestEval.weakness.length > 8) {
          const cleanWeak = latestEval.weakness.length > 55 ? latestEval.weakness.substring(0, 52) + "..." : latestEval.weakness;
          practiceSessions.push({
            text: isFr 
              ? `Correction d'axe : "${cleanWeak}"`
              : `Focus Area: "${cleanWeak}"`,
            source: isFr ? "⚠️ Relevé dans votre historique" : "⚠️ Identified growth point"
          });
        }
      }
    }

    // Default Session 1 if no history or generic success
    if (practiceSessions.length === 0) {
      if (risks.length > 0) {
        const primaryRisk = risks[0];
        const cleanRisk = primaryRisk.length > 55 ? primaryRisk.substring(0, 52) + "..." : primaryRisk;
        practiceSessions.push({
          text: isFr
            ? `Entraînement STAR : contrecarrer le risque « ${cleanRisk} »`
            : `STAR Drill: mitigating risk "${cleanRisk}"`,
          source: isFr ? "🎯 Ciblé selon votre CV" : "🎯 CV-driven priority"
        });
      } else {
        practiceSessions.push({
          text: isFr
            ? `Pitch d'introduction Shana (2-Min) - rôle de ${role}`
            : `Shana 2-Min Warmup Introduction for ${role}`,
          source: isFr ? "📈 Aligné avec votre rôle cible" : "📈 Target role warmup"
        });
      }
    }

    // Session 2: Skills-based
    if (skills.length > 0) {
      const primarySkill = skills[0];
      practiceSessions.push({
        text: isFr
          ? `Défense métier : Valoriser votre expertise en « ${primarySkill} »`
          : `Domain Defense: Articulating your "${primarySkill}" expertise`,
        source: isFr ? "💼 Issu des compétences de votre CV" : "💼 From your CV skills"
      });
    } else if (strengths.length > 0) {
      const primaryStrength = strengths[0];
      const cleanStr = primaryStrength.length > 55 ? primaryStrength.substring(0, 52) + "..." : primaryStrength;
      practiceSessions.push({
        text: isFr
          ? `Mise en valeur STAR : « ${cleanStr} »`
          : `STAR Spotlight: "${cleanStr}"`,
        source: isFr ? "✨ Issu des points forts de votre CV" : "✨ From your CV strengths"
      });
    } else {
      practiceSessions.push({
        text: isFr
          ? `Enjeux stratégiques & culture dans le secteur : ${industry}`
          : `Strategic standards in the industry: ${industry}`,
        source: isFr ? "🏢 Basé sur votre secteur d'activité" : "🏢 Based on target industry"
      });
    }

    // Session 3: General Leadership poise
    if (latestEval && (latestEval.confidenceScore || 100) < 80) {
      practiceSessions.push({
        text: isFr
          ? "Régulation émotionnelle et gestion des questions déstabilisantes"
          : "Vocal confidence training and stress recovery techniques",
        source: isFr ? "⚠️ Stabilité vocale à renforcer" : "⚠️ Confidence recovery focus"
      });
    } else {
      practiceSessions.push({
        text: isFr
          ? "Résolution de conflits complexes et alignement managérial"
          : "Conflict resolution and operational management alignment",
        source: isFr ? "👑 Management & Leadership" : "👑 Leadership calibration"
      });
    }

    // 4. Build Company Simulations list with the mapped companies
    const companySimulations: { text: string; source: string }[] = [];
    const comp1 = companyList[0] || (isFr ? "Leader National" : "National Leader");
    const comp2 = companyList[1] || (isFr ? "Acteur Clé" : "Key Competitor");

    companySimulations.push({
      text: isFr
        ? `Simulation d'entretien complet chez ${comp1} (${role})`
        : `Full Mock Interview at ${comp1} (${role})`,
      source: isFr ? "📈 Objectif de recrutement" : "📈 Target recruiter standard"
    });

    if (skills.length > 1) {
      const secondSkill = skills[1];
      companySimulations.push({
        text: isFr
          ? `Soutenance de compétence chez ${comp2} (${secondSkill})`
          : `Competency and Skill evaluation at ${comp2} (${secondSkill})`,
        source: isFr ? "💻 Validation de compétence" : "💻 Competency validation"
      });
    } else {
      companySimulations.push({
        text: isFr
          ? `Panel comportemental et leadership chez ${comp2}`
          : `Behavioral and Culture-Fit panel at ${comp2}`,
        source: isFr ? "👑 Évaluation comportementale" : "👑 Core values alignment"
      });
    }

    return { practiceSessions, companySimulations, careerPaths };
  };

  const getModuleThreeLabel = (cat: typeof category, french: boolean) => {
    switch (cat) {
      case 'catering':
        return french ? 'Rush & Service' : 'Rush & Service';
      case 'sales':
        return french ? 'Litiges & Ventes' : 'Sales & Conflicts';
      case 'finance':
        return french ? 'Audit & Budgets' : 'Audit & Budgets';
      case 'consulting':
        return french ? 'Scope & Clients' : 'Scope & Clients';
      case 'healthcare':
        return french ? 'Urgences & Soins' : 'Care & Crises';
      case 'manufacturing':
        return french ? 'Sécurité & Pannes' : 'Safety & Outages';
      case 'tech':
        return french ? 'Gestion Incidents SRE' : 'Incident Defense';
      default:
        return french ? 'Crises & Équipe' : 'Crisis & Team';
    }
  };

  const getModuleData = (cat: typeof category, french: boolean) => {
    let m1Title = '';
    let m1Desc = '';
    let m1D1 = '';
    let m1D2 = '';
    let m1D3 = '';

    let m3Title = '';
    let m3Desc = '';
    let m3D1 = '';
    let m3D2 = '';

    if (cat === 'catering') {
      m1Title = french ? "Module 1 : Structuration STAR & Récit de Rush" : "Module 1: STAR Storytelling under High Volume";
      m1Desc = french 
        ? "Structurez vos réponses STAR sur des pannes ou pics d'activité, en injectant des KPIs opérationnels (taux d'occupation, coût matière, productivité)."
        : "Learn how to structure floor and kitchen challenges with clear operations metrics (labor costs, peak-hour covers, guest ratings).";
      m1D1 = french ? "L'Anatomie d'un STAR en Restauration" : "Anatomy of a Catering STAR response";
      m1D2 = french ? "Quantifier la Performance Opérationnelle" : "Quantifying Floor & Kitchen Performance";
      m1D3 = french ? "Le Pitch Express du Manager de Service (3 Mins)" : "The 3-Minute Shift Briefing Pitch";

      m3Title = french ? "Module 3 : Gestion de Crise de Service & Médiation" : "Module 3: Rush-Hour Crisis & Mediation";
      m3Desc = french 
        ? "Gérer les incidents de service majeurs (sous-effectif, retards, rupture de stock) face à des clients irrités ou au directeur."
        : "High-stakes service crisis management. Handle major operational breakdowns (extreme short staff, delays, HACCP alerts) with poise.";
      m3D1 = french ? "Gérer une rupture produit critique en plein rush" : "Handling Product Stockout mid Peak-Hour";
      m3D2 = french ? "Défendre l'organisation devant le directeur de district" : "Defending Labor Budgets under Regional Challenge";
    } else if (cat === 'sales') {
      m1Title = french ? "Module 1 : Structuration STAR & KPIs Commerciaux" : "Module 1: STAR Storytelling & Sales KPIs";
      m1Desc = french 
        ? "Structurez vos réalisations commerciales en injectant systématiquement des indicateurs chiffrés (panier moyen, CA, conversion, satisfaction)."
        : "Learn how to present sales achievements by injecting commercial metrics (average basket size, revenue, retail conversion rates).";
      m1D1 = french ? "L'Anatomie d'un STAR Commercial" : "Anatomy of a Retail Sales STAR response";
      m1D2 = french ? "Chiffrer le Succès d'une Campagne ou Vente" : "Quantifying Conversion & Average Basket Growths";
      m1D3 = french ? "Le Pitch de Produit/Solution (3 Minutes)" : "The 3-Minute Retail Solution Pitch";

      m3Title = french ? "Module 3 : Résolution de Litiges Clients & Négociation" : "Module 3: Conflict Resolution & Customer Mediation";
      m3Desc = french 
        ? "Apprenez à désamorcer les conflits avec des clients difficiles ou à justifier des écarts de CA devant le directeur régional."
        : "Learn how to de-escalate high-tension customer conflicts or defend store budget variances under direct executive grilling.";
      m3D1 = french ? "Désamorcer une réclamation client explosive" : "De-escalating an Explosive Customer Complaint";
      m3D2 = french ? "Justifier une baisse de CA face au directeur régional" : "Justifying Store Sales Gaps under Board Pressure";
    } else if (cat === 'finance') {
      m1Title = french ? "Module 1 : Structuration STAR & Métriques Financières" : "Module 1: STAR Storytelling & Financial KPIs";
      m1Desc = french 
        ? "Structurez vos analyses de risque et d'écart avec des métriques financières claires, stables et à forte valeur ajoutée."
        : "Structure risk mitigation and variance audits with precise financial indices (EBITDA, ROI, budget gaps).";
      m1D1 = french ? "L'Anatomie d'un STAR Financier" : "Anatomy of a Finance STAR response";
      m1D2 = french ? "Quantifier un Écart Budgétaire" : "Quantifying Budget Gaps and Cost Avoidance";
      m1D3 = french ? "La Présentation Synthétique du Board (3 Mins)" : "The 3-Minute Board Briefing Pitch";

      m3Title = french ? "Module 3 : Soutenance d'Audit & Arbitrage Budgétaire" : "Module 3: Audit Defense & Budget Arbitration";
      m3Desc = french 
        ? "Défendez vos décisions d'investissement ou justifiez des incohérences fiscales face à des contrôleurs rigoureux."
        : "Defend investment recommendations or answer critical audit discrepancies under direct confrontation.";
      m3D1 = french ? "Expliquer une anomalie de liasse fiscale" : "Explaining Tax Compliance Discrepancies";
      m3D2 = french ? "Soutenir un arbitrage de coûts devant le Comité" : "Defending Cost-Cutting Arbitrations to the Board";
    } else if (cat === 'consulting') {
      m1Title = french ? "Module 1 : Structuration STAR & Impact Client" : "Module 1: STAR Storytelling & Client Impact";
      m1Desc = french 
        ? "Organisez vos analyses de cas complexes avec une structure irréprochable et des métriques d'impact business fortes."
        : "Learn how to structure complex business casing with high-contrast strategic metrics (ROI, process optimization, SLA).";
      m1D1 = french ? "L'Anatomie d'un STAR de Cabinet" : "Anatomy of a Consulting STAR response";
      m1D2 = french ? "Quantifier la Transformation Business" : "Quantifying Business Transformation Impact";
      m1D3 = french ? "L'Elevator Pitch de Recommandation (3 Mins)" : "The 3-Minute Strategic Advisory Pitch";

      m3Title = french ? "Module 3 : Gestion d'Incidents Projet & Cadrage Scope" : "Module 3: Client Scope Creep & Project Defense";
      m3Desc = french 
        ? "Gérez les dérives de périmètre ou justifiez un retard de livraison critique face à un client exigeant."
        : "Defend project timelines or handle client scope creep with diplomatic poise and commercial rigor.";
      m3D1 = french ? "Annoncer et justifier un retard de livrable clé" : "Announcing & Explaining Deliverable Delays";
      m3D2 = french ? "Cadrer un dépassement de scope non facturé" : "Reframing Client Scope Creep and Extra Billing";
    } else if (cat === 'healthcare') {
      m1Title = french ? "Module 1 : Structuration STAR & Protocoles Cliniques" : "Module 1: STAR Storytelling & Care Metrics";
      m1Desc = french 
        ? "Structurez vos réponses de gestion d'équipe soignante en respectant les protocoles et en intégrant des KPIs de qualité de soins."
        : "Structure healthcare challenges with precise clinical quality metrics (patient satisfaction, compliance, shift efficiency).";
      m1D1 = french ? "L'Anatomie d'un STAR Hospitalier / Clinique" : "Anatomy of a Healthcare STAR response";
      m1D2 = french ? "Quantifier l'Efficacité Opérationnelle" : "Quantifying Healthcare Efficiency & Compliance";
      m1D3 = french ? "La Transmission de Garde Express (3 Minutes)" : "The 3-Minute Shift Handover Pitch";

      m3Title = french ? "Module 3 : Gestion d'Incidents de Soins & Crises" : "Module 3: Clinical Incidents & Crisis Management";
      m3Desc = french 
        ? "Gérez les ruptures de personnel soignant ou expliquez un écart de protocole lors d'une inspection sanitaire."
        : "Handle emergency medical staff shortages or defend clinical protocol deviations during public health inspections.";
      m3D1 = french ? "Expliquer un écart de protocole à l'inspecteur" : "Explaining Protocol Deviations to the Inspector";
      m3D2 = french ? "Gérer un sous-effectif critique en garde de nuit" : "Managing Extreme Staff Shortages during Night Shift";
    } else if (cat === 'manufacturing') {
      m1Title = french ? "Module 1 : Structuration STAR & Performance Lean" : "Module 1: STAR Storytelling & Lean Metrics";
      m1Desc = french 
        ? "Structurez vos accomplissements industriels avec des métriques Lean précises (TRS, productivité, baisse de rebuts)."
        : "Learn how to structure manufacturing responses around Lean indices (OEE, scrap reduction, cycle times).";
      m1D1 = french ? "L'Anatomie d'un STAR Industriel" : "Anatomy of a Manufacturing STAR response";
      m1D2 = french ? "Quantifier le Taux de Rendement Synthétique" : "Quantifying OEE & Continuous Improvement";
      m1D3 = french ? "Le Point Sécurité/Production Flash (3 Minutes)" : "The 3-Minute Safety & Production Flash Brief";

      m3Title = french ? "Module 3 : Résolution de Panne & Arrêt de Ligne" : "Module 3: Assembly Line Failure & Crisis Defense";
      m3Desc = french 
        ? "Défendez la gestion d'un incident de sécurité majeur ou expliquez un arrêt de ligne prolongé devant le Directeur Opérationnel."
        : "Defend industrial accident management or explain prolonged assembly line stoppages to the Operations Director.";
      m3D1 = french ? "Expliquer un arrêt de ligne de production" : "Explaining Assembly Line Outages and Recovery";
      m3D2 = french ? "Défendre la gestion d'un audit de sécurité ISO" : "Defending ISO Safety Audit Failures under Probing";
    } else if (cat === 'tech') {
      m1Title = french ? "Module 1 : STAR Storytelling & Structuration" : "Module 1: STAR Storytelling & Metrics";
      m1Desc = french 
        ? "Maîtrisez la méthode STAR et forcez l'injection de données mesurables et d'impact financier dans vos récits d'architecture."
        : "Learn how to partition engineering challenges into clear steps and inject high-contrast data metrics into result phases.";
      m1D1 = french ? "L'Anatomie du STAR d'Ingénierie" : "Anatomy of an Engineering STAR story";
      m1D2 = french ? "Quantifier le Succès d'un Incrément" : "Quantifying Complex Technical Outcomes";
      m1D3 = french ? "Le Pitch de Projet Express (3 Minutes)" : "The 3-Minute STAR Elevator Pitch";

      m3Title = french ? "Module 3 : Défense d'Incidents de Production SRE" : "Module 3: SRE Production Incident Defense";
      m3Desc = french 
        ? "Spécialisation d'architecture. Apprenez à expliquer clairement une panne critique devant le conseil d'administration sans jargonner."
        : "High-stakes scenario track. Learn how to explain complex multi-region outages to executive stakeholders while taking ownership.";
      m3D1 = french ? "Vulgariser un bug d'architecture" : "Translating Architecture Bugs to Business Metrics";
      m3D2 = french ? "Soutenir la Chronologie sous feu socratique" : "Defending Outage Timelines under Aggressive Probing";
    } else {
      m1Title = french ? "Module 1 : Structuration STAR & Récit Projet" : "Module 1: STAR Storytelling & Operational Impact";
      m1Desc = french 
        ? "Structurez vos réponses projet ou managériales de manière logique et systématiquement appuyée par des faits chiffrés."
        : "Learn how to present project and team challenges with structured timelines and quantifiable outcome metrics.";
      m1D1 = french ? "L'Anatomie d'une Structure STAR Réussie" : "Anatomy of a Standard STAR response";
      m1D2 = french ? "Quantifier le Succès d'un Projet" : "Quantifying Operational Project Success";
      m1D3 = french ? "Le Pitch de Projet Express (3 Minutes)" : "The 3-Minute Executive Summary Pitch";

      m3Title = french ? "Module 3 : Gestion de Crise Opérationnelle & Conflits" : "Module 3: Operational Crisis & Conflict Resolution";
      m3Desc = french 
        ? "Apprenez à justifier une erreur de projet critique ou à arbitrer un conflit d'équipe sous forte pression managériale."
        : "Learn how to justify critical project errors or arbitrate team conflicts under intense operational scrutiny.";
      m3D1 = french ? "Justifier un échec de projet devant le N+1" : "Explaining Project Failures to Upper Management";
      m3D2 = french ? "Arbitrer un conflit bloquant entre collaborateurs" : "Resolving High-Tension Team Disagreements";
    }

    return { m1Title, m1Desc, m1D1, m1D2, m1D3, m3Title, m3Desc, m3D1, m3D2 };
  };

  const dynamicRecs = getTailoredRecommendations();
  const stepData = getCareerStepData(category, selectedTrack, isFr);
  const skillsData = getSkillsForCategory(category, isFr);
  const mData = getModuleData(category, isFr);

  return (
    <div id="candidate-brain-workspace" className="py-2 max-w-5xl mx-auto space-y-8 text-[#111111] font-sans antialiased relative z-10 selection:bg-indigo-100">
      
      {/* Background elegant slow glows */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[20%] w-[350px] h-[350px] rounded-full bg-indigo-500 opacity-[0.02] filter blur-[90px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[300px] h-[300px] rounded-full bg-emerald-500 opacity-[0.02] filter blur-[100px]" />
      </div>

      {/* ================= HEADER SECTION ================= */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-stone-100 pb-6 relative z-10 text-left"
      >
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            {isFr ? "MON DOSSIER APPRENTANT LONG TERME" : "MY LONG-TERM LEARNER PROFILE"}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-stone-950">
            {isFr ? "Cerveau de Carrière SHANA" : "SHANA Career Brain"}
          </h1>
          <p className="text-xs md:text-sm font-medium text-stone-500 max-w-2xl leading-relaxed">
            {isFr 
              ? "SHANA ne vous évalue pas de manière isolée. Chaque simulation enrichit cette carte cognitive interactive qui personnalise vos futurs parcours de coaching." 
              : "SHANA does not view you as isolated sessions. Every interaction enriches this interactive cognitive map, adaptive learning strategies, and speech diagnostics."}
          </p>
        </div>

        {/* Start practice CTA */}
        <button
          onClick={() => onChangeTab('train')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl border-2 border-stone-950 shadow-[4px_4px_0px_0px_#111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#111] transition-all cursor-pointer flex items-center gap-2"
        >
          <Mic className="w-4 h-4 text-white" />
          <span>{isFr ? "Lancer un Entraînement" : "Start Warm-up Practice"}</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </button>
      </motion.div>

      {/* Sub navigation bar */}
      <div className="flex border-b-2 border-stone-950 gap-2 relative z-10">
        <button
          id="shana-brain-tab-cognitive"
          onClick={() => setSubTab('cognitive')}
          className={`px-4 py-2.5 font-sans font-black text-[11px] uppercase tracking-wider border-t-2 border-l-2 border-r-2 border-stone-950 rounded-t-xl transition-all cursor-pointer ${
            subTab === 'cognitive'
              ? 'bg-white text-stone-950 border-b-2 border-b-white translate-y-[2px]'
              : 'bg-stone-50 text-stone-500 hover:text-stone-950 hover:bg-stone-100 border-b-2 border-b-stone-950'
          }`}
        >
          {isFr ? "🧠 Double Cognitif & Diagnostics" : "🧠 Cognitive Twin & Diagnostics"}
        </button>
        <button
          id="shana-brain-tab-career"
          onClick={() => setSubTab('career')}
          className={`px-4 py-2.5 font-sans font-black text-[11px] uppercase tracking-wider border-t-2 border-l-2 border-r-2 border-stone-950 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            subTab === 'career'
              ? 'bg-[#A7F3D0] text-[#111] border-b-2 border-b-[#A7F3D0] translate-y-[2px]'
              : 'bg-stone-50 text-stone-500 hover:text-stone-950 hover:bg-stone-100 border-b-2 border-b-stone-950'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>{isFr ? "💼 Phase 28 : Career Intelligence" : "💼 Phase 28: Career Intelligence"}</span>
        </button>

      </div>

      {subTab === 'cognitive' ? (
        <>
          {/* ================= HIGH-LEVEL COGNITIVE STATE GRID ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 text-left">
            {/* Readiness index card */}
            <div className="bg-white border-2 border-stone-950 p-5 rounded-2xl space-y-2 shadow-[3px_3px_0px_0px_#111]">
              <span className="text-[9px] uppercase font-mono font-black tracking-widest text-stone-400 block">
                {isFr ? "Indice d'Embauche Global" : "Overall Hiring Readiness"}
              </span>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-3.5xl font-mono font-black text-indigo-700">{readiness.overallHiringReadiness.score}%</span>
                <span className="text-xs font-bold text-stone-500">{isFr ? "Prêt" : "Ready"}</span>
              </div>
              <div className="w-full bg-stone-100 h-2 border border-stone-950 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${readiness.overallHiringReadiness.score}%` }} />
              </div>
            </div>

            {/* Growth Rate card */}
            <div className="bg-white border-2 border-stone-950 p-5 rounded-2xl space-y-2 shadow-[3px_3px_0px_0px_#111]">
              <span className="text-[9px] uppercase font-mono font-black tracking-widest text-stone-400 block">
                {isFr ? "Taux d'Assimilation" : "Growth & Assimilation"}
              </span>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-3.5xl font-mono font-black text-emerald-600">+{averageCompetencyScore}%</span>
                <span className="text-xs font-bold text-stone-500">avg</span>
              </div>
              <div className="w-full bg-stone-100 h-2 border border-stone-950 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${averageCompetencyScore}%` }} />
              </div>
            </div>

            {/* Practice streak card */}
            <div className="bg-white border-2 border-stone-950 p-5 rounded-2xl space-y-2 shadow-[3px_3px_0px_0px_#111]">
              <span className="text-[9px] uppercase font-mono font-black tracking-widest text-stone-400 block">
                {isFr ? "Assiduité Actuelle" : "Consistency Streak"}
              </span>
              <div className="flex items-baseline gap-1.5 pt-1 text-amber-600">
                <Flame className="w-6 h-6 shrink-0 fill-amber-100" />
                <span className="text-3.5xl font-mono font-black text-stone-900">{streakCount}</span>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">{isFr ? "jours" : "days"}</span>
              </div>
              <p className="text-[10px] text-stone-500 font-bold">
                {isFr ? "Niveau d'implication hebdomadaire" : "Weekly consistency level"}
              </p>
            </div>

            {/* Milestones count card */}
            <div className="bg-white border-2 border-stone-950 p-5 rounded-2xl space-y-2 shadow-[3px_3px_0px_0px_#111]">
              <span className="text-[9px] uppercase font-mono font-black tracking-widest text-stone-400 block">
                {isFr ? "Badges Débloqués" : "Milestones Unlocked"}
              </span>
              <div className="flex items-baseline gap-1.5 pt-1 text-amber-500">
                <Trophy className="w-6 h-6 shrink-0 fill-amber-50" />
                <span className="text-3.5xl font-mono font-black text-stone-900">{unlockedCount}</span>
                <span className="text-xs font-bold text-stone-400">/ {motivation.milestones.length}</span>
              </div>
              <p className="text-[10px] text-stone-500 font-bold">
                {isFr ? "Médailles de réussite professionnelle" : "Platform career progress badges"}
              </p>
            </div>
          </div>

          {/* ================= TWO-COLUMN GRID FOR CORE BRAIN SYSTEMS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 text-left">
            
            {/* COLUMN LEFT: CORE MATRICES (Col span 7) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* A. DIGITAL TWIN OF CORE COMPETENCIES */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-5">
                <div className="flex justify-between items-center border-b border-stone-150 pb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                      {isFr ? "Double Numérique des Compétences" : "Digital Twin of Competencies"}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-black bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded">
                    {isFr ? "TEMPS RÉEL" : "LIVE TELEMETRY"}
                  </span>
                </div>

                <div className="space-y-4">
                  {twinArray.slice(0, 6).map((comp) => (
                    <div key={comp.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-stone-700 uppercase tracking-wide text-[11px]">{comp.name}</span>
                        <span className="font-mono text-stone-900 font-black">{comp.score}/100</span>
                      </div>
                      <div className="w-full bg-stone-50 border border-stone-300 rounded-lg h-3 overflow-hidden p-0.5">
                        <div 
                          className={`h-full rounded-sm transition-all duration-500 ${
                            comp.score >= 80 ? 'bg-emerald-500' : comp.score >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                          }`} 
                          style={{ width: `${comp.score}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {topCompetency && topCompetency.score > 0 && (
                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                        {isFr ? "Point Fort Dominant" : "Dominant Strength Anchor"}
                      </p>
                      <p className="text-[11px] text-emerald-800 leading-relaxed font-semibold">
                        {isFr 
                          ? `Votre compétence la plus robuste est « ${topCompetency.name} » avec un score de ${topCompetency.score}%.`
                          : `Your highly advanced parameter is "${topCompetency.name}" holding an outstanding score of ${topCompetency.score}%.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* B. DETAILED HIRING READINESS SCORES */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-5">
                <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                    {isFr ? "Indicateurs d'Embauche & Cibles" : "Readiness Metrics & Targets"}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-stone-500">{isFr ? "Aptitudes Comportementales" : "Behavioral Readiness"}</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-mono font-black text-indigo-600">{readiness.behavioralReadiness.score}%</span>
                    </div>
                    <p className="text-[10.5px] text-stone-600 leading-relaxed font-medium">{readiness.behavioralReadiness.explanation}</p>
                  </div>

                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-stone-500">{isFr ? "Aptitudes Techniques" : "Technical Readiness"}</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-mono font-black text-emerald-600">{readiness.technicalReadiness.score}%</span>
                    </div>
                    <p className="text-[10.5px] text-stone-600 leading-relaxed font-medium">{readiness.technicalReadiness.explanation}</p>
                  </div>

                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-stone-500">{isFr ? "Compétences de Leadership" : "Leadership Readiness"}</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-mono font-black text-indigo-600">{readiness.leadershipReadiness.score}%</span>
                    </div>
                    <p className="text-[10.5px] text-stone-600 leading-relaxed font-medium">{readiness.leadershipReadiness.explanation}</p>
                  </div>

                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-stone-500">{isFr ? "Postures Exécutives" : "Executive Presentation"}</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-mono font-black text-purple-600">{readiness.executiveReadiness.score}%</span>
                    </div>
                    <p className="text-[10.5px] text-stone-600 leading-relaxed font-medium">{readiness.executiveReadiness.explanation}</p>
                  </div>
                </div>
              </div>

              {/* C. SPEECH & VERBAL COMMUNICATION METRICS */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-5">
                <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
                  <Mic className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                    {isFr ? "Diagnostic de Parole & Clarté Vocale" : "Acoustic Speech Diagnostics"}
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wide font-black text-stone-400 block">{isFr ? "Vitesse de Parole" : "Speaking Speed"}</span>
                    <span className="text-lg font-mono font-black text-stone-900">{hasCompletedSessions ? `${communication.averageSpeakingSpeed} wpm` : '0 wpm'}</span>
                    <span className="text-[8.5px] text-stone-500 block">{isFr ? "Cible : 130-150" : "Target: 130-150"}</span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wide font-black text-stone-400 block">{isFr ? "Richesse Lexicale" : "Vocabulary Index"}</span>
                    <span className="text-lg font-mono font-black text-stone-900">{communication.vocabularyRichness}%</span>
                    <span className="text-[8.5px] text-emerald-600 block">{hasCompletedSessions ? (isFr ? "Excellent" : "Robust") : "N/A"}</span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wide font-black text-stone-400 block">{isFr ? "Structure de Phrase" : "Structure Score"}</span>
                    <span className="text-lg font-mono font-black text-stone-900">{communication.sentenceStructure}%</span>
                    <span className="text-[8.5px] text-stone-500 block">{hasCompletedSessions ? (isFr ? "Méthode STAR" : "STAR compliant") : "N/A"}</span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wide font-black text-stone-400 block">{isFr ? "Clarté des Réponses" : "Answer Clarity"}</span>
                    <span className="text-lg font-mono font-black text-stone-900">{communication.answerClarity}%</span>
                    <span className="text-[8.5px] text-indigo-600 block">{hasCompletedSessions ? (isFr ? "Très précis" : "Highly coherent") : "N/A"}</span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wide font-black text-stone-400 block">{isFr ? "Concision & Focus" : "Conciseness Index"}</span>
                    <span className="text-lg font-mono font-black text-stone-900">{communication.conciseness}%</span>
                    <span className="text-[8.5px] text-stone-500 block">{hasCompletedSessions ? (isFr ? "Zéro digression" : "Direct & dense") : "N/A"}</span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wide font-black text-stone-400 block">{isFr ? "Mots de Remplissage" : "Filler Freq."}</span>
                    <span className="text-lg font-mono font-black text-rose-600">{communication.fillerWordFrequency} /100w</span>
                    <span className="text-[8.5px] text-stone-500 block">{hasCompletedSessions ? (isFr ? "Cible : < 2.0" : "Target: < 2.0") : "N/A"}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* COLUMN RIGHT: STRATEGIES & PLANNING (Col span 5) */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* D. PERSONALIZED COACHING STRATEGY & IMPROVEMENT PLANNER */}
              <div className="bg-stone-950 text-stone-100 border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-5">
                <div className="flex justify-between items-center border-b border-stone-850 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-sans font-black uppercase tracking-wider text-white">
                      {isFr ? "Plan d'Amélioration & Stratégie" : "Adaptive Coaching Strategy"}
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono font-black bg-amber-400 text-stone-950 px-2 py-0.5 rounded font-bold uppercase">
                    {coachingStrategy.activeTrack}
                  </span>
                </div>

                {/* Weekly Target Plan */}
                <div className="space-y-3 text-left">
                  <span className="text-[10px] uppercase font-mono font-black tracking-widest text-stone-400 block">
                    {isFr ? "Objectifs de la Semaine" : "Active Weekly Priorities"}
                  </span>
                  <ul className="space-y-2.5">
                    {coachingStrategy.weeklyPlan.map((plan, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start text-xs text-stone-300 font-semibold">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{plan}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Monthly milestones */}
                <div className="space-y-3 pt-3 border-t border-stone-800 text-left">
                  <span className="text-[10px] uppercase font-mono font-black tracking-widest text-stone-400 block">
                    {isFr ? "Objectifs Long Terme" : "Long Term Targets"}
                  </span>
                  <ul className="space-y-2">
                    {improvementPlanner.monthlyObjectives.map((obj, idx) => (
                      <li key={idx} className="flex gap-2 items-center text-xs text-stone-400 font-semibold">
                        <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* E. CONFIDENCE & STRESS RESILIENCE */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                    {isFr ? "Régulation du Stress & Confiance" : "Stress Resilience & Confidence"}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-stone-700">{isFr ? "Indice de Résilience" : "Resilience Index"}</span>
                      <span className="font-mono text-stone-950 font-black">{stress.stressResilienceIndex}/100</span>
                    </div>
                    <div className="w-full bg-stone-100 border border-stone-300 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${stress.stressResilienceIndex}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-stone-700">{isFr ? "Régulation sous Forte Pression" : "Confidence Under Pressure"}</span>
                      <span className="font-mono text-stone-950 font-black">{confidence.confidenceUnderPressure}/100</span>
                    </div>
                    <div className="w-full bg-stone-100 border border-stone-300 rounded-full h-2 overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: `${confidence.confidenceUnderPressure}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-stone-700">{isFr ? "Stabilité de Débit (Zéro panique)" : "Speaking Pace Stability"}</span>
                      <span className="font-mono text-stone-950 font-black">{stress.emotionalRecovery}/100</span>
                    </div>
                    <div className="w-full bg-stone-100 border border-stone-300 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stress.emotionalRecovery}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
                  <div className="bg-stone-50 border border-stone-200 p-2 rounded-lg">
                    <span className="text-stone-400 block font-bold">{isFr ? "Hésitations" : "Hesitations"}</span>
                    <span className="text-stone-900 font-black">{stress.hesitations} / {isFr ? "réponse" : "answer"}</span>
                  </div>
                  <div className="bg-stone-50 border border-stone-200 p-2 rounded-lg">
                    <span className="text-stone-400 block font-bold">{isFr ? "Pauses Longues" : "Long Pauses"}</span>
                    <span className="text-stone-900 font-black">{stress.longPauses} s</span>
                  </div>
                </div>
              </div>

              {/* F. ACHIEVEMENT MILESTONES */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                    {isFr ? "Défis & Badges Débloqués" : "Milestones & Achievements"}
                  </h3>
                </div>

                <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                  {motivation.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex gap-3 items-start border-b border-stone-100 pb-2.5 last:border-0 last:pb-0">
                      <div className={`p-2 rounded-xl border ${
                        milestone.unlockedAt 
                          ? 'bg-amber-50 border-amber-300 text-amber-600' 
                          : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
                      }`}>
                        <Trophy className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="space-y-0.5 text-left">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-black uppercase tracking-wide ${milestone.unlockedAt ? 'text-stone-900' : 'text-stone-400'}`}>
                            {milestone.title}
                          </p>
                          {milestone.unlockedAt && (
                            <span className="text-[8px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-1 py-0.2 rounded font-mono font-bold">
                              {isFr ? "ACQUIS" : "UNLOCKED"}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10.5px] leading-relaxed ${milestone.unlockedAt ? 'text-stone-600' : 'text-stone-400'}`}>
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* ================= GORGEOUS RECOMMENDATIONS & ADAPTIVE COACHING SUGGESTIONS ================= */}
          <div className="bg-indigo-50 border-2 border-stone-950 rounded-3xl p-6 sm:p-8 space-y-6 relative z-10 text-left">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-700" />
                <h3 className="text-sm font-sans font-black uppercase tracking-wider text-indigo-950">
                  {isFr ? "Recommandations de Pratique Prédictives" : "Custom Predictive Practice Tracks"}
                </h3>
              </div>
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md">
                {isFr ? "MOTEUR ACTIF" : "ADAPTIVE RADAR"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-stone-250 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                      <Target className="w-4 h-4" />
                    </div>
                    <h4 className="font-black text-xs uppercase tracking-wide text-stone-900">
                      {isFr ? "Sessions Conseillées" : "Target Practice"}
                    </h4>
                  </div>
                  <ul className="space-y-4">
                    {dynamicRecs.practiceSessions.map((item, idx) => (
                      <li key={idx} className="flex flex-col gap-1 text-xs text-stone-700">
                        <div className="flex gap-2 items-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                          <span className="font-semibold leading-snug">{item.text}</span>
                        </div>
                        <span className="ml-3.5 inline-self-start text-[9px] font-mono font-black uppercase bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded text-indigo-700 w-fit">
                          {item.source}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-3 bg-white p-5 rounded-2xl border border-stone-250 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                    <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <h4 className="font-black text-xs uppercase tracking-wide text-stone-900">
                      {isFr ? "Simulations de Postes" : "Company Contexts"}
                    </h4>
                  </div>
                  <ul className="space-y-4">
                    {dynamicRecs.companySimulations.map((item, idx) => (
                      <li key={idx} className="flex flex-col gap-1 text-xs text-stone-700">
                        <div className="flex gap-2 items-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                          <span className="font-semibold leading-snug">{item.text}</span>
                        </div>
                        <span className="ml-3.5 inline-self-start text-[9px] font-mono font-black uppercase bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded text-emerald-700 w-fit">
                          {item.source}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-3 bg-white p-5 rounded-2xl border border-stone-250 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                    <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <h4 className="font-black text-xs uppercase tracking-wide text-stone-900">
                      {isFr ? "Axes de Carrière" : "Strategic Paths"}
                    </h4>
                  </div>
                  <ul className="space-y-4">
                    {dynamicRecs.careerPaths.map((item, idx) => (
                      <li key={idx} className="flex flex-col gap-1 text-xs text-stone-700">
                        <div className="flex gap-2 items-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                          <span className="font-semibold leading-snug">{item.text}</span>
                        </div>
                        <span className="ml-3.5 inline-self-start text-[9px] font-mono font-black uppercase bg-purple-50 border border-purple-150 px-2 py-0.5 rounded text-purple-700 w-fit">
                          {item.source}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8 relative z-10 text-left animate-fade-in" id="career-intelligence-engine-workspace">
          {/* A. Dynamic simulation launch overlay loader */}
          {simulationLoading && (
            <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center z-50">
              <div className="bg-white border-2 border-stone-950 p-8 rounded-3xl max-w-sm text-center space-y-4 shadow-[6px_6px_0px_0px_#111]">
                <div className="w-12 h-12 rounded-2xl bg-[#A7F3D0] border-2 border-stone-950 flex items-center justify-center mx-auto text-stone-950 font-black animate-spin">
                  <Sparkles className="w-6 h-6 text-indigo-700" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-sans font-black text-sm uppercase text-stone-900">
                    {isFr ? "Chargement du Poste..." : "Configuring Company Persona..."}
                  </h4>
                  <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                    {isFr 
                      ? "Génération du plan de questionnement adaptatif Shana pour ce poste..."
                      : "Structuring predictive challenge vectors and custom company calibration metrics..."}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-stone-400">
                  {simulationLoading}
                </div>
              </div>
            </div>
          )}

          {/* Intro Card */}
          <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[4px_4px_0px_0px_#111] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <h3 className="font-sans font-black text-sm uppercase text-stone-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>{isFr ? "Phase 28 : Intelligence de Carrière Intégrée" : "Phase 28: Integrated Career Intelligence"}</span>
              </h3>
              <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                {isFr
                  ? "Planifiez votre avenir professionnel avec le planificateur long terme, découvrez votre compatibilité algorithmique avec des postes clés et lancez des entraînements hyper-ciblés."
                  : "Plan your strategic career projection, view direct match compatibilities computed from your live competency twin, and launch hyper-targeted simulation sprints."}
              </p>
            </div>
            <div className="bg-indigo-50 border border-indigo-150 px-3.5 py-2 rounded-2xl text-center shrink-0">
              <span className="font-mono text-[9px] text-indigo-700 font-black uppercase tracking-widest block">{isFr ? "MODÈLE DÉCISIONNEL" : "DECISION ENGINE"}</span>
              <span className="font-sans font-extrabold text-xs text-stone-900 uppercase">{isFr ? "Précision Active" : "Active Accuracy"}</span>
            </div>
          </div>

          {/* THREE CORE COMPONENT VIEWS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT / CENTER: CAREER PLANNING & LEARNING PATHS (Col span 7) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* 1. LONG-TERM CAREER PLANNING */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-6">
                <div className="flex justify-between items-center border-b border-stone-150 pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                      {isFr ? "1. Plan de Carrière & Horizon Stratégique" : "1. Long-Term Strategic Career Plan"}
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono font-black bg-stone-100 border border-stone-250 text-stone-700 px-2 py-0.5 rounded uppercase">
                    {isFr ? "Horizon 3-5 ans" : "3-5 Year Horizon"}
                  </span>
                </div>

                {/* Selected Track Configurator */}
                <div className="bg-stone-50 border border-stone-150 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-mono font-black tracking-wider text-stone-500 block leading-none">
                      {isFr ? "Filière de Visée Actuelle" : "Target Career Path"}
                    </label>
                    <span className="text-[10px] font-mono text-indigo-600 font-extrabold block">
                      {isFr ? "Modifier" : "Toggle/Edit"}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    {getTracksForCategory(category, isFr).map((trackName) => (
                      <button
                        key={trackName}
                        onClick={() => setSelectedTrack(trackName)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedTrack === trackName
                            ? 'bg-indigo-950 text-white border border-indigo-950'
                            : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {trackName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Milestone Timeline Map */}
                <div className="space-y-6 relative pl-4 border-l-2 border-stone-200 pt-1 ml-2">
                  
                  {/* Step 1 */}
                  <div className="relative space-y-1">
                    <div className="absolute left-[-21px] top-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-black text-xs text-stone-900 uppercase">
                        {stepData.step1Title}
                      </span>
                      <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 font-bold px-2 py-0.5 rounded">
                        {isFr ? "Acquis" : "Completed"}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                      {stepData.step1Desc}
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative space-y-1">
                    <div className="absolute left-[-21px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse" />
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-black text-xs text-stone-900 uppercase">
                        {stepData.step2Title}
                      </span>
                      <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded">
                        {isFr ? "Cible : 85% IPS" : "Target: 85% IPS"}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 font-semibold leading-relaxed">
                      {stepData.step2Desc}
                    </p>
                    
                    {/* Skills to grow indicator for Stage 2 */}
                    <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl mt-2 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-mono tracking-wider text-stone-400 font-bold block">{isFr ? "Axe de progrès #" : "Priority skill #1"}</span>
                        <span className="font-bold text-stone-700">{skillsData.s1}</span>
                        <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden mt-1">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${skillsData.v1}%` }} />
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-mono tracking-wider text-stone-400 font-bold block">{isFr ? "Axe de progrès #" : "Priority skill #2"}</span>
                        <span className="font-bold text-stone-700">{skillsData.s2}</span>
                        <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden mt-1">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${skillsData.v2}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative space-y-1">
                    <div className="absolute left-[-21px] top-1.5 w-2 h-2 rounded-full bg-stone-300 ring-4 ring-stone-100" />
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-black text-xs text-stone-400 uppercase">
                        {stepData.step3Title}
                      </span>
                      <span className="font-mono text-[10px] text-stone-400 bg-stone-50 font-bold px-2 py-0.5 rounded">
                        {isFr ? "Cible : 95% IPS" : "Target: 95% IPS"}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 font-semibold leading-relaxed">
                      {stepData.step3Desc}
                    </p>
                  </div>

                </div>

                {/* Target Practice Scenarios Required */}
                <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl space-y-3">
                  <h4 className="font-sans font-black text-[11px] text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-700" />
                    <span>{isFr ? "Simulations Shana Recommandées pour Franchir l'Étape" : "Required Milestone Simulations"}</span>
                  </h4>
                  <div className="space-y-2 text-xs text-indigo-900 font-semibold">
                    <div className="flex justify-between items-center p-2 bg-white rounded-xl border border-indigo-100">
                      <span>{stepData.drill1Title}</span>
                      <button 
                        onClick={() => {
                          setSimulationLoading(stepData.drill1Title + "...");
                          setTimeout(() => {
                            setSimulationLoading(null);
                            onChangeTab({ tab: 'train', drillId: 'drill_3_1' });
                          }, 1200);
                        }}
                        className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        {isFr ? "Lancer" : "Launch"}
                      </button>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-xl border border-indigo-100">
                      <span>{stepData.drill2Title}</span>
                      <button 
                        onClick={() => {
                          setSimulationLoading(stepData.drill2Title + "...");
                          setTimeout(() => {
                            setSimulationLoading(null);
                            onChangeTab({ tab: 'train', drillId: 'drill_3_2' });
                          }, 1200);
                        }}
                        className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        {isFr ? "Lancer" : "Launch"}
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* 2. PERSONALIZED LEARNING PATHS */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-6">
                <div className="flex justify-between items-center border-b border-stone-150 pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                      {isFr ? "2. Parcours d'Apprentissage Ultra-Ciblés" : "2. Tailored Learning Paths"}
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono font-black bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded">
                    {isFr ? "STYLE D'APPRENTISSAGE : " : "LEARNING STYLE: "}{profileState.learning.style.toUpperCase()}
                  </span>
                </div>

                {/* Sub Module Selector */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'module_01', label: isFr ? 'STAR & Métriques' : 'STAR Storytelling', progress: 66 },
                    { id: 'module_02', label: isFr ? 'Débit & Mots Remplissage' : 'Vocal & Fillers', progress: 33 },
                    { id: 'module_03', label: getModuleThreeLabel(category, isFr), progress: 0 }
                  ].map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => setSelectedModuleId(mod.id)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        selectedModuleId === mod.id
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                          : 'bg-stone-50 border-stone-200 hover:border-stone-400 text-stone-700'
                      }`}
                    >
                      <p className="font-sans font-extrabold text-[10px] uppercase tracking-tight line-clamp-1">{mod.label}</p>
                      <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden mt-1.5">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${mod.progress}%` }} />
                      </div>
                      <span className="font-mono text-[8px] text-stone-400 mt-1 block">{mod.progress}% {isFr ? "fini" : "done"}</span>
                    </button>
                  ))}
                </div>

                {/* Selected Module Detail & Drills */}
                {selectedModuleId === 'module_01' && (
                  <div className="space-y-4 animate-fade-in text-xs font-semibold">
                    <div className="space-y-1">
                      <h4 className="font-sans font-black text-stone-900 text-xs uppercase">{mData.m1Title}</h4>
                      <p className="text-[11px] text-stone-500 leading-relaxed font-semibold font-medium">
                        {mData.m1Desc}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 1.1 • Theoretical Foundation</span>
                          <span className="text-stone-700 font-bold">{mData.m1D1}</span>
                        </div>
                        {isDrillCompleted('drill_1_1') ? (
                          <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSimulationLoading(isFr ? "Lancement du Drill 1.1..." : "Launching Drill 1.1...");
                              setTimeout(() => {
                                setSimulationLoading(null);
                                onChangeTab({ tab: 'train', drillId: 'drill_1_1' });
                              }, 1500);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl cursor-pointer"
                          >
                            {isFr ? "Pratiquer" : "Start Drill"}
                          </button>
                        )}
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 1.2 • Practical Challenge</span>
                          <span className="text-stone-700 font-bold">{mData.m1D2}</span>
                        </div>
                        {isDrillCompleted('drill_1_2') ? (
                          <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSimulationLoading(isFr ? "Lancement du Drill 1.2..." : "Launching Drill 1.2...");
                              setTimeout(() => {
                                setSimulationLoading(null);
                                onChangeTab({ tab: 'train', drillId: 'drill_1_2' });
                              }, 1500);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl cursor-pointer"
                          >
                            {isFr ? "Pratiquer" : "Start Drill"}
                          </button>
                        )}
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 1.3 • Live Interactive simulation</span>
                          <span className="text-stone-700 font-bold">{mData.m1D3}</span>
                        </div>
                        {isDrillCompleted('drill_1_3') ? (
                          <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSimulationLoading(isFr ? "Lancement du Drill 1.3..." : "Launching Drill 1.3...");
                              setTimeout(() => {
                                setSimulationLoading(null);
                                onChangeTab({ tab: 'train', drillId: 'drill_1_3' });
                              }, 1500);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl cursor-pointer"
                          >
                            {isFr ? "Pratiquer" : "Start Drill"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedModuleId === 'module_02' && (
                  <div className="space-y-4 animate-fade-in text-xs font-semibold">
                    <div className="space-y-1">
                      <h4 className="font-sans font-black text-stone-900 text-xs uppercase">{isFr ? "Module 2 : Rythme Vocal & Suppression des Mots Parasites" : "Module 2: Pacing & Verbal Filler Eradication"}</h4>
                      <p className="text-[11px] text-stone-500 leading-relaxed font-semibold font-medium">
                        {isFr 
                          ? "Ajustez votre débit verbal pour qu'il soit stable et silencieux. Éradiquez les 'euh', 'du coup' ou 'genre' sous forte tension." 
                          : "Calibrate your acoustic cadence. Eliminate conversational pause traps (uhm, like, basically) by mastering comfortable strategic pauses."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 2.1 • Vocal Pace</span>
                          <span className="text-stone-700 font-bold">{isFr ? "Intégration du Silence Stratégique (1.5s)" : "Strategic 1.5s Silent Transitions"}</span>
                        </div>
                        {isDrillCompleted('drill_2_1') ? (
                          <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSimulationLoading(isFr ? "Lancement du Drill 2.1..." : "Launching Drill 2.1...");
                              setTimeout(() => {
                                setSimulationLoading(null);
                                onChangeTab({ tab: 'train', drillId: 'drill_2_1' });
                              }, 1500);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl cursor-pointer"
                          >
                            {isFr ? "Pratiquer" : "Start Drill"}
                          </button>
                        )}
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 2.2 • Stress Tolerance</span>
                          <span className="text-stone-700 font-bold">{isFr ? "Évitement d'Hésitations sous Provocation" : "Avoid Filler Words under Direct Challenge"}</span>
                        </div>
                        {isDrillCompleted('drill_2_2') ? (
                          <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSimulationLoading(isFr ? "Lancement du Drill 2.2..." : "Launching Drill 2.2...");
                              setTimeout(() => {
                                setSimulationLoading(null);
                                onChangeTab({ tab: 'train', drillId: 'drill_2_2' });
                              }, 1500);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl cursor-pointer"
                          >
                            {isFr ? "Pratiquer" : "Start Drill"}
                          </button>
                        )}
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 2.3 • STAR Verbal Purity</span>
                          <span className="text-stone-700 font-bold">{isFr ? "Débit Purifié STAR sans Tic de Langage" : "Perfect STAR flow with Zero Fillers"}</span>
                        </div>
                        {isDrillCompleted('drill_2_3') ? (
                          <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSimulationLoading(isFr ? "Lancement du Drill 2.3..." : "Launching Drill 2.3...");
                              setTimeout(() => {
                                setSimulationLoading(null);
                                onChangeTab({ tab: 'train', drillId: 'drill_2_3' });
                              }, 1500);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl cursor-pointer"
                          >
                            {isFr ? "Pratiquer" : "Start Drill"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedModuleId === 'module_03' && (
                  <div className="space-y-4 animate-fade-in text-xs font-semibold">
                    <div className="space-y-1">
                      <h4 className="font-sans font-black text-stone-900 text-xs uppercase">{mData.m3Title}</h4>
                      <p className="text-[11px] text-stone-500 leading-relaxed font-semibold font-medium">
                        {mData.m3Desc}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 3.1 • Crisis Speech</span>
                          <span className="text-stone-700 font-bold">{mData.m3D1}</span>
                        </div>
                        {isDrillCompleted('drill_3_1') ? (
                          <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSimulationLoading(isFr ? "Lancement du Drill 3.1..." : "Launching Drill 3.1...");
                              setTimeout(() => {
                                setSimulationLoading(null);
                                onChangeTab({ tab: 'train', drillId: 'drill_3_1' });
                              }, 1500);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl cursor-pointer"
                          >
                            {isFr ? "Pratiquer" : "Start Drill"}
                          </button>
                        )}
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 3.2 • Ownership Check</span>
                          <span className="text-stone-700 font-bold">{mData.m3D2}</span>
                        </div>
                        {isDrillCompleted('drill_3_2') ? (
                          <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSimulationLoading(isFr ? "Lancement du Drill 3.2..." : "Launching Drill 3.2...");
                              setTimeout(() => {
                                setSimulationLoading(null);
                                onChangeTab({ tab: 'train', drillId: 'drill_3_2' });
                              }, 1500);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl cursor-pointer"
                          >
                            {isFr ? "Pratiquer" : "Start Drill"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Academic AI Tutor Advisory Box */}
                <div className="bg-indigo-950 text-indigo-100 rounded-2xl p-4.5 space-y-2 border border-stone-900">
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                    <span className="font-sans font-black text-[10px] uppercase tracking-wider text-emerald-400">{isFr ? "CONSEILLER ACADÉMIQUE SHANA" : "SHANA COGNITIVE ACADEMIC TUTOR"}</span>
                  </div>
                  
                  {(() => {
                    const style = profileState.learning.style;
                    let advisorTip = '';
                    if (style === 'Needs Confidence Building') {
                      advisorTip = isFr 
                        ? "Puisque votre style privilégie le soutien de la confiance, Shana a allégé les sanctions de débit. Concentrez-vous sur la validation des étapes 'Situation' et 'Action' de STAR, en respirant profondément entre chaque bloc de phrase."
                        : "Since your profile style requires confidence building, we have lowered speaking speed friction. Focus purely on declaring clean 'Situation' and 'Action' parameters, taking full breaths at sentence transitions.";
                    } else if (style === 'Fast Learner') {
                      advisorTip = isFr 
                        ? "Profil 'Fast Learner' détecté. L'analyse adaptative accélère votre cadence et va introduire des questions provocatrices d'échecs de production pour forcer votre régulation émotionnelle à s'ajuster en temps réel."
                        : "Fast Learner profile active. The simulator is configured to compress response timers, trigger unexpected failure-injection questions, and test real-time structural recovery under stress.";
                    } else if (style === 'Practice Oriented') {
                      advisorTip = isFr 
                        ? "Comme vous apprenez par la pratique directe, nous avons réduit la théorie de 70%. Chaque leçon est remplacée par des simulations courtes vocales de 2 minutes avec rétroaction acoustique immédiate."
                        : "As a highly simulation-oriented practitioner, cognitive lessons are replaced with live interactive voice drills. Complete 3 consecutive drills to unlock the SRE target scenarios.";
                    } else {
                      advisorTip = isFr 
                        ? "Style visuel/structuré actif. Vos rapports d'erreurs afficheront des décompositions syntaxiques exhaustives de vos réponses vocales pour vous permettre de recalibrer chaque composant de manière logique."
                        : "Structured analytic mode active. Review logs contain explicit sentence-reconstruction flows showing exactly where STAR compliance drifted, helping you optimize logically.";
                    }
                    return <p className="text-[11px] leading-relaxed text-indigo-200 font-semibold italic">"{advisorTip}"</p>;
                  })()}
                </div>

              </div>

            </div>

            {/* RIGHT COLUMN: JOB MATCHING SYSTEM (Col span 5) */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* 3. JOB MATCHING SYSTEM */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-6">
                <div className="flex justify-between items-center border-b border-stone-150 pb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#18633F]" />
                    <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                      {isFr ? "3. Système de Matching & Offres" : "3. Algorithmic Job Matching"}
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono font-black bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded uppercase">
                    {isFr ? "Actif" : "Active Match"}
                  </span>
                </div>

                {/* Job Cards */}
                <div className="space-y-4">
                  {getDynamicJobs(category, isFr, averageCompetencyScore).map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`p-4 rounded-3xl border transition-all text-left cursor-pointer space-y-3 ${
                        selectedJobId === job.id
                          ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                          : 'bg-white border-stone-200 hover:border-stone-400 text-stone-900'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5">
                          <h4 className="font-sans font-black text-xs uppercase leading-snug">{job.title}</h4>
                          <p className={`text-[10px] font-bold ${selectedJobId === job.id ? 'text-stone-300' : 'text-stone-500'}`}>{job.company}</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-black text-sm block ${selectedJobId === job.id ? 'text-[#A7F3D0]' : 'text-indigo-600'}`}>{job.match}%</span>
                          <span className="text-[8px] uppercase tracking-wider text-stone-400 block font-bold leading-none">{isFr ? "COMPATIBILITÉ" : "COMPATIBILITY"}</span>
                        </div>
                      </div>

                      {/* Quick Meta */}
                      <div className="flex gap-3 text-[9px] font-mono uppercase font-bold text-stone-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.loc}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.comp}</span>
                      </div>

                      {/* Expanded Section if Selected */}
                      {selectedJobId === job.id && (
                        <div className="pt-3 border-t border-stone-800 space-y-3 animate-fade-in text-[11px] font-semibold">
                          <p className="text-stone-300 leading-relaxed font-semibold">
                            {job.desc}
                          </p>
                          
                          {/* Strengths & Gaps Analysis */}
                          <div className="space-y-2 pt-1">
                            <div className="space-y-1">
                              <span className="text-[8.5px] uppercase font-mono tracking-widest text-[#A7F3D0] block font-bold">{isFr ? "Points Forts Validés :" : "Verified Fit Strengths:"}</span>
                              <ul className="space-y-1 pl-2 text-stone-200 font-semibold">
                                {job.strengths.map((str, i) => (
                                  <li key={i} className="flex gap-1.5 items-start">
                                    <span className="text-emerald-400">✓</span>
                                    <span>{str}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-[8.5px] uppercase font-mono tracking-widest text-rose-300 block font-bold">{isFr ? "Axe de Recalibrage :" : "Missing / Gaps to close:"}</span>
                              <ul className="space-y-1 pl-2 text-stone-300 font-semibold">
                                {job.gaps.map((gap, i) => (
                                  <li key={i} className="flex gap-1.5 items-start">
                                    <span className="text-rose-400">✗</span>
                                    <span>{gap}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Launch button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSimulationLoading(isFr ? `Initialisation de la simulation pour ${job.company}...` : `Launching tailored simulation for ${job.company}...`);
                              setTimeout(() => {
                                setSimulationLoading(null);
                                onChangeTab('train');
                              }, 1500);
                            }}
                            className="w-full mt-2 py-2 bg-[#A7F3D0] hover:bg-[#86efac] text-stone-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>{isFr ? "Lancer l'Entretien Dédié" : "Launch Target Job Interview"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {subTab === 'recruiter' && (
        <div className="space-y-8 animate-fade-in" id="recruiter-subtab-panel">
          {/* Phase 29 Introductory Card */}
          <div className="bg-gradient-to-br from-violet-900 to-indigo-950 border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_rgba(17,17,17,1)] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2 text-left max-w-2xl">
              <span className="font-mono text-[9px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                {isFr ? "Phase 29 : Plateforme de Recrutement d'Entreprise" : "Phase 29: Enterprise Recruiter Platform"}
              </span>
              <h3 className="font-sans font-black text-lg uppercase tracking-tight text-white">
                {isFr ? "Intelligence Recruteur B2B & Workspaces Collaboratifs" : "B2B Recruiter Intelligence & Collaborative Workspaces"}
              </h3>
              <p className="text-stone-300 text-xs leading-relaxed font-semibold">
                {isFr
                  ? "Configurez des modèles d'entretien personnalisés par entreprise, pilotez les équipes d'acquisition de talents, synchronisez vos flux ATS (Applicant Tracking Systems) et optimisez les allocations de licences."
                  : "Calibrate bespoke corporate interview frameworks, orchestrate multi-tenant talent acquisition teams, synchronize high-fidelity ATS pipelines, and govern active seat licensing allocations."}
              </p>
            </div>
            
            <button
              onClick={() => onChangeTab('recruiter-workspace')}
              className="px-6 py-3.5 bg-white hover:bg-stone-100 text-stone-950 font-black text-xs uppercase tracking-widest rounded-2xl border-2 border-stone-950 shadow-[4px_4px_0px_0px_#111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#111] transition-all cursor-pointer flex items-center gap-2 shrink-0 self-start md:self-center"
            >
              <Briefcase className="w-4 h-4 text-violet-700 animate-bounce" />
              <span>{isFr ? "Ouvrir l'Espace Plein Écran" : "Open Workspace Full-Screen"}</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-950" />
            </button>
          </div>

          {/* Embedded Full Interactive Console */}
          <div className="bg-white border-2 border-stone-950 p-6 rounded-[32px] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] text-left">
            <EnterpriseCenter
              currentUser={StorageService.getSession()?.user || { id: userId, firstName: 'Candidate', lastName: '', email: 'eocochat@gmail.com', role: 'admin' as const, createdAt: new Date().toISOString() }}
              lang={lang}
            />
          </div>
        </div>
      )}

    </div>
  );
}

// Help sub-components
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
