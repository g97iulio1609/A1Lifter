// Servizi per il calcolo dei punteggi IPF, Wilks e DOTS

export interface ScoringCalculation {
  ipfScore?: number;
  wilksScore?: number;
  dotsScore?: number;
}

export const scoringService = {
  // Calcola IPF Score
  calculateIPFScore(
    totalKg: number,
    bodyweightKg: number,
    gender: 'M' | 'F',
    equipment: 'raw' | 'equipped' = 'raw'
  ): number {
    if (totalKg <= 0 || bodyweightKg <= 0) return 0;

    // Coefficienti IPF per Raw
    const coefficients = gender === 'M' ? {
      raw: { a: 1236.25115, b: 1449.21864, c: 0.01644 },
      equipped: { a: 1199.72839, b: 1025.18162, c: 0.00921 }
    } : {
      raw: { a: 758.63878, b: 949.31382, c: 0.02435 },
      equipped: { a: 610.32796, b: 1045.59282, c: 0.03048 }
    };

    const coeff = coefficients[equipment];
    const denominator = coeff.a - coeff.b * Math.exp(-coeff.c * bodyweightKg);
    
    return Math.round((500 / denominator) * totalKg * 100) / 100;
  },

  // Calcola Wilks Score
  calculateWilksScore(
    totalKg: number,
    bodyweightKg: number,
    gender: 'M' | 'F'
  ): number {
    if (totalKg <= 0 || bodyweightKg <= 0) return 0;

    // Coefficienti Wilks
    const coefficients = gender === 'M' ? {
      a: -216.0475144,
      b: 16.2606339,
      c: -0.002388645,
      d: -0.00113732,
      e: 7.01863e-6,
      f: -1.291e-8
    } : {
      a: 594.31747775582,
      b: -27.23842536447,
      c: 0.82112226871,
      d: -0.00930733913,
      e: 0.00004731582,
      f: -0.00000009054
    };

    const bw = bodyweightKg;
    const denominator = coefficients.a + 
      coefficients.b * bw + 
      coefficients.c * Math.pow(bw, 2) + 
      coefficients.d * Math.pow(bw, 3) + 
      coefficients.e * Math.pow(bw, 4) + 
      coefficients.f * Math.pow(bw, 5);

    return Math.round((500 / denominator) * totalKg * 100) / 100;
  },

  // Calcola DOTS Score
  calculateDOTSScore(
    totalKg: number,
    bodyweightKg: number,
    gender: 'M' | 'F'
  ): number {
    if (totalKg <= 0 || bodyweightKg <= 0) return 0;

    // Coefficienti DOTS
    const coefficients = gender === 'M' ? {
      a: -307.75076,
      b: 24.0900756,
      c: -0.1918759221,
      d: 0.0014574746,
      e: -0.0000056856,
      f: 0.0000000513
    } : {
      a: -57.96288,
      b: 13.6175032,
      c: -0.1126655495,
      d: 0.0005158568,
      e: -0.0000010706,
      f: 0.0000000001
    };

    const bw = bodyweightKg;
    const denominator = coefficients.a + 
      coefficients.b * bw + 
      coefficients.c * Math.pow(bw, 2) + 
      coefficients.d * Math.pow(bw, 3) + 
      coefficients.e * Math.pow(bw, 4) + 
      coefficients.f * Math.pow(bw, 5);

    return Math.round((500 / denominator) * totalKg * 100) / 100;
  },

  // Calcola tutti i punteggi
  calculateAllScores(
    totalKg: number,
    bodyweightKg: number,
    gender: 'M' | 'F',
    equipment: 'raw' | 'equipped' = 'raw'
  ): ScoringCalculation {
    return {
      ipfScore: this.calculateIPFScore(totalKg, bodyweightKg, gender, equipment),
      wilksScore: this.calculateWilksScore(totalKg, bodyweightKg, gender),
      dotsScore: this.calculateDOTSScore(totalKg, bodyweightKg, gender),
    };
  },

  // Valida i dati per il calcolo
  validateScoringData(totalKg: number, bodyweightKg: number): boolean {
    return totalKg > 0 && bodyweightKg > 0 && bodyweightKg < 300; // Limite ragionevole
  },

  // Ottieni il range di peso corporeo per una categoria
  getWeightRange(weightClass: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
      '47kg': { min: 0, max: 47 },
      '52kg': { min: 47.01, max: 52 },
      '53kg': { min: 47.01, max: 53 },
      '57kg': { min: 52.01, max: 57 },
      '59kg': { min: 53.01, max: 59 },
      '63kg': { min: 57.01, max: 63 },
      '66kg': { min: 59.01, max: 66 },
      '69kg': { min: 63.01, max: 69 },
      '74kg': { min: 66.01, max: 74 },
      '76kg': { min: 69.01, max: 76 },
      '83kg': { min: 74.01, max: 83 },
      '84kg': { min: 76.01, max: 84 },
      '93kg': { min: 83.01, max: 93 },
      '105kg': { min: 93.01, max: 105 },
      '120kg': { min: 105.01, max: 120 },
      '84kg+': { min: 84.01, max: 999 },
      '120kg+': { min: 120.01, max: 999 },
    };

    return ranges[weightClass] || { min: 0, max: 999 };
  },

  // Verifica se il peso corporeo è valido per la categoria
  isValidForWeightClass(bodyweightKg: number, weightClass: string): boolean {
    const range = this.getWeightRange(weightClass);
    return bodyweightKg >= range.min && bodyweightKg <= range.max;
  },
};