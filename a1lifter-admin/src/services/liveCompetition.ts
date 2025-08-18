import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc,
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/config/firebase';

const LIVE_COMPETITIONS_COLLECTION = 'liveCompetitions';
const LIVE_RESULTS_COLLECTION = 'liveResults';

export interface LiveCompetitionState {
  id: string;
  competitionId: string;
  state: 'setup' | 'active' | 'paused' | 'completed';
  currentAthleteId?: string;
  currentDiscipline?: 'squat' | 'bench' | 'deadlift';
  currentAttempt?: number;
  completedAttempts: number;
  athleteWeights: {
    [athleteId: string]: {
      squat: [number, number, number];
      bench: [number, number, number];
      deadlift: [number, number, number];
    };
  };
  athleteResults: {
    [athleteId: string]: {
      squat: [AttemptResult, AttemptResult, AttemptResult];
      bench: [AttemptResult, AttemptResult, AttemptResult];
      deadlift: [AttemptResult, AttemptResult, AttemptResult];
    };
  };
  timer: number;
  isTimerRunning: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttemptResult {
  weight: number;
  status: 'pending' | 'valid' | 'invalid';
  completed: boolean;
  judgeVotes?: {
    judge1: 'valid' | 'invalid' | null;
    judge2: 'valid' | 'invalid' | null;
    judge3: 'valid' | 'invalid' | null;
  };
  completedAt?: Date;
}

export const liveCompetitionService = {
  // Crea o aggiorna stato gara live
  async saveLiveCompetitionState(state: Omit<LiveCompetitionState, 'createdAt' | 'updatedAt'>): Promise<void> {
    const docRef = doc(db, LIVE_COMPETITIONS_COLLECTION, state.competitionId);
    
    const existingDoc = await getDoc(docRef);
    
    const dataToSave = {
      ...state,
      updatedAt: serverTimestamp(),
      ...(existingDoc.exists() ? {} : { createdAt: serverTimestamp() })
    };
    
    await setDoc(docRef, dataToSave, { merge: true });
  },

  // Carica stato gara live
  async loadLiveCompetitionState(competitionId: string): Promise<LiveCompetitionState | null> {
    const docRef = doc(db, LIVE_COMPETITIONS_COLLECTION, competitionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as LiveCompetitionState;
    }
    
    return null;
  },

  // Ascolta cambiamenti stato gara in tempo reale
  subscribeToLiveCompetition(
    competitionId: string,
    callback: (state: LiveCompetitionState | null) => void
  ): () => void {
    const docRef = doc(db, LIVE_COMPETITIONS_COLLECTION, competitionId);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as LiveCompetitionState);
      } else {
        callback(null);
      }
    });
  },

  // Salva risultato singolo tentativo
  async saveAttemptResult(
    competitionId: string,
    athleteId: string,
    discipline: 'squat' | 'bench' | 'deadlift',
    attempt: number,
    result: AttemptResult
  ): Promise<void> {
    const docRef = doc(db, LIVE_RESULTS_COLLECTION, `${competitionId}_${athleteId}_${discipline}_${attempt}`);
    
    await setDoc(docRef, {
      competitionId,
      athleteId,
      discipline,
      attempt,
      ...result,
      savedAt: serverTimestamp()
    });
  },

  // Carica tutti i risultati di una competizione
  async loadCompetitionResults(competitionId: string): Promise<{
    [athleteId: string]: {
      squat: [AttemptResult, AttemptResult, AttemptResult];
      bench: [AttemptResult, AttemptResult, AttemptResult];
      deadlift: [AttemptResult, AttemptResult, AttemptResult];
    };
  }> {
    const q = query(
      collection(db, LIVE_RESULTS_COLLECTION),
      where('competitionId', '==', competitionId)
    );
    
    const querySnapshot = await getDocs(q);
    const results: {
      [athleteId: string]: {
        squat: [AttemptResult, AttemptResult, AttemptResult];
        bench: [AttemptResult, AttemptResult, AttemptResult];
        deadlift: [AttemptResult, AttemptResult, AttemptResult];
      };
    } = {};
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const { athleteId, discipline, attempt } = data as {
        athleteId: string;
        discipline: 'squat' | 'bench' | 'deadlift';
        attempt: number;
      };
      
      if (!results[athleteId]) {
        results[athleteId] = {
          squat: [
            { weight: 0, status: 'pending', completed: false },
            { weight: 0, status: 'pending', completed: false },
            { weight: 0, status: 'pending', completed: false }
          ],
          bench: [
            { weight: 0, status: 'pending', completed: false },
            { weight: 0, status: 'pending', completed: false },
            { weight: 0, status: 'pending', completed: false }
          ],
          deadlift: [
            { weight: 0, status: 'pending', completed: false },
            { weight: 0, status: 'pending', completed: false },
            { weight: 0, status: 'pending', completed: false }
          ]
        };
      }
      
      results[athleteId][discipline][attempt - 1] = {
        weight: data.weight,
        status: data.status,
        completed: data.completed,
        judgeVotes: data.judgeVotes,
        completedAt: data.completedAt?.toDate()
      };
    });
    
    return results;
  },

  // Elimina stato gara (per reset)
  async deleteLiveCompetitionState(competitionId: string): Promise<void> {
    const docRef = doc(db, LIVE_COMPETITIONS_COLLECTION, competitionId);
    await updateDoc(docRef, {
      state: 'setup',
      currentAthleteId: null,
      currentDiscipline: null,
      currentAttempt: null,
      completedAttempts: 0,
      timer: 60,
      isTimerRunning: false,
      updatedAt: serverTimestamp()
    });
  }
};