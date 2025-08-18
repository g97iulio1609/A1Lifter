import { 
  collection, 
  doc, 
  getDocs,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { UpdateData, DocumentData } from 'firebase/firestore';
import type { WeighIn, CategoryConfig } from '@/types';

export class WeighInService {
  private collection = collection(db, 'weighIns');

  // Crea una nuova pesatura
  async createWeighIn(weighInData: Omit<WeighIn, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(this.collection, {
        ...weighInData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating weigh-in:', error);
      throw new Error('Errore durante la creazione della pesatura');
    }
  }

  // Ottieni tutte le pesature
  async getAllWeighIns(): Promise<WeighIn[]> {
    try {
      const q = query(
        this.collection,
        orderBy('weighInTime', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WeighIn[];
    } catch (error) {
      console.error('Error fetching all weigh-ins:', error);
      throw new Error('Errore durante il recupero di tutte le pesature');
    }
  }

  // Ottieni pesature per competizione
  async getWeighInsByCompetition(competitionId: string): Promise<WeighIn[]> {
    try {
      const q = query(
        this.collection,
        where('competitionId', '==', competitionId),
        orderBy('weighInTime', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WeighIn[];
    } catch (error) {
      console.error('Error fetching weigh-ins:', error);
      throw new Error('Errore durante il recupero delle pesature');
    }
  }

  // Ottieni pesatura per atleta
  async getWeighInByAthlete(competitionId: string, athleteId: string): Promise<WeighIn | null> {
    try {
      const q = query(
        this.collection,
        where('competitionId', '==', competitionId),
        where('athleteId', '==', athleteId),
        where('isOfficial', '==', true)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as WeighIn;
    } catch (error) {
      console.error('Error fetching athlete weigh-in:', error);
      throw new Error('Errore durante il recupero della pesatura atleta');
    }
  }

  // Aggiorna pesatura
  async updateWeighIn(weighInId: string, updates: Partial<WeighIn>): Promise<void> {
    try {
      const docRef = doc(this.collection, weighInId);
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: serverTimestamp()
      };
  await updateDoc(docRef, updateData as UpdateData<DocumentData>);
    } catch (error) {
      console.error('Error updating weigh-in:', error);
      throw new Error('Errore durante l\'aggiornamento della pesatura');
    }
  }

  // Approva pesatura
  async approveWeighIn(weighInId: string, judgeId: string): Promise<void> {
    try {
      await this.updateWeighIn(weighInId, {
        status: 'approved',
        witnessJudgeId: judgeId,
        isOfficial: true
      });
    } catch (error) {
      console.error('Error approving weigh-in:', error);
      throw new Error('Errore durante l\'approvazione della pesatura');
    }
  }

  // Rifiuta pesatura
  async rejectWeighIn(weighInId: string, notes: string): Promise<void> {
    try {
      await this.updateWeighIn(weighInId, {
        status: 'rejected',
        notes,
        isOfficial: false
      });
    } catch (error) {
      console.error('Error rejecting weigh-in:', error);
      throw new Error('Errore durante il rifiuto della pesatura');
    }
  }

  // Valida categoria peso
  async validateWeightCategory(
    bodyWeight: number, 
    categoryId: string, 
    categories: CategoryConfig[]
  ): Promise<{ isValid: boolean; suggestedCategory?: CategoryConfig; message: string }> {
    try {
      const category = categories.find(c => c.id === categoryId);
      if (!category) {
        return {
          isValid: false,
          message: 'Categoria non trovata'
        };
      }

      const weightClass = category.weightClass;
      const isOpenClass = weightClass.includes('+');
      const maxWeight = isOpenClass 
        ? parseFloat(weightClass.replace('kg+', '')) 
        : parseFloat(weightClass.replace('kg', ''));

      if (isOpenClass) {
        // Categoria aperta (es. 120kg+)
        if (bodyWeight >= maxWeight) {
          return {
            isValid: true,
            message: `Peso valido per categoria ${weightClass}`
          };
        }
      } else {
        // Categoria chiusa (es. 83kg)
        if (bodyWeight <= maxWeight) {
          return {
            isValid: true,
            message: `Peso valido per categoria ${weightClass}`
          };
        }
      }

      // Suggerisci categoria alternativa
      const suggestedCategory = this.findSuitableCategory(bodyWeight, categories, category.gender);
      
      return {
        isValid: false,
        suggestedCategory,
        message: `Peso ${bodyWeight}kg non valido per categoria ${weightClass}${
          suggestedCategory ? `. Categoria suggerita: ${suggestedCategory.weightClass}` : ''
        }`
      };
    } catch (error) {
      console.error('Error validating weight category:', error);
      throw new Error('Errore durante la validazione della categoria peso');
    }
  }

  // Trova categoria adatta per peso
  private findSuitableCategory(
    bodyWeight: number, 
    categories: CategoryConfig[], 
    gender: 'M' | 'F'
  ): CategoryConfig | undefined {
    const sameGenderCategories = categories.filter(c => c.gender === gender);
    
    // Ordina per peso crescente
    const sortedCategories = sameGenderCategories.sort((a, b) => {
      const weightA = parseFloat(a.weightClass.replace(/kg\+?/, ''));
      const weightB = parseFloat(b.weightClass.replace(/kg\+?/, ''));
      return weightA - weightB;
    });

    // Trova la prima categoria che può contenere il peso
    for (const category of sortedCategories) {
      const weightClass = category.weightClass;
      const isOpenClass = weightClass.includes('+');
      const maxWeight = parseFloat(weightClass.replace(/kg\+?/, ''));

      if (isOpenClass && bodyWeight >= maxWeight) {
        return category;
      } else if (!isOpenClass && bodyWeight <= maxWeight) {
        return category;
      }
    }

    return undefined;
  }

  // Elimina pesatura
  async deleteWeighIn(weighInId: string): Promise<void> {
    try {
      const docRef = doc(this.collection, weighInId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting weigh-in:', error);
      throw new Error('Errore durante l\'eliminazione della pesatura');
    }
  }

  // Ottieni statistiche pesature
  async getWeighInStats(competitionId: string): Promise<{
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    averageWeight: number;
    weightRange: { min: number; max: number };
  }> {
    try {
      const weighIns = await this.getWeighInsByCompetition(competitionId);
      
      const stats = {
        total: weighIns.length,
        approved: weighIns.filter(w => w.status === 'approved').length,
        pending: weighIns.filter(w => w.status === 'pending').length,
        rejected: weighIns.filter(w => w.status === 'rejected').length,
        averageWeight: 0,
        weightRange: { min: 0, max: 0 }
      };

      if (weighIns.length > 0) {
        const weights = weighIns.map(w => w.bodyWeight);
        stats.averageWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length;
        stats.weightRange.min = Math.min(...weights);
        stats.weightRange.max = Math.max(...weights);
      }

      return stats;
    } catch (error) {
      console.error('Error getting weigh-in stats:', error);
      throw new Error('Errore durante il recupero delle statistiche pesature');
    }
  }

  // Esporta pesature per competizione
  async exportWeighIns(competitionId: string): Promise<Record<string, string | number>[]> {
    try {
      const weighIns = await this.getWeighInsByCompetition(competitionId);
      
      return weighIns.map(weighIn => ({
        'ID Atleta': weighIn.athleteId,
        'Peso Corporeo (kg)': weighIn.bodyWeight,
        'Data Pesatura': weighIn.weighInTime instanceof Date ? weighIn.weighInTime.toLocaleDateString() : 'N/A',
        'Ora Pesatura': weighIn.weighInTime instanceof Date ? weighIn.weighInTime.toLocaleTimeString() : 'N/A',
        'Stato': weighIn.status,
        'Ufficiale': weighIn.isOfficial ? 'Sì' : 'No',
        'Giudice Testimone': weighIn.witnessJudgeId || 'N/A',
        'Note': weighIn.notes || 'N/A'
      }));
    } catch (error) {
      console.error('Error exporting weigh-ins:', error);
      throw new Error('Errore durante l\'esportazione delle pesature');
    }
  }
}

export const weighInService = new WeighInService();