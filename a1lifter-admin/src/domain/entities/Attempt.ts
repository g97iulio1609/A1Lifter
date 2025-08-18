/**
 * Attempt Entity - Core domain entity for athlete attempts
 */

export interface JudgeDecision {
  judgeId: string;
  decision: boolean; // true = white light, false = red light
  timestamp: Date;
  reason?: string;
}

export interface AttemptResult {
  isSuccessful: boolean;
  judgeDecisions: JudgeDecision[];
  whiteFlags: number;
  redFlags: number;
  finalDecision: boolean;
  processedAt: Date;
}

export interface AttemptMetadata {
  rackHeight?: number;
  equipment?: string[];
  notes?: string;
  videoUrl?: string;
  protestSubmitted?: boolean;
  protestResolved?: boolean;
  // Cross-discipline optional fields
  timeInSeconds?: number;
  repsCompleted?: number;
  rounds?: number;
  timeCap?: number;
  scaling?: string;
  penalties?: number;
}

export class Attempt {
  constructor(
    public readonly id: string,
    public readonly eventId: string,
    public readonly sessionId: string,
    public readonly athleteId: string,
    public readonly discipline: string,
    public readonly attemptNumber: number,
    public readonly declaredWeight: number,
    public readonly actualWeight: number,
    public readonly result: AttemptResult | null = null,
    public readonly metadata: AttemptMetadata = {},
    public readonly timestamp: Date = new Date(),
    public readonly status: 'declared' | 'in_progress' | 'completed' | 'skipped' = 'declared'
  ) {
    this.validateAttempt();
  }

  private validateAttempt(): void {
    if (!this.eventId.trim()) {
      throw new Error('Event ID is required');
    }

    if (!this.athleteId.trim()) {
      throw new Error('Athlete ID is required');
    }

    if (!this.discipline.trim()) {
      throw new Error('Discipline is required');
    }

    if (this.attemptNumber < 1 || this.attemptNumber > 5) {
      throw new Error('Attempt number must be between 1 and 5');
    }

    if (this.declaredWeight <= 0) {
      throw new Error('Declared weight must be positive');
    }

    if (this.actualWeight <= 0) {
      throw new Error('Actual weight must be positive');
    }

    // Validate weight increment (minimum 2.5kg for most sports)
    const weightDiff = Math.abs(this.actualWeight - this.declaredWeight);
    if (weightDiff > 0 && weightDiff < 2.5) {
      throw new Error('Weight changes must be at least 2.5kg');
    }
  }

  public isCompleted(): boolean {
    return this.status === 'completed' && this.result !== null;
  }

  public isSuccessful(): boolean {
    return this.result?.isSuccessful ?? false;
  }

  public getScore(): number {
    return this.isSuccessful() ? this.actualWeight : 0;
  }

  public startAttempt(): Attempt {
    if (this.status !== 'declared') {
      throw new Error('Can only start declared attempts');
    }

    return new Attempt(
      this.id,
      this.eventId,
      this.sessionId,
      this.athleteId,
      this.discipline,
      this.attemptNumber,
      this.declaredWeight,
      this.actualWeight,
      this.result,
      this.metadata,
      this.timestamp,
      'in_progress'
    );
  }

  public completeAttempt(judgeDecisions: JudgeDecision[]): Attempt {
    if (this.status !== 'in_progress') {
      throw new Error('Can only complete in-progress attempts');
    }

    if (judgeDecisions.length < 3) {
      throw new Error('At least 3 judge decisions required');
    }

    const whiteFlags = judgeDecisions.filter(d => d.decision).length;
    const redFlags = judgeDecisions.length - whiteFlags;
    const isSuccessful = whiteFlags >= 2; // Majority rule

    const result: AttemptResult = {
      isSuccessful,
      judgeDecisions,
      whiteFlags,
      redFlags,
      finalDecision: isSuccessful,
      processedAt: new Date()
    };

    return new Attempt(
      this.id,
      this.eventId,
      this.sessionId,
      this.athleteId,
      this.discipline,
      this.attemptNumber,
      this.declaredWeight,
      this.actualWeight,
      result,
      this.metadata,
      this.timestamp,
      'completed'
    );
  }

  public skipAttempt(): Attempt {
    if (this.status === 'completed') {
      throw new Error('Cannot skip completed attempts');
    }

    return new Attempt(
      this.id,
      this.eventId,
      this.sessionId,
      this.athleteId,
      this.discipline,
      this.attemptNumber,
      this.declaredWeight,
      this.actualWeight,
      this.result,
      this.metadata,
      this.timestamp,
      'skipped'
    );
  }

  public updateWeight(newWeight: number): Attempt {
    if (this.status !== 'declared') {
      throw new Error('Can only update weight for declared attempts');
    }

    return new Attempt(
      this.id,
      this.eventId,
      this.sessionId,
      this.athleteId,
      this.discipline,
      this.attemptNumber,
      this.declaredWeight,
      newWeight,
      this.result,
      this.metadata,
      this.timestamp,
      this.status
    );
  }

  public addMetadata(newMetadata: Partial<AttemptMetadata>): Attempt {
    const updatedMetadata = {
      ...this.metadata,
      ...newMetadata
    };

    return new Attempt(
      this.id,
      this.eventId,
      this.sessionId,
      this.athleteId,
      this.discipline,
      this.attemptNumber,
      this.declaredWeight,
      this.actualWeight,
      this.result,
      updatedMetadata,
      this.timestamp,
      this.status
    );
  }

  public getAttemptSummary(): string {
    const status = this.isCompleted() 
      ? (this.isSuccessful() ? '✓' : '✗')
      : this.status;
    
    return `${this.discipline} #${this.attemptNumber}: ${this.actualWeight}kg [${status}]`;
  }

  public toPlainObject() {
    return {
      id: this.id,
      eventId: this.eventId,
      sessionId: this.sessionId,
      athleteId: this.athleteId,
      discipline: this.discipline,
      attemptNumber: this.attemptNumber,
      declaredWeight: this.declaredWeight,
      actualWeight: this.actualWeight,
      result: this.result,
      metadata: this.metadata,
      timestamp: this.timestamp,
      status: this.status
    };
  }
}