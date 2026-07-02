/**
 * InterviewVoiceManager
 * 
 * High-fidelity single-source-of-truth utility coordinating all audio playback,
 * text-to-speech (TTS), and speech/voice synthesis across the application.
 * 
 * Ensures that only the primary active assessment/interviewer (e.g. Shana / OpenAI)
 * can output voice or capture audio, actively interrupting and blocking secondary,
 * stale, or conflicting background voices or training flows.
 */

type VoiceOwner = 'ASSESSMENT_PRIMARY' | 'MIRROR_ROOM' | 'INTERVIEW_SIMULATOR' | 'VOICE_TRAINING' | 'SYSTEM' | null;

class InterviewVoiceManagerClass {
  private activeOwner: VoiceOwner = null;
  private activeAudioElements: Set<HTMLAudioElement> = new Set();
  private activeUtterances: Set<SpeechSynthesisUtterance> = new Set();
  private listeners: Set<(owner: VoiceOwner) => void> = new Set();

  /**
   * Request exclusive audio lock for a specific module.
   * Interrupts any currently running audio outputs or speech synthesis.
   */
  public acquireLock(owner: VoiceOwner): boolean {
    console.log(`[InterviewVoiceManager] Lock requested by: ${owner}`);
    
    // Interrupt current outputs
    this.stopAllActiveOutputs();

    this.activeOwner = owner;
    this.notifyListeners();
    return true;
  }

  /**
   * Release the lock if held by the owner.
   */
  public releaseLock(owner: VoiceOwner): void {
    if (this.activeOwner === owner) {
      console.log(`[InterviewVoiceManager] Lock released by: ${owner}`);
      this.stopAllActiveOutputs();
      this.activeOwner = null;
      this.notifyListeners();
    }
  }

  /**
   * Get the current active owner who has exclusive audio rights.
   */
  public getActiveOwner(): VoiceOwner {
    return this.activeOwner;
  }

  /**
   * Check if a specific owner is allowed to produce audio.
   */
  public isAllowed(owner: VoiceOwner): boolean {
    // If no active lock exists, allow anyone.
    // If a lock exists, only allow the active owner or system.
    if (owner === 'SYSTEM') return true;
    if (this.activeOwner === null) return true;
    return this.activeOwner === owner;
  }

  /**
   * Stops all running audio elements and cancels window.speechSynthesis.
   */
  public stopAllActiveOutputs(): void {
    console.log(`[InterviewVoiceManager] Stopping all active speech and audio outputs.`);
    
    // 1. Cancel web speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn('[InterviewVoiceManager] Failed to cancel speechSynthesis:', err);
      }
    }

    // 2. Pause and clear HTML5 audio elements
    this.activeAudioElements.forEach(audio => {
      try {
        audio.pause();
        audio.src = '';
      } catch (err) {
        // Safe swallow
      }
    });
    this.activeAudioElements.clear();
    this.activeUtterances.clear();
  }

  /**
   * Wrapper around SpeechSynthesisUtterance speak requests.
   * Only allows speech if the owner is authorized.
   */
  public speakLocal(text: string, langCode: string, owner: VoiceOwner, onEnd?: () => void): void {
    if (!this.isAllowed(owner)) {
      console.warn(`[InterviewVoiceManager] Blocked local speak from '${owner}' due to active lock: '${this.activeOwner}'`);
      if (onEnd) onEnd();
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('[InterviewVoiceManager] speechSynthesis not supported in this browser.');
      if (onEnd) onEnd();
      return;
    }

    // Stop current to prevent multi-voice overlapping
    this.stopAllActiveOutputs();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;

    // Try to find a natural-sounding voice for the language
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase().substring(0, 2)));
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      this.activeUtterances.delete(utterance);
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      console.error('[InterviewVoiceManager] Speech synthesis error:', err);
      this.activeUtterances.delete(utterance);
      if (onEnd) onEnd();
    };

    this.activeUtterances.add(utterance);
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Wrapper for server-side synthesized audio speech.
   * Automatically registers, checks permissions, and tracks the HTMLAudioElement lifecycle.
   */
  public playServerAudio(url: string, owner: VoiceOwner, onEnd?: () => void, onError?: (err: any) => void): HTMLAudioElement | null {
    if (!this.isAllowed(owner)) {
      console.warn(`[InterviewVoiceManager] Blocked server audio play from '${owner}' due to active lock: '${this.activeOwner}'`);
      return null;
    }

    // Stop current to prevent multi-voice overlapping
    this.stopAllActiveOutputs();

    const audio = new Audio(url);
    this.activeAudioElements.add(audio);

    audio.onended = () => {
      this.activeAudioElements.delete(audio);
      if (onEnd) onEnd();
    };

    audio.onerror = (err) => {
      this.activeAudioElements.delete(audio);
      if (onError) onError(err);
    };

    audio.play().catch(err => {
      this.activeAudioElements.delete(audio);
      if (onError) onError(err);
    });

    return audio;
  }

  /**
   * Subscribe to active lock owner changes.
   */
  public subscribe(callback: (owner: VoiceOwner) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.activeOwner);
      } catch (err) {
        console.error('[InterviewVoiceManager] Listener notification error:', err);
      }
    });
  }
}

export const InterviewVoiceManager = new InterviewVoiceManagerClass();
