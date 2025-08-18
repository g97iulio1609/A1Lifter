import {
  SportPlugin,
  AttemptScore,
  RankingResult,
  NextAttemptSuggestion,
  TiebreakResult,
  TimerSettings,
  AttemptValidation
} from '../SportPlugin';
import { Athlete } from '../../entities/Athlete';
import { Attempt } from '../../entities/Attempt';

export class PowerliftingPlugin implements SportPlugin {
  readonly sportName = 'powerlifting';
  readonly version = '1.0.0';
  readonly supportedDisciplines = ['squat', 'bench', 'deadlift'];
  readonly disciplines = ['squat', 'bench', 'deadlift'];

  validateAttempt(
  _athleteId: string,
    discipline: string,
    weight: number,
    attemptNumber: number,
    previousAttempts: unknown[]
  ): AttemptValidation {
  void _athleteId;
    
    const errors: string[] = [];
    const typedPreviousAttempts = previousAttempts as Attempt[];

    // Check discipline validity
    if (!this.supportedDisciplines.includes(discipline)) {
      errors.push(`Disciplina non supportata: ${discipline}`);
    }

    // Check attempt number (1-3 for powerlifting)
    if (attemptNumber < 1 || attemptNumber > 3) {
      errors.push('Numero tentativo deve essere tra 1 e 3');
    }

    // Check weight progression (must increase or stay same)
    const lastSuccessfulAttempt = typedPreviousAttempts && typedPreviousAttempts.length > 0
      ? typedPreviousAttempts
          .filter(a => a.discipline === discipline && (a.isSuccessful() || a.status === 'completed'))
          .sort((a, b) => b.attemptNumber - a.attemptNumber)[0]
      : null;

    if (lastSuccessfulAttempt && weight < lastSuccessfulAttempt.actualWeight) {
      errors.push('Weight must be higher than previous successful attempt');
    }

    // Minimum weight increment (2.5kg for powerlifting)
    if (lastSuccessfulAttempt && weight > lastSuccessfulAttempt.actualWeight && (weight - lastSuccessfulAttempt.actualWeight) < 2.5) {
      errors.push('Incremento minimo: 2.5kg');
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
  _isSuccessful: boolean,
    judgeDecisions: boolean[],
    _metadata?: Record<string, unknown>
  ): AttemptScore {
  void _athleteId; void _discipline; void _isSuccessful; void _metadata;
    // Powerlifting requires 2/3 white lights
    const whiteFlags = judgeDecisions.filter(decision => decision).length;
    const isValid = whiteFlags >= 2;

    return {
      points: isValid ? weight : 0,
      isValid,
      metadata: {
        whiteFlags,
        redFlags: judgeDecisions.length - whiteFlags,
        judgeDecisions
      }
    };
  }

  calculateRanking(
    athletes: Athlete[],
    attempts: Attempt[],
    _categoryRules: Record<string, unknown>
  ): RankingResult[] {
  void _categoryRules;
    const results = athletes.map(athlete => {
      const athleteAttempts = attempts.filter(a => a.athleteId === athlete.id);
      
      // Get best valid attempt for each discipline
      const bestSquat = this.getBestAttempt(athleteAttempts, 'squat');
      const bestBench = this.getBestAttempt(athleteAttempts, 'bench');
      const bestDeadlift = this.getBestAttempt(athleteAttempts, 'deadlift');

      const total = (bestSquat?.actualWeight || 0) + (bestBench?.actualWeight || 0) + (bestDeadlift?.actualWeight || 0);

      // Calculate coefficient score (Wilks, DOTS, IPF)
      const coefficientScore = this.calculateCoefficientScore(
        total,
        70, // Default bodyweight - should be provided in athlete profile
        athlete.gender
      );

      return {
        athleteId: athlete.id,
        rank: 0, // Will be set after sorting
        totalScore: total,
        breakdown: {
          squat: bestSquat?.actualWeight || 0,
          bench: bestBench?.actualWeight || 0,
          deadlift: bestDeadlift?.actualWeight || 0,
          coefficientScore
        }
      };
    });

    // Sort by total, then by coefficient score for tiebreaks
    results.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return b.breakdown.coefficientScore - a.breakdown.coefficientScore;
    });

    // Assign ranks
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    return results;
  }

  proposeNextAttempt(
  _athleteId: string,
    discipline: string,
    previousAttempts: Attempt[],
    competitionContext: Record<string, unknown>
  ): NextAttemptSuggestion {
  void _athleteId;
    const disciplineAttempts = previousAttempts
      .filter(a => a.discipline === discipline)
      .sort((a, b) => a.attemptNumber - b.attemptNumber);

    const lastAttempt = disciplineAttempts[disciplineAttempts.length - 1];
    
    if (!lastAttempt) {
      // First attempt - suggest opener (90% of current max)
      const currentMax = (competitionContext.athletePersonalBests as Record<string, number>)?.[discipline] || 100;
      return {
        suggestedWeight: Math.round(currentMax * 0.9 / 2.5) * 2.5,
        reasoning: 'Apertura consigliata (90% del massimale)',
        confidence: 0.8
      };
    }

    if (lastAttempt.isSuccessful()) {
      // Successful attempt - suggest 5-10kg increase
      const increment = disciplineAttempts.length === 1 ? 7.5 : 5;
      return {
        suggestedWeight: lastAttempt.actualWeight + increment,
        reasoning: `Incremento dopo tentativo riuscito (+${increment}kg)`,
        confidence: 0.7
      };
    } else {
      // Failed attempt - suggest same weight or small decrease
      const adjustment = disciplineAttempts.length === 3 ? -2.5 : 0;
      return {
        suggestedWeight: lastAttempt.actualWeight + adjustment,
        reasoning: adjustment < 0 ? 'Riduzione dopo fallimento' : 'Ripetizione peso',
        confidence: 0.6
      };
    }
  }

  resolveTiebreak(
    tiedAthletes: Athlete[]
  ): TiebreakResult {
    // Powerlifting tiebreak: bodyweight (lighter wins)
    const sorted = tiedAthletes.sort(() => 0);
    
    return {
      winnerId: sorted[0].id,
      criteria: 'bodyweight',
      details: {
        bodyweights: sorted.map(a => ({ id: a.id, bodyweight: 70 })) // Default bodyweight
      }
    };
  }

  getTimerSettings(discipline: string, _phase: 'attempt' | 'rest' | 'warmup'): TimerSettings {
    void _phase;
    const baseSettings = {
      attemptTime: 60, // 1 minute for attempt
      restTime: 300,   // 5 minutes between attempts
      warmupTime: 120  // 2 minutes warmup
    };

    // Deadlift gets extra time
    if (discipline === 'deadlift') {
      baseSettings.attemptTime = 90;
    }

    return baseSettings;
  }

  getAttemptOrder(attempts: Attempt[]): Attempt[] {
    // Sort attempts by weight (ascending), then by attempt number (ascending)
    return attempts.sort((a, b) => {
      if (a.actualWeight !== b.actualWeight) {
        return a.actualWeight - b.actualWeight;
      }
      return a.attemptNumber - b.attemptNumber;
    });
  }

  generateCategories(): string[] {
    // Generate powerlifting categories based on bodyweight and age
    return [];
  }

  validateCategoryRules(): boolean {
    // Validate athlete meets category requirements
    return true;
  }

  calculateScore(
    total: number,
    bodyweight: number,
    gender: string
  ): number {
    // Calculate powerlifting score using Wilks coefficient
    return this.calculateWilks(total, bodyweight, gender);
  }

  private getBestAttempt(attempts: Attempt[], discipline: string) {
    return attempts
      .filter(a => a.discipline === discipline && (a.isSuccessful() || a.status === 'completed'))
      .sort((a, b) => b.actualWeight - a.actualWeight)[0];
  }

  calculateCoefficientScore(
    total: number,
    bodyweight: number,
    gender: string
  ): number {
    if (total === 0) return 0;

    // Simplified coefficient calculation - in real implementation,
    // use actual formulas for Wilks, DOTS, IPF
    const baseCoeff = gender === 'M' ? 1.0 : 1.2;
    const weightFactor = 600 / (bodyweight + 40);
    
    return Math.round(total * baseCoeff * weightFactor * 100) / 100;
  }

  private calculateWilks(
    total: number,
    bodyweight: number,
    gender: string
  ): number {
    if (total === 0 || bodyweight === 0) return 0;

    // Simplified Wilks calculation - in real implementation,
    // use the official Wilks formula with proper coefficients
    const baseCoeff = gender === 'M' ? 500 : 600;
    const wilksCoeff = baseCoeff / (bodyweight + 40);
    
    return Math.round(total * wilksCoeff * 100) / 100;
  }
}