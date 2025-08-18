/**
 * Attempt Repository Interface - Domain layer contract
 */

import { Attempt } from '../entities/Attempt';

export interface AttemptFilters {
  eventId?: string;
  sessionId?: string;
  athleteId?: string;
  discipline?: string;
  attemptNumber?: number;
  status?: 'declared' | 'in_progress' | 'completed' | 'skipped';
  isSuccessful?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AttemptRepository {
  /**
   * Find attempt by ID
   */
  findById(id: string): Promise<Attempt | null>;

  /**
   * Find all attempts with optional filters
   */
  findAll(filters?: AttemptFilters): Promise<Attempt[]>;

  /**
   * Find attempts by athlete
   */
  findByAthlete(athleteId: string): Promise<Attempt[]>;

  /**
   * Find attempts by event
   */
  findByEvent(eventId: string): Promise<Attempt[]>;

  /**
   * Find attempts by session
   */
  findBySession(sessionId: string): Promise<Attempt[]>;

  /**
   * Find attempts by athlete and event
   */
  findByAthleteAndEvent(athleteId: string, eventId: string): Promise<Attempt[]>;

  /**
   * Find attempts by discipline
   */
  findByDiscipline(eventId: string, discipline: string): Promise<Attempt[]>;

  /**
   * Find current attempt for athlete in session
   */
  findCurrentAttempt(athleteId: string, sessionId: string): Promise<Attempt | null>;

  /**
   * Find next attempt in queue
   */
  findNextAttempt(sessionId: string): Promise<Attempt | null>;

  /**
   * Save attempt (create or update)
   */
  save(attempt: Attempt): Promise<Attempt>;

  /**
   * Delete attempt
   */
  delete(id: string): Promise<void>;

  /**
   * Check if attempt exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count attempts with filters
   */
  count(filters?: AttemptFilters): Promise<number>;

  /**
   * Find attempts with pagination
   */
  findWithPagination(
    page: number,
    limit: number,
    filters?: AttemptFilters
  ): Promise<{
    attempts: Attempt[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  /**
   * Get athlete's best attempts by discipline
   */
  findBestAttempts(
    athleteId: string,
    eventId: string,
    discipline: string
  ): Promise<Attempt[]>;

  /**
   * Get successful attempts for ranking
   */
  findSuccessfulAttempts(
    eventId: string,
    discipline?: string
  ): Promise<Attempt[]>;

  /**
   * Update attempt status
   */
  updateStatus(
    id: string,
    status: 'declared' | 'in_progress' | 'completed' | 'skipped'
  ): Promise<Attempt>;

  /**
   * Get attempts queue for session
   */
  getAttemptsQueue(sessionId: string): Promise<Attempt[]>;

  /**
   * Get athlete's attempt history
   */
  getAthleteHistory(
    athleteId: string,
    discipline?: string,
    limit?: number
  ): Promise<Attempt[]>;

  /**
   * Get event statistics
   */
  getEventStatistics(eventId: string): Promise<{
    totalAttempts: number;
    successfulAttempts: number;
    averageWeight: number;
    maxWeight: number;
    byDiscipline: Record<string, {
      total: number;
      successful: number;
      averageWeight: number;
      maxWeight: number;
    }>;
  }>;
}