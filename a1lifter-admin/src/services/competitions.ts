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
  Timestamp,
  QueryConstraint 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Competition, CompetitionWithStats, Registration } from '@/types';

const COMPETITIONS_COLLECTION = 'competitions';
const REGISTRATIONS_COLLECTION = 'registrations';

export const competitionsService = {
  // Ottieni tutte le competizioni
  async getCompetitions(filters?: {
    status?: 'draft' | 'active' | 'completed';
    type?: 'powerlifting' | 'strongman';
    upcoming?: boolean;
  }): Promise<CompetitionWithStats[]> {
    const constraints: QueryConstraint[] = [];
    // Rimuoviamo orderBy per evitare indici compositi; ordineremo lato client
    // constraints.push(orderBy('date', 'desc'));
    
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    if (filters?.type) {
      constraints.push(where('type', '==', filters.type));
    }
    let querySnapshot;
    try {
      const q = query(collection(db, COMPETITIONS_COLLECTION), ...constraints);
      querySnapshot = await getDocs(q);
    } catch (error: any) {
      if (error.code === 'failed-precondition') {
        console.warn('Composite index missing for competitions; using fallback without orderBy');
        const qFallback = query(collection(db, COMPETITIONS_COLLECTION));
        querySnapshot = await getDocs(qFallback);
      } else {
        throw error;
      }
    }
    
    let competitions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
      categories: doc.data().categories ?? [],
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Competition[];

    // Filtro per status/type se abbiamo usato fallback
    if (filters?.status) {
      competitions = competitions.filter(c => c.status === filters.status);
    }
    if (filters?.type) {
      competitions = competitions.filter(c => c.type === filters.type);
    }

    // Ordina lato client per data desc
    competitions.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Filtro per competizioni future
    if (filters?.upcoming) {
      const now = new Date();
      competitions = competitions.filter(comp => comp.date >= now);
    }

    // Aggiungi statistiche
    const competitionsWithStats = await Promise.all(
      competitions.map(async (competition) => {
        const registrationsCount = await this.getRegistrationsCount(competition.id);
        const categoriesCount = competition.categories.length;
        const daysUntilStart = Math.ceil(
          (competition.date.getTime() - new Date().getTime()) / (1000 * 3600 * 24)
        );

        return {
          ...competition,
          registrationsCount,
          categoriesCount,
          daysUntilStart,
        } as CompetitionWithStats;
      })
    );

    return competitionsWithStats;
  },

  // Ottieni una singola competizione
  async getCompetition(id: string): Promise<CompetitionWithStats | null> {
    const docRef = doc(db, COMPETITIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const competition = {
        id: docSnap.id,
        ...data,
        date: data.date?.toDate() || new Date(),
        categories: data.categories ?? [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Competition;

      // Aggiungi statistiche
      const registrationsCount = await this.getRegistrationsCount(id);
      const categoriesCount = competition.categories.length;
      const daysUntilStart = Math.ceil(
        (competition.date.getTime() - new Date().getTime()) / (1000 * 3600 * 24)
      );

      return {
        ...competition,
        registrationsCount,
        categoriesCount,
        daysUntilStart,
      } as CompetitionWithStats;
    }
    
    return null;
  },

  // Crea una nuova competizione
  async createCompetition(competitionData: Omit<Competition, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COMPETITIONS_COLLECTION), {
      ...competitionData,
      date: Timestamp.fromDate(competitionData.date),
      createdAt: now,
      updatedAt: now,
    });
    
    return docRef.id;
  },

  // Aggiorna una competizione esistente
  async updateCompetition(id: string, competitionData: Partial<Omit<Competition, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, COMPETITIONS_COLLECTION, id);
    const updateData: any = {
      ...competitionData,
      updatedAt: Timestamp.now(),
    };

    if (competitionData.date) {
      updateData.date = Timestamp.fromDate(competitionData.date);
    }

    await updateDoc(docRef, updateData);
  },

  // Elimina una competizione
  async deleteCompetition(id: string): Promise<void> {
    const docRef = doc(db, COMPETITIONS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Ottieni registrazioni per una competizione
  async getRegistrations(competitionId: string): Promise<Registration[]> {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('competitionId', '==', competitionId),
      orderBy('registeredAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      registeredAt: doc.data().registeredAt?.toDate() || new Date(),
    })) as Registration[];
  },

  // Ottieni il numero di registrazioni per una competizione
  async getRegistrationsCount(competitionId: string): Promise<number> {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('competitionId', '==', competitionId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  },

  // Registra un atleta a una competizione
  async registerAthlete(registrationData: Omit<Registration, 'id' | 'registeredAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, REGISTRATIONS_COLLECTION), {
      ...registrationData,
      registeredAt: Timestamp.now(),
    });
    
    return docRef.id;
  },

  // Aggiorna una registrazione
  async updateRegistration(id: string, registrationData: Partial<Omit<Registration, 'id' | 'registeredAt'>>): Promise<void> {
    const docRef = doc(db, REGISTRATIONS_COLLECTION, id);
    await updateDoc(docRef, registrationData);
  },

  // Elimina una registrazione
  async deleteRegistration(id: string): Promise<void> {
    const docRef = doc(db, REGISTRATIONS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Ottieni statistiche generali
  async getCompetitionsStats(): Promise<{
    total: number;
    active: number;
    upcoming: number;
    completed: number;
    totalRegistrations: number;
    byType: { powerlifting: number; strongman: number; weightlifting: number; streetlifting: number };
  }> {
    const competitions = await this.getCompetitions();
    const now = new Date();
    
    const stats = {
      total: competitions.length,
      active: competitions.filter(c => c.status === 'active').length,
      upcoming: competitions.filter(c => c.date > now && c.status !== 'completed').length,
      completed: competitions.filter(c => c.status === 'completed').length,
      totalRegistrations: competitions.reduce((sum, c) => sum + c.registrationsCount, 0),
      byType: { powerlifting: 0, strongman: 0, weightlifting: 0, streetlifting: 0 },
    };

    competitions.forEach(comp => {
      if (stats.byType[comp.type] !== undefined) {
        stats.byType[comp.type]++;
      }
    });

    return stats;
  },

  // Duplica una competizione
  async duplicateCompetition(id: string, newDate: Date, newName?: string): Promise<string> {
    const competition = await this.getCompetition(id);
    if (!competition) throw new Error('Competizione non trovata');

    const duplicatedCompetition = {
      ...competition,
      name: newName || `${competition.name} (Copia)`,
      date: newDate,
      status: 'draft' as const,
    };

    // Rimuovi le proprietà che non devono essere duplicate
    const { id: _, createdAt, updatedAt, registrationsCount, categoriesCount, daysUntilStart, ...competitionData } = duplicatedCompetition;

    return await this.createCompetition(competitionData);
  }
};