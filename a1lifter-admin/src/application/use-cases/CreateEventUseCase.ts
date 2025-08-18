/**
 * Create Event Use Case - Application layer business logic
 */

import { Event } from '../../domain/entities/Event';
import { EventRepository } from '../../domain/repositories/EventRepository';
import { SportPlugin } from '../../domain/plugins/SportPlugin';

export interface CreateEventRequest {
  name: string;
  sport: 'powerlifting' | 'strongman' | 'crossfit' | 'weightlifting' | 'streetlifting';
  date: Date;
  location: string;
  organizer: string;
  federation?: string;
  description?: string;
  maxAttempts?: number;
  disciplines?: string[];
  scoringSystem?: string;
  timeLimits?: {
    attempt: number;
    rest: number;
    warmup: number;
  };
  registrationDeadline?: Date;
  maxParticipants?: number;
  entryFee?: number;
  rules?: Record<string, unknown>;
}

export interface CreateEventResponse {
  success: boolean;
  event?: Event;
  error?: string;
}

export class CreateEventUseCase {
  constructor(
    private eventRepository: EventRepository,
    private sportPlugins: Map<string, SportPlugin>
  ) {}

  async execute(request: CreateEventRequest): Promise<CreateEventResponse> {
    try {
      // Validate sport plugin exists
      const sportPlugin = this.sportPlugins.get(request.sport.toLowerCase());
      if (!sportPlugin) {
        return {
          success: false,
          error: `Sport plugin not found for: ${request.sport}`
        };
      }

      // Validate date is in the future
      if (request.date <= new Date()) {
        return {
          success: false,
          error: 'Event date must be in the future'
        };
      }

      // Validate registration deadline
      if (request.registrationDeadline && request.registrationDeadline >= request.date) {
        return {
          success: false,
          error: 'Registration deadline must be before event date'
        };
      }

      // Get default timer settings from sport plugin
      const defaultDisciplines = request.disciplines || this.getDefaultDisciplines(request.sport);
      const defaultTimerSettings = sportPlugin.getTimerSettings(defaultDisciplines[0] || 'default', 'attempt');

      // Create event with sport-specific defaults
      const eventId = this.generateEventId();
      const event = new Event(
        eventId,
        request.name.trim(),
        request.sport,
        request.date,
        request.location.trim(),
        request.organizer,
        {
          maxAttempts: request.maxAttempts || 3,
          disciplines: defaultDisciplines,
          scoringSystem: (request.scoringSystem as 'wilks' | 'dots' | 'ipf') || 'wilks',
          allowLateRegistration: false,
          requireWeighIn: true,
          federation: request.federation,
          registrationDeadline: request.registrationDeadline,
          timeLimits: request.timeLimits || {
            attempt: defaultTimerSettings.attemptTime,
            rest: defaultTimerSettings.restTime,
            warmup: defaultTimerSettings.warmupTime
          }
        },
        {
          current: 'draft',
          registrationCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        request.federation,
        request.description
      );

      // Save event
      const savedEvent = await this.eventRepository.save(event);

      return {
        success: true,
        event: savedEvent
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private generateEventId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `event_${timestamp}_${random}`;
  }

  private getDefaultDisciplines(sport: string): string[] {
    const disciplineMap: Record<string, string[]> = {
      powerlifting: ['squat', 'bench', 'deadlift'],
      weightlifting: ['snatch', 'clean_jerk'],
      strongman: ['deadlift', 'log_press', 'atlas_stones'],
      crossfit: ['workout_1', 'workout_2', 'workout_3'],
      streetlifting: ['bench', 'deadlift', 'squat']
    };

    return disciplineMap[sport.toLowerCase()] || [];
  }
}