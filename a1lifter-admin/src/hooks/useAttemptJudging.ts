import { useState, useCallback } from 'react';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Define JudgeDecision type inline
interface JudgeDecision {
  id: string;
  judgeId: string;
  attemptId: string;
  decision: 'good' | 'no_lift';
  timestamp: number;
  reason?: string;
}

interface SubmitDecisionParams {
  attemptId: string;
  judgeId: string;
  decision: 'good' | 'no_lift';
  timestamp: number;
  reason?: string;
}

interface UseAttemptJudgingReturn {
  submitDecision: (params: SubmitDecisionParams) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  lastSubmittedDecision: JudgeDecision | null;
}

export const useAttemptJudging = (): UseAttemptJudgingReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedDecision, setLastSubmittedDecision] = useState<JudgeDecision | null>(null);

  const syncOfflineDecisions = useCallback(async () => {
    const offlineDecisions = JSON.parse(
      localStorage.getItem('offline_judge_decisions') || '[]'
    );

    if (offlineDecisions.length === 0) return;

    console.log(`Sincronizzazione di ${offlineDecisions.length} decisioni offline...`);

    const syncPromises = offlineDecisions.map(async (decision: JudgeDecision) => {
      try {
        const attemptRef = doc(db, 'attempts', decision.attemptId);
        await updateDoc(attemptRef, {
          judgeDecisions: arrayUnion(decision),
          updatedAt: serverTimestamp()
        });

        const judgeDecisionRef = doc(db, 'judgeDecisions', decision.id);
        await updateDoc(judgeDecisionRef, {
          ...decision,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        return decision.id;
      } catch (err) {
        console.error(`Errore nella sincronizzazione della decisione ${decision.id}:`, err);
        throw err;
      }
    });

    try {
      await Promise.all(syncPromises);
      
      // Clear offline storage after successful sync
      localStorage.removeItem('offline_judge_decisions');
      console.log('Sincronizzazione completata con successo');
    } catch (err) {
      console.error('Errore durante la sincronizzazione:', err);
      setError('Errore durante la sincronizzazione delle decisioni offline');
    }
  }, []);

  const submitDecision = useCallback(async (params: SubmitDecisionParams) => {
    const { attemptId, judgeId, decision, timestamp, reason } = params;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Create judge decision object
      const judgeDecision: JudgeDecision = {
        id: `${attemptId}_${judgeId}_${Date.now()}`,
        judgeId,
        attemptId,
        decision,
        timestamp,
        reason: reason || undefined
      };

      // Check if we're online or offline
      if (navigator.onLine) {
        // Online: Submit directly to Firestore
        const attemptRef = doc(db, 'attempts', attemptId);
        
        await updateDoc(attemptRef, {
          judgeDecisions: arrayUnion(judgeDecision),
          updatedAt: serverTimestamp()
        });

        // Also store in judge decisions collection for audit trail
        const judgeDecisionRef = doc(db, 'judgeDecisions', judgeDecision.id);
        await updateDoc(judgeDecisionRef, {
          ...judgeDecision,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Offline: Store in local storage for later sync
        const offlineDecisions = JSON.parse(
          localStorage.getItem('offline_judge_decisions') || '[]'
        );
        
        offlineDecisions.push(judgeDecision);
        localStorage.setItem('offline_judge_decisions', JSON.stringify(offlineDecisions));
        
        // Trigger sync when connection is restored
        window.addEventListener('online', () => {
          syncOfflineDecisions();
        }, { once: true });
      }

      setLastSubmittedDecision(judgeDecision);
      
      // Log successful submission
      console.log(`Decisione giudice inviata:`, {
        attemptId,
        decision: decision === 'good' ? 'VALIDA' : 'NON VALIDA',
        timestamp: timestamp
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(`Errore nell'invio della decisione: ${errorMessage}`);
      console.error('Errore nell\'invio della decisione:', err);
      
      // Store in offline queue even if online submission failed
      const offlineDecisions = JSON.parse(
        localStorage.getItem('offline_judge_decisions') || '[]'
      );
      
      const judgeDecision: JudgeDecision = {
        id: `${attemptId}_${judgeId}_${Date.now()}`,
        judgeId,
        attemptId,
        decision,
        timestamp,
        reason: reason || undefined
      };
      
      offlineDecisions.push(judgeDecision);
      localStorage.setItem('offline_judge_decisions', JSON.stringify(offlineDecisions));
    } finally {
      setIsSubmitting(false);
    }
  }, [syncOfflineDecisions]);

  return {
    submitDecision,
    isSubmitting,
    error,
    lastSubmittedDecision
  };
};