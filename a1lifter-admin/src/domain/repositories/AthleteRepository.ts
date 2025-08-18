/**
 * Athlete Repository Interface - Domain layer contract
 */

import { Athlete } from '../entities/Athlete';

export interface AthleteFilters {
  federation?: string;
  gender?: 'M' | 'F';
  ageCategory?: string;
  weightCategory?: string;
  sport?: string;
  isActive?: boolean;
  searchTerm?: string; // For name/email search
}

export interface AthleteRepository {
  /**
   * Find athlete by ID
   */
  findById(id: string): Promise<Athlete | null>;

  /**
   * Find athlete by email
   */
  findByEmail(email: string): Promise<Athlete | null>;

  /**
   * Find all athletes with optional filters
   */
  findAll(filters?: AthleteFilters): Promise<Athlete[]>;

  /**
   * Find athletes by federation
   */
  findByFederation(federation: string): Promise<Athlete[]>;

  /**
   * Find athletes by event registration
   */
  findByEvent(eventId: string): Promise<Athlete[]>;

  /**
   * Search athletes by name or email
   */
  search(query: string, limit?: number): Promise<Athlete[]>;

  /**
   * Save athlete (create or update)
   */
  save(athlete: Athlete): Promise<Athlete>;

  /**
   * Delete athlete
   */
  delete(id: string): Promise<void>;

  /**
   * Check if athlete exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Check if email is already registered
   */
  emailExists(email: string, excludeId?: string): Promise<boolean>;

  /**
   * Count athletes with filters
   */
  count(filters?: AthleteFilters): Promise<number>;

  /**
   * Find athletes with pagination
   */
  findWithPagination(
    page: number,
    limit: number,
    filters?: AthleteFilters
  ): Promise<{
    athletes: Athlete[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  /**
   * Update athlete personal records
   */
  updatePersonalRecords(
    id: string,
    records: Record<string, number>
  ): Promise<Athlete>;

  /**
   * Deactivate athlete
   */
  deactivate(id: string): Promise<Athlete>;

  /**
   * Reactivate athlete
   */
  reactivate(id: string): Promise<Athlete>;

  /**
   * Get athletes by weight category for an event
   */
  findByWeightCategory(
    eventId: string,
    weightCategory: string,
    gender: 'M' | 'F'
  ): Promise<Athlete[]>;

  /**
   * Get top athletes by personal records
   */
  findTopAthletes(
    discipline: string,
    gender?: 'M' | 'F',
    limit?: number
  ): Promise<Athlete[]>;
}