/**
 * Process Attempt Use Case - Application layer business logic
 */

import { Attempt, JudgeDecision } from '../../domain/entities/Attempt';
import { AttemptRepository } from '../../domain/repositories/AttemptRepository';
import { EventRepository } from '../../domain/repositories/EventRepository';
import { AthleteRepository } from '../../domain/repositories/AthleteRepository';
import { SportPlugin } from '../../domain/plugins/SportPlugin';

export interface ProcessAttemptRequest {
  attemptId: string;
  judgeDecisions: JudgeDecision[];
  actualWeight?: number;
  metadata?: {
    rackHeight?: number;
    equipment?: string[];
    notes?: string;
    videoUrl?: string;
  };
}

export interface ProcessAttemptResponse {
  success: boolean;
  attempt?: Attempt;
  score?: number;
  nextAttemptSuggestion?: {
    weight: number;
    reasoning: string;
  };
  error?: string;
}

export class ProcessAttemptUseCase {
  constructor(
    private attemptRepository: AttemptRepository,
    private eventRepository: EventRepository,
    private athleteRepository: AthleteRepository,
    private sportPlugins: Map<string, SportPlugin>
  ) {}

  async execute(request: ProcessAttemptRequest): Promise<ProcessAttemptResponse> {
    try {
      // Get the attempt
      const attempt = await this.attemptRepository.findById(request.attemptId);
      if (!attempt) {
        return {
          success: false,
          error: 'Attempt not found'
        };
      }

      // Validate attempt is in progress
      if (attempt.status !== 'in_progress') {
        return {
          success: false,
          error: 'Attempt is not in progress'
        };
      }

      // Get event and sport plugin
      const event = await this.eventRepository.findById(attempt.eventId);
      if (!event) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      const sportPlugin = this.sportPlugins.get(event.sport.toLowerCase());
      if (!sportPlugin) {
        return {
          success: false,
          error: `Sport plugin not found for: ${event.sport}`
        };
      }

      // Validate judge decisions
      if (request.judgeDecisions.length < 3) {
        return {
          success: false,
          error: 'At least 3 judge decisions required'
        };
      }

      // Update actual weight if provided
      let updatedAttempt = attempt;
      if (request.actualWeight && request.actualWeight !== attempt.actualWeight) {
        updatedAttempt = attempt.updateWeight(request.actualWeight);
      }

      // Add metadata if provided
      if (request.metadata) {
        updatedAttempt = updatedAttempt.addMetadata(request.metadata);
      }

      // Complete the attempt with judge decisions
      const completedAttempt = updatedAttempt.completeAttempt(request.judgeDecisions);

      // Validate attempt using sport plugin
      const validation = sportPlugin.validateAttempt(
        completedAttempt.athleteId,
        completedAttempt.discipline,
        completedAttempt.actualWeight,
        completedAttempt.attemptNumber,
        await this.getPreviousAttempts(
          completedAttempt.athleteId,
          completedAttempt.eventId,
          completedAttempt.discipline
        )
      );

      if (!validation.isValid) {
          return {
            success: false,
            error: `Attempt validation failed: ${validation.errors.join(', ')}`
          };
        }

      // Score the attempt using sport plugin
      const judgeDecisionsBooleans = request.judgeDecisions.map(decision => decision.decision);
      const score = sportPlugin.scoreAttempt(
        completedAttempt.athleteId,
        completedAttempt.discipline,
        completedAttempt.actualWeight,
        completedAttempt.isSuccessful(),
        judgeDecisionsBooleans
      );

      // Save the completed attempt
      const savedAttempt = await this.attemptRepository.save(completedAttempt);

      // Get next attempt suggestion if successful
      let nextAttemptSuggestion;
      if (completedAttempt.isSuccessful()) {
        const suggestion = sportPlugin.proposeNextAttempt(
          completedAttempt.athleteId,
          completedAttempt.discipline,
          await this.getAthleteHistory(
            completedAttempt.athleteId,
            completedAttempt.discipline
          ),
          {
            currentWeight: completedAttempt.actualWeight,
            attemptNumber: completedAttempt.attemptNumber,
            isSuccessful: true
          }
        );

        nextAttemptSuggestion = {
          weight: suggestion.suggestedWeight,
          reasoning: suggestion.reasoning
        };
      }

      // Update athlete personal records if this is a new PR
      await this.updatePersonalRecords(
        completedAttempt.athleteId,
        completedAttempt.discipline,
        completedAttempt.actualWeight,
        completedAttempt.isSuccessful()
      );

      return {
        success: true,
        attempt: savedAttempt,
        score: score.points,
        nextAttemptSuggestion
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async getPreviousAttempts(
    athleteId: string,
    eventId: string,
    discipline: string
  ): Promise<Array<{ weight: number; isSuccessful: boolean }>> {
    const attempts = await this.attemptRepository.findByAthleteAndEvent(athleteId, eventId);
    
    return attempts
      .filter(a => a.discipline === discipline && a.isCompleted())
      .map(a => ({
        weight: a.actualWeight,
        isSuccessful: a.isSuccessful()
      }));
  }

  private async getAthleteHistory(
    athleteId: string,
    discipline: string
  ): Promise<Array<{ weight: number; isSuccessful: boolean; date: Date }>> {
    const attempts = await this.attemptRepository.getAthleteHistory(athleteId, discipline, 10);
    
    return attempts.map(a => ({
      weight: a.actualWeight,
      isSuccessful: a.isSuccessful(),
      date: a.timestamp
    }));
  }

  private async updatePersonalRecords(
    athleteId: string,
    discipline: string,
    weight: number,
    isSuccessful: boolean
  ): Promise<void> {
    if (!isSuccessful) return;

    const athlete = await this.athleteRepository.findById(athleteId);
    if (!athlete) return;

    const currentPR = athlete.personalRecords[discipline];
    const currentWeight = currentPR ? currentPR.weight : 0;
    
    if (weight > currentWeight) {
      // Convert PersonalRecords to Record<string, number> for repository
      const recordsAsNumbers: Record<string, number> = {};
      Object.keys(athlete.personalRecords).forEach(key => {
        recordsAsNumbers[key] = athlete.personalRecords[key].weight;
      });
      recordsAsNumbers[discipline] = weight;
      
      await this.athleteRepository.updatePersonalRecords(athleteId, recordsAsNumbers);
    }
  }
}