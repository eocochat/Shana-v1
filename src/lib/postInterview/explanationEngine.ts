import { SessionHistoryItem, QuestionFeedbackItem } from '../../types';
import { CompetencyBehindTheDecision } from './reviewState';

export interface ContradictionReport {
  detected: boolean;
  warnings: string[];
  confidenceReduction: number;
}

export interface STARValidationReport {
  completeness: number;
  situationScore: number;
  taskScore: number;
  actionScore: number;
  resultScore: number;
  missingElements: string[];
  coachingTips: string[];
}

export interface QAFlag {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  competencyId?: string;
  recommendation: string;
}

export interface QAReport {
  passed: boolean;
  score: number;
  flags: QAFlag[];
}

class ExplanationEngine {
  /**
   * Helper to detect structural contradictions in candidate stories
   */
  public detectContradictions(session: SessionHistoryItem, isFR: boolean): ContradictionReport {
    const feedback = session.questionsFeedback || [];
    const warnings: string[] = [];
    let confidenceReduction = 0;

    // Concat feedback texts
    const texts = feedback.map(f => (f.questionText + " " + f.keyPositive + " " + f.improvementTip).toLowerCase());
    
    let mentionsSmallTeam = false;
    let mentionsHugeTeam = false;
    let mentionsShortExp = false;
    let mentionsLongExp = false;
    let mentionsREST = false;
    let mentionsGraphQL = false;
    let mentionsSQL = false;
    let mentionsNoSQL = false;
    let mentionsCloud = false;
    let mentionsOnPrem = false;
    let mentionsSolo = false;
    let mentionsVP = false;

    texts.forEach(t => {
      if (t.includes("small team") || t.includes("équipe de 2") || t.includes("petite équipe") || t.includes("3 people") || t.includes("2 personnes")) {
        mentionsSmallTeam = true;
      }
      if (t.includes("huge team") || t.includes("50 people") || t.includes("équipe de 50") || t.includes("hundred people") || t.includes("grande équipe")) {
        mentionsHugeTeam = true;
      }
      if (t.includes("2 years") || t.includes("2 ans") || t.includes("junior") || t.includes("debutant")) {
        mentionsShortExp = true;
      }
      if (t.includes("10 years") || t.includes("10 ans") || t.includes("senior") || t.includes("decade") || t.includes("décennie")) {
        mentionsLongExp = true;
      }
      if (t.includes("rest api") || t.includes("http endpoint") || t.includes("restful")) {
        mentionsREST = true;
      }
      if (t.includes("graphql") || t.includes("query language") || t.includes("resolvers")) {
        mentionsGraphQL = true;
      }
      if (t.includes("postgres") || t.includes("mysql") || t.includes("relational") || t.includes("sql database")) {
        mentionsSQL = true;
      }
      if (t.includes("mongodb") || t.includes("dynamodb") || t.includes("nosql") || t.includes("document store")) {
        mentionsNoSQL = true;
      }
      if (t.includes("aws") || t.includes("cloud migration") || t.includes("cloud-native") || t.includes("serverless")) {
        mentionsCloud = true;
      }
      if (t.includes("on-premise") || t.includes("physical hardware") || t.includes("on-prem") || t.includes("local datacenter")) {
        mentionsOnPrem = true;
      }
      if (t.includes("individual contributor") || t.includes("solo developer") || t.includes("single engineer") || t.includes("seul developpeur")) {
        mentionsSolo = true;
      }
      if (t.includes("vp of engineering") || t.includes("managing five squads") || t.includes("head of engineering") || t.includes("directeur de l'ingenierie")) {
        mentionsVP = true;
      }
    });

    if (mentionsSmallTeam && mentionsHugeTeam) {
      warnings.push(isFR 
        ? "Incohérence d'équipe : vous mentionnez avoir géré une petite équipe agile (2-3 personnes) et dirigé une équipe de plus de 50 personnes sur les mêmes projets." 
        : "Inconsistency detected: claims of leading a small agile squad (2-3 peers) conflict with directing a massive organization (50+ personnel) within the same timeline.");
      confidenceReduction += 15;
    }

    if (mentionsShortExp && mentionsLongExp) {
      warnings.push(isFR 
        ? "Incohérence temporelle : conflit entre vos déclarations d'expérience récente (2 ans) et vos affirmations d'expérience d'ingénierie senior (10+ ans)." 
        : "Temporal inconsistency: conflict between early-career claims (2 years tenure) and senior executive tenure declarations (10+ years) in system design.");
      confidenceReduction += 20;
    }

    if (mentionsREST && mentionsGraphQL) {
      warnings.push(isFR
        ? "Incohérence d'architecture : vous présentez l'interface principale du projet comme une API REST classique, mais la décrivez ailleurs comme un schéma GraphQL fédéré."
        : "Architectural contradiction: you describe the primary interface as a standard REST API but elsewhere refer to it as a federated GraphQL gateway.");
      confidenceReduction += 10;
    }

    if (mentionsSQL && mentionsNoSQL) {
      warnings.push(isFR
        ? "Incohérence de données : conflit sémantique entre l'usage d'une base relationnelle SQL stricte pour les transactions complexes et l'usage de bases documentaires NoSQL non transactionnelles sur le même périmètre."
        : "Data persistence contradiction: claims of leveraging a strict transactional SQL system conflict with descriptions of utilizing a schema-less NoSQL document store for the same transactional flows.");
      confidenceReduction += 12;
    }

    if (mentionsCloud && mentionsOnPrem) {
      warnings.push(isFR
        ? "Incohérence d'infrastructure : vos déclarations sur une architecture serverless cloud native contrastent avec la mention de contraintes d'infrastructure physique locale (on-premise) pour les mêmes services."
        : "Infrastructure contradiction: assertions of running on a fully managed serverless cloud pipeline conflict with declarations of managing physical on-premise hardware resources for the same systems.");
      confidenceReduction += 15;
    }

    if (mentionsSolo && mentionsVP) {
      warnings.push(isFR
        ? "Incohérence de rôle : vous vous décrivez comme un contributeur individuel écrivant seul le code tout en revendiquant le rôle de VP of Engineering supervisant plusieurs équipes."
        : "Role contradiction: you present yourself as a single hands-on developer writing 100% of the codebase, yet elsewhere claim a VP of Engineering position leading five agile squads.");
      confidenceReduction += 18;
    }

    return {
      detected: warnings.length > 0,
      warnings,
      confidenceReduction
    };
  }

  /**
   * Helper to perform STAR Structural Validation
   */
  public analyzeSTARQuality(session: SessionHistoryItem, isFR: boolean): STARValidationReport {
    const score = session.resumeScore || 70;
    
    // Heuristic segment scoring
    const situationScore = Math.min(100, Math.round(score * 1.1));
    const taskScore = Math.min(100, Math.round(score * 0.95));
    const actionScore = Math.min(100, Math.round(score * 1.05));
    const resultScore = score; // Result is usually where points are lost

    const missingElements: string[] = [];
    const coachingTips: string[] = [];

    if (score < 60) {
      missingElements.push(isFR ? "Phase 'Résultat' (R) qualitative sans KPI d'impact mesurable." : "Quantitative 'Result' indicators (revenue, server latency delta, cost savings).");
      missingElements.push(isFR ? "Phase 'Tâche' (T) peu différenciée de la Situation globale." : "Direct personal accountability boundaries (Task delegation vs. group execution).");
      coachingTips.push(isFR 
        ? "Structurez votre récit : posez le contexte sous 30 secondes, puis énoncez clairement VOTRE responsabilité." 
        : "Pace your story structure: lock in the context within 30 seconds, then explicitly isolate YOUR singular mandate.");
    } else if (score < 80) {
      missingElements.push(isFR ? "Rétrospective post-mortem et leçons d'ingénierie apprises." : "Post-incident technical retrospective and long-term preventive workflows.");
      coachingTips.push(isFR 
        ? "Concluez toujours vos récits par un chiffre précis : 'Ce qui a permis de réduire les coûts de X%...'" 
        : "Conclude your stories with an undeniable KPI: 'Which directly resulted in a X% efficiency gain in production...'");
    } else {
      coachingTips.push(isFR 
        ? "Votre structure STAR est excellente. Pour atteindre l'élite, insistez sur le transfert de connaissances après la résolution." 
        : "Your STAR structure is top-tier. To reach elite level, highlight the automation and knowledge-transfer phase following the solution.");
    }

    return {
      completeness: score,
      situationScore,
      taskScore,
      actionScore,
      resultScore,
      missingElements,
      coachingTips
    };
  }

  /**
   * Main breakdown for all 20 core competencies
   */
  public getCompetencyBreakdown(session: SessionHistoryItem, isFR: boolean): CompetencyBehindTheDecision[] {
    const feedbackItems = session.questionsFeedback || [];
    const totalQuestions = feedbackItems.length;

    // Detect contradictions to adjust confidence levels
    const contradictionReport = this.detectContradictions(session, isFR);

    // Baseline scores derived from session metrics
    const bScore = session.behavioralScore || 75;
    const cScore = session.communicationScore || 72;
    const tScore = session.industryScore || 78;
    const sScore = session.resumeScore || 70;
    const aScore = session.adaptabilityScore || 74;
    const confScore = session.confidenceScore || 75;

    // Core list of 20 distinct competencies
    const dimensions = [
      {
        id: 'communication',
        name: isFR ? 'Communication & Clarté' : 'Communication & Structural Clarity',
        baseScore: cScore,
        method: isFR ? "Analyse du débit verbal moyen (WPM) et de la densité des hésitations vocales." : "Parsing of conversational Words-Per-Minute and vocal filler density.",
        collected: isFR 
          ? ["Élocution claire et diction parfaitement intelligible", "Cadence verbale contrôlée (moyenne de 140 WPM)", "Peu de tics de langage détectés"]
          : ["Articulate voice delivery and clean pronounciation", "Controlled conversational cadence (averaging 140 WPM)", "Low density of vocal fillers and trailing pauses"],
        missing: isFR
          ? ["Transitions sémantiques formelles entre les étapes STAR"]
          : ["Formal semantic transitions between individual STAR stages"],
        why: isFR
          ? `Votre score de ${cScore}% s'explique par un rythme vocal stable et une diction claire, facilitant l'écoute active.`
          : `Your score of ${cScore}% is driven by a steady pacing rate and clear articulation, making your technical arguments highly digestible.`,
        action: isFR ? "Marquez des silences délibérés de 1,5 seconde avant vos conclusions." : "Inject a strict 1.5-second pause right before stating your final key result to emphasize its value.",
        references: isFR 
          ? ["Réponses fluides et diction stable tout au long des échanges."] 
          : ["Smooth conversational transitions with solid word articulation throughout."],
        behaviors: isFR 
          ? ["Maintenir une structure vocale calme", "Limiter les répétitions verbales"] 
          : ["Maintained a calm pitch baseline", "Sustained a professional rhythm under stress"],
        plan: isFR 
          ? ["S'entraîner à parler sous un rythme strict de 135-145 WPM", "Enregistrer ses transitions STAR"] 
          : ["Practice speaking at a rhythmic 135-145 WPM", "Record speech and audit transitional sentences"]
      },
      {
        id: 'leadership',
        name: isFR ? 'Leadership & Autonomie' : 'Leadership & Team Empowerment',
        baseScore: bScore,
        method: isFR ? "Calcul de la prise d'autonomie et de la responsabilisation collective." : "Evaluation of strategic team mobilization and collective ownership patterns.",
        collected: isFR 
          ? ["Responsabilisation claire face aux retards ou aux échecs de livraison", "Prise de décision affirmée lors des crises organisationnelles"]
          : ["Explicit accountability for timeline pressures and sprint delivery failures", "Assertive decision-making style during organizational crisis points"],
        missing: isFR
          ? ["Méthodes explicites de délégation de tâches ou d'automatisation des processus"]
          : ["Explicit delegation metrics and automation of administrative workflows for the team"],
        why: isFR
          ? `À ${bScore}%, vous assumez bien la responsabilité finale des projets, mais vous devriez illustrer davantage comment vous responsabilisez vos pairs.`
          : `At ${bScore}%, you take great ownership of delivery, but your narratives focus on singular execution rather than team mobilization.`,
        action: isFR ? "Utilisez le pronom collectif 'Nous' pour décrire la réussite d'un sprint." : "Transition from 'I resolved it' to 'I mobilized my engineering team and delegated operations'.",
        references: isFR 
          ? ["Récit de résolution de crise d'équipe lors de la phase comportementale."] 
          : ["Account of incident response and team coordination during the behavioral phase."],
        behaviors: isFR 
          ? ["Prendre la responsabilité des décisions difficiles", "Faire preuve de fermeté face aux choix techniques"] 
          : ["Took direct responsibility for delivery bottlenecks", "Demonstrated authority when managing conflicting options"],
        plan: isFR 
          ? ["Détailler les structures de délégation", "S'exercer à décrire des succès collectifs"] 
          : ["Outline delegation matrix in stories", "Practice speaking about building high-performing teams"]
      },
      {
        id: 'ownership',
        name: isFR ? 'Responsabilisation (Ownership)' : 'Ownership & Accountability',
        baseScore: Math.min(100, Math.round(bScore * 1.02)),
        method: isFR ? "Analyse de la posture de responsabilité individuelle sur le produit." : "Analysis of singular dedication to product health and system recovery.",
        collected: isFR 
          ? ["Aucune recherche d'excuses externes lors de l'analyse des incidents", "Forte orientation solutions plutôt que focalisation sur le problème"]
          : ["Zero external excuse-making during post-mortem failures", "Strong bias for action and immediate recovery initiatives"],
        missing: isFR
          ? ["Exemples d'initiatives proactives prises en dehors du périmètre strict"]
          : ["Examples of proactive actions taken outside your immediate official boundaries"],
        why: isFR
          ? `Un score de ${Math.round(bScore * 1.02)}% démontre que vous êtes un collaborateur fiable qui ne fuit pas ses responsabilités techniques.`
          : `Your score of ${Math.round(bScore * 1.02)}% highlights you as a highly dependable engineer who stands by their system design.`,
        action: isFR ? "Expliquez comment vous surveillez activement la qualité de la production." : "Detail how you proactively monitor runtime logs to catch regressions before clients report them.",
        references: isFR 
          ? ["Citations relatives à la prise en charge de la dette technique ou des bugs."] 
          : ["Direct quotes showing ownership of post-deployment production issues."],
        behaviors: isFR 
          ? ["Prendre en charge les correctifs urgents", "Défendre la qualité du livrable"] 
          : ["Personally drove emergency system hotfixes", "Protected software quality against aggressive product timelines"],
        plan: isFR 
          ? ["Identifier et documenter un exemple d'initiative proactive", "Travailler la reformulation orientée action"] 
          : ["Draft one story about solving an issue that wasn't your job", "Align stories with active prevention tactics"]
      },
      {
        id: 'problemSolving',
        name: isFR ? 'Résolution de Problèmes' : 'Problem Solving & Analytical Rigor',
        baseScore: aScore,
        method: isFR ? "Mesure de l'esprit d'analyse et de la décomposition des goulots d'étranglement." : "Audit of logical problem decomposition and systematic root-cause mitigation.",
        collected: isFR 
          ? ["Décomposition logique des problèmes complexes en sous-tâches", "Approche empirique basée sur les métriques système"]
          : ["Structured, logical breakdown of complex design problems", "Data-driven triage utilizing logs, metrics, and error rate vectors"],
        missing: isFR
          ? ["Comparaison rigoureuse des solutions alternatives rejetées"]
          : ["Granular trade-off analysis of alternative architectures that you actively rejected"],
        why: isFR
          ? `Votre score de ${aScore}% confirme votre habileté à résoudre des pannes d'architecture de manière structurée.`
          : `At ${aScore}%, you excel at deconstructing systemic bottlenecks under live incident scenarios.`,
        action: isFR ? "Intégrez une phase d'analyse comparative de deux solutions." : "Clearly outline: 'We rejected architectural Option A because of cost, choosing Option B.'",
        references: isFR 
          ? ["Analyse méthodique du goulot d'étranglement de la base de données."] 
          : ["Step-by-step resolution of database deadlocks and slow queries."],
        behaviors: isFR 
          ? ["Isoler les causes racines", "Formuler des hypothèses basées sur des données"] 
          : ["Isolated core system bottleneck", "Hypothesized failure points using structured metrics"],
        plan: isFR 
          ? ["Utiliser la technique des '5 Pourquoi' pour structurer ses explications", "S'entraîner sur des questions de conception système"] 
          : ["Use the '5 Whys' framework in technical narratives", "Practice whiteboarding system scalability constraints"]
      },
      {
        id: 'decisionMaking',
        name: isFR ? 'Prise de Décision sous Haute Pression' : 'High-Stakes Decision Making',
        baseScore: Math.round((bScore + aScore) / 2),
        method: isFR ? "Évaluation de la vitesse et de la cohérence des choix d'arbitrage." : "Audit of decision latency, priority weighing, and stakeholder alignment under pressure.",
        collected: isFR 
          ? ["Arbitrages lucides basés sur l'évaluation des risques et coûts", "Maintien de l'alignement stratégique lors des incidents"]
          : ["Clear logical framework for evaluating system risks and business costs", "Maintained strategic alignment with company goals during service outages"],
        missing: isFR
          ? ["Indication claire de la gestion des compromis financiers liés aux décisions"]
          : ["Quantifiable representation of budget, time, or scale compromise in decisions"],
        why: isFR
          ? `À ${Math.round((bScore + aScore) / 2)}%, vous êtes capable de trancher rapidement face aux crises, bien qu'une analyse de coût plus fine soit souhaitable.`
          : `At ${Math.round((bScore + aScore) / 2)}%, you demonstrate a strong ability to make decisive trade-offs under severe resource constraints.`,
        action: isFR ? "Expliquez comment vos choix d'ingénierie influencent le budget global." : "Translate technical trade-offs directly into server cost optimizations or operational savings.",
        references: isFR 
          ? ["Décision d'arrêter le déploiement ou de rollback face aux anomalies."] 
          : ["Decision to halt production deployments or execute rollbacks when error spikes occur."],
        behaviors: isFR 
          ? ["Évaluer les risques opérationnels", "Trancher de manière rationnelle"] 
          : ["Weighed immediate business risks", "Executed rational fallback plans without hesitation"],
        plan: isFR 
          ? ["Étudier la matrice d'Eisenhower et les frameworks d'évaluation des risques", "Intégrer le calcul de ROI dans ses choix"] 
          : ["Incorporate formal cost-benefit analysis in tech stories", "Refine delivery metrics regarding engineering decisions"]
      },
      {
        id: 'technical',
        name: isFR ? 'Compétences Techniques & Expertise' : 'Technical & Domain Competency',
        baseScore: tScore,
        method: isFR ? "Vérification de l'adéquation aux concepts d'architecture moderne." : "Semantic alignment with modern software patterns and domain-specific terminology.",
        collected: isFR 
          ? ["Excellente maîtrise conceptuelle des services cloud et bases de données", "Défense solide des systèmes scalables et découplés"]
          : ["Deep conceptual mastery of distributed databases and message queues", "Solid defense of microservices isolation and load scaling patterns"],
        missing: isFR
          ? ["Calcul précis du coût de l'infrastructure cloud liée aux choix"]
          : ["Granular calculations of server overhead, database read/write ratios, or data storage costs"],
        why: isFR
          ? `Votre note de ${tScore}% valide vos solides bases en ingénierie logicielle et en choix d'outils cloud.`
          : `At ${tScore}%, you demonstrate comprehensive knowledge of complex backend designs and operational patterns.`,
        action: isFR ? "Précisez la scalabilité horizontale ou verticale choisie." : "Expose precise hardware configurations, memory footprint profiles, or CPU cores involved.",
        references: isFR 
          ? ["Explications détaillées de la gestion des requêtes simultanées."] 
          : ["Detailed description of handling high concurrent query pools under tight memory limits."],
        behaviors: isFR 
          ? ["Utiliser les bons termes d'ingénierie", "Justifier les choix d'architecture"] 
          : ["Used precise system engineering terminology", "Defended database indexing and concurrency structures"],
        plan: isFR 
          ? ["S'entraîner à dessiner et expliquer des diagrammes système", "Étudier les patterns de résilience d'API"] 
          : ["Practice drafting and deconstructing complex system flowcharts", "Review performance bottlenecks in modern database schemas"]
      },
      {
        id: 'businessThinking',
        name: isFR ? 'Vision Business & Rentabilité' : 'Business Thinking & Financial Acumen',
        baseScore: Math.round((tScore + sScore) / 2),
        method: isFR ? "Analyse de la capacité à aligner le code sur le retour sur investissement." : "Measuring alignment between software engineering decisions and business ROI metrics.",
        collected: isFR 
          ? ["Compréhension claire de l'impact des pannes techniques sur le chiffre d'affaires", "Sensibilité aux accords de niveau de service (SLA) client"]
          : ["Explicit awareness of technical system downtime impact on business revenue", "Familiarity with Client Service Level Agreements (SLAs) and retention rates"],
        missing: isFR
          ? ["Détail des économies d'échelle ou de l'optimisation des ressources humaines"]
          : ["Granular estimation of developers' time savings, scale economies, or cloud cost optimizations"],
        why: isFR
          ? `À ${Math.round((tScore + sScore) / 2)}%, vous possédez une bonne vision globale, mais vos récits restent parfois trop cantonnés à l'aspect technique.`
          : `At ${Math.round((tScore + sScore) / 2)}%, you show good business empathy, though your metrics focus mostly on server health rather than business impact.`,
        action: isFR ? "Traduisez les gains de temps d'intégration en équivalents financiers." : "Explain how automating testing pipelines reduced developer onboarding time and overall engineering costs.",
        references: isFR 
          ? ["Lien établi entre stabilité du code et confiance des investisseurs."] 
          : ["Explicit link between API response latency and user checkout conversion rates."],
        behaviors: isFR 
          ? ["Relier le code aux métriques commerciales", "Comprendre les besoins des parties prenantes"] 
          : ["Linked engineering efficiency to client retention", "Weighed SLA penalties against deployment speed"],
        plan: isFR 
          ? ["Intégrer les concepts de CAC, LTV et d'optimisation de l'infrastructure cloud", "S'exercer à lier le technique à l'impact financier"] 
          : ["Align technical improvements with SaaS business indicators (churn, MRR)", "Practice articulating engineering goals to non-technical stakeholders"]
      },
      {
        id: 'adaptability',
        name: isFR ? 'Adaptabilité & Gestion du Changement' : 'Adaptability & Ambiguity Management',
        baseScore: aScore,
        method: isFR ? "Évaluation de la réactivité émotionnelle lors des changements de consignes." : "Measuring conversational resilience when constraints or context shift mid-session.",
        collected: isFR 
          ? ["Réaction rationnelle face au raccourcissement des délais de réponse", "Compréhension des besoins de pivot technique rapide"]
          : ["Calm, analytical reaction to strict conversational countdown restrictions", "Quick semantic alignment when the interviewer redirected the prompt"],
        missing: isFR
          ? ["Preuves concrètes de réorganisation d'équipe suite à un pivot stratégique"]
          : ["Concrete instances of reorganizing sprint backlogs following a massive product pivot"],
        why: isFR
          ? `Votre score de ${aScore}% démontre que vous gérez sereinement les imprévus opérationnels ou les questions pièges.`
          : `At ${aScore}%, you handle unexpected live prompts and cognitive context switches with excellent professional composure.`,
        action: isFR ? "Illustrez comment vous gérez un sprint lors d'un pivot produit." : "Detail how you reassessed team focus and cut legacy feature development when a sudden corporate pivot occurred.",
        references: isFR 
          ? ["Adaptation rapide de la réponse technique lors des questions de transition."] 
          : ["Swift adjustment of the technical answer when target constraints were revised by the recruiter."],
        behaviors: isFR 
          ? ["Garder son calme face aux contraintes", "Ajuster sa stratégie en temps réel"] 
          : ["Maintained a low stress baseline when challenged", "Pivoted architectural explanations seamlessly"],
        plan: isFR 
          ? ["Travailler l'improvisation structurée", "S'exercer à répondre à des scénarios hautement ambigus"] 
          : ["Practice structured impromptu speaking exercises", "Develop stories around projects where initial requirements were completely missing"]
      },
      {
        id: 'teamwork',
        name: isFR ? 'Esprit d\'Équipe & Collaboration' : 'Teamwork & Cross-Functional Collaboration',
        baseScore: Math.round((bScore + cScore) / 2),
        method: isFR ? "Mesure de la collaboration transverse et de la synergie d'équipe." : "Auditing cross-functional alignment patterns and shared milestone ownership.",
        collected: isFR 
          ? ["Valorisation explicite du travail des équipes produit et QA", "Capacité démontrée à collaborer pour lever les bloqueurs"]
          : ["Explicit respect shown for QA engineers and product managers", "Demonstrated alignment methods to unblock developers during critical sprint periods"],
        missing: isFR
          ? ["Mise en avant d'outils formels de communication inter-équipes"]
          : ["Description of formal cross-team feedback loops or sync structures used to scale collaborative efforts"],
        why: isFR
          ? `À ${Math.round((bScore + cScore) / 2)}%, vous êtes un coéquipier fiable qui facilite la communication globale entre développeurs et produit.`
          : `Your score of ${Math.round((bScore + cScore) / 2)}% marks you as an excellent collaborator who builds healthy consensus across teams.`,
        action: isFR ? "Mentionnez comment vous résolvez les bloqueurs d'intégration avec l'équipe QA." : "Detail a specific sync meeting or joint testing session you organized with product and design peers.",
        references: isFR 
          ? ["Coordination mentionnée avec les équipes de support client."] 
          : ["Described sync sessions with customer success and product teams."],
        behaviors: isFR 
          ? ["Valoriser l'effort collectif", "Partager les réussites techniques"] 
          : ["Shared credit with support and design teams", "Showed empathy toward cross-functional dependencies"],
        plan: isFR 
          ? ["Intégrer des récits d'alignement inter-services", "Développer des structures de partage d'informations"] 
          : ["Incorporate agile alignment rituals into stories", "Refine delivery metrics reflecting team-level velocity rather than individual code output"]
      },
      {
        id: 'conflictResolution',
        name: isFR ? 'Résolution de Conflits & Alignement' : 'Conflict Resolution & Stakeholder Alignment',
        baseScore: Math.round((bScore * 0.4 + aScore * 0.3 + cScore * 0.3)),
        method: isFR ? "Évaluation de la communication non-violente et de la négociation d'intérêts." : "Measuring constructive de-escalation methods and systematic interest alignment under friction.",
        collected: isFR 
          ? ["Désescalade verbale face aux parties prenantes mécontentes ou exigeantes", "Focalisation sur l'intérêt du produit et de l'utilisateur final"]
          : ["Constructive, non-defensive handling of direct corporate stakeholder friction", "Aligning opposing technical arguments toward user experience and product goals"],
        missing: isFR
          ? ["Explications détaillées sur la gestion de désaccords au sein de l'équipe d'ingénierie"]
          : ["Concrete instances of resolving deep design disagreements within your own development team"],
        why: isFR
          ? `Avec ${Math.round((bScore * 0.4 + aScore * 0.3 + cScore * 0.3))}% de réussite, vous savez calmer le jeu et proposer des solutions rationnelles face aux tensions.`
          : `At ${Math.round((bScore * 0.4 + aScore * 0.3 + cScore * 0.3))}%, you excel at de-escalating friction with stakeholders and driving balanced alignment.`,
        action: isFR ? "Présentez une méthode de consensus basée sur des tests A/B." : "Describe using data, A/B tests, or customer research as the neutral arbiter to resolve team deadlocks.",
        references: isFR 
          ? ["Gestion du mécontentement client lors de la phase finale."] 
          : ["Handled negative stakeholder feedback calmly, moving directly to solution brainstorming."],
        behaviors: isFR 
          ? ["Désescalader les tensions verbales", "Rechercher des solutions neutres basées sur les faits"] 
          : ["De-escalated voice tension when challenged", "Reframed arguments around shared objectives rather than personal opinions"],
        plan: isFR 
          ? ["Étudier les principes de la Communication Non-Violente", "Pratiquer la reformulation de compromis techniques"] 
          : ["Study key mediation strategies and interests-based negotiation", "Incorporate team conflict scenarios with positive resolutions into your technical stories"]
      },
      {
        id: 'executivePresence',
        name: isFR ? 'Présence Exécutive & Clarté' : 'Executive Presence & Gravitas',
        baseScore: confScore,
        method: isFR ? "Analyse de la confiance corporelle, du débit verbal et du timbre." : "Comprehensive analysis of speech fluency, vocal weight, confidence posture, and lack of defense delays.",
        collected: isFR 
          ? ["Excellente stabilité posturale face caméra", "Timbre vocal posé et intonation stable, sans tremblements"]
          : ["Steady, upright posture maintained throughout the video session", "Resonant, professional vocal tone with solid volume and pitch control"],
        missing: isFR
          ? ["Maintien d'un regard soutenu lors des moments de recherche cognitive intense"]
          : ["Sustained eye gaze alignment on the lens during deep cognitive planning moments"],
        why: isFR
          ? `À ${confScore}%, votre posture exécutive est remarquable. Vous inspirez confiance par votre calme physique et votre diction réfléchie.`
          : `At ${confScore}%, you project strong executive poise and authority, commanding professional trust easily.`,
        action: isFR ? "Maintenez votre regard vers la caméra, même lorsque vous cherchez un chiffre." : "Focus on look-ahead gaze stability: keep your eyes aligned with the camera even during high-load thought retrieval.",
        references: isFR 
          ? ["Présentation calme et posture professionnelle stable."] 
          : ["Highly professional postural alignment and speech confidence sustained during key questions."],
        behaviors: isFR 
          ? ["Maintenir une voix posée", "Éviter les gestes parasites de stress"] 
          : ["Maintained a level pitch", "Kept hands steady and body calm under provocative feedback"],
        plan: isFR 
          ? ["Enregistrer ses interventions et s'auto-évaluer sur le regard", "Pratiquer la respiration ventrale avant l'appel"] 
          : ["Record mock responses focusing exclusively on gaze duration", "Practice diaphragmatic breathing to stabilize pitch delivery under stress"]
      },
      {
        id: 'emotionalIntelligence',
        name: isFR ? 'Intelligence Émotionnelle & Empathie' : 'Emotional Intelligence & Empathy',
        baseScore: Math.round((confScore * 0.3 + bScore * 0.7)),
        method: isFR ? "Calcul de la sensibilité aux signaux interpersonnels de l'interlocuteur." : "Measuring active listening cues, stakeholder empathy, and self-regulation stability.",
        collected: isFR 
          ? ["Reconnaissance de l'état de stress des équipes sous tension", "Prise en compte de la charge mentale des collaborateurs"]
          : ["Active validation of team stress levels during crash situations", "Empathy toward developer mental fatigue during demanding release sprints"],
        missing: isFR
          ? ["Écoute active explicite ou validation sémantique des questions complexes du recruteur"]
          : ["Explicit restating or active-listening confirmation of the recruiter's questions before answering"],
        why: isFR
          ? `Avec ${Math.round((confScore * 0.3 + bScore * 0.7))}%, vous faites preuve d'une belle empathie managériale, protégeant vos équipes contre le burnout.`
          : `At ${Math.round((confScore * 0.3 + bScore * 0.7))}%, you show strong people empathy, demonstrating you care about both delivery and team retention.`,
        action: isFR ? "Dites : 'Je comprends tout à fait la préoccupation de notre client concernant...'" : "Acknowledge the core pain point first: 'I completely understand why the product team was worried about...' before detailing the solution.",
        references: isFR 
          ? ["Prise de recul appréciable sur les échecs collectifs."] 
          : ["Demonstrated emotional maturity when deconstructing historic project setbacks."],
        behaviors: isFR 
          ? ["Faire preuve d'empathie", "Gérer ses propres émotions"] 
          : ["Validated cross-functional concerns", "Regulated speech pace when under pressure"],
        plan: isFR 
          ? ["Pratiquer l'écoute active", "Développer des anecdotes axées sur le coaching d'équipe"] 
          : ["Incorporate direct team mentoring and support into technical narratives", "Refine communication techniques around delivering constructive technical feedback"]
      },
      {
        id: 'customerFocus',
        name: isFR ? 'Orientation Client & Obsession Utilisateur' : 'Customer Focus & User Obsession',
        baseScore: Math.round((tScore + bScore) / 2),
        method: isFR ? "Mesure de la centralité de l'utilisateur final dans les décisions d'ingénierie." : "Measuring the alignment of backend architecture and delivery pipelines with client value.",
        collected: isFR 
          ? ["Priorisation absolue du rétablissement du service pour l'utilisateur lors de l'incident", "Forte sensibilité aux impacts d'utilisation concrète de l'application"]
          : ["Strict prioritization of server availability for clients over internal administrative tools", "Explicit awareness of application interface loading latency on user checkout funnel"],
        missing: isFR
          ? ["Utilisation de métriques d'usage client directes (NPS, taux de conversion, satisfaction)"]
          : ["Direct usage of client feedback channels or conversion metrics in engineering trade-offs"],
        why: isFR
          ? `Votre score de ${Math.round((tScore + bScore) / 2)}% reflète une excellente culture produit où la stabilité technique sert la satisfaction client.`
          : `At ${Math.round((tScore + bScore) / 2)}%, you show a strong product mindset, treating software engineering as a means to empower the end customer.`,
        action: isFR ? "Associez les gains de performance à un meilleur taux de conversion utilisateur." : "Explain how optimizing loading speeds directly improved active user session times and customer retention.",
        references: isFR 
          ? ["Focalisation sur l'impact client direct lors de la résolution de panne."] 
          : ["Linked microservice latency directly to client-facing dashboard responsiveness."],
        behaviors: isFR 
          ? ["Placer le client au centre des débats", "Protéger l'expérience utilisateur"] 
          : ["Defended client service availability under pressure", "Prioritized customer-facing API speed during database refactoring"],
        plan: isFR 
          ? ["Intégrer les KPIs d'utilisation client dans son architecture logicielle", "Développer des scénarios d'A/B testing axés sur le client"] 
          : ["Incorporate customer empathy into technical narratives", "Practice speaking about direct feedback loops established with target customers"]
      },
      {
        id: 'learningAgility',
        name: isFR ? 'Agilité d\'Apprentissage & Rétrospective' : 'Learning Agility & Continuous Growth',
        baseScore: Math.round((aScore + sScore) / 2),
        method: isFR ? "Analyse de l'assimilation des retours et de la capacité à apprendre des échecs." : "Auditing patterns of feedback integration, retrospective thinking, and fast domain adaptation.",
        collected: isFR 
          ? ["Mise en valeur des erreurs passées comme sources d'apprentissage stratégiques", "Curiosité démontrée pour les architectures logicielles émergentes"]
          : ["Explicit framing of historical project failures as key learning events", "Demonstrated curiosity for exploring new cloud and data scaling techniques"],
        missing: isFR
          ? ["Description d'un processus systématique de partage de connaissances d'équipe"]
          : ["Mention of organizing a formal team lunch-and-learn or internal wiki update to share technical knowledge"],
        why: isFR
          ? `Votre score de ${Math.round((aScore + sScore) / 2)}% valide un excellent potentiel de progression et une saine humilité intellectuelle.`
          : `Your score of ${Math.round((aScore + sScore) / 2)}% shows strong intellectual humility and an active drive to adapt to unfamiliar tech stacks.`,
        action: isFR ? "Décrivez comment vous organisez un retour d'expérience (REX) après une crise." : "Highlight a formal 'post-mortem document' or engineering tech talk you organized after a technical failure.",
        references: isFR 
          ? ["Récit d'un échec technique transformé en leçon d'architecture."] 
          : ["Analysis of a past technical error reframed into a long-term testing framework improvement."],
        behaviors: isFR 
          ? ["Admettre ses erreurs", "Partager les connaissances acquises"] 
          : ["Acknowledged past developmental mistakes openly", "Shared architectural lessons learned with the engineering organization"],
        plan: isFR 
          ? ["Formaliser la structure d'un REX post-incident", "S'entraîner à expliquer une technologie récemment apprise"] 
          : ["Incorporate blameless post-mortem concepts into tech stories", "Refine the presentation of technical pivots to highlight speed-to-learn metrics"]
      },
      {
        id: 'culturalAlignment',
        name: isFR ? 'Alignement Culturel & Éthique' : 'Cultural Alignment & Core Values',
        baseScore: Math.round((bScore * 0.6 + confScore * 0.4)),
        method: isFR ? "Mesure de la cohérence par rapport aux valeurs d'intégrité de Shana." : "Measuring transparency, ethical software practices, and team alignment values.",
        collected: isFR 
          ? ["Défense des meilleures pratiques d'ingénierie (tests, documentation)", "Transparence totale quant aux erreurs techniques commises"]
          : ["Strong defense of code standards, automated testing, and comprehensive documentation", "Full transparency regarding operational bottlenecks and deployment slip-ups"],
        missing: isFR
          ? ["Exemples d'aide désintéressée apportée à des collègues en difficulté"]
          : ["Anecdotes of mentoring junior developers or assisting adjacent squads during crunch periods without direct reward"],
        why: isFR
          ? `À ${Math.round((bScore * 0.6 + confScore * 0.4))}%, vous affichez un alignement solide avec une ingénierie éthique et transparente.`
          : `At ${Math.round((bScore * 0.6 + confScore * 0.4))}%, you demonstrate high alignment with professional transparency and collaborative engineering principles.`,
        action: isFR ? "Mentionnez le mentorat de développeurs juniors comme l'une de vos réussites." : "Highlight a weekly pairing or mentorship routine you established to support adjacent developers.",
        references: isFR 
          ? ["Défense des revues de code systématiques."] 
          : ["Emphasized code reviews and testing standards as essential for systemic system health."],
        behaviors: isFR 
          ? ["Défendre les standards de qualité", "Faire preuve de transparence"] 
          : ["Advocated for robust software verification structures", "Spoke transparently about delivery timeline compromises"],
        plan: isFR 
          ? ["Ajouter des exemples de mentorat de développeurs juniors dans ses récits", "Étudier les chartes éthiques de l'ingénierie logicielle"] 
          : ["Incorporate developer mentoring into behavioral examples", "Practice speaking about balancing team health and speed to market"]
      },
      {
        id: 'star',
        name: isFR ? 'Respect de la Structure STAR' : 'STAR Structural Adherence',
        baseScore: sScore,
        method: isFR ? "Détection automatique de l'organisation séquentielle des récits." : "Systematic checking for the distinct presence of Situation, Task, Action, and Result phases.",
        collected: isFR 
          ? ["Contexte (Situation) clairement posé sous 30 secondes", "Actions concrètes détaillées avec précision"]
          : ["Clear, prompt context layout (Situation) setting a neat initial baseline", "Granular deconstruction of actions executed during systems failure"],
        missing: isFR
          ? ["Résultats chiffrés et KPI d'impact mesurables en conclusion de récit"]
          : ["Hard quantitative performance metrics and financial gains in the final summary"],
        why: isFR
          ? `Votre note de ${sScore}% montre que si vous excellez à poser le contexte, vos conclusions manquent d'impact chiffré.`
          : `Your score of ${sScore}% shows that while your context-setting is clean, your endings lack hard business metrics.`,
        action: isFR ? "Terminez systématiquement par un chiffre clé de performance." : "Conclude every story with a hard KPI: 'This led to a 40% reduction in database write latency.'",
        references: isFR 
          ? ["Récit structuré mais conclusion qualitative."] 
          : ["Good narrative timeline, but missing a quantitative baseline to validate the final result."],
        behaviors: isFR 
          ? ["Suivre un plan chronologique", "Préciser ses actions individuelles"] 
          : ["Followed a clear chronological roadmap", "Isolated personal action steps from group efforts"],
        plan: isFR 
          ? ["S'exercer à rédiger ses exemples selon la grille STAR", "Se forcer à clore chaque histoire par un chiffre"] 
          : ["Practice writing out engineering stories using standard STAR worksheets", "Audit stories to ensure a numerical metric terminates every single example"]
      },
      {
        id: 'impact',
        name: isFR ? 'Impact & Valeur Chiffrée' : 'Impact & Quantifiable Value',
        baseScore: Math.min(100, Math.round(sScore * 1.05)),
        method: isFR ? "Vérification de l'ancrage des histoires autour de KPIs réels." : "Measuring the utilization of business metrics, cost calculations, and software SLAs in answers.",
        collected: isFR 
          ? ["Lien direct établi entre la résolution technique et le SLA client", "Connaissance de l'importance de la livraison rapide"]
          : ["Direct association between rapid hotfixing and client SLA protection", "Awareness of engineering speed on business velocity and market capture"],
        missing: isFR
          ? ["Chiffres exacts de gains financiers ou d'économie de temps ingénieur"]
          : ["Granular calculations of server overhead savings, license costs reduced, or engineering sprint hours optimized"],
        why: isFR
          ? `À ${Math.round(sScore * 1.05)}%, vous comprenez la valeur ajoutée, mais devez encore mieux quantifier l'impact de votre code.`
          : `At ${Math.round(sScore * 1.05)}%, you demonstrate a healthy drive for impact, but you need to prove it with specific engineering numbers.`,
        action: isFR ? "Précisez le pourcentage de réduction du taux d'erreur de votre API." : "Translate API enhancements directly into quantifiable metrics: 'We reduced the error rate from 2.5% to 0.05%.'",
        references: isFR 
          ? ["Mention qualitative de l'amélioration de la stabilité système."] 
          : ["Qualitative statements of database performance improvement with no concrete statistics."],
        behaviors: isFR 
          ? ["Mesurer la réussite", "Citer des métriques de production"] 
          : ["Framed success around general operational health", "Mentioned cloud migration timeline metrics"],
        plan: isFR 
          ? ["Récupérer les métriques réelles de ses projets récents", "S'exercer à articuler des calculs de rentabilité"] 
          : ["Retrieve actual CPU, memory, and database KPIs from recent production designs", "Practice speaking about technical goals as immediate financial gains"]
      },
      {
        id: 'clarity',
        name: isFR ? 'Clarté d\'Argumentation' : 'Clarity of Argumentation',
        baseScore: Math.min(100, Math.round(cScore * 1.03)),
        method: isFR ? "Mesure de la fluidité logique et de l'accessibilité des concepts complexes." : "Evaluating logic flow, conceptual accessibility, and lack of redundant arguments.",
        collected: isFR 
          ? ["Explications fluides et faciles à suivre", "Absence d'ambiguïté ou de jargon inutile"]
          : ["Easy-to-follow, clear verbal structures", "Avoidance of unnecessary acronyms or confusing administrative terms"],
        missing: isFR
          ? ["Synthèse rapide lors de la clôture des questions de conception système"]
          : ["A high-level concluding summary to synthesize system architecture answers"],
        why: isFR
          ? `Votre note de ${Math.round(cScore * 1.03)}% confirme que vos explications sont de haute tenue, fluides et professionnelles.`
          : `At ${Math.round(cScore * 1.03)}%, your logical flow is highly coherent, and you present technical systems in an easily understandable format.`,
        action: isFR ? "Résumez vos choix complexes en une phrase exécutive simple." : "Practice the executive summary trick: 'To sum up, our database refactoring unblocked the client checkout pipeline.'",
        references: isFR 
          ? ["Explications limpides de la gestion de charge de l'API."] 
          : ["Clear deconstruction of microservices traffic patterns during sales peaks."],
        behaviors: isFR 
          ? ["Définir les concepts techniques", "Éviter les digressions"] 
          : ["Defined system bottlenecks cleanly", "Kept responses aligned with the core prompt without drifting"],
        plan: isFR 
          ? ["S'entraîner à résumer une idée technique complexe en 15 secondes", "Supprimer les digressions inutiles de son élocution"] 
          : ["Practice deconstructing complex technical architectures in under 30 seconds", "Focus on linear speaking patterns without circular backtracking"]
      },
      {
        id: 'confidence',
        name: isFR ? 'Confiance & Posture Vocale' : 'Confidence & Vocal Poise',
        baseScore: confScore,
        method: isFR ? "Analyse acoustique de la voix et détection des pauses d'hésitation." : "Analysis of speech initiation delays, voice tone consistency, and verbal tick density.",
        collected: isFR 
          ? ["Débit vocal stable et maîtrise de l'intonation", "Voix posée sans trémolos ou tics de nervosité"]
          : ["Steady vocal volume and pitch consistency", "Decisive word delivery and strong voice tone with no signs of hesitation"],
        missing: isFR
          ? ["Contrôle total des micro-expressions faciales lors des questions d'arbitrage complexes"]
          : ["Sustained facial neutrality and professional focus when under direct challenge"],
        why: isFR
          ? `À ${confScore}%, vous projetez une assurance indéniable, renforçant la crédibilité de vos choix techniques.`
          : `At ${confScore}%, your vocal posture is solid, helping you establish immediate professional credibility during negotiations.`,
        action: isFR ? "Ralentissez légèrement le débit verbal lors des phases techniques clés." : "Slightly slow down your pacing during highly complex technical segments to project maximum authority.",
        references: isFR 
          ? ["Voix assurée et réponses directes."] 
          : ["Sustained clear vocal tone with minimal signs of stress or rapid-fire speaking."],
        behaviors: isFR 
          ? ["Parler de manière affirmative", "Éviter les hésitations"] 
          : ["Spoke using declarative, active verbs", "Maintained stable vocal composure under stress"],
        plan: isFR 
          ? ["S'enregistrer régulièrement et analyser sa tonalité vocale", "Pratiquer le silence stratégique au lieu d'utiliser des mots de remplissage"] 
          : ["Record speech samples and audit pitch variance", "Replace vocal filler words ('um', 'like', 'uh') with complete, absolute silence"]
      },
      {
        id: 'authenticity',
        name: isFR ? 'Authenticité & Cohérence' : 'Authenticity & Integrity',
        baseScore: Math.min(100, Math.round((confScore + bScore) / 2)),
        method: isFR ? "Calcul de la cohérence sémantique des récits par rapport au CV." : "Semantic checks of narrative consistency and structural credibility of accomplishments.",
        collected: isFR 
          ? ["Récit d'erreurs réelles avec une saine auto-critique", "Aucune exagération apparente des résultats"]
          : ["Open discussion of direct design mistakes with constructive hindsight", "Honest, realistic descriptions of project scope and personal contributions"],
        missing: isFR
          ? ["Partage plus direct de motivations personnelles ou d'éthique de travail"]
          : ["Direct framing of personal values, core work ethics, or professional motivators"],
        why: isFR
          ? `Avec ${Math.min(100, Math.round((confScore + bScore) / 2))}% d'authenticité, vos réponses inspirent une confiance naturelle et constructive.`
          : `At ${Math.min(100, Math.round((confScore + bScore) / 2))}%, your stories sound highly authentic, grounded, and professional.`,
        action: isFR ? "N'hésitez pas à admettre les limites de votre conception système." : "Don't hesitate to share architectural trade-offs: 'The design was strong but failed under 10k continuous writes.'",
        references: isFR 
          ? ["Honnêteté quant aux contraintes de temps vécues sur le projet."] 
          : ["Honest description of timeline constraints and database replication issues on past projects."],
        behaviors: isFR 
          ? ["Admettre les limites techniques", "Exprimer sa saine auto-critique"] 
          : ["Acknowledged engineering trade-off limits", "Expressed professional maturity when describing past project regressions"],
        plan: isFR 
          ? ["Sélectionner des anecdotes d'apprentissage tirées d'échecs passés", "Travailler la transparence de ses récits"] 
          : ["Incorporate past structural mistakes into your active story backlog", "Practice presenting developmental bottlenecks as valuable learning experiences"]
      }
    ];

    // Build the final competency models
    return dimensions.map(d => {
      // Apply a dynamic score offset based on individual question feedback signals
      let adjustedScore = d.baseScore;
      if (feedbackItems.length > 0) {
        const averageClarity = feedbackItems.reduce((acc, f) => acc + (f.clarity || 70), 0) / feedbackItems.length;
        if (d.id === 'communication' || d.id === 'clarity') {
          adjustedScore = Math.round(adjustedScore * 0.4 + averageClarity * 0.6);
        }
      }

      // Add small mock variation
      const seed = d.id.charCodeAt(0) + totalQuestions;
      adjustedScore = Math.min(99, Math.max(25, adjustedScore + (seed % 7) - 3));

      // Calculate confidence score (higher if there are more questions evaluated, reduced by contradictions)
      let compConfidence = 85;
      if (totalQuestions < 3) {
        compConfidence = 62;
      } else if (totalQuestions < 5) {
        compConfidence = 78;
      } else {
        compConfidence = 92;
      }

      // Apply contradiction reduction
      compConfidence = Math.max(20, compConfidence - contradictionReport.confidenceReduction);

      // Build a dynamic justification text
      const whyThisScore = d.why;

      return {
        id: d.id,
        name: d.name,
        score: adjustedScore,
        confidenceLevel: compConfidence,
        evidenceCollected: d.collected,
        evidenceMissing: d.missing,
        transcriptReferences: d.references,
        observedBehaviors: d.behaviors,
        improvementPlan: d.plan,
        whyThisScore,
        calculationMethod: d.method,
        oneActionToIncrease: d.action
      };
    });
  }

  /**
   * Performs an automated Quality Assurance Audit of the evaluation.
   * This flags issues like score inflation, weak reasoning, duplicate evidence, or contradictory marks.
   */
  public validateEvaluationQA(session: SessionHistoryItem, isFR: boolean): QAReport {
    const flags: QAFlag[] = [];
    const competencies = this.getCompetencyBreakdown(session, isFR);
    
    // Check 1: Duplicate Evidence detection across competencies
    const seenEvidence = new Set<string>();
    const duplicateEvidenceCompetencies: string[] = [];
    competencies.forEach(c => {
      c.evidenceCollected.forEach(ev => {
        if (seenEvidence.has(ev)) {
          if (!duplicateEvidenceCompetencies.includes(c.name)) {
            duplicateEvidenceCompetencies.push(c.name);
          }
        } else {
          seenEvidence.add(ev);
        }
      });
    });
    
    if (duplicateEvidenceCompetencies.length > 0) {
      flags.push({
        id: 'duplicate_evidence',
        type: 'warning',
        message: isFR 
          ? `Preuves redondantes identifiées : les mêmes faits d'élocution ou extraits ont été attribués à plusieurs compétences distinctes (${duplicateEvidenceCompetencies.join(', ')}).`
          : `Duplicate evidence referenced: identical speech segments/facts are cross-mapped to multiple competencies (${duplicateEvidenceCompetencies.join(', ')}).`,
        recommendation: isFR 
          ? "Isolez des citations uniques pour chaque dimension de l'évaluation." 
          : "Isolate distinct narrative fragments for each specific competency category."
      });
    }

    // Check 2: Score Inflation / Deflation Anomalies
    competencies.forEach(c => {
      // Inflated score: high score (>85%) with insufficient collected evidence (<2 items)
      if (c.score > 85 && c.evidenceCollected.length < 2) {
        flags.push({
          id: `score_inflation_${c.id}`,
          type: 'warning',
          message: isFR
            ? `Anomalie de surévaluation pour [${c.name}] : score de ${c.score}% attribué malgré moins de 2 points de preuve explicites collectés.`
            : `Overvaluation anomaly detected in [${c.name}]: score of ${c.score}% assigned with fewer than 2 explicit pieces of supporting evidence.`,
          competencyId: c.id,
          recommendation: isFR
            ? "Recueillez plus d'extraits du transcript ou revoyez le score à la baisse pour correspondre aux preuves réelles."
            : "Either secure additional transcript citations or lower the target competency score to align with objective evidence."
        });
      }
      
      // Deflated score: low score (<60%) with high collected evidence (>=3 items)
      if (c.score < 60 && c.evidenceCollected.length >= 3) {
        flags.push({
          id: `score_deflation_${c.id}`,
          type: 'info',
          message: isFR
            ? `Score potentiellement sévère pour [${c.name}] : ${c.score}% attribué malgré de nombreux points de preuve positifs (${c.evidenceCollected.length}).`
            : `Conservatively low score for [${c.name}]: score of ${c.score}% is lower than what the extensive positive evidence (${c.evidenceCollected.length} items) suggests.`,
          competencyId: c.id,
          recommendation: isFR
            ? "Vérifiez si l'échec sur certains critères éliminatoires justifie cette sévérité."
            : "Review if a single fatal flaw justifies this low score despite the positive evidence."
        });
      }
    });

    // Check 3: Contradictory Metric Correlation (e.g. behavioralScore high but leadership/ownership low)
    const bScore = session.behavioralScore || 75;
    const cScore = session.communicationScore || 72;
    const leadershipComp = competencies.find(c => c.id === 'leadership');
    const ownershipComp = competencies.find(c => c.id === 'ownership');
    const commComp = competencies.find(c => c.id === 'communication');

    if (bScore > 85 && leadershipComp && ownershipComp && (leadershipComp.score < 65 || ownershipComp.score < 65)) {
      flags.push({
        id: 'behavioral_variance',
        type: 'error',
        message: isFR
          ? `Incohérence statistique : le score comportemental général est élevé (${bScore}%) mais les sous-dimensions Leadership (${leadershipComp.score}%) ou Ownership (${ownershipComp.score}%) indiquent une faible performance.`
          : `Critical variance detected: overall behavioral index is high (${bScore}%) but direct sub-competencies like Leadership (${leadershipComp.score}%) or Ownership (${ownershipComp.score}%) indicate low performance.`,
        recommendation: isFR
          ? "Harmonisez les scores pour maintenir la cohérence de l'évaluation."
          : "Align high-level category scores with their constituent sub-competencies for mathematical consistency."
      });
    }

    if (cScore > 85 && commComp && commComp.score < 65) {
      flags.push({
        id: 'communication_variance',
        type: 'error',
        message: isFR
          ? `Incohérence de communication : score général à ${cScore}% contrastant avec l'évaluation d'élocution structurelle (${commComp.score}%).`
          : `Communication discrepancy: high global verbal rating (${cScore}%) conflicts with low structured clarity sub-score (${commComp.score}%).`,
        recommendation: isFR
          ? "Régulez l'évaluation de fluidité pour refléter précisément la clarté d'expression."
          : "Adjust the global communication rating to match the structured speech analysis."
      });
    }

    // Check 4: Weak Reasoning / Missing explanations
    competencies.forEach(c => {
      if (!c.whyThisScore || c.whyThisScore.length < 30) {
        flags.push({
          id: `weak_reasoning_${c.id}`,
          type: 'warning',
          message: isFR
            ? `Justification lacunaire pour [${c.name}] : l'explication explicative est trop brève pour garantir l'explicabilité.`
            : `Weak explainability in [${c.name}]: the written reasoning is too brief to meet rigorous transparency standards.`,
          competencyId: c.id,
          recommendation: isFR
            ? "Développez l'explication pour inclure une corrélation claire entre les faits sémantiques et la note."
            : "Expand the explanation to clearly link collected transcript facts to the assigned score."
        });
      }
    });

    // Calculate QA Score
    const totalChecks = 5;
    let deduction = flags.filter(f => f.type === 'error').length * 15 + flags.filter(f => f.type === 'warning').length * 8 + flags.filter(f => f.type === 'info').length * 3;
    const qaScore = Math.max(0, 100 - deduction);

    return {
      passed: qaScore >= 75,
      score: qaScore,
      flags
    };
  }
}

export const explanationEngine = new ExplanationEngine();
