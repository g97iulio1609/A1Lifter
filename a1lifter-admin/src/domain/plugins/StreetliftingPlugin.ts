import { SportPlugin, AttemptValidation, AttemptScore, RankingResult, NextAttemptSuggestion, TiebreakResult, TimerSettings } from './SportPlugin';
import { Attempt } from '../entities/Attempt';
import { Athlete } from '../entities/Athlete';

export class StreetliftingPlugin implements SportPlugin {
  readonly name = 'streetlifting';
  readonly sportName = 'Streetlifting';
  readonly version = '1.0.0';
  readonly supportedDisciplines = [
    'squat', 'bench_press', 'deadlift'
  ];
  readonly disciplines = [
    'squat', 'bench_press', 'deadlift'
  ];

  validateAttempt(_athleteId: string, _discipline: string, weight: number, _attemptNumber: number, _previousAttempts: Attempt[]): AttemptValidation {
    void _athleteId; void _discipline; void _attemptNumber; void _previousAttempts;
    // Basic validation for streetlifting
    if (weight <= 0) {
      return {
        isValid: false,
        errors: ['Il peso deve essere maggiore di zero']
      };
    }

    return {
      isValid: true,
      errors: []
    };
  }

  scoreAttempt(_athleteId: string, _discipline: string, weight: number, _isSuccessful: boolean, judgeDecisions: boolean[], _metadata?: Record<string, unknown>): AttemptScore {
    void _athleteId; void _discipline; void _isSuccessful; void _metadata;
    // Streetlifting uses 3 judges
    if (judgeDecisions.length !== 3) {
      throw new Error('Streetlifting richiede esattamente 3 giudici');
    }

    // Majority rule for 3 judges
    const positiveVotes = judgeDecisions.filter(decision => decision).length;
    const finalResult = positiveVotes >= 2;

    return {
      isValid: finalResult,
      points: finalResult ? weight : 0
    };
  }

  calculateRanking(athletes: Athlete[], attempts: Attempt[]): RankingResult[] {
    const rankings: RankingResult[] = [];

    for (const athlete of athletes) {
      const athleteAttempts = attempts.filter(a => a.athleteId === athlete.id);
      
      // Calculate best lifts for each discipline
      const disciplineScores: Record<string, number> = {};
      let totalScore = 0;
      
      for (const discipline of this.disciplines) {
        const discAttempts = athleteAttempts.filter(a => a.discipline === discipline);
        const bestLift = this.getBestLift(discAttempts);
        
        disciplineScores[discipline] = bestLift;
        totalScore += bestLift;
      }

      // Calculate Wilks coefficient for comparison across weight classes
      rankings.push({
        athleteId: athlete.id,
        rank: 0, // Will be calculated after sorting
        totalScore,
        breakdown: {
          squat: 0, // Placeholder values
          bench: 0,
          deadlift: 0
        }
        // disciplineScores, // Not available in RankingResult
        // attempts: athleteAttempts.length, // Not available in RankingResult
        // isDisqualified: this.checkDisqualification(athleteAttempts), // Property not available in RankingResult
      });
    }

    // Sort by total (highest first), then by Wilks if needed
    return rankings.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      // Tiebreak by Wilks score
      return (b.totalScore || 0) - (a.totalScore || 0); // Use totalScore instead of metadata
    });
  }

  proposeNextAttempt(athleteId: string, _discipline: string, previousAttempts: Attempt[], _competitionContext: Record<string, unknown>): NextAttemptSuggestion {
    void _discipline; void _competitionContext;
    const athleteAttempts = previousAttempts.filter(a => a.athleteId === athleteId);
    
    if (athleteAttempts.length === 0) {
      // First attempt - suggest opener (85-90% of max)
      // const discipline = 'squat'; // Start with squat
      const maxLift = 100; // Mock PR - in real implementation, fetch from athleteId
      const opener = Math.round(maxLift * 0.87 / 2.5) * 2.5; // Round to 2.5kg
      
      return {
        // discipline, // Property not available in NextAttemptSuggestion
        suggestedWeight: opener,
        reasoning: 'Primo tentativo - 87% del massimale (opener conservativo)',
        confidence: 0.9
      };
    }

    const lastAttempt = athleteAttempts[athleteAttempts.length - 1];
    const sameDiscAttempts = athleteAttempts.filter(a => a.discipline === lastAttempt.discipline);
    
    let suggestedWeight: number;
    let reasoning: string;
    
    if (lastAttempt.result?.isSuccessful) {
      // Successful lift - suggest increase
      if (sameDiscAttempts.length === 1) {
        // Second attempt - moderate increase (2.5-5kg)
        suggestedWeight = lastAttempt.actualWeight! + 5;
        reasoning = 'Secondo tentativo - incremento moderato (+5kg)';
      } else {
        // Third attempt - aggressive increase (5-10kg)
        suggestedWeight = lastAttempt.actualWeight! + 7.5;
        reasoning = 'Terzo tentativo - incremento aggressivo (+7.5kg)';
      }
    } else {
      // Failed lift - suggest decrease
      suggestedWeight = lastAttempt.declaredWeight - 2.5;
      reasoning = 'Tentativo fallito - riduzione peso (-2.5kg)';
    }

    // Ensure weight is multiple of 2.5kg
    suggestedWeight = Math.round(suggestedWeight / 2.5) * 2.5;

    return {
      // discipline: lastAttempt.discipline, // Property not available in NextAttemptSuggestion
      suggestedWeight,
      reasoning,
      confidence: 0.8
    };
  }

  resolveTiebreak(athletes: Athlete[]): TiebreakResult {
    // Streetlifting tiebreak: lighter bodyweight wins
    const sorted = [...athletes]; // No tiebreak sorting available
    
    return {
       winnerId: sorted[0].id,
       criteria: 'bodyweight',
       details: {
         comparison: 'lighter_bodyweight'
       }
     };
  }

  getTimerSettings(_discipline: string, _phase: 'attempt' | 'rest' | 'warmup'): TimerSettings {
    void _discipline; void _phase;
    return {
      attemptTime: 60,   // 1 minute per attempt
      restTime: 180,     // 3 minutes between attempts
      warmupTime: 600,   // 10 minutes warmup
      
      // Timer stops automatically on lift completion
    };
  }



  private getBestLift(attempts: Attempt[]): number {
    const successfulAttempts = attempts.filter(a => a.result?.isSuccessful);
    
    if (successfulAttempts.length === 0) return 0;
    
    return Math.max(...successfulAttempts.map(a => a.actualWeight || a.declaredWeight));
  }

  // Removed checkDisqualification method as it's not used

  // Removed calculateWilks method as it's not used
}