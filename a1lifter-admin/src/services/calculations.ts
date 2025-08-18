import type { AttemptResult, Athlete } from '@/types';

// Coefficienti per le formule di calcolo
const WILKS_COEFFICIENTS = {
  men: {
    a: -216.0475144,
    b: 16.2606339,
    c: -0.002388645,
    d: -0.00113732,
    e: 7.01863e-6,
    f: -1.291e-8
  },
  women: {
    a: 594.31747775582,
    b: -27.23842536447,
    c: 0.82112226871,
    d: -0.00930733913,
    e: 4.731582e-5,
    f: -9.054e-8
  }
};

const DOTS_COEFFICIENTS = {
  men: {
    a: -307.75076,
    b: 24.0900756,
    c: -0.1918759221,
    d: 0.0007391293,
    e: -0.000001093
  },
  women: {
    a: -57.96288,
    b: 13.6175032,
    c: -0.1126655495,
    d: 0.0005158568,
    e: -0.0000010706
  }
};

// Coefficienti IPF (semplificati)
const IPF_COEFFICIENTS = {
  men: {
    a: 1199.72839,
    b: 1025.18162,
    c: 0.00921
  },
  women: {
    a: 610.32796,
    b: 1045.59282,
    c: 0.03048
  }
};

export class CalculationService {
  // === CALCOLI POWERLIFTING ===

  // Calcola punteggio Wilks
  calculateWilks(
    total: number,
    bodyweight: number,
    gender: 'male' | 'female'
  ): number {
    if (total <= 0 || bodyweight <= 0) return 0;

    const coeff = gender === 'male' ? WILKS_COEFFICIENTS.men : WILKS_COEFFICIENTS.women;
    const bw = bodyweight;

    const denominator = coeff.a + 
      coeff.b * bw + 
      coeff.c * Math.pow(bw, 2) + 
      coeff.d * Math.pow(bw, 3) + 
      coeff.e * Math.pow(bw, 4) + 
      coeff.f * Math.pow(bw, 5);

    const wilksCoeff = 500 / denominator;
    return Math.round(total * wilksCoeff * 100) / 100;
  }

  // Calcola punteggio DOTS
  calculateDOTS(
    total: number,
    bodyweight: number,
    gender: 'male' | 'female'
  ): number {
    if (total <= 0 || bodyweight <= 0) return 0;

    const coeff = gender === 'male' ? DOTS_COEFFICIENTS.men : DOTS_COEFFICIENTS.women;
    const bw = bodyweight;

    const denominator = coeff.a + 
      coeff.b * bw + 
      coeff.c * Math.pow(bw, 2) + 
      coeff.d * Math.pow(bw, 3) + 
      coeff.e * Math.pow(bw, 4);

    const dotsCoeff = 500 / denominator;
    return Math.round(total * dotsCoeff * 100) / 100;
  }

  // Calcola punteggio IPF
  calculateIPF(
    total: number,
    bodyweight: number,
    gender: 'male' | 'female'
  ): number {
    if (total <= 0 || bodyweight <= 0) return 0;

    const coeff = gender === 'male' ? IPF_COEFFICIENTS.men : IPF_COEFFICIENTS.women;
    const bw = bodyweight;

    const ipfCoeff = coeff.a / (coeff.b - coeff.c * bw);
    return Math.round(total * ipfCoeff * 100) / 100;
  }

  // Calcola GL Points (Good Lift Points)
  calculateGLPoints(
    total: number,
    bodyweight: number,
    gender: 'male' | 'female',
    age: number
  ): number {
    if (total <= 0 || bodyweight <= 0) return 0;

    // Formula semplificata GL Points
    const baseScore = this.calculateWilks(total, bodyweight, gender);
    
    // Fattore età
    let ageFactor = 1;
    if (age >= 40) {
      ageFactor = 1 + (age - 40) * 0.01; // 1% per anno dopo i 40
    }
    
    return Math.round(baseScore * ageFactor * 100) / 100;
  }

  // === CALCOLI WEIGHTLIFTING ===

  // Calcola punteggio Sinclair per weightlifting
  calculateSinclair(
    total: number,
    bodyweight: number,
    gender: 'male' | 'female'
  ): number {
    if (total <= 0 || bodyweight <= 0) return 0;

    // Coefficienti Sinclair (aggiornati periodicamente dalla IWF)
    const sinclairCoeff = gender === 'male' ? {
      a: 0.751945030,
      b: 175.508
    } : {
      a: 0.783497476,
      b: 153.757
    };

    if (bodyweight >= sinclairCoeff.b) {
      return total; // Nessun coefficiente se il peso è >= peso di riferimento
    }

    const coefficient = Math.pow(10, sinclairCoeff.a * Math.pow(Math.log10(bodyweight / sinclairCoeff.b), 2));
    return Math.round(total * coefficient * 100) / 100;
  }

  // Calcola punteggio SMF (Sinclair Malone Meltzer)
  calculateSMF(
    total: number,
    bodyweight: number,
    gender: 'male' | 'female',
    age: number
  ): number {
    const sinclairScore = this.calculateSinclair(total, bodyweight, gender);
    
    // Fattore età per SMF
    let ageFactor = 1;
    if (age >= 30) {
      const ageGroup = Math.floor((age - 30) / 5);
      ageFactor = 1 + (ageGroup * 0.05); // 5% per ogni gruppo di 5 anni
    }
    
    return Math.round(sinclairScore * ageFactor * 100) / 100;
  }

  // === CALCOLI STRONGMAN ===

  // Calcola punteggio strongman basato su posizionamento
  calculateStrongmanPoints(
    position: number,
    totalParticipants: number,
    disciplineWeight: number = 1
  ): number {
    if (position <= 0 || totalParticipants <= 0) return 0;
    
    // Sistema di punteggio decrescente
    const basePoints = Math.max(0, totalParticipants - position + 1);
    return Math.round(basePoints * disciplineWeight * 100) / 100;
  }

  // Calcola punteggio strongman per tempo
  calculateStrongmanTimeScore(
    time: number, // in secondi
    bestTime: number,
    maxPoints: number = 20
  ): number {
    if (time <= 0 || bestTime <= 0) return 0;
    
    // Punteggio inversamente proporzionale al tempo
    const ratio = bestTime / time;
    return Math.round(Math.min(maxPoints, maxPoints * ratio) * 100) / 100;
  }

  // Calcola punteggio strongman per peso
  calculateStrongmanWeightScore(
    weight: number,
    bestWeight: number,
    maxPoints: number = 20
  ): number {
    if (weight <= 0 || bestWeight <= 0) return 0;
    
    // Punteggio proporzionale al peso
    const ratio = weight / bestWeight;
    return Math.round(Math.min(maxPoints, maxPoints * ratio) * 100) / 100;
  }

  // Calcola punteggio strongman per ripetizioni
  calculateStrongmanRepsScore(
    reps: number,
    bestReps: number,
    maxPoints: number = 20
  ): number {
    if (reps <= 0 || bestReps <= 0) return 0;
    
    // Punteggio proporzionale alle ripetizioni
    const ratio = reps / bestReps;
    return Math.round(Math.min(maxPoints, maxPoints * ratio) * 100) / 100;
  }

  // === CALCOLI STREETLIFTING ===

  // Calcola punteggio streetlifting (simile al powerlifting ma con modifiche)
  calculateStreetliftingScore(
    total: number,
    bodyweight: number,
    gender: 'male' | 'female',
    formula: 'wilks' | 'dots' | 'ipf' = 'wilks'
  ): number {
    switch (formula) {
      case 'wilks':
        return this.calculateWilks(total, bodyweight, gender);
      case 'dots':
        return this.calculateDOTS(total, bodyweight, gender);
      case 'ipf':
        return this.calculateIPF(total, bodyweight, gender);
      default:
        return this.calculateWilks(total, bodyweight, gender);
    }
  }

  // === CALCOLI GENERALI ===

  // Calcola totale powerlifting/streetlifting
  calculatePowerliftingTotal(
    squat: number,
    bench: number,
    deadlift: number
  ): number {
    return squat + bench + deadlift;
  }

  // Calcola totale weightlifting
  calculateWeightliftingTotal(
    snatch: number,
    cleanAndJerk: number
  ): number {
    return snatch + cleanAndJerk;
  }

  // Calcola percentuale di successo
  calculateSuccessRate(
    successfulAttempts: number,
    totalAttempts: number
  ): number {
    if (totalAttempts === 0) return 0;
    return Math.round((successfulAttempts / totalAttempts) * 100 * 100) / 100;
  }

  // Calcola miglior tentativo
  getBestAttempt(attempts: AttemptResult[]): AttemptResult | null {
    const validAttempts = attempts.filter(attempt => attempt.isValid && attempt.weight > 0);
    if (validAttempts.length === 0) return null;
    
    return validAttempts.reduce((best, current) => 
      current.weight > best.weight ? current : best
    );
  }

  // Calcola progressione peso
  calculateWeightProgression(
    attempts: AttemptResult[]
  ): {
    startWeight: number;
    endWeight: number;
    progression: number;
    progressionPercentage: number;
  } {
    if (attempts.length === 0) {
      return {
        startWeight: 0,
        endWeight: 0,
        progression: 0,
        progressionPercentage: 0
      };
    }

    const validAttempts = attempts.filter(a => a.isValid && a.weight > 0);
    if (validAttempts.length === 0) {
      return {
        startWeight: 0,
        endWeight: 0,
        progression: 0,
        progressionPercentage: 0
      };
    }

    const startWeight = Math.min(...validAttempts.map(a => a.weight));
    const endWeight = Math.max(...validAttempts.map(a => a.weight));
    const progression = endWeight - startWeight;
    const progressionPercentage = startWeight > 0 ? (progression / startWeight) * 100 : 0;

    return {
      startWeight,
      endWeight,
      progression,
      progressionPercentage: Math.round(progressionPercentage * 100) / 100
    };
  }

  // Calcola statistiche atleta
  calculateAthleteStats(
    athlete: Athlete,
    results: AttemptResult[]
  ): {
    totalCompetitions: number;
    totalAttempts: number;
    successfulAttempts: number;
    successRate: number;
    bestTotal: number;
    bestWilks: number;
    bestDOTS: number;
    averageTotal: number;
    disciplines: Record<string, {
      bestWeight: number;
      attempts: number;
      successRate: number;
    }>;
  } {
    const validResults = results.filter(r => r.isValid);
    const totalAttempts = results.length;
    const successfulAttempts = validResults.length;
    const successRate = this.calculateSuccessRate(successfulAttempts, totalAttempts);

    // Raggruppa per competizione per calcolare i totali
    const competitionTotals = new Map<string, number>();
    const competitionResults = new Map<string, AttemptResult[]>();

    validResults.forEach(result => {
      const key = result.competitionId;
      if (!competitionResults.has(key)) {
        competitionResults.set(key, []);
      }
      competitionResults.get(key)!.push(result);
    });

    // Calcola totali per competizione
    competitionResults.forEach((results, competitionId) => {
      const disciplineResults = new Map<string, number>();
      
      results.forEach(result => {
        const currentBest = disciplineResults.get(result.discipline) || 0;
        if (result.weight > currentBest) {
          disciplineResults.set(result.discipline, result.weight);
        }
      });
      
      const total = Array.from(disciplineResults.values()).reduce((sum, weight) => sum + weight, 0);
      competitionTotals.set(competitionId, total);
    });

    const totals = Array.from(competitionTotals.values()).filter(t => t > 0);
    const bestTotal = totals.length > 0 ? Math.max(...totals) : 0;
    const averageTotal = totals.length > 0 ? totals.reduce((sum, t) => sum + t, 0) / totals.length : 0;

    // Calcola migliori punteggi
    const bestWilks = bestTotal > 0 && athlete.bodyweight ? 
      this.calculateWilks(bestTotal, athlete.bodyweight, athlete.gender === 'M' ? 'male' : 'female') : 0;
    const bestDOTS = bestTotal > 0 && athlete.bodyweight ? 
      this.calculateDOTS(bestTotal, athlete.bodyweight, athlete.gender === 'M' ? 'male' : 'female') : 0;

    // Statistiche per disciplina
    const disciplines: Record<string, {
      bestWeight: number;
      attempts: number;
      successRate: number;
    }> = {};
    const disciplineGroups = new Map<string, AttemptResult[]>();

    validResults.forEach(result => {
      if (!disciplineGroups.has(result.discipline)) {
        disciplineGroups.set(result.discipline, []);
      }
      disciplineGroups.get(result.discipline)!.push(result);
    });

    disciplineGroups.forEach((disciplineResults, discipline) => {
      const bestWeight = Math.max(...disciplineResults.map(r => r.weight));
      const disciplineAttempts = results.filter(r => r.discipline === discipline).length;
      const disciplineSuccessful = disciplineResults.length;
      const disciplineSuccessRate = this.calculateSuccessRate(disciplineSuccessful, disciplineAttempts);

      disciplines[discipline] = {
        bestWeight,
        attempts: disciplineAttempts,
        successRate: disciplineSuccessRate
      };
    });

    return {
      totalCompetitions: competitionTotals.size,
      totalAttempts,
      successfulAttempts,
      successRate,
      bestTotal: Math.round(bestTotal * 100) / 100,
      bestWilks: Math.round(bestWilks * 100) / 100,
      bestDOTS: Math.round(bestDOTS * 100) / 100,
      averageTotal: Math.round(averageTotal * 100) / 100,
      disciplines
    };
  }

  // Calcola categoria peso appropriata
  findWeightCategory(
    bodyweight: number,
    categories: number[]
  ): string {
    if (!categories || categories.length === 0) {
      return 'Open';
    }

    // Trova la categoria appropriata
    for (const category of categories) {
      if (bodyweight <= category) {
        return `${category}kg`;
      }
    }

    // Se supera tutte le categorie, è nella categoria più alta
    const maxCategory = Math.max(...categories);
    return `${maxCategory}+kg`;
  }

  // Valida tentativo
  validateAttempt(
    weight: number,
    previousAttempts: AttemptResult[],
    sport: string,
    discipline: string
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validazioni generali
    if (weight <= 0) {
      errors.push('Il peso deve essere maggiore di zero');
    }

    if (weight % 0.5 !== 0) {
      errors.push('Il peso deve essere un multiplo di 0.5kg');
    }

    // Validazioni specifiche per sport
    const validAttempts = previousAttempts.filter(a => a.isValid);
    if (validAttempts.length > 0) {
      const lastValidWeight = Math.max(...validAttempts.map(a => a.weight));
      
      if (weight <= lastValidWeight) {
        errors.push('Il peso deve essere superiore all\'ultimo tentativo valido');
      }
      
      const increment = weight - lastValidWeight;
      if (increment < 2.5) {
        warnings.push('Incremento minimo consigliato: 2.5kg');
      }
    }

    // Limiti massimi per sicurezza
    const maxWeights = {
      powerlifting: { squat: 600, bench: 400, deadlift: 500 },
      streetlifting: { squat: 600, bench: 400, deadlift: 500 },
      weightlifting: { snatch: 300, clean_and_jerk: 350 },
      strongman: { deadlift: 600, atlas_stones: 300, log_press: 300 }
    };

    const sportLimits = maxWeights[sport as keyof typeof maxWeights];
    if (sportLimits && sportLimits[discipline as keyof typeof sportLimits]) {
      const maxWeight = sportLimits[discipline as keyof typeof sportLimits];
      if (weight > maxWeight) {
        warnings.push(`Peso elevato per ${discipline}: ${weight}kg (max consigliato: ${maxWeight}kg)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const calculationService = new CalculationService();