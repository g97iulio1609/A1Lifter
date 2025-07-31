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
  orderBy 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { CustomDiscipline } from '@/types';

const DISCIPLINES_COLLECTION = 'disciplines';

// Template discipline predefinite
export const DEFAULT_DISCIPLINES: Omit<CustomDiscipline, 'id'>[] = [
  // Powerlifting
  { 
    name: 'Squat', 
    sport: 'powerlifting', 
    maxAttempts: 3, 
    unit: 'kg', 
    scoringType: 'weight',
    description: 'Back squat with barbell',
    isDefault: true 
  },
  { 
    name: 'Bench Press', 
    sport: 'powerlifting', 
    maxAttempts: 3, 
    unit: 'kg', 
    scoringType: 'weight',
    description: 'Bench press with barbell',
    isDefault: true 
  },
  { 
    name: 'Deadlift', 
    sport: 'powerlifting', 
    maxAttempts: 3, 
    unit: 'kg', 
    scoringType: 'weight',
    description: 'Conventional deadlift',
    isDefault: true 
  },
  
  // Strongman
  { 
    name: 'Deadlift', 
    sport: 'strongman', 
    maxAttempts: 4, 
    unit: 'kg', 
    scoringType: 'weight',
    description: 'Strongman deadlift',
    isDefault: true 
  },
  { 
    name: 'Log Press', 
    sport: 'strongman', 
    maxAttempts: 4, 
    unit: 'kg', 
    scoringType: 'weight',
    description: 'Overhead log press',
    isDefault: true 
  },
  { 
    name: 'Atlas Stones', 
    sport: 'strongman', 
    maxAttempts: 4, 
    unit: 'kg', 
    scoringType: 'weight',
    description: 'Loading atlas stones',
    isDefault: true 
  },
  { 
    name: 'Farmer\'s Walk', 
    sport: 'strongman', 
    maxAttempts: 4, 
    unit: 'kg', 
    scoringType: 'weight',
    description: 'Farmer\'s walk for distance',
    isDefault: true 
  },
  { 
    name: 'Tire Flip', 
    sport: 'strongman', 
    maxAttempts: 4, 
    unit: 'reps', 
    scoringType: 'reps',
    description: 'Tire flipping for reps',
    isDefault: true 
  },
  
  // Weightlifting
  { 
    name: 'Snatch', 
    sport: 'weightlifting', 
    maxAttempts: 3, 
    unit: 'kg', 
    scoringType: 'weight',
    description: 'Olympic snatch',
    isDefault: true 
  },
  { 
    name: 'Clean & Jerk', 
    sport: 'weightlifting', 
    maxAttempts: 3, 
    unit: 'kg', 
    scoringType: 'weight',
    description: 'Olympic clean and jerk',
    isDefault: true 
  },
  
  // CrossFit
  { 
    name: 'Fran', 
    sport: 'crossfit', 
    maxAttempts: 1, 
    unit: 'time', 
    scoringType: 'time',
    description: '21-15-9 Thrusters + Pull-ups',
    isDefault: true 
  },
  { 
    name: 'Grace', 
    sport: 'crossfit', 
    maxAttempts: 1, 
    unit: 'time', 
    scoringType: 'time',
    description: '30 Clean & Jerks for time',
    isDefault: true 
  },
  { 
    name: 'Max Clean & Jerk', 
    sport: 'crossfit', 
    maxAttempts: 3, 
    unit: 'kg', 
    scoringType: 'weight',
    description: '1RM Clean & Jerk',
    isDefault: true 
  }
];

export const disciplinesService = {
  // Ottieni tutte le discipline disponibili
  async getAllDisciplines(): Promise<CustomDiscipline[]> {
    // Utilizziamo un solo orderBy per evitare la necessità di un indice composito
    const q = query(collection(db, DISCIPLINES_COLLECTION), orderBy('sport'));
    const querySnapshot = await getDocs(q);

    const disciplines = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CustomDiscipline[];

    // Ordiniamo lato client per nome all'interno di ogni sport
    return disciplines.sort((a, b) => {
      const sportCompare = a.sport.localeCompare(b.sport);
      return sportCompare !== 0 ? sportCompare : a.name.localeCompare(b.name);
    });
  },

  // Ottieni discipline per sport specifico
  async getDisciplinesBySport(sport: CustomDiscipline['sport']): Promise<CustomDiscipline[]> {
    // Rimuoviamo l'ordinamento sul server per evitare indici compositi e ordiniamo lato client
    const q = query(
      collection(db, DISCIPLINES_COLLECTION), 
      where('sport', '==', sport)
    );
    const querySnapshot = await getDocs(q);

    const disciplines = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CustomDiscipline[];

    return disciplines.sort((a, b) => a.name.localeCompare(b.name));
  },

  // Crea nuova disciplina personalizzata
  async createDiscipline(discipline: Omit<CustomDiscipline, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, DISCIPLINES_COLLECTION), {
        ...discipline,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating discipline:', error);
      throw error;
    }
  },

  // Aggiorna disciplina esistente
  async updateDiscipline(id: string, updates: Partial<CustomDiscipline>): Promise<void> {
    const disciplineRef = doc(db, DISCIPLINES_COLLECTION, id);
    await updateDoc(disciplineRef, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  // Elimina disciplina (solo se non è default)
  async deleteDiscipline(id: string): Promise<void> {
    const disciplineRef = doc(db, DISCIPLINES_COLLECTION, id);
    const disciplineDoc = await getDoc(disciplineRef);
    
    if (disciplineDoc.exists() && !disciplineDoc.data().isDefault) {
      await deleteDoc(disciplineRef);
    } else {
      throw new Error('Cannot delete default discipline');
    }
  },

  // Inizializza discipline predefinite (da chiamare una volta)
  async initializeDefaultDisciplines(): Promise<void> {
    const existingDisciplines = await this.getAllDisciplines();
    
    // Controlla se le discipline predefinite esistono già
    for (const defaultDiscipline of DEFAULT_DISCIPLINES) {
      const exists = existingDisciplines.some(
        d => d.name === defaultDiscipline.name && 
             d.sport === defaultDiscipline.sport && 
             d.isDefault
      );
      
      if (!exists) {
        await this.createDiscipline(defaultDiscipline);
      }
    }
  },

  // Ottieni template per sport (per UI)
  getTemplatesBySport(sport: CustomDiscipline['sport']): Omit<CustomDiscipline, 'id'>[] {
    return DEFAULT_DISCIPLINES.filter(d => d.sport === sport);
  },

  // Valida disciplina
  validateDiscipline(discipline: Partial<CustomDiscipline>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!discipline.name || discipline.name.trim().length < 2) {
      errors.push('Nome disciplina deve essere almeno 2 caratteri');
    }
    
    if (!discipline.sport) {
      errors.push('Sport è obbligatorio');
    }
    
    if (!discipline.maxAttempts || discipline.maxAttempts < 1 || discipline.maxAttempts > 10) {
      errors.push('Numero tentativi deve essere tra 1 e 10');
    }
    
    if (!discipline.unit) {
      errors.push('Unità di misura è obbligatoria');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};