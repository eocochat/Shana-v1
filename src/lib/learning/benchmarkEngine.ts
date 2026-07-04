export interface AnonymousRoleBenchmark {
  role: string;
  averageConfidence: number; // 0 to 100
  averageStarScore: number; // 0 to 100
  averageSpeakingSpeedWpm: number;
  averageInterviewDurationSeconds: number;
  sampleSizeCount: number;
}

export class BenchmarkEngine {
  private static benchmarks: AnonymousRoleBenchmark[] = [
    {
      role: 'Junior Frontend Developer',
      averageConfidence: 68,
      averageStarScore: 65,
      averageSpeakingSpeedWpm: 128,
      averageInterviewDurationSeconds: 450,
      sampleSizeCount: 340
    },
    {
      role: 'Senior Full Stack Engineer',
      averageConfidence: 85,
      averageStarScore: 82,
      averageSpeakingSpeedWpm: 120,
      averageInterviewDurationSeconds: 680,
      sampleSizeCount: 420
    },
    {
      role: 'Product Manager',
      averageConfidence: 88,
      averageStarScore: 78,
      averageSpeakingSpeedWpm: 135,
      averageInterviewDurationSeconds: 720,
      sampleSizeCount: 210
    }
  ];

  /**
   * Retrieves benchmark mapping for a given job title
   */
  static getBenchmark(role: string): AnonymousRoleBenchmark {
    const term = role.toLowerCase();
    const matched = this.benchmarks.find(b => 
      term.includes(b.role.toLowerCase()) || 
      b.role.toLowerCase().includes(term)
    );

    if (matched) {
      return matched;
    }

    // Return a default baseline average benchmark across all roles
    return {
      role: 'Standard Candidate Average',
      averageConfidence: 75,
      averageStarScore: 72,
      averageSpeakingSpeedWpm: 125,
      averageInterviewDurationSeconds: 580,
      sampleSizeCount: 970
    };
  }

  /**
   * Updates benchmarks anonymously based on completed interview data
   */
  static submitToBenchmark(
    role: string,
    confidence: number,
    starScore: number,
    wpm: number,
    durationSeconds: number
  ): void {
    const term = role.toLowerCase();
    let b = this.benchmarks.find(item => item.role.toLowerCase() === term);

    if (!b) {
      b = {
        role,
        averageConfidence: confidence,
        averageStarScore: starScore,
        averageSpeakingSpeedWpm: wpm,
        averageInterviewDurationSeconds: durationSeconds,
        sampleSizeCount: 1
      };
      this.benchmarks.push(b);
      return;
    }

    // Run moving average integration
    const count = b.sampleSizeCount;
    b.averageConfidence = Math.round((b.averageConfidence * count + confidence) / (count + 1));
    b.averageStarScore = Math.round((b.averageStarScore * count + starScore) / (count + 1));
    b.averageSpeakingSpeedWpm = Math.round((b.averageSpeakingSpeedWpm * count + wpm) / (count + 1));
    b.averageInterviewDurationSeconds = Math.round((b.averageInterviewDurationSeconds * count + durationSeconds) / (count + 1));
    b.sampleSizeCount += 1;
  }

  /**
   * Run comparison metric mapping
   */
  static compareToBenchmark(
    role: string,
    userConfidence: number,
    userStar: number,
    userWpm: number
  ): {
    confidenceDelta: number;
    starDelta: number;
    wpmDelta: number;
    benchmarkRef: AnonymousRoleBenchmark;
  } {
    const b = this.getBenchmark(role);
    return {
      confidenceDelta: userConfidence - b.averageConfidence,
      starDelta: userStar - b.averageStarScore,
      wpmDelta: userWpm - b.averageSpeakingSpeedWpm,
      benchmarkRef: b
    };
  }

  /**
   * Returns all benchmarks
   */
  static getAllBenchmarks(): AnonymousRoleBenchmark[] {
    return [...this.benchmarks];
  }
}
