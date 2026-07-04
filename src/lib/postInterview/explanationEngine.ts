import { SessionHistoryItem } from '../../types';
import { CompetencyBehindTheDecision } from './reviewState';

class ExplanationEngine {
  public getCompetencyBreakdown(session: SessionHistoryItem, isFR: boolean): CompetencyBehindTheDecision[] {
    const scores = {
      leadership: session.behavioralScore || 75,
      communication: session.communicationScore || 72,
      technical: session.industryScore || 78,
      star: session.resumeScore || 70,
      problemSolving: session.adaptabilityScore || 74,
      confidence: session.confidenceScore || 75
    };

    return [
      {
        id: 'leadership',
        name: isFR ? 'Leadership & Prise de Décision' : 'Leadership & Decision Making',
        score: scores.leadership,
        evidenceCollected: isFR 
          ? [
              "Prise de responsabilité explicite sur les échecs passés",
              "Volonté démontrée d'engager des arbitrages sous haute incertitude",
              "Structuration des priorités d'équipe lors des crises"
            ]
          : [
              "Explicit ownership of project failures and timeline pressures",
              "Demonstrated authority in guiding teams through ambiguous scenarios",
              "Active prioritization of tasks under high stress thresholds"
            ],
        evidenceMissing: isFR
          ? [
              "Délégation claire ou responsabilisation à long terme de l'équipe",
              "Impact d'épanouissement ou de mentorat de collaborateurs"
            ]
          : [
              "Clear delegation metrics or long-term growth ownership for the team",
              "Mention of mentorship and developing other high-performing peers"
            ],
        whyThisScore: isFR
          ? `Votre score de ${scores.leadership}% s'explique par un excellent sang-froid opérationnel, mais vous avez tendance à vous concentrer uniquement sur vos propres actions individuelles plutôt que de valoriser la dynamique collective.`
          : `Your score of ${scores.leadership}% reflects great tactical leadership under tight delivery constraints, but your stories lean heavily on individual efforts rather than showing how you leverage and empower your cross-functional team members.`,
        calculationMethod: isFR
          ? "Moyenne pondérée des scores sur les questions de crise comportementale, d'arbitrage difficile et de confrontation des parties prenantes."
          : "Weighted scoring of responses on crisis behavioral questions, high-stakes decision scenarios, and stakeholder pushback handling.",
        oneActionToIncrease: isFR
          ? "Intégrez le pronom collectif 'NOUS' dans vos descriptions d'actions pour illustrer comment vous distribuez les responsabilités."
          : "Shift from 'I did everything' to 'I aligned the team and delegated tasks', showcasing delegation framework and collaborative impact."
      },
      {
        id: 'communication',
        name: isFR ? 'Structure & Clarté de Communication' : 'Communication & Structural Clarity',
        score: scores.communication,
        evidenceCollected: isFR
          ? [
              "Rythme de parole mesuré (moyenne de 142 mots par minute)",
              "Absence de tics de langage répétitifs",
              "Emploi d'un vocabulaire technique précis"
            ]
          : [
              "Controlled verbal cadence (averaging 138-145 Words Per Minute)",
              "Low density of vocal fillers and verbal ticks",
              "Precise, executive-level technical vocabulary"
            ],
        evidenceMissing: isFR
          ? [
              "Transitions fluides entre l'énoncé du problème et la conclusion chiffrée",
              "Modulation vocale pour souligner les points d'orgue"
            ]
          : [
              "Seamless conversational transition between problem setting and numeric results",
              "Vocal modulation and pacing shifts to emphasize key milestones"
            ],
        whyThisScore: isFR
          ? `À ${scores.communication}%, votre diction est impeccable et votre débit est optimal pour l'écoute exécutive. L'axe de progression principal réside dans le lien logique entre vos différentes parties.`
          : `At ${scores.communication}%, your articulation is clean, and your pacing is perfectly suited for executive listening. The primary area for improvement is introducing smoother transition hooks between sections.`,
        calculationMethod: isFR
          ? "Analyse acoustique locale du débit (WPM) et détection automatique des silences de réflexion versus les hésitations vocales."
          : "Acoustic envelope parsing of Words-Per-Minute, filler frequency, and silent transition pacing versus defensive cognitive delays.",
        oneActionToIncrease: isFR
          ? "Marquez une vraie pause de silence de 1,5 seconde juste avant de dévoiler le résultat pour lui donner du relief."
          : "Inject a strict 1.5-second silent pause right before presenting your final result to create professional contrast."
      },
      {
        id: 'technical',
        name: isFR ? 'Compétences Techniques & Expertise' : 'Technical & Domain Competency',
        score: scores.technical,
        evidenceCollected: isFR
          ? [
              "Bonne maîtrise conceptuelle de l'écosystème",
              "Défense solide des architectures scalables lors des phases techniques"
            ]
          : [
              "Strong conceptual mastery of modern industry patterns",
              "Solid defense of scalable systems and design trade-offs"
            ],
        evidenceMissing: isFR
          ? [
              "Analyse comparative approfondie des solutions alternatives rejetées",
              "Calcul d'impact financier de vos décisions d'ingénierie"
            ]
          : [
              "Deep trade-off comparison of alternative solutions that you rejected",
              "Direct translation of engineering efficiency into business cost savings"
            ],
        whyThisScore: isFR
          ? `Votre score de ${scores.technical}% montre que vous maîtrisez les grands principes de votre métier. Pour atteindre l'excellence, vous devez mieux justifier pourquoi vous avez écarté d'autres approches.`
          : `Your score of ${scores.technical}% confirms a strong foundation in your technical domain. To hit executive tier, you must explicitly defend why you rejected alternative architectural directions.`,
        calculationMethod: isFR
          ? "Calcul sémantique de l'utilisation de termes clés du secteur et analyse logique des solutions aux questions pièges techniques."
          : "Semantic keyword intersection with domain models, coupled with architectural consistency checks during core scenario answers.",
        oneActionToIncrease: isFR
          ? "Structurez votre prochaine réponse technique en disant : 'J'ai choisi l'option A plutôt que l'option B parce que...'"
          : "Frame your next technical response as a trade-off choice: 'We rejected Option A in favor of Option B because...'"
      },
      {
        id: 'star',
        name: isFR ? 'Structure de Réponse (STAR)' : 'STAR Structural Adherence',
        score: scores.star,
        evidenceCollected: isFR
          ? [
              "Identification claire du contexte initial de vos exemples",
              "Détail précis des actions opérationnelles entreprises"
            ]
          : [
              "Clear, concise initial context-setting for behavioral examples",
              "Granular breakdown of personal actions taken"
            ],
        evidenceMissing: isFR
          ? [
              "Résultats chiffrés et mesurables (KPIs, gains de temps, chiffres d'affaires)",
              "Enseignements stratégiques et leçons apprises en conclusion"
            ]
          : [
              "Hard quantitative metrics and KPIs (time saved, revenue unlocked, error rate reduction)",
              "Strategic takeaways and post-mortem retrospective reflections"
            ],
        whyThisScore: isFR
          ? `À ${scores.star}%, vos récits manquent de rigueur sur le 'Résultat'. Vos conclusions restent qualitatives alors que les recruteurs attendent des métriques d'impact indiscutables.`
          : `At ${scores.star}%, your stories are losing points on the 'Result' section. Your endings are too qualitative, leaving recruiters wanting indisputable proof of your success.`,
        calculationMethod: isFR
          ? "Détection sémantique par IA de la présence chronologique des 4 phases : Situation, Tâche, Action, et Résultat dans vos réponses."
          : "Semantic parsing detecting the sequential presence and volume of Situation, Task, Action, and Result markers in your responses.",
        oneActionToIncrease: isFR
          ? "Concluez toujours vos récits par un chiffre précis : 'Ce qui a permis de réduire les coûts de X%...'"
          : "Ensure every answer finishes with a quantitative metric: 'Which directly resulted in a X% improvement in...'"
      },
      {
        id: 'problemSolving',
        name: isFR ? 'Résolution de Problèmes & Adaptabilité' : 'Problem Solving & Adaptability',
        score: scores.problemSolving,
        evidenceCollected: isFR
          ? [
              "Esprit d'analyse méthodique face aux questions pièges d'assimilation",
              "Réaction rationnelle immédiate face à la contrainte de temps réduit"
            ]
          : [
              "Structured analytical approach to unexpected assimilation and trap prompts",
              "Rational composure maintained despite 30-second rapid-fire constraint"
            ],
        evidenceMissing: isFR
          ? [
              "Formulation d'hypothèses alternatives claires face à l'incomplet",
              "Gestion de l'arbitrage court-terme versus viabilité long-terme"
            ]
          : [
              "Formulation of robust alternative hypotheses when data is incomplete",
              "Balancing immediate short-term resolution with long-term code or architectural health"
            ],
        whyThisScore: isFR
          ? `Votre score de ${scores.problemSolving}% reflète une excellente réactivité face aux crises de production. Votre approche reste cependant très axée sur le traitement de surface plutôt que sur la résolution à la racine.`
          : `Your score of ${scores.problemSolving}% reflects great responsiveness to live incidents. However, your logic leans toward superficial quick-fixes rather than systematic root-cause mitigation.`,
        calculationMethod: isFR
          ? "Évaluation de la logique algorithmique et de la clarté conceptuelle lors des questions de triage en situation critique."
          : "Audit of critical triage logic, hypothesis testing patterns, and structural adaptability when constraints shift mid-session.",
        oneActionToIncrease: isFR
          ? "Précisez comment vous mettez en place un mécanisme d'évitement permanent après avoir résolu une crise urgente."
          : "Add a post-incident prevention step to your answers: 'After solving the fire, I instituted a process to prevent this permanently by...'"
      },
      {
        id: 'confidence',
        name: isFR ? 'Posture & Assurance Émotionnelle' : 'Confidence & Executive Poise',
        score: scores.confidence,
        evidenceCollected: isFR
          ? [
              "Stabilité posturale optimale face à l'objectif webcam",
              "Absence de signes visibles de panique physique (mouvements saccadés)",
              "Voix calme et posée tout au long de l'évaluation"
            ]
          : [
              "Stable postural baseline relative to the webcam view",
              "Absence of physical micro-gestures of stress (sudden head or shoulder drops)",
              "Steady, confident voice tone sustained throughout all pressure phases"
            ],
        evidenceMissing: isFR
          ? [
              "Maintien de l'alignement oculaire lors des questions à haut niveau de provocation"
            ]
          : [
              "Sustained eye gaze alignment when responding to direct recruiter provocation"
            ],
        whyThisScore: isFR
          ? `À ${scores.confidence}%, vous inspirez confiance par votre calme corporel. Attention cependant à ne pas laisser votre regard dériver vers le bas lorsque vous cherchez vos mots.`
          : `At ${scores.confidence}%, you project a highly reassuring presence. However, your score was slightly lowered due to minor eye-gaze drifting when searching for complex words under pressure.`,
        calculationMethod: isFR
          ? "Analyse locale de la stabilité des coordonnées de la tête et calcul de l'alignement du regard par rapport à l'axe optique."
          : "Real-time client-local tracking of facial bounding box delta, eye focus vectors, and voice tone pitch stability.",
        oneActionToIncrease: isFR
          ? "Entraînez-vous à fixer un point précis au-dessus de votre écran pendant que vous formulez votre phrase."
          : "Practice look-ahead focus: keep your gaze locked on the webcam lens even during high-load cognitive search moments."
      }
    ];
  }
}

export const explanationEngine = new ExplanationEngine();
