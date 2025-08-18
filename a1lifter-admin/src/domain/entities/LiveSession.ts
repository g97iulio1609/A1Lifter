export interface LiveSession {
  id: string;
  competitionId: string;
  name: string;
  status: 'setup' | 'active' | 'paused' | 'completed';
  currentDiscipline?: string;
  currentAthleteId?: string;
  currentAttemptNumber?: number;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface LiveCompetitionSession extends LiveSession {
  setupId: string;
  disciplines: string[];
  currentRound: number;
  totalRounds: number;
  isTimerRunning: boolean;
  timerDuration: number;
  remainingTime: number;
  judges: string[];
  settings: {
    autoAdvance: boolean;
    showResults: boolean;
    allowSpectators: boolean;
  };
}

export interface QueueItem {
  id: string;
  sessionId: string;
  athleteId: string;
  athleteName: string;
  discipline: string;
  attemptNumber: number;
  weight: number;
  order: number;
  status: 'pending' | 'current' | 'completed' | 'failed';
  createdAt: Date;
}

export interface JudgeVote {
  judgeId: string;
  decision: 'white' | 'red';
  timestamp: Date;
  notes?: string;
}