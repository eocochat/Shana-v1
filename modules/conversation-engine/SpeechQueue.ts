export interface SpeechItem {
  id: string;
  text: string;
  processedText: string;
  audioUrl?: string;
  audioElement?: HTMLAudioElement | null;
}

export class SpeechQueue {
  private queue: SpeechItem[] = [];
  private currentItem: SpeechItem | null = null;
  private playbackProgress: number = 0; // Character index where playback is currently at

  public enqueue(item: SpeechItem): void {
    this.queue.push(item);
    console.log(`[SpeechQueue] Enqueued item: ${item.id}. Queue size: ${this.queue.length}`);
  }

  public getNext(): SpeechItem | null {
    if (this.queue.length === 0) return null;
    this.currentItem = this.queue.shift() || null;
    this.playbackProgress = 0;
    return this.currentItem;
  }

  public getCurrent(): SpeechItem | null {
    return this.currentItem;
  }

  public getQueue(): SpeechItem[] {
    return [...this.queue];
  }

  /**
   * Tracks current playback progress (number of characters spoken)
   */
  public updateProgress(charIndex: number): void {
    this.playbackProgress = charIndex;
  }

  public getProgress(): number {
    return this.playbackProgress;
  }

  /**
   * Stops the active audio element if any, and saves the resume position
   */
  public stopAndSavePosition(): { text: string; position: number } | null {
    if (!this.currentItem) return null;

    const audio = this.currentItem.audioElement;
    if (audio) {
      try {
        audio.pause();
      } catch (err) {
        console.warn("[SpeechQueue] Error pausing audio:", err);
      }
    }

    const result = {
      text: this.currentItem.processedText,
      position: this.playbackProgress,
    };

    console.log(`[SpeechQueue] Stopped playback and saved position at character index: ${this.playbackProgress}`);
    return result;
  }

  public clear(): void {
    console.log("[SpeechQueue] Clearing all queued speech items.");
    this.queue.forEach((item) => {
      if (item.audioElement) {
        try {
          item.audioElement.pause();
          item.audioElement.src = "";
        } catch (err) {
          // Swallow
        }
      }
    });
    this.queue = [];
    this.currentItem = null;
    this.playbackProgress = 0;
  }
}
