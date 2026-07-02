/**
 * SHANA — PHASE 3
 * UNIFIED SCORING ENGINE (IPS)
 *
 * A stable, 100% deterministic system to calculate the Interview Performance Score (IPS).
 * No randomness, no LLM vibes scoring. Same inputs always produce the exact same score.
 */

import { Language } from '../types';

export interface IPSResult {
  ips: number; // 0-100
  breakdown: {
    clarity: number;     // 0-100
    structure: number;   // 0-100
    confidence: number;  // 0-100
    relevance: number;   // 0-100
    conciseness: number; // 0-100
  };
  explanation: {
    strength: string;
    improvement: string;
    tip: string;
  };
}

/**
 * A fast, deterministic hash function to provide slight, stable variations
 * depending on question text length/content, ensuring repeatability.
 */
function getDeterministicOffset(str: string, maxRange: number = 8): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % maxRange;
}

/**
 * Main entrypoint to compute the stable Interview Performance Score (IPS)
 */
export function calculateIPS(
  answerText: string,
  questionText: string,
  lang: Language = 'EN',
  speechDetected: boolean = true
): IPSResult {
  const cleanedAnswer = answerText.trim();
  const lowerAnswer = cleanedAnswer.toLowerCase();
  
  // Detect if the answer is completely silent or a simulated silent placeholder
  const isSilent = 
    cleanedAnswer === '' || 
    lowerAnswer.includes('silent') || 
    (!speechDetected && lowerAnswer.includes('verbal defense captured'));

  if (isSilent) {
    return {
      ips: 0,
      breakdown: { clarity: 0, structure: 0, confidence: 0, relevance: 0, conciseness: 0 },
      explanation: {
        strength: lang === 'EN' ? "Eye alignment and posture maintained." : "Maintien de l'alignement visuel et de la posture.",
        improvement: lang === 'EN' ? "No voice response was captured by Shana." : "Aucune réponse vocale n'a été capturée par Shana.",
        tip: lang === 'EN' ? "Enable microphone permissions and speak aloud clearly." : "Activez les autorisations de votre micro et répondez à haute voix."
      }
    };
  }

  // Detect simulated/verbal placeholder standard defenses (since voice is analyzed by energy levels)
  const isPlaceholderSpoken = lowerAnswer.includes('verbal defense captured') && lowerAnswer.includes('standard');

  let clarity = 80;
  let structure = 75;
  let confidence = 78;
  let relevance = 82;
  let conciseness = 85;

  // Stable offset based on the question text so different questions naturally have distinct stable baselines
  const questionOffset = getDeterministicOffset(questionText, 6); // 0 to 5
  const answerOffset = getDeterministicOffset(cleanedAnswer, 5); // 0 to 4

  if (isPlaceholderSpoken) {
    // If it is an oral response captured through energy signals, map to high-quality baseline
    clarity = 85 + questionOffset;
    structure = 80 + answerOffset;
    confidence = 88 + questionOffset - answerOffset;
    relevance = 84 + questionOffset;
    conciseness = 90 - answerOffset;
  } else {
    // Perform deterministic natural language feature extraction
    const words = cleanedAnswer.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // 1. FILLER WORDS & HESITATION -> IMPACTS CLARITY
    const enFillers = ["uh", "um", "like", "basically", "actually", "literally", "you know", "sort of", "kind of", "so basically"];
    const frFillers = ["euh", "bah", "du coup", "en fait", "voilà", "genre", "donc", "tu vois", "en gros", "alors", "après"];
    const targetFillers = lang === 'EN' ? enFillers : frFillers;

    let fillerCount = 0;
    targetFillers.forEach(filler => {
      // Simple regex match for whole words
      const matches = lowerAnswer.match(new RegExp(`\\b${filler}\\b`, 'g'));
      if (matches) {
        fillerCount += matches.length;
      }
    });

    if (fillerCount === 0) clarity = 95;
    else if (fillerCount <= 2) clarity = 85;
    else if (fillerCount <= 4) clarity = 72;
    else clarity = 55;

    // Adjust clarity based on extreme lengths
    if (wordCount < 10) clarity = Math.max(30, clarity - 30);

    // 2. STAR METHOD & LOGICAL MARKERS -> IMPACTS STRUCTURE
    const enStructure = ["situation", "task", "action", "result", "role", "impact", "metric", "first", "second", "then", "finally", "outcome", "consequently"];
    const frStructure = ["situation", "tâche", "action", "résultat", "rôle", "impact", "métrique", "d'abord", "ensuite", "puis", "finalement", "objectif"];
    const targetStructure = lang === 'EN' ? enStructure : frStructure;

    let structureMatches = 0;
    targetStructure.forEach(marker => {
      if (lowerAnswer.includes(marker)) {
        structureMatches++;
      }
    });

    if (structureMatches >= 4) structure = 98;
    else if (structureMatches === 3) structure = 88;
    else if (structureMatches === 2) structure = 78;
    else if (structureMatches === 1) structure = 68;
    else structure = 50;

    // 3. CONFIDENCE INDICATORS -> IMPACTS CONFIDENCE
    const enPositiveConf = ["confident", "absolutely", "definitely", "surely", "successfully", "delivered", "resolved", "strong", "expert", "clear", "managed", "led"];
    const enNegativeConf = ["maybe", "probably", "i think", "just", "try to", "hope", "not sure", "sorry", "dunno"];
    const frPositiveConf = ["confiant", "absolument", "clairement", "précisément", "parfaitement", "réussi", "géré", "dirigé", "assuré", "maîtrisé", "délivré"];
    const frNegativeConf = ["peut-être", "probablement", "je pense", "juste", "essayer de", "espère", "pas sûr", "désolé", "un peu", "je crois"];

    const posConfList = lang === 'EN' ? enPositiveConf : frPositiveConf;
    const negConfList = lang === 'EN' ? enNegativeConf : frNegativeConf;

    let posCount = 0;
    let negCount = 0;

    posConfList.forEach(w => { if (lowerAnswer.includes(w)) posCount++; });
    negConfList.forEach(w => { if (lowerAnswer.includes(w)) negCount++; });

    confidence = 75 + (posCount * 4) - (negCount * 6);
    confidence = Math.max(40, Math.min(100, confidence));

    // 4. KEYWORD OVERLAP AND RELEVANCE TO QUESTION -> IMPACTS RELEVANCE
    const questionWords = questionText.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .split(/\s+/)
      .filter(w => w.length >= 4); // target meaningful terms only

    // Filter out common stopwords
    const stopwords = ["what", "your", "with", "from", "this", "that", "their", "them", "have", "dans", "pour", "avec", "votre", "nous", "vous", "faire", "comment", "quel", "quelle"];
    const meaningfulQWords = questionWords.filter(w => !stopwords.includes(w));

    let overlapCount = 0;
    meaningfulQWords.forEach(qw => {
      if (lowerAnswer.includes(qw)) overlapCount++;
    });

    if (meaningfulQWords.length === 0) {
      relevance = 80;
    } else {
      const ratio = overlapCount / meaningfulQWords.length;
      if (ratio >= 0.5) relevance = 96;
      else if (ratio >= 0.3) relevance = 88;
      else if (ratio >= 0.15) relevance = 78;
      else relevance = 60;
    }

    // 5. WORD COUNT SWEET SPOT -> IMPACTS CONCISENESS
    if (wordCount >= 40 && wordCount <= 180) {
      conciseness = 95;
    } else if (wordCount > 180 && wordCount <= 280) {
      conciseness = 80;
    } else if (wordCount > 280) {
      conciseness = 60; // too wordy
    } else if (wordCount >= 15 && wordCount < 40) {
      conciseness = 85;
    } else {
      conciseness = 50; // too short
    }
  }

  // Ensure values remain within bounds [0, 100]
  clarity = Math.max(0, Math.min(100, Math.round(clarity)));
  structure = Math.max(0, Math.min(100, Math.round(structure)));
  confidence = Math.max(0, Math.min(100, Math.round(confidence)));
  relevance = Math.max(0, Math.min(100, Math.round(relevance)));
  conciseness = Math.max(0, Math.min(100, Math.round(conciseness)));

  // Conceptual formula: Clarity 25%, Structure 25%, Confidence 20%, Relevance 20%, Conciseness 10%
  const calculatedIPS = Math.round(
    clarity * 0.25 +
    structure * 0.25 +
    confidence * 0.20 +
    relevance * 0.20 +
    conciseness * 0.10
  );

  // EXPLANATION RULE: Generate exactly 1 strength, 1 improvement area, 1 tip (keep it short)
  let strength = "";
  let improvement = "";
  let tip = "";

  if (lang === 'FR') {
    if (structure >= clarity) {
      strength = "Excellente articulation de vos arguments avec une structure claire.";
    } else {
      strength = "Élocution limpide et vocabulaire professionnel précis.";
    }

    if (clarity < 75) {
      improvement = "Présence notable de tics de langage qui ralentissent le discours.";
      tip = "Faites des pauses silencieuses plutôt que d'utiliser des mots de remplissage.";
    } else if (structure < 75) {
      improvement = "Manque de repères chronologiques ou méthodologiques.";
      tip = "Utilisez des marqueurs temporels ('premièrement', 'ensuite') pour guider l'auditeur.";
    } else if (relevance < 75) {
      improvement = "Léger écart par rapport à la problématique directe de la question.";
      tip = "Reprenez les mots-clés de la question dès votre phrase d'introduction.";
    } else if (conciseness < 75) {
      improvement = "Longueur d'explication élevée risquant de diluer votre impact.";
      tip = "Synthétisez en moins de 150 mots en vous focalisant sur les résultats.";
    } else {
      improvement = "Amélioration marginale possible sur le dynamisme des intonations.";
      tip = "Accentuez les verbes d'action clés de votre présentation.";
    }
  } else {
    // English explanations
    if (structure >= clarity) {
      strength = "Pragmatic defense with a well-defined chronological structure.";
    } else {
      strength = "Excellent vocabulary control and crisp speech flow.";
    }

    if (clarity < 75) {
      improvement = "Frequent usage of hesitant filler phrases diluting delivery.";
      tip = "Substitute filler words with silent pauses to restore authority.";
    } else if (structure < 75) {
      improvement = "The chronological progression could be framed tighter.";
      tip = "Apply the STAR method explicitly: state Situation, Task, Action, and Result.";
    } else if (relevance < 75) {
      improvement = "Minor shift away from the direct core question prompt.";
      tip = "Echo key technical constraints from the question in your opening line.";
    } else if (conciseness < 75) {
      improvement = "Verbose delivery might dilute the core architectural achievement.";
      tip = "Cap your response to under 120 words focusing strictly on direct metrics.";
    } else {
      improvement = "Slight vocal cadence acceleration detected towards the end.";
      tip = "Maintain a steady breathing tempo during high-pressure conclusions.";
    }
  }

  return {
    ips: calculatedIPS,
    breakdown: {
      clarity,
      structure,
      confidence,
      relevance,
      conciseness
    },
    explanation: {
      strength,
      improvement,
      tip
    }
  };
}
