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
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Judge, JudgeAssignment, JudgeVote } from '@/types';

export class JudgeService {
  private judgesCollection = collection(db, 'judges');
  private assignmentsCollection = collection(db, 'judgeAssignments');
  private votesCollection = collection(db, 'judgeVotes');
  private listeners: Map<string, Unsubscribe> = new Map();

  // === GESTIONE GIUDICI ===

  // Crea nuovo giudice
  async createJudge(judgeData: Omit<Judge, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(this.judgesCollection, {
        ...judgeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating judge:', error);
      throw new Error('Errore durante la creazione del giudice');
    }
  }

  // Ottieni tutti i giudici
  async getAllJudges(): Promise<Judge[]> {
    try {
      const q = query(this.judgesCollection, orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Judge[];
    } catch (error) {
      console.error('Error fetching judges:', error);
      throw new Error('Errore durante il recupero dei giudici');
    }
  }

  // Ottieni giudici attivi
  async getActiveJudges(): Promise<Judge[]> {
    try {
      const q = query(
        this.judgesCollection, 
        where('isActive', '==', true),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Judge[];
    } catch (error) {
      console.error('Error fetching active judges:', error);
      throw new Error('Errore durante il recupero dei giudici attivi');
    }
  }

  // Ottieni giudice per ID
  async getJudgeById(judgeId: string): Promise<Judge | null> {
    try {
      const docRef = doc(this.judgesCollection, judgeId);
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data()
        } as Judge;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching judge:', error);
      throw new Error('Errore durante il recupero del giudice');
    }
  }

  // Aggiorna giudice
  async updateJudge(judgeId: string, updates: Partial<Judge>): Promise<void> {
    try {
      const docRef = doc(this.judgesCollection, judgeId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating judge:', error);
      throw new Error('Errore durante l\'aggiornamento del giudice');
    }
  }

  // Elimina giudice
  async deleteJudge(judgeId: string): Promise<void> {
    try {
      // Controlla se il giudice ha assegnazioni attive
      const activeAssignments = await this.getJudgeAssignments(judgeId, true);
      if (activeAssignments.length > 0) {
        throw new Error('Impossibile eliminare un giudice con assegnazioni attive');
      }

      const docRef = doc(this.judgesCollection, judgeId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting judge:', error);
      throw new Error('Errore durante l\'eliminazione del giudice');
    }
  }

  // Ottieni giudici per livello di certificazione
  async getJudgesByCertification(level: string): Promise<Judge[]> {
    try {
      const q = query(
        this.judgesCollection,
        where('certificationLevel', '==', level),
        where('isActive', '==', true),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Judge[];
    } catch (error) {
      console.error('Error fetching judges by certification:', error);
      throw new Error('Errore durante il recupero dei giudici per certificazione');
    }
  }

  // === GESTIONE ASSEGNAZIONI ===

  // Assegna giudice a competizione
  async assignJudgeToCompetition(
    assignmentData: Omit<JudgeAssignment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      // Verifica che il giudice non sia già assegnato alla stessa sessione
      const existingAssignment = await this.getJudgeAssignmentForSession(
        assignmentData.judgeId,
        assignmentData.competitionId,
        assignmentData.sessionId || ''
      );
      
      if (existingAssignment) {
        throw new Error('Il giudice è già assegnato a questa sessione');
      }

      const docRef = await addDoc(this.assignmentsCollection, {
        ...assignmentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error assigning judge:', error);
      throw new Error('Errore durante l\'assegnazione del giudice');
    }
  }

  // Ottieni assegnazioni giudice
  async getJudgeAssignments(
    judgeId: string, 
    activeOnly: boolean = false
  ): Promise<JudgeAssignment[]> {
    try {
      let q = query(
        this.assignmentsCollection,
        where('judgeId', '==', judgeId),
        orderBy('createdAt', 'desc')
      );

      if (activeOnly) {
        q = query(
          this.assignmentsCollection,
          where('judgeId', '==', judgeId),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JudgeAssignment[];
    } catch (error) {
      console.error('Error fetching judge assignments:', error);
      throw new Error('Errore durante il recupero delle assegnazioni del giudice');
    }
  }

  // Ottieni giudici assegnati a competizione
  async getCompetitionJudges(competitionId: string): Promise<JudgeAssignment[]> {
    try {
      const q = query(
        this.assignmentsCollection,
        where('competitionId', '==', competitionId),
        where('isActive', '==', true),
        orderBy('position')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JudgeAssignment[];
    } catch (error) {
      console.error('Error fetching competition judges:', error);
      throw new Error('Errore durante il recupero dei giudici della competizione');
    }
  }

  // Ottieni giudici per sessione
  async getSessionJudges(competitionId: string, sessionId: string): Promise<JudgeAssignment[]> {
    try {
      const q = query(
        this.assignmentsCollection,
        where('competitionId', '==', competitionId),
        where('sessionId', '==', sessionId),
        where('isActive', '==', true),
        orderBy('position')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JudgeAssignment[];
    } catch (error) {
      console.error('Error fetching session judges:', error);
      throw new Error('Errore durante il recupero dei giudici della sessione');
    }
  }

  // Verifica assegnazione esistente
  private async getJudgeAssignmentForSession(
    judgeId: string,
    competitionId: string,
    sessionId: string
  ): Promise<JudgeAssignment | null> {
    try {
      const q = query(
        this.assignmentsCollection,
        where('judgeId', '==', judgeId),
        where('competitionId', '==', competitionId),
        where('sessionId', '==', sessionId),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as JudgeAssignment;
    } catch (error) {
      console.error('Error checking judge assignment:', error);
      return null;
    }
  }

  // Rimuovi assegnazione giudice
  async removeJudgeAssignment(assignmentId: string): Promise<void> {
    try {
      const docRef = doc(this.assignmentsCollection, assignmentId);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing judge assignment:', error);
      throw new Error('Errore durante la rimozione dell\'assegnazione del giudice');
    }
  }

  // === GESTIONE VOTI ===

  // Registra voto giudice
  async recordJudgeVote(
    voteData: Omit<JudgeVote, 'id' | 'timestamp'>
  ): Promise<string> {
    try {
      // Verifica che il giudice sia assegnato alla competizione
      const assignment = await this.getJudgeAssignmentForSession(
        voteData.judgeId,
        voteData.competitionId,
        voteData.sessionId || ''
      );
      
      if (!assignment) {
        throw new Error('Il giudice non è assegnato a questa sessione');
      }

      const docRef = await addDoc(this.votesCollection, {
        ...voteData,
        timestamp: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error recording judge vote:', error);
      throw new Error('Errore durante la registrazione del voto del giudice');
    }
  }

  // Ottieni voti per tentativo
  async getVotesForAttempt(
    competitionId: string,
    athleteId: string,
    discipline: string,
    attemptNumber: number
  ): Promise<JudgeVote[]> {
    try {
      const q = query(
        this.votesCollection,
        where('competitionId', '==', competitionId),
        where('athleteId', '==', athleteId),
        where('discipline', '==', discipline),
        where('attemptNumber', '==', attemptNumber),
        orderBy('timestamp')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JudgeVote[];
    } catch (error) {
      console.error('Error fetching votes for attempt:', error);
      throw new Error('Errore durante il recupero dei voti per il tentativo');
    }
  }

  // Calcola risultato tentativo basato sui voti
  async calculateAttemptResult(
    competitionId: string,
    athleteId: string,
    discipline: string,
    attemptNumber: number
  ): Promise<{
    isValid: boolean;
    votes: JudgeVote[];
    validVotes: number;
    invalidVotes: number;
    isMajority: boolean;
  }> {
    try {
      const votes = await this.getVotesForAttempt(
        competitionId,
        athleteId,
        discipline,
        attemptNumber
      );
      
      const validVotes = votes.filter(vote => vote.decision === 'valid').length;
      const invalidVotes = votes.filter(vote => vote.decision === 'invalid').length;
      const totalVotes = votes.length;
      
      // Maggioranza semplice
      const isMajority = validVotes > invalidVotes;
      const isValid = isMajority && totalVotes >= 3; // Minimo 3 giudici
      
      return {
        isValid,
        votes,
        validVotes,
        invalidVotes,
        isMajority
      };
    } catch (error) {
      console.error('Error calculating attempt result:', error);
      throw new Error('Errore durante il calcolo del risultato del tentativo');
    }
  }

  // === FUNZIONI AVANZATE ===

  // Assegnazione automatica giudici
  async autoAssignJudges(
    competitionId: string,
    sessionId: string,
    requiredJudges: number = 3
  ): Promise<string[]> {
    try {
      // Ottieni giudici disponibili
      const availableJudges = await this.getAvailableJudges(competitionId);
      
      if (availableJudges.length < requiredJudges) {
        throw new Error(`Giudici disponibili insufficienti. Richiesti: ${requiredJudges}, Disponibili: ${availableJudges.length}`);
      }
      
      // Seleziona i migliori giudici basandosi su esperienza e certificazione
      const selectedJudges = this.selectBestJudges(availableJudges, requiredJudges);
      
      const assignmentIds: string[] = [];
      
      for (let i = 0; i < selectedJudges.length; i++) {
        const judge = selectedJudges[i];
        const assignmentId = await this.assignJudgeToCompetition({
          judgeId: judge.id,
          competitionId,
          sessionId,
          role: i === 0 ? 'head' : 'side',
          position: (i + 1) as 1 | 2 | 3,
          isActive: true,
          assignedAt: new Date()
        });
        
        assignmentIds.push(assignmentId);
      }
      
      return assignmentIds;
    } catch (error) {
      console.error('Error auto-assigning judges:', error);
      throw new Error('Errore durante l\'assegnazione automatica dei giudici');
    }
  }

  // Ottieni giudici disponibili
  private async getAvailableJudges(competitionId: string): Promise<Judge[]> {
    try {
      const allJudges = await this.getActiveJudges();
      const assignedJudges = await this.getCompetitionJudges(competitionId);
      const assignedJudgeIds = new Set(assignedJudges.map(a => a.judgeId));
      
      return allJudges.filter(judge => !assignedJudgeIds.has(judge.id));
    } catch (error) {
      console.error('Error getting available judges:', error);
      return [];
    }
  }

  // Seleziona i migliori giudici
  private selectBestJudges(judges: Judge[], count: number): Judge[] {
    // Ordina per livello di certificazione e esperienza
    const sortedJudges = judges.sort((a, b) => {
      const certificationOrder = ['international', 'national', 'regional', 'local'];
      const aIndex = certificationOrder.indexOf(a.certificationLevel);
      const bIndex = certificationOrder.indexOf(b.certificationLevel);
      
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      
      return (b.experienceYears || 0) - (a.experienceYears || 0);
    });
    
    return sortedJudges.slice(0, count);
  }

  // Ascolta voti in tempo reale
  subscribeToVotes(
    competitionId: string,
    callback: (votes: JudgeVote[]) => void
  ): Unsubscribe {
    const q = query(
      this.votesCollection,
      where('competitionId', '==', competitionId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const votes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JudgeVote[];
      
      callback(votes);
    }, (error) => {
      console.error('Error in votes subscription:', error);
      callback([]);
    });

    this.listeners.set(`votes_${competitionId}`, unsubscribe);
    return unsubscribe;
  }

  // Statistiche giudice
  async getJudgeStatistics(judgeId: string): Promise<{
    totalAssignments: number;
    activeAssignments: number;
    totalVotes: number;
    validVotesPercentage: number;
    competitionsJudged: number;
  }> {
    try {
      const assignments = await this.getJudgeAssignments(judgeId);
      const activeAssignments = assignments.filter(a => a.isActive);
      
      const votesQuery = query(
        this.votesCollection,
        where('judgeId', '==', judgeId)
      );
      const votesSnapshot = await getDocs(votesQuery);
      const votes = votesSnapshot.docs.map(doc => doc.data()) as JudgeVote[];
      
      const validVotes = votes.filter(vote => vote.decision === 'valid').length;
      const validVotesPercentage = votes.length > 0 ? (validVotes / votes.length) * 100 : 0;
      
      const competitionsJudged = new Set(assignments.map(a => a.competitionId)).size;
      
      return {
        totalAssignments: assignments.length,
        activeAssignments: activeAssignments.length,
        totalVotes: votes.length,
        validVotesPercentage,
        competitionsJudged
      };
    } catch (error) {
      console.error('Error getting judge statistics:', error);
      throw new Error('Errore durante il recupero delle statistiche del giudice');
    }
  }

  // Pulisci listener
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  // Ottieni permessi di default per admin
  getDefaultAdminPermissions() {
    return {
      canManageCompetitions: true,
      canManageAthletes: true,
      canManageRegistrations: true,
      canJudgeCompetitions: ['*'], // può giudicare tutte le competizioni
      canViewLiveResults: true,
      canManageUsers: true
    };
  }
}

export const judgeService = new JudgeService();