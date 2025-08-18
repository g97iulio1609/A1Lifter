import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { UpdateData, DocumentData } from 'firebase/firestore';
import type { AttemptResult, JudgeVote } from '@/types';

const ATTEMPT_RESULTS_COLLECTION = 'attemptResults';
const LIVE_SESSIONS_COLLECTION = 'liveSessions';

export const attemptResultsService = {
  // Crea nuovo tentativo
  async createAttempt(
    sessionId: string,
    athleteId: string,
    disciplineId: string,
    attemptNumber: number,
    requestedWeight: number,
    competitionId: string = '',
    athleteName: string = '',
    discipline: string = '',
    sport: 'powerlifting' | 'strongman' | 'weightlifting' | 'streetlifting' = 'powerlifting',
    category: string = '',
    weightCategory: string = ''
  ): Promise<string> {
    const attemptData: Omit<AttemptResult, 'id'> = {
      sessionId,
      athleteId,
      disciplineId,
      attemptNumber: attemptNumber as 1 | 2 | 3,
      requestedWeight,
      actualWeight: requestedWeight,
      weight: requestedWeight,
      judgeVotes: [],
      isValid: false,
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      competitionId,
      athleteName,
      discipline,
      sport,
      category,
      weightCategory,
    };

    const docRef = await addDoc(collection(db, ATTEMPT_RESULTS_COLLECTION), {
      ...attemptData,
      startedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  // Ottieni tentativo specifico
  async getAttempt(attemptId: string): Promise<AttemptResult | null> {
    const attemptDoc = await getDoc(doc(db, ATTEMPT_RESULTS_COLLECTION, attemptId));
    
    if (!attemptDoc.exists()) return null;
    
    const data = attemptDoc.data();
    return {
      id: attemptDoc.id,
      sessionId: data.sessionId,
      athleteId: data.athleteId,
      disciplineId: data.disciplineId,
      attemptNumber: data.attemptNumber,
      requestedWeight: data.requestedWeight,
      actualWeight: data.actualWeight,
      judgeVotes: data.judgeVotes || [],
      isValid: data.isValid || false,
      startedAt: data.startedAt?.toDate() || new Date(),
      completedAt: data.completedAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      recordBroken: data.recordBroken,
    } as AttemptResult;
  },

  // Ascolta tentativo in tempo reale
  subscribeToAttempt(
    attemptId: string,
    callback: (attempt: AttemptResult | null) => void
  ): () => void {
    const attemptRef = doc(db, ATTEMPT_RESULTS_COLLECTION, attemptId);
    
    return onSnapshot(attemptRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          id: doc.id,
          sessionId: data.sessionId,
          athleteId: data.athleteId,
          disciplineId: data.disciplineId,
          attemptNumber: data.attemptNumber,
          requestedWeight: data.requestedWeight,
          actualWeight: data.actualWeight,
          judgeVotes: data.judgeVotes || [],
          isValid: data.isValid || false,
          startedAt: data.startedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          recordBroken: data.recordBroken,
        } as AttemptResult);
      } else {
        callback(null);
      }
    });
  },

  // Aggiunge voto giudice e calcola validità
  async submitJudgeVote(
    attemptId: string,
    judgeVote: Omit<JudgeVote, 'timestamp'>
  ): Promise<boolean> {
    const attemptRef = doc(db, ATTEMPT_RESULTS_COLLECTION, attemptId);
    const attemptDoc = await getDoc(attemptRef);
    
    if (!attemptDoc.exists()) {
      throw new Error('Tentativo non trovato');
    }
    
    const attemptData = attemptDoc.data() as AttemptResult;
    const updatedVotes = [...attemptData.judgeVotes];
    
    // Trova o aggiorna voto esistente
    const existingVoteIndex = updatedVotes.findIndex(v => v.judgeId === judgeVote.judgeId);
    
    const newVote: JudgeVote = {
      ...judgeVote,
      timestamp: new Date(),
    };
    
    if (existingVoteIndex >= 0) {
      // Aggiorna voto esistente (correzione)
      updatedVotes[existingVoteIndex] = {
        ...newVote,
        corrected: true,
        originalVote: updatedVotes[existingVoteIndex].vote,
      };
    } else {
      // Nuovo voto
      updatedVotes.push(newVote);
    }
    
    // Calcola validità con regola 2/3
    const validVotes = updatedVotes.filter(v => v.vote === 'valid').length;
    const invalidVotes = updatedVotes.filter(v => v.vote === 'invalid').length;
    const totalVotes = updatedVotes.length;
    
    // Tentativo valido se almeno 2 giudici su 3 dicono valida
    const isValid = validVotes >= 2;
    const isCompleted = totalVotes >= 3 || validVotes >= 2 || invalidVotes >= 2;
    
    // Aggiorna risultato
  const updateData: Record<string, unknown> = {
      judgeVotes: updatedVotes,
      isValid,
      updatedAt: serverTimestamp(),
    };
    
    if (isCompleted && !attemptData.completedAt) {
      updateData.completedAt = serverTimestamp();
    }
    
  await updateDoc(attemptRef, updateData as UpdateData<DocumentData>);
    
    return isCompleted;
  },

  // Ottieni tutti i tentativi di una sessione
  async getSessionAttempts(sessionId: string): Promise<AttemptResult[]> {
    const attemptsQuery = query(
      collection(db, ATTEMPT_RESULTS_COLLECTION),
      where('sessionId', '==', sessionId),
      orderBy('startedAt', 'asc')
    );
    
    const snapshot = await getDocs(attemptsQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        sessionId: data.sessionId,
        athleteId: data.athleteId,
        disciplineId: data.disciplineId,
        attemptNumber: data.attemptNumber,
        requestedWeight: data.requestedWeight,
        actualWeight: data.actualWeight,
        judgeVotes: data.judgeVotes || [],
        isValid: data.isValid || false,
        startedAt: data.startedAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        recordBroken: data.recordBroken,
      } as AttemptResult;
    });
  },

  // Ottieni tentativi di un atleta specifico
  async getAthleteAttempts(
    sessionId: string, 
    athleteId: string, 
    disciplineId?: string
  ): Promise<AttemptResult[]> {
    const constraints: Array<QueryConstraint> = [
      where('sessionId', '==', sessionId),
      where('athleteId', '==', athleteId),
    ];
    
    if (disciplineId) {
      constraints.push(where('disciplineId', '==', disciplineId));
    }
    
    constraints.push(orderBy('attemptNumber', 'asc'));
    
    const attemptsQuery = query(
      collection(db, ATTEMPT_RESULTS_COLLECTION),
      ...constraints
    );
    
    const snapshot = await getDocs(attemptsQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        sessionId: data.sessionId,
        athleteId: data.athleteId,
        disciplineId: data.disciplineId,
        attemptNumber: data.attemptNumber,
        requestedWeight: data.requestedWeight,
        actualWeight: data.actualWeight,
        judgeVotes: data.judgeVotes || [],
        isValid: data.isValid || false,
        startedAt: data.startedAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        recordBroken: data.recordBroken,
      } as AttemptResult;
    });
  },

  // Calcola statistiche tentativo
  getAttemptStats(attempt: AttemptResult): {
    validVotes: number;
    invalidVotes: number;
    pendingVotes: number;
    isCompleted: boolean;
    result: 'valid' | 'invalid' | 'pending';
  } {
    const validVotes = attempt.judgeVotes.filter(v => v.vote === 'valid').length;
    const invalidVotes = attempt.judgeVotes.filter(v => v.vote === 'invalid').length;
    const totalVotes = attempt.judgeVotes.length;
    const pendingVotes = 3 - totalVotes;
    
    const isCompleted = totalVotes >= 3 || validVotes >= 2 || invalidVotes >= 2;
    
    let result: 'valid' | 'invalid' | 'pending' = 'pending';
    if (isCompleted) {
      result = validVotes >= 2 ? 'valid' : 'invalid';
    }
    
    return {
      validVotes,
      invalidVotes,
      pendingVotes,
      isCompleted,
      result,
    };
  },

  // Passa al prossimo tentativo
  async completeCurrentAttempt(sessionId: string): Promise<void> {
    // Questa funzione sarà chiamata quando un tentativo è completato
    // per passare automaticamente al prossimo nella coda
    
    // Ottieni sessione corrente
    const sessionRef = doc(db, LIVE_SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error('Sessione non trovata');
    }
    
    // Aggiorna stato per passare al prossimo
    await updateDoc(sessionRef, {
      lastCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  // Elimina tentativo (solo se non completato)
  async deleteAttempt(attemptId: string): Promise<void> {
    const attemptRef = doc(db, ATTEMPT_RESULTS_COLLECTION, attemptId);
    const attemptDoc = await getDoc(attemptRef);
    
    if (!attemptDoc.exists()) {
      throw new Error('Tentativo non trovato');
    }
    
    const attemptData = attemptDoc.data() as AttemptResult;
    if (attemptData.completedAt) {
      throw new Error('Cannot delete completed attempt');
    }
    
    await deleteDoc(attemptRef);
  },

  // Aggiorna peso effettivo del tentativo
  async updateAttemptWeight(attemptId: string, actualWeight: number): Promise<void> {
    const attemptRef = doc(db, ATTEMPT_RESULTS_COLLECTION, attemptId);
    
    await updateDoc(attemptRef, {
      actualWeight,
      updatedAt: serverTimestamp(),
    });
  },

  // Ottieni statistiche complete sessione
  async getSessionStats(sessionId: string): Promise<{
    totalAttempts: number;
    completedAttempts: number;
    validAttempts: number;
    invalidAttempts: number;
    pendingAttempts: number;
  }> {
    const attempts = await this.getSessionAttempts(sessionId);
    
    let completedAttempts = 0;
    let validAttempts = 0;
    let invalidAttempts = 0;
    
    attempts.forEach(attempt => {
      const stats = this.getAttemptStats(attempt);
      if (stats.isCompleted) {
        completedAttempts++;
        if (stats.result === 'valid') {
          validAttempts++;
        } else {
          invalidAttempts++;
        }
      }
    });
    
    return {
      totalAttempts: attempts.length,
      completedAttempts,
      validAttempts,
      invalidAttempts,
      pendingAttempts: attempts.length - completedAttempts,
    };
  }
};