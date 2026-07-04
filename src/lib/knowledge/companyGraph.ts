import { GraphNode, GraphEdge } from './graphTypes';
import { GraphStateManager } from './graphState';

export const CompanyGraph = {
  getCompanies(): GraphNode[] {
    const state = GraphStateManager.getGraphState();
    return Object.values(state.nodes).filter(node => node.type === 'company');
  },

  getCompany(id: string): GraphNode | null {
    const state = GraphStateManager.getGraphState();
    const node = state.nodes[id];
    return node && node.type === 'company' ? node : null;
  },

  addOrUpdateCompany(
    id: string,
    name: string,
    philosophy: string,
    coreValues: string[],
    interviewStyle: string
  ): void {
    const node: GraphNode = {
      id,
      type: 'company',
      label: name,
      data: {
        hiringPhilosophy: philosophy,
        coreValues,
        interviewStyle
      },
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateNode(node);
  },

  linkCompanyToIndustry(companyId: string, industryId: string, weight: number = 1.0): void {
    const edge: GraphEdge = {
      id: `edge_${companyId}_belongs_to_${industryId}`,
      source: companyId,
      target: industryId,
      type: 'belongs_to',
      weight,
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateEdge(edge);
  }
};
