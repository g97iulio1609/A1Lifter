import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resultsService } from '@/services/results';
import type { Result, Lift } from '@/types';

export const RESULTS_QUERY_KEY = 'results';
export const LEADERBOARD_QUERY_KEY = 'leaderboard';

// Hook per ottenere tutti i risultati
export const useResults = (filters?: {
  competitionId?: string;
  athleteId?: string;
  categoryId?: string;
}) => {
  return useQuery({
    queryKey: [RESULTS_QUERY_KEY, filters],
    queryFn: () => resultsService.getResults(filters),
    enabled: !!(filters?.competitionId || filters?.athleteId || filters?.categoryId),
  });
};

// Hook per ottenere un singolo risultato
export const useResult = (id: string) => {
  return useQuery({
    queryKey: [RESULTS_QUERY_KEY, id],
    queryFn: () => resultsService.getResult(id),
    enabled: !!id,
  });
};

// Hook per ottenere risultati con informazioni atleti
export const useResultsWithAthletes = (competitionId: string) => {
  return useQuery({
    queryKey: [RESULTS_QUERY_KEY, 'with-athletes', competitionId],
    queryFn: () => resultsService.getResultsWithAthletes(competitionId),
    enabled: !!competitionId,
  });
};

// Hook per ottenere la classifica
export const useLeaderboard = (competitionId: string) => {
  return useQuery({
    queryKey: [LEADERBOARD_QUERY_KEY, competitionId],
    queryFn: () => resultsService.getLeaderboard(competitionId),
    enabled: !!competitionId,
    staleTime: 1000 * 60 * 2, // 2 minuti
  });
};

// Hook per statistiche risultati
export const useResultsStats = (competitionId: string) => {
  return useQuery({
    queryKey: [RESULTS_QUERY_KEY, 'stats', competitionId],
    queryFn: () => resultsService.getResultsStats(competitionId),
    enabled: !!competitionId,
    staleTime: 1000 * 60 * 5, // 5 minuti
  });
};

// Hook per creare un risultato
export const useCreateResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (resultData: Omit<Result, 'id' | 'createdAt' | 'updatedAt'>) =>
      resultsService.createResult(resultData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RESULTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [LEADERBOARD_QUERY_KEY, variables.competitionId] });
    },
  });
};

// Hook per aggiornare un risultato
export const useUpdateResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Result, 'id' | 'createdAt'>> }) =>
      resultsService.updateResult(id, data),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: [RESULTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [RESULTS_QUERY_KEY, id] });
      if (data.competitionId) {
        queryClient.invalidateQueries({ queryKey: [LEADERBOARD_QUERY_KEY, data.competitionId] });
      }
    },
  });
};

// Hook per eliminare un risultato
export const useDeleteResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => resultsService.deleteResult(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESULTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [LEADERBOARD_QUERY_KEY] });
    },
  });
};

// Hook per aggiungere un tentativo
export const useAddLift = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ resultId, lift }: { resultId: string; lift: Lift }) =>
      resultsService.addLift(resultId, lift),
    onSuccess: (_, { resultId }) => {
      queryClient.invalidateQueries({ queryKey: [RESULTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [RESULTS_QUERY_KEY, resultId] });
      queryClient.invalidateQueries({ queryKey: [LEADERBOARD_QUERY_KEY] });
    },
  });
};

// Hook per aggiornare un tentativo
export const useUpdateLift = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ resultId, liftIndex, lift }: { 
      resultId: string; 
      liftIndex: number; 
      lift: Partial<Lift> 
    }) => resultsService.updateLift(resultId, liftIndex, lift),
    onSuccess: (_, { resultId }) => {
      queryClient.invalidateQueries({ queryKey: [RESULTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [RESULTS_QUERY_KEY, resultId] });
      queryClient.invalidateQueries({ queryKey: [LEADERBOARD_QUERY_KEY] });
    },
  });
};

// Hook per ricalcolare i ranking
export const useRecalculateRankings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (competitionId: string) => resultsService.recalculateRankings(competitionId),
    onSuccess: (_, competitionId) => {
      queryClient.invalidateQueries({ queryKey: [RESULTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [LEADERBOARD_QUERY_KEY, competitionId] });
    },
  });
};