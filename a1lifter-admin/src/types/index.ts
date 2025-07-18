export type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'judge';
  createdAt: Date;
};

export type Competition = {
  id: string;
  name: string;
  date: Date;
  location: string;
  type: 'powerlifting' | 'strongman';
  status: 'draft' | 'active' | 'completed';
  categories: CategoryConfig[];
  rules: CompetitionRules;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryConfig = {
  id: string;
  name: string;
  gender: 'M' | 'F';
  weightClass: string;
  ageGroup?: string;
};

export type CompetitionRules = {
  attempts: number;
  disciplines: string[];
  scoringSystem: 'ipf' | 'wilks' | 'dots';
};

export type Athlete = {
  id: string;
  name: string;
  email: string;
  birthDate: Date;
  gender: 'M' | 'F';
  weightClass: string;
  federation: string;
  personalRecords: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
};

export type Lift = {
  discipline: string;
  attempt: number;
  weight: number;
  valid: boolean;
  timestamp: Date;
};

export type Result = {
  id: string;
  competitionId: string;
  athleteId: string;
  categoryId: string;
  lifts: Lift[];
  totalScore: number;
  wilksScore?: number;
  ipfScore?: number;
  dotsScore?: number;
  ranking: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AthleteResult = Result & {
  athleteName: string;
  athleteGender: 'M' | 'F';
  athleteWeight: number;
  categoryName: string;
};

export type CompetitionLeaderboard = {
  competitionId: string;
  categories: {
    categoryId: string;
    categoryName: string;
    results: AthleteResult[];
  }[];
};

export type Registration = {
  id: string;
  competitionId: string;
  athleteId: string;
  categoryId: string;
  registeredAt: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  notes?: string;
};

export type CompetitionWithStats = Competition & {
  registrationsCount: number;
  categoriesCount: number;
  daysUntilStart: number;
};