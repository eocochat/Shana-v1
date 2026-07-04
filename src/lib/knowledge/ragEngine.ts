import { GraphStateManager } from './graphState';
import { SemanticSearch } from './semanticSearch';
import { RoleGraph } from './roleGraph';
import { CompanyGraph } from './companyGraph';
import { IndustryGraph } from './industryGraph';
import { CompetencyGraph } from './competencyGraph';

export interface RagContextPack {
  competenciesText: string;
  roleExpectationsText: string;
  companyPhilosophyText: string;
  industryExpectationsText: string;
  formattedPromptContext: string;
}

export const RagEngine = {
  /**
   * Retrieves structural graph knowledge and formats it as a rich context block for LLM prompts.
   */
  getKnowledgeContext(params: {
    roleIdOrName?: string;
    companyIdOrName?: string;
    industryIdOrName?: string;
    generalQuery?: string;
  }): RagContextPack {
    const state = GraphStateManager.getGraphState();
    
    let targetRoleNode = null;
    let targetCompanyNode = null;
    let targetIndustryNode = null;

    // 1. Resolve role from graph
    if (params.roleIdOrName) {
      const cleanRole = params.roleIdOrName.toLowerCase();
      targetRoleNode = Object.values(state.nodes).find(
        n => n.type === 'role' && (n.id.toLowerCase() === cleanRole || n.label.toLowerCase().includes(cleanRole))
      );
    }

    // 2. Resolve company from graph
    if (params.companyIdOrName) {
      const cleanCo = params.companyIdOrName.toLowerCase();
      targetCompanyNode = Object.values(state.nodes).find(
        n => n.type === 'company' && (n.id.toLowerCase() === cleanCo || n.label.toLowerCase().includes(cleanCo))
      );
    }

    // 3. Resolve industry from graph
    if (params.industryIdOrName) {
      const cleanInd = params.industryIdOrName.toLowerCase();
      targetIndustryNode = Object.values(state.nodes).find(
        n => n.type === 'industry' && (n.id.toLowerCase() === cleanInd || n.label.toLowerCase().includes(cleanInd))
      );
    }

    // If company exists but industry is empty, follow its edge connection to find industry
    if (targetCompanyNode && !targetIndustryNode) {
      const edge = state.edges.find(e => e.source === targetCompanyNode?.id && e.type === 'belongs_to');
      if (edge && state.nodes[edge.target]) {
        targetIndustryNode = state.nodes[edge.target];
      }
    }

    // 4. Retrieve competencies connected to the resolved role
    let competenciesList: string[] = [];
    if (targetRoleNode) {
      const expected = RoleGraph.getExpectedCompetencies(targetRoleNode.id);
      competenciesList = expected.map(exp => {
        const desc = exp.node.data.description || '';
        return `- ${exp.node.label} (Importance weight: ${Math.round(exp.weight * 100)}%): ${desc}`;
      });
    } else {
      // Fallback: list some key global competencies
      competenciesList = CompetencyGraph.getCompetencies().slice(0, 4).map(c => `- ${c.label}: ${c.data.description || ''}`);
    }

    // 5. Query semantic search for any additional general query to retrieve contextually linked nodes
    let semanticMatchesText = '';
    if (params.generalQuery) {
      const semanticResults = SemanticSearch.search(params.generalQuery, 3);
      if (semanticResults.length > 0) {
        semanticMatchesText = '\n--- SEMANTIC SEARCH GRAPH RELATIONSHIPS ---\n' + 
          semanticResults.map(res => `* Node: ${res.node.label} (${res.node.type}) - Match Explanation: ${res.matchExplanation}`).join('\n');
      }
    }

    // 6. Build text paragraphs
    const competenciesText = competenciesList.join('\n');
    
    const roleExpectationsText = targetRoleNode 
      ? `Role: ${targetRoleNode.label}\n- Style: ${targetRoleNode.data.style}\n- Difficulty target: ${targetRoleNode.data.difficulty}\n- Common Pitfalls to Watch: ${targetRoleNode.data.commonMistakes?.join(', ')}`
      : 'No specific role expectation registered. Evaluate with standard multi-role star compliance.';

    const companyPhilosophyText = targetCompanyNode
      ? `Company: ${targetCompanyNode.label}\n- Hiring Philosophy: ${targetCompanyNode.data.hiringPhilosophy}\n- Core Evaluated Values: ${targetCompanyNode.data.coreValues?.join(', ')}\n- Technical & Cultural Style: ${targetCompanyNode.data.interviewStyle}`
      : 'Standard company philosophy. Focus on direct and authentic candidate responses.';

    const industryExpectationsText = targetIndustryNode
      ? `Industry context: ${targetIndustryNode.label}\n- Behavioral expectancies: ${targetIndustryNode.data.behaviorExpectation}\n- Technical expectancies: ${targetIndustryNode.data.technicalExpectation}`
      : 'General modern corporate industry context.';

    // Compile into final formatted XML-like RAG Prompt Block
    const formattedPromptContext = `
[SHANA KNOWLEDGE GRAPH RETRIEVED CONTEXT]
The following proprietary knowledge was retrieved from SHANA's Intelligence Core. Use it to contextualize and inform evaluations, follow-up questions, and feedback generation:

--- ROLE LEVEL PROTOCOL ---
${roleExpectationsText}

--- COGNITIVE COMPETENCY MAP ---
These core dimensions must anchor the conversation:
${competenciesText}

--- TARGET COMPANY & VALUE SYSTEM ---
${companyPhilosophyText}

--- TARGET INDUSTRY EXPECTATIONS ---
${industryExpectationsText}
${semanticMatchesText}
[END RETRIEVED CONTEXT]
`;

    return {
      competenciesText,
      roleExpectationsText,
      companyPhilosophyText,
      industryExpectationsText,
      formattedPromptContext
    };
  }
};
