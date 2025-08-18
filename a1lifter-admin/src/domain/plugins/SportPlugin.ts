/**
 * Sport Plugin Interface
 * Defines the contract for sport-specific implementations
 */

export interface AttemptValidation {
  isValid: boolean;
  errors: string[];
}

export interface AttemptScore {
  points: number;
  isValid: boolean;
  metadata?: Record<string, unknown>;
}

export interface RankingResult {
  athleteId: string;
  rank: number;
  totalScore: number;
  breakdown: Record<string, number>;
}

export interface NextAttemptSuggestion {
  suggestedWeight: number;
  reasoning: string;
  confidence: number;
}

export interface TiebreakResult {
  winnerId: string;
  criteria: string;
  details: Record<string, unknown>;
}

export interface TimerSettings {
  attemptTime: number; // seconds
  restTime: number; // seconds
  warmupTime: number; // seconds
}

export interface SportPlugin {
  readonly sportName: string;
  readonly version: string;
  readonly disciplines: string[];
  readonly supportedDisciplines: string[];

  /**
   * Validates an attempt according to sport-specific rules
   */
  validateAttempt(
    athleteId: string,
    discipline: string,
    weight: number,
    attemptNumber: number,
    previousAttempts: unknown[]
  ): AttemptValidation;

  /**
   * Calculates the score for a completed attempt
   */
  scoreAttempt(
    athleteId: string,
    discipline: string,
    weight: number,
    isSuccessful: boolean,
    judgeDecisions: boolean[],
    metadata?: Record<string, unknown>
  ): AttemptScore;

  /**
   * Calculates rankings for all athletes in a category
   */
  calculateRanking(
    athletes: unknown[],
    attempts: unknown[],
    categoryRules: unknown
  ): RankingResult[];

  /**
   * Proposes the next attempt weight for an athlete
   */
  proposeNextAttempt(
    athleteId: string,
    discipline: string,
    previousAttempts: unknown[],
    competitionContext: Record<string, unknown>
  ): NextAttemptSuggestion;

  /**
   * Resolves tiebreaks according to sport rules
   */
  resolveTiebreak(
    tiedAthletes: unknown[],
    attempts: unknown[],
    tiebreakRules: unknown
  ): TiebreakResult;

  /**
   * Gets timer settings for the sport
   */
  getTimerSettings(discipline: string, phase: 'attempt' | 'rest' | 'warmup'): TimerSettings;
}