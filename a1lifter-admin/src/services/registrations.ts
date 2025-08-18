import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  QueryConstraint,
  addDoc 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { RegistrationWithDetails } from '@/types';
import type { RegistrationsFilters } from '@/hooks/useRegistrations';

const REGISTRATIONS_COLLECTION = 'registrations';
const REGISTRATION_DETAILS_COLLECTION = 'registrationDetails';
const ATHLETES_COLLECTION = 'athletes';
const COMPETITIONS_COLLECTION = 'competitions';

export const registrationsService = {
  // Pulisce le iscrizioni orfane (che fanno riferimento a atleti o competizioni inesistenti)
  async cleanOrphanedRegistrations(): Promise<{ cleaned: number; errors: string[] }> {
    console.log('Starting cleanup of orphaned registrations...');
    
    const errors: string[] = [];
    let cleaned = 0;
    
    try {
      // Ottieni tutte le registrazioni
      const registrationsSnapshot = await getDocs(collection(db, REGISTRATIONS_COLLECTION));
      console.log(`Found ${registrationsSnapshot.docs.length} registrations to check`);
      
      for (const regDoc of registrationsSnapshot.docs) {
        const regData = regDoc.data();
        let shouldDelete = false;
        
        // Verifica se l'atleta esiste
        try {
          const athleteDoc = await getDoc(doc(db, ATHLETES_COLLECTION, regData.athleteId));
          if (!athleteDoc.exists()) {
            console.log(`Orphaned registration ${regDoc.id}: athlete ${regData.athleteId} not found`);
            shouldDelete = true;
          }
        } catch (error) {
          errors.push(`Error checking athlete ${regData.athleteId}: ${error}`);
          shouldDelete = true;
        }
        
        // Verifica se la competizione esiste
        try {
          const competitionDoc = await getDoc(doc(db, COMPETITIONS_COLLECTION, regData.competitionId));
          if (!competitionDoc.exists()) {
            console.log(`Orphaned registration ${regDoc.id}: competition ${regData.competitionId} not found`);
            shouldDelete = true;
          }
        } catch (error) {
          errors.push(`Error checking competition ${regData.competitionId}: ${error}`);
          shouldDelete = true;
        }
        
        // Elimina la registrazione orfana
        if (shouldDelete) {
          try {
            await deleteDoc(regDoc.ref);
            
            // Elimina anche i dettagli della registrazione
            const detailsQuery = query(
              collection(db, REGISTRATION_DETAILS_COLLECTION),
              where('registrationId', '==', regDoc.id)
            );
            const detailsSnapshot = await getDocs(detailsQuery);
            
            for (const detailDoc of detailsSnapshot.docs) {
              await deleteDoc(detailDoc.ref);
            }
            
            cleaned++;
            console.log(`Deleted orphaned registration ${regDoc.id}`);
          } catch (error) {
            errors.push(`Error deleting registration ${regDoc.id}: ${error}`);
          }
        }
      }
      
      console.log(`Cleanup completed. Cleaned ${cleaned} orphaned registrations`);
      return { cleaned, errors };
      
    } catch (error) {
      console.error('Error during cleanup:', error);
      errors.push(`General cleanup error: ${error}`);
      return { cleaned, errors };
    }
  },

  // Ottieni registrazioni con filtri e dati completi
  async getRegistrations(filters: RegistrationsFilters = {}): Promise<RegistrationWithDetails[]> {
    console.log('Getting registrations with filters:', filters);
    
    const constraints: QueryConstraint[] = [];
    
    // Filtri
    if (filters.competitionId) {
      constraints.push(where('competitionId', '==', filters.competitionId));
    }
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters.paymentStatus) {
      constraints.push(where('paymentStatus', '==', filters.paymentStatus));
    }

    // Orderby rimosso temporaneamente per evitare problemi con indici compositi
    // TODO: Riattivare dopo aver configurato gli indici Firebase

    let querySnapshot;
    try {
      const q = query(collection(db, REGISTRATIONS_COLLECTION), ...constraints);
      querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.docs.length} registrations`);
    } catch (error: unknown) {
      console.error('Error fetching registrations:', error);
      throw error;
    }
    
    // Verifica se ci sono atleti e competizioni nel database
    const athletesSnapshot = await getDocs(collection(db, ATHLETES_COLLECTION));
    const competitionsSnapshot = await getDocs(collection(db, COMPETITIONS_COLLECTION));
    console.log(`Total athletes in database: ${athletesSnapshot.docs.length}`);
    console.log(`Total competitions in database: ${competitionsSnapshot.docs.length}`);
    
    const registrations: RegistrationWithDetails[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const registrationData = docSnapshot.data();
      const registration = {
        id: docSnapshot.id,
        competitionId: registrationData.competitionId,
        athleteId: registrationData.athleteId,
        categoryId: registrationData.categoryId,
        status: registrationData.status,
        paymentStatus: registrationData.paymentStatus,
        notes: registrationData.notes,
        registeredAt: registrationData.registeredAt?.toDate() || new Date(),
      };

      // Ottieni dati atleta
      const athleteDoc = await getDoc(doc(db, ATHLETES_COLLECTION, registration.athleteId));
      const athleteData = athleteDoc.exists() ? athleteDoc.data() : null;

      // Ottieni dati competizione
      const competitionDoc = await getDoc(doc(db, COMPETITIONS_COLLECTION, registration.competitionId));
      const competitionData = competitionDoc.exists() ? competitionDoc.data() : null;

      // Ottieni dettagli registrazione solo se atleta e competizione esistono
      if (athleteData && competitionData) {
        const detailsQuery = query(
          collection(db, REGISTRATION_DETAILS_COLLECTION),
          where('registrationId', '==', registration.id)
        );
        const detailsSnapshot = await getDocs(detailsQuery);
        const detailsData = detailsSnapshot.docs[0]?.data();
        // Trova categoria
        const category = competitionData.categories?.find((c: { id: string; name: string }) => c.id === registration.categoryId);
        
        const enrichedRegistration: RegistrationWithDetails = {
          ...registration,
          athleteName: athleteData.name,
          athleteEmail: athleteData.email,
          athleteGender: athleteData.gender,
          athleteWeightClass: athleteData.weightClass,
          competitionName: competitionData.name,
          categoryName: category?.name || 'Categoria non trovata',
          emergencyContact: detailsData?.emergencyContact,
          medicalInfo: detailsData?.medicalInfo,
          createdAt: registrationData.createdAt?.toDate() || new Date(),
          updatedAt: registrationData.updatedAt?.toDate() || new Date(),
        };

        // Applica filtro di ricerca lato client
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          if (
            enrichedRegistration.athleteName.toLowerCase().includes(searchLower) ||
            enrichedRegistration.athleteEmail.toLowerCase().includes(searchLower)
          ) {
            registrations.push(enrichedRegistration);
          }
        } else {
          registrations.push(enrichedRegistration);
        }
      }
      // Iscrizioni orfane vengono silenziosamente ignorate
      // Usa cleanOrphanedRegistrations() per rimuoverle definitivamente
    }
    
    // Ordina lato client per garantire ordine corretto
    return registrations.sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime());
  },

  // Ottieni dettagli di una singola registrazione
  async getRegistrationDetails(registrationId: string): Promise<RegistrationWithDetails> {
    const registrationDoc = await getDoc(doc(db, REGISTRATIONS_COLLECTION, registrationId));
    
    if (!registrationDoc.exists()) {
      throw new Error('Registrazione non trovata');
    }

    const registrationData = registrationDoc.data()!;
    const registration = {
      id: registrationDoc.id,
      competitionId: registrationData.competitionId,
      athleteId: registrationData.athleteId,
      categoryId: registrationData.categoryId,
      status: registrationData.status,
      paymentStatus: registrationData.paymentStatus,
      notes: registrationData.notes,
      registeredAt: registrationData.registeredAt?.toDate() || new Date(),
    };

    // Ottieni dati atleta
    const athleteDoc = await getDoc(doc(db, ATHLETES_COLLECTION, registration.athleteId));
    const athleteData = athleteDoc.data();

    // Ottieni dati competizione
    const competitionDoc = await getDoc(doc(db, COMPETITIONS_COLLECTION, registration.competitionId));
    const competitionData = competitionDoc.data();

    // Ottieni dettagli registrazione
    const detailsQuery = query(
      collection(db, REGISTRATION_DETAILS_COLLECTION),
      where('registrationId', '==', registrationId)
    );
    const detailsSnapshot = await getDocs(detailsQuery);
    const detailsData = detailsSnapshot.docs[0]?.data();

    if (!athleteData || !competitionData) {
      throw new Error('Dati atleta o competizione non trovati');
    }

    // Trova categoria
    const category = competitionData.categories?.find((c: { id: string; name: string }) => c.id === registration.categoryId);

    return {
      ...registration,
      athleteName: athleteData.name,
      athleteEmail: athleteData.email,
      athleteGender: athleteData.gender,
      athleteWeightClass: athleteData.weightClass,
      competitionName: competitionData.name,
      categoryName: category?.name || 'Categoria non trovata',
      emergencyContact: detailsData?.emergencyContact,
      medicalInfo: detailsData?.medicalInfo,
      createdAt: registrationData.createdAt?.toDate() || new Date(),
      updatedAt: registrationData.updatedAt?.toDate() || new Date(),
    };
  },

  // Aggiorna una registrazione
  async updateRegistration({ id, data }: { id: string; data: Partial<RegistrationWithDetails> }): Promise<void> {
    const registrationRef = doc(db, REGISTRATIONS_COLLECTION, id);
    await updateDoc(registrationRef, {
      ...data,
      updatedAt: new Date(),
    });
  },

  // Elimina una registrazione
  async deleteRegistration(id: string): Promise<void> {
    const registrationRef = doc(db, REGISTRATIONS_COLLECTION, id);
    await deleteDoc(registrationRef);

    // Elimina anche i dettagli della registrazione
    const detailsQuery = query(
      collection(db, REGISTRATION_DETAILS_COLLECTION),
      where('registrationId', '==', id)
    );
    const detailsSnapshot = await getDocs(detailsQuery);
    
    for (const detailDoc of detailsSnapshot.docs) {
      await deleteDoc(detailDoc.ref);
    }
  },

  // Crea una nuova registrazione
  async createRegistration(data: {
    competitionId: string;
    athleteId: string;
    categoryId: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    paymentStatus: 'unpaid' | 'paid' | 'refunded';
    notes?: string;
  }): Promise<string> {
    console.log('Creating registration with data:', data);
    
    // Verifica che l'atleta esista
    const athleteDoc = await getDoc(doc(db, ATHLETES_COLLECTION, data.athleteId));
    if (!athleteDoc.exists()) {
      console.error(`Athlete with ID ${data.athleteId} does not exist`);
      throw new Error(`Atleta con ID ${data.athleteId} non trovato`);
    }
    
    // Verifica che la competizione esista
    const competitionDoc = await getDoc(doc(db, COMPETITIONS_COLLECTION, data.competitionId));
    if (!competitionDoc.exists()) {
      console.error(`Competition with ID ${data.competitionId} does not exist`);
      throw new Error(`Competizione con ID ${data.competitionId} non trovata`);
    }
    
    console.log('Athlete and competition verified, creating registration...');
    
    const registrationsColRef = collection(db, REGISTRATIONS_COLLECTION);
    const docRef = await addDoc(registrationsColRef, {
      ...data,
      registeredAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('Registration created with ID:', docRef.id);
    return docRef.id;
  },

  // Ottieni statistiche delle registrazioni
  async getRegistrationsStats(competitionId?: string) {
    const constraints: QueryConstraint[] = [];
    
    if (competitionId) {
      constraints.push(where('competitionId', '==', competitionId));
    }

    const q = query(collection(db, REGISTRATIONS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const stats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      paid: 0,
      unpaid: 0,
    };

    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      stats.total++;
      
      switch (data.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'confirmed':
          stats.confirmed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }

      switch (data.paymentStatus) {
        case 'paid':
          stats.paid++;
          break;
        case 'unpaid':
          stats.unpaid++;
          break;
      }
    });

    return stats;
  },
};