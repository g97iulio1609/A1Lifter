import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp, type DocumentData, type DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { sportPluginRegistry, type SupportedSport } from '@/domain/plugins/SportPluginRegistry';

interface TimerState {
  isRunning: boolean;
  timeRemaining: number; // in seconds
  totalTime: number; // in seconds
  timerType: 'attempt' | 'rest' | 'warmup' | 'extra';
  athleteId?: string;
  discipline?: string;
}

interface UseRealTimeTimerReturn {
  timerState: TimerState;
  startTimer: (type: TimerState['timerType'], duration: number, athleteId?: string, discipline?: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  addTime: (seconds: number) => Promise<void>;
  isConnected: boolean;
  error: string | null;
}

/**
 * Hook for real-time timer synchronization across all interfaces
 * Manages server-synced timers with local fallback for offline scenarios
 */
export const useRealTimeTimer = (eventId: string): UseRealTimeTimerReturn => {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    timeRemaining: 0,
    totalTime: 0,
    timerType: 'attempt'
  });
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(Date.now());
  const timerDocRef = doc(db, 'timers', eventId);

  // Sync timer state with server
  const syncTimerState = useCallback(async (newState: Partial<TimerState>) => {
    try {
      await updateDoc(timerDocRef, {
        ...newState,
        lastUpdated: serverTimestamp(),
        syncedAt: Date.now()
      });
      lastSyncRef.current = Date.now();
    } catch (error) {
      console.error('Failed to sync timer state:', error);
      setError('Timer sync failed');
      setIsConnected(false);
    }
  }, [timerDocRef]);

  // Start timer
  const startTimer = useCallback(async (
    type: TimerState['timerType'], 
    duration: number, 
    athleteId?: string, 
    discipline?: string
  ) => {
    const newState: TimerState = {
      isRunning: true,
      timeRemaining: duration,
      totalTime: duration,
      timerType: type,
      athleteId,
      discipline
    };
    
    setTimerState(newState);
    await syncTimerState(newState);
  }, [syncTimerState]);

  // Pause timer
  const pauseTimer = useCallback(async () => {
    const newState = { ...timerState, isRunning: false };
    setTimerState(newState);
    await syncTimerState(newState);
  }, [timerState, syncTimerState]);

  // Resume timer
  const resumeTimer = useCallback(async () => {
    const newState = { ...timerState, isRunning: true };
    setTimerState(newState);
    await syncTimerState(newState);
  }, [timerState, syncTimerState]);

  // Stop timer
  const stopTimer = useCallback(async () => {
    const newState: TimerState = {
      isRunning: false,
      timeRemaining: 0,
      totalTime: 0,
      timerType: 'attempt'
    };
    
    setTimerState(newState);
    await syncTimerState(newState);
  }, [syncTimerState]);

  // Add time to current timer
  const addTime = useCallback(async (seconds: number) => {
    const newTimeRemaining = Math.max(0, timerState.timeRemaining + seconds);
    const newTotalTime = timerState.totalTime + seconds;
    
    const newState = {
      ...timerState,
      timeRemaining: newTimeRemaining,
      totalTime: newTotalTime
    };
    
    setTimerState(newState);
    await syncTimerState(newState);
  }, [timerState, syncTimerState]);

  // Local timer countdown
  useEffect(() => {
    if (timerState.isRunning && timerState.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          const newTimeRemaining = Math.max(0, prev.timeRemaining - 1);
          
          // Auto-stop when time reaches 0
          if (newTimeRemaining === 0) {
            syncTimerState({ ...prev, isRunning: false, timeRemaining: 0 });
            return { ...prev, isRunning: false, timeRemaining: 0 };
          }
          
          return { ...prev, timeRemaining: newTimeRemaining };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState.isRunning, timerState.timeRemaining, syncTimerState]);

  // Listen to server timer updates
  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = onSnapshot(
      timerDocRef,
      (doc: DocumentSnapshot<DocumentData>) => {
        if (doc.exists()) {
          const serverData = doc.data() as DocumentData;
          const serverSyncTime = serverData.syncedAt || 0;
          
          // Only update if server data is newer than our last sync
          if (serverSyncTime > lastSyncRef.current) {
            const serverState: TimerState = {
              isRunning: serverData.isRunning || false,
              timeRemaining: serverData.timeRemaining || 0,
              totalTime: serverData.totalTime || 0,
              timerType: serverData.timerType || 'attempt',
              athleteId: serverData.athleteId,
              discipline: serverData.discipline
            };
            
            // Calculate time drift and adjust
            if (serverData.lastUpdated && serverState.isRunning) {
              const serverTime = typeof serverData.lastUpdated?.toDate === 'function'
                ? serverData.lastUpdated.toDate()
                : new Date(serverData.lastUpdated);
              const timeDrift = Math.floor((Date.now() - serverTime.getTime()) / 1000);
              serverState.timeRemaining = Math.max(0, serverState.timeRemaining - timeDrift);
            }
            
            setTimerState(serverState);
            setIsConnected(true);
            setError(null);
          }
        }
      },
  (error: unknown) => {
        console.error('Timer sync error:', error);
        setError('Timer connection lost');
        setIsConnected(false);
      }
    );

    return () => unsubscribe();
  }, [eventId, timerDocRef]);

  // Periodic sync to prevent drift
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (timerState.isRunning && isConnected) {
        syncTimerState(timerState);
      }
    }, 10000); // Sync every 10 seconds

    return () => clearInterval(syncInterval);
  }, [timerState, isConnected, syncTimerState]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      setError(null);
      // Re-sync current state when coming back online
      if (timerState.isRunning) {
        syncTimerState(timerState);
      }
    };

    const handleOffline = () => {
      setIsConnected(false);
      setError('Offline - timer running locally');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [timerState, syncTimerState]);

  return {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    addTime,
    isConnected,
    error
  };
};

/**
 * Helper hook to get sport-specific timer settings
 */
export const useTimerSettings = (sport: string) => {
  const getTimerSettings = useCallback((discipline?: string, phase: 'attempt' | 'rest' | 'warmup' = 'attempt') => {
    if (!sportPluginRegistry.isValidSport(sport)) {
      return { attemptTime: 60, restTime: 120, warmupTime: 300 };
    }
  const plugin = sportPluginRegistry.getPlugin(sport as SupportedSport);
    return plugin.getTimerSettings(discipline || '', phase);
  }, [sport]);

  return { getTimerSettings };
};