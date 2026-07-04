import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { SessionHistoryItem, Language } from '../types';
import { TrendingUp, Activity, Sparkles } from 'lucide-react';

interface ChartDataPoint {
  index: number;
  label: string;
  readiness: number;
  fluency: number;
  confidence: number;
  date: string;
  isReal: boolean;
}

interface ProgressChartProps {
  history: SessionHistoryItem[];
  lang: Language;
}

export default function ProgressChart({ history, lang }: ProgressChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 260 });
  const [activeMetric, setActiveMetric] = useState<'all' | 'readiness' | 'confidence'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  // Responsive container width tracking
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: Math.max(300, width),
          height: 260
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Data generator
  const data: ChartDataPoint[] = React.useMemo(() => {
    const points: ChartDataPoint[] = [
      {
        index: 0,
        label: lang === 'EN' ? "Baseline Calibration" : "Étalonnage de Départ",
        readiness: 55,
        fluency: 58,
        confidence: 50,
        date: lang === 'EN' ? "Calibration" : "Départ",
        isReal: false
      }
    ];

    // Filter and map real sessions chronologically (history is newest first, so we reverse it)
    const sortedHistory = [...history].reverse();
    
    sortedHistory.forEach((item, idx) => {
      const fluencyScore = item.score || 70; 
      const confidenceScore = item.confidenceScore || Math.min(95, Math.ceil(52 + (idx * 6) + (item.score - 55) * 0.25));
      const readinessScore = item.score;

      points.push({
        index: points.length,
        label: item.type === 'TRAIN'
          ? (lang === 'EN' ? `Voice Train #${idx + 1}` : `Session Vocale n°${idx + 1}`)
          : (lang === 'EN' ? `Assessment #${idx + 1}` : `Évaluation n°${idx + 1}`),
        readiness: readinessScore,
        fluency: fluencyScore,
        confidence: confidenceScore,
        date: item.date,
        isReal: true
      });
    });

    // If only baseline exists, add realistic target future milestone
    if (sortedHistory.length === 1) {
      points.push({
        index: 1,
        label: lang === 'EN' ? "Target Readiness Index" : "Indice d'Éligibilité Cible",
        readiness: 85,
        fluency: 88,
        confidence: 80,
        date: lang === 'EN' ? "Goal" : "Objectif",
        isReal: false
      });
    }

    return points;
  }, [history, lang]);

  // Update hover point initially to the latest
  useEffect(() => {
    if (data.length > 0) {
      setHoveredPoint(data[data.length - 1]);
    }
  }, [data]);

  // D3 Render Effect
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear canvas

    const margin = { top: 25, right: 35, bottom: 55, left: 45 };
    const chartWidth = dimensions.width - margin.left - margin.right;
    const chartHeight = dimensions.height - margin.top - margin.bottom;

    // Create the inner chart group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale - Point scale over string categories
    const xScale = d3.scalePoint<number>()
      .domain(data.map(d => d.index))
      .range([0, chartWidth])
      .padding(0.25);

    // Y scale - Index scores 0 to 100
    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);

    // Draw horizontal grid lines
    const yTicks = yScale.ticks(5);
    g.selectAll(".grid-line")
      .data(yTicks)
      .join("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", chartWidth)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "#F3F4F6")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");

    // Determine which ticks to show to prevent overlapping
    const maxTicks = dimensions.width < 450 ? 4 : 6;
    let tickValues = data.map(d => d.index);
    if (data.length > maxTicks) {
      const step = (data.length - 1) / (maxTicks - 1);
      const indices = new Set<number>();
      for (let i = 0; i < maxTicks; i++) {
        indices.add(Math.round(i * step));
      }
      tickValues = Array.from(indices).sort((a, b) => a - b);
    }

    // X Axis drawing
    const xAxis = d3.axisBottom(xScale)
      .tickValues(tickValues)
      .tickFormat((d) => {
        const item = data.find(p => p.index === d);
        return item ? item.date : "";
      });

    const xAxisGroup = g.append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(xAxis);

    xAxisGroup.select(".domain").attr("stroke", "#E5E7EB");
    xAxisGroup.selectAll(".tick line").attr("stroke", "#E5E7EB");
    xAxisGroup.selectAll(".tick text")
      .attr("fill", "#6B7280")
      .attr("font-family", "JetBrains Mono, ui-monospace, sans-serif")
      .attr("font-size", "9px")
      .attr("font-weight", "500")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-25)")
      .attr("dx", "-0.5em")
      .attr("dy", "0.5em");

    // Y Axis drawing
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    const yAxisGroup = g.append("g")
      .call(yAxis);

    yAxisGroup.select(".domain").remove(); // Hide main outline
    yAxisGroup.selectAll(".tick line").remove(); // Hide ticks as we have grid lines
    yAxisGroup.selectAll(".tick text")
      .attr("fill", "#6B7280")
      .attr("font-family", "JetBrains Mono, ui-monospace, sans-serif")
      .attr("font-size", "10px")
      .attr("font-weight", "500");

    // Line Generator
    const lineGenerator = (key: 'readiness' | 'fluency' | 'confidence') => {
      return d3.line<ChartDataPoint>()
        .x(d => xScale(d.index)!)
        .y(d => yScale(d[key]))
        .curve(d3.curveMonotoneX);
    };

    // Helper functions for drawing colored tracks
    const drawTrackLine = (
      key: 'readiness' | 'fluency' | 'confidence', 
      color: string
    ) => {
      // Split actual real data and mock goals/calibration mapping
      const hasRealPart = data.some(d => d.isReal);
      
      if (!hasRealPart) {
        // Draw the baseline to goal dashed path
        g.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 2.5)
          .attr("stroke-dasharray", "4,4")
          .attr("d", lineGenerator(key));
      } else {
        // Filter elements that are real or the base calibration point
        const realPoints = data.filter(d => d.index === 0 || d.isReal);
        g.append("path")
          .datum(realPoints)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 3)
          .attr("d", lineGenerator(key));
      }
    };

    // Draw lines depending on toggle
    if (activeMetric === 'all') {
      drawTrackLine('readiness', '#1A2B3C');
      drawTrackLine('confidence', '#10B981');
    } else if (activeMetric === 'readiness') {
      // Gradient Fill for focused single line
      const areaGen = d3.area<ChartDataPoint>()
        .x(d => xScale(d.index)!)
        .y0(chartHeight)
        .y1(d => yScale(d.readiness))
        .curve(d3.curveMonotoneX);

      // Gradient definition
      const defs = svg.append("defs");
      const bgGrad = defs.append("linearGradient")
        .attr("id", "readiness-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

      bgGrad.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#1A2B3C")
        .attr("stop-opacity", 0.12);
      bgGrad.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#1A2B3C")
        .attr("stop-opacity", 0.0);

      // Use only real points or complete elements if it fits
      const hasRealPart = data.some(d => d.isReal);
      const activeDataPoints = hasRealPart ? data.filter(d => d.index === 0 || d.isReal) : data;

      g.append("path")
        .datum(activeDataPoints)
        .attr("fill", "url(#readiness-gradient)")
        .attr("d", areaGen);

      drawTrackLine('readiness', '#1A2B3C');
    } else if (activeMetric === 'confidence') {
      // Gradient Fill
      const areaGen = d3.area<ChartDataPoint>()
        .x(d => xScale(d.index)!)
        .y0(chartHeight)
        .y1(d => yScale(d.confidence))
        .curve(d3.curveMonotoneX);

      const defs = svg.append("defs");
      const bgGrad = defs.append("linearGradient")
        .attr("id", "confidence-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

      bgGrad.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#10B981")
        .attr("stop-opacity", 0.15);
      bgGrad.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#10B981")
        .attr("stop-opacity", 0.0);

      const hasRealPart = data.some(d => d.isReal);
      const activeDataPoints = hasRealPart ? data.filter(d => d.index === 0 || d.isReal) : data;

      g.append("path")
        .datum(activeDataPoints)
        .attr("fill", "url(#confidence-gradient)")
        .attr("d", areaGen);

      drawTrackLine('confidence', '#10B981');
    }

    // Add circles for points
    const drawCirclesForMetric = (key: 'readiness' | 'fluency' | 'confidence', color: string) => {
      const displayPoints = data.some(d => d.isReal) ? data.filter(d => d.index === 0 || d.isReal) : data;
      
      g.selectAll(`.circle-${key}`)
        .data(displayPoints)
        .join("circle")
        .attr("class", `circle-${key}`)
        .attr("cx", d => xScale(d.index)!)
        .attr("cy", d => yScale(d[key]))
        .attr("r", 5)
        .attr("fill", "white")
        .attr("stroke", color)
        .attr("stroke-width", 2.5)
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
          setHoveredPoint(d);
        });
    };

    if (activeMetric === 'all') {
      drawCirclesForMetric('readiness', '#1A2B3C');
      drawCirclesForMetric('confidence', '#10B981');
    } else if (activeMetric === 'readiness') {
      drawCirclesForMetric('readiness', '#1A2B3C');
    } else {
      drawCirclesForMetric('confidence', '#10B981');
    }

    // Interactive Overlay Panel for mouse capture
    const mouseOverlay = g.append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("fill", "transparent")
      .style("pointer-events", "all");

    // Handle mouse movement across entire overlay to snap to closest index
    mouseOverlay.on("mousemove", (event) => {
      const [mouseX] = d3.pointer(event);
      const activeSet = data.some(d => d.isReal) ? data.filter(d => d.index === 0 || d.isReal) : data;
      
      let closestD = activeSet[0];
      let minDistance = Infinity;
      activeSet.forEach(d => {
        const cx = xScale(d.index)!;
        const dist = Math.abs(cx - mouseX);
        if (dist < minDistance) {
          minDistance = dist;
          closestD = d;
        }
      });

      if (closestD) {
        setHoveredPoint(closestD);
      }
    });

  }, [data, dimensions, activeMetric]);

  return (
    <div 
      id="progress-chart-card" 
      className="bg-white border-[2.5px] border-stone-950 rounded-[32px] p-6 shadow-[5px_5px_0px_0px_#111111] hover:shadow-[7px_7px_0px_0px_#111111] hover:translate-x-[-1.5px] hover:translate-y-[-1.5px] transition-all flex flex-col justify-between h-full space-y-6"
    >
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#F3F4F6] pb-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-950 font-bold bg-[#E8F5E9] px-2.5 py-1 rounded-xl border-2 border-stone-950 leading-tight inline-block mb-1 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
            {lang === 'EN' ? "PERFORMANCE TELEMETRY" : "MÉTRIQUES DE TÉLÉMÉTRIE"}
          </span>
          <h3 id="chart-heading" className="text-sm font-mono font-black text-[#111111] uppercase tracking-wider">
            {lang === 'EN' ? "Fluency & Confidence Trends" : "Courbes de Progression de Fluence"}
          </h3>
          <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">
            {lang === 'EN' ? "Chronological growth tracking across evaluated sessions." : "Visualisation chronologique des efforts et acquis vocaux."}
          </p>
        </div>

        {/* Tab Controls */}
        <div id="metric-segment-controls" className="flex bg-[#F3F4F6] p-1 rounded-xl border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
          <button
            id="btn-metric-all"
            onClick={() => setActiveMetric('all')}
            className={`px-3 py-1.5 text-[9px] font-black rounded-lg uppercase tracking-wider font-mono cursor-pointer transition-all ${
              activeMetric === 'all'
                ? 'bg-stone-950 text-white shadow-none'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            {lang === 'EN' ? "Combined" : "Combiné"}
          </button>
          
          <button
            id="btn-metric-readiness"
            onClick={() => setActiveMetric('readiness')}
            className={`px-3 py-1.5 text-[9px] font-black rounded-lg uppercase tracking-wider font-mono cursor-pointer transition-all ${
              activeMetric === 'readiness'
                ? 'bg-stone-950 text-white shadow-none'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            {lang === 'EN' ? "Readiness" : "Éligibilité"}
          </button>

          <button
            id="btn-metric-confidence"
            onClick={() => setActiveMetric('confidence')}
            className={`px-3 py-1.5 text-[9px] font-black rounded-lg uppercase tracking-wider font-mono cursor-pointer transition-all ${
              activeMetric === 'confidence'
                ? 'bg-stone-950 text-white shadow-none'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            {lang === 'EN' ? "Confidence" : "Confiance"}
          </button>
        </div>
      </div>

      {/* Main visualization split flexpane - Chart on left/top, Details on right/bottom */}
      <div className="flex flex-col sm:flex-row lg:flex-col gap-6 mt-4 flex-1 items-stretch">
        
        {/* The Actual D3 Chart SVG Container - expands */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center relative select-none min-h-[260px]">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="max-w-full overflow-visible"
          />
        </div>

        {/* Metric details panel of the currently active/hovered point */}
        <div id="metric-spotcheck-details" className="w-full sm:w-[240px] lg:w-full shrink-0 flex flex-col justify-between gap-4">
          <div className="bg-[#FAFAFA] border-2 border-stone-950 p-5 rounded-[24px] space-y-3.5 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            <span className="text-[9px] font-mono font-black text-stone-500 uppercase tracking-wider block">
              {lang === 'EN' ? "Session Spot-Check" : "Point d'Étape Sélectionné"}
            </span>

            {hoveredPoint ? (
              <div className="space-y-4">
                <div>
                  <h4 id="hover-point-label" className="text-xs font-mono font-black text-stone-950 uppercase tracking-wide leading-snug">
                    {hoveredPoint.label}
                  </h4>
                  <p className="text-[9px] font-mono text-stone-500 font-bold mt-0.5">
                    {hoveredPoint.date}
                  </p>
                </div>

                <div className="space-y-2">
                  {/* Readiness Row */}
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border-2 border-stone-950">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-stone-950" />
                      <span className="text-[10px] font-bold text-stone-700">
                        {lang === 'EN' ? "Readiness" : "Éligibilité"}
                      </span>
                    </div>
                    <span id="hover-readiness-value" className="font-mono text-xs font-black text-stone-950">
                      {hoveredPoint.readiness}%
                    </span>
                  </div>

                  {/* Confidence Row */}
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border-2 border-stone-950">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-stone-700">
                        {lang === 'EN' ? "Confidence" : "Confiance"}
                      </span>
                    </div>
                    <span id="hover-confidence-value" className="font-mono text-xs font-black text-emerald-600">
                      {hoveredPoint.confidence}%
                    </span>
                  </div>
                </div>

                {!hoveredPoint.isReal && (
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[9px] font-semibold text-indigo-700 leading-normal">
                      {lang === 'EN' 
                        ? "This is your target goal path. Start your first session to capture real analytics."
                        : "Ceci correspond à votre cible d'envol. Engagez un premier exercice pour obtenir des métriques réelles."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-stone-400 font-mono font-bold uppercase">
                {lang === 'EN' ? "Hover point to read" : "Survoler la courbe pour afficher"}
              </div>
            )}
          </div>

          <div className="bg-stone-950 text-stone-100 p-4 rounded-[24px] flex gap-2.5 border-2 border-stone-950">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
            <p className="text-[9.5px] font-mono font-extrabold uppercase tracking-wide leading-normal">
              {lang === 'EN'
                ? "SHANA calculates real-time confidence scores using sentence complexity, duration, pauses, and metric telemetry."
                : "SHANA calcule la confiance vocale via l'analyse de complexité syntaxique, la régularité des pauses et la fluence."}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
