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
  Download,
  Info,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { User } from '../../../types';
import { 
  SubscriptionState, 
  CommerceInvoice, 
  CommerceTransaction, 
  OrganizationBillingProfile, 
  CommerceWallet, 
  PaymentProviderAdapter, 
  PaymentProviderType,
  InvoiceStatus
} from '../../../modules/commerce';
import { 
  PaymentController, 
  TransactionManager, 
  InvoiceManager, 
  SubscriptionBilling, 
  OrganizationBilling, 
  WalletOrchestrator, 
  CheckoutManager 
} from '../../../services/payment';
import { OrganizationManager } from '../../../services/business';

interface PaymentsCenterProps {
  currentUser: User;
  lang?: 'FR' | 'EN';
}

type PaymentTab = 'dashboard' | 'subscriptions' | 'invoices' | 'transactions' | 'orgs' | 'wallet';

export default function PaymentsCenter({ currentUser, lang = 'FR' }: PaymentsCenterProps) {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';
  
  const [activeTab, setActiveTab] = useState<PaymentTab>('dashboard');

  // Core commerce state variables
  const [providers, setProviders] = useState<PaymentProviderAdapter[]>([]);
  const [transactions, setTransactions] = useState<CommerceTransaction[]>([]);
  const [invoices, setInvoices] = useState<CommerceInvoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [billingProfiles, setBillingProfiles] = useState<OrganizationBillingProfile[]>([]);
  const [wallets, setWallets] = useState<CommerceWallet[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Simulation / interactive forms state
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('Standard');
  const [isTrial, setIsTrial] = useState(false);
  const [subStatus, setSubStatus] = useState<SubscriptionState>('active');

  // Manual payment state
  const [paymentOrgId, setPaymentOrgId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(199);
  const [paymentSource, setPaymentSource] = useState<PaymentProviderType>('card');

  // Wallet adjustment state
  const [walletOrgId, setWalletOrgId] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState(100);
  const [adjustmentReason, setAdjustmentReason] = useState('Promotional business grant');

  // Profile edit state
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<OrganizationBillingProfile>>({});

  // Feedbacks & Alerts
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const triggerFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadCommerceData = () => {
    setProviders(PaymentController.getProviders());
    setTransactions(TransactionManager.getTransactions());
    setInvoices(InvoiceManager.getInvoices());
    setSubscriptions(SubscriptionBilling.getSubscriptions());
    setBillingProfiles(OrganizationBilling.getProfiles());
    setWallets(WalletOrchestrator.getWallets());
    setOrganizations(OrganizationManager.getOrganizations());
  };

  useEffect(() => {
    loadCommerceData();
  }, []);

  const handleToggleProvider = (id: PaymentProviderType, currentVal: boolean) => {
    if (!isSuperAdmin) {
      triggerFeedback(lang === 'FR' ? 'Accès Super Admin requis.' : 'Super Admin access required.', 'error');
      return;
    }
    const next = !currentVal;
    PaymentController.toggleProvider(id, next, currentUser.email);
    loadCommerceData();
    triggerFeedback(
      lang === 'FR' 
        ? `Adaptateur de paiement ${next ? 'activé' : 'désactivé'}` 
        : `Payment adapter ${next ? 'enabled' : 'disabled'}`
    );
  };

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId) {
      triggerFeedback(lang === 'FR' ? 'Veuillez sélectionner un compte' : 'Please select a tenant org.', 'error');
      return;
    }

    const org = organizations.find(o => o.id === selectedOrgId);
    if (!org) return;

    try {
      // Create billing subscription
      SubscriptionBilling.createSubscription(selectedOrgId, org.name, selectedPlan, subStatus, isTrial);
      
      // Calculate amount based on plan
      let amount = 49;
      if (selectedPlan === 'Standard') amount = 199;
      if (selectedPlan === 'Premium') amount = 499;
      if (selectedPlan === 'Enterprise') amount = 1499;

      // Generate invoice
      InvoiceManager.createInvoice(selectedOrgId, selectedPlan, amount, isTrial ? 'draft' : 'issued');

      loadCommerceData();
      triggerFeedback(
        lang === 'FR' 
          ? `Abonnement créé pour ${org.name} ! Facture générée.` 
          : `Subscription created for ${org.name}! Mock invoice generated.`
      );
      setSelectedOrgId('');
    } catch (err) {
      triggerFeedback('Error processing billing setup', 'error');
    }
  };

  const handleUpdateSubscriptionState = (subId: string, nextStatus: SubscriptionState) => {
    if (!isSuperAdmin) {
      triggerFeedback(lang === 'FR' ? 'Super Admin requis pour modifier le cycle.' : 'Super Admin required.', 'error');
      return;
    }
    try {
      SubscriptionBilling.updateSubscriptionState(subId, nextStatus, currentUser.email);
      loadCommerceData();
      triggerFeedback(
        lang === 'FR' 
          ? `Statut d'abonnement mis à jour : ${nextStatus}` 
          : `Subscription status modified to: ${nextStatus}`
      );
    } catch (err) {
      triggerFeedback('Error updating status', 'error');
    }
  };

  const handleUpdateInvoiceStatus = (invId: string, nextStatus: InvoiceStatus) => {
    if (!isAdmin) {
      triggerFeedback(lang === 'FR' ? 'Accès Administrateur requis.' : 'Admin access required.', 'error');
      return;
    }
    try {
      InvoiceManager.updateInvoiceStatus(invId, nextStatus, currentUser.email);
      loadCommerceData();
      triggerFeedback(`Invoice status updated to ${nextStatus}`);
    } catch (err) {
      triggerFeedback('Error updating invoice', 'error');
    }
  };

  const handleProcessCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentOrgId) {
      triggerFeedback(lang === 'FR' ? 'Veuillez sélectionner un compte' : 'Please select an org.', 'error');
      return;
    }

    const res = CheckoutManager.processMockPayment(paymentOrgId, paymentAmount, paymentSource, currentUser.email);
    loadCommerceData();
    
    if (res.success) {
      triggerFeedback(res.message, 'success');
      setPaymentOrgId('');
    } else {
      triggerFeedback(res.message, 'error');
    }
  };

  const handleAdjustWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      triggerFeedback(lang === 'FR' ? 'Accès Super Admin requis.' : 'Super Admin access required.', 'error');
      return;
    }
    if (!walletOrgId) {
      triggerFeedback('Select an organization', 'error');
      return;
    }

    const wallet = WalletOrchestrator.adjustWalletBalance(walletOrgId, adjustmentAmount, adjustmentReason, currentUser.email);
    if (wallet) {
      loadCommerceData();
      triggerFeedback(
        lang === 'FR'
          ? `Solde mis à jour de : ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount} Crédits !`
          : `Wallet credits successfully adjusted by ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount}!`
      );
      setWalletOrgId('');
    } else {
      triggerFeedback('Error adjusting wallet', 'error');
    }
  };

  const handleEditProfile = (profile: OrganizationBillingProfile) => {
    if (!isAdmin) {
      triggerFeedback(lang === 'FR' ? 'Droit de modification réservé aux administrateurs.' : 'Admin access required.', 'error');
      return;
    }
    setEditingOrgId(profile.orgId);
    setProfileForm(profile);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrgId) return;

    try {
      OrganizationBilling.updateProfile(editingOrgId, profileForm, currentUser.email);
      setEditingOrgId(null);
      loadCommerceData();
      triggerFeedback(lang === 'FR' ? 'Informations de facturation enregistrées.' : 'Billing profile updated successfully.');
    } catch (err) {
      triggerFeedback('Error updating profile', 'error');
    }
  };

  // Dashboard Aggregates
  const statsActiveSubs = subscriptions.filter(s => s.status === 'active').length;
  const statsPendingInvoices = invoices.filter(i => i.status === 'issued').length;
  const statsSuccessTxs = transactions.filter(t => t.status === 'success').length;
  const statsFailedTxs = transactions.filter(t => t.status === 'failed').length;

  return (
    <div className="space-y-8" id="payments-commerce-dashboard-root">
      
      {/* HEADER HERO AREA */}
      <div className="bg-stone-900 text-stone-100 p-8 rounded-[32px] border border-stone-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-violet-400 font-bold">
                COMMERCE & TRANSACTIONS CONSOLE
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold border ${
                isSuperAdmin 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {isSuperAdmin 
                  ? (lang === 'FR' ? 'Super Admin - Full Control' : 'Super Admin - Full Control') 
                  : (lang === 'FR' ? 'Admin - View Payments' : 'Admin - View Payments')}
              </span>
            </div>
            <h1 className="font-sans font-bold text-2xl tracking-tight text-white">
              {lang === 'FR' ? "Espace Facturation & Transactions" : "Payments & Commerce Platform"}
            </h1>
            <p className="text-stone-400 text-xs max-w-xl leading-relaxed font-medium">
              {lang === 'FR' 
                ? "Gérez les registres commerciaux globaux, auditez les factures clients, gérez les soldes d'abonnements d'entreprise, structurez les règles de facturation et évaluez les reçus de transactions." 
                : "Manage global commercial ledgers, audit customer invoices, handle corporate subscription balances, structure organization billing rules, and evaluate transaction receipts."}
            </p>
          </div>

          <button
            onClick={loadCommerceData}
            className="p-2.5 bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-white rounded-xl border border-stone-700 transition-all cursor-pointer active:scale-95"
            title="Reload ledgers"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive notification feedback banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-center text-xs font-bold transition-all shadow-md ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* CORE SECTIONS TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200" id="payments-tabs-menu">
        {[
          { id: 'dashboard', label: lang === 'FR' ? 'Moniteur' : 'Commerce Monitor', icon: TrendingUp },
          { id: 'subscriptions', label: lang === 'FR' ? 'Abonnements' : 'Subscriptions Cycle', icon: Layers },
          { id: 'invoices', label: lang === 'FR' ? 'Factures' : 'Invoices Ledger', icon: FileText },
          { id: 'transactions', label: lang === 'FR' ? 'Transactions' : 'Audit Trail', icon: Activity },
          { id: 'orgs', label: lang === 'FR' ? 'Comptes Clients' : 'Tenant Profiles', icon: Users },
          { id: 'wallet', label: lang === 'FR' ? 'Crédits Portefeuille' : 'Corporate Wallet', icon: DollarSign }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as PaymentTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shrink-0 transition-all ${
                isActive 
                  ? 'bg-violet-950 text-white shadow-md' 
                  : 'text-stone-500 hover:text-stone-950 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN CONTAINER */}
      <div className="animate-fade-in text-left">

        {/* SECTION 1: PAYMENTS DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8" id="payments-view-dashboard">
            
            {/* AGGREGATES CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "CONTRATS ACTIFS" : "ACTIVE SUBSCRIPTIONS"}
                  </span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-2xl text-stone-900">{statsActiveSubs}</h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Contrats commerciaux actifs" : "Fully authorized tenant tiers"}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "FACTURES EN ATTENTE" : "PENDING INVOICES"}
                  </span>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-2xl text-stone-900">{statsPendingInvoices}</h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Attente encaissement (Net 30)" : "Pending commercial clearing"}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "SUCCÈS BANQUE" : "SUCCESSFUL MOCK PAYMENTS"}
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-2xl text-stone-900">{statsSuccessTxs}</h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Débits autorisés réussis" : "Successful authorized charges"}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "ÉCHECS DE PAIEMENT" : "FAILED REVENUE CHARGES"}
                  </span>
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-2xl text-stone-900">{statsFailedTxs}</h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Déclencheurs de période de grâce" : "Simulated ledger errors logged"}
                  </p>
                </div>
              </div>

            </div>

            {/* ADAPTERS CONFIGURATION AREA */}
            <div className="bg-stone-50 border border-stone-200 rounded-[32px] p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="font-sans font-extrabold text-sm text-stone-950 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-violet-600" />
                  {lang === 'FR' ? "Passerelles de Paiement Intégrées" : "Enterprise Checkout Payment Providers"}
                </h3>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Simulez différentes passerelles financières sans dépendance rigide à un fournisseur." : "Toggle active system gateways to model client experience for multiple checkout configurations."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {providers.map(prov => (
                  <div key={prov.id} className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[9px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-bold uppercase">
                          {prov.id}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${prov.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                      </div>
                      <h4 className="font-sans font-bold text-xs text-stone-900">{prov.name}</h4>
                      <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                        {lang === 'FR' ? prov.descriptionFR : prov.descriptionEN}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
                      <span className="text-[10px] text-stone-400 font-bold font-mono">
                        {prov.isReady ? 'API CONNECTED' : 'DRAFT'}
                      </span>
                      <button
                        onClick={() => handleToggleProvider(prov.id, prov.enabled)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                          prov.enabled 
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {prov.enabled ? (lang === 'FR' ? 'Désactiver' : 'Disable') : (lang === 'FR' ? 'Activer' : 'Enable')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MOCK TRANSACTION PROCESSOR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-5">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-sm text-[#111827] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                    {lang === 'FR' ? "Déclencher un Paiement" : "Execute Checkout Transaction"}
                  </h4>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Simulez un encaissement direct pour vérifier les registres comptables." : "Process real-time debit or bank transfer payments to evaluate automated billing status triggers."}
                  </p>
                </div>

                <form onSubmit={handleProcessCheckout} className="space-y-4 text-xs font-semibold text-stone-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Compte Client" : "Target Client Profile"}</label>
                      <select
                        value={paymentOrgId}
                        onChange={(e) => setPaymentOrgId(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans font-bold"
                      >
                        <option value="">-- {lang === 'FR' ? "Sélectionner" : "Select Client"} --</option>
                        {organizations.map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Montant de l'Achat ($)" : "Transaction Amount ($)"}</label>
                      <input
                        type="number"
                        min="1"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(parseInt(e.target.value))}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Passerelle Utilisée" : "Checkout Gateway Mode"}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {providers.filter(p => p.enabled).map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPaymentSource(p.id)}
                          className={`p-2.5 rounded-xl border text-[10px] font-bold uppercase transition-all shrink-0 ${
                            paymentSource === p.id 
                              ? 'bg-violet-950 text-white border-violet-950' 
                              : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {p.id.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{lang === 'FR' ? "Initier la Transaction" : "Authorize Settlement"}</span>
                  </button>
                </form>
              </div>

              {/* RECENT SETTLED TRAIL */}
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-4">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-sm text-[#111827]">
                    {lang === 'FR' ? "Transactions Récentes (Non Modifiables)" : "Recent Simulated Transaction Flow"}
                  </h4>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Historique des essais de prélèvement. Les transactions ne peuvent être modifiées manuellement." : "Audit trail of banking events. Transactions are system-locked and immutable."}
                  </p>
                </div>

                <div className="divide-y divide-stone-150 max-h-56 overflow-y-auto pr-1">
                  {transactions.slice(0, 5).map(tx => (
                    <div key={tx.transactionId} className="py-3 flex justify-between items-center text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-stone-900">{tx.transactionId}</span>
                          <span className="text-[10px] font-mono text-stone-400 capitalize">via {tx.source.replace('_', ' ')}</span>
                        </div>
                        <p className="text-[11px] text-stone-400 font-mono">{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-sans font-bold text-stone-950">${tx.amount}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                          tx.status === 'success' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : tx.status === 'failed'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SECTION 2: SUBSCRIPTION BILLING */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6" id="payments-view-subscriptions">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Subscription config creation */}
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-5 lg:col-span-1">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Déployer un Abonnement Commercial" : "Configure Commercial Subscription"}
                  </h4>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Configurez les contrats pour les comptes multilocataires." : "Simulate client conversions, configure trials, or apply promotional terms."}
                  </p>
                </div>

                <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs font-semibold text-stone-700">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Compte d'Organisation" : "Target Corporate Account"}</label>
                    <select
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans font-bold text-stone-800"
                    >
                      <option value="">-- {lang === 'FR' ? "Sélectionner" : "Select Tenant"} --</option>
                      {organizations.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Forfait Commercial" : "Selected Plan Tier"}</label>
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans font-bold text-stone-800"
                    >
                      <option value="Starter">Starter ($49/mo)</option>
                      <option value="Standard">Standard ($199/mo)</option>
                      <option value="Premium">Premium ($499/mo)</option>
                      <option value="Enterprise">Enterprise ($1499/mo)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "État Initial" : "Status Override"}</label>
                      <select
                        value={subStatus}
                        onChange={(e) => setSubStatus(e.target.value as SubscriptionState)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans font-bold text-stone-800"
                      >
                        <option value="active">Active</option>
                        <option value="trial">Trial</option>
                        <option value="grace_period">Grace Period</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Essai Gratuit ?" : "Trial Period ?"}</label>
                      <select
                        value={isTrial ? 'yes' : 'no'}
                        onChange={(e) => setIsTrial(e.target.value === 'yes')}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans font-bold text-stone-800"
                      >
                        <option value="no">Non (Direct billing)</option>
                        <option value="yes">Oui (30 days trial)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    {lang === 'FR' ? "Activer l'Abonnement" : "Initialize Mock Contract"}
                  </button>
                </form>
              </div>

              {/* Active list with state updates */}
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-4 lg:col-span-2">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Abonnements Actifs & Périodes de Grâce" : "Corporate Contracts & Grace Periods Tracking"}
                  </h4>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Gérez la période de transition en cas d'échec de paiement pour éviter le blocage immédiat." : "Verify automated downgrade triggers or test grace period limits without sudden access restrictions."}
                  </p>
                </div>

                <div className="divide-y divide-stone-150 max-h-96 overflow-y-auto pr-1">
                  {subscriptions.map(sub => (
                    <div key={sub.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-bold text-xs text-stone-950">{sub.orgName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${
                            sub.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                              : sub.status === 'trial'
                              ? 'bg-blue-50 text-blue-800 border-blue-100'
                              : sub.status === 'grace_period'
                              ? 'bg-amber-50 text-amber-800 border-amber-100'
                              : 'bg-rose-50 text-rose-800 border-rose-100'
                          }`}>
                            {sub.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-semibold">
                          Plan: <span className="font-bold text-stone-800">{sub.planName}</span> • Expire : {new Date(sub.endsAt).toLocaleDateString()}
                        </p>
                        {sub.status === 'grace_period' && sub.gracePeriodEndsAt && (
                          <p className="text-[10px] text-amber-700 font-bold font-mono">
                            ⚠️ Grace period expires on {new Date(sub.gracePeriodEndsAt).toLocaleDateString()} (Auto-downgrades on expiry)
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isSuperAdmin ? (
                          <>
                            <button
                              onClick={() => handleUpdateSubscriptionState(sub.id, 'active')}
                              className="px-2 py-1 bg-stone-100 hover:bg-emerald-50 text-[10px] font-bold text-stone-700 hover:text-emerald-700 rounded-lg transition-all"
                            >
                              Force Active
                            </button>
                            <button
                              onClick={() => handleUpdateSubscriptionState(sub.id, 'grace_period')}
                              className="px-2 py-1 bg-stone-100 hover:bg-amber-50 text-[10px] font-bold text-stone-700 hover:text-amber-700 rounded-lg transition-all"
                            >
                              Grace Period
                            </button>
                            <button
                              onClick={() => handleUpdateSubscriptionState(sub.id, 'expired')}
                              className="px-2 py-1 bg-stone-100 hover:bg-rose-50 text-[10px] font-bold text-stone-700 hover:text-rose-700 rounded-lg transition-all"
                            >
                              Downgrade
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-mono">Locked for Admin</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SECTION 3: INVOICES */}
        {activeTab === 'invoices' && (
          <div className="bg-white border border-stone-200 p-6 rounded-[32px] shadow-xs space-y-6" id="payments-view-invoices">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? "Grand Livre des Factures Émises" : "Invoices & Commercial Ledger"}
                </h4>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Visualisez et modifiez l'état d'encaissement des factures d'abonnements." : "Control payment states, download client-facing PDFs, or cancel outstanding commercial receipts."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400 font-bold font-mono">
                  CURRENCY ALLOWED: USD
                </span>
              </div>
            </div>

            <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-150">
              <div className="grid grid-cols-6 p-4 bg-stone-50 font-mono text-[9px] text-stone-500 font-extrabold uppercase tracking-wider">
                <span>Invoice ID</span>
                <span>Account ID</span>
                <span>Plan</span>
                <span>Created At</span>
                <span>Status & Amount</span>
                <span className="text-right">Actions</span>
              </div>

              {invoices.map(inv => {
                const orgName = organizations.find(o => o.id === inv.accountId)?.name || inv.accountId;
                return (
                  <div key={inv.invoiceId} className="grid grid-cols-6 p-4 items-center text-xs font-semibold text-stone-700 hover:bg-stone-50/40">
                    <span className="font-mono text-stone-900 font-bold">{inv.invoiceId}</span>
                    <span className="truncate pr-2 font-bold text-stone-850" title={orgName}>{orgName}</span>
                    <span className="font-mono">{inv.plan}</span>
                    <span className="font-mono text-stone-400">{new Date(inv.createdAt).toLocaleDateString()}</span>
                    
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-stone-900 font-extrabold">${inv.amount}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold border ${
                        inv.status === 'paid' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                          : inv.status === 'issued'
                          ? 'bg-blue-50 text-blue-800 border-blue-100'
                          : inv.status === 'failed'
                          ? 'bg-rose-50 text-rose-800 border-rose-100'
                          : 'bg-stone-100 text-stone-600 border-stone-200'
                      }`}>
                        {inv.status}
                      </span>
                    </div>

                    <div className="text-right flex items-center justify-end gap-1.5">
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => handleUpdateInvoiceStatus(inv.invoiceId, 'paid')}
                            className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold uppercase transition-all shrink-0"
                            title="Mark Paid"
                          >
                            Paid
                          </button>
                          <button
                            onClick={() => handleUpdateInvoiceStatus(inv.invoiceId, 'failed')}
                            className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded text-[9px] font-bold uppercase transition-all shrink-0"
                            title="Mark Failed"
                          >
                            Fail
                          </button>
                        </>
                      ) : null}
                      <button
                        onClick={() => triggerFeedback(lang === 'FR' ? 'Impression du fichier commercial PDF...' : 'Rendering simulated PDF...')}
                        className="p-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded transition-all cursor-pointer"
                        title="Download sample Invoice PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 4: TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="bg-white border border-stone-200 p-6 rounded-[32px] shadow-xs space-y-4" id="payments-view-transactions">
            <div className="space-y-1">
              <h4 className="font-sans font-bold text-sm text-[#111827]">
                {lang === 'FR' ? "Registre Central des Transactions" : "Central Commerce Transaction Journal"}
              </h4>
              <p className="text-[11px] text-[#6B7280] font-semibold">
                {lang === 'FR' ? "Livre de comptes immuable consignant l'ensemble des tentatives de débit bancaire de la plateforme." : "Immutable transaction history recording all payment processing cycles. Manual editing or tampering is strictly blocked for audit safety."}
              </p>
            </div>

            <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-150">
              <div className="grid grid-cols-5 p-4 bg-stone-50 font-mono text-[9px] text-stone-500 font-extrabold uppercase tracking-wider">
                <span>Transaction ID</span>
                <span>Gateway Source</span>
                <span>Status</span>
                <span>Amount Charged</span>
                <span>Processed Timestamp</span>
              </div>

              {transactions.map(tx => (
                <div key={tx.transactionId} className="grid grid-cols-5 p-4 items-center text-xs font-semibold text-stone-700">
                  <span className="font-mono text-stone-900 font-bold">{tx.transactionId}</span>
                  <span className="font-mono uppercase text-[#6B7280]">{tx.source.replace('_', ' ')}</span>
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold border ${
                      tx.status === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                        : tx.status === 'failed'
                        ? 'bg-rose-50 text-rose-800 border-rose-100'
                        : 'bg-stone-100 text-stone-600 border-stone-200'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <span className="font-mono text-stone-950 font-extrabold">${tx.amount} USD</span>
                  <span className="font-mono text-stone-400">{new Date(tx.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 5: ORGANIZATION BILLING */}
        {activeTab === 'orgs' && (
          <div className="space-y-6" id="payments-view-orgs">
            
            <div className="bg-white border border-stone-200 p-6 rounded-[32px] shadow-xs space-y-6">
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? "Fiches de Facturation par Organisation" : "Corporate Billing Profiles & Quota Usage"}
                </h4>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Spécifiez les adresses mail de facturation, configurez le nombre de places et suivez la consommation des ressources." : "Manage corporate seat allocations, associate central billing contacts, and review historical quota parameters."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {billingProfiles.map(profile => {
                  const isEditing = editingOrgId === profile.orgId;
                  return (
                    <div key={profile.orgId} className="p-5 border border-stone-200 rounded-3xl space-y-4 bg-stone-50/20 flex flex-col justify-between">
                      <div className="space-y-3 text-xs text-stone-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-sans font-extrabold text-sm text-stone-950">{profile.orgName}</h5>
                            <span className="font-mono text-[9px] text-stone-400 uppercase font-bold tracking-wider">{profile.orgId}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-violet-100 text-violet-800 font-mono text-[9px] font-bold rounded">
                            {profile.subscriptionPlan}
                          </span>
                        </div>

                        {isEditing ? (
                          <form onSubmit={handleSaveProfile} className="space-y-3 font-semibold text-stone-700">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-mono text-stone-400">Owner Email</label>
                              <input
                                type="email"
                                value={profileForm.ownerEmail || ''}
                                onChange={(e) => setProfileForm({ ...profileForm, ownerEmail: e.target.value })}
                                className="w-full p-2 bg-white border border-stone-200 rounded-lg"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-mono text-stone-400">Billing Contact Email</label>
                              <input
                                type="email"
                                value={profileForm.billingContactEmail || ''}
                                onChange={(e) => setProfileForm({ ...profileForm, billingContactEmail: e.target.value })}
                                className="w-full p-2 bg-white border border-stone-200 rounded-lg"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-mono text-stone-400">Active Seats</label>
                              <input
                                type="number"
                                value={profileForm.seatCount || 1}
                                onChange={(e) => setProfileForm({ ...profileForm, seatCount: parseInt(e.target.value) })}
                                className="w-full p-2 bg-white border border-stone-200 rounded-lg"
                              />
                            </div>

                            <div className="flex justify-end gap-1.5 pt-2">
                              <button
                                type="button"
                                onClick={() => setEditingOrgId(null)}
                                className="px-3 py-1.5 bg-stone-100 rounded-lg font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-3 py-1.5 bg-violet-600 text-white rounded-lg font-bold"
                              >
                                Save Profile
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="space-y-3">
                            <div className="space-y-1 text-[11px] font-semibold text-[#6B7280]">
                              <p><span className="text-stone-400">Owner:</span> <span className="font-mono text-stone-800">{profile.ownerEmail}</span></p>
                              <p><span className="text-stone-400">Billing contact:</span> <span className="font-mono text-stone-800">{profile.billingContactEmail}</span></p>
                              <p><span className="text-stone-400">Allocated seats:</span> <span className="font-mono text-stone-800">{profile.seatCount} members</span></p>
                            </div>

                            {/* Resource limits */}
                            <div className="pt-3 border-t border-stone-100 space-y-2">
                              <p className="text-[9px] uppercase font-mono text-stone-400 font-extrabold tracking-wider">Usage metrics</p>
                              <div className="space-y-1 font-mono text-[10px] text-stone-500">
                                <div className="flex justify-between">
                                  <span>Interviews:</span>
                                  <span className="font-bold text-stone-800">{profile.usageSummary.interviewsUsed} / {profile.usageSummary.interviewsLimit}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Storage limit:</span>
                                  <span className="font-bold text-stone-800">{profile.usageSummary.storageUsedGB} GB / {profile.usageSummary.storageLimitGB} GB</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isEditing && isAdmin && (
                        <button
                          onClick={() => handleEditProfile(profile)}
                          className="w-full mt-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          {lang === 'FR' ? "Ajuster la fiche" : "Modify Billing Contact"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* SECTION 6: WALLET READINESS */}
        {activeTab === 'wallet' && (
          <div className="space-y-6" id="payments-view-wallet">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Wallet adjust credits */}
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-5 lg:col-span-1">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-sm text-[#111827] flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                    {lang === 'FR' ? "Ajuster l'allocation de Crédits" : "Adjust Corporate Grant Allocations"}
                  </h4>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Déposez ou déduisez des crédits système. Ne stocke pas de monnaie légale." : "Simulate promotional corporate grants, free evaluation tokens or enterprise adjustments. No real currency is held."}
                  </p>
                </div>

                <form onSubmit={handleAdjustWallet} className="space-y-4 text-xs font-semibold text-stone-700 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Compte Bénéficiaire" : "Select Target Wallet"}</label>
                    <select
                      value={walletOrgId}
                      onChange={(e) => setWalletOrgId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans font-bold text-stone-800"
                    >
                      <option value="">-- {lang === 'FR' ? "Sélectionner" : "Select Org"} --</option>
                      {organizations.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">{lang === 'FR' ? "Montant de Crédits" : "Credits Amount"}</label>
                      <input
                        type="number"
                        placeholder="e.g. 500"
                        value={adjustmentAmount}
                        onChange={(e) => setAdjustmentAmount(parseInt(e.target.value))}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">Action</label>
                      <select
                        onChange={(e) => {
                          const multiplier = e.target.value === 'deduct' ? -1 : 1;
                          setAdjustmentAmount(prev => Math.abs(prev) * multiplier);
                        }}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans font-bold text-stone-800"
                      >
                        <option value="add">Add (+)</option>
                        <option value="deduct">Deduct (-)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">Reason / Motivation</label>
                    <input
                      type="text"
                      required
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    {lang === 'FR' ? "Ajuster le Solde" : "Submit Wallet Balance Tweak"}
                  </button>
                </form>
              </div>

              {/* Wallet balances lists */}
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6 lg:col-span-2 text-left">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Solde de Crédits Actifs par Organisation" : "Active Corporate Wallets & Historical Adjustment Logs"}
                  </h4>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Vérifiez les réserves de crédits prépayés disponibles pour l'exécution d'entretiens." : "Keep track of active corporate virtual balances used for automatic internal invoice settling."}
                  </p>
                </div>

                <div className="space-y-6">
                  {wallets.map(wal => {
                    const orgName = organizations.find(o => o.id === wal.orgId)?.name || wal.orgId;
                    return (
                      <div key={wal.walletId} className="p-4 border border-stone-200 rounded-2xl bg-stone-50/50 space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-sans font-extrabold text-xs text-stone-950">{orgName}</span>
                            <span className="block font-mono text-[9px] text-stone-400 uppercase font-bold">ID: {wal.walletId}</span>
                          </div>
                          
                          <div className="text-right">
                            <span className="font-mono text-sm font-extrabold text-stone-900">{wal.balance} Credits</span>
                            <p className="text-[9px] text-[#6B7280] font-semibold">Equivalent USD: ${wal.credits}</p>
                          </div>
                        </div>

                        {/* Adjustments history */}
                        {wal.adjustments && wal.adjustments.length > 0 ? (
                          <div className="pt-3 border-t border-stone-150 space-y-2">
                            <p className="text-[9px] uppercase font-mono text-stone-400 font-extrabold">Modification History</p>
                            <div className="space-y-1.5 max-h-24 overflow-y-auto">
                              {wal.adjustments.map(adj => (
                                <div key={adj.id} className="flex justify-between items-center text-[10px] font-mono text-stone-600 bg-white px-2 py-1 rounded border border-stone-100">
                                  <div className="truncate pr-2">
                                    <span className="font-bold text-stone-800">{adj.reason}</span>
                                    <span className="block text-[8px] text-stone-400">{new Date(adj.timestamp).toLocaleDateString()}</span>
                                  </div>
                                  <span className={`font-bold ${adj.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {adj.amount >= 0 ? '+' : ''}{adj.amount}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[9px] text-stone-400 font-mono">No historical adjustments recorded</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
      
    </div>
  );
}
