export type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'judge';
  permissions: UserPermissions;
  createdAt: Date;
  updatedAt: Date;
};

// Permessi utente
export type UserPermissions = {
  canManageCompetitions: boolean;
  canManageAthletes: boolean;
  canManageRegistrations: boolean;
  canJudgeCompetitions: string[]; // array di competition IDs che può giudicare
  canViewLiveResults: boolean;
  canManageUsers?: boolean; // solo per admin
};

// Profilo giudice esteso
export type JudgeProfile = {
  userId: string;
  judgeNumber?: string; // numero identificativo giudice
  federations: string[]; // federazioni per cui può giudicare
  certifications: JudgeCertification[];
  isActive: boolean;
  notes?: string;
};

// Certificazioni giudice
export type JudgeCertification = {
  federation: string;
  level: string; // es: "Nazionale", "Internazionale", "Regionale"
  sport: 'powerlifting' | 'strongman' | 'crossfit' | 'weightlifting';
  validUntil?: Date;
  certificationNumber?: string;
};

export type Competition = {
  id: string;
  name: string;
  date: Date;
  location: string;
  type: 'powerlifting' | 'strongman' | 'weightlifting' | 'streetlifting' | 'crossfit';
  status: 'draft' | 'active' | 'in_progress' | 'completed';
  categories: CategoryConfig[];
  rules: CompetitionRules;
  federation?: string;
  description?: string;
  maxParticipants?: number;
  registrationDeadline: Date;
  weighInDate?: Date;
  weighInLocation?: string;
  createdAt: Date | import('firebase/firestore').FieldValue;
  updatedAt: Date | import('firebase/firestore').FieldValue;
  createdBy: string;
};

// Tipi per registrazioni pubbliche
export type PublicCompetition = {
  id: string;
  name: string;
  date: Date;
  location: string;
  type: 'powerlifting' | 'strongman' | 'weightlifting' | 'streetlifting' | 'crossfit';
  status: 'draft' | 'active' | 'in_progress' | 'completed';
  description?: string;
  maxParticipants?: number;
  currentParticipants: number;
  registrationFee: number;
  registrationDeadline: Date;
  categories: CategoryConfig[];
  rules: CompetitionRules;
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
  phone?: string;
  birthDate: Date;
  gender: 'M' | 'F';
  bodyweight?: number;
  bodyWeight?: number; // alias for bodyweight
  weightClass: string;
  federation: string;
  team?: string;
  category?: string;
  isActive?: boolean;
  personalRecords: { [key: string]: number };
  personalBests?: { squat?: number; bench?: number; deadlift?: number };
  competitions?: number;
  createdAt: Date | import('firebase/firestore').FieldValue;
  updatedAt: Date | import('firebase/firestore').FieldValue;
};

export type Lift = {
  discipline: string;
  attempt: number;
  weight: number;
  valid: boolean;
  timestamp: Date | import('firebase/firestore').FieldValue;
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
  createdAt: Date | import('firebase/firestore').FieldValue;
  updatedAt: Date | import('firebase/firestore').FieldValue;
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
  createdAt: Date | import('firebase/firestore').FieldValue;
  updatedAt: Date | import('firebase/firestore').FieldValue;
};

export type RegistrationWithDetails = Registration & {
  athleteName: string;
  athleteEmail: string;
  athleteGender: 'M' | 'F';
  athleteWeightClass: string;
  competitionName: string;
  categoryName: string;
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
};

export type CompetitionWithStats = Competition & {
  registrationsCount: number;
  categoriesCount: number;
  daysUntilStart: number;
};

// Discipline personalizzabili per ogni sport
export type CustomDiscipline = {
  id: string;
  name: string;
  sport: 'powerlifting' | 'strongman' | 'weightlifting' | 'streetlifting' | 'crossfit';
  maxAttempts: number; // 3 per powerlifting, 4 per strongman, variabile per altri
  unit: 'kg' | 'lbs' | 'reps' | 'time' | 'meters'; // unità di misura
  description?: string;
  isDefault?: boolean; // discipline predefinite vs custom
  scoringType: 'weight' | 'time' | 'reps' | 'points' | 'distance';
  equipment?: string[]; // attrezzature necessarie
  rules?: string; // regole specifiche della disciplina
  isActive?: boolean; // se la disciplina è attiva
  timeLimit?: number; // limite di tempo in secondi
  createdAt?: Date;
  updatedAt?: Date;
};

// Configurazione gara live
export type CompetitionLiveSetup = {
  id: string;
  competitionId: string;
  disciplines: CustomDiscipline[];
  disciplineOrder: string[]; // ordine delle discipline
  orderMode: 'category' | 'weight'; // modalità ordine atleti
  maxAttempts: { [disciplineId: string]: number }; // tentativi per disciplina
  lots: CompetitionLot[];
  groups: CompetitionGroup[];
  mergedCategories?: MergedCategory[];
  createdAt: Date;
  updatedAt: Date;
};

// Lotti per gestione ordine atleti
export type CompetitionLot = {
  id: string;
  name: string;
  athleteIds: string[];
  order: number;
};

// Gruppi personalizzabili
export type CompetitionGroup = {
  id: string;
  name: string;
  athleteIds: string[];
  color?: string;
};

// Categorie accorpate
export type MergedCategory = {
  id: string;
  name: string;
  originalCategoryIds: string[];
  separateRankings: boolean; // classifiche separate o unificate
  ageGroups?: string[];
  weightClasses?: string[];
};

// Sessione gara live
export type LiveCompetitionSession = {
  id: string;
  competitionId: string;
  setupId: string;
  currentState: 'setup' | 'active' | 'paused' | 'discipline_break' | 'completed';
  currentDiscipline?: string;
  currentAthleteId?: string;
  currentAttempt?: number;
  nextUp: QueueItem[];
  judgeAssignments: JudgeAssignment[];
  createdAt: Date;
  updatedAt: Date;
};

// Coda atleti
export type QueueItem = {
  athleteId: string;
  disciplineId: string;
  attemptNumber: number;
  requestedWeight?: number;
  order: number;
};

// Assegnazione giudici
export type JudgeAssignment = {
  id: string;
  competitionId: string;
  judgeId: string;
  sessionId?: string;
  role: 'head' | 'side';
  position: 1 | 2 | 3; // giudice sinistra, centro, destra
  isActive: boolean;
  assignedAt: Date;
  createdAt: Date | import('firebase/firestore').FieldValue;
  updatedAt: Date | import('firebase/firestore').FieldValue;
};

// Risultato tentativo
export type AttemptResult = {
  id: string;
  sessionId: string;
  athleteId: string;
  competitionId: string;
  athleteName: string;
  disciplineId: string;
  discipline: string;
  attemptNumber: 1 | 2 | 3;
  requestedWeight: number;
  actualWeight?: number;
  weight: number;
  judgeVotes: JudgeVote[];
  isValid: boolean;
  validVotes?: number;
  totalVotes?: number;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  recordBroken?: RecordBroken;
  sport: 'powerlifting' | 'strongman' | 'weightlifting' | 'streetlifting';
  category: string;
  weightCategory: string;
};

// Voto giudice
export type JudgeVote = {
  id: string;
  judgeId: string;
  position: 1 | 2 | 3;
  vote: 'valid' | 'invalid';
  decision: 'valid' | 'invalid';
  timestamp: Date;
  corrected?: boolean; // se il voto è stato corretto
  originalVote?: 'valid' | 'invalid';
  competitionId: string;
  sessionId?: string;
  athleteId: string;
  athleteName?: string;
  discipline: string;
  attemptNumber: number;
  weight?: number;
  notes?: string;
};

// Record stabilito
export type RecordBroken = {
  id: string;
  recordId: string;
  type: 'competition' | 'national' | 'world';
  previousRecord?: number;
  previousHolder?: string;
  category: string;
  ageGroup?: string;
  competitionId: string;
  athleteId: string;
  athleteName: string;
  disciplineId: string;
  discipline: string;
  weightCategory: string;
  weight: number;
  newWeight: number;
  previousWeight: number;
  recordType: 'competition' | 'national' | 'world' | 'regional' | 'local';
  improvement: number;
  sport: 'powerlifting' | 'strongman' | 'weightlifting' | 'streetlifting';
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
};

// Record database
export type CompetitionRecord = {
  id: string;
  disciplineId: string;
  discipline: string;
  weight: number;
  value: number;
  unit: string;
  athleteName: string;
  athleteId: string;
  competitionId: string;
  competitionName: string;
  category: string;
  weightCategory: string;
  ageGroup?: string;
  gender: 'M' | 'F';
  federation?: string;
  location?: string;
  notes?: string;
  type: 'competition' | 'national' | 'world';
  recordType: 'competition' | 'national' | 'world' | 'regional' | 'local';
  sport: 'powerlifting' | 'strongman' | 'weightlifting' | 'streetlifting';
  dateSet: Date;
  isActive: boolean;
  isRatified: boolean;
  createdAt: Date | import('firebase/firestore').FieldValue;
  updatedAt: Date | import('firebase/firestore').FieldValue;
};

// Sistema di pesatura ufficiale
export type WeighIn = {
  id: string;
  competitionId: string;
  athleteId: string;
  athleteName: string;
  categoryId: string;
  weightCategory: string;
  bodyWeight: number;
  weight: number;
  weighInTime: Date | import('firebase/firestore').FieldValue;
  isOfficial: boolean;
  witnessJudgeId?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
};

// Timer per sessioni live
export type CompetitionTimer = {
  id: string;
  sessionId: string;
  type: 'attempt' | 'break' | 'discipline_change';
  duration: number; // secondi
  startTime?: Date | import('firebase/firestore').FieldValue;
  endTime?: Date;
  isActive: boolean;
  isPaused: boolean;
  remainingTime: number;
};

// Sistema di backup
export interface BackupData {
  id: string;
  competitionId: string;
  name: string;
  type: 'full' | 'incremental';
  description?: string;
  timestamp: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  expiresAt: Date;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  isEncrypted?: boolean;
  encryptionMethod?: string;
  compressionRatio?: number;
  checksum?: string;
  data: {
    competition?: Competition;
    competitions?: Competition[];
    athletes?: Athlete[];
    registrations?: Registration[];
    attempts?: unknown[];
    categories?: CategoryConfig[];
    judges?: Judge[];
    liveSessions?: unknown[];
    weighIns?: unknown[];
    judgeAssignments?: unknown[];
    results?: unknown[];
  } & Record<string, unknown>;
  size: number;
  dataSize: number;
}

// Notifiche sistema
export type SystemNotification = {
  id: string;
  userId?: string; // se null, notifica globale
  competitionId?: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date | import('firebase/firestore').FieldValue;
  expiresAt?: Date;
};

// Configurazioni sistema
export type SystemConfig = {
  id: string;
  key: string;
  value: { [key: string]: unknown };
  type: 'string' | 'number' | 'boolean' | 'object';
  description?: string;
  isEditable: boolean;
  updatedAt: Date;
  updatedBy: string;
  // Proprietà generali del sistema
  systemName?: string;
  version?: string;
  defaultLanguage?: string;
  timezone?: string;
  // Proprietà di sicurezza
  requireTwoFactor?: boolean;
  sessionTimeout?: number;
  // Proprietà specifiche per le notifiche
  enablePushNotifications?: boolean;
  enableEmailNotifications?: boolean;
  notifyRecordBreaks?: boolean;
  notifyTechnicalIssues?: boolean;
  // Proprietà specifiche per i backup
  enableAutoBackup?: boolean;
  backupFrequencyHours?: number;
  maxBackupsToKeep?: number;
  compressBackups?: boolean;
  // Proprietà specifiche per i timer
  disciplineChangeTime?: number;
  powerliftingAttemptTime?: number;
  weightliftingAttemptTime?: number;
  breakTime?: number;
  // Proprietà specifiche per la registrazione
  allowSelfRegistration?: boolean;
  allowLateRegistration?: boolean;
  requireEmailVerification?: boolean;
  requireWeighIn?: boolean;
  defaultUserRole?: string;
  maxParticipantsPerCompetition?: number;
  registrationAdvanceDays?: number;
};

// Qualificazioni atleti
export type AthleteQualification = {
  id: string;
  athleteId: string;
  athleteName: string;
  disciplineId: string;
  discipline: string;
  qualifyingWeight: number;
  qualifyingTotal: number;
  qualifyingValue: number;
  achievedValue: number;
  qualifyingDate: Date;
  qualificationDate: Date;
  competitionId: string;
  competitionName: string;
  competitionLevel: string;
  isValid: boolean;
  isActive: boolean;
  isQualified: boolean;
  expiresAt?: Date;
  expiryDate?: Date;
  federation: string;
  sport: 'powerlifting' | 'strongman' | 'weightlifting' | 'streetlifting';
  category: string;
  weightCategory: string;
  createdAt: Date | import('firebase/firestore').FieldValue;
  updatedAt: Date | import('firebase/firestore').FieldValue;
};

// Giudice
export type Judge = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  judgeNumber?: string;
  federations: string[];
  certifications: JudgeCertification[];
  certificationLevel: 'international' | 'national' | 'regional' | 'local';
  experienceYears?: number;
  specializations: string[];
  isActive: boolean;
  notes?: string;
  createdAt: Date | import('firebase/firestore').FieldValue;
  updatedAt: Date | import('firebase/firestore').FieldValue;
};

// Sessione live
export type LiveSession = {
  id: string;
  competitionId: string;
  isActive: boolean;
  currentAthleteId?: string;
  currentDiscipline?: string;
  currentAttempt?: number;
  timer?: CompetitionTimer;
  createdAt: Date;
  updatedAt: Date;
};

// Record atleta
export type AthleteRecord = {
  id: string;
  athleteId: string;
  sport: 'powerlifting' | 'strongman' | 'weightlifting' | 'streetlifting';
  discipline: string;
  category: string;
  weightCategory?: string;
  value: number;
  unit: 'kg' | 'points';
  competitionId: string;
  dateSet: Date;
  isPersonalBest: boolean;
  isSeasonBest: boolean;
  previousBest?: number;
  improvement?: number;
  createdAt: Date | import('firebase/firestore').FieldValue;
  updatedAt: Date | import('firebase/firestore').FieldValue;
};

// Sessione live estesa
export type ExtendedLiveSession = LiveCompetitionSession & {
  timer?: CompetitionTimer;
  currentWeighIn?: WeighIn[];
  notifications: SystemNotification[];
  backupStatus: 'synced' | 'pending' | 'error';
  connectedJudges: string[];
  spectatorCount?: number;
};