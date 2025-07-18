import { athletesService } from './athletes';
import { competitionsService } from './competitions';
import { resultsService } from './results';
import type { Competition, AthleteResult, Registration } from '@/types';

export interface OrganizerDashboardData {
  competition: Competition;
  registrations: Registration[];
  results: AthleteResult[];
  stats: {
    totalRegistrations: number;
    confirmedRegistrations: number;
    pendingRegistrations: number;
    totalResults: number;
    completedAthletes: number;
    averageScore: number;
    topScore: number;
    categoriesProgress: {
      categoryId: string;
      categoryName: string;
      registered: number;
      completed: number;
      percentage: number;
    }[];
  };
  timeline: {
    timestamp: Date;
    type: 'registration' | 'result' | 'lift';
    athleteName: string;
    description: string;
  }[];
}

export const organizerService = {
  // Ottieni dati completi dashboard organizzatore
  async getOrganizerDashboard(competitionId: string): Promise<OrganizerDashboardData> {
    const [competition, registrations, results] = await Promise.all([
      competitionsService.getCompetition(competitionId),
      competitionsService.getRegistrations(competitionId),
      resultsService.getResultsWithAthletes(competitionId)
    ]);

    if (!competition) {
      throw new Error('Competizione non trovata');
    }

    // Calcola statistiche
    const totalRegistrations = registrations.length;
    const confirmedRegistrations = registrations.filter(r => r.status === 'confirmed').length;
    const pendingRegistrations = registrations.filter(r => r.status === 'pending').length;
    const totalResults = results.length;
    const completedAthletes = results.filter(r => r.lifts.length > 0).length;
    const averageScore = results.length > 0 ? results.reduce((sum, r) => sum + r.totalScore, 0) / results.length : 0;
    const topScore = results.length > 0 ? Math.max(...results.map(r => r.totalScore)) : 0;

    // Calcola progresso per categoria
    const categoriesProgress = competition.categories.map(category => {
      const categoryRegistrations = registrations.filter(r => r.categoryId === category.id);
      const categoryResults = results.filter(r => r.categoryId === category.id);
      const completed = categoryResults.filter(r => r.lifts.length > 0).length;
      
      return {
        categoryId: category.id,
        categoryName: category.name,
        registered: categoryRegistrations.length,
        completed,
        percentage: categoryRegistrations.length > 0 ? (completed / categoryRegistrations.length) * 100 : 0,
      };
    });

    // Crea timeline attività
    const timeline: OrganizerDashboardData['timeline'] = [];
    
    // Aggiungi registrazioni alla timeline
    for (const registration of registrations.slice(-10)) {
      const athlete = await athletesService.getAthlete(registration.athleteId);
      if (athlete) {
        timeline.push({
          timestamp: registration.registeredAt,
          type: 'registration',
          athleteName: athlete.name,
          description: `Iscritto alla competizione`,
        });
      }
    }

    // Aggiungi risultati alla timeline
    for (const result of results.slice(-20)) {
      timeline.push({
        timestamp: result.updatedAt,
        type: 'result',
        athleteName: result.athleteName,
        description: `Totale: ${result.totalScore}kg`,
      });
    }

    // Ordina timeline per timestamp
    timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      competition,
      registrations,
      results,
      stats: {
        totalRegistrations,
        confirmedRegistrations,
        pendingRegistrations,
        totalResults,
        completedAthletes,
        averageScore,
        topScore,
        categoriesProgress,
      },
      timeline: timeline.slice(0, 15), // Ultimi 15 eventi
    };
  },

  // Ottieni atleti mancanti (iscritti ma senza risultati)
  async getMissingAthletes(competitionId: string): Promise<{
    athleteId: string;
    athleteName: string;
    categoryName: string;
    registeredAt: Date;
  }[]> {
    const [registrations, results] = await Promise.all([
      competitionsService.getRegistrations(competitionId),
      resultsService.getResults({ competitionId })
    ]);

    const competition = await competitionsService.getCompetition(competitionId);
    if (!competition) return [];

    const confirmedRegistrations = registrations.filter(r => r.status === 'confirmed');
    const athletesWithResults = new Set(results.map(r => r.athleteId));

    const missingAthletes = [];
    for (const registration of confirmedRegistrations) {
      if (!athletesWithResults.has(registration.athleteId)) {
        const athlete = await athletesService.getAthlete(registration.athleteId);
        const category = competition.categories.find(c => c.id === registration.categoryId);
        
        if (athlete && category) {
          missingAthletes.push({
            athleteId: registration.athleteId,
            athleteName: athlete.name,
            categoryName: category.name,
            registeredAt: registration.registeredAt,
          });
        }
      }
    }

    return missingAthletes;
  },

  // Ottieni prossimi atleti da far gareggiare
  async getUpcomingAthletes(competitionId: string): Promise<{
    athleteId: string;
    athleteName: string;
    categoryName: string;
    nextDiscipline: string;
    attemptNumber: number;
  }[]> {
    const results = await resultsService.getResultsWithAthletes(competitionId);
    const competition = await competitionsService.getCompetition(competitionId);
    
    if (!competition) return [];

    const upcomingAthletes = [];
    
    for (const result of results) {
      const disciplines = competition.rules.disciplines;
      const maxAttempts = competition.rules.attempts;
      
      for (const discipline of disciplines) {
        const disciplineLifts = result.lifts.filter(l => l.discipline === discipline);
        
        if (disciplineLifts.length < maxAttempts) {
          upcomingAthletes.push({
            athleteId: result.athleteId,
            athleteName: result.athleteName,
            categoryName: result.categoryName,
            nextDiscipline: discipline,
            attemptNumber: disciplineLifts.length + 1,
          });
          break; // Solo il prossimo tentativo per atleta
        }
      }
    }

    return upcomingAthletes.slice(0, 10); // Prossimi 10 atleti
  },

  // Ottieni statistiche tempo reale
  async getLiveStats(competitionId: string): Promise<{
    totalLifts: number;
    validLifts: number;
    invalidLifts: number;
    successRate: number;
    averageWeight: number;
    recordsBreaking: number;
    currentLeaders: {
      categoryId: string;
      categoryName: string;
      athleteName: string;
      totalScore: number;
    }[];
  }> {
    const [results, competition] = await Promise.all([
      resultsService.getResultsWithAthletes(competitionId),
      competitionsService.getCompetition(competitionId)
    ]);

    if (!competition) {
      throw new Error('Competizione non trovata');
    }

    const allLifts = results.flatMap(r => r.lifts);
    const validLifts = allLifts.filter(l => l.valid);
    const invalidLifts = allLifts.filter(l => !l.valid);
    const totalLifts = allLifts.length;
    const successRate = totalLifts > 0 ? (validLifts.length / totalLifts) * 100 : 0;
    const averageWeight = validLifts.length > 0 ? validLifts.reduce((sum, l) => sum + l.weight, 0) / validLifts.length : 0;

    // Calcola record battuti (semplificato)
    const recordsBreaking = validLifts.filter(l => l.weight > 200).length; // Placeholder logic

    // Trova leader per categoria
    const currentLeaders = competition.categories.map(category => {
      const categoryResults = results.filter(r => r.categoryId === category.id);
      const leader = categoryResults.reduce((best, current) => 
        current.totalScore > best.totalScore ? current : best
      , categoryResults[0]);

      return {
        categoryId: category.id,
        categoryName: category.name,
        athleteName: leader?.athleteName || 'Nessuno',
        totalScore: leader?.totalScore || 0,
      };
    }).filter(leader => leader.totalScore > 0);

    return {
      totalLifts,
      validLifts: validLifts.length,
      invalidLifts: invalidLifts.length,
      successRate,
      averageWeight,
      recordsBreaking,
      currentLeaders,
    };
  },

  // Ottieni alert e notifiche
  async getAlerts(competitionId: string): Promise<{
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }[]> {
    const alerts = [];
    const now = new Date();

    // Controlla atleti mancanti
    const missingAthletes = await this.getMissingAthletes(competitionId);
    if (missingAthletes.length > 0) {
      alerts.push({
        type: 'warning' as const,
        message: `${missingAthletes.length} atleti iscritti non hanno ancora gareggiato`,
        timestamp: now,
      });
    }

    // Controlla registrazioni pendenti
    const registrations = await competitionsService.getRegistrations(competitionId);
    const pendingRegistrations = registrations.filter(r => r.status === 'pending');
    if (pendingRegistrations.length > 0) {
      alerts.push({
        type: 'info' as const,
        message: `${pendingRegistrations.length} registrazioni in attesa di conferma`,
        timestamp: now,
      });
    }

    return alerts;
  },
};