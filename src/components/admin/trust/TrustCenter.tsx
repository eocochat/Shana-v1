import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileLock, 
  UserCheck, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  FileText, 
  Search, 
  Download, 
  Plus, 
  RefreshCw, 
  Clock, 
  HelpCircle,
  Eye,
  Trash2,
  Archive,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Send,
  UserX,
  FileSpreadsheet,
  Beaker,
  Play,
  Gauge,
  Terminal
} from 'lucide-react';
import { User } from '../../../types';
import { 
  ConsentManager, 
  RetentionManager, 
  PolicyEngine, 
  CandidateConsent, 
  LifecyclePolicy, 
  PrivacyControlConfig 
} from '../../../modules/privacy';
import { 
  AuditExplorer, 
  TrustController, 
  ComplianceAuditEvent, 
  ComplianceAlert 
} from '../../../services/compliance';
import { EvaluationMonitor, AIOpsEvaluation } from '../../../modules/evaluation';

interface TrustCenterProps {
  currentUser: User;
  lang?: 'FR' | 'EN';
}

type SectionTab = 'consent' | 'evaluation' | 'audit' | 'lifecycle' | 'privacy' | 'qa';

export default function TrustCenter({ currentUser, lang = 'FR' }: TrustCenterProps) {
  const isSuperAdmin = currentUser.role === 'super_admin';

  // Compliance alerts
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  
  // Section 1: Consent Center State
  const [consents, setConsents] = useState<CandidateConsent[]>([]);
  const [selectedConsent, setSelectedConsent] = useState<CandidateConsent | null>(null);
  const [consentSearch, setConsentSearch] = useState('');

  // Section 2: Evaluation Governance State
  const [evaluations, setEvaluations] = useState<AIOpsEvaluation[]>([]);

  // Section 3: Audit Explorer State
  const [auditEvents, setAuditEvents] = useState<ComplianceAuditEvent[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterFeature, setFilterFeature] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState('');

  // Section 4: Data Lifecycle State
  const [policies, setPolicies] = useState<LifecyclePolicy[]>([]);
  const [draftPolicy, setDraftPolicy] = useState<LifecyclePolicy | null>(null);
  const [showDraftPolicyForm, setShowDraftPolicyForm] = useState(false);
  const [newPolicyCategory, setNewPolicyCategory] = useState<LifecyclePolicy['category']>('sessions');
  const [newPolicyRule, setNewPolicyRule] = useState<LifecyclePolicy['rule']>('active');
  const [newPolicyDuration, setNewPolicyDuration] = useState(180);

  // Section 5: Privacy Controls State
  const [privacyConfig, setPrivacyConfig] = useState<PrivacyControlConfig | null>(null);
  const [draftPrivacy, setDraftPrivacy] = useState<PrivacyControlConfig | null>(null);
  const [showPrivacyConfirm, setShowPrivacyConfirm] = useState(false);
  const [privacyFormState, setPrivacyFormState] = useState<Partial<PrivacyControlConfig>>({});

  // Section 6: Testing & QA State
  const [qaReport, setQaReport] = useState<any | null>(null);
  const [qaHistory, setQaHistory] = useState<any[]>([]);
  const [qaRunning, setQaRunning] = useState(false);
  const [selectedHistoryReport, setSelectedHistoryReport] = useState<any | null>(null);

  // Active navigation section
  const [activeTab, setActiveTab] = useState<SectionTab>('consent');
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchQaHistory = async () => {
    try {
      const res = await fetch("/api/v1/compliance/tests/history");
      if (res.ok) {
        const body = await res.json();
        if (body && body.success) {
          setQaHistory(body.data || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch QA history:", err);
    }
  };

  const handleRunQaSuite = async () => {
    setQaRunning(true);
    setQaReport(null);
    try {
      const res = await fetch("/api/v1/compliance/tests/run", {
        method: "POST"
      });
      const body = await res.json();
      if (res.ok && body && body.success) {
        setQaReport(body.data);
        flashMessage(lang === 'FR' ? "Suite de test d'assurance qualité exécutée avec succès !" : "QA automated testing suite executed successfully!", "success");
        fetchQaHistory();
      } else {
        flashMessage(body?.error || (lang === 'FR' ? "Échec de l'exécution de la suite de tests." : "Failed to run QA test suite."), "error");
      }
    } catch (err: any) {
      flashMessage(err?.message || "Error running QA testing suite", "error");
    } finally {
      setQaRunning(false);
    }
  };

  // Load all initial data
  const loadData = () => {
    setConsents(ConsentManager.getConsents());
    setEvaluations(EvaluationMonitor.getEvaluations());
    setAuditEvents(AuditExplorer.getEvents());
    setPolicies(RetentionManager.getPolicies());
    setPrivacyConfig(PolicyEngine.getPrivacyConfig());
    setAlerts(TrustController.getAlerts());
    fetchQaHistory();

    // Load drafts from storage
    setDraftPolicy(TrustController.getDraftPolicy());
    const savedDraftPrivacy = TrustController.getDraftPrivacy();
    setDraftPrivacy(savedDraftPrivacy);
    if (savedDraftPrivacy) {
      setPrivacyFormState(savedDraftPrivacy);
    } else {
      const active = PolicyEngine.getPrivacyConfig();
      setPrivacyFormState(active);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const flashMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  // Section 1 Actions: View consent summary
  const handleExportConsentSummary = (consent: CandidateConsent) => {
    // Generate simple printable text or downloadable summary
    const title = lang === 'FR' ? "Résumé de Consentement Shana" : "Shana Candidate Consent Summary";
    const text = `
=========================================
${title.toUpperCase()}
=========================================
ID: ${consent.id}
Candidate: ${consent.candidateName} (${consent.candidateEmail})
Date Accepted: ${new Date(consent.acceptedAt).toLocaleString()}
Version: ${consent.version}
Status: ${consent.status.toUpperCase()}

Consent details:
-----------------------------------------
- Camera access permitted: ${consent.cameraConsent ? 'YES' : 'NO'}
- Microphone access permitted: ${consent.microphoneConsent ? 'YES' : 'NO'}
- Interview processing permitted: ${consent.interviewConsent ? 'YES' : 'NO'}
- Non-identifying analytics: ${consent.analyticsConsent ? 'YES' : 'NO'}
- Language preference: ${consent.language}

-----------------------------------------
GDPR Compliance Code: SHA-CONS-${consent.id.toUpperCase()}-${consent.version.replace('.', '-')}
    `.trim();

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consent-summary-${consent.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    AuditExplorer.logEvent(
      currentUser.email,
      currentUser.role as any,
      'consent',
      'export_consent',
      `Exported consent summary for candidate ${consent.candidateName} (${consent.id})`,
      'Trust Console Client',
      'success'
    );
    flashMessage(lang === 'FR' ? "Résumé de consentement exporté !" : "Consent summary exported successfully!");
  };

  // Revoke candidate consent
  const handleRevokeConsent = (id: string) => {
    ConsentManager.revokeConsent(id, currentUser.email);
    AuditExplorer.logEvent(
      currentUser.email,
      currentUser.role as any,
      'consent',
      'revoke_consent',
      `Revoked consent for consent record ${id}`,
      'Trust Console Client',
      'success'
    );
    loadData();
    setSelectedConsent(null);
    flashMessage(
      lang === 'FR' 
        ? "Consentement révoqué avec succès ! Toutes les autorisations de médias sont désactivées." 
        : "Consent revoked successfully! All active media permits have been disabled."
    );
  };

  // Section 2 Actions: Approve, flag, mark for review
  const handleEvaluationStatus = (id: string, newStatus: AIOpsEvaluation['status']) => {
    EvaluationMonitor.updateStatus(id, newStatus, currentUser.email);
    AuditExplorer.logEvent(
      currentUser.email,
      currentUser.role as any,
      'evaluation',
      `${newStatus}_evaluation`,
      `Updated evaluation ${id} status to ${newStatus.toUpperCase()}`,
      'Trust Console Client',
      'success'
    );
    loadData();
    flashMessage(
      lang === 'FR'
        ? `Évaluation mise à jour avec le statut: ${newStatus.toUpperCase()}`
        : `Evaluation successfully updated with status: ${newStatus.toUpperCase()}`
    );
  };

  // Section 3 Actions: CSV Export
  const handleExportCSV = () => {
    if (!isSuperAdmin) {
      flashMessage(lang === 'FR' ? "Seul le Super Admin peut approuver les exports." : "Only the Super Admin can approve exports.", 'error');
      return;
    }
    const csvContent = AuditExplorer.exportToCSV(filteredEvents);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shana-compliance-audit-logs.csv`;
    link.click();
    URL.revokeObjectURL(url);

    AuditExplorer.logEvent(
      currentUser.email,
      'super_admin',
      'access',
      'export_audit_csv',
      `Approved and exported compliance audit logs to CSV format.`,
      'Trust Console Client',
      'success'
    );
    flashMessage(lang === 'FR' ? "Logs d'audit exportés en CSV !" : "Audit logs exported in CSV format!");
  };

  // Section 4 Actions: Data Lifecycle Draft -> Review -> Approve -> Publish
  const handleCreatePolicyDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const newDraft: LifecyclePolicy = {
      id: `pol_draft_${newPolicyCategory}`,
      category: newPolicyCategory,
      rule: newPolicyRule,
      durationDays: newPolicyDuration,
      status: 'draft',
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.email
    };

    TrustController.saveDraftPolicy(newDraft);
    AuditExplorer.logEvent(
      currentUser.email,
      currentUser.role as any,
      'retention',
      'create_policy_draft',
      `Created draft retention policy for category [${newPolicyCategory.toUpperCase()}]`,
      'Trust Console Client',
      'success'
    );
    setDraftPolicy(newDraft);
    setShowDraftPolicyForm(false);
    flashMessage(lang === 'FR' ? "Brouillon de politique créé !" : "Policy draft created successfully!");
  };

  const handleSubmitPolicyForReview = () => {
    if (!draftPolicy) return;
    const updated = { ...draftPolicy, status: 'review' as const };
    TrustController.saveDraftPolicy(updated);
    AuditExplorer.logEvent(
      currentUser.email,
      currentUser.role as any,
      'retention',
      'submit_policy_review',
      `Submitted retention policy draft for category [${draftPolicy.category.toUpperCase()}] to review.`,
      'Trust Console Client',
      'success'
    );
    setDraftPolicy(updated);
    flashMessage(lang === 'FR' ? "Politique soumise pour examen !" : "Policy submitted for review!");
  };

  const handleApprovePolicyDraft = () => {
    if (!isSuperAdmin) {
      flashMessage(lang === 'FR' ? "Action réservée au Super Admin !" : "Action reserved for Super Admin!", 'error');
      return;
    }
    if (!draftPolicy) return;
    const updated = { ...draftPolicy, status: 'approved' as const };
    TrustController.saveDraftPolicy(updated);
    AuditExplorer.logEvent(
      currentUser.email,
      'super_admin',
      'retention',
      'approve_policy_draft',
      `Approved retention policy draft for category [${draftPolicy.category.toUpperCase()}]. Ready to publish.`,
      'Trust Console Client',
      'success'
    );
    setDraftPolicy(updated);
    flashMessage(lang === 'FR' ? "Brouillon de politique approuvé !" : "Policy draft approved successfully!");
  };

  const handlePublishPolicy = () => {
    if (!isSuperAdmin) {
      flashMessage(lang === 'FR' ? "Action réservée au Super Admin !" : "Action reserved for Super Admin!", 'error');
      return;
    }
    if (!draftPolicy) return;
    
    // Copy the draft values into the live list of policies
    const livePolicy: LifecyclePolicy = {
      ...draftPolicy,
      id: `pol_${draftPolicy.category.replace(' ', '_')}`,
      status: 'published' as const,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.email
    };

    RetentionManager.savePolicy(livePolicy);
    TrustController.saveDraftPolicy(null); // Clear draft

    AuditExplorer.logEvent(
      currentUser.email,
      'super_admin',
      'retention',
      'publish_policy',
      `Published live data retention policy for category [${livePolicy.category.toUpperCase()}]. Rule: ${livePolicy.rule} (${livePolicy.durationDays} days).`,
      'Trust Console Client',
      'success'
    );

    setDraftPolicy(null);
    setPolicies(RetentionManager.getPolicies());
    flashMessage(
      lang === 'FR' 
        ? `Nouvelle politique de rétention publiée pour [${livePolicy.category.toUpperCase()}] !` 
        : `New data retention policy published successfully for [${livePolicy.category.toUpperCase()}]!`
    );
  };

  const handleCancelPolicyDraft = () => {
    TrustController.saveDraftPolicy(null);
    setDraftPolicy(null);
    flashMessage(lang === 'FR' ? "Brouillon annulé." : "Policy draft canceled.");
  };

  // Section 5 Actions: Privacy Controls Draft -> Review -> Approve -> Publish
  const handlePrivacyFormChange = (key: keyof PrivacyControlConfig, value: any) => {
    setPrivacyFormState(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePrivacyDraft = () => {
    const draft: PrivacyControlConfig = {
      id: 'priv_cfg_current',
      dataVisibility: privacyFormState.dataVisibility || 'restricted',
      consentRequirement: privacyFormState.consentRequirement || 'mandatory',
      cameraPolicy: privacyFormState.cameraPolicy || 'stream_only',
      microphonePolicy: privacyFormState.microphonePolicy || 'stream_transcribe',
      retentionPolicyId: privacyFormState.retentionPolicyId || 'pol_sessions',
      status: 'draft',
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.email
    };

    TrustController.saveDraftPrivacy(draft);
    AuditExplorer.logEvent(
      currentUser.email,
      currentUser.role as any,
      'privacy',
      'create_privacy_draft',
      `Created draft Privacy Control Configuration.`,
      'Trust Console Client',
      'success'
    );
    setDraftPrivacy(draft);
    flashMessage(lang === 'FR' ? "Brouillon de configuration enregistré !" : "Privacy config draft saved!");
  };

  const handleSubmitPrivacyForReview = () => {
    if (!draftPrivacy) return;
    const updated = { ...draftPrivacy, status: 'review' as const };
    TrustController.saveDraftPrivacy(updated);
    AuditExplorer.logEvent(
      currentUser.email,
      currentUser.role as any,
      'privacy',
      'submit_privacy_review',
      `Submitted Privacy Control Configuration to active review.`,
      'Trust Console Client',
      'success'
    );
    setDraftPrivacy(updated);
    flashMessage(lang === 'FR' ? "Soumis pour examen !" : "Privacy draft submitted for review!");
  };

  const handleApprovePrivacyDraft = () => {
    if (!isSuperAdmin) {
      flashMessage(lang === 'FR' ? "Action réservée au Super Admin !" : "Action reserved for Super Admin!", 'error');
      return;
    }
    if (!draftPrivacy) return;
    const updated = { ...draftPrivacy, status: 'approved' as const };
    TrustController.saveDraftPrivacy(updated);
    AuditExplorer.logEvent(
      currentUser.email,
      'super_admin',
      'privacy',
      'approve_privacy_draft',
      `Approved Privacy Control Configuration draft. Ready to publish.`,
      'Trust Console Client',
      'success'
    );
    setDraftPrivacy(updated);
    flashMessage(lang === 'FR' ? "Brouillon approuvé !" : "Privacy draft approved!");
  };

  const handlePublishPrivacyConfig = () => {
    if (!isSuperAdmin) {
      flashMessage(lang === 'FR' ? "Action réservée au Super Admin !" : "Action reserved for Super Admin!", 'error');
      return;
    }
    if (!draftPrivacy) return;

    const liveConfig: PrivacyControlConfig = {
      ...draftPrivacy,
      status: 'published',
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.email
    };

    PolicyEngine.savePrivacyConfig(liveConfig);
    TrustController.saveDraftPrivacy(null);

    AuditExplorer.logEvent(
      currentUser.email,
      'super_admin',
      'privacy',
      'publish_privacy_config',
      `Published live Privacy Control Configuration. Visibility: ${liveConfig.dataVisibility}, Consent: ${liveConfig.consentRequirement}.`,
      'Trust Console Client',
      'success'
    );

    setDraftPrivacy(null);
    setPrivacyConfig(liveConfig);
    setShowPrivacyConfirm(false);
    flashMessage(
      lang === 'FR'
        ? "Nouvelles règles de confidentialité publiées et actives !"
        : "New privacy controls published and active globally!"
    );
  };

  const handleCancelPrivacyDraft = () => {
    TrustController.saveDraftPrivacy(null);
    setDraftPrivacy(null);
    const active = PolicyEngine.getPrivacyConfig();
    setPrivacyFormState(active);
    flashMessage(lang === 'FR' ? "Modifications annulées." : "Modifications canceled.");
  };

  const handleResolveAlert = (id: string) => {
    if (!isSuperAdmin) {
      flashMessage(lang === 'FR' ? "Seul le Super Admin peut résoudre les alertes." : "Only the Super Admin can resolve alerts.", 'error');
      return;
    }
    TrustController.resolveAlert(id, currentUser.email);
    loadData();
    flashMessage(lang === 'FR' ? "Alerte de conformité résolue." : "Compliance alert successfully resolved.");
  };

  // Section 3 audit filtering logic
  const filteredEvents = auditEvents.filter(event => {
    if (auditSearch.trim()) {
      const search = auditSearch.toLowerCase();
      const matchActor = event.actor.toLowerCase().includes(search);
      const matchEvent = event.event.toLowerCase().includes(search);
      const matchAction = event.action.toLowerCase().includes(search);
      if (!matchActor && !matchEvent && !matchAction) return false;
    }
    if (filterDate && !event.time.startsWith(filterDate)) return false;
    if (filterRole !== 'all' && event.role !== filterRole) return false;
    if (filterFeature !== 'all' && event.feature !== filterFeature) return false;
    if (filterAction !== 'all' && event.action !== filterAction) return false;
    if (filterStatus !== 'all' && event.result !== filterStatus) return false;
    return true;
  });

  // Section 1 candidate consents filtering logic
  const filteredConsents = consents.filter(consent => {
    if (!consentSearch.trim()) return true;
    const search = consentSearch.toLowerCase();
    return (
      consent.candidateName.toLowerCase().includes(search) ||
      consent.candidateEmail.toLowerCase().includes(search) ||
      consent.id.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-8" id="trust-compliance-center-stage">
      
      {/* Header Banner */}
      <div className="bg-stone-900 text-stone-100 p-8 rounded-[32px] border border-stone-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                <Shield className="w-5 h-5" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-400 font-bold">
                TRUST & COMPLIANCE CENTRE • GOVERNANCE
              </span>
            </div>
            <h1 className="font-sans font-bold text-2xl tracking-tight text-white">
              {lang === 'FR' ? "Espace Confiance et Conformité (GDPR)" : "Trust & Compliance Center"}
            </h1>
            <p className="text-stone-400 text-xs max-w-xl leading-relaxed font-medium">
              {lang === 'FR' 
                ? "Garantir le respect du RGPD, la souveraineté des données, la gestion des consentements candidats, le cycle de rétention et la transparence algorithmique." 
                : "Provides strict auditing of candidate consents, algorithmic transparency, automated lifecycle retention rules, and privacy configurations."}
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between border-t border-stone-800 pt-4 md:pt-0 md:border-0">
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2 justify-end text-xs font-semibold text-stone-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{lang === 'FR' ? "Souveraineté Activée" : "Sovereignty Active"}</span>
              </div>
              <p className="text-[10px] font-mono text-stone-500">
                GDPR & AI Act Compliant
              </p>
            </div>
            <button
              onClick={loadData}
              className="p-2.5 bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-white rounded-xl border border-stone-700 transition-all cursor-pointer active:scale-95"
              title={lang === 'FR' ? "Actualiser" : "Reload standards"}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Alerts Panel (Required: Generate alerts for expired consent, policy mismatch, retention failure, governance issue) */}
      {alerts.filter(a => !a.resolved).length > 0 && (
        <div className="space-y-3" id="compliance-alerts-panel">
          <div className="flex items-center gap-2 px-1">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-rose-600 font-extrabold">
              {lang === 'FR' ? "Alertes de Sécurité & Non-Conformité" : "Active Compliance & Governance Alerts"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.filter(a => !a.resolved).map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-3xl border flex gap-4 text-left ${
                  alert.severity === 'critical' 
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950' 
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <div className="mt-0.5">
                  <AlertTriangle className={`w-5 h-5 shrink-0 ${alert.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'}`} />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold opacity-70">
                      {alert.type}
                    </span>
                    <span className="text-[9px] font-mono text-[#6B7280]">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed">{alert.message}</p>
                  
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-3 py-1 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 text-stone-800 text-[9px] font-mono uppercase tracking-widest font-extrabold rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      {lang === 'FR' ? "Marquer Résolu" : "Resolve Alert"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Feedback Indicator */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl border text-center text-xs font-bold transition-all shadow-md ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Trust Subtab Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200" id="compliance-tab-bar">
        {[
          { id: 'consent', label: lang === 'FR' ? '1. Consentement' : '1. Consent Center', icon: UserCheck },
          { id: 'evaluation', label: lang === 'FR' ? '2. Gouvernance Algorithmique' : '2. Algorithmic Governance', icon: Layers },
          { id: 'audit', label: lang === 'FR' ? '3. Explorateur d\'Audit' : '3. Audit Explorer', icon: FileLock },
          { id: 'lifecycle', label: lang === 'FR' ? '4. Cycle de Rétention' : '4. Data Lifecycle', icon: Clock },
          { id: 'privacy', label: lang === 'FR' ? '5. Contrôles Vie Privée' : '5. Privacy Controls', icon: Shield },
          { id: 'qa', label: lang === 'FR' ? '6. Assurance Qualité' : '6. Automated QA', icon: Beaker }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SectionTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shrink-0 transition-all ${
                isActive 
                  ? 'bg-indigo-950 text-white shadow-md' 
                  : 'text-stone-500 hover:text-stone-950 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sections Panels Canvas */}
      <div className="animate-fade-in" id="compliance-main-canvas">

        {/* SECTION 1: CONSENT CENTER */}
        {activeTab === 'consent' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left" id="section-1-consent-center">
            
            {/* Consents List (2 cols) */}
            <div className="lg:col-span-2 bg-white border border-stone-200 rounded-[32px] shadow-xs overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-stone-50/50">
                <div>
                  <h3 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Registre des Consentements GDPR" : "Candidate GDPR Consents"}
                  </h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Suivi en direct de l'acceptation et de la révocation des clauses." : "Monitor individual candidate camera, microphone, and interview data handling agreements."}
                  </p>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    value={consentSearch}
                    onChange={(e) => setConsentSearch(e.target.value)}
                    placeholder={lang === 'FR' ? "Rechercher candidat..." : "Search candidates..."}
                    className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-stone-400"
                  />
                </div>
              </div>

              <div className="divide-y divide-stone-150">
                {filteredConsents.map((consent) => (
                  <div 
                    key={consent.id}
                    onClick={() => setSelectedConsent(consent)}
                    className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors cursor-pointer hover:bg-stone-50/50 ${
                      selectedConsent?.id === consent.id ? 'bg-stone-50' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-xs text-stone-900">{consent.candidateName}</span>
                        <span className="font-mono text-[9px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                          {consent.version}
                        </span>
                        <span className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded-full uppercase ${
                          consent.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : consent.status === 'revoked'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {consent.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] font-semibold">{consent.candidateEmail}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex gap-2">
                        {/* Compact icons showing camera, micro, data & analytics status */}
                        <span className={`p-1 rounded-md text-[10px] font-mono uppercase font-bold border ${consent.cameraConsent ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-stone-50 text-stone-400 border-stone-100'}`}>
                          CAM
                        </span>
                        <span className={`p-1 rounded-md text-[10px] font-mono uppercase font-bold border ${consent.microphoneConsent ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-stone-50 text-stone-400 border-stone-100'}`}>
                          MIC
                        </span>
                        <span className={`p-1 rounded-md text-[10px] font-mono uppercase font-bold border ${consent.interviewConsent ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-stone-50 text-stone-400 border-stone-100'}`}>
                          DATA
                        </span>
                        <span className={`p-1 rounded-md text-[10px] font-mono uppercase font-bold border ${consent.analyticsConsent ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-stone-50 text-stone-400 border-stone-100'}`}>
                          STAT
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                ))}

                {filteredConsents.length === 0 && (
                  <div className="p-8 text-center text-stone-400 text-xs font-semibold">
                    {lang === 'FR' ? "Aucun consentement trouvé." : "No consents matched search parameters."}
                  </div>
                )}
              </div>
            </div>

            {/* Consent Detail Inspector */}
            <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4 space-y-1">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Détails de Consentement" : "Consent Audit Card"}
                  </h3>
                </div>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Inspectez ou révoquez l'accord d'un candidat." : "Review legal acceptances or revoke authorization."}
                </p>
              </div>

              {selectedConsent ? (
                <div className="space-y-6 animate-fade-in text-xs font-semibold text-stone-700">
                  <div className="space-y-2 p-4 bg-stone-50 rounded-2xl border border-stone-150">
                    <p className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Candidate Details</p>
                    <div className="space-y-1.5 text-stone-900">
                      <p className="font-bold text-sm text-stone-950">{selectedConsent.candidateName}</p>
                      <p className="text-[#6B7280] font-mono text-[11px]">{selectedConsent.candidateEmail}</p>
                      <p className="text-[#6B7280] font-mono text-[10px] mt-1">
                        Accepted: {new Date(selectedConsent.acceptedAt).toLocaleString()}
                      </p>
                      <p className="text-[#6B7280] font-mono text-[10px]">
                        Version: {selectedConsent.version} ({selectedConsent.language})
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Consents Status</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="text-[#6B7280]">{lang === 'FR' ? "Caméra" : "Camera Access"}</span>
                        {selectedConsent.cameraConsent ? (
                          <span className="text-emerald-600 flex items-center gap-1 font-bold"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>
                        ) : (
                          <span className="text-stone-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Refused</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="text-[#6B7280]">{lang === 'FR' ? "Microphone" : "Microphone Access"}</span>
                        {selectedConsent.microphoneConsent ? (
                          <span className="text-emerald-600 flex items-center gap-1 font-bold"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>
                        ) : (
                          <span className="text-stone-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Refused</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="text-[#6B7280]">{lang === 'FR' ? "Traitement de l'Entretien" : "Interview Processing"}</span>
                        {selectedConsent.interviewConsent ? (
                          <span className="text-emerald-600 flex items-center gap-1 font-bold"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>
                        ) : (
                          <span className="text-stone-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Refused</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#6B7280]">{lang === 'FR' ? "Analyses de Performance" : "Performance Analytics"}</span>
                        {selectedConsent.analyticsConsent ? (
                          <span className="text-emerald-600 flex items-center gap-1 font-bold"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>
                        ) : (
                          <span className="text-stone-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Refused</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-100">
                    <button
                      onClick={() => handleExportConsentSummary(selectedConsent)}
                      className="py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-mono uppercase text-[10px] tracking-widest font-extrabold cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'FR' ? "Exporter" : "Export Card"}</span>
                    </button>

                    <button
                      onClick={() => handleRevokeConsent(selectedConsent.id)}
                      className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-mono uppercase text-[10px] tracking-widest font-extrabold cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>{lang === 'FR' ? "Révoquer" : "Revoke"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 text-stone-400">
                  <HelpCircle className="w-10 h-10 stroke-[1.25]" />
                  <p className="text-xs font-bold">
                    {lang === 'FR' ? "Sélectionnez un candidat" : "Select a candidate"}
                  </p>
                  <p className="text-[10px] text-[#6B7280]">
                    {lang === 'FR' ? "Cliquez sur une ligne pour afficher les détails du consentement." : "Click on a telemetry log to review detailed candidate consent."}
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* SECTION 2: EVALUATION GOVERNANCE */}
        {activeTab === 'evaluation' && (
          <div className="space-y-6 text-left" id="section-2-evaluation-governance">
            
            <div className="bg-stone-50 border border-stone-200 p-6 rounded-[32px] space-y-3">
              <h4 className="font-sans font-bold text-sm text-stone-900">
                {lang === 'FR' ? "Règles de Gouvernance Algorithmique" : "Algorithmic Governance & Audit Rules"}
              </h4>
              <p className="text-[#6B7280] text-xs font-semibold leading-relaxed">
                {lang === 'FR'
                  ? "Conformément à la réglementation de l'Union Européenne sur l'IA, les scores générés par des algorithmes ne peuvent pas être modifiés manuellement. Seule la validation globale de l'évaluation ou le signalement en cas d'erreur de parsing structurel est autorisé."
                  : "Under European AI regulation frameworks, machine-generated candidate evaluation scores are read-only and sealed from manual direct modifications to prevent bias. Reviewers can approve, flag for repair, or request manual human reassessment."}
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-[32px] shadow-xs overflow-hidden">
              <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                <h3 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? "Dossiers des Évaluations de l'IA" : "System Evaluation Quality Registry"}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100 font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                      <th className="p-4">{lang === 'FR' ? "ID" : "EVAL ID"}</th>
                      <th className="p-4">{lang === 'FR' ? "CANDIDAT" : "CANDIDATE"}</th>
                      <th className="p-4">{lang === 'FR' ? "MODE D'ENTRETIEN" : "EVAL MODE"}</th>
                      <th className="p-4">{lang === 'FR' ? "VERSION MOTEUR" : "EVAL VERSION"}</th>
                      <th className="p-4">{lang === 'FR' ? "CONFIANCE" : "CONFIDENCE"}</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-semibold text-stone-700">
                    {evaluations.map((ev) => (
                      <tr key={ev.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-4 font-mono text-stone-900 font-bold">{ev.id}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-sans font-bold text-stone-950">{ev.candidateName}</p>
                            <p className="text-[10px] text-[#6B7280]">{ev.roleApplied}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-sans text-stone-700 uppercase tracking-wider text-[10px]">
                            {ev.interviewConfig.vocalRequired ? 'Voice-Activated Assessment' : 'Standard Web Assessment'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-stone-600">
                          v2.1 (FR/EN Engine)
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase ${
                            ev.confidenceLevel === 'high' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : ev.confidenceLevel === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {ev.confidenceLevel}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-sans text-[10px] font-bold uppercase ${
                            ev.status === 'approved' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : ev.status === 'flagged'
                              ? 'bg-rose-100 text-rose-800'
                              : ev.status === 'review_requested'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-stone-100 text-stone-800'
                          }`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEvaluationStatus(ev.id, 'approved')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                            >
                              {lang === 'FR' ? "Valider" : "Approve"}
                            </button>
                            <button
                              onClick={() => handleEvaluationStatus(ev.id, 'flagged')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                            >
                              {lang === 'FR' ? "Signaler" : "Flag"}
                            </button>
                            <button
                              onClick={() => handleEvaluationStatus(ev.id, 'review_requested')}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                            >
                              {lang === 'FR' ? "Révision" : "Review"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* SECTION 3: AUDIT EXPLORER */}
        {activeTab === 'audit' && (
          <div className="space-y-6 text-left" id="section-3-audit-explorer">
            
            {/* Filtering Control Bar */}
            <div className="bg-white border border-stone-200 p-6 rounded-[32px] shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h4 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? "Filtres de Recherche d'Audit" : "Audit Log Filtering Engine"}
                </h4>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-initial">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder={lang === 'FR' ? "Filtrer par acteur..." : "Filter by actor..."}
                      className="pl-9 pr-4 py-1.5 bg-stone-50 border border-stone-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-hidden focus:border-stone-400 w-full"
                    />
                  </div>
                  
                  {isSuperAdmin && (
                    <button
                      onClick={handleExportCSV}
                      className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      title={lang === 'FR' ? "Exporter CSV" : "Export to CSV only"}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="font-mono uppercase text-[9px] font-extrabold tracking-widest hidden sm:inline">
                        CSV ONLY
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Date Filter */}
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "Date d'Événement" : "Event Date"}
                  </label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs font-semibold"
                  />
                </div>

                {/* Role Filter */}
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">Role</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs font-semibold"
                  >
                    <option value="all">{lang === 'FR' ? "Tous les Rôles" : "All Roles"}</option>
                    <option value="candidate">{lang === 'FR' ? "Candidat" : "Candidate"}</option>
                    <option value="admin">{lang === 'FR' ? "Administrateur" : "Admin"}</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="system">System</option>
                  </select>
                </div>

                {/* Feature Filter */}
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "Fonctionnalité" : "Feature"}
                  </label>
                  <select
                    value={filterFeature}
                    onChange={(e) => setFilterFeature(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs font-semibold"
                  >
                    <option value="all">{lang === 'FR' ? "Toutes" : "All Features"}</option>
                    <option value="privacy">Privacy Controls</option>
                    <option value="consent">Consent Center</option>
                    <option value="evaluation">Evaluation Governance</option>
                    <option value="retention">Data Lifecycle</option>
                    <option value="access">Access Controls</option>
                  </select>
                </div>

                {/* Action Filter */}
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">Action</label>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs font-semibold"
                  >
                    <option value="all">{lang === 'FR' ? "Toutes" : "All Actions"}</option>
                    <option value="publish_policy">Publish Policy</option>
                    <option value="accept_consent">Accept Consent</option>
                    <option value="revoke_consent">Revoke Consent</option>
                    <option value="flag_evaluation">Flag Evaluation</option>
                    <option value="purge_logs">Purge Logs</option>
                    <option value="edit_draft">Edit Draft</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs font-semibold"
                  >
                    <option value="all">{lang === 'FR' ? "Tous" : "All Status"}</option>
                    <option value="success">{lang === 'FR' ? "Succès" : "Success"}</option>
                    <option value="warning">Warning</option>
                    <option value="failure">{lang === 'FR' ? "Échec" : "Failure"}</option>
                    <option value="pending_review">{lang === 'FR' ? "En Révision" : "Pending Review"}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white border border-stone-200 rounded-[32px] shadow-xs overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#6B7280] font-bold">
                  {lang === 'FR' ? `${filteredEvents.length} événements correspondants` : `${filteredEvents.length} audited events found`}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100 font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                      <th className="p-4">{lang === 'FR' ? "ACTEUR" : "ACTOR"}</th>
                      <th className="p-4">{lang === 'FR' ? "FONCTIONNALITÉ" : "FEATURE"}</th>
                      <th className="p-4">EVENT</th>
                      <th className="p-4">{lang === 'FR' ? "HORODATAGE" : "TIME"}</th>
                      <th className="p-4">ORIGIN</th>
                      <th className="p-4">RESULT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-semibold text-stone-700">
                    {filteredEvents.map((e) => (
                      <tr key={e.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-sans font-bold text-stone-950">{e.actor}</p>
                            <p className="text-[10px] text-indigo-600 font-mono font-bold uppercase">{e.role}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 font-mono text-[9px] bg-stone-100 text-stone-600 rounded">
                            {e.feature}
                          </span>
                        </td>
                        <td className="p-4 text-stone-900 leading-relaxed font-sans font-medium" style={{ minWidth: '240px' }}>
                          {e.event}
                        </td>
                        <td className="p-4 font-mono text-[11px] text-stone-500 shrink-0">
                          {new Date(e.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-stone-400">
                          {e.origin}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase ${
                            e.result === 'success' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : e.result === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : e.result === 'pending_review'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {e.result}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {filteredEvents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-stone-400 font-bold">
                          {lang === 'FR' ? "Aucun événement d'audit ne correspond à la recherche." : "No audit events match current filter conditions."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* SECTION 4: DATA LIFECYCLE */}
        {activeTab === 'lifecycle' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left" id="section-4-data-lifecycle">
            
            {/* Left Column: Rules Grid */}
            <div className="lg:col-span-2 space-y-8">
              
              <div className="bg-white border border-stone-200 rounded-[32px] shadow-xs overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                  <div>
                    <h3 className="font-sans font-bold text-sm text-stone-900">
                      {lang === 'FR' ? "Règles Actives du Cycle de Rétention" : "Active Data Retention Policies"}
                    </h3>
                    <p className="text-[11px] text-[#6B7280] font-semibold">
                      {lang === 'FR' ? "Configurez le délai avant l'archivage ou l'expiration finale des ressources." : "Set automated durations before archiving or purging transactional resources."}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-stone-150">
                  {policies.map((p) => (
                    <div key={p.id} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-stone-50/20 transition-colors">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-bold text-xs text-stone-900 uppercase">
                            {p.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase ${
                            p.rule === 'active' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : p.rule === 'scheduled archive'
                              ? 'bg-blue-100 text-blue-800'
                              : p.rule === 'scheduled deletion'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-stone-100 text-stone-800'
                          }`}>
                            {p.rule}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7280] font-semibold">
                          {lang === 'FR' 
                            ? `Seuil d'action automatique après ${p.durationDays} jours.` 
                            : `Automatically triggers action rule after ${p.durationDays} calendar days.`}
                        </p>
                      </div>

                      <div className="text-right space-y-1 font-semibold text-[11px]">
                        <p className="text-stone-900">
                          {lang === 'FR' ? `Rétention : ${p.durationDays} jours` : `Retention Window: ${p.durationDays} days`}
                        </p>
                        <p className="text-[10px] text-stone-400 font-mono">
                          Last Modified: {new Date(p.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strict safety note about deletion (Requirement: No immediate deletion) */}
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl text-amber-950 space-y-1">
                <p className="font-sans font-bold text-xs uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{lang === 'FR' ? "AUCUNE SUPPRESSION IMMÉDIATE (SÉCURITÉ RGPD)" : "NO IMMEDIATE DELETION SAFEGUARD"}</span>
                </p>
                <p className="text-[11px] leading-relaxed opacity-90 font-semibold">
                  {lang === 'FR'
                    ? "Les lois de conformité européennes interdisent la suppression instantanée et non-auditable des dossiers candidats. Toute suppression est d'abord planifiée (scheduled archive/deletion) et exécutée de manière asynchrone par le planificateur de tâches, permettant une révocabilité de 14 jours."
                    : "To satisfy strict governance protocols, immediate database purges or user deletion commands are blocked. Changes are registered under planned lifecycle schedules and require double authorization signature."}
                </p>
              </div>

            </div>

            {/* Draft Policy Creator / Review Pipeline Panel */}
            <div className="space-y-6">
              
              {/* Draft Section */}
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6">
                <div className="border-b border-stone-100 pb-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-sm text-stone-900">
                      {lang === 'FR' ? "Pipeline d'Approbation" : "Change Approval Flow"}
                    </h3>
                    <p className="text-[11px] text-[#6B7280] font-semibold">
                      Draft → Review → Approve → Publish
                    </p>
                  </div>
                  <Clock className="w-4 h-4 text-stone-400" />
                </div>

                {draftPolicy ? (
                  <div className="space-y-4 animate-fade-in text-xs font-semibold text-stone-700">
                    <div className="p-4 bg-stone-50 border border-stone-150 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold text-[#6B7280]">
                          DRAFT RETENTION POLICY
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase ${
                          draftPolicy.status === 'draft' 
                            ? 'bg-stone-100 text-stone-800' 
                            : draftPolicy.status === 'review'
                            ? 'bg-blue-100 text-blue-800'
                            : draftPolicy.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-stone-100 text-stone-800'
                        }`}>
                          {draftPolicy.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[#6B7280]">{lang === 'FR' ? "Catégorie :" : "Category:"}</p>
                        <p className="font-bold text-stone-900 uppercase">{draftPolicy.category}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[#6B7280]">{lang === 'FR' ? "Règle :" : "Lifecycle Rule:"}</p>
                        <p className="font-bold text-stone-900 uppercase">{draftPolicy.rule}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[#6B7280]">{lang === 'FR' ? "Durée :" : "Duration window:"}</p>
                        <p className="font-bold text-stone-900">{draftPolicy.durationDays} Days</p>
                      </div>
                    </div>

                    {/* Change flow stage action buttons */}
                    <div className="space-y-2">
                      {draftPolicy.status === 'draft' && (
                        <button
                          onClick={handleSubmitPolicyForReview}
                          className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-mono text-[10px] tracking-widest font-extrabold cursor-pointer transition-all flex items-center justify-center gap-2"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{lang === 'FR' ? "SOUMETTRE EXAMEN" : "SUBMIT FOR REVIEW"}</span>
                        </button>
                      )}

                      {draftPolicy.status === 'review' && isSuperAdmin && (
                        <button
                          onClick={handleApprovePolicyDraft}
                          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-mono text-[10px] tracking-widest font-extrabold cursor-pointer transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{lang === 'FR' ? "APPROUVER PROPOSITION" : "APPROVE PROPOSAL"}</span>
                        </button>
                      )}

                      {draftPolicy.status === 'approved' && isSuperAdmin && (
                        <button
                          onClick={handlePublishPolicy}
                          className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-mono text-[10px] tracking-widest font-extrabold cursor-pointer transition-all flex items-center justify-center gap-2 animate-pulse"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>{lang === 'FR' ? "PUBLIER LA POLITIQUE" : "PUBLISH POLICY LIVE"}</span>
                        </button>
                      )}

                      {draftPolicy.status === 'review' && !isSuperAdmin && (
                        <p className="text-amber-600 text-[10px] text-center font-bold italic">
                          {lang === 'FR' 
                            ? "🔒 En attente de l'approbation du Super Admin." 
                            : "🔒 Awaiting Super Admin authorization approval."}
                        </p>
                      )}

                      {draftPolicy.status === 'approved' && !isSuperAdmin && (
                        <p className="text-amber-600 text-[10px] text-center font-bold italic">
                          {lang === 'FR' 
                            ? "🔒 En attente de la publication par le Super Admin." 
                            : "🔒 Approved. Awaiting Super Admin publish command."}
                        </p>
                      )}

                      <button
                        onClick={handleCancelPolicyDraft}
                        className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl font-mono text-[10px] tracking-widest font-bold cursor-pointer transition-all"
                      >
                        {lang === 'FR' ? "ANNULER PROPOSITION" : "CANCEL PROPOSAL"}
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="space-y-4">
                    {!showDraftPolicyForm ? (
                      <button
                        onClick={() => setShowDraftPolicyForm(true)}
                        className="w-full py-3 border-2 border-dashed border-stone-300 hover:border-stone-400 text-stone-600 hover:text-stone-900 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{lang === 'FR' ? "Proposer Changement" : "Draft Lifecycle Change"}</span>
                      </button>
                    ) : (
                      <form onSubmit={handleCreatePolicyDraft} className="space-y-4 text-xs font-semibold text-stone-700">
                        <div className="space-y-1">
                          <label className="text-[#6B7280]">Category</label>
                          <select
                            value={newPolicyCategory}
                            onChange={(e) => setNewPolicyCategory(e.target.value as any)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-semibold"
                          >
                            <option value="sessions">{lang === 'FR' ? "Sessions" : "Sessions"}</option>
                            <option value="evaluations">{lang === 'FR' ? "Évaluations" : "Evaluations"}</option>
                            <option value="logs">Logs</option>
                            <option value="media metadata">{lang === 'FR' ? "Métadonnées Média" : "Media Metadata"}</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[#6B7280]">Rule Option</label>
                          <select
                            value={newPolicyRule}
                            onChange={(e) => setNewPolicyRule(e.target.value as any)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-semibold"
                          >
                            <option value="active">Active (Retained)</option>
                            <option value="scheduled archive">Scheduled Archive</option>
                            <option value="scheduled deletion">Scheduled Deletion</option>
                            <option value="expired">Mark Expired</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[#6B7280]">{lang === 'FR' ? "Durée de Rétention (jours)" : "Duration Window (days)"}</label>
                          <input
                            type="number"
                            value={newPolicyDuration}
                            onChange={(e) => setNewPolicyDuration(Number(e.target.value))}
                            min="1"
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-semibold"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-mono text-[10px] tracking-widest font-extrabold cursor-pointer"
                          >
                            {lang === 'FR' ? "CRÉER BROUILLON" : "CREATE DRAFT"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDraftPolicyForm(false)}
                            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-mono text-[10px] tracking-widest font-bold cursor-pointer"
                          >
                            {lang === 'FR' ? "RETOUR" : "BACK"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* SECTION 5: PRIVACY CONTROLS */}
        {activeTab === 'privacy' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left" id="section-5-privacy-controls">
            
            {/* Left Column: Form parameters */}
            <div className="lg:col-span-2 bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <h3 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? "Configuration Globale de Confidentialité" : "System Privacy Parameters"}
                </h3>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Gérez l'exposition des données et les règles de captation des entretiens." : "Define webcam constraints, biometric processing, and raw database visibility rules."}
                </p>
              </div>

              <div className="space-y-6 text-xs font-semibold text-stone-700">
                
                {/* 1. Data Visibility */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-sans font-bold text-xs text-stone-900">
                        {lang === 'FR' ? "Visibilité de la Télémétrie" : "Candidate Data Visibility"}
                      </p>
                      <p className="text-[11px] text-[#6B7280] font-semibold">
                        {lang === 'FR' ? "Qui peut consulter les fichiers de performance." : "Scope of access for administrative operators on user profiles."}
                      </p>
                    </div>
                    <span className="p-1 px-2.5 font-mono text-[10px] uppercase font-extrabold bg-stone-100 text-stone-600 rounded">
                      {privacyConfig?.dataVisibility}
                    </span>
                  </div>

                  <select
                    value={privacyFormState.dataVisibility || ''}
                    onChange={(e) => handlePrivacyFormChange('dataVisibility', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-semibold"
                  >
                    <option value="restricted">{lang === 'FR' ? "Restreint (Audit Seul)" : "Restricted (Security Audit Only)"}</option>
                    <option value="internal">{lang === 'FR' ? "Interne (Admin autorisé)" : "Internal (All authorized operators)"}</option>
                    <option value="public">{lang === 'FR' ? "Libre (Non recommandé)" : "Public (Unrestricted access)"}</option>
                  </select>
                </div>

                {/* 2. Consent Requirement */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-sans font-bold text-xs text-stone-900">
                        {lang === 'FR' ? "Exigence de Consentement RGPD" : "Enforce Consent Requirements"}
                      </p>
                      <p className="text-[11px] text-[#6B7280] font-semibold">
                        {lang === 'FR' ? "Rendre obligatoire l'accord avant le début de session." : "Force agreement submission before any micro-interview processes start."}
                      </p>
                    </div>
                    <span className="p-1 px-2.5 font-mono text-[10px] uppercase font-extrabold bg-stone-100 text-stone-600 rounded">
                      {privacyConfig?.consentRequirement}
                    </span>
                  </div>

                  <select
                    value={privacyFormState.consentRequirement || ''}
                    onChange={(e) => handlePrivacyFormChange('consentRequirement', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-semibold"
                  >
                    <option value="mandatory">{lang === 'FR' ? "Strict Obligatoire (Bloque l'accès)" : "Mandatory (Blocks entrance on refusal)"}</option>
                    <option value="optional">{lang === 'FR' ? "Optionnel (Bouton d'évitement)" : "Optional (Opt-out is allowed)"}</option>
                    <option value="disabled">{lang === 'FR' ? "Désactivé (Non-conforme)" : "Disabled (Atypical bypass mode)"}</option>
                  </select>
                </div>

                {/* 3. Camera Policy */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-sans font-bold text-xs text-stone-900">
                        {lang === 'FR' ? "Règles d'Usage de la Caméra" : "Camera Access & Capture Policy"}
                      </p>
                      <p className="text-[11px] text-[#6B7280] font-semibold">
                        {lang === 'FR' ? "Souveraineté de captation des flux vidéos." : "Defines recording parameters for candidates' webcams."}
                      </p>
                    </div>
                    <span className="p-1 px-2.5 font-mono text-[10px] uppercase font-extrabold bg-stone-100 text-stone-600 rounded">
                      {privacyConfig?.cameraPolicy}
                    </span>
                  </div>

                  <select
                    value={privacyFormState.cameraPolicy || ''}
                    onChange={(e) => handlePrivacyFormChange('cameraPolicy', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-semibold"
                  >
                    <option value="stream_only">{lang === 'FR' ? "Flux Éphémère (Aucun enregistrement vidéo)" : "Stream only (Zero video storage - GDPR standard)"}</option>
                    <option value="record">{lang === 'FR' ? "Enregistrer pour réévaluation" : "Record & store (High security risk)"}</option>
                    <option value="disabled">{lang === 'FR' ? "Désactivé (Audio uniquement)" : "Disabled completely (Audio only)"}</option>
                  </select>
                </div>

                {/* 4. Microphone Policy */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-sans font-bold text-xs text-stone-900">
                        {lang === 'FR' ? "Usage du Microphone et Biométrie" : "Microphone & Voice Processing Policy"}
                      </p>
                      <p className="text-[11px] text-[#6B7280] font-semibold">
                        {lang === 'FR' ? "Stockage des fichiers audios bruts ou transcription temporaire." : "Handles vocal recordings and AI transcription databases."}
                      </p>
                    </div>
                    <span className="p-1 px-2.5 font-mono text-[10px] uppercase font-extrabold bg-stone-100 text-stone-600 rounded">
                      {privacyConfig?.microphonePolicy}
                    </span>
                  </div>

                  <select
                    value={privacyFormState.microphonePolicy || ''}
                    onChange={(e) => handlePrivacyFormChange('microphonePolicy', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-semibold"
                  >
                    <option value="stream_transcribe">{lang === 'FR' ? "Transcription éphémère (SLA léger)" : "Ephemeral Transcription (No audio storage)"}</option>
                    <option value="record_transcribe">{lang === 'FR' ? "Enregistrer l'audio et transcrire" : "Record audio & transcribe (Candidate authorization required)"}</option>
                    <option value="disabled">{lang === 'FR' ? "Désactiver la reconnaissance vocale" : "Disabled (Text-only assessments)"}</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-stone-100 flex gap-4">
                  <button
                    onClick={handleSavePrivacyDraft}
                    className="py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-mono text-[10px] tracking-widest font-extrabold cursor-pointer transition-all active:scale-95"
                  >
                    {lang === 'FR' ? "ENREGISTRER BROUILLON" : "SAVE PRIVACY DRAFT"}
                  </button>

                  {draftPrivacy && (
                    <button
                      onClick={handleCancelPrivacyDraft}
                      className="py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-mono text-[10px] tracking-widest font-bold cursor-pointer transition-all"
                    >
                      {lang === 'FR' ? "ANNULER" : "CANCEL CHANGELOG"}
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Right Column: Approval pipeline for Section 5 */}
            <div className="space-y-6">
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6">
                <div className="border-b border-stone-100 pb-4">
                  <h3 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Validation de Confidentialité" : "Privacy Change Pipeline"}
                  </h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Projet de règles de captation en cours de révision." : "Changelog and verification steps before live publishing."}
                  </p>
                </div>

                {draftPrivacy ? (
                  <div className="space-y-4 animate-fade-in text-xs font-semibold text-stone-700">
                    
                    <div className="p-4 bg-stone-50 border border-stone-150 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold text-[#6B7280]">
                          DRAFT PRIVACY CONFIG
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase ${
                          draftPrivacy.status === 'draft' 
                            ? 'bg-stone-100 text-stone-800' 
                            : draftPrivacy.status === 'review'
                            ? 'bg-blue-100 text-blue-800'
                            : draftPrivacy.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-stone-100 text-stone-800'
                        }`}>
                          {draftPrivacy.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 text-[11px] text-stone-900">
                        <div>
                          <p className="text-[#6B7280]">Visibility:</p>
                          <p className="font-bold">{draftPrivacy.dataVisibility}</p>
                        </div>
                        <div>
                          <p className="text-[#6B7280]">Consent Requirement:</p>
                          <p className="font-bold">{draftPrivacy.consentRequirement}</p>
                        </div>
                        <div>
                          <p className="text-[#6B7280]">Camera Access:</p>
                          <p className="font-bold">{draftPrivacy.cameraPolicy}</p>
                        </div>
                        <div>
                          <p className="text-[#6B7280]">Microphone Audio:</p>
                          <p className="font-bold">{draftPrivacy.microphonePolicy}</p>
                        </div>
                      </div>
                    </div>

                    {/* Require confirmation alert (Requirement: Changes require confirmation) */}
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-950 text-[11px]">
                      <p className="font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>{lang === 'FR' ? "CONFIRMATION REQUISE" : "CONFIRMATION REQUIRED"}</span>
                      </p>
                      <p className="opacity-95 leading-relaxed font-semibold">
                        {lang === 'FR'
                          ? "La modification des paramètres d'accès caméra et microphone affectera immédiatement le parcours d'admission de tous les candidats actifs."
                          : "Any change in webcam recording policies or telemetry scopes will instantly alter the pipeline requirements for active users."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {draftPrivacy.status === 'draft' && (
                        <button
                          onClick={handleSubmitPrivacyForReview}
                          className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-mono text-[10px] tracking-widest font-extrabold cursor-pointer transition-all flex items-center justify-center gap-2"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{lang === 'FR' ? "SOUMETTRE À L'EXAMEN" : "SUBMIT FOR REVIEW"}</span>
                        </button>
                      )}

                      {draftPrivacy.status === 'review' && isSuperAdmin && (
                        <button
                          onClick={handleApprovePrivacyDraft}
                          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-mono text-[10px] tracking-widest font-extrabold cursor-pointer transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{lang === 'FR' ? "APPROUVER LA PROPOSITION" : "APPROVE PROPOSAL"}</span>
                        </button>
                      )}

                      {draftPrivacy.status === 'approved' && isSuperAdmin && (
                        <button
                          onClick={() => setShowPrivacyConfirm(true)}
                          className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-mono text-[10px] tracking-widest font-extrabold cursor-pointer transition-all flex items-center justify-center gap-2 animate-pulse"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>{lang === 'FR' ? "PUBLIER LA CONFIGURATION" : "PUBLISH CONFIG LIVE"}</span>
                        </button>
                      )}

                      {draftPrivacy.status === 'review' && !isSuperAdmin && (
                        <p className="text-amber-600 text-[10px] text-center font-bold italic">
                          {lang === 'FR' 
                            ? "🔒 En attente de validation par le Super Admin." 
                            : "🔒 Awaiting Super Admin review approval."}
                        </p>
                      )}

                      {draftPrivacy.status === 'approved' && !isSuperAdmin && (
                        <p className="text-amber-600 text-[10px] text-center font-bold italic">
                          {lang === 'FR' 
                            ? "🔒 Proposition approuvée. En attente de publication." 
                            : "🔒 Proposal approved. Awaiting Super Admin execution."}
                        </p>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="text-center text-stone-400 py-8 text-xs font-semibold">
                    {lang === 'FR' ? "Aucun changement proposé en attente." : "No active changes are currently pending."}
                  </div>
                )}
              </div>
            </div>

            {/* Confirmation Modal */}
            {showPrivacyConfirm && (
              <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white rounded-[32px] p-8 max-w-md w-full border border-stone-200 shadow-2xl space-y-6 text-left">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-600">
                        <AlertTriangle className="w-5 h-5" />
                      </span>
                      <h4 className="font-sans font-bold text-sm text-stone-900 uppercase">
                        {lang === 'FR' ? "Confirmation de Sécurité Requise" : "Super Admin Signature Security Check"}
                      </h4>
                    </div>
                    <p className="text-xs text-[#6B7280] font-semibold leading-relaxed">
                      {lang === 'FR'
                        ? "Veuillez confirmer que vous souhaitez appliquer ces nouvelles règles d'accès caméra/microphone et de visibilité de données en direct sur la plateforme Shana."
                        : "Please confirm that you authorize the live update of candidate camera feed permissions and telemetry data restriction levels."}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handlePublishPrivacyConfig}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-mono text-[10px] tracking-widest font-extrabold cursor-pointer transition-all active:scale-95"
                    >
                      {lang === 'FR' ? "CONFIRMER & PUBLIER" : "CONFIRM & EXECUTE"}
                    </button>
                    <button
                      onClick={() => setShowPrivacyConfirm(false)}
                      className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-mono text-[10px] tracking-widest font-bold cursor-pointer transition-all"
                    >
                      {lang === 'FR' ? "RETOUR" : "CANCEL"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* SECTION 6: AUTOMATED TESTING & QUALITY ASSURANCE */}
        {activeTab === 'qa' && (
          <div className="space-y-8 text-left" id="section-6-qa-automated">
            
            {/* Header / Intro section */}
            <div className="bg-white border border-stone-200 rounded-[32px] p-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2 max-w-2xl">
                <h3 className="font-sans font-bold text-base text-stone-900">
                  {lang === 'FR' ? "Console d'Automated Assurance Qualité" : "Automated QA & Reliability Console"}
                </h3>
                <p className="text-xs text-[#6B7280] font-semibold leading-relaxed">
                  {lang === 'FR'
                    ? "Exécutez de manière synchrone et sécurisée les 5 couches de tests Shana: Unit, Integration, End-to-End, Évaluations IA, et Simulations de performance/charge."
                    : "Run continuous verification across all five testing layers of Shana. Ensures scoring consistency, anti-hallucination, strict schema conformance, and SLAs verification."}
                </p>
              </div>

              <button
                disabled={qaRunning}
                onClick={handleRunQaSuite}
                className={`px-6 py-3.5 rounded-2xl font-mono text-[11px] tracking-widest font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 ${
                  qaRunning 
                    ? 'bg-stone-100 text-stone-400 border border-stone-200' 
                    : 'bg-indigo-950 text-white hover:bg-indigo-900'
                }`}
              >
                <Play className={`w-4 h-4 ${qaRunning ? 'animate-spin' : ''}`} />
                <span>{qaRunning ? (lang === 'FR' ? "TESTS EN COURS..." : "RUNNING TESTS...") : (lang === 'FR' ? "LANCER LA SUITE DE TESTS" : "RUN AUTOMATED QA SUITE")}</span>
              </button>
            </div>

            {/* If Tests are currently running */}
            {qaRunning && (
              <div className="bg-white border border-stone-200 rounded-[32px] p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4 animate-pulse">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <h4 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? "Orchestration de la Suite de Tests Shana..." : "Orchestrating Shana Validation Suites..."}
                </h4>
                <p className="text-xs text-stone-500 max-w-md">
                  {lang === 'FR'
                    ? "Calcul des scores IPS déterministes, simulation de 5000 sessions concurrentes, analyse de la détection de biais, et validation du pipeline de documents."
                    : "Executing isolated unit formulas, scaling 5,000 virtual users, checking question similarity overlaps, verifying anti-hallucination insight tracking, and testing model fallbacks."}
                </p>
              </div>
            )}

            {/* Main Current Report Dashboard */}
            {qaReport && !qaRunning && (
              <div className="space-y-8 animate-fade-in" id="qa-report-dashboard">
                
                {/* Visual Status Banner & Core Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  
                  {/* Status Card */}
                  <div className={`p-6 rounded-[32px] border flex flex-col justify-between ${
                    qaReport.overallStatus === 'passed' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[9px] uppercase tracking-wider opacity-80">
                        {lang === 'FR' ? "Statut Global" : "Core Suite Status"}
                      </span>
                      {qaReport.overallStatus === 'passed' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600" />
                      )}
                    </div>
                    <div className="space-y-1 mt-6">
                      <h4 className="font-sans font-bold text-2xl uppercase tracking-tight">
                        {qaReport.overallStatus === 'passed' ? (lang === 'FR' ? "SUCCÈS" : "PASSED") : (lang === 'FR' ? "ÉCHEC" : "FAILED")}
                      </h4>
                      <p className="font-mono text-[9px] opacity-75">
                        Run ID: {qaReport.runId} • {new Date(qaReport.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Coverage Backend */}
                  <div className="bg-white border border-stone-200 p-6 rounded-[32px] flex flex-col justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 font-bold">
                      {lang === 'FR' ? "Couverture Backend" : "Backend Coverage"}
                    </span>
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="font-sans font-bold text-3xl text-stone-950">
                          {qaReport.coverage.backendLineCoverage}%
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold font-mono">
                          {lang === 'FR' ? "SÉCURISÉ" : "SECURE"}
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${qaReport.coverage.backendLineCoverage}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* AI Behavior Coverage */}
                  <div className="bg-white border border-stone-200 p-6 rounded-[32px] flex flex-col justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 font-bold">
                      {lang === 'FR' ? "Couverture Comportementale IA" : "AI Behavior Coverage"}
                    </span>
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="font-sans font-bold text-3xl text-stone-950">
                          {qaReport.coverage.aiBehaviorCoverage}%
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold font-mono">
                          {lang === 'FR' ? "CONFORME" : "COMPLIANT"}
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${qaReport.coverage.aiBehaviorCoverage}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Critical Flow Coverage */}
                  <div className="bg-white border border-stone-200 p-6 rounded-[32px] flex flex-col justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 font-bold">
                      {lang === 'FR' ? "Couverture Flux Critiques" : "Critical Flows"}
                    </span>
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="font-sans font-bold text-3xl text-stone-950">
                          {qaReport.coverage.criticalFlowCoverage}%
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold font-mono">
                          {lang === 'FR' ? "SANS BRÈCHE" : "BREAK-FREE"}
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${qaReport.coverage.criticalFlowCoverage}%` }}></div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Performance Benchmarks Panel */}
                <div className="bg-stone-950 text-stone-100 border border-stone-800 rounded-[32px] p-8 space-y-6 shadow-xl text-left">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                      <Gauge className="w-4 h-4" />
                    </span>
                    <h4 className="font-sans font-bold text-sm text-white uppercase tracking-tight">
                      {lang === 'FR' ? "Indicateurs de Performance et SLA" : "Performance Benchmarks & SLAs Validation"}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    
                    {/* API Latency */}
                    <div className="space-y-2 border-r border-stone-800 pr-4 last:border-0">
                      <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">API Latency (P95)</p>
                      <p className="text-xl font-bold font-sans text-white">{qaReport.benchmarks.apiLatencyP95Ms} ms</p>
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[8px] uppercase tracking-widest font-extrabold rounded">
                        SLA Target &lt;100ms
                      </span>
                    </div>

                    {/* AI Response */}
                    <div className="space-y-2 border-r border-stone-800 pr-4 last:border-0">
                      <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">AI Response (P95)</p>
                      <p className="text-xl font-bold font-sans text-white">{(qaReport.benchmarks.aiResponseTimeP95Ms / 1000).toFixed(2)} s</p>
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[8px] uppercase tracking-widest font-extrabold rounded">
                        SLA Target &lt;3.0s
                      </span>
                    </div>

                    {/* Queue Delay */}
                    <div className="space-y-2 border-r border-stone-800 pr-4 last:border-0">
                      <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Queue Delay</p>
                      <p className="text-xl font-bold font-sans text-white">{qaReport.benchmarks.queueProcessingDelayMs} ms</p>
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[8px] uppercase tracking-widest font-extrabold rounded">
                        SLA Target &lt;500ms
                      </span>
                    </div>

                    {/* WebSocket Latency */}
                    <div className="space-y-2 border-r border-stone-800 pr-4 last:border-0">
                      <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">WS Connection RTT</p>
                      <p className="text-xl font-bold font-sans text-white">{qaReport.benchmarks.webSocketLatencyMs} ms</p>
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[8px] uppercase tracking-widest font-extrabold rounded">
                        SLA Target &lt;100ms
                      </span>
                    </div>

                    {/* CV Processing */}
                    <div className="space-y-2 last:border-0">
                      <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">CV Pipeline Duration</p>
                      <p className="text-xl font-bold font-sans text-white">{qaReport.benchmarks.cvProcessingTimeSec.toFixed(1)} s</p>
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[8px] uppercase tracking-widest font-extrabold rounded">
                        SLA Target &lt;5.0s
                      </span>
                    </div>

                  </div>
                </div>

                {/* 5 Layers Suites Breakdown Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1 text-left">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-mono text-[10px] uppercase tracking-wider text-indigo-700 font-extrabold">
                      {lang === 'FR' ? "Détails des 5 Couches de Test" : "Five Testing Layers Detailed Breakdown"}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.keys(qaReport.suites).map((key) => {
                      const suite = qaReport.suites[key];
                      return (
                        <div key={key} className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-4 text-left">
                          <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                            <h5 className="font-sans font-bold text-xs text-stone-900 uppercase tracking-tight">
                              {suite.name}
                            </h5>
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[9px] uppercase tracking-widest font-extrabold rounded-lg">
                              {suite.passedCount} / {suite.totalCount} {lang === 'FR' ? "PASSÉS" : "PASSED"}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {suite.tests.map((test: any) => (
                              <div key={test.id} className="flex gap-3 items-start text-xs leading-relaxed">
                                <span className="mt-0.5 text-emerald-600">
                                  <CheckCircle className="w-4 h-4 shrink-0" />
                                </span>
                                <div className="space-y-1">
                                  <p className="font-bold text-stone-800">{test.name}</p>
                                  <p className="text-[#6B7280] font-semibold text-[11px]">{test.message}</p>
                                  <span className="font-mono text-[9px] text-stone-400">Duration: {test.durationMs}ms</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Real-time Retro CLI logs */}
                <div className="bg-stone-900 border border-stone-800 rounded-[32px] p-6 shadow-xl space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-amber-500" />
                      <h4 className="font-mono text-[10px] uppercase tracking-wider text-amber-500 font-extrabold">
                        {lang === 'FR' ? "Console d'Exécution en Direct" : "Live Execution System Console"}
                      </h4>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  </div>

                  <div className="bg-stone-950 p-4 rounded-2xl h-60 overflow-y-auto font-mono text-[11px] text-stone-300 space-y-1 scrollbar-thin animate-fade-in">
                    {qaReport.logs.map((log: string, idx: number) => (
                      <p key={idx} className="whitespace-pre-wrap leading-relaxed">
                        {log.includes("Suite '") ? (
                          <span className="text-emerald-400 font-bold">{log}</span>
                        ) : log.includes("Error") ? (
                          <span className="text-rose-400 font-bold">{log}</span>
                        ) : (
                          log
                        )}
                      </p>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Historical Execution regression dashboard */}
            {qaHistory.length > 0 && !qaRunning && (
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6 text-left" id="qa-regression-monitor">
                <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                  <div>
                    <h4 className="font-sans font-bold text-sm text-stone-900">
                      {lang === 'FR' ? "Historique d'Exécution et Régression IA" : "Continuous Regression & AI Drift Monitor"}
                    </h4>
                    <p className="text-[11px] text-[#6B7280] font-semibold leading-relaxed">
                      {lang === 'FR'
                        ? "Surveillez la dérive de comportement IA et les régressions de performance sur les 15 dernières exécutions."
                        : "Track scoring drift metrics, latency variations, and coverage consistency over historical system snapshots."}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-stone-100">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100 font-mono text-[9px] uppercase tracking-wider text-stone-500">
                        <th className="p-4 font-bold">{lang === 'FR' ? "RUN ID / TIMESTAMP" : "RUN ID / TIMESTAMP"}</th>
                        <th className="p-4 font-bold">{lang === 'FR' ? "STATUT GLOBAL" : "CORE STATUS"}</th>
                        <th className="p-4 font-bold">{lang === 'FR' ? "COUVERTURE BACKEND" : "BACKEND COV"}</th>
                        <th className="p-4 font-bold">API P95 LATENCY</th>
                        <th className="p-4 font-bold">AI RESP P95</th>
                        <th className="p-4 font-bold text-right">{lang === 'FR' ? "CONTRÔLE" : "ACTIONS"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50 font-medium">
                      {qaHistory.map((run: any) => (
                        <tr key={run.runId} className="hover:bg-stone-50/50">
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <p className="font-bold text-stone-800 font-mono text-[11px]">{run.runId}</p>
                              <p className="text-[10px] text-stone-400">{new Date(run.timestamp).toLocaleString()}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-wider ${
                              run.overallStatus === 'passed' 
                                ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                                : 'bg-rose-50 border border-rose-100 text-rose-700'
                            }`}>
                              {run.overallStatus.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-stone-600">{run.coverage?.backendLineCoverage}%</td>
                          <td className="p-4 font-mono text-stone-600">{run.benchmarks?.apiLatencyP95Ms} ms</td>
                          <td className="p-4 font-mono text-stone-600">{(run.benchmarks?.aiResponseTimeP95Ms / 1000).toFixed(2)} s</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setQaReport(run);
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }}
                              className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 font-mono text-[9px] uppercase tracking-widest font-extrabold rounded-lg transition-all cursor-pointer active:scale-95"
                            >
                              {lang === 'FR' ? "Visualiser" : "Inspect Run"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Zero state (no run executed yet) */}
            {!qaReport && !qaRunning && (
              <div className="bg-white border border-stone-200 rounded-[32px] p-12 text-center shadow-xs space-y-6 flex flex-col items-center justify-center">
                <div className="p-4 bg-stone-100 border border-stone-200 rounded-full text-stone-500">
                  <Beaker className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h4 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Aucun rapport d'évaluation disponible" : "No active verification report exists"}
                  </h4>
                  <p className="text-xs text-stone-500">
                    {lang === 'FR'
                      ? "Lancez une nouvelle suite de tests d'assurance qualité automatisés pour générer un rapport de conformité complet."
                      : "Execute a fresh automated Testing & QA runner to analyze compliance checkpoints, scoring drift indicators, and platform latency metrics."}
                  </p>
                </div>
                <button
                  onClick={handleRunQaSuite}
                  className="px-5 py-3 bg-indigo-950 hover:bg-indigo-900 text-white font-mono text-[10px] tracking-widest font-extrabold rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
                >
                  {lang === 'FR' ? "EXÉCUTER LA SUITE DE TESTS COMPLÈTE" : "EXECUTE COMPLETE RUNNER"}
                </button>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
