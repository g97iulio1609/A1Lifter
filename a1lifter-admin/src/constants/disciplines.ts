import type { CustomDiscipline } from '@/types';

// Discipline Powerlifting
export const POWERLIFTING_DISCIPLINES: CustomDiscipline[] = [
  {
    id: 'squat',
    name: 'Squat',
    sport: 'powerlifting',
    maxAttempts: 3,
    unit: 'kg',
    scoringType: 'weight',
    isDefault: true,
    description: 'Squat con bilanciere'
  },
  {
    id: 'bench',
    name: 'Bench Press',
    sport: 'powerlifting',
    maxAttempts: 3,
    unit: 'kg',
    scoringType: 'weight',
    isDefault: true,
    description: 'Panca piana con bilanciere'
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    sport: 'powerlifting',
    maxAttempts: 3,
    unit: 'kg',
    scoringType: 'weight',
    isDefault: true,
    description: 'Stacco da terra'
  }
];

// Discipline Strongman
export const STRONGMAN_DISCIPLINES: CustomDiscipline[] = [
  {
    id: 'deadlift_strongman',
    name: 'Deadlift',
    sport: 'strongman',
    maxAttempts: 3,
    unit: 'kg',
    scoringType: 'weight',
    isDefault: true,
    description: 'Stacco da terra strongman'
  },
  {
    id: 'log_press',
    name: 'Log Press',
    sport: 'strongman',
    maxAttempts: 3,
    unit: 'kg',
    scoringType: 'weight',
    isDefault: true,
    description: 'Spinta con log',
    equipment: ['Log']
  },
  {
    id: 'atlas_stones',
    name: 'Atlas Stones',
    sport: 'strongman',
    maxAttempts: 1,
    unit: 'time',
    scoringType: 'time',
    isDefault: true,
    description: 'Sollevamento pietre Atlas',
    equipment: ['Atlas Stones', 'Piattaforme']
  },
  {
    id: 'farmers_walk',
    name: "Farmer's Walk",
    sport: 'strongman',
    maxAttempts: 1,
    unit: 'time',
    scoringType: 'time',
    isDefault: true,
    description: 'Camminata del contadino',
    equipment: ['Maniglie Farmer']
  },
  {
    id: 'tire_flip',
    name: 'Tire Flip',
    sport: 'strongman',
    maxAttempts: 1,
    unit: 'time',
    scoringType: 'time',
    isDefault: true,
    description: 'Ribaltamento pneumatico',
    equipment: ['Pneumatico']
  }
];

// Discipline Weightlifting
export const WEIGHTLIFTING_DISCIPLINES: CustomDiscipline[] = [
  {
    id: 'snatch',
    name: 'Snatch',
    sport: 'weightlifting',
    maxAttempts: 3,
    unit: 'kg',
    scoringType: 'weight',
    isDefault: true,
    description: 'Strappo olimpico'
  },
  {
    id: 'clean_jerk',
    name: 'Clean & Jerk',
    sport: 'weightlifting',
    maxAttempts: 3,
    unit: 'kg',
    scoringType: 'weight',
    isDefault: true,
    description: 'Slancio olimpico'
  }
];

// Discipline Streetlifting
export const STREETLIFTING_DISCIPLINES: CustomDiscipline[] = [
  {
    id: 'weighted_pullups',
    name: 'Weighted Pull-ups',
    sport: 'streetlifting',
    maxAttempts: 3,
    unit: 'kg',
    scoringType: 'weight',
    isDefault: true,
    description: 'Trazioni zavorrate'
  },
  {
    id: 'weighted_dips',
    name: 'Weighted Dips',
    sport: 'streetlifting',
    maxAttempts: 3,
    unit: 'kg',
    scoringType: 'weight',
    isDefault: true,
    description: 'Dip zavorrati'
  },
  {
    id: 'muscle_up',
    name: 'Muscle Up',
    sport: 'streetlifting',
    maxAttempts: 3,
    unit: 'kg',
    scoringType: 'weight',
    isDefault: true,
    description: 'Muscle up zavorrato'
  },
  {
    id: 'one_arm_pullup',
    name: 'One Arm Pull-up',
    sport: 'streetlifting',
    maxAttempts: 3,
    unit: 'kg',
    scoringType: 'weight',
    isDefault: true,
    description: 'Trazione ad un braccio'
  }
];

// Mappa discipline per sport
export const DISCIPLINES_BY_SPORT = {
  powerlifting: POWERLIFTING_DISCIPLINES,
  strongman: STRONGMAN_DISCIPLINES,
  weightlifting: WEIGHTLIFTING_DISCIPLINES,
  streetlifting: STREETLIFTING_DISCIPLINES
} as const;

// Tutte le discipline
export const ALL_DISCIPLINES = [
  ...POWERLIFTING_DISCIPLINES,
  ...STRONGMAN_DISCIPLINES,
  ...WEIGHTLIFTING_DISCIPLINES,
  ...STREETLIFTING_DISCIPLINES
];

// Categorie peso standard per sport
export const WEIGHT_CLASSES_BY_SPORT = {
  powerlifting: {
    men: ['59kg', '66kg', '74kg', '83kg', '93kg', '105kg', '120kg', '120kg+'],
    women: ['47kg', '52kg', '57kg', '63kg', '69kg', '76kg', '84kg', '84kg+']
  },
  strongman: {
    men: ['80kg', '90kg', '105kg', '105kg+'],
    women: ['70kg', '80kg', '80kg+']
  },
  weightlifting: {
    men: ['55kg', '61kg', '67kg', '73kg', '81kg', '89kg', '96kg', '102kg', '109kg', '109kg+'],
    women: ['45kg', '49kg', '55kg', '59kg', '64kg', '71kg', '76kg', '81kg', '87kg', '87kg+']
  },
  streetlifting: {
    men: ['60kg', '67.5kg', '75kg', '82.5kg', '90kg', '100kg', '110kg', '110kg+'],
    women: ['48kg', '52kg', '56kg', '60kg', '67.5kg', '75kg', '82.5kg', '82.5kg+']
  }
} as const;

// Formule di scoring per sport
export const SCORING_FORMULAS_BY_SPORT = {
  powerlifting: ['ipf', 'wilks', 'dots'],
  strongman: ['ipf', 'wilks'],
  weightlifting: ['sinclair', 'robi'],
  streetlifting: ['wilks', 'dots']
} as const;