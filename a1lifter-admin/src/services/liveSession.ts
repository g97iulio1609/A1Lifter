import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { 
  LiveCompetitionSession, 
  JudgeVote,
  QueueItem,
  CustomDiscipline,
  RegistrationWithDetails
} from '@/types';

const LIVE_SESSIONS_COLLECTION = 'liveSessions';
const LIVE_QUEUE_COLLECTION = 'liveQueue';

export const liveSessionService = {
  // Crea nuova sessione live
  async createLiveSession(
    competitionId: string, 
    setupId: string,
    disciplines: CustomDiscipline[],
    registrations: RegistrationWithDetails[]
  ): Promise<string> {
    const batch = writeBatch(db);
    
    // Crea sessione principale
    const sessionRef = doc(collection(db, LIVE_SESSIONS_COLLECTION));
    const sessionData: Omit<LiveCompetitionSession, 'id'> = {
      competitionId,
      setupId,
      currentState: 'setup',
      nextUp: [],
      judgeAssignments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    batch.set(sessionRef, {
      ...sessionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Genera coda iniziale atleti
    const initialQueue = this.generateInitialQueue(disciplines, registrations);
    
    // Salva coda
    for (const [index, queueItem] of initialQueue.entries()) {
      const queueRef = doc(collection(db, LIVE_QUEUE_COLLECTION));
      batch.set(queueRef, {
        ...queueItem,
        sessionId: sessionRef.id,
        order: index,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return sessionRef.id;
  },

  // Ottieni sessione live corrente
  async getLiveSession(sessionId: string): Promise<LiveCompetitionSession | null> {
    const sessionDoc = await getDoc(doc(db, LIVE_SESSIONS_COLLECTION, sessionId));
    
    if (!sessionDoc.exists()) return null;
    
    const sessionData = sessionDoc.data();
    return {
      id: sessionDoc.id,
      ...sessionData,
      createdAt: sessionData.createdAt?.toDate() || new Date(),
      updatedAt: sessionData.updatedAt?.toDate() || new Date(),
    } as LiveCompetitionSession;
  },

  // Ascolta cambiamenti sessione live (real-time)
  subscribeToLiveSession(
    sessionId: string, 
    callback: (session: LiveCompetitionSession | null) => void
  ): () => void {
    const sessionRef = doc(db, LIVE_SESSIONS_COLLECTION, sessionId);
    
    return onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const sessionData = doc.data();
        callback({
          id: doc.id,
          ...sessionData,
          createdAt: sessionData.createdAt?.toDate() || new Date(),
          updatedAt: sessionData.updatedAt?.toDate() || new Date(),
        } as LiveCompetitionSession);
      } else {
        callback(null);
      }
    });
  },

  // Aggiorna stato sessione
  async updateSessionState(
    sessionId: string, 
    updates: Partial<LiveCompetitionSession>
  ): Promise<void> {
    const sessionRef = doc(db, LIVE_SESSIONS_COLLECTION, sessionId);
    await updateDoc(sessionRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  // Invia voto giudice con backup (deprecato - usa attemptResultsService.submitJudgeVote)
  async submitJudgeVote(
    sessionId: string,
    liftId: string,
    judgeVote: Omit<JudgeVote, 'timestamp'>
  ): Promise<void> {
    // Backup localStorage immediato
    this.backupVoteToLocalStorage(sessionId, liftId, judgeVote);
    
    try {
      // Usa il nuovo servizio attempt results
      const { attemptResultsService } = await import('./attemptResults');
      await attemptResultsService.submitJudgeVote(liftId, judgeVote);
      
      // Rimuovi da localStorage dopo sync riuscito
      this.removeVoteFromLocalStorage(sessionId, liftId, judgeVote.judgeId);
      
    } catch (error) {
      console.error('Error submitting vote to Firebase:', error);
      // Il voto rimane in localStorage per retry
      throw error;
    }
  },

  // Ottieni coda atleti corrente
  async getLiveQueue(sessionId: string): Promise<QueueItem[]> {
    const queueQuery = query(
      collection(db, LIVE_QUEUE_COLLECTION),
      where('sessionId', '==', sessionId),
      orderBy('order')
    );
    
    const queueSnapshot = await getDocs(queueQuery);
    return queueSnapshot.docs.map(doc => ({
      ...doc.data(),
    })) as QueueItem[];
  },

  // Ascolta coda in tempo reale
  subscribeToLiveQueue(
    sessionId: string,
    callback: (queue: QueueItem[]) => void
  ): () => void {
    const queueQuery = query(
      collection(db, LIVE_QUEUE_COLLECTION),
      where('sessionId', '==', sessionId),
      orderBy('order')
    );
    
    return onSnapshot(queueQuery, (snapshot) => {
      const queue = snapshot.docs.map(doc => ({
        ...doc.data(),
      })) as QueueItem[];
      callback(queue);
    });
  },

  // Passa al prossimo atleta
  async nextAthlete(sessionId: string): Promise<void> {
    const queue = await this.getLiveQueue(sessionId);
    
    if (queue.length === 0) {
      // Competizione finita
      await this.updateSessionState(sessionId, {
        currentState: 'completed',
        currentAthleteId: undefined,
        currentDiscipline: undefined,
        currentAttempt: undefined,
      });
      return;
    }
    
    const nextAthlete = queue[0];
    
    // Aggiorna sessione con atleta corrente
    await this.updateSessionState(sessionId, {
      currentAthleteId: nextAthlete.athleteId,
      currentDiscipline: nextAthlete.disciplineId,
      currentAttempt: nextAthlete.attemptNumber,
      currentState: 'active',
    });
  },

  // Genera coda iniziale
  generateInitialQueue(
    disciplines: CustomDiscipline[], 
    registrations: RegistrationWithDetails[]
  ): QueueItem[] {
    const queue: QueueItem[] = [];
    
    for (const discipline of disciplines) {
      for (let attempt = 1; attempt <= discipline.maxAttempts; attempt++) {
        for (const registration of registrations) {
          queue.push({
            athleteId: registration.athleteId,
            disciplineId: discipline.id,
            attemptNumber: attempt as 1 | 2 | 3,
            order: queue.length,
          });
        }
      }
    }
    
    return queue;
  },

  // Backup localStorage per voti
  backupVoteToLocalStorage(
    sessionId: string, 
    liftId: string, 
    vote: Omit<JudgeVote, 'timestamp'>
  ): void {
    const key = `liveSession_${sessionId}_votes`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    
    if (!existing[liftId]) {
      existing[liftId] = [];
    }
    
    existing[liftId].push({
      ...vote,
      timestamp: new Date().toISOString(),
      synced: false,
    });
    
    localStorage.setItem(key, JSON.stringify(existing));
  },

  // Rimuovi voto da localStorage dopo sync
  removeVoteFromLocalStorage(
    sessionId: string, 
    liftId: string, 
    judgeId: string
  ): void {
    const key = `liveSession_${sessionId}_votes`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    
    if (existing[liftId]) {
      existing[liftId] = existing[liftId].filter((v: { judgeId: string }) => v.judgeId !== judgeId);
      if (existing[liftId].length === 0) {
        delete existing[liftId];
      }
    }
    
    localStorage.setItem(key, JSON.stringify(existing));
  },

  // Sincronizza voti pendenti da localStorage
  async syncPendingVotes(sessionId: string): Promise<void> {
    const key = `liveSession_${sessionId}_votes`;
    const pendingVotes = JSON.parse(localStorage.getItem(key) || '{}');
    
    for (const [liftId, votes] of Object.entries(pendingVotes)) {
      for (const vote of votes as Array<{ id?: string; judgeId: string; position: string; vote: string; synced?: boolean; competitionId?: string; athleteId?: string; discipline?: string; attemptNumber?: number }>) {
        if (!vote.synced) {
          try {
            await this.submitJudgeVote(sessionId, liftId, {
              id: vote.id || '',
              judgeId: vote.judgeId,
              position: vote.position as unknown as 1 | 2 | 3,
              vote: vote.vote as 'valid' | 'invalid',
              decision: vote.vote as 'valid' | 'invalid',
              competitionId: vote.competitionId || '',
              athleteId: vote.athleteId || '',
              discipline: vote.discipline || '',
              attemptNumber: vote.attemptNumber || 1
            });
          } catch (error) {
            console.error('Error syncing pending vote:', error);
          }
        }
      }
    }
  },

  // Ottieni voti pendenti per debug
  getPendingVotes(sessionId: string): Record<string, unknown> {
    const key = `liveSession_${sessionId}_votes`;
    return JSON.parse(localStorage.getItem(key) || '{}');
  },

  // Pulisci voti vecchi da localStorage
  cleanupOldVotes(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('liveSession_'));
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        let hasRecentVotes = false;
        
        for (const votes of Object.values(data)) {
          for (const vote of votes as Array<{ timestamp: string }>) {
            if (new Date(vote.timestamp) > oneWeekAgo) {
              hasRecentVotes = true;
              break;
            }
          }
          if (hasRecentVotes) break;
        }
        
        if (!hasRecentVotes) {
          localStorage.removeItem(key);
        }
      } catch {
        // Rimuovi chiave corrotta
        localStorage.removeItem(key);
      }
    }
  }
};