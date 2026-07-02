import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Layers, 
  TrendingUp, 
  Users, 
  Settings, 
  Sliders, 
  HelpCircle, 
  Activity, 
  Lock, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Plus, 
  RefreshCw, 
  FileLock, 
  Sparkles, 
  AlertTriangle,
  Zap, 
  PieChart, 
  FileText, 
  ArrowUpRight, 
  Database,
  Search,
  Check,
  ChevronRight,
  MapPin,
  Calendar,
  Globe,
  Clock,
  Briefcase,
  AlertCircle,
  Eye,
  DollarSign,
  Shield,
  Download
} from 'lucide-react';
import { User } from '../../../types';
import { 
  PlanModel, 
  Subscription, 
  Invoice, 
  PaymentMethod, 
  Transaction, 
  SubscriptionStatus, 
  EntitlementFeature,
  MONETIZATION_FEATURES_INFO
} from '../../../modules/entitlements';
import { 
  PlanManager, 
  SubscriptionController, 
  EntitlementEngine, 
  AccessResolver, 
  BillingOrchestrator 
} from '../../../services/subscription';
import { OrganizationManager } from '../../../services/business';

interface MonetizationCenterProps {
  currentUser: User;
  lang?: 'FR' | 'EN';
}

type TabType = 'dashboard' | 'plans' | 'entitlements' | 'billing' | 'access-simulation';

export default function MonetizationCenter({ currentUser, lang = 'FR' }: MonetizationCenterProps) {
  const isSuperAdmin = currentUser.role === 'super_admin';
  
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Loaders & State Management
  const [plans, setPlans] = useState<PlanModel[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Editing state for plans
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<Partial<PlanModel>>({});
  const [showCreatePlan, setShowCreatePlan] = useState(false);

  // New plan state
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState(99);
  const [newPlanFeatures, setNewPlanFeatures] = useState<EntitlementFeature[]>(['training_access']);
  const [newPlanLimits, setNewPlanLimits] = useState({
    interviewsPerMonth: 50,
    storageLimitGB: 10,
    aiRequestLimit: 500,
    teamSizeLimit: 5
  });

  // Assign subscription state
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>('active');
  const [isTrial, setIsTrial] = useState(false);

  // Simulation state
  const [simOrgId, setSimOrgId] = useState('');
  const [simFeature, setSimFeature] = useState<EntitlementFeature>('voice_access');
  const [simulationResult, setSimulationResult] = useState<{ allowed: boolean; message?: string } | null>(null);

  // Notification feedbacks
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const triggerFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadMonetizationData = () => {
    const loadedPlans = PlanManager.getPlans();
    const loadedSubs = SubscriptionController.getSubscriptions();
    const loadedInvoices = BillingOrchestrator.getInvoices();
    const loadedPMs = BillingOrchestrator.getPaymentMethods();
    const loadedTxs = BillingOrchestrator.getTransactions();
    const loadedOrgs = OrganizationManager.getOrganizations();

    setPlans(loadedPlans);
    setSubscriptions(loadedSubs);
    setInvoices(loadedInvoices);
    setPaymentMethods(loadedPMs);
    setTransactions(loadedTxs);
    setOrganizations(loadedOrgs);

    if (loadedOrgs.length > 0 && !simOrgId) {
      setSimOrgId(loadedOrgs[0].id);
    }
  };

  useEffect(() => {
    loadMonetizationData();
  }, []);

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      triggerFeedback(lang === 'FR' ? 'Accès Super Admin requis.' : 'Super Admin access required.', 'error');
      return;
    }
    if (!newPlanName.trim()) {
      triggerFeedback(lang === 'FR' ? 'Veuillez saisir un nom.' : 'Please enter a name.', 'error');
      return;
    }

    try {
      PlanManager.createPlan(newPlanName, newPlanPrice, newPlanFeatures, newPlanLimits, currentUser.email);
      loadMonetizationData();
      setShowCreatePlan(false);
      setNewPlanName('');
      setNewPlanPrice(99);
      setNewPlanFeatures(['training_access']);
      triggerFeedback(lang === 'FR' ? 'Forfait créé avec succès !' : 'Pricing plan registered successfully!');
    } catch (err) {
      triggerFeedback('Error creating plan', 'error');
    }
  };

  const handleEditPlanClick = (plan: PlanModel) => {
    if (!isSuperAdmin) {
      triggerFeedback(lang === 'FR' ? 'Droit de modification réservé au Super Admin.' : 'Super Admin access required to update plans.', 'error');
      return;
    }
    setEditingPlanId(plan.planId);
    setPlanForm(plan);
  };

  const handleSavePlanUpdates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlanId) return;

    try {
      PlanManager.updatePlan(editingPlanId, planForm, currentUser.email);
      loadMonetizationData();
      setEditingPlanId(null);
      triggerFeedback(lang === 'FR' ? 'Forfait mis à jour avec succès.' : 'Subscription plan updated successfully.');
    } catch (err) {
      triggerFeedback('Error updating plan', 'error');
    }
  };

  const handleAssignSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !selectedPlanId) {
      triggerFeedback(lang === 'FR' ? 'Sélectionnez une organisation et un forfait.' : 'Select an organization and a plan.', 'error');
      return;
    }

    const org = organizations.find(o => o.id === selectedOrgId);
    if (!org) return;

    try {
      SubscriptionController.assignSubscription(selectedOrgId, org.name, selectedPlanId, subStatus, currentUser.email, isTrial);
      loadMonetizationData();
      triggerFeedback(
        lang === 'FR' 
          ? `Nouvel abonnement affecté à ${org.name} !` 
          : `New entitlement subscription assigned to ${org.name} successfully!`
      );
      setSelectedOrgId('');
      setSelectedPlanId('');
    } catch (err) {
      triggerFeedback('Error assigning subscription', 'error');
    }
  };

  const handleOverrideSubscriptionStatus = (subId: string, nextStatus: SubscriptionStatus) => {
    try {
      SubscriptionController.overrideSubscription(subId, { status: nextStatus }, currentUser.email);
      loadMonetizationData();
      triggerFeedback(
        lang === 'FR' 
          ? `Statut d'abonnement mis à jour en : ${nextStatus}` 
          : `Subscription status updated to: ${nextStatus}`
      );
    } catch (err) {
      triggerFeedback('Error overriding status', 'error');
    }
  };

  const handleUpdatePayment = (orgId: string) => {
    try {
      const last4 = Math.floor(1000 + Math.random() * 9000).toString();
      const brands = ['Visa', 'Mastercard', 'Amex'];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      BillingOrchestrator.updatePaymentMethod(orgId, 'card', last4, brand, '08/30');
      loadMonetizationData();
      triggerFeedback(
        lang === 'FR' 
          ? 'Moyen de paiement de test rattaché avec succès !' 
          : 'Simulated payment profile added successfully!'
      );
    } catch (err) {
      triggerFeedback('Error updating payment', 'error');
    }
  };

  const runSimulation = () => {
    if (!simOrgId) return;
    const res = AccessResolver.resolveFeatureAccess(simOrgId, simFeature, lang);
    setSimulationResult(res);
  };

  useEffect(() => {
    if (simOrgId) {
      runSimulation();
    }
  }, [simOrgId, simFeature]);

  // Calculations for dashboard indicators
  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const trialCount = subscriptions.filter(s => s.status === 'trial').length;
  const totalInvoiced = invoices.reduce((acc, current) => acc + current.amountUSD, 0);
  const paidInvoiced = invoices.filter(i => i.status === 'paid').reduce((acc, current) => acc + current.amountUSD, 0);

  return (
    <div className="space-y-8" id="monetization-management-root">
      
      {/* Header Panel */}
      <div className="bg-stone-900 text-stone-100 p-8 rounded-[32px] border border-stone-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-400 font-bold">
                MONETIZATION & ENTITLEMENT CONTROL PANEL
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold border ${
                isSuperAdmin 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {isSuperAdmin 
                  ? (lang === 'FR' ? 'Super Admin - Éléments Modifiables' : 'Super Admin - Modifiable') 
                  : (lang === 'FR' ? 'Admin - Lecture Seule' : 'Admin - Read Only')}
              </span>
            </div>
            <h1 className="font-sans font-bold text-2xl tracking-tight text-white">
              {lang === 'FR' ? "Moteur de Monétisation & Abonnements" : "Monetization & Subscription Engine"}
            </h1>
            <p className="text-stone-400 text-xs max-w-xl leading-relaxed font-medium">
              {lang === 'FR' 
                ? "Gérez les forfaits de tarification, associez les abonnements d'évaluation, reconfigurez les droits fonctionnels et vérifiez l'état de préparation à la facturation." 
                : "Manage subscription plans, allocate test entitlements, configure features access restrictions, and prepare corporate billing configurations."}
            </p>
          </div>

          <button
            onClick={loadMonetizationData}
            className="p-2.5 bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-white rounded-xl border border-stone-700 transition-all cursor-pointer active:scale-95"
            title="Force refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications Alert Bar */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-center text-xs font-bold transition-all shadow-md ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200" id="monetization-nav-bar">
        {[
          { id: 'dashboard', label: lang === 'FR' ? 'Tableau de Bord' : 'Billing Dashboard', icon: TrendingUp },
          { id: 'plans', label: lang === 'FR' ? 'Forfaits & Limites' : 'Subscription Plans', icon: Layers },
          { id: 'entitlements', label: lang === 'FR' ? 'Matrice de Droits' : 'Feature Entitlements', icon: Shield },
          { id: 'billing', label: lang === 'FR' ? 'Préparation Facturation' : 'Billing Readiness', icon: CreditCard },
          { id: 'access-simulation', label: lang === 'FR' ? 'Simulateur d\'Accès' : 'Access Simulation', icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
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

      {/* Tabs panels */}
      <div className="animate-fade-in text-left">

        {/* TAB 1: SUBSCRIPTION DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8" id="monetization-panel-dashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "ABONNEMENTS ACTIFS" : "ACTIVE SUBSCRIPTIONS"}
                  </span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-2xl text-stone-900">{activeCount}</h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Salles & multi-locataires actifs" : "Fully enabled tenants"}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "COMPTES EN ESSAI" : "TRIAL ACCOUNTS"}
                  </span>
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-2xl text-stone-900">{trialCount}</h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Périodes d'essai actives (30J)" : "Active sandbox evaluation"}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "FACTURES PROGRAMMÉES" : "TOTAL MOCK INVOICED"}
                  </span>
                  <FileText className="w-4 h-4 text-stone-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-2xl text-stone-900">${totalInvoiced}</h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Valeur totale des comptes" : "Total mock ARR value"}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "RECETTES COLLECTÉES (TEST)" : "COLLECTED ARR (MOCK)"}
                  </span>
                  <DollarSign className="w-4 h-4 text-violet-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-2xl text-stone-900">${paidInvoiced}</h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold flex items-center gap-1">
                    <span className="text-emerald-600 font-bold">100%</span>
                    <span>{lang === 'FR' ? "taux de paiement" : "payment collection rate"}</span>
                  </p>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Assign subscription form */}
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-5 lg:col-span-1">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Attribuer / Forcer Forfait" : "Assign Plan Entitlement"}
                  </h4>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Associez un forfait d'utilisation à un laboratoire de test." : "Directly assign billing packages to mock organizations."}
                  </p>
                </div>

                <form onSubmit={handleAssignSubscription} className="space-y-4 text-xs font-semibold text-stone-700">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Organisation Cible" : "Select Target Organization"}</label>
                    <select
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans font-bold"
                    >
                      <option value="">-- {lang === 'FR' ? "Sélectionner" : "Select Organization"} --</option>
                      {organizations.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Forfait Associé" : "Target Plan Tier"}</label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans font-bold"
                    >
                      <option value="">-- {lang === 'FR' ? "Sélectionner" : "Select Plan"} --</option>
                      {plans.map(p => (
                        <option key={p.planId} value={p.planId}>{p.name} (${p.priceMonthlyUSD}/mo)</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">Status</label>
                      <select
                        value={subStatus}
                        onChange={(e) => setSubStatus(e.target.value as SubscriptionStatus)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans font-bold"
                      >
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">Période d'Essai ?</label>
                      <select
                        value={isTrial ? 'yes' : 'no'}
                        onChange={(e) => setIsTrial(e.target.value === 'yes')}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans font-bold"
                      >
                        <option value="no">Non (Standard)</option>
                        <option value="yes">Oui (30-day Trial)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    {lang === 'FR' ? "Enregistrer l'Entrée" : "Activate Mock Entitlements"}
                  </button>
                </form>
              </div>

              {/* Active list of tenant subscriptions */}
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-4 lg:col-span-2">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Abonnements Actifs & États d'Abonnement" : "Tenant Entitlements & Subscription Statuses"}
                  </h4>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Visualisez et modifiez directement l'état des abonnements à la volée." : "Override trial periods, flag active profiles, or force system expiry locks."}
                  </p>
                </div>

                <div className="divide-y divide-stone-150 max-h-96 overflow-y-auto pr-1">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-bold text-xs text-stone-950">{sub.orgName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                            sub.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : sub.status === 'trial'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7280] font-semibold">
                          Plan: <span className="font-bold text-stone-800">{sub.planName}</span> • Expire : {new Date(sub.endsAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => handleOverrideSubscriptionStatus(sub.id, 'active')}
                              className="px-2 py-1 bg-stone-100 hover:bg-emerald-50 text-[10px] font-bold text-stone-700 hover:text-emerald-700 rounded-lg transition-all"
                            >
                              Force Active
                            </button>
                            <button
                              onClick={() => handleOverrideSubscriptionStatus(sub.id, 'expired')}
                              className="px-2 py-1 bg-stone-100 hover:bg-rose-50 text-[10px] font-bold text-stone-700 hover:text-rose-700 rounded-lg transition-all"
                            >
                              Force Expired
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: PLANS CONFIGURATOR */}
        {activeTab === 'plans' && (
          <div className="space-y-6" id="monetization-panel-plans">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? "Matrice de Forfaits & Limitation Mensuelle" : "Pricing Model Limits Configurator"}
                </h4>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Ajustez les tarifs de test et les caractéristiques des quatre forfaits standards." : "Tweak storage bounds, interview thresholds, or append/remove unlocked features."}
                </p>
              </div>

              {isSuperAdmin && (
                <button
                  onClick={() => {
                    setShowCreatePlan(!showCreatePlan);
                    setEditingPlanId(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'FR' ? "Nouveau Forfait" : "Create Pricing Tier"}</span>
                </button>
              )}
            </div>

            {/* Create Plan Form */}
            {showCreatePlan && (
              <form onSubmit={handleCreatePlan} className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-md space-y-4 text-xs font-semibold text-stone-700">
                <h4 className="font-sans font-bold text-xs text-stone-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                  {lang === 'FR' ? "Définir une Nouvelle Gamme Commerciale" : "Configure Custom Billing Tier"}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Nom du Forfait" : "Plan Name"}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Standard Plus"
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Tarif Mensuel (USD)" : "Monthly Price ($)"}</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newPlanPrice}
                      onChange={(e) => setNewPlanPrice(parseInt(e.target.value))}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Nombre d'Entretiens" : "Monthly Assessments Limit"}</label>
                    <input
                      type="number"
                      required
                      min="-1"
                      value={newPlanLimits.interviewsPerMonth}
                      onChange={(e) => setNewPlanLimits({ ...newPlanLimits, interviewsPerMonth: parseInt(e.target.value) })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Limite Stockage (GB)" : "Storage Limit (GB)"}</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newPlanLimits.storageLimitGB}
                      onChange={(e) => setNewPlanLimits({ ...newPlanLimits, storageLimitGB: parseInt(e.target.value) })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Requêtes IA Max" : "Max AI Prompt Requests"}</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newPlanLimits.aiRequestLimit}
                      onChange={(e) => setNewPlanLimits({ ...newPlanLimits, aiRequestLimit: parseInt(e.target.value) })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Taille Équipe Max" : "Max Team Members"}</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newPlanLimits.teamSizeLimit}
                      onChange={(e) => setNewPlanLimits({ ...newPlanLimits, teamSizeLimit: parseInt(e.target.value) })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Droits Fonctionnels Déverrouillés" : "Included Features Access Entitlements"}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(Object.keys(MONETIZATION_FEATURES_INFO) as EntitlementFeature[]).map(feature => {
                      const details = MONETIZATION_FEATURES_INFO[feature];
                      const isChecked = newPlanFeatures.includes(feature);
                      return (
                        <label key={feature} className="flex items-start gap-2 p-2 border border-stone-150 hover:bg-stone-50 rounded-xl cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setNewPlanFeatures(newPlanFeatures.filter(f => f !== feature));
                              } else {
                                setNewPlanFeatures([...newPlanFeatures, feature]);
                              }
                            }}
                            className="mt-0.5 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <div className="text-[10px]">
                            <p className="font-bold text-stone-900">{lang === 'FR' ? details.nameFR : details.nameEN}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreatePlan(false)}
                    className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-xl text-stone-800 font-bold"
                  >
                    {lang === 'FR' ? "Annuler" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                  >
                    {lang === 'FR' ? "Enregistrer le Forfait" : "Save Plan"}
                  </button>
                </div>
              </form>
            )}

            {/* List of existing plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {plans.map((plan) => {
                const isEditing = editingPlanId === plan.planId;
                return (
                  <div 
                    key={plan.planId} 
                    className={`bg-white border p-6 rounded-[32px] flex flex-col justify-between space-y-6 ${
                      isEditing ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-stone-200 shadow-xs'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-sans font-extrabold text-sm text-stone-950 uppercase tracking-tight">
                            {plan.name}
                          </h5>
                          <span className="font-mono text-[9px] text-stone-400">{plan.planId}</span>
                        </div>
                        <span className="text-xl font-bold text-stone-900">${plan.priceMonthlyUSD}<span className="text-[10px] text-stone-400 font-medium">/mo</span></span>
                      </div>

                      {isEditing ? (
                        <form onSubmit={handleSavePlanUpdates} className="space-y-3 text-[11px] font-semibold text-stone-700">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-mono text-stone-400">Monthly Price ($)</label>
                            <input
                              type="number"
                              value={planForm.priceMonthlyUSD || 0}
                              onChange={(e) => setPlanForm({ ...planForm, priceMonthlyUSD: parseInt(e.target.value) })}
                              className="w-full p-1.5 bg-stone-50 border border-stone-200 rounded-lg"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-mono text-stone-400">Interviews limit</label>
                            <input
                              type="number"
                              value={planForm.limits?.interviewsPerMonth || 0}
                              onChange={(e) => setPlanForm({ 
                                ...planForm, 
                                limits: { ...(planForm.limits as any), interviewsPerMonth: parseInt(e.target.value) } 
                              })}
                              className="w-full p-1.5 bg-stone-50 border border-stone-200 rounded-lg"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-mono text-stone-400">Storage Limit (GB)</label>
                            <input
                              type="number"
                              value={planForm.limits?.storageLimitGB || 0}
                              onChange={(e) => setPlanForm({ 
                                ...planForm, 
                                limits: { ...(planForm.limits as any), storageLimitGB: parseInt(e.target.value) } 
                              })}
                              className="w-full p-1.5 bg-stone-50 border border-stone-200 rounded-lg"
                            />
                          </div>

                          <div className="flex gap-1.5 justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => setEditingPlanId(null)}
                              className="px-2 py-1 bg-stone-100 rounded text-[10px] font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-2 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-1 font-mono text-[10px] text-[#6B7280]">
                            <p className="flex justify-between">
                              <span>{lang === 'FR' ? "Entretiens / mois" : "Interviews limit:"}</span>
                              <span className="font-bold text-stone-900">{plan.limits.interviewsPerMonth === -1 ? 'Unlimited' : plan.limits.interviewsPerMonth}</span>
                            </p>
                            <p className="flex justify-between">
                              <span>{lang === 'FR' ? "Stockage maximum:" : "Storage allowed:"}</span>
                              <span className="font-bold text-stone-900">{plan.limits.storageLimitGB} GB</span>
                            </p>
                            <p className="flex justify-between">
                              <span>{lang === 'FR' ? "Requêtes IA:" : "Max AI Prompts:"}</span>
                              <span className="font-bold text-stone-900">{plan.limits.aiRequestLimit}</span>
                            </p>
                          </div>

                          <div className="space-y-1.5 pt-3 border-t border-stone-100">
                            <p className="text-[9px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Droits inclus" : "Included features"}</p>
                            <div className="flex flex-wrap gap-1">
                              {plan.features.map(f => (
                                <span key={f} className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase">
                                  {f.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {!isEditing && isSuperAdmin && (
                      <button
                        onClick={() => handleEditPlanClick(plan)}
                        className="w-full mt-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        {lang === 'FR' ? "Modifier les caractéristiques" : "Tweak Plan Attributes"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: FEATURE ENTITLEMENTS */}
        {activeTab === 'entitlements' && (
          <div className="space-y-6" id="monetization-panel-entitlements">
            <div className="bg-white border border-stone-200 p-6 rounded-[32px] shadow-xs space-y-4">
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? "Dictionnaire des Droits de Fonctionnalité" : "Functional Entitlement Glossary"}
                </h4>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Chaque droit contrôle l'apparition des interfaces utilisateur et valide les appels d'API correspondants." : "Check how each standard permission controls locked/unlocked rendering across candidate and administrative views."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(Object.keys(MONETIZATION_FEATURES_INFO) as EntitlementFeature[]).map(feature => {
                  const details = MONETIZATION_FEATURES_INFO[feature];
                  return (
                    <div key={feature} className="p-5 border border-stone-200 rounded-3xl space-y-3 flex flex-col justify-between bg-stone-50/30">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 bg-indigo-50 rounded text-indigo-600">
                            <Shield className="w-4 h-4" />
                          </span>
                          <span className="font-mono text-[9px] font-bold tracking-widest text-[#6B7280] uppercase">
                            {feature}
                          </span>
                        </div>
                        <h5 className="font-sans font-extrabold text-xs text-stone-950">
                          {lang === 'FR' ? details.nameFR : details.nameEN}
                        </h5>
                        <p className="text-[11px] text-[#6B7280] leading-relaxed font-semibold">
                          {lang === 'FR' ? details.descriptionFR : details.descriptionEN}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-150 flex justify-between items-center text-[10px] text-stone-400 font-mono">
                        <span>Unlocked in</span>
                        <span className="font-bold text-indigo-600 uppercase">
                          {feature === 'custom_branding' 
                            ? 'Enterprise' 
                            : feature === 'advanced_reporting' || feature === 'analytics_export' 
                            ? 'Premium+' 
                            : feature === 'training_access' 
                            ? 'Starter+' 
                            : 'Standard+'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BILLING READINESS */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="monetization-panel-billing">
            
            {/* Payment Methods and entities */}
            <div className="lg:col-span-1 bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6">
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? "Profils de Paiement de Test" : "Simulated Credit Cards"}
                </h4>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Configurez des profils de cartes ou virements de test pour la conformité." : "Configure target billing profiles for mock tenant validation."}
                </p>
              </div>

              <div className="space-y-4">
                {organizations.map(org => {
                  const pm = paymentMethods.find(p => p.orgId === org.id);
                  return (
                    <div key={org.id} className="p-4 border border-stone-200 rounded-2xl space-y-3 bg-stone-50/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-sans font-extrabold text-xs text-stone-950">{org.name}</p>
                          <span className="font-mono text-[9px] text-stone-400 uppercase tracking-wider">{org.id}</span>
                        </div>

                        <button
                          onClick={() => handleUpdatePayment(org.id)}
                          className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold uppercase flex items-center gap-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Card
                        </button>
                      </div>

                      {pm ? (
                        <div className="flex items-center gap-3 font-mono text-[11px] text-stone-700 font-semibold bg-white p-2.5 rounded-xl border border-stone-150">
                          <CreditCard className="w-4 h-4 text-stone-500" />
                          <span>{pm.brand} ending in •••• {pm.last4}</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-stone-400 font-mono">No payment method connected</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invoices and Transactions listings */}
            <div className="lg:col-span-2 bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6">
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? "Registre de Facturation Préparée" : "Billing Readiness Ledgers"}
                </h4>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Consultez les factures générées et les transactions rattachées aux forfaits d'utilisation." : "Download sample PDF mock invoices or track standard recurring ARR transaction cycles."}
                </p>
              </div>

              <div className="space-y-6">
                
                {/* Invoices */}
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-mono text-stone-400 font-extrabold tracking-wider">
                    {lang === 'FR' ? "Factures Disponibles (Draft, Open, Paid)" : "Simulated Invoices"}
                  </p>
                  <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-150">
                    <div className="grid grid-cols-5 p-3 bg-stone-50/50 font-mono text-[9px] text-[#6B7280] font-extrabold uppercase">
                      <span>Invoice ID</span>
                      <span>Tenant</span>
                      <span>Amount</span>
                      <span>Status</span>
                      <span className="text-right">Actions</span>
                    </div>

                    {invoices.map(inv => {
                      const org = organizations.find(o => o.id === inv.orgId);
                      return (
                        <div key={inv.id} className="grid grid-cols-5 p-3 items-center text-xs font-semibold text-stone-700 hover:bg-stone-50/40">
                          <span className="font-mono text-stone-900 font-bold">{inv.id}</span>
                          <span className="truncate pr-2">{org?.name || 'Unknown'}</span>
                          <span className="font-mono text-stone-900 font-extrabold">${inv.amountUSD}</span>
                          <div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold ${
                              inv.status === 'paid' 
                                ? 'bg-emerald-50 text-emerald-800' 
                                : 'bg-amber-50 text-amber-800'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                          <div className="text-right">
                            <button
                              onClick={() => triggerFeedback(lang === 'FR' ? 'Téléchargement du PDF simulé...' : 'Downloading mock Invoice PDF...')}
                              className="p-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg inline-flex items-center justify-center gap-0.5 cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Transactions */}
                <div className="space-y-3 pt-4 border-t border-stone-100">
                  <p className="text-[10px] uppercase font-mono text-stone-400 font-extrabold tracking-wider">
                    {lang === 'FR' ? "Historique des Transactions Monétiques" : "Mock Credit Card Transaction Events"}
                  </p>
                  <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-150 text-[11px] font-semibold text-stone-700">
                    <div className="grid grid-cols-4 p-3 bg-stone-50/50 font-mono text-[9px] text-[#6B7280] font-extrabold uppercase">
                      <span>TX ID</span>
                      <span>Invoice</span>
                      <span>Sum</span>
                      <span className="text-right">Status</span>
                    </div>

                    {transactions.map(tx => (
                      <div key={tx.id} className="grid grid-cols-4 p-3 items-center hover:bg-stone-50/40">
                        <span className="font-mono text-stone-900 font-bold">{tx.id}</span>
                        <span className="font-mono">{tx.invoiceId}</span>
                        <span className="font-mono text-stone-900 font-extrabold">${tx.amountUSD}</span>
                        <div className="text-right font-mono text-[9px] font-bold uppercase text-emerald-600">
                          {tx.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 5: ACCESS SIMULATION */}
        {activeTab === 'access-simulation' && (
          <div className="space-y-6" id="monetization-panel-access-simulation">
            <div className="bg-white border border-stone-200 p-6 rounded-[32px] shadow-xs space-y-6">
              
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? "Simulateur de Droits & Restitution des Forfaits Bloqués" : "Interactive Feature Locked Simulation"}
                </h4>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Testez comment les interfaces de candidats ou recruteurs affichent les verrous de fonctionnalités sans détruire leurs données historiques." : "Select an organization and an entitlement key to preview the warning upgrade card rendered in the UI."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Inputs for simulation */}
                <div className="space-y-4 p-6 bg-stone-50 rounded-2xl border border-stone-150">
                  <p className="text-[10px] uppercase font-mono text-stone-400 font-bold">Simulation parameters</p>

                  <div className="space-y-1.5 text-xs font-semibold text-stone-700">
                    <label className="text-stone-500">{lang === 'FR' ? "Sélectionner l'organisation de test" : "Test Organization"}</label>
                    <select
                      value={simOrgId}
                      onChange={(e) => setSimOrgId(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2"
                    >
                      <option value="">-- Select --</option>
                      {organizations.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 text-xs font-semibold text-stone-700">
                    <label className="text-stone-500">{lang === 'FR' ? "Sélectionner la fonctionnalité testée" : "Entitlement Feature Key"}</label>
                    <select
                      value={simFeature}
                      onChange={(e) => setSimFeature(e.target.value as EntitlementFeature)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2"
                    >
                      {(Object.keys(MONETIZATION_FEATURES_INFO) as EntitlementFeature[]).map(feature => (
                        <option key={feature} value={feature}>{feature}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Render Result Simulated Widget */}
                <div className="space-y-4">
                  <p className="text-[10px] uppercase font-mono text-stone-400 font-bold">Simulated layout result</p>

                  {simulationResult ? (
                    simulationResult.allowed ? (
                      <div className="p-6 border border-emerald-200 bg-emerald-50/50 rounded-[24px] space-y-3 animate-fade-in text-xs font-semibold text-stone-700">
                        <div className="flex items-center gap-2 text-emerald-800">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Access Authorized</span>
                        </div>
                        <p className="text-[#6B7280]">
                          {lang === 'FR' 
                            ? "Cette organisation dispose des droits requis dans sa formule d'évaluation active. La fonctionnalité s'affiche intégralement." 
                            : "This tenant organization holds appropriate subscription features. The fully operational UI panel will render seamlessly."}
                        </p>
                      </div>
                    ) : (
                      <div className="p-6 border border-amber-200 bg-amber-50/50 rounded-[24px] space-y-4 animate-fade-in text-xs font-semibold text-stone-700">
                        <div className="flex items-center gap-2 text-amber-800">
                          <Lock className="w-4.5 h-4.5" />
                          <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Feature Locked (Non-Destructive)</span>
                        </div>
                        
                        <div className="space-y-2 bg-white/80 p-4 rounded-xl border border-amber-200 text-stone-800 leading-relaxed">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="font-medium text-xs text-amber-950">{simulationResult.message}</p>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => triggerFeedback(lang === 'FR' ? "Demande de mise à niveau commerciale..." : "Upgrade plan inquiry submitted")}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all"
                            >
                              {lang === 'FR' ? "Découvrir les forfaits" : "Request Upgrade / View Plans"}
                            </button>
                          </div>
                        </div>

                        <p className="text-[10px] text-stone-500 italic">
                          {lang === 'FR' 
                            ? "Note: Aucune donnée d'entretien n'est supprimée ou bloquée d'accès pendant cette transition." 
                            : "Pro-active notice: User analytics, results records, and profiles are safely preserved behind this upgrade preview screen."}
                        </p>
                      </div>
                    )
                  ) : (
                    <p className="text-xs text-stone-400">Loading result...</p>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
