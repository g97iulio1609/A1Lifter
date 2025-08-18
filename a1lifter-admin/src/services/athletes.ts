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
import type { UpdateData, DocumentData } from 'firebase/firestore';
import type { Athlete } from '@/types';

const ATHLETES_COLLECTION = 'athletes';

export const athletesService = {
  // Ottieni tutti gli atleti
  async getAthletes(filters?: {
    gender?: 'M' | 'F';
    weightClass?: string;
    federation?: string;
    searchTerm?: string;
  }): Promise<Athlete[]> {
    const constraints: QueryConstraint[] = [orderBy('name')];
    
    if (filters?.gender) {
      constraints.push(where('gender', '==', filters.gender));
    }
    
    if (filters?.weightClass) {
      constraints.push(where('weightClass', '==', filters.weightClass));
    }
    
    if (filters?.federation) {
      constraints.push(where('federation', '==', filters.federation));
    }

    const q = query(collection(db, ATHLETES_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    
    let athletes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      birthDate: doc.data().birthDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Athlete[];

    // Filtro per ricerca testuale (nome o email)
    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      athletes = athletes.filter(athlete => 
        athlete.name.toLowerCase().includes(searchLower) ||
        athlete.email.toLowerCase().includes(searchLower)
      );
    }

    return athletes;
  },

  // Ottieni un singolo atleta
  async getAthlete(id: string): Promise<Athlete | null> {
    const docRef = doc(db, ATHLETES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        birthDate: data.birthDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Athlete;
    }
    
    return null;
  },

  // Crea un nuovo atleta
  async createAthlete(athleteData: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, ATHLETES_COLLECTION), {
      ...athleteData,
      birthDate: Timestamp.fromDate(athleteData.birthDate),
      createdAt: now,
      updatedAt: now,
    });
    
    return docRef.id;
  },

  // Aggiorna un atleta esistente
  async updateAthlete(id: string, athleteData: Partial<Omit<Athlete, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, ATHLETES_COLLECTION, id);
    const updateData: Record<string, unknown> = {
      ...athleteData,
      updatedAt: Timestamp.now(),
    };

    if (athleteData.birthDate) {
      updateData.birthDate = Timestamp.fromDate(athleteData.birthDate);
    }

  await updateDoc(docRef, updateData as UpdateData<DocumentData>);
  },

  // Elimina un atleta
  async deleteAthlete(id: string): Promise<void> {
    const docRef = doc(db, ATHLETES_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Importa atleti da array (per CSV)
  async importAthletes(athletes: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    const now = Timestamp.now();
    const createdIds: string[] = [];
    
    for (const athleteData of athletes) {
      const docRef = await addDoc(collection(db, ATHLETES_COLLECTION), {
        ...athleteData,
        birthDate: Timestamp.fromDate(athleteData.birthDate),
        createdAt: now,
        updatedAt: now,
      });
      createdIds.push(docRef.id);
    }
    
    return createdIds;
  },

  // Ottieni statistiche atleti
  async getAthletesStats(): Promise<{
    total: number;
    byGender: { M: number; F: number };
    byFederation: Record<string, number>;
    recentlyAdded: number;
  }> {
    const athletes = await this.getAthletes();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const stats = {
      total: athletes.length,
      byGender: { M: 0, F: 0 },
      byFederation: {} as Record<string, number>,
      recentlyAdded: 0,
    };

    athletes.forEach(athlete => {
      // Conteggio per genere
      stats.byGender[athlete.gender]++;
      
      // Conteggio per federazione
      if (athlete.federation) {
        stats.byFederation[athlete.federation] = (stats.byFederation[athlete.federation] || 0) + 1;
      }
      
      // Conteggio aggiunti di recente
      if (athlete.createdAt >= thirtyDaysAgo) {
        stats.recentlyAdded++;
      }
    });

    return stats;
  }
};