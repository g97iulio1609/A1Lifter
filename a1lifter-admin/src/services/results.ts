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
import { athletesService } from './athletes';
import { competitionsService } from './competitions';
import type { Result, AthleteResult, CompetitionLeaderboard, Lift } from '@/types';

const RESULTS_COLLECTION = 'results';

export const resultsService = {
  // Ottieni tutti i risultati
  async getResults(filters?: {
    competitionId?: string;
    athleteId?: string;
    categoryId?: string;
  }): Promise<Result[]> {
    const constraints: QueryConstraint[] = [orderBy('totalScore', 'desc')];
    
    if (filters?.competitionId) {
      constraints.push(where('competitionId', '==', filters.competitionId));
    }
    
    if (filters?.athleteId) {
      constraints.push(where('athleteId', '==', filters.athleteId));
    }
    
    if (filters?.categoryId) {
      constraints.push(where('categoryId', '==', filters.categoryId));
    }

    const q = query(collection(db, RESULTS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    
  return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lifts: doc.data().lifts?.map((lift: Record<string, unknown>) => ({
        ...lift,
        timestamp: (lift.timestamp && typeof lift.timestamp === 'object' && 'toDate' in lift.timestamp)
          ? (lift.timestamp as { toDate: () => Date }).toDate()
          : new Date(),
      })) || [],
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Result[];
  },

  // Ottieni un singolo risultato
  async getResult(id: string): Promise<Result | null> {
    const docRef = doc(db, RESULTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
  lifts: data.lifts?.map((lift: Record<string, unknown>) => ({
          ...lift,
          timestamp: (lift.timestamp && typeof lift.timestamp === 'object' && 'toDate' in lift.timestamp)
            ? (lift.timestamp as { toDate: () => Date }).toDate()
            : new Date(),
        })) || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Result;
    }
    
    return null;
  },

  // Ottieni risultati con informazioni atleti
  async getResultsWithAthletes(competitionId: string): Promise<AthleteResult[]> {
    const results = await this.getResults({ competitionId });
    const competition = await competitionsService.getCompetition(competitionId);
    
    if (!competition) return [];

    const athleteResults = await Promise.all(
      results.map(async (result) => {
        const athlete = await athletesService.getAthlete(result.athleteId);
        const category = competition.categories.find(c => c.id === result.categoryId);
        
        return {
          ...result,
          athleteName: athlete?.name || 'Atleta sconosciuto',
          athleteGender: athlete?.gender || 'M',
          athleteWeight: 0, // TODO: Implementare peso corporeo
          categoryName: category?.name || 'Categoria sconosciuta',
        } as AthleteResult;
      })
    );

    return athleteResults;
  },

  // Ottieni classifica competizione
  async getLeaderboard(competitionId: string): Promise<CompetitionLeaderboard> {
    const competition = await competitionsService.getCompetition(competitionId);
    if (!competition) {
      throw new Error('Competizione non trovata');
    }

    const results = await this.getResultsWithAthletes(competitionId);
    
    const categoriesMap = new Map<string, AthleteResult[]>();
    
    // Raggruppa per categoria
    results.forEach(result => {
      if (!categoriesMap.has(result.categoryId)) {
        categoriesMap.set(result.categoryId, []);
      }
      categoriesMap.get(result.categoryId)!.push(result);
    });

    // Ordina per punteggio e assegna ranking
    const categories = Array.from(categoriesMap.entries()).map(([categoryId, categoryResults]) => {
      const sortedResults = categoryResults.sort((a, b) => b.totalScore - a.totalScore);
      
      // Assegna ranking
      sortedResults.forEach((result, index) => {
        result.ranking = index + 1;
      });

      const category = competition.categories.find(c => c.id === categoryId);
      
      return {
        categoryId,
        categoryName: category?.name || 'Categoria sconosciuta',
        results: sortedResults,
      };
    });

    return {
      competitionId,
      categories,
    };
  },

  // Crea un nuovo risultato
  async createResult(resultData: Omit<Result, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    
    const liftsWithTimestamp = resultData.lifts.map(lift => ({
      ...lift,
      timestamp: lift.timestamp instanceof Date ? Timestamp.fromDate(lift.timestamp) : lift.timestamp,
    }));

    const docRef = await addDoc(collection(db, RESULTS_COLLECTION), {
      ...resultData,
      lifts: liftsWithTimestamp,
      createdAt: now,
      updatedAt: now,
    });
    
    return docRef.id;
  },

  // Aggiorna un risultato esistente
  async updateResult(id: string, resultData: Partial<Omit<Result, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, RESULTS_COLLECTION, id);
    const updateData: Record<string, unknown> = {
      ...resultData,
      updatedAt: Timestamp.now(),
    };

    if (resultData.lifts) {
  (updateData as { lifts?: unknown[] }).lifts = resultData.lifts.map(lift => ({
        ...lift,
        timestamp: lift.timestamp instanceof Date ? Timestamp.fromDate(lift.timestamp) : lift.timestamp,
      }));
    }

  await updateDoc(docRef, updateData as UpdateData<DocumentData>);
  },

  // Elimina un risultato
  async deleteResult(id: string): Promise<void> {
    const docRef = doc(db, RESULTS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Aggiungi un tentativo
  async addLift(resultId: string, lift: Lift): Promise<void> {
    const result = await this.getResult(resultId);
    if (!result) throw new Error('Risultato non trovato');

    const updatedLifts = [...result.lifts, lift];
    const totalScore = this.calculateTotalScore(updatedLifts);

    await this.updateResult(resultId, {
      lifts: updatedLifts,
      totalScore,
    });
  },

  // Aggiorna un tentativo
  async updateLift(resultId: string, liftIndex: number, lift: Partial<Lift>): Promise<void> {
    const result = await this.getResult(resultId);
    if (!result) throw new Error('Risultato non trovato');

    const updatedLifts = [...result.lifts];
    updatedLifts[liftIndex] = { ...updatedLifts[liftIndex], ...lift };
    const totalScore = this.calculateTotalScore(updatedLifts);

    await this.updateResult(resultId, {
      lifts: updatedLifts,
      totalScore,
    });
  },

  // Calcola il punteggio totale
  calculateTotalScore(lifts: Lift[]): number {
    // Raggruppa per disciplina e prendi il massimo valido
    const disciplineScores = new Map<string, number>();
    
    lifts.forEach(lift => {
      if (lift.valid) {
        const currentMax = disciplineScores.get(lift.discipline) || 0;
        if (lift.weight > currentMax) {
          disciplineScores.set(lift.discipline, lift.weight);
        }
      }
    });

    // Somma i migliori tentativi per disciplina
    return Array.from(disciplineScores.values()).reduce((sum, weight) => sum + weight, 0);
  },

  // Ricalcola tutti i ranking per una competizione
  async recalculateRankings(competitionId: string): Promise<void> {
    const leaderboard = await this.getLeaderboard(competitionId);
    
    const updatePromises = leaderboard.categories.flatMap(category =>
      category.results.map(result =>
        this.updateResult(result.id, { ranking: result.ranking })
      )
    );

    await Promise.all(updatePromises);
  },

  // Ottieni statistiche risultati
  async getResultsStats(competitionId: string): Promise<{
    totalResults: number;
    totalAttempts: number;
    validAttempts: number;
    invalidAttempts: number;
    averageScore: number;
    topScore: number;
    byCategory: Record<string, number>;
  }> {
    const results = await this.getResults({ competitionId });
    
    let totalAttempts = 0;
    let validAttempts = 0;
    let invalidAttempts = 0;
    let totalScore = 0;
    let topScore = 0;
    const byCategory = new Map<string, number>();

    results.forEach(result => {
      result.lifts.forEach(lift => {
        totalAttempts++;
        if (lift.valid) {
          validAttempts++;
        } else {
          invalidAttempts++;
        }
      });

      totalScore += result.totalScore;
      if (result.totalScore > topScore) {
        topScore = result.totalScore;
      }

      byCategory.set(result.categoryId, (byCategory.get(result.categoryId) || 0) + 1);
    });

    return {
      totalResults: results.length,
      totalAttempts,
      validAttempts,
      invalidAttempts,
      averageScore: results.length > 0 ? totalScore / results.length : 0,
      topScore,
      byCategory: Object.fromEntries(byCategory),
    };
  },
};