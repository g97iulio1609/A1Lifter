/**
 * Event Repository Interface - Domain layer contract
 */

import { Event } from '../entities/Event';

export interface EventFilters {
  sport?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  organizer?: string;
  federation?: string;
}

export interface EventRepository {
  /**
   * Find event by ID
   */
  findById(id: string): Promise<Event | null>;

  /**
   * Find all events with optional filters
   */
  findAll(filters?: EventFilters): Promise<Event[]>;

  /**
   * Find events by organizer
   */
  findByOrganizer(organizerId: string): Promise<Event[]>;

  /**
   * Find upcoming events
   */
  findUpcoming(limit?: number): Promise<Event[]>;

  /**
   * Find events by sport
   */
  findBySport(sport: string): Promise<Event[]>;

  /**
   * Save event (create or update)
   */
  save(event: Event): Promise<Event>;

  /**
   * Delete event
   */
  delete(id: string): Promise<void>;

  /**
   * Check if event exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count events with filters
   */
  count(filters?: EventFilters): Promise<number>;

  /**
   * Find events with pagination
   */
  findWithPagination(
    page: number,
    limit: number,
    filters?: EventFilters
  ): Promise<{
    events: Event[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  /**
   * Update event status
   */
  updateStatus(id: string, status: string): Promise<Event>;

  /**
   * Increment registration count
   */
  incrementRegistrationCount(id: string): Promise<Event>;

  /**
   * Decrement registration count
   */
  decrementRegistrationCount(id: string): Promise<Event>;
}