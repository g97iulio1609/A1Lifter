import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { SystemConfig } from '@/types';

export class ConfigService {
  private collection = collection(db, 'systemConfig');
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

  // Ottieni configurazione
  async getConfig(key: string): Promise<any> {
    try {
      // Controlla cache
      if (this.isInCache(key)) {
        return this.cache.get(key);
      }

      const docRef = doc(this.collection, key);
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        const value = snapshot.data().value;
        this.setCache(key, value);
        return value;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting config:', error);
      throw new Error(`Errore durante il recupero della configurazione: ${key}`);
    }
  }

  // Imposta configurazione
  async setConfig(key: string, value: any, description?: string): Promise<void> {
    try {
      const docRef = doc(this.collection, key);
      const configData: Omit<SystemConfig, 'id'> = {
        key,
        value,
        description,
        type: 'object',
        isEditable: true,
        updatedAt: serverTimestamp() as any,
        updatedBy: 'system'
      };

      await setDoc(docRef, configData, { merge: true });
      this.setCache(key, value);
    } catch (error) {
      console.error('Error setting config:', error);
      throw new Error(`Errore durante l'impostazione della configurazione: ${key}`);
    }
  }

  // Aggiorna configurazione
  async updateConfig(key: string, value: any): Promise<void> {
    try {
      const docRef = doc(this.collection, key);
      await updateDoc(docRef, {
        value,
        updatedAt: serverTimestamp()
      });
      this.setCache(key, value);
    } catch (error) {
      console.error('Error updating config:', error);
      throw new Error(`Errore durante l'aggiornamento della configurazione: ${key}`);
    }
  }

  // Ottieni tutte le configurazioni
  async getAllConfigs(): Promise<SystemConfig[]> {
    try {
      const snapshot = await getDocs(this.collection);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemConfig[];
    } catch (error) {
      console.error('Error getting all configs:', error);
      throw new Error('Errore durante il recupero di tutte le configurazioni');
    }
  }

  // Configurazioni predefinite del sistema
  async initializeDefaultConfigs(): Promise<void> {
    const defaultConfigs = [
      {
        key: 'competition.defaultAttempts',
        value: 3,
        description: 'Numero predefinito di tentativi per disciplina'
      },
      {
        key: 'competition.attemptTimeLimit',
        value: 60,
        description: 'Tempo limite per tentativo in secondi'
      },
      {
        key: 'competition.breakTimeLimit',
        value: 300,
        description: 'Tempo limite per pausa tra discipline in secondi'
      },
      {
        key: 'competition.autoProgressDisciplines',
        value: true,
        description: 'Avanzamento automatico tra discipline'
      },
      {
        key: 'scoring.enableIPF',
        value: true,
        description: 'Abilita calcolo punteggio IPF'
      },
      {
        key: 'scoring.enableWilks',
        value: true,
        description: 'Abilita calcolo punteggio Wilks'
      },
      {
        key: 'scoring.enableDOTS',
        value: true,
        description: 'Abilita calcolo punteggio DOTS'
      },
      {
        key: 'scoring.enableGLPoints',
        value: false,
        description: 'Abilita calcolo punteggio GL Points'
      },
      {
        key: 'weighIn.allowanceKg',
        value: 0.1,
        description: 'Tolleranza peso in kg per pesata'
      },
      {
        key: 'weighIn.requireOfficialWeighIn',
        value: true,
        description: 'Richiedi pesata ufficiale obbligatoria'
      },
      {
        key: 'judges.minimumRequired',
        value: 3,
        description: 'Numero minimo di giudici richiesti'
      },
      {
        key: 'judges.allowMajorityDecision',
        value: true,
        description: 'Permetti decisioni a maggioranza'
      },
      {
        key: 'live.enableRealTimeUpdates',
        value: true,
        description: 'Abilita aggiornamenti in tempo reale'
      },
      {
        key: 'live.displayAttemptHistory',
        value: true,
        description: 'Mostra storico tentativi nella dashboard live'
      },
      {
        key: 'notifications.enablePushNotifications',
        value: true,
        description: 'Abilita notifiche push'
      },
      {
        key: 'notifications.enableEmailNotifications',
        value: false,
        description: 'Abilita notifiche email'
      },
      {
        key: 'backup.autoBackupEnabled',
        value: true,
        description: 'Abilita backup automatico'
      },
      {
        key: 'backup.autoBackupInterval',
        value: 30,
        description: 'Intervallo backup automatico in minuti'
      },
      {
        key: 'records.enableRecordTracking',
        value: true,
        description: 'Abilita tracciamento record'
      },
      {
        key: 'records.autoDetectRecords',
        value: true,
        description: 'Rilevamento automatico nuovi record'
      },
      {
        key: 'ui.theme',
        value: 'light',
        description: 'Tema interfaccia utente (light/dark)'
      },
      {
        key: 'ui.language',
        value: 'it',
        description: 'Lingua predefinita interfaccia'
      },
      {
        key: 'ui.dateFormat',
        value: 'DD/MM/YYYY',
        description: 'Formato data predefinito'
      },
      {
        key: 'ui.timeFormat',
        value: '24h',
        description: 'Formato ora (12h/24h)'
      },
      {
        key: 'security.sessionTimeout',
        value: 3600,
        description: 'Timeout sessione in secondi'
      },
      {
        key: 'security.requireTwoFactor',
        value: false,
        description: 'Richiedi autenticazione a due fattori'
      },
      {
        key: 'export.defaultFormat',
        value: 'pdf',
        description: 'Formato export predefinito (pdf/excel)'
      },
      {
        key: 'export.includePhotos',
        value: false,
        description: 'Includi foto negli export'
      }
    ];

    try {
      for (const config of defaultConfigs) {
        const existing = await this.getConfig(config.key);
        if (existing === null) {
          await this.setConfig(config.key, config.value, config.description);
        }
      }
    } catch (error) {
      console.error('Error initializing default configs:', error);
      throw new Error('Errore durante l\'inizializzazione delle configurazioni predefinite');
    }
  }

  // Configurazioni specifiche per sport
  async getSportConfigs(sport: 'powerlifting' | 'strongman' | 'weightlifting' | 'streetlifting'): Promise<any> {
    try {
      const configs = await this.getAllConfigs();
      const sportConfigs = configs.filter(config => 
        config.key.startsWith(`${sport}.`)
      );
      
      const result: any = {};
      sportConfigs.forEach(config => {
        const key = config.key.replace(`${sport}.`, '');
        result[key] = config.value;
      });
      
      return result;
    } catch (error) {
      console.error('Error getting sport configs:', error);
      throw new Error(`Errore durante il recupero delle configurazioni per ${sport}`);
    }
  }

  // Configurazioni per powerlifting
  async initializePowerliftingConfigs(): Promise<void> {
    const powerliftingConfigs = [
      {
        key: 'powerlifting.disciplines',
        value: ['squat', 'bench', 'deadlift'],
        description: 'Discipline powerlifting standard'
      },
      {
        key: 'powerlifting.equipmentTypes',
        value: ['raw', 'equipped'],
        description: 'Tipi di equipaggiamento powerlifting'
      },
      {
        key: 'powerlifting.weightCategories.men',
        value: [59, 66, 74, 83, 93, 105, 120, 120.1],
        description: 'Categorie peso uomini powerlifting'
      },
      {
        key: 'powerlifting.weightCategories.women',
        value: [47, 52, 57, 63, 69, 76, 84, 84.1],
        description: 'Categorie peso donne powerlifting'
      },
      {
        key: 'powerlifting.ageCategories',
        value: {
          'Sub-Junior': { min: 14, max: 18 },
          'Junior': { min: 19, max: 23 },
          'Open': { min: 24, max: 39 },
          'Master 1': { min: 40, max: 49 },
          'Master 2': { min: 50, max: 59 },
          'Master 3': { min: 60, max: 69 },
          'Master 4': { min: 70, max: 999 }
        },
        description: 'Categorie età powerlifting'
      }
    ];

    for (const config of powerliftingConfigs) {
      await this.setConfig(config.key, config.value, config.description);
    }
  }

  // Configurazioni per strongman
  async initializeStrongmanConfigs(): Promise<void> {
    const strongmanConfigs = [
      {
        key: 'strongman.disciplines',
        value: ['deadlift', 'atlas_stones', 'farmers_walk', 'log_press', 'tire_flip'],
        description: 'Discipline strongman standard'
      },
      {
        key: 'strongman.scoringTypes',
        value: ['time', 'weight', 'reps', 'distance'],
        description: 'Tipi di punteggio strongman'
      },
      {
        key: 'strongman.weightCategories.men',
        value: [80, 90, 105, 105.1],
        description: 'Categorie peso uomini strongman'
      },
      {
        key: 'strongman.weightCategories.women',
        value: [60, 70, 80, 80.1],
        description: 'Categorie peso donne strongman'
      }
    ];

    for (const config of strongmanConfigs) {
      await this.setConfig(config.key, config.value, config.description);
    }
  }

  // Configurazioni per weightlifting
  async initializeWeightliftingConfigs(): Promise<void> {
    const weightliftingConfigs = [
      {
        key: 'weightlifting.disciplines',
        value: ['snatch', 'clean_and_jerk'],
        description: 'Discipline weightlifting standard'
      },
      {
        key: 'weightlifting.weightCategories.men',
        value: [55, 61, 67, 73, 81, 89, 96, 102, 109, 109.1],
        description: 'Categorie peso uomini weightlifting'
      },
      {
        key: 'weightlifting.weightCategories.women',
        value: [45, 49, 55, 59, 64, 71, 76, 81, 87, 87.1],
        description: 'Categorie peso donne weightlifting'
      },
      {
        key: 'weightlifting.ageCategories',
        value: {
          'Youth': { min: 13, max: 17 },
          'Junior': { min: 15, max: 20 },
          'Senior': { min: 20, max: 34 },
          'Master': { min: 35, max: 999 }
        },
        description: 'Categorie età weightlifting'
      }
    ];

    for (const config of weightliftingConfigs) {
      await this.setConfig(config.key, config.value, config.description);
    }
  }

  // Configurazioni per streetlifting
  async initializeStreetliftingConfigs(): Promise<void> {
    const streetliftingConfigs = [
      {
        key: 'streetlifting.disciplines',
        value: ['squat', 'bench', 'deadlift'],
        description: 'Discipline streetlifting standard'
      },
      {
        key: 'streetlifting.equipmentTypes',
        value: ['raw', 'equipped'],
        description: 'Tipi di equipaggiamento streetlifting'
      },
      {
        key: 'streetlifting.weightCategories.men',
        value: [59, 66, 74, 83, 93, 105, 120, 120.1],
        description: 'Categorie peso uomini streetlifting'
      },
      {
        key: 'streetlifting.weightCategories.women',
        value: [47, 52, 57, 63, 69, 76, 84, 84.1],
        description: 'Categorie peso donne streetlifting'
      }
    ];

    for (const config of streetliftingConfigs) {
      await this.setConfig(config.key, config.value, config.description);
    }
  }

  // Metodi di cache
  private isInCache(key: string): boolean {
    if (!this.cache.has(key)) return false;
    
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return false;
    }
    
    return true;
  }

  private setCache(key: string, value: any): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  // Pulisci cache
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Ottieni configurazioni per categoria
  async getConfigsByCategory(category: string): Promise<SystemConfig[]> {
    try {
      const allConfigs = await this.getAllConfigs();
      return allConfigs.filter(config => config.key.startsWith(`${category}.`));
    } catch (error) {
      console.error('Error getting configs by category:', error);
      throw new Error(`Errore durante il recupero delle configurazioni per categoria: ${category}`);
    }
  }

  // Esporta configurazioni
  async exportConfigs(): Promise<void> {
    try {
      const configs = await this.getAllConfigs();
      const dataStr = JSON.stringify(configs, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system_configs_${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting configs:', error);
      throw new Error('Errore durante l\'esportazione delle configurazioni');
    }
  }

  // Importa configurazioni
  async importConfigs(file: File): Promise<void> {
    try {
      const text = await file.text();
      const configs = JSON.parse(text) as SystemConfig[];
      
      for (const config of configs) {
        await this.setConfig(config.key, config.value, config.description);
      }
      
      this.clearCache();
    } catch (error) {
      console.error('Error importing configs:', error);
      throw new Error('Errore durante l\'importazione delle configurazioni');
    }
  }
}

export const configService = new ConfigService();