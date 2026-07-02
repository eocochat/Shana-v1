export class InterruptionDetector {
  private static englishHesitationWords = ["uh", "um", "ah", "hmm", "well...", "like...", "er", "uhm"];
  private static frenchHesitationWords = ["euh", "bah", "ben", "hum", "euhm", "alors...", "hein"];

  // Web Audio API properties for audio stream level monitoring
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private monitorInterval: any = null;
  private isCurrentlyMonitoring: boolean = false;

  /**
   * Detects if the candidate speech input should count as an active interruption.
   * Checks if user actually started speaking or typing meaningful content.
   */
  public isInterruption(
    candidateText: string,
    isAiSpeaking: boolean
  ): boolean {
    if (!isAiSpeaking || !candidateText || !candidateText.trim()) {
      return false;
    }

    // A simple speech input of 1-2 chars might be noise or click.
    // If it has at least one word, it counts as interruption.
    const clean = candidateText.trim().toLowerCase();
    if (clean.length < 3) return false;

    return true;
  }

  /**
   * Starts real-time monitoring of an active Audio MediaStream (microphone input)
   * to detect voice activity/volume peaks and trigger an interruption callback.
   */
  public startAudioStreamMonitoring(
    stream: MediaStream,
    onInterruption: () => void,
    options: { thresholdDb?: number; durationMs?: number } = {}
  ): void {
    if (this.isCurrentlyMonitoring) {
      this.stopAudioStreamMonitoring();
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        console.warn("[InterruptionDetector] Web Audio API is not supported in this browser environment.");
        return;
      }

      this.audioContext = new AudioCtxClass();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);

      this.isCurrentlyMonitoring = true;
      const thresholdDb = options.thresholdDb ?? -45; // Decibel threshold for active speech
      const durationMs = options.durationMs ?? 150; // Required continuous sound duration to trigger

      let consecutiveActiveFrames = 0;
      const frameIntervalMs = 30; // Check every 30ms
      const requiredFrames = Math.max(1, Math.floor(durationMs / frameIntervalMs));

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);

      this.monitorInterval = setInterval(() => {
        if (!this.analyser || !this.isCurrentlyMonitoring) return;

        // Get Decibel values for the frequency bins
        this.analyser.getFloatFrequencyData(dataArray);

        // Find the maximum decibel level across the spectrum
        let maxDb = -Infinity;
        for (let i = 0; i < bufferLength; i++) {
          if (dataArray[i] > maxDb) {
            maxDb = dataArray[i];
          }
        }

        // If the audio level exceeds our speaking decibel threshold, count a frame
        if (maxDb > thresholdDb) {
          consecutiveActiveFrames++;
          if (consecutiveActiveFrames >= requiredFrames) {
            console.log(`[InterruptionDetector] Voice activity detected! Max volume: ${maxDb.toFixed(1)}dB exceeds threshold: ${thresholdDb}dB for ${durationMs}ms`);
            onInterruption();
            consecutiveActiveFrames = 0; // Reset after trigger to avoid repeating instantly
          }
        } else {
          // Decay or reset the consecutive frame counter if the sound drops
          consecutiveActiveFrames = Math.max(0, consecutiveActiveFrames - 1);
        }
      }, frameIntervalMs);

      console.log(`[InterruptionDetector] Started monitoring microphone stream activity. Threshold: ${thresholdDb}dB`);
    } catch (err) {
      console.error("[InterruptionDetector] Failed to initialize Web Audio monitor:", err);
    }
  }

  /**
   * Cleans up Web Audio nodes, interval timers, and active AudioContext.
   */
  public stopAudioStreamMonitoring(): void {
    this.isCurrentlyMonitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    if (this.audioContext) {
      try {
        if (this.audioContext.state !== "closed") {
          this.audioContext.close();
        }
      } catch (err) {
        console.warn("[InterruptionDetector] Error closing AudioContext:", err);
      }
      this.audioContext = null;
    }
    this.analyser = null;
    console.log("[InterruptionDetector] Audio stream monitoring stopped.");
  }

  /**
   * Evaluates if the candidate input indicates standard speech hesitation.
   * Hesitations should be handled gracefully (waiting briefly, not cutting off, or offering comfort).
   */
  public detectHesitation(candidateText: string, isFrench: boolean = false): boolean {
    if (!candidateText) return false;

    const text = candidateText.toLowerCase().trim();
    const hesitationList = isFrench ? InterruptionDetector.frenchHesitationWords : InterruptionDetector.englishHesitationWords;

    // 1. Check if the text matches exactly or ends with a hesitation word
    for (const word of hesitationList) {
      if (text === word || text.endsWith(` ${word}`) || text.startsWith(`${word} `) || text.includes(` ${word} `)) {
        return true;
      }
    }

    // 2. Check for trail of dots or long slow hesitation patterns e.g. "i... i..." or "je... je..."
    if (text.includes("...") || text.endsWith("...")) {
      return true;
    }

    // 3. Repeated single words at the start with pauses (e.g., "i... i...", "je... je...")
    const repeatedWordRegex = /^(\b\w+\b)\s+\1\b/i;
    if (repeatedWordRegex.test(text)) {
      return true;
    }

    return false;
  }

  /**
   * Detects silence or inactive periods.
   * If candidate has been silent for a specific duration, we can handle it as idle or completed turn.
   */
  public isSilence(lastInputTimeMs: number, thresholdMs: number = 3000): boolean {
    if (lastInputTimeMs <= 0) return false;
    return Date.now() - lastInputTimeMs >= thresholdMs;
  }
}
