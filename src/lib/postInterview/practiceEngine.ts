import { SessionHistoryItem } from '../../types';
import { PracticeSession } from './reviewState';

class PracticeEngine {
  public getPracticeSessions(session: SessionHistoryItem, isFR: boolean): PracticeSession[] {
    const defaultSessions: PracticeSession[] = [
      {
        id: 'prac_leadership',
        title: isFR ? 'Entraînement au Leadership Exécutif' : 'Executive Leadership Practice',
        description: isFR 
          ? 'Affinez vos décisions sous contraintes et défendez vos choix face à des comités sceptiques.'
          : 'Refine high-pressure decision frameworks and defend strategic rollouts to skeptical board members.',
        category: 'Leadership',
        estimatedDurationMins: 8,
        questions: isFR 
          ? [
              "Si votre plan de restructuration technique est rejeté en bloc par le comité exécutif, quelle est votre réponse sémantique immédiate ?",
              "Décrivez une situation où vous avez pris une décision stratégique cruciale sans disposer de toutes les métriques requises."
            ]
          : [
              "If your core technical roadmap is completely rejected by the executive board, what is your immediate semantic response?",
              "Defend a strategic rollout decision you made under extreme ambiguity when critical performance metrics were unavailable."
            ]
      },
      {
        id: 'prac_technical',
        title: isFR ? 'Maîtrise des Questions Pièges Techniques' : 'Technical Probing & Trap Practice',
        description: isFR
          ? 'Entraînez-vous à justifier vos choix d\'architecture et à comparer rationnellement les compromis.'
          : 'Master domain-specific trade-off discussions and handle structural system failure scenarios cleanly.',
        category: 'Technical',
        estimatedDurationMins: 10,
        questions: isFR
          ? [
              "Comparez les compromis de latence et de cohérence dans une architecture hautement distribuée sous pic de charge.",
              "Comment défendez-vous la réécriture d'un module hérité obsolète face à un directeur financier qui refuse d'investir ?"
            ]
          : [
              "Formulate the trade-offs of consistency versus availability in a distributed storage cluster during a sudden regional outage.",
              "Defend the immediate commercial necessity of refactoring an obsolete legacy pipeline to a CFO focused strictly on short-term costs."
            ]
      },
      {
        id: 'prac_behavioral',
        title: isFR ? 'Rigueur de la Méthode STAR' : 'Advanced Behavioral STAR Practice',
        description: isFR
          ? 'Concentrez-vous sur l\'impact et les résultats mesurables pour structurer parfaitement vos réponses.'
          : 'Enforce rigid STAR structure and perfect the delivery of high-impact quantitative results.',
        category: 'Behavioral',
        estimatedDurationMins: 7,
        questions: isFR
          ? [
              "Parlez-moi d'une livraison majeure qui a connu un glissement de planning. Quelle action corrective chiffrée avez-vous menée ?",
              "Présentez un cas où vous avez dû convaincre un pair hostile d'adopter vos méthodes opérationnelles."
            ]
          : [
              "Tell me about a project that slipped past its committed SLA. What quantitative triage actions did you personally execute?",
              "Describe a scenario where you convinced an actively resistant peer to adopt your architectural approach."
            ]
      },
      {
        id: 'prac_conflict',
        title: isFR ? 'Désamorçage de Crise & Négociation' : 'Conflict Resolution & De-escalation',
        description: isFR
          ? 'Gérez la tension face à des interlocuteurs agressifs tout en préservant vos objectifs stratégiques.'
          : 'De-escalate high-stress situations with stakeholders while firmly preserving project integrity.',
        category: 'Conflict',
        estimatedDurationMins: 6,
        questions: isFR
          ? [
              "Un client important hurle en réunion car la production est ralentie de 5%. Quel est votre protocole de réponse vocal ?",
              "Comment gérez-vous un membre d'équipe brillant mais toxique qui refuse de se conformer aux standards du groupe ?"
            ]
          : [
              "A major enterprise client is shouting in a joint meeting because database latency rose by 5%. What is your verbal triage protocol?",
              "How do you manage a brilliant but toxic team member who openly rejects corporate code quality and collaboration frameworks?"
            ]
      },
      {
        id: 'prac_communication',
        title: isFR ? 'Séquençage Vocal & Pacing Exécutif' : 'Executive Vocal Pacing & Delivery',
        description: isFR
          ? 'Maîtrisez votre débit verbal sous minuteur serré et éliminez définitivement les mots de remplissage.'
          : 'Master conversational rhythm under strict timers and eliminate all vocal filler density.',
        category: 'Communication',
        estimatedDurationMins: 5,
        questions: isFR
          ? [
              "Présentez votre vision d'avenir sur l'usage de l'IA générative dans votre secteur d'activité, en limitant strictement votre élocution à 60 secondes.",
              "Expliquez un concept complexe d'ingénierie logicielle à un enfant de 8 ans, sans utiliser de jargon technique."
            ]
          : [
              "Synthesize your 5-year perspective on AI integration within your sector under a strict, non-negotiable 60-second limit.",
              "Explain a complex distributed architectural concept to a non-technical marketing director without utilizing any engineering jargon."
            ]
      },
      {
        id: 'prac_salary',
        title: isFR ? 'Négociation de Rémunération' : 'High-Stakes Salary Negotiation',
        description: isFR
          ? 'Défendez votre valeur marchande avec calme et préparez vos contre-propositions de manière rationnelle.'
          : 'Position your market value with poise and navigate complex counter-offers with corporate diplomacy.',
        category: 'Salary',
        estimatedDurationMins: 8,
        questions: isFR
          ? [
              "L'offre finale du recruteur est 15% en dessous de vos attentes. Formulez votre contre-proposition argumentée.",
              "Comment répondez-vous à la question : 'Quelles sont vos attentes salariales actuelles ?' pour préserver vos options ?"
            ]
          : [
              "The hiring manager’s final base salary offer is 15% below your target. Formulate an elegant, value-backed counter-proposal.",
              "How do you respond to: 'What is your current salary, and what are your expectations?' to retain complete strategic leverage?"
            ]
      }
    ];

    // Tailor sessions based on lowest scored areas
    const lowestCompetency = this.getLowestCompetency(session);
    if (lowestCompetency === 'behavioral' || lowestCompetency === 'leadership') {
      return [defaultSessions[0], defaultSessions[2], ...defaultSessions.slice(1, 3)];
    }
    if (lowestCompetency === 'industry' || lowestCompetency === 'technical') {
      return [defaultSessions[1], defaultSessions[3], ...defaultSessions.slice(0, 2)];
    }
    if (lowestCompetency === 'communication') {
      return [defaultSessions[4], defaultSessions[3], ...defaultSessions.slice(1, 3)];
    }
    return defaultSessions;
  }

  private getLowestCompetency(session: SessionHistoryItem): string {
    const scores = {
      resume: session.resumeScore || 100,
      industry: session.industryScore || 100,
      communication: session.communicationScore || 100,
      confidence: session.confidenceScore || 100,
      adaptability: session.adaptabilityScore || 100,
      behavioral: session.behavioralScore || 100
    };

    let lowestKey = 'resume';
    let lowestVal = 100;
    for (const [key, val] of Object.entries(scores)) {
      if (val < lowestVal) {
        lowestVal = val;
        lowestKey = key;
      }
    }
    return lowestKey;
  }
}

export const practiceEngine = new PracticeEngine();
