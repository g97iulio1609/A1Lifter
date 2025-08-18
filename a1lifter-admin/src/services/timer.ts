import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { CompetitionTimer } from '@/types';

export class TimerService {
  private collection = collection(db, 'timers');
  private listeners: Map<string, Unsubscribe> = new Map();

  // Crea un nuovo timer
  async createTimer(timerData: Omit<CompetitionTimer, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(this.collection, {
        ...timerData,
        startTime: timerData.startTime || null,
        endTime: timerData.endTime || null
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating timer:', error);
      throw new Error('Errore durante la creazione del timer');
    }
  }

  // Ottieni timer per sessione
  async getTimerBySession(sessionId: string): Promise<CompetitionTimer | null> {
    try {
      const q = query(
        this.collection,
        where('sessionId', '==', sessionId),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as CompetitionTimer;
    } catch (error) {
      console.error('Error fetching timer:', error);
      throw new Error('Errore durante il recupero del timer');
    }
  }

  // Avvia timer
  async startTimer(timerId: string): Promise<void> {
    try {
      const docRef = doc(this.collection, timerId);
      const now = new Date();
      
      await updateDoc(docRef, {
        startTime: now,
        isActive: true,
        isPaused: false
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      throw new Error('Errore durante l\'avvio del timer');
    }
  }

  // Pausa timer
  async pauseTimer(timerId: string): Promise<void> {
    try {
      const docRef = doc(this.collection, timerId);
      const timerDoc = await getDoc(docRef);
      
      if (!timerDoc.exists()) {
        throw new Error('Timer non trovato');
      }

      const timer = timerDoc.data() as CompetitionTimer;
      const now = new Date();
      const elapsed = timer.startTime && timer.startTime instanceof Date ? (now.getTime() - timer.startTime.getTime()) / 1000 : 0;
      const remaining = Math.max(0, timer.duration - elapsed);

      await updateDoc(docRef, {
        isPaused: true,
        remainingTime: remaining
      });
    } catch (error) {
      console.error('Error pausing timer:', error);
      throw new Error('Errore durante la pausa del timer');
    }
  }

  // Riprendi timer
  async resumeTimer(timerId: string): Promise<void> {
    try {
      const docRef = doc(this.collection, timerId);
      const timerDoc = await getDoc(docRef);
      
      if (!timerDoc.exists()) {
        throw new Error('Timer non trovato');
      }

      const timer = timerDoc.data() as CompetitionTimer;
      const now = new Date();
      
      // Calcola nuovo startTime basato sul tempo rimanente
      const newStartTime = new Date(now.getTime() - (timer.duration - timer.remainingTime) * 1000);

      await updateDoc(docRef, {
        startTime: newStartTime,
        isPaused: false
      });
    } catch (error) {
      console.error('Error resuming timer:', error);
      throw new Error('Errore durante la ripresa del timer');
    }
  }

  // Ferma timer
  async stopTimer(timerId: string): Promise<void> {
    try {
      const docRef = doc(this.collection, timerId);
      const now = new Date();
      
      await updateDoc(docRef, {
        endTime: now,
        isActive: false,
        isPaused: false,
        remainingTime: 0
      });
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw new Error('Errore durante l\'arresto del timer');
    }
  }

  // Reset timer
  async resetTimer(timerId: string): Promise<void> {
    try {
      const docRef = doc(this.collection, timerId);
      const timerDoc = await getDoc(docRef);
      
      if (!timerDoc.exists()) {
        throw new Error('Timer non trovato');
      }

      const timer = timerDoc.data() as CompetitionTimer;
      
      await updateDoc(docRef, {
        startTime: null,
        endTime: null,
        isActive: false,
        isPaused: false,
        remainingTime: timer.duration
      });
    } catch (error) {
      console.error('Error resetting timer:', error);
      throw new Error('Errore durante il reset del timer');
    }
  }

  // Aggiorna durata timer
  async updateTimerDuration(timerId: string, newDuration: number): Promise<void> {
    try {
      const docRef = doc(this.collection, timerId);
      
      await updateDoc(docRef, {
        duration: newDuration,
        remainingTime: newDuration
      });
    } catch (error) {
      console.error('Error updating timer duration:', error);
      throw new Error('Errore durante l\'aggiornamento della durata del timer');
    }
  }

  // Calcola tempo rimanente
  calculateRemainingTime(timer: CompetitionTimer): number {
    if (!timer.isActive || !timer.startTime) {
      return timer.remainingTime || timer.duration;
    }

    if (timer.isPaused) {
      return timer.remainingTime;
    }

    const now = new Date();
    const elapsed = timer.startTime instanceof Date ? (now.getTime() - timer.startTime.getTime()) / 1000 : 0;
    return Math.max(0, timer.duration - elapsed);
  }

  // Verifica se timer è scaduto
  isTimerExpired(timer: CompetitionTimer): boolean {
    return this.calculateRemainingTime(timer) <= 0;
  }

  // Ascolta aggiornamenti timer in tempo reale
  subscribeToTimer(
    sessionId: string, 
    callback: (timer: CompetitionTimer | null) => void
  ): Unsubscribe {
    const q = query(
      this.collection,
      where('sessionId', '==', sessionId),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }

      const doc = snapshot.docs[0];
      const timer = {
        id: doc.id,
        ...doc.data()
      } as CompetitionTimer;

      callback(timer);
    }, (error) => {
      console.error('Error in timer subscription:', error);
      callback(null);
    });

    this.listeners.set(sessionId, unsubscribe);
    return unsubscribe;
  }

  // Rimuovi listener
  unsubscribeFromTimer(sessionId: string): void {
    const unsubscribe = this.listeners.get(sessionId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(sessionId);
    }
  }

  // Crea timer per tentativo (60 secondi standard)
  async createAttemptTimer(sessionId: string): Promise<string> {
    return this.createTimer({
      sessionId,
      type: 'attempt',
      duration: 60, // 60 secondi per tentativo
      isActive: false,
      isPaused: false,
      remainingTime: 60
    });
  }

  // Crea timer per pausa tra discipline
  async createBreakTimer(sessionId: string, duration: number = 300): Promise<string> {
    return this.createTimer({
      sessionId,
      type: 'break',
      duration, // default 5 minuti
      isActive: false,
      isPaused: false,
      remainingTime: duration
    });
  }

  // Crea timer per cambio disciplina
  async createDisciplineChangeTimer(sessionId: string, duration: number = 600): Promise<string> {
    return this.createTimer({
      sessionId,
      type: 'discipline_change',
      duration, // default 10 minuti
      isActive: false,
      isPaused: false,
      remainingTime: duration
    });
  }

  // Elimina timer
  async deleteTimer(timerId: string): Promise<void> {
    try {
      const docRef = doc(this.collection, timerId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting timer:', error);
      throw new Error('Errore durante l\'eliminazione del timer');
    }
  }

  // Pulisci tutti i listener
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

export const timerService = new TimerService();