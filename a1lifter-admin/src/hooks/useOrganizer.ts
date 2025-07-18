import { useQuery } from '@tanstack/react-query';
import { organizerService } from '@/services/organizer';

export const ORGANIZER_QUERY_KEY = 'organizer';

// Hook per dati dashboard organizzatore
export const useOrganizerDashboard = (competitionId: string) => {
  return useQuery({
    queryKey: [ORGANIZER_QUERY_KEY, 'dashboard', competitionId],
    queryFn: () => organizerService.getOrganizerDashboard(competitionId),
    enabled: !!competitionId,
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
    staleTime: 1000 * 10, // 10 secondi
  });
};

// Hook per atleti mancanti
export const useMissingAthletes = (competitionId: string) => {
  return useQuery({
    queryKey: [ORGANIZER_QUERY_KEY, 'missing-athletes', competitionId],
    queryFn: () => organizerService.getMissingAthletes(competitionId),
    enabled: !!competitionId,
    refetchInterval: 60000, // Aggiorna ogni minuto
  });
};

// Hook per prossimi atleti
export const useUpcomingAthletes = (competitionId: string) => {
  return useQuery({
    queryKey: [ORGANIZER_QUERY_KEY, 'upcoming-athletes', competitionId],
    queryFn: () => organizerService.getUpcomingAthletes(competitionId),
    enabled: !!competitionId,
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
  });
};

// Hook per statistiche live
export const useLiveStats = (competitionId: string) => {
  return useQuery({
    queryKey: [ORGANIZER_QUERY_KEY, 'live-stats', competitionId],
    queryFn: () => organizerService.getLiveStats(competitionId),
    enabled: !!competitionId,
    refetchInterval: 15000, // Aggiorna ogni 15 secondi
  });
};

// Hook per alert
export const useAlerts = (competitionId: string) => {
  return useQuery({
    queryKey: [ORGANIZER_QUERY_KEY, 'alerts', competitionId],
    queryFn: () => organizerService.getAlerts(competitionId),
    enabled: !!competitionId,
    refetchInterval: 60000, // Aggiorna ogni minuto
  });
};