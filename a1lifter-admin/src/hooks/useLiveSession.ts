import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { liveSessionService } from '@/services/liveSession';
import type { LiveCompetitionSession, QueueItem, JudgeVote } from '@/types';

// Hook per ottenere sessione live
export const useLiveSession = (sessionId: string | null, enableRealTime: boolean = true) => {
  const [liveSession, setLiveSession] = useState<LiveCompetitionSession | null>(null);

  // Query per caricamento iniziale
  const query = useQuery({
    queryKey: ['liveSession', sessionId],
    queryFn: () => sessionId ? liveSessionService.getLiveSession(sessionId) : null,
    enabled: !!sessionId,
    staleTime: 0, // sempre fresco per dati live
  });

  // Subscription real-time
  useEffect(() => {
    if (!sessionId || !enableRealTime) return;

    const unsubscribe = liveSessionService.subscribeToLiveSession(sessionId, (session) => {
      setLiveSession(session);
    });

    return unsubscribe;
  }, [sessionId, enableRealTime]);

  return {
    ...query,
    data: enableRealTime ? liveSession : query.data,
  };
};

// Hook per la coda atleti live
export const useLiveQueue = (sessionId: string | null, enableRealTime: boolean = true) => {
  const [liveQueue, setLiveQueue] = useState<QueueItem[]>([]);

  // Query per caricamento iniziale
  const query = useQuery({
    queryKey: ['liveQueue', sessionId],
    queryFn: () => sessionId ? liveSessionService.getLiveQueue(sessionId) : [],
    enabled: !!sessionId,
    staleTime: 0,
  });

  // Subscription real-time
  useEffect(() => {
    if (!sessionId || !enableRealTime) return;

    const unsubscribe = liveSessionService.subscribeToLiveQueue(sessionId, (queue) => {
      setLiveQueue(queue);
    });

    return unsubscribe;
  }, [sessionId, enableRealTime]);

  return {
    ...query,
    data: enableRealTime ? liveQueue : query.data,
  };
};

// Hook per creare sessione live
export const useCreateLiveSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ competitionId, setupId, disciplines, registrations }: {
      competitionId: string;
      setupId: string;
      disciplines: any[];
      registrations: any[];
    }) => liveSessionService.createLiveSession(competitionId, setupId, disciplines, registrations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveSession'] });
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
    },
  });
};

// Hook per aggiornare stato sessione
export const useUpdateSessionState = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, updates }: { 
      sessionId: string; 
      updates: Partial<LiveCompetitionSession> 
    }) => liveSessionService.updateSessionState(sessionId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['liveSession', variables.sessionId] });
    },
  });
};

// Hook per voto giudice con backup automatico
export const useSubmitJudgeVote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, liftId, vote }: {
      sessionId: string;
      liftId: string;
      vote: Omit<JudgeVote, 'timestamp'>;
    }) => liveSessionService.submitJudgeVote(sessionId, liftId, vote),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['liveSession', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['attemptResults'] });
    },
  });
};

// Hook per passare al prossimo atleta
export const useNextAthlete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: liveSessionService.nextAthlete,
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['liveSession', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['liveQueue', sessionId] });
    },
  });
};

// Hook per sincronizzazione voti pendenti
export const useSyncPendingVotes = () => {
  return useMutation({
    mutationFn: liveSessionService.syncPendingVotes,
  });
};

// Hook per gestire backup e sync automatico
export const useBackupManager = (sessionId: string | null) => {
  const syncMutation = useSyncPendingVotes();
  
  // Cleanup automatico voti vecchi all'avvio
  useEffect(() => {
    liveSessionService.cleanupOldVotes();
  }, []);

  // Sync periodico dei voti pendenti
  useEffect(() => {
    if (!sessionId) return;

    const syncInterval = setInterval(() => {
      const pendingVotes = liveSessionService.getPendingVotes(sessionId);
      if (Object.keys(pendingVotes).length > 0) {
        syncMutation.mutate(sessionId);
      }
    }, 30000); // ogni 30 secondi

    return () => clearInterval(syncInterval);
  }, [sessionId, syncMutation]);

  // Sync al focus della finestra
  useEffect(() => {
    const handleFocus = () => {
      if (sessionId) {
        syncMutation.mutate(sessionId);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [sessionId, syncMutation]);

  const getPendingVotes = useCallback(() => {
    return sessionId ? liveSessionService.getPendingVotes(sessionId) : {};
  }, [sessionId]);

  const forcSync = useCallback(() => {
    if (sessionId) {
      syncMutation.mutate(sessionId);
    }
  }, [sessionId, syncMutation]);

  return {
    getPendingVotes,
    forcSync,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
  };
};

// Hook per stato connessione live
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasBeenOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    hasBeenOffline,
    shouldShowOfflineWarning: hasBeenOffline && !isOnline,
  };
}; 