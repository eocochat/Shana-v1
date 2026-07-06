import { CandidateState } from './candidateState';

export class ReadinessEngine {
  /**
   * Refreshes the interview readiness scores of a candidate based on digital twin updates.
   */
  public static recalculateReadiness(state: CandidateState): void {
    const twin = state.digitalTwin;

    // 1. Behavioral Readiness: based on communication, teamwork, conflict_resolution, adaptability
    const behavioralScore = Math.round(
      ((twin['communication']?.score || 50) * 0.3) +
      ((twin['teamwork']?.score || 50) * 0.25) +
      ((twin['conflict_resolution']?.score || 50) * 0.25) +
      ((twin['adaptability']?.score || 50) * 0.2)
    );

    // 2. Technical Readiness: based on technical_skills, problem_solving
    const technicalScore = Math.round(
      ((twin['technical_skills']?.score || 50) * 0.6) +
      ((twin['problem_solving']?.score || 50) * 0.4)
    );

    // 3. Leadership Readiness: based on leadership, ownership, decision_making
    const leadershipScore = Math.round(
      ((twin['leadership']?.score || 50) * 0.4) +
      ((twin['ownership']?.score || 50) * 0.3) +
      ((twin['decision_making']?.score || 50) * 0.3)
    );

    // 4. Executive Readiness: based on leadership, communication, decision_making, presentation
    const executiveScore = Math.round(
      ((twin['leadership']?.score || 50) * 0.3) +
      ((twin['communication']?.score || 50) * 0.35) +
      ((twin['decision_making']?.score || 50) * 0.35)
    );

    // 5. Company Readiness: customer focus, teamwork, adaptability, alignment
    const companyScore = Math.round(
      ((twin['customer_focus']?.score || 50) * 0.4) +
      ((twin['teamwork']?.score || 50) * 0.3) +
      ((twin['adaptability']?.score || 50) * 0.3)
    );

    // 6. Overall Hiring Readiness: average of all above
    const overallScore = Math.round(
      (behavioralScore + technicalScore + leadershipScore + executiveScore + companyScore) / 5
    );

    // Write scores and explanations
    state.readiness.behavioralReadiness = {
      score: behavioralScore,
      explanation: getBehavioralExplanation(behavioralScore)
    };

    state.readiness.technicalReadiness = {
      score: technicalScore,
      explanation: getTechnicalExplanation(technicalScore)
    };

    state.readiness.leadershipReadiness = {
      score: leadershipScore,
      explanation: getLeadershipExplanation(leadershipScore)
    };

    state.readiness.executiveReadiness = {
      score: executiveScore,
      explanation: getExecutiveExplanation(executiveScore)
    };

    state.readiness.companyReadiness = {
      score: companyScore,
      explanation: getCompanyExplanation(companyScore)
    };

    state.readiness.overallHiringReadiness = {
      score: overallScore,
      explanation: getOverallExplanation(overallScore)
    };
  }
}

// Helpers for explanations
function getBehavioralExplanation(score: number): string {
  if (score === 0) return 'Aucune simulation d\'entretien comportemental effectuée pour le moment. / No behavioral interview simulation completed yet.';
  if (score > 85) return 'Superb STAR articulation. Answers are metric-oriented, well-structured, and clearly exhibit professional empathy.';
  if (score > 70) return 'Solid scenario explanation. Answers have structured Actions and Situations, but need more emphasis on precise, measurable Results.';
  return 'Struggles with structure. Answers feel generic. Practice organizing answers into clear Situation-Task-Action-Result stages.';
}

function getTechnicalExplanation(score: number): string {
  if (score === 0) return 'Aucune question technique validée pour le moment. / No technical questions validated yet.';
  if (score > 85) return 'Demonstrates profound domain knowledge and structural system understanding. Explains trade-offs and complexity perfectly.';
  if (score > 70) return 'Grasps major engineering patterns, but occasionally glosses over optimization constraints or security trade-offs.';
  return 'Lacks structural technical depth. Focus on explaining technical decisions step-by-step with design justifications.';
}

function getLeadershipExplanation(score: number): string {
  if (score === 0) return 'Aucun indicateur de leadership enregistré pour le moment. / No leadership indicators recorded yet.';
  if (score > 85) return 'Exhibits strong delegation habits and extreme ownership traits. Promotes extreme accountability and team growth.';
  if (score > 70) return 'Exhibits proactive project management but can strengthen delegation structures and long-term ownership narratives.';
  return 'Tends to describe team achievements as a passive bystander. Practice using assertive verbs and emphasizing your direct influence.';
}

function getExecutiveExplanation(score: number): string {
  if (score === 0) return 'Aucune présentation exécutive évaluée pour le moment. / No executive presentation evaluated yet.';
  if (score > 85) return 'Communicates high-level business impact succinctly. Captures corporate trade-offs and speaks directly to leadership stakeholders.';
  if (score > 70) return 'Capable of briefing managers, but occasionally overcomplicates details. Needs to summarize with a top-down approach.';
  return 'Drowns answers in microscopic technical trivia. Focus on summarizing high-level business impacts and ROI values first.';
}

function getCompanyExplanation(score: number): string {
  if (score === 0) return 'Alignement entreprise en attente d\'évaluation. / Company alignment pending evaluation.';
  if (score > 85) return 'Perfect cultural and customer-first alignment. Demonstrates extreme awareness of user pain points and strategic goals.';
  if (score > 70) return 'Good teamwork alignment, but needs to weave specific company missions and product values deeper into answers.';
  return 'No direct company or customer connection mentioned. Practice tying answers back to user-centric and corporate success metrics.';
}

function getOverallExplanation(score: number): string {
  if (score === 0) return 'Réalisez votre première simulation pour activer et calibrer votre indice d\'embauche global. / Start your first simulation to calibrate your overall readiness index.';
  if (score > 85) return 'Excellent candidate profile! Highly qualified across multiple interview vectors. Strong communication and domain depth.';
  if (score > 70) return 'Promising fit. Candidate is competent but needs focused polishing on communication speed and structured metrics.';
  return 'Needs foundational practice. Focus on consistent mock runs to establish structure, reduce filler words, and gain self-assurance.';
}
