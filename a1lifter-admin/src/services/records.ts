import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  setDoc,
  updateDoc,
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { CompetitionRecord, RecordBroken, AthleteQualification, AttemptResult } from '@/types';

export class RecordService {
  private recordsCollection = collection(db, 'records');
  private qualificationsCollection = collection(db, 'qualifications');
  private recordsBrokenCollection = collection(db, 'recordsBroken');
  private listeners: Map<string, Unsubscribe> = new Map();

  // === GESTIONE RECORD ===

  // Crea nuovo record
  async createRecord(
    recordData: Omit<CompetitionRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(this.recordsCollection, {
        ...recordData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating record:', error);
      throw new Error('Errore durante la creazione del record');
    }
  }

  // Ottieni record per categoria
  async getRecordsByCategory(
    sport: string,
    discipline: string,
    category: string,
    weightCategory: string,
    recordType: 'world' | 'national' | 'regional' | 'local' = 'national'
  ): Promise<CompetitionRecord[]> {
    try {
      const q = query(
        this.recordsCollection,
        where('sport', '==', sport),
        where('discipline', '==', discipline),
        where('category', '==', category),
        where('weightCategory', '==', weightCategory),
        where('recordType', '==', recordType),
        where('isActive', '==', true),
        orderBy('weight', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CompetitionRecord[];
    } catch (error) {
      console.error('Error fetching records by category:', error);
      throw new Error('Errore durante il recupero dei record per categoria');
    }
  }

  // Ottieni record per atleta
  async getAthleteRecords(athleteId: string): Promise<CompetitionRecord[]> {
    try {
      const q = query(
        this.recordsCollection,
        where('athleteId', '==', athleteId),
        where('isActive', '==', true),
        orderBy('dateSet', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CompetitionRecord[];
    } catch (error) {
      console.error('Error fetching athlete records:', error);
      throw new Error('Errore durante il recupero dei record dell\'atleta');
    }
  }

  // Ottieni record per competizione
  async getCompetitionRecords(competitionId: string): Promise<CompetitionRecord[]> {
    try {
      const q = query(
        this.recordsCollection,
        where('competitionId', '==', competitionId),
        where('isActive', '==', true),
        orderBy('dateSet', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CompetitionRecord[];
    } catch (error) {
      console.error('Error fetching competition records:', error);
      throw new Error('Errore durante il recupero dei record della competizione');
    }
  }

  // Verifica se un peso è un nuovo record
  async checkForNewRecord(
    sport: string,
    discipline: string,
    category: string,
    weightCategory: string,
    weight: number,
    recordType: 'world' | 'national' | 'regional' | 'local' = 'national'
  ): Promise<{
    isNewRecord: boolean;
    currentRecord?: CompetitionRecord;
    improvement?: number;
  }> {
    try {
      const currentRecords = await this.getRecordsByCategory(
        sport,
        discipline,
        category,
        weightCategory,
        recordType
      );
      
      if (currentRecords.length === 0) {
        return {
          isNewRecord: true,
          improvement: weight
        };
      }
      
      const bestRecord = currentRecords[0]; // Già ordinato per peso desc
      const isNewRecord = weight > bestRecord.weight;
      const improvement = isNewRecord ? weight - bestRecord.weight : 0;
      
      return {
        isNewRecord,
        currentRecord: bestRecord,
        improvement
      };
    } catch (error) {
      console.error('Error checking for new record:', error);
      throw new Error('Errore durante la verifica del nuovo record');
    }
  }

  // Registra nuovo record
  async registerNewRecord(
    athleteId: string,
    athleteName: string,
    competitionId: string,
    competitionName: string,
    sport: 'powerlifting' | 'strongman' | 'weightlifting' | 'streetlifting',
    discipline: string,
    category: string,
    weightCategory: string,
    weight: number,
    recordType: 'world' | 'national' | 'regional' | 'local',
    previousRecordId?: string
  ): Promise<string> {
    try {
      // Disattiva il record precedente se esiste
      if (previousRecordId) {
        await this.deactivateRecord(previousRecordId);
      }
      
      // Crea il nuovo record
      const recordId = await this.createRecord({
        athleteId,
        athleteName,
        competitionId,
        competitionName,
        sport,
        disciplineId: '',
        discipline: discipline || '',
        category,
        weightCategory: weightCategory || '',
        ageGroup: '',
        gender: 'M',
        federation: '',
        location: '',
        notes: '',
        weight,
        value: weight,
        unit: 'kg',
        recordType,
        type: 'competition',
        dateSet: new Date(),
        isActive: true,
        isRatified: false // Richiede ratifica
      });
      
      // Registra il record battuto
      await this.recordRecordBroken({
        recordId,
        athleteId,
        athleteName,
        competitionId,
        disciplineId: '',
        sport,
        discipline,
        category,
        weightCategory,
        weight,
        newWeight: weight,
        previousWeight: previousRecordId ? (await this.getRecordById(previousRecordId))?.weight || 0 : 0,
        recordType,
        improvement: weight - (previousRecordId ? (await this.getRecordById(previousRecordId))?.weight || 0 : 0),
        type: 'competition',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return recordId;
    } catch (error) {
      console.error('Error registering new record:', error);
      throw new Error('Errore durante la registrazione del nuovo record');
    }
  }

  // Ottieni record per ID
  async getRecordById(recordId: string): Promise<CompetitionRecord | null> {
    try {
      const docRef = doc(this.recordsCollection, recordId);
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data()
        } as CompetitionRecord;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching record by ID:', error);
      return null;
    }
  }

  // Disattiva record
  async deactivateRecord(recordId: string): Promise<void> {
    try {
      const docRef = doc(this.recordsCollection, recordId);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deactivating record:', error);
      throw new Error('Errore durante la disattivazione del record');
    }
  }

  // Ratifica record
  async ratifyRecord(recordId: string, ratifiedBy: string): Promise<void> {
    try {
      const docRef = doc(this.recordsCollection, recordId);
      await updateDoc(docRef, {
        isRatified: true,
        ratifiedBy,
        ratifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error ratifying record:', error);
      throw new Error('Errore durante la ratifica del record');
    }
  }

  // === GESTIONE RECORD BATTUTI ===

  // Registra record battuto
  async recordRecordBroken(
    recordBrokenData: Omit<RecordBroken, 'id' | 'timestamp'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(this.recordsBrokenCollection, {
        ...recordBrokenData,
        timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error recording broken record:', error);
      throw new Error('Errore durante la registrazione del record battuto');
    }
  }

  // Ottieni record battuti per competizione
  async getRecordsBrokenInCompetition(competitionId: string): Promise<RecordBroken[]> {
    try {
      const q = query(
        this.recordsBrokenCollection,
        where('competitionId', '==', competitionId),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RecordBroken[];
    } catch (error) {
      console.error('Error fetching records broken in competition:', error);
      throw new Error('Errore durante il recupero dei record battuti nella competizione');
    }
  }

  // === GESTIONE QUALIFICAZIONI ===

  // Crea qualificazione
  async createQualification(
    qualificationData: Omit<AthleteQualification, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(this.qualificationsCollection, {
        ...qualificationData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating qualification:', error);
      throw new Error('Errore durante la creazione della qualificazione');
    }
  }

  // Ottieni qualificazioni atleta
  async getAthleteQualifications(athleteId: string): Promise<AthleteQualification[]> {
    try {
      const q = query(
        this.qualificationsCollection,
        where('athleteId', '==', athleteId),
        where('isActive', '==', true),
        orderBy('qualificationDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AthleteQualification[];
    } catch (error) {
      console.error('Error fetching athlete qualifications:', error);
      throw new Error('Errore durante il recupero delle qualificazioni dell\'atleta');
    }
  }

  // Ottieni qualificazioni per competizione
  async getQualificationsByCompetition(competitionId: string): Promise<AthleteQualification[]> {
    try {
      const q = query(
        this.qualificationsCollection,
        where('competitionId', '==', competitionId),
        where('isActive', '==', true),
        orderBy('qualificationDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AthleteQualification[];
    } catch (error) {
      console.error('Error fetching qualifications by competition:', error);
      throw new Error('Errore durante il recupero delle qualificazioni per competizione');
    }
  }

  // Verifica qualificazione per competizione
  async checkQualificationForCompetition(
    athleteId: string,
    targetCompetitionLevel: string,
    sport: 'powerlifting' | 'strongman' | 'weightlifting' | 'streetlifting',
    discipline: string,
    category: string,
    weightCategory: string
  ): Promise<{
    isQualified: boolean;
    qualifications: AthleteQualification[];
    missingRequirements?: string[];
  }> {
    try {
      const qualifications = await this.getAthleteQualifications(athleteId);
      
      // Filtra qualificazioni pertinenti
      const relevantQualifications = qualifications.filter(q => 
        q.sport === sport &&
        q.discipline === discipline &&
        q.category === category &&
        q.weightCategory === weightCategory &&
        q.isActive &&
        q.expiryDate && new Date(q.expiryDate) > new Date()
      );
      
      // Logica di qualificazione basata sul livello della competizione
      const isQualified = this.evaluateQualification(
        relevantQualifications,
        targetCompetitionLevel
      );
      
      const missingRequirements = isQualified ? undefined : 
        this.getMissingRequirements(targetCompetitionLevel, relevantQualifications);
      
      return {
        isQualified,
        qualifications: relevantQualifications,
        missingRequirements
      };
    } catch (error) {
      console.error('Error checking qualification:', error);
      throw new Error('Errore durante la verifica della qualificazione');
    }
  }

  // Valuta qualificazione
  private evaluateQualification(
    qualifications: AthleteQualification[],
    targetLevel: string
  ): boolean {
    if (qualifications.length === 0) return false;
    
    const levelHierarchy = ['local', 'regional', 'national', 'international'];
    const targetLevelIndex = levelHierarchy.indexOf(targetLevel);
    
    if (targetLevelIndex === -1) return false;
    
    // Verifica se l'atleta ha qualificazioni sufficienti
    return qualifications.some(q => {
      const qualLevelIndex = levelHierarchy.indexOf(q.competitionLevel);
      return qualLevelIndex >= Math.max(0, targetLevelIndex - 1); // Può qualificarsi con livello uguale o superiore
    });
  }

  // Ottieni requisiti mancanti
  private getMissingRequirements(
    targetLevel: string,
    currentQualifications: AthleteQualification[]
  ): string[] {
    const requirements: string[] = [];
    
    switch (targetLevel) {
      case 'international':
        if (!currentQualifications.some(q => q.competitionLevel === 'national')) {
          requirements.push('Qualificazione nazionale richiesta');
        }
        break;
      case 'national':
        if (!currentQualifications.some(q => ['regional', 'national'].includes(q.competitionLevel))) {
          requirements.push('Qualificazione regionale o nazionale richiesta');
        }
        break;
      case 'regional':
        if (currentQualifications.length === 0) {
          requirements.push('Almeno una qualificazione locale richiesta');
        }
        break;
    }
    
    return requirements;
  }

  // Aggiorna qualificazione automaticamente da risultato
  async updateQualificationFromResult(
    result: AttemptResult,
    competitionLevel: string,
    competitionName: string
  ): Promise<void> {
    try {
      if (!result.isValid || !result.weight) return;
      
      // Verifica se questo risultato migliora le qualificazioni esistenti
      const existingQualifications = await this.getAthleteQualifications(result.athleteId);
      
      const relevantQual = existingQualifications.find(q => 
        q.sport === result.sport &&
        q.discipline === result.discipline &&
        q.category === result.category &&
        q.weightCategory === result.weightCategory
      );
      
      if (!relevantQual || result.weight > relevantQual.qualifyingTotal) {
        // Crea nuova qualificazione o aggiorna esistente
        await this.createQualification({
          athleteId: result.athleteId,
          athleteName: result.athleteName,
          sport: result.sport,
          discipline: result.discipline,
          disciplineId: result.disciplineId,
          category: result.category,
          weightCategory: result.weightCategory,
          qualifyingTotal: result.weight,
          qualifyingWeight: result.weight,
          qualifyingValue: result.weight,
          achievedValue: result.weight,
          competitionId: result.competitionId,
          competitionLevel,
          competitionName,
          qualificationDate: new Date(),
          qualifyingDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 anno
          federation: '',
          isValid: true,
          isActive: true,
          isQualified: true
        });
        
        // Disattiva qualificazione precedente se esiste
        if (relevantQual) {
          await this.deactivateQualification(relevantQual.id);
        }
      }
    } catch (error) {
      console.error('Error updating qualification from result:', error);
      throw new Error('Errore durante l\'aggiornamento della qualificazione dal risultato');
    }
  }

  // Disattiva qualificazione
  async deactivateQualification(qualificationId: string): Promise<void> {
    try {
      const docRef = doc(this.qualificationsCollection, qualificationId);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deactivating qualification:', error);
      throw new Error('Errore durante la disattivazione della qualificazione');
    }
  }

  // Crea qualificazione atleta
  async createAthleteQualification(qualificationData: Omit<AthleteQualification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = doc(this.qualificationsCollection);
      const qualification: Omit<AthleteQualification, 'id'> = {
        ...qualificationData,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any
      };
      
      await setDoc(docRef, qualification);
      return docRef.id;
    } catch (error) {
      console.error('Error creating athlete qualification:', error);
      throw new Error('Errore durante la creazione della qualificazione atleta');
    }
  }

  // === STATISTICHE E REPORT ===

  // Ottieni statistiche record
  async getRecordStatistics(sport?: string): Promise<{
    totalRecords: number;
    recordsByType: Record<string, number>;
    recordsBySport: Record<string, number>;
    recentRecords: CompetitionRecord[];
  }> {
    try {
      let q = query(
        this.recordsCollection,
        where('isActive', '==', true)
      );
      
      if (sport) {
        q = query(
          this.recordsCollection,
          where('sport', '==', sport),
          where('isActive', '==', true)
        );
      }
      
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CompetitionRecord[];
      
      const recordsByType: Record<string, number> = {};
      const recordsBySport: Record<string, number> = {};
      
      records.forEach(record => {
        recordsByType[record.recordType] = (recordsByType[record.recordType] || 0) + 1;
        recordsBySport[record.sport] = (recordsBySport[record.sport] || 0) + 1;
      });
      
      // Record recenti (ultimi 30 giorni)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentRecords = records
        .filter(record => new Date(record.dateSet) > thirtyDaysAgo)
        .sort((a, b) => new Date(b.dateSet).getTime() - new Date(a.dateSet).getTime())
        .slice(0, 10);
      
      return {
        totalRecords: records.length,
        recordsByType,
        recordsBySport,
        recentRecords
      };
    } catch (error) {
      console.error('Error getting record statistics:', error);
      throw new Error('Errore durante il recupero delle statistiche dei record');
    }
  }

  // Ascolta nuovi record in tempo reale
  subscribeToNewRecords(
    competitionId: string,
    callback: (records: RecordBroken[]) => void
  ): Unsubscribe {
    const q = query(
      this.recordsBrokenCollection,
      where('competitionId', '==', competitionId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RecordBroken[];
      
      callback(records);
    }, (error) => {
      console.error('Error in new records subscription:', error);
      callback([]);
    });

    this.listeners.set(`records_${competitionId}`, unsubscribe);
    return unsubscribe;
  }

  // Pulisci listener
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

export const recordService = new RecordService();