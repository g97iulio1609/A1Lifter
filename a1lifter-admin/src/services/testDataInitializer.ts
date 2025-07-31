import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Competition, Athlete } from '@/types';

export const testDataService = {
  // Inizializza dati di test se non esistono
  async initializeTestData(): Promise<void> {
    console.log('🧪 Initializing test data...');
    
    try {
      // Controlla se ci sono già atleti
      const athletesSnapshot = await getDocs(collection(db, 'athletes'));
      if (athletesSnapshot.empty) {
        await this.createTestAthletes();
      }
      
      // Controlla se ci sono già competizioni
      const competitionsSnapshot = await getDocs(collection(db, 'competitions'));
      if (competitionsSnapshot.empty) {
        await this.createTestCompetitions();
      }
      
      console.log('✅ Test data initialization complete');
    } catch (error) {
      console.error('❌ Error initializing test data:', error);
      throw error;
    }
  },
  
  // Crea atleti di test
  async createTestAthletes(): Promise<void> {
    console.log('👥 Creating test athletes...');
    
    const testAthletes: Omit<Athlete, 'id'>[] = [
      {
        name: 'Mario Rossi',
        email: 'mario.rossi@example.com',
        birthDate: new Date('1990-01-15'),
        gender: 'M',
        weightClass: '83kg',
        federation: 'FIPL',
        personalRecords: {
          squat: 180,
          bench: 120,
          deadlift: 200
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Laura Bianchi',
        email: 'laura.bianchi@example.com',
        birthDate: new Date('1992-05-20'),
        gender: 'F',
        weightClass: '63kg',
        federation: 'IPF',
        personalRecords: {
          squat: 110,
          bench: 70,
          deadlift: 140
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Andrea Verdi',
        email: 'andrea.verdi@example.com',
        birthDate: new Date('1988-11-10'),
        gender: 'M',
        weightClass: '93kg',
        federation: 'WPC',
        personalRecords: {
          squat: 200,
          bench: 140,
          deadlift: 220
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    for (const athlete of testAthletes) {
      await addDoc(collection(db, 'athletes'), athlete);
    }
    
    console.log(`✅ Created ${testAthletes.length} test athletes`);
  },
  
  // Crea competizioni di test
  async createTestCompetitions(): Promise<void> {
    console.log('🏆 Creating test competitions...');
    
    const testCompetitions: Omit<Competition, 'id'>[] = [
      {
        name: 'Campionato Test Powerlifting 2024',
        date: new Date('2024-06-15'),
        registrationDeadline: new Date('2024-06-01'),
        location: 'Palestra Test, Via Roma 123, Milano',
        type: 'powerlifting',
        status: 'active',
        categories: [
          {
            id: 'M-83kg',
            name: 'Uomini -83kg',
            gender: 'M',
            weightClass: '83kg',
            ageGroup: 'Open'
          },
          {
            id: 'F-63kg',
            name: 'Donne -63kg',
            gender: 'F',
            weightClass: '63kg',
            ageGroup: 'Open'
          },
          {
            id: 'M-93kg',
            name: 'Uomini -93kg',
            gender: 'M',
            weightClass: '93kg',
            ageGroup: 'Open'
          }
        ],
        rules: {
          attempts: 3,
          disciplines: ['Squat', 'Bench Press', 'Deadlift'],
          scoringSystem: 'ipf'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-admin'
      },
      {
        name: 'Gara Test Strongman 2024',
        date: new Date('2024-07-20'),
        registrationDeadline: new Date('2024-07-05'),
        location: 'Campo Strongman, Via Forza 456, Roma',
        type: 'strongman',
        status: 'draft',
        categories: [
          {
            id: 'M-105kg-strongman',
            name: 'Uomini -105kg',
            gender: 'M',
            weightClass: '105kg',
            ageGroup: 'Open'
          }
        ],
        rules: {
          attempts: 4,
          disciplines: ['Deadlift', 'Log Press', 'Atlas Stones'],
          scoringSystem: 'ipf'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-admin'
      }
    ];
    
    for (const competition of testCompetitions) {
      await addDoc(collection(db, 'competitions'), competition);
    }
    
    console.log(`✅ Created ${testCompetitions.length} test competitions`);
  },
  
  // Crea registrazioni di test
  async createTestRegistrations(competitionId?: string): Promise<void> {
    console.log('📝 Creating test registrations...');
    
    // Ottieni atleti e competizioni esistenti
    const athletesSnapshot = await getDocs(collection(db, 'athletes'));
    
    let athletes;
    
    if (athletesSnapshot.empty) {
      // Se non ci sono atleti, creali prima
      await this.createTestAthletes();
      const newAthletesSnapshot = await getDocs(collection(db, 'athletes'));
      if (newAthletesSnapshot.empty) {
        console.log('⚠️ Could not create test athletes');
        return;
      }
      athletes = newAthletesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Athlete & { id: string })[];
    } else {
      athletes = athletesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Athlete & { id: string })[];
    }
    
    let activeCompetition;
    
    if (competitionId) {
      // Usa competizione specifica
      const competitionsSnapshot = await getDocs(collection(db, 'competitions'));
      const competitions = competitionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Competition & { id: string })[];
      activeCompetition = competitions.find(c => c.id === competitionId);
    } else {
      // Trova una competizione attiva
      const competitionsSnapshot = await getDocs(query(
        collection(db, 'competitions'),
        where('status', '==', 'active')
      ));
      
      if (competitionsSnapshot.empty) {
        console.log('⚠️ No active competitions found for test registrations');
        return;
      }
      
      const competitions = competitionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Competition & { id: string })[];
      activeCompetition = competitions[0];
    }
    
    if (!activeCompetition) {
      console.log('⚠️ No valid competition found for test registrations');
      return;
    }
    
    // Crea registrazioni per tutti gli atleti nella prima competizione attiva
    for (const athlete of athletes) {
      // Trova una categoria appropriata
      const appropriateCategory = activeCompetition.categories.find((cat: any) => 
        cat.gender === athlete.gender && cat.weightClass === athlete.weightClass
      ) || activeCompetition.categories[0];
      
      const registrationData = {
        competitionId: activeCompetition.id,
        athleteId: athlete.id,
        categoryId: appropriateCategory.id,
        status: 'confirmed',
        paymentStatus: 'paid',
        notes: 'Registrazione di test',
        registeredAt: new Date()
      };
      
      await addDoc(collection(db, 'registrations'), registrationData);
      
      // Crea anche dettagli registrazione
      const detailsData = {
        registrationId: '', // Verrà aggiornato dopo la creazione
        emergencyContact: {
          name: 'Contatto Test',
          phone: '+39 999 999 9999',
          relationship: 'Genitore'
        },
        medicalInfo: {
          allergies: 'Nessuna allergia nota',
          medications: 'Nessun farmaco',
          conditions: 'Nessuna condizione medica'
        }
      };
      
      await addDoc(collection(db, 'registrationDetails'), detailsData);
    }
    
    console.log(`✅ Created test registrations for ${athletes.length} athletes`);
  },
  
  // Pulisce tutti i dati di test
  async cleanupTestData(): Promise<void> {
    console.log('🧹 This would cleanup test data (not implemented for safety)');
    // Implementare solo se necessario per sicurezza
  }
};