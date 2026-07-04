import { RecruiterState } from './recruiterState';
import { CompetencyCoverageEngine } from './competencyCoverage';
import { ContradictionEngine } from './contradictionEngine';

export class ObjectivePlanner {
  /**
   * Refreshes objectives based on competency coverage, unresolved contradictions, and strategy stage.
   */
  public static updateObjectives(state: RecruiterState): string[] {
    const objectives: string[] = [];

    // 1. Check for unresolved contradictions (Highest priority)
    const activeContradiction = state.contradictions.find(c => !c.resolved);
    if (activeContradiction) {
      objectives.push(`Resolve contradiction in ${activeContradiction.competencyId} statement`);
    }

    // 2. Identify the lowest covered competencies
    const lowestCovered = CompetencyCoverageEngine.getLowestCoveredCompetencies(state, 2);
    lowestCovered.forEach(compId => {
      const comp = state.competencies[compId];
      if (comp && comp.coverage < 50) {
        objectives.push(`Collect evidence for "${comp.name}" competency`);
      }
    });

    // 3. Stage-specific objectives
    const stage = state.strategy.currentStage;
    if (stage === 'Experience Validation') {
      objectives.push('Validate candidate core domain expertise and background longevity');
    } else if (stage === 'Leadership Assessment') {
      objectives.push('Acquire strong leadership evidence regarding team guidance or ownership');
    } else if (stage === 'Problem Solving') {
      objectives.push('Test structured troubleshooting capability and technical depth under pressure');
    } else if (stage === 'Behavioral Assessment') {
      objectives.push('Seek measurable results and Star methodology structured metrics');
    } else if (stage === 'Motivation') {
      objectives.push('Determine long-term career alignment and company motivation criteria');
    }

    // 4. Default baseline if list is empty
    if (objectives.length === 0) {
      objectives.push('Gather general technical execution depth and team collaboration metrics');
    }

    state.currentObjectives = objectives;
    return objectives;
  }

  /**
   * Translates current objectives into specific, conversational directives for the question generator.
   */
  public static getNextQuestionDirective(state: RecruiterState): string {
    const objectives = state.currentObjectives;
    if (objectives.length === 0) {
      return "Maintain structured open-ended conversational exploration of candidate background.";
    }

    const primeObjective = objectives[0];

    if (primeObjective.includes('Resolve contradiction')) {
      const challenge = ContradictionEngine.getUnresolvedContradictionChallenge(state);
      return challenge 
        ? `POLITE CHALLENGE DIRECTIVE: ${challenge.challengeText}`
        : "Ask the candidate to clarify their previous statement to ensure accuracy.";
    }

    if (primeObjective.includes('Collect evidence for')) {
      return `OBJECTIVE: Target the specific competency specified in the objective: "${primeObjective}". Avoid hypothetical prompts; ask for a concrete past experience where they demonstrated this, and push for specific outcomes.`;
    }

    return `OBJECTIVE: ${primeObjective}. Guide the discussion to explore these key professional behaviors with professional rigor.`;
  }
}
