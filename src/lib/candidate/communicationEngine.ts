import { CandidateState } from './candidateState';

export class CommunicationEngine {
  /**
   * Analyzes an answer text to compute real-time communication telemetry, smoothly updating the long-term state.
   */
  public static analyzeResponse(state: CandidateState, answer: string): void {
    const wordCount = answer.trim().split(/\s+/).length;
    const charCount = answer.length;

    if (wordCount < 3) return;

    // 1. Speaking Speed estimation (Simulated based on text length & typical delivery)
    const assumedWordsPerMinute = Math.round(110 + (Math.random() * 40)); 

    // 2. Vocabulary Richness (Ratio of unique words, clamped)
    const uniqueWords = new Set(answer.toLowerCase().match(/\b\w+\b/g) || []);
    const richnessRatio = Math.min(100, Math.round((uniqueWords.size / wordCount) * 100));

    // 3. Sentence Structure (Average length of sentences, punctuation indicators)
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : wordCount;
    let structureScore = 80;
    if (avgSentenceLength > 25) {
      structureScore = 55; // Too wordy, runaway sentences
    } else if (avgSentenceLength < 6) {
      structureScore = 60; // Too robotic, fragmented
    } else {
      structureScore = 90; // Optimal sentence cadence
    }

    // 4. Clarity (Inversely proportional to long runaway words and highly simple fillers)
    let clarityScore = 75;
    if (answer.includes('maybe') || answer.includes('not sure') || answer.includes('guess')) {
      clarityScore -= 15;
    }
    if (wordCount > 60) {
      clarityScore += 10;
    }

    // 5. Conciseness (Clamped wordcount threshold)
    let concisenessScore = 100;
    if (wordCount > 150) {
      concisenessScore = 50; // overly verbose
    } else if (wordCount > 80) {
      concisenessScore = 75;
    }

    // 6. Filler Word Frequency
    const fillers = ['like', 'uh', 'um', 'so', 'actually', 'basically', 'kind of', 'sort of'];
    let fillerCount = 0;
    const lower = answer.toLowerCase();
    fillers.forEach(f => {
      const regex = new RegExp(`\\b${f}\\b`, 'g');
      const matches = lower.match(regex);
      if (matches) {
        fillerCount += matches.length;
      }
    });
    const fillerFreq = parseFloat(((fillerCount / wordCount) * 100).toFixed(1));

    // 7. Conversation Flow
    const flowScore = Math.max(20, Math.min(100, Math.round(85 - (fillerFreq * 6) + (structureScore * 0.2))));

    // Smooth update of candidate communication metrics with adaptive learning rates to encourage growth
    const comm = state.communication;
    
    // Speaking speed
    comm.averageSpeakingSpeed = Math.round((comm.averageSpeakingSpeed * 0.7) + (assumedWordsPerMinute * 0.3));
    
    // Vocabulary Richness
    let vrWeight = 0.2;
    if (richnessRatio > comm.vocabularyRichness) {
      vrWeight = Math.min(0.8, 0.2 + ((richnessRatio - comm.vocabularyRichness) / 100));
    }
    comm.vocabularyRichness = Math.round((comm.vocabularyRichness * (1 - vrWeight)) + (richnessRatio * vrWeight));
    
    // Sentence Structure
    let ssWeight = 0.2;
    if (structureScore > comm.sentenceStructure) {
      ssWeight = Math.min(0.8, 0.2 + ((structureScore - comm.sentenceStructure) / 100));
    }
    comm.sentenceStructure = Math.round((comm.sentenceStructure * (1 - ssWeight)) + (structureScore * ssWeight));
    
    // Answer Clarity
    let acWeight = 0.2;
    if (clarityScore > comm.answerClarity) {
      acWeight = Math.min(0.8, 0.2 + ((clarityScore - comm.answerClarity) / 100));
    }
    comm.answerClarity = Math.round((comm.answerClarity * (1 - acWeight)) + (clarityScore * acWeight));
    
    // Conciseness
    let cWeight = 0.2;
    if (concisenessScore > comm.conciseness) {
      cWeight = Math.min(0.8, 0.2 + ((concisenessScore - comm.conciseness) / 100));
    }
    comm.conciseness = Math.round((comm.conciseness * (1 - cWeight)) + (concisenessScore * cWeight));
    
    // Filler words (lower is better, so if fillerFreq is lower than comm.fillerWordFrequency, speed up reduction)
    let fwWeight = 0.3;
    if (fillerFreq < comm.fillerWordFrequency) {
      fwWeight = Math.min(0.8, 0.3 + ((comm.fillerWordFrequency - fillerFreq) / 10));
    }
    comm.fillerWordFrequency = parseFloat(((comm.fillerWordFrequency * (1 - fwWeight)) + (fillerFreq * fwWeight)).toFixed(1));
    
    // Conversation Flow
    let cfWeight = 0.2;
    if (flowScore > comm.conversationFlow) {
      cfWeight = Math.min(0.8, 0.2 + ((flowScore - comm.conversationFlow) / 100));
    }
    comm.conversationFlow = Math.round((comm.conversationFlow * (1 - cfWeight)) + (flowScore * cfWeight));

    // Log to history
    comm.history.push({
      timestamp: new Date().toISOString(),
      clarity: comm.answerClarity,
      conciseness: comm.conciseness
    });

    if (comm.history.length > 20) {
      comm.history.shift();
    }
  }
}
