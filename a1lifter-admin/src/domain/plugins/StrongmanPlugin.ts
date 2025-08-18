import { SportPlugin, AttemptValidation, AttemptScore, RankingResult, NextAttemptSuggestion, TiebreakResult, TimerSettings } from './SportPlugin';
import { Attempt } from '../entities/Attempt';
import { Athlete } from '../entities/Athlete';

export class StrongmanPlugin implements SportPlugin {
  readonly name = 'strongman';
  readonly sportName = 'Strongman';
  readonly version = '1.0.0';
  readonly supportedDisciplines = [
    'deadlift', 'squat', 'overhead_press', 'farmers_walk', 
    'yoke_walk', 'atlas_stones', 'tire_flip', 'truck_pull',
    'log_press', 'axle_deadlift'
  ];
  readonly disciplines = [
    'deadlift', 'squat', 'overhead_press', 'farmers_walk', 
    'yoke_walk', 'atlas_stones', 'tire_flip', 'truck_pull',
    'log_press', 'axle_deadlift'
  ];

  validateAttempt(_athleteId: string, _discipline: string, weight: number, _attemptNumber: number, _previousAttempts: Attempt[]): AttemptValidation {
    void _athleteId; void _discipline; void _attemptNumber; void _previousAttempts;
    const errors: string[] = [];
    
    // Mock validation logic
    if (weight <= 0) {
      errors.push('Il peso deve essere maggiore di zero');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  scoreAttempt(_athleteId: string, discipline: string, weight: number, isSuccessful: boolean, judgeDecisions: boolean[], metadata?: Record<string, unknown>): AttemptScore {
    // Strongman can have 1-3 judges depending on event
    const requiredJudges = this.getRequiredJudgesForDiscipline(discipline);
    
    if (judgeDecisions.length !== requiredJudges) {
      throw new Error(`${discipline} richiede esattamente ${requiredJudges} giudici`);
    }

    let calculatedScore: number;

    if (requiredJudges === 1) {
      // Single judge events (most strongman events)
      isSuccessful = judgeDecisions[0];
    } else {
      // Multiple judge events - majority rule
      const successfulVotes = judgeDecisions.filter(decision => decision).length;
      isSuccessful = successfulVotes > (requiredJudges / 2);
    }

    // Calculate score based on event type
    if (this.isWeightEvent(discipline)) {
      calculatedScore = isSuccessful ? weight : 0;
    } else if (this.isTimeEvent(discipline)) {
      // For time events, lower time = higher score
      const timeInSeconds = metadata?.timeInSeconds as number || 0; // Mock time
      calculatedScore = isSuccessful && timeInSeconds > 0 ? (1000 / timeInSeconds) : 0;
    } else {
      // Reps or distance events
      calculatedScore = isSuccessful ? ((metadata?.reps as number) || (metadata?.distance as number) || 1) : 0; // Mock score
    }

    return {
      isValid: isSuccessful,
      points: calculatedScore
      // details: { // Property not available in AttemptScore
      //   judgeVotes: judgeDecisions,
      //   eventType: this.getEventType(discipline),
      //   platform: metadata?.platform || 'default'
      // }
    };
  }

  calculateRanking(athletes: Athlete[], attempts: Attempt[]): RankingResult[] {
    const rankings: RankingResult[] = [];

    for (const athlete of athletes) {
      const athleteAttempts = attempts.filter(a => a.athleteId === athlete.id);
      
      // Calculate points for each discipline
      const disciplineScores: Record<string, number> = {};
      let totalPoints = 0;
      
      for (const discipline of this.disciplines) {
        const discAttempts = athleteAttempts.filter(a => a.discipline === discipline);
        
        if (discAttempts.length > 0) {
          const bestAttempt = this.getBestAttemptForDiscipline(discAttempts, discipline);
          const points = this.calculateEventPoints(bestAttempt, athletes, attempts, discipline);
          disciplineScores[discipline] = points;
          totalPoints += points;
        } else {
          disciplineScores[discipline] = 0;
        }
      }

      rankings.push({
        athleteId: athlete.id,
        rank: 0, // Will be calculated after sorting
        totalScore: totalPoints,
        breakdown: {
          total: totalPoints,
          disciplines: totalPoints // Mock breakdown as number
        }
        // disciplineScores, // Property not available in RankingResult
        // attempts: athleteAttempts.length, // Property not available in RankingResult
        // isDisqualified: false // Property not available in RankingResult
      });
    }

    // Sort by total points (highest first)
    return rankings.sort((a, b) => b.totalScore - a.totalScore);
  }

  proposeNextAttempt(athleteId: string, _discipline: string, previousAttempts: Attempt[], _competitionContext: Record<string, unknown>): NextAttemptSuggestion {
    void _discipline; void _competitionContext;
    const athleteAttempts = previousAttempts.filter(a => a.athleteId === athleteId);
    
    if (athleteAttempts.length === 0) {
      // First attempt - suggest opener based on discipline
      return {
        // discipline: 'deadlift', // Property not available in NextAttemptSuggestion
        suggestedWeight: Math.round(200 * 0.85), // Mock PR - in real implementation, fetch from athleteId
        reasoning: 'Primo tentativo - 85% del personal record',
        confidence: 0.8 // Mock confidence
      };
    }

    const lastAttempt = athleteAttempts[athleteAttempts.length - 1];
    // const sameDiscAttempts = athleteAttempts.filter(a => a.discipline === lastAttempt.discipline);
    
    let suggestedWeight: number;
    
    if (this.isWeightEvent(lastAttempt.discipline)) {
      if (lastAttempt.result?.isSuccessful) {
        // Successful - suggest 5-10kg increase for strongman
        suggestedWeight = (lastAttempt.actualWeight || lastAttempt.declaredWeight) + 10;
      } else {
        // Failed - suggest 2.5-5kg reduction
        suggestedWeight = lastAttempt.declaredWeight - 5;
      }
    } else {
      // For time/reps events, suggest improvement targets
      suggestedWeight = lastAttempt.declaredWeight;
    }

    return {
      // discipline: lastAttempt.discipline, // Property not available in NextAttemptSuggestion
      suggestedWeight,
      reasoning: lastAttempt.result?.isSuccessful 
        ? 'Tentativo riuscito - incremento peso'
        : 'Tentativo fallito - riduzione peso',
      confidence: 0.7 // Mock confidence
    };
  }

  resolveTiebreak(athletes: Athlete[]): TiebreakResult {
    // Strongman tiebreak: usually by performance in final event or bodyweight
    const sorted = [...athletes]; // No tiebreak sorting available
    
    return {
       winnerId: sorted[0].id,
       criteria: 'bodyweight', // Mock criteria
       details: { reason: 'Lighter bodyweight wins' } // Mock details as Record<string, any>
     };
  }

  getTimerSettings(): TimerSettings {
    return {
      attemptTime: 60,  // 1 minute for most events
      restTime: 300,    // 5 minutes between attempts (strongman needs more rest)
      warmupTime: 1200, // 20 minutes warmup

      // Timer stops automatically on event completion
    };
  }

  // Removed getMaxAttemptsForDiscipline method as it's no longer used

  private isWeightEvent(discipline: string): boolean {
    const weightEvents = ['deadlift', 'squat', 'overhead_press', 'log_press', 'axle_deadlift'];
    return weightEvents.includes(discipline);
  }

  private isTimeEvent(discipline: string): boolean {
    const timeEvents = ['farmers_walk', 'yoke_walk', 'truck_pull'];
    return timeEvents.includes(discipline);
  }

  // Removed getEventType method as it's no longer used

  private getRequiredJudgesForDiscipline(discipline: string): number {
    // Most strongman events use single judge
    const multiJudgeEvents = ['overhead_press', 'squat'];
    return multiJudgeEvents.includes(discipline) ? 3 : 1;
  }

  // Removed validateWeightProgression and validateTimeEvent methods as they are no longer used

  private getBestAttemptForDiscipline(attempts: Attempt[], discipline: string): Attempt {
    if (this.isWeightEvent(discipline)) {
      // Highest successful weight
      const successful = attempts.filter(a => a.result?.isSuccessful);
      return successful.reduce((best, current) => 
        (current.actualWeight || 0) > (best.actualWeight || 0) ? current : best
      );
    } else if (this.isTimeEvent(discipline)) {
      // Fastest successful time
      const successful = attempts.filter(a => a.result?.isSuccessful); // Simplified filtering
      return successful.reduce((best, current) => 
        current.declaredWeight > best.declaredWeight ? current : best // Mock time comparison using weight
      );
    } else {
      // Most reps/distance
      const successful = attempts.filter(a => a.result?.isSuccessful);
      return successful.reduce((best, current) => 
        // Mock comparison - in real implementation, use proper metadata structure
        current.declaredWeight > best.declaredWeight ? current : best // Mock weight comparison
      );
    }
  }

  private calculateEventPoints(attempt: Attempt, allAthletes: Athlete[], allAttempts: Attempt[], discipline: string): number {
    // Simplified points system - in real strongman, this would be more complex
    // Points based on placement in each event
    const disciplineAttempts = allAttempts.filter(a => a.discipline === discipline && a.result?.isSuccessful);
    
    if (!attempt.result?.isSuccessful) return 0;
    
    // Count how many athletes performed worse
    let betterPerformances = 0;
    
    for (const otherAttempt of disciplineAttempts) {
      if (otherAttempt.athleteId === attempt.athleteId) continue;
      
      if (this.isWeightEvent(discipline)) {
        if ((otherAttempt.actualWeight || 0) > (attempt.actualWeight || 0)) {
          betterPerformances++;
        }
      } else if (this.isTimeEvent(discipline)) {
        if ((otherAttempt.declaredWeight || 0) > (attempt.declaredWeight || 0)) { // Mock performance comparison
          betterPerformances++;
        }
      }
    }
    
    // Points = total athletes - placement + 1
    return Math.max(1, allAthletes.length - betterPerformances);
  }
}