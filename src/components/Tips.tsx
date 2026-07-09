import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, CheckCircle2, HelpCircle, Info } from 'lucide-react';
import { useToast } from './Toast';

interface TipsProps {
  targetRole: string;
  lang: 'EN' | 'FR';
  onToggleChanged?: (enabled: boolean) => void;
  inlineDisplayOnly?: boolean; // If true, only render the tips and omit the main card border for usage in simulation
}

interface TipItem {
  title: string;
  desc: string;
}

export default function Tips({ targetRole, lang, onToggleChanged, inlineDisplayOnly = false }: TipsProps) {
  const { addToast } = useToast();
  const [tipsEnabled, setTipsEnabled] = useState(() => {
    return localStorage.getItem('shana_tips_enabled_for_training') === 'true';
  });

  const handleToggle = () => {
    const newValue = !tipsEnabled;
    setTipsEnabled(newValue);
    localStorage.setItem('shana_tips_enabled_for_training', String(newValue));
    
    if (onToggleChanged) {
      onToggleChanged(newValue);
    }

    addToast({
      title: lang === 'EN' ? "Contextual Tips Updated" : "Conseils Contextuels Mis à Jour",
      description: newValue 
        ? (lang === 'EN' 
            ? "Contextual advice will overlay on active training sessions (hidden on assessments)." 
            : "Les conseils s'afficheront en surcouche lors des entraînements (masqués lors des évaluations).")
        : (lang === 'EN'
            ? "Tips overlay disabled for all training sessions."
            : "Conseils désactivés pour toutes les sessions d'entraînement."),
      type: 'info'
    });

    // Fire custom event to notify active views
    window.dispatchEvent(new Event('shana_tips_config_updated'));
  };

  // Extract contextual tips based on the target role
  const getContextualTips = (): { category: string; list: TipItem[] } => {
    const roleLower = (targetRole || '').toLowerCase();
    
    if (roleLower.includes('software') || roleLower.includes('engineer') || roleLower.includes('developer') || roleLower.includes('tech') || roleLower.includes('architect')) {
      return {
        category: lang === 'EN' ? "Software Engineering & Technology" : "Ingénierie Logicielle & Technologie",
        list: [
          {
            title: lang === 'EN' ? "Deconstruct Systems with Trade-offs" : "Décomposez les architectures et compromis",
            desc: lang === 'EN' 
              ? "Avoid single-track answers. Explicitly contrast monoliths vs. microservices, SQL vs. NoSQL, or speed vs. maintainability."
              : "Évitez les réponses à sens unique. Comparez les avantages et inconvénients des solutions (ex: SQL vs NoSQL, monolithique vs microservices)."
          },
          {
            title: lang === 'EN' ? "Own Your Code Contributions (STAR)" : "Valorisez votre contribution personnelle (méthode STAR)",
            desc: lang === 'EN'
              ? "Focus on your individual technical impact. Explain the specific algorithms, structural choices, or debug patterns you owned rather than general team efforts."
              : "Insistez sur votre impact individuel. Décrivez l'algorithme, le choix technique ou la résolution de bug dont vous étiez responsable plutôt que de dire 'nous'."
          },
          {
            title: lang === 'EN' ? "Translate Complex Jargon to Business Outcomes" : "Traduisez la technique en valeur business",
            desc: lang === 'EN'
              ? "Ground your technical stories in real business metrics (e.g., latency cuts, cloud cost reductions, or team shipping velocity improvements)."
              : "Reliez toujours les optimisations de code à des gains concrets pour l'entreprise (ex : réduction des coûts d'infrastructure, temps de chargement divisé par deux)."
          }
        ]
      };
    }

    if (roleLower.includes('product') || roleLower.includes('pm') || roleLower.includes('owner') || roleLower.includes('chef de produit')) {
      return {
        category: lang === 'EN' ? "Product Management & Strategy" : "Gestion de Produit & Stratégie",
        list: [
          {
            title: lang === 'EN' ? "Anchor Every Feature in User Centricity" : "Ancrez chaque idée dans le besoin utilisateur",
            desc: lang === 'EN'
              ? "Start problems by segmenting target users and clarifying pain points before suggesting any product feature or visual wireframe."
              : "Avant de proposer des fonctionnalités, commencez toujours par segmenter vos utilisateurs cibles et par formuler clairement leurs points de douleur."
          },
          {
            title: lang === 'EN' ? "Apply Structured Prioritization Frameworks" : "Utilisez des méthodes de priorisation structurées",
            desc: lang === 'EN'
              ? "Demonstrate your strategic discipline using frameworks (like RICE, MoSCoW, or ROI) to justify trade-offs under tight resource constraints."
              : "Démontrez votre discipline stratégique en vous appuyant sur des critères clairs (ex: RICE, ROI) pour arbitrer entre les différentes fonctionnalités."
          },
          {
            title: lang === 'EN' ? "Define Clear North-Star Metrics" : "Pilotez par les indicateurs de succès (KPIs)",
            desc: lang === 'EN'
              ? "Explicitly state the primary KPI you would track to measure feature success, paired with counter-metrics to avoid regression."
              : "Définissez un indicateur principal (North-Star Metric) d'adoption couplé à une métrique de garde-fou pour valider le succès à long terme."
          }
        ]
      };
    }

    if (roleLower.includes('sales') || roleLower.includes('commercial') || roleLower.includes('account') || roleLower.includes('biz') || roleLower.includes('business dev')) {
      return {
        category: lang === 'EN' ? "Sales, Business Development & Accounts" : "Développement Commercial & Vente",
        list: [
          {
            title: lang === 'EN' ? "Sell Business Outcomes, Not Feature Checklists" : "Vendez la valeur ajoutée, pas les fonctionnalités",
            desc: lang === 'EN'
              ? "Translate product features into direct financial value, operational cost reduction, or strategic risk mitigation for the prospect."
              : "Traduisez chaque caractéristique technique de votre produit en économie financière, gain de temps opérationnel ou réduction de risques pour le client."
          },
          {
            title: lang === 'EN' ? "Validate & Handle Objections with Empathy" : "Désamorcez les objections par l'écoute active",
            desc: lang === 'EN'
              ? "Never react defensively. Acknowledge the client's concern first, clarify the deep driver behind it, then present supportive customer case studies."
              : "Ne soyez jamais sur la défensive. Accueillez l'objection avec bienveillance, creusez la cause sous-jacente, puis illustrez par une preuve client."
          },
          {
            title: lang === 'EN' ? "Always Structure the 'Next Step' (Closing)" : "Intégrez toujours l'étape suivante (Closing)",
            desc: lang === 'EN'
              ? "End strategic narratives with a strong sense of momentum. Demonstrate how you guide discussions toward clear commitment milestones."
              : "Terminez toujours vos récits d'entretiens en montrant comment vous convertissez une discussion en plan d'action ou engagement concret."
          }
        ]
      };
    }

    if (roleLower.includes('consultant') || roleLower.includes('consulting') || roleLower.includes('analyst') || roleLower.includes('conseil')) {
      return {
        category: lang === 'EN' ? "Strategy & Management Consulting" : "Conseil en Stratégie & Analyse",
        list: [
          {
            title: lang === 'EN' ? "Adopt a Hypothesis-Driven Approach" : "Formulez des hypothèses de départ claires",
            desc: lang === 'EN'
              ? "Structure problem breakdowns using MECE (Mutually Exclusive, Collectively Exhaustive) trees to display absolute strategic logic."
              : "Divisez la problématique à l'aide d'un arbre d'analyse rigoureusement MECE pour montrer une logique de résolution scientifique."
          },
          {
            title: lang === 'EN' ? "Structure Top-Down (Synthesized Delivery)" : "Communiquez en mode 'Top-Down' (Synthèse d'abord)",
            desc: lang === 'EN'
              ? "State your final executive recommendation first, then unpack the supporting pillars. Keep summaries highly high-level and scannable."
              : "Annoncez immédiatement votre recommandation finale (conclusion d'abord), puis détaillez de manière ordonnée les piliers de votre analyse."
          },
          {
            title: lang === 'EN' ? "Perform Transparent Quantitative Walkthroughs" : "Détaillez vos calculs de manière fluide",
            desc: lang === 'EN'
              ? "When estimating market sizes, explain each calculation assumption step-by-step. Keep numbers round and explain any margin of error."
              : "Pour les calculs de dimensionnement (estimation), énoncez vos hypothèses une à une de manière intelligible en arrondissant les valeurs."
          }
        ]
      };
    }

    if (roleLower.includes('health') || roleLower.includes('medical') || roleLower.includes('nurse') || roleLower.includes('doctor') || roleLower.includes('santé') || roleLower.includes('médecin')) {
      return {
        category: lang === 'EN' ? "Healthcare & Medical Compliance" : "Santé & Déontologie Médicale",
        list: [
          {
            title: lang === 'EN' ? "Highlight Clinical Protocol & Patient Safety" : "Priorisez la sécurité et le protocole clinique",
            desc: lang === 'EN'
              ? "Begin situational scenarios by showing your strict adherence to regulatory standards (HIPAA, patient privacy, and hygiene protocols)."
              : "Face à une situation médicale, montrez toujours votre respect inconditionnel des protocoles cliniques et de la confidentialité des patients."
          },
          {
            title: lang === 'EN' ? "Convey Active Compassion & High-Empathy Dialogue" : "Démontrez une empathie active rassurante",
            desc: lang === 'EN'
              ? "Showcase how you de-escalate patient anxiety, communicate diagnoses with precise candor, and actively listen to family concerns."
              : "Expliquez comment vous apaisez l'anxiété d'un patient, formulez des diagnostics avec tact et écoutez les inquiétudes des proches."
          },
          {
            title: lang === 'EN' ? "Emphasize Collaborative Triage and Coordination" : "Soulignez la coordination d'équipe (triage)",
            desc: lang === 'EN'
              ? "Focus on multidisciplinary collaboration, efficient handoff reporting, and rapid decision alignment under emergency situations."
              : "Insistez sur la collaboration pluridisciplinaire, l'efficacité des transmissions de garde et l'alignement rapide en cas d'urgence."
          }
        ]
      };
    }

    if (roleLower.includes('hr') || roleLower.includes('human') || roleLower.includes('recruiter') || roleLower.includes('talent') || roleLower.includes('rh') || roleLower.includes('recruteur')) {
      return {
        category: lang === 'EN' ? "Human Resources & Talent Management" : "Ressources Humaines & Recrutement",
        list: [
          {
            title: lang === 'EN' ? "Design Employee-Centric Frameworks" : "Valorisez l'expérience collaborateur",
            desc: lang === 'EN'
              ? "Ensure your initiatives represent fair treatment, inclusive hiring workflows, and healthy employee retention cultures."
              : "Orientez vos décisions vers l'inclusion, l'équité de traitement et la mise en place d'un climat social sain et épanouissant."
          },
          {
            title: lang === 'EN' ? "Detail Neutral, Structured Mediation Practices" : "Détaillez vos méthodes de médiation neutres",
            desc: lang === 'EN'
              ? "When resolving workforce conflicts, explain your exact neutral investigation steps, active listening exercises, and policy alignment."
              : "En cas de conflit d'équipe, détaillez vos étapes d'écoute bilatérale, de médiation neutre et d'alignement avec les politiques d'entreprise."
          },
          {
            title: lang === 'EN' ? "Link HR Strategy Directly to Business Performance" : "Reliez la stratégie RH à la croissance",
            desc: lang === 'EN'
              ? "Show how you align hiring plans, skill upscaling, and organizational development with the company's financial growth vectors."
              : "Prouvez comment vous alignez les plans de recrutement et la montée en compétences avec l'expansion globale de l'entreprise."
          }
        ]
      };
    }

    // General default tips
    return {
      category: lang === 'EN' ? "Standard Professional Interview Prep" : "Préparation Standard aux Entretiens",
      list: [
        {
          title: lang === 'EN' ? "The STAR Format Checklist" : "Le réflexe de la méthode STAR",
          desc: lang === 'EN'
            ? "Structure behavioral questions step-by-step: describe the Situation, specify the Task, describe your exact Action, and reveal the quantified Result."
            : "Répondez aux questions de mise en situation dans l'ordre : décrivez la Situation, la Tâche, l'Action personnelle menée, et le Résultat mesurable obtenu."
        },
        {
          title: lang === 'EN' ? "Pace and Tone Calibration" : "Contrôle du débit et silence constructif",
          desc: lang === 'EN'
            ? "Strive for a natural, steady pace (130-150 words per minute). Embrace brief pauses to breathe or think instead of using continuous verbal filler words (like 'um', 'uh')."
            : "Parlez d'une voix posée (130-150 mots par minute). Acceptez de faire de courtes pauses silencieuses pour respirer plutôt que de combler le vide avec des 'euh'."
        },
        {
          title: lang === 'EN' ? "Demonstrate Decision Rationale & Learnings" : "Expliquez vos décisions et apprentissages",
          desc: lang === 'EN'
            ? "Don't just list previous job descriptions. Explain the rationale behind your actions and outline what key takeaways you gathered from each outcome."
            : "Ne vous contentez pas de réciter votre CV. Expliquez les raisons derrière vos décisions stratégiques et tirez-en des apprentissages inspirants."
        }
      ]
    };
  };

  const currentTips = getContextualTips();

  if (inlineDisplayOnly) {
    return (
      <div className="space-y-3.5 text-left">
        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider font-black text-amber-600">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'EN' ? "Active Training Tips Overlay" : "Aide Active de Session"}</span>
        </div>
        <p className="text-[10.5px] font-bold text-stone-500 font-mono">
          {lang === 'EN' ? `CONTEXT: ${currentTips.category}` : `CONTEXTE : ${currentTips.category}`}
        </p>
        <div className="space-y-3 pt-1">
          {currentTips.list.map((tip, idx) => (
            <div key={idx} className="p-3 bg-[#FFFEEA] border border-stone-200 rounded-xl space-y-1 transition-all hover:bg-amber-50">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-900 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <h5 className="font-extrabold text-[11px] text-stone-950 leading-tight">
                    {tip.title}
                  </h5>
                  <p className="text-[10px] leading-relaxed text-stone-600 font-semibold">
                    {tip.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-[2.5px] border-stone-950 rounded-[24px] p-6 space-y-5 shadow-[5px_5px_0px_0px_#111111] hover:shadow-[7px_7px_0px_0px_#111111] hover:translate-x-[-1.5px] hover:translate-y-[-1.5px] transition-all">
      <div className="flex justify-between items-center pb-3.5 border-b-2 border-stone-950">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#FFFEEA] border border-stone-950 text-stone-950 rounded-lg shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
            <Lightbulb className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-left">
            <h3 className="text-xs.5 font-mono font-black uppercase tracking-wider text-[#111111]">
              {lang === 'EN' ? "Contextual Tips" : "Conseils Contextuels"}
            </h3>
            <span className="text-[9px] font-mono font-black text-amber-600 uppercase tracking-widest block">
              {currentTips.category}
            </span>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-amber-500" />
      </div>

      {/* Snippets list */}
      <div className="space-y-3.5 text-left">
        {currentTips.list.map((tip, idx) => (
          <div key={idx} className="flex gap-2.5 items-start">
            <div className="w-5 h-5 rounded-full bg-stone-50 border border-stone-950 flex items-center justify-center font-mono text-[9px] font-black shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <div className="space-y-0.5">
              <h4 className="font-black text-stone-950 text-xs leading-snug">
                {tip.title}
              </h4>
              <p className="text-[11px] leading-relaxed text-stone-500 font-medium">
                {tip.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Active simulation toggle with neat UI */}
      <div className="pt-3.5 border-t border-stone-100 flex items-center justify-between gap-3 text-left">
        <div className="space-y-0.5">
          <p className="font-black text-stone-900 text-xs">
            {lang === 'EN' ? "Enable Training Tips Overlay" : "Activer les Conseils d'Entraînement"}
          </p>
          <p className="text-[10px] text-stone-400 font-medium leading-normal max-w-[260px]">
            {lang === 'EN' 
              ? "Display these helpful reminders directly inside training sessions. Automatically hidden in assessments to keep trials authentic."
              : "Affiche ces rappels pendant vos entraînements vocaux. Automatiquement désactivés lors des évaluations pour de réelles conditions."}
          </p>
        </div>

        <button
          onClick={handleToggle}
          className={`relative w-11 h-6 rounded-full border-2 border-stone-950 p-0.5 transition-colors duration-200 outline-none shrink-0 ${
            tipsEnabled ? 'bg-emerald-400' : 'bg-stone-200'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white border border-stone-950 transition-transform duration-200 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] ${
              tipsEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
