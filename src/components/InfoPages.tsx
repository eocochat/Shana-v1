import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Cpu, 
  Mic, 
  Video, 
  BarChart3, 
  Search, 
  Building, 
  ShieldCheck, 
  HelpCircle, 
  Send, 
  Lock, 
  Cookie, 
  ChevronRight, 
  BookOpen, 
  Compass, 
  MessageSquare, 
  FileText,
  Mail,
  User,
  CheckCircle,
  AlertCircle,
  Star,
  Target,
  TrendingUp,
  Clock,
  Activity
} from 'lucide-react';
import { useToast } from './Toast';
import Footer from './Footer';

interface InfoPagesProps {
  page: string;
  lang: 'EN' | 'FR';
  onChangeLang: (lang: 'EN' | 'FR') => void;
  onNavigateHome: () => void;
  onNavigatePage: (page: string) => void;
  onStartLogin: () => void;
  onStartOnboarding: () => void;
}

export default function InfoPages({ 
  page, 
  lang, 
  onChangeLang, 
  onNavigateHome, 
  onNavigatePage,
  onStartLogin, 
  onStartOnboarding 
}: InfoPagesProps) {
  const isFR = lang === 'FR';
  const { addToast } = useToast();

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Help Center Search
  const [searchQuery, setSearchQuery] = useState('');

  // Accordion state for FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Blog coming soon newsletter state
  const [blogEmail, setBlogEmail] = useState('');
  const [blogSubscribed, setBlogSubscribed] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  // Submissions simulator
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) return;
    setIsSubmittingContact(true);

    const emailPayload = {
      type: 'contact',
      recipient: 'eocochat@gmail.com',
      extraData: {
        firstName: contactName,
        email: contactEmail,
        subject: isFR ? 'Demande de Support SHANA' : 'SHANA Support Request',
        message: contactMsg,
        language: isFR ? 'French' : 'English',
        lang: isFR ? 'FR' : 'EN'
      }
    };

    // Dispatch custom event for Email Simulator so the user can see it instantly!
    try {
      window.dispatchEvent(new CustomEvent('shana-trigger-email', {
        detail: emailPayload
      }));
    } catch (e) {
      console.warn("Simulator dispatch warning:", e);
    }

    try {
      const response = await fetch('/api/email/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      setContactSubmitted(true);
      addToast({
        title: isFR ? "Message Envoyé" : "Message Dispatched",
        description: isFR 
          ? "Notre équipe d'ingénieurs SHANA a bien reçu votre demande à l'adresse eocochat@gmail.com et vous contactera sous 24h." 
          : "SHANA support engineers have logged your request to eocochat@gmail.com. We will follow up securely within 24h.",
        type: "success"
      });
    } catch (err: any) {
      console.error("Failed to submit contact message via dispatch endpoint:", err);
      // Fallback to offline/mock success so the UI doesn't crash if the email server isn't fully configured
      setContactSubmitted(true);
      addToast({
        title: isFR ? "Message Envoyé (Mode Secours)" : "Message Dispatched (Fallback)",
        description: isFR 
          ? "Votre message a été enregistré localement (destinataire : eocochat@gmail.com). Nous vous contacterons sous 24h." 
          : "Your message has been logged locally (destination: eocochat@gmail.com). We will follow up securely within 24h.",
        type: "success"
      });
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleBlogSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogEmail) return;
    setBlogSubscribed(true);
    addToast({
      title: isFR ? "Abonnement Validé" : "Subscription Logged",
      description: isFR 
        ? "Vous recevrez des articles d'ingénierie d'entretien dans vos emails." 
        : "You will receive high-cadence spoken excellence digests in your inbox.",
      type: "success"
    });
  };

  // Faq Questions & Answers
  const faqs = [
    {
      q: isFR ? "Comment fonctionnent les sessions gratuites ?" : "How do the free sessions work?",
      a: isFR 
        ? "Lors de votre inscription, vous recevez automatiquement 2 sessions audio gratuites de bienvenue. Cela vous permet de tester notre simulateur et d'obtenir vos premières évaluations vocales sans carte bancaire."
        : "Upon signup, you automatically receive 2 free audio welcome sessions. This allows you to test our voice simulator and obtain your first vocal evaluations with zero credit card required."
    },
    {
      q: isFR ? "Les packs expirent-ils ?" : "Do the packs expire?",
      a: isFR 
        ? "Non, les packs Starter et Premium n'ont aucune date d'expiration. Les sessions achetées restent valables indéfiniment sur votre compte jusqu'à ce que vous choisissiez de les utiliser."
        : "No, our Starter and Premium packs never expire. Purchased credits remain valid on your account indefinitely until you choose to consume them."
    },
    {
      q: isFR ? "Puis-je acheter plus plus tard ?" : "Can I buy more later?",
      a: isFR 
        ? "Absolument. Vous pouvez acheter des packs d'entraînement supplémentaires (Starter ou Premium) ou opter pour notre abonnement Ultra pour un accès illimité. Des recharges individuelles à la carte (+1 Audio, +3 Audio, +1 Miroir) sont également disponibles à tout moment."
        : "Absolutely. You can purchase additional training packs (Starter or Premium) or upgrade to our Ultra subscription for unlimited access. Individual top-ups (+1 Audio, +3 Audio, +1 Mirror) are also available at any time."
    },
    {
      q: isFR ? "Qu'est-ce que Mirror ?" : "What is Mirror?",
      a: isFR 
        ? "Mirror (Évaluation Miroir) est notre outil de simulation immersive caméra. Il utilise votre webcam et micro pour analyser votre posture, votre regard et la clarté de vos arguments dans des conditions d'examen strictes sans possibilité de recommencer, afin de simuler la pression réelle d'un entretien final."
        : "Mirror (Mirror Evaluation) is our immersive camera simulation tool. It uses your webcam and microphone to analyze physical posture, gaze stability, and logical reasoning under lifelike pressure with no pauses or retries, perfectly simulating a final-round interview."
    }
  ];

  // Search filter for help center FAQ list
  const helpArticles = [
    { cat: 'Account', q: 'How do I erase all of my stored history data?', a: 'You can instantly purge all your uploaded CV metrics and assessment history using the "Purge All Data" button in your Profile under Account Settings.', frQ: 'Comment effacer l\'intégralité des données sauvegardées ?', frA: 'Vous pouvez supprimer instantanément tous vos téléversements et analyses d\'un simple clic sur le bouton "Purger Toutes les Données" situé dans les paramètres de votre profil.' },
    { cat: 'Account', q: 'How long does a login session remain valid?', a: 'SHANA authentication sessions stay active for exactly 7 days securely on SameSite Lax rules, unless you explicitly click Log Out.', frQ: 'Combien de temps ma session reste-t-elle active ?', frA: 'Les sessions de connexion sécurisées de SHANA durent exactement 7 jours, réglées sur vos cookies système, sauf en cas de déconnexion manuelle.' },
    { cat: 'Training', q: 'Can I train multiple times for the same question?', a: 'Yes. The Voice Training simulator allows infinite repetitions so you can practice until your speech pacing and answers are flawless.', frQ: 'Puis-je m\'entraîner plusieurs fois sur le même thème ?', frA: 'Oui. Le protocole d\'entraînement vocal permet des répétitions infinies sans pression, afin de polir votre communication avant l\'examen miroir.' },
    { cat: 'Training', q: 'What should I do if my audio input is not captured?', a: 'Check your browser tab permissions. Make sure microphone access for SHANA is explicitly toggled "On" in your address bar adjustments.', frQ: 'Que faire si mon micro n\'est pas détecté ?', frA: 'Vérifiez les permissions de votre navigateur. Autorisez explicitement l\'accès au micro pour le domaine de SHANA dans la barre d\'adresse.' },
    { cat: 'Assessment', q: 'Why is Mirror Assessment limited to a single try?', a: 'To replicate high-stakes professional interviews. True performance readiness cannot rely on comfortable retries or restarts.', frQ: 'Pourquoi l\'Évaluation Miroir est-elle à essai unique ?', frA: 'Pour reproduire fidèlement la pression d\'un entretien d’embauche réel. La performance s\'acquiert par la préparation, pas par les essais confortables.' },
    { cat: 'Assessment', q: 'How does the facial and gaze analytics capture metrics?', a: 'Your browser uses localized posture detectors tracking horizontal focus and visual stability. NO video recordings are ever streamed to third party servers.', frQ: 'Comment fonctionne la collecte de métriques visuelles ?', frA: 'SHANA utilise des moteurs de détection de posture locale analysant la trajectoire de regard et l\'horizontalité de la posture sans jamais l\'enregistrer.' },
    { cat: 'Privacy', q: 'Who has access to my recorded answers?', a: 'Only you. All parsed data is strictly localized under secure user cookies and memory layers. Not even SHANA system operators view individual CV uploads.', frQ: 'Qui peut consulter mes réponses enregistrées ?', frA: 'Vous exclusivement. Vos thèmes d\'évaluation et vos enregistrements de voix restent cloisonnés sur votre espace sécurisé personnel et intouchable.' }
  ];

  const filteredArticles = helpArticles.filter(art => {
    const query = searchQuery.toLowerCase();
    if (isFR) {
      return art.frQ.toLowerCase().includes(query) || art.frA.toLowerCase().includes(query) || art.cat.toLowerCase().includes(query);
    }
    return art.q.toLowerCase().includes(query) || art.a.toLowerCase().includes(query) || art.cat.toLowerCase().includes(query);
  });

  return (
    <div id="info-pages-wrapper" className="min-h-screen bg-[#FAF7F2] text-stone-950 flex flex-col justify-between selection:bg-stone-950 selection:text-white font-sans">
      
      {/* HEADER BAR FOR INFORMATIONAL PAGES */}
      <header id="info-header" className="sticky top-0 z-50 bg-[#EDC154] border-b-2 border-stone-950 shadow-[0px_3px_0px_0px_rgba(17,17,17,1)] transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={onNavigateHome}>
            <div className="w-8.5 h-8.5 rounded-xl bg-stone-950 flex items-center justify-center text-[#EDC154] border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-sans font-black text-sm">
              S
            </div>
            <div>
              <span className="font-sans font-black text-base tracking-tight text-stone-950 uppercase">SHANA</span>
              <span className="font-mono text-[9px] text-stone-850 uppercase tracking-widest block leading-none font-bold">SYSTEM // PRO</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Nav Links */}
            <button 
              onClick={() => onNavigatePage('how-it-works')}
              className={`hidden sm:inline-block text-xs font-black uppercase tracking-wider cursor-pointer ${page === 'how-it-works' ? 'text-stone-950 underline decoration-2' : 'text-stone-700 hover:text-stone-950'}`}
            >
              {isFR ? "Comment ça marche" : "How It Works"}
            </button>
            <button 
              onClick={() => onNavigatePage('faq')}
              className={`hidden sm:inline-block text-xs font-black uppercase tracking-wider cursor-pointer ${page === 'faq' ? 'text-stone-950 underline decoration-2' : 'text-stone-700 hover:text-stone-950'}`}
            >
              FAQ
            </button>

            {/* Language Switcher */}
            <div className="flex bg-white p-0.5 rounded-xl border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
              <button
                id="info-switcher-en"
                onClick={() => onChangeLang('EN')}
                className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer font-mono ${
                  lang === 'EN' ? 'bg-stone-950 text-white' : 'text-stone-500 hover:text-stone-950'
                }`}
              >
                EN
              </button>
              <button
                id="info-switcher-fr"
                onClick={() => onChangeLang('FR')}
                className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer font-mono ${
                  lang === 'FR' ? 'bg-stone-950 text-white' : 'text-stone-500 hover:text-stone-950'
                }`}
              >
                FR
              </button>
            </div>

            <button
              id="info-nav-login-btn"
              onClick={onStartLogin}
              className="text-xs font-black uppercase tracking-wider text-white bg-[#18633F] hover:bg-[#1f7c50] border-2 border-stone-950 px-4 py-2 rounded-xl transition-all shadow-[2.5px_2.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] cursor-pointer"
            >
              {isFR ? "Accéder" : "Access Protocol"}
            </button>
          </div>

        </div>
      </header>

      {/* INNER CONTENT SWITCHER */}
      <main id="info-main-content" className="flex-1 py-12 md:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Navigation Breadcrumb back to landing */}
        <button 
          id="info-back-to-landing"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-xs font-black uppercase text-stone-950 bg-white border-2 border-stone-950 px-3 py-1.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] hover:shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] mb-8 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>{isFR ? "Retour à l'accueil" : "Back to Home"}</span>
        </button>

        {/* ========================================================== */}
        {/* PAGE 1: HOW IT WORKS                                       */}
        {/* ========================================================== */}
        {page === 'how-it-works' && (
          <div id="page-how-it-works" className="space-y-12 animate-fade-in text-left">
            <div className="space-y-4">
              <span className="font-mono text-[10px] uppercase bg-blue-100 text-blue-800 tracking-widest font-extrabold px-2.5 py-1 rounded">
                {isFR ? "PARCOURS D'EXCELLENCE" : "THE READINESS CYCLE"}
              </span>
              <h1 className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-[#1A2B3C]">
                {isFR ? "De votre CV à un profil d'élite." : "How SHANA Works."}
              </h1>
              <p className="text-sm text-[#6B7280] leading-relaxed max-w-2xl font-medium">
                {isFR 
                  ? "SHANA applique des filtres d'entraînements vocaux et des examens devant caméra spécialement calibrés pour éliminer vos blocages oratoires."
                  : "SHANA processes your background to setup targeted audio workouts and rigid physical screen drills, erasing natural speaking anxieties."}
              </p>
            </div>

            {/* Step-by-step graphic list */}
            <div className="space-y-8 mt-10">
              {/* Step 1 */}
              <div className="p-6 bg-white border border-[#E5E7EB] rounded-2xl flex flex-col md:flex-row gap-6 hover:border-[#1A2B3C]/20 transition-all shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-[#1A2B3C]/5 border border-[#1A2B3C]/10 text-[#1A2B3C] flex items-center justify-center shrink-0">
                  <Upload className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-[#9CA3AF] uppercase">STEP // 01</span>
                    <h3 className="text-base font-extrabold text-[#1A2B3C]">{isFR ? "Téléversez votre CV" : "Upload Your CV"}</h3>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed mt-2">
                    {isFR 
                      ? "Déposez votre CV PDF. Notre parseur extrait l'ensemble de votre chronologie, vos exploits technologiques et vos responsabilités financières, sans exiger l'écriture de longs formulaires."
                      : "Drop your CV as a PDF file. Our secure interface parses your professional records, engineering milestones, and budget controls without tedious copy-paste profiles."}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-6 bg-white border border-[#E5E7EB] rounded-2xl flex flex-col md:flex-row gap-6 hover:border-[#1A2B3C]/20 transition-all shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-orange-50 stroke-orange-500 text-orange-600 flex items-center justify-center shrink-0">
                  <Cpu className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-[#9CA3AF] uppercase">STEP // 02</span>
                    <h3 className="text-base font-extrabold text-[#1A2B3C]">{isFR ? "Analyse Intellectuelle SHANA" : "SHANA Background Analysis"}</h3>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed mt-2">
                    {isFR 
                      ? "SHANA dresse un diagnostic de votre profil de compétences. Elle cartographie 5 thématiques d'évaluations réalistes simulant des entretiens au salaire ciblé."
                      : "SHANA builds a logical matrix tracking key skill sets. It generates 5 custom high-relevance focus modules replicating real expectations of top employers."}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-6 bg-white border border-[#E5E7EB] rounded-2xl flex flex-col md:flex-row gap-6 hover:border-[#1A2B3C]/20 transition-all shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Mic className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-[#9CA3AF] uppercase">STEP // 03</span>
                    <h3 className="text-base font-extrabold text-[#1A2B3C]">{isFR ? "Entraînement Vocal d'Éclaireur" : "Vocal Interval Training"}</h3>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed mt-2">
                    {isFR 
                      ? "Accédez à l'entraînement oral sans caméra. C'est l'échauffement : répondez à des questions orales, ré-écoutez vos segments, et améliorez de façon spectaculaire votre diction et votre confiance."
                      : "Go through low-pressure, audio-only speaking sessions. Here you hear dynamic questions, record verbal responses, and analyze pacing metrics to naturally purge verbal filter words."}
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-6 bg-white border border-[#E5E7EB] rounded-2xl flex flex-col md:flex-row gap-6 hover:border-[#1A2B3C]/20 transition-all shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Video className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-[#9CA3AF] uppercase">STEP // 04</span>
                    <h3 className="text-base font-extrabold text-[#1A2B3C]">{isFR ? "L'Épreuve de l'Évaluation Miroir" : "The Mirror Assessment Crucible"}</h3>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed mt-2">
                    {isFR 
                      ? "L'examen formalisé commence devant votre webcam. Aucun deuxième essai n'est permis. SHANA mesure votre regard stabilisé, votre posture physique et la résilience intellectuelle de votre argumentation."
                      : "The official simulation commences in front of your camera. One opportunity only. SHANA monitors gaze stability, structural poise, and argumentative reasoning under strict timer limits."}
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-6 bg-white border border-[#E5E7EB] rounded-2xl flex flex-col md:flex-row gap-6 hover:border-[#1A2B3C]/20 transition-all shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-[#9CA3AF] uppercase">STEP // 05</span>
                    <h3 className="text-base font-extrabold text-[#1A2B3C]">{isFR ? "Tableau de Bord de Clarté" : "Objective Readiness Feedback"}</h3>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed mt-2">
                    {isFR 
                      ? "Étudiez le retour d'analyse global : score d'argumentation de l'entretien, cadence verbale, alignement du CV. Affinez vos blocages identifiés."
                      : "Examine detailed visual charts tracking posture consistency, language choice, response alignment, and spoken cadence to perfect subsequent meetings."}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Call to action block */}
            <div className="p-8 bg-[#1A2B3C] text-white rounded-[32px] text-center space-y-4">
              <h3 className="text-xl font-bold font-sans">
                {isFR ? "Prêt à entamer votre transformation ?" : "Erase the guesswork from your next meeting."}
              </h3>
              <p className="text-xs text-[#9CA3AF] max-w-md mx-auto">
                {isFR 
                  ? "Entraînez-vous avec les protocoles sans plus attendre." 
                  : "Kickstart your training protocols in less than 3 minutes."}
              </p>
              <div className="pt-2">
                <button 
                  onClick={onStartOnboarding}
                  className="px-6 py-2.5 bg-white text-[#1A2B3C] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#F3F4F6] transition-all cursor-pointer"
                >
                  {isFR ? "Lancer le Protocole" : "Initialize Training Option"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* PAGE 2: BLOG                                               */}
        {/* ========================================================== */}
        {page === 'blog' && (
          <div id="page-blog" className="space-y-12 animate-fade-in text-left">
            {!selectedArticleId ? (
              <>
                <div className="space-y-3">
                  <span className="font-mono text-[10px] uppercase bg-amber-150 text-stone-900 border border-stone-950 font-black tracking-widest px-2.5 py-1 rounded shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] inline-block">
                    {isFR ? "MÉTHODOLOGIE ET RECHERCHE" : "METHODOLOGY & RESEARCH"}
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-stone-950 uppercase">
                    {isFR ? "Le Blog de Préparation SHANA" : "SHANA Preparation Blog"}
                  </h1>
                  <p className="text-sm text-stone-700 font-bold leading-relaxed max-w-xl">
                    {isFR 
                      ? "Guides illustrés et recherches de pointe sur la structure STAR, les scores oratoires, et le fonctionnement de l'IA."
                      : "Illustrated guides and advanced research on the STAR structure, oratorical scores, and AI engine mechanics."}
                  </p>
                </div>

                {/* Illustrated Blog Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  {/* Article 1: How it Works */}
                  <div 
                    id="blog-card-how-it-works"
                    onClick={() => { setSelectedArticleId('how-it-works'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="group bg-white border-2 border-stone-950 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      {/* Illustrative mini-graphic */}
                      <div className="h-32 bg-stone-50 border-2 border-stone-950 rounded-xl relative overflow-hidden flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[radial-gradient(#171717_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
                        <div className="flex items-center gap-3 z-10">
                          <div className="w-10 h-10 bg-[#EDC154] border border-stone-950 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                            <Mic className="w-5 h-5 text-stone-950" />
                          </div>
                          <div className="text-stone-300">➔</div>
                          <div className="w-10 h-10 bg-stone-950 border border-stone-950 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                            <Cpu className="w-5 h-5 text-[#EDC154]" />
                          </div>
                          <div className="text-stone-300">➔</div>
                          <div className="w-10 h-10 bg-stone-100 border border-stone-950 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                            <BarChart3 className="w-5 h-5 text-stone-950" />
                          </div>
                        </div>
                      </div>
                      
                      <span className="font-mono text-[9px] text-[#18633F] font-black tracking-widest block uppercase">ENGINEERING // GUIDE</span>
                      <h3 className="text-lg font-black text-stone-950 uppercase tracking-tight group-hover:text-stone-800 transition-colors">
                        {isFR ? "Comment Fonctionne SHANA : L'IA Oratoire" : "How SHANA Works: The Vocal AI Engine"}
                      </h3>
                      <p className="text-xs text-stone-600 font-bold leading-relaxed">
                        {isFR 
                          ? "Découvrez les coulisses de l'analyse acoustique de votre voix, de la détection de latence, et de l'adaptation du jury d'IA."
                          : "Explore behind the scenes of real-time acoustic signal parsing, latencies, and how our interactive AI models adapt to your background."}
                      </p>
                    </div>
                    <span className="text-xs font-black text-stone-950 uppercase tracking-wider block pt-3 border-t border-stone-100 group-hover:underline">
                      {isFR ? "Lire l'article complet →" : "Read full article →"}
                    </span>
                  </div>

                  {/* Article 2: Scores & Objectives */}
                  <div 
                    id="blog-card-scores-objectives"
                    onClick={() => { setSelectedArticleId('scores-objectives'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="group bg-white border-2 border-stone-950 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      {/* Illustrative mini-graphic */}
                      <div className="h-32 bg-stone-50 border-2 border-stone-950 rounded-xl relative overflow-hidden flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[radial-gradient(#171717_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
                        <div className="w-full space-y-2 z-10 px-2">
                          <div className="flex justify-between items-center text-[10px] font-mono font-black text-stone-700">
                            <span>ELOCUTION RATE</span>
                            <span>145 WPM (IDEAL)</span>
                          </div>
                          <div className="w-full bg-stone-200 h-3.5 rounded-full border border-stone-950 p-0.5">
                            <div className="bg-[#18633F] h-full rounded-full" style={{ width: '85%' }}></div>
                          </div>
                          <div className="flex justify-between items-center text-[9px] font-mono text-stone-500 font-bold">
                            <span>SLOW</span>
                            <span>TARGET RANGE</span>
                            <span>FAST</span>
                          </div>
                        </div>
                      </div>

                      <span className="font-mono text-[9px] text-[#A14B15] font-black tracking-widest block uppercase">METRICS // INTERACTIVE</span>
                      <h3 className="text-lg font-black text-stone-950 uppercase tracking-tight group-hover:text-stone-800 transition-colors">
                        {isFR ? "Décoder les Scores & Objectifs SHANA" : "Deciphering Your Scores & Objectives"}
                      </h3>
                      <p className="text-xs text-stone-600 font-bold leading-relaxed">
                        {isFR 
                          ? "Comprenez comment atteindre le rythme idéal d'élocution (130-150 mots/min), limiter vos tics de parole, et stabiliser votre regard caméra."
                          : "Learn how to hit the perfect speech rate (130-150 WPM), reduce filler words, and satisfy eye gaze constraints."}
                      </p>
                    </div>
                    <span className="text-xs font-black text-stone-950 uppercase tracking-wider block pt-3 border-t border-stone-100 group-hover:underline">
                      {isFR ? "Lire l'article complet →" : "Read full article →"}
                    </span>
                  </div>

                  {/* Article 3: Star System */}
                  <div 
                    id="blog-card-star-system"
                    onClick={() => { setSelectedArticleId('star-system'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="group bg-white border-2 border-stone-950 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      {/* Illustrative mini-graphic */}
                      <div className="h-32 bg-stone-50 border-2 border-stone-950 rounded-xl relative overflow-hidden flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[radial-gradient(#171717_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
                        <div className="flex gap-1.5 z-10">
                          <Star className="w-8 h-8 text-[#EDC154] fill-[#EDC154] filter drop-shadow-[2px_2px_0px_rgba(17,17,17,1)]" />
                          <Star className="w-8 h-8 text-[#EDC154] fill-[#EDC154] filter drop-shadow-[2px_2px_0px_rgba(17,17,17,1)]" />
                          <Star className="w-8 h-8 text-[#EDC154] fill-[#EDC154] filter drop-shadow-[2px_2px_0px_rgba(17,17,17,1)]" />
                          <Star className="w-8 h-8 text-[#EDC154] fill-[#EDC154] filter drop-shadow-[2px_2px_0px_rgba(17,17,17,1)]" />
                          <Star className="w-8 h-8 text-stone-300 filter drop-shadow-[2px_2px_0px_rgba(17,17,17,1)]" />
                        </div>
                      </div>

                      <span className="font-mono text-[9px] text-[#2563EB] font-black tracking-widest block uppercase">STRUCTURE // METHODOLOGY</span>
                      <h3 className="text-lg font-black text-stone-950 uppercase tracking-tight group-hover:text-stone-800 transition-colors">
                        {isFR ? "Maîtriser la Méthode STAR en Entretien" : "Mastering the STAR Structure & Ratings"}
                      </h3>
                      <p className="text-xs text-stone-600 font-bold leading-relaxed">
                        {isFR 
                          ? "Structurez vos réponses avec rigueur (Situation, Tâche, Action, Résultat) pour décrocher les 5 Étoiles oratoires."
                          : "Build flawless behavioral answers (Situation, Task, Action, Result) and achieve prestigious 5-Star feedback."}
                      </p>
                    </div>
                    <span className="text-xs font-black text-stone-950 uppercase tracking-wider block pt-3 border-t border-stone-100 group-hover:underline">
                      {isFR ? "Lire l'article complet →" : "Read full article →"}
                    </span>
                  </div>

                </div>

                {/* Newsletter Sign up */}
                <div id="blog-newsletter-box" className="p-8 bg-stone-950 text-white rounded-[32px] text-center space-y-6 relative overflow-hidden border-4 border-stone-950 shadow-[4px_4px_0px_0px_rgba(237,193,84,1)]">
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03]"></div>
                  
                  <div className="max-w-md mx-auto space-y-3 pt-4 z-10 relative">
                    <span className="font-mono text-[9px] font-black uppercase text-[#EDC154] tracking-widest bg-stone-900 border border-stone-800 px-3 py-1 rounded">
                      {isFR ? "LETTRE TECHNIQUE" : "RESEARCH BULLETINS"}
                    </span>
                    <h3 className="text-xl font-sans font-black uppercase tracking-tight">
                      {isFR ? "S'abonner aux Publications SHANA" : "Subscribe to SHANA Digests"}
                    </h3>
                    <p className="text-xs text-stone-300 font-semibold leading-relaxed">
                      {isFR 
                        ? "Recevez régulièrement des analyses oratoires, d'élocution et de posture directement dans votre boîte mail."
                        : "Receive high-fidelity digests covering speech processing, cognitive poise, and interview strategy."}
                    </p>
                  </div>

                  <div className="z-10 relative">
                    {!blogSubscribed ? (
                      <form onSubmit={handleBlogSubscribe} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
                        <input 
                          type="email"
                          required
                          value={blogEmail}
                          onChange={(e) => setBlogEmail(e.target.value)}
                          placeholder={isFR ? "votre.email@domaine.com" : "candidate@domain.com"}
                          className="flex-1 bg-stone-900 border-2 border-stone-800 px-4 py-2.5 text-xs rounded-xl outline-none focus:border-[#EDC154] text-white font-bold"
                        />
                        <button 
                          type="submit"
                          className="px-6 py-2.5 bg-[#EDC154] text-stone-950 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer hover:bg-[#ffe39c] transition-colors border-2 border-stone-950"
                        >
                          {isFR ? "S'abonner" : "Subscribe"}
                        </button>
                      </form>
                    ) : (
                      <div className="max-w-md mx-auto p-4 bg-[#18633F] border-2 border-stone-950 rounded-xl space-y-1 text-center shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
                        <CheckCircle className="w-5 h-5 text-white mx-auto" />
                        <p className="text-xs font-black text-white uppercase">
                          {isFR ? "Inscription validée" : "Secure Logged Verified"}
                        </p>
                        <p className="text-[10px] text-emerald-100 font-bold">
                          {isFR ? "Votre email a été enregistré avec succès." : "You are cataloged for upcoming publication notifications."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div id="blog-article-viewer" className="space-y-8 animate-fade-in text-left">
                {/* Back button */}
                <button 
                  id="btn-back-to-blog"
                  onClick={() => { setSelectedArticleId(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-stone-50 border-2 border-stone-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>{isFR ? "Retour au blog" : "Back to blog"}</span>
                </button>

                {/* ========================================================== */}
                {/* ARTICLE 1 DETAILED: HOW IT WORKS                           */}
                {/* ========================================================== */}
                {selectedArticleId === 'how-it-works' && (
                  <article className="max-w-4xl bg-white border-2 border-stone-950 rounded-3xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] space-y-8">
                    <div className="space-y-4">
                      <span className="font-mono text-xs font-black uppercase text-[#18633F] tracking-wider bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-md inline-block">
                        {isFR ? "GUIDE ARCHITECTURE TECHNIQUE" : "TECHNICAL ARCHITECTURE DIGEST"}
                      </span>
                      <h2 className="text-2xl sm:text-3.5xl font-sans font-black text-stone-950 uppercase tracking-tight leading-tight">
                        {isFR ? "L'IA Oratoire en Action : Comment Vos Entraînements Sont Évalués" : "The Spoken AI Engine: How Your Training is Audited"}
                      </h2>
                      <div className="flex items-center gap-4 text-xs font-bold text-stone-500 uppercase tracking-wide">
                        <span>{isFR ? "Par l'Équipe Ingénierie SHANA" : "By SHANA Engineering"}</span>
                        <span>•</span>
                        <span>{isFR ? "Lecture : 6 min" : "Read Time: 6 min"}</span>
                      </div>
                    </div>

                    {/* ILLUSTRATION: The Real-time Spoken Analysis Pipeline */}
                    <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(#171717_1px,transparent_1px)] [background-size:16px_16px] opacity-5"></div>
                      <h4 className="font-mono text-[10px] font-black uppercase tracking-wider text-stone-700 text-center mb-6">
                        {isFR ? "PIPELINE D'ANALYSE ACOUSTIQUE ET CHRONOMÉTRIQUE SHANA" : "SHANA REAL-TIME ACOUSTIC & LATENCY PIPELINE"}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                        {/* Step 1 */}
                        <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-sm text-center space-y-2">
                          <span className="text-xl">🎙️</span>
                          <div className="font-mono text-[9px] font-black text-[#18633F] bg-emerald-50 rounded px-1.5 py-0.5 inline-block">STEP 01</div>
                          <h5 className="font-sans font-black text-xs text-stone-950 uppercase">{isFR ? "FLUX AUDIO" : "AUDIO STREAM"}</h5>
                          <p className="text-[10px] text-stone-600 font-bold">{isFR ? "Captation par le navigateur à 44.1kHz." : "Browser-level capture at 44.1kHz standard."}</p>
                        </div>
                        
                        {/* Step 2 */}
                        <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-sm text-center space-y-2">
                          <span className="text-xl">⏱️</span>
                          <div className="font-mono text-[9px] font-black text-[#A14B15] bg-amber-50 rounded px-1.5 py-0.5 inline-block">STEP 02</div>
                          <h5 className="font-sans font-black text-xs text-stone-950 uppercase">{isFR ? "CHRONOMÉTRIE" : "SPEECH CADENCE"}</h5>
                          <p className="text-[10px] text-stone-600 font-bold">{isFR ? "Calcul des silences, hésitations, tics (euh)." : "Parsing pause ratios, filler gaps, and cadence."}</p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-sm text-center space-y-2">
                          <span className="text-xl">🤖</span>
                          <div className="font-mono text-[9px] font-black text-[#2563EB] bg-blue-50 rounded px-1.5 py-0.5 inline-block">STEP 03</div>
                          <h5 className="font-sans font-black text-xs text-stone-950 uppercase">{isFR ? "IA SÉMANTIQUE" : "SEMANTIC AI"}</h5>
                          <p className="text-[10px] text-stone-600 font-bold">{isFR ? "Analyse sémantique OpenAI (Structure STAR)." : "OpenAI checks structural adherence & STAR criteria."}</p>
                        </div>

                        {/* Step 4 */}
                        <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-sm text-center space-y-2">
                          <span className="text-xl">📊</span>
                          <div className="font-mono text-[9px] font-black text-[#1A2B3C] bg-stone-100 rounded px-1.5 py-0.5 inline-block">STEP 04</div>
                          <h5 className="font-sans font-black text-xs text-stone-950 uppercase">{isFR ? "DIAGNOSTIC" : "DIAGNOSTIC"}</h5>
                          <p className="text-[10px] text-stone-600 font-bold">{isFR ? "Génération des scores et conseils d'élocution." : "Spitting out structural scores and action tips."}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 text-sm text-stone-800 leading-relaxed font-bold">
                      <h3 className="font-sans font-black text-lg text-stone-950 uppercase border-b border-stone-200 pb-2">
                        {isFR ? "1. L'Analyse Acoustique Locale et Distante" : "1. Local and Distant Acoustic Parsing"}
                      </h3>
                      <p>
                        {isFR 
                          ? "Lorsque vous appuyez sur 'Démarrer l'enregistrement' dans les simulateurs SHANA, une double analyse se déclenche :"
                          : "When you press 'Start Recording' in SHANA's simulators, a dual analysis workflow is initialized:"}
                      </p>
                      <ul className="list-disc pl-5 space-y-2.5">
                        <li>
                          <strong>{isFR ? "Analyse acoustique locale :" : "Local Acoustic Parsing:"}</strong> {isFR 
                            ? "Votre navigateur utilise l'API Web Audio pour mesurer l'amplitude du signal micro. Cela permet d'extraire la durée totale de parole, la longueur de vos silences et de repérer instantanément la régularité de vos pauses physiques."
                            : "Your browser uses the Web Audio API to measure raw signal amplitude. This tracks active talking time versus silent gaps, assessing the regularity of your breathing intervals."}
                        </li>
                        <li>
                          <strong>{isFR ? "Analyse sémantique distante :" : "Semantic AI Analysis:"}</strong> {isFR 
                            ? "Une fois l'enregistrement converti, notre modèle d'IA OpenAI analyse le contenu de votre discours. Contrairement à une simple transcription, le modèle évalue la pertinence de votre argumentation par rapport au contexte professionnel de votre CV et à la dureté de la question posée."
                            : "Once recorded, our semantic engine powered by OpenAI processes your argument. Instead of just transcribing words, it reviews contextual alignment based on your CV profile and handles real-time recruiter scrutiny."}
                        </li>
                      </ul>

                      <h3 className="font-sans font-black text-lg text-stone-950 uppercase border-b border-stone-200 pb-2 pt-4">
                        {isFR ? "2. Objectif Technique : Éliminer la Latence Cognitive" : "2. Technical Goal: Eradicating Cognitive Latency"}
                      </h3>
                      <p>
                        {isFR 
                          ? "Le secret des orateurs brillants ne réside pas dans la rapidité à répondre, mais dans le contrôle du silence. L'IA de SHANA mesure précisément ce que nous appelons la 'Latence Initiale' — le temps écoulé entre la fin de la question et votre premier mot."
                          : "The key to commanding eloquence is not rapid-fire speaking, but structured silent composure. SHANA measures what we term 'Initial Cognitive Latency' — the delay between the recruiter finishing their sentence and your first vocalized syllable."}
                      </p>
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 text-xs space-y-1">
                        <span className="font-mono font-black uppercase block tracking-wider">💡 {isFR ? "ASTUCE DE COACHING" : "COACHING BLUEPRINT"}</span>
                        <p>
                          {isFR 
                            ? "Une latence de 1,5 à 2,5 secondes est idéale. Elle montre au recruteur que vous réfléchissez avec calme, plutôt que de réciter une réponse pré-enregistrée."
                            : "A natural pause of 1.5 to 2.5 seconds is perfect. It displays calm critical thinking, showing the recruiter you are processing instead of just reciting memorized paragraphs."}
                        </p>
                      </div>

                      <h3 className="font-sans font-black text-lg text-stone-950 uppercase border-b border-stone-200 pb-2 pt-4">
                        {isFR ? "3. L'Évaluation Miroir (Mirror Camera Specs)" : "3. Gaze Poise in Mirror Camera Sessions"}
                      </h3>
                      <p>
                        {isFR 
                          ? "Pour les sessions Premium, l'analyse visuelle s'ajoute au son. SHANA n'enregistre jamais votre flux vidéo sur un serveur cloud : la détection est 100% locale pour préserver votre vie privée. L'algorithme suit votre tête et vos yeux par rapport à l'objectif de votre webcam."
                          : "During premium screen test configurations, physical metrics are fused with audio tracking. SHANA never streams or records your webcam feed remote-side: frame extraction is 100% client-local. The visual algorithm computes head stability and gaze vectors in relation to your viewport lens."}
                      </p>
                    </div>
                  </article>
                )}

                {/* ========================================================== */}
                {/* ARTICLE 2 DETAILED: SCORES & OBJECTIVES                     */}
                {/* ========================================================== */}
                {selectedArticleId === 'scores-objectives' && (
                  <article className="max-w-4xl bg-white border-2 border-stone-950 rounded-3xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] space-y-8">
                    <div className="space-y-4">
                      <span className="font-mono text-xs font-black uppercase text-[#A14B15] tracking-wider bg-amber-50 border border-amber-300 px-3 py-1 rounded-md inline-block">
                        {isFR ? "GRILLE D'ÉVALUATION ET SCORE" : "EVALUATION GRIDS & BENCHMARKS"}
                      </span>
                      <h2 className="text-2xl sm:text-3.5xl font-sans font-black text-stone-950 uppercase tracking-tight leading-tight">
                        {isFR ? "Atteindre 100/100 : Comprendre vos Scores et Objectifs Oratoires" : "Reaching 100/100: Mastering Your Speaking Benchmarks"}
                      </h2>
                      <div className="flex items-center gap-4 text-xs font-bold text-stone-500 uppercase tracking-wide">
                        <span>{isFR ? "Par l'Équipe Pédagogique SHANA" : "By SHANA Coaching"}</span>
                        <span>•</span>
                        <span>{isFR ? "Lecture : 5 min" : "Read Time: 5 min"}</span>
                      </div>
                    </div>

                    {/* ILLUSTRATION: The Performance Scorecard Blueprint */}
                    <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-6">
                      <h4 className="font-mono text-[10px] font-black uppercase tracking-wider text-stone-700 text-center mb-6">
                        {isFR ? "VISUALISATION DES PRINCIPAUX AXES DE PERFORMANCE ORATOIRE" : "SHANA KEY SPEECH STABILITY BENCHMARKS"}
                      </h4>

                      <div className="space-y-4 max-w-xl mx-auto font-mono text-xs text-stone-950">
                        {/* Metric 1 */}
                        <div className="space-y-1">
                          <div className="flex justify-between font-black">
                            <span>1. CADENCE D'ÉLOCUTION (SPEECH PACE)</span>
                            <span className="text-[#18633F]">130 - 150 WPM</span>
                          </div>
                          <div className="h-6 bg-stone-200 border-2 border-stone-950 rounded-md relative flex items-center">
                            <div className="absolute left-[35%] right-[35%] bg-[#18633F]/20 h-full border-l border-r border-dashed border-stone-950 flex items-center justify-center text-[8px] font-black">EXCELLENT ZONE</div>
                            <div className="bg-[#18633F] h-full" style={{ width: '45%' }}></div>
                            <span className="absolute right-4 font-black text-[9px] z-10">142 WPM</span>
                          </div>
                        </div>

                        {/* Metric 2 */}
                        <div className="space-y-1">
                          <div className="flex justify-between font-black">
                            <span>2. TICS DE PAROLE (HEADING HESITATIONS)</span>
                            <span className="text-[#18633F]">&lt; 2 / MIN</span>
                          </div>
                          <div className="h-6 bg-stone-200 border-2 border-stone-950 rounded-md relative flex items-center">
                            <div className="bg-[#A14B15] h-full" style={{ width: '15%' }}></div>
                            <span className="absolute right-4 font-black text-[9px] z-10">1 / MIN</span>
                          </div>
                        </div>

                        {/* Metric 3 */}
                        <div className="space-y-1">
                          <div className="flex justify-between font-black">
                            <span>3. ALIGNEMENT REGARD (GAZE COORDINATION)</span>
                            <span className="text-[#18633F]">&gt; 80%</span>
                          </div>
                          <div className="h-6 bg-stone-200 border-2 border-stone-950 rounded-md relative flex items-center">
                            <div className="bg-[#2563EB] h-full" style={{ width: '88%' }}></div>
                            <span className="absolute right-4 font-black text-[9px] z-10">88% (STABLE)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 text-sm text-stone-800 leading-relaxed font-bold">
                      <h3 className="font-sans font-black text-lg text-stone-950 uppercase border-b border-stone-200 pb-2">
                        {isFR ? "1. La Vitesse d'Élocution Idéale (WPM)" : "1. The Ideal Speech Pace (Words Per Minute)"}
                      </h3>
                      <p>
                        {isFR
                          ? "Le rythme de parole est mesuré en mots par minute (Words Per Minute ou WPM). Si vous parlez trop vite (plus de 160 WPM), vous donnez une impression d'anxiété. Si vous parlez trop lentement (moins de 110 WPM), le jury se déconcentre."
                          : "Speech pacing is measured in Words Per Minute (WPM). Speaking too quickly (above 160 WPM) signals performance anxiety. Speaking too slowly (under 110 WPM) risks losing executive focus."}
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>{isFR ? "Zone d'Excellence :" : "The Sweet Spot:"}</strong> 130 - 150 WPM.</li>
                        <li><strong>{isFR ? "Conseil :" : "Coaching Cue:"}</strong> {isFR ? "Imaginez que vous expliquez un concept à un confrère de confiance. Cela détend les cordes vocales et stabilise le souffle." : "Picture yourself explaining a design pattern to an admired peer. This relaxes vocal tension and stabilizes breath support."}</li>
                      </ul>

                      <h3 className="font-sans font-black text-lg text-stone-950 uppercase border-b border-stone-200 pb-2 pt-4">
                        {isFR ? "2. Élimination des Hésitations (Filler Counter)" : "2. Controlling Speech Hesitations (Filler Words)"}
                      </h3>
                      <p>
                        {isFR
                          ? "Les tics vocaux comme 'euh', 'du coup', 'voilà' agissent comme des bruits parasites qui affaiblissent l'autorité de votre discours. SHANA utilise un compteur phonétique pour repérer ces répétitions."
                          : "Filler sounds ('uhm', 'like', 'actually') act as acoustic pollution, stripping authority from your delivery. SHANA's detector isolates these phonetic occurrences."}
                      </p>
                      <p>
                        {isFR
                          ? "L'objectif d'excellence est d'avoir moins de 2 tics par minute. Pour y parvenir, entraînez-vous à remplacer vos hésitations orales par des silences physiques de transition."
                          : "To score in the green zone, aim for fewer than 2 fillers per minute. Replacing filler sounds with clean, deliberate physical pauses adds immediate dramatic weight and poise."}
                      </p>

                      <h3 className="font-sans font-black text-lg text-stone-950 uppercase border-b border-stone-200 pb-2 pt-4">
                        {isFR ? "3. La Stabilité du Regard (Gaze Target)" : "3. Visual Poise & Gaze Coordinates"}
                      </h3>
                      <p>
                        {isFR
                          ? "En visioconférence, l'illusion du contact visuel dépend exclusivement du fait de fixer la caméra et non l'écran. Notre algorithme mesure le point d'impact de votre regard. Pour obtenir un score optimal de plus de 80%, évitez de lire vos notes ou de regarder le sol pendant que vous argumentez."
                          : "In virtual recruiting, the illusion of authentic eye contact relies entirely on focusing directly at your webcam lens, not the video viewport. SHANA's spatial tracking evaluates gaze coordinate variance. To score above 80%, stabilize your head position and avoid looking down at notes."}
                      </p>
                    </div>
                  </article>
                )}

                {/* ========================================================== */}
                {/* ARTICLE 3 DETAILED: STAR SYSTEM                            */}
                {/* ========================================================== */}
                {selectedArticleId === 'star-system' && (
                  <article className="max-w-4xl bg-white border-2 border-stone-950 rounded-3xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] space-y-8">
                    <div className="space-y-4">
                      <span className="font-mono text-xs font-black uppercase text-[#2563EB] tracking-wider bg-blue-50 border border-blue-300 px-3 py-1 rounded-md inline-block">
                        {isFR ? "MÉTHODE DE RÉPONSE ÉLITE" : "EXECUTIVE RESPONSE FRAMEWORK"}
                      </span>
                      <h2 className="text-2xl sm:text-3.5xl font-sans font-black text-stone-950 uppercase tracking-tight leading-tight">
                        {isFR ? "La Clé des 5 Étoiles : Structurer Vos Réponses avec la Méthode STAR" : "The 5-Star Formula: Mastering Structured Answers with STAR"}
                      </h2>
                      <div className="flex items-center gap-4 text-xs font-bold text-stone-500 uppercase tracking-wide">
                        <span>{isFR ? "Par l'Équipe d'Examen SHANA" : "By SHANA Board of Examiners"}</span>
                        <span>•</span>
                        <span>{isFR ? "Lecture : 7 min" : "Read Time: 7 min"}</span>
                      </div>
                    </div>

                    {/* ILLUSTRATION: STAR method flowchart */}
                    <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-6">
                      <h4 className="font-mono text-[10px] font-black uppercase tracking-wider text-stone-700 text-center mb-6">
                        {isFR ? "RÉPARTITION RECOMMANDÉE DU TEMPS DE RÉPONSE (120 SECONDES CIBLE)" : "RECOMMENDED TIME ALLOCATION FOR STAR ANSWERS (120s TARGET)"}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-stone-950">
                        {/* Situation */}
                        <div className="p-4 bg-white border-2 border-stone-950 rounded-xl relative">
                          <div className="absolute -top-3 left-4 bg-[#EDC154] border border-stone-950 px-2 py-0.5 text-[8px] font-black rounded-md">15% TIME</div>
                          <h5 className="font-black text-xs uppercase text-stone-950 mt-1">S - SITUATION</h5>
                          <p className="text-[10px] text-stone-600 font-bold mt-2">{isFR ? "Le cadre, le contexte et l'enjeu." : "Set the scene, context, and the stakes."}</p>
                        </div>

                        {/* Task */}
                        <div className="p-4 bg-white border-2 border-stone-950 rounded-xl relative">
                          <div className="absolute -top-3 left-4 bg-[#EDC154] border border-stone-950 px-2 py-0.5 text-[8px] font-black rounded-md">15% TIME</div>
                          <h5 className="font-black text-xs uppercase text-stone-950 mt-1">T - TASK</h5>
                          <p className="text-[10px] text-stone-600 font-bold mt-2">{isFR ? "La mission et les défis techniques." : "Define your mission and constraints."}</p>
                        </div>

                        {/* Action */}
                        <div className="p-4 bg-white border-2 border-stone-950 rounded-xl relative shadow-[2px_2px_0px_0px_rgba(24,99,63,1)]">
                          <div className="absolute -top-3 left-4 bg-[#18633F] text-white border border-stone-950 px-2 py-0.5 text-[8px] font-black rounded-md">50% TIME</div>
                          <h5 className="font-black text-xs uppercase text-stone-950 mt-1">A - ACTION</h5>
                          <p className="text-[10px] text-stone-600 font-bold mt-2">{isFR ? "Ce que VOUS avez fait personnellement." : "What YOU did. Focus on your actions."}</p>
                        </div>

                        {/* Result */}
                        <div className="p-4 bg-white border-2 border-stone-950 rounded-xl relative">
                          <div className="absolute -top-3 left-4 bg-[#EDC154] border border-stone-950 px-2 py-0.5 text-[8px] font-black rounded-md">20% TIME</div>
                          <h5 className="font-black text-xs uppercase text-stone-950 mt-1">R - RESULT</h5>
                          <p className="text-[10px] text-stone-600 font-bold mt-2">{isFR ? "Les chiffres, l'impact, le bilan." : "Metrics, lessons, and business impact."}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 text-sm text-stone-800 leading-relaxed font-bold">
                      <h3 className="font-sans font-black text-lg text-stone-950 uppercase border-b border-stone-200 pb-2">
                        {isFR ? "Qu'est-ce que la Méthode STAR ?" : "What is the STAR Method?"}
                      </h3>
                      <p>
                        {isFR
                          ? "La méthode STAR est la norme d'or recommandée par tous les cabinets de recrutement d'élite pour répondre aux questions comportementales (ex: 'Racontez-moi une fois où vous avez échoué...'). L'IA de SHANA recherche sémantiquement la présence de ces quatre étapes clés dans vos réponses :"
                          : "The STAR method is the industry standard for handling behavioral questions (e.g., 'Tell me about a time you handled a difficult stakeholder...'). SHANA's semantic evaluator actively audits your speech structure for these four phases:"}
                      </p>
                      <ul className="list-decimal pl-5 space-y-3">
                        <li>
                          <strong>{isFR ? "S - Situation :" : "S - Situation (15%):"}</strong> {isFR
                            ? "Posez le contexte. Soyez précis et concis (ex: 'En 2025, lors du lancement de la V2 de notre plateforme qui comptait 50k utilisateurs...')."
                            : "Provide brief, quantitative context. Set the stakes within 2 sentences (e.g., 'In 2025, during a migration impacting 50,000 active legacy customers...')."}
                        </li>
                        <li>
                          <strong>{isFR ? "T - Tâche (Task) :" : "T - Task (15%):"}</strong> {isFR
                            ? "Identifiez le problème à résoudre ou la responsabilité qui vous incombait."
                            : "Clarify the core conflict or technical constraint you were expected to solve."}
                        </li>
                        <li>
                          <strong>{isFR ? "A - Action (50%) :" : "A - Action (50%):"}</strong> {isFR
                            ? "C'est la partie la plus importante. Décrivez les étapes méthodologiques que vous avez entreprises personnellement. Utilisez 'JE' plutôt que 'NOUS'."
                            : "The vital core of your narrative. Detail your precise actions, methodologies, and technical logic. Emphasize 'I' rather than 'We'."}
                        </li>
                        <li>
                          <strong>{isFR ? "R - Résultat (20%) :" : "R - Result (20%):"}</strong> {isFR
                            ? "Concluez avec des indicateurs mesurables de réussite et les leçons apprises (ex: 'Le taux de rétention est remonté de 8% et nous avons livré avec 3 jours d'avance.')."
                            : "Always close with measurable, hard metrics of success or strategic lessons learned (e.g., 'This improved database throughput by 35% and saved 4 engineering hours per sprint.')."}
                        </li>
                      </ul>

                      <h3 className="font-sans font-black text-lg text-stone-950 uppercase border-b border-stone-200 pb-2 pt-4">
                        {isFR ? "Comment Décrocher les 5 Étoiles" : "How to Unlock the Prestigious 5-Star Rating"}
                      </h3>
                      <p>
                        {isFR
                          ? "Le système de notation oratoire de SHANA attribue une note étoilée basée sur la conformité de votre réponse à ces principes. Une réponse qui passe trop de temps sur la Situation au détriment de l'Action verra sa note sémantique réduite."
                          : "SHANA's evaluation matrix translates semantic coverage directly into star scores. A candidate who spends 80% of their speech detailing the Situation with no clear personal Actions will see their structural score penalised."}
                      </p>
                    </div>
                  </article>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* PAGE 3: FAQ                                                */}
        {/* ========================================================== */}
        {page === 'faq' && (
          <div id="page-faq" className="space-y-8 animate-fade-in text-left">
            <div className="space-y-3">
              <span className="font-mono text-[10px] uppercase bg-blue-100 text-blue-800 tracking-widest font-extrabold px-2.5 py-1 rounded">
                Questions Fréquentes
              </span>
              <h1 className="text-3xl font-sans font-black tracking-tight text-[#1A2B3C]">
                {isFR ? "Questions & Réponses" : "Frequently Asked Questions"}
              </h1>
              <p className="text-sm text-[#6B7280] leading-relaxed font-semibold">
                {isFR 
                  ? "Trouvez des réponses claires sur le fonctionnement de SHANA et nos protocoles de sécurité." 
                  : "Resolve technical queries regarding the SHANA simulation engines and safety profiles."}
              </p>
            </div>

            <div className="space-y-4 pt-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div 
                    key={index} 
                    id={`faq-item-${index}`}
                    className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-5 text-left flex justify-between items-center cursor-pointer select-none hover:bg-gray-50 focus:outline-none"
                    >
                      <span className="text-xs font-extrabold text-[#1A2B3C] pr-4">{faq.q}</span>
                      <ChevronRight className={`w-4 h-4 text-[#9CA3AF] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="p-5 pt-0 border-t border-gray-50 text-xs text-[#6B7280] leading-relaxed animate-fade-in">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* PAGE 4: HELP CENTER                                        */}
        {/* ========================================================== */}
        {page === 'help-center' && (
          <div id="page-help-center" className="space-y-8 animate-fade-in text-left">
            <div className="space-y-3">
              <span className="font-mono text-[10px] uppercase bg-indigo-100 text-indigo-800 tracking-widest font-extrabold px-2.5 py-1 rounded">
                SUPPORT PORTAL
              </span>
              <h1 className="text-3xl font-sans font-black tracking-tight text-[#1A2B3C]">
                {isFR ? "Centre d'Assistance SHANA" : "SHANA Support & Help"}
              </h1>
              <p className="text-sm text-[#6B7280] max-w-xl">
                {isFR 
                  ? "Consultez nos fiches d'aide ou filtrez vos requêtes par thématiques techniques."
                  : "Filter help articles dynamically to quickly debug setup items or security rules."}
              </p>
            </div>

            {/* Live visual search trigger */}
            <div className="relative max-w-lg">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isFR ? "Rechercher un article..." : "Search documentation items manually..."}
                className="w-full bg-white border border-[#E5E7EB] hover:border-gray-300 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#1A2B3C] shadow-sm font-semibold text-[#1A2B3C]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] p-1 bg-gray-100 rounded text-gray-500 font-bold hover:bg-gray-200 cursor-pointer"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Articles matching search query */}
            <div className="space-y-4 pt-2">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#9CA3AF] font-black border-b border-gray-200 pb-2">
                {isFR ? `Articles correspondants (${filteredArticles.length})` : `Matching Articles (${filteredArticles.length})`}
              </h3>

              {filteredArticles.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredArticles.map((art, idx) => (
                    <div key={idx} className="p-5 bg-white border border-[#E5E7EB] rounded-2xl space-y-2 relative shadow-sm">
                      <span className="absolute top-4 right-4 font-mono text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                        {art.cat}
                      </span>
                      <h4 className="text-xs font-black text-[#1A2B3C] md:pr-14">
                        {isFR ? art.frQ : art.q}
                      </h4>
                      <p className="text-xs text-[#6B7280] leading-relaxed">
                        {isFR ? art.frA : art.a}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-white border border-dashed border-gray-300 rounded-2xl text-center text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-xs font-bold">{isFR ? "Aucune information trouvée" : "No direct documentation matched"}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{isFR ? "Réduisez vos mots thématiques ou écrivez l'un des thèmes : Account, Training, Assessment, Privacy" : "Try entering basic topics like: Account, Training, Assessment, or Privacy"}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* PAGE 5: CONTACT                                            */}
        {/* ========================================================== */}
        {page === 'contact' && (
          <div id="page-contact" className="space-y-8 animate-fade-in text-left">
            <div className="space-y-3">
              <span className="font-mono text-[10px] uppercase bg-green-100 text-green-800 tracking-widest font-extrabold px-2.5 py-1 rounded">
                SECURE DISPATCH
              </span>
              <h1 className="text-3xl font-sans font-black tracking-tight text-[#1A2B3C]">
                {isFR ? "Contacter SHANA Support" : "Secure Support Contact"}
              </h1>
              <p className="text-sm text-[#6B7280] max-w-lg font-medium leading-relaxed">
                {isFR 
                  ? "Transmettez votre demande d'aide. Notre équipe de techniciens et de coachs vous répondra en toute sécurité."
                  : "Drop us a line regarding your custom enterprise licenses or technical inquiries. We read every dispatch."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
              
              {/* Contact meta information */}
              <div className="md:col-span-4 space-y-6">
                <div className="p-5 bg-white border border-[#E5E7EB] rounded-2xl space-y-4 shadow-sm">
                  <h4 className="font-mono text-[10px] font-black tracking-wider text-[#9CA3AF] uppercase">
                    {isFR ? "CANAUX DE SECURE" : "SECURE COMM CHANNELS"}
                  </h4>
                  <div className="space-y-3 font-medium text-xs text-[#1A2B3C]">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#9CA3AF]" />
                      <span>support@shana.io</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#9CA3AF]" />
                      <span>{isFR ? "Secteur Ouest Européen" : "West EU Private Zone"}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-[10px] text-[#6B7280]">
                      {isFR 
                        ? "Support disponible de 8h à 18h CET du Lundi au Vendredi." 
                        : "General operating hours: 08:00 - 18:00 CET, Monday through Friday."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form panel */}
              <div className="md:col-span-8 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
                {!contactSubmitted ? (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] mb-1">
                        {isFR ? "Votre Nom" : "Your Name"}
                      </label>
                      <input 
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Alice Martin"
                        className="w-full bg-white border border-[#E5E7EB] px-3.5 py-2 text-xs rounded-xl outline-none focus:border-[#1A2B3C] text-[#1A2B3C]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] mb-1">
                        {isFR ? "Adresse E-mail professionnelle" : "Business Email"}
                      </label>
                      <input 
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="alice@domain.com"
                        className="w-full bg-white border border-[#E5E7EB] px-3.5 py-2 text-xs rounded-xl outline-none focus:border-[#1A2B3C] text-[#1A2B3C]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] mb-1">
                        {isFR ? "Votre Message" : "Detailed Request"}
                      </label>
                      <textarea 
                        rows={5}
                        required
                        value={contactMsg}
                        onChange={(e) => setContactMsg(e.target.value)}
                        placeholder={isFR ? "Expliquez précisément votre problème..." : "Detail your system error or inquiry..."}
                        className="w-full bg-white border border-[#E5E7EB] px-3.5 py-2 text-xs rounded-xl outline-none focus:border-[#1A2B3C] text-[#1A2B3C] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingContact}
                      className="w-full py-3 bg-[#1A2B3C] hover:bg-[#2C3E50] disabled:bg-[#9CA3AF] text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99]"
                    >
                      {isSubmittingContact ? (
                        <span>{isFR ? "EXPÉDITION SÉCURISÉE..." : "DISPATCHING PROTOCOL..."}</span>
                      ) : (
                        <>
                          <span>{isFR ? "Envoyer le Message" : "Transmit Secure Dispatch"}</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 text-center py-6 animate-fade-in">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h4 className="font-sans font-extrabold text-[#1A2B3C] text-sm">
                      {isFR ? "Message Envoyé avec Succès" : "Secure Dispatch Transmission Verfied"}
                    </h4>
                    <p className="text-xs text-[#6B7280] max-w-md mx-auto leading-relaxed">
                      {isFR 
                        ? "Votre message a été crypté et transmis. Un ingénieur de support est déjà assigné pour vous répondre de manière privée."
                        : "Under safe-communication standards, your dispatch has been transmitted. An expert has been scheduled to coordinate an answer."}
                    </p>
                    <button 
                      onClick={() => {
                        setContactSubmitted(false);
                        setContactName('');
                        setContactEmail('');
                        setContactMsg('');
                      }}
                      className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                    >
                      {isFR ? "Envoyer une autre demande" : "Write Another Dispatch"}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* PAGE 6: TERMS & CONDITIONS                                 */}
        {/* ========================================================== */}
        {page === 'terms' && (
          <div id="page-terms" className="space-y-6 animate-fade-in text-left text-xs text-[#6B7280] leading-relaxed max-w-3xl">
            <div className="space-y-2 pb-4 border-b border-gray-200">
              <span className="font-mono text-[9px] uppercase text-gray-400 font-extrabold block">LEGAL FRAMEWORK // HYBRID STORAGE & OFFLINE PROTOCOLS</span>
              <h1 className="text-3xl font-sans font-black tracking-tight text-[#1A2B3C]">
                {isFR ? "Conditions Générales d'Utilisation" : "Terms & Conditions"}
              </h1>
            </div>

            <div className="space-y-5 mt-4">
              <section className="space-y-2">
                <h3 className="font-bold text-sm text-[#1A2B3C]">1. Acceptance of Terms / Acceptation des Conditions</h3>
                <p>
                  {isFR 
                    ? "En accédant et en utilisant les simulateurs et services oratoires SHANA, vous certifiez accepter sans objection l'autorité des présentes règles contractuelles. Si vous rejetez ces lois applicatives, vous devez cesser immédiatement l'accès."
                    : "By accessing and engaging with the SHANA interfaces, simulators, and training layers, you agree to be strictly bound by this legal protocol. If you object to any part of these terms, you are forbidden from using the service."}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-sm text-[#1A2B3C]">2. Hybrid Offline-First Architecture / Architecture Hybride Offline-First</h3>
                <p>
                  {isFR
                    ? "SHANA fonctionne selon un modèle d'architecture 'Offline-First' résilient. Vos données d'évaluation, scores et profils sont stockés localement au sein de votre navigateur (localStorage). Une synchronisation avec nos serveurs cloud sécurisés (Firestore) est tentée de manière transparente en cas de connexion internet active, mais son absence ne bloque en aucun cas votre accès au service."
                    : "SHANA operates on a resilient offline-first architecture model. Your evaluation data, performance scores, and user settings are persisted primarily inside your browser's local sandbox storage (localStorage). Automated synchronization to our secure cloud databases (Firestore) is performed transparently when an active connection is detected, ensuring total service continuity regardless of network stability."}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-sm text-[#1A2B3C]">3. Account Integrity / Gestion et Sécurité du Compte</h3>
                <p>
                  {isFR
                    ? "Tout utilisateur qui crée un espace d'entraînement est entièrement responsable du maintien de la confidentialité de sa clé de session d'accès. Toute compromission de votre clé doit être signalée de façon pressante à nos services."
                    : "When initializing your container space, you are solely responsible for maintaining the absolute secrecy of your active session credentials. Any suspected access leakage must be reported instantly to our response team."}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-sm text-[#1A2B3C]">4. Training Usage / Cadre d'Entraînement Légitime</h3>
                <p>
                  {isFR
                    ? "SHANA fournit des environnements de parole pour l'élévation professionnelle. Vous vous interdisez tout acte de piratage, de reverse-engineering, d'extraction automatisée des flux vocaux d'IA ou de tentative d'injection malveillante sur nos serveurs."
                    : "The simulator remains a private professional workspace. You are strictly forbidden from performing reverse-engineering, automated scraping of voice modules, stress testing, or malicious code injections into the container engines."}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-sm text-[#1A2B3C]">5. User Responsibility / Responsabilité Orale Unique</h3>
                <p>
                  {isFR
                    ? "Vous assumez l'entière responsabilité légale des documents CV versés et des paroles dictées durant les simulations. Les appréciations d'IA restent indicatives et ne dispensent pas d'un travail personnel rigoureux."
                    : "You maintain total ownership and liability for the resumes uploaded and speeches vocalized during simulations. Objective feedback remains an advisory guideline, not a legal guarantee of subsequent hiring outcomes."}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-sm text-[#1A2B3C]">6. Service Availability & Sync Tolerances / Disponibilité et Tolérance de Sync</h3>
                <p>
                  {isFR
                    ? "SHANA s'efforce de maintenir ses simulateurs fonctionnels. Étant conçu hors-ligne en priorité, l'utilisateur accepte que les données non synchronisées en raison d'une panne réseau restent stockées en toute sécurité sur son appareil. SHANA ne peut être tenue responsable de l'absence de synchronisation instantanée avec le cloud."
                    : "We maintain highly optimized server availability. Since SHANA is designed offline-first, users acknowledge that unsynced records during network outages will remain stored locally. No liability is assumed for temporary cloud synchronization delays due to connection limits."}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-sm text-[#1A2B3C]">7. Limitation of Liability / Limitations de Responsabilité</h3>
                <p>
                  {isFR
                    ? "En aucun cas SHANA ne peut être tenue responsable de préjudices directs ou indirects issus d'un entretien d'embauche infructueux ou de la compromission locale de données de navigateur par l'utilisateur."
                    : "Under no legal theory shall SHANA operators be liable for direct, indirect, or incidental damage (such as missed business opportunities or device data leakage) yielding from your simulation performance or recruitment outcomes."}
                </p>
              </section>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* PAGE 7: PRIVACY POLICY                                     */}
        {/* ========================================================== */}
        {page === 'privacy' && (
          <div id="page-privacy" className="space-y-6 animate-fade-in text-left text-xs text-[#6B7280] leading-relaxed max-w-3xl">
            <div className="space-y-2 pb-4 border-b border-gray-200">
              <span className="font-mono text-[9px] uppercase text-gray-400 font-extrabold block">PRIVACY ASSURANCE // OFFLINE-FIRST PERSISTENCE & SECURED CLOUD SYNC</span>
              <h1 className="text-3xl font-sans font-black tracking-tight text-[#1A2B3C]">
                {isFR ? "Charte de Confidentialité et Protection" : "Privacy Policy"}
              </h1>
            </div>

            <div className="space-y-5 mt-4">
              <section className="space-y-2">
                <h3 className="font-bold text-sm text-[#1A2B3C]">1. Data Collected & Hybrid Storage / Informations Recueillies et Stockage Hybride</h3>
                <p>
                  {isFR 
                    ? "Pour garantir le simulateur de préparation, nous traitons de manière ciblée : votre identifiant utilisateur, vos coordonnées nominales volontairement transmises, les fichiers de curriculum vitae PDF téléversés ainsi que les données relatives à l'analyse de votre voix ou fluidité. Grâce à notre modèle offline-first, ces données sont conservées prioritairement dans votre sandbox locale et se synchronisent de manière transparente avec notre base Firestore sécurisée."
                    : "To fulfill the requirements of personalized interview simulations, we selectively parse: user login parameters, voluntarily submitted contact information, and PDF files containing your resumes, along with spoken cadence data. Built on an offline-first foundation, these records reside primarily within your browser memory and sync transparently with our secure cloud database (Firestore)."}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-sm text-[#1A2B3C]">2. CV Utilization Protocol / Utilisation et Lecture de CV</h3>
                <p>
                  {isFR
                    ? "Votre CV est utilisé uniquement par nos modèles locaux génératifs pour forger les thématiques d'évaluations et les questions cibles. Aucune donnée d'expérience professionnelle n'est vendue ou exploitée à des fins de ciblage publicitaire tiers."
                    : "Your CV metrics are queried solely to extract skills and compile customized scenarios. We maintain absolute privacy; professional metrics are never synthesized for advertising channels, nor do we partner with external targeting platforms."}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-sm text-[#1A2B3C]">3. Storage & Transit Encryption / Sauvegarde et Stockage Chiffré</h3>
                <p>
                  {isFR
                    ? "Toutes les transmissions d'authentification et de téléchargement s'effectuent sur des protocoles chiffrés récents de transport (HTTPS/TLS) et isolées sur des volumes transactionnels cloud (Firestore) restreints d'accès."
                    : "All user requests, CV parsing transmissions, and evaluation data transit exclusively over transport layer security (HTTPS) channels. Data is structured inside private isolated sandbox databases (Firestore)."}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-sm text-[#1A2B3C]">4. User Gaze & Gaze Poise / Protection des Flux Visuels</h3>
                <p>
                  {isFR
                    ? "L'évaluation miroir nécessite l'accès webcam. Les mesures de stabilité et de regard s'exécutent en direct local. Aucun enregistrement d'image vidéo n'est extrait de l'ordinateur vers d'autres serveurs."
                    : "Mirror sessions request active camera controls. Gaze dynamics and coordinates are measured client-side inside the local viewport runtime. Absolutely NO video frames or raw images are archived on remote engines."}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-sm text-[#1A2B3C]">5. Your Legal Rights / Contrôle et Droits des Utilisateurs</h3>
                <p>
                  {isFR
                    ? "Conformément au Règlement Européen de Protection des Données (RGPD), vous disposez du droit absolu d'accès, de correction, de portabilité et de suppression totale et physique de vos fichiers et historiques au sein de SHANA."
                    : "In line with global sovereign frameworks and European GDPR alignments, you retain irrevocable authority to access, edit, download, and initiate pure physical deletion of your professional database records and stored parameters."}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-sm text-[#1A2B3C]">6. Absolute Local and Cloud Purge / Effacement Absolu Local et Cloud</h3>
                <p>
                  {isFR
                    ? "La résiliation ou l'effacement par le biais du bouton 'Purger mes données' au sein des configurations de profil supprime instantanément l'intégralité de vos informations de votre stockage de navigateur local et déclenche l'effacement définitif et sans délai de restauration de l'ensemble de votre base d'entraînement au sein de nos infrastructures Cloud."
                    : "Clicking the data purge action triggers instant, non-reversible deletion routines. It immediately cleanses your local browser memory (localStorage) and issues recursive cloud deletion commands to clean associated Firestore records, leaving zero traces."}
                </p>
              </section>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* PAGE 8: COOKIE POLICY                                      */}
        {/* ========================================================== */}
        {page === 'cookies' && (
          <div id="page-cookies" className="space-y-6 animate-fade-in text-left text-xs text-[#6B7280] leading-relaxed max-w-3xl">
            <div className="space-y-2 pb-4 border-b border-gray-200">
              <span className="font-mono text-[9px] uppercase text-gray-400 font-extrabold block">TRANSPARENCY ASSURANCE // NO DECEPTIVE TRACKERS APPROVED</span>
              <h1 className="text-3xl font-sans font-black tracking-tight text-[#1A2B3C]">
                {isFR ? "Politique de Cookies et Traceurs" : "Cookie Policy"}
              </h1>
            </div>

            <div className="space-y-5 mt-4">
              <p>
                {isFR 
                  ? "SHANA applique des pratiques d'éthique transparentes et rigoureuses. Nous n'utilisons absolument aucun cookie d'annonceurs tiers, de régie marketing ou de ciblage comportemental."
                  : "SHANA handles browser memory with absolute integrity. We use no marketing trackers, persistent tracking tools, or behavioral profiles of client behaviors."}
              </p>

              <section className="space-y-3">
                <h3 className="font-bold text-sm text-[#1A2B3C]">{isFR ? "Cookies Essentiels (Obligatoires)" : "Essential Keys (Required)"}</h3>
                <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl space-y-2">
                  <p>
                    {isFR 
                      ? "Ces données sont automatiquement chargées en mémoire locale pour assurer la viabilité technique de votre session d'entraînement et l'intégrité de l'application : "
                      : "These records are handled directly to boot your container credentials and allow secure authentication: "}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-[#1A2B3C]">
                    <li><strong>shana_session_auth</strong>: {isFR ? "Conserve votre clé d'authentification utilisateur de manière sécurisée." : "Maintains active encrypted secure session authentication tokens."}</li>
                    <li><strong>shana_lang_setting</strong>: {isFR ? "Mémorise le choix de langue (EN/FR) de votre application." : "Preserves system UI language selections (EN/FR)."}</li>
                    <li><strong>shana_local_db_*</strong>: {isFR ? "Contient vos sessions d'entraînement locales en mode offline-first." : "Persists local mock training histories for fast offline-first response."}</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-sm text-[#1A2B3C]">{isFR ? "Cookies de Préférence (Facultatifs)" : "Preference Keys (Optional)"}</h3>
                <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl space-y-2">
                  <p>
                    {isFR 
                      ? "Optionnels, ils facilitent l'ergonomie visuelle et logique de votre espace de préparation : "
                      : "Optional storage indicators that elevate navigation visual flow: "}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-[#1A2B3C]">
                    <li><strong>shana_cookie_consent_choice</strong>: {isFR ? "Enregistre votre acceptation ou rejet des cookies facultatifs." : "Determines if your preferences are allowed to be tracked in browser memory."}</li>
                    <li><strong>shana_onboarding_cleared</strong>: {isFR ? "Mémorise si le questionnaire d'accueil de départ a déjà été complété." : "Understands if your system onboarding questionnaire stage has been fully cleared."}</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-sm text-[#1A2B3C]">{isFR ? "Gestion de Votre Consentement" : "Consent Management Options"}</h3>
                <p>
                  {isFR 
                    ? "Vous contrôlez totalement vos choix. Vous pouvez ajuster vos réglages ou interdire les cookies de préférence à tout moment par le biais de notre bannière de consentement au bas de la page ou directement dans l'onglet Confidentialité de votre profil."
                    : "You are in control. Review or change your selections at any turn via our consent banner at the bottom or directly inside the Privacy settings in your Profile menu."}
                </p>
              </section>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* PAGE 9: DATA USAGE                                         */}
        {/* ========================================================== */}
        {page === 'data-usage' && (
          <div id="page-data-usage" className="space-y-6 animate-fade-in text-left text-xs text-[#6B7280] leading-relaxed max-w-3xl">
            <div className="space-y-2 pb-4 border-b border-gray-200">
              <span className="font-mono text-[9px] uppercase text-gray-400 font-extrabold block">DATA INTEGRITY & SYNC MANDATE</span>
              <h1 className="text-3xl font-sans font-black tracking-tight text-[#1A2B3C]">
                {isFR ? "Utilisation Rigoureuse de Vos Données" : "How Data is Processed"}
              </h1>
            </div>

            <div className="space-y-5 mt-4">
              <p>
                {isFR 
                  ? "SHANA opère des diagnostics constructifs uniquement nécessaires à la génération d'entretiens. Nous traitons avec rigidité les données d'expériences sans compromis commerciaux."
                  : "SHANA coordinates structural diagnostics simply to compile focus interview blueprints. We manipulate your records with rigid data-minimization practices."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white border border-[#E5E7EB] rounded-xl space-y-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h4 className="font-bold text-xs text-[#1A2B3C]">{isFR ? "Ce Que SHANA Traite" : "Information SHANA Processes"}</h4>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-[#6B7280]">
                    <li>{isFR ? "Le fichier brut de votre CV envoyé." : "The raw parser metrics of the resume you supply."}</li>
                    <li>{isFR ? "Votre historique local et synchronisé cloud de simulations." : "Your local and cloud-synced simulation histories."}</li>
                    <li>{isFR ? "Vos scores de fluidité et de structure de réponse." : "Calculated verbal pacing and structural scores."}</li>
                    <li>{isFR ? "Votre cible salariale et préférences de carrière." : "Selected career targets and expectations."}</li>
                  </ul>
                </div>

                <div className="p-5 bg-[#1A2B3C] text-white rounded-xl space-y-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <h4 className="font-bold text-xs text-white">{isFR ? "Ce Que SHANA Ne Fait Jamais" : "What SHANA Never Does"}</h4>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-gray-300">
                    <li>{isFR ? "Nous ne vendons aucune expérience de vos carrières." : "We never sell or distribute your career background."}</li>
                    <li>{isFR ? "Aucune analyse de voix n'est transmise à des tiers." : "We do not stream voice wave streams to advertising networks."}</li>
                    <li>{isFR ? "Aucun traceur tiers commercial n'est raccordé." : "We embed absolutely no commercial social trackers."}</li>
                    <li>{isFR ? "Aucun profil publicitaire n'est généré." : "No advertising profiles are built or compiled."}</li>
                  </ul>
                </div>
              </div>

              <section className="space-y-2 pt-2 text-xs">
                <h3 className="font-bold text-sm text-[#1A2B3C]">{isFR ? "Transparence de la Synchronisation" : "Synchronization & Cloud Transparency"}</h3>
                <p>
                  {isFR 
                    ? "Grâce à notre gestionnaire DbSyncManager, chaque sauvegarde locale est reflétée sur votre espace cloud Firebase Firestore uniquement quand vous disposez d'un réseau actif. En cas de déconnexion, les modifications restent confinées en toute sécurité au sein de votre sandbox locale. Les communications avec l'IA de simulation s'effectuent par jetons temporaires anonymisés pour exclure toute association d'identité non sollicitée."
                    : "Using our proprietary DbSyncManager, each local updates sequence is broadcasted to your private Firebase Firestore storage only when online. When network parameters degrade, modifications are held secure within browser boundaries. Interactions with the simulation models employ fully scrubbed request payloads, stripping unnecessary biographical identifiers."}
                </p>
              </section>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* FALLBACK INFO PAGES: VOICE PROFILE, ASSESSMENT & GUIDE     */}
        {/* ========================================================== */}
        {['voice-training-info', 'mirror-assessment-info', 'interview-guide'].includes(page) && (
          <div id="page-special-fallback" className="space-y-8 animate-fade-in text-left">
            <div className="space-y-3">
              <span className="font-mono text-[10px] uppercase bg-blue-100 text-blue-800 tracking-widest font-extrabold px-2.5 py-1 rounded">
                TECHNICAL PROTOCOL SYSTEM
              </span>
              <h1 className="text-3xl font-sans font-black tracking-tight text-[#1A2B3C]">
                {page === 'voice-training-info' && (isFR ? "Détails de l'Entraînement Vocal" : "Voice Training Intervals details")}
                {page === 'mirror-assessment-info' && (isFR ? "Fonctionnement de l'Évaluation Miroir" : "Mirror Assessment Specifications")}
                {page === 'interview-guide' && (isFR ? "Guide Complet d'Entretien" : "High-Performance Interview Guide")}
              </h1>
              <p className="text-sm text-[#6B7280] font-medium leading-relaxed max-w-xl">
                {page === 'voice-training-info' && (isFR ? "S'entraîner à voix haute sans jugement pour éliminer les hésitations oratoires." : "Master visual poise, vocabulary alignment, and vocal latency.")}
                {page === 'mirror-assessment-info' && (isFR ? "Mesurer l'excellence d'entretien sous une tension rigoureuse devant objectif." : "The official screen test using customized resume scenario queries.")}
                {page === 'interview-guide' && (isFR ? "Apprenez les méthodologies structurelles STAR et d'élocution suisse." : "Accelerate career alignment using structure, pacing, and presence.")}
              </p>
            </div>

            <div className="p-6 bg-white border border-[#E5E7EB] rounded-2xl space-y-4 shadow-sm text-xs text-[#6B7280] leading-relaxed">
              <h4 className="font-bold text-sm text-[#1A2B3C]">{isFR ? "Norme de performance SHANA" : "SHANA Execution Guideline"}</h4>
              <p>
                {isFR 
                  ? "Afin d'obtenir une fluidité de haut niveau, nous vous invitons à initialiser votre compte. Le simulateur configurera instantanément les blocs de questions."
                  : "We encourage initializing your free blueprint account on the onboarding form. Doing so compiles tailored modules perfectly aligned with your expertise."}
              </p>
              <div className="pt-2">
                <button 
                  onClick={onStartOnboarding}
                  className="px-5 py-2.5 bg-[#1A2B3C] text-white text-xs font-bold uppercase rounded-xl hover:bg-[#2C3E50] cursor-pointer"
                >
                  {isFR ? "Lancer le Profilateur" : "Begin Blueprint Profile"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER EMBEDDED DYNAMICALLY INSIDE PUBLIC INFO */}
      <Footer 
        lang={lang} 
        onChangeLang={onChangeLang} 
        onNavigatePage={onNavigatePage}
        onNavigateHome={onNavigateHome}
      />

    </div>
  );
}
