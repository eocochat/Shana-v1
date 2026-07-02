import { jsPDF } from 'jspdf';
import { UserProfile, SessionHistoryItem, Language } from '../types';

// Helper to determine score color bands
function getReadinessBand(score: number, lang: Language) {
  if (score >= 85) {
    return {
      label: lang === 'EN' ? "STRONGLY PREPARED" : "TRÈS PRÉPARÉ",
      color: [16, 185, 129] // Emerald Green
    };
  } else if (score >= 70) {
    return {
      label: lang === 'EN' ? "INTERVIEW READY" : "PRÊT POUR L'ENTRETIEN",
      color: [79, 70, 229] // Indigo
    };
  } else if (score >= 50) {
    return {
      label: lang === 'EN' ? "DEVELOPING" : "EN DÉVELOPPEMENT",
      color: [245, 158, 11] // Amber
    };
  } else {
    return {
      label: lang === 'EN' ? "NEEDS PREPARATION" : "ENTRAÎNEMENT REQUIS",
      color: [239, 68, 68] // Red
    };
  }
}

export function generateReportPDF(user: UserProfile, data: SessionHistoryItem, lang: Language) {
  // Create an A4 PDF document (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primarySlate = [26, 43, 60]; // #1A2B3C
  const borderLight = [229, 231, 235]; // #E5E7EB
  const textDark = [17, 24, 39]; // #111827
  const textMuted = [107, 114, 128]; // #6B7280
  const goldAmber = [217, 119, 6]; // #D97706

  const dateStr = data.date || new Date().toLocaleDateString(lang === 'EN' ? 'en-US' : 'fr-FR');
  const band = getReadinessBand(data.score, lang);

  // ==========================================
  // PAGE 1: EXECUTIVE BRIEF & COMPETENCY MAP
  // ==========================================

  // 1. Header Branded Banner
  doc.setFillColor(primarySlate[0], primarySlate[1], primarySlate[2]);
  doc.roundedRect(15, 15, 180, 28, 4, 4, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(245, 158, 11); // Gold/Amber
  doc.text("SHANA", 23, 27);

  // Platform Descriptor
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(lang === 'EN' ? "PREMIUM INTERVIEW PREPARATION PLATFORM" : "PLATEFORME DE PRÉPARATION AUX ENTRETIENS D'ÉLITE", 23, 34);

  // Date and Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`${lang === 'EN' ? "DATE:" : "DATE :"} ${dateStr.toUpperCase()}`, 187, 26, { align: 'right' });
  doc.text(`${lang === 'EN' ? "CANDIDATE:" : "CANDIDAT :"} ${user.name.toUpperCase()}`, 187, 33, { align: 'right' });

  // 2. Profile Summary Info Box
  doc.setFillColor(249, 250, 251); // F9FAFB
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(15, 48, 180, 18, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primarySlate[0], primarySlate[1], primarySlate[2]);

  // Profile Labels
  doc.text(lang === 'EN' ? "TARGET ROLE:" : "POSTE VISÉ :", 20, 55);
  doc.text(lang === 'EN' ? "SECTOR/INDUSTRY:" : "SECTEUR MÉTIEER :", 20, 61);
  doc.text(lang === 'EN' ? "EXP LEVEL:" : "SÉNIORITÉ :", 110, 55);
  doc.text(lang === 'EN' ? "LANGUAGE:" : "LANGUE D'ENTRETIEN :", 110, 61);

  // Profile Values
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(user.targetRole || "N/A", 50, 55);
  doc.text(user.industry || "N/A", 50, 61);
  doc.text((user.experienceLevel || "N/A").toUpperCase(), 150, 55);
  doc.text(lang === 'EN' ? "English (EN)" : "Français (FR)", 150, 61);

  // 3. Overall Readiness Score Section
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(15, 71, 180, 32, 4, 4, 'FD');

  // Big Score Badge
  doc.setFillColor(primarySlate[0], primarySlate[1], primarySlate[2]);
  doc.roundedRect(20, 76, 40, 22, 3, 3, 'F');

  // Score value
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text(`${data.score}%`, 40, 89, { align: 'center' });

  // Score Label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(lang === 'EN' ? "OVERALL READINESS INDEX" : "INDICE GLOBAL D'ÉLIGIBILITÉ", 66, 80);

  // Status Band Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(band.color[0], band.color[1], band.color[2]);
  doc.text(band.label, 66, 86);

  // Brief text description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const scoreDesc = lang === 'EN' 
    ? "Calculated using real-time vocal tempo metrics, verbal clarity indices, structural answers, behavioral STAR compliance, and posture analysis."
    : "Établi d'après le tempo vocal, l'indice de clarté élocutoire, la structuration STAR des réponses, et la pose faciale de gestion du stress.";
  const wrappedScoreDesc = doc.splitTextToSize(scoreDesc, 122);
  doc.text(wrappedScoreDesc, 66, 91);

  // 4. Dimensional Competency Map
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primarySlate[0], primarySlate[1], primarySlate[2]);
  doc.text(lang === 'EN' ? "DIMENSIONAL COMPETENCY BREAKDOWN" : "CARTOGRAPHIE DES DOMAINES DE COMPÉTENCES", 15, 111);

  // Simple horizontal separator
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(15, 114, 195, 114);

  // Grid layout for 6 dimensions (2 columns of 3)
  const dimensions = [
    { name: lang === 'EN' ? "Resume Defense" : "Adéquation Résumé CV", score: data.resumeScore || 0 },
    { name: lang === 'EN' ? "Industry Knowledge" : "Ancrage Métier & Secteur", score: data.industryScore || 0 },
    { name: lang === 'EN' ? "Communication Structure" : "Élocution & Clarté", score: data.communicationScore || 0 },
    { name: lang === 'EN' ? "Confidence Poise" : "Assurance & Posture", score: data.confidenceScore || 0 },
    { name: lang === 'EN' ? "Contextual Adaptability" : "Adaptabilité Contextuelle", score: data.adaptabilityScore || 0 },
    { name: lang === 'EN' ? "Behavioral Responses" : "Structure Comportementale", score: data.behavioralScore || 0 }
  ];

  dimensions.forEach((dim, idx) => {
    // Math to arrange in two columns
    const isCol2 = idx % 2 === 1;
    const x = isCol2 ? 110 : 15;
    const y = 122 + Math.floor(idx / 2) * 16;
    const barWidth = 85;

    // Dimension Title & Score
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(dim.name, x, y);
    doc.text(`${dim.score}%`, x + barWidth, y, { align: 'right' });

    // Progress Bar Track
    doc.setFillColor(243, 244, 246); // #F3F4F6
    doc.roundedRect(x, y + 2, barWidth, 3, 1, 1, 'F');

    // Progress Bar Fill
    doc.setFillColor(primarySlate[0], primarySlate[1], primarySlate[2]);
    const fillWidth = (barWidth * dim.score) / 100;
    doc.roundedRect(x, y + 2, fillWidth, 3, 1, 1, 'F');
  });

  // 5. Strengths & Recommendations Card (Lower half)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primarySlate[0], primarySlate[1], primarySlate[2]);
  doc.text(lang === 'EN' ? "QUALITATIVE TELEMETRY OUTCOMES" : "CONSTATS DE TÉLÉMÉTRIE QUALITATIFS", 15, 175);

  doc.line(15, 178, 195, 178);

  // Columns for Strengths vs Weakness
  const boxWidth = 87;

  // Left Box: Strengths
  doc.setFillColor(240, 253, 244); // Light green bg
  doc.setDrawColor(220, 252, 231); // Green border
  doc.roundedRect(15, 184, boxWidth, 90, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(21, 128, 61); // Green
  doc.text(lang === 'EN' ? "CORROBORATED STRENGTHS" : "FORCES ANALYSÉES", 21, 191);

  // List Strengths
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(17, 24, 39);
  const userStrengths = data.strengths || [
    lang === 'EN' ? "Excellent usage of numbers to quantify milestones." : "Excellente utilisation de données chiffrées.",
    lang === 'EN' ? "Highly structured STAR framework applied to stress scenarios." : "Structure STAR appliquée avec brio aux scénarios complexes.",
    lang === 'EN' ? "Professional gaze positioning and solid facial tracking stability." : "Très bonne position du regard et stabilité du suivi du visage."
  ];

  let strengthY = 198;
  userStrengths.forEach((st) => {
    // Green Bullet Point
    doc.setFillColor(16, 185, 129);
    doc.circle(23, strengthY - 1, 0.8, 'F');

    // Text
    const wrappedStText = doc.splitTextToSize(st, boxWidth - 14);
    doc.text(wrappedStText, 26, strengthY);
    strengthY += (wrappedStText.length * 4) + 1;
  });

  // Right Box: Areas for Improvement & Recommendations
  doc.setFillColor(255, 251, 235); // Light yellow bg
  doc.setDrawColor(254, 243, 199); // Yellow border
  doc.roundedRect(108, 184, boxWidth, 90, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(goldAmber[0], goldAmber[1], goldAmber[2]);
  doc.text(lang === 'EN' ? "IMPROVEMENT REQUISITIONS" : "AXES D'AMÉLIORATIONS REQUIS", 114, 191);

  // Identified weakness area
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primarySlate[0], primarySlate[1], primarySlate[2]);
  doc.text(lang === 'EN' ? "PRIMARY LIMITING FACTOR:" : "FACTEUR LIMITANT DIRECT :", 114, 198);

  doc.setFont('helvetica', 'oblique');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const wrappedWeakness = doc.splitTextToSize(`"${data.weakness}"`, boxWidth - 12);
  doc.text(wrappedWeakness, 114, 203);

  // Recommendation action box
  const recY = 203 + (wrappedWeakness.length * 3.5) + 3;
  doc.setFillColor(primarySlate[0], primarySlate[1], primarySlate[2]);
  doc.roundedRect(113, recY, boxWidth - 10, 36, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(245, 158, 11);
  doc.text(lang === 'EN' ? "SHANA PRESCRIBED STRATEGY:" : "STRATÉGIE DE RECOMMANDATION :", 117, recY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(243, 244, 246);
  const wrappedRec = doc.splitTextToSize(data.recommendation, boxWidth - 18);
  doc.text(wrappedRec, 117, recY + 10);

  // Page 1 Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("SHANA COGNITIVE INTERVIEW SUITE • CONFIDENTIAL", 105, 288, { align: 'center' });


  // ==========================================
  // PAGE 2: DETAILED QUESTION-BY-QUESTION
  // ==========================================
  doc.addPage();

  // Top header line
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(15, 15, 195, 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primarySlate[0], primarySlate[1], primarySlate[2]);
  doc.text(lang === 'EN' ? "SHANA • DEEP DIAGNOSTIC ANALYSIS" : "SHANA • RAPPORT D'ENTRETIEN APPROFONDI", 15, 11);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Page 2 / 2`, 195, 11, { align: 'right' });

  // Main title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(lang === 'EN' ? "QUESTION-BY-QUESTION EVALUATION" : "DIAGNOSTIC QUESTION PAR QUESTION", 15, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    lang === 'EN' 
      ? "Detailed audio metrics, facial gestures, and transcript accuracy calculated for each response phase."
      : "Mesures précises d'élocution, du tempo, de clarté, et du respect des indicateurs clés sur chaque phase.", 
    15, 27
  );

  // Question list loop
  const questions = data.questionsFeedback || [];
  let currentY = 32;

  questions.forEach((q, idx) => {
    // Calculate card height dynamically based on text lengths
    const cardPadding = 4;
    const cardWidth = 180;
    
    // Wrapped texts to calculate height
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const wrappedQText = doc.splitTextToSize(q.questionText, cardWidth - 10);
    const wrappedPos = doc.splitTextToSize(q.keyPositive, cardWidth - 10);
    const wrappedTip = doc.splitTextToSize(q.improvementTip, cardWidth - 10);

    const qTextHeight = wrappedQText.length * 3.5;
    const posHeight = wrappedPos.length * 3.2;
    const tipHeight = wrappedTip.length * 3.2;

    const cardHeight = 15 + qTextHeight + posHeight + tipHeight + 10;

    // Background card container
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(15, currentY, cardWidth, cardHeight, 3, 3, 'FD');

    // Left phase header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(primarySlate[0], primarySlate[1], primarySlate[2]);
    doc.text(`PHASE ${idx + 1}: ${q.phaseLabel}`, 20, currentY + 5);

    // Score on the right
    doc.setFillColor(primarySlate[0], primarySlate[1], primarySlate[2]);
    doc.roundedRect(173, currentY + 2, 16, 5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`${q.score}%`, 181, currentY + 5.5, { align: 'center' });

    // Question body
    doc.setFont('helvetica', 'oblique');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(wrappedQText, 20, currentY + 10);

    // Audio metrics line
    let metricY = currentY + 10 + qTextHeight + 2;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(20, metricY, cardWidth - 10, 6, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(lang === 'EN' ? "SPEAKING PACE:" : "RYTHME DE PAROLE :", 23, metricY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`${q.pace} (${q.paceRating.toUpperCase()})`, 45, metricY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(lang === 'EN' ? "AUDIO CLARITY:" : "CLARTÉ AUDIO :", 95, metricY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`${q.clarity}%`, 116, metricY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(lang === 'EN' ? "STRESS POISE:" : "POSTURE STRESS :", 140, metricY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(q.score >= 80 ? "EXCELLENT" : "STABLE", 163, metricY + 4);

    // Positive and Tip text sections
    let feedbackY = metricY + 10;
    
    // Positive
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(21, 128, 61); // Green
    doc.text("✓ KEY STRENGTH:", 20, feedbackY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(wrappedPos, 45, feedbackY);

    // Tip
    let tipY = feedbackY + posHeight + 1;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(goldAmber[0], goldAmber[1], goldAmber[2]); // Orange
    doc.text("⚠ IMPROVEMENT:", 20, tipY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(wrappedTip, 45, tipY);

    // Shift currentY for next question card
    currentY += cardHeight + 4;
  });

  // Action checklist at bottom of Page 2
  currentY += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primarySlate[0], primarySlate[1], primarySlate[2]);
  doc.text(lang === 'EN' ? "PRESCRIBED PREPARATION DRILLS" : "EXERCICES ET PLANS D'ACTION RECOMMANDÉS", 15, currentY);

  doc.line(15, currentY + 2, 195, currentY + 2);

  const roadmapItems = [
    lang === 'EN' 
      ? "Conduct 1 voice training exercise under 135 WPM to regulate your talking speed."
      : "Réaliser 1 exercice d'entraînement rythmique de la voix sous 135 mots par minute.",
    lang === 'EN' 
      ? "Integrate precise structural metrics and metrics when stating CV key milestones."
      : "Formuler des indicateurs de volume ou de budget clairs pour appuyer vos réalisations.",
    lang === 'EN' 
      ? "Maintain eye-level posture alignment for at least 6 seconds per question."
      : "Maintenir la posture du regard au centre de l'axe caméra pendant au moins 6 secondes.",
    lang === 'EN' 
      ? "Reduce verbal fillers (e.g. 'um', 'uh') by practicing strategic 1-second silence pauses."
      : "Limiter les bruits d'hésitation verbaux ('euh', 'du coup') en instaurant de courtes pauses."
  ];

  let roadmapY = currentY + 7;
  roadmapItems.forEach((item) => {
    // Draw small square checkbox
    doc.setDrawColor(primarySlate[0], primarySlate[1], primarySlate[2]);
    doc.rect(17, roadmapY - 2.5, 3, 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    
    const wrappedRoadmap = doc.splitTextToSize(item, 165);
    doc.text(wrappedRoadmap, 23, roadmapY);
    roadmapY += (wrappedRoadmap.length * 3.5) + 1;
  });

  // Final Footer page 2
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("SHANA COGNITIVE INTERVIEW SUITE • CONFIDENTIAL • https://ai.studio/build", 105, 288, { align: 'center' });

  // Save the generated document
  const fileName = `SHANA_Report_${user.name.replace(/\s+/g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}
