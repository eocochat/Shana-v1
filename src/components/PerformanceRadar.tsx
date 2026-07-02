import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { SessionHistoryItem, Language } from '../types';
import { Award, Sparkles, Shield, Compass } from 'lucide-react';

interface PerformanceRadarProps {
  history: SessionHistoryItem[];
  lang: Language;
}

interface CompetencyData {
  axis: string;
  value: number; // 0 to 100
  labelEn: string;
  labelFr: string;
  descriptionEn: string;
  descriptionFr: string;
}

export default function PerformanceRadar({ history, lang }: PerformanceRadarProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredComp, setHoveredComp] = useState<CompetencyData | null>(null);

  // Compute actual scores based on user history logs
  const competencies: CompetencyData[] = useMemo(() => {
    const assessSessions = history.filter(h => h.type === 'ASSESS');
    const trainSessions = history.filter(h => h.type === 'TRAIN');

    // 1. Resolve Communication Score
    let communication = 55; // default baseline calibration value
    if (assessSessions.length > 0) {
      const vals = assessSessions.map(s => s.communicationScore || s.score).filter(Boolean);
      if (vals.length > 0) communication = Math.round(d3.mean(vals) || 55);
    } else if (trainSessions.length > 0) {
      const vals = trainSessions.map(s => s.score).filter(Boolean);
      if (vals.length > 0) communication = Math.round(d3.mean(vals) || 55);
    }

    // 2. Resolve Technical Knowledge (based on resume + industry relevance)
    let technical = 50;
    if (assessSessions.length > 0) {
      const vals = assessSessions.map(s => {
        const r = s.resumeScore || s.score;
        const i = s.industryScore || s.score;
        return (r + i) / 2;
      }).filter(Boolean);
      if (vals.length > 0) technical = Math.round(d3.mean(vals) || 50);
    }

    // 3. Resolve Pacing (based on confidence score + fluency metrics derived from practice sessions)
    let pacing = 50;
    if (assessSessions.length > 0) {
      const vals = assessSessions.map(s => s.confidenceScore || s.score).filter(Boolean);
      if (vals.length > 0) pacing = Math.round(d3.mean(vals) || 50);
    } else if (trainSessions.length > 0) {
      // Train sessions heavily measure vocal confidence and pacing
      const vals = trainSessions.map(s => s.confidenceScore || s.score || 60);
      pacing = Math.round(d3.mean(vals) || 50);
    }

    // 4. Resolve Behavioral Fit (based on structured answer alignment & situational adaptability)
    let behavioral = 52;
    if (assessSessions.length > 0) {
      const vals = assessSessions.map(s => s.behavioralScore || s.score).filter(Boolean);
      if (vals.length > 0) behavioral = Math.round(d3.mean(vals) || 52);
    }

    // 5. Resolve Analytical Flow (or structured STAR delivery method competence)
    let analytical = 48;
    if (assessSessions.length > 0) {
      const vals = assessSessions.map(s => s.adaptabilityScore || s.score).filter(Boolean);
      if (vals.length > 0) analytical = Math.round(d3.mean(vals) || 48);
    }

    return [
      {
        axis: 'communication',
        value: Math.min(100, Math.max(10, communication)),
        labelEn: 'Communication',
        labelFr: 'Élocution',
        descriptionEn: 'Vocal flow, grammar structure, pauses, and speech confidence.',
        descriptionFr: "Fluence vocale, clarté d'élocution, structure et présence verbale."
      },
      {
        axis: 'technical',
        value: Math.min(100, Math.max(10, technical)),
        labelEn: 'Technical Knowledge',
        labelFr: 'Compétence Métier',
        descriptionEn: 'Depth of engineering, role context, and resume alignment representation.',
        descriptionFr: "Profondeur métier, justification d'expérience et alignement CV."
      },
      {
        axis: 'pacing',
        value: Math.min(100, Math.max(10, pacing)),
        labelEn: 'Pacing / Flow',
        labelFr: 'Cadence et Débit',
        descriptionEn: 'Pacing, timing compliance, and structural response duration governance.',
        descriptionFr: 'Régulation temporelle des réponses et respect des durées de parole.'
      },
      {
        axis: 'behavioral',
        value: Math.min(100, Math.max(10, behavioral)),
        labelEn: 'Behavioral Fit',
        labelFr: 'Profil Culturel',
        descriptionEn: 'Familiarity with leadership parameters and team alignment benchmarks.',
        descriptionFr: "Aptitudes comportementales de leadership et fit d'équipe."
      },
      {
        axis: 'analytical',
        value: Math.min(100, Math.max(10, analytical)),
        labelEn: 'STAR Structure',
        labelFr: 'Structure STAR',
        descriptionEn: 'Rigorous STAR communication structure and contextual accuracy.',
        descriptionFr: 'Rigueur de formulation selon la méthodologie STAR robuste.'
      }
    ];
  }, [history]);

  // Handle setting default hover initial to communication when first loading
  useEffect(() => {
    if (competencies.length > 0) {
      setHoveredComp(competencies[0]);
    }
  }, [competencies]);

  // D3 radar drawing machine
  useEffect(() => {
    if (!svgRef.current || competencies.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 420;
    const height = 320;
    const padding = 65;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - padding;
    const totalAxes = competencies.length;

    const g = svg.append('g');

    // Radar circular background rings levels mapping
    const levels = 5;
    const ringScale = d3.scaleLinear().domain([0, levels]).range([0, radius]);

    // Draw grid concentric polygonal background lines
    for (let level = 1; level <= levels; level++) {
      const levelRadius = ringScale(level);
      const points: [number, number][] = [];

      for (let i = 0; i < totalAxes; i++) {
        const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
        points.push([
          centerX + levelRadius * Math.cos(angle),
          centerY + levelRadius * Math.sin(angle)
        ]);
      }

      // connect the last point to close loop
      if (points.length > 0) {
        g.append('polygon')
          .datum(points)
          .attr('points', d => d.map(p => p.join(',')).join(' '))
          .attr('fill', 'none')
          .attr('stroke', '#F3F4F6')
          .attr('stroke-width', 1.2);

        // Add numerical benchmark values labels along the vertical top axial line
        const topAngle = -Math.PI / 2;
        g.append('text')
          .attr('x', centerX + 8)
          .attr('y', centerY + levelRadius * Math.sin(topAngle) + 4)
          .attr('fill', '#9CA3AF')
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('font-size', '8px')
          .attr('font-weight', '600')
          .text(`${level * 20}`);
      }
    }

    // Draw individual spoke axes
    for (let i = 0; i < totalAxes; i++) {
      const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
      const axisX = centerX + radius * Math.cos(angle);
      const axisY = centerY + radius * Math.sin(angle);

      // Draw spoke line
      g.append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', axisX)
        .attr('y2', axisY)
        .attr('stroke', '#E5E7EB')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '2,2');

      // Coordinate placement of labels outside radius
      const labelDistance = radius + 15;
      const labelX = centerX + labelDistance * Math.cos(angle);
      const labelY = centerY + labelDistance * Math.sin(angle);

      // Sizing text anchor alignments perfectly based on angle quadrant positioning
      let textAnchor = 'middle';
      if (Math.cos(angle) > 0.1) textAnchor = 'start';
      else if (Math.cos(angle) < -0.1) textAnchor = 'end';

      const labelText = lang === 'EN' ? competencies[i].labelEn : competencies[i].labelFr;

      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY + 3)
        .attr('text-anchor', textAnchor)
        .attr('fill', '#4B5563')
        .attr('font-family', 'Inter, sans-serif')
        .attr('font-weight', '700')
        .attr('font-size', '9px')
        .style('cursor', 'pointer')
        .text(labelText)
        .on('mouseenter', () => setHoveredComp(competencies[i]));
    }

    // Draw active user radar shape values polygon
    const activePoints: [number, number][] = competencies.map((c, i) => {
      const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
      const distance = (c.value / 100) * radius;
      return [
        centerX + distance * Math.cos(angle),
        centerY + distance * Math.sin(angle)
      ];
    });

    // Outer shade shape area polygon
    g.append('polygon')
      .datum(activePoints)
      .attr('points', d => d.map(p => p.join(',')).join(' '))
      .attr('fill', 'rgba(79, 70, 229, 0.12)') // Indigo tone
      .attr('stroke', '#4F46E5') // Rich indigo
      .attr('stroke-width', 2.8)
      .attr('class', 'radar-active-polygon')
      .style('filter', 'drop-shadow(0px 3px 6px rgba(79,70,229,0.15))');

    // Draw data node circles on each vertex for detailed interaction
    competencies.forEach((c, i) => {
      const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
      const distance = (c.value / 100) * radius;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      // Vertex node bubble
      g.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 5.5)
        .attr('fill', 'white')
        .attr('stroke', '#4F46E5')
        .attr('stroke-width', 2.5)
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredComp(c));
    });

  }, [competencies, lang]);

  const hasRealData = history.some(h => h.type === 'ASSESS');

  return (
    <div 
      id="radar-competencies-card" 
      className="bg-white border-[2.5px] border-stone-950 rounded-[32px] p-6 shadow-[5px_5px_0px_0px_#111111] hover:shadow-[7px_7px_0px_0px_#111111] hover:translate-x-[-1.5px] hover:translate-y-[-1.5px] transition-all flex flex-col justify-between h-auto xl:h-full"
    >
      {/* Header info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#F3F4F6] pb-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-950 font-bold bg-[#FFD3D0] px-2.5 py-1 rounded-xl border-2 border-stone-950 leading-tight inline-block mb-1 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
            {lang === 'EN' ? "COMPETENCY BLUEPRINT" : "RÉFÉRENTIEL DE COMPÉTENCES"}
          </span>
          <h3 id="radar-heading" className="text-sm font-mono font-black text-[#111111] uppercase tracking-wider">
            {lang === 'EN' ? "Core Competency Radar" : "Radar de Compétences Métier"}
          </h3>
          <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">
            {lang === 'EN' ? "Interactive multi-axis performance balance mapping." : "Visualisation interactive de votre équilibre d'élocution et d'argumentaire."}
          </p>
        </div>

        {/* State visual indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F9FAFB] rounded-xl border-2 border-stone-950 font-mono text-[9px] font-black text-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
          {hasRealData ? (
            <>
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'EN' ? "VERIFIED PROTOCOL" : "SCORE CERTIFIÉ"}</span>
            </>
          ) : (
            <>
              <Compass className="w-3.5 h-3.5 text-[#5363F1] animate-spin" style={{ animationDuration: '3s' }} />
              <span>{lang === 'EN' ? "INITIAL CALIBRATION" : "ÉVALUATION INITIALE"}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 mt-4 flex-1 items-center xl:items-stretch w-full">
        {/* SVG visualizer container - takes up the left side or top */}
        <div className="w-full flex-1 aspect-[420/320] max-w-[420px] mx-auto flex items-center justify-center relative select-none">
          <svg
            ref={svgRef}
            viewBox="0 0 420 320"
            className="w-full h-full max-w-[420px] max-h-[320px]"
          />
        </div>

        {/* Competency detail card sidebar panel - takes up the right side or bottom */}
        <div className="w-full xl:w-[240px] shrink-0 flex flex-col justify-between gap-4">
          <div className="bg-[#FAFAFA] border-2 border-stone-950 p-5 rounded-[24px] space-y-3.5 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            {hoveredComp ? (
              <div className="space-y-3">
                <div className="flex justify-between items-baseline border-b-2 border-stone-150 pb-2">
                  <h4 className="text-xs font-mono font-black uppercase tracking-wider text-stone-950">
                    {lang === 'EN' ? hoveredComp.labelEn : hoveredComp.labelFr}
                  </h4>
                  <div className="text-sm font-mono font-black text-[#5363F1]">
                    {hoveredComp.value}%
                  </div>
                </div>

                <p className="text-[11px] text-stone-600 leading-relaxed font-bold">
                  {lang === 'EN' ? hoveredComp.descriptionEn : hoveredComp.descriptionFr}
                </p>

                {/* Progress bar mapping inside detail panel */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[8px] font-mono font-black text-stone-500 uppercase">
                    <span>{lang === 'EN' ? "CALIBRATION" : "ÉVALUATION"}</span>
                    <span>{hoveredComp.value >= 80 ? (lang === 'EN' ? "Strong" : "Excellent") : hoveredComp.value >= 60 ? (lang === 'EN' ? "Competent" : "Maîtrisé") : (lang === 'EN' ? "Developing" : "En cours")}</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 border border-stone-950 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="bg-[#5363F1] h-full rounded-full transition-all duration-500 border border-stone-950" 
                      style={{ width: `${hoveredComp.value}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-stone-400 font-mono font-bold uppercase">
                {lang === 'EN' ? "Hover Radar Axis or Labels" : "Survoler l'axe de votre choix"}
              </div>
            )}
          </div>

          <div className="bg-stone-950 text-stone-100 p-4 rounded-[24px] flex gap-2.5 border-2 border-stone-950">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
            <p className="text-[9.5px] font-mono font-extrabold uppercase tracking-wide leading-normal">
              {lang === 'EN' 
                ? "Formulate comprehensive STAR responses during full assessments to lift individual metric weights."
                : "Étoffez cette structure d'élocution ! Établissez des réponses de qualité basées sur la méthode STAR."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
