import { SportPlugin, AttemptValidation, AttemptScore, RankingResult, NextAttemptSuggestion, TiebreakResult, TimerSettings } from './SportPlugin';
import { Attempt } from '../entities/Attempt';
import { Athlete } from '../entities/Athlete';

export class CrossFitPlugin implements SportPlugin {
  readonly sportName = 'CrossFit';
  readonly version = '1.0.0';
  readonly supportedDisciplines = [
    'fran', 'grace', 'helen', 'murph', 'cindy', 'annie', 'karen', 'isabel', 'jackie', 'diane', 'elizabeth', 'nancy', 'custom_wod'
  ];
  readonly disciplines = [
    'fran',
    'grace',
    'helen',
    'murph',
    'cindy',
    'annie',
    'karen',
    'isabel',
    'jackie',
    'diane',
    'elizabeth',
    'nancy',
    'custom_wod'
  ];

  validateAttempt(_athleteId: string, _discipline: string, _weight: number, _attemptNumber: number, _previousAttempts: unknown[]): AttemptValidation {
    const errors: string[] = [];

    // Validate discipline (WOD)
    if (!this.disciplines.includes(_discipline)) {
      errors.push(`WOD non valido: ${_discipline}`);
    }

    // CrossFit typically allows only one attempt per WOD
    const typedPreviousAttempts = _previousAttempts as Attempt[];
    const sameWodAttempts = typedPreviousAttempts.filter(a => 
      a.discipline === _discipline && a.athleteId === _athleteId
    );
    
    if (sameWodAttempts.length > 0) {
      errors.push(`Solo un tentativo permesso per WOD: ${_discipline}`);
    }

    // Weight validation for CrossFit (usually not applicable)
    if (_weight < 0) {
      errors.push('Il peso non può essere negativo');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  scoreAttempt(
    _athleteId: string,
    discipline: string,
    weight: number,
    isSuccessful: boolean,
    judgeDecisions: boolean[],
    metadata?: Record<string, unknown>
  ): AttemptScore {
    // CrossFit uses 1-3 judges depending on competition level
    const requiredJudges = this.getRequiredJudgesForWod(discipline);
    
    if (judgeDecisions.length !== requiredJudges) {
      throw new Error(`${discipline} richiede esattamente ${requiredJudges} giudici`);
    }

    // Calculate score based on WOD type
    const score = weight; // Use weight as score for now

    return {
      points: score,
      isValid: isSuccessful,
      metadata: {
        judgeVotes: judgeDecisions,
        wodType: this.getWodType(discipline),
        timeInSeconds: metadata?.timeInSeconds,
        repsCompleted: metadata?.repsCompleted,
        rounds: metadata?.rounds,
        scaling: metadata?.scaling,
        penalties: metadata?.penalties || 0
      }
    };
  }

  calculateRanking(athletes: Athlete[], attempts: Attempt[]): RankingResult[] {
    const rankings: RankingResult[] = [];

    for (const athlete of athletes) {
      const athleteAttempts = attempts.filter(a => a.athleteId === athlete.id);
      
  let totalScore = 0;
  const breakdown: Record<string, number> = {};
      
      // Calculate points for each WOD
      for (const discipline of this.disciplines) {
        const wodAttempt = athleteAttempts.find(a => a.discipline === discipline);
        
        if (wodAttempt && wodAttempt.result?.isSuccessful) {
          const points = this.calculateWodPoints(wodAttempt, athletes, attempts);
          breakdown[discipline] = points;
          totalScore += points;
        } else {
          breakdown[discipline] = 0;
        }
      }

      rankings.push({
        athleteId: athlete.id,
        rank: 0,
        totalScore,
        breakdown
      });
    }

    // Sort by total points (highest first)
    return rankings.sort((a, b) => b.totalScore - a.totalScore);
  }

  proposeNextAttempt(athleteId: string, _discipline: string, previousAttempts: Attempt[], _competitionContext: Record<string, unknown>): NextAttemptSuggestion {
    void _discipline; void _competitionContext;
    const athleteAttempts = previousAttempts.filter(a => a.athleteId === athleteId);
    const completedWods = athleteAttempts.map(a => a.discipline);
    
    // Find next WOD to attempt
    const nextWod = this.disciplines.find(wod => !completedWods.includes(wod));
    
    if (!nextWod) {
      return {
        suggestedWeight: 0,
        reasoning: 'Tutti i WOD completati - suggerito WOD personalizzato',
        confidence: 0.5
      };
    }

    // Suggest appropriate scaling based on athlete profile
    const suggestedScaling = this.suggestScaling(nextWod);
    
    return {
      suggestedWeight: 0,
      reasoning: `Prossimo WOD: ${nextWod} con scaling ${suggestedScaling}`,
      confidence: 0.7
    };
  }

  resolveTiebreak(athletes: Athlete[]): TiebreakResult {
    // CrossFit tiebreak: usually by performance in final WOD or total time
    const sorted = [...athletes]; // No tiebreak sorting available
    
    return {
      winnerId: sorted[0].id,
      criteria: 'fallback',
      details: {}
    };
  }

  getTimerSettings(): TimerSettings {
    return {
      attemptTime: 1200,
      restTime: 600,
      warmupTime: 900
    };
  }

  private getRequiredJudgesForWod(discipline: string): number {
    // Most CrossFit competitions use 1 judge per athlete
    // Major competitions might use 2-3 judges
    const highStakesWods = ['murph', 'fran', 'grace'];
    return highStakesWods.includes(discipline) ? 2 : 1;
  }

  private getWodType(discipline: string): string {
    const timeWods = ['fran', 'grace', 'helen', 'isabel', 'jackie', 'diane', 'elizabeth', 'nancy'];
    const amrapWods = ['cindy', 'annie'];
    const chipperWods = ['murph', 'karen'];
    
    if (timeWods.includes(discipline)) return 'for_time';
    if (amrapWods.includes(discipline)) return 'amrap';
    if (chipperWods.includes(discipline)) return 'chipper';
    return 'custom';
  }

  private calculateWodPoints(attempt: Attempt, _allAthletes: Athlete[], allAttempts: Attempt[]): number {
    void _allAthletes;
    // Points based on placement in each WOD
    const wodAttempts = allAttempts.filter(a => 
      a.discipline === attempt.discipline && a.result?.isSuccessful
    );
    
    // Sort by score (highest first)
    const sortedAttempts = wodAttempts.sort((a, b) => {
      const scoreA = a.getScore();
      const scoreB = b.getScore();
      return scoreB - scoreA;
    });
    
    const placement = sortedAttempts.findIndex(a => a.id === attempt.id) + 1;
    
    // Points = total participants - placement + 1
    return Math.max(1, sortedAttempts.length - placement + 1);
  }

  private suggestScaling(_wod: string): string {
    void _wod;
    // Default scaling suggestion
    return 'Scaled';
  }
}