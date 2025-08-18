/**
 * Athlete Entity - Core domain entity for athletes
 */

export interface PersonalRecords {
  [discipline: string]: {
    weight: number;
    achievedAt: Date;
    eventId?: string;
    verified: boolean;
  };
}

export interface AthleteProfile {
  weightClass?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalInfo?: {
    allergies?: string;
    medications?: string;
    conditions?: string;
  };
  coachInfo?: {
    name: string;
    email?: string;
    phone?: string;
  };
}

export class Athlete {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly birthDate: Date,
    public readonly gender: 'M' | 'F',
    public readonly federation: string,
    public readonly personalRecords: PersonalRecords = {},
    public readonly profile: AthleteProfile = {},
    public readonly phone?: string,
    public readonly team?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validateAthlete();
  }

  private validateAthlete(): void {
    if (!this.name.trim()) {
      throw new Error('Athlete name cannot be empty');
    }

    if (!this.email.trim() || !this.isValidEmail(this.email)) {
      throw new Error('Valid email is required');
    }

    if (!this.federation.trim()) {
      throw new Error('Federation is required');
    }

    if (this.getAge() < 14) {
      throw new Error('Athlete must be at least 14 years old');
    }

    if (this.getAge() > 100) {
      throw new Error('Invalid birth date');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public getAge(): number {
    const today = new Date();
    const birthDate = new Date(this.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  public getAgeCategory(): string {
    const age = this.getAge();
    
    if (age < 18) return 'Junior';
    if (age < 24) return 'Sub-Junior';
    if (age < 40) return 'Open';
    if (age < 50) return 'Master 1';
    if (age < 60) return 'Master 2';
    if (age < 70) return 'Master 3';
    return 'Master 4';
  }

  public getPersonalRecord(discipline: string): number | null {
    const record = this.personalRecords[discipline];
    return record ? record.weight : null;
  }

  public updatePersonalRecord(
    discipline: string,
    weight: number,
    eventId?: string
  ): Athlete {
    const currentRecord = this.personalRecords[discipline];
    
    // Only update if new weight is higher
    if (!currentRecord || weight > currentRecord.weight) {
      const updatedRecords = {
        ...this.personalRecords,
        [discipline]: {
          weight,
          achievedAt: new Date(),
          eventId,
          verified: true
        }
      };

      return new Athlete(
        this.id,
        this.name,
        this.email,
        this.birthDate,
        this.gender,
        this.federation,
        updatedRecords,
        this.profile,
        this.phone,
        this.team,
        this.isActive,
        this.createdAt,
        new Date()
      );
    }

    return this;
  }

  public updateProfile(newProfile: Partial<AthleteProfile>): Athlete {
    const updatedProfile = {
      ...this.profile,
      ...newProfile
    };

    return new Athlete(
      this.id,
      this.name,
      this.email,
      this.birthDate,
      this.gender,
      this.federation,
      this.personalRecords,
      updatedProfile,
      this.phone,
      this.team,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }

  public deactivate(): Athlete {
    return new Athlete(
      this.id,
      this.name,
      this.email,
      this.birthDate,
      this.gender,
      this.federation,
      this.personalRecords,
      this.profile,
      this.phone,
      this.team,
      false,
      this.createdAt,
      new Date()
    );
  }

  public getTotalCompetitions(): number {
    return Object.values(this.personalRecords)
      .filter(record => record.eventId)
      .length;
  }

  public getWeightClass(): string {
    // This would typically be calculated based on bodyweight
    // For now, return a placeholder
    return 'Open';
  }

  public toPlainObject(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      birthDate: this.birthDate,
      gender: this.gender,
      federation: this.federation,
      personalRecords: this.personalRecords,
      profile: this.profile,
      phone: this.phone,
      team: this.team,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}