import { useState, useEffect, useCallback } from 'react';
import { doc, serverTimestamp, writeBatch, WriteBatch } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface OfflineAction {
  id: string;
  type: 'judge_decision' | 'attempt_update' | 'athlete_update' | 'event_update';
  data: Record<string, unknown>;
  timestamp: Date;
  retryCount: number;
}

interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingActions: number;
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: Date | null;
  forceSync: () => Promise<void>;
  addOfflineAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => void;
}

const OFFLINE_STORAGE_KEY = 'a1lifter_offline_actions';
const MAX_RETRY_COUNT = 3;
const SYNC_RETRY_DELAY = 5000; // 5 seconds

export const useOfflineSync = (): UseOfflineSyncReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const getOfflineActions = (): OfflineAction[] => {
    try {
      const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Errore nel caricamento delle azioni offline:', error);
      return [];
    }
  };

  const saveOfflineActions = (actions: OfflineAction[]) => {
    try {
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(actions));
      setPendingActions(actions.length);
    } catch (error) {
      console.error('Errore nel salvataggio delle azioni offline:', error);
    }
  };

  const updatePendingActionsCount = useCallback(() => {
    const actions = getOfflineActions();
    setPendingActions(actions.length);
  }, []);

  const addOfflineAction = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0
    };

    const actions = getOfflineActions();
    actions.push(newAction);
    saveOfflineActions(actions);

    console.log('Azione aggiunta alla coda offline:', newAction.type);
  }, []);

  const syncOfflineActions = useCallback(async () => {
    if (!isOnline || syncStatus === 'syncing') return;

    const actions = getOfflineActions();
    if (actions.length === 0) return;

    setSyncStatus('syncing');
    console.log(`Avvio sincronizzazione di ${actions.length} azioni...`);

    const batch = writeBatch(db);
    const successfulActions: string[] = [];
    const failedActions: OfflineAction[] = [];

    for (const action of actions) {
      try {
        await processOfflineAction(action, batch);
        successfulActions.push(action.id);
      } catch (error) {
        console.error(`Errore nella sincronizzazione dell'azione ${action.id}:`, error);
        
        // Increment retry count
        const updatedAction = {
          ...action,
          retryCount: action.retryCount + 1
        };

        // Only retry if under max retry count
        if (updatedAction.retryCount < MAX_RETRY_COUNT) {
          failedActions.push(updatedAction);
        } else {
          console.error(`Azione ${action.id} scartata dopo ${MAX_RETRY_COUNT} tentativi`);
        }
      }
    }

    try {
      // Commit successful actions
      if (successfulActions.length > 0) {
        await batch.commit();
        console.log(`${successfulActions.length} azioni sincronizzate con successo`);
      }

      // Update storage with only failed actions
      saveOfflineActions(failedActions);
      setLastSyncTime(new Date());
      setSyncStatus('idle');

      if (failedActions.length > 0) {
        console.warn(`${failedActions.length} azioni non sincronizzate, nuovo tentativo tra ${SYNC_RETRY_DELAY / 1000}s`);
        
        // Schedule retry for failed actions
        setTimeout(() => {
          if (isOnline) {
            syncOfflineActions();
          }
        }, SYNC_RETRY_DELAY);
      }
    } catch (error) {
      console.error('Errore nel commit delle azioni sincronizzate:', error);
      setSyncStatus('error');
      
      // Keep all actions for retry
      saveOfflineActions(actions);
    }
  }, [isOnline, syncStatus]);

  const processOfflineAction = async (action: OfflineAction, batch: WriteBatch) => {
    switch (action.type) {
      case 'judge_decision': {
        const { attemptId, judgeDecision } = action.data as { attemptId: string; judgeDecision: Record<string, unknown> & { id: string } };
        const attemptRef = doc(db, 'attempts', attemptId);
        
        batch.update(attemptRef, {
          judgeDecisions: judgeDecision,
          updatedAt: serverTimestamp()
        });

        const judgeDecisionRef = doc(db, 'judgeDecisions', String(judgeDecision.id));
        batch.set(judgeDecisionRef, {
          ...judgeDecision,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        break;
      }

      case 'attempt_update': {
        const { attemptId, updates } = action.data as { attemptId: string; updates: Record<string, unknown> };
        const attemptRef = doc(db, 'attempts', attemptId);
        
        batch.update(attemptRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        break;
      }

      case 'athlete_update': {
        const { athleteId, updates } = action.data as { athleteId: string; updates: Record<string, unknown> };
        const athleteRef = doc(db, 'athletes', athleteId);
        
        batch.update(athleteRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        break;
      }

      case 'event_update': {
        const { eventId, updates } = action.data as { eventId: string; updates: Record<string, unknown> };
        const eventRef = doc(db, 'events', eventId);
        
        batch.update(eventRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        break;
      }

      default:
        throw new Error(`Tipo di azione non supportato: ${action.type}`);
    }
  };

  const forceSync = useCallback(async () => {
    if (!isOnline) {
      console.warn('Impossibile forzare la sincronizzazione: offline');
      return;
    }

    await syncOfflineActions();
  }, [isOnline, syncOfflineActions]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Connessione ripristinata - avvio sincronizzazione...');
      syncOfflineActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Connessione persa - modalità offline attivata');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineActions]);

  // Load pending actions count on mount
  useEffect(() => {
    updatePendingActionsCount();
  }, [updatePendingActionsCount]);

  // Periodic sync when online
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      if (pendingActions > 0) {
        syncOfflineActions();
      }
    }, 30000); // Sync every 30 seconds if there are pending actions

    return () => clearInterval(interval);
  }, [isOnline, pendingActions, syncOfflineActions]);

  return {
    isOnline,
    pendingActions,
    syncStatus,
    lastSyncTime,
    forceSync,
    addOfflineAction
  };
};