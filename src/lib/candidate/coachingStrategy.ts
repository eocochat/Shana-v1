import { CandidateState } from './candidateState';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ensureFirebaseAuth } from '../dbSync';

export class CoachingStrategyEngine {
  /**
   * Builds an adaptive coaching strategy based on candidate needs and current performance.
   */
  public static adaptCoachingStrategy(state: CandidateState): void {
    const digitalTwin = state.digitalTwin;
    const learning = state.learning;

    // Find lowest scoring competencies to make them coaching priorities
    const sortedComps = Object.values(digitalTwin).sort((a, b) => a.score - b.score);
    const primaryGap = sortedComps[0]?.id || 'communication';
    const secondaryGap = sortedComps[1]?.id || 'ownership';

    const coaching = state.coachingStrategy;

    // Adapt track based on gaps
    if (primaryGap === 'communication') {
      coaching.activeTrack = 'Verbal Brilliance & Concision';
      coaching.focusTarget = 'Filler Word Elimination & Metric Integration';
      coaching.weeklyPlan = [
        'Complete two conciseness drills under pressure',
        'Record structured STAR outlines focusing on hard metrics',
        'Analyze rapid speaking triggers and practice strategic pauses'
      ];
    } else if (primaryGap === 'technical_skills' || primaryGap === 'problem_solving') {
      coaching.activeTrack = 'Technical Systems & Depth';
      coaching.focusTarget = 'Architectural Design Decisions';
      coaching.weeklyPlan = [
        'Explain complex database replication trade-offs',
        'Practice structured troubleshooting in a simulated panel',
        'Incorporate security and cost boundaries into technical answers'
      ];
    } else if (primaryGap === 'leadership' || primaryGap === 'ownership') {
      coaching.activeTrack = 'Executive Ownership & Impact';
      coaching.focusTarget = 'High-Agency Leadership Stories';
      coaching.weeklyPlan = [
        'Establish clear accountability boundaries in team failure stories',
        'Incorporate project ROI and stakeholder management metrics',
        'Formulate a 1-minute high-impact summary for VP review'
      ];
    } else {
      coaching.activeTrack = 'Adaptive Behavioral Mastery';
      coaching.focusTarget = 'Situational Versatility & Cadence';
      coaching.weeklyPlan = [
        `Focus heavily on developing stories around ${primaryGap.replace('_', ' ')}`,
        `Practice high-signal STAR responses targeting ${secondaryGap.replace('_', ' ')}`,
        'Engage in an audio-only mock run to test pacing and recovery'
      ];
    }

    // Tweak objectives based on learning style
    if (learning.style === 'Needs Confidence Building') {
      coaching.weeklyPlan.unshift('Warmup with a simple 2-minute mock introduction to establish baseline comfort');
    } else if (learning.style === 'Fast Learner') {
      coaching.weeklyPlan.push('Take on an Elite-level pressure simulation to challenge rapid recovery');
    }
  }

  /**
   * Dynamically fetches user performance data from Firestore after each interview
   * and processes it to generate evidence-based coaching recommendations.
   */
  public static async updateCoachingWithFirestoreData(userId: string, state: CandidateState): Promise<boolean> {
    if (!userId || !state) return false;

    // Get email of the candidate to establish auth
    const usersStr = localStorage.getItem('shana_users') || '[]';
    const users = JSON.parse(usersStr);
    const user = users.find((u: any) => u.id === userId);
    const userEmail = user?.email || '';

    if (!userEmail) return false;

    try {
      // 1. Establish Firebase authentication
      await ensureFirebaseAuth(userEmail, userId);

      // 2. Query all interview sessions for this user
      const sessionsQuery = query(
        collection(db, 'interview_sessions'),
        where('user_id', '==', userId)
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      if (sessionsSnap.empty) {
        return false;
      }

      // 3. Find the latest completed session
      const sessionsList = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as any);
      sessionsList.sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime());
      const latestSession = sessionsList[0];

      // 4. Query answers for this specific latest session
      const answersQuery = query(
        collection(db, 'answers'),
        where('session_id', '==', latestSession.id)
      );
      const answersSnap = await getDocs(answersQuery);
      if (answersSnap.empty) {
        return false;
      }

      const answers = answersSnap.docs.map(d => d.data());

      // 5. Detect language dynamically from state or fetched answers
      const isFr = state.readiness.overallHiringReadiness.explanation.toLowerCase().includes('réalisez') || 
                   state.readiness.overallHiringReadiness.explanation.toLowerCase().includes('aucune') ||
                   answers.some(a => /[éàèùç]/.test(a.question || '') || /[éàèùç]/.test(a.answer || ''));

      // 6. Perform evidence-based text & score analysis
      // - Find lowest scoring question/answer
      const sortedAnswers = [...answers].sort((a, b) => (a.ips_score || 0) - (b.ips_score || 0));
      const lowestAnswer = sortedAnswers[0];
      const lowQ = lowestAnswer?.question || (isFr ? 'Présentation de soi' : 'Self introduction');
      const lowScore = lowestAnswer?.ips_score || 70;

      // - Find short answers lacking depth
      const shortAnswerNode = answers.find(a => (a.answer || '').length > 0 && (a.answer || '').length < 180);
      const shortQ = shortAnswerNode?.question || '';
      const shortAnsText = shortAnswerNode?.answer || '';

      // - Find answers lacking hard quantitative metrics
      const hasMetrics = (text: string) => /([0-9]+|percent|kpi|dollar|revenue|million|%|\$|€|£)/i.test(text);
      const noMetricNode = answers.find(a => (a.answer || '').length > 0 && !hasMetrics(a.answer || ''));
      const noMetricQ = noMetricNode?.question || '';

      // 7. Re-calibrate coaching state track/focus based on the lowest scoring competency area
      const sortedComps = Object.values(state.digitalTwin).sort((a, b) => a.score - b.score);
      const primaryGap = sortedComps[0]?.id || 'communication';
      const coaching = state.coachingStrategy;

      if (primaryGap === 'communication') {
        coaching.activeTrack = isFr ? 'Brillance Verbale & Concision' : 'Verbal Brilliance & Concision';
        coaching.focusTarget = isFr ? 'Suppression Mots de Remplissage & Intégration Chiffrée' : 'Filler Word Elimination & Metric Integration';
      } else if (primaryGap === 'technical_skills' || primaryGap === 'problem_solving') {
        coaching.activeTrack = isFr ? 'Profondeur Technique & Systèmes' : 'Technical Systems & Depth';
        coaching.focusTarget = isFr ? 'Architecture & Choix d\'Ingénierie' : 'Architectural Design Decisions';
      } else {
        coaching.activeTrack = isFr ? 'Leadership Exécutif & Impact' : 'Executive Ownership & Impact';
        coaching.focusTarget = isFr ? 'Histoires d\'Impact Fort' : 'High-Agency Leadership Stories';
      }

      // 8. Generate Specific, Evidence-Based Actionable Weekly Plan
      const newWeeklyPlan: string[] = [];

      // Bullet 1: Pacing and Delivery Feedback
      if (state.communication.fillerWordFrequency > 2) {
        newWeeklyPlan.push(
          isFr 
            ? `Rythme verbal : Votre dernière session a enregistré ${state.communication.fillerWordFrequency} mots de remplissage/100w. Remplacez ces tics par des silences d'une seconde.`
            : `Verbal Pacing: Your last session recorded a high filler word frequency of ${state.communication.fillerWordFrequency}/100w. Replace fillers with silent 1-second pauses.`
        );
      } else if (state.communication.averageSpeakingSpeed > 150) {
        newWeeklyPlan.push(
          isFr
            ? `Tempo de parole : Votre débit a atteint ${state.communication.averageSpeakingSpeed} mots/min (rapide). Visez ~130 mots/min pour optimiser l'impact.`
            : `Speaking Tempo: Your speed reached ${state.communication.averageSpeakingSpeed} WPM (slightly fast). Aim for ~130 WPM to sound more authoritative.`
        );
      } else {
        newWeeklyPlan.push(
          isFr
            ? `Débit verbal : Votre rythme de parole est idéal (~130 mots/min). Concentrez-vous sur l'impact de vos 15 premières secondes de réponse.`
            : `Speaking Flow: Your pacing is well-calibrated (~130 WPM). Focus on maximizing the impact of your first 15 seconds of delivery.`
        );
      }

      // Bullet 2: Answer Depth or Metric Completeness Evidence
      if (shortQ) {
        newWeeklyPlan.push(
          isFr
            ? `Structure & Détail : Votre réponse à '${shortQ.slice(0, 45)}...' était trop concise (${shortAnsText.length} car.). Étoffez l'étape Action de STAR.`
            : `Structural Depth: Your answer to '${shortQ.slice(0, 45)}...' was brief (${shortAnsText.length} chars). Expand the 'Action' phase in STAR.`
        );
      } else if (noMetricQ) {
        newWeeklyPlan.push(
          isFr
            ? `Preuves chiffrées : Votre réponse à '${noMetricQ.slice(0, 45)}...' manquait de KPIs quantitatifs. Intégrez des pourcentages ou des chiffres clés.`
            : `Quantitative Proof: Your answer to '${noMetricQ.slice(0, 45)}...' lacked hard metrics. Back your claims with exact revenue or scale figures.`
        );
      } else {
        newWeeklyPlan.push(
          isFr
            ? `Focalisation STAR : Vos réponses de la dernière session sont bien structurées. Fluidifiez la transition entre la Situation et l'Action en 20s.`
            : `STAR Alignment: Excellent structure on your latest session responses. Refine the transition from Situation to Action within 20 seconds.`
        );
      }

      // Bullet 3: Targeted Rehearsal Recommendation for Lowest Scored Answer
      newWeeklyPlan.push(
        isFr
          ? `Entraînement ciblé : Votre réponse à '${lowQ.slice(0, 45)}...' a obtenu ${lowScore}%. Rejouez ce scénario en définissant clairement vos responsabilités.`
          : `Focused Rehearsal: Your answer to '${lowQ.slice(0, 45)}...' scored ${lowScore}%. Re-run this scenario focusing on clear accountability.`
      );

      coaching.weeklyPlan = newWeeklyPlan;

      // 9. Update Improvement Planner with Specific Actionable Insights
      const planner = state.improvementPlanner;
      
      // Immediate Improvements based on actual Firestore data
      const newImmediate: string[] = [];
      if (noMetricQ) {
        newImmediate.push(
          isFr
            ? `Ajoutez des KPIs (ex: chiffre d'affaires, latence système, taille d'équipe) à la question '${noMetricQ.slice(0, 35)}...'`
            : `Add hard metrics (KPIs, latency metrics, or team sizes) to your answer for '${noMetricQ.slice(0, 35)}...'`
        );
      } else {
        newImmediate.push(
          isFr
            ? `Limitez l'exposition du contexte de la Situation à moins de 25 secondes`
            : `Keep Situation context under 25 seconds when explaining behavioural challenges`
        );
      }

      if (shortQ) {
        newImmediate.push(
          isFr
            ? `Détaillez les étapes de l'Action pour la question '${shortQ.slice(0, 35)}...' pour mieux expliquer votre contribution`
            : `Deepen the Action steps for '${shortQ.slice(0, 35)}...' to clarify your personal technical contributions`
        );
      } else {
        newImmediate.push(
          isFr
            ? `Éliminez les mots de remplissage pour soutenir un débit plus régulier`
            : `Eliminate verbal fillers to maintain professional conversational momentum`
        );
      }

      newImmediate.push(
        isFr
          ? `Rejouez le dernier drill de coaching pour tester votre résilience sous pression`
          : `Re-run your latest coaching drill to test speaking recovery under pressure`
      );

      planner.immediateImprovements = newImmediate;

      // Weekly objectives based on actual Firestore lowest scored question
      planner.weeklyObjectives = [
        isFr
          ? `Perfectionnez votre trame verbale pour la question '${lowQ.slice(0, 35)}...'`
          : `Perfect your verbal template for the question '${lowQ.slice(0, 35)}...'`,
        isFr
          ? `Complétez 3 entraînements guidés axés sur le parcours '${coaching.activeTrack}'`
          : `Complete 3 guided audio sessions on the '${coaching.activeTrack}' track`
      ];

      // Monthly objectives matching the competency goals
      planner.monthlyObjectives = [
        isFr
          ? `Maintenez un score d'aptitude global supérieur à 80% sur vos compétences prioritaires`
          : `Sustain an overall readiness score above 80% across your priority competencies`,
        isFr
          ? `Constituez un portfolio de 5 réalisations chiffrées solides prouvant votre impact et votre expertise`
          : `Build a portfolio of 5 robust, metric-proven project stories addressing leadership and system depth`
      ];

      return true;
    } catch (err) {
      console.warn('[SHANA CoachingStrategyEngine] Failed to process Firestore coaching insights:', err);
      return false;
    }
  }
}

