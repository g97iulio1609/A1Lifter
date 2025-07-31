import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 

  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { BackupData, Competition, Athlete, Registration, AttemptResult } from '@/types';

export class BackupService {
  private backupCollection = collection(db, 'backups');

  // Crea backup completo
  async createFullBackup(
    competitionId: string,
    description?: string
  ): Promise<string> {
    try {
      // Raccogli tutti i dati della competizione
      const competitionData = await this.getCompetitionData(competitionId);
      const athletesData = await this.getAthletesData(competitionId);
      const registrationsData = await this.getRegistrationsData(competitionId);
      const resultsData = await this.getResultsData(competitionId);
      const weighInsData = await this.getWeighInsData(competitionId);
      const judgeAssignmentsData = await this.getJudgeAssignmentsData(competitionId);
      const liveSessionsData = await this.getLiveSessionsData(competitionId);

      if (!competitionData) {
        throw new Error('Competition data not found');
      }
      
      const backupData: Omit<BackupData, 'id' | 'createdAt'> = {
        competitionId,
        name: `Backup completo - ${new Date().toLocaleString()}`,
        type: 'full',
        description: description || `Backup completo - ${new Date().toLocaleString()}`,
        timestamp: new Date(),
        status: 'completed',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni
        data: {
          competition: competitionData,
          athletes: athletesData,
          registrations: registrationsData,
          results: resultsData,
          weighIns: weighInsData,
          judgeAssignments: judgeAssignmentsData,
          liveSessions: liveSessionsData
        },
        dataSize: this.calculateDataSize({
          competition: competitionData,
          athletes: athletesData,
          registrations: registrationsData,
          results: resultsData,
          weighIns: weighInsData,
          judgeAssignments: judgeAssignmentsData,
          liveSessions: liveSessionsData
        }),
        size: this.calculateDataSize({
          competition: competitionData,
          athletes: athletesData,
          registrations: registrationsData,
          results: resultsData,
          weighIns: weighInsData,
          judgeAssignments: judgeAssignmentsData,
          liveSessions: liveSessionsData
        })
      };

      const docRef = await addDoc(this.backupCollection, {
        ...backupData,
        createdAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating full backup:', error);
      throw new Error('Errore durante la creazione del backup completo');
    }
  }

  // Crea backup incrementale
  async createIncrementalBackup(
    competitionId: string,
    description?: string
  ): Promise<string> {
    try {
      // Raccogli solo i dati modificati dopo l'ultimo backup
      const modifiedData = await this.getModifiedDataSince(competitionId);

      const backupData: Omit<BackupData, 'id' | 'createdAt'> = {
        competitionId,
        name: `Backup incrementale - ${new Date().toLocaleString()}`,
        type: 'incremental',
        description: description || `Backup incrementale - ${new Date().toLocaleString()}`,
        timestamp: new Date(),
        status: 'completed',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni
        data: modifiedData,
        dataSize: this.calculateDataSize(modifiedData),
        size: this.calculateDataSize(modifiedData)
      };

      const docRef = await addDoc(this.backupCollection, {
        ...backupData,
        createdAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating incremental backup:', error);
      throw new Error('Errore durante la creazione del backup incrementale');
    }
  }

  // Ottieni lista backup
  async getBackups(
    competitionId?: string,
    limitCount: number = 20
  ): Promise<BackupData[]> {
    try {
      let q = query(
        this.backupCollection,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (competitionId) {
        q = query(
          this.backupCollection,
          where('competitionId', '==', competitionId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BackupData[];
    } catch (error) {
      console.error('Error fetching backups:', error);
      throw new Error('Errore durante il recupero dei backup');
    }
  }

  // Ottieni backup specifico
  async getBackup(backupId: string): Promise<BackupData | null> {
    try {
      const snapshot = await getDocs(query(this.backupCollection, where('__name__', '==', backupId)));
      
      if (snapshot.empty) {
        return null;
      }

      const docData = snapshot.docs[0];
      return {
        id: docData.id,
        ...docData.data()
      } as BackupData;
    } catch (error) {
      console.error('Error fetching backup:', error);
      throw new Error('Errore durante il recupero del backup');
    }
  }

  // Ripristina da backup
  async restoreFromBackup(
    backupId: string,
    options: {
      restoreCompetition?: boolean;
      restoreAthletes?: boolean;
      restoreRegistrations?: boolean;
      restoreResults?: boolean;
      restoreWeighIns?: boolean;
      restoreJudgeAssignments?: boolean;
      restoreLiveSessions?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const backup = await this.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup non trovato');
      }

      const batch = writeBatch(db);
      const { data } = backup;

      // Ripristina competizione
      if (options.restoreCompetition && data.competition) {
        const competitionRef = doc(db, 'competitions', backup.competitionId);
        batch.set(competitionRef, data.competition);
      }

      // Ripristina atleti
      if (options.restoreAthletes && data.athletes) {
        for (const athlete of data.athletes) {
          const athleteRef = doc(db, 'athletes', athlete.id);
          batch.set(athleteRef, athlete);
        }
      }

      // Ripristina registrazioni
      if (options.restoreRegistrations && data.registrations) {
        for (const registration of data.registrations) {
          const registrationRef = doc(db, 'registrations', registration.id);
          batch.set(registrationRef, registration);
        }
      }

      // Ripristina risultati
      if (options.restoreResults && data.results) {
        for (const result of data.results) {
          const resultRef = doc(db, 'results', result.id);
          batch.set(resultRef, result);
        }
      }

      // Ripristina pesate
      if (options.restoreWeighIns && data.weighIns) {
        for (const weighIn of data.weighIns) {
          const weighInRef = doc(db, 'weighIns', weighIn.id);
          batch.set(weighInRef, weighIn);
        }
      }

      // Ripristina assegnazioni giudici
      if (options.restoreJudgeAssignments && data.judgeAssignments) {
        for (const assignment of data.judgeAssignments) {
          const assignmentRef = doc(db, 'judgeAssignments', assignment.id);
          batch.set(assignmentRef, assignment);
        }
      }

      // Ripristina sessioni live
      if (options.restoreLiveSessions && data.liveSessions) {
        for (const session of data.liveSessions) {
          const sessionRef = doc(db, 'liveSessions', session.id);
          batch.set(sessionRef, session);
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw new Error('Errore durante il ripristino dal backup');
    }
  }

  // Backup automatico programmato
  async scheduleAutoBackup(
    competitionId: string,
    intervalMinutes: number = 30
  ): Promise<void> {
    try {
      // Implementazione del backup automatico
      const interval = setInterval(async () => {
        try {
          await this.createIncrementalBackup(
            competitionId,
            'Backup automatico'
          );
        } catch (error) {
          console.error('Error in auto backup:', error);
        }
      }, intervalMinutes * 60 * 1000);

      // Salva l'ID dell'intervallo per poterlo cancellare
      (window as any).autoBackupInterval = interval;
    } catch (error) {
      console.error('Error scheduling auto backup:', error);
      throw new Error('Errore durante la programmazione del backup automatico');
    }
  }

  // Ferma backup automatico
  stopAutoBackup(): void {
    const interval = (window as any).autoBackupInterval;
    if (interval) {
      clearInterval(interval);
      delete (window as any).autoBackupInterval;
    }
  }

  // Elimina backup
  async deleteBackup(backupId: string): Promise<void> {
    try {
      // In a real implementation, this would delete from Firestore
      console.log('Deleting backup:', backupId);
      // await deleteDoc(doc(this.backupCollection, backupId));
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw new Error('Errore durante l\'eliminazione del backup');
    }
  }

  // Esporta backup come file JSON
  async exportBackup(backupId: string): Promise<void> {
    try {
      const backup = await this.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup non trovato');
      }

      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${backup.competitionId}_${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting backup:', error);
      throw new Error('Errore durante l\'esportazione del backup');
    }
  }

  // Importa backup da file JSON
  async importBackup(file: File): Promise<string> {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text) as BackupData;
      
      // Valida i dati del backup
      if (!backupData.competitionId || !backupData.data) {
        throw new Error('File di backup non valido');
      }

      const docRef = await addDoc(this.backupCollection, {
        ...backupData,
        createdAt: serverTimestamp(),
        description: `${backupData.description} (Importato)`
      });

      return docRef.id;
    } catch (error) {
      console.error('Error importing backup:', error);
      throw new Error('Errore durante l\'importazione del backup');
    }
  }

  // Verifica integrità backup
  async verifyBackupIntegrity(backupId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const backup = await this.getBackup(backupId);
      if (!backup) {
        return {
          isValid: false,
          errors: ['Backup non trovato'],
          warnings: []
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      const { data } = backup;

      // Verifica presenza dati essenziali
      if (!data.competition) {
        errors.push('Dati competizione mancanti');
      }

      if (!data.athletes || data.athletes.length === 0) {
        warnings.push('Nessun atleta nel backup');
      }

      if (!data.registrations || data.registrations.length === 0) {
        warnings.push('Nessuna registrazione nel backup');
      }

      // Verifica coerenza dati
      if (data.registrations && data.athletes) {
        const athleteIds = new Set(data.athletes.map((a: Athlete) => a.id));
        const orphanRegistrations = data.registrations.filter(
          (r: Registration) => !athleteIds.has(r.athleteId)
        );
        
        if (orphanRegistrations.length > 0) {
          warnings.push(`${orphanRegistrations.length} registrazioni senza atleta corrispondente`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Error verifying backup integrity:', error);
      return {
        isValid: false,
        errors: ['Errore durante la verifica dell\'integrità'],
        warnings: []
      };
    }
  }

  // Metodi privati per raccogliere dati
  private async getCompetitionData(competitionId: string): Promise<Competition | null> {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'competitions'), where('__name__', '==', competitionId))
      );
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Competition;
    } catch (error) {
      console.error('Error getting competition data:', error);
      return null;
    }
  }

  private async getAthletesData(competitionId: string): Promise<Athlete[]> {
    try {
      const registrationsSnapshot = await getDocs(
        query(collection(db, 'registrations'), where('competitionId', '==', competitionId))
      );
      
      const athleteIds = registrationsSnapshot.docs.map(doc => doc.data().athleteId);
      
      if (athleteIds.length === 0) return [];
      
      const athletesSnapshot = await getDocs(
        query(collection(db, 'athletes'), where('__name__', 'in', athleteIds))
      );
      
      return athletesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Athlete[];
    } catch (error) {
      console.error('Error getting athletes data:', error);
      return [];
    }
  }

  private async getRegistrationsData(competitionId: string): Promise<Registration[]> {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'registrations'), where('competitionId', '==', competitionId))
      );
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Registration[];
    } catch (error) {
      console.error('Error getting registrations data:', error);
      return [];
    }
  }

  private async getResultsData(competitionId: string): Promise<AttemptResult[]> {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'results'), where('competitionId', '==', competitionId))
      );
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttemptResult[];
    } catch (error) {
      console.error('Error getting results data:', error);
      return [];
    }
  }

  private async getWeighInsData(competitionId: string): Promise<any[]> {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'weighIns'), where('competitionId', '==', competitionId))
      );
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting weigh-ins data:', error);
      return [];
    }
  }

  private async getJudgeAssignmentsData(competitionId: string): Promise<any[]> {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'judgeAssignments'), where('competitionId', '==', competitionId))
      );
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting judge assignments data:', error);
      return [];
    }
  }

  private async getLiveSessionsData(competitionId: string): Promise<any[]> {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'liveSessions'), where('competitionId', '==', competitionId))
      );
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting live sessions data:', error);
      return [];
    }
  }

  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private async getModifiedDataSince(competitionId: string): Promise<any> {
    // Implementazione per ottenere solo i dati modificati dopo una certa data
    // Questo richiederebbe timestamp di modifica sui documenti
    return {
      // Implementazione semplificata - in produzione dovrebbe filtrare per data
      competition: await this.getCompetitionData(competitionId),
      athletes: await this.getAthletesData(competitionId),
      registrations: await this.getRegistrationsData(competitionId),
      results: await this.getResultsData(competitionId)
    };
  }
}

export const backupService = new BackupService();