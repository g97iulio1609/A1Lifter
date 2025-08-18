import { useState, useEffect } from 'react';
import { competitionsService } from '@/services/competitions';
import { resultsService } from '@/services/results';
import { athletesService } from '@/services/athletes';
import { recordService } from '@/services/records';

interface LiveCompetition {
  id: string;
  name: string;
  status: 'live' | 'upcoming';
  currentAthlete?: string;
  discipline?: string;
  location: string;
  date: Date;
}

interface RecentResult {
  id: string;
  competitionName: string;
  athleteName: string;
  discipline: string;
  result: string;
  date: Date;
  isRecord?: boolean;
}

interface PlatformStats {
  totalCompetitions: number;
  totalAthletes: number;
  totalRecords: number;
  satisfactionRate: number;
}

// Hook per ottenere competizioni live e prossime
export const useLiveCompetitions = () => {
  const [liveCompetitions, setLiveCompetitions] = useState<LiveCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLiveCompetitions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ottieni competizioni attive e prossime
        const competitions = await competitionsService.getCompetitions({
          status: 'active'
        });

        const now = new Date();
        const liveComps: LiveCompetition[] = competitions
          .filter(comp => {
            const compDate = new Date(comp.date);
            const daysDiff = Math.abs(compDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= 1; // Competizioni oggi o domani
          })
          .map(comp => ({
            id: comp.id,
            name: comp.name,
            status: comp.status === 'active' ? 'live' as const : 'upcoming' as const,
            location: comp.location,
            date: new Date(comp.date),
            currentAthlete: comp.status === 'active' ? 'Atleta in gara' : undefined,
            discipline: comp.status === 'active' ? 'Squat' : undefined
          }));

        setLiveCompetitions(liveComps);
      } catch (err) {
        console.error('Error fetching live competitions:', err);
        setError('Errore nel caricamento delle competizioni live');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveCompetitions();
    
    // Aggiorna ogni 30 secondi
    const interval = setInterval(fetchLiveCompetitions, 30000);
    return () => clearInterval(interval);
  }, []);

  return { liveCompetitions, loading, error };
};

// Hook per ottenere risultati recenti
export const useRecentResults = () => {
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentResults = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ottieni competizioni completate recenti
        const competitions = await competitionsService.getCompetitions({
          status: 'completed'
        });

        // Prendi le ultime 3 competizioni completate
        const recentCompetitions = competitions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3);

        const results: RecentResult[] = [];

        // Per ogni competizione recente, ottieni i migliori risultati
        for (const competition of recentCompetitions) {
          try {
            const competitionResults = await resultsService.getResultsWithAthletes(competition.id);
            
            // Prendi il miglior risultato per ogni disciplina
            const bestResults = competitionResults
              .sort((a, b) => b.totalScore - a.totalScore)
              .slice(0, 2); // Top 2 per competizione

            for (const result of bestResults) {
              if (result.lifts && result.lifts.length > 0) {
                // Trova il miglior tentativo
                const bestLift = result.lifts
                  .filter(lift => lift.valid)
                  .sort((a, b) => b.weight - a.weight)[0];

                if (bestLift) {
                  results.push({
                    id: result.id,
                    competitionName: competition.name,
                    athleteName: result.athleteName,
                    discipline: bestLift.discipline,
                    result: `${bestLift.weight}kg`,
                    date: new Date(competition.date),
                    isRecord: bestLift.weight > 200 // Semplice euristica per record
                  });
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching results for competition ${competition.id}:`, err);
          }
        }

        setRecentResults(results.slice(0, 6)); // Massimo 6 risultati
      } catch (err) {
        console.error('Error fetching recent results:', err);
        setError('Errore nel caricamento dei risultati recenti');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentResults();
  }, []);

  return { recentResults, loading, error };
};

// Hook per ottenere statistiche della piattaforma
export const usePlatformStats = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ottieni statistiche in parallelo
        const [competitionsStats, athletesStats, recordsStats] = await Promise.all([
          competitionsService.getCompetitionsStats(),
          athletesService.getAthletesStats(),
          recordService.getRecordStatistics()
        ]);

        const platformStats: PlatformStats = {
          totalCompetitions: competitionsStats.total,
          totalAthletes: athletesStats.total,
          totalRecords: recordsStats.totalRecords,
          satisfactionRate: 98 // Mantenuto fisso per ora
        };

        setStats(platformStats);
      } catch (err) {
        console.error('Error fetching platform stats:', err);
        setError('Errore nel caricamento delle statistiche');
        
        // Fallback con dati di default
        setStats({
          totalCompetitions: 0,
          totalAthletes: 0,
          totalRecords: 0,
          satisfactionRate: 98
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlatformStats();
  }, []);

  return { stats, loading, error };
};