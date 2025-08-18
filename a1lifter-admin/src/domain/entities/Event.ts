/**
 * Event Entity - Core domain entity for competitions
 */

export interface EventSettings {
  maxAttempts: number;
  disciplines: string[];
  scoringSystem: 'wilks' | 'dots' | 'ipf';
  allowLateRegistration: boolean;
  requireWeighIn: boolean;
  federation?: string;
  registrationDeadline?: Date;
  timeLimits: {
    attempt: number;
    rest: number;
    warmup: number;
  };
}

export interface EventStatus {
  current: 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled';
  registrationCount: number;
  maxParticipants?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Event {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly sport: 'powerlifting' | 'weightlifting' | 'strongman' | 'crossfit' | 'streetlifting',
    public readonly date: Date,
    public readonly location: string,
    public readonly organizer: string,
    public readonly settings: EventSettings,
    public readonly status: EventStatus,
    public readonly federation?: string,
    public readonly description?: string,
    public readonly weighInDate?: Date,
    public readonly weighInLocation?: string
  ) {
    this.validateEvent();
  }

  public get registrationDeadline(): Date | undefined {
    return this.settings.registrationDeadline;
  }

  public get createdAt(): Date {
    return this.status.createdAt;
  }

  public get updatedAt(): Date {
    return this.status.updatedAt;
  }

  private validateEvent(): void {
    if (!this.name.trim()) {
      throw new Error('Event name cannot be empty');
    }

    if (this.date <= new Date()) {
      throw new Error('Event date must be in the future');
    }

    if (!this.location.trim()) {
      throw new Error('Event location cannot be empty');
    }

    if (this.settings.maxAttempts < 1 || this.settings.maxAttempts > 5) {
      throw new Error('Max attempts must be between 1 and 5');
    }

    if (this.settings.disciplines.length === 0) {
      throw new Error('Event must have at least one discipline');
    }

    if (this.registrationDeadline && this.registrationDeadline >= this.date) {
      throw new Error('Registration deadline must be before event date');
    }
  }

  public isRegistrationOpen(): boolean {
    const now = new Date();
    return (
      this.status.current === 'registration_open' &&
      (!this.registrationDeadline || now <= this.registrationDeadline) &&
      (!this.status.maxParticipants || this.status.registrationCount < this.status.maxParticipants)
    );
  }

  public canStartEvent(): boolean {
    return (
      this.status.current === 'registration_closed' &&
      this.status.registrationCount > 0
    );
  }

  public getDaysUntilStart(): number {
    const now = new Date();
    const diffTime = this.date.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public updateStatus(newStatus: EventStatus['current']): Event {
    const updatedStatus = {
      ...this.status,
      current: newStatus,
      updatedAt: new Date(),
      ...(newStatus === 'in_progress' && { startedAt: new Date() }),
      ...(newStatus === 'completed' && { completedAt: new Date() })
    };

    return new Event(
      this.id,
      this.name,
      this.sport,
      this.date,
      this.location,
      this.organizer,
      this.settings,
      updatedStatus,
      this.federation,
      this.description,
      this.weighInDate,
      this.weighInLocation
    );
  }

  public incrementRegistrationCount(): Event {
    const updatedStatus = {
      ...this.status,
      registrationCount: this.status.registrationCount + 1,
      updatedAt: new Date()
    };

    return new Event(
      this.id,
      this.name,
      this.sport,
      this.date,
      this.location,
      this.organizer,
      this.settings,
      updatedStatus,
      this.federation,
      this.description,
      this.weighInDate,
      this.weighInLocation
    );
  }

  public toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      sport: this.sport,
      date: this.date,
      location: this.location,
      organizer: this.organizer,
      settings: this.settings,
      status: this.status,
      federation: this.federation,
      description: this.description,
      weighInDate: this.weighInDate,
      weighInLocation: this.weighInLocation
    };
  }
}