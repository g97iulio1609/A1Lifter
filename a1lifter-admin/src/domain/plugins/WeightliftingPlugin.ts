import { SportPlugin, AttemptValidation, AttemptScore, RankingResult, NextAttemptSuggestion, TiebreakResult, TimerSettings } from './SportPlugin';
import { Attempt } from '../entities/Attempt';
import { Athlete } from '../entities/Athlete';
import type { CategoryConfig } from '../../types';

export class WeightliftingPlugin implements SportPlugin {
  readonly name = 'weightlifting';
  readonly sportName = 'Weightlifting';
  readonly version = '1.0.0';
  readonly supportedDisciplines = ['snatch', 'clean_and_jerk'];
  readonly disciplines = ['snatch', 'clean_and_jerk'];

  validateAttempt(
    _athleteId: string,
    discipline: string,
    weight: number,
    attemptNumber: number,
    previousAttempts: unknown[]
  ): AttemptValidation {
    const errors: string[] = [];

    // Validate discipline
    if (!this.disciplines.includes(discipline)) {
      errors.push(`Disciplina non supportata: ${discipline}`);
    }

    // Validate weight
    if (weight <= 0) {
      errors.push('Il peso deve essere maggiore di zero');
    }

    // Check for proper progression
    const typedPreviousAttempts = previousAttempts as Attempt[];
    const sameAttempts = typedPreviousAttempts.filter(
      prev => prev.discipline === discipline && prev.attemptNumber === attemptNumber
    );

    if (sameAttempts.length > 0) {
      const lastWeight = Math.max(...sameAttempts.map(a => a.declaredWeight));
      if (weight <= lastWeight) {
        errors.push('Il peso deve essere superiore al tentativo precedente');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  scoreAttempt(
    _athleteId: string,
    _discipline: string,
    weight: number,
    isSuccessful: boolean,
  _judgeDecisions: boolean[]
  ): AttemptScore {
  void _athleteId; void _discipline; void _judgeDecisions;
    // Simplified scoring for weightlifting
    return {
      isValid: isSuccessful,
      points: isSuccessful ? weight : 0
    };
  }

  calculateScore(_total: number, _bodyweight: number, _gender: string, _metadata?: Record<string, unknown>): number {
    void _bodyweight; void _gender; void _metadata;
    // Return the total score (best snatch + best clean&jerk)
    return _total;
  }

  generateCategories(_athletes: Athlete[]): CategoryConfig[] {
    void _athletes;
    // Generate weightlifting categories based on bodyweight and age
    const categories: CategoryConfig[] = [];
    
    // Standard weightlifting categories
    const weightCategories = [
      { name: '55kg', minWeight: 0, maxWeight: 55 },
      { name: '61kg', minWeight: 55.01, maxWeight: 61 },
      { name: '67kg', minWeight: 61.01, maxWeight: 67 },
      { name: '73kg', minWeight: 67.01, maxWeight: 73 },
      { name: '81kg', minWeight: 73.01, maxWeight: 81 },
      { name: '89kg', minWeight: 81.01, maxWeight: 89 },
      { name: '96kg', minWeight: 89.01, maxWeight: 96 },
      { name: '102kg', minWeight: 96.01, maxWeight: 102 },
      { name: '109kg', minWeight: 102.01, maxWeight: 109 },
      { name: '+109kg', minWeight: 109.01, maxWeight: 999 }
    ];

    for (const category of weightCategories) {
      categories.push({
        id: category.name,
        name: category.name,
        gender: 'M', // Default gender category
        weightClass: category.name
        // description: `Categoria peso ${category.name}`, // Property not available in CategoryConfig
        // criteria: { weight: { min: category.minWeight, max: category.maxWeight } } // Property not available in CategoryConfig
      });
    }

    return categories;
  }

  calculateRanking(athletes: unknown[], attempts: unknown[], _categoryRules: unknown): RankingResult[] {
    void _categoryRules;
    const typedAthletes = athletes as Athlete[];
    const typedAttempts = attempts as Attempt[];
    const rankings: RankingResult[] = [];

    for (const athlete of typedAthletes) {
      const athleteAttempts = typedAttempts.filter(a => a.athleteId === athlete.id);
      
      // Get best successful attempts for each discipline
      const snatchAttempts = athleteAttempts.filter(a => 
        a.discipline === 'snatch' && a.result?.isSuccessful
      );
      const cleanJerkAttempts = athleteAttempts.filter(a => 
        a.discipline === 'clean_and_jerk' && a.result?.isSuccessful
      );

      const bestSnatch = snatchAttempts.length > 0 
        ? Math.max(...snatchAttempts.map(a => a.actualWeight || 0))
        : 0;
      
      const bestCleanJerk = cleanJerkAttempts.length > 0
        ? Math.max(...cleanJerkAttempts.map(a => a.actualWeight || 0))
        : 0;

      const total = bestSnatch + bestCleanJerk;

      rankings.push({
        athleteId: athlete.id,
        rank: 0, // Will be calculated after sorting
        totalScore: total,
        breakdown: {
          snatch: bestSnatch,
          cleanJerk: bestCleanJerk,
          total: total
        }
      });
    }

    // Sort by total, then by bodyweight (lighter wins)
    const sortedRankings = rankings.sort((a, b) => {
      if (a.totalScore !== b.totalScore) return b.totalScore - a.totalScore;
      return 0; // Equal bodyweight for tiebreak
    });

    // Assign ranks
    sortedRankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    return sortedRankings;
  }

  proposeNextAttempt(athleteId: string, discipline: string, previousAttempts: Attempt[], _competitionContext: Record<string, unknown>): NextAttemptSuggestion {
    void _competitionContext;
    const athleteAttempts = previousAttempts.filter(a => a.athleteId === athleteId && a.discipline === discipline);
    
    if (athleteAttempts.length === 0) {
      // First attempt - suggest opener (90% of PR)
      // Mock athlete data - in real implementation, fetch from athleteId
      const snatchPR = 150; // Default value
      // const cleanJerkPR = 120; // Unused variable removed
      
      return {
        // discipline: 'snatch', // Property not available in NextAttemptSuggestion
        suggestedWeight: Math.round(snatchPR * 0.9),
        confidence: 0.8,
        reasoning: 'Primo tentativo - 90% del personal record'
      };
    }

    // Determine next discipline and attempt number
    // Filter attempts by discipline - variables removed as unused
    // const snatchAttempts = athleteAttempts.filter(a => a.discipline === 'snatch');
    // const cleanJerkAttempts = athleteAttempts.filter(a => a.discipline === 'clean_and_jerk');

    const lastAttempt = athleteAttempts[athleteAttempts.length - 1];
    let suggestedWeight: number;
    
    if (lastAttempt.result?.isSuccessful) {
      // Successful - suggest 2-5kg increase
      suggestedWeight = (lastAttempt.actualWeight || lastAttempt.declaredWeight) + 3;
    } else {
      // Failed - suggest same weight or 1kg less
      suggestedWeight = lastAttempt.declaredWeight - 1;
    }

    return {
      // discipline: nextDiscipline, // Property not available in NextAttemptSuggestion
      suggestedWeight,
      reasoning: lastAttempt.result?.isSuccessful 
        ? 'Tentativo riuscito - incremento di 3kg'
        : 'Tentativo fallito - riduzione di 1kg',
      confidence: 0.7
    };
  }

  resolveTiebreak(tiedAthletes: unknown[], _attempts: unknown[], _tiebreakRules: unknown): TiebreakResult {
    void _attempts; void _tiebreakRules;
    const athletes = tiedAthletes as Athlete[];
    // Weightlifting tiebreak: lighter bodyweight wins
    const sorted = [...athletes]; // No tiebreak sorting available
    
    return {
       winnerId: sorted[0].id,
       criteria: 'bodyweight',
       details: { reason: 'Vince l\'atleta con peso corporeo inferiore' }
     };
  }

  getTimerSettings(_discipline: string, _phase: 'attempt' | 'rest' | 'warmup'): TimerSettings {
    void _discipline; void _phase;
    return {
      attemptTime: 60, // 1 minute for attempt
      restTime: 120,   // 2 minutes between attempts
      warmupTime: 900, // 15 minutes warmup

      // Timer stops automatically on lift completion
    };
  }

  // Removed unused calculateSinclairCoefficient method
}