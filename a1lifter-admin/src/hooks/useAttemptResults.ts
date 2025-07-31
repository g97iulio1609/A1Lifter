import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { attemptResultsService } from '@/services/attemptResults';
import type { AttemptResult, JudgeVote } from '@/types';

// Hook per creare nuovo tentativo
export const useCreateAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, athleteId, disciplineId, attemptNumber, requestedWeight }: {
      sessionId: string;
      athleteId: string;
      disciplineId: string;
      attemptNumber: number;
      requestedWeight: number;
    }) => attemptResultsService.createAttempt(sessionId, athleteId, disciplineId, attemptNumber, requestedWeight),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessionAttempts', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['athleteAttempts'] });
    },
  });
};

// Hook per ottenere tentativo specifico
export const useAttempt = (attemptId: string | null, enableRealTime: boolean = true) => {
  const [liveAttempt, setLiveAttempt] = useState<AttemptResult | null>(null);

  // Query per caricamento iniziale
  const query = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => attemptId ? attemptResultsService.getAttempt(attemptId) : null,
    enabled: !!attemptId,
    staleTime: 0,
  });

  // Subscription real-time
  useEffect(() => {
    if (!attemptId || !enableRealTime) return;

    const unsubscribe = attemptResultsService.subscribeToAttempt(attemptId, (attempt) => {
      setLiveAttempt(attempt);
    });

    return unsubscribe;
  }, [attemptId, enableRealTime]);

  return {
    ...query,
    data: enableRealTime ? liveAttempt : query.data,
  };
};

// Hook per inviare voto giudice
export const useSubmitAttemptVote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attemptId, judgeVote }: {
      attemptId: string;
      judgeVote: Omit<JudgeVote, 'timestamp'>;
    }) => attemptResultsService.submitJudgeVote(attemptId, judgeVote),
    onSuccess: (isCompleted, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attempt', variables.attemptId] });
      queryClient.invalidateQueries({ queryKey: ['sessionAttempts'] });
      queryClient.invalidateQueries({ queryKey: ['athleteAttempts'] });
      
      // Se il tentativo è completato, potrebbero essere necessari altri aggiornamenti
      if (isCompleted) {
        queryClient.invalidateQueries({ queryKey: ['sessionStats'] });
      }
    },
  });
};

// Hook per ottenere tentativi di una sessione
export const useSessionAttempts = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['sessionAttempts', sessionId],
    queryFn: () => sessionId ? attemptResultsService.getSessionAttempts(sessionId) : [],
    enabled: !!sessionId,
    staleTime: 5000, // 5 secondi di cache
  });
};

// Hook per ottenere tentativi di un atleta
export const useAthleteAttempts = (
  sessionId: string | null, 
  athleteId: string | null, 
  disciplineId?: string
) => {
  return useQuery({
    queryKey: ['athleteAttempts', sessionId, athleteId, disciplineId],
    queryFn: () => sessionId && athleteId 
      ? attemptResultsService.getAthleteAttempts(sessionId, athleteId, disciplineId) 
      : [],
    enabled: !!sessionId && !!athleteId,
    staleTime: 5000,
  });
};

// Hook per aggiornare peso tentativo
export const useUpdateAttemptWeight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attemptId, actualWeight }: {
      attemptId: string;
      actualWeight: number;
    }) => attemptResultsService.updateAttemptWeight(attemptId, actualWeight),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attempt', variables.attemptId] });
      queryClient.invalidateQueries({ queryKey: ['sessionAttempts'] });
    },
  });
};

// Hook per eliminare tentativo
export const useDeleteAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: attemptResultsService.deleteAttempt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionAttempts'] });
      queryClient.invalidateQueries({ queryKey: ['athleteAttempts'] });
    },
  });
};

// Hook per completare tentativo corrente
export const useCompleteCurrentAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: attemptResultsService.completeCurrentAttempt,
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['liveSession', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessionAttempts', sessionId] });
    },
  });
};

// Hook per statistiche sessione
export const useSessionStats = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['sessionStats', sessionId],
    queryFn: () => sessionId ? attemptResultsService.getSessionStats(sessionId) : null,
    enabled: !!sessionId,
    staleTime: 10000, // 10 secondi di cache per statistiche
  });
};

// Hook combinato per gestire tentativo corrente con statistiche
export const useCurrentAttemptManager = (attemptId: string | null) => {
  const { data: attempt, isLoading } = useAttempt(attemptId, true);
  const submitVoteMutation = useSubmitAttemptVote();
  const updateWeightMutation = useUpdateAttemptWeight();

  const stats = attempt ? attemptResultsService.getAttemptStats(attempt) : null;

  const submitVote = async (judgeVote: Omit<JudgeVote, 'timestamp'>) => {
    if (!attemptId) return false;
    
    return await submitVoteMutation.mutateAsync({ attemptId, judgeVote });
  };

  const updateWeight = async (actualWeight: number) => {
    if (!attemptId) return;
    
    await updateWeightMutation.mutateAsync({ attemptId, actualWeight });
  };

  return {
    attempt,
    stats,
    isLoading,
    submitVote,
    updateWeight,
    isSubmittingVote: submitVoteMutation.isPending,
    isUpdatingWeight: updateWeightMutation.isPending,
    voteError: submitVoteMutation.error,
    weightError: updateWeightMutation.error,
  };
}; 