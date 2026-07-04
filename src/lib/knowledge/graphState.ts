import { GraphNode, GraphEdge, KnowledgeGraphState, GraphNodeType, GraphEdgeType } from './graphTypes';

const GRAPH_STORAGE_KEY = 'shana_knowledge_graph_state_v1';

const defaultCompetencies = [
  { id: 'comp_leadership', name: 'Leadership', desc: 'Ability to guide teams, foster ownership, and direct strategic initiatives.' },
  { id: 'comp_problem_solving', name: 'Problem Solving', desc: 'Analytical thinking, structural troubleshooting, and architectural decision making.' },
  { id: 'comp_communication', name: 'Communication', desc: 'Clarity of presentation, structured articulation (STAR method), and active listening.' },
  { id: 'comp_conflict_resolution', name: 'Conflict Resolution', desc: 'Navigating peer disagreements, engineering trade-offs, and alignment.' },
  { id: 'comp_ownership', name: 'Ownership', desc: 'End-to-end responsibility, proactive remediation, and post-mortem accountability.' },
  { id: 'comp_decision_making', name: 'Decision Making', desc: 'Sizing trade-offs, data-backed risk analysis, and timely execution.' },
  { id: 'comp_customer_focus', name: 'Customer Focus', desc: 'Empathy for user pain points, SLA commitment, and value-driven delivery.' },
  { id: 'comp_executive_presence', name: 'Executive Presence', desc: 'Composure under pressure, stakeholder alignment, and professional gravitas.' },
  { id: 'comp_technical_skills', name: 'Technical Skills', desc: 'Core system design, algorithmic trade-offs, and domain-specific excellence.' },
  { id: 'comp_negotiation', name: 'Negotiation', desc: 'Win-win settlement, scope balancing, and vendor/contract resolution.' }
];

const defaultRoles = [
  { id: 'role_backend', name: 'Backend Engineer', expectations: ['Technical Skills', 'Problem Solving'], style: 'Highly technical and algorithmic-focused', difficulty: 'hard' },
  { id: 'role_frontend', name: 'Frontend Engineer', expectations: ['Technical Skills', 'Communication', 'Customer Focus'], style: 'User-centric and design-system focused', difficulty: 'medium' },
  { id: 'role_data_scientist', name: 'Data Scientist', expectations: ['Problem Solving', 'Technical Skills', 'Decision Making'], style: 'Mathematical and analytics-heavy', difficulty: 'hard' },
  { id: 'role_pm', name: 'Product Manager', expectations: ['Leadership', 'Communication', 'Customer Focus', 'Decision Making'], style: 'Strategic, customer-centric and product-sense heavy', difficulty: 'hard' },
  { id: 'role_ux_designer', name: 'UX Designer', expectations: ['Customer Focus', 'Communication'], style: 'Visual, empathetic and portfolio-intensive', difficulty: 'medium' },
  { id: 'role_sales', name: 'Sales Manager', expectations: ['Communication', 'Negotiation', 'Executive Presence'], style: 'Relational, high-energy and outcome-driven', difficulty: 'medium' },
  { id: 'role_nurse', name: 'Nurse', expectations: ['Communication', 'Decision Making', 'Conflict Resolution'], style: 'Highly empathetic, protocol-driven and speed-focused', difficulty: 'medium' },
  { id: 'role_accountant', name: 'Accountant', expectations: ['Problem Solving', 'Ownership'], style: 'Detail-oriented, compliance-first and analytical', difficulty: 'easy' },
  { id: 'role_teacher', name: 'Teacher', expectations: ['Communication', 'Leadership', 'Conflict Resolution'], style: 'Pedagogical, patience-focused and highly structured', difficulty: 'easy' },
  { id: 'role_lawyer', name: 'Lawyer', expectations: ['Negotiation', 'Communication', 'Decision Making'], style: 'Highly logical, rhetorical and precision-heavy', difficulty: 'hard' }
];

const defaultIndustries = [
  { id: 'ind_tech', name: 'Technology', behavior: 'Fast-paced, iterative, high adaptability expectations', technical: 'System scalability, algorithmic mastery' },
  { id: 'ind_healthcare', name: 'Healthcare', behavior: 'High empathy, safety-first compliance, precision communication', technical: 'Diagnostics, regulatory standards' },
  { id: 'ind_finance', name: 'Finance', behavior: 'Analytical, risk-aware, rigorous process adherence', technical: 'Quantitative analysis, fiscal prudence' },
  { id: 'ind_retail', name: 'Retail', behavior: 'Fast-paced, customer-first, operational agility', technical: 'Supply chain, inventory optimization' },
  { id: 'ind_hospitality', name: 'Hospitality', behavior: 'Exceptional service, conflict de-escalation, flexibility', technical: 'Event management, guest service' },
  { id: 'ind_education', name: 'Education', behavior: 'Developmental focus, multi-stakeholder management', technical: 'Curriculum design, cognitive pedagogy' }
];

const defaultCompanies = [
  { id: 'co_google', name: 'Google', philosophy: 'Googlyness, technical scale, analytical rigor', values: ['Respect user', 'Respect opportunity', 'Respect each other'], style: 'Algorithmic & architectural depth' },
  { id: 'co_amazon', name: 'Amazon', philosophy: 'Customer obsession, 16 Leadership Principles', values: ['Customer Obsession', 'Ownership', 'Bias for Action'], style: 'Writing-focused, behavioral STAR-heavy' },
  { id: 'co_microsoft', name: 'Microsoft', philosophy: 'Growth mindset, massive cross-collaboration', values: ['Growth Mindset', 'Diverse & Inclusive', 'One Microsoft'], style: 'Functional excellence & collaborative problem-solving' },
  { id: 'co_apple', name: 'Apple', philosophy: 'Design perfection, deep secrecy, product passion', values: ['Design', 'Quality', 'Innovation'], style: 'Detail-oriented, high-fidelity engineering' },
  { id: 'co_meta', name: 'Meta', philosophy: 'Move fast, focus on long-term impact', values: ['Move Fast', 'Be Bold', 'Build Awesome Things'], style: 'High velocity, flat hierarchy, systemic scale' },
  { id: 'co_netflix', name: 'Netflix', philosophy: 'Freedom and responsibility, stunning colleagues', values: ['Judgment', 'Communication', 'Impact', 'Courage'], style: 'High ownership, performance-centric' },
  { id: 'co_stripe', name: 'Stripe', philosophy: 'First-principles, rigorous writing, operational excellence', values: ['Users First', 'Rigorous Thinking', 'Move Fast'], style: 'Peer engineering, system design and written focus' },
  { id: 'co_airbnb', name: 'Airbnb', philosophy: 'Belong anywhere, design-led product thinking', values: ['Champion the Mission', 'Be a Cereal Entrepreneur', 'Be a Host'], style: 'Relational, visual and values alignment' }
];

const defaultQuestions = [
  { id: 'q_conflict_star', text: 'Tell me about a time you resolved a major conflict on your team.', targetCompetency: 'comp_conflict_resolution', difficulty: 'medium' },
  { id: 'q_scale_limiter', text: 'How would you design a distributed, high-traffic rate limiter for an API platform?', targetCompetency: 'comp_technical_skills', difficulty: 'hard' },
  { id: 'q_fail_ownership', text: 'Describe a project you owned that failed. What did you do and what were your learnings?', targetCompetency: 'comp_ownership', difficulty: 'hard' },
  { id: 'q_leadership_direction', text: 'Tell me about a time you had to lead a project with vague or changing specifications.', targetCompetency: 'comp_leadership', difficulty: 'hard' },
  { id: 'q_trade_off_decision', text: 'Explain a scenario where you had to make an unpopular decision to protect product stability.', targetCompetency: 'comp_decision_making', difficulty: 'medium' },
  { id: 'q_customer_empathy', text: 'How do you handle a critical enterprise client who is demanding a feature outside your roadmap?', targetCompetency: 'comp_customer_focus', difficulty: 'medium' }
];

export class GraphStateManager {
  private static inMemoryState: KnowledgeGraphState | null = null;

  public static getGraphState(): KnowledgeGraphState {
    if (this.inMemoryState) {
      return this.inMemoryState;
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GRAPH_STORAGE_KEY);
      if (saved) {
        try {
          this.inMemoryState = JSON.parse(saved);
          return this.inMemoryState!;
        } catch (e) {
          console.error('[SHANA GraphState] Failed to parse saved knowledge graph, re-seeding.', e);
        }
      }
    }

    // Initialize with comprehensive pre-seeded data if empty
    const state = this.createSeededGraph();
    this.saveState(state);
    this.inMemoryState = state;
    return state;
  }

  public static saveState(state: KnowledgeGraphState): void {
    state.lastUpdated = new Date().toISOString();
    this.inMemoryState = state;
    if (typeof window !== 'undefined') {
      localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(state));
      // Dispatch update events to let view components re-render immediately
      const event = new CustomEvent('shana_knowledge_graph_updated', { detail: state });
      window.dispatchEvent(event);
    }
  }

  public static updateNode(node: GraphNode): void {
    const state = this.getGraphState();
    state.nodes[node.id] = {
      ...node,
      lastUpdated: new Date().toISOString()
    };
    this.saveState(state);
  }

  public static updateEdge(edge: GraphEdge): void {
    const state = this.getGraphState();
    const existingIndex = state.edges.findIndex(e => e.id === edge.id);
    const updatedEdge = {
      ...edge,
      lastUpdated: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      state.edges[existingIndex] = updatedEdge;
    } else {
      state.edges.push(updatedEdge);
    }
    
    // Refresh connections count for source and target
    this.recalculateConnectionsCount(state);
    this.saveState(state);
  }

  private static recalculateConnectionsCount(state: KnowledgeGraphState): void {
    // Reset
    Object.keys(state.nodes).forEach(nodeId => {
      state.nodes[nodeId].connectionsCount = 0;
    });

    // Sum up
    state.edges.forEach(edge => {
      if (state.nodes[edge.source]) {
        state.nodes[edge.source].connectionsCount = (state.nodes[edge.source].connectionsCount || 0) + 1;
      }
      if (state.nodes[edge.target]) {
        state.nodes[edge.target].connectionsCount = (state.nodes[edge.target].connectionsCount || 0) + 1;
      }
    });
  }

  private static createSeededGraph(): KnowledgeGraphState {
    const nodes: Record<string, GraphNode> = {};
    const edges: GraphEdge[] = [];
    const now = new Date().toISOString();

    // 1. Seed Competencies
    defaultCompetencies.forEach(comp => {
      nodes[comp.id] = {
        id: comp.id,
        type: 'competency',
        label: comp.name,
        data: {
          description: comp.desc,
          assessedCount: 145, // default simulation stats
          averageReadinessScore: 76
        },
        lastUpdated: now,
        connectionsCount: 0
      };
    });

    // 2. Seed Roles
    defaultRoles.forEach(role => {
      nodes[role.id] = {
        id: role.id,
        type: 'role',
        label: role.name,
        data: {
          style: role.style,
          difficulty: role.difficulty,
          commonMistakes: [
            'Lack of clear STAR structure',
            'Over-indexing on technical mechanics while skipping business context',
            'Failing to specify personal contributions'
          ]
        },
        lastUpdated: now,
        connectionsCount: 0
      };

      // Add edges from role to its expected competencies
      role.expectations.forEach(compName => {
        const foundComp = defaultCompetencies.find(c => c.name === compName);
        if (foundComp) {
          const edgeId = `edge_${role.id}_requires_${foundComp.id}`;
          edges.push({
            id: edgeId,
            source: role.id,
            target: foundComp.id,
            type: 'requires',
            weight: 0.85,
            lastUpdated: now
          });
        }
      });
    });

    // 3. Seed Industries
    defaultIndustries.forEach(ind => {
      nodes[ind.id] = {
        id: ind.id,
        type: 'industry',
        label: ind.name,
        data: {
          behaviorExpectation: ind.behavior,
          technicalExpectation: ind.technical
        },
        lastUpdated: now,
        connectionsCount: 0
      };
    });

    // 4. Seed Companies
    defaultCompanies.forEach(co => {
      nodes[co.id] = {
        id: co.id,
        type: 'company',
        label: co.name,
        data: {
          hiringPhilosophy: co.philosophy,
          coreValues: co.values,
          interviewStyle: co.style
        },
        lastUpdated: now,
        connectionsCount: 0
      };

      // Connect company to tech industry (all seeded companies are currently technology/startup based)
      const edgeId = `edge_${co.id}_belongs_to_ind_tech`;
      edges.push({
        id: edgeId,
        source: co.id,
        target: 'ind_tech',
        type: 'belongs_to',
        weight: 0.9,
        lastUpdated: now
      });
    });

    // 5. Seed Questions
    defaultQuestions.forEach(q => {
      nodes[q.id] = {
        id: q.id,
        type: 'question',
        label: q.text.substring(0, 40) + '...',
        data: {
          fullText: q.text,
          difficulty: q.difficulty,
          successRate: 64,
          effectivenessRating: 88
        },
        lastUpdated: now,
        connectionsCount: 0
      };

      // Connect Question to its target competency
      const edgeId = `edge_${q.id}_assesses_${q.targetCompetency}`;
      edges.push({
        id: edgeId,
        source: q.id,
        target: q.targetCompetency,
        type: 'assesses',
        weight: 0.95,
        lastUpdated: now
      });
    });

    // 6. Connect Competencies together to form the graph
    // e.g. Leadership connects to Communication and Decision Making
    const logicalConnections: { src: string; tgt: string; type: GraphEdgeType; weight: number }[] = [
      { src: 'comp_leadership', tgt: 'comp_communication', type: 'related_to', weight: 0.8 },
      { src: 'comp_leadership', tgt: 'comp_decision_making', type: 'related_to', weight: 0.85 },
      { src: 'comp_leadership', tgt: 'comp_conflict_resolution', type: 'related_to', weight: 0.75 },
      { src: 'comp_problem_solving', tgt: 'comp_technical_skills', type: 'related_to', weight: 0.9 },
      { src: 'comp_problem_solving', tgt: 'comp_decision_making', type: 'related_to', weight: 0.8 },
      { src: 'comp_communication', tgt: 'comp_executive_presence', type: 'related_to', weight: 0.85 },
      { src: 'comp_ownership', tgt: 'comp_leadership', type: 'related_to', weight: 0.7 }
    ];

    logicalConnections.forEach((conn, index) => {
      edges.push({
        id: `edge_comp_conn_${index}`,
        source: conn.src,
        target: conn.tgt,
        type: conn.type,
        weight: conn.weight,
        lastUpdated: now
      });
    });

    const state: KnowledgeGraphState = {
      nodes,
      edges,
      version: '1.0.0',
      lastUpdated: now
    };

    // Calculate connectionsCount
    edges.forEach(edge => {
      if (state.nodes[edge.source]) {
        state.nodes[edge.source].connectionsCount = (state.nodes[edge.source].connectionsCount || 0) + 1;
      }
      if (state.nodes[edge.target]) {
        state.nodes[edge.target].connectionsCount = (state.nodes[edge.target].connectionsCount || 0) + 1;
      }
    });

    return state;
  }
}
